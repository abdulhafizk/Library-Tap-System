import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  X, 
  BookOpen, 
  AlertTriangle, 
  Award, 
  Clock, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Trash2,
  HelpCircle,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SantriNotification } from '../../types';
import { soundManager } from '../../utils/audio';

interface SantriNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SantriNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigateTab: (tab: 'overview' | 'loans' | 'card' | 'visits' | 'wishlist' | 'journal' | 'awards') => void;
  onSimulateNotification: (type: 'wishlist' | 'overdue' | 'award') => void;
  onClearSimulations: () => void;
}

type FilterCategory = 'all' | 'wishlist' | 'overdue' | 'award';

export const SantriNotificationCenter: React.FC<SantriNotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigateTab,
  onSimulateNotification,
  onClearSimulations
}) => {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [showSimulateMenu, setShowSimulateMenu] = useState(false);

  if (!isOpen) return null;

  // Filter calculations
  const unreadCount = notifications.filter(n => !n.read).length;

  const wishlistCount = notifications.filter(n => n.category === 'wishlist').length;
  const overdueCount = notifications.filter(n => n.category === 'overdue' || n.category === 'due_soon').length;
  const awardCount = notifications.filter(n => n.category === 'award' || n.category === 'badge').length;

  const filteredNotifications = notifications.filter(n => {
    if (activeCategory === 'wishlist') return n.category === 'wishlist';
    if (activeCategory === 'overdue') return n.category === 'overdue' || n.category === 'due_soon';
    if (activeCategory === 'award') return n.category === 'award' || n.category === 'badge';
    return true;
  });

  const handleActionClick = (notif: SantriNotification) => {
    onMarkAsRead(notif.id);
    if (notif.actionTab) {
      onNavigateTab(notif.actionTab);
    }
    onClose();
  };

  const handleSimulate = (type: 'wishlist' | 'overdue' | 'award') => {
    onSimulateNotification(type);
    if (type === 'overdue') {
      soundManager.playUrgentAlertSound();
    } else if (type === 'award') {
      soundManager.playAwardFanfareSound();
    } else {
      soundManager.playNotificationSound();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Drawer / Modal */}
      <motion.div
        initial={{ opacity: 0, x: 25, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 25, scale: 0.96 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Notifikasi Santri</h3>
                {unreadCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold animate-pulse">
                    {unreadCount} Baru
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-medium">
                    Semua Terbaca
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Pemberitahuan persetujuan usulan, masa pinjam, dan penghargaan</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium transition-colors"
                title="Tandai semua notifikasi sebagai telah dibaca"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Tandai Dibaca</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Tutup jendela notifikasi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs Bar */}
        <div className="px-4 pt-3 pb-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 font-semibold'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>Semua</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
              {notifications.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('wishlist')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeCategory === 'wishlist'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 font-semibold'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Usulan Buku</span>
            {wishlistCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('overdue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeCategory === 'overdue'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30 font-semibold'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Jatuh Tempo</span>
            {overdueCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                {overdueCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('award')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeCategory === 'award'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30 font-semibold'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Penghargaan</span>
            {awardCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                {awardCount}
              </span>
            )}
          </button>
        </div>

        {/* Notification List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-800/60">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-center text-slate-500 mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-300">Tidak ada notifikasi</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {activeCategory === 'wishlist' && 'Belum ada pembaruan status usulan buku Anda saat ini.'}
                {activeCategory === 'overdue' && 'Alhamdulillah, tidak ada pinjaman yang melewati batas waktu pengembalian.'}
                {activeCategory === 'award' && 'Terus tingkatkan literasi untuk meraih piagam penghargaan dan lencana baru!'}
                {activeCategory === 'all' && 'Semua alert dan informasi penting perpustakaan akan ditampilkan di sini.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map(item => {
              // Icon and style mapping
              let iconElement = <Bell className="w-4 h-4 text-emerald-400" />;
              let borderStyle = 'border-slate-800 bg-slate-800/40';
              let badgeColor = 'bg-slate-700/50 text-slate-300 border-slate-600';
              let badgeLabel = 'Informasi';

              if (item.category === 'overdue') {
                iconElement = <AlertTriangle className="w-4 h-4 text-rose-400" />;
                borderStyle = 'border-rose-900/40 bg-rose-950/20';
                badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                badgeLabel = 'Jatuh Tempo';
              } else if (item.category === 'due_soon') {
                iconElement = <Clock className="w-4 h-4 text-amber-400" />;
                borderStyle = 'border-amber-900/40 bg-amber-950/20';
                badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                badgeLabel = 'Masa Pinjam';
              } else if (item.category === 'award') {
                iconElement = <Award className="w-4 h-4 text-amber-300" />;
                borderStyle = 'border-amber-500/30 bg-amber-950/30';
                badgeColor = 'bg-amber-400/20 text-amber-200 border-amber-400/30';
                badgeLabel = 'Penghargaan Resmi';
              } else if (item.category === 'badge') {
                iconElement = <Sparkles className="w-4 h-4 text-amber-400" />;
                borderStyle = 'border-amber-500/20 bg-amber-950/20';
                badgeColor = 'bg-amber-400/20 text-amber-300 border-amber-400/30';
                badgeLabel = 'Lencana';
              } else if (item.category === 'wishlist') {
                iconElement = item.priority === 'celebration' 
                  ? <Sparkles className="w-4 h-4 text-emerald-400" /> 
                  : <BookOpen className="w-4 h-4 text-emerald-400" />;
                borderStyle = 'border-emerald-900/40 bg-emerald-950/20';
                badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                badgeLabel = item.priority === 'celebration' ? 'Kitab Tersedia' : 'Usulan Disetujui';
              }

              return (
                <div
                  key={item.id}
                  className={`pt-3 first:pt-0 rounded-2xl p-3.5 sm:p-4 border transition-all ${borderStyle} ${
                    !item.read ? 'ring-1 ring-emerald-500/40' : 'opacity-90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                        {iconElement}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${badgeColor}`}>
                        {badgeLabel}
                      </span>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <h5 className="text-xs sm:text-sm font-bold text-white tracking-tight mb-1">
                    {item.title}
                  </h5>

                  <p className="text-xs text-slate-300 leading-relaxed mb-2.5">
                    {item.message}
                  </p>

                  {item.detail && (
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300/90 mb-3 leading-normal">
                      {item.detail}
                    </div>
                  )}

                  {/* Actions footer */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {!item.read ? (
                      <button
                        type="button"
                        onClick={() => onMarkAsRead(item.id)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Tandai Dibaca
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5 text-slate-500" />
                        Telah Dibaca
                      </span>
                    )}

                    {item.actionTab && (
                      <button
                        type="button"
                        onClick={() => handleActionClick(item)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all active:scale-95"
                      >
                        <span>{item.actionLabel || 'Buka Halaman'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Interactive Simulation / Testing Toolbar (Footer) */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 text-xs">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setShowSimulateMenu(!showSimulateMenu)}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showSimulateMenu ? 'Sembunyikan Panel Uji Real-Time' : '🧪 Uji Coba Simulasi Alert Real-Time'}</span>
            </button>

            {notifications.some(n => n.id.startsWith('custom-')) && (
              <button
                type="button"
                onClick={onClearSimulations}
                className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                title="Hapus simulasi buatan"
              >
                <Trash2 className="w-3 h-3" />
                <span>Bersihkan Uji Coba</span>
              </button>
            )}
          </div>

          {showSimulateMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 pt-1 border-t border-slate-800/60"
            >
              <p className="text-[10px] text-slate-400">
                Tekan tombol di bawah untuk membuktikan notifikasi instan secara real-time lengkap dengan efek suara:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulate('wishlist')}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-600/40 hover:bg-emerald-900/60 text-emerald-200 text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Usulan Disetujui</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulate('overdue')}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 border border-rose-600/40 hover:bg-rose-900/60 text-rose-200 text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Jatuh Tempo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulate('award')}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-950/60 border border-amber-600/40 hover:bg-amber-900/60 text-amber-200 text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Penghargaan Baru</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
