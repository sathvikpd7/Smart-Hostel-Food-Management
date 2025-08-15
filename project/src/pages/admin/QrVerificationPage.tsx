import React, { useState, useEffect, useRef } from 'react';
import { QrCode, CheckCircle, AlertCircle, Camera, Loader2, ChevronDown } from 'lucide-react';
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
  const { bookings, markMealAsConsumed, getMealsByDate } = useMeals();
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
  
  // Camera device selection state
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  // Reset verification result when QR code changes
  useEffect(() => {
    setVerificationResult(null);
  }, [qrCode]);

  // Get available camera devices
  const getCameraDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableDevices(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error enumerating devices:', error);
      toast.error('Could not access camera devices');
    } finally {
      setIsLoadingDevices(false);
    }
  };

  // Start scanning with selected camera
  const startScanning = async () => {
    if (!videoRef.current || !selectedDeviceId) return;
    
    try {
      codeReader.current = new BrowserQRCodeReader();
      await codeReader.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result: any) => {
          if (result) {
            const scannedCode = result.getText();
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
  
  // Stop scanning 
  const stopScanning = () => {
    const videoElement = videoRef.current;
    if (videoElement && videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
    }
    codeReader.current = null;
  };

  // Toggle camera and handle device selection
  const handleToggleCamera = async () => {
    if (!cameraActive) {
      await getCameraDevices();
      if (availableDevices.length === 0) {
        toast.error('No cameras available');
        return;
      }
      setCameraActive(true);
    } else {
      stopScanning();
      setCameraActive(false);
    }
  };

  // Handle camera device change
  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setShowDeviceDropdown(false);
    if (cameraActive) {
      stopScanning();
      startScanning();
    }
  };

  // Initialize QR code reader when camera is active or device changes
  useEffect(() => {
    if (cameraActive) {
      startScanning();
    } else {
      stopScanning();
    }
    
    return () => {
      stopScanning();
    };
  }, [cameraActive, selectedDeviceId]);
  
  // Check if booking is for today
  const isBookingForToday = (bookingDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    return bookingDate === today;
  };
  
  // Compute allowed scan window using the meal's configured time on that date
  const isWithinMealWindow = (booking: MealBooking) => {
    // Try to find the meal entry for this date and type to read its time (e.g., '12:00')
    const mealsForDate = getMealsByDate(booking.date);
    const matchingMeal = mealsForDate.find(m => m.type === booking.type);

    let start: Date;
    let end: Date;

    if (matchingMeal?.time) {
      // Parse HH:mm and create a window: -30 minutes to +120 minutes around the meal time
      const [hh, mm] = matchingMeal.time.split(':').map(n => parseInt(n, 10));
      const center = new Date(`${booking.date}T00:00:00`);
      center.setHours(hh || 0, mm || 0, 0, 0);

      start = new Date(center);
      start.setMinutes(start.getMinutes() - 30);     // 30 minutes before

      end = new Date(center);
      end.setMinutes(end.getMinutes() + 120);        // 2 hours after
    } else {
      // Fallback static windows if meal time is unavailable
      const windows: Record<'breakfast' | 'lunch' | 'dinner', { start: { h: number; m: number }, end: { h: number; m: number } }> = {
        breakfast: { start: { h: 7, m: 0 }, end: { h: 9, m: 0 } },
        lunch:     { start: { h: 12, m: 0 }, end: { h: 15, m: 0 } },
        dinner:    { start: { h: 19, m: 0 }, end: { h: 21, m: 0 } },
      };
      const w = windows[booking.type as 'breakfast' | 'lunch' | 'dinner'];
      if (!w) return false;
      start = new Date(`${booking.date}T00:00:00`);
      start.setHours(w.start.h, w.start.m, 0, 0);
      end = new Date(`${booking.date}T00:00:00`);
      end.setHours(w.end.h, w.end.m, 0, 0);
    }

    const now = new Date();
    return now >= start && now <= end;
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
    
    // Check if scanning within allowed time window for the meal
    if (!isWithinMealWindow(booking)) {
      setVerificationResult({
        success: false,
        message: `Scanning not allowed at this time for ${booking.type}. Please scan during meal time window.`,
        booking
      });
      return;
    }
    
    // Update scan history (keep last 5 scans)
    setScanHistory(prev => {
      const existingIndex = prev.findIndex(item => item.id === booking.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated.splice(existingIndex, 1);
        return [booking, ...updated].slice(0, 5);
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
      lastScannedCode.current = '';
    } catch (error) {
      toast.error('Failed to mark meal as consumed');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <AdminLayout
      title="QR Code Verification"
      subtitle="Verify student meal QR codes for dining hall attendance"
    >
      <div className="flex flex-col space-y-6">
        {/* Main Content Area - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Scanner */}
          <Card>
            <CardHeader>
              <CardTitle>Verify Meal QR Code</CardTitle>
              <CardDescription>
                Scan or enter a student's QR code to verify their meal booking
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
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
                
                {cameraActive && (
                  <div className="space-y-3">
                    {/* Camera Device Selection */}
                    <div className="relative">
                      <button
                        onClick={() => setShowDeviceDropdown(!showDeviceDropdown)}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50"
                        disabled={isLoadingDevices}
                      >
                        <span className="truncate">
                          {isLoadingDevices ? 'Loading cameras...' : 
                           availableDevices.find(d => d.deviceId === selectedDeviceId)?.label || 'Select camera'}
                        </span>
                        <ChevronDown size={16} className={`ml-2 transition-transform ${showDeviceDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showDeviceDropdown && availableDevices.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                          {availableDevices.map((device) => (
                            <button
                              key={device.deviceId}
                              onClick={() => handleDeviceChange(device.deviceId)}
                              className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                                device.deviceId === selectedDeviceId ? 'bg-blue-50 text-blue-600' : ''
                              }`}
                            >
                              <span className="truncate">{device.label || `Camera ${availableDevices.indexOf(device) + 1}`}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Video Preview */}
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <video ref={videoRef} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm text-gray-500 text-center">
                      Point the camera at the QR code to scan
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Verification Result */}
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
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    verificationResult.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center">
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
                    <p className="text-sm text-gray-600 mt-2">
                      {verificationResult.message}
                    </p>
                  </div>
                  
                  {verificationResult.booking && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      
                      {verificationResult.success && (
                        <div className="pt-2">
                          <Button
                            onClick={handleMarkAsConsumed}
                            size="lg"
                            className="w-full"
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
                  )}
                </div>
              ) : scanHistory.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Recent Scans</h3>
                  <div className="space-y-3">
                    {scanHistory.map((booking, index) => (
                      <div 
                        key={`${booking.id}-${index}`}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Student ID</p>
                            <p className="font-medium text-sm">{booking.userId}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Meal Type</p>
                            <p className="font-medium text-sm capitalize">{booking.type}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Status</p>
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
                            <p className="text-xs text-gray-500 mb-1">Date</p>
                            <p className="font-medium text-sm">{booking.date}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center text-gray-400 text-sm pt-2">
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
        </div>

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