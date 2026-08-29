import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  DoorOpen, 
  CalendarCheck, 
  BookOpenCheck, 
  Clock, 
  ArrowUpRight, 
  Radio, 
  CheckCircle2, 
  LogOut, 
  Sparkles, 
  ChevronRight,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Tv,
  Maximize2,
  BookOpen,
  AlertTriangle,
  Plus,
  Trophy,
  FileText,
  Printer
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { useLibrary } from '../../context/LibraryContext';
import { NavTab } from '../layout/Sidebar';
import { Student } from '../../types';
import { MonthlyReportModal } from '../visits/MonthlyReportModal';

interface DashboardPageProps {
  onNavigate: (tab: NavTab) => void;
  onSelectStudent?: (student: Student) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onSelectStudent }) => {
  const { 
    students, 
    visits, 
    activeVisitsCount, 
    todayVisitsCount, 
    monthVisitsCount, 
    averageDurationMinutes,
    activeLoansCount,
    overdueLoansCount,
    totalTitlesCount,
    settings,
    manualCheckOut,
    handleRfidTap
  } = useLibrary();

  const [quickScanUid, setQuickScanUid] = useState('');
  const [ticker, setTicker] = useState(Date.now());
  const [showMonthlyReportModal, setShowMonthlyReportModal] = useState(false);

  // Update ticker every second for live duration calculation
  useEffect(() => {
    const timer = setInterval(() => setTicker(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleQuickScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickScanUid.trim()) {
      handleRfidTap(quickScanUid);
      setQuickScanUid('');
      onNavigate('tap');
    }
  };

  // Helper student map
  const studentsMap = new Map<string, Student>(students.map(s => [s.id, s]));

  // Active visitors list (currently inside)
  const activeVisits = visits.filter(v => v.status === 'inside' && v.check_out === null);

  // Recent tap stream (sorted newest first)
  const recentVisits = [...visits].sort(
    (a, b) => new Date(b.check_out || b.check_in).getTime() - new Date(a.check_out || a.check_in).getTime()
  ).slice(0, 7);

  // Compute 7-day visits data for Recharts
  const chartData7Days = React.useMemo(() => {
    const days = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      
      const count = visits.filter(v => new Date(v.check_in).toDateString() === dateStr).length;
      days.push({ name: label, kunjungan: count });
    }
    return days;
  }, [visits]);

  // Compute visits by class
  const classBreakdownData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    visits.forEach(v => {
      const student = studentsMap.get(v.student_id);
      if (student) {
        counts[student.class] = (counts[student.class] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([cls, total]) => ({ class: cls, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [visits, studentsMap]);

  // Format live duration
  const getLiveDuration = (checkInIso: string) => {
    const diffSeconds = Math.max(0, Math.floor((ticker - new Date(checkInIso).getTime()) / 1000));
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;
    
    if (hours > 0) {
      return `${hours}j ${minutes}m ${seconds}d`;
    }
    return `${minutes}m ${seconds}d`;
  };

  const capacityPercentage = Math.min(100, Math.round((activeVisitsCount / (settings.capacity || 60)) * 100));

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
      {/* Top Banner Row: Kios TV, Sirkulasi Buku, & Penghargaan Santri */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Banner Mode Kios Display TV */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white border border-slate-800 shadow-md flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Display Signage
              </span>
              <h3 className="text-sm font-black text-white mt-1">
                Mode Kios Display TV
              </h3>
              <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">
                Layar penuh Smart TV untuk presensi live tap & sambutan selamat datang.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('kiosk')}
            className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Buka Kios TV</span>
          </button>
        </div>

        {/* Banner Sirkulasi Buku / Kitab */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-purple-950 to-slate-900 text-white border border-indigo-900/60 shadow-md flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Modul Sirkulasi
                </span>
                {overdueLoansCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/40">
                    {overdueLoansCount} Terlambat
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-white mt-1">
                Sirkulasi & Peminjaman
              </h3>
              <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">
                {activeLoansCount} buku dipinjam dari {totalTitlesCount} judul katalog kitab.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('circulation')}
            className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Buka Sirkulasi</span>
          </button>
        </div>

        {/* Banner Penghargaan & XP Santri */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-900 via-yellow-950 to-slate-900 text-white border border-amber-850 shadow-md flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/30 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Literacy Awards
              </span>
              <h3 className="text-sm font-black text-white mt-1">
                Penghargaan & XP Santri
              </h3>
              <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">
                Leaderboard pembaca terbaik, lencana prestasi & cetak piagam digital resmi.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('awards')}
            className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/30 transition-all cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Buka Peringkat & Piagam</span>
          </button>
        </div>
      </div>

      {/* 4 Clean Metric Cards */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          Ringkasan Operasional Perpustakaan
        </h2>
        <button
          type="button"
          onClick={() => setShowMonthlyReportModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Laporan Bulanan (PDF)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Total Santri */}
        <motion.div 
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          onClick={() => onNavigate('students')}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {students.filter(s => s.status === 'active').length} Aktif
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Santri</p>
          <h3 className="text-3xl font-bold mt-1 text-slate-900">{students.length}</h3>
        </motion.div>

        {/* Metric 2: Di Perpustakaan (Live) */}
        <motion.div 
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          onClick={() => onNavigate('live')}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
              <DoorOpen className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Aktif
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Di Perpustakaan</p>
          <h3 className="text-3xl font-bold mt-1 text-slate-900">{activeVisitsCount}</h3>
        </motion.div>

        {/* Metric 3: Kunjungan Hari Ini */}
        <motion.div 
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          onClick={() => onNavigate('visits')}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Hari Ini
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Kunjungan Hari Ini</p>
          <h3 className="text-3xl font-bold mt-1 text-slate-900">{todayVisitsCount}</h3>
        </motion.div>

        {/* Metric 4: Rata-rata Durasi */}
        <motion.div 
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          onClick={() => onNavigate('stats')}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Normal
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Rata-rata Durasi</p>
          <h3 className="text-3xl font-bold mt-1 text-slate-900">
            {averageDurationMinutes} <span className="text-base font-medium text-slate-400">mnt</span>
          </h3>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7 Days Visit Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Grafik Kunjungan 7 Hari Terakhir</h3>
              <p className="text-xs text-slate-400">Volume kunjungan santri harian</p>
            </div>
            <button
              onClick={() => onNavigate('stats')}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Lihat Statistik <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="kunjunganGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#60a5fa' }}
                />
                <Area type="monotone" dataKey="kunjungan" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#kunjunganGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Tap & Capacity Box */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-base">Terminal Tap Cepat</h3>
              <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Ketik atau scan UID kartu RFID untuk mencatat kehadiran santri seketika.
            </p>

            <form onSubmit={handleQuickScan} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={quickScanUid}
                  onChange={(e) => setQuickScanUid(e.target.value)}
                  placeholder="Ketik / Scan UID RFID..."
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-lg bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Proses Tap RFID
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all" 
                style={{ width: `${capacityPercentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
              <span>Kapasitas Perpus</span>
              <span>{activeVisitsCount} / {settings.capacity || 60}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Bottom: Riwayat Tap Terbaru & Sedang di Perpustakaan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Riwayat Tap Terbaru */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-slate-800">Riwayat Tap Terbaru</h4>
            <button 
              onClick={() => onNavigate('visits')}
              className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>

          {/* Table (Desktop & Tablet) */}
          <div className="hidden sm:block flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase text-[10px] font-bold tracking-widest sticky top-0">
                <tr>
                  <th className="px-6 py-3">Santri</th>
                  <th className="px-6 py-3">Waktu</th>
                  <th className="px-6 py-3">Tipe</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentVisits.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                      Belum ada riwayat tap hari ini.
                    </td>
                  </tr>
                ) : (
                  recentVisits.map((visit) => {
                    const student = studentsMap.get(visit.student_id);
                    const isOut = visit.check_out !== null;
                    const timeDisplay = isOut ? visit.check_out! : visit.check_in;

                    return (
                      <tr key={visit.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {student?.photo_url ? (
                              <img src={student.photo_url} alt={student.name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold">
                                {student?.name?.slice(0, 2).toUpperCase() || 'ST'}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{student?.name || 'Santri'}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">NIS: {student?.nis || '-'} • Kelas {student?.class || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300 font-mono">
                          {new Date(timeDisplay).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="px-6 py-4">
                          {isOut ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 uppercase tracking-tight">
                              Keluar
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 uppercase tracking-tight">
                              Masuk
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Berhasil
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Cards List (Mobile Smartphone View) */}
          <div className="sm:hidden p-3 space-y-2.5">
            {recentVisits.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Belum ada riwayat tap hari ini.
              </div>
            ) : (
              recentVisits.map((visit) => {
                const student = studentsMap.get(visit.student_id);
                const isOut = visit.check_out !== null;
                const timeDisplay = isOut ? visit.check_out! : visit.check_in;

                return (
                  <div key={`mobile-recent-${visit.id}`} className="flex items-center justify-between p-2.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      {student?.photo_url ? (
                        <img src={student.photo_url} alt={student.name} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
                          {student?.name?.slice(0, 2).toUpperCase() || 'ST'}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{student?.name || 'Santri'}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Kelas {student?.class || '-'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {isOut ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 uppercase tracking-tight">
                          Keluar
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 uppercase tracking-tight">
                          Masuk
                        </span>
                      )}
                      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                        {new Date(timeDisplay).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right (1 col): Sedang di Perpustakaan */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-slate-800">Sedang di Perpustakaan</h4>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {activeVisits.length}
            </span>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto flex-1 max-h-[380px]">
            {activeVisits.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-1">
                <DoorOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium">Perpustakaan kosong</p>
                <p className="text-[10px] text-slate-400">Santri yang tap masuk akan muncul di sini.</p>
              </div>
            ) : (
              activeVisits.map((visit) => {
                const student = studentsMap.get(visit.student_id);
                if (!student) return null;

                const liveDuration = getLiveDuration(visit.check_in);

                return (
                  <div key={visit.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <img 
                        src={student.photo_url} 
                        alt={student.name} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-2xs" 
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{student.name}</p>
                        <p className="text-[10px] text-slate-500">Kelas {student.class}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">
                        Sejak {new Date(visit.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">{liveDuration}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-slate-100">
            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all"
                style={{ width: `${capacityPercentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
              <span>Kapasitas Perpus</span>
              <span>{activeVisitsCount} / {settings.capacity || 60}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Report PDF Modal */}
      <MonthlyReportModal
        isOpen={showMonthlyReportModal}
        onClose={() => setShowMonthlyReportModal(false)}
      />
    </div>
  );
};
