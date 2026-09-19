import React from 'react';
import { motion } from 'motion/react';
import { 
  Flame, 
  BookOpen, 
  Clock, 
  Calendar, 
  Trophy, 
  ChevronRight, 
  Sparkles, 
  Play, 
  TrendingUp,
  Award,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { SantriStreak, ReadingStreakConfig } from '../../types';
import { getNextMilestone, formatReadingDuration } from '../../utils/readingStreakUtils';

interface ReadingStreakCardProps {
  streak: SantriStreak;
  config: ReadingStreakConfig;
  onViewDetails?: () => void;
  onViewDetail?: () => void;
  onStartSession?: () => void; // Deprecated - kept for backwards compatibility
}

export const ReadingStreakCard: React.FC<ReadingStreakCardProps> = ({
  streak,
  config,
  onViewDetails,
  onViewDetail
}) => {
  const handleView = onViewDetails || onViewDetail;
  const { next, daysRemaining, progressPercent } = getNextMilestone(streak.current_streak, config.milestones);
  const isTargetTodayMet = streak.today_target_reached;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/80 border border-amber-500/30 text-white shadow-xl shadow-amber-950/20 p-6 sm:p-7">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar / Header */}
      <div className="flex items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/30">
            <Flame className="w-6 h-6 fill-slate-950 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-white tracking-tight">Reading Streak</h3>
              {streak.current_milestone && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  {streak.current_milestone}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Konsistensi muthola'ah santri</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                Presensi RFID &amp; Admin
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {handleView && (
            <button
              type="button"
              onClick={handleView}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer border border-slate-700/60 shadow-md flex items-center gap-1.5 active:scale-95"
              title="Lihat Halaman Detail Streak"
            >
              <span>Detail &amp; Kalender</span>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </button>
          )}
        </div>
      </div>

      {/* Central Streak Box (Duolingo / Islamic pesantren styled) */}
      <div className="relative z-10 mb-6 p-6 rounded-2xl bg-gradient-to-b from-slate-950/90 to-slate-900/90 border border-amber-500/30 text-center shadow-inner">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
          <span>Status Hari Ini</span>
        </div>

        <div className="flex items-baseline justify-center gap-2 my-2">
          <span className="text-6xl sm:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-orange-500 drop-shadow-md">
            {streak.current_streak}
          </span>
          <span className="text-xl sm:text-2xl font-bold text-slate-300">
            Hari
          </span>
        </div>

        <div className="text-sm font-semibold text-slate-300">
          Hari Berturut-turut
        </div>

        {/* Milestone Progress Bar */}
        {next ? (
          <div className="mt-5 max-w-md mx-auto space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-amber-300 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                🔥 {daysRemaining} hari lagi menuju {next.days} hari ({next.title})
              </span>
              <span className="font-mono font-bold text-slate-300">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 shadow-sm shadow-amber-400/50"
              />
            </div>
          </div>
        ) : (
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-amber-300 font-bold bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/40">
            <Trophy className="w-4 h-4" />
            <span>Pencapaian Maksimal! Kamu adalah Reading Master sejati.</span>
          </div>
        )}

        {/* Today status badge */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs">
          {isTargetTodayMet ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Target hari ini tercapai ({streak.today_reading_minutes} menit)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Hari ini: {streak.today_reading_minutes} / {config.daily_target_minutes} menit</span>
            </span>
          )}
        </div>
      </div>

      {/* 4 Companion Metrics Grid (Prompt Section 6) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Total Buku</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white">
            {streak.total_books_read} <span className="text-xs font-normal text-slate-400">Buku</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Waktu Membaca</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white truncate" title={formatReadingDuration(streak.total_reading_minutes)}>
            {formatReadingDuration(streak.total_reading_minutes)}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Hari Membaca</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white">
            {streak.total_reading_days} <span className="text-xs font-normal text-slate-400">Hari</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Trophy className="w-4 h-4 text-orange-400" />
            <span>Longest Streak</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-amber-300">
            {streak.longest_streak} <span className="text-xs font-normal text-slate-400">Hari</span>
          </div>
        </div>
      </div>
    </div>
  );
};
