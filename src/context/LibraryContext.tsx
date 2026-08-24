import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Student, 
  RfidCard, 
  LibraryVisit, 
  AppUser, 
  LibrarySettings, 
  TapResult, 
  NotificationItem,
  UserRole,
  WhatsAppLog,
  Book,
  BookLoan,
  LiteracyAward
} from '../types';
import { 
  initialStudents, 
  initialCards, 
  initialVisits, 
  initialUsers, 
  initialSettings,
  initialNotifications,
  initialBooks,
  initialLoans,
  supabaseSqlSchema
} from '../data/initialData';
import { INITIAL_AWARDS } from '../utils/gamificationUtils';
import { soundManager } from '../utils/audio';
import { 
  defaultWhatsAppConfig, 
  sendWhatsAppMessage, 
  renderWhatsAppTemplate 
} from '../utils/whatsappUtils';

interface LibraryContextType {
  students: Student[];
  cards: RfidCard[];
  visits: LibraryVisit[];
  books: Book[];
  loans: BookLoan[];
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  users: AppUser[];
  settings: LibrarySettings;
  notifications: NotificationItem[];
  currentTapResult: TapResult | null;
  isProcessingTap: boolean;
  activeVisitsCount: number;
  todayVisitsCount: number;
  monthVisitsCount: number;
  averageDurationMinutes: number;
  
  // Circulation Metrics
  activeLoansCount: number;
  overdueLoansCount: number;
  totalBooksCount: number;
  totalTitlesCount: number;
  
  // WhatsApp Notification State & Actions
  whatsappLogs: WhatsAppLog[];
  isWhatsAppModalOpen: boolean;
  openWhatsAppModal: () => void;
  closeWhatsAppModal: () => void;
  sendCustomWhatsAppReminder: (type: 'open_reminder' | 'close_reminder', targetPhone?: string) => Promise<WhatsAppLog>;
  triggerScheduleCheckNow: () => void;
  clearWhatsAppLogs: () => void;
  
  // Actions
  handleRfidTap: (rawUid: string) => Promise<TapResult>;
  clearCurrentTapResult: () => void;
  manualCheckOut: (visitId: string) => void;
  
  // Student actions
  addStudent: (student: Omit<Student, 'id' | 'created_at'>) => Student;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  linkCardToStudent: (studentId: string, cardUid: string) => boolean;
  unlinkCardFromStudent: (studentId: string) => void;
  
  // Card actions
  registerCard: (uid: string, note?: string) => RfidCard;
  registerCardsBatch: (items: Array<{ uid: string; note?: string }>) => RfidCard[];
  updateCardStatus: (id: string, status: RfidCard['status']) => void;
  deleteCard: (id: string) => void;
  
  // Book & Circulation actions
  addBook: (book: Omit<Book, 'id' | 'created_at'>) => Book;
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  borrowBook: (data: { student_id: string; book_id: string; due_days?: number; notes?: string }) => Promise<BookLoan | null>;
  returnBook: (loanId: string, notes?: string, fineAmount?: number) => Promise<boolean>;
  extendLoan: (loanId: string, extraDays?: number) => boolean;
  sendLoanWhatsAppReminder: (loanId: string) => Promise<WhatsAppLog | null>;

  // Literacy Awards & Gamification actions
  awards: LiteracyAward[];
  addAward: (award: Omit<LiteracyAward, 'id' | 'awarded_at'>) => LiteracyAward;
  deleteAward: (id: string) => void;
  sendAwardWhatsAppCongrats: (awardId: string) => Promise<WhatsAppLog | null>;

  // Authentication & User Management actions
  login: (identity: string, pass: string) => Promise<{ success: boolean; message: string; user?: AppUser }>;
  logout: () => void;
  addUser: (userData: Omit<AppUser, 'id' | 'created_at'>) => { success: boolean; message: string; user?: AppUser };
  updateUser: (id: string, updates: Partial<AppUser>) => { success: boolean; message: string };
  deleteUser: (id: string) => { success: boolean; message: string };
  toggleUserStatus: (id: string) => { success: boolean; message: string };
  updateUserProfile: (updates: Partial<AppUser>) => { success: boolean; message: string };

  // Settings & User
  updateSettings: (newSettings: Partial<LibrarySettings>) => void;
  toggleDarkMode: () => void;
  isDarkMode: boolean;
  setCurrentRole: (role: UserRole) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  resetToDefaultData: () => void;
  
  // Supabase SQL
  supabaseSchema: string;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

let idCounter = 0;
export const generateUniqueId = (prefix: string = 'id'): string => {
  idCounter = (idCounter + 1) % 1000000;
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${Date.now()}-${idCounter}-${rand}`;
};

function ensureUniqueIds<T extends { id: string }>(items: T[], prefix: string): T[] {
  const seen = new Set<string>();
  return items.map((item, idx) => {
    if (!item.id || seen.has(item.id)) {
      const newId = `${prefix}-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
      seen.add(newId);
      return { ...item, id: newId };
    }
    seen.add(item.id);
    return item;
  });
}

const STORAGE_KEYS = {
  STUDENTS: 'libtap_students_v1',
  CARDS: 'libtap_cards_v1',
  VISITS: 'libtap_visits_v1',
  BOOKS: 'libtap_books_v1',
  LOANS: 'libtap_loans_v1',
  AWARDS: 'libtap_awards_v1',
  SETTINGS: 'libtap_settings_v1',
  USER: 'libtap_current_user_v2',
  USERS: 'libtap_users_list_v2',
  NOTIFICATIONS: 'libtap_notifications_v1',
  WA_LOGS: 'libtap_wa_logs_v1',
};

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from localStorage or defaults with automatic ID deduplication
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      const parsed = saved ? JSON.parse(saved) : initialStudents;
      return ensureUniqueIds(parsed, 'std');
    } catch {
      return ensureUniqueIds(initialStudents, 'std');
    }
  });

  const [cards, setCards] = useState<RfidCard[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CARDS);
      const parsed = saved ? JSON.parse(saved) : initialCards;
      return ensureUniqueIds(parsed, 'c');
    } catch {
      return ensureUniqueIds(initialCards, 'c');
    }
  });

  const [visits, setVisits] = useState<LibraryVisit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VISITS);
      const parsed = saved ? JSON.parse(saved) : initialVisits;
      return ensureUniqueIds(parsed, 'v');
    } catch {
      return ensureUniqueIds(initialVisits, 'v');
    }
  });

  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOOKS);
      const parsed = saved ? JSON.parse(saved) : initialBooks;
      return ensureUniqueIds(parsed, 'bk');
    } catch {
      return ensureUniqueIds(initialBooks, 'bk');
    }
  });

  const [loans, setLoans] = useState<BookLoan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOANS);
      const parsed = saved ? JSON.parse(saved) : initialLoans;
      return ensureUniqueIds(parsed, 'loan');
    } catch {
      return ensureUniqueIds(initialLoans, 'loan');
    }
  });

  const [awards, setAwards] = useState<LiteracyAward[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AWARDS);
      const parsed = saved ? JSON.parse(saved) : INITIAL_AWARDS;
      return ensureUniqueIds(parsed, 'award');
    } catch {
      return ensureUniqueIds(INITIAL_AWARDS, 'award');
    }
  });

  // Multi-user state with initial Admin and Staff
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) {
        const parsed: AppUser[] = JSON.parse(saved);
        // Make sure master admin is always present and marked as default
        const hasAdmin = parsed.some(u => u.username === 'admin' || u.id === 'usr-admin-1');
        if (!hasAdmin) {
          return ensureUniqueIds([initialUsers[0], ...parsed], 'usr');
        }
        return ensureUniqueIds(parsed, 'usr');
      }
      return ensureUniqueIds(initialUsers, 'usr');
    } catch {
      return ensureUniqueIds(initialUsers, 'usr');
    }
  });

  // Current session user (null if not logged in)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) {
        const user = JSON.parse(saved);
        return user;
      }
      return null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = Boolean(currentUser && currentUser.status === 'active');

  const [settings, setSettings] = useState<LibrarySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const parsed = saved ? JSON.parse(saved) : initialSettings;
      return {
        ...initialSettings,
        ...parsed,
        whatsapp: parsed?.whatsapp || defaultWhatsAppConfig
      };
    } catch {
      return initialSettings;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const parsed = saved ? JSON.parse(saved) : initialNotifications;
      return ensureUniqueIds(parsed, 'notif');
    } catch {
      return ensureUniqueIds(initialNotifications, 'notif');
    }
  });

  // WhatsApp Logs State & Modal
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WA_LOGS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  const [currentTapResult, setCurrentTapResult] = useState<TapResult | null>(null);
  const [isProcessingTap, setIsProcessingTap] = useState(false);

  // Keep track of sent reminders to prevent repeated spam within the same time window
  const lastReminderTriggerRef = useRef<{ openDate?: string; closeDate?: string }>({});

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
  }, [visits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AWARDS, JSON.stringify(awards));
  }, [awards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WA_LOGS, JSON.stringify(whatsappLogs));
  }, [whatsappLogs]);

  // Synchronize Dark Mode with Document HTML class
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (settings.dark_mode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings.dark_mode]);

  const toggleDarkMode = useCallback(() => {
    setSettings(prev => {
      const nextMode = !prev.dark_mode;
      return { ...prev, dark_mode: nextMode };
    });
  }, []);

  // Helper formatting
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  };

  const formatDurationText = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} jam ${mins > 0 ? `${mins} menit` : ''}`.trim();
    }
    return `${mins} menit`;
  };

  // Add Notification Helper
  const pushNotification = useCallback((title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const newNotif: NotificationItem = {
      id: generateUniqueId('notif'),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 20)]);
  }, []);

  // Send Custom WhatsApp Reminder helper (Can be triggered manually or automatically)
  const sendCustomWhatsAppReminder = useCallback(async (
    type: 'open_reminder' | 'close_reminder', 
    targetPhone?: string
  ): Promise<WhatsAppLog> => {
    const waConfig = settings.whatsapp || defaultWhatsAppConfig;
    const recipientPhone = targetPhone || waConfig.admin_phone;
    const activeVisitors = visits.filter(v => v.status === 'inside' && v.check_out === null).length;

    const template = type === 'open_reminder' 
      ? (waConfig.open_reminder_template || defaultWhatsAppConfig.open_reminder_template!)
      : (waConfig.close_reminder_template || defaultWhatsAppConfig.close_reminder_template!);

    const renderedMessage = renderWhatsAppTemplate(template, {
      INSTITUTION_NAME: settings.institution_name,
      LIBRARY_NAME: settings.library_name,
      OPEN_TIME: settings.open_time,
      CLOSE_TIME: settings.close_time,
      REMINDER_MINUTES: waConfig.reminder_minutes_before,
      ACTIVE_VISITORS_COUNT: activeVisitors,
      TIMESTAMP: formatTime(new Date().toISOString())
    });

    const title = type === 'open_reminder' ? 'Pengingat Buka Perpustakaan' : 'Pengingat Tutup Perpustakaan';
    const log = await sendWhatsAppMessage(recipientPhone, 'Admin / Grup Pesantren', renderedMessage, type, waConfig);

    setWhatsappLogs(prev => [log, ...prev.slice(0, 50)]);
    pushNotification(
      `WhatsApp: ${title}`, 
      `Pesan pengingat dikirimkan ke ${recipientPhone}`, 
      'info'
    );

    return log;
  }, [settings, visits, pushNotification]);

  // Automated Schedule Monitor (Runs every minute to check if approaching open/close time)
  const checkScheduleAndSendReminder = useCallback(() => {
    const waConfig = settings.whatsapp || defaultWhatsAppConfig;
    if (!waConfig.enabled || !waConfig.notify_schedule_reminder) return;

    const now = new Date();
    const todayDateStr = now.toISOString().slice(0, 10);
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTotalMins = currentHour * 60 + currentMin;

    const parseTimeToMins = (timeStr: string) => {
      const [h, m] = (timeStr || '00:00').split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const openTotalMins = parseTimeToMins(settings.open_time);
    const closeTotalMins = parseTimeToMins(settings.close_time);
    const reminderWindow = waConfig.reminder_minutes_before || 15;

    // Check Open Reminder Window (e.g. 15 minutes before open_time)
    const timeUntilOpen = openTotalMins - currentTotalMins;
    if (timeUntilOpen > 0 && timeUntilOpen <= reminderWindow) {
      if (lastReminderTriggerRef.current.openDate !== todayDateStr) {
        lastReminderTriggerRef.current.openDate = todayDateStr;
        sendCustomWhatsAppReminder('open_reminder');
      }
    }

    // Check Close Reminder Window (e.g. 15 minutes before close_time)
    const timeUntilClose = closeTotalMins - currentTotalMins;
    if (timeUntilClose > 0 && timeUntilClose <= reminderWindow) {
      if (lastReminderTriggerRef.current.closeDate !== todayDateStr) {
        lastReminderTriggerRef.current.closeDate = todayDateStr;
        sendCustomWhatsAppReminder('close_reminder');
      }
    }
  }, [settings, sendCustomWhatsAppReminder]);

  // Interval ticker for schedule reminders
  useEffect(() => {
    checkScheduleAndSendReminder();
    const interval = setInterval(checkScheduleAndSendReminder, 30000); // check every 30s
    return () => clearInterval(interval);
  }, [checkScheduleAndSendReminder]);

  const triggerScheduleCheckNow = useCallback(() => {
    checkScheduleAndSendReminder();
    pushNotification('Jadwal Diperiksa', 'Pengecekan waktu buka/tutup perpustakaan telah dijalankan.', 'info');
  }, [checkScheduleAndSendReminder, pushNotification]);

  const clearWhatsAppLogs = useCallback(() => {
    setWhatsappLogs([]);
    localStorage.removeItem(STORAGE_KEYS.WA_LOGS);
    pushNotification('Log WhatsApp Bersih', 'Seluruh riwayat pesan WhatsApp telah dibersihkan.', 'info');
  }, [pushNotification]);

  const openWhatsAppModal = useCallback(() => setIsWhatsAppModalOpen(true), []);
  const closeWhatsAppModal = useCallback(() => setIsWhatsAppModalOpen(false), []);

  // Main RFID / NFC Tap Processor (Supports USB RFID, Web NFC on smartphones, and normalized UIDs)
  const handleRfidTap = useCallback(async (rawUid: string): Promise<TapResult> => {
    setIsProcessingTap(true);
    const cleanUid = rawUid.trim().toUpperCase();
    const normalizedCleanUid = cleanUid.replace(/[^A-Z0-9]/gi, '');
    const nowIso = new Date().toISOString();
    const waConfig = settings.whatsapp || defaultWhatsAppConfig;

    if (!cleanUid) {
      setIsProcessingTap(false);
      return {
        type: 'unregistered_card',
        message: 'UID NFC/RFID tidak valid',
        timestamp: nowIso,
      };
    }

    // Helper matcher
    const matchUid = (storedUid?: string | null) => {
      if (!storedUid) return false;
      const cleanStored = storedUid.trim().toUpperCase();
      const normStored = cleanStored.replace(/[^A-Z0-9]/gi, '');
      return (
        cleanStored === cleanUid || 
        (normStored.length > 0 && normStored === normalizedCleanUid)
      );
    };

    // 1. Look for Card in registered cards or student record
    const card = cards.find(c => matchUid(c.uid));
    
    // Also support direct student RFID match or NIS match (if NFC contains NIS)
    let student = students.find(s => 
      (card && card.student_id === s.id) || 
      matchUid(s.rfid_uid) ||
      matchUid(s.nis) ||
      s.nis.trim() === cleanUid
    );

    // If card not registered or not paired with any student
    if (!student) {
      if (settings.sound_enabled) {
        soundManager.playErrorSound();
      }

      const result: TapResult = {
        type: 'unregistered_card',
        message: `Kartu NFC/RFID (${cleanUid}) Belum Terdaftar atau Belum Dihubungkan ke Santri`,
        timestamp: nowIso,
      };

      setCurrentTapResult(result);
      setIsProcessingTap(false);
      pushNotification('Kartu / NFC Tidak Dikenali', `Tap kartu/NFC baru dengan UID: ${cleanUid}`, 'warning');
      return result;
    }

    // Check if card is inactive
    if (card && card.status === 'inactive') {
      if (settings.sound_enabled) soundManager.playErrorSound();
      const result: TapResult = {
        type: 'inactive_card',
        message: 'Kartu NFC/RFID Santri Sedang Dinonaktifkan',
        student,
        timestamp: nowIso,
      };
      setCurrentTapResult(result);
      setIsProcessingTap(false);
      return result;
    }

    // Check if student is active
    if (student.status !== 'active') {
      if (settings.sound_enabled) soundManager.playErrorSound();
      const result: TapResult = {
        type: 'inactive_student',
        message: `Status santri tidak aktif (${student.status})`,
        student,
        timestamp: nowIso,
      };
      setCurrentTapResult(result);
      setIsProcessingTap(false);
      return result;
    }

    // Check if student has an active session currently inside
    const activeVisitIndex = visits.findIndex(
      v => v.student_id === student.id && v.status === 'inside' && v.check_out === null
    );

    if (activeVisitIndex !== -1) {
      // Santri is currently inside -> Check OUT
      const activeVisit = visits[activeVisitIndex];
      const checkInTime = new Date(activeVisit.check_in);
      const checkOutTime = new Date(nowIso);
      const durationMins = Math.max(1, Math.round((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60)));

      const updatedVisit: LibraryVisit = {
        ...activeVisit,
        check_out: nowIso,
        duration_minutes: durationMins,
        status: 'completed',
      };

      setVisits(prev => {
        const next = [...prev];
        next[activeVisitIndex] = updatedVisit;
        return next;
      });

      if (settings.sound_enabled) {
        soundManager.playCheckOutSound();
      }

      const durationText = formatDurationText(durationMins);
      const timeInStr = formatTime(activeVisit.check_in);
      const timeOutStr = formatTime(nowIso);

      // WhatsApp Notification on Check-Out
      let waLogResult: WhatsAppLog | undefined;
      if (waConfig.enabled && waConfig.notify_on_check_out) {
        const template = waConfig.check_out_template || defaultWhatsAppConfig.check_out_template!;
        const renderedMessage = renderWhatsAppTemplate(template, {
          STUDENT_NAME: student.name,
          STUDENT_NIS: student.nis,
          STUDENT_CLASS: student.class,
          TIME_IN: timeInStr,
          TIME_OUT: timeOutStr,
          DURATION_TEXT: durationText,
          LIBRARY_NAME: settings.library_name,
          INSTITUTION_NAME: settings.institution_name,
        });

        // Send to Admin
        sendWhatsAppMessage(waConfig.admin_phone, `${student.name} (Admin)`, renderedMessage, 'check_out', waConfig)
          .then(log => {
            setWhatsappLogs(prev => [log, ...prev.slice(0, 50)]);
          });

        // Also optionally send to student / parent phone
        if (waConfig.use_student_parent_phone && student.phone) {
          sendWhatsAppMessage(student.phone, `${student.name} (Wali/Santri)`, renderedMessage, 'check_out', waConfig)
            .then(log => {
              setWhatsappLogs(prev => [log, ...prev.slice(0, 50)]);
            });
        }
      }

      const result: TapResult = {
        type: 'success_out',
        message: 'Sampai Jumpa',
        student,
        visit: updatedVisit,
        checkInTime: timeInStr,
        checkOutTime: timeOutStr,
        durationText,
        timestamp: nowIso,
        whatsappLog: waLogResult,
      };

      setCurrentTapResult(result);
      setIsProcessingTap(false);
      pushNotification(
        'Santri Keluar', 
        `${student.name} (${student.class}) keluar. Durasi: ${durationText}${waConfig.enabled ? ' (Notifikasi WA dikirim)' : ''}`, 
        'info'
      );
      return result;
    } else {
      // Santri is NOT inside -> Check IN
      const newVisit: LibraryVisit = {
        id: generateUniqueId('v'),
        student_id: student.id,
        rfid_card_id: card?.id,
        rfid_uid: cleanUid,
        check_in: nowIso,
        check_out: null,
        duration_minutes: null,
        status: 'inside',
        created_at: nowIso,
      };

      setVisits(prev => [newVisit, ...prev]);

      if (settings.sound_enabled) {
        soundManager.playCheckInSound();
      }

      const timeInStr = formatTime(nowIso);

      // WhatsApp Notification on Check-In
      let waLogResult: WhatsAppLog | undefined;
      if (waConfig.enabled && waConfig.notify_on_check_in) {
        const template = waConfig.check_in_template || defaultWhatsAppConfig.check_in_template!;
        const renderedMessage = renderWhatsAppTemplate(template, {
          STUDENT_NAME: student.name,
          STUDENT_NIS: student.nis,
          STUDENT_CLASS: student.class,
          TIME_IN: timeInStr,
          CARD_UID: cleanUid,
          LIBRARY_NAME: settings.library_name,
          INSTITUTION_NAME: settings.institution_name,
        });

        // Send to Admin
        sendWhatsAppMessage(waConfig.admin_phone, `${student.name} (Admin)`, renderedMessage, 'check_in', waConfig)
          .then(log => {
            setWhatsappLogs(prev => [log, ...prev.slice(0, 50)]);
          });

        // Also optionally send to student / parent phone
        if (waConfig.use_student_parent_phone && student.phone) {
          sendWhatsAppMessage(student.phone, `${student.name} (Wali/Santri)`, renderedMessage, 'check_in', waConfig)
            .then(log => {
              setWhatsappLogs(prev => [log, ...prev.slice(0, 50)]);
            });
        }
      }

      const result: TapResult = {
        type: 'success_in',
        message: 'Selamat Datang',
        student,
        visit: newVisit,
        checkInTime: timeInStr,
        timestamp: nowIso,
        whatsappLog: waLogResult,
      };

      setCurrentTapResult(result);
      setIsProcessingTap(false);
      pushNotification(
        'Santri Masuk', 
        `${student.name} (${student.class}) masuk perpustakaan.${waConfig.enabled ? ' (Notifikasi WA dikirim)' : ''}`, 
        'success'
      );
      return result;
    }
  }, [cards, students, visits, settings, pushNotification]);

  const clearCurrentTapResult = useCallback(() => {
    setCurrentTapResult(null);
  }, []);

  const manualCheckOut = useCallback((visitId: string) => {
    const nowIso = new Date().toISOString();
    setVisits(prev => prev.map(v => {
      if (v.id === visitId && v.status === 'inside') {
        const checkInTime = new Date(v.check_in);
        const checkOutTime = new Date(nowIso);
        const durationMins = Math.max(1, Math.round((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60)));
        return {
          ...v,
          check_out: nowIso,
          duration_minutes: durationMins,
          status: 'completed',
          notes: (v.notes ? v.notes + ' ' : '') + '(Check-out manual oleh petugas)'
        };
      }
      return v;
    }));
    pushNotification('Check-out Manual', 'Santri berhasil di-checkout manual oleh petugas.', 'info');
  }, [pushNotification]);

  // Student CRUD
  const addStudent = useCallback((data: Omit<Student, 'id' | 'created_at'>): Student => {
    const newStudent: Student = {
      ...data,
      id: generateUniqueId('std'),
      created_at: new Date().toISOString(),
    };
    setStudents(prev => [newStudent, ...prev]);
    pushNotification('Santri Ditambahkan', `${newStudent.name} berhasil didaftarkan.`, 'success');
    return newStudent;
  }, [pushNotification]);

  const updateStudent = useCallback((id: string, updates: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    pushNotification('Santri Diperbarui', 'Data santri berhasil disimpan.', 'info');
  }, [pushNotification]);

  const deleteStudent = useCallback((id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setCards(prev => prev.map(c => c.student_id === id ? { ...c, student_id: null } : c));
    pushNotification('Santri Dihapus', 'Data santri berhasil dihapus.', 'info');
  }, [pushNotification]);

  const linkCardToStudent = useCallback((studentId: string, cardUid: string): boolean => {
    const cleanUid = cardUid.trim().toUpperCase();
    const existingCard = cards.find(c => c.uid === cleanUid);
    
    if (existingCard && existingCard.student_id && existingCard.student_id !== studentId) {
      pushNotification('Kartu Sudah Dipakai', `Kartu ${cleanUid} sudah terhubung dengan santri lain!`, 'error');
      return false;
    }

    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return { ...s, rfid_uid: cleanUid };
      }
      if (s.rfid_uid === cleanUid) {
        return { ...s, rfid_uid: undefined };
      }
      return s;
    }));

    if (existingCard) {
      setCards(prev => prev.map(c => {
        if (c.uid === cleanUid) {
          return { ...c, student_id: studentId, status: 'active' };
        }
        if (c.student_id === studentId) {
          return { ...c, student_id: null };
        }
        return c;
      }));
    } else {
      const newCard: RfidCard = {
        id: generateUniqueId('c'),
        uid: cleanUid,
        student_id: studentId,
        status: 'active',
        registered_at: new Date().toISOString(),
        note: 'Didaftarkan dari profil santri'
      };
      setCards(prev => [newCard, ...prev]);
    }

    pushNotification('Kartu Berhasil Dihubungkan', `RFID ${cleanUid} telah aktif untuk santri.`, 'success');
    return true;
  }, [cards, pushNotification]);

  const unlinkCardFromStudent = useCallback((studentId: string) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, rfid_uid: undefined } : s));
    setCards(prev => prev.map(c => c.student_id === studentId ? { ...c, student_id: null } : c));
    pushNotification('Kartu Dilepas', 'Kartu RFID telah diputus dari profil santri.', 'info');
  }, [pushNotification]);

  // Card CRUD
  const registerCard = useCallback((uid: string, note?: string): RfidCard => {
    const cleanUid = uid.trim().toUpperCase();
    const existing = cards.find(c => c.uid === cleanUid);
    if (existing) {
      pushNotification('Kartu Sudah Ada', `Kartu ${cleanUid} sudah terdaftar sebelumnya.`, 'warning');
      return existing;
    }

    const newCard: RfidCard = {
      id: generateUniqueId('c'),
      uid: cleanUid,
      student_id: null,
      status: 'active',
      registered_at: new Date().toISOString(),
      note: note || 'Kartu Baru'
    };

    setCards(prev => [newCard, ...prev]);
    pushNotification('Kartu RFID Terdaftar', `Kartu ${cleanUid} siap digunakan.`, 'success');
    return newCard;
  }, [cards, pushNotification]);

  const registerCardsBatch = useCallback((items: Array<{ uid: string; note?: string }>): RfidCard[] => {
    const newCards: RfidCard[] = items.map((item, index) => {
      const cleanUid = item.uid.trim().toUpperCase();
      return {
        id: generateUniqueId(`c-batch-${index}`),
        uid: cleanUid,
        student_id: null,
        status: 'active',
        registered_at: new Date().toISOString(),
        note: item.note || 'Kartu Cadangan'
      };
    });
    setCards(prev => [...newCards, ...prev]);
    pushNotification('Batch Kartu Terdaftar', `${newCards.length} kartu baru berhasil didaftarkan.`, 'success');
    return newCards;
  }, [pushNotification]);

  const updateCardStatus = useCallback((id: string, status: RfidCard['status']) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    pushNotification('Status Kartu', `Status kartu diubah menjadi ${status.toUpperCase()}.`, 'info');
  }, [pushNotification]);

  const deleteCard = useCallback((id: string) => {
    const card = cards.find(c => c.id === id);
    if (card && card.student_id) {
      setStudents(prev => prev.map(s => s.id === card.student_id ? { ...s, rfid_uid: undefined } : s));
    }
    setCards(prev => prev.filter(c => c.id !== id));
    pushNotification('Kartu Dihapus', 'Kartu RFID berhasil dihapus dari database.', 'info');
  }, [cards, pushNotification]);

  // Book CRUD
  const addBook = useCallback((data: Omit<Book, 'id' | 'created_at'>): Book => {
    const newBook: Book = {
      ...data,
      id: generateUniqueId('bk'),
      created_at: new Date().toISOString(),
    };
    setBooks(prev => [newBook, ...prev]);
    pushNotification('Buku Ditambahkan', `"${newBook.title}" berhasil ditambahkan ke katalog.`, 'success');
    return newBook;
  }, [pushNotification]);

  const updateBook = useCallback((id: string, updates: Partial<Book>) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    pushNotification('Buku Diperbarui', 'Data buku berhasil disimpan.', 'info');
  }, [pushNotification]);

  const deleteBook = useCallback((id: string) => {
    // Check if book has active loans
    const hasActiveLoan = loans.some(l => l.book_id === id && (l.status === 'borrowed' || l.status === 'overdue'));
    if (hasActiveLoan) {
      pushNotification('Gagal Menghapus Buku', 'Buku ini sedang dalam status dipinjam oleh santri!', 'error');
      return;
    }
    setBooks(prev => prev.filter(b => b.id !== id));
    pushNotification('Buku Dihapus', 'Buku berhasil dihapus dari katalog.', 'info');
  }, [loans, pushNotification]);

  // Circulation Actions
  const borrowBook = useCallback(async (data: { 
    student_id: string; 
    book_id: string; 
    due_days?: number; 
    notes?: string 
  }): Promise<BookLoan | null> => {
    const student = students.find(s => s.id === data.student_id);
    const book = books.find(b => b.id === data.book_id);

    if (!student) {
      pushNotification('Peminjaman Gagal', 'Data santri tidak ditemukan.', 'error');
      return null;
    }
    if (student.status !== 'active') {
      pushNotification('Peminjaman Gagal', `Santri berstatus non-aktif (${student.status}).`, 'error');
      return null;
    }
    if (!book) {
      pushNotification('Peminjaman Gagal', 'Data buku tidak ditemukan.', 'error');
      return null;
    }
    if (book.available_stock <= 0) {
      pushNotification('Stok Habis', `Semua eksemplar "${book.title}" sedang dipinjam.`, 'error');
      return null;
    }

    const nowIso = new Date().toISOString();
    const dueDays = data.due_days || 7;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);
    dueDate.setHours(17, 0, 0, 0);

    const loanCodeNum = Math.floor(1000 + Math.random() * 9000);
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const newLoan: BookLoan = {
      id: generateUniqueId('loan'),
      loan_code: `PJM-${datePrefix}-${loanCodeNum}`,
      student_id: student.id,
      book_id: book.id,
      borrow_date: nowIso,
      due_date: dueDate.toISOString(),
      return_date: null,
      status: 'borrowed',
      fine_amount: 0,
      notes: data.notes || '',
      created_at: nowIso,
    };

    // Update state
    setLoans(prev => [newLoan, ...prev]);
    setBooks(prev => prev.map(b => b.id === book.id ? { ...b, available_stock: Math.max(0, b.available_stock - 1) } : b));

    if (settings.sound_enabled) {
      soundManager.playCheckInSound();
    }

    // WhatsApp Notification on Loan
    const waConfig = settings.whatsapp || defaultWhatsAppConfig;
    if (waConfig.enabled && waConfig.notify_on_book_loan) {
      const template = waConfig.book_loan_template || defaultWhatsAppConfig.book_loan_template!;
      const borrowDateStr = new Date(nowIso).toLocaleDateString('id-ID', { dateStyle: 'full' });
      const dueDateStr = dueDate.toLocaleDateString('id-ID', { dateStyle: 'full' });

      const renderedMessage = renderWhatsAppTemplate(template, {
        LIBRARY_NAME: settings.library_name,
        INSTITUTION_NAME: settings.institution_name,
        LOAN_CODE: newLoan.loan_code,
        STUDENT_NAME: student.name,
        STUDENT_NIS: student.nis,
        STUDENT_CLASS: student.class,
        BOOK_TITLE: book.title,
        BOOK_AUTHOR: book.author,
        BOOK_CODE: book.code,
        BORROW_DATE: borrowDateStr,
        DUE_DATE: dueDateStr,
      });

      // Send to Admin
      sendWhatsAppMessage(waConfig.admin_phone, `${student.name} (Admin)`, renderedMessage, 'book_loan', waConfig)
        .then(log => {
          setWhatsappLogs(prev => [log, ...prev.slice(0, 50)]);
        });

      // Send to Student/Parent
      if (waConfig.use_student_parent_phone && student.phone) {
        sendWhatsAppMessage(student.phone, `${student.name} (Wali/Santri)`, renderedMessage, 'book_loan', waConfig)
          .then(log => {
            setWhatsappLogs(prev => [log, ...prev.slice(0, 50)]);
          });
      }
    }

    pushNotification(
      'Peminjaman Berhasil', 
      `${student.name} meminjam "${book.title}" (${newLoan.loan_code})`, 
      'success'
    );

    return newLoan;
  }, [books, students, settings, pushNotification]);

  const returnBook = useCallback(async (loanId: string, notes?: string, fineAmount?: number): Promise<boolean> => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) {
      pushNotification('Pengembalian Gagal', 'Data transaksi peminjaman tidak ditemukan.', 'error');
      return false;
    }
    if (loan.status === 'returned') {
      pushNotification('Info', 'Buku ini sudah tercatat dikembalikan.', 'info');
      return true;
    }

    const book = books.find(b => b.id === loan.book_id);
    const student = students.find(s => s.id === loan.student_id);
    const nowIso = new Date().toISOString();
    const isOverdue = new Date(loan.due_date) < new Date(nowIso);

    // Calculate fine if not passed
    let computedFine = fineAmount !== undefined ? fineAmount : 0;
    if (fineAmount === undefined && isOverdue) {
      const daysOverdue = Math.max(1, Math.ceil((new Date(nowIso).getTime() - new Date(loan.due_date).getTime()) / (1000 * 60 * 60 * 24)));
      computedFine = daysOverdue * 500; // Rp 500 per day default
    }

    // Update loan
    setLoans(prev => prev.map(l => l.id === loanId ? {
      ...l,
      return_date: nowIso,
      status: 'returned',
      fine_amount: computedFine,
      notes: notes ? (l.notes ? `${l.notes} | ${notes}` : notes) : l.notes
    } : l));

    // Restore book available stock
    if (book) {
      setBooks(prev => prev.map(b => b.id === book.id ? {
        ...b,
        available_stock: Math.min(b.total_stock, b.available_stock + 1)
      } : b));
    }

    if (settings.sound_enabled) {
      soundManager.playCheckOutSound();
    }

    // WhatsApp Notification on Return
    const waConfig = settings.whatsapp || defaultWhatsAppConfig;
    if (waConfig.enabled && waConfig.notify_on_book_return && student && book) {
      const template = waConfig.book_return_template || defaultWhatsAppConfig.book_return_template!;
      const returnDateStr = new Date(nowIso).toLocaleDateString('id-ID', { dateStyle: 'full' });
      const statusText = isOverdue ? `Terlambat (Denda: Rp ${computedFine.toLocaleString('id-ID')})` : 'Tepat Waktu';

      const renderedMessage = renderWhatsAppTemplate(template, {
        LIBRARY_NAME: settings.library_name,
        INSTITUTION_NAME: settings.institution_name,
        LOAN_CODE: loan.loan_code,
        STUDENT_NAME: student.name,
        STUDENT_CLASS: student.class,
        BOOK_TITLE: book.title,
        RETURN_DATE: returnDateStr,
        STATUS_TEXT: statusText,
      });

      sendWhatsAppMessage(waConfig.admin_phone, `${student.name} (Admin)`, renderedMessage, 'book_return', waConfig)
        .then(log => {
          setWhatsappLogs(prev => [log, ...prev.slice(0, 50)]);
        });

      if (waConfig.use_student_parent_phone && student.phone) {
        sendWhatsAppMessage(student.phone, `${student.name} (Wali/Santri)`, renderedMessage, 'book_return', waConfig)
          .then(log => {
            setWhatsappLogs(prev => [log, ...prev.slice(0, 50)]);
          });
      }
    }

    pushNotification(
      'Buku Dikembalikan', 
      `"${book ? book.title : 'Buku'}" berhasil dikembalikan oleh ${student ? student.name : 'Santri'}.`, 
      'success'
    );

    return true;
  }, [loans, books, students, settings, pushNotification]);

  const extendLoan = useCallback((loanId: string, extraDays: number = 7): boolean => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan || loan.status === 'returned') return false;

    const currentDue = new Date(loan.due_date);
    const newDue = new Date(Math.max(currentDue.getTime(), Date.now()) + extraDays * 24 * 60 * 60 * 1000);

    setLoans(prev => prev.map(l => l.id === loanId ? {
      ...l,
      due_date: newDue.toISOString(),
      status: 'borrowed',
      notes: (l.notes ? l.notes + ' ' : '') + `(Diperpanjang +${extraDays} hari)`
    } : l));

    pushNotification('Peminjaman Diperpanjang', `Batas pengembalian diperpanjang sampai ${newDue.toLocaleDateString('id-ID')}.`, 'info');
    return true;
  }, [loans, pushNotification]);

  const sendLoanWhatsAppReminder = useCallback(async (loanId: string): Promise<WhatsAppLog | null> => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan || loan.status === 'returned') return null;

    const student = students.find(s => s.id === loan.student_id);
    const book = books.find(b => b.id === loan.book_id);
    if (!student || !book) return null;

    const waConfig = settings.whatsapp || defaultWhatsAppConfig;
    const recipientPhone = student.phone || waConfig.admin_phone;
    const now = new Date();
    const dueDate = new Date(loan.due_date);
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDaysText = diffDays < 0 
      ? `Terlambat ${Math.abs(diffDays)} hari` 
      : diffDays === 0 
      ? 'Jatuh tempo HARI INI' 
      : `Sisa ${diffDays} hari lagi`;

    const template = waConfig.loan_reminder_template || defaultWhatsAppConfig.loan_reminder_template!;
    const renderedMessage = renderWhatsAppTemplate(template, {
      LIBRARY_NAME: settings.library_name,
      INSTITUTION_NAME: settings.institution_name,
      STUDENT_NAME: student.name,
      STUDENT_CLASS: student.class,
      BOOK_TITLE: book.title,
      LOAN_CODE: loan.loan_code,
      DUE_DATE: dueDate.toLocaleDateString('id-ID', { dateStyle: 'full' }),
      REMAINING_DAYS_TEXT: remainingDaysText
    });

    const log = await sendWhatsAppMessage(recipientPhone, `${student.name} (Pengingat Buku)`, renderedMessage, 'loan_reminder', waConfig);
    setWhatsappLogs(prev => [log, ...prev.slice(0, 50)]);
    pushNotification('Pengingat WA Terkirim', `Pengingat peminjaman dikirim ke ${student.name} (${recipientPhone})`, 'info');
    return log;
  }, [loans, students, books, settings, pushNotification]);

  // Literacy Awards & Gamification actions
  const addAward = useCallback((awardData: Omit<LiteracyAward, 'id' | 'awarded_at'>): LiteracyAward => {
    const newAward: LiteracyAward = {
      ...awardData,
      id: generateUniqueId('award'),
      awarded_at: new Date().toISOString()
    };
    setAwards(prev => [newAward, ...prev]);
    const student = students.find(s => s.id === awardData.student_id);
    pushNotification('Penghargaan Diberikan', `Penghargaan "${awardData.title}" dianugerahkan kepada ${student?.name || 'Santri'}.`, 'success');
    if (settings.sound_enabled) {
      soundManager.playCheckInSound();
    }
    return newAward;
  }, [students, settings.sound_enabled, pushNotification]);

  const deleteAward = useCallback((id: string) => {
    setAwards(prev => prev.filter(a => a.id !== id));
    pushNotification('Penghargaan Dihapus', 'Data arsip piagam penghargaan telah dihapus.', 'info');
  }, [pushNotification]);

  const sendAwardWhatsAppCongrats = useCallback(async (awardId: string): Promise<WhatsAppLog | null> => {
    const award = awards.find(a => a.id === awardId);
    if (!award) return null;
    const student = students.find(s => s.id === award.student_id);
    if (!student) return null;

    const waConfig = settings.whatsapp || defaultWhatsAppConfig;
    const recipientPhone = student.phone || waConfig.admin_phone;

    const message = `🎉 *TAHNIAH & SELAMAT! PENGHARGAAN LITERASI SANTRI* 🏅\n\n` +
      `_Bismillaahirrahmaanirrahiim_\n` +
      `Alhamdulillah, segenap pengurus *${settings.library_name}* (${settings.institution_name}) mengucapkan selamat atas pencapaian istimewa ananda:\n\n` +
      `👤 *Nama Santri:* ${student.name}\n` +
      `🏷️ *NIS / Kelas:* ${student.nis} / ${student.class}\n` +
      `🏆 *Penghargaan:* ${award.title}\n` +
      `📅 *Periode:* ${award.period}\n` +
      `📜 *No. Piagam:* ${award.certificate_no}\n` +
      `🎁 *Hadiah / Apresiasi:* ${award.reward_item}\n\n` +
      `_"Menuntut ilmu adalah jalan menuju kemuliaan. Semoga ananda senantiasa istiqomah dalam membaca dan mengkaji ilmu yang bermanfaat."_\n\n` +
      `Salam Takzim,\n*Pengurus Perpustakaan ${settings.library_name}*`;

    const log = await sendWhatsAppMessage(recipientPhone, `${student.name} (Penghargaan Literasi)`, message, 'award_congrats', waConfig);
    setWhatsappLogs(prev => [log, ...prev.slice(0, 50)]);
    pushNotification('Ucapan WA Terkirim', `Pesan apresiasi penghargaan dikirim ke ${student.name} (${recipientPhone})`, 'success');
    return log;
  }, [awards, students, settings, pushNotification]);

  // Authentication & User Management
  const login = useCallback(async (identity: string, pass: string): Promise<{ success: boolean; message: string; user?: AppUser }> => {
    const trimmedIdentity = identity.trim().toLowerCase();
    const trimmedPass = pass.trim();

    // Match by username or email
    const user = users.find(u => 
      (u.username && u.username.toLowerCase() === trimmedIdentity) || 
      (u.email && u.email.toLowerCase() === trimmedIdentity)
    );

    if (!user) {
      return { success: false, message: 'Username atau Email tidak terdaftar dalam sistem perpustakaan.' };
    }

    if (user.status !== 'active') {
      return { success: false, message: 'Akun Anda sedang dinonaktifkan oleh Administrator. Silakan hubungi admin.' };
    }

    // Default password fallback if not explicitly stored
    const expectedPassword = user.password || (user.role === 'admin' ? 'admin123' : 'staff123');
    if (trimmedPass !== expectedPassword) {
      return { success: false, message: 'Kata sandi (password) yang Anda masukkan salah. Coba lagi.' };
    }

    // Update last_login
    const updatedUser: AppUser = {
      ...user,
      last_login: new Date().toISOString()
    };

    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    setCurrentUser(updatedUser);

    pushNotification(
      'Login Berhasil',
      `Ahlan wa Sahlan, ${user.name} (${user.role === 'admin' ? 'Administrator' : 'Petugas Perpustakaan'}).`,
      'success'
    );

    return { success: true, message: 'Login berhasil! Mengalihkan ke sistem...', user: updatedUser };
  }, [users, pushNotification]);

  const logout = useCallback(() => {
    const userName = currentUser?.name || 'Pengguna';
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    pushNotification('Logout Berhasil', `${userName} telah keluar dari sesi perpustakaan.`, 'info');
  }, [currentUser, pushNotification]);

  const addUser = useCallback((userData: Omit<AppUser, 'id' | 'created_at'>): { success: boolean; message: string; user?: AppUser } => {
    if (currentUser?.role !== 'admin') {
      return { success: false, message: 'Hanya akun Administrator yang berhak membuat akun baru.' };
    }

    const cleanUsername = userData.username.trim().toLowerCase();
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanName = userData.name.trim();

    if (!cleanName) {
      return { success: false, message: 'Nama lengkap wajib diisi.' };
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, message: 'Username minimal 3 karakter tanpa spasi.' };
    }

    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: `Username "${userData.username}" sudah digunakan oleh akun lain.` };
    }

    if (cleanEmail && users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: `Email "${userData.email}" sudah terdaftar.` };
    }

    const newUser: AppUser = {
      ...userData,
      id: generateUniqueId('usr'),
      username: cleanUsername,
      name: cleanName,
      email: cleanEmail || `${cleanUsername}@darululum.sch.id`,
      password: userData.password || 'santri123',
      role: userData.role || 'staff',
      avatar: userData.avatar || (
        userData.role === 'admin'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      ),
      phone: userData.phone || '',
      status: userData.status || 'active',
      is_default: false,
      created_at: new Date().toISOString()
    };

    setUsers(prev => [newUser, ...prev]);
    pushNotification('Akun Baru Dibuat', `Akun ${newUser.name} (${newUser.username}) berhasil ditambahkan.`, 'success');
    return { success: true, message: 'Akun petugas baru berhasil dibuat.', user: newUser };
  }, [currentUser, users, pushNotification]);

  const updateUser = useCallback((id: string, updates: Partial<AppUser>): { success: boolean; message: string } => {
    if (currentUser?.role !== 'admin' && currentUser?.id !== id) {
      return { success: false, message: 'Anda tidak memiliki hak akses untuk mengubah akun ini.' };
    }

    const target = users.find(u => u.id === id);
    if (!target) {
      return { success: false, message: 'Akun tidak ditemukan.' };
    }

    // Check unique username if updated
    if (updates.username && updates.username.toLowerCase() !== target.username.toLowerCase()) {
      const checkUsername = updates.username.trim().toLowerCase();
      if (users.some(u => u.id !== id && u.username.toLowerCase() === checkUsername)) {
        return { success: false, message: `Username "${updates.username}" sudah digunakan akun lain.` };
      }
    }

    // Protect default admin role & status
    if (target.is_default && updates.role && updates.role !== 'admin') {
      return { success: false, message: 'Peran Akun Administrator Utama Bawaan tidak dapat diubah menjadi Staff.' };
    }
    if (target.is_default && updates.status === 'inactive') {
      return { success: false, message: 'Akun Administrator Utama Bawaan tidak dapat dinonaktifkan.' };
    }

    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const updated = { ...u, ...updates };
        if (currentUser?.id === id) {
          setCurrentUser(updated);
        }
        return updated;
      }
      return u;
    }));

    pushNotification('Akun Diperbarui', `Informasi akun ${updates.name || target.name} berhasil diperbarui.`, 'success');
    return { success: true, message: 'Akun berhasil diperbarui.' };
  }, [currentUser, users, pushNotification]);

  const deleteUser = useCallback((id: string): { success: boolean; message: string } => {
    if (currentUser?.role !== 'admin') {
      return { success: false, message: 'Hanya Administrator yang berhak menghapus akun.' };
    }

    const target = users.find(u => u.id === id);
    if (!target) {
      return { success: false, message: 'Akun tidak ditemukan.' };
    }

    if (target.is_default) {
      return { success: false, message: 'Akun Administrator Utama Bawaan dilindungi dan tidak dapat dihapus.' };
    }

    if (currentUser.id === id) {
      return { success: false, message: 'Anda tidak dapat menghapus akun yang sedang aktif Anda gunakan saat ini.' };
    }

    setUsers(prev => prev.filter(u => u.id !== id));
    pushNotification('Akun Dihapus', `Akun ${target.name} (${target.username}) telah dihapus dari sistem.`, 'info');
    return { success: true, message: 'Akun berhasil dihapus.' };
  }, [currentUser, users, pushNotification]);

  const toggleUserStatus = useCallback((id: string): { success: boolean; message: string } => {
    if (currentUser?.role !== 'admin') {
      return { success: false, message: 'Hanya Administrator yang dapat mengubah status akun.' };
    }

    const target = users.find(u => u.id === id);
    if (!target) return { success: false, message: 'Akun tidak ditemukan.' };

    if (target.is_default) {
      return { success: false, message: 'Status Akun Administrator Utama Bawaan tidak dapat dinonaktifkan.' };
    }

    if (currentUser.id === id) {
      return { success: false, message: 'Anda tidak dapat menonaktifkan akun yang sedang aktif digunakan.' };
    }

    const newStatus = target.status === 'active' ? 'inactive' : 'active';
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
    pushNotification('Status Akun Diubah', `Status ${target.name} diubah menjadi ${newStatus === 'active' ? 'Aktif' : 'Nonaktif'}.`, 'info');
    return { success: true, message: `Status berhasil diubah menjadi ${newStatus === 'active' ? 'Aktif' : 'Nonaktif'}.` };
  }, [currentUser, users, pushNotification]);

  const updateUserProfile = useCallback((updates: Partial<AppUser>): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Tidak ada sesi login aktif.' };
    return updateUser(currentUser.id, updates);
  }, [currentUser, updateUser]);

  // Settings & User
  const updateSettings = useCallback((newSettings: Partial<LibrarySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    pushNotification('Pengaturan Disimpan', 'Konfigurasi sistem perpustakaan telah diperbarui.', 'success');
  }, [pushNotification]);

  const setCurrentRole = useCallback((role: UserRole) => {
    const target = users.find(u => u.role === role) || { ...users[0], role };
    setCurrentUser(target);
    pushNotification('Ganti Role', `Mode akun dialihkan ke ${role === 'admin' ? 'Administrator' : 'Petugas Perpustakaan'}.`, 'info');
  }, [users, pushNotification]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const resetToDefaultData = useCallback(() => {
    setStudents(initialStudents);
    setCards(initialCards);
    setVisits(initialVisits);
    setBooks(initialBooks);
    setLoans(initialLoans);
    setAwards(INITIAL_AWARDS);
    setUsers(initialUsers);
    setCurrentUser(initialUsers[0]);
    setSettings(initialSettings);
    setNotifications(initialNotifications);
    setWhatsappLogs([]);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.CARDS);
    localStorage.removeItem(STORAGE_KEYS.VISITS);
    localStorage.removeItem(STORAGE_KEYS.BOOKS);
    localStorage.removeItem(STORAGE_KEYS.LOANS);
    localStorage.removeItem(STORAGE_KEYS.AWARDS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.WA_LOGS);
    pushNotification('Reset Selesai', 'Data sistem telah dikembalikan ke data default demo.', 'info');
  }, [pushNotification]);

  // Derived Metrics
  const activeVisitsCount = useMemo(() => {
    return visits.filter(v => v.status === 'inside' && v.check_out === null).length;
  }, [visits]);

  const todayVisitsCount = useMemo(() => {
    const todayStr = new Date().toDateString();
    return visits.filter(v => new Date(v.check_in).toDateString() === todayStr).length;
  }, [visits]);

  const monthVisitsCount = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return visits.filter(v => {
      const d = new Date(v.check_in);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
  }, [visits]);

  const averageDurationMinutes = useMemo(() => {
    const completed = visits.filter(v => v.duration_minutes !== null && v.duration_minutes > 0);
    if (completed.length === 0) return 0;
    const total = completed.reduce((sum, v) => sum + (v.duration_minutes || 0), 0);
    return Math.round(total / completed.length);
  }, [visits]);

  // Circulation Metrics
  const activeLoansCount = useMemo(() => {
    return loans.filter(l => l.status === 'borrowed' || l.status === 'overdue').length;
  }, [loans]);

  const overdueLoansCount = useMemo(() => {
    const now = new Date();
    return loans.filter(l => (l.status === 'overdue') || (l.status === 'borrowed' && new Date(l.due_date) < now)).length;
  }, [loans]);

  const totalBooksCount = useMemo(() => {
    return books.reduce((sum, b) => sum + (b.total_stock || 0), 0);
  }, [books]);

  const totalTitlesCount = useMemo(() => {
    return books.length;
  }, [books]);

  return (
    <LibraryContext.Provider
      value={{
        students,
        cards,
        visits,
        books,
        loans,
        currentUser,
        users,
        settings,
        notifications,
        currentTapResult,
        isProcessingTap,
        activeVisitsCount,
        todayVisitsCount,
        monthVisitsCount,
        averageDurationMinutes,
        activeLoansCount,
        overdueLoansCount,
        totalBooksCount,
        totalTitlesCount,
        whatsappLogs,
        isWhatsAppModalOpen,
        openWhatsAppModal,
        closeWhatsAppModal,
        sendCustomWhatsAppReminder,
        triggerScheduleCheckNow,
        clearWhatsAppLogs,
        handleRfidTap,
        clearCurrentTapResult,
        manualCheckOut,
        addStudent,
        updateStudent,
        deleteStudent,
        linkCardToStudent,
        unlinkCardFromStudent,
        registerCard,
        registerCardsBatch,
        updateCardStatus,
        deleteCard,
        addBook,
        updateBook,
        deleteBook,
        borrowBook,
        returnBook,
        extendLoan,
        sendLoanWhatsAppReminder,
        awards,
        addAward,
        deleteAward,
        sendAwardWhatsAppCongrats,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        updateUserProfile,
        isAuthenticated,
        updateSettings,
        toggleDarkMode,
        isDarkMode: Boolean(settings.dark_mode),
        setCurrentRole,
        markNotificationRead,
        clearNotifications,
        resetToDefaultData,
        supabaseSchema: supabaseSqlSchema,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
