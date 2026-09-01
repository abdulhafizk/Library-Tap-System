import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radio, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRightCircle, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Send,
  AlertTriangle,
  RotateCcw,
  Smartphone,
  Scan,
  Camera,
  Info,
  Check,
  Zap,
  HelpCircle,
  Music,
  BellRing,
  MessageSquare,
  User,
  QrCode,
  Flashlight,
  FlashlightOff,
  SwitchCamera,
  ScanLine,
  RefreshCw,
  Copy,
  ExternalLink,
  BookOpen,
  Award,
  Calendar,
  Trophy,
  Flame,
  Star
} from 'lucide-react';
import confetti from 'canvas-confetti';
import jsQR from 'jsqr';
import { useLibrary } from '../../context/LibraryContext';
import { TapResult } from '../../types';
import { soundManager } from '../../utils/audio';
import { createWhatsAppDirectLink, openWhatsAppDirect } from '../../utils/whatsappUtils';

interface TapPageProps {
  onGoToStudents?: () => void;
}

export const TapPage: React.FC<TapPageProps> = () => {
  const { 
    handleRfidTap, 
    currentTapResult, 
    clearCurrentTapResult, 
    settings, 
    updateSettings, 
    students,
  } = useLibrary();

  const [inputUid, setInputUid] = useState('');
  const [countdown, setCountdown] = useState<number>(settings.auto_reset_seconds || 4);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scannerPulse, setScannerPulse] = useState(false);
  const [activeMethod, setActiveMethod] = useState<'nfc_rfid' | 'camera'>('nfc_rfid');
  const [showNfcGuide, setShowNfcGuide] = useState(false);
  const [soundFeedbackToast, setSoundFeedbackToast] = useState<string | null>(null);
  const [isHoveringResult, setIsHoveringResult] = useState(false);
  const [copiedWaMessage, setCopiedWaMessage] = useState(false);
  const [showWaMessagePreview, setShowWaMessagePreview] = useState(false);

  // Web NFC State for Smartphones (Android Chrome / Edge)
  const [isNfcSupported, setIsNfcSupported] = useState(false);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [nfcError, setNfcError] = useState<string | null>(null);
  const [lastNfcSerial, setLastNfcSerial] = useState<string | null>(null);
  const nfcAbortControllerRef = useRef<AbortController | null>(null);

  // Camera Scanner State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [lastScannedResult, setLastScannedResult] = useState<string | null>(null);
  const [isScanningFrame, setIsScanningFrame] = useState(false);

  const cameraStreamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastScanTimestampRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const countdownTimerRef = useRef<number | null>(null);

  // Detect Web NFC support on device/browser & iframe status
  const [isInsideIframe, setIsInsideIframe] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        setIsInsideIframe(window.self !== window.top);
      } catch (e) {
        setIsInsideIframe(true);
      }
      setIsNfcSupported('NDEFReader' in window);
    }
  }, []);

  // Function to start Web NFC scanning on mobile device
  const startNfcScanning = async () => {
    if (!('NDEFReader' in window)) {
      setNfcError('Browser ini belum mendukung Web NFC API. Gunakan Google Chrome di HP Android dengan NFC aktif.');
      return;
    }

    try {
      setNfcError(null);
      if (nfcAbortControllerRef.current) {
        nfcAbortControllerRef.current.abort();
      }
      nfcAbortControllerRef.current = new AbortController();

      const NDEFReaderClass = (window as any).NDEFReader;
      const ndef = new NDEFReaderClass();

      await ndef.scan({ signal: nfcAbortControllerRef.current.signal });
      setIsNfcScanning(true);

      ndef.addEventListener('reading', (event: any) => {
        let detectedUid = event.serialNumber || '';
        
        // Also check if message records contain text / ID
        if (event.message && event.message.records && event.message.records.length > 0) {
          for (const record of event.message.records) {
            if (record.recordType === 'text') {
              try {
                const textDecoder = new TextDecoder(record.encoding || 'utf-8');
                const text = textDecoder.decode(record.data);
                if (text && text.trim()) {
                  detectedUid = text.trim();
                  break;
                }
              } catch (e) {
                console.warn('Text decode error', e);
              }
            }
          }
        }

        if (detectedUid) {
          setLastNfcSerial(detectedUid);
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
          executeTap(detectedUid);
        }
      });

      ndef.addEventListener('readingerror', () => {
        setNfcError('Gagal membaca data kartu NFC. Coba tempelkan kembali lebih dekat ke bagian belakang HP.');
      });

    } catch (err: any) {
      setIsNfcScanning(false);
      const errMsg = err?.message || '';
      
      if (err.name === 'SecurityError' || errMsg.includes('top-level')) {
        setNfcError('SENSOR_SECURITY_IFRAME');
      } else if (err.name === 'NotAllowedError') {
        setNfcError('Izin akses sensor NFC ditolak. Harap berikan izin akses NFC di pengaturan browser.');
      } else if (err.name === 'NotSupportedError') {
        setNfcError('NFC tidak didukung atau belum diaktifkan di Pengaturan HP Anda.');
      } else {
        setNfcError(errMsg || 'Tidak dapat mengaktifkan sensor NFC.');
      }
    }
  };

  const stopNfcScanning = () => {
    if (nfcAbortControllerRef.current) {
      nfcAbortControllerRef.current.abort();
      nfcAbortControllerRef.current = null;
    }
    setIsNfcScanning(false);
  };

  // Clean up NFC on unmount
  useEffect(() => {
    return () => {
      stopNfcScanning();
    };
  }, []);

  // Enumerate video devices
  const refreshVideoDevices = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setAvailableCameras(videoInputs);
      }
    } catch (e) {
      console.warn('Failed to enumerate video devices', e);
    }
  }, []);

  // Stop Camera & cleanup scanner loop
  const stopCamera = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      cameraStreamRef.current = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
    setHasTorch(false);
  }, []);

  // Start Camera with selected device or facing mode
  const startCamera = useCallback(async (customDeviceId?: string, customFacing?: 'environment' | 'user') => {
    try {
      stopCamera();
      setCameraError(null);
      setIsCameraActive(false);

      const targetFacing = customFacing || facingMode;
      const targetDeviceId = customDeviceId !== undefined ? customDeviceId : selectedCameraId;

      const videoConstraints: MediaTrackConstraints = targetDeviceId
        ? { deviceId: { exact: targetDeviceId } }
        : {
            facingMode: { ideal: targetFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false
      });

      cameraStreamRef.current = stream;

      // Check for torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && typeof (videoTrack as any).getCapabilities === 'function') {
        const capabilities = (videoTrack as any).getCapabilities();
        setHasTorch(Boolean(capabilities?.torch));
      } else {
        setHasTorch(false);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      await refreshVideoDevices();

      // BarcodeDetector setup if available
      let nativeBarcodeDetector: any = null;
      if ('BarcodeDetector' in window) {
        try {
          nativeBarcodeDetector = new (window as any).BarcodeDetector({
            formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8']
          });
        } catch (e) {
          nativeBarcodeDetector = null;
        }
      }

      // High-performance QR scanning loop
      const scanLoop = async () => {
        if (!videoRef.current || !cameraStreamRef.current) return;

        const video = videoRef.current;
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
          const now = Date.now();
          // Scan frame every ~100ms
          if (now - lastScanTimestampRef.current > 100) {
            lastScanTimestampRef.current = now;

            let canvas = canvasRef.current;
            if (!canvas) {
              canvas = document.createElement('canvas');
              (canvasRef as any).current = canvas;
            }

            // Downscale to max 640px for ultra fast QR detection with minimal CPU load
            const maxDimension = 640;
            let targetWidth = video.videoWidth;
            let targetHeight = video.videoHeight;
            if (targetWidth > maxDimension || targetHeight > maxDimension) {
              if (targetWidth > targetHeight) {
                targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
                targetWidth = maxDimension;
              } else {
                targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
                targetHeight = maxDimension;
              }
            }

            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (ctx) {
              ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
              const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);

              // 1. Primary QR scan with jsQR
              let detectedCode = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth'
              });

              let rawVal = detectedCode?.data?.trim();

              // 2. Secondary fallback with Native BarcodeDetector (for 1D barcodes)
              if (!rawVal && nativeBarcodeDetector) {
                try {
                  const barcodes = await nativeBarcodeDetector.detect(canvas);
                  if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                    rawVal = barcodes[0].rawValue.trim();
                  }
                } catch (e) {
                  // ignore frame detection error
                }
              }

              if (rawVal && rawVal.length > 0) {
                // Prevent duplicate rapid triggers of same code within 2.5s
                if (rawVal !== lastScannedCodeRef.current || (now - (lastScanTimestampRef.current || 0) > 2500)) {
                  lastScannedCodeRef.current = rawVal;
                  setLastScannedResult(rawVal);
                  setIsScanningFrame(true);

                  if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
                  if (settings.sound_enabled) {
                    soundManager.playScanBlip();
                  }

                  executeTap(rawVal);
                  setTimeout(() => {
                    setIsScanningFrame(false);
                    lastScannedCodeRef.current = '';
                  }, 2500);
                }
              }
            }
          }
        }

        animationFrameIdRef.current = requestAnimationFrame(scanLoop);
      };

      animationFrameIdRef.current = requestAnimationFrame(scanLoop);

    } catch (err: any) {
      console.error('Camera start error', err);
      const errMsg = err?.message || '';
      if (err.name === 'NotAllowedError' || errMsg.includes('Permission')) {
        setCameraError('Izin akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser/perangkat Anda.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Tidak ditemukan perangkat kamera yang tersedia.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Kamera sedang digunakan oleh aplikasi lain.');
      } else {
        setCameraError(errMsg || 'Tidak dapat membuka kamera. Pastikan browser memiliki izin akses kamera.');
      }
      setIsCameraActive(false);
    }
  }, [facingMode, selectedCameraId, settings.sound_enabled, stopCamera, refreshVideoDevices]);

  // Flip Camera (Front vs Back)
  const toggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    setSelectedCameraId('');
    startCamera('', nextFacing);
  };

  // Switch specific camera
  const handleSelectCamera = (deviceId: string) => {
    setSelectedCameraId(deviceId);
    startCamera(deviceId, facingMode);
  };

  // Toggle Flashlight / Torch
  const toggleTorch = async () => {
    if (!cameraStreamRef.current) return;
    try {
      const track = cameraStreamRef.current.getVideoTracks()[0];
      if (track && typeof (track as any).applyConstraints === 'function') {
        const nextTorch = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }]
        });
        setIsTorchOn(nextTorch);
      }
    } catch (e) {
      console.warn('Torch toggle failed', e);
    }
  };

  useEffect(() => {
    if (activeMethod === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeMethod]);

  // Focus input automatically so barcode/RFID scanner USB HID acts seamlessly
  useEffect(() => {
    if (!currentTapResult && activeMethod === 'nfc_rfid') {
      inputRef.current?.focus();
    }
  }, [currentTapResult, activeMethod]);

  // Global keydown listener for USB HID RFID readers
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && target !== inputRef.current) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 300) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 4) {
          e.preventDefault();
          executeTap(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Multi-stage celebration confetti triggers for captivating visual feedback
  const triggerCelebrationConfetti = useCallback((type: 'success_in' | 'success_out') => {
    if (type === 'success_in') {
      // Emerald, Gold, Mint, Cyan celebration
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#10b981', '#34d399', '#fbbf24', '#f59e0b', '#06b6d4', '#ffffff'],
        ticks: 200,
        gravity: 0.9,
        scalar: 1.15,
      });

      // Side fireworks cannons after 150ms
      setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 60,
          spread: 65,
          origin: { x: 0.08, y: 0.65 },
          colors: ['#10b981', '#34d399', '#fbbf24', '#38bdf8'],
          ticks: 220,
        });
        confetti({
          particleCount: 45,
          angle: 120,
          spread: 65,
          origin: { x: 0.92, y: 0.65 },
          colors: ['#10b981', '#34d399', '#fbbf24', '#38bdf8'],
          ticks: 220,
        });
      }, 160);

      // Star sparkles drift after 350ms
      setTimeout(() => {
        confetti({
          particleCount: 30,
          spread: 100,
          origin: { y: 0.45 },
          shapes: ['circle'],
          colors: ['#fbbf24', '#f59e0b', '#34d399'],
          scalar: 0.8,
          gravity: 0.7
        });
      }, 350);
    } else if (type === 'success_out') {
      // Electric Blue, Sky, Purple & Gold celebration for check out
      confetti({
        particleCount: 90,
        spread: 85,
        origin: { y: 0.55 },
        colors: ['#2563eb', '#38bdf8', '#8b5cf6', '#a855f7', '#fbbf24', '#ffffff'],
        ticks: 220,
        gravity: 0.9,
        scalar: 1.15,
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 55,
          spread: 70,
          origin: { x: 0.05, y: 0.65 },
          colors: ['#3b82f6', '#06b6d4', '#fbbf24', '#9333ea'],
          ticks: 220,
        });
        confetti({
          particleCount: 50,
          angle: 125,
          spread: 70,
          origin: { x: 0.95, y: 0.65 },
          colors: ['#3b82f6', '#06b6d4', '#fbbf24', '#9333ea'],
          ticks: 220,
        });
      }, 160);
    }
  }, []);

  // Time-of-day greeting helper (Pagi, Siang, Sore, Malam)
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  // Handle countdown when result is displayed
  useEffect(() => {
    if (currentTapResult) {
      if (currentTapResult.type === 'success_in' || currentTapResult.type === 'success_out') {
        triggerCelebrationConfetti(currentTapResult.type);
      }

      setCountdown(settings.auto_reset_seconds || 4);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      let remainingMs = (settings.auto_reset_seconds || 4) * 1000;
      let lastTick = Date.now();

      countdownTimerRef.current = window.setInterval(() => {
        const now = Date.now();
        const delta = now - lastTick;
        lastTick = now;

        // If user is hovering or interacting with WhatsApp options, pause countdown
        if (!isHoveringResult) {
          remainingMs -= delta;
          const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));
          setCountdown(remainingSecs);

          if (remainingMs <= 0) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            clearCurrentTapResult();
            setInputUid('');
            inputRef.current?.focus();
          }
        }
      }, 100);

      return () => {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      };
    }
  }, [currentTapResult, settings.auto_reset_seconds, clearCurrentTapResult, isHoveringResult, triggerCelebrationConfetti]);

  const executeTap = async (uid: string) => {
    if (!uid.trim()) return;
    if (settings.sound_enabled) {
      soundManager.playScanBlip();
    }
    setScannerPulse(true);
    setTimeout(() => setScannerPulse(false), 500);
    await handleRfidTap(uid);
    setInputUid('');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUid.trim()) {
      executeTap(inputUid);
    }
  };

  const playTestSound = (type: 'in' | 'out' | 'error') => {
    if (type === 'in') {
      soundManager.playCheckInSound();
      setSoundFeedbackToast('Memutar Efek Suara: Bip Masuk (Chime Ceria)');
    } else if (type === 'out') {
      soundManager.playCheckOutSound();
      setSoundFeedbackToast('Memutar Efek Suara: Bip Keluar (Harmoni Kunjungan)');
    } else {
      soundManager.playErrorSound();
      setSoundFeedbackToast('Memutar Efek Suara: Bip Gagal (Buzzer Peringatan)');
    }
    setTimeout(() => setSoundFeedbackToast(null), 2500);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`min-h-[calc(100vh-5rem)] flex flex-col justify-between transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto' : 'p-4 sm:p-6'
      }`}
    >
      {/* Sound feedback toast */}
      {soundFeedbackToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900/90 dark:bg-slate-800/90 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-slate-700/50 backdrop-blur-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <Volume2 className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>{soundFeedbackToast}</span>
        </div>
      )}

      {/* Top action bar in Kiosk / Tap page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-4xl mx-auto w-full mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                Terminal Scanner RFID & NFC
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-[10px] font-bold border border-blue-100 dark:border-blue-800">
                Audio Feedback Aktif
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Absensi mandiri dengan umpan balik suara & visual interaktif
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* NFC Guide button */}
          <button
            onClick={() => setShowNfcGuide(true)}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Panduan NFC</span>
          </button>

          {/* Sound Toggle with state indicator */}
          <button
            onClick={() => {
              const newState = !settings.sound_enabled;
              updateSettings({ sound_enabled: newState });
              if (newState) {
                soundManager.playScanBlip();
                setSoundFeedbackToast('Efek Suara Diaktifkan (ON)');
                setTimeout(() => setSoundFeedbackToast(null), 2000);
              }
            }}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors ${
              settings.sound_enabled 
                ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
            title="Nyalakan/Matikan Efek Suara Bip"
          >
            {settings.sound_enabled ? <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span>{settings.sound_enabled ? 'Audio ON' : 'Audio MUTE'}</span>
          </button>

          {/* Fullscreen Kiosk Toggle */}
          <button
            id="btn-toggle-fullscreen"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Keluar Fullscreen' : 'Mode Layar Penuh'}</span>
          </button>
        </div>
      </div>

      {/* Audio & Method Control Banner */}
      <div className="max-w-4xl mx-auto w-full mb-3 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Method Switcher Tabs (NFC / RFID vs Camera QR Scanner) */}
        <div className="flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
          <button
            onClick={() => setActiveMethod('nfc_rfid')}
            className={`flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeMethod === 'nfc_rfid'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs border border-slate-200 dark:border-slate-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>NFC HP & USB RFID</span>
          </button>
          <button
            onClick={() => setActiveMethod('camera')}
            className={`flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeMethod === 'camera'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs border border-slate-200 dark:border-slate-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Kamera QR Code</span>
          </button>
        </div>

        {/* Quick Sound Test Controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto justify-start sm:justify-end pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 hidden md:inline">
            Tes Audio:
          </span>
          <button
            onClick={() => playTestSound('in')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0"
            title="Putar efek suara absensi masuk berhasil"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Tes Bip Masuk</span>
          </button>
          <button
            onClick={() => playTestSound('out')}
            className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0"
            title="Putar efek suara absensi keluar berhasil"
          >
            <Music className="w-3.5 h-3.5" />
            <span>Tes Bip Keluar</span>
          </button>
          <button
            onClick={() => playTestSound('error')}
            className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0"
            title="Putar efek suara peringatan kartu gagal / tidak terdaftar"
          >
            <Volume2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Tes Bip Gagal</span>
          </button>
        </div>
      </div>

      {/* Main Focus Scanning Section */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full my-auto py-2">
        {!currentTapResult ? (
          activeMethod === 'nfc_rfid' ? (
            /* IDLE / WAITING FOR NFC OR RFID CARD */
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-10 shadow-sm border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden transition-all">
              {/* RFID / NFC Graphic & Waves */}
              <div className="relative z-10 flex flex-col items-center">
                
                {/* Smartphone NFC Animated Radar */}
                <div className="relative mb-6">
                  {/* Outer Pulsing Wave */}
                  <div className={`absolute -inset-4 rounded-full bg-blue-400/20 animate-ping duration-1000 ${isNfcScanning ? 'opacity-70' : 'opacity-30'}`} />
                  <div className="absolute -inset-8 rounded-full border border-blue-200/60 dark:border-blue-800/40" />

                  <div className={`
                    w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-blue-50 to-blue-100/70 dark:from-blue-950/40 dark:to-blue-900/60 border-2 border-blue-300 dark:border-blue-700 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm transition-transform duration-300 relative z-10
                    ${scannerPulse ? 'scale-110 ring-8 ring-blue-100 dark:ring-blue-900/50' : 'animate-bounce-slow'}
                  `}>
                    <div className="relative flex items-center justify-center">
                      <Smartphone className="w-10 h-10 sm:w-12 sm:h-12 text-blue-700 dark:text-blue-300" />
                      <Radio className="w-6 h-6 text-blue-500 absolute -top-2 -right-2 animate-pulse" />
                      <Sparkles className="w-4 h-4 text-amber-500 absolute -bottom-1 -left-1" />
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                  Tempelkan Kartu NFC / RFID
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-5">
                  Tempelkan kartu santri ke bagian belakang HP Anda (sensor NFC) atau tap pada USB RFID Reader.
                </p>

                {/* Smartphone NFC Status Banner / Activation button */}
                <div className="w-full max-w-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 mb-5 text-left">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isNfcScanning ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      }`}>
                        <Zap className={`w-4 h-4 ${isNfcScanning ? 'animate-pulse' : ''}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {isNfcScanning ? 'Sensor NFC HP Aktif' : isNfcSupported ? 'NFC HP Siap Digunakan' : 'Sensor USB / Manual Siap'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isNfcScanning 
                            ? 'Tempelkan kartu ke bodi belakang HP' 
                            : isNfcSupported 
                            ? 'Tekan tombol untuk aktifkan Web NFC' 
                            : 'Mendukung USB RFID Reader & Keyboard HID'}
                        </p>
                      </div>
                    </div>

                    {isNfcSupported && (
                      <button
                        onClick={isNfcScanning ? stopNfcScanning : startNfcScanning}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                          isNfcScanning
                            ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
                        }`}
                      >
                        {isNfcScanning ? 'Hentikan NFC' : 'Aktifkan NFC HP'}
                      </button>
                    )}
                  </div>

                  {nfcError && (
                    <div className="mt-2.5 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] text-amber-800 dark:text-amber-300">
                      {nfcError === 'SENSOR_SECURITY_IFRAME' ? (
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <span>Sensor NFC Memerlukan Tab Baru</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            Kebijakan keamanan browser (Web NFC) mewajibkan aplikasi dibuka langsung di tab mandiri, bukan di dalam frame pratinjau.
                          </p>
                          <a
                            href={typeof window !== 'undefined' ? window.location.href : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-2xs mt-1 transition-colors"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>Buka di Tab Baru untuk Tap NFC</span>
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <span>{nfcError}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Status indicator pill */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-400"></span>
                  </span>
                  Sensor Aktif & Siap Menerima Tap
                </div>

                {/* Hardware Scanner & Manual Input */}
                <form onSubmit={handleManualSubmit} className="mt-6 w-full max-w-sm">
                  <div className="relative flex items-center">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputUid}
                      onChange={(e) => setInputUid(e.target.value)}
                      placeholder="UID Kartu / NIS / Scanner..."
                      className="w-full pl-4 pr-12 py-2.5 text-sm font-mono rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!inputUid.trim()}
                      className="absolute right-1.5 p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 font-mono">
                    Menerima input otomatis dari NFC HP & USB Barcode/RFID
                  </p>
                </form>
              </div>
            </div>
          ) : (
            /* CAMERA SCANNER VIEW (QR CODE / BARCODE) */
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden transition-all">
              {/* Header & Controls */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-left">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Pemindai Kamera QR Santri</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                        Auto-Scan
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Deteksi otomatis QR Code & Barcode kartu santri
                    </p>
                  </div>
                </div>

                {/* Camera Tool Actions */}
                <div className="flex items-center gap-1.5">
                  {/* Torch Toggle if available */}
                  {hasTorch && (
                    <button
                      onClick={toggleTorch}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors border ${
                        isTorchOn 
                          ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                      title={isTorchOn ? 'Matikan Lampu Senter' : 'Nyalakan Lampu Senter'}
                    >
                      {isTorchOn ? <Flashlight className="w-3.5 h-3.5" /> : <FlashlightOff className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  {/* Switch Camera (Front / Back) */}
                  <button
                    onClick={toggleFacingMode}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title={`Ganti ke kamera ${facingMode === 'environment' ? 'Depan / Webcam' : 'Belakang'}`}
                  >
                    <SwitchCamera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="hidden sm:inline text-[11px]">
                      {facingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveMethod('nfc_rfid')}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Kembali ke Mode RFID / NFC"
                  >
                    Kembali
                  </button>
                </div>
              </div>

              {/* Camera Selection Dropdown (if multiple video inputs exist) */}
              {availableCameras.length > 1 && (
                <div className="mb-3 text-left">
                  <div className="flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={selectedCameraId}
                      onChange={(e) => handleSelectCamera(e.target.value)}
                      className="w-full text-[11px] p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="">-- Pilih Perangkat Kamera ({availableCameras.length} terdeteksi) --</option>
                      {availableCameras.map((cam, idx) => (
                        <option key={cam.deviceId || idx} value={cam.deviceId}>
                          {cam.label || `Kamera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Video Viewport with Precision Scanning Frame */}
              <div className="relative w-full aspect-4/3 sm:aspect-16/10 bg-slate-950 rounded-2xl overflow-hidden mb-3 border border-slate-800 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Visual Target Reticle with Animated Laser Scan Line */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
                  <div className={`
                    w-52 h-52 sm:w-60 sm:h-60 rounded-2xl relative transition-all duration-200
                    ${isScanningFrame 
                      ? 'border-2 border-emerald-400 bg-emerald-500/10 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-105' 
                      : 'border-2 border-blue-400/80 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.3)]'}
                  `}>
                    {/* 4 Neon High-Tech Corner Brackets */}
                    <div className={`absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 rounded-tl-lg transition-colors ${isScanningFrame ? 'border-emerald-400' : 'border-blue-400'}`} />
                    <div className={`absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 rounded-tr-lg transition-colors ${isScanningFrame ? 'border-emerald-400' : 'border-blue-400'}`} />
                    <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 rounded-bl-lg transition-colors ${isScanningFrame ? 'border-emerald-400' : 'border-blue-400'}`} />
                    <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 rounded-br-lg transition-colors ${isScanningFrame ? 'border-emerald-400' : 'border-blue-400'}`} />
                    
                    {/* Animated Laser Scan Line */}
                    {isCameraActive && (
                      <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_8px_#38bdf8] animate-bounce-slow" />
                    )}

                    {/* Center Crosshair Target */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-40">
                      <ScanLine className="w-8 h-8 text-blue-300" />
                    </div>
                  </div>

                  {/* Realtime Live Scan Status Pill */}
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-medium border border-white/10 shadow-sm">
                    <span className={`w-2 h-2 rounded-full ${isScanningFrame ? 'bg-emerald-400 animate-ping' : isCameraActive ? 'bg-blue-400 animate-pulse' : 'bg-slate-400'}`} />
                    <span>
                      {isScanningFrame 
                        ? `QR Terdeteksi: ${lastScannedResult || ''}` 
                        : isCameraActive 
                        ? 'Arahkan QR Code Kartu ke Tengah Kotak' 
                        : 'Menyiapkan Kamera...'}
                    </span>
                  </div>
                </div>

                {/* Loading Camera State */}
                {!isCameraActive && !cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-white p-4">
                    <div className="w-9 h-9 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-xs font-semibold text-slate-200">Mengaktifkan Sensor Kamera...</p>
                    <p className="text-[11px] text-slate-400 mt-1">Harap izinkan akses kamera jika browser memintanya</p>
                  </div>
                )}

                {/* Camera Permission or Hardware Error */}
                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-white p-5">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2.5 border border-amber-500/30">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-100 mb-1">Akses Kamera Bermasalah</p>
                    <p className="text-[11px] text-slate-300 text-center max-w-xs mb-3.5 leading-relaxed">
                      {cameraError}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startCamera()}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Coba Akses Lagi</span>
                      </button>
                      <button
                        onClick={() => setActiveMethod('nfc_rfid')}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700"
                      >
                        Gunakan NFC / RFID
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Manual Barcode / QR Code Quick Fallback */}
              <div className="pt-1">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (inputUid.trim()) {
                      executeTap(inputUid.trim());
                      setInputUid('');
                    }
                  }}
                  className="relative flex items-center"
                >
                  <input
                    type="text"
                    value={inputUid}
                    onChange={(e) => setInputUid(e.target.value)}
                    placeholder="Atau ketik UID / scan dengan Barcode Scanner USB..."
                    className="w-full pl-3 pr-9 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-mono placeholder:font-sans placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!inputUid.trim()}
                    className="absolute right-1 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-colors cursor-pointer"
                    title="Kirim Input Barcode / QR"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Mendukung QR Code Santri, Barcode NIS, serta Barcode Scanner USB genggam
                </p>
              </div>
            </div>
          )
        ) : (
          /* ACTIVE RESULT CARD (MASUK / KELUAR / ERROR) WITH HIGH-END CELEBRATORY ANIMATIONS */
          <motion.div 
            key="active-tap-result"
            initial={{ opacity: 0, scale: 0.86, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -20 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            className="w-full max-w-xl relative"
          >
            {/* SUCCESS CHECK-IN CELEBRATION */}
            {currentTapResult.type === 'success_in' && currentTapResult.student && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-emerald-400/90 dark:border-emerald-500/80 text-center relative overflow-hidden">
                {/* Glowing Animated Radial Aura Behind Card */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-400/20 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-teal-400/20 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

                {/* Progress bar countdown with glowing head */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-100 dark:bg-emerald-950/60">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 transition-all duration-150 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                    style={{ width: `${(countdown / (settings.auto_reset_seconds || 4)) * 100}%` }}
                  />
                </div>

                {/* Floating Animated XP Reward Pill & Praise Tags */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.08 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 mb-3 border border-white/80"
                >
                  <Trophy className="w-4 h-4 text-amber-900 animate-bounce" />
                  <span>+15 XP Kunjungan Tercatat!</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-900" />
                </motion.div>

                {/* Bouncing Animated Success Icon with Floating Starlets & Ripples */}
                <div className="relative inline-flex items-center justify-center mb-4 mt-1">
                  {/* Pulsing Concentric Ripple Rings */}
                  <motion.div 
                    initial={{ scale: 0.6, opacity: 0.9 }}
                    animate={{ scale: [1, 1.45, 1], opacity: [0.8, 0.1, 0.8] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 -m-4 rounded-full bg-emerald-400/30 dark:bg-emerald-500/25 blur-xs pointer-events-none"
                  />
                  <motion.div 
                    initial={{ scale: 0.6, opacity: 0.7 }}
                    animate={{ scale: [1, 1.85, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    className="absolute inset-0 -m-8 rounded-full border-2 border-emerald-400/40 dark:border-emerald-500/30 pointer-events-none"
                  />
                  <motion.div 
                    initial={{ scale: 0.6, opacity: 0.5 }}
                    animate={{ scale: [1, 2.2, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                    className="absolute inset-0 -m-12 rounded-full border border-teal-400/20 dark:border-teal-500/20 pointer-events-none"
                  />

                  {/* Main Center Bouncing Badge */}
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 12, stiffness: 280, delay: 0.05 }}
                    className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40 border-4 border-white/90 dark:border-slate-800 relative z-10"
                  >
                    <CheckCircle2 className="w-11 h-11 sm:w-12 sm:h-12 drop-shadow-md stroke-[2.5]" />
                  </motion.div>

                  {/* Floating Decorative Sparkles & Badges */}
                  <motion.div 
                    animate={{ y: [-3, -10, -3], rotate: [0, 45, 0], scale: [1, 1.3, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-3 -right-5 text-amber-400 drop-shadow-md z-20"
                  >
                    <Sparkles className="w-7 h-7 fill-amber-300" />
                  </motion.div>
                  <motion.div 
                    animate={{ y: [3, 9, 3], rotate: [0, -45, 0], scale: [1, 1.25, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                    className="absolute -bottom-2 -left-5 text-emerald-400 drop-shadow-md z-20"
                  >
                    <Zap className="w-6 h-6 fill-emerald-300" />
                  </motion.div>
                  <motion.div 
                    animate={{ x: [0, 4, 0], scale: [0.9, 1.15, 0.9] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute top-1/2 -right-8 text-teal-400 z-20 hidden sm:block"
                  >
                    <Star className="w-5 h-5 fill-teal-300" />
                  </motion.div>
                </div>

                {/* Badge Header & Greeting with Sound Wave Bars */}
                <div className="space-y-1.5 mb-4">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs uppercase tracking-wider border border-emerald-200 dark:border-emerald-800 shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Absensi Masuk Berhasil</span>
                  </motion.div>

                  {/* Sound equalizer animated bars */}
                  {settings.sound_enabled && (
                    <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Chime Notifikasi Masuk Aktif</span>
                      <div className="flex items-center gap-0.5 h-3">
                        <span className="w-1 h-3 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse delay-75" />
                        <span className="w-1 h-3.5 bg-teal-400 rounded-full animate-pulse delay-150" />
                        <span className="w-1 h-2 bg-emerald-500 rounded-full animate-pulse delay-100" />
                      </div>
                    </div>
                  )}

                  <motion.h2 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.18, type: "spring", stiffness: 300 }}
                    className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight"
                  >
                    {getTimeGreeting()}, Ahlan wa Sahlan!
                  </motion.h2>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    Selamat datang dan selamat belajar di perpustakaan
                  </p>

                  {/* Floating praise badges */}
                  <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold">
                      📚 Semangat Membaca
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-100/80 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200 text-[10px] font-bold">
                      🌟 Santri Teladan
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-[10px] font-bold">
                      ⚡ Kehadiran Sah
                    </span>
                  </div>
                </div>

                {/* Student Photo & Profile Hero Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/50 dark:from-slate-800/90 dark:to-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/80 mb-5 text-left relative overflow-hidden shadow-xs"
                >
                  {/* Avatar with Animated Pulsing Ring */}
                  <div className="relative shrink-0">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 animate-pulse opacity-70 blur-xs" />
                    {currentTapResult.student.photo_url && currentTapResult.student.photo_url.trim() !== '' ? (
                      <img
                        src={currentTapResult.student.photo_url}
                        alt={currentTapResult.student.name}
                        className="w-18 h-18 rounded-2xl object-cover ring-2 ring-white dark:ring-slate-800 relative z-10 shadow-sm"
                      />
                    ) : (
                      <div className="w-18 h-18 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 relative z-10 shadow-sm font-black text-xl">
                        {currentTapResult.student.name ? currentTapResult.student.name.slice(0, 2).toUpperCase() : 'SN'}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 z-20 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-2xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>

                  <div className="text-center sm:text-left min-w-0 flex-1">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug truncate">
                      {currentTapResult.student.name}
                    </h3>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                      <span className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 font-mono shadow-2xs">
                        NIS: {currentTapResult.student.nis}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100/90 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-xs font-black">
                        Kelas {currentTapResult.student.class}
                      </span>
                      {currentTapResult.student.rfid_uid && (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          UID: {currentTapResult.student.rfid_uid.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Check-in timestamp badge with active pulse */}
                <div className="flex items-center justify-center gap-2 mb-5">
                  <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 font-bold text-sm border border-emerald-200 dark:border-emerald-800/80 shadow-2xs w-full sm:w-auto">
                    <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                    <span>Waktu Masuk: {currentTapResult.checkInTime} WIB</span>
                  </div>
                </div>

                {/* Dedicated WhatsApp Notification Action Box */}
                <div 
                  onMouseEnter={() => setIsHoveringResult(true)}
                  onMouseLeave={() => setIsHoveringResult(false)}
                  className="mb-5 p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800 text-left space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Notifikasi WhatsApp Tap Masuk
                        </span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                          {settings.whatsapp?.enabled 
                            ? (settings.whatsapp.webhook_url ? 'Gateway Webhook Bot Terhubung (Terkirim Otomatis)' : 'Mode Kirim Langsung (wa.me)')
                            : 'Status: Nonaktif di Pengaturan'}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      settings.whatsapp?.enabled
                        ? 'bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                    }`}>
                      {settings.whatsapp?.enabled ? 'SIAP KIRIM' : 'NONAKTIF'}
                    </span>
                  </div>

                  {/* 1-Click WhatsApp Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    {currentTapResult.student.phone ? (
                      <a
                        href={currentTapResult.whatsappParentDirectUrl || createWhatsAppDirectLink(currentTapResult.student.phone, currentTapResult.whatsappMessage || '')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Kirim WA ke Santri / Wali ({currentTapResult.student.phone})</span>
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </a>
                    ) : (
                      <div className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700">
                        <Info className="w-3.5 h-3.5" />
                        <span>No. HP santri belum diisi</span>
                      </div>
                    )}

                    {settings.whatsapp?.admin_phone && (
                      <a
                        href={currentTapResult.whatsappAdminDirectUrl || createWhatsAppDirectLink(settings.whatsapp.admin_phone, currentTapResult.whatsappMessage || '')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      >
                        <span>Ke Admin</span>
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </a>
                    )}
                  </div>

                  {/* View & Copy WhatsApp Text Collapsible */}
                  {currentTapResult.whatsappMessage && (
                    <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowWaMessagePreview(!showWaMessagePreview)}
                          className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{showWaMessagePreview ? 'Sembunyikan Teks Pesan' : 'Lihat Format Pesan WA'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (currentTapResult.whatsappMessage) {
                              navigator.clipboard.writeText(currentTapResult.whatsappMessage);
                              setCopiedWaMessage(true);
                              setTimeout(() => setCopiedWaMessage(false), 2000);
                            }
                          }}
                          className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/50 px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {copiedWaMessage ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedWaMessage ? 'Tersalin!' : 'Salin Teks'}</span>
                        </button>
                      </div>

                      {showWaMessagePreview && (
                        <pre className="mt-2 p-2.5 bg-white dark:bg-slate-950 rounded-xl text-[11px] text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap border border-emerald-200/80 dark:border-slate-800 leading-relaxed max-h-36 overflow-y-auto">
                          {currentTapResult.whatsappMessage}
                        </pre>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Selamat membaca & belajar di perpustakaan</span>
                  <button
                    onClick={clearCurrentTapResult}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Kembali ({countdown}s)
                  </button>
                </div>
              </div>
            )}

            {/* SUCCESS CHECK-OUT CELEBRATION */}
            {currentTapResult.type === 'success_out' && currentTapResult.student && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-blue-400/90 dark:border-blue-500/80 text-center relative overflow-hidden">
                {/* Glowing Animated Radial Aura Behind Card */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-400/20 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-400/20 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

                {/* Progress bar countdown with glowing head */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-blue-100 dark:bg-blue-950/60">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500 transition-all duration-150 shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                    style={{ width: `${(countdown / (settings.auto_reset_seconds || 4)) * 100}%` }}
                  />
                </div>

                {/* Floating Animated XP Reward Pill & Farewell Tags */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.08 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-500/25 mb-3 border border-white/80"
                >
                  <Flame className="w-4 h-4 text-amber-300 animate-bounce" />
                  <span>+10 XP Kunjungan Selesai!</span>
                  <Sparkles className="w-3.5 h-3.5 text-sky-200" />
                </motion.div>

                {/* Bouncing Animated Success Icon with Floating Starlets & Ripples */}
                <div className="relative inline-flex items-center justify-center mb-4 mt-1">
                  {/* Pulsing Concentric Ripple Rings */}
                  <motion.div 
                    initial={{ scale: 0.6, opacity: 0.9 }}
                    animate={{ scale: [1, 1.45, 1], opacity: [0.8, 0.1, 0.8] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 -m-4 rounded-full bg-blue-400/30 dark:bg-blue-500/25 blur-xs pointer-events-none"
                  />
                  <motion.div 
                    initial={{ scale: 0.6, opacity: 0.7 }}
                    animate={{ scale: [1, 1.85, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    className="absolute inset-0 -m-8 rounded-full border-2 border-blue-400/40 dark:border-blue-500/30 pointer-events-none"
                  />
                  <motion.div 
                    initial={{ scale: 0.6, opacity: 0.5 }}
                    animate={{ scale: [1, 2.2, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                    className="absolute inset-0 -m-12 rounded-full border border-indigo-400/20 dark:border-indigo-500/20 pointer-events-none"
                  />

                  {/* Main Center Bouncing Badge */}
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 12, stiffness: 280, delay: 0.05 }}
                    className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white flex items-center justify-center shadow-xl shadow-blue-500/40 border-4 border-white/90 dark:border-slate-800 relative z-10"
                  >
                    <ArrowRightCircle className="w-11 h-11 sm:w-12 sm:h-12 drop-shadow-md stroke-[2.5]" />
                  </motion.div>

                  {/* Floating Decorative Sparkles & Badges */}
                  <motion.div 
                    animate={{ y: [-3, -10, -3], rotate: [0, 45, 0], scale: [1, 1.3, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-3 -right-5 text-amber-400 drop-shadow-sm z-20"
                  >
                    <Sparkles className="w-7 h-7 fill-amber-300" />
                  </motion.div>
                  <motion.div 
                    animate={{ y: [3, 9, 3], rotate: [0, -45, 0], scale: [1, 1.25, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                    className="absolute -bottom-2 -left-5 text-sky-400 drop-shadow-sm z-20"
                  >
                    <Award className="w-6 h-6" />
                  </motion.div>
                  <motion.div 
                    animate={{ x: [0, 4, 0], scale: [0.9, 1.15, 0.9] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute top-1/2 -right-8 text-indigo-400 z-20 hidden sm:block"
                  >
                    <Star className="w-5 h-5 fill-indigo-300" />
                  </motion.div>
                </div>

                {/* Badge Header & Farewell with Sound Wave Bars */}
                <div className="space-y-1.5 mb-4">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold text-xs uppercase tracking-wider border border-blue-200 dark:border-blue-800 shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Absensi Keluar Berhasil</span>
                  </motion.div>

                  {/* Sound equalizer animated bars */}
                  {settings.sound_enabled && (
                    <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Chime Notifikasi Keluar Aktif</span>
                      <div className="flex items-center gap-0.5 h-3">
                        <span className="w-1 h-3 bg-blue-500 rounded-full animate-pulse" />
                        <span className="w-1 h-2 bg-sky-400 rounded-full animate-pulse delay-75" />
                        <span className="w-1 h-3.5 bg-indigo-400 rounded-full animate-pulse delay-150" />
                        <span className="w-1 h-2 bg-blue-500 rounded-full animate-pulse delay-100" />
                      </div>
                    </div>
                  )}

                  <motion.h2 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.18, type: "spring", stiffness: 300 }}
                    className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight"
                  >
                    Sampai Jumpa Lagi!
                  </motion.h2>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                    Terima kasih telah berkunjung dan membaca di perpustakaan
                  </p>

                  {/* Floating praise badges */}
                  <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-[10px] font-bold">
                      📖 Kunjungan Tuntas
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 text-[10px] font-bold">
                      🌟 Poin Literasi Masuk
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-100/80 dark:bg-sky-900/50 text-sky-800 dark:text-sky-200 text-[10px] font-bold">
                      ⚡ Syukron Santri Hebat
                    </span>
                  </div>
                </div>

                {/* Student Photo & Profile Hero Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-800/90 dark:to-blue-950/20 border border-blue-200/80 dark:border-blue-800/80 mb-5 text-left relative overflow-hidden shadow-xs"
                >
                  {/* Avatar with Animated Pulsing Ring */}
                  <div className="relative shrink-0">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse opacity-70 blur-xs" />
                    {currentTapResult.student.photo_url && currentTapResult.student.photo_url.trim() !== '' ? (
                      <img
                        src={currentTapResult.student.photo_url}
                        alt={currentTapResult.student.name}
                        className="w-18 h-18 rounded-2xl object-cover ring-2 ring-white dark:ring-slate-800 relative z-10 shadow-sm"
                      />
                    ) : (
                      <div className="w-18 h-18 rounded-2xl bg-blue-100 dark:bg-blue-950/70 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-blue-700 dark:text-blue-300 relative z-10 shadow-sm font-black text-xl">
                        {currentTapResult.student.name ? currentTapResult.student.name.slice(0, 2).toUpperCase() : 'SN'}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 z-20 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-2xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>

                  <div className="text-center sm:text-left min-w-0 flex-1">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug truncate">
                      {currentTapResult.student.name}
                    </h3>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                      <span className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 font-mono shadow-2xs">
                        NIS: {currentTapResult.student.nis}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-blue-100/90 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700 text-xs font-black">
                        Kelas {currentTapResult.student.class}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Stats row: Check out & Duration with High Contrast Badges */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center shadow-2xs">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Waktu Keluar</p>
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5 font-mono">{currentTapResult.checkOutTime} WIB</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 text-center shadow-2xs">
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">Durasi Kunjungan</p>
                    <p className="text-sm font-black text-blue-700 dark:text-blue-300 mt-0.5">{currentTapResult.durationText}</p>
                  </div>
                </div>

                {/* Dedicated WhatsApp Notification Action Box for Check-Out */}
                <div 
                  onMouseEnter={() => setIsHoveringResult(true)}
                  onMouseLeave={() => setIsHoveringResult(false)}
                  className="mb-5 p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/90 dark:border-blue-800 text-left space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Notifikasi WhatsApp Tap Keluar & Rekap Durasi
                        </span>
                        <span className="text-[11px] text-blue-700 dark:text-blue-300">
                          {settings.whatsapp?.enabled 
                            ? (settings.whatsapp.webhook_url ? 'Gateway Webhook Bot Terhubung (Terkirim Otomatis)' : 'Mode Kirim Langsung (wa.me)')
                            : 'Status: Nonaktif di Pengaturan'}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      settings.whatsapp?.enabled
                        ? 'bg-blue-200/70 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                    }`}>
                      {settings.whatsapp?.enabled ? 'SIAP KIRIM' : 'NONAKTIF'}
                    </span>
                  </div>

                  {/* 1-Click WhatsApp Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    {currentTapResult.student.phone ? (
                      <a
                        href={currentTapResult.whatsappParentDirectUrl || createWhatsAppDirectLink(currentTapResult.student.phone, currentTapResult.whatsappMessage || '')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Kirim WA ke Santri / Wali ({currentTapResult.student.phone})</span>
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </a>
                    ) : (
                      <div className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700">
                        <Info className="w-3.5 h-3.5" />
                        <span>No. HP santri belum diisi</span>
                      </div>
                    )}

                    {settings.whatsapp?.admin_phone && (
                      <a
                        href={currentTapResult.whatsappAdminDirectUrl || createWhatsAppDirectLink(settings.whatsapp.admin_phone, currentTapResult.whatsappMessage || '')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      >
                        <span>Ke Admin</span>
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </a>
                    )}
                  </div>

                  {/* View & Copy WhatsApp Text Collapsible */}
                  {currentTapResult.whatsappMessage && (
                    <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/60">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowWaMessagePreview(!showWaMessagePreview)}
                          className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{showWaMessagePreview ? 'Sembunyikan Teks Pesan' : 'Lihat Format Pesan WA'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (currentTapResult.whatsappMessage) {
                              navigator.clipboard.writeText(currentTapResult.whatsappMessage);
                              setCopiedWaMessage(true);
                              setTimeout(() => setCopiedWaMessage(false), 2000);
                            }
                          }}
                          className="text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100/60 dark:hover:bg-blue-900/50 px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {copiedWaMessage ? <Check className="w-3 h-3 text-blue-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedWaMessage ? 'Tersalin!' : 'Salin Teks'}</span>
                        </button>
                      </div>

                      {showWaMessagePreview && (
                        <pre className="mt-2 p-2.5 bg-white dark:bg-slate-950 rounded-xl text-[11px] text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap border border-blue-200/80 dark:border-slate-800 leading-relaxed max-h-36 overflow-y-auto">
                          {currentTapResult.whatsappMessage}
                        </pre>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Terima kasih telah berkunjung ke perpustakaan</span>
                  <button
                    onClick={clearCurrentTapResult}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Kembali ({countdown}s)
                  </button>
                </div>
              </div>
            )}

            {/* UNREGISTERED / ERROR STATE */}
            {currentTapResult.type === 'unregistered_card' && (
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: [0.95, 1.02, 1] }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-rose-300 dark:border-rose-700 text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-slate-100 dark:bg-slate-800">
                  <div 
                    className="h-full bg-rose-500 transition-all duration-150"
                    style={{ width: `${(countdown / (settings.auto_reset_seconds || 4)) * 100}%` }}
                  />
                </div>

                <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-200 dark:border-rose-800 shadow-xs">
                  <XCircle className="w-9 h-9" />
                </div>

                {/* Sound effect indicator pill */}
                {settings.sound_enabled && (
                  <div className="flex items-center justify-center gap-1.5 mb-3 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                    <span>Umpan Balik Suara: Buzzer Peringatan Berbunyi (Akses Ditolak)</span>
                  </div>
                )}

                <h2 className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight mb-2">
                  Kartu Tidak Terdaftar
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                  {currentTapResult.message || 'Kartu RFID/NFC belum terdaftar dalam sistem atau belum dihubungkan ke santri.'}
                </p>

                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 mb-6 text-xs text-rose-800 dark:text-rose-300 text-left">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <AlertTriangle className="w-4 h-4" /> Tindakan:
                  </div>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Silakan hubungi Petugas Perpustakaan untuk pendaftaran kartu.</li>
                    <li>Pastikan kartu yang digunakan adalah kartu santri resmi ber-chip RFID/NFC.</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Hubungi admin untuk mendaftarkan kartu</span>
                  <button
                    onClick={clearCurrentTapResult}
                    className="text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Coba Lagi ({countdown}s)
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* Interactive Simulation & Quick Test Panel */}
      <div className="max-w-4xl mx-auto w-full bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Simulator Tap Kartu Santri (Klik untuk Uji Coba)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Klik nama santri untuk simulasi tap kartu NFC instan
          </span>
        </div>

        {/* Quick Santri Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {students.slice(0, 8).map((student) => {
            return (
              <button
                key={student.id}
                onClick={() => {
                  if (student.rfid_uid) {
                    executeTap(student.rfid_uid);
                  }
                }}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-200 dark:hover:border-blue-700 text-left transition-colors group cursor-pointer"
              >
                <img
                  src={student.photo_url}
                  alt={student.name}
                  className="w-7 h-7 rounded-full object-cover bg-slate-200 dark:bg-slate-700"
                />
                <div className="truncate flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 truncate">
                    {student.name}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                    Kelas {student.class}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Test Unregistered Card Chip */}
          <button
            onClick={() => executeTap('NFC_TEST_998877')}
            className="flex items-center gap-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-left transition-colors cursor-pointer"
          >
            <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <div className="truncate">
              <p className="text-xs font-bold">Kartu Tak Dikenal</p>
              <p className="text-[10px] text-rose-500 dark:text-rose-400 font-mono">NFC_TEST_998877</p>
            </div>
          </button>
        </div>
      </div>

      {/* NFC Smartphone Guide Modal */}
      {showNfcGuide && (
        <div 
          onClick={() => setShowNfcGuide(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Cara Tap Absensi dengan HP (NFC)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Panduan penggunaan sensor NFC pada smartphone</p>
                </div>
              </div>
              <button
                onClick={() => setShowNfcGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 mb-6">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">Pastikan HP Mendukung & Mengaktifkan NFC</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">Buka <strong>Pengaturan HP &gt; Koneksi &gt; NFC</strong> dan pastikan statusnya <strong>Aktif / ON</strong>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">Gunakan Browser Chrome / Edge di Android</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">Fitur <em>Web NFC</em> didukung secara penuh pada Google Chrome & Microsoft Edge di Android.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">3</span>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">Tekan "Aktifkan NFC HP" & Izinkan Browser</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">Tekan tombol aktivasi di halaman ini, lalu klik <strong>Izinkan</strong> saat browser meminta izin akses NFC.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">4</span>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">Tempelkan Kartu Santri ke Bodi Belakang HP</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">Dekatkan kartu RFID/e-KTP ke sensor NFC di belakang HP (biasanya di dekat kamera belakang). HP akan bergetar dan absensi langsung tercatat otomatis!</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowNfcGuide(false)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer shadow-2xs"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

