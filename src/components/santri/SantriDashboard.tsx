import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LogOut, 
  GraduationCap, 
  CheckCircle2, 
  BookOpen, 
  ShieldCheck, 
  CreditCard, 
  History, 
  Home, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  ArrowLeft,
  Radio, 
  QrCode,
  BookMarked,
  Sparkles,
  BookPlus,
  PenTool,
  Bell,
  Award,
  CheckCheck,
  Trophy,
  Undo2,
  Bookmark,
  User,
  Layers,
  Lock,
  KeyRound,
  Flame
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { Student, SantriMenuKey, SantriMenu, StreakMilestone } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { SantriLoansTab } from './SantriLoansTab';
import { SantriCardTab } from './SantriCardTab';
import { SantriVisitsTab } from './SantriVisitsTab';
import { SantriWishlistTab } from './SantriWishlistTab';
import { SantriJournalTab } from './SantriJournalTab';
import { SantriAwardsTab } from './SantriAwardsTab';
import { SantriCatalogTab } from './SantriCatalogTab';
import { SantriReadingStreakPage } from './SantriReadingStreakPage';
import { ReadingStreakCard } from './ReadingStreakCard';
import { ReadingStreakReminder } from './ReadingStreakReminder';
import { ReadingMilestoneModal } from './ReadingMilestoneModal';
import { calculateSantriStreak } from '../../utils/readingStreakUtils';
import { SantriNotificationToast } from './SantriNotificationToast';
import { SantriNotificationCenter } from './SantriNotificationCenter';
import { SantriWebPushPrompt } from './SantriWebPushPrompt';
import { SantriChangePasswordModal } from './SantriChangePasswordModal';
import { webPushManager } from '../../utils/webPushManager';
import { UnderDevelopmentOverlay } from './UnderDevelopmentOverlay';
import { PWAInstallButton } from '../common/PWAInstallButton';
import {
  generateSantriNotifications,
  markSantriNotificationAsRead,
  markAllSantriNotificationsAsRead,
  markSantriNotificationsAsSeen,
  dismissSantriNotificationToast,
  isToastDismissed,
  addCustomSantriNotification,
  clearAllCustomSantriNotifications
} from '../../utils/santriNotificationUtils';

// Icon resolver helper for dynamic menus
const getMenuIcon = (iconName: string, className = 'w-4 h-4') => {
  switch (iconName) {
    case 'Home':
    case 'LayoutDashboard':
      return <Home className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'BookMarked':
      return <BookMarked className={className} />;
    case 'Undo2':
      return <Undo2 className={className} />;
    case 'History':
      return <History className={className} />;
    case 'CreditCard':
      return <CreditCard className={className} />;
    case 'Clock':
      return <Clock className={className} />;
    case 'BookPlus':
      return <BookPlus className={className} />;
    case 'PenTool':
      return <PenTool className={className} />;
    case 'Trophy':
    case 'Award':
      return <Trophy className={className} />;
    case 'Bookmark':
      return <Bookmark className={className} />;
    case 'Bell':
      return <Bell className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'User':
      return <User className={className} />;
    default:
      return <BookOpen className={className} />;
  }
};

export const SantriDashboard: React.FC = () => {
  const { 
    currentUser, 
    students, 
    cards, 
    books, 
    loans, 
    visits, 
    logout, 
    settings, 
    wishlists, 
    awards, 
    santriMenus,
    readingActivities,
    getSantriStreak,
    addReadingActivity
  } = useLibrary();

  // Navigation tab state supporting all dynamic santri menu keys
  const [activeTab, setActiveTab] = useState<SantriMenuKey>('overview');

  // Reading Milestone celebration state
  const [celebrationMilestone, setCelebrationMilestone] = useState<{ milestone: StreakMilestone; streak: number } | null>(null);

  // Real-time notification center state
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState(false);
  const [refreshNotifsKey, setRefreshNotifsKey] = useState(0);
  const [dismissedToastIds, setDismissedToastIds] = useState<Set<string>>(new Set());

  // State untuk modal ganti kata sandi
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isFirstLoginChange, setIsFirstLoginChange] = useState(false);

  // Deteksi otomatis jika santri pertama kali login atau masih menggunakan password default 'akunsantri'
  useEffect(() => {
    if (!currentUser) return;
    const isDefaultPass = !currentUser.password_changed && (currentUser.password === 'akunsantri' || currentUser.is_first_login);
    if (isDefaultPass) {
      setIsFirstLoginChange(true);
      setIsPasswordModalOpen(true);
    }
  }, [currentUser]);

  // Find the dynamically connected Santri record
  const connectedStudent: Student = useMemo(() => {
    const found = students.find(s => 
      (currentUser?.student_id && s.id === currentUser.student_id) ||
      (currentUser?.santri_id && s.id === currentUser.santri_id) ||
      (s.nis && currentUser?.username && s.nis.trim().toLowerCase() === currentUser.username.trim().toLowerCase())
    );

    if (found) return found;

    // Graceful fallback dummy student object if record is missing
    return {
      id: currentUser?.student_id || 'santri-fallback',
      nis: currentUser?.username || '20260001',
      name: currentUser?.name || 'Santri',
      class: 'Asrama Putra',
      gender: 'L',
      photo_url: currentUser?.avatar || '',
      rfid_uid: `RFID-${currentUser?.username || 'DEFAULT'}`,
      status: 'active',
      created_at: new Date().toISOString()
    };
  }, [students, currentUser]);

  // Santri active loans and visits count for badges
  const studentLoans = useMemo(() => {
    return loans.filter(l => l.student_id === connectedStudent.id);
  }, [loans, connectedStudent.id]);

  const activeLoans = useMemo(() => {
    return studentLoans.filter(l => l.status === 'borrowed' || l.status === 'overdue' || (l.status as string) === 'active');
  }, [studentLoans]);

  const now = new Date();
  const overdueLoans = useMemo(() => {
    return activeLoans.filter(l => new Date(l.due_date) < now);
  }, [activeLoans, now]);

  const studentVisits = useMemo(() => {
    return visits.filter(v => 
      v.student_id === connectedStudent.id || 
      (connectedStudent.rfid_uid && v.rfid_uid && v.rfid_uid.toLowerCase() === connectedStudent.rfid_uid.toLowerCase())
    );
  }, [visits, connectedStudent]);

  const isInsideLibrary = studentVisits.some(v => v.status === 'inside');

  // Dynamic Santri Details
  const santriName = connectedStudent.name;
  const santriNis = connectedStudent.nis;
  const santriClass = connectedStudent.class;
  const photoUrl = connectedStudent.photo_url;

  // Real-time notifications generator
  const notifications = useMemo(() => {
    return generateSantriNotifications({
      student: connectedStudent,
      loans,
      books,
      wishlists,
      awards,
      visits
    });
  }, [connectedStudent, loans, books, wishlists, awards, visits, refreshNotifsKey]);

  const studentAwardsCount = useMemo(() => {
    return awards.filter(a => a.student_id === connectedStudent.id || (connectedStudent.nis && a.student_nis === connectedStudent.nis)).length;
  }, [awards, connectedStudent]);

  const approvedWishlistCount = useMemo(() => {
    return wishlists.filter(w => 
      (w.student_id === connectedStudent.id || (connectedStudent.nis && w.student_nis === connectedStudent.nis)) &&
      (w.status === 'approved' || w.status === 'available' || w.status === 'purchased')
    ).length;
  }, [wishlists, connectedStudent]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const unseenCount = useMemo(() => {
    return notifications.filter(n => !n.seen && !n.read).length;
  }, [notifications]);

  // Ref untuk melacak notifikasi yang telah dikirimkan status 'seen' pada siklus hidup sesi dashboard
  const seenNotifIdsReportedRef = useRef<Set<string>>(new Set());

  // AUDIT ALUR TRIGGER NOTIFIKASI:
  // Segera setelah santri membuka dashboard dan daftar notifikasi dirender,
  // sistem segera mengirim update ke state management lokal (localStorage multi-key ID/NIS)
  // untuk menandai seluruh notifikasi yang dirender sebagai 'seen' dengan timestamp akurat.
  useEffect(() => {
    if (!connectedStudent?.id || notifications.length === 0) return;

    // Ambil notifikasi yang belum berstatus seen dan belum dilaporkan di sesi ini
    const newlyRenderedUnseen = notifications.filter(
      n => !n.seen && !seenNotifIdsReportedRef.current.has(n.id)
    );

    if (newlyRenderedUnseen.length > 0) {
      const idsToMarkSeen = newlyRenderedUnseen.map(n => n.id);
      idsToMarkSeen.forEach(id => seenNotifIdsReportedRef.current.add(id));

      // Kirim pembaruan ke storage persistensi lokal santri
      markSantriNotificationsAsSeen(connectedStudent.id, idsToMarkSeen, connectedStudent.nis);

      // Siarkan event lokal untuk sinkronisasi komponen UI (NotificationCenter, Toasts, header)
      window.dispatchEvent(
        new CustomEvent('santri_notifications_seen', {
          detail: {
            studentId: connectedStudent.id,
            studentNis: connectedStudent.nis,
            notifIds: idsToMarkSeen,
            timestamp: new Date().toISOString()
          }
        })
      );
    }
  }, [connectedStudent?.id, connectedStudent?.nis, notifications]);

  // Active unread toast alert that hasn't been dismissed in this session or previously
  const activeToasts = useMemo(() => {
    return notifications.filter(
      n => !n.read && !dismissedToastIds.has(n.id) && !isToastDismissed(connectedStudent.id, n.id, connectedStudent.nis)
    );
  }, [notifications, dismissedToastIds, connectedStudent.id, connectedStudent.nis]);

  // Listen to Web Push notification clicks navigating to specific tabs
  useEffect(() => {
    const handleNavEvent = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (custom.detail) {
        setActiveTab(custom.detail as SantriMenuKey);
      }
    };
    window.addEventListener('santri_navigate_tab', handleNavEvent);
    return () => window.removeEventListener('santri_navigate_tab', handleNavEvent);
  }, []);

  // Sorted list of santri menus from LibraryContext
  const sortedSantriMenus = useMemo(() => {
    return [...santriMenus].sort((a, b) => a.sort_order - b.sort_order);
  }, [santriMenus]);

  // Quick lookup map for menu configs
  const santriMenuMap = useMemo(() => {
    return new Map<string, SantriMenu>(santriMenus.map(m => [m.menu_key, m]));
  }, [santriMenus]);

  // Reading Streak state for connected student
  const santriStreak = useMemo(() => {
    return getSantriStreak
      ? getSantriStreak(connectedStudent.id)
      : calculateSantriStreak(connectedStudent.id, readingActivities, settings.reading_streak);
  }, [connectedStudent.id, readingActivities, settings.reading_streak, getSantriStreak]);

  const streakConfig = useMemo(() => {
    return settings.reading_streak || {
      daily_target_minutes: 15,
      enabled: true,
      milestones: [
        { days: 3, title: 'Pemula Istiqomah', description: 'Membaca 3 hari berturut-turut', badge_icon: '🌱', xp_reward: 50 },
        { days: 7, title: 'Santri Rajin', description: 'Membaca 7 hari berturut-turut (1 pekan penuh)', badge_icon: '🔥', xp_reward: 150 },
        { days: 14, title: 'Penjelajah Kitab', description: 'Membaca 14 hari berturut-turut', badge_icon: '📚', xp_reward: 300 },
        { days: 30, title: 'Khadim Al-Ilmi', description: 'Membaca 30 hari istiqomah (1 bulan penuh)', badge_icon: '👑', xp_reward: 1000 },
      ]
    };
  }, [settings.reading_streak]);

  // Menu utama yang diizinkan muncul di top header navigasi Dashboard Santri:
  // 1. Beranda/Dashboard
  // 2. Reading Streak
  // 3. Kartu anggota digital
  // 4. Riwayat Kunjungan
  // 5. Peminjaman Saya
  // 6. Catatan Baca & Faedah
  // 7. Lencana & Penghargaan
  // 8. Profil Santri
  const TOP_HEADER_MENU_KEYS: SantriMenuKey[] = [
    'overview',
    'reading-streak',
    'card',
    'visits',
    'loans',
    'journal',
    'awards',
    'profile'
  ];

  // Filtered menus for top navigation: Menu utama pilihan yang selalu tersinkronisasi
  const activeTopMenus = useMemo(() => {
    return TOP_HEADER_MENU_KEYS.map((key, idx) => {
      const existing = santriMenuMap.get(key);
      const defaultName = 
        key === 'overview' ? 'Beranda / Dashboard' :
        key === 'reading-streak' ? 'Reading Streak' :
        key === 'card' ? 'Kartu Anggota Digital' :
        key === 'visits' ? 'Riwayat Kunjungan' :
        key === 'loans' ? 'Peminjaman Saya' :
        key === 'journal' ? 'Catatan Baca & Faedah' :
        key === 'awards' ? 'Lencana & Penghargaan' : 'Profil Santri';

      const defaultIcon = 
        key === 'overview' ? 'Home' :
        key === 'reading-streak' ? 'Flame' :
        key === 'card' ? 'CreditCard' :
        key === 'visits' ? 'Clock' :
        key === 'loans' ? 'BookMarked' :
        key === 'journal' ? 'PenTool' :
        key === 'awards' ? 'Trophy' : 'User';

      if (existing) {
        let displayName = existing.menu_name;
        if (key === 'overview' && (displayName.toLowerCase() === 'dashboard' || displayName.toLowerCase() === 'beranda' || displayName.toLowerCase() === 'dashboard / beranda')) {
          displayName = 'Beranda / Dashboard';
        }
        return {
          ...existing,
          menu_name: displayName,
          icon: existing.icon || defaultIcon,
          is_enabled: existing.is_enabled ?? true
        };
      }

      return {
        id: `smenu-${key}`,
        menu_key: key,
        menu_name: defaultName,
        icon: defaultIcon,
        is_enabled: true,
        route: `/santri/${key}`,
        sort_order: idx + 1
      };
    });
  }, [santriMenuMap]);

  // Active menu metadata
  const currentMenuConfig = santriMenuMap.get(activeTab);
  const isCurrentMenuEnabled = currentMenuConfig ? currentMenuConfig.is_enabled : true;

  // Real-time notification actions
  const handleMarkAsRead = (id: string) => {
    markSantriNotificationAsRead(connectedStudent.id, id, connectedStudent.nis);
    setRefreshNotifsKey(k => k + 1);
  };

  const handleMarkAllAsRead = () => {
    markAllSantriNotificationsAsRead(connectedStudent.id, notifications.map(n => n.id), connectedStudent.nis);
    setRefreshNotifsKey(k => k + 1);
  };

  const handleDismissToast = (id: string) => {
    dismissSantriNotificationToast(connectedStudent.id, id, connectedStudent.nis);
    markSantriNotificationAsRead(connectedStudent.id, id, connectedStudent.nis);
    setDismissedToastIds(prev => new Set(prev).add(id));
    setRefreshNotifsKey(k => k + 1);
  };

  const handleSimulateNotification = (type: 'wishlist' | 'overdue' | 'award') => {
    if (type === 'wishlist') {
      addCustomSantriNotification(connectedStudent.id, {
        category: 'wishlist',
        title: 'Usulan Kitab Disetujui! 📖',
        message: 'Alhamdulillah! Usulan Anda "Fathul Mu\'in Syarah Qurratul \'Ain" telah disetujui.',
        detail: 'Catatan Ustadz: "Usulan sangat bagus untuk kajian santri tingkat lanjutan, telah masuk daftar inventaris belanja pekan ini."',
        priority: 'high',
        actionTab: 'wishlist',
        actionLabel: 'Lihat Usulan'
      });
      webPushManager.notifyWishlistStatus("Fathul Mu'in Syarah Qurratul 'Ain", 'approved').catch(() => {});
    } else if (type === 'overdue') {
      addCustomSantriNotification(connectedStudent.id, {
        category: 'overdue',
        title: 'Peringatan: Peminjaman Terlambat! ⚠️',
        message: 'Peminjaman kitab "Riyadhus Shalihin (Jilid 1)" telah melewati batas tempo pengembalian.',
        detail: 'Batas tempo telah lewat 2 hari. Segera kembalikan ke meja sirkulasi perpustakaan sebelum ashar.',
        priority: 'urgent',
        actionTab: 'loans',
        actionLabel: 'Cek Pinjaman'
      });
      webPushManager.notifyLoanStatus('Riyadhus Shalihin (Jilid 1)', 'overdue').catch(() => {});
    } else if (type === 'award') {
      addCustomSantriNotification(connectedStudent.id, {
        category: 'award',
        title: 'Mabruk! Penghargaan Baru Diterima 🏆',
        message: 'Selamat! Anda dinobatkan sebagai "Santri Terdisiplin Membaca Bulan Ini"!',
        detail: 'Piagam Kehormatan No: PGM-2026-LIT-089 • Apresiasi Kitab Tafsir + Voucher Koperasi Rp 50.000',
        priority: 'celebration',
        actionTab: 'awards',
        actionLabel: 'Lihat Piagam & Lencana'
      });
      webPushManager.notifyAwardReceived('Santri Terdisiplin Membaca', 'Bulan Ini', 'PGM-2026-LIT-089').catch(() => {});
    }
    setRefreshNotifsKey(k => k + 1);
  };

  const handleClearSimulations = () => {
    clearAllCustomSantriNotifications(connectedStudent.id);
    setRefreshNotifsKey(k => k + 1);
  };

  const handleLogout = async () => {
    await logout();
  };

  // Helper to render badge on tabs
  const renderTabBadge = (menuKey: SantriMenuKey) => {
    if (menuKey === 'reading-streak' && santriStreak.current_streak > 0) {
      return (
        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 flex items-center gap-0.5 shadow-sm">
          🔥 {santriStreak.current_streak}
        </span>
      );
    }
    if (menuKey === 'loans' && activeLoans.length > 0) {
      return (
        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
          overdueLoans.length > 0
            ? 'bg-rose-500 text-white animate-pulse'
            : 'bg-emerald-400 text-slate-950'
        }`}>
          {activeLoans.length}
        </span>
      );
    }
    if (menuKey === 'card') {
      return (
        <span className="text-[10px] bg-slate-800/90 text-teal-300 px-1.5 py-0.5 rounded font-mono">
          RFID & QR
        </span>
      );
    }
    if (menuKey === 'visits' && isInsideLibrary) {
      return (
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" title="Sedang di Perpustakaan" />
      );
    }
    if (menuKey === 'wishlist' && approvedWishlistCount > 0) {
      return (
        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/40" title={`${approvedWishlistCount} usulan disetujui`}>
          {approvedWishlistCount}
        </span>
      );
    }
    if (menuKey === 'awards' && studentAwardsCount > 0) {
      return (
        <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/40">
          {studentAwardsCount}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-slate-100 flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Top Header Bar */}
      <header className="w-full border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md shadow-emerald-900/30">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
              {settings.library_name || 'Perpustakaan Baitul Hikmah'}
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {settings.institution_name || 'Pondok Pesantren Darul Ulum'} • Portal Santri
            </p>
          </div>
        </div>

        {/* User Identity, Notification Bell & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real-time Notification Bell Button */}
          <button
            id="btn-santri-notification-bell"
            type="button"
            onClick={() => setIsNotifCenterOpen(true)}
            className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 hover:border-emerald-500/40 transition-all text-xs font-medium cursor-pointer shadow-sm active:scale-95"
            title={`Notifikasi & Alert Santri (${unreadCount} belum dibaca)`}
          >
            <div className="relative">
              <Bell className={`w-4 h-4 ${unseenCount > 0 ? 'text-amber-400 animate-bounce' : unreadCount > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
              {unseenCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
            <span className="hidden sm:inline font-semibold">Notifikasi</span>
            {unreadCount > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold shadow-md shadow-rose-950/60">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* PWA Download / Install App Button for Santri */}
          <PWAInstallButton variant="compact" label="Pasang App" />

          <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/80 py-1 px-2.5 sm:px-3 rounded-xl">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={santriName}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-lg object-cover border border-emerald-500/40"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                {santriName.charAt(0)}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">{santriName}</div>
              <div className="text-[10px] text-emerald-400 font-mono">NIS: {santriNis}</div>
            </div>
          </div>

          <button
            id="btn-santri-logout"
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800/90 hover:bg-rose-900/30 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-500/40 transition-all text-xs font-medium cursor-pointer shadow-sm active:scale-95"
            title="Keluar dari Akun Santri"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Navigation Sub-Header / Menu Tabs: Tepat 7 Menu Utama Dashboard Santri */}
      <nav className="w-full bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md px-4 sm:px-8 py-2 sticky top-[57px] z-20 overflow-x-auto scrollbar-none">
        <div className="max-w-6xl mx-auto flex items-center justify-start lg:justify-center gap-1 sm:gap-2 min-w-max">
          {activeTopMenus.map((menu) => {
            const isCurrent = activeTab === menu.menu_key;
            const isMenuDisabled = menu.is_enabled === false;

            return (
              <motion.button
                key={menu.id || menu.menu_key}
                id={`tab-santri-${menu.menu_key}`}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  if (menu.menu_key === 'notifications') {
                    setIsNotifCenterOpen(true);
                  } else {
                    setActiveTab(menu.menu_key);
                  }
                }}
                className={`relative px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-colors ${
                  isCurrent 
                    ? 'text-white' 
                    : isMenuDisabled
                      ? 'text-slate-500 hover:text-amber-300/90'
                      : 'text-slate-400 hover:text-white'
                }`}
                title={isMenuDisabled ? `${menu.menu_name} (Sedang dinonaktifkan oleh administrator)` : menu.description}
              >
                {isCurrent && (
                  <motion.div
                    layoutId="santri-active-tab-glow"
                    className={`absolute inset-0 rounded-xl shadow-md -z-10 ${
                      isMenuDisabled 
                        ? 'bg-gradient-to-r from-amber-700/80 to-yellow-800/80 shadow-amber-950' 
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-950'
                    }`}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                  />
                )}
                
                {getMenuIcon(menu.icon, `w-4 h-4 ${isMenuDisabled ? 'text-amber-400/80' : ''}`)}
                
                <span className={`whitespace-nowrap ${isMenuDisabled ? 'line-through text-slate-400 decoration-amber-500/50' : ''}`}>
                  {menu.menu_name}
                </span>

                {isMenuDisabled ? (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold">
                    Off
                  </span>
                ) : (
                  renderTabBadge(menu.menu_key)
                )}
              </motion.button>
            );
          })}

          {/* Dynamic Breadcrumb Pill when viewing secondary menus outside 7 main slots */}
          {!TOP_HEADER_MENU_KEYS.includes(activeTab as any) && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-semibold shrink-0 ml-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>{currentMenuConfig?.menu_name || activeTab}</span>
              <button 
                type="button" 
                onClick={() => setActiveTab('overview')}
                className="ml-1 text-slate-400 hover:text-white underline text-[11px] cursor-pointer"
                title="Kembali ke Beranda"
              >
                ✕ Tutup
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area with AnimatePresence Page Transition */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            {/* ROUTE GUARD & UNDER DEVELOPMENT OVERLAY FOR INACTIVE MENUS */}
            {!isCurrentMenuEnabled ? (
              <UnderDevelopmentOverlay
                menu={currentMenuConfig}
                menuName={currentMenuConfig?.menu_name || activeTab}
                onBackToHome={() => setActiveTab('overview')}
              />
            ) : (
              <>
                {/* VIEW 1: OVERVIEW / BERANDA */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Welcome Banner Card */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gradient-to-r from-emerald-900/40 via-slate-900/90 to-teal-950/40 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl"
                    >
                      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4 sm:gap-6">
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt={santriName}
                                referrerPolicy="no-referrer"
                                className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-xl"
                              />
                            ) : (
                              <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center border-2 border-emerald-500/50 shadow-xl">
                                <GraduationCap className="w-10 h-10 text-white" />
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-lg shadow-md" title="Akun Santri Terverifikasi">
                              <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          </div>

                          {/* Greeting info */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                                Santri Aktif
                              </span>
                              {isInsideLibrary && (
                                <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Di Perpustakaan
                                </span>
                              )}
                            </div>

                            <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                              Ahlan wa Sahlan, {santriName} 👋
                            </h2>

                            <p className="text-xs sm:text-sm text-slate-300">
                              NIS: <span className="font-mono text-emerald-300 font-semibold">{santriNis}</span> • Kelas/Asrama:{' '}
                              <span className="text-white font-medium">{santriClass}</span>
                            </p>
                          </div>
                        </div>

                        {/* Quick RFID chip info */}
                        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 sm:text-right text-xs space-y-1 w-full sm:w-auto">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                            Kartu RFID Terdaftar
                          </span>
                          <div className="font-mono font-bold text-emerald-300 text-sm flex items-center sm:justify-end gap-1.5">
                            <Radio className="w-3.5 h-3.5 text-emerald-400" />
                            {connectedStudent.rfid_uid || `RFID-${connectedStudent.nis}`}
                          </div>
                          <span className="text-[10px] text-slate-500 block">Status: Siap di-tap</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Web Push Notification Activation Prompt */}
                    <SantriWebPushPrompt studentName={santriName} />

                    {/* Real-time Dynamic Alerts Banner Section for Santri */}
                    <div className="space-y-3">
                      {/* Alert 1: Overdue Loans */}
                      {overdueLoans.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 via-rose-900/40 to-slate-900 border border-rose-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-200 shadow-lg shadow-rose-950/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs">Peringatan Jatuh Tempo!</div>
                              <span className="text-rose-200/90">
                                Anda memiliki <strong>{overdueLoans.length} buku yang telah melewati batas pengembalian</strong>. Mohon segera mengembalikannya ke perpustakaan.
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('loans')}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shrink-0 cursor-pointer transition-colors shadow-sm self-end sm:self-auto"
                          >
                            Kembalikan Buku →
                          </button>
                        </motion.div>
                      )}

                      {/* Alert 2: Wishlist Approved / Ready Alert */}
                      {notifications.some(n => n.category === 'wishlist' && (n.priority === 'high' || n.priority === 'celebration') && !n.read) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-teal-900/40 to-slate-900 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-200 shadow-lg shadow-emerald-950/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                <span>Usulan Kitab Disetujui!</span>
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              </div>
                              <span className="text-emerald-200/90">
                                Ustadz / Pustakawan telah menyetujui usulan buku Anda dan masuk dalam daftar inventaris pengadaan baru.
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('wishlist')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shrink-0 cursor-pointer transition-colors shadow-sm self-end sm:self-auto"
                          >
                            Cek Usulan →
                          </button>
                        </motion.div>
                      )}

                      {/* Alert 3: New Literacy Award / Achievements */}
                      {notifications.some(n => n.category === 'award' && !n.read) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-yellow-900/40 to-slate-900 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200 shadow-lg shadow-amber-950/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                              <Award className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                <span>Mabruk! Penghargaan Literasi Baru</span>
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              </div>
                              <span className="text-amber-200/90">
                                Selamat! Anda menerima piagam penghargaan resmi atas keaktifan membaca di perpustakaan.
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('awards')}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold shrink-0 cursor-pointer transition-colors shadow-sm self-end sm:self-auto"
                          >
                            Lihat Piagam →
                          </button>
                        </motion.div>
                      )}
                    </div>

                    {/* Reading Streak Live Progress Banner & Card */}
                    <div className="space-y-4">
                      <ReadingStreakReminder
                        streak={santriStreak}
                        config={streakConfig}
                        onViewDetails={() => setActiveTab('reading-streak')}
                      />
                      <ReadingStreakCard
                        streak={santriStreak}
                        config={streakConfig}
                        onViewDetail={() => setActiveTab('reading-streak')}
                      />
                    </div>

                    {/* Dynamic Action Feature Cards (Tersinkronisasi Realtime dengan Pengaturan Menu Santri) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {sortedSantriMenus
                        .filter(m => m.menu_key !== 'overview' && m.menu_key !== 'notifications')
                        .map((menu) => {
                          const isEnabled = menu.is_enabled;

                          return (
                            <motion.div 
                              key={menu.id || menu.menu_key}
                              whileHover={{ y: -5, scale: 1.015 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                              onClick={() => setActiveTab(menu.menu_key)}
                              className={`rounded-3xl p-6 backdrop-blur-xl transition-all duration-300 shadow-xl group cursor-pointer flex flex-col justify-between space-y-4 ${
                                isEnabled
                                  ? 'bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:shadow-emerald-950/40'
                                  : 'bg-slate-950/70 border border-amber-500/25 hover:border-amber-500/50 opacity-90'
                              }`}
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-transform ${
                                    isEnabled
                                      ? 'border-emerald-500/30 bg-gradient-to-tr from-emerald-600/20 to-teal-500/10 text-emerald-400'
                                      : 'border-amber-500/30 bg-gradient-to-tr from-amber-600/20 to-yellow-500/10 text-amber-400'
                                  }`}>
                                    {getMenuIcon(menu.icon, 'w-6 h-6')}
                                  </div>

                                  {isEnabled ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                      Aktif
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5" />
                                      Dalam Pengembangan
                                    </span>
                                  )}
                                </div>

                                <div>
                                  <h3 className={`text-base font-bold transition-colors ${
                                    isEnabled ? 'text-white group-hover:text-emerald-300' : 'text-slate-300 group-hover:text-amber-300'
                                  }`}>
                                    {menu.menu_name}
                                  </h3>
                                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                    {menu.description}
                                  </p>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-medium">
                                  {menu.menu_key === 'loans' ? `${activeLoans.length} Buku Dipinjam` :
                                   menu.menu_key === 'visits' ? `${studentVisits.length} Kunjungan` :
                                   menu.menu_key === 'catalog' ? `${books.length} Judul Buku` :
                                   menu.menu_key === 'awards' ? `${studentAwardsCount} Piagam` :
                                   menu.category || 'Fitur'}
                                </span>
                                <span className={`transition-transform flex items-center gap-1 font-semibold group-hover:translate-x-1 ${
                                  isEnabled ? 'text-emerald-400' : 'text-amber-400'
                                }`}>
                                  {isEnabled ? (
                                    <>Buka <ArrowRight className="w-3.5 h-3.5" /></>
                                  ) : (
                                    <>Info Status <ArrowRight className="w-3.5 h-3.5" /></>
                                  )}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>

                    {/* Quick Tips & Islamic Quote for Santri */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Kalam Mutiara Penuntut Ilmu
                        </span>
                        <p className="text-slate-300 italic">
                          &quot;خَيْرُ جَلِيْسٍ فِي الزَّمَانِ كِتَابُ&quot; — Sebaik-baik teman duduk di setiap zaman adalah buku (kitab).
                        </p>
                      </div>
                      <div className="text-slate-400 text-[11px] sm:text-right shrink-0">
                        Buka: {settings.open_time || '07:30'} - {settings.close_time || '17:00'} WIB
                      </div>
                    </motion.div>
                  </div>
                )}

                {/* VIEW: KATALOG BUKU & KITAB */}
                {activeTab === 'catalog' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer shadow-xs"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Kembali ke Beranda</span>
                      </button>
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        Katalog Koleksi Buku & Kitab Perpustakaan
                      </span>
                    </div>
                    <SantriCatalogTab
                      books={books}
                      student={connectedStudent}
                      onNavigateWishlist={() => setActiveTab('wishlist')}
                    />
                  </div>
                )}

                {/* VIEW: PEMINJAMAN SAYA */}
                {activeTab === 'loans' && (
                  <SantriLoansTab
                    student={connectedStudent}
                    loans={loans}
                    books={books}
                  />
                )}

                {/* VIEW: KARTU ANGGOTA DIGITAL */}
                {activeTab === 'card' && (
                  <SantriCardTab
                    student={connectedStudent}
                    cards={cards}
                    settings={settings}
                  />
                )}

                {/* VIEW: RIWAYAT KUNJUNGAN & JAM BACA */}
                {activeTab === 'visits' && (
                  <SantriVisitsTab
                    student={connectedStudent}
                    visits={visits}
                  />
                )}

                {/* VIEW: USULAN BUKU & KITAB BARU */}
                {activeTab === 'wishlist' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer shadow-xs"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Kembali ke Beranda</span>
                      </button>
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        Formulir Usulan Pengadaan Kitab & Buku Baru
                      </span>
                    </div>
                    <SantriWishlistTab
                      student={connectedStudent}
                    />
                  </div>
                )}

                {/* VIEW: READING STREAK & MUTHOLA'AH DETAIL */}
                {activeTab === 'reading-streak' && (
                  <SantriReadingStreakPage
                    currentStudent={connectedStudent}
                    onNavigateTab={setActiveTab}
                  />
                )}

                {/* VIEW: CATATAN BACA / FAEDAH KITAB */}
                {activeTab === 'journal' && (
                  <SantriJournalTab
                    student={connectedStudent}
                    loans={loans}
                  />
                )}

                {/* VIEW: LENCANA & PENGHARGAAN LITERASI */}
                {activeTab === 'awards' && (
                  <SantriAwardsTab
                    student={connectedStudent}
                  />
                )}

                {/* FALLBACK VIEW FOR OTHER ACTIVATED MODULES (E.G. PROFIL) */}
                {activeTab === 'profile' && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
                    <div className="flex items-center gap-4">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={santriName}
                          referrerPolicy="no-referrer"
                          className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-xl"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center border-2 border-emerald-500/50 shadow-xl">
                          <GraduationCap className="w-10 h-10 text-white" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl font-bold text-white">{santriName}</h2>
                        <p className="text-xs text-slate-400">
                          NIS: <span className="font-mono text-emerald-400 font-bold">{santriNis}</span> • {santriClass}
                        </p>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Akun Santri Terdaftar & Terverifikasi</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block mb-1">Nama Lengkap Santri:</span>
                        <span className="text-white font-medium text-sm">{santriName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Nomor Induk Santri (NIS):</span>
                        <span className="text-emerald-400 font-mono font-bold text-sm">{santriNis}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Kelas / Kamar Asrama:</span>
                        <span className="text-white font-medium text-sm">{santriClass || 'Asrama'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Nomor Kartu RFID Terdaftar:</span>
                        <span className="text-emerald-400 font-mono font-bold text-sm">
                          {connectedStudent.rfid_uid || `RFID-${connectedStudent.nis}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Jenis Kelamin:</span>
                        <span className="text-white font-medium text-sm">
                          {connectedStudent.gender === 'L' ? 'Laki-laki (Santriwan)' : 'Perempuan (Santriwati)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Status Keanggotaan:</span>
                        <span className="text-emerald-400 font-bold text-sm">Aktif</span>
                      </div>
                    </div>

                    {/* Keamanan Akun & Ganti Password */}
                    <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            Keamanan Akun & Kata Sandi
                            {currentUser?.password_changed ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Sudah Diubah
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                Masih Bawaan
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Ubah kata sandi akun santri Anda secara berkala agar akun dan rekap peminjaman Anda tetap aman.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsFirstLoginChange(false);
                          setIsPasswordModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Ubah Kata Sandi</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* VIEW: RIWAYAT PEMINJAMAN SELESAI / ARSIP */}
                {activeTab === 'history' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer shadow-xs"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Kembali ke Beranda</span>
                      </button>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 font-medium">
                          Total Selesai: <strong className="text-emerald-400">{loans.filter(l => l.student_id === connectedStudent.id && l.status === 'returned').length}</strong> Buku
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <History className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-xl font-bold text-white">Riwayat Peminjaman Selesai</h2>
                          <p className="text-xs text-slate-400">Daftar buku dan kitab yang telah berhasil dikembalikan ke perpustakaan.</p>
                        </div>
                      </div>

                      {loans.filter(l => l.student_id === connectedStudent.id && l.status === 'returned').length === 0 ? (
                        <div className="text-center py-12 text-slate-400 space-y-2">
                          <History className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                          <p className="font-semibold text-sm text-slate-300">Belum Ada Riwayat Pengembalian</p>
                          <p className="text-xs text-slate-500">Buku yang selesai dipinjam dan dikembalikan akan terarsip otomatis di sini.</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {loans
                            .filter(l => l.student_id === connectedStudent.id && l.status === 'returned')
                            .map(loan => (
                              <div key={loan.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div>
                                  <h4 className="font-bold text-white text-sm">{loan.book_title}</h4>
                                  <p className="text-slate-400 font-mono mt-0.5">Kode: {loan.book_code} • No Pinjam: {loan.loan_code}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <span className="text-slate-500 block text-[11px]">Tanggal Kembali:</span>
                                    <span className="text-emerald-400 font-semibold">{loan.return_date || '-'}</span>
                                  </div>
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                    Selesai
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* VIEW: PENGEMBALIAN MANDIRI */}
                {activeTab === 'returns' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer shadow-xs"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Kembali ke Beranda</span>
                      </button>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                          <Undo2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-xl font-bold text-white">Panduan Pengembalian Buku Mandiri</h2>
                          <p className="text-xs text-slate-400">Ikuti prosedur pengembalian buku mandiri di meja sirkulasi perpustakaan.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                          <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-xs">1</span>
                          <h4 className="font-bold text-white">Tap Kartu RFID Santri</h4>
                          <p className="text-slate-400 leading-relaxed">Tempelkan kartu anggota santri pada scanner RFID di meja sirkulasi untuk memuat data Anda.</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                          <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-xs">2</span>
                          <h4 className="font-bold text-white">Scan Barcode Buku</h4>
                          <p className="text-slate-400 leading-relaxed">Arahkan barcode pada buku atau kitab ke scanner barcode petugas untuk konfirmasi judul.</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                          <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-xs">3</span>
                          <h4 className="font-bold text-white">Letakkan di Rak Pengembalian</h4>
                          <p className="text-slate-400 leading-relaxed">Letakkan buku pada troli/rak pengembalian sebelum disusun kembali oleh ustadz petugas.</p>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-teal-300">Peminjaman Aktif Anda:</span>
                          <p className="text-[11px] text-slate-400">Ada {activeLoans.length} buku yang saat ini masih Anda pinjam.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('loans')}
                          className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Cek Buku Pinjaman →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* VIEW: BUKU FAVORIT / BOOKMARK */}
                {activeTab === 'bookmark' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 transition-all cursor-pointer shadow-xs"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Kembali ke Beranda</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('catalog')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Jelajahi Katalog</span>
                      </button>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                          <Bookmark className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-xl font-bold text-white">Buku Favorit & Simpanan Santri</h2>
                          <p className="text-xs text-slate-400">Koleksi buku dan kitab pilihan yang Anda tandai untuk dibaca.</p>
                        </div>
                      </div>

                      <div className="text-center py-12 text-slate-400 space-y-3">
                        <Bookmark className="w-10 h-10 mx-auto text-slate-600 mb-1" />
                        <p className="font-semibold text-sm text-slate-300">Belum Ada Buku Yang Ditandai</p>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Anda dapat menandai buku favorit langsung dari menu <strong>Katalog Buku & Kitab</strong>.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('catalog')}
                          className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Buka Katalog Sekarang</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 border-t border-slate-800/80 mt-auto">
        {settings.library_name || 'Perpustakaan Baitul Hikmah'} • Sistem Informasi & Presensi Santri Terintegrasi
      </footer>

      {/* Real-time Floating Notification Toast (Alerts for overdue, approved wishlists, and awards) */}
      <SantriNotificationToast
        notifications={activeToasts}
        onNavigateTab={tab => setActiveTab(tab as SantriMenuKey)}
        onMarkAsRead={handleMarkAsRead}
        onDismissToast={handleDismissToast}
        soundEnabled={settings.sound_enabled ?? true}
      />

      {/* Real-time Notification Center Drawer / Modal */}
      <SantriNotificationCenter
        isOpen={isNotifCenterOpen}
        onClose={() => setIsNotifCenterOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onNavigateTab={tab => setActiveTab(tab as SantriMenuKey)}
        onSimulateNotification={handleSimulateNotification}
        onClearSimulations={handleClearSimulations}
      />

      {/* Modal Wajib Ganti Password Pertama Kali & Menu Ubah Password Santri */}
      <SantriChangePasswordModal
        isOpen={isPasswordModalOpen}
        isFirstLogin={isFirstLoginChange}
        studentNis={santriNis}
        studentName={santriName}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => {
          setIsPasswordModalOpen(false);
          setIsFirstLoginChange(false);
        }}
      />

      {/* Milestone Celebration Dialog */}
      <ReadingMilestoneModal
        isOpen={Boolean(celebrationMilestone)}
        milestone={celebrationMilestone?.milestone || null}
        streakDays={celebrationMilestone?.streak || 0}
        onClose={() => setCelebrationMilestone(null)}
      />
    </div>
  );
};
