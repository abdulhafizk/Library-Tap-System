import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Tag, 
  Calendar, 
  CheckCircle2, 
  Layers, 
  Search, 
  Filter, 
  ShieldCheck, 
  Zap, 
  Wrench, 
  Bug, 
  ArrowUpRight,
  Info,
  Clock,
  ChevronRight,
  PlusCircle,
  FileCode,
  Check
} from 'lucide-react';
import { appUpdateLogs, AppReleaseLog, UpdateCategory } from '../../data/updateLogsData';
import { useLibrary } from '../../context/LibraryContext';

export const UpdateLogsPage: React.FC = () => {
  const { currentUser } = useLibrary();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(() => new Set([appUpdateLogs[0]?.version || '']));

  const toggleExpand = (version: string) => {
    setExpandedVersions(prev => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedVersions(new Set(appUpdateLogs.map(l => l.version)));
  };

  const collapseAll = () => {
    setExpandedVersions(new Set());
  };

  // Filter logs based on search and category
  const filteredLogs = appUpdateLogs.filter(log => {
    const matchesSearch = 
      searchQuery.trim() === '' ||
      log.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.highlights.some(h => h.toLowerCase().includes(searchQuery.toLowerCase())) ||
      log.changes.some(c => c.items.some(i => i.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesSearch) return false;

    if (selectedCategory === 'all') return true;

    return log.changes.some(c => c.category === selectedCategory);
  });

  const getCategoryBadge = (cat: UpdateCategory) => {
    switch (cat) {
      case 'feature':
        return {
          label: 'Fitur Baru',
          icon: Sparkles,
          bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
          dot: 'bg-emerald-500'
        };
      case 'improvement':
        return {
          label: 'Peningkatan',
          icon: Zap,
          bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
          dot: 'bg-blue-500'
        };
      case 'fix':
        return {
          label: 'Perbaikan Bug',
          icon: Wrench,
          bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
          dot: 'bg-amber-500'
        };
      case 'security':
        return {
          label: 'Keamanan',
          icon: ShieldCheck,
          bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
          dot: 'bg-purple-500'
        };
    }
  };

  const totalFeatures = appUpdateLogs.reduce((acc, log) => {
    const featGroup = log.changes.find(c => c.category === 'feature');
    return acc + (featGroup ? featGroup.items.length : 0);
  }, 0);

  const latestLog = appUpdateLogs[0];

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto" id="admin-update-log-page">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-blue-900/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-100 text-xs font-semibold border border-white/15">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Changelog & Riwayat Rilis Sistem</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Update Log & Versi Aplikasi
            </h1>
            <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed">
              Catatan pembaruan berkala sistem Library Tap. Pantau peluncuran fitur baru, perbaikan bug, peningkatan performa, dan penguatan keamanan.
            </p>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl text-center">
              <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold block">Versi Saat Ini</span>
              <span className="text-xl sm:text-2xl font-black text-white">{latestLog?.version || 'v2.6.0'}</span>
            </div>
            <div className="text-xs text-blue-200/80 hidden md:block text-right">
              Terakhir diperbarui: {latestLog?.releaseDate || 'Hari ini'}
            </div>
          </div>
        </div>

        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Summary Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Total Rilis</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {appUpdateLogs.length} Versi
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">
            Sejak v2.0.0
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Fitur Ditambahkan</span>
          <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
            {totalFeatures}+ Fitur
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">
            Modul Utama Perpustakaan
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Status Rilis</span>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Stable Production</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">
            Siap Digunakan
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Siklus Pembaruan</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            Aktif & Berkala
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">
            Sesuai Kebutuhan Pondok
          </span>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari fitur, kata kunci, atau nomor versi..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setSelectedCategory('feature')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'feature'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Fitur Baru
          </button>
          <button
            onClick={() => setSelectedCategory('improvement')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'improvement'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Peningkatan
          </button>
          <button
            onClick={() => setSelectedCategory('fix')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'fix'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Perbaikan
          </button>
        </div>

        {/* Expand / Collapse All */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <button
            onClick={expandAll}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Buka Semua
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup Semua
          </button>
        </div>
      </div>

      {/* Release Timeline List */}
      <div className="space-y-6">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
            <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Tidak ada log update ditemukan</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Coba gunakan kata kunci pencarian lain atau pilih kategori Semua.</p>
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const isExpanded = expandedVersions.has(log.version);

            return (
              <div
                key={log.version}
                className={`rounded-3xl border transition-all duration-200 bg-white dark:bg-slate-900 overflow-hidden shadow-xs ${
                  log.isLatest 
                    ? 'border-blue-300 dark:border-blue-800/80 ring-2 ring-blue-500/10' 
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* Header Card */}
                <div 
                  onClick={() => toggleExpand(log.version)}
                  className="p-5 sm:p-6 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors select-none"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-xl text-sm font-black tracking-tight ${
                          log.isLatest 
                            ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}>
                          {log.version}
                        </span>

                        {log.isLatest && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            Versi Terbaru
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{log.releaseDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-semibold self-end sm:self-auto">
                      <span>{isExpanded ? 'Sembunyikan Rincian' : 'Lihat Rincian'}</span>
                      <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Tagline */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-3">
                    {log.tagline}
                  </h3>

                  {/* Highlights Bar */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {log.highlights.map((highlight, hIdx) => (
                      <span 
                        key={hIdx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5 font-medium"
                      >
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>{highlight}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Collapsible Details Body */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100 dark:border-slate-800 px-5 sm:px-6 py-5 bg-slate-50/50 dark:bg-slate-950/20"
                    >
                      <div className="space-y-5">
                        {log.changes
                          .filter(ch => selectedCategory === 'all' || ch.category === selectedCategory)
                          .map((group, gIdx) => {
                            const badge = getCategoryBadge(group.category);
                            const Icon = badge.icon;

                            return (
                              <div key={gIdx} className="space-y-2.5">
                                <div className="flex items-center gap-2">
                                  <div className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${badge.bg}`}>
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{badge.label}</span>
                                  </div>
                                  <div className="h-px flex-1 bg-slate-200/80 dark:bg-slate-800" />
                                </div>

                                <ul className="space-y-2 pl-1">
                                  {group.items.map((itemText, iIdx) => (
                                    <li key={iIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} shrink-0 mt-2`} />
                                      <span>{itemText}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info Note */}
      <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <p className="font-bold">Informasi Siklus Pembaruan Sistem:</p>
          <p className="mt-0.5 text-blue-800 dark:text-blue-300">
            Setiap rilis versi baru telah melalui pengujian menyeluruh pada alur pembacaan RFID, sirkulasi buku, sinkronisasi cloud Supabase, serta kenyamanan antarmuka santri dan asatidz.
          </p>
        </div>
      </div>
    </div>
  );
};
