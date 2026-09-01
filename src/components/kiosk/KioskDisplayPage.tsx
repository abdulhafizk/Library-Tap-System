import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Tv, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Radio, 
  CheckCircle2, 
  LogOut, 
  Clock, 
  Users, 
  Sparkles, 
  BookOpen, 
  AlertCircle, 
  Flame, 
  ChevronRight, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  MessageSquare,
  Smartphone,
  Zap,
  Info,
  Check,
  User,
  Timer,
  Hourglass,
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLibrary } from '../../context/LibraryContext';
import { soundManager } from '../../utils/audio';

// Koleksi Mahfuzhat & Mutiara Hikmah Menuntut Ilmu untuk Pesantren
const ISLAMIC_QUOTES = [
  {
    arabic: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ',
    source: 'HR. Muslim',
    translation: 'Barangsiapa menempuh suatu jalan untuk mencari ilmu, maka Allah memudahkan jalannya menuju surga.'
  },
  {
    arabic: 'مَنْ جَدَّ وَجَدَ',
    source: 'Mahfuzhat',
    translation: 'Barangsiapa bersungguh-sungguh, dia pasti akan berhasil.'
  },
  {
    arabic: 'خَيْرُ جَلِيْسٍ فِي الزَّمَانِ كِتَابُ',
    source: 'Mahfuzhat',
    translation: 'Sebaik-baik teman duduk di setiap waktu adalah buku.'
  },
  {
    arabic: 'اَلْعِلْمُ بِلَا عَمَلٍ كَالشَّجَرِ بِلَا ثَمَرٍ',
    source: 'Mahfuzhat',
    translation: 'Ilmu tanpa amal bagaikan pohon tanpa buah.'
  },
  {
    arabic: 'اُطْلُبِ الْعِلْمَ مِنَ الْمَهْدِ إِلَى اللَّحْدِ',
    source: 'Nasihat Ulama',
    translation: 'Tuntutlah ilmu dari buaian hingga liang lahat.'
  },
  {
    arabic: 'اَلْوَقْتُ أَثْمَنُ مِنَ الذَّهَبِ',
    source: 'Mahfuzhat',
    translation: 'Waktu itu jauh lebih berharga daripada emas.'
  },
  {
    arabic: 'لَوْلَا الْعِلْمُ لَكَانَ النَّاسُ كَالْبَهَائِمِ',
    source: 'Imam Hasan Al-Bashri',
    translation: 'Kalaulah bukan karena ilmu, niscaya manusia itu seperti binatang ternak.'
  }
];

interface KioskDisplayPageProps {
  onExitKiosk?: () => void;
}

export const KioskDisplayPage: React.FC<KioskDisplayPageProps> = ({ onExitKiosk }) => {
  const { 
    settings, 
    visits, 
    students, 
    cards, 
    handleRfidTap, 
    currentTapResult, 
    clearCurrentTapResult,
    isProcessingTap,
    activeVisitsCount,
    todayVisitsCount
  } = useLibrary();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentHijriYear] = useState('1447 H');
  const [showSimPanel, setShowSimPanel] = useState(false);
  const [lastTappedTime, setLastTappedTime] = useState<Date | null>(null);

  // 5-Second Delay / Cooldown Configuration between Card Taps to prevent double taps
  const tapCooldownSecs = Math.max(1, settings.kiosk_tap_cooldown_seconds ?? settings.auto_reset_seconds ?? 5);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [cooldownTotalSecs, setCooldownTotalSecs] = useState<number>(tapCooldownSecs);
  const [cooldownNotice, setCooldownNotice] = useState<string | null>(null);
  const cooldownUntilRef = useRef<number>(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownNoticeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCoolingDown = cooldownRemaining > 0;

  // Web NFC State for Tablets/Smartphones with NFC
  const [isNfcSupported, setIsNfcSupported] = useState(false);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [nfcError, setNfcError] = useState<string | null>(null);
  const [lastScannedTag, setLastScannedTag] = useState<string | null>(null);
  const nfcAbortControllerRef = useRef<AbortController | null>(null);

  const keyBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dismiss popup and reset cooldown manually
  const dismissTapResult = useCallback(() => {
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
    setCooldownRemaining(0);
    cooldownUntilRef.current = 0;
    clearCurrentTapResult();
  }, [clearCurrentTapResult]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      if (cooldownNoticeTimerRef.current) clearTimeout(cooldownNoticeTimerRef.current);
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
    };
  }, []);

  // Update Clock & Date Every Second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: false 
        }) + ' WIB'
      );
      setCurrentDate(
        now.toLocaleDateString('id-ID', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rotate Islamic Mahfuzhat Quotes every 12 seconds
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setCurrentQuoteIndex(prev => (prev + 1) % ISLAMIC_QUOTES.length);
    }, 12000);
    return () => clearInterval(quoteInterval);
  }, []);

  // Check Open / Close status
  const isLibraryOpen = useMemo(() => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = (settings.open_time || '07:30').split(':').map(Number);
    const [closeH, closeM] = (settings.close_time || '17:00').split(':').map(Number);
    const openTotal = (openH || 7) * 60 + (openM || 30);
    const closeTotal = (closeH || 17) * 60 + (closeM || 0);

    return currentMins >= openTotal && currentMins <= closeTotal;
  }, [settings.open_time, settings.close_time]);

  // Capacity & Occupancy
  const maxCapacity = settings.capacity || 60;
  const occupancyPercent = Math.min(100, Math.round((activeVisitsCount / maxCapacity) * 100));

  // Trigger Tap & handle popup animation + Confetti + 5-second cooldown delay
  const triggerKioskTap = useCallback(async (uid: string) => {
    if (!uid) return;

    const now = Date.now();
    // Check if within 5-second cooldown or already processing another tap
    if (now < cooldownUntilRef.current || isProcessingTap) {
      const remainingSecs = Math.max(1, Math.ceil((cooldownUntilRef.current - now) / 1000));
      if (settings.sound_enabled) {
        soundManager.playErrorSound?.();
      }
      setCooldownNotice(`⏳ Jeda Pemindaian: Harap tunggu ${remainingSecs} detik untuk tap berikutnya.`);
      if (cooldownNoticeTimerRef.current) clearTimeout(cooldownNoticeTimerRef.current);
      cooldownNoticeTimerRef.current = setTimeout(() => {
        setCooldownNotice(null);
      }, 2200);
      return;
    }

    const durationSecs = Math.max(1, settings.kiosk_tap_cooldown_seconds ?? settings.auto_reset_seconds ?? 5);
    const cooldownMs = durationSecs * 1000;
    cooldownUntilRef.current = now + cooldownMs;
    setCooldownTotalSecs(durationSecs);
    setCooldownRemaining(durationSecs);
    setLastTappedTime(new Date());
    setLastScannedTag(uid);

    // Start 100ms smooth ticker for the countdown progress
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    let remainingMs = cooldownMs;
    let lastTick = Date.now();

    cooldownTimerRef.current = setInterval(() => {
      const currentNow = Date.now();
      const delta = currentNow - lastTick;
      lastTick = currentNow;
      remainingMs -= delta;
      const currentSecs = Math.max(0, Math.ceil(remainingMs / 1000));
      setCooldownRemaining(currentSecs);

      if (remainingMs <= 0) {
        if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
        setCooldownRemaining(0);
        cooldownUntilRef.current = 0;
        clearCurrentTapResult();
      }
    }, 100);

    const res = await handleRfidTap(uid);

    if (res.type === 'success_in') {
      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#6366f1']
        });
      } catch (err) {
        // ignore if canvas blocked
      }
    }
  }, [handleRfidTap, settings.kiosk_tap_cooldown_seconds, settings.auto_reset_seconds, settings.sound_enabled, isProcessingTap, clearCurrentTapResult]);

  // Global Hardware USB RFID / Barcode Scanner Listener on Kiosk Screen (Zero-Click Required)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is explicitly typing in a standard input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const now = Date.now();
      // If currently cooling down, ignore key buffer to prevent queued double taps
      if (now < cooldownUntilRef.current) {
        keyBufferRef.current = '';
        return;
      }

      // Hardware barcode/RFID scanners send characters in rapid bursts (< 45ms)
      if (now - lastKeyTimeRef.current > 120) {
        keyBufferRef.current = '';
      }
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        const scannedUid = keyBufferRef.current.trim();
        if (scannedUid.length >= 3) {
          triggerKioskTap(scannedUid);
        }
        keyBufferRef.current = '';
      } else if (e.key.length === 1) {
        keyBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerKioskTap]);

  // Automatic Web NFC Scanner initialization on mount (for Android / Tablet Kiosks)
  const startNfcScanning = useCallback(async () => {
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      setIsNfcSupported(false);
      return;
    }

    setIsNfcSupported(true);

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
        // Discard reading if within cooldown
        if (Date.now() < cooldownUntilRef.current) {
          return;
        }

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
                // fallback to serialNumber
              }
            }
          }
        }

        if (detectedUid) {
          triggerKioskTap(detectedUid);
        }
      });

      ndef.addEventListener('readingerror', () => {
        setNfcError('Gagal membaca kartu NFC. Pastikan kartu ditempelkan dengan stabil.');
      });
    } catch (err: any) {
      console.warn('NFC scanning error / prompt needed:', err);
      setIsNfcScanning(false);
      if (err.name === 'NotAllowedError') {
        setNfcError('Izin akses NFC diperlukan. Ketuk tombol aktifkan NFC di bawah.');
      } else {
        setNfcError('NFC belum aktif. Pastikan fitur NFC di pengaturan perangkat telah dinyalakan.');
      }
    }
  }, [triggerKioskTap]);

  // Attempt auto-start NFC on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setIsNfcSupported(true);
      startNfcScanning();
    }

    return () => {
      if (nfcAbortControllerRef.current) {
        nfcAbortControllerRef.current.abort();
      }
    };
  }, [startNfcScanning]);

  // Fullscreen Management
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          // Handled gracefully if iframe policy restricts native fullscreen
        });
      }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        // If browser exited fullscreen natively (e.g. via ESC key)
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [isFullscreen]);

  // Handle ESC key for in-app fullscreen mode
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isFullscreen]);

  // List of active visitors for live sidebar display
  const activeVisitorsList = useMemo(() => {
    const insideVisits = visits
      .filter(v => v.status === 'inside' && v.check_out === null)
      .sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime());

    return insideVisits.map(v => {
      const student = students.find(s => s.id === v.student_id);
      const checkInTime = new Date(v.check_in);
      const now = new Date();
      const durationMins = Math.max(1, Math.round((now.getTime() - checkInTime.getTime()) / (1000 * 60)));
      return {
        visit: v,
        student,
        timeFormatted: checkInTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        durationMins
      };
    });
  }, [visits, students]);

  const activeQuote = ISLAMIC_QUOTES[currentQuoteIndex];

  return (
    <div className={
      isFullscreen
        ? "fixed inset-0 z-[100] w-screen h-screen overflow-y-auto bg-slate-950 text-white flex flex-col selection:bg-blue-600 selection:text-white"
        : "relative min-h-[calc(100vh-5rem)] bg-slate-950 text-white rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-slate-800 selection:bg-blue-600 selection:text-white"
    }>
      {/* Dynamic Background Glows for TV Aesthetics */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-0"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -z-0"></div>

      {/* TOP TV HEADER */}
      <header className="relative z-10 p-4 sm:p-6 lg:p-8 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
        {/* Pesantren & Library Identity */}
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/30">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <span className="text-xs uppercase font-extrabold tracking-widest text-blue-400">
                {settings.institution_name || 'Pesantren Digital Modern'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-900/60 border border-blue-700/50 text-[10px] font-bold text-blue-300">
                KIOSK DISPLAY TV
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {settings.library_name || 'Perpustakaan Utama'}
            </h1>
          </div>
        </div>

        {/* Status Indicator & Live Digital Clock */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {/* Library Status Pill */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <div className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLibraryOpen ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isLibraryOpen ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Status Layanan</p>
              <p className={`text-xs font-black ${isLibraryOpen ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isLibraryOpen ? `BUKA (${settings.open_time} - ${settings.close_time})` : `TUTUP (Buka ${settings.open_time})`}
              </p>
            </div>
          </div>

          {/* Time & Date Display */}
          <div className="text-right px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/80 min-w-[180px]">
            <p className="text-xs text-slate-400 font-medium flex items-center justify-end gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{currentDate} • {currentHijriYear}</span>
            </p>
            <p className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white mt-0.5">
              {currentTime}
            </p>
          </div>

          {/* Kiosk Controls: Fullscreen & Sound & Demo Simulation Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Keluar Layar Penuh (ESC)' : 'Layar Penuh Display TV'}
              className={`p-3 rounded-xl border transition-colors cursor-pointer shadow-xs ${
                isFullscreen
                  ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400 ring-2 ring-blue-400/30 shadow-lg'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5 text-blue-400" />}
            </button>
            <button
              onClick={() => setShowSimPanel(prev => !prev)}
              title="Simulasi Tap Digital (Hanya untuk pengujian jika tidak ada kartu/reader fisik)"
              className={`px-3 py-2.5 rounded-xl border transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5 ${
                showSimPanel 
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md' 
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Simulasi Uji</span>
            </button>
            {onExitKiosk && (
              <button
                onClick={onExitKiosk}
                title="Keluar ke Dashboard"
                className="p-3 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800/60 transition-colors cursor-pointer text-xs font-bold"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* TRANSIENT COOLDOWN / NOTICE ALERT TOAST */}
      {cooldownNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="px-5 py-3 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm shadow-2xl flex items-center gap-2.5 border-2 border-amber-300">
            <Hourglass className="w-5 h-5 animate-spin text-slate-950" />
            <span>{cooldownNotice}</span>
          </div>
        </div>
      )}

      {/* QUICK SIMULATION DRAWER (OPTIONAL DEMO TESTING WITHOUT PHYSICAL CARD) */}
      {showSimPanel && (
        <div className="relative z-20 bg-slate-900 border-b border-amber-900/50 p-4 sm:p-6 animate-in slide-in-from-top duration-200">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Simulasi Digital (Pengujian Cepat)</h4>
                  <span className="px-2 py-0.5 rounded-md bg-amber-950 border border-amber-800 text-[10px] font-bold text-amber-300">
                    Khusus Demo Tanpa Kartu
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  <strong className="text-emerald-400">Otomatis Aktif:</strong> Jika menggunakan Reader USB, Barcode Scanner, atau NFC HP, <span className="text-white font-semibold">langsung tempelkan kartu kapan saja tanpa perlu klik tombol ini</span>.
                </p>
              </div>
            </div>

            {/* Quick Santri Chips */}
            <div className="flex flex-wrap items-center gap-2">
              {students.slice(0, 5).map(s => {
                const isInside = visits.some(v => v.student_id === s.id && v.status === 'inside' && v.check_out === null);
                return (
                  <button
                    key={s.id}
                    disabled={isCoolingDown}
                    onClick={() => triggerKioskTap(s.rfid_uid || s.nis)}
                    title={isCoolingDown ? `Jeda pemindai aktif (${cooldownRemaining}s)` : `Tap ${s.name}`}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                      isCoolingDown 
                        ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-400 border-slate-700' 
                        : isInside 
                          ? 'bg-rose-950/60 text-rose-300 border-rose-800 hover:bg-rose-900 cursor-pointer' 
                          : 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900 cursor-pointer'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    <span>{s.name.split(' ')[0]}</span>
                    <span className="text-[10px] opacity-75">({isInside ? 'Keluar' : 'Masuk'})</span>
                  </button>
                );
              })}
              {isCoolingDown && (
                <span className="text-[11px] font-mono font-bold text-amber-400 px-2 py-1 rounded-lg bg-amber-950/60 border border-amber-800 flex items-center gap-1.5 animate-pulse">
                  <Hourglass className="w-3.5 h-3.5 animate-spin" />
                  <span>Jeda {cooldownRemaining}s</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN KIOSK BODY (SPLIT INTO DUAL-HERO PANELS) */}
      <main className="flex-1 p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10">
        
        {/* LEFT COLUMN: INTERACTIVE WELCOME & REALTIME OCCUPANCY (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          
          {/* TOP METRIC ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Active Visitors */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Sedang di Ruangan</span>
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-white font-mono">{activeVisitsCount}</span>
                <span className="text-xs font-bold text-slate-400">Santri Aktif</span>
              </div>
            </div>

            {/* Total Today */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Kunjungan Hari Ini</span>
                <Flame className="w-5 h-5 text-amber-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-white font-mono">{todayVisitsCount}</span>
                <span className="text-xs font-bold text-slate-400">Santri Masuk</span>
              </div>
            </div>

            {/* Occupancy Meter */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Kapasitas Kursi</span>
                <span className="text-xs font-mono font-bold text-blue-400">{activeVisitsCount}/{maxCapacity}</span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xl font-black text-white">{occupancyPercent}%</span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {occupancyPercent >= 90 ? 'Hampir Penuh' : occupancyPercent >= 50 ? 'Sedang' : 'Tersedia'}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      occupancyPercent >= 90 ? 'bg-rose-500' : occupancyPercent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${occupancyPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CENTER HERO: THE INTERACTIVE TAP TARGET ZONE */}
          <div className="flex-1 min-h-[340px] rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-900/40 border border-slate-800/80 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
            
            {/* Background Radar Rings Animation */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className={`w-72 h-72 rounded-full border ${isCoolingDown ? 'border-amber-500 animate-pulse' : 'border-blue-500 animate-ping'}`}></div>
              <div className={`w-96 h-96 rounded-full border ${isCoolingDown ? 'border-amber-500/40' : 'border-emerald-500/40'} animate-pulse`}></div>
            </div>

            {/* Tap Icon Target with Live Active Glow / Cooldown Counter */}
            {isCoolingDown ? (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-600 via-orange-600 to-amber-500 flex flex-col items-center justify-center text-white shadow-2xl shadow-amber-500/30 ring-8 ring-amber-500/20 mb-5 relative animate-pulse">
                <span className="text-3xl sm:text-4xl font-black font-mono leading-none">{cooldownRemaining}</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-100 mt-1">Detik Jeda</span>
                <div className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 rounded-full p-1.5 shadow-md">
                  <Hourglass className="w-4 h-4 animate-spin" />
                </div>
              </div>
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 ring-8 ring-blue-500/20 mb-5 relative">
                <Radio className="w-12 h-12 sm:w-14 sm:h-14 animate-pulse" />
                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-md">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            )}

            {/* Live Sensor Status Pill with Cooldown Mode */}
            {isCoolingDown ? (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-bold mb-3 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>⏳ Jeda Pemindaian ({cooldownRemaining}s) • Menyiapkan Pembacaan Berikutnya</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold mb-3 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Sensor Otomatis Aktif — Langsung Tempelkan Kartu</span>
              </div>
            )}

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isCoolingDown ? 'Mohon Tunggu Sebentar...' : 'Tempelkan Kartu Santri di Sini'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-lg mt-2 font-normal leading-relaxed">
              {isCoolingDown ? (
                <>
                  Jeda <strong className="text-amber-300">{cooldownTotalSecs} detik</strong> diaktifkan untuk mencegah duplikasi tap. Pemindai otomatis siap kembali dalam <strong className="text-white font-mono">{cooldownRemaining} detik</strong>.
                </>
              ) : (
                <>
                  Dekatkan kartu <strong className="text-white">RFID</strong>, kartu <strong className="text-white">NFC</strong>, atau scan <strong className="text-white">QR Code</strong> pada alat pemindai untuk presensi masuk & keluar otomatis.
                </>
              )}
            </p>

            {/* Cooldown Visual Progress Bar */}
            {isCoolingDown && (
              <div className="w-full max-w-xs mt-4 bg-slate-800/90 rounded-full h-2 p-0.5 overflow-hidden border border-amber-500/30">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-100 ease-linear"
                  style={{ width: `${Math.max(0, Math.min(100, (1 - (cooldownRemaining / cooldownTotalSecs)) * 100))}%` }}
                />
              </div>
            )}

            {/* Hardware & Web NFC Detection Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] font-semibold text-slate-300">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>RFID USB Scanner (Siap 24/7)</span>
              </div>
              
              {isNfcSupported ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-800 text-[11px] font-semibold text-emerald-300">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isNfcScanning ? 'Web NFC Aktif & Mendengarkan' : 'NFC Siap Dihubungkan'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] font-semibold text-slate-400">
                  <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                  <span>NFC Reader / Barcode Siap</span>
                </div>
              )}
            </div>

            {/* NFC Prompt Button if Browser needs user gesture */}
            {isNfcSupported && !isNfcScanning && (
              <button
                onClick={startNfcScanning}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                <span>Aktifkan Izin Web NFC HP</span>
              </button>
            )}

            {/* Instruction Steps Badge */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-300">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Tap Masuk</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-300">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Membaca & Belajar</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-300">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                <span>Tap Keluar</span>
              </div>
            </div>
          </div>

          {/* BOTTOM ROTATING ISLAMIC WISDOM / MAHFUZHAT CARD */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/60 via-slate-900/90 to-indigo-950/60 border border-blue-900/40 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 text-xs font-bold uppercase tracking-wider text-blue-400">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Mutiara Hikmah & Mahfuzhat Hari Ini</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300">
                {activeQuote.source}
              </span>
            </div>
            
            <p className="text-xl sm:text-2xl font-bold font-serif text-amber-200 text-right leading-relaxed tracking-wide my-2">
              « {activeQuote.arabic} »
            </p>
            <p className="text-sm text-slate-300 italic mt-2 font-sans">
              "{activeQuote.translation}"
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE VISITORS FEED & RECENT ACTIVITY (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="flex-1 rounded-3xl bg-slate-900/90 border border-slate-800/80 p-6 flex flex-col shadow-xl overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <h3 className="font-extrabold text-white text-base">Santri di Dalam Ruangan</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
                {activeVisitsCount} Santri
              </span>
            </div>

            {/* Scrollable list of active santri */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1 max-h-[500px]">
              {activeVisitorsList.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-400" />
                  <p className="text-sm font-semibold">Belum Ada Santri di Dalam</p>
                  <p className="text-xs mt-1 text-slate-600">Santri yang tap masuk akan tampil langsung di daftar ini.</p>
                </div>
              ) : (
                activeVisitorsList.map(({ visit, student, timeFormatted, durationMins }) => (
                  <div
                    key={visit.id}
                    className="p-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between gap-3 transition-colors animate-in fade-in"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {student?.photo_url && student.photo_url.trim() !== '' ? (
                        <img
                          src={student.photo_url}
                          alt={student?.name}
                          className="w-11 h-11 rounded-xl object-cover border border-slate-600 shrink-0 bg-slate-700"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">{student?.name || 'Santri'}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span className="font-semibold text-blue-400">{student?.class || 'Santri'}</span>
                          <span>•</span>
                          <span className="font-mono text-[11px]">{student?.nis}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-1 text-xs font-semibold text-emerald-400">
                        <Clock className="w-3 h-3" />
                        <span>{timeFormatted}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {durationMins} mnt lalu
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Rules & Adab Footer */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span>📚 Harap menjaga ketenangan di perpustakaan</span>
              <span className="font-semibold text-emerald-400">Adab Thalabul 'Ilmi</span>
            </div>
          </div>
        </div>
      </main>

      {/* RUNNING TEXT TICKER (BOTTOM TV FOOTER) */}
      <footer className="relative z-10 bg-slate-900 border-t border-slate-800 py-2.5 px-6 flex items-center gap-4 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-black shrink-0 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Pengumuman</span>
        </div>
        
        {/* Continuous Marquee Ticker */}
        <div className="flex-1 overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee text-xs font-medium text-slate-300 space-x-12">
            <span>📖 Selamat Datang di Perpustakaan {settings.institution_name || 'Pesantren'}</span>
            <span>⏰ Jam Layanan: {settings.open_time} - {settings.close_time} WIB</span>
            <span>🏷️ Wajib tap kartu saat masuk dan keluar ruangan</span>
            <span>📱 Notifikasi kehadiran otomatis dikirimkan ke WhatsApp Wali Santri</span>
            <span>🤲 Jagalah ketenangan, kebersihan, dan kembalikan kitab/buku ke rak semula</span>
          </div>
        </div>
      </footer>

      {/* FULL-SCREEN REALTIME TAP OVERLAY POPUP (TRIGGERS ON CARD TAP) */}
      {currentTapResult && (
        <div 
          onClick={dismissTapResult}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-slate-900 rounded-3xl border-2 border-blue-500/50 shadow-2xl p-8 text-center relative overflow-hidden cursor-default"
          >
            
            {/* Background Glow */}
            <div className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-30 ${
              currentTapResult.type === 'success_in' ? 'bg-emerald-500' : currentTapResult.type === 'success_out' ? 'bg-blue-500' : 'bg-rose-500'
            }`} />
            
            {/* Top Modal Bar with Cooldown Countdown & Dismiss button */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-mono font-bold text-amber-400 shadow-xs">
                <Hourglass className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Siap tap berikutnya dalam {cooldownRemaining || 0}s</span>
              </div>

              <button
                onClick={dismissTapResult}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-xs"
              >
                <span>Tutup Sekarang (ESC)</span>
              </button>
            </div>

            {/* Countdown Progress Bar at top of popup */}
            <div className="w-full bg-slate-800/80 rounded-full h-1.5 mb-6 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${Math.max(0, Math.min(100, (1 - (cooldownRemaining / cooldownTotalSecs)) * 100))}%` }}
              />
            </div>

            {/* SUCCESS TAP IN */}
            {currentTapResult.type === 'success_in' && currentTapResult.student && (
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-sm border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>AHLAN WA SAHLAN • BERHASIL TAP MASUK</span>
                </div>

                <div className="relative inline-block mx-auto">
                  {currentTapResult.student.photo_url && currentTapResult.student.photo_url.trim() !== '' ? (
                    <img
                      src={currentTapResult.student.photo_url}
                      alt={currentTapResult.student.name}
                      className="w-32 h-32 rounded-3xl object-cover mx-auto ring-4 ring-emerald-400 shadow-2xl bg-slate-800"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-3xl mx-auto ring-4 ring-emerald-400 shadow-2xl bg-slate-800 flex items-center justify-center text-emerald-400">
                      <User className="w-16 h-16" />
                    </div>
                  )}
                  <div className="absolute -bottom-3 -right-3 bg-emerald-500 text-white p-2 rounded-2xl shadow-lg">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                <div>
                  <h3 className="text-3xl font-black text-white">{currentTapResult.student.name}</h3>
                  <p className="text-base text-emerald-400 font-bold mt-1">
                    Kelas {currentTapResult.student.class} • NIS: {currentTapResult.student.nis}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                    <p className="text-xs text-slate-400 font-medium">Waktu Masuk</p>
                    <p className="text-lg font-black text-white font-mono mt-0.5">{currentTapResult.checkInTime}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                    <p className="text-xs text-slate-400 font-medium">Status Santri</p>
                    <p className="text-lg font-black text-emerald-400 uppercase mt-0.5">Aktif</p>
                  </div>
                </div>

                {settings.whatsapp?.enabled && (
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-4 py-2 rounded-xl border border-emerald-800/50">
                    <MessageSquare className="w-4 h-4" />
                    <span>Notifikasi WhatsApp terkirim ke Wali / Admin</span>
                  </div>
                )}

                <p className="text-xs text-slate-400 italic">
                  "Selamat membaca dan menambah ilmu. Layar akan tertutup otomatis dalam beberapa detik."
                </p>
              </div>
            )}

            {/* SUCCESS TAP OUT */}
            {currentTapResult.type === 'success_out' && currentTapResult.student && (
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-400 font-extrabold text-sm border border-blue-500/30">
                  <LogOut className="w-4 h-4" />
                  <span>ILA AL-LIQA' • BERHASIL TAP KELUAR</span>
                </div>

                <div className="relative inline-block mx-auto">
                  {currentTapResult.student.photo_url && currentTapResult.student.photo_url.trim() !== '' ? (
                    <img
                      src={currentTapResult.student.photo_url}
                      alt={currentTapResult.student.name}
                      className="w-32 h-32 rounded-3xl object-cover mx-auto ring-4 ring-blue-400 shadow-2xl bg-slate-800"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-3xl mx-auto ring-4 ring-blue-400 shadow-2xl bg-slate-800 flex items-center justify-center text-blue-400">
                      <User className="w-16 h-16" />
                    </div>
                  )}
                  <div className="absolute -bottom-3 -right-3 bg-blue-500 text-white p-2 rounded-2xl shadow-lg">
                    <LogOut className="w-6 h-6" />
                  </div>
                </div>

                <div>
                  <h3 className="text-3xl font-black text-white">{currentTapResult.student.name}</h3>
                  <p className="text-base text-blue-400 font-bold mt-1">
                    Kelas {currentTapResult.student.class} • NIS: {currentTapResult.student.nis}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                    <p className="text-xs text-slate-400 font-medium">Waktu Keluar</p>
                    <p className="text-lg font-black text-white font-mono mt-0.5">{currentTapResult.checkOutTime}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                    <p className="text-xs text-slate-400 font-medium">Total Durasi Belajar</p>
                    <p className="text-lg font-black text-blue-400 mt-0.5">{currentTapResult.durationText}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 italic">
                  "Jazaakumullah khairan. Terima kasih telah menjaga ketertiban perpustakaan."
                </p>
              </div>
            )}

            {/* UNREGISTERED CARD / ERROR */}
            {(currentTapResult.type === 'unregistered_card' || currentTapResult.type === 'inactive_card') && (
              <div className="space-y-6">
                <div className="w-20 h-20 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto ring-4 ring-rose-500/30">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Kartu Tidak Dikenali</h3>
                  <p className="text-sm text-rose-400 font-semibold mt-2">{currentTapResult.message}</p>
                </div>
                <p className="text-xs text-slate-400">
                  Silakan hubungi petugas perpustakaan di meja piket untuk menghubungkan kartu RFID santri.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
