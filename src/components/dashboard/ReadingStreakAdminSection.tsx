import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Users, 
  Trophy, 
  Clock, 
  Calendar, 
  Settings, 
  BookOpen, 
  TrendingUp, 
  Search, 
  Sliders, 
  Check, 
  X, 
  RefreshCw, 
  Sparkles, 
  Database, 
  Copy,
  ChevronRight,
  BookOpenCheck,
  Plus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Student, ReadingStreakConfig, SantriStreak, ReadingActivity } from '../../types';
import { useLibrary } from '../../context/LibraryContext';
import { 
  calculateSantriStreak, 
  formatReadingDuration, 
  getJakartaDateString, 
  formatJakartaFullDate,
  SUPABASE_READING_STREAK_SQL 
} from '../../utils/readingStreakUtils';

interface ReadingStreakAdminSectionProps {
  onSelectStudent?: (student: Student) => void;
}

export const ReadingStreakAdminSection: React.FC<ReadingStreakAdminSectionProps> = ({
  onSelectStudent
}) => {
  const { 
    students, 
    readingActivities, 
    settings, 
    books,
    addReadingActivity,
    deleteReadingActivity,
    updateReadingStreakConfig, 
    rebuildSantriStreaks,
    pushNotification 
  } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'rankings' | 'all_logs'>('rankings');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Admin record session form state
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [sessionBookTitle, setSessionBookTitle] = useState('');
  const [sessionDuration, setSessionDuration] = useState<number>(30);
  const [sessionDate, setSessionDate] = useState(getJakartaDateString());
  const [sessionNotes, setSessionNotes] = useState("Muthola'ah Terverifikasi Petugas");
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);

  // Local form state for config modal
  const streakConfig = settings.reading_streak || {
    enabled: true,
    daily_target_minutes: 15,
    milestones: []
  };

  const [formEnabled, setFormEnabled] = useState(streakConfig.enabled);
  const [formTargetMinutes, setFormTargetMinutes] = useState(streakConfig.daily_target_minutes || 15);

  // Compute streaks for all students
  const studentStreaks = useMemo(() => {
    return students.map((student) => {
      const streak = calculateSantriStreak(student.id, readingActivities, streakConfig);
      return {
        student,
        streak
      };
    });
  }, [students, readingActivities, streakConfig]);

  // Aggregate stats
  const activeStreaksList = useMemo(() => {
    return studentStreaks
      .filter(item => item.streak.current_streak > 0)
      .sort((a, b) => b.streak.current_streak - a.streak.current_streak);
  }, [studentStreaks]);

  const stats = useMemo(() => {
    const totalSantriWithActivity = studentStreaks.filter(s => s.streak.total_reading_minutes > 0).length;
    const totalWithActiveStreak = activeStreaksList.length;
    const avgStreak = totalWithActiveStreak > 0
      ? Math.round(activeStreaksList.reduce((sum, s) => sum + s.streak.current_streak, 0) / totalWithActiveStreak)
      : 0;

    const longestActive = activeStreaksList.length > 0 ? activeStreaksList[0].streak.current_streak : 0;
    
    // Total reading minutes this month
    const currentYearMonth = getJakartaDateString().slice(0, 7); // YYYY-MM
    const monthMinutes = readingActivities
      .filter(a => a.date.startsWith(currentYearMonth))
      .reduce((sum, a) => sum + (a.duration_minutes || 0), 0);

    return {
      totalSantriAktifMembaca: totalSantriWithActivity,
      santriDenganStreakAktif: totalWithActiveStreak,
      rataRataStreak: avgStreak,
      longestActiveStreak: longestActive,
      totalWaktuBulanIniMinutes: monthMinutes
    };
  }, [studentStreaks, activeStreaksList, readingActivities]);

  // Filtered active list for table
  const filteredActiveStreaks = useMemo(() => {
    return activeStreaksList.filter(item => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return item.student.name.toLowerCase().includes(q) ||
        item.student.nis.toLowerCase().includes(q) ||
        (item.student.class_grade && item.student.class_grade.toLowerCase().includes(q));
    });
  }, [activeStreaksList, searchQuery]);

  // All activities log filtered
  const filteredAllActivities = useMemo(() => {
    return [...readingActivities]
      .sort((a, b) => new Date(b.date + 'T' + (b.start_time || '00:00')).getTime() - new Date(a.date + 'T' + (a.start_time || '00:00')).getTime())
      .filter(a => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const sName = a.santri_name || a.student_name || '';
        const sNis = a.santri_nis || a.student_nis || '';
        return sName.toLowerCase().includes(q) ||
          sNis.toLowerCase().includes(q) ||
          (a.book_title && a.book_title.toLowerCase().includes(q)) ||
          (a.notes && a.notes.toLowerCase().includes(q)) ||
          a.date.includes(q);
      });
  }, [readingActivities, searchQuery]);

  const handleSaveConfig = () => {
    if (updateReadingStreakConfig) {
      updateReadingStreakConfig({
        enabled: formEnabled,
        daily_target_minutes: Math.max(1, Number(formTargetMinutes) || 15)
      });
      pushNotification('Pengaturan Disimpan', 'Target dan konfigurasi Reading Streak berhasil diperbarui.', 'success');
    }
    setIsConfigModalOpen(false);
  };

  const handleRebuild = () => {
    if (rebuildSantriStreaks) {
      rebuildSantriStreaks();
      pushNotification('Streak Dihitung Ulang', 'Seluruh data streak berhasil dihitung ulang dari rekam aktivitas.', 'info');
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_READING_STREAK_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCreateAdminSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      pushNotification('Pilih Santri', 'Silakan pilih santri terlebih dahulu.', 'warning');
      return;
    }
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) {
      pushNotification('Santri Tidak Ditemukan', 'Data santri tidak valid.', 'error');
      return;
    }
    if (sessionDuration <= 0) {
      pushNotification('Durasi Tidak Valid', 'Durasi membaca minimal 1 menit.', 'warning');
      return;
    }

    setIsSubmittingSession(true);
    try {
      if (addReadingActivity) {
        await addReadingActivity({
          santri_id: student.id,
          santri_name: student.name,
          student_name: student.name,
          santri_nis: student.nis,
          student_nis: student.nis,
          date: sessionDate || getJakartaDateString(),
          duration_minutes: sessionDuration,
          book_title: sessionBookTitle.trim() || 'Muthola\'ah Terverifikasi Petugas',
          notes: sessionNotes.trim() || 'Verifikasi langsung oleh pengampu perpustakaan',
          start_time: '16:00',
          end_time: '16:30'
        });
      }

      pushNotification(
        'Sesi Berhasil Diverifikasi', 
        `Muthola'ah ${sessionDuration} menit untuk ${student.name} berhasil dicatat & masuk ke reading streak.`, 
        'success'
      );
      setIsRecordModalOpen(false);
      setSessionBookTitle('');
      setSessionDuration(30);
    } catch (err: any) {
      pushNotification('Gagal Menyimpan', err?.message || 'Terjadi kesalahan saat menyimpan sesi baca.', 'error');
    } finally {
      setIsSubmittingSession(false);
    }
  };

  const handleDeleteActivity = async (activity: ReadingActivity) => {
    const studentName = activity.santri_name || activity.student_name || 'Santri';
    if (window.confirm(`Hapus sesi membaca "${activity.book_title || 'Muthola\'ah'}" milik ${studentName} (${activity.duration_minutes} menit) pada tanggal ${formatJakartaFullDate(activity.date)}? Tindakan ini akan memperbarui streak santri secara otomatis.`)) {
      if (deleteReadingActivity) {
        await deleteReadingActivity(activity.id);
        pushNotification('Sesi Dihapus', 'Sesi membaca berhasil dihapus dan streak diperbarui.', 'info');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
            <Flame className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Reading Streak Analytics &amp; Verifikasi Admin
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                Target: {streakConfig.daily_target_minutes} Menit/Hari
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pusat data otoritatif reading streak santri berbasis tap presensi RFID perpustakaan dan verifikasi petugas
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Utama: Catat / Verifikasi Sesi Baca oleh Admin */}
          <button
            type="button"
            onClick={() => {
              if (students.length > 0) {
                setSelectedStudentId(students[0].id);
              }
              setSessionBookTitle('');
              setSessionDuration(30);
              setSessionDate(getJakartaDateString());
              setSessionNotes("Muthola'ah Terverifikasi Petugas");
              setIsRecordModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-950/40 flex items-center gap-1.5 active:scale-95"
          >
            <BookOpenCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Catat / Verifikasi Sesi</span>
          </button>

          <button
            type="button"
            onClick={handleRebuild}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Hitung ulang seluruh streak dari data aktivitas"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden md:inline">Rebuild Streak</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSqlModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Lihat Struktur SQL Supabase"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Skema SQL</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFormEnabled(streakConfig.enabled);
              setFormTargetMinutes(streakConfig.daily_target_minutes || 15);
              setIsConfigModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md shadow-amber-950/40 flex items-center gap-1.5 active:scale-95"
          >
            <Sliders className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Konfigurasi Target</span>
          </button>
        </div>
      </div>

      {/* 5 Analytics Cards (Prompt Section 12) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Santri Aktif Membaca</span>
          </div>
          <div className="text-2xl font-black text-white">
            {stats.totalSantriAktifMembaca} <span className="text-xs font-normal text-slate-400">Santri</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Pernah mencatat sesi</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Streak Aktif</span>
          </div>
          <div className="text-2xl font-black text-amber-400">
            {stats.santriDenganStreakAktif} <span className="text-xs font-normal text-slate-400">Santri</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Streak &gt; 0 hari</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Rata-rata Streak</span>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {stats.rataRataStreak} <span className="text-xs font-normal text-slate-400">Hari</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Di antara santri aktif</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Trophy className="w-4 h-4 text-orange-400" />
            <span>Longest Active Streak</span>
          </div>
          <div className="text-2xl font-black text-amber-300 flex items-center gap-1">
            <span>🔥 {stats.longestActiveStreak}</span>
            <span className="text-xs font-normal text-slate-400">Hari</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Rekor santri saat ini</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Clock className="w-4 h-4 text-teal-400" />
            <span>Waktu Bulan Ini</span>
          </div>
          <div className="text-xl font-black text-teal-300 truncate" title={formatReadingDuration(stats.totalWaktuBulanIniMinutes)}>
            {formatReadingDuration(stats.totalWaktuBulanIniMinutes)}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Agregat seluruh santri</p>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('rankings')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'rankings'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Peringkat &amp; Streak Santri ({activeStreaksList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all_logs')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'all_logs'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BookOpenCheck className="w-4 h-4" />
          <span>Log Sesi Membaca Seluruh Santri ({readingActivities.length})</span>
        </button>
      </div>

      {activeTab === 'rankings' ? (
        /* Active Reading Streak Table (Prompt Section 12) */
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Santri dengan Reading Streak Aktif</span>
              </h4>
              <p className="text-xs text-slate-400">
                Daftar santri yang konsisten membaca buku dan kitab berturut-turut
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Cari santri / NIS / kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Nama Santri</th>
                  <th className="py-3 px-4">Kelas / Asrama</th>
                  <th className="py-3 px-4">Current Streak</th>
                  <th className="py-3 px-4">Longest Streak</th>
                  <th className="py-3 px-4">Total Buku</th>
                  <th className="py-3 px-4">Total Waktu Membaca</th>
                  <th className="py-3 px-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                {filteredActiveStreaks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      {searchQuery ? 'Tidak ada santri yang cocok dengan pencarian.' : 'Belum ada santri dengan reading streak aktif.'}
                    </td>
                  </tr>
                ) : (
                  filteredActiveStreaks.map(({ student, streak }) => (
                    <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{student.name}</span>
                          {streak.current_milestone && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30">
                              {streak.current_milestone}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          NIS: {student.nis}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {student.class_grade || '-'} {student.dormitory ? `(${student.dormitory})` : ''}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-sm font-black text-amber-400">
                          🔥 {streak.current_streak} Hari
                        </span>
                        {streak.today_target_reached && (
                          <span className="ml-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            Hari ini ✓
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">
                        {streak.longest_streak} Hari
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-semibold">
                        {streak.total_books_read} Buku
                      </td>
                      <td className="py-3 px-4 font-mono text-teal-300 font-semibold whitespace-nowrap">
                        {formatReadingDuration(streak.total_reading_minutes)}
                      </td>
                      <td className="py-3 px-4">
                        {onSelectStudent && (
                          <button
                            type="button"
                            onClick={() => onSelectStudent(student)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span>Detail</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Log Sesi Membaca Seluruh Santri Table */
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <BookOpenCheck className="w-4 h-4 text-emerald-400" />
                <span>Seluruh Riwayat Sesi Baca Santri</span>
              </h4>
              <p className="text-xs text-slate-400">
                Daftar semua log aktivitas membaca yang tercatat dari tap RFID maupun verifikasi manual petugas
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Cari santri / buku / tanggal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tanggal &amp; Waktu</th>
                  <th className="py-3 px-4">Nama Santri</th>
                  <th className="py-3 px-4">Kitab / Buku</th>
                  <th className="py-3 px-4">Durasi</th>
                  <th className="py-3 px-4">Sumber Verifikasi</th>
                  <th className="py-3 px-4">Catatan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                {filteredAllActivities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      {searchQuery ? 'Tidak ada sesi baca yang sesuai pencarian.' : 'Belum ada data sesi membaca santri.'}
                    </td>
                  </tr>
                ) : (
                  filteredAllActivities.map((act) => (
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
                        <div className="font-bold text-white">{act.santri_name || act.student_name || 'Santri'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">NIS: {act.santri_nis || act.student_nis || '-'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white max-w-xs truncate">
                          {act.book_title || 'Muthola\'ah di Perpustakaan'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                        {act.duration_minutes} Menit
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {act.visit_id ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-teal-400" />
                            Presensi RFID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 font-semibold">
                            <ShieldCheck className="w-3 h-3 text-sky-400" />
                            Verifikasi Petugas
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                        {act.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(act)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer border border-rose-500/20"
                          title="Hapus sesi ini (koreksi data)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Target & Milestone Configuration Modal */}
      <AnimatePresence>
        {isConfigModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <h4 className="text-base font-bold text-white">
                    Konfigurasi Reading Streak
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Enable / Disable toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <div>
                    <div className="font-bold text-white">Status Fitur Streak</div>
                    <div className="text-slate-400 text-[11px]">Aktifkan pencatatan streak santri</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formEnabled}
                    onChange={(e) => setFormEnabled(e.target.checked)}
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                {/* Target Minutes */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target Membaca Harian (Menit):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={formTargetMinutes}
                      onChange={(e) => setFormTargetMinutes(Math.max(1, parseInt(e.target.value) || 15))}
                      className="w-32 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-bold font-mono focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-slate-400">Menit / Hari (Default: 15 menit)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Santri mendapatkan +1 streak jika durasi kumulatif pada satu tanggal mencapai atau melebihi target ini.
                  </p>
                </div>

                {/* Milestones Info */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Daftar Milestone Standar (6 Jenjang)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                    <div>🔥 3 Hari: "Mulai Konsisten"</div>
                    <div>🔥 7 Hari: "Pembaca Konsisten"</div>
                    <div>🔥 14 Hari: "Pembaca Rajin"</div>
                    <div>🔥 30 Hari: "Pembaca Aktif"</div>
                    <div>🔥 60 Hari: "Pembaca Istiqamah"</div>
                    <div>🔥 100 Hari: "Reading Master"</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-950/50"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Simpan Pengaturan</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Supabase SQL Schema Modal */}
      <AnimatePresence>
        {isSqlModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-base font-bold text-white">
                    Skema SQL Supabase: Reading Streak
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSqlModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Jalankan script SQL ini di Supabase SQL Editor untuk memisahkan tabel kunjungan perpustakaan (attendance), aktivitas membaca (reading_activities), rekap harian (reading_daily_summaries), dan snapshot streak.
              </p>

              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-72 scrollbar-thin">
                  {SUPABASE_READING_STREAK_SQL}
                </pre>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsSqlModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Record / Verify Reading Session Modal */}
      <AnimatePresence>
        {isRecordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <BookOpenCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">
                      Catat &amp; Verifikasi Sesi Membaca
                    </h4>
                    <p className="text-xs text-slate-400">
                      Entri resmi pengampu perpustakaan untuk menambah streak santri
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateAdminSession} className="space-y-4">
                {/* 1. Pilih Santri */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Pilih Santri <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="" disabled>-- Pilih Santri --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} - NIS: {s.nis} ({s.class_grade || 'Santri'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Tanggal Sesi & Durasi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Tanggal Sesi
                    </label>
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Durasi (Menit) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={sessionDuration}
                      onChange={(e) => setSessionDuration(Math.max(1, parseInt(e.target.value) || 15))}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold font-mono"
                    />
                  </div>
                </div>

                {/* Quick Chips for Duration */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 mr-1">Preset Menit:</span>
                  {[15, 30, 45, 60, 90].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSessionDuration(m)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                        sessionDuration === m
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                  <span className="text-[10px] text-emerald-400 ml-auto font-medium">
                    (Target: ≥{streakConfig.daily_target_minutes}m)
                  </span>
                </div>

                {/* 3. Judul Kitab / Buku */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kitab / Buku / Aktivitas
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Fathul Qorib, Tafsir Jalalain, Muthola'ah Kitab..."
                    value={sessionBookTitle}
                    onChange={(e) => setSessionBookTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    {["Fathul Qorib", "Tafsir Jalalain", "Safinatun Najah", "Muthola'ah Perpustakaan"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setSessionBookTitle(preset)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Catatan / Verifikator */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Catatan Verifikasi / Tempat
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Halaqah Maghrib / Pengampu Ustadz..."
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsRecordModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSession}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950/50 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{isSubmittingSession ? 'Menyimpan...' : 'Simpan & Verifikasi Sesi'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
