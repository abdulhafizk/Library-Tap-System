import React from 'react';
import { motion } from 'motion/react';
import { Loader2, RefreshCw, Smartphone, ShieldCheck, Sparkles } from 'lucide-react';

/**
 * Skeleton loader for a single menu row in the SantriMenuPage settings table
 */
export const MenuRowSkeleton: React.FC = () => {
  return (
    <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        {/* Icon Skeleton */}
        <div className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />

        {/* Text Skeleton */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3.5 w-14 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
          </div>
          <div className="h-3 w-4/5 max-w-md bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>

      {/* Switch Skeleton */}
      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
        <div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-7 w-14 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </div>
    </div>
  );
};

/**
 * Skeleton loader for the top summary metrics banner
 */
export const MetricsSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 animate-pulse">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl flex-1">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-full" />
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>

        <div className="bg-slate-200/60 dark:bg-slate-950/80 rounded-2xl p-4 w-full md:w-64 space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-28 bg-slate-300 dark:bg-slate-800 rounded" />
            <div className="h-5 w-12 bg-slate-300 dark:bg-slate-800 rounded" />
          </div>
          <div className="h-2 w-full bg-slate-300 dark:bg-slate-800 rounded-full" />
          <div className="flex justify-between">
            <div className="h-3 w-20 bg-slate-300 dark:bg-slate-800 rounded" />
            <div className="h-3 w-16 bg-slate-300 dark:bg-slate-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * High-fidelity Skeleton loader for the Profile View & Portal Header
 * Matches the layout of SantriDashboard profile view to prevent flickering
 */
export const ProfileViewSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top 7 Menu Header Tabs Skeleton */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-3 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-start lg:justify-center gap-2 overflow-x-auto">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="h-8 w-28 sm:w-32 bg-slate-800/80 rounded-xl shrink-0"
            />
          ))}
        </div>
      </div>

      {/* Main Profile Info Card Skeleton */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Avatar Skeleton */}
          <div className="w-20 h-20 rounded-2xl bg-slate-800 shrink-0" />

          {/* Student details */}
          <div className="space-y-2 flex-1 text-center sm:text-left">
            <div className="h-6 w-48 sm:w-64 bg-slate-800 rounded-md mx-auto sm:mx-0" />
            <div className="h-4 w-36 bg-slate-800 rounded mx-auto sm:mx-0" />
            <div className="h-5 w-44 bg-slate-800/90 rounded-full mx-auto sm:mx-0" />
          </div>
        </div>

        {/* Metadata Details Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-28 bg-slate-800 rounded" />
              <div className="h-4 w-36 bg-slate-800/90 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Feature Navigation Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-slate-800" />
              <div className="h-4 w-16 bg-slate-800 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <div className="h-4 w-32 bg-slate-800 rounded" />
              <div className="h-3 w-full bg-slate-800/70 rounded" />
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex justify-between">
              <div className="h-3 w-20 bg-slate-800 rounded" />
              <div className="h-3 w-12 bg-slate-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Shimmering Loading Overlay with non-blocking feedback and status caption
 */
interface SyncLoadingOverlayProps {
  message?: string;
  submessage?: string;
  isTransparent?: boolean;
}

export const SyncLoadingOverlay: React.FC<SyncLoadingOverlayProps> = ({
  message = 'Menyinkronkan Pengaturan & Profil Santri...',
  submessage = 'Memastikan hak akses menu dan tampilan profil santri 100% konsisten',
  isTransparent = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-6 rounded-3xl backdrop-blur-xs ${
        isTransparent 
          ? 'bg-slate-950/40 dark:bg-slate-950/60' 
          : 'bg-white/80 dark:bg-slate-950/85'
      }`}
    >
      <div className="bg-slate-900/95 dark:bg-slate-900/95 border border-teal-500/40 rounded-2xl p-5 shadow-2xl max-w-sm w-full mx-auto text-center space-y-3 backdrop-blur-xl">
        {/* Animated Icon */}
        <div className="relative w-12 h-12 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping opacity-70" />
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-teal-950">
            <RefreshCw className="w-5 h-5 animate-spin text-white" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center justify-center gap-1.5">
            <span>{message}</span>
          </h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {submessage}
          </p>
        </div>

        {/* Progress bar shimmer */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-400 h-full w-full animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
        </div>
      </div>
    </motion.div>
  );
};
