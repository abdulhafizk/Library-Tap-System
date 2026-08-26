import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Clock, 
  RotateCcw, 
  LogOut, 
  Lock, 
  AlertTriangle,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { IDLE_WARNING_DURATION_MS } from '../../hooks/useIdleSessionTimer';

interface IdleSessionPromptProps {
  isOpen: boolean;
  remainingSeconds: number;
  onExtendSession: () => void;
  onLogout: () => void;
}

export const IdleSessionPrompt: React.FC<IdleSessionPromptProps> = ({
  isOpen,
  remainingSeconds,
  onExtendSession,
  onLogout,
}) => {
  const { currentUser, settings } = useLibrary();

  if (!isOpen) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalWarningSeconds = IDLE_WARNING_DURATION_MS / 1000;
  const progressPercent = Math.max(0, Math.min(100, (remainingSeconds / totalWarningSeconds) * 100));

  return (
    <AnimatePresence>
      <div 
        id="idle-session-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md transition-all duration-300"
      >
        <motion.div
          id="idle-session-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="idle-session-title"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-amber-950/20 text-slate-900 dark:text-slate-100 overflow-hidden"
        >
          {/* Top Amber Ambient Gradient Bar */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500" />

          {/* Header & Icon */}
          <div className="flex items-center gap-3.5 mb-5 pt-1">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Lock className="w-3 h-3" />
                <span>Keamanan Sesi Petugas</span>
              </div>
              <h2 
                id="idle-session-title"
                className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white"
              >
                Peringatan Sesi Tidak Aktif
              </h2>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
            Sistem mendeteksi tidak ada aktivitas selama <strong className="text-amber-600 dark:text-amber-400 font-bold">50 menit</strong>. Demi keamanan data perpustakaan, sesi Anda akan ditutup otomatis dalam waktu:
          </p>

          {/* Prominent Countdown Display */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-slate-800/90 dark:to-amber-950/30 border border-amber-200 dark:border-amber-900/50 mb-5 text-center relative overflow-hidden">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Sisa Waktu Sebelum Logout Otomatis
              </span>
            </div>

            <div className="font-mono text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 tracking-wider">
              {formattedTime}
            </div>

            {/* Countdown Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Current User Session Info */}
          {currentUser && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 mb-6 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2.5 min-w-0">
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-700" 
                />
                <div className="truncate">
                  <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">@{currentUser.username}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 uppercase">
                {currentUser.role === 'admin' ? 'Admin' : 'Staff'}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <button
              id="btn-extend-session"
              type="button"
              onClick={onExtendSession}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Perpanjang Sesi (Tetap Masuk)</span>
            </button>

            <button
              id="btn-logout-now"
              type="button"
              onClick={onLogout}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Sekarang</span>
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mt-4">
            Batas waktu tidak aktif diatur untuk melindungi kerahasiaan data santri dan transaksi perpustakaan.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
