import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Radio, 
  Users, 
  CreditCard, 
  History, 
  DoorOpen, 
  BarChart3, 
  Settings, 
  Library,
  BookOpen,
  ShieldCheck,
  UserCheck,
  Tv,
  Trophy
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';

export type NavTab = 
  | 'dashboard' 
  | 'tap' 
  | 'circulation'
  | 'awards'
  | 'kiosk'
  | 'students' 
  | 'cards' 
  | 'visits' 
  | 'live' 
  | 'stats' 
  | 'users'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenProfile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
  onOpenProfile
}) => {
  const { activeVisitsCount, activeLoansCount, overdueLoansCount, currentUser, logout, settings } = useLibrary();

  const mainNavItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tap' as NavTab, label: 'Tap Presensi RFID', icon: Radio, highlight: true },
    { 
      id: 'circulation' as NavTab, 
      label: 'Sirkulasi Buku', 
      icon: BookOpen, 
      badge: activeLoansCount > 0 ? activeLoansCount : undefined,
      badgeColor: overdueLoansCount > 0 ? 'bg-rose-500 text-white' : 'bg-blue-600 text-white',
      highlight: true
    },
    {
      id: 'awards' as NavTab,
      label: 'Penghargaan & XP',
      icon: Trophy,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
      highlight: true
    },
    { id: 'kiosk' as NavTab, label: 'Display Kios TV', icon: Tv },
    { id: 'students' as NavTab, label: 'Data Santri', icon: Users },
    { id: 'cards' as NavTab, label: 'Data Kartu RFID', icon: CreditCard },
    { id: 'visits' as NavTab, label: 'Riwayat Kunjungan', icon: History },
  ];

  const reportNavItems = [
    { 
      id: 'live' as NavTab, 
      label: 'Sedang di Perpustakaan', 
      icon: DoorOpen, 
      badge: activeVisitsCount > 0 ? activeVisitsCount : undefined,
      badgeColor: 'bg-emerald-500 text-white'
    },
    { id: 'stats' as NavTab, label: 'Statistik & Analitik', icon: BarChart3 },
    { 
      id: 'users' as NavTab, 
      label: 'Kelola Pengguna', 
      icon: ShieldCheck,
      badge: currentUser?.role === 'admin' ? 'Admin' : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold'
    },
    { id: 'settings' as NavTab, label: 'Pengaturan', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop with AnimatePresence */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
            onClick={onCloseMobile}
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 lg:w-72 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-200 dark:border-slate-800 shadow-xs
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-blue-200 dark:shadow-none">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 dark:text-white leading-none text-base">Library Tap</h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider font-semibold">Attendance System</p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
            RFID
          </span>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-4 space-y-1 overflow-y-auto no-scrollbar">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-2 mt-2">
            Menu Utama
          </div>

          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`
                  relative w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer group
                  ${isActive 
                    ? 'text-blue-700 dark:text-blue-400 font-semibold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                  }
                `}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-0 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-100/80 dark:border-blue-800/50"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}

                <div className="relative z-10 flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`} />
                  <span>{item.label}</span>
                </div>

                <div className="relative z-10 flex items-center gap-1.5">
                  {item.badge !== undefined && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.badgeColor || 'bg-blue-600 text-white'}`}>
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && item.badge === undefined && !isActive && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-2 mt-6">
            Laporan & Sistem
          </div>

          {reportNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`
                  relative w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer group
                  ${isActive 
                    ? 'text-blue-700 dark:text-blue-400 font-semibold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                  }
                `}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-0 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-100/80 dark:border-blue-800/50"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}

                <div className="relative z-10 flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`} />
                  <span>{item.label}</span>
                </div>

                <div className="relative z-10">
                  {item.badge !== undefined && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.badgeColor || 'bg-emerald-500 text-white'}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* User profile & Logout in footer */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          {currentUser ? (
            <div className="space-y-2">
              <div 
                onClick={onOpenProfile}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                title="Buka Profil Saya"
              >
                <img 
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} 
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-xl object-cover bg-slate-200 dark:bg-slate-700 border border-emerald-500/30 shrink-0 shadow-2xs"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate">
                    @{currentUser.username} • {currentUser.role === 'admin' ? 'Administrator' : 'Staff Petugas'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-700/50">
                <button
                  id="btn-sidebar-my-profile"
                  onClick={onOpenProfile}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-medium border border-slate-200 dark:border-slate-600 shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <UserCheck className="w-3 h-3 text-emerald-500" />
                  <span>Profil</span>
                </button>
                <button
                  id="btn-sidebar-logout"
                  onClick={logout}
                  title="Keluar dari Akun"
                  className="py-1.5 px-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 text-[11px] font-medium border border-rose-200 dark:border-rose-800 shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-1 text-xs text-slate-400">
              Belum login
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
