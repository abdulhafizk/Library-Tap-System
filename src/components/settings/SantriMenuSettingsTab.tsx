import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sliders, 
  Check, 
  X, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  Smartphone, 
  Lock, 
  Eye, 
  EyeOff, 
  Layers, 
  Copy, 
  CheckCircle2, 
  Info,
  Database,
  Search,
  BookOpen,
  Home,
  BookMarked,
  Undo2,
  History,
  CreditCard,
  Clock,
  BookPlus,
  PenTool,
  Trophy,
  Bookmark,
  Bell,
  User,
  Power
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { SantriMenu } from '../../types';
import { MenuRowSkeleton, MetricsSkeleton, SyncLoadingOverlay } from '../santri-menu/SantriMenuSkeleton';

// Dynamic Icon Resolver
export const resolveMenuIcon = (iconName: string, className: string = "w-5 h-5") => {
  switch (iconName?.toLowerCase()) {
    case 'home':
      return <Home className={className} />;
    case 'bookopen':
    case 'catalog':
      return <BookOpen className={className} />;
    case 'bookmarked':
    case 'book':
      return <BookMarked className={className} />;
    case 'undo2':
    case 'undo':
    case 'returns':
      return <Undo2 className={className} />;
    case 'history':
      return <History className={className} />;
    case 'creditcard':
    case 'card':
      return <CreditCard className={className} />;
    case 'clock':
    case 'visits':
      return <Clock className={className} />;
    case 'bookplus':
    case 'wishlist':
      return <BookPlus className={className} />;
    case 'pentool':
    case 'pen':
    case 'journal':
      return <PenTool className={className} />;
    case 'trophy':
    case 'award':
    case 'awards':
      return <Trophy className={className} />;
    case 'bookmark':
      return <Bookmark className={className} />;
    case 'bell':
    case 'notifications':
      return <Bell className={className} />;
    case 'user':
    case 'profile':
      return <User className={className} />;
    default:
      return <Layers className={className} />;
  }
};

export interface SantriMenuSettingsTabProps {
  isSynchronizing?: boolean;
  onSyncStateChange?: (isSyncing: boolean, key?: string | null) => void;
  onOpenPreview?: () => void;
}

export const SantriMenuSettingsTab: React.FC<SantriMenuSettingsTabProps> = ({
  isSynchronizing = false,
  onSyncStateChange,
  onOpenPreview
}) => {
  const { 
    santriMenus, 
    updateSantriMenu, 
    resetSantriMenusToDefault, 
    batchUpdateSantriMenus,
    santriMenusSql,
    isSantriMenuTableAvailable,
    isSupabaseSyncing
  } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedSql, setCopiedSql] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);
  const [showSqlDrawer, setShowSqlDrawer] = useState(false);

  // Filtered menus
  const filteredMenus = santriMenus.filter(menu => {
    const matchesSearch = 
      menu.menu_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      menu.menu_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (menu.description && menu.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || menu.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const activeMenusCount = santriMenus.filter(m => m.is_enabled).length;
  const totalMenusCount = santriMenus.length;

  const handleToggleMenu = async (menuKey: string, currentStatus: boolean) => {
    setSavingKey(menuKey);
    onSyncStateChange?.(true, menuKey);
    try {
      await updateSantriMenu(menuKey, { is_enabled: !currentStatus });
    } finally {
      setTimeout(() => {
        setSavingKey(null);
        onSyncStateChange?.(false, null);
      }, 350);
    }
  };

  const handleEnableAll = async () => {
    setIsBatchSyncing(true);
    onSyncStateChange?.(true, 'batch');
    try {
      const updated = santriMenus.map(m => ({ ...m, is_enabled: true }));
      await batchUpdateSantriMenus(updated);
    } finally {
      setTimeout(() => {
        setIsBatchSyncing(false);
        onSyncStateChange?.(false, null);
      }, 450);
    }
  };

  const handleResetDefault = async () => {
    setIsBatchSyncing(true);
    onSyncStateChange?.(true, 'reset');
    try {
      await resetSantriMenusToDefault();
    } finally {
      setTimeout(() => {
        setIsBatchSyncing(false);
        onSyncStateChange?.(false, null);
      }, 450);
    }
  };

  const handleDisableAllOptional = async () => {
    setIsBatchSyncing(true);
    onSyncStateChange?.(true, 'batch');
    try {
      const updated = santriMenus.map(m => ({
        ...m,
        is_enabled: m.menu_key === 'overview' ? true : false
      }));
      await batchUpdateSantriMenus(updated);
    } finally {
      setTimeout(() => {
        setIsBatchSyncing(false);
        onSyncStateChange?.(false, null);
      }, 450);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(santriMenusSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-teal-900/40 via-slate-900/90 to-emerald-950/40 border border-teal-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-semibold">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Kontrol Akses & Fitur Portal Santri</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Pengaturan Menu Santri
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Atur ketersediaan menu yang dapat diakses santri di Dashboard Santri secara terpusat. Menu dengan status <strong>Nonaktif</strong> akan tetap terlihat pada navigasi namun menampilkan halaman <em>&quot;Sedang Dalam Pengembangan&quot;</em>.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 shrink-0 w-full md:w-auto">
            <div className="flex items-center justify-between gap-6">
              <span className="text-slate-400 font-medium">Status Menu Aktif:</span>
              <span className="font-mono font-extrabold text-emerald-400 text-base">
                {activeMenusCount} / {totalMenusCount}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(activeMenusCount / totalMenusCount) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{Math.round((activeMenusCount / totalMenusCount) * 100)}% Menu Aktif</span>
              <span>{totalMenusCount - activeMenusCount} Nonaktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Actions & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama menu, route, atau kunci menu..."
            className="w-full pl-9.5 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'utama', label: 'Utama' },
            { id: 'sirkulasi', label: 'Sirkulasi' },
            { id: 'literasi', label: 'Literasi' },
            { id: 'pengguna', label: 'Akun' },
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Global Batch Action Buttons & Preview Trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenPreview && (
            <button
              type="button"
              onClick={onOpenPreview}
              className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Buka pratinjau profil dan portal santri secara langsung"
            >
              <Eye className="w-3.5 h-3.5 text-teal-500" />
              <span>Pratinjau Profil</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleEnableAll}
            disabled={isBatchSyncing || isSynchronizing}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 disabled:opacity-50 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
            title="Aktifkan seluruh menu santri"
          >
            <Check className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Aktifkan Semua</span>
          </button>
          <button
            type="button"
            onClick={handleResetDefault}
            disabled={isBatchSyncing || isSynchronizing}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 disabled:opacity-50 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
            title="Kembalikan ke susunan menu bawaan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBatchSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset Default</span>
          </button>
        </div>
      </div>

      {/* Main Menu Items Table / Grid with Shimmer Skeleton & Loading Overlay */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm min-h-[300px]">
        {/* Synchronization Loading Overlay */}
        <AnimatePresence>
          {(isBatchSyncing || isSynchronizing || isSupabaseSyncing) && (
            <SyncLoadingOverlay
              message="Menyinkronkan Pengaturan Menu..."
              submessage="Memperbarui hak akses dan status realtime di seluruh portal santri..."
            />
          )}
        </AnimatePresence>

        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Daftar Menu Santri ({filteredMenus.length} Menu)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Klik tombol toggle (ON/OFF) untuk mengubah status aktif menu santri secara instan.
              </p>
            </div>
          </div>
        </div>

        {/* List of items or Skeleton Loaders */}
        {santriMenus.length === 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {[...Array(6)].map((_, i) => (
              <MenuRowSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredMenus.map((menu, index) => {
              const isSavingThis = savingKey === menu.menu_key;

              return (
                <motion.div
                  key={menu.menu_key}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors relative ${
                    isSavingThis ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
                  } ${
                    menu.is_enabled 
                      ? 'bg-transparent hover:bg-slate-50/70 dark:hover:bg-slate-800/30' 
                      : 'bg-slate-50/40 dark:bg-slate-950/40 opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* Left: Icon & Info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
                      menu.is_enabled
                        ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-700/60 text-teal-600 dark:text-teal-300'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}>
                      {resolveMenuIcon(menu.icon, "w-5 h-5")}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {menu.menu_name}
                        </span>

                        {/* Route tag */}
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {menu.route}
                        </span>

                        {/* Category tag */}
                        {menu.category && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                            {menu.category}
                          </span>
                        )}

                        {/* Top Header Designation Tag */}
                        {['overview', 'card', 'visits', 'loans', 'journal', 'awards', 'profile'].includes(menu.menu_key) && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 inline-flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                            Top Header (7 Utama)
                          </span>
                        )}

                        {/* Active Status Badge */}
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          menu.is_enabled
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                        }`}>
                          {menu.is_enabled ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Nonaktif (Dalam Pengembangan)
                            </>
                          )}
                        </span>

                        {/* Live Syncing Feedback Badge */}
                        {isSavingThis && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 animate-pulse">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin text-teal-400" />
                            Menyinkronkan...
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                        {menu.description || 'Pengaturan akses modul portal santri'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Switch Toggle Control */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <span className={`text-xs font-extrabold font-mono uppercase tracking-wider ${
                      menu.is_enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}>
                      {menu.is_enabled ? '[ ON ]' : '[ OFF ]'}
                    </span>

                    <button
                      id={`toggle-santri-menu-${menu.menu_key}`}
                      type="button"
                      role="switch"
                      aria-checked={menu.is_enabled}
                      disabled={isSavingThis || isBatchSyncing}
                      onClick={() => handleToggleMenu(menu.menu_key, menu.is_enabled)}
                      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                        menu.is_enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      } ${isSavingThis ? 'opacity-70 cursor-wait' : ''}`}
                    >
                      <span className="sr-only">Toggle status menu {menu.menu_name}</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[10px] font-bold ${
                          menu.is_enabled ? 'translate-x-7 text-emerald-600' : 'translate-x-0 text-slate-400'
                        }`}
                      >
                        {isSavingThis ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-teal-600" />
                        ) : menu.is_enabled ? (
                          '✓'
                        ) : (
                          '✕'
                        )}
                      </span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {filteredMenus.length === 0 && (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Search className="w-8 h-8 mx-auto text-slate-300" />
            <div className="text-sm font-bold">Tidak ada menu yang sesuai</div>
            <p className="text-xs">Coba ganti kata kunci pencarian atau kategori filter.</p>
          </div>
        )}
      </div>

      {/* Supabase Schema Helper Box for Santri Menus */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Database className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Skema Database Cloud Supabase (`santri_menus`)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySql}
              className="px-3 py-1 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              {copiedSql ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Tersalin!' : 'Salin SQL Skema'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSqlDrawer(!showSqlDrawer)}
              className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              {showSqlDrawer ? 'Tutup Preview SQL' : 'Lihat Script SQL'}
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Tabel <code>santri_menus</code> menyimpan status menu santri secara realtime di Supabase Cloud. Setiap perubahan toggle status akan otomatis disinkronkan ke semua perangkat santri tanpa perlu reload.
        </p>

        {showSqlDrawer && (
          <div className="mt-3 relative rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-60 scrollbar-thin">
            <pre className="whitespace-pre">{santriMenusSql}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
