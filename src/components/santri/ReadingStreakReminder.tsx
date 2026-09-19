import React from 'react';
import { motion } from 'motion/react';
import { Flame, CheckCircle2, ArrowRight, ShieldCheck, QrCode } from 'lucide-react';
import { SantriStreak, ReadingStreakConfig } from '../../types';

interface ReadingStreakReminderProps {
  streak: SantriStreak;
  config: ReadingStreakConfig;
  onOpenReadingSession?: () => void; // Deprecated - kept for compatibility
  onViewDetails?: () => void;
}

export const ReadingStreakReminder: React.FC<ReadingStreakReminderProps> = ({
  streak,
  config,
  onViewDetails
}) => {
  if (!config.enabled) return null;

  const targetMinutes = config.daily_target_minutes || 15;
  const todayMinutes = streak.today_reading_minutes;
  const isTargetReached = streak.today_target_reached;
  const remainingMinutes = Math.max(0, targetMinutes - todayMinutes);

  if (isTargetReached) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-teal-900/40 to-slate-900 border border-emerald-500/40 text-xs shadow-lg shadow-emerald-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="font-bold text-sm text-white flex items-center gap-2">
              <span>🔥 Streak Hari Ini Aman!</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                Target Tercapai
              </span>
            </div>
            <p className="text-emerald-200/90 text-xs mt-0.5">
              Alhamdulillah! Kamu telah terekam muthola'ah selama <strong className="text-white font-bold">{todayMinutes} menit</strong> hari ini (Target: {targetMinutes} menit). Konsistensi streak <strong className="text-emerald-300 font-bold">{streak.current_streak} hari</strong> terjaga melalui presensi perpustakaan!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {onViewDetails && (
            <button
              type="button"
              onClick={onViewDetails}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1"
            >
              <span>Detail &amp; Kalender</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // Not reached yet -> Friendly reminder regarding RFID tap & library attendance
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-orange-950/40 to-slate-900 border border-amber-500/40 text-xs shadow-lg shadow-amber-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
          <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
        </div>
        <div>
          <div className="font-bold text-sm text-white flex items-center gap-2">
            <span>📖 Pertahankan Streak Literasimu!</span>
            {streak.current_streak > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                🔥 {streak.current_streak} Hari Aktif
              </span>
            )}
          </div>
          <p className="text-amber-200/90 text-xs mt-0.5">
            {todayMinutes > 0 ? (
              <>
                Tercatat muthola'ah <strong className="text-white font-bold">{todayMinutes} menit</strong> hari ini. Tinggal <strong className="text-amber-300 font-bold">{remainingMinutes} menit lagi</strong> di perpustakaan untuk menjaga streak 🔥 <strong className="text-white font-bold">{streak.current_streak} hari</strong>!
              </>
            ) : (
              <>
                Kunjungi perpustakaan dan lakukan tap presensi RFID minimal <strong className="text-amber-300 font-bold">{targetMinutes} menit</strong> untuk mencatat streak muthola'ah harianmu secara resmi.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        {onViewDetails && (
          <button
            type="button"
            onClick={onViewDetails}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-md"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lihat Log &amp; Jadwal</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};
