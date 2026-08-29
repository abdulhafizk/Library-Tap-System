import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Radio, 
  BookOpen, 
  Users, 
  Grid, 
  History, 
  Trophy, 
  BarChart3, 
  DoorOpen, 
  CreditCard, 
  Tv, 
  Settings, 
  ShieldCheck, 
  X,
  ChevronUp,
  User,
  LogOut,
  Shield
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { useLibrary } from '../../context/LibraryContext';

interface MobileBottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenProfile?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenProfile
}) => {
  const { 
    activeVisitsCount, 
    activeLoansCount, 
    overdueLoansCount,
    currentUser,
    logout
  } = useLibrary();

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // If in kiosk mode, hide the mobile nav for maximum screen area
  if (currentTab === 'kiosk') {
    return null;
  }

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    setIsMoreMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const moreMenuItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number | string; badgeColor?: string }[] = [
    { 
      id: 'visits', 
      label: 'Riwayat Kunjungan', 
      icon: History 
    },
    { 
      id: 'live', 
      label: 'Sedang di Perpustakaan', 
      icon: DoorOpen, 
      badge: activeVisitsCount > 0 ? activeVisitsCount : undefined,
      badgeColor: 'bg-emerald-500 text-white'
    },
    { 
      id: 'awards', 
      label: 'Penghargaan & XP', 
      icon: Trophy 
    },
    { 
      id: 'cards', 
      label: 'Data Kartu RFID', 
      icon: CreditCard 
    },
    { 
      id: 'stats', 
      label: 'Statistik & Analitik', 
      icon: BarChart3 
    },
    { 
      id: 'kiosk', 
      label: 'Display Kios TV', 
      icon: Tv 
    },
    ...(currentUser?.role === 'admin' ? [{ 
      id: 'users' as NavTab, 
      label: 'Kelola Pengguna', 
      icon: ShieldCheck 
    }] : []),
    { 
      id: 'settings', 
      label: 'Pengaturan Sistem', 
      icon: Settings 
    },
  ];

  return (
    <>
      {/* Mobile More Sheet Modal */}
      <AnimatePresence>
        {isMoreMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsMoreMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 rounded-t-3xl z-50 p-5 shadow-2xl border-t border-slate-200 dark:border-slate-800 lg:hidden max-h-[82vh] overflow-y-auto"
            >
              {/* Drag Handle & Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Grid className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-none">Semua Menu</h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Akses seluruh modul perpustakaan</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Tutup Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Card on Mobile More Menu */}
              {currentUser && (
                <div className="mb-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {currentUser.avatar_url ? (
                      <img 
                        src={currentUser.avatar_url} 
                        alt={currentUser.name} 
                        className="w-10 h-10 rounded-xl object-cover border border-white dark:border-slate-700 shadow-2xs shrink-0" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                        {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'US'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md uppercase tracking-wider ${
                          currentUser.role === 'admin' 
                            ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' 
                            : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        }`}>
                          {currentUser.role === 'admin' ? 'Admin' : 'Pustakawan'}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">@{currentUser.username}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onOpenProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          onOpenProfile();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-blue-600 dark:text-blue-300 border border-slate-200 dark:border-slate-600 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Profil</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        logout();
                      }}
                      title="Keluar"
                      className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[11px] font-bold flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Grid of Menu Items */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                {moreMenuItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-xs'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {item.badge && (
                        <span className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${item.badgeColor || 'bg-blue-600 text-white'}`}>
                          {item.badge}
                        </span>
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-xs' 
                          : 'bg-white dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 shadow-2xs'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold leading-tight line-clamp-2">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Close Button */}
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="w-full mt-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Tutup Panel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Docked Floating Bottom Navigation Bar on Mobile */}
      <nav 
        id="mobile-bottom-navbar"
        aria-label="Navigasi Bawah Smartphone"
        className="fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden px-2 py-1.5"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-1">
          {/* Tab 1: Dashboard */}
          <button
            onClick={() => handleTabClick('dashboard')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              currentTab === 'dashboard'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentTab === 'dashboard' ? 'bg-blue-50 dark:bg-blue-900/40' : ''}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Beranda</span>
          </button>

          {/* Tab 2: Tap Presensi RFID (Prominent Center/Quick action) */}
          <button
            onClick={() => handleTabClick('tap')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              currentTab === 'tap'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg relative ${currentTab === 'tap' ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''}`}>
              <Radio className="w-5 h-5" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-bold text-emerald-600 dark:text-emerald-400">Presensi</span>
          </button>

          {/* Tab 3: Sirkulasi */}
          <button
            onClick={() => handleTabClick('circulation')}
            className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              currentTab === 'circulation'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {activeLoansCount > 0 && (
              <span className={`absolute top-0.5 right-2 px-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[8px] font-black ${
                overdueLoansCount > 0 ? 'bg-rose-500 text-white' : 'bg-blue-600 text-white'
              }`}>
                {activeLoansCount}
              </span>
            )}
            <div className={`p-1 rounded-lg ${currentTab === 'circulation' ? 'bg-blue-50 dark:bg-blue-900/40' : ''}`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Sirkulasi</span>
          </button>

          {/* Tab 4: Santri */}
          <button
            onClick={() => handleTabClick('students')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              currentTab === 'students'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${currentTab === 'students' ? 'bg-blue-50 dark:bg-blue-900/40' : ''}`}>
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Santri</span>
          </button>

          {/* Tab 5: More Menu Button */}
          <button
            onClick={() => setIsMoreMenuOpen(prev => !prev)}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              isMoreMenuOpen || ['visits', 'awards', 'cards', 'live', 'stats', 'users', 'settings'].includes(currentTab)
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${
              isMoreMenuOpen || ['visits', 'awards', 'cards', 'live', 'stats', 'users', 'settings'].includes(currentTab)
                ? 'bg-indigo-50 dark:bg-indigo-950/60'
                : ''
            }`}>
              <Grid className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Lainnya</span>
          </button>
        </div>
      </nav>
    </>
  );
};
