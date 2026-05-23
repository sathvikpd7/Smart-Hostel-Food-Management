import React, { useState, useEffect, useRef } from 'react';
import { QrCode, CheckCircle, AlertCircle, Camera, Loader2, ChevronDown } from 'lucide-react';
import { BrowserQRCodeReader } from '@zxing/browser';
import AdminLayout from '../../components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useMeals } from '../../contexts/MealContext';
import { MealBooking } from '../../types';
import toastImport from 'react-hot-toast';
import { api } from '../../services/api';
const toast = toastImport as any;

const QrVerificationPage: React.FC = () => {
  const { bookings, markMealAsConsumed, getMealsByDate, updateWeeklyMenu } = useMeals();

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserQRCodeReader | null>(null);
  const lastScannedCode = useRef<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const lastScanTimeRef = useRef<number>(0);
  
  const [qrCode, setQrCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    booking?: MealBooking;
  } | null>(null);
  const [scanHistory, setScanHistory] = useState<MealBooking[]>([]);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [sessionScans, setSessionScans] = useState<{ time: number; success: boolean }[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] System: Touchless Scanning HUD Online.`,
    `[${new Date().toLocaleTimeString()}] System: Ready for student QR verification.`
  ]);

  // Active rate calculation
  const getActiveRate = () => {
    if (sessionScans.length === 0) return 0.0;
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recent = sessionScans.filter(s => s.time >= oneMinuteAgo);
    return recent.length;
  };

  const addLog = (message: string) => {
    const timeStr = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [`[${timeStr}] ${message}`, ...prev].slice(0, 30));
  };
  
  // Camera device selection state
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  // Reset verification result when QR code changes
  useEffect(() => {
    setVerificationResult(null);
    if (!qrCode) {
      lastScannedCode.current = '';
    }
  }, [qrCode]);

  // On mount: silently refresh the weekly menu from DB so any admin timing
  // changes made in Menu Management are immediately reflected in scan window logic
  useEffect(() => {
    const refreshMenu = async () => {
      try {
        const weekly = await api.getWeeklyMenu();
        if (Array.isArray(weekly) && weekly.length > 0) {
          await updateWeeklyMenu(weekly as any);
        }
      } catch (err) {
        // Silently ignore — scanner still works with cached/context menu data
        console.warn('QR page: failed to refresh weekly menu timings:', err);
      }
    };
    refreshMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // Get available camera devices
  const getCameraDevices = async (): Promise<{ hasDevices: boolean; selectedId: string }> => {
    setIsLoadingDevices(true);
    try {
      // Prompt for permission with a quick getUserMedia so labels populate on some browsers
      try {
        const tmpStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tmpStream.getTracks().forEach(t => t.stop());
      } catch (_) {
        // ignore, will still attempt enumerateDevices
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableDevices(videoDevices);
      if (videoDevices.length > 0) {
        // Prefer back camera if available
        const preferred = videoDevices.find(d => /back|rear/i.test(d.label)) || videoDevices[0];
        setSelectedDeviceId(preferred.deviceId);
        return { hasDevices: true, selectedId: preferred.deviceId };
      }
      setSelectedDeviceId('');
      return { hasDevices: false, selectedId: '' };
    } catch (error) {
      console.error('Error enumerating devices:', error);
      toast.error('Could not access camera devices');
      return { hasDevices: false, selectedId: '' };
    } finally {
      setIsLoadingDevices(false);
    }
  };

  // Start scanning with selected camera
  const startScanning = async () => {
    if (!videoRef.current) return;
    if (!selectedDeviceId) {
      toast.error('No camera selected');
      return;
    }
    try {
      // Stop any existing session first
      stopScanning();
      if (!codeReader.current) {
        codeReader.current = new BrowserQRCodeReader();
      }
      await codeReader.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result: any) => {
          if (result) {
            const scannedCode = result.getText();
            const now = Date.now();
            const isDuplicate = scannedCode === lastScannedCode.current;
            const timeSinceLastScan = now - lastScanTimeRef.current;
            
            // Only debounce duplicate scans of the same QR code. Distinct codes scan instantly (0ms delay).
            if (scannedCode && (!isDuplicate || timeSinceLastScan > 2000)) {
              lastScannedCode.current = scannedCode;
              lastScanTimeRef.current = now;
              setQrCode(scannedCode);
              handleProcessQrCode(scannedCode, true);
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
      const { hasDevices, selectedId } = await getCameraDevices();
      if (!hasDevices || !selectedId) {
        toast.error('No cameras available');
        return;
      }
      // Ensure selected device is set before activating
      setSelectedDeviceId(selectedId);
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
  
  // Get local date in YYYY-MM-DD format (prevents UTC timezone shift bug)
  const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Check if booking is for today
  const normalizeDateOnly = (value: string) => {
    if (!value) return value;
    return value.includes('T') ? value.split('T')[0] : value;
  };

  const isBookingForToday = (bookingDate: string) => {
    return normalizeDateOnly(bookingDate) === getLocalDateString();
  };

  // Robust AM/PM and 24-hour individual time parser
  const parseTimeStrToDate = (timeStr: string, baseDateStr: string): Date => {
    const cleanStr = timeStr.trim().toUpperCase();
    const isPM = cleanStr.includes('PM');
    const isAM = cleanStr.includes('AM');
    
    // Extract digits and handle . or : as hours/minutes separator
    const digitsOnly = cleanStr.replace(/AM|PM/g, '').trim();
    const parts = digitsOnly.split(/[:.]/);
    
    let hours = parseInt(parts[0] || '0', 10);
    let minutes = parseInt(parts[1] || '0', 10);
    
    if (isNaN(hours)) hours = 0;
    if (isNaN(minutes)) minutes = 0;
    
    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
    
    const d = new Date(`${baseDateStr}T00:00:00`);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  // Parses range values like "01:30 - 09:30 AM", "1.30 to 9.30 AM", "08:00-11:00"
  const parseMealRange = (timeRangeStr: string, baseDateStr: string): { start: Date; end: Date } | null => {
    const separators = ['-', 'to', '–', '—'];
    let parts: string[] = [];
    
    for (const sep of separators) {
      if (timeRangeStr.includes(sep)) {
        parts = timeRangeStr.split(sep);
        break;
      }
    }
    
    if (parts.length !== 2) return null;
    
    let startStr = parts[0].trim().toUpperCase();
    let endStr = parts[1].trim().toUpperCase();
    
    const startHasAmPm = startStr.includes('AM') || startStr.includes('PM');
    const endHasAmPm = endStr.includes('AM') || endStr.includes('PM');
    
    // Distribute/inherit AM/PM tags if only one side has it
    if (endHasAmPm && !startHasAmPm) {
      const endIsPM = endStr.includes('PM');
      const endDigits = endStr.replace(/AM|PM/g, '').trim();
      const startDigits = startStr;
      
      const endHr = parseInt(endDigits.split(/[:.]/)[0] || '0', 10);
      const startHr = parseInt(startDigits.split(/[:.]/)[0] || '0', 10);
      
      if (endIsPM) {
        if (startHr > endHr && startHr >= 11) {
          startStr += ' AM';
        } else {
          startStr += ' PM';
        }
      } else {
        startStr += ' AM';
      }
    } else if (startHasAmPm && !endHasAmPm) {
      const startIsPM = startStr.includes('PM');
      if (startIsPM) {
        endStr += ' PM';
      } else {
        endStr += ' AM';
      }
    }
    
    const start = parseTimeStrToDate(startStr, baseDateStr);
    const end = parseTimeStrToDate(endStr, baseDateStr);
    
    return { start, end };
  };
  
  // Compute allowed scan window using the meal's configured time on that date
  const isWithinMealWindow = (booking: MealBooking) => {
    const mealsForDate = getMealsByDate(booking.date);
    const matchingMeal = mealsForDate.find(m => m.type === booking.type);

    let start: Date;
    let end: Date;

    if (matchingMeal?.time) {
      const parsedRange = parseMealRange(matchingMeal.time, booking.date);
      if (parsedRange) {
        // Allow scanning from 30 minutes before the meal starts to 30 minutes after it ends
        start = new Date(parsedRange.start);
        start.setMinutes(start.getMinutes() - 30);   // 30-min grace before opening

        end = new Date(parsedRange.end);
        end.setMinutes(end.getMinutes() + 30);        // 30-min grace after closing
        
        const now = new Date();
        return now >= start && now <= end;
      }
    }

    // Fallback static windows if meal time is unavailable or not in range format
    const windows: Record<'breakfast' | 'lunch' | 'dinner', { start: { h: number; m: number }, end: { h: number; m: number } }> = {
      breakfast: { start: { h: 7, m: 30 }, end: { h: 9, m: 30 } },
      lunch:     { start: { h: 12, m: 30 }, end: { h: 15, m: 0 } },
      dinner:    { start: { h: 19, m: 30 }, end: { h: 22, m: 0 } },
    };
    const w = windows[booking.type as 'breakfast' | 'lunch' | 'dinner'];
    if (!w) return false;
    start = new Date(`${booking.date}T00:00:00`);
    start.setHours(w.start.h, w.start.m, 0, 0);
    end = new Date(`${booking.date}T00:00:00`);
    end.setHours(w.end.h, w.end.m, 0, 0);

    const now = new Date();
    return now >= start && now <= end;
  };

  // Helper: format the active scan window as a human-readable string for error messages
  const getMealWindowString = (booking: MealBooking): string => {
    const mealsForDate = getMealsByDate(booking.date);
    const matchingMeal = mealsForDate.find(m => m.type === booking.type);

    if (matchingMeal?.time) {
      const parsedRange = parseMealRange(matchingMeal.time, booking.date);
      if (parsedRange) {
        const formatTime = (d: Date) => {
          const h = d.getHours();
          const m = d.getMinutes();
          const ampm = h >= 12 ? 'PM' : 'AM';
          const displayH = h % 12 || 12;
          const displayM = String(m).padStart(2, '0');
          return `${displayH}:${displayM} ${ampm}`;
        };

        const graceStart = new Date(parsedRange.start);
        graceStart.setMinutes(graceStart.getMinutes() - 30);

        const graceEnd = new Date(parsedRange.end);
        graceEnd.setMinutes(graceEnd.getMinutes() + 30);

        return `${formatTime(graceStart)} – ${formatTime(graceEnd)} (with 30m grace)`;
      }
    }

    const defaults: Record<string, string> = {
      breakfast: '7:00 AM – 10:00 AM',
      lunch:     '12:00 PM – 3:30 PM',
      dinner:    '7:00 PM – 10:30 PM',
    };
    return defaults[booking.type] || 'meal time window';
  };

  
  // Handle QR code processing for both camera and manual inputs
  const handleProcessQrCode = async (code: string, isFromCamera: boolean) => {
    if (!code.trim()) {
      if (!isFromCamera) {
        toast.error('Please enter a QR code');
      }
      return;
    }
    
    // Find booking with matching QR code
    let booking = bookings.find((b: MealBooking) => b.qrCode === code);
    
    // Fallback: search database directly by re-fetching if not in cache (solves lag/pagination bugs)
    if (!booking) {
      try {
        const freshBookings = await api.getBookings();
        booking = freshBookings.find((b: MealBooking) => b.qrCode === code);
      } catch (err) {
        console.warn('Failed to fetch fresh bookings on QR scan:', err);
      }
    }
    
    if (!booking) {
      setVerificationResult({
        success: false,
        message: 'Invalid QR code. No matching booking found.'
      });
      setScanStatus('error');
      setSessionScans(prev => [...prev, { time: Date.now(), success: false }]);
      addLog(`ERROR: Unknown QR Code scanned (${code.substring(0, 8)}...)`);
      
      // Clear last scanned code tracker after errors so a retry is possible
      if (isFromCamera) {
        setTimeout(() => {
          lastScannedCode.current = '';
        }, 2000);
      }
      return;
    }
    
    // Check if booking is for today
    if (!isBookingForToday(booking.date)) {
      setVerificationResult({
        success: false,
        message: 'This booking is not for today.',
        booking
      });
      setScanStatus('error');
      setSessionScans(prev => [...prev, { time: Date.now(), success: false }]);
      addLog(`ERROR: Date mismatch for Student ID ${booking.userId}`);
      
      if (isFromCamera) {
        setTimeout(() => {
          lastScannedCode.current = '';
        }, 2000);
      }
      return;
    }
    
    // Check if scanning within allowed time window for the meal
    if (!isWithinMealWindow(booking)) {
      const windowStr = getMealWindowString(booking);
      setVerificationResult({
        success: false,
        message: `Outside ${booking.type} hours. Accepted window: ${windowStr}.`,
        booking
      });
      setScanStatus('error');
      setSessionScans(prev => [...prev, { time: Date.now(), success: false }]);
      addLog(`ERROR: Time window mismatch for ${booking.type} — window: ${windowStr} (Student: ${booking.userId})`);
      
      if (isFromCamera) {
        setTimeout(() => {
          lastScannedCode.current = '';
        }, 2000);
      }
      return;
    }

    
    if (booking.status === 'cancelled') {
      setVerificationResult({
        success: false,
        message: 'This booking has been cancelled.',
        booking
      });
      setScanStatus('error');
      setSessionScans(prev => [...prev, { time: Date.now(), success: false }]);
      addLog(`ERROR: Cancelled booking scanned (Student: ${booking.userId})`);
      
      if (isFromCamera) {
        setTimeout(() => {
          lastScannedCode.current = '';
        }, 2000);
      }
      return;
    }
    
    if (booking.status === 'consumed') {
      setVerificationResult({
        success: false,
        message: 'This meal has already been consumed.',
        booking
      });
      setScanStatus('error');
      setSessionScans(prev => [...prev, { time: Date.now(), success: false }]);
      addLog(`REJECTED: Re-entry denied. Meal already consumed (Student: ${booking.userId})`);
      
      if (isFromCamera) {
        setTimeout(() => {
          lastScannedCode.current = '';
        }, 2000);
      }
      return;
    }

    // Helper to update scan history
    const updateHistory = (b: MealBooking) => {
      setScanHistory(prev => {
        const existingIndex = prev.findIndex(item => item.id === b.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated.splice(existingIndex, 1);
          return [b, ...updated].slice(0, 5);
        }
        return [b, ...prev].slice(0, 5);
      });
    };

    if (isFromCamera) {
      // Touchless auto-mark as consumed for camera scans
      setIsProcessing(true);
      try {
        await markMealAsConsumed(booking.id);
        
        // Show success state with consumed status immediately on screen
        const updatedBooking: MealBooking = { ...booking, status: 'consumed' };
        setVerificationResult({
          success: true,
          message: 'Valid booking! Automatically marked as consumed.',
          booking: updatedBooking
        });
        updateHistory(updatedBooking);
        toast.success('Meal auto-consumed successfully!');
        
        setScanStatus('success');
        setSessionScans(prev => [...prev, { time: Date.now(), success: true }]);
        addLog(`SUCCESS: ${booking.type.toUpperCase()} verified & consumed (Student: ${booking.userId})`);
        
        // Auto-reset screen after 1.5 seconds
        setTimeout(() => {
          setQrCode('');
          setVerificationResult(null);
          lastScannedCode.current = '';
        }, 1500);
      } catch (error) {
        toast.error('Failed to automatically mark meal as consumed');
        setVerificationResult({
          success: false,
          message: 'Error marking meal as consumed.',
          booking
        });
        setScanStatus('error');
        setSessionScans(prev => [...prev, { time: Date.now(), success: false }]);
        addLog(`FAIL: DB write error during auto-consume for Student ${booking.userId}`);
        
        setTimeout(() => {
          lastScannedCode.current = '';
        }, 2000);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Manual verification: show verification status and enable button
      updateHistory(booking);
      setVerificationResult({
        success: true,
        message: 'Valid meal booking! Ready to mark as consumed.',
        booking
      });
      setScanStatus('success');
      setSessionScans(prev => [...prev, { time: Date.now(), success: true }]);
      addLog(`VERIFIED: Manual ticket verified (Student: ${booking.userId})`);
    }
  };

  // Handle QR code verification (manual)
  const handleVerifyQrCode = (code?: string) => {
    const codeToVerify = code || qrCode;
    handleProcessQrCode(codeToVerify, false);
  };
  
  // Handle mark as consumed
  const handleMarkAsConsumed = async () => {
    if (!verificationResult?.booking?.id) return;
    
    setIsProcessing(true);
    try {
      await markMealAsConsumed(verificationResult.booking.id);
      
      toast.success('Meal marked as consumed successfully!');
      
      // Update terminal log and session
      addLog(`SUCCESS: Student ${verificationResult.booking.userId} marked as consumed (Manual)`);
      setSessionScans(prev => [...prev, { time: Date.now(), success: true }]);
      
      setQrCode('');
      setVerificationResult(null);
      lastScannedCode.current = '';
      setScanStatus('idle');
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

        {/* ── Row 1: Scanner (left, wider) + Verification Result (right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left: Verify Meal QR Code (3/5 width) ── */}
          <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Verify Meal QR Code</CardTitle>
              <CardDescription>
                Scan or enter a student's QR code to verify their meal booking
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
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
                      className="flex-1 sm:flex-none"
                    >
                      Verify
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleToggleCamera}
                      className="flex items-center"
                    >
                      <Camera size={18} className="mr-2" />
                      {cameraActive ? 'Stop' : 'Scan'}
                    </Button>
                  </div>
                </div>

                {/* Camera Area */}
                {cameraActive && (
                  <div className="space-y-3">
                    {/* Embedded Animations */}
                    <style dangerouslySetInnerHTML={{ __html: `
                      @keyframes laser {
                        0%, 100% { top: 4%; opacity: 0.9; }
                        50% { top: 96%; opacity: 0.9; }
                      }
                      @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        20%, 60% { transform: translateX(-5px); }
                        40%, 80% { transform: translateX(5px); }
                      }
                      .animate-laser { animation: laser 2.2s infinite ease-in-out; }
                      .animate-shake { animation: shake 0.3s ease-in-out; }
                    ` }} />

                    {/* Active Lens label + LIVE badge */}
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Active Lens</label>
                      <span className="flex items-center text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium animate-pulse">
                        ● LIVE SCANNING
                      </span>
                    </div>

                    {/* Camera Device Selector */}
                    <div className="relative">
                      <button
                        onClick={() => setShowDeviceDropdown(!showDeviceDropdown)}
                        className="flex items-center justify-between w-full px-4 py-2.5 text-sm border border-stone-200 rounded-xl bg-white hover:bg-stone-50 transition-all font-medium text-stone-700 shadow-sm"
                        disabled={isLoadingDevices}
                      >
                        <span className="truncate flex items-center">
                          <Camera size={16} className="mr-2 text-stone-400" />
                          {isLoadingDevices ? 'Loading cameras...' :
                           availableDevices.find(d => d.deviceId === selectedDeviceId)?.label || 'Select Camera'}
                        </span>
                        <ChevronDown size={16} className={`ml-2 transition-transform ${showDeviceDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {showDeviceDropdown && availableDevices.length > 0 && (
                        <div className="absolute z-20 w-full mt-1.5 bg-white border border-stone-200 rounded-xl shadow-lg max-h-60 overflow-auto py-1">
                          {availableDevices.map((device) => (
                            <button
                              key={device.deviceId}
                              onClick={() => handleDeviceChange(device.deviceId)}
                              className={`block w-full px-4 py-2 text-left text-sm hover:bg-stone-50 transition-colors font-medium ${
                                device.deviceId === selectedDeviceId ? 'bg-emerald-50 text-emerald-700' : 'text-stone-600'
                              }`}
                            >
                              <span className="truncate">{device.label || `Camera ${availableDevices.indexOf(device) + 1}`}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ── Big Camera Viewport ── */}
                    <div className={`relative w-full bg-stone-950 rounded-2xl overflow-hidden border-2 shadow-2xl flex items-center justify-center transition-all duration-300 ${
                      scanStatus === 'success'
                        ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                        : scanStatus === 'error'
                          ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-shake'
                          : 'border-stone-800'
                    }`} style={{ aspectRatio: '4/3' }}>
                      <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />

                      {/* Full-width Laser scanline */}
                      <div className={`absolute left-0 right-0 h-[2px] rounded-full animate-laser transition-all duration-300 pointer-events-none ${
                        scanStatus === 'success' ? 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,1)]' :
                        scanStatus === 'error'   ? 'bg-red-400 shadow-[0_0_12px_rgba(239,68,68,1)]' :
                                                   'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)]'
                      }`} />

                      {/* Touchless Camera Status Overlay */}
                      {scanStatus !== 'idle' && (
                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none">
                          <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg border backdrop-blur-md transition-all duration-300 ${
                            scanStatus === 'success'
                              ? 'bg-emerald-500/90 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                              : 'bg-red-500/90 text-white border-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                          }`}>
                            {scanStatus === 'success' ? '✓ Meal Verified' : '✗ Verification Failed'}
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400 text-center font-medium">
                      Hold student QR code steady — auto-verifies instantly.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </div>

          {/* ── Right: Verification Result (2/5 width) ── */}
          <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Verification Result</CardTitle>
                {scanHistory.length > 0 && (
                  <span className="text-xs text-stone-400">
                    {new Date().toLocaleTimeString()}
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {verificationResult ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border-2 ${
                    verificationResult.success
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center mb-2">
                      {verificationResult.success ? (
                        <CheckCircle size={22} className="text-emerald-600 mr-2 flex-shrink-0" />
                      ) : (
                        <AlertCircle size={22} className="text-red-600 mr-2 flex-shrink-0" />
                      )}
                      <span className={`font-semibold text-sm ${verificationResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                        {verificationResult.success ? 'Valid QR Code' : 'Invalid QR Code'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {verificationResult.message}
                    </p>
                  </div>

                  {verificationResult.booking && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Meal Type', value: verificationResult.booking.type, capitalize: true },
                          { label: 'Date', value: verificationResult.booking.date },
                          { label: 'Status', value: verificationResult.booking.status, badge: true },
                        ].map(item => (
                          <div key={item.label} className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                            <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wide mb-1">{item.label}</p>
                            {item.badge ? (
                              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                verificationResult.booking!.status === 'booked'    ? 'bg-blue-100 text-blue-700' :
                                verificationResult.booking!.status === 'consumed'  ? 'bg-emerald-100 text-emerald-700' :
                                                                                     'bg-red-100 text-red-700'
                              }`}>
                                {item.value}
                              </span>
                            ) : (
                              <p className={`font-semibold text-stone-800 text-sm ${item.capitalize ? 'capitalize' : ''}`}>{item.value}</p>
                            )}
                          </div>
                        ))}
                        <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                          <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wide mb-1">Student ID</p>
                          <p className="font-mono text-xs text-stone-600 truncate">{verificationResult.booking.userId.slice(0,12)}…</p>
                        </div>
                      </div>

                      {verificationResult.success && (
                        <Button
                          onClick={handleMarkAsConsumed}
                          size="lg"
                          className="w-full"
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                          ) : 'Mark as Consumed'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ) : scanHistory.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-stone-700 text-sm">Recent Scans</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {scanHistory.map((booking, index) => (
                      <div
                        key={`${booking.id}-${index}`}
                        className="p-3 bg-stone-50 rounded-xl border border-stone-100"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm capitalize text-stone-800">{booking.type}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            booking.status === 'booked'   ? 'bg-blue-100 text-blue-700' :
                            booking.status === 'consumed' ? 'bg-emerald-100 text-emerald-700' :
                                                            'bg-red-100 text-red-700'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400 font-mono truncate">{booking.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <QrCode size={32} className="text-stone-300" />
                  </div>
                  <p className="text-stone-500 font-medium text-sm">Awaiting Scan</p>
                  <p className="text-xs text-stone-400 mt-1">Results will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </div>

        {/* ── Row 2: Real-Time Attendance HUD (full-width, always visible) ── */}
        <div className="rounded-2xl overflow-hidden border border-stone-800 shadow-2xl bg-stone-950">
          {/* HUD Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-900/60">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-sm font-bold text-stone-100 tracking-wide uppercase">Real-Time Attendance HUD</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-stone-500">{new Date().toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })}</span>
              <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-900/60 text-emerald-400 border border-emerald-800 uppercase tracking-widest">LIVE</span>
            </div>
          </div>

          {/* HUD Body */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-stone-800">

            {/* ── Panel 1: Circular Progress + Served Stats ── */}
            <div className="p-6 flex flex-col items-center justify-center space-y-4">
              {(() => {
                const todayStr = new Date().toISOString().split('T')[0];
                const norm = (v: string) => v.includes('T') ? v.split('T')[0] : v;
                const todayB = bookings.filter(b => norm(b.date) === todayStr && b.status !== 'cancelled');
                const total  = todayB.length > 0 ? todayB.length : 1;
                const served = todayB.filter(b => b.status === 'consumed').length;
                const pct    = Math.round((served / total) * 100);
                const R = 46, C = 2 * Math.PI * R;
                const dash = C - (pct / 100) * C;
                const hour = new Date().getHours();
                const mealLabel = hour < 11 ? 'Breakfast' : hour < 17 ? 'Lunch' : 'Dinner';
                return (
                  <div className="flex flex-col items-center space-y-3 w-full">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{mealLabel} Session</span>
                    {/* Big ring */}
                    <div className="relative flex items-center justify-center">
                      <svg width="120" height="120" className="-rotate-90">
                        <circle cx="60" cy="60" r={R} fill="none" className="stroke-stone-800" strokeWidth="8" />
                        <circle cx="60" cy="60" r={R} fill="none"
                          stroke="url(#hudGrad)" strokeWidth="8"
                          strokeDasharray={C} strokeDashoffset={dash}
                          strokeLinecap="round"
                          className="transition-all duration-700 ease-out"
                        />
                        <defs>
                          <linearGradient id="hudGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-black text-stone-100">{pct}%</span>
                        <span className="text-[9px] text-stone-500 font-medium uppercase tracking-wider">Served</span>
                      </div>
                    </div>
                    {/* Served / Total */}
                    <div className="w-full bg-stone-900 rounded-xl px-4 py-3 border border-stone-800 text-center">
                      <p className="text-stone-100 font-bold text-lg leading-none">
                        {served} <span className="text-stone-500 font-normal text-sm">of</span> {total}
                      </p>
                      <p className="text-[10px] text-stone-500 mt-1 uppercase tracking-wide">Students Boarded</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ── Panel 2: Portion & Rate Metric Cards ── */}
            <div className="p-6 flex flex-col justify-center space-y-4">
              {(() => {
                const todayStr = new Date().toISOString().split('T')[0];
                const norm = (v: string) => v.includes('T') ? v.split('T')[0] : v;
                const todayB = bookings.filter(b => norm(b.date) === todayStr && b.status !== 'cancelled');
                const total  = todayB.length > 0 ? todayB.length : 1;
                const served = todayB.filter(b => b.status === 'consumed').length;
                const remaining = total - served;
                const rate = getActiveRate();
                return (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Remaining Meals */}
                      <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex flex-col space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500">Remaining</span>
                        <span className="text-2xl font-black text-amber-400">{remaining}</span>
                        <span className="text-[10px] text-stone-500">portions left</span>
                      </div>
                      {/* Boarding Speed */}
                      <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex flex-col space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500">Speed</span>
                        <span className="text-2xl font-black text-sky-400">{rate}</span>
                        <span className="text-[10px] text-stone-500">scans/min</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-stone-500">
                        <span>Served progress</span>
                        <span className="text-emerald-400 font-semibold">{served}/{total}</span>
                      </div>
                      <div className="h-2 w-full bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${Math.min((served / Math.max(total, 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    {/* Meal type breakdown */}
                    <div className="grid grid-cols-3 gap-2">
                      {(['breakfast','lunch','dinner'] as const).map(type => {
                        const count = todayB.filter(b => b.type === type && b.status === 'consumed').length;
                        const colours: Record<string, string> = {
                          breakfast: 'text-amber-400 bg-amber-900/40 border-amber-800',
                          lunch:     'text-sky-400 bg-sky-900/40 border-sky-800',
                          dinner:    'text-violet-400 bg-violet-900/40 border-violet-800',
                        };
                        return (
                          <div key={type} className={`border rounded-xl p-2 text-center ${colours[type]}`}>
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">{type.slice(0,5)}</p>
                            <p className="text-base font-black leading-tight">{count}</p>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* ── Panel 3: Live Scan Log Terminal ── */}
            <div className="p-6 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Live Scan Log</span>
                <div className="flex space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                </div>
              </div>
              <div className="flex-1 h-52 overflow-y-auto font-mono text-[10px] bg-black/60 text-stone-300 p-3 rounded-xl border border-stone-800 shadow-inner space-y-1">
                {terminalLogs.map((log, idx) => {
                  let col = 'text-stone-400';
                  if (log.includes('SUCCESS'))  col = 'text-emerald-400';
                  else if (log.includes('ERROR')) col = 'text-red-400';
                  else if (log.includes('REJECTED') || log.includes('WARNING')) col = 'text-amber-400';
                  else if (log.includes('System:')) col = 'text-sky-400';
                  return (
                    <div key={idx} className={`leading-relaxed border-b border-stone-800/30 pb-0.5 last:border-0 ${col}`}>
                      {log}
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] text-stone-600 text-center font-mono">
                Showing last {terminalLogs.length} events
              </p>
            </div>
          </div>
        </div>

        {/* ── Row 3: Instructions ── */}
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
                  their meal booking. Only today's bookings within the meal time window will be accepted.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                  <CheckCircle size={18} className="mr-2 text-gray-400" />
                  Valid QR Codes
                </h3>
                <p className="text-sm text-gray-600">
                  A valid QR code represents an active booking for the current date
                  within the admin-configured meal time window.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                  <AlertCircle size={18} className="mr-2 text-gray-400" />
                  Auto-Consumed
                </h3>
                <p className="text-sm text-gray-600">
                  Camera scanning auto-marks meals as consumed instantly. Manual entry
                  requires pressing Verify. Consumed meals cannot be re-scanned.
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
