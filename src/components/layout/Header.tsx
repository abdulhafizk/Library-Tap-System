import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  Bell, 
  Volume2, 
  VolumeX, 
  Radio, 
  Search, 
  ShieldCheck, 
  UserCheck, 
  CheckCheck,
  Trash2,
  X,
  Moon,
  Sun,
  MessageSquare,
  Tv,
  LogOut,
  Users,
  Settings,
  ChevronDown,
  User,
  Database,
  RefreshCw,
  Zap
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { NavTab } from './Sidebar';
import { WhatsAppManagerModal } from '../settings/WhatsAppManagerModal';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  onNavigate: (tab: NavTab) => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileSidebar, onNavigate, onOpenProfile }) => {
  const { 
    settings, 
    updateSettings, 
    toggleDarkMode,
    isDarkMode,
    currentUser, 
    logout, 
    notifications, 
    markNotificationRead,
    clearNotifications,
    students,
    cards,
    whatsappLogs,
    isWhatsAppModalOpen,
    openWhatsAppModal,
    closeWhatsAppModal,
    isRealtimeConnected,
    isSupabaseSyncing,
    lastRealtimeSync,
    pullFromSupabase
  } = useLibrary();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Clock ticker in WIB
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
      );
      setCurrentDate(
        now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadNotifs = notifications.filter(n => !n.read);

  // Search Results
  const filteredStudents = searchQuery.trim() ? students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nis.includes(searchQuery) ||
    s.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.rfid_uid && s.rfid_uid.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 5) : [];

  const filteredCards = searchQuery.trim() ? cards.filter(c => 
    c.uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.note && c.note.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 3) : [];

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between transition-all">
        {/* Left: Mobile Toggle & Search Input */}
        <div className="flex items-center gap-4 flex-1">
          <button
            id="btn-mobile-menu"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative w-full max-w-sm hidden sm:block">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              onClick={() => setShowSearchModal(true)}
              placeholder="Cari santri atau NIS..."
              readOnly
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            />
          </div>

          <div className="sm:hidden">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight leading-none truncate max-w-[180px]">
              {settings.library_name}
            </h2>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Realtime Database Sync Badge (Auto Refresh every 5s) */}
          <button
            id="btn-header-realtime-status"
            onClick={() => pullFromSupabase()}
            disabled={isSupabaseSyncing}
            title={isRealtimeConnected 
              ? `Realtime DB Aktif (Auto-refresh otomatis setiap 5 detik). ${lastRealtimeSync ? `Terakhir diperbarui: ${new Date(lastRealtimeSync).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB.` : ''} Klik untuk sinkronisasi manual sekarang.` 
              : "Menghubungkan ke Database Supabase Real-time. Klik untuk cek koneksi."
            }
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              isRealtimeConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 shadow-2xs'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100'
            }`}
          >
            {isSupabaseSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
            ) : isRealtimeConnected ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <Zap className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span className="hidden xl:inline">{isSupabaseSyncing ? 'Sinkronisasi...' : isRealtimeConnected ? 'Realtime DB (5s)' : 'Cloud DB'}</span>
          </button>

          {/* Live Clock Widget */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{currentTime}</span>
          </div>

          {/* WhatsApp Notification Quick Panel Button - Only on Laptop/Desktop (lg+) */}
          <button
            id="btn-header-whatsapp"
            onClick={openWhatsAppModal}
            title="Integrasi WhatsApp: Notifikasi Santri & Pengingat Buka/Tutup"
            className="hidden lg:flex h-9 px-3 items-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer text-xs font-bold shadow-2xs"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>WhatsApp</span>
            {whatsappLogs.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
            )}
          </button>

          {/* Mode Kios Display TV Quick Button - Only on Laptop/Desktop (lg+) */}
          <button
            id="btn-header-kiosk-tv"
            onClick={() => onNavigate('kiosk')}
            title="Buka Mode Kios Display TV Layar Penuh"
            className="hidden lg:flex h-9 px-3 items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer text-xs font-bold shadow-2xs"
          >
            <Tv className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Display TV</span>
          </button>

          {/* Dark Mode Quick Toggle */}
          <button
            id="btn-header-dark-mode"
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
            className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700 shadow-2xs'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Sound Toggle - Only on Laptop/Desktop (lg+) */}
          <button
            id="btn-toggle-sound"
            onClick={() => updateSettings({ sound_enabled: !settings.sound_enabled })}
            title={settings.sound_enabled ? 'Suara Aktif' : 'Suara Dimatikan'}
            className={`hidden lg:flex w-9 h-9 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
              settings.sound_enabled 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {settings.sound_enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              id="btn-notifications"
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 relative cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/60 dark:border-slate-700"
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
              )}
            </button>

            {/* Notifications Popover */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 px-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Notifikasi</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                        {notifications.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {notifications.length > 0 && (
                        <button
                          onClick={clearNotifications}
                          className="text-[11px] text-slate-400 hover:text-rose-600 p-1 flex items-center gap-1 cursor-pointer"
                          title="Hapus Semua"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto py-2 space-y-1.5">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                        Tidak ada notifikasi baru
                      </div>
                    ) : (
                      notifications.map((notif, idx) => (
                        <div
                          key={notif.id || `notif-${idx}-${notif.timestamp}`}
                          onClick={() => markNotificationRead(notif.id)}
                          className={`p-2.5 rounded-xl text-xs transition-colors cursor-pointer flex gap-2.5 ${
                            notif.read 
                              ? 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300' 
                              : 'bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            notif.type === 'success' ? 'bg-emerald-500' :
                            notif.type === 'warning' ? 'bg-amber-500' :
                            notif.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'
                          }`} />
                          <div className="flex-1">
                            <p className="font-semibold">{notif.title}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                              {new Date(notif.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Primary Action: Tap Kartu Baru */}
          <button
            id="btn-quick-tap"
            onClick={() => onNavigate('tap')}
            className="px-3.5 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-sm shadow-blue-200 dark:shadow-none flex items-center gap-2 cursor-pointer"
          >
            <Radio className="w-4 h-4" />
            <span className="hidden sm:inline">Tap Kartu</span>
            <span className="sm:hidden">Tap</span>
          </button>

          {/* User Profile Dropdown */}
          {currentUser && (
            <div className="relative">
              <button
                id="btn-header-user-menu"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer"
              >
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-lg object-cover border border-emerald-500/40"
                />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              <AnimatePresence>
                {showUserDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowUserDropdown(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
                      className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50"
                    >
                      {/* User Card */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                            alt={currentUser.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-xl object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {currentUser.name}
                            </p>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate">
                              @{currentUser.username}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                            currentUser.role === 'admin'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40'
                          }`}>
                            {currentUser.role === 'admin' ? '👑 Administrator' : '👤 Petugas Staff'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {currentUser.phone || ''}
                          </span>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="space-y-0.5 text-xs text-slate-700 dark:text-slate-300">
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            if (onOpenProfile) onOpenProfile();
                          }}
                          className="w-full px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4 text-emerald-500" />
                          <span>Profil Saya & Kata Sandi</span>
                        </button>

                        {currentUser.role === 'admin' && (
                          <button
                            onClick={() => {
                              setShowUserDropdown(false);
                              onNavigate('users');
                            }}
                            className="w-full px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
                          >
                            <Users className="w-4 h-4 text-amber-500" />
                            <span>Kelola Akun Pengguna</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            onNavigate('settings');
                          }}
                          className="w-full px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>Pengaturan Sistem</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            onNavigate('kiosk');
                          }}
                          className="w-full px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
                        >
                          <Tv className="w-4 h-4 text-blue-500" />
                          <span>Mode Kios Display TV</span>
                        </button>
                      </div>

                      <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            logout();
                          }}
                          className="w-full px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2.5 text-left text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Keluar (Logout)</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>

      {/* Global Search Modal with AnimatePresence */}
      <AnimatePresence>
        {showSearchModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => {
              setShowSearchModal(false);
              setSearchQuery('');
            }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-start justify-center pt-16 px-4 cursor-pointer"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden cursor-default"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik nama santri, NIS, kelas, atau UID RFID..."
                  className="flex-1 text-sm outline-hidden text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent"
                />
                <button
                  onClick={() => {
                    setShowSearchModal(false);
                    setSearchQuery('');
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 max-h-96 overflow-y-auto space-y-3">
                {searchQuery.trim() === '' ? (
                  <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    Ketik sesuatu untuk mulai mencari data santri atau kartu RFID.
                  </div>
                ) : (
                  <>
                    {filteredStudents.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase text-slate-400 dark:text-slate-500 px-2 mb-1.5">Santri Ditemukan</p>
                        <div className="space-y-1">
                          {filteredStudents.map((s, sIdx) => (
                            <div
                              key={s.id || `search-s-${s.nis}-${sIdx}`}
                              onClick={() => {
                                setShowSearchModal(false);
                                onNavigate('students');
                              }}
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                {s.photo_url && s.photo_url.trim() !== '' ? (
                                  <img src={s.photo_url} alt={s.name} className="w-7 h-7 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                    <User className="w-4 h-4" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{s.name}</p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400">NIS: {s.nis} • Kelas {s.class}</p>
                                </div>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                                {s.rfid_uid || 'Belum ada kartu'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredCards.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase text-slate-400 dark:text-slate-500 px-2 mb-1.5">Kartu RFID Ditemukan</p>
                        <div className="space-y-1">
                          {filteredCards.map((c, cIdx) => (
                            <div
                              key={c.id || `search-c-${c.uid}-${cIdx}`}
                              onClick={() => {
                                setShowSearchModal(false);
                                onNavigate('cards');
                              }}
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer transition-colors"
                            >
                              <div>
                                <p className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{c.uid}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">{c.note || 'Kartu RFID'}</p>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                c.status === 'active' 
                                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50' 
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}>
                                {c.status.toUpperCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredStudents.length === 0 && filteredCards.length === 0 && (
                      <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                        Tidak ditemukan data santri atau kartu dengan kata kunci "{searchQuery}".
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* WhatsApp Integration Management Modal */}
      {isWhatsAppModalOpen && (
        <WhatsAppManagerModal 
          isOpen={isWhatsAppModalOpen} 
          onClose={closeWhatsAppModal} 
        />
      )}
    </>
  );
};
