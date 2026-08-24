import React, { useState, useEffect, useRef } from 'react';
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
  User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLibrary } from '../../context/LibraryContext';
import { TapResult } from '../../types';
import { soundManager } from '../../utils/audio';

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

  // Web NFC State for Smartphones (Android Chrome / Edge)
  const [isNfcSupported, setIsNfcSupported] = useState(false);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [nfcError, setNfcError] = useState<string | null>(null);
  const [lastNfcSerial, setLastNfcSerial] = useState<string | null>(null);
  const nfcAbortControllerRef = useRef<AbortController | null>(null);

  // Camera Scanner State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

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

  // Camera Barcode/QR Scanner start & stop
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);

      // Check for BarcodeDetector API
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8']
        });

        scanIntervalRef.current = window.setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const rawVal = barcodes[0].rawValue;
                if (rawVal) {
                  if (navigator.vibrate) navigator.vibrate(100);
                  executeTap(rawVal);
                  stopCamera();
                }
              }
            } catch (err) {
              // Ignore single frame detect errors
            }
          }
        }, 400);
      }
    } catch (err: any) {
      setCameraError('Tidak dapat membuka kamera. Pastikan izin kamera telah diberikan.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsCameraActive(false);
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

  // Handle countdown when result is displayed
  useEffect(() => {
    if (currentTapResult) {
      if (currentTapResult.type === 'success_out') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      }

      setCountdown(settings.auto_reset_seconds || 4);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      const startTime = Date.now();
      const totalDuration = (settings.auto_reset_seconds || 4) * 1000;

      countdownTimerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, Math.ceil((totalDuration - elapsed) / 1000));
        setCountdown(remaining);

        if (elapsed >= totalDuration) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          clearCurrentTapResult();
          setInputUid('');
          inputRef.current?.focus();
        }
      }, 200);

      return () => {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      };
    }
  }, [currentTapResult, settings.auto_reset_seconds, clearCurrentTapResult]);

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
        {/* Method Switcher Tabs (NFC / RFID vs Camera Barcode) */}
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
            <Camera className="w-4 h-4" />
            <span>Scan Kamera Barcode</span>
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
            /* CAMERA SCANNER VIEW (QR / BARCODE) */
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pemindai Barcode / QR Kartu</h3>
                </div>
                <button
                  onClick={() => setActiveMethod('nfc_rfid')}
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                >
                  Kembali ke NFC
                </button>
              </div>

              <div className="relative w-full aspect-4/3 bg-slate-900 rounded-xl overflow-hidden mb-4 border border-slate-800">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Aiming Reticle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-blue-400/80 rounded-xl relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1"></div>
                    <div className="w-full h-0.5 bg-blue-500/60 absolute top-1/2 -translate-y-1/2 animate-pulse"></div>
                  </div>
                </div>

                {!isCameraActive && !cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white p-4">
                    <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-xs text-slate-300">Menyiapkan Kamera...</p>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 text-white p-4">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
                    <p className="text-xs text-slate-200 text-center max-w-xs">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Coba Lagi
                    </button>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Arahkan kamera ke Barcode NIS atau QR Code pada kartu santri.
              </p>
            </div>
          )
        ) : (
          /* ACTIVE RESULT CARD (MASUK / KELUAR / ERROR) */
          <div className="w-full max-w-xl animate-in zoom-in-95 fade-in duration-300">
            {/* SUCCESS CHECK-IN */}
            {currentTapResult.type === 'success_in' && currentTapResult.student && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-emerald-300 dark:border-emerald-700 text-center relative overflow-hidden">
                {/* Progress bar countdown */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-200"
                    style={{ width: `${(countdown / (settings.auto_reset_seconds || 4)) * 100}%` }}
                  />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-3 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Absensi Masuk Berhasil
                </div>

                {/* Sound effect indicator pill */}
                {settings.sound_enabled && (
                  <div className="flex items-center justify-center gap-1.5 mb-3 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                    <span>Umpan Balik Suara: Bip Masuk Berbunyi (Dual-Tone Chime)</span>
                  </div>
                )}

                <h2 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight mb-4">
                  Selamat Datang!
                </h2>

                {/* Student Photo & Profile */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 mb-6 text-left">
                  {currentTapResult.student.photo_url && currentTapResult.student.photo_url.trim() !== '' ? (
                    <img
                      src={currentTapResult.student.photo_url}
                      alt={currentTapResult.student.name}
                      className="w-16 h-16 rounded-xl object-cover ring-2 ring-emerald-500/20"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 ring-2 ring-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                  <div className="text-center sm:text-left">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      {currentTapResult.student.name}
                    </h3>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        NIS: {currentTapResult.student.nis}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 text-xs font-bold">
                        Kelas {currentTapResult.student.class}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Check-in timestamp badge & WhatsApp status */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-6">
                  <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold text-sm border border-emerald-100 dark:border-emerald-800/60 w-full sm:w-auto">
                    <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Masuk: {currentTapResult.checkInTime}</span>
                  </div>
                  {settings.whatsapp?.enabled && settings.whatsapp?.notify_on_check_in && (
                    <div className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 w-full sm:w-auto">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Notifikasi WA Terkirim</span>
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

            {/* SUCCESS CHECK-OUT */}
            {currentTapResult.type === 'success_out' && currentTapResult.student && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-blue-300 dark:border-blue-700 text-center relative overflow-hidden">
                {/* Progress bar countdown */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-200"
                    style={{ width: `${(countdown / (settings.auto_reset_seconds || 4)) * 100}%` }}
                  />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wider mb-3 border border-blue-200 dark:border-blue-800">
                  <ArrowRightCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Absensi Keluar Berhasil
                </div>

                {/* Sound effect indicator pill */}
                {settings.sound_enabled && (
                  <div className="flex items-center justify-center gap-1.5 mb-3 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                    <span>Umpan Balik Suara: Bip Keluar Berbunyi (Harmoni Kunjungan)</span>
                  </div>
                )}

                <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 tracking-tight mb-4">
                  Sampai Jumpa!
                </h2>

                {/* Student Photo & Profile */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 mb-6 text-left">
                  {currentTapResult.student.photo_url && currentTapResult.student.photo_url.trim() !== '' ? (
                    <img
                      src={currentTapResult.student.photo_url}
                      alt={currentTapResult.student.name}
                      className="w-16 h-16 rounded-xl object-cover ring-2 ring-blue-500/20"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-blue-100 dark:bg-blue-950/60 ring-2 ring-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                  <div className="text-center sm:text-left">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      {currentTapResult.student.name}
                    </h3>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        NIS: {currentTapResult.student.nis}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 text-xs font-bold">
                        Kelas {currentTapResult.student.class}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats row: Check out & Duration */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Waktu Keluar</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">{currentTapResult.checkOutTime}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center">
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Durasi Kunjungan</p>
                    <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mt-0.5">{currentTapResult.durationText}</p>
                  </div>
                </div>

                {settings.whatsapp?.enabled && settings.whatsapp?.notify_on_check_out && (
                  <div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 mb-6">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Notifikasi Rekap Durasi WA Terkirim</span>
                  </div>
                )}

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
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-rose-300 dark:border-rose-700 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800">
                  <div 
                    className="h-full bg-rose-500 transition-all duration-200"
                    style={{ width: `${(countdown / (settings.auto_reset_seconds || 4)) * 100}%` }}
                  />
                </div>

                <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-100 dark:border-rose-800">
                  <XCircle className="w-8 h-8" />
                </div>

                {/* Sound effect indicator pill */}
                {settings.sound_enabled && (
                  <div className="flex items-center justify-center gap-1.5 mb-3 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                    <span>Umpan Balik Suara: Buzzer Peringatan Berbunyi (Akses Ditolak)</span>
                  </div>
                )}

                <h2 className="text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight mb-2">
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
              </div>
            )}
          </div>
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

