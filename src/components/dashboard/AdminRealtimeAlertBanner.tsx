import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  Clock, 
  BookPlus, 
  DoorOpen, 
  CreditCard, 
  WifiOff, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  Volume2, 
  VolumeX,
  BellRing,
  ExternalLink,
  Users
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { NavTab } from '../layout/Sidebar';
import { 
  AdminAlertNotification, 
  generateAdminAlerts, 
  markAdminAlertAsRead, 
  dismissAdminToast,
  getAdminDismissedToastIds 
} from '../../utils/adminNotificationUtils';
import { isSupabaseConfigured } from '../../lib/supabase';
import { soundManager } from '../../utils/audio';

interface AdminRealtimeAlertBannerProps {
  onNavigate: (tab: NavTab) => void;
  soundEnabled?: boolean;
}

export const AdminRealtimeAlertBanner: React.FC<AdminRealtimeAlertBannerProps> = ({
  onNavigate,
  soundEnabled = true
}) => {
  const {
    loans,
    books,
    students,
    wishlists,
    visits,
    settings,
    isRealtimeConnected,
    lastUnregisteredCardUid,
    lastUnregisteredTimestamp,
    clearLastUnregisteredCard
  } = useLibrary();

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => getAdminDismissedToastIds());
  const [isAudioMuted, setIsAudioMuted] = useState(!soundEnabled);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'urgent' | 'warning'>('all');

  // Compute live alerts using the centralized generator
  const allAlerts = React.useMemo(() => {
    return generateAdminAlerts({
      loans,
      books,
      students,
      wishlists,
      visits,
      settings,
      isRealtimeConnected,
      isSupabaseConfigured,
      lastUnregisteredCardUid,
      lastUnregisteredTimestamp
    });
  }, [
    loans,
    books,
    students,
    wishlists,
    visits,
    settings,
    isRealtimeConnected,
    lastUnregisteredCardUid,
    lastUnregisteredTimestamp
  ]);

  // Filter out alerts explicitly dismissed in this session
  const visibleAlerts = allAlerts.filter(a => !dismissedIds.has(a.id));

  // Play audio chime when a new urgent alert occurs
  const topUrgentAlert = visibleAlerts.find(a => a.priority === 'urgent' && !a.read);
  useEffect(() => {
    if (!topUrgentAlert || isAudioMuted) return;

    if (topUrgentAlert.category === 'overdue_loan' || topUrgentAlert.category === 'capacity_warning') {
      soundManager.playUrgentAlertSound();
    } else if (topUrgentAlert.category === 'supabase_disconnected') {
      soundManager.playErrorSound();
    }
  }, [topUrgentAlert?.id, isAudioMuted]);

  if (visibleAlerts.length === 0) {
    return null;
  }

  const handleDismissAlert = (alertId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    dismissAdminToast(alertId);
    setDismissedIds(prev => new Set([...prev, alertId]));
    
    // If it was an unregistered card alert, clear it from memory as well
    if (alertId.includes('unreg-card')) {
      clearLastUnregisteredCard();
    }
  };

  const handleActionClick = (alert: AdminAlertNotification) => {
    markAdminAlertAsRead(alert.id);
    if (alert.actionTab) {
      onNavigate(alert.actionTab as NavTab);
    }
  };

  // Icon & Theme builder
  const getCategoryStyles = (alert: AdminAlertNotification) => {
    switch (alert.category) {
      case 'overdue_loan':
        return {
          icon: Clock,
          border: 'border-rose-300 dark:border-rose-900/60',
          bg: 'bg-gradient-to-r from-rose-50 via-rose-50/70 to-red-50/40 dark:from-rose-950/40 dark:via-rose-900/20 dark:to-slate-900/40',
          badgeBg: 'bg-rose-500 text-white',
          iconBg: 'bg-rose-500 text-white',
          btnBg: 'bg-rose-600 hover:bg-rose-700 text-white',
          accentText: 'text-rose-900 dark:text-rose-200'
        };
      case 'pending_wishlist':
        return {
          icon: BookPlus,
          border: 'border-amber-300 dark:border-amber-900/60',
          bg: 'bg-gradient-to-r from-amber-50 via-amber-50/70 to-yellow-50/40 dark:from-amber-950/40 dark:via-amber-900/20 dark:to-slate-900/40',
          badgeBg: 'bg-amber-500 text-slate-950 font-bold',
          iconBg: 'bg-amber-500 text-slate-950',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
          accentText: 'text-amber-900 dark:text-amber-200'
        };
      case 'capacity_warning':
        return {
          icon: DoorOpen,
          border: 'border-orange-300 dark:border-orange-900/60',
          bg: 'bg-gradient-to-r from-orange-50 via-orange-50/70 to-amber-50/40 dark:from-orange-950/40 dark:via-orange-900/20 dark:to-slate-900/40',
          badgeBg: 'bg-orange-500 text-white font-bold',
          iconBg: 'bg-orange-500 text-white',
          btnBg: 'bg-orange-600 hover:bg-orange-700 text-white',
          accentText: 'text-orange-900 dark:text-orange-200'
        };
      case 'unregistered_rfid':
        return {
          icon: CreditCard,
          border: 'border-indigo-300 dark:border-indigo-900/60',
          bg: 'bg-gradient-to-r from-indigo-50 via-indigo-50/70 to-purple-50/40 dark:from-indigo-950/40 dark:via-indigo-900/20 dark:to-slate-900/40',
          badgeBg: 'bg-indigo-600 text-white font-bold',
          iconBg: 'bg-indigo-600 text-white',
          btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
          accentText: 'text-indigo-900 dark:text-indigo-200'
        };
      case 'supabase_disconnected':
      default:
        return {
          icon: WifiOff,
          border: 'border-slate-300 dark:border-slate-800',
          bg: 'bg-gradient-to-r from-slate-100 via-slate-50 to-rose-50/30 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-rose-950/20',
          badgeBg: 'bg-slate-700 text-white font-bold',
          iconBg: 'bg-slate-700 text-white',
          btnBg: 'bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600',
          accentText: 'text-slate-800 dark:text-slate-200'
        };
    }
  };

  const urgentCount = visibleAlerts.filter(a => a.priority === 'urgent').length;
  const filteredAlerts = visibleAlerts.filter(a => {
    if (selectedCategoryFilter === 'urgent') return a.priority === 'urgent';
    if (selectedCategoryFilter === 'warning') return a.priority === 'warning';
    return true;
  });

  return (
    <div className="space-y-3" id="admin-realtime-alerts-section">
      {/* Alert Header Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-900/50">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
            <BellRing className="w-3.5 h-3.5" />
            <span>{visibleAlerts.length} Perhatian Sistem & Sirkulasi</span>
          </div>

          {urgentCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
              {urgentCount} Kritis
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Audio toggle button */}
          <button
            type="button"
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs flex items-center gap-1 cursor-pointer"
            title={isAudioMuted ? 'Aktifkan Suara Alert' : 'Bisukan Suara Alert'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
            <span className="text-[11px] hidden sm:inline">{isAudioMuted ? 'Mute' : 'Audio On'}</span>
          </button>

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                selectedCategoryFilter === 'all' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              Semua ({visibleAlerts.length})
            </button>
            {urgentCount > 0 && (
              <button
                onClick={() => setSelectedCategoryFilter('urgent')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                  selectedCategoryFilter === 'urgent' 
                    ? 'bg-rose-500 text-white shadow-2xs' 
                    : 'text-rose-600 dark:text-rose-400 hover:text-rose-700'
                }`}
              >
                Kritis ({urgentCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alert Cards Container */}
      <div className="space-y-2.5">
        <AnimatePresence>
          {filteredAlerts.map((alert) => {
            const styles = getCategoryStyles(alert);
            const Icon = styles.icon;

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                transition={{ duration: 0.2 }}
                className={`p-3.5 sm:p-4 rounded-2xl border ${styles.border} ${styles.bg} shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative group`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl ${styles.iconBg} flex items-center justify-center shrink-0 shadow-2xs mt-0.5`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0 pr-6 sm:pr-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${styles.badgeBg}`}>
                        {alert.category === 'overdue_loan' && 'Overdue & Denda'}
                        {alert.category === 'pending_wishlist' && 'Usulan Kitab Santri'}
                        {alert.category === 'capacity_warning' && 'Kapasitas Ruangan'}
                        {alert.category === 'unregistered_rfid' && 'Tap Kartu Baru'}
                        {alert.category === 'supabase_disconnected' && 'Mode Offline'}
                      </span>
                      <h4 className={`text-xs sm:text-sm font-bold truncate ${styles.accentText}`}>
                        {alert.title}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {alert.message}
                    </p>

                    {alert.detail && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic line-clamp-1 sm:line-clamp-none">
                        💡 {alert.detail}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800">
                  {alert.actionLabel && (
                    <button
                      type="button"
                      onClick={() => handleActionClick(alert)}
                      className={`px-3.5 py-2 rounded-xl ${styles.btnBg} text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer`}
                    >
                      <span>{alert.actionLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDismissAlert(alert.id, e)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    title="Abaikan alert ini"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
