import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Flame, 
  Sparkles, 
  BookOpen, 
  Clock, 
  Calendar, 
  Trophy, 
  Play, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Crown, 
  Medal, 
  Award, 
  BookOpenCheck,
  ChevronRight,
  RefreshCw,
  Plus,
  ShieldCheck
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { Student, ReadingActivity } from '../../types';
import { 
  calculateSantriStreak, 
  generateCalendarContributions, 
  formatReadingDuration, 
  formatJakartaFullDate, 
  DEFAULT_STREAK_MILESTONES 
} from '../../utils/readingStreakUtils';
import { ReadingActivityCalendar } from './ReadingActivityCalendar';
import { ReadingStreakReminder } from './ReadingStreakReminder';
import { ReadingMilestoneModal } from './ReadingMilestoneModal';

interface SantriReadingStreakPageProps {
  currentStudent: Student;
  onNavigateTab?: (menuKey: any) => void;
}

export const SantriReadingStreakPage: React.FC<SantriReadingStreakPageProps> = ({
  currentStudent,
  onNavigateTab
}) => {
  const { 
    readingActivities, 
    settings, 
    books, 
    loans, 
    getSantriStreak 
  } = useLibrary();

  const [celebrationMilestone, setCelebrationMilestone] = useState<{ milestone: any; streak: number } | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'reached' | 'partial'>('all');

  const streakConfig = settings.reading_streak || {
    enabled: true,
    daily_target_minutes: 15,
    milestones: DEFAULT_STREAK_MILESTONES
  };

  const streak = useMemo(() => {
    return getSantriStreak 
      ? getSantriStreak(currentStudent.id) 
      : calculateSantriStreak(currentStudent.id, readingActivities, streakConfig);
  }, [currentStudent.id, readingActivities, streakConfig, getSantriStreak]);

  const contributions = useMemo(() => {
    return generateCalendarContributions(
      readingActivities,
      currentStudent.id,
      streakConfig.daily_target_minutes,
      90
    );
  }, [readingActivities, currentStudent.id, streakConfig.daily_target_minutes]);

  // Santri active loans for book selector
  const studentLoans = useMemo(() => {
    return loans.filter(l => l.student_id === currentStudent.id && l.status === 'borrowed');
  }, [loans, currentStudent.id]);

  // Filtered santri activities
  const santriActivities = useMemo(() => {
    return readingActivities
      .filter(a => a.santri_id === currentStudent.id)
      .sort((a, b) => new Date(b.date + 'T' + (b.start_time || '00:00')).getTime() - new Date(a.date + 'T' + (a.start_time || '00:00')).getTime());
  }, [readingActivities, currentStudent.id]);

  const filteredActivities = useMemo(() => {
    return santriActivities.filter(a => {
      const matchSearch = !historySearch || 
        (a.book_title && a.book_title.toLowerCase().includes(historySearch.toLowerCase())) ||
        (a.notes && a.notes.toLowerCase().includes(historySearch.toLowerCase())) ||
        a.date.includes(historySearch);

      if (!matchSearch) return false;

      if (historyFilter === 'reached') return a.duration_minutes >= streakConfig.daily_target_minutes;
      if (historyFilter === 'partial') return a.duration_minutes < streakConfig.daily_target_minutes;
      return true;
    });
  }, [santriActivities, historySearch, historyFilter, streakConfig.daily_target_minutes]);

  const handleMilestoneUnlock = (milestoneTitle: string, streakCount: number) => {
    const ms = streakConfig.milestones.find(m => m.title === milestoneTitle);
    if (ms) {
      setCelebrationMilestone({ milestone: ms, streak: streakCount });
    }
  };

  const renderBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Crown':
        return <Crown className="w-6 h-6 text-amber-300" />;
      case 'Medal':
        return <Medal className="w-6 h-6 text-amber-300" />;
      case 'Award':
        return <Award className="w-6 h-6 text-amber-300" />;
      case 'BookOpenCheck':
        return <BookOpenCheck className="w-6 h-6 text-emerald-300" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-teal-300" />;
      default:
        return <Flame className="w-6 h-6 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/70 to-slate-900 border border-amber-500/30 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 fill-amber-300" />
              <span>Budaya Muthola'ah &amp; Literasi Santri</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Reading Streak Santri
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pantau konsistensi membaca harianmu. Setiap hari membaca minimal{' '}
              <strong className="text-amber-300 font-bold">{streakConfig.daily_target_minutes} menit</strong>{' '}
              menambah +1 streak dan membuka lencana kehormatan pembaca istiqamah.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-inner">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Data Otomatis Terverifikasi</span>
            </div>
            <p className="text-[11px] text-slate-400 text-left sm:text-right max-w-xs">
              Streak terekam dari presensi tap RFID perpustakaan &amp; verifikasi resmi petugas.
            </p>
          </div>
        </div>
      </div>

      {/* Daily Status & Urgent Reminder Banner */}
      <ReadingStreakReminder
        streak={streak}
        config={streakConfig}
      />

      {/* 4 Big Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Streak */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-amber-500/40 relative overflow-hidden shadow-lg shadow-slate-950/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Current Streak</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Flame className="w-5 h-5 fill-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-amber-400 tracking-tight">{streak.current_streak}</span>
            <span className="text-sm font-semibold text-slate-300">Hari</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {streak.today_target_reached ? '✓ Target hari ini telah terpenuhi' : 'Belum mencapai target hari ini'}
          </p>
        </div>

        {/* Longest Streak */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden shadow-lg shadow-slate-950/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Longest Streak</span>
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white tracking-tight">{streak.longest_streak}</span>
            <span className="text-sm font-semibold text-slate-300">Hari</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Rekor istiqomah terlama yang pernah diraih
          </p>
        </div>

        {/* Total Reading Days */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden shadow-lg shadow-slate-950/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Total Hari Membaca</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-emerald-400 tracking-tight">{streak.total_reading_days}</span>
            <span className="text-sm font-semibold text-slate-300">Hari</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Hari dengan durasi ≥ {streakConfig.daily_target_minutes} menit
          </p>
        </div>

        {/* Total Reading Time */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden shadow-lg shadow-slate-950/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Total Waktu Membaca</span>
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-teal-300 tracking-tight truncate">
              {formatReadingDuration(streak.total_reading_minutes)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {streak.total_books_read} kitab / buku pernah dipelajari
          </p>
        </div>
      </div>

      {/* GitHub-style Activity Calendar */}
      <ReadingActivityCalendar
        contributions={contributions}
        targetMinutes={streakConfig.daily_target_minutes}
      />

      {/* Milestone & Achievement Badges Showcase */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">
                Pencapaian Milestone Reading Streak
              </h4>
              <p className="text-xs text-slate-400">
                Lencana kehormatan yang terbuka otomatis saat streak mencapai target hari berturut-turut.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {streakConfig.milestones.map((ms) => {
            const isUnlocked = streak.longest_streak >= ms.days || streak.current_streak >= ms.days;
            return (
              <div
                key={ms.days}
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 border-amber-500/50 shadow-md shadow-amber-950/20'
                    : 'bg-slate-950/40 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isUnlocked
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                  >
                    {renderBadgeIcon(ms.badgeIcon)}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white truncate">{ms.title}</span>
                      {isUnlocked && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-xs font-mono font-semibold text-amber-400">
                      🔥 {ms.days} Hari Berturut-turut
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                      {ms.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reading History Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Riwayat Aktivitas Membaca (Reading History)</span>
            </h4>
            <p className="text-xs text-slate-400">
              Daftar sesi membaca, presensi perpustakaan, dan muthola'ah mandiri
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Cari buku / tanggal..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-44"
              />
            </div>

            {/* Filter */}
            <div className="flex rounded-xl bg-slate-950 p-0.5 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setHistoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  historyFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua ({santriActivities.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('reached')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  historyFilter === 'reached' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tercapai
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('partial')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  historyFilter === 'partial' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Belum Capai
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Kitab / Buku</th>
                <th className="py-3 px-4">Waktu &amp; Catatan</th>
                <th className="py-3 px-4">Durasi</th>
                <th className="py-3 px-4">Status Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Belum ada riwayat aktivitas membaca yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act) => {
                  const isReached = act.duration_minutes >= streakConfig.daily_target_minutes;
                  return (
                    <tr key={act.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-medium text-white whitespace-nowrap">
                        {formatJakartaFullDate(act.date)}
                        {act.start_time && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {act.start_time} {act.end_time ? `- ${act.end_time}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white max-w-xs truncate">
                          {act.book_title || 'Muthola\'ah di Perpustakaan'}
                        </div>
                        {act.visit_id ? (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                            <CheckCircle2 className="w-3 h-3 text-teal-400" />
                            Presensi RFID Perpustakaan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                            <ShieldCheck className="w-3 h-3 text-sky-400" />
                            Verifikasi Petugas
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                        {act.notes || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                        {act.duration_minutes} Menit
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isReached ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>✓ Target Tercapai</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>&lt; {streakConfig.daily_target_minutes} Menit</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Celebration Modal */}
      <ReadingMilestoneModal
        isOpen={Boolean(celebrationMilestone)}
        milestone={celebrationMilestone?.milestone || null}
        streakDays={celebrationMilestone?.streak || 0}
        onClose={() => setCelebrationMilestone(null)}
      />
    </div>
  );
};
