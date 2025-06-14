import React, { useState, useEffect, useRef } from 'react';
import { QrCode, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/browser';
import AdminLayout from '../../components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useMeals } from '../../contexts/MealContext';
import { MealBooking } from '../../types';
import toast from 'react-hot-toast';

const QrVerificationPage: React.FC = () => {
  const { bookings, markMealAsConsumed } = useMeals();
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserQRCodeReader | null>(null);
  
  const [qrCode, setQrCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    booking?: MealBooking;
  } | null>(null);
  
  // Reset verification result when QR code changes
  useEffect(() => {
    setVerificationResult(null);
  }, [qrCode]);
  
  // Start scanning
  const startScanning = async () => {
    if (!codeReader.current || !videoRef.current) return;
    
    try {
      await codeReader.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (result) {
            setQrCode(result.getText());
            handleVerifyQrCode();
          }
        }
      );
    } catch (err) {
      console.error('Error starting QR scanner:', err);
      toast.error('Failed to start camera');
    }
  };
  
  // Initialize QR code reader
  useEffect(() => {
    if (cameraActive && videoRef.current) {
      codeReader.current = new BrowserQRCodeReader();
      startScanning();
    }
    
    return () => {
      if (codeReader.current) {
        // Stop the video stream
        const videoElement = videoRef.current;
        if (videoElement && videoElement.srcObject) {
          const stream = videoElement.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, [cameraActive, startScanning]);
  
  // Handle QR code verification
  const handleVerifyQrCode = () => {
    if (!qrCode.trim()) {
      toast.error('Please enter a QR code');
      return;
    }
    
    // Find booking with matching QR code
    const booking = bookings.find(b => b.qrCode === qrCode);
    
    if (!booking) {
      setVerificationResult({
        success: false,
        message: 'Invalid QR code. No matching booking found.'
      });
      return;
    }
    
    if (booking.status === 'cancelled') {
      setVerificationResult({
        success: false,
        message: 'This booking has been cancelled.',
        booking
      });
      return;
    }
    
    if (booking.status === 'consumed') {
      setVerificationResult({
        success: false,
        message: 'This meal has already been consumed.',
        booking
      });
      return;
    }
    
    setVerificationResult({
      success: true,
      message: 'Valid meal booking! Ready to mark as consumed.',
      booking
    });
  };
  
  // Handle mark as consumed
  const handleMarkAsConsumed = async () => {
    if (!verificationResult?.booking?.id) return;
    
    try {
      await markMealAsConsumed(verificationResult.booking.id);
      
      toast.success('Meal marked as consumed successfully!');
      setQrCode('');
      setVerificationResult(null);
    } catch (error) {
      toast.error('Failed to mark meal as consumed');
    }
  };
  
  // Toggle camera
  const handleToggleCamera = () => {
    setCameraActive(!cameraActive);
  };
  
  return (
    <AdminLayout
      title="QR Code Verification"
      subtitle="Verify student meal QR codes for dining hall attendance"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* QR Code Scanner */}
        <div className="col-span-1 md:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Verify Meal QR Code</CardTitle>
              <CardDescription>
                Scan or enter a student's QR code to verify their meal booking
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="mb-6">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter QR code..."
                      value={qrCode}
                      onChange={(e) => setQrCode(e.target.value)}
                      leftIcon={<QrCode size={18} />}
                      fullWidth
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={handleToggleCamera}
                    className="flex items-center"
                  >
                    <Camera size={18} className="mr-2" />
                    {cameraActive ? 'Disable Camera' : 'Enable Camera'}
                  </Button>
                </div>
              </div>
              
              {cameraActive && (
                <div className="mb-6">
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <video ref={videoRef} className="w-full h-full" />
                  </div>
                </div>
              )}
              
              <div className="flex justify-center">
                <Button
                  onClick={handleVerifyQrCode}
                  size="lg"
                  disabled={!qrCode.trim()}
                >
                  Verify QR Code
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Verification Result */}
        <div className="col-span-1 md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Verification Result</CardTitle>
            </CardHeader>
            
            <CardContent>
              {verificationResult ? (
                <div>
                  <div className={`p-4 rounded-lg mb-4 ${
                    verificationResult.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center mb-2">
                      {verificationResult.success ? (
                        <CheckCircle size={20} className="text-green-600 mr-2" />
                      ) : (
                        <AlertCircle size={20} className="text-red-600 mr-2" />
                      )}
                      <span className={`font-medium ${
                        verificationResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {verificationResult.success ? 'Valid QR Code' : 'Invalid QR Code'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {verificationResult.message}
                    </p>
                  </div>
                  
                  {verificationResult.booking && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Student ID</p>
                        <p className="font-medium">{verificationResult.booking.userId}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Meal Type</p>
                        <p className="font-medium capitalize">{verificationResult.booking.type}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-medium">{verificationResult.booking.date}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          verificationResult.booking.status === 'booked' 
                            ? 'bg-blue-100 text-blue-800' 
                            : verificationResult.booking.status === 'consumed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {verificationResult.booking.status}
                        </span>
                      </div>
                      
                      {verificationResult.success && (
                        <div className="pt-3">
                          <Button
                            onClick={handleMarkAsConsumed}
                            fullWidth
                          >
                            Mark as Consumed
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <QrCode size={48} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">
                    Verification results will appear here
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Enter or scan a QR code to verify
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">How to Verify QR Codes</h3>
                  <p className="text-gray-600">
                    Enter the QR code number or scan the student's QR code to verify
                    their meal booking.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Valid QR Codes</h3>
                  <p className="text-gray-600">
                    A valid QR code represents an active booking for the current date
                    that has not been consumed yet.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Mark as Consumed</h3>
                  <p className="text-gray-600">
                    Once verified, mark the meal as consumed to update the system.
                    This action can't be undone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default QrVerificationPage;