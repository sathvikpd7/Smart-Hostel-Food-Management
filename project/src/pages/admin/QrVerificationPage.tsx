import React, { useState, useEffect, useRef } from 'react';
import { QrCode, CheckCircle, AlertCircle, Camera, Loader2 } from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/browser';
import AdminLayout from '../../components/layout/AdminLayout.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card.js';
import Button from '../../components/ui/Button.js';
import Input from '../../components/ui/Input.js';
import { useMeals } from '../../contexts/MealContext.js';
import { MealBooking } from '../../types/index.js';
import toastImport from 'react-hot-toast';
const toast = toastImport as any;

const QrVerificationPage: React.FC = () => {
  const { bookings, markMealAsConsumed } = useMeals();
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserQRCodeReader | null>(null);
  const lastScannedCode = useRef<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [qrCode, setQrCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    booking?: MealBooking;
  } | null>(null);
  const [scanHistory, setScanHistory] = useState<MealBooking[]>([]);
  
  // Reset verification result when QR code changes
  useEffect(() => {
    setVerificationResult(null);
  }, [qrCode]);
  
  // Start scanning
  const startScanning = async () => {
    if (!videoRef.current) return;
    
    try {
      codeReader.current = new BrowserQRCodeReader();
      await codeReader.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result: any) => {
          if (result) {
            const scannedCode = result.getText();
            // Only process if it's a new code and different from the last scanned one
            if (scannedCode !== qrCode && scannedCode !== lastScannedCode.current) {
              lastScannedCode.current = scannedCode;
              setQrCode(scannedCode);
              handleVerifyQrCode(scannedCode);
            }
          }
        }
      );
    } catch (err) {
      console.error('Error starting QR scanner:', err);
      toast.error('Failed to start camera. Please check permissions.');
    }
  };
  
  // Stop scanning and clean up
  const stopScanning = () => {
    const videoElement = videoRef.current;
    if (videoElement && videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
    }
    codeReader.current = null;
  };
  
  // Initialize QR code reader
  useEffect(() => {
    if (cameraActive) {
      startScanning();
    } else {
      stopScanning();
    }
    
    return () => {
      stopScanning();
    };
  }, [cameraActive]);
  
  // Check if booking is for today
  const isBookingForToday = (bookingDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    return bookingDate === today;
  };
  
  // Handle QR code verification
  const handleVerifyQrCode = (code?: string) => {
    const codeToVerify = code || qrCode;
    
    if (!codeToVerify.trim()) {
      toast.error('Please enter a QR code');
      return;
    }
    
    // Find booking with matching QR code
    const booking = bookings.find((b: MealBooking) => b.qrCode === codeToVerify);
    
    if (!booking) {
      setVerificationResult({
        success: false,
        message: 'Invalid QR code. No matching booking found.'
      });
      return;
    }
    
    // Check if booking is for today
    if (!isBookingForToday(booking.date)) {
      setVerificationResult({
        success: false,
        message: 'This booking is not for today.',
        booking
      });
      return;
    }
    
    // Update scan history (keep last 5 scans)
    setScanHistory(prev => {
      const existingIndex = prev.findIndex(item => item.id === booking.id);
      if (existingIndex >= 0) {
        // Remove the existing entry to avoid duplicates
        const updated = [...prev];
        updated.splice(existingIndex, 1);
        return [booking, ...updated].slice(0, 5); // Keep latest 5 scans
      }
      return [booking, ...prev].slice(0, 5);
    });
    
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
    
    setIsProcessing(true);
    try {
      await markMealAsConsumed(verificationResult.booking.id);
      
      toast.success('Meal marked as consumed successfully!');
      setQrCode('');
      setVerificationResult(null);
      lastScannedCode.current = ''; // Reset last scanned code
    } catch (error) {
      toast.error('Failed to mark meal as consumed');
    } finally {
      setIsProcessing(false);
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
      <div className="flex flex-col space-y-6">
        {/* QR Code Scanner */}
        <Card>
          <CardHeader>
            <CardTitle>Verify Meal QR Code</CardTitle>
            <CardDescription>
              Scan or enter a student's QR code to verify their meal booking
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="mb-6">
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Enter QR code..."
                    value={qrCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQrCode(e.target.value)}
                    leftIcon={<QrCode size={18} />}
                    fullWidth
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleVerifyQrCode()}
                    disabled={!qrCode.trim()}
                    className="flex-1 md:flex-none"
                  >
                    Verify QR Code
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleToggleCamera}
                    className="flex items-center"
                  >
                    <Camera size={18} className="mr-2" />
                    {cameraActive ? 'Disable' : 'Scan'}
                  </Button>
                </div>
              </div>
            </div>
            
            {cameraActive && (
              <div className="mb-6">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <video ref={videoRef} className="w-full h-full object-cover" />
                </div>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Point the camera at the QR code to scan
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Verification Result */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Verification Result</CardTitle>
              {scanHistory.length > 0 && (
                <span className="text-sm text-gray-500">
                  Last scanned: {new Date().toLocaleTimeString()}
                </span>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            {verificationResult ? (
              <div>
                <div className={`p-4 rounded-lg mb-6 ${
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Student ID</p>
                      <p className="font-medium">{verificationResult.booking.userId}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Meal Type</p>
                      <p className="font-medium capitalize">{verificationResult.booking.type}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Date</p>
                      <p className="font-medium">{verificationResult.booking.date}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Status</p>
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
                  </div>
                )}
                
                {verificationResult.success && (
                  <div className="flex justify-center">
                    <Button
                      onClick={handleMarkAsConsumed}
                      size="lg"
                      className="w-full md:w-auto"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Mark as Consumed'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : scanHistory.length > 0 ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  {scanHistory.map((booking, index) => (
                    <div 
                      key={`${booking.id}-${index}`}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <h3 className="font-medium text-gray-800 mb-2">
                        {index === 0 ? 'Latest Scan' : `Previous Scan ${index}`}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Student ID</p>
                          <p className="font-medium">{booking.userId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Meal Type</p>
                          <p className="font-medium capitalize">{booking.type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Status</p>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            booking.status === 'booked' 
                              ? 'bg-blue-100 text-blue-800' 
                              : booking.status === 'consumed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Date</p>
                          <p className="font-medium">{booking.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center text-gray-400 text-sm">
                  Scan a new QR code to verify
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode size={48} className="mx-auto text-gray-300 mb-4" />
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
        
        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                  <QrCode size={18} className="mr-2 text-gray-400" />
                  How to Verify
                </h3>
                <p className="text-sm text-gray-600">
                  Enter the QR code number or scan the student's QR code to verify
                  their meal booking. Only today's bookings will be accepted.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                  <CheckCircle size={18} className="mr-2 text-gray-400" />
                  Valid QR Codes
                </h3>
                <p className="text-sm text-gray-600">
                  A valid QR code represents an active booking for the current date
                  that has not been consumed yet.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                  <AlertCircle size={18} className="mr-2 text-gray-400" />
                  Mark as Consumed
                </h3>
                <p className="text-sm text-gray-600">
                  Once verified, mark the meal as consumed to update the system.
                  This action can't be undone. Please verify carefully.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default QrVerificationPage;