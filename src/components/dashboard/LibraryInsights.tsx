import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Zap, 
  Coffee, 
  BookOpen, 
  ArrowUpRight, 
  ArrowDownRight,
  Sun,
  Moon,
  Info,
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { LibraryVisit, Student } from '../../types';

interface LibraryInsightsProps {
  visits: LibraryVisit[];
  students: Student[];
  capacity?: number;
  onNavigate?: (tab: any) => void;
}

type InsightTimeframe = 'today' | '7days' | '30days';

interface HourlyDataPoint {
  hourLabel: string;
  hourNum: number;
  count: number;
  avgDuration: number;
  isPeak: boolean;
  occupancyPercent: number;
  periodLabel: string;
}

export const LibraryInsights: React.FC<LibraryInsightsProps> = ({
  visits,
  students,
  capacity = 60,
  onNavigate
}) => {
  const [timeframe, setTimeframe] = useState<InsightTimeframe>('today');
  const [activeHourlyPoint, setActiveHourlyPoint] = useState<HourlyDataPoint | null>(null);

  // Filter visits based on timeframe
  const filteredVisits = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    if (timeframe === 'today') {
      return visits.filter(v => new Date(v.check_in).toDateString() === todayStr);
    } else if (timeframe === '7days') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return visits.filter(v => new Date(v.check_in) >= sevenDaysAgo);
    } else {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return visits.filter(v => new Date(v.check_in) >= thirtyDaysAgo);
    }
  }, [visits, timeframe]);

  // Operational hours: 07:00 to 18:00 (12 hourly slots)
  const hourlyData: HourlyDataPoint[] = useMemo(() => {
    const hoursCount: { [hour: number]: { count: number; totalDuration: number; completedCount: number } } = {};
    for (let h = 7; h <= 18; h++) {
      hoursCount[h] = { count: 0, totalDuration: 0, completedCount: 0 };
    }

    filteredVisits.forEach(v => {
      const d = new Date(v.check_in);
      const h = d.getHours();
      if (h >= 7 && h <= 18) {
        hoursCount[h].count += 1;
        if (v.duration_minutes && v.duration_minutes > 0) {
          hoursCount[h].totalDuration += v.duration_minutes;
          hoursCount[h].completedCount += 1;
        }
      }
    });

    // Find maximum count for peak identification
    let maxVal = 0;
    Object.values(hoursCount).forEach(item => {
      if (item.count > maxVal) maxVal = item.count;
    });

    const getPeriodContext = (h: number) => {
      if (h >= 7 && h < 9) return 'Pagi / Masuk Sekolah';
      if (h >= 9 && h < 11) return 'Istirahat 1 (Jam Sibuk)';
      if (h >= 11 && h < 13) return 'Sesi Dzuhur / Ishoma';
      if (h >= 13 && h < 15) return 'Istirahat 2 (Jam Sibuk)';
      if (h >= 15 && h < 17) return 'Sore / Ba’da Ashar';
      return 'Menjelang Tutup';
    };

    return Object.entries(hoursCount).map(([hourStr, data]) => {
      const h = parseInt(hourStr, 10);
      const isPeak = maxVal > 0 && data.count === maxVal;
      const avgDuration = data.completedCount > 0 ? Math.round(data.totalDuration / data.completedCount) : 0;
      const hourLabel = `${h.toString().padStart(2, '0')}:00`;
      const occupancyPercent = capacity > 0 ? Math.min(100, Math.round((data.count / capacity) * 100)) : 0;

      return {
        hourLabel,
        hourNum: h,
        count: data.count,
        avgDuration,
        isPeak,
        occupancyPercent,
        periodLabel: getPeriodContext(h)
      };
    });
  }, [filteredVisits, capacity]);

  // Calculate Peak Hour Stats
  const peakHour = useMemo(() => {
    if (hourlyData.length === 0) return null;
    const sorted = [...hourlyData].sort((a, b) => b.count - a.count);
    return sorted[0].count > 0 ? sorted[0] : null;
  }, [hourlyData]);

  // Duration distribution segments
  const durationSegments = useMemo(() => {
    const segments = {
      short: 0,    // < 15 mins
      medium: 0,   // 15 - 45 mins
      long: 0,     // 45 - 90 mins
      extended: 0  // > 90 mins
    };

    let totalRecorded = 0;
    filteredVisits.forEach(v => {
      const dur = v.duration_minutes;
      if (dur !== null && dur > 0) {
        totalRecorded++;
        if (dur < 15) segments.short++;
        else if (dur <= 45) segments.medium++;
        else if (dur <= 90) segments.long++;
        else segments.extended++;
      }
    });

    const getPct = (val: number) => totalRecorded > 0 ? Math.round((val / totalRecorded) * 100) : 0;

    return [
      { 
        label: '< 15 Menit', 
        desc: 'Pinjam/Kembali Singkat', 
        count: segments.short, 
        pct: getPct(segments.short), 
        color: 'bg-emerald-500', 
        textColor: 'text-emerald-600 dark:text-emerald-400',
        bgSoft: 'bg-emerald-50 dark:bg-emerald-950/40' 
      },
      { 
        label: '15 - 45 Menit', 
        desc: 'Membaca Ringan / Santai', 
        count: segments.medium, 
        pct: getPct(segments.medium), 
        color: 'bg-blue-500', 
        textColor: 'text-blue-600 dark:text-blue-400',
        bgSoft: 'bg-blue-50 dark:bg-blue-950/40' 
      },
      { 
        label: '45 - 90 Menit', 
        desc: 'Belajar & Tugas Mandiri', 
        count: segments.long, 
        pct: getPct(segments.long), 
        color: 'bg-indigo-500', 
        textColor: 'text-indigo-600 dark:text-indigo-400',
        bgSoft: 'bg-indigo-50 dark:bg-indigo-950/40' 
      },
      { 
        label: '> 90 Menit', 
        desc: 'Sesi Riset / Mutala’ah Kitab', 
        count: segments.extended, 
        pct: getPct(segments.extended), 
        color: 'bg-amber-500', 
        textColor: 'text-amber-600 dark:text-amber-400',
        bgSoft: 'bg-amber-50 dark:bg-amber-950/40' 
      }
    ];
  }, [filteredVisits]);

  // Today's total vs 7-day average comparison
  const performanceTrend = useMemo(() => {
    const today = new Date().toDateString();
    const todayVisits = visits.filter(v => new Date(v.check_in).toDateString() === today).length;

    // Calculate last 7 days average (excluding today if needed or full 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const last7DaysVisits = visits.filter(v => new Date(v.check_in) >= sevenDaysAgo);
    const dailyAvg = Math.max(1, Math.round(last7DaysVisits.length / 7));

    const diff = todayVisits - dailyAvg;
    const diffPct = Math.round((diff / dailyAvg) * 100);

    return {
      todayVisits,
      dailyAvg,
      diff,
      diffPct,
      isHigher: diff >= 0
    };
  }, [visits]);

  // Quiet windows vs Busy windows
  const trafficWindows = useMemo(() => {
    const quietSlots = hourlyData.filter(h => h.count > 0 && h.count <= Math.max(1, Math.round((peakHour?.count || 1) * 0.35)));
    const busySlots = hourlyData.filter(h => h.count >= Math.max(2, Math.round((peakHour?.count || 1) * 0.7)));

    return {
      quiet: quietSlots.length > 0 ? quietSlots.map(s => s.hourLabel).join(', ') : '07:00, 16:00',
      busy: busySlots.length > 0 ? busySlots.map(s => s.hourLabel).join(', ') : (peakHour ? peakHour.hourLabel : '10:00, 13:00')
    };
  }, [hourlyData, peakHour]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header with Title & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
                Library Insights & Analisis Jam Sibuk
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-black text-[10px] uppercase tracking-wider border border-amber-200/80 dark:border-amber-800">
                <Flame className="w-3 h-3 text-amber-500" />
                Live Trends
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualisasi distribusi kedatangan santri, jam tersibuk, dan performa utilisasi perpustakaan
            </p>
          </div>
        </div>

        {/* Timeframe Filter Buttons */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0">
          <button
            type="button"
            onClick={() => setTimeframe('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeframe === 'today'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('7days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeframe === '7days'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            7 Hari Terakhir
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('30days')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeframe === '30days'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            30 Hari
          </button>
        </div>
      </div>

      {/* Top 3 Quick Insight Mini-Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Peak Hour Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-900/50 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Jam Paling Sibuk
            </p>
            <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight truncate mt-0.5">
              {peakHour && peakHour.count > 0 ? `${peakHour.hourLabel} - ${(peakHour.hourNum + 1).toString().padStart(2, '0')}:00` : 'Belum Ada Data'}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {peakHour && peakHour.count > 0 ? `${peakHour.count} kunjungan (${peakHour.periodLabel})` : 'Aktivitas kunjungan masih sepi'}
            </p>
          </div>
        </div>

        {/* Day-over-Day Velocity */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-900/50 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                Tren vs Rerata Harian
              </p>
              <span className={`inline-flex items-center text-[10px] font-black px-1.5 py-0.2 rounded ${
                performanceTrend.isHigher 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {performanceTrend.isHigher ? <ArrowUpRight className="w-3 h-3 inline mr-0.5" /> : <ArrowDownRight className="w-3 h-3 inline mr-0.5" />}
                {Math.abs(performanceTrend.diffPct)}%
              </span>
            </div>
            <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight mt-0.5">
              {performanceTrend.todayVisits} Santri Hari Ini
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Rerata mingguan: {performanceTrend.dailyAvg} kunjungan/hari
            </p>
          </div>
        </div>

        {/* Smart Recommendation Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-900/50 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Waktu Kunjungan Tenang
            </p>
            <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight truncate mt-0.5">
              {trafficWindows.quiet}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Sangat ideal untuk mutala’ah & baca fokus
            </p>
          </div>
        </div>
      </div>

      {/* Main Bar Chart: Distribusi Kunjungan Berdasarkan Jam (Recharts) */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Grafik Distribusi Kunjungan per Jam Operasional (07:00 - 18:00)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Batang oranye menandai jam sibuk dengan frekuensi kedatangan santri tertinggi.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-blue-600 inline-block" />
              <span className="text-slate-600 dark:text-slate-400 font-medium">Normal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-500 inline-block" />
              <span className="text-slate-600 dark:text-slate-400 font-semibold">Jam Puncak (Peak)</span>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-64 sm:h-72 w-full pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={hourlyData} 
              margin={{ top: 12, right: 10, left: -20, bottom: 0 }}
              onMouseMove={(state: any) => {
                if (state?.activePayload && state.activePayload.length > 0) {
                  setActiveHourlyPoint(state.activePayload[0].payload as HourlyDataPoint);
                }
              }}
              onMouseLeave={() => setActiveHourlyPoint(null)}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
              <XAxis 
                dataKey="hourLabel" 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as HourlyDataPoint;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[190px]">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="font-extrabold text-blue-400 text-sm">{data.hourLabel} WIB</span>
                          {data.isPeak && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                              <Flame className="w-2.5 h-2.5" /> Puncak
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium">
                          {data.periodLabel}
                        </p>
                        <div className="pt-1 flex items-center justify-between font-bold">
                          <span className="text-slate-400">Total Kunjungan:</span>
                          <span className="text-white text-sm font-black">{data.count} santri</span>
                        </div>
                        {data.avgDuration > 0 && (
                          <div className="flex items-center justify-between text-[11px] text-slate-300">
                            <span>Rata-rata Durasi:</span>
                            <span className="font-semibold text-emerald-400">{data.avgDuration} menit</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>Beban Kapasitas:</span>
                          <span>{data.occupancyPercent}% dari {capacity} kuota</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="count" 
                radius={[8, 8, 0, 0]}
                animationDuration={600}
              >
                {hourlyData.map((entry, index) => (
                  <Cell 
                    key={`cell-hour-${index}`} 
                    fill={entry.isPeak ? '#f59e0b' : '#3b82f6'} 
                    className="transition-all hover:opacity-85"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Insights Row: Distribusi Durasi & Ringkasan Perilaku Santri */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Duration Segments Breakdown */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Segmentasi Durasi Kunjungan
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              {filteredVisits.length} total sesi
            </span>
          </div>

          {/* Segment Progress Bars */}
          <div className="space-y-2.5 pt-1">
            {durationSegments.map((seg, idx) => (
              <div key={`seg-${idx}`} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{seg.label}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {seg.count} sesi ({seg.pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${seg.color}`}
                    style={{ width: `${seg.pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{seg.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Highlights & Tips for Librarians */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Catatan Strategis Petugas Perpustakaan
            </h4>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>
                  <strong>Antisipasi Jam Sibuk:</strong> Siapkan barcode scanner cadangan dan buka 2 meja sirkulasi di kisaran jam <span className="font-bold text-amber-600 dark:text-amber-400">{trafficWindows.busy} WIB</span>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>
                  <strong>Sesi Restoking & Shelving Kitab:</strong> Lakukan penataan kembali rak buku pada jam tenang (<span className="font-bold text-emerald-600 dark:text-emerald-400">{trafficWindows.quiet} WIB</span>) agar tidak mengganggu antrean.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span>
                  <strong>Efisiensi Auto-Tap:</strong> Pastikan terminal tap RFID di pintu masuk selalu aktif guna mencegah penumpukan santri saat pergantian jam pelajaran.
                </span>
              </li>
            </ul>
          </div>

          {onNavigate && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Ingin melihat statistik mendalam santri?</span>
              <button
                type="button"
                onClick={() => onNavigate('stats')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
              >
                <span>Buka Statistik Lengkap</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
