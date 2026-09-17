import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Award, 
  BookOpen, 
  X, 
  ArrowRight,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SantriNotification } from '../../types';
import { soundManager } from '../../utils/audio';

interface SantriNotificationToastProps {
  notifications: SantriNotification[];
  onNavigateTab: (tab: 'overview' | 'loans' | 'card' | 'visits' | 'wishlist' | 'journal' | 'awards') => void;
  onMarkAsRead: (id: string) => void;
  onDismissToast: (id: string) => void;
  soundEnabled?: boolean;
}

export const SantriNotificationToast: React.FC<SantriNotificationToastProps> = ({
  notifications,
  onNavigateTab,
  onMarkAsRead,
  onDismissToast,
  soundEnabled = true
}) => {
  // Find highest priority unread & non-dismissed notification
  const activeAlert = notifications.find(n => !n.read);
  const [isAudioMuted, setIsAudioMuted] = useState(!soundEnabled);

  useEffect(() => {
    if (!activeAlert || isAudioMuted) return;

    if (activeAlert.priority === 'urgent') {
      soundManager.playUrgentAlertSound();
    } else if (activeAlert.priority === 'celebration') {
      soundManager.playAwardFanfareSound();
    } else {
      soundManager.playNotificationSound();
    }
  }, [activeAlert?.id, isAudioMuted]);

  if (!activeAlert) return null;

  const handleAction = () => {
    onMarkAsRead(activeAlert.id);
    onDismissToast(activeAlert.id);
    if (activeAlert.actionTab) {
      onNavigateTab(activeAlert.actionTab);
    }
  };

  const handleDismiss = () => {
    onDismissToast(activeAlert.id);
  };

  // Category Icon & Color Schema
  const getStyle = () => {
    switch (activeAlert.category) {
      case 'overdue':
        return {
          bg: 'bg-gradient-to-r from-rose-950/95 to-slate-900/95 border-rose-500/50 shadow-rose-950/50',
          iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          badgeText: 'Jatuh Tempo',
          btnBg: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30',
          Icon: AlertTriangle
        };
      case 'due_soon':
        return {
          bg: 'bg-gradient-to-r from-amber-950/95 to-slate-900/95 border-amber-500/50 shadow-amber-950/50',
          iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          badgeText: 'Masa Pinjam',
          btnBg: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30',
          Icon: AlertTriangle
        };
      case 'award':
      case 'badge':
        return {
          bg: 'bg-gradient-to-r from-amber-950/95 via-yellow-950/90 to-slate-900/95 border-amber-400/50 shadow-amber-950/60',
          iconBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
          badgeBg: 'bg-amber-400/20 text-amber-200 border-amber-400/30',
          badgeText: activeAlert.category === 'award' ? 'Piagam Prestasi' : 'Lencana Literasi',
          btnBg: 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold shadow-amber-950/40',
          Icon: Award
        };
      case 'wishlist':
      default:
        return {
          bg: 'bg-gradient-to-r from-emerald-950/95 via-teal-950/90 to-slate-900/95 border-emerald-500/50 shadow-emerald-950/50',
          iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          badgeText: activeAlert.priority === 'celebration' ? 'Kitab Tersedia' : 'Usulan Disetujui',
          btnBg: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30',
          Icon: activeAlert.priority === 'celebration' ? Sparkles : BookOpen
        };
    }
  };

  const style = getStyle();
  const Icon = style.Icon;

  return (
    <div className="fixed bottom-5 right-4 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] pointer-events-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeAlert.id}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative p-4 sm:p-5 rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden ${style.bg}`}
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-inner ${style.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${style.badgeBg}`}>
                    {style.badgeText}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Bell className="w-3 h-3 text-emerald-400 animate-pulse" />
                    Pemberitahuan Baru
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white tracking-tight mt-0.5 leading-snug">
                  {activeAlert.title}
                </h4>
              </div>
            </div>

            {/* Controls: Audio & Close */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title={isAudioMuted ? 'Bunyikan alert' : 'Bisukan alert'}
              >
                {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Tutup pemberitahuan ini"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Message Content */}
          <p className="text-xs text-slate-300 leading-relaxed pl-0 sm:pl-11 mb-3">
            {activeAlert.message}
          </p>

          {/* Optional Detail Note */}
          {activeAlert.detail && (
            <div className="mb-3.5 p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] text-slate-300/90 leading-normal">
              {activeAlert.detail}
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => onMarkAsRead(activeAlert.id)}
              className="text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-white/5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Tandai Dibaca
            </button>

            <button
              type="button"
              onClick={handleAction}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-md ${style.btnBg}`}
            >
              <span>{activeAlert.actionLabel || 'Buka Halaman'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
