import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  Clock, 
  BookOpen, 
  Sparkles, 
  Flame, 
  FileText, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Book, BookLoan, Student } from '../../types';
import { getJakartaDateString, formatJakartaTime } from '../../utils/readingStreakUtils';

interface ReadingSessionModalProps {
  isOpen: boolean;
  student: Student;
  availableLoans: BookLoan[];
  catalogBooks: Book[];
  dailyTargetMinutes: number;
  onClose: () => void;
  onSubmitActivity: (activityData: {
    santri_id: string;
    student_name: string;
    student_nis: string;
    book_id?: string;
    book_title: string;
    duration_minutes: number;
    start_time?: string;
    end_time?: string;
    date?: string;
    notes?: string;
  }) => Promise<{ success: boolean; message: string; isNewStreakDay?: boolean; unlockedMilestone?: string; newStreak?: number }>;
  onMilestoneUnlocked?: (milestoneTitle: string, streak: number) => void;
}

export const ReadingSessionModal: React.FC<ReadingSessionModalProps> = ({
  isOpen,
  student,
  availableLoans,
  catalogBooks,
  dailyTargetMinutes,
  onClose,
  onSubmitActivity,
  onMilestoneUnlocked
}) => {
  const [tab, setTab] = useState<'timer' | 'manual'>('timer');
  const [selectedBookType, setSelectedBookType] = useState<'loan' | 'catalog' | 'custom'>('custom');
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [customBookTitle, setCustomBookTitle] = useState('');
  const [notes, setNotes] = useState('');
  
  // Timer State
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [startTimeIso, setStartTimeIso] = useState<string | null>(null);
  const timerRef = useRef<any>(null);

  // Manual input state
  const [manualMinutes, setManualMinutes] = useState(dailyTargetMinutes);
  const [manualDate, setManualDate] = useState(() => getJakartaDateString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Timer interval
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  if (!isOpen) return null;

  const handleStartTimer = () => {
    if (!startTimeIso) {
      setStartTimeIso(new Date().toISOString());
    }
    setIsTimerRunning(true);
    setErrorMsg('');
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setSecondsElapsed(0);
    setStartTimeIso(null);
  };

  const formatStopwatch = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Resolve book title and ID
  const getBookDetails = (): { id?: string; title: string } => {
    if (selectedBookType === 'loan' && selectedLoanId) {
      const loan = availableLoans.find(l => l.id === selectedLoanId);
      return { id: loan?.book_id, title: loan?.book_title || 'Buku Pinjaman' };
    }
    if (selectedBookType === 'catalog' && selectedCatalogId) {
      const book = catalogBooks.find(b => b.id === selectedCatalogId);
      return { id: book?.id, title: book?.title || 'Buku Katalog' };
    }
    return { title: customBookTitle.trim() || 'Muthola\'ah Kitab Mandiri' };
  };

  const handleFinishAndSave = async () => {
    const durationMinutes = tab === 'timer' 
      ? Math.max(1, Math.round(secondsElapsed / 60)) 
      : Number(manualMinutes);

    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      setErrorMsg('Durasi membaca minimal 1 menit.');
      return;
    }

    if (durationMinutes > 600) {
      setErrorMsg('Durasi membaca maksimal 600 menit (10 jam) per sesi.');
      return;
    }

    const { id: bookId, title: bookTitle } = getBookDetails();

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const now = new Date();
      const res = await onSubmitActivity({
        santri_id: student.id,
        student_name: student.name,
        student_nis: student.nis,
        book_id: bookId,
        book_title: bookTitle,
        duration_minutes: durationMinutes,
        start_time: startTimeIso ? formatJakartaTime(startTimeIso) : undefined,
        end_time: formatJakartaTime(now),
        date: tab === 'manual' ? manualDate : getJakartaDateString(),
        notes: notes.trim() || undefined
      });

      if (res.unlockedMilestone && onMilestoneUnlocked) {
        onMilestoneUnlocked(res.unlockedMilestone, res.newStreak || 1);
      }

      handleResetTimer();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan sesi membaca.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Catat Sesi Membaca (Reading Session)
                </h3>
                <p className="text-xs text-slate-400">
                  Target harian santri: <span className="text-amber-300 font-semibold">{dailyTargetMinutes} menit / hari</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 my-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => setTab('timer')}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                tab === 'timer'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Live Stopwatch</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('manual')}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                tab === 'manual'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Input Manual Durasi</span>
            </button>
          </div>

          {/* Book Selection Section */}
          <div className="space-y-3 mb-5">
            <label className="block text-xs font-semibold text-slate-300">
              Pilih Kitab / Buku yang Dibaca:
            </label>

            <div className="flex gap-2 text-xs">
              {availableLoans.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedBookType('loan')}
                  className={`px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                    selectedBookType === 'loan'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Pinjaman Saya ({availableLoans.length})
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedBookType('catalog')}
                className={`px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                  selectedBookType === 'catalog'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Katalog
              </button>

              <button
                type="button"
                onClick={() => setSelectedBookType('custom')}
                className={`px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                  selectedBookType === 'custom'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Ketik Judul Sendiri
              </button>
            </div>

            {selectedBookType === 'loan' && (
              <select
                value={selectedLoanId}
                onChange={(e) => setSelectedLoanId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Pilih Buku Sedang Dipinjam --</option>
                {availableLoans.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.book_title} (Kode: {l.book_code})
                  </option>
                ))}
              </select>
            )}

            {selectedBookType === 'catalog' && (
              <select
                value={selectedCatalogId}
                onChange={(e) => setSelectedCatalogId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Pilih Buku dari Katalog Perpustakaan --</option>
                {catalogBooks.slice(0, 30).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} - {b.author || 'Pondok'}
                  </option>
                ))}
              </select>
            )}

            {selectedBookType === 'custom' && (
              <input
                type="text"
                placeholder="Contoh: Riyadhus Shalihin Bab Niat / Tafsir Jalalain"
                value={customBookTitle}
                onChange={(e) => setCustomBookTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            )}
          </div>

          {/* Mode Body */}
          {tab === 'timer' ? (
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4">
              <div className="text-4xl sm:text-5xl font-mono font-black text-amber-400 tracking-wider">
                {formatStopwatch(secondsElapsed)}
              </div>

              <div className="text-xs text-slate-400">
                {secondsElapsed >= dailyTargetMinutes * 60 ? (
                  <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Target harian ({dailyTargetMinutes}m) telah tercapai!
                  </span>
                ) : (
                  <span>
                    Membaca{' '}
                    <strong className="text-white">
                      {Math.max(1, Math.round(secondsElapsed / 60))} menit
                    </strong>{' '}
                    (Target: {dailyTargetMinutes}m)
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                {!isTimerRunning ? (
                  <button
                    type="button"
                    onClick={handleStartTimer}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-all cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>{secondsElapsed > 0 ? 'Lanjutkan' : 'Mulai Membaca'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePauseTimer}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm transition-all cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <Pause className="w-4 h-4 fill-slate-950" />
                    <span>Jeda</span>
                  </button>
                )}

                {secondsElapsed > 0 && (
                  <button
                    type="button"
                    onClick={handleResetTimer}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Reset Stopwatch"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Durasi Membaca (Menit):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="600"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-32 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold font-mono focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-xs text-slate-400">Menit</span>
                  {manualMinutes >= dailyTargetMinutes ? (
                    <span className="ml-auto text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Mencapai Target Harian
                    </span>
                  ) : (
                    <span className="ml-auto text-xs text-amber-400 font-semibold">
                      Belum Capai Target ({dailyTargetMinutes}m)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tanggal Aktivitas:
                </label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Notes input */}
          <div className="my-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Catatan / Bab yang Dibaca (Opsional):
            </label>
            <input
              type="text"
              placeholder="Contoh: Membaca Bab 2 tentang Adab Penuntut Ilmu"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSubmitting || (tab === 'timer' && secondsElapsed < 10)}
              onClick={handleFinishAndSave}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-950/40 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Selesai & Simpan Sesi Membaca</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
