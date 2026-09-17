import React, { useState } from 'react';
import { 
  Smartphone, 
  ChevronRight, 
  Sparkles, 
  Eye, 
  Sliders, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SantriMenuSettingsTab } from '../settings/SantriMenuSettingsTab';
import { SantriProfilePreview } from './SantriProfilePreview';
import { SyncLoadingOverlay } from './SantriMenuSkeleton';
import { useLibrary } from '../../context/LibraryContext';

type SantriPageViewMode = 'settings' | 'preview';

interface SantriMenuPageProps {
  onNavigateToDashboard?: () => void;
}

export const SantriMenuPage: React.FC<SantriMenuPageProps> = () => {
  const { 
    santriMenus, 
    isSantriMenuTableAvailable, 
    isSupabaseSyncing, 
    isRealtimeConnected,
    pullFromSupabase
  } = useLibrary();

  const [activeView, setActiveView] = useState<SantriPageViewMode>('settings');
  const [isSynchronizing, setIsSynchronizing] = useState<boolean>(false);
  const [syncingTargetKey, setSyncingTargetKey] = useState<string | null>(null);

  const activeCount = santriMenus.filter(m => m.is_enabled).length;
  const totalCount = santriMenus.length;

  const handleSyncStateChange = (isSyncing: boolean, key?: string | null) => {
    setIsSynchronizing(isSyncing);
    setSyncingTargetKey(key || null);
  };

  // Manual instant sync trigger to test and demonstrate synchronization
  const handleTriggerManualSync = async () => {
    setIsSynchronizing(true);
    try {
      if (pullFromSupabase) {
        await pullFromSupabase();
      }
      // Guarantee smooth transition window to prevent any flickering or partial rendering
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsSynchronizing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300 relative">
      {/* Top Header Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400 mb-1">
            <Smartphone className="w-4 h-4" />
            <span>Manajemen Portal & Hak Akses Santri</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400 font-normal">
              {activeView === 'settings' ? 'Pengaturan Akses' : 'Pratinjau Profil Santri'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Kelola Menu & Profil Santri
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kontrol terpusat untuk mengaktifkan, menonaktifkan, dan meninjau sinkronisasi menu di portal dan profil santri.
          </p>
        </div>

        {/* Live Sync Status Pill & Manual Sync Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleTriggerManualSync}
            disabled={isSynchronizing || isSupabaseSyncing}
            className="px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Uji coba sinkronisasi realtime antara pengaturan dan profil santri"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSynchronizing || isSupabaseSyncing ? 'animate-spin text-teal-500' : ''}`} />
            <span className="hidden sm:inline">Sinkronkan Sekarang</span>
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 shadow-2xs">
            {isSynchronizing || isSupabaseSyncing ? (
              <>
                <RefreshCw className="w-3 h-3 text-teal-600 dark:text-teal-400 animate-spin" />
                <span className="text-xs font-bold text-teal-800 dark:text-teal-300">
                  Menyinkronkan Perubahan...
                </span>
              </>
            ) : (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                </span>
                <span className="text-xs font-bold text-teal-800 dark:text-teal-300">
                  {activeCount} dari {totalCount} Menu Aktif
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs: Settings vs Live Profile Preview */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('settings')}
            className={`pb-3 pt-1 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeView === 'settings'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Pengaturan Hak Akses Menu</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400">
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('preview')}
            className={`pb-3 pt-1 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeView === 'preview'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Pratinjau Profil & Portal Santri</span>
            <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/70 text-[11px] font-bold text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
              Live Realtime
            </span>
          </button>
        </div>

        {/* Realtime Connection Indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 pb-2">
          <Zap className="w-3.5 h-3.5 text-teal-500" />
          <span>Sinkronisasi Otomatis Terhubung</span>
        </div>
      </div>

      {/* Main View Area with Skeleton Loaders & Loading Overlay */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {activeView === 'settings' ? (
            <motion.div
              key="settings-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <SantriMenuSettingsTab
                isSynchronizing={isSynchronizing}
                onSyncStateChange={handleSyncStateChange}
                onOpenPreview={() => setActiveView('preview')}
              />
            </motion.div>
          ) : (
            <motion.div
              key="preview-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <SantriProfilePreview
                isSynchronizing={isSynchronizing || isSupabaseSyncing}
                onNavigateToSettings={() => setActiveView('settings')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
