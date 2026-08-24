import React, { useMemo, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Trophy, 
  Award, 
  Calendar, 
  Users, 
  BookOpen, 
  Sparkles,
  Flame,
  Medal,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  RotateCcw,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  GraduationCap,
  FileText,
  Printer
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { useLibrary } from '../../context/LibraryContext';
import { Student, LibraryVisit } from '../../types';
import { exportStudentStatsToExcel, StudentStatRow } from '../../utils/exportExcel';
import { MonthlyReportModal } from '../visits/MonthlyReportModal';

type SortField = 'totalTime' | 'frequency' | 'avgDuration' | 'lastVisit' | 'name' | 'class';
type SortOrder = 'desc' | 'asc';

export const StatsPage: React.FC = () => {
  const { visits, students, averageDurationMinutes } = useLibrary();

  const [timeRange, setTimeRange] = useState<'7days' | '30days'>('7days');

  // Table filter and sort states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<'all' | 'L' | 'P'>('all');
  const [selectedActivity, setSelectedActivity] = useState<'all' | 'Sangat Aktif' | 'Aktif' | 'Pasif' | 'Belum Pernah'>('all');
  const [selectedPresence, setSelectedPresence] = useState<'all' | 'inside' | 'outside'>('all');
  const [sortField, setSortField] = useState<SortField>('totalTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [showMonthlyReportModal, setShowMonthlyReportModal] = useState<boolean>(false);

  // Modal for individual student history inspection
  const [inspectStudent, setInspectStudent] = useState<Student | null>(null);

  const studentsMap = useMemo(() => new Map<string, Student>(students.map(s => [s.id, s])), [students]);

  // Unique classes list for filter dropdown
  const uniqueClasses = useMemo(() => {
    const classSet = new Set<string>();
    students.forEach(s => {
      if (s.class) classSet.add(s.class);
    });
    return Array.from(classSet).sort();
  }, [students]);

  // Currently active inside student IDs
  const insideStudentIds = useMemo(() => {
    const set = new Set<string>();
    visits.filter(v => v.status === 'inside').forEach(v => set.add(v.student_id));
    return set;
  }, [visits]);

  // 1. Visits per day chart
  const dailyChartData = useMemo(() => {
    const daysCount = timeRange === '7days' ? 7 : 30;
    const result = [];
    const now = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const label = d.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: timeRange === '30days' ? 'numeric' : 'short' 
      });

      const dayVisits = visits.filter(v => new Date(v.check_in).toDateString() === dateStr);
      const totalMinutes = dayVisits.reduce((acc, v) => acc + (v.duration_minutes || 0), 0);
      const avgMins = dayVisits.length > 0 ? Math.round(totalMinutes / dayVisits.length) : 0;

      result.push({
        date: label,
        kunjungan: dayVisits.length,
        rataRataDurasi: avgMins
      });
    }

    return result;
  }, [visits, timeRange]);

  // 2. Visits by hour of day (Peak hours distribution)
  const hourlyPeakData = useMemo(() => {
    const hoursCount: Record<number, number> = {
      7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0
    };

    visits.forEach(v => {
      const h = new Date(v.check_in).getHours();
      if (hoursCount[h] !== undefined) {
        hoursCount[h]++;
      }
    });

    return Object.entries(hoursCount).map(([hour, count]) => ({
      hour: `${hour}:00`,
      kunjungan: count
    }));
  }, [visits]);

  // 3. Top Classes
  const topClassesData = useMemo(() => {
    const map: Record<string, number> = {};
    visits.forEach(v => {
      const student = studentsMap.get(v.student_id);
      if (student) {
        map[student.class] = (map[student.class] || 0) + 1;
      }
    });

    return Object.entries(map)
      .map(([className, total]) => ({ name: `Kelas ${className}`, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [visits, studentsMap]);

  // 4. Aggregated stats for ALL students
  const allStudentStats = useMemo<StudentStatRow[]>(() => {
    // Map of studentId -> list of visits
    const studentVisitsMap = new Map<string, LibraryVisit[]>();
    students.forEach(s => studentVisitsMap.set(s.id, []));

    visits.forEach(v => {
      const existing = studentVisitsMap.get(v.student_id);
      if (existing) {
        existing.push(v);
      } else {
        studentVisitsMap.set(v.student_id, [v]);
      }
    });

    return students.map(student => {
      const studentVisits = studentVisitsMap.get(student.id) || [];
      const visitCount = studentVisits.length;
      
      let totalMinutes = 0;
      let lastVisitDate: string | null = null;

      studentVisits.forEach(v => {
        totalMinutes += (v.duration_minutes !== null ? v.duration_minutes : 30);
        if (!lastVisitDate || new Date(v.check_in).getTime() > new Date(lastVisitDate).getTime()) {
          lastVisitDate = v.check_in;
        }
      });

      const avgMinutes = visitCount > 0 ? Math.round(totalMinutes / visitCount) : 0;

      let activityLevel: 'Sangat Aktif' | 'Aktif' | 'Pasif' | 'Belum Pernah' = 'Belum Pernah';
      if (visitCount >= 5) {
        activityLevel = 'Sangat Aktif';
      } else if (visitCount >= 2) {
        activityLevel = 'Aktif';
      } else if (visitCount === 1) {
        activityLevel = 'Pasif';
      }

      const isInsideNow = insideStudentIds.has(student.id);

      return {
        student,
        visitCount,
        totalMinutes,
        avgMinutes,
        lastVisitDate,
        activityLevel,
        isInsideNow
      };
    });
  }, [students, visits, insideStudentIds]);

  // Max visits count among all students (for progress bar percentage)
  const maxVisitCount = useMemo(() => {
    return Math.max(1, ...allStudentStats.map(s => s.visitCount));
  }, [allStudentStats]);

  // Top frequent students for quick leaderboard
  const topFrequentStudents = useMemo(() => {
    return [...allStudentStats]
      .filter(s => s.visitCount > 0)
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, 10);
  }, [allStudentStats]);

  // Total cumulative hours across all students
  const totalCumulativeHours = useMemo(() => {
    const totalMinutes = visits.reduce((sum, v) => sum + (v.duration_minutes || 30), 0);
    return Math.round((totalMinutes / 60) * 10) / 10;
  }, [visits]);

  // 5. Filtered and sorted student stats list
  const filteredAndSortedStats = useMemo(() => {
    let result = allStudentStats.filter(row => {
      // Search term (name or NIS)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = row.student.name.toLowerCase().includes(query);
        const matchNis = row.student.nis.toLowerCase().includes(query);
        if (!matchName && !matchNis) return false;
      }

      // Class filter
      if (selectedClass !== 'all' && row.student.class !== selectedClass) {
        return false;
      }

      // Gender filter
      if (selectedGender !== 'all' && row.student.gender !== selectedGender) {
        return false;
      }

      // Activity level filter
      if (selectedActivity !== 'all' && row.activityLevel !== selectedActivity) {
        return false;
      }

      // Current presence filter
      if (selectedPresence === 'inside' && !row.isInsideNow) return false;
      if (selectedPresence === 'outside' && row.isInsideNow) return false;

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'totalTime':
          comparison = a.totalMinutes - b.totalMinutes;
          break;
        case 'frequency':
          comparison = a.visitCount - b.visitCount;
          break;
        case 'avgDuration':
          comparison = a.avgMinutes - b.avgMinutes;
          break;
        case 'lastVisit':
          const timeA = a.lastVisitDate ? new Date(a.lastVisitDate).getTime() : 0;
          const timeB = b.lastVisitDate ? new Date(b.lastVisitDate).getTime() : 0;
          comparison = timeA - timeB;
          break;
        case 'name':
          comparison = a.student.name.localeCompare(b.student.name);
          break;
        case 'class':
          comparison = a.student.class.localeCompare(b.student.class);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [allStudentStats, searchTerm, selectedClass, selectedGender, selectedActivity, selectedPresence, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredAndSortedStats.length / pageSize) || 1;
  const paginatedStats = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedStats.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedStats, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedClass('all');
    setSelectedGender('all');
    setSelectedActivity('all');
    setSelectedPresence('all');
    setSortField('totalTime');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Inspect student visits
  const studentVisitHistory = useMemo(() => {
    if (!inspectStudent) return [];
    return visits
      .filter(v => v.student_id === inspectStudent.id)
      .sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime());
  }, [inspectStudent, visits]);

  const formatDurationText = (minutes: number) => {
    if (minutes <= 0) return '0 mnt';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}j ${m}m`;
    if (h > 0) return `${h} jam`;
    return `${m} mnt`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Statistik & Analitik Kunjungan
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Laporan visual kebiasaan membaca santri, waktu puncak perpustakaan, dan rekapitulasi data lengkap.
          </p>
        </div>

        {/* Actions header */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-stats-monthly-pdf"
            onClick={() => setShowMonthlyReportModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Laporan Bulanan (PDF)</span>
          </button>

          {/* Time range switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setTimeRange('7days')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeRange === '7days' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              7 Hari Terakhir
            </button>
            <button
              onClick={() => setTimeRange('30days')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeRange === '30days' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              30 Hari Terakhir
            </button>
          </div>
        </div>
      </div>

      {/* Main Highlights KPI Banner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/50">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Kunjungan</span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{visits.length}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Sesi tercatat</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/50">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rata-Rata Durasi</span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{averageDurationMinutes} mnt</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">~{(averageDurationMinutes / 60).toFixed(1)} jam per kunjungan</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Jam Baca</span>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{totalCumulativeHours} jam</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">Kumulatif seluruh santri</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/50">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Santri Teraktif</span>
            <p className="text-base font-bold text-slate-900 dark:text-white truncate mt-0.5 max-w-[150px]">
              {topFrequentStudents[0]?.student?.name || '-'}
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
              {topFrequentStudents[0]?.visitCount || 0}x kunjungan
            </p>
          </div>
        </div>
      </div>

      {/* Chart Row 1: Daily Visits Trend & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Visits Trend (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Tren Jumlah Kunjungan Santri</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Volume kunjungan harian perpustakaan</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="kunjungan" name="Kunjungan" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#trendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours Histogram (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Waktu Kunjungan Teramai (Jam)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Distribusi jam masuk santri ke perpustakaan</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyPeakData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="kunjungan" name="Santri Masuk" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Top Classes & Leaderboard Quick View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Classes Ranking */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base mb-1">Kelas dengan Kunjungan Terbanyak</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Peringkat keaktifan santri per rombel</p>

            <div className="space-y-3">
              {topClassesData.map((item, idx) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">
                      {idx + 1}. {item.name}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{item.total} Kunjungan</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (item.total / (topClassesData[0]?.total || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 text-center mt-4">
            Tercatat dari total {visits.length} sesi kunjungan
          </div>
        </div>

        {/* Leaderboard: Santri Paling Rajin (Top 10) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Top 10 Santri Paling Sering Berkunjung</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Santri dengan intensitas membaca tertinggi</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3 text-center">Rank</th>
                  <th className="py-2.5 px-3">Santri</th>
                  <th className="py-2.5 px-3">Kelas</th>
                  <th className="py-2.5 px-3 text-center">Frekuensi</th>
                  <th className="py-2.5 px-3 text-right">Total Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {topFrequentStudents.map((item, idx) => {
                  return (
                    <tr key={item.student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3 text-center font-bold">
                        {idx === 0 ? <span className="text-base">🥇</span> :
                         idx === 1 ? <span className="text-base">🥈</span> :
                         idx === 2 ? <span className="text-base">🥉</span> :
                         <span className="text-slate-400">#{idx + 1}</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <img src={item.student.photo_url} alt={item.student.name} className="w-7 h-7 rounded-lg object-cover bg-slate-200 dark:bg-slate-700" />
                          <span className="font-bold text-slate-900 dark:text-white">{item.student.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                          {item.student.class}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                          {item.visitCount}x
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {formatDurationText(item.totalMinutes)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: REKAPITULASI & ANALITIK LENGKAP KUNJUNGAN SELURUH SANTRI */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Rekapitulasi & Analitik Kunjungan Seluruh Santri
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Tabel lengkap akumulasi kunjungan setiap santri dengan fitur filter, pengurutan, dan ekspor.
              </p>
            </div>
          </div>

          {/* Export to Excel & Reset button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportStudentStatsToExcel(filteredAndSortedStats)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Rekap Excel</span>
            </button>

            <button
              onClick={handleResetFilters}
              title="Reset Semua Filter & Pencarian"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Multi-Filter & Search Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Box (4 cols) */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama santri atau NIS..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
          </div>

          {/* Filter Kelas (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={selectedClass}
              onChange={e => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Semua Kelas</option>
              {uniqueClasses.map(c => (
                <option key={c} value={c}>Kelas {c}</option>
              ))}
            </select>
          </div>

          {/* Filter Jenis Kelamin (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={selectedGender}
              onChange={e => {
                setSelectedGender(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Semua Gender</option>
              <option value="L">Santri Putra (L)</option>
              <option value="P">Santri Putri (P)</option>
            </select>
          </div>

          {/* Filter Tingkat Keaktifan (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={selectedActivity}
              onChange={e => {
                setSelectedActivity(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Semua Keaktifan</option>
              <option value="Sangat Aktif">Sangat Aktif (≥5x)</option>
              <option value="Aktif">Aktif (2-4x)</option>
              <option value="Pasif">Pasif (1x)</option>
              <option value="Belum Pernah">Belum Pernah (0x)</option>
            </select>
          </div>

          {/* Filter Sedang di Dalam (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={selectedPresence}
              onChange={e => {
                setSelectedPresence(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Semua Status Lokasi</option>
              <option value="inside">🟢 Sedang di Dalam</option>
              <option value="outside">Di Luar Perpustakaan</option>
            </select>
          </div>
        </div>

        {/* Quick Sorting Toolbar Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold text-[11px] uppercase mr-1">Urutkan:</span>
            
            <button
              onClick={() => handleSort('totalTime')}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                sortField === 'totalTime'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Total Waktu</span>
              {sortField === 'totalTime' && (
                sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={() => handleSort('frequency')}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                sortField === 'frequency'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Frekuensi (Jumlah Sesi)</span>
              {sortField === 'frequency' && (
                sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={() => handleSort('avgDuration')}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                sortField === 'avgDuration'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Rata-Rata Durasi</span>
              {sortField === 'avgDuration' && (
                sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={() => handleSort('lastVisit')}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                sortField === 'lastVisit'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Kunjungan Terakhir</span>
              {sortField === 'lastVisit' && (
                sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={() => handleSort('name')}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                sortField === 'name'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Nama (A-Z)</span>
              {sortField === 'name' && (
                sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Menampilkan <strong className="text-slate-900 dark:text-white font-bold">{filteredAndSortedStats.length}</strong> santri
          </div>
        </div>

        {/* STATS TABLE */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3.5 text-center w-12">No</th>
                <th className="py-3 px-4 cursor-pointer select-none" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1.5">
                    <span>Santri</span>
                    {sortField === 'name' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>
                <th className="py-3 px-3 text-center cursor-pointer select-none" onClick={() => handleSort('class')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Kelas</span>
                    {sortField === 'class' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>
                <th className="py-3 px-4 text-center cursor-pointer select-none" onClick={() => handleSort('frequency')}>
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Frekuensi Kunjungan</span>
                    {sortField === 'frequency' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('totalTime')}>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Total Waktu</span>
                    {sortField === 'totalTime' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('avgDuration')}>
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Rata-Rata</span>
                    {sortField === 'avgDuration' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>
                <th className="py-3 px-4 text-center cursor-pointer select-none" onClick={() => handleSort('lastVisit')}>
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Kunjungan Terakhir</span>
                    {sortField === 'lastVisit' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Status & Keaktifan</th>
                <th className="py-3 px-3.5 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {paginatedStats.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <HelpCircle className="w-8 h-8 opacity-40" />
                      <p className="font-semibold text-sm">Tidak ada data santri yang cocok dengan filter</p>
                      <button
                        onClick={handleResetFilters}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer mt-1"
                      >
                        Reset Filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedStats.map((item, idx) => {
                  const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                  const visitPercentage = Math.min(100, Math.round((item.visitCount / maxVisitCount) * 100));

                  return (
                    <tr 
                      key={item.student.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* 1. Index / Rank */}
                      <td className="py-3 px-3.5 text-center font-mono font-medium text-slate-400">
                        {globalIndex}
                      </td>

                      {/* 2. Student Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.student.photo_url}
                            alt={item.student.name}
                            className="w-8 h-8 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {item.student.name}
                              </span>
                              {item.isInsideNow && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Di Dalam
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              NIS: {item.student.nis} • {item.student.gender === 'L' ? 'Putra' : 'Putri'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Class */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                          {item.student.class}
                        </span>
                      </td>

                      {/* 4. Frequency */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                            item.visitCount >= 5 
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                              : item.visitCount > 0 
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}>
                            {item.visitCount}x Kunjungan
                          </span>
                          {item.visitCount > 0 && (
                            <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${visitPercentage}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Total Time */}
                      <td className="py-3 px-4 text-right font-mono">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                          {formatDurationText(item.totalMinutes)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {item.totalMinutes} menit
                        </span>
                      </td>

                      {/* 6. Average Duration */}
                      <td className="py-3 px-4 text-right font-mono">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                          {item.visitCount > 0 ? `${item.avgMinutes} mnt/sesi` : '-'}
                        </span>
                      </td>

                      {/* 7. Last Visit */}
                      <td className="py-3 px-4 text-center">
                        {item.lastVisitDate ? (
                          <div>
                            <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px] block">
                              {new Date(item.lastVisitDate).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {new Date(item.lastVisitDate).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })} WIB
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Belum pernah</span>
                        )}
                      </td>

                      {/* 8. Activity Badge */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.activityLevel === 'Sangat Aktif'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : item.activityLevel === 'Aktif'
                            ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : item.activityLevel === 'Pasif'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                          {item.activityLevel}
                        </span>
                      </td>

                      {/* 9. Action (View Visits History Modal) */}
                      <td className="py-3 px-3.5 text-center">
                        <button
                          onClick={() => setInspectStudent(item.student)}
                          title="Lihat Riwayat Kunjungan Santri"
                          className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Page Size Control */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Tampilkan per halaman:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>dari {filteredAndSortedStats.length} total santri</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-2">
              Halaman {currentPage} dari {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL: RIWAYAT KUNJUNGAN SPESIFIK SANTRI */}
      {/* ========================================================================= */}
      {inspectStudent && (
        <div 
          onClick={() => setInspectStudent(null)}
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 my-auto max-h-[90vh] flex flex-col cursor-default"
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={inspectStudent.photo_url}
                  alt={inspectStudent.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-200 dark:border-indigo-800 bg-slate-100"
                />
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {inspectStudent.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    NIS: {inspectStudent.nis} • Kelas {inspectStudent.class} • {inspectStudent.gender === 'L' ? 'Santri Putra' : 'Santri Putri'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectStudent(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Student Stats Highlights in Modal */}
            <div className="grid grid-cols-3 gap-3 my-4 shrink-0">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Kunjungan</span>
                <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                  {studentVisitHistory.length} kali
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Waktu Baca</span>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatDurationText(studentVisitHistory.reduce((sum, v) => sum + (v.duration_minutes || 0), 0))}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Status Saat Ini</span>
                <span className={`text-xs font-bold mt-1 inline-block ${
                  insideStudentIds.has(inspectStudent.id) ? 'text-emerald-500' : 'text-slate-500'
                }`}>
                  {insideStudentIds.has(inspectStudent.id) ? '🟢 Di Perpustakaan' : 'Di Luar'}
                </span>
              </div>
            </div>

            {/* Visit History List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Daftar Riwayat Sesi Kunjungan:
              </h4>

              {studentVisitHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Santri ini belum memiliki riwayat kunjungan ke perpustakaan.
                </div>
              ) : (
                studentVisitHistory.map((visit, index) => {
                  const checkIn = new Date(visit.check_in);
                  const checkOut = visit.check_out ? new Date(visit.check_out) : null;

                  return (
                    <div
                      key={visit.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {checkIn.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className={`px-2 py-0.2 rounded-md text-[10px] font-semibold ${
                            visit.status === 'inside' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {visit.status === 'inside' ? 'Sedang di Dalam' : 'Selesai'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          Masuk: {checkIn.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB 
                          {checkOut ? ` • Keluar: ${checkOut.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB` : ''}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                          {visit.status === 'inside' ? 'Aktif' : `${visit.duration_minutes || 0} mnt`}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-mono">UID: {visit.rfid_uid}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setInspectStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Monthly Report PDF Modal */}
      <MonthlyReportModal
        isOpen={showMonthlyReportModal}
        onClose={() => setShowMonthlyReportModal(false)}
      />

    </div>
  );
};
