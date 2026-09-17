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
  LiteracyAward,
  BookWishlist,
  SantriMenu
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
  supabaseSqlSchema,
  bookWishlistsTableSql,
  literacyAwardsTableSql,
  santriMenusTableSql
} from '../data/initialData';
import { 
  DEFAULT_SANTRI_MENUS, 
  getSantriMenusFromStorage, 
  saveSantriMenusToStorage,
  SANTRI_MENU_STORAGE_KEY
} from '../data/santriMenuData';
import { INITIAL_AWARDS } from '../utils/gamificationUtils';
import { soundManager } from '../utils/audio';
import { 
  defaultWhatsAppConfig, 
  sendWhatsAppMessage, 
  renderWhatsAppTemplate,
  createWhatsAppDirectLink,
  openWhatsAppDirect,
  testGatewayConnection,
  TestConnectionResult 
} from '../utils/whatsappUtils';
import { 
  syncAllToSupabase, 
  fetchAllFromSupabase, 
  recordVisitToSupabase,
  updateVisitInSupabase,
  deleteVisitFromSupabase,
  saveUserToSupabase,
  updateUserInSupabase,
  deleteUserFromSupabase,
  fetchUsersFromSupabase,
  insertStudentToSupabase,
  updateStudentInSupabase,
  deleteStudentFromSupabase,
  insertBookToSupabase,
  updateBookInSupabase,
  deleteBookFromSupabase,
  insertCardToSupabase,
  updateCardInSupabase,
  deleteCardFromSupabase,
  insertLoanToSupabase,
  updateLoanInSupabase,
  deleteLoanFromSupabase,
  insertAwardToSupabase,
  updateAwardInSupabase,
  deleteAwardFromSupabase,
  insertWishlistToSupabase,
  updateWishlistInSupabase,
  deleteWishlistFromSupabase,
  clearAllDataFromSupabase,
  subscribeToAllDatabaseChanges,
  broadcastRealtimeAction,
  isSchemaCacheOrMissingTableError,
  getWishlistTableAvailable,
  getSantriMenuTableAvailable,
  checkSupabaseTableAvailability,
  fetchSantriMenusFromSupabase,
  upsertSantriMenuInSupabase,
  batchSaveSantriMenusToSupabase
} from '../lib/supabaseSync';
import { 
  isSupabaseConfigured,
  signInWithSupabase,
  signOutWithSupabase,
  signUpWithSupabase,
  getCurrentSupabaseUser,
  subscribeToSupabaseAuth
} from '../lib/supabase';
import {
  QueuedRfidTap,
  FlushResult,
  getQueuedRfidTaps,
  enqueueRfidTap,
  dequeueRfidTap,
  clearOfflineRfidQueue,
  flushRfidTapQueue,
  listenToOfflineQueue,
  getQueuedRfidTapsCount,
} from '../lib/offlineRfidQueue';

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
  testWhatsAppConnection: (targetPhone: string, customNote?: string) => Promise<TestConnectionResult>;
  triggerScheduleCheckNow: () => void;
  clearWhatsAppLogs: () => void;
  
  // Actions
  handleRfidTap: (rawUid: string) => Promise<TapResult>;
  clearCurrentTapResult: () => void;
  manualCheckOut: (visitId: string) => void;
  
  // Student actions
  addStudent: (student: Omit<Student, 'id' | 'created_at'>) => Promise<Student>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  linkCardToStudent: (studentId: string, cardUid: string) => Promise<boolean> | boolean;
  unlinkCardFromStudent: (studentId: string) => void;
  batchLinkCardsToStudents: (mappings: Array<{ studentId: string; cardUid: string }>) => { successCount: number; failedCount: number; errors: string[] };
  batchUnlinkCardsFromStudents: (studentIds: string[]) => void;
  
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

  // Book Wishlists (Usulan Buku & Kitab Santri)
  wishlists: BookWishlist[];
  pendingWishlistsCount: number;
  addWishlist: (data: Omit<BookWishlist, 'id' | 'created_at' | 'status'>) => Promise<{ success: boolean; message: string; data?: BookWishlist }>;
  updateWishlist: (id: string, updates: Partial<BookWishlist>) => Promise<{ success: boolean; message: string }>;
  deleteWishlist: (id: string) => Promise<{ success: boolean; message: string }>;

  // Santri Menus Management (Pengaturan Menu Santri)
  santriMenus: SantriMenu[];
  updateSantriMenu: (menuKey: string, updates: Partial<SantriMenu>) => Promise<{ success: boolean; message: string }>;
  batchUpdateSantriMenus: (menus: SantriMenu[]) => Promise<{ success: boolean; message: string }>;
  resetSantriMenusToDefault: () => Promise<void>;
  isSantriMenuEnabled: (menuKey: string) => boolean;
  santriMenusSql: string;

  // Authentication & User Management actions
  login: (identity: string, pass: string) => Promise<{ success: boolean; message: string; user?: AppUser }>;
  loginSantri: (nis: string, pass: string) => Promise<{ success: boolean; message: string; user?: AppUser }>;
  logout: () => void;
  addUser: (userData: Omit<AppUser, 'id' | 'created_at'>) => { success: boolean; message: string; user?: AppUser };
  updateUser: (id: string, updates: Partial<AppUser>) => { success: boolean; message: string };
  deleteUser: (id: string) => { success: boolean; message: string };
  toggleUserStatus: (id: string) => { success: boolean; message: string };
  updateUserProfile: (updates: Partial<AppUser>) => { success: boolean; message: string };

  // Unregistered card alert tracking
  lastUnregisteredCardUid: string | null;
  lastUnregisteredTimestamp: string | null;
  clearLastUnregisteredCard: () => void;

  // Settings & User
  updateSettings: (newSettings: Partial<LibrarySettings>) => void;
  toggleDarkMode: () => void;
  isDarkMode: boolean;
  setCurrentRole: (role: UserRole) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  resetToDefaultData: () => void;
  clearAllData: (options?: { deleteFromCloud?: boolean; includeUsers?: boolean }) => Promise<{ success: boolean; message: string }>;
  
  // Supabase Cloud Sync
  supabaseSchema: string;
  bookWishlistsSql: string;
  literacyAwardsSql: string;
  isWishlistTableAvailable: boolean | null;
  checkTableAvailability: () => Promise<{ wishlists: boolean; awards: boolean }>;
  isSupabaseSyncing: boolean;
  isRealtimeConnected: boolean;
  lastRealtimeSync: string | null;
  syncWithSupabase: () => Promise<{ success: boolean; message: string }>;
  pullFromSupabase: () => Promise<{ success: boolean; message: string }>;

  // Offline RFID Queue
  offlineQueue: QueuedRfidTap[];
  offlineQueueCount: number;
  isProcessingOfflineQueue: boolean;
  isOnline: boolean;
  flushOfflineQueue: () => Promise<FlushResult>;
  clearOfflineQueue: () => void;
  removeQueuedTap: (id: string) => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const generateUniqueId = (_prefix?: string): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

function ensureUniqueIds<T extends { id: string }>(items: T[], _prefix?: string): T[] {
  const seen = new Set<string>();
  return items.map((item) => {
    if (!item.id || seen.has(item.id)) {
      const newId = generateUniqueId();
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
  WISHLISTS: 'libtap_wishlists_v1',
  SETTINGS: 'libtap_settings_v1',
  USER: 'libtap_current_user_v2',
  USERS: 'libtap_users_list_v2',
  NOTIFICATIONS: 'libtap_notifications_v1',
  WA_LOGS: 'libtap_wa_logs_v1',
  OFFLINE_QUEUE: 'libtap_rfid_offline_queue_v1',
};

// Helper filter untuk memastikan data dummy awal terhapus tanpa menghapus data baru pengguna
const DUMMY_STUDENT_NAMES = new Set([
  'Ahmad Fauzan Al-Faruq',
  'Muhammad Rizky Pratama',
  'Aisyah Putri Rahmadhani',
  'Fathir Zaidan Al-Ghifari',
  'Nabila Zahra Khairunnisa',
  'Daffa Raihan Al-Mubarak',
  'Siti Nurhaliza Azzahra',
  'Ibrahim Malik Syahputra',
  'Hafizhah Khansa Maritza',
  'Bilal Hidayatullah',
  'Zulfa Nayla Salsabila',
  'Rafi Ardiansyah Pratama'
]);

const DUMMY_BOOK_CODES = new Set([
  'KTB-FIQ-001',
  'KTB-HDT-002',
  'KTB-TFS-003',
  'KTB-BHS-004',
  'KTB-TRK-005',
  'KTB-AKH-006',
  'BK-UMM-007',
  'BK-NVL-008'
]);

const DUMMY_STUDENT_IDS = new Set(Array.from({ length: 25 }, (_, i) => `std-${String(i + 1).padStart(3, '0')}`));
const DUMMY_BOOK_IDS = new Set(Array.from({ length: 25 }, (_, i) => `bk-${String(i + 1).padStart(3, '0')}`));
const DUMMY_CARD_IDS = new Set(Array.from({ length: 25 }, (_, i) => `c-${String(i + 1).padStart(3, '0')}`));
const DUMMY_LOAN_IDS = new Set(Array.from({ length: 25 }, (_, i) => `loan-${String(i + 1).padStart(3, '0')}`));
const DUMMY_AWARD_IDS = new Set(Array.from({ length: 25 }, (_, i) => `award-${String(i + 1).padStart(3, '0')}`));

const filterOutDummyStudents = (list: Student[]): Student[] =>
  list.filter(s => !DUMMY_STUDENT_IDS.has(s.id) && !DUMMY_STUDENT_NAMES.has(s.name));

const filterOutDummyCards = (list: RfidCard[]): RfidCard[] =>
  list.filter(c => !DUMMY_CARD_IDS.has(c.id) && (!c.student_id || !DUMMY_STUDENT_IDS.has(c.student_id)));

const filterOutDummyVisits = (list: LibraryVisit[]): LibraryVisit[] =>
  list.filter(v => !v.id.startsWith('v-act-') && !v.id.startsWith('v-hist-') && (!v.student_id || !DUMMY_STUDENT_IDS.has(v.student_id)));

const filterOutDummyBooks = (list: Book[]): Book[] =>
  list.filter(b => !DUMMY_BOOK_IDS.has(b.id) && !DUMMY_BOOK_CODES.has(b.code));

const filterOutDummyLoans = (list: BookLoan[]): BookLoan[] =>
  list.filter(l => !DUMMY_LOAN_IDS.has(l.id) && (!l.student_id || !DUMMY_STUDENT_IDS.has(l.student_id)) && (!l.book_id || !DUMMY_BOOK_IDS.has(l.book_id)));

const filterOutDummyAwards = (list: LiteracyAward[]): LiteracyAward[] =>
  list.filter(a => !DUMMY_AWARD_IDS.has(a.id) && (!a.student_id || !DUMMY_STUDENT_IDS.has(a.student_id)) && (!a.student_name || !DUMMY_STUDENT_NAMES.has(a.student_name)));

const DUMMY_WISHLIST_IDS = new Set(['wish-001', 'wish-002']);
const filterOutDummyWishlists = (list: BookWishlist[]): BookWishlist[] =>
  list.filter(w => !DUMMY_WISHLIST_IDS.has(w.id) && w.student_id !== 'std-demo-01');

const filterOutDummyNotifs = (list: NotificationItem[]): NotificationItem[] =>
  list.filter(n => n.id !== 'notif-1' && n.id !== 'notif-2');

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from localStorage or defaults with automatic ID deduplication and dummy data filtering
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      const parsed = saved ? JSON.parse(saved) : initialStudents;
      return filterOutDummyStudents(ensureUniqueIds(parsed, 'std'));
    } catch {
      return filterOutDummyStudents(ensureUniqueIds(initialStudents, 'std'));
    }
  });

  const [cards, setCards] = useState<RfidCard[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CARDS);
      const parsed = saved ? JSON.parse(saved) : initialCards;
      return filterOutDummyCards(ensureUniqueIds(parsed, 'c'));
    } catch {
      return filterOutDummyCards(ensureUniqueIds(initialCards, 'c'));
    }
  });

  const [visits, setVisits] = useState<LibraryVisit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VISITS);
      const parsed = saved ? JSON.parse(saved) : initialVisits;
      return filterOutDummyVisits(ensureUniqueIds(parsed, 'v'));
    } catch {
      return filterOutDummyVisits(ensureUniqueIds(initialVisits, 'v'));
    }
  });

  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOOKS);
      const parsed = saved ? JSON.parse(saved) : initialBooks;
      return filterOutDummyBooks(ensureUniqueIds(parsed, 'bk'));
    } catch {
      return filterOutDummyBooks(ensureUniqueIds(initialBooks, 'bk'));
    }
  });

  const [loans, setLoans] = useState<BookLoan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOANS);
      const parsed = saved ? JSON.parse(saved) : initialLoans;
      return filterOutDummyLoans(ensureUniqueIds(parsed, 'loan'));
    } catch {
      return filterOutDummyLoans(ensureUniqueIds(initialLoans, 'loan'));
    }
  });

  const [awards, setAwards] = useState<LiteracyAward[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AWARDS);
      const parsed = saved ? JSON.parse(saved) : INITIAL_AWARDS;
      return filterOutDummyAwards(ensureUniqueIds(parsed, 'award'));
    } catch {
      return filterOutDummyAwards(ensureUniqueIds(INITIAL_AWARDS, 'award'));
    }
  });

  const [wishlists, setWishlists] = useState<BookWishlist[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WISHLISTS);
      const parsed = saved ? JSON.parse(saved) : [];
      return filterOutDummyWishlists(ensureUniqueIds(parsed, 'wish'));
    } catch {
      return [];
    }
  });

  // Santri Menus Dynamic Settings State
  const [santriMenus, setSantriMenus] = useState<SantriMenu[]>(() => {
    return getSantriMenusFromStorage();
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
      const waConfig = parsed?.whatsapp ? {
        ...defaultWhatsAppConfig,
        ...parsed.whatsapp,
        webhook_url: parsed.whatsapp.webhook_url || defaultWhatsAppConfig.webhook_url,
        webhook_api_key: parsed.whatsapp.webhook_api_key || defaultWhatsAppConfig.webhook_api_key,
      } : defaultWhatsAppConfig;

      return {
        ...initialSettings,
        ...parsed,
        whatsapp: waConfig
      };
    } catch {
      return initialSettings;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const parsed = saved ? JSON.parse(saved) : initialNotifications;
      return filterOutDummyNotifs(ensureUniqueIds(parsed, 'notif'));
    } catch {
      return filterOutDummyNotifs(ensureUniqueIds(initialNotifications, 'notif'));
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
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastRealtimeSync, setLastRealtimeSync] = useState<string | null>(() => new Date().toISOString());
  const [isWishlistTableAvailable, setIsWishlistTableAvailable] = useState<boolean | null>(() => getWishlistTableAvailable());
  const isSilentFetchingRef = useRef(false);

  const checkTableAvailability = useCallback(async (): Promise<{ wishlists: boolean; awards: boolean }> => {
    const res = await checkSupabaseTableAvailability();
    setIsWishlistTableAvailable(res.wishlists);
    return res;
  }, []);

  const [currentTapResult, setCurrentTapResult] = useState<TapResult | null>(null);
  const [isProcessingTap, setIsProcessingTap] = useState(false);
  const [lastUnregisteredCardUid, setLastUnregisteredCardUid] = useState<string | null>(null);
  const [lastUnregisteredTimestamp, setLastUnregisteredTimestamp] = useState<string | null>(null);

  // Offline RFID Queue State & Connectivity
  const [offlineQueue, setOfflineQueue] = useState<QueuedRfidTap[]>(() => getQueuedRfidTaps());
  const [isProcessingOfflineQueue, setIsProcessingOfflineQueue] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const offlineQueueCount = offlineQueue.length;

  const clearLastUnregisteredCard = useCallback(() => {
    setLastUnregisteredCardUid(null);
    setLastUnregisteredTimestamp(null);
  }, []);

  // Synchronous Memory Refs for atomic tap processing and anti-race conditions
  const visitsRef = useRef<LibraryVisit[]>(visits);
  const studentsRef = useRef<Student[]>(students);
  const cardsRef = useRef<RfidCard[]>(cards);
  const recentTapsRef = useRef<Map<string, { time: number; type: 'in' | 'out'; studentId: string }>>(new Map());
  const tapLockRef = useRef<boolean>(false);

  useEffect(() => {
    visitsRef.current = visits;
  }, [visits]);

  useEffect(() => {
    studentsRef.current = students;
  }, [students]);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

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
    localStorage.setItem(STORAGE_KEYS.WISHLISTS, JSON.stringify(wishlists));
  }, [wishlists]);

  useEffect(() => {
    saveSantriMenusToStorage(santriMenus);
  }, [santriMenus]);

  useEffect(() => {
    const handleExternalMenuUpdate = (e: CustomEvent<SantriMenu[]>) => {
      if (e.detail && Array.isArray(e.detail)) {
        setSantriMenus(e.detail);
      }
    };
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === SANTRI_MENU_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSantriMenus(parsed);
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('santri_menus_updated' as any, handleExternalMenuUpdate);
    window.addEventListener('storage', handleStorageEvent);
    return () => {
      window.removeEventListener('santri_menus_updated' as any, handleExternalMenuUpdate);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  // Otomatis sinkronisasi akun Santri untuk setiap data Santri yang ada di sistem
  // Role: SANTRI, Username: NIS, Password: Kode Kartu RFID
  useEffect(() => {
    if (!students || students.length === 0) return;
    setUsers(prev => {
      let changed = false;
      const updated = [...prev];

      students.forEach(student => {
        const studentNis = (student.nis || '').trim();
        if (!studentNis) return;
        const expectedPassword = (student.rfid_uid || `RFID-${studentNis}`).trim().toUpperCase();

        const existingIdx = updated.findIndex(u =>
          u.student_id === student.id ||
          u.santri_id === student.id ||
          (u.role === 'SANTRI' && u.username.toLowerCase() === studentNis.toLowerCase())
        );

        if (existingIdx >= 0) {
          const u = updated[existingIdx];
          if (
            u.username !== studentNis ||
            u.password !== expectedPassword ||
            u.name !== student.name ||
            u.student_id !== student.id ||
            u.santri_id !== student.id ||
            u.role !== 'SANTRI'
          ) {
            updated[existingIdx] = {
              ...u,
              student_id: student.id,
              santri_id: student.id,
              username: studentNis,
              password: expectedPassword,
              name: student.name,
              avatar: student.photo_url || u.avatar,
              role: 'SANTRI',
              status: student.status === 'suspended' ? 'inactive' : 'active',
            };
            changed = true;
          }
        } else {
          updated.push({
            id: `usr-santri-${student.id}`,
            username: studentNis,
            password: expectedPassword,
            role: 'SANTRI',
            name: student.name,
            email: `${studentNis.toLowerCase()}@santri.pesantren.id`,
            avatar: student.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            phone: student.phone,
            status: student.status === 'suspended' ? 'inactive' : 'active',
            created_at: student.created_at || new Date().toISOString(),
            student_id: student.id,
            santri_id: student.id,
          });
          changed = true;
        }
      });

      return changed ? updated : prev;
    });
  }, [students]);

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

  // Synchronize with Supabase Auth Session, Initial Database Hydration & Realtime Subscriptions
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // 1. Check if there is an active Supabase user session on startup
    getCurrentSupabaseUser().then((supaUser) => {
      if (supaUser) {
        setCurrentUser(prev => prev ? { ...prev, ...supaUser } : supaUser);
      }
    }).catch(() => {});

    // 2. Fetch latest data directly from Supabase tables to sync app state on startup
    fetchAllFromSupabase().then((res) => {
      if (res.success) {
        if (res.students !== undefined) {
          setStudents(prev => {
            const cloudStudents = filterOutDummyStudents(res.students!);
            const cloudNis = new Set(cloudStudents.map(s => s.nis.toUpperCase()));
            const cloudIds = new Set(cloudStudents.map(s => s.id));
            const localOnly = prev.filter(s =>
              !cloudNis.has(s.nis.toUpperCase()) &&
              !cloudIds.has(s.id) &&
              !DUMMY_STUDENT_NAMES.has(s.name) &&
              !DUMMY_STUDENT_IDS.has(s.id)
            );
            if (localOnly.length > 0) {
              localOnly.forEach(s => insertStudentToSupabase(s).catch(() => {}));
            }
            return [...cloudStudents, ...localOnly];
          });
        }
        if (res.books !== undefined) {
          setBooks(prev => {
            const cloudBooks = filterOutDummyBooks(res.books!);
            const cloudCodes = new Set(cloudBooks.map(b => b.code.toUpperCase()));
            const cloudIds = new Set(cloudBooks.map(b => b.id));
            const localOnly = prev.filter(b =>
              !cloudCodes.has(b.code.toUpperCase()) &&
              !cloudIds.has(b.id) &&
              !DUMMY_BOOK_CODES.has(b.code) &&
              !DUMMY_BOOK_IDS.has(b.id)
            );
            if (localOnly.length > 0) {
              localOnly.forEach(b => insertBookToSupabase(b).catch(() => {}));
            }
            return [...cloudBooks, ...localOnly];
          });
        }
        if (res.cards !== undefined) {
          setCards(prev => {
            const cloudCards = filterOutDummyCards(res.cards!);
            const cloudUids = new Set(cloudCards.map(c => c.uid.toUpperCase()));
            const cloudIds = new Set(cloudCards.map(c => c.id));
            const localOnly = prev.filter(c =>
              !cloudUids.has(c.uid.toUpperCase()) &&
              !cloudIds.has(c.id) &&
              !DUMMY_CARD_IDS.has(c.id)
            );
            if (localOnly.length > 0) {
              localOnly.forEach(c => insertCardToSupabase(c).catch(() => {}));
            }
            return [...cloudCards, ...localOnly];
          });
        }
        if (res.visits !== undefined) {
          setVisits(prev => {
            const cloudVisits = filterOutDummyVisits(res.visits!);
            const cloudIds = new Set(cloudVisits.map(v => v.id));
            const localOnly = prev.filter(v =>
              !cloudIds.has(v.id) &&
              !v.id.startsWith('v-act-') &&
              !v.id.startsWith('v-hist-')
            );
            if (localOnly.length > 0) {
              localOnly.forEach(v => recordVisitToSupabase(v).catch(() => {}));
            }
            return [...cloudVisits, ...localOnly];
          });
        }
        if (res.loans !== undefined) {
          setLoans(prev => {
            const cloudLoans = filterOutDummyLoans(res.loans!);
            const cloudCodes = new Set(cloudLoans.map(l => l.loan_code));
            const cloudIds = new Set(cloudLoans.map(l => l.id));
            const localOnly = prev.filter(l =>
              !cloudCodes.has(l.loan_code) &&
              !cloudIds.has(l.id) &&
              !DUMMY_LOAN_IDS.has(l.id)
            );
            if (localOnly.length > 0) {
              localOnly.forEach(l => insertLoanToSupabase(l).catch(() => {}));
            }
            return [...cloudLoans, ...localOnly];
          });
        }
        if (res.awards !== undefined) {
          setAwards(prev => {
            const cloudAwards = filterOutDummyAwards(res.awards!);
            const cloudIds = new Set(cloudAwards.map(a => a.id));
            const localOnly = prev.filter(a =>
              !cloudIds.has(a.id) &&
              !DUMMY_AWARD_IDS.has(a.id)
            );
            return [...cloudAwards, ...localOnly];
          });
        }
        if (res.wishlists !== undefined) {
          setWishlists(prev => {
            const cloudWishlists = filterOutDummyWishlists(res.wishlists!);
            const cloudIds = new Set(cloudWishlists.map(w => w.id));
            const localOnly = prev.filter(w =>
              !cloudIds.has(w.id) &&
              !DUMMY_WISHLIST_IDS.has(w.id) &&
              w.student_id !== 'std-demo-01'
            );
            if (localOnly.length > 0) {
              localOnly.forEach(w => insertWishlistToSupabase(w).catch(() => {}));
            }
            return [...cloudWishlists, ...localOnly];
          });
        }
        if (res.users && res.users.length > 0) {
          setUsers(prev => {
            const map = new Map<string, AppUser>();
            prev.forEach(u => map.set(u.email.toLowerCase(), u));
            res.users!.forEach(u => {
              const existing = map.get(u.email.toLowerCase());
              map.set(u.email.toLowerCase(), existing ? { ...existing, ...u } : u);
            });
            return Array.from(map.values());
          });
        }
      }
    }).catch((err) => {
      console.warn('Initial Supabase fetch warning:', err);
    });

    // 3. Listen to real-time auth events (sign in, sign out, token refresh)
    const { unsubscribe: unsubAuth } = subscribeToSupabaseAuth((supaUser, event) => {
      if (event === 'SIGNED_IN' && supaUser) {
        setCurrentUser(supaUser);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    // Helper for silent background delta fetch
    const fetchLatestCloudDelta = async () => {
      if (isSilentFetchingRef.current || !isSupabaseConfigured) return;
      isSilentFetchingRef.current = true;
      try {
        const res = await fetchAllFromSupabase();
        if (res.success) {
          if (res.students !== undefined) {
            setStudents(prev => {
              const cloudStudents = filterOutDummyStudents(res.students!);
              const cloudNis = new Set(cloudStudents.map(s => s.nis.toUpperCase()));
              const cloudIds = new Set(cloudStudents.map(s => s.id));
              const localOnly = prev.filter(s =>
                !cloudNis.has(s.nis.toUpperCase()) &&
                !cloudIds.has(s.id) &&
                !DUMMY_STUDENT_NAMES.has(s.name) &&
                !DUMMY_STUDENT_IDS.has(s.id)
              );
              return [...cloudStudents, ...localOnly];
            });
          }
          if (res.books !== undefined) {
            setBooks(prev => {
              const cloudBooks = filterOutDummyBooks(res.books!);
              const cloudCodes = new Set(cloudBooks.map(b => b.code.toUpperCase()));
              const cloudIds = new Set(cloudBooks.map(b => b.id));
              const localOnly = prev.filter(b =>
                !cloudCodes.has(b.code.toUpperCase()) &&
                !cloudIds.has(b.id) &&
                !DUMMY_BOOK_CODES.has(b.code) &&
                !DUMMY_BOOK_IDS.has(b.id)
              );
              return [...cloudBooks, ...localOnly];
            });
          }
          if (res.cards !== undefined) {
            setCards(prev => {
              const cloudCards = filterOutDummyCards(res.cards!);
              const cloudUids = new Set(cloudCards.map(c => c.uid.toUpperCase()));
              const cloudIds = new Set(cloudCards.map(c => c.id));
              const localOnly = prev.filter(c =>
                !cloudUids.has(c.uid.toUpperCase()) &&
                !cloudIds.has(c.id) &&
                !DUMMY_CARD_IDS.has(c.id)
              );
              return [...cloudCards, ...localOnly];
            });
          }
          if (res.visits !== undefined) {
            setVisits(prev => {
              const cloudVisits = filterOutDummyVisits(res.visits!);
              const cloudIds = new Set(cloudVisits.map(v => v.id));
              const localOnly = prev.filter(v =>
                !cloudIds.has(v.id) &&
                !v.id.startsWith('v-act-') &&
                !v.id.startsWith('v-hist-')
              );
              return [...cloudVisits, ...localOnly];
            });
          }
          if (res.loans !== undefined) {
            setLoans(prev => {
              const cloudLoans = filterOutDummyLoans(res.loans!);
              const cloudCodes = new Set(cloudLoans.map(l => l.loan_code));
              const cloudIds = new Set(cloudLoans.map(l => l.id));
              const localOnly = prev.filter(l =>
                !cloudCodes.has(l.loan_code) &&
                !cloudIds.has(l.id) &&
                !DUMMY_LOAN_IDS.has(l.id)
              );
              return [...cloudLoans, ...localOnly];
            });
          }
          if (res.awards !== undefined) {
            setAwards(prev => {
              const cloudAwards = filterOutDummyAwards(res.awards!);
              const cloudIds = new Set(cloudAwards.map(a => a.id));
              const localOnly = prev.filter(a =>
                !cloudIds.has(a.id) &&
                !DUMMY_AWARD_IDS.has(a.id)
              );
              return [...cloudAwards, ...localOnly];
            });
          }
          if (res.wishlists !== undefined) {
            setWishlists(prev => {
              const cloudWishlists = filterOutDummyWishlists(res.wishlists!);
              const cloudIds = new Set(cloudWishlists.map(w => w.id));
              const localOnly = prev.filter(w =>
                !cloudIds.has(w.id) &&
                !DUMMY_WISHLIST_IDS.has(w.id) &&
                w.student_id !== 'std-demo-01'
              );
              return [...cloudWishlists, ...localOnly];
            });
          }
          if (res.users !== undefined && res.users.length > 0) {
            setUsers(prev => {
              const map = new Map<string, AppUser>();
              prev.forEach(u => map.set(u.email.toLowerCase(), u));
              res.users!.forEach(u => {
                const existing = map.get(u.email.toLowerCase());
                map.set(u.email.toLowerCase(), existing ? { ...existing, ...u } : u);
              });
              return Array.from(map.values());
            });
          }
          if (res.santriMenus !== undefined && res.santriMenus.length > 0) {
            setSantriMenus(res.santriMenus);
          }
          setLastRealtimeSync(new Date().toISOString());
          setIsRealtimeConnected(true);
        }
      } catch (err) {
        console.debug('Background database resync notice:', err);
      } finally {
        isSilentFetchingRef.current = false;
      }
    };

    // 4. Listen to real-time events (Instant WebSockets + Cross-tab + Postgres CDC)
    const { unsubscribe: unsubRealtime } = subscribeToAllDatabaseChanges({
      onStudentChange: (event, newRow, oldRow) => {
        setLastRealtimeSync(new Date().toISOString());
        setIsRealtimeConnected(true);
        if (event === 'DELETE') {
          const delId = oldRow?.id;
          const delNis = oldRow?.nis;
          setStudents(prev => prev.filter(s => s.id !== delId && (!delNis || s.nis !== delNis)));
          setCards(prev => prev.map(c => c.student_id === delId ? { ...c, student_id: null } : c));
        } else if (event === 'INSERT' || event === 'UPDATE') {
          const item: Student = {
            id: newRow.id,
            nis: newRow.nis,
            name: newRow.name,
            class: newRow.class,
            gender: newRow.gender,
            photo_url: newRow.photo_url || '',
            phone: newRow.phone || '',
            status: newRow.status || 'active',
            rfid_uid: newRow.rfid_uid || undefined,
            created_at: newRow.created_at || new Date().toISOString(),
          };
          setStudents(prev => {
            const exists = prev.some(s => s.id === item.id || s.nis === item.nis);
            if (exists) {
              return prev.map(s => (s.id === item.id || s.nis === item.nis) ? item : s);
            }
            return [item, ...prev];
          });
        }
      },
      onBookChange: (event, newRow, oldRow) => {
        setLastRealtimeSync(new Date().toISOString());
        setIsRealtimeConnected(true);
        if (event === 'DELETE') {
          const delId = oldRow?.id;
          const delCode = oldRow?.code;
          setBooks(prev => prev.filter(b => b.id !== delId && (!delCode || b.code !== delCode)));
        } else if (event === 'INSERT' || event === 'UPDATE') {
          const item: Book = {
            id: newRow.id,
            code: newRow.code,
            title: newRow.title,
            author: newRow.author,
            publisher: newRow.publisher || '',
            year: newRow.year || undefined,
            category: newRow.category,
            rack_location: newRow.rack_location,
            total_stock: Number(newRow.total_stock) || 1,
            available_stock: Number(newRow.available_stock) ?? 1,
            cover_url: newRow.cover_url || '',
            isbn: newRow.isbn || '',
            created_at: newRow.created_at || new Date().toISOString(),
          };
          setBooks(prev => {
            const exists = prev.some(b => b.id === item.id || b.code === item.code);
            if (exists) {
              return prev.map(b => (b.id === item.id || b.code === item.code) ? item : b);
            }
            return [item, ...prev];
          });
        }
      },
      onCardChange: (event, newRow, oldRow) => {
        setLastRealtimeSync(new Date().toISOString());
        setIsRealtimeConnected(true);
        if (event === 'DELETE') {
          const delId = oldRow?.id;
          const delUid = oldRow?.uid;
          setCards(prev => prev.filter(c => c.id !== delId && (!delUid || c.uid !== delUid)));
        } else if (event === 'INSERT' || event === 'UPDATE') {
          const item: RfidCard = {
            id: newRow.id,
            uid: newRow.uid,
            student_id: newRow.student_id || null,
            status: newRow.status || 'active',
            registered_at: newRow.registered_at || new Date().toISOString(),
            note: newRow.note || '',
          };
          setCards(prev => {
            const exists = prev.some(c => c.id === item.id || c.uid === item.uid);
            if (exists) {
              return prev.map(c => (c.id === item.id || c.uid === item.uid) ? item : c);
            }
            return [item, ...prev];
          });
        }
      },
      onVisitChange: (event, newRow, oldRow) => {
        setLastRealtimeSync(new Date().toISOString());
        setIsRealtimeConnected(true);
        if (event === 'DELETE') {
          const delId = oldRow?.id;
          setVisits(prev => prev.filter(v => v.id !== delId));
        } else if (event === 'INSERT' || event === 'UPDATE') {
          const item: LibraryVisit = {
            id: newRow.id,
            student_id: newRow.student_id,
            rfid_card_id: newRow.rfid_card_id,
            rfid_uid: newRow.rfid_uid,
            check_in: newRow.check_in,
            check_out: newRow.check_out,
            duration_minutes: newRow.duration_minutes !== undefined ? Number(newRow.duration_minutes) : null,
            status: newRow.status,
            created_at: newRow.created_at || new Date().toISOString(),
            notes: newRow.notes || '',
          };
          setVisits(prev => {
            const exists = prev.some(v => v.id === item.id);
            if (exists) {
              return prev.map(v => v.id === item.id ? item : v);
            }
            return [item, ...prev];
          });
        }
      },
      onLoanChange: (event, newRow, oldRow) => {
        setLastRealtimeSync(new Date().toISOString());
        setIsRealtimeConnected(true);
        if (event === 'DELETE') {
          const delId = oldRow?.id;
          const delCode = oldRow?.loan_code;
          setLoans(prev => prev.filter(l => l.id !== delId && (!delCode || l.loan_code !== delCode)));
        } else if (event === 'INSERT' || event === 'UPDATE') {
          const item: BookLoan = {
            id: newRow.id,
            loan_code: newRow.loan_code,
            student_id: newRow.student_id,
            book_id: newRow.book_id,
            borrow_date: newRow.borrow_date,
            due_date: newRow.due_date,
            return_date: newRow.return_date,
            status: newRow.status,
            fine_amount: Number(newRow.fine_amount) || 0,
            notes: newRow.notes || '',
            created_at: newRow.created_at || new Date().toISOString(),
          };
          setLoans(prev => {
            const exists = prev.some(l => l.id === item.id || l.loan_code === item.loan_code);
            if (exists) {
              return prev.map(l => (l.id === item.id || l.loan_code === item.loan_code) ? item : l);
            }
            return [item, ...prev];
          });
        }
      },
      onUserChange: (event, newRow, oldRow) => {
        setLastRealtimeSync(new Date().toISOString());
        setIsRealtimeConnected(true);
        if (event === 'DELETE') {
          const delId = oldRow?.id;
          const delEmail = oldRow?.email?.toLowerCase();
          setUsers(prev => prev.filter(u => u.id !== delId && (!delEmail || u.email.toLowerCase() !== delEmail)));
        } else if (event === 'INSERT' || event === 'UPDATE') {
          const item: AppUser = {
            id: newRow.id,
            name: newRow.name,
            email: newRow.email,
            username: newRow.username || newRow.email?.split('@')[0] || 'petugas',
            role: newRow.role || 'staff',
            avatar: newRow.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            phone: newRow.phone || '',
            status: newRow.status || 'active',
            is_default: newRow.role === 'admin' && (newRow.email?.startsWith('admin') || newRow.name?.toLowerCase().includes('admin')),
            created_at: newRow.created_at || new Date().toISOString(),
          };
          setUsers(prev => {
            const exists = prev.some(u => u.id === item.id || u.email.toLowerCase() === item.email.toLowerCase());
            if (exists) {
              return prev.map(u => (u.id === item.id || u.email.toLowerCase() === item.email.toLowerCase()) ? item : u);
            }
            return [item, ...prev];
          });
        }
      },
      onAwardChange: (event, newRow, oldRow) => {
        setLastRealtimeSync(new Date().toISOString());
        setIsRealtimeConnected(true);
        if (event === 'DELETE') {
          const delId = oldRow?.id;
          const delCert = oldRow?.certificate_no;
          setAwards(prev => prev.filter(a => a.id !== delId && (!delCert || a.certificate_no !== delCert)));
        } else if (event === 'INSERT' || event === 'UPDATE') {
          const item: LiteracyAward = {
            id: newRow.id,
            student_id: newRow.student_id || newRow.student_nis || 'std-archived',
            student_name: newRow.student_name || '',
            student_nis: newRow.student_nis || '',
            student_class: newRow.student_class || '',
            student_photo_url: newRow.student_photo_url || '',
            title: newRow.title,
            period: newRow.period,
            category: newRow.category || 'top_reader',
            certificate_no: newRow.certificate_no,
            reward_item: newRow.reward_item,
            awarded_at: newRow.awarded_at || new Date().toISOString(),
            notes: newRow.notes || '',
          };
          setAwards(prev => {
            const exists = prev.some(a => a.id === item.id || a.certificate_no === item.certificate_no);
            if (exists) {
              return prev.map(a => (a.id === item.id || a.certificate_no === item.certificate_no) ? item : a);
            }
            return [item, ...prev];
          });
        }
      },
      onWishlistChange: (event, newRow, oldRow) => {
        setLastRealtimeSync(new Date().toISOString());
        setIsRealtimeConnected(true);
        if (event === 'DELETE') {
          const delId = oldRow?.id;
          setWishlists(prev => prev.filter(w => w.id !== delId));
        } else if (event === 'INSERT' || event === 'UPDATE') {
          const item: BookWishlist = {
            id: newRow.id,
            student_id: newRow.student_id || newRow.student_nis || 'std-santri',
            student_name: newRow.student_name || '',
            student_nis: newRow.student_nis || '',
            student_class: newRow.student_class || '',
            title: newRow.title,
            author: newRow.author,
            publisher: newRow.publisher || undefined,
            category: newRow.category || 'Kitab Kuning / Turats',
            reason: newRow.reason || '',
            urgency: newRow.urgency || 'sedang',
            estimated_volume: newRow.estimated_volume || undefined,
            status: newRow.status || 'pending',
            staff_notes: newRow.staff_notes || undefined,
            created_at: newRow.created_at || new Date().toISOString(),
            updated_at: newRow.updated_at || undefined,
          };
          setWishlists(prev => {
            const exists = prev.some(w => w.id === item.id);
            if (exists) {
              return prev.map(w => w.id === item.id ? item : w);
            }
            return [item, ...prev];
          });
        }
      },
      onSantriMenuChange: (_event, newRow) => {
        setLastRealtimeSync(new Date().toISOString());
        setIsRealtimeConnected(true);
        if (Array.isArray(newRow) && newRow.length > 0) {
          setSantriMenus(newRow);
        } else if (newRow && newRow.menu_key) {
          setSantriMenus(prev => {
            const exists = prev.some(m => m.menu_key === newRow.menu_key);
            const updatedMenu: SantriMenu = {
              id: newRow.id || `smenu-${newRow.menu_key}`,
              menu_key: newRow.menu_key,
              menu_name: newRow.menu_name,
              description: newRow.description || '',
              is_enabled: Boolean(newRow.is_enabled),
              icon: newRow.icon || 'BookOpen',
              route: newRow.route,
              sort_order: newRow.sort_order ?? 1,
              category: newRow.category || 'utama',
              badge: newRow.badge,
              created_at: newRow.created_at,
              updated_at: newRow.updated_at
            };
            if (exists) {
              return prev.map(m => m.menu_key === newRow.menu_key ? { ...m, ...updatedMenu } : m);
            }
            return [...prev, updatedMenu].sort((a, b) => a.sort_order - b.sort_order);
          });
        }
      },
      onStatusChange: (status) => {
        setIsRealtimeConnected(status === 'CONNECTED');
      },
      onForceSync: () => {
        fetchLatestCloudDelta();
      },
    });

    return () => {
      unsubAuth();
      unsubRealtime();
    };
  }, []);

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

  // Test WhatsApp Gateway Connection directly
  const testWhatsAppConnection = useCallback(async (
    targetPhone: string,
    customNote?: string
  ): Promise<TestConnectionResult> => {
    const waConfig = settings.whatsapp || defaultWhatsAppConfig;
    const result = await testGatewayConnection(targetPhone, waConfig, customNote);

    const logEntry: WhatsAppLog = {
      id: `wa-test-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'test',
      recipient_name: 'Verifikasi Gateway',
      recipient_phone: result.targetPhone,
      message: result.verificationMessage,
      status: result.success ? 'sent' : 'failed',
      gateway_response: result.message,
      direct_wa_link: createWhatsAppDirectLink(result.targetPhone, result.verificationMessage),
    };

    setWhatsappLogs(prev => [logEntry, ...prev.slice(0, 50)]);

    if (result.success) {
      pushNotification(
        'Koneksi WA Terverifikasi', 
        `Pesan verifikasi berhasil dikirim ke ${result.targetPhone} via API Gateway`, 
        'success'
      );
    } else {
      pushNotification(
        'Uji Koneksi WA Terkendala', 
        result.message, 
        'warning'
      );
    }

    return result;
  }, [settings, pushNotification]);

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

  // Offline Queue Operations & Helpers
  const syncVisitWithOfflineFallback = useCallback(async (
    visit: LibraryVisit,
    action: 'INSERT' | 'UPDATE',
    student?: Student
  ): Promise<{ isOfflineQueued: boolean; offlineQueueCount: number }> => {
    const isNetOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (!isNetOnline || !isSupabaseConfigured) {
      enqueueRfidTap({
        visit,
        action,
        student_name: student?.name,
        student_nis: student?.nis,
        student_class: student?.class,
        rfid_uid: visit.rfid_uid,
        lastError: !isNetOnline ? 'Koneksi offline (Jaringan terputus)' : 'Supabase belum dikonfigurasi',
      });
      const updated = getQueuedRfidTaps();
      setOfflineQueue(updated);
      return { isOfflineQueued: true, offlineQueueCount: updated.length };
    }

    try {
      const res = await recordVisitToSupabase(visit);
      if (!res || !res.success) {
        enqueueRfidTap({
          visit,
          action,
          student_name: student?.name,
          student_nis: student?.nis,
          student_class: student?.class,
          rfid_uid: visit.rfid_uid,
          lastError: res?.error || 'Gagal menyimpan ke server Supabase',
        });
        const updated = getQueuedRfidTaps();
        setOfflineQueue(updated);
        return { isOfflineQueued: true, offlineQueueCount: updated.length };
      }
      return { isOfflineQueued: false, offlineQueueCount: getQueuedRfidTapsCount() };
    } catch (err: any) {
      enqueueRfidTap({
        visit,
        action,
        student_name: student?.name,
        student_nis: student?.nis,
        student_class: student?.class,
        rfid_uid: visit.rfid_uid,
        lastError: err?.message || 'Error koneksi Supabase',
      });
      const updated = getQueuedRfidTaps();
      setOfflineQueue(updated);
      return { isOfflineQueued: true, offlineQueueCount: updated.length };
    }
  }, []);

  const flushOfflineQueue = useCallback(async (): Promise<FlushResult> => {
    if (isProcessingOfflineQueue) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        remainingCount: getQueuedRfidTapsCount(),
        errors: [{ id: 'system', error: 'Sinkronisasi antrean sedang berjalan' }],
      };
    }

    const currentTaps = getQueuedRfidTaps();
    if (currentTaps.length === 0) {
      return { success: true, syncedCount: 0, failedCount: 0, remainingCount: 0, errors: [] };
    }

    setIsProcessingOfflineQueue(true);
    try {
      const res = await flushRfidTapQueue(async (visit) => {
        return await recordVisitToSupabase(visit);
      });

      const remaining = getQueuedRfidTaps();
      setOfflineQueue(remaining);

      if (res.syncedCount > 0) {
        pushNotification(
          'Antrean Offline Tersinkron',
          `${res.syncedCount} tap presensi berhasil disinkronkan ke Supabase Cloud.${res.remainingCount > 0 ? ` Sisa ${res.remainingCount} antrean.` : ''}`,
          res.remainingCount > 0 ? 'info' : 'success'
        );
      } else if (res.failedCount > 0) {
        pushNotification(
          'Sinkronisasi Tertunda',
          `Belum berhasil mengirim ${res.failedCount} antrean tap ke Supabase. Akan dicoba lagi otomatis saat koneksi stabil.`,
          'warning'
        );
      }

      return res;
    } finally {
      setIsProcessingOfflineQueue(false);
    }
  }, [isProcessingOfflineQueue, pushNotification]);

  const clearOfflineQueue = useCallback(() => {
    clearOfflineRfidQueue();
    setOfflineQueue([]);
    pushNotification('Antrean Dibersihkan', 'Seluruh antrean tap RFID offline telah dihapus dari memori lokal.', 'info');
  }, [pushNotification]);

  const removeQueuedTap = useCallback((id: string) => {
    dequeueRfidTap(id);
    const updated = getQueuedRfidTaps();
    setOfflineQueue(updated);
    pushNotification('Antrean Dihapus', 'Item antrean tap telah dihapus.', 'info');
  }, [pushNotification]);

  // Network Event Listeners & Cross-Tab Queue Synchronization
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      pushNotification('Koneksi Kembali Online', 'Jaringan tersambung kembali. Memeriksa antrean tap presensi...', 'info');
      setTimeout(() => {
        flushOfflineQueue().catch(() => {});
      }, 750);
    };

    const handleOffline = () => {
      setIsOnline(false);
      pushNotification('Mode Offline Aktif', 'Koneksi terputus. Seluruh tap RFID akan disimpan aman dalam antrean lokal perangkat.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubQueue = listenToOfflineQueue((updated) => {
      setOfflineQueue(updated);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubQueue();
    };
  }, [flushOfflineQueue, pushNotification]);

  // Periodic automatic background retry if queue has pending items and device is online
  useEffect(() => {
    if (!isOnline || offlineQueue.length === 0 || isProcessingOfflineQueue) return;

    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured && !isProcessingOfflineQueue) {
        flushOfflineQueue().catch(() => {});
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [isOnline, offlineQueue.length, isProcessingOfflineQueue, flushOfflineQueue]);

  // Main RFID / NFC Tap Processor with Hardware Debounce, Anti-Double-Tap & Anti-Passback
  const handleRfidTap = useCallback(async (rawUid: string): Promise<TapResult> => {
    const cleanUid = rawUid ? rawUid.trim().toUpperCase() : '';
    const normalizedCleanUid = cleanUid.replace(/[^A-Z0-9]/gi, '');
    const nowIso = new Date().toISOString();
    const nowTimestamp = Date.now();
    const waConfig = settings.whatsapp || defaultWhatsAppConfig;

    if (!cleanUid) {
      return {
        type: 'unregistered_card',
        message: 'UID NFC/RFID tidak valid',
        timestamp: nowIso,
      };
    }

    // Mutex Lock: Prevent concurrent overlapping processing of the same or rapid hardware signals
    if (tapLockRef.current) {
      return {
        type: 'cooldown_blocked',
        message: 'Sedang memproses pembacaan kartu sebelumnya, mohon tunggu sejenak.',
        timestamp: nowIso,
      };
    }

    tapLockRef.current = true;
    setIsProcessingTap(true);

    try {
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

      const currentCards = cardsRef.current;
      const currentStudents = studentsRef.current;

      // 1. Look for Card in registered cards or student record
      const card = currentCards.find(c => matchUid(c.uid));
      
      // Also support direct student RFID match or NIS match (if NFC contains NIS)
      let student = currentStudents.find(s => 
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

        setLastUnregisteredCardUid(cleanUid);
        setLastUnregisteredTimestamp(nowIso);

        const result: TapResult = {
          type: 'unregistered_card',
          message: `Kartu NFC/RFID (${cleanUid}) Belum Terdaftar atau Belum Dihubungkan ke Santri`,
          timestamp: nowIso,
        };

        setCurrentTapResult(result);
        pushNotification('Kartu / NFC Tidak Dikenali', `Tap kartu/NFC baru dengan UID: ${cleanUid}`, 'warning');
        return result;
      }

      // 2. Anti-Double-Tap / Cooldown Protection per Kartu & per Santri
      const cooldownSecs = Math.max(3, settings.kiosk_tap_cooldown_seconds ?? 4);
      const cooldownMs = cooldownSecs * 1000;
      
      const lastTapCard = recentTapsRef.current.get(cleanUid);
      const lastTapStudent = recentTapsRef.current.get(`std-${student.id}`);
      const lastTap = (lastTapCard && lastTapStudent)
        ? (lastTapCard.time > lastTapStudent.time ? lastTapCard : lastTapStudent)
        : (lastTapCard || lastTapStudent);

      if (lastTap && (nowTimestamp - lastTap.time) < cooldownMs) {
        const remainingSecs = Math.max(1, Math.ceil((cooldownMs - (nowTimestamp - lastTap.time)) / 1000));
        if (settings.sound_enabled) {
          soundManager.playErrorSound();
        }

        const result: TapResult = {
          type: 'cooldown_blocked',
          message: `⏳ Kartu Baru Saja Di-Tap! Harap tunggu ${remainingSecs} detik sebelum tap berikutnya.`,
          student,
          timestamp: nowIso,
        };

        setCurrentTapResult(result);
        pushNotification(
          'Jeda Anti-Double Tap', 
          `${student.name} baru saja melakukan tap. Tunggu ${remainingSecs} detik.`, 
          'warning'
        );
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
        return result;
      }

      // 3. Auto-close Stale Visits from previous calendar days (>14 hours old)
      const currentVisits = [...visitsRef.current];
      const todayDateStr = new Date(nowIso).toDateString();
      let staleCleaned = false;

      const cleanedVisits = currentVisits.map(v => {
        if (v.student_id === student.id && v.status === 'inside' && v.check_out === null) {
          const checkInDate = new Date(v.check_in);
          const elapsedHours = (nowTimestamp - checkInDate.getTime()) / (1000 * 60 * 60);
          const isDifferentDay = checkInDate.toDateString() !== todayDateStr;

          if (elapsedHours >= 14 || isDifferentDay) {
            staleCleaned = true;
            const autoOutTime = new Date(checkInDate.getTime() + (settings.max_visit_minutes || 180) * 60 * 1000).toISOString();
            const closed: LibraryVisit = {
              ...v,
              check_out: autoOutTime,
              duration_minutes: settings.max_visit_minutes || 180,
              status: 'completed',
              notes: (v.notes ? v.notes + ' ' : '') + '(Auto-checkout tutup harian)'
            };
            syncVisitWithOfflineFallback(closed, 'UPDATE', student).catch(() => {});
            return closed;
          }
        }
        return v;
      });

      if (staleCleaned) {
        visitsRef.current = cleanedVisits;
        setVisits(cleanedVisits);
      }

      // 4. Check if student has an active session currently inside TODAY
      const activeVisitIndex = visitsRef.current.findIndex(
        v => v.student_id === student.id && v.status === 'inside' && v.check_out === null
      );

      if (activeVisitIndex !== -1) {
        // Santri is currently inside -> Check Anti-Passback (Minimum delay before allowed to Check-Out)
        const activeVisit = visitsRef.current[activeVisitIndex];
        const checkInTime = new Date(activeVisit.check_in);
        const elapsedSinceCheckInSecs = (nowTimestamp - checkInTime.getTime()) / 1000;
        const antiPassbackSecs = settings.anti_passback_seconds ?? 20;

        if (elapsedSinceCheckInSecs < antiPassbackSecs) {
          const waitRemain = Math.max(1, Math.ceil(antiPassbackSecs - elapsedSinceCheckInSecs));
          if (settings.sound_enabled) {
            soundManager.playErrorSound();
          }

          const result: TapResult = {
            type: 'cooldown_blocked',
            message: `⚠️ Anda Sudah Masuk! Mohon tunggu ${waitRemain} detik sebelum Check-Out untuk mencegah tap keluar instan tanpa sengaja.`,
            student,
            visit: activeVisit,
            checkInTime: formatTime(activeVisit.check_in),
            timestamp: nowIso,
          };

          setCurrentTapResult(result);
          pushNotification(
            'Proteksi Anti-Passback', 
            `${student.name} baru saja Check-In (${Math.round(elapsedSinceCheckInSecs)} dtk lalu). Tunggu ${waitRemain} dtk untuk Check-Out.`, 
            'info'
          );
          return result;
        }

        // Proceed to Check OUT
        const checkOutTime = new Date(nowIso);
        const durationMins = Math.max(1, Math.round((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60)));

        const updatedVisit: LibraryVisit = {
          ...activeVisit,
          check_out: nowIso,
          duration_minutes: durationMins,
          status: 'completed',
        };

        // Synchronously update Ref & State
        const nextVisits = [...visitsRef.current];
        nextVisits[activeVisitIndex] = updatedVisit;
        visitsRef.current = nextVisits;
        setVisits(nextVisits);

        // Record recent tap in Map
        recentTapsRef.current.set(cleanUid, { time: nowTimestamp, type: 'out', studentId: student.id });
        recentTapsRef.current.set(`std-${student.id}`, { time: nowTimestamp, type: 'out', studentId: student.id });

        // Broadcast instant Realtime event to all connected devices (<50ms)
        broadcastRealtimeAction({
          type: 'VISIT_CHANGE',
          action: 'UPDATE',
          payload: updatedVisit,
        });

        // Supabase Visit Sync with Offline Queueing fallback
        const syncStatusOut = await syncVisitWithOfflineFallback(updatedVisit, 'UPDATE', student);

        if (settings.sound_enabled) {
          soundManager.playCheckOutSound();
        }

        const durationText = formatDurationText(durationMins);
        const timeInStr = formatTime(activeVisit.check_in);
        const timeOutStr = formatTime(nowIso);

        // WhatsApp Notification on Check-Out
        let waLogResult: WhatsAppLog | undefined;
        let renderedMessage = '';
        let adminDirectUrl = '';
        let parentDirectUrl = '';

        if (waConfig.enabled && waConfig.notify_on_check_out) {
          const template = waConfig.check_out_template || defaultWhatsAppConfig.check_out_template!;
          renderedMessage = renderWhatsAppTemplate(template, {
            STUDENT_NAME: student.name,
            STUDENT_NIS: student.nis,
            STUDENT_CLASS: student.class,
            TIME_IN: timeInStr,
            TIME_OUT: timeOutStr,
            DURATION_TEXT: durationText,
            LIBRARY_NAME: settings.library_name,
            INSTITUTION_NAME: settings.institution_name,
          });

          if (waConfig.admin_phone) {
            adminDirectUrl = createWhatsAppDirectLink(waConfig.admin_phone, renderedMessage);
            sendWhatsAppMessage(waConfig.admin_phone, `${student.name} (Admin)`, renderedMessage, 'check_out', waConfig)
              .then(log => {
                waLogResult = log;
                setWhatsappLogs(prev => [log, ...prev.slice(0, 50)]);
              })
              .catch(err => console.warn('WhatsApp Admin error:', err));
          }

          if (waConfig.use_student_parent_phone && student.phone) {
            parentDirectUrl = createWhatsAppDirectLink(student.phone, renderedMessage);
            sendWhatsAppMessage(student.phone, `${student.name} (Wali/Santri)`, renderedMessage, 'check_out', waConfig)
              .then(log => {
                setWhatsappLogs(prev => [log, ...prev.slice(0, 50)]);
              })
              .catch(err => console.warn('WhatsApp Parent error:', err));
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
          whatsappMessage: renderedMessage || undefined,
          whatsappDirectUrl: parentDirectUrl || adminDirectUrl || undefined,
          whatsappParentDirectUrl: parentDirectUrl || undefined,
          whatsappAdminDirectUrl: adminDirectUrl || undefined,
          whatsappParentPhone: student.phone || undefined,
          whatsappAdminPhone: waConfig.admin_phone || undefined,
          isOfflineQueued: syncStatusOut.isOfflineQueued,
          offlineQueueCount: syncStatusOut.offlineQueueCount,
        };

        setCurrentTapResult(result);
        pushNotification(
          'Santri Keluar', 
          `${student.name} (${student.class}) keluar. Durasi: ${durationText}${waConfig.enabled ? ' (Notifikasi WA diproses)' : ''}`, 
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

        // Synchronously update Ref & State
        const nextVisits = [newVisit, ...visitsRef.current];
        visitsRef.current = nextVisits;
        setVisits(nextVisits);

        // Record recent tap in Map
        recentTapsRef.current.set(cleanUid, { time: nowTimestamp, type: 'in', studentId: student.id });
        recentTapsRef.current.set(`std-${student.id}`, { time: nowTimestamp, type: 'in', studentId: student.id });

        // Broadcast instant Realtime event to all connected devices (<50ms)
        broadcastRealtimeAction({
          type: 'VISIT_CHANGE',
          action: 'INSERT',
          payload: newVisit,
        });

        // Supabase Visit Sync with Offline Queueing fallback
        const syncStatusIn = await syncVisitWithOfflineFallback(newVisit, 'INSERT', student);

        if (settings.sound_enabled) {
          soundManager.playCheckInSound();
        }

        const timeInStr = formatTime(nowIso);

        // WhatsApp Notification on Check-In
        let waLogResult: WhatsAppLog | undefined;
        let renderedMessage = '';
        let adminDirectUrl = '';
        let parentDirectUrl = '';

        if (waConfig.enabled && waConfig.notify_on_check_in) {
          const template = waConfig.check_in_template || defaultWhatsAppConfig.check_in_template!;
          renderedMessage = renderWhatsAppTemplate(template, {
            STUDENT_NAME: student.name,
            STUDENT_NIS: student.nis,
            STUDENT_CLASS: student.class,
            TIME_IN: timeInStr,
            CARD_UID: cleanUid,
            LIBRARY_NAME: settings.library_name,
            INSTITUTION_NAME: settings.institution_name,
          });

          if (waConfig.admin_phone) {
            adminDirectUrl = createWhatsAppDirectLink(waConfig.admin_phone, renderedMessage);
            sendWhatsAppMessage(waConfig.admin_phone, `${student.name} (Admin)`, renderedMessage, 'check_in', waConfig)
              .then(log => {
                waLogResult = log;
                setWhatsappLogs(prev => [log, ...prev.slice(0, 50)]);
              })
              .catch(err => console.warn('WhatsApp Admin error:', err));
          }

          if (waConfig.use_student_parent_phone && student.phone) {
            parentDirectUrl = createWhatsAppDirectLink(student.phone, renderedMessage);
            sendWhatsAppMessage(student.phone, `${student.name} (Wali/Santri)`, renderedMessage, 'check_in', waConfig)
              .then(log => {
                setWhatsappLogs(prev => [log, ...prev.slice(0, 50)]);
              })
              .catch(err => console.warn('WhatsApp Parent error:', err));
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
          whatsappMessage: renderedMessage || undefined,
          whatsappDirectUrl: parentDirectUrl || adminDirectUrl || undefined,
          whatsappParentDirectUrl: parentDirectUrl || undefined,
          whatsappAdminDirectUrl: adminDirectUrl || undefined,
          whatsappParentPhone: student.phone || undefined,
          whatsappAdminPhone: waConfig.admin_phone || undefined,
          isOfflineQueued: syncStatusIn.isOfflineQueued,
          offlineQueueCount: syncStatusIn.offlineQueueCount,
        };

        setCurrentTapResult(result);
        pushNotification(
          'Santri Masuk', 
          `${student.name} (${student.class}) masuk perpustakaan.${waConfig.enabled ? ' (Notifikasi WA diproses)' : ''}`, 
          'success'
        );
        return result;
      }
    } finally {
      setIsProcessingTap(false);
      // Release Mutex lock after short delay (500ms) to ensure smooth event loop sequencing
      setTimeout(() => {
        tapLockRef.current = false;
      }, 500);
    }
  }, [settings, pushNotification]);

  const clearCurrentTapResult = useCallback(() => {
    setCurrentTapResult(null);
  }, []);

  const manualCheckOut = useCallback((visitId: string) => {
    const nowIso = new Date().toISOString();
    let updatedVisit: LibraryVisit | null = null;
    let studentForVisit: Student | undefined;

    setVisits(prev => prev.map(v => {
      if (v.id === visitId && v.status === 'inside') {
        const checkInTime = new Date(v.check_in);
        const checkOutTime = new Date(nowIso);
        const durationMins = Math.max(1, Math.round((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60)));
        const mod: LibraryVisit = {
          ...v,
          check_out: nowIso,
          duration_minutes: durationMins,
          status: 'completed',
          notes: (v.notes ? v.notes + ' ' : '') + '(Check-out manual oleh petugas)'
        };
        updatedVisit = mod;
        studentForVisit = students.find(s => s.id === v.student_id);
        return mod;
      }
      return v;
    }));

    if (updatedVisit) {
      // Broadcast instant Realtime event to all connected devices (<50ms)
      broadcastRealtimeAction({
        type: 'VISIT_CHANGE',
        action: 'UPDATE',
        payload: updatedVisit,
      });
      syncVisitWithOfflineFallback(updatedVisit, 'UPDATE', studentForVisit).catch(() => {});

      // If WhatsApp notification is enabled for check-out, trigger it
      const waConfig = settings.whatsapp || defaultWhatsAppConfig;
      if (waConfig.enabled && waConfig.notify_on_check_out && studentForVisit) {
        const st = studentForVisit as Student;
        const durationText = formatDurationText(updatedVisit.duration_minutes || 1);
        const timeInStr = formatTime(updatedVisit.check_in);
        const timeOutStr = formatTime(nowIso);
        const template = waConfig.check_out_template || defaultWhatsAppConfig.check_out_template!;
        const renderedMessage = renderWhatsAppTemplate(template, {
          STUDENT_NAME: st.name,
          STUDENT_NIS: st.nis,
          STUDENT_CLASS: st.class,
          TIME_IN: timeInStr,
          TIME_OUT: timeOutStr,
          DURATION_TEXT: durationText,
          LIBRARY_NAME: settings.library_name,
          INSTITUTION_NAME: settings.institution_name,
        });

        if (waConfig.admin_phone) {
          sendWhatsAppMessage(waConfig.admin_phone, `${st.name} (Admin)`, renderedMessage, 'check_out', waConfig)
            .then(log => setWhatsappLogs(prev => [log, ...prev.slice(0, 50)]))
            .catch(() => {});
        }
        if (waConfig.use_student_parent_phone && st.phone) {
          sendWhatsAppMessage(st.phone, `${st.name} (Wali/Santri)`, renderedMessage, 'check_out', waConfig)
            .then(log => setWhatsappLogs(prev => [log, ...prev.slice(0, 50)]))
            .catch(() => {});
        }
      }
    }
    pushNotification('Check-out Manual', 'Santri berhasil di-checkout manual oleh petugas.', 'info');
  }, [pushNotification, students, settings]);

  // Student CRUD
  const addStudent = useCallback(async (data: Omit<Student, 'id' | 'created_at'>): Promise<Student> => {
    const stdId = generateUniqueId('std');
    const rawUid = data.rfid_uid?.trim().toUpperCase();
    const cardUid = rawUid || `RFID-${data.nis.trim().toUpperCase()}`;

    const newStudent: Student = {
      ...data,
      id: stdId,
      rfid_uid: cardUid,
      created_at: new Date().toISOString(),
    };
    setStudents(prev => [newStudent, ...prev]);

    // Broadcast instant student insert to other devices
    broadcastRealtimeAction({
      type: 'STUDENT_CHANGE',
      action: 'INSERT',
      payload: newStudent,
    });

    // Otomatis buat akun login Santri:
    // Role: SANTRI, Username: NIS, Password: Kode Kartu RFID
    setUsers(prev => {
      const cleanNis = newStudent.nis.trim();
      const existingIdx = prev.findIndex(u =>
        u.student_id === stdId ||
        u.santri_id === stdId ||
        (u.role === 'SANTRI' && u.username.toLowerCase() === cleanNis.toLowerCase())
      );

      const santriAccount: AppUser = {
        id: `usr-santri-${stdId}`,
        username: cleanNis,
        password: cardUid,
        role: 'SANTRI',
        name: newStudent.name,
        email: `${cleanNis.toLowerCase()}@santri.pesantren.id`,
        avatar: newStudent.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        phone: newStudent.phone,
        status: newStudent.status === 'suspended' ? 'inactive' : 'active',
        created_at: new Date().toISOString(),
        student_id: stdId,
        santri_id: stdId,
      };

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], ...santriAccount, id: updated[existingIdx].id };
        return updated;
      }
      return [santriAccount, ...prev];
    });

    // Automatically register and link the RFID card in cards list
    setCards(prev => {
      const existing = prev.find(c => c.uid === cardUid);
      if (existing) {
        const updatedCard: RfidCard = { 
          ...existing, 
          student_id: stdId, 
          status: 'active',
          note: existing.note || `Kartu santri ${newStudent.name} (${newStudent.nis})`
        };
        broadcastRealtimeAction({
          type: 'CARD_CHANGE',
          action: 'UPDATE',
          payload: updatedCard,
        });
        updateCardInSupabase(updatedCard.id, { student_id: stdId, status: 'active', uid: cardUid }).catch(() => {});
        return prev.map(c => c.uid === cardUid ? updatedCard : (c.student_id === stdId ? { ...c, student_id: null } : c));
      } else {
        const newCard: RfidCard = {
          id: generateUniqueId('c'),
          uid: cardUid,
          student_id: stdId,
          status: 'active',
          registered_at: new Date().toISOString(),
          note: `Kartu santri ${newStudent.name} (${newStudent.nis})`,
        };
        broadcastRealtimeAction({
          type: 'CARD_CHANGE',
          action: 'INSERT',
          payload: newCard,
        });
        insertCardToSupabase(newCard).catch(err => console.warn('Supabase insert card:', err));
        return [newCard, ...prev];
      }
    });

    try {
      const res = await insertStudentToSupabase(newStudent);
      if (res.success) {
        if (res.id && res.id !== stdId) {
          newStudent.id = res.id;
          setStudents(prev => prev.map(s => s.nis === newStudent.nis ? { ...s, id: res.id! } : s));
          setCards(prev => prev.map(c => c.uid === cardUid ? { ...c, student_id: res.id! } : c));
        }
        pushNotification('Santri & Kartu Tersimpan', `${newStudent.name} berhasil disimpan ke database cloud beserta kartu RFID (${cardUid}).`, 'success');
      } else {
        const errorDetail = (res.error?.includes('Failed to fetch') || res.error?.includes('NetworkError')) 
          ? 'Tersimpan lokal & sinkron otomatis saat online' 
          : (res.error || 'Offline');
        pushNotification('Santri & Kartu Terdaftar', `${newStudent.name} terdaftar (${errorDetail}).`, 'info');
      }
    } catch (err) {
      console.warn('Supabase insert student warning:', err);
      pushNotification('Santri & Kartu Terdaftar', `${newStudent.name} tersimpan di penyimpanan lokal.`, 'info');
    }

    return newStudent;
  }, [pushNotification]);

  const updateStudent = useCallback(async (id: string, updates: Partial<Student>) => {
    let updatedStudent: Student | null = null;
    const currentStudent = students.find(s => s.id === id);
    const nisToUse = updates.nis || currentStudent?.nis;

    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, ...updates };
        updatedStudent = updated;
        return updated;
      }
      return s;
    }));

    if (updatedStudent) {
      const studentObj = updatedStudent as Student;
      broadcastRealtimeAction({
        type: 'STUDENT_CHANGE',
        action: 'UPDATE',
        payload: studentObj,
      });

      // Synchronize Santri login account when data is updated (NIS, RFID, Name, Phone, Status)
      setUsers(prev => prev.map(u => {
        const isTargetAccount = u.student_id === id || 
          u.santri_id === id || 
          (u.role === 'SANTRI' && currentStudent && u.username.toLowerCase() === currentStudent.nis.toLowerCase());

        if (isTargetAccount) {
          const nextNis = updates.nis ? updates.nis.trim() : (u.username || currentStudent?.nis || '');
          const nextPassword = updates.rfid_uid !== undefined ? (updates.rfid_uid.trim().toUpperCase() || `RFID-${nextNis}`) : u.password;
          const nextName = updates.name ? updates.name.trim() : u.name;
          const nextAvatar = updates.photo_url !== undefined ? updates.photo_url : u.avatar;
          const nextStatus = updates.status ? (updates.status === 'suspended' ? 'inactive' : 'active') : u.status;

          return {
            ...u,
            student_id: id,
            santri_id: id,
            username: nextNis,
            password: nextPassword,
            name: nextName,
            avatar: nextAvatar,
            phone: updates.phone !== undefined ? updates.phone : u.phone,
            status: nextStatus,
          };
        }
        return u;
      }));

      // If currently logged in user is this student, also update current session
      setCurrentUser(curr => {
        if (curr && (curr.student_id === id || curr.santri_id === id || (curr.role === 'SANTRI' && currentStudent && curr.username.toLowerCase() === currentStudent.nis.toLowerCase()))) {
          const nextNis = updates.nis ? updates.nis.trim() : curr.username;
          const nextPassword = updates.rfid_uid !== undefined ? (updates.rfid_uid.trim().toUpperCase() || `RFID-${nextNis}`) : curr.password;
          return {
            ...curr,
            student_id: id,
            santri_id: id,
            username: nextNis,
            password: nextPassword,
            name: updates.name ? updates.name.trim() : curr.name,
            avatar: updates.photo_url !== undefined ? updates.photo_url : curr.avatar,
          };
        }
        return curr;
      });

      if (updates.rfid_uid !== undefined) {
        const newUid = updates.rfid_uid?.trim().toUpperCase();
        if (newUid) {
          setCards(prev => {
            const existing = prev.find(c => c.uid === newUid);
            if (existing) {
              const updatedCard: RfidCard = { ...existing, student_id: id, status: 'active' };
              broadcastRealtimeAction({
                type: 'CARD_CHANGE',
                action: 'UPDATE',
                payload: updatedCard,
              });
              updateCardInSupabase(updatedCard.id, { student_id: id, status: 'active', uid: newUid }).catch(() => {});
              return prev.map(c => c.uid === newUid ? updatedCard : (c.student_id === id && c.uid !== newUid ? { ...c, student_id: null } : c));
            } else {
              const newCard: RfidCard = {
                id: generateUniqueId('c'),
                uid: newUid,
                student_id: id,
                status: 'active',
                registered_at: new Date().toISOString(),
                note: `Kartu santri ${studentObj.name} (${studentObj.nis})`,
              };
              broadcastRealtimeAction({
                type: 'CARD_CHANGE',
                action: 'INSERT',
                payload: newCard,
              });
              insertCardToSupabase(newCard).catch(err => console.warn('Supabase insert card:', err));
              return [newCard, ...prev.map(c => c.student_id === id ? { ...c, student_id: null } : c)];
            }
          });
        } else if (updates.rfid_uid === '' || updates.rfid_uid === null) {
          setCards(prev => prev.map(c => {
            if (c.student_id === id) {
              const unlinked = { ...c, student_id: null };
              broadcastRealtimeAction({
                type: 'CARD_CHANGE',
                action: 'UPDATE',
                payload: unlinked,
              });
              updateCardInSupabase(c.id, { student_id: null }).catch(() => {});
              return unlinked;
            }
            return c;
          }));
        }
      }

      try {
        await updateStudentInSupabase(id, { ...updates, ...(nisToUse ? { nis: nisToUse } : {}) });
        pushNotification('Santri Diperbarui', 'Data santri berhasil disimpan ke database cloud.', 'success');
      } catch (err) {
        console.warn('Supabase update student error:', err);
        pushNotification('Santri Diperbarui', 'Data santri berhasil disimpan.', 'info');
      }
    }
  }, [students, pushNotification]);

  const deleteStudent = useCallback(async (id: string) => {
    const toDelete = students.find(s => s.id === id);
    setStudents(prev => prev.filter(s => s.id !== id));
    setCards(prev => prev.map(c => c.student_id === id ? { ...c, student_id: null } : c));

    // Hapus akun login Santri yang terhubung agar tidak meninggalkan akun orphan
    setUsers(prev => prev.filter(u => 
      u.student_id !== id && 
      u.santri_id !== id && 
      !(u.role === 'SANTRI' && toDelete?.nis && u.username.toLowerCase() === toDelete.nis.toLowerCase())
    ));

    // Jika sedang login sebagai santri yang dihapus, otomatis logout
    setCurrentUser(curr => {
      if (curr && (curr.student_id === id || curr.santri_id === id || (curr.role === 'SANTRI' && toDelete?.nis && curr.username.toLowerCase() === toDelete.nis.toLowerCase()))) {
        return null;
      }
      return curr;
    });

    broadcastRealtimeAction({
      type: 'STUDENT_CHANGE',
      action: 'DELETE',
      payload: null,
      oldPayload: { id, nis: toDelete?.nis },
    });
    try {
      await deleteStudentFromSupabase({ id, nis: toDelete?.nis });
      pushNotification('Santri Dihapus', 'Data santri berhasil dihapus dari database.', 'info');
    } catch (err) {
      console.warn('Supabase delete student error:', err);
      pushNotification('Santri Dihapus', 'Data santri berhasil dihapus.', 'info');
    }
  }, [students, pushNotification]);

  const linkCardToStudent = useCallback(async (studentId: string, cardUid: string): Promise<boolean> => {
    const cleanUid = cardUid.trim().toUpperCase();
    const existingCard = cards.find(c => c.uid === cleanUid);
    
    if (existingCard && existingCard.student_id && existingCard.student_id !== studentId) {
      pushNotification('Kartu Sudah Dipakai', `Kartu ${cleanUid} sudah terhubung dengan santri lain!`, 'error');
      return false;
    }

    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const mod = { ...s, rfid_uid: cleanUid };
        broadcastRealtimeAction({
          type: 'STUDENT_CHANGE',
          action: 'UPDATE',
          payload: mod,
        });
        return mod;
      }
      if (s.rfid_uid === cleanUid) {
        return { ...s, rfid_uid: undefined };
      }
      return s;
    }));

    const targetStudent = students.find(s => s.id === studentId);
    updateStudentInSupabase(studentId, { rfid_uid: cleanUid, ...(targetStudent?.nis ? { nis: targetStudent.nis } : {}) }).catch(err => console.warn('Supabase link student card:', err));

    // Sinkronkan kata sandi (kode RFID) akun login Santri
    setUsers(prev => prev.map(u => {
      if (u.student_id === studentId || u.santri_id === studentId || (u.role === 'SANTRI' && targetStudent && u.username.toLowerCase() === targetStudent.nis.toLowerCase())) {
        return {
          ...u,
          password: cleanUid,
        };
      }
      return u;
    }));

    if (existingCard) {
      const updatedCard: RfidCard = { ...existingCard, student_id: studentId, status: 'active' };
      setCards(prev => prev.map(c => {
        if (c.uid === cleanUid) {
          return updatedCard;
        }
        if (c.student_id === studentId) {
          return { ...c, student_id: null };
        }
        return c;
      }));
      broadcastRealtimeAction({
        type: 'CARD_CHANGE',
        action: 'UPDATE',
        payload: updatedCard,
      });
      updateCardInSupabase(updatedCard.id, { student_id: studentId, status: 'active' }).catch(() => {});
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
      broadcastRealtimeAction({
        type: 'CARD_CHANGE',
        action: 'INSERT',
        payload: newCard,
      });
      insertCardToSupabase(newCard).catch(() => {});
    }

    pushNotification('Kartu Berhasil Dihubungkan', `RFID ${cleanUid} telah aktif untuk santri.`, 'success');
    return true;
  }, [cards, students, pushNotification]);

  const unlinkCardFromStudent = useCallback((studentId: string) => {
    const targetStudent = students.find(s => s.id === studentId);
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const mod = { ...s, rfid_uid: undefined };
        broadcastRealtimeAction({
          type: 'STUDENT_CHANGE',
          action: 'UPDATE',
          payload: mod,
        });
        return mod;
      }
      return s;
    }));
    updateStudentInSupabase(studentId, { rfid_uid: null, ...(targetStudent?.nis ? { nis: targetStudent.nis } : {}) }).catch(() => {});

    // Perbarui kata sandi akun Santri ke default format RFID jika kartu fisik dilepas
    setUsers(prev => prev.map(u => {
      if (u.student_id === studentId || u.santri_id === studentId || (u.role === 'SANTRI' && targetStudent && u.username.toLowerCase() === targetStudent.nis.toLowerCase())) {
        return {
          ...u,
          password: `RFID-${targetStudent?.nis || u.username}`,
        };
      }
      return u;
    }));

    setCards(prev => prev.map(c => {
      if (c.student_id === studentId) {
        const unlinked: RfidCard = { ...c, student_id: null };
        broadcastRealtimeAction({
          type: 'CARD_CHANGE',
          action: 'UPDATE',
          payload: unlinked,
        });
        updateCardInSupabase(c.id, { student_id: null }).catch(() => {});
        return unlinked;
      }
      return c;
    }));
    pushNotification('Kartu Dilepas', 'Kartu RFID telah diputus dari profil santri.', 'info');
  }, [students, pushNotification]);

  const batchLinkCardsToStudents = useCallback((mappings: Array<{ studentId: string; cardUid: string }>): { successCount: number; failedCount: number; errors: string[] } => {
    if (!mappings || mappings.length === 0) {
      return { successCount: 0, failedCount: 0, errors: [] };
    }

    const errors: string[] = [];
    const validMappings: Array<{ studentId: string; cardUid: string }> = [];
    const seenUidsInBatch = new Set<string>();

    for (const m of mappings) {
      const cleanUid = m.cardUid ? m.cardUid.trim().toUpperCase() : '';
      if (!m.studentId || !cleanUid) continue;

      if (seenUidsInBatch.has(cleanUid)) {
        errors.push(`UID ${cleanUid} duplikat dalam daftar pemetaan.`);
        continue;
      }
      seenUidsInBatch.add(cleanUid);
      validMappings.push({ studentId: m.studentId, cardUid: cleanUid });
    }

    if (validMappings.length === 0) {
      pushNotification('Pemetaan Gagal', errors.join(', ') || 'Tidak ada data pemetaan yang valid.', 'error');
      return { successCount: 0, failedCount: mappings.length, errors };
    }

    const mapByStudentId = new Map<string, string>();
    const mapByUid = new Map<string, string>();
    validMappings.forEach(m => {
      mapByStudentId.set(m.studentId, m.cardUid);
      mapByUid.set(m.cardUid, m.studentId);
    });

    // 1. Update students
    setStudents(prev => {
      return prev.map(s => {
        const newUid = mapByStudentId.get(s.id);
        if (newUid) {
          const mod = { ...s, rfid_uid: newUid };
          broadcastRealtimeAction({
            type: 'STUDENT_CHANGE',
            action: 'UPDATE',
            payload: mod,
          });
          updateStudentInSupabase(s.id, { rfid_uid: newUid }).catch(() => {});
          return mod;
        }
        // If another student was assigned this student's previous UID
        if (s.rfid_uid && mapByUid.has(s.rfid_uid) && mapByUid.get(s.rfid_uid) !== s.id) {
          const mod = { ...s, rfid_uid: undefined };
          broadcastRealtimeAction({
            type: 'STUDENT_CHANGE',
            action: 'UPDATE',
            payload: mod,
          });
          updateStudentInSupabase(s.id, { rfid_uid: null }).catch(() => {});
          return mod;
        }
        return s;
      });
    });

    // 2. Update cards
    setCards(prev => {
      const existingCardsByUid = new Map<string, RfidCard>();
      prev.forEach(c => existingCardsByUid.set(c.uid.toUpperCase(), c));
      
      let nextCards = [...prev];
      const newlyCreatedCards: RfidCard[] = [];

      validMappings.forEach(({ studentId, cardUid }) => {
        const targetStudent = students.find(s => s.id === studentId);
        const studentName = targetStudent?.name || 'Santri';
        const studentNis = targetStudent?.nis || '';
        const existingCard = existingCardsByUid.get(cardUid);

        if (existingCard) {
          const updatedCard: RfidCard = {
            ...existingCard,
            student_id: studentId,
            status: 'active',
            note: existingCard.note || `Kartu santri ${studentName} (${studentNis})`
          };
          nextCards = nextCards.map(c => c.uid.toUpperCase() === cardUid ? updatedCard : (c.student_id === studentId ? { ...c, student_id: null } : c));
          existingCardsByUid.set(cardUid, updatedCard);
          broadcastRealtimeAction({
            type: 'CARD_CHANGE',
            action: 'UPDATE',
            payload: updatedCard,
          });
          updateCardInSupabase(updatedCard.id, { student_id: studentId, status: 'active', uid: cardUid }).catch(() => {});
        } else {
          const newCard: RfidCard = {
            id: generateUniqueId('c'),
            uid: cardUid,
            student_id: studentId,
            status: 'active',
            registered_at: new Date().toISOString(),
            note: `Kartu santri ${studentName} (${studentNis})`
          };
          nextCards = nextCards.map(c => c.student_id === studentId ? { ...c, student_id: null } : c);
          nextCards = [newCard, ...nextCards];
          existingCardsByUid.set(cardUid, newCard);
          newlyCreatedCards.push(newCard);
          broadcastRealtimeAction({
            type: 'CARD_CHANGE',
            action: 'INSERT',
            payload: newCard,
          });
          insertCardToSupabase(newCard).catch(() => {});
        }
      });

      return nextCards;
    });

    pushNotification(
      'Pemetaan Massal Berhasil',
      `${validMappings.length} kartu RFID berhasil dihubungkan ke santri.`,
      'success'
    );

    return {
      successCount: validMappings.length,
      failedCount: mappings.length - validMappings.length,
      errors
    };
  }, [students, pushNotification]);

  const batchUnlinkCardsFromStudents = useCallback((studentIds: string[]) => {
    if (!studentIds || studentIds.length === 0) return;
    const targetSet = new Set(studentIds);

    setStudents(prev => prev.map(s => {
      if (targetSet.has(s.id)) {
        const mod = { ...s, rfid_uid: undefined };
        broadcastRealtimeAction({
          type: 'STUDENT_CHANGE',
          action: 'UPDATE',
          payload: mod,
        });
        updateStudentInSupabase(s.id, { rfid_uid: null }).catch(() => {});
        return mod;
      }
      return s;
    }));

    setCards(prev => prev.map(c => {
      if (c.student_id && targetSet.has(c.student_id)) {
        const unlinked: RfidCard = { ...c, student_id: null };
        broadcastRealtimeAction({
          type: 'CARD_CHANGE',
          action: 'UPDATE',
          payload: unlinked,
        });
        updateCardInSupabase(c.id, { student_id: null }).catch(() => {});
        return unlinked;
      }
      return c;
    }));

    pushNotification('Kartu Direset', `${studentIds.length} santri telah dilepas dari kartu RFID.`, 'info');
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
    broadcastRealtimeAction({
      type: 'CARD_CHANGE',
      action: 'INSERT',
      payload: newCard,
    });
    insertCardToSupabase(newCard).catch(err => console.warn('Supabase insert card:', err));
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
    newCards.forEach(c => {
      broadcastRealtimeAction({
        type: 'CARD_CHANGE',
        action: 'INSERT',
        payload: c,
      });
      insertCardToSupabase(c).catch(() => {});
    });
    pushNotification('Batch Kartu Terdaftar', `${newCards.length} kartu baru berhasil didaftarkan.`, 'success');
    return newCards;
  }, [pushNotification]);

  const updateCardStatus = useCallback((id: string, status: RfidCard['status']) => {
    let updatedCard: RfidCard | null = null;
    setCards(prev => prev.map(c => {
      if (c.id === id) {
        const mod: RfidCard = { ...c, status };
        updatedCard = mod;
        return mod;
      }
      return c;
    }));
    if (updatedCard) {
      broadcastRealtimeAction({
        type: 'CARD_CHANGE',
        action: 'UPDATE',
        payload: updatedCard,
      });
      updateCardInSupabase(id, { status }).catch(() => {});
    }
    pushNotification('Status Kartu', `Status kartu diubah menjadi ${status.toUpperCase()}.`, 'info');
  }, [pushNotification]);

  const deleteCard = useCallback((id: string) => {
    const card = cards.find(c => c.id === id);
    if (card && card.student_id) {
      setStudents(prev => prev.map(s => s.id === card.student_id ? { ...s, rfid_uid: undefined } : s));
    }
    setCards(prev => prev.filter(c => c.id !== id));
    broadcastRealtimeAction({
      type: 'CARD_CHANGE',
      action: 'DELETE',
      payload: null,
      oldPayload: { id, uid: card?.uid },
    });
    deleteCardFromSupabase({ id, uid: card?.uid }).catch(err => console.warn('Supabase delete card:', err));
    pushNotification('Kartu Dihapus', 'Kartu RFID berhasil dihapus dari database.', 'info');
  }, [cards, pushNotification]);

  // Book CRUD
  const addBook = useCallback(async (data: Omit<Book, 'id' | 'created_at'>): Promise<Book> => {
    const rackLoc = (data.rack_location || data.shelf_location || 'Rak A-01').trim();
    const bookYear = data.year ?? data.publish_year ?? new Date().getFullYear();
    const cleanCode = data.code.trim().toUpperCase();

    const newBook: Book = {
      ...data,
      id: generateUniqueId(),
      code: cleanCode,
      title: data.title.trim(),
      author: data.author.trim(),
      publisher: data.publisher ? data.publisher.trim() : '',
      year: Number(bookYear) || new Date().getFullYear(),
      publish_year: Number(bookYear) || new Date().getFullYear(),
      category: data.category || 'Kitab Kuning / Turats',
      rack_location: rackLoc,
      shelf_location: rackLoc,
      total_stock: Math.max(1, Number(data.total_stock) || 1),
      available_stock: Math.max(0, Number(data.available_stock) ?? (Number(data.total_stock) || 1)),
      isbn: data.isbn ? data.isbn.trim() : '',
      description: data.description ? data.description.trim() : '',
      created_at: new Date().toISOString(),
    };

    setBooks(prev => [newBook, ...prev.filter(b => b.code.toUpperCase() !== cleanCode)]);
    broadcastRealtimeAction({
      type: 'BOOK_CHANGE',
      action: 'INSERT',
      payload: newBook,
    });

    try {
      const res = await insertBookToSupabase(newBook);
      if (res.success) {
        if (res.id && res.id !== newBook.id) {
          newBook.id = res.id;
          setBooks(prev => prev.map(b => b.code === cleanCode ? { ...b, id: res.id! } : b));
        }
        pushNotification('Buku Tersimpan', `"${newBook.title}" berhasil disimpan di database.`, 'success');
      } else {
        console.warn('Supabase insert book notice:', res.error);
        pushNotification('Buku Disimpan Lokal', `"${newBook.title}" tersimpan lokal (${res.error || 'Offline'}).`, 'info');
      }
    } catch (err: any) {
      console.warn('Supabase insert book exception:', err);
      pushNotification('Buku Disimpan Lokal', `"${newBook.title}" tersimpan lokal.`, 'info');
    }

    return newBook;
  }, [pushNotification]);

  const updateBook = useCallback(async (id: string, updates: Partial<Book>) => {
    let updatedBook: Book | null = null;
    const rackLoc = updates.rack_location || updates.shelf_location;
    const bookYear = updates.year ?? updates.publish_year;
    const normalizedUpdates: Partial<Book> = {
      ...updates,
      ...(updates.code ? { code: updates.code.trim().toUpperCase() } : {}),
      ...(updates.title ? { title: updates.title.trim() } : {}),
      ...(updates.author ? { author: updates.author.trim() } : {}),
      ...(rackLoc ? { rack_location: rackLoc.trim(), shelf_location: rackLoc.trim() } : {}),
      ...(bookYear !== undefined ? { year: Number(bookYear) || undefined, publish_year: Number(bookYear) || undefined } : {}),
    };

    setBooks(prev => prev.map(b => {
      if (b.id === id || (updates.code && b.code === updates.code)) {
        const mod = { ...b, ...normalizedUpdates };
        updatedBook = mod;
        return mod;
      }
      return b;
    }));

    if (updatedBook) {
      broadcastRealtimeAction({
        type: 'BOOK_CHANGE',
        action: 'UPDATE',
        payload: updatedBook,
      });
      try {
        const res = await updateBookInSupabase(id, normalizedUpdates);
        if (res.success) {
          pushNotification('Buku Diperbarui', 'Data buku berhasil disimpan di database.', 'info');
        } else {
          pushNotification('Buku Diperbarui', 'Data buku diperbarui secara lokal.', 'info');
        }
      } catch (err) {
        console.warn('Supabase update book error:', err);
      }
    }
  }, [pushNotification]);

  const deleteBook = useCallback(async (id: string) => {
    // Check if book has active loans
    const hasActiveLoan = loans.some(l => l.book_id === id && (l.status === 'borrowed' || l.status === 'overdue'));
    if (hasActiveLoan) {
      pushNotification('Gagal Menghapus Buku', 'Buku ini sedang dalam status dipinjam oleh santri!', 'error');
      return;
    }
    const toDelete = books.find(b => b.id === id);
    setBooks(prev => prev.filter(b => b.id !== id));
    broadcastRealtimeAction({
      type: 'BOOK_CHANGE',
      action: 'DELETE',
      payload: null,
      oldPayload: { id, code: toDelete?.code },
    });
    try {
      await deleteBookFromSupabase({ id, code: toDelete?.code });
      pushNotification('Buku Dihapus', 'Buku berhasil dihapus dari database.', 'info');
    } catch (err) {
      console.warn('Supabase delete book error:', err);
    }
  }, [books, loans, pushNotification]);

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
    const updatedBook = { ...book, available_stock: Math.max(0, book.available_stock - 1) };
    setBooks(prev => prev.map(b => b.id === book.id ? updatedBook : b));

    // Broadcast instant loan and book updates to all devices
    broadcastRealtimeAction({
      type: 'LOAN_CHANGE',
      action: 'INSERT',
      payload: newLoan,
    });
    broadcastRealtimeAction({
      type: 'BOOK_CHANGE',
      action: 'UPDATE',
      payload: updatedBook,
    });

    // Save to Supabase
    insertLoanToSupabase(newLoan).catch(err => console.warn('Supabase insert loan:', err));
    updateBookInSupabase(book.id, { available_stock: updatedBook.available_stock }).catch(() => {});

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

    const updatedLoan: BookLoan = {
      ...loan,
      return_date: nowIso,
      status: 'returned',
      fine_amount: computedFine,
      notes: notes ? (loan.notes ? `${loan.notes} | ${notes}` : notes) : loan.notes
    };

    // Update loan
    setLoans(prev => prev.map(l => l.id === loanId ? updatedLoan : l));
    broadcastRealtimeAction({
      type: 'LOAN_CHANGE',
      action: 'UPDATE',
      payload: updatedLoan,
    });
    updateLoanInSupabase(loanId, {
      return_date: nowIso,
      status: 'returned',
      fine_amount: computedFine,
      notes: updatedLoan.notes
    }).catch(err => console.warn('Supabase update loan:', err));

    // Restore book available stock
    if (book) {
      const updatedBook = {
        ...book,
        available_stock: Math.min(book.total_stock, book.available_stock + 1)
      };
      setBooks(prev => prev.map(b => b.id === book.id ? updatedBook : b));
      broadcastRealtimeAction({
        type: 'BOOK_CHANGE',
        action: 'UPDATE',
        payload: updatedBook,
      });
      updateBookInSupabase(book.id, { available_stock: updatedBook.available_stock }).catch(() => {});
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

    const updatedLoan: BookLoan = {
      ...loan,
      due_date: newDue.toISOString(),
      status: 'borrowed',
      notes: (loan.notes ? loan.notes + ' ' : '') + `(Diperpanjang +${extraDays} hari)`
    };

    setLoans(prev => prev.map(l => l.id === loanId ? updatedLoan : l));
    broadcastRealtimeAction({
      type: 'LOAN_CHANGE',
      action: 'UPDATE',
      payload: updatedLoan,
    });
    updateLoanInSupabase(loanId, {
      due_date: newDue.toISOString(),
      status: 'borrowed',
      notes: updatedLoan.notes
    }).catch(err => console.warn('Supabase update loan extend:', err));

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
    const student = students.find(s => s.id === awardData.student_id);
    const newAward: LiteracyAward = {
      ...awardData,
      id: generateUniqueId('award'),
      student_name: awardData.student_name || student?.name || '',
      student_nis: awardData.student_nis || student?.nis || '',
      student_class: awardData.student_class || student?.class || '',
      student_photo_url: awardData.student_photo_url || student?.photo_url || '',
      awarded_at: new Date().toISOString()
    };

    setAwards(prev => [newAward, ...prev]);

    // Persist immediately to Supabase Cloud
    insertAwardToSupabase(newAward).then((res) => {
      if (res.success && res.id) {
        setAwards(prev => prev.map(a => a.certificate_no === newAward.certificate_no ? { ...a, id: res.id! } : a));
      }
    }).catch(err => {
      if (!isSchemaCacheOrMissingTableError(err)) {
        console.warn('Supabase award insert warning:', err);
      }
    });

    // Broadcast across other devices and tabs
    broadcastRealtimeAction({
      type: 'AWARD_CHANGE',
      action: 'INSERT',
      payload: newAward,
    });

    pushNotification('Penghargaan Diberikan', `Penghargaan "${awardData.title}" dianugerahkan kepada ${student?.name || awardData.student_name || 'Santri'}.`, 'success');
    if (settings.sound_enabled) {
      soundManager.playCheckInSound();
    }
    return newAward;
  }, [students, settings.sound_enabled, pushNotification]);

  const deleteAward = useCallback((id: string) => {
    const target = awards.find(a => a.id === id);
    setAwards(prev => prev.filter(a => a.id !== id));

    if (target) {
      deleteAwardFromSupabase(target).catch(err => {
        if (!isSchemaCacheOrMissingTableError(err)) {
          console.warn('Supabase award delete warning:', err);
        }
      });
      broadcastRealtimeAction({
        type: 'AWARD_CHANGE',
        action: 'DELETE',
        payload: target,
        oldPayload: target,
      });
    }
    pushNotification('Penghargaan Dihapus', 'Data arsip piagam penghargaan telah dihapus.', 'info');
  }, [awards, pushNotification]);

  // Book Wishlists (Usulan Buku & Kitab Santri) Actions
  const addWishlist = useCallback(async (data: Omit<BookWishlist, 'id' | 'created_at' | 'status'>): Promise<{ success: boolean; message: string; data?: BookWishlist }> => {
    const newWish: BookWishlist = {
      ...data,
      id: generateUniqueId('wish'),
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    setWishlists(prev => [newWish, ...prev]);

    // Persist immediately to Supabase Cloud
    insertWishlistToSupabase(newWish).then((res) => {
      if (res.success && res.id) {
        setWishlists(prev => prev.map(w => w.id === newWish.id ? { ...w, id: res.id! } : w));
      }
    }).catch(err => {
      if (!isSchemaCacheOrMissingTableError(err)) {
        console.warn('Supabase wishlist insert warning:', err);
      }
    });

    // Broadcast across other devices and tabs
    broadcastRealtimeAction({
      type: 'WISHLIST_CHANGE',
      action: 'INSERT',
      payload: newWish,
    });

    pushNotification('Usulan Terkirim', `Usulan "${newWish.title}" berhasil diajukan dan tersimpan di database perpustakaan.`, 'success');
    return { success: true, message: 'Usulan berhasil disimpan di database pengurus.', data: newWish };
  }, [pushNotification]);

  const updateWishlist = useCallback(async (id: string, updates: Partial<BookWishlist>): Promise<{ success: boolean; message: string }> => {
    const target = wishlists.find(w => w.id === id);
    if (!target) return { success: false, message: 'Data usulan tidak ditemukan.' };

    const updatedWish: BookWishlist = {
      ...target,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    setWishlists(prev => prev.map(w => w.id === id ? updatedWish : w));

    updateWishlistInSupabase(id, updates).catch(err => {
      if (!isSchemaCacheOrMissingTableError(err)) {
        console.warn('Supabase update wishlist warning:', err);
      }
    });

    broadcastRealtimeAction({
      type: 'WISHLIST_CHANGE',
      action: 'UPDATE',
      payload: updatedWish,
    });

    pushNotification('Status Usulan Diperbarui', `Status usulan "${updatedWish.title}" diperbarui menjadi "${updatedWish.status}".`, 'info');
    return { success: true, message: 'Status usulan berhasil diperbarui di database.' };
  }, [wishlists, pushNotification]);

  const deleteWishlist = useCallback(async (id: string): Promise<{ success: boolean; message: string }> => {
    const target = wishlists.find(w => w.id === id);
    setWishlists(prev => prev.filter(w => w.id !== id));

    if (target) {
      deleteWishlistFromSupabase(target).catch(err => {
        if (!isSchemaCacheOrMissingTableError(err)) {
          console.warn('Supabase delete wishlist warning:', err);
        }
      });
      broadcastRealtimeAction({
        type: 'WISHLIST_CHANGE',
        action: 'DELETE',
        payload: target,
        oldPayload: target,
      });
    }

    pushNotification('Usulan Dihapus', 'Data usulan buku/kitab telah dihapus dari database.', 'info');
    return { success: true, message: 'Data usulan berhasil dihapus.' };
  }, [wishlists, pushNotification]);

  // Santri Menus Management Methods
  const isSantriMenuEnabled = useCallback((menuKey: string): boolean => {
    const found = santriMenus.find(m => m.menu_key === menuKey);
    return found ? Boolean(found.is_enabled) : true;
  }, [santriMenus]);

  const updateSantriMenu = useCallback(async (menuKey: string, updates: Partial<SantriMenu>): Promise<{ success: boolean; message: string }> => {
    const target = santriMenus.find(m => m.menu_key === menuKey);
    if (!target) return { success: false, message: 'Menu tidak ditemukan.' };

    const updatedMenu: SantriMenu = {
      ...target,
      ...updates,
      updated_at: new Date().toISOString()
    };

    setSantriMenus(prev => prev.map(m => m.menu_key === menuKey ? updatedMenu : m));

    // Cloud sync and realtime broadcast
    upsertSantriMenuInSupabase(updatedMenu).catch(err => {
      if (!isSchemaCacheOrMissingTableError(err)) {
        console.warn('Supabase upsert santri_menu error:', err);
      }
    });

    broadcastRealtimeAction({
      type: 'SANTRI_MENU_CHANGE',
      action: 'UPDATE',
      payload: updatedMenu
    });

    const statusText = updatedMenu.is_enabled ? 'Aktif' : 'Nonaktif (Dalam Pengembangan)';
    pushNotification(
      'Menu Santri Diperbarui',
      `Menu "${updatedMenu.menu_name}" kini disetel ${statusText}.`,
      'info'
    );

    return { success: true, message: `Menu "${updatedMenu.menu_name}" berhasil diperbarui.` };
  }, [santriMenus, pushNotification]);

  const batchUpdateSantriMenus = useCallback(async (newMenus: SantriMenu[]): Promise<{ success: boolean; message: string }> => {
    setSantriMenus(newMenus);

    batchSaveSantriMenusToSupabase(newMenus).catch(err => {
      if (!isSchemaCacheOrMissingTableError(err)) {
        console.warn('Supabase batch save santri_menus error:', err);
      }
    });

    broadcastRealtimeAction({
      type: 'SANTRI_MENU_CHANGE',
      action: 'UPDATE',
      payload: newMenus
    });

    pushNotification('Menu Santri Disimpan', 'Seluruh pengaturan menu portal santri berhasil diperbarui.', 'success');
    return { success: true, message: 'Pengaturan menu santri berhasil disimpan.' };
  }, [pushNotification]);

  const resetSantriMenusToDefault = useCallback(async () => {
    setSantriMenus(DEFAULT_SANTRI_MENUS);
    saveSantriMenusToStorage(DEFAULT_SANTRI_MENUS);

    batchSaveSantriMenusToSupabase(DEFAULT_SANTRI_MENUS).catch(err => {
      if (!isSchemaCacheOrMissingTableError(err)) {
        console.warn('Supabase reset santri_menus error:', err);
      }
    });

    broadcastRealtimeAction({
      type: 'SANTRI_MENU_CHANGE',
      action: 'UPDATE',
      payload: DEFAULT_SANTRI_MENUS
    });

    pushNotification('Menu Santri Direset', 'Susunan dan status menu santri telah dikembalikan ke pengaturan awal pabrik.', 'info');
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
    const trimmedIdentity = identity.trim();
    const trimmedPass = pass.trim();

    // 1. Primary Authentication: Attempt Supabase Auth
    if (isSupabaseConfigured) {
      try {
        const supaResult = await signInWithSupabase(trimmedIdentity, trimmedPass);
        if (supaResult.success && supaResult.user) {
          const supaUser = supaResult.user;

          // Merge or update local users list for offline resilience
          setUsers(prev => {
            const exists = prev.some(u => u.email.toLowerCase() === supaUser.email.toLowerCase() || u.id === supaUser.id);
            if (exists) {
              return prev.map(u => (u.email.toLowerCase() === supaUser.email.toLowerCase() || u.id === supaUser.id) ? { ...u, ...supaUser } : u);
            }
            return [supaUser, ...prev];
          });

          setCurrentUser(supaUser);

          try {
            localStorage.setItem('perpustakaan_session_last_activity', Date.now().toString());
            localStorage.removeItem('perpustakaan_session_test_offset');
            localStorage.removeItem('perpustakaan_session_logout_reason');
          } catch {
            // ignore
          }

          pushNotification(
            'Login Supabase Berhasil',
            `Ahlan wa Sahlan, ${supaUser.name} (${supaUser.role === 'admin' ? 'Administrator' : 'Petugas Perpustakaan'}).`,
            'success'
          );

          return { success: true, message: supaResult.message, user: supaUser };
        }
      } catch (err) {
        console.warn('Supabase auth attempt error:', err);
      }
    }

    // 2. Secondary Fallback: Match against local/demo stored users
    const lowerIdentity = trimmedIdentity.toLowerCase();
    const user = users.find(u => 
      (u.username && u.username.toLowerCase() === lowerIdentity) || 
      (u.email && u.email.toLowerCase() === lowerIdentity)
    );

    if (!user) {
      return { 
        success: false, 
        message: isSupabaseConfigured 
          ? 'Email/Username atau Kata sandi tidak valid di Supabase maupun sistem lokal.' 
          : 'Username atau Email tidak terdaftar dalam sistem perpustakaan.' 
      };
    }

    if (user.status !== 'active') {
      return { success: false, message: 'Akun Anda sedang dinonaktifkan oleh Administrator. Silakan hubungi admin.' };
    }

    // Default password fallback if not explicitly stored
    if (user.role === 'SANTRI') {
      const rfidMatch = (user.password && user.password.trim().toUpperCase() === trimmedPass.toUpperCase()) || user.password === trimmedPass;
      if (!rfidMatch) {
        return { success: false, message: 'NIS atau password salah.' };
      }
    } else {
      const expectedPassword = user.password || (user.role === 'admin' ? 'admin123' : 'staff123');
      if (trimmedPass !== expectedPassword) {
        return { success: false, message: 'Kata sandi (password) yang Anda masukkan salah. Coba lagi.' };
      }
    }

    const connectedStudent = students.find(s => 
      s.id === user.student_id || 
      s.id === user.santri_id || 
      (s.nis && user.username && s.nis.trim().toLowerCase() === user.username.trim().toLowerCase())
    );

    // Update last_login and sync dynamic student name
    const updatedUser: AppUser = {
      ...user,
      name: (user.role === 'SANTRI' && connectedStudent?.name) ? connectedStudent.name : user.name,
      student_id: connectedStudent?.id || user.student_id,
      santri_id: connectedStudent?.id || user.santri_id,
      last_login: new Date().toISOString()
    };

    try {
      localStorage.setItem('perpustakaan_session_last_activity', Date.now().toString());
      localStorage.removeItem('perpustakaan_session_test_offset');
      localStorage.removeItem('perpustakaan_session_logout_reason');
    } catch {
      // ignore
    }

    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    setCurrentUser(updatedUser);

    if (user.role === 'SANTRI') {
      pushNotification(
        'Login Santri Berhasil',
        `Selamat datang, ${updatedUser.name}!`,
        'success'
      );
    } else {
      pushNotification(
        'Login Berhasil',
        `Ahlan wa Sahlan, ${user.name} (${user.role === 'admin' ? 'Administrator' : 'Petugas Perpustakaan'}).`,
        'success'
      );
    }

    return { success: true, message: 'Login berhasil! Mengalihkan ke sistem...', user: updatedUser };
  }, [users, students, pushNotification]);

  const loginSantri = useCallback(async (nisInput: string, passInput: string): Promise<{ success: boolean; message: string; user?: AppUser }> => {
    const trimmedNis = nisInput.trim();
    const trimmedPass = passInput.trim();

    if (!trimmedNis || !trimmedPass) {
      return { success: false, message: 'NIS dan password wajib diisi.' };
    }

    const lowerNis = trimmedNis.toLowerCase();
    const user = users.find(u => 
      u.role === 'SANTRI' && 
      (u.username?.toLowerCase() === lowerNis || u.email?.toLowerCase() === `${lowerNis}@santri.pesantren.id`)
    );

    if (!user) {
      return { success: false, message: 'NIS atau password salah.' };
    }

    if (user.status !== 'active') {
      return { success: false, message: 'Akun Santri sedang dinonaktifkan oleh Administrator.' };
    }

    // Validasi Password = Kode Kartu RFID
    const rfidMatch = (user.password && user.password.trim().toUpperCase() === trimmedPass.toUpperCase()) || user.password === trimmedPass;
    if (!rfidMatch) {
      return { success: false, message: 'NIS atau password salah.' };
    }

    const connectedStudent = students.find(s => 
      s.id === user.student_id || 
      s.id === user.santri_id || 
      (s.nis && s.nis.trim().toLowerCase() === lowerNis)
    );

    const updatedUser: AppUser = {
      ...user,
      name: connectedStudent?.name || user.name,
      student_id: connectedStudent?.id || user.student_id,
      santri_id: connectedStudent?.id || user.santri_id,
      last_login: new Date().toISOString()
    };

    try {
      localStorage.setItem('perpustakaan_session_last_activity', Date.now().toString());
      localStorage.removeItem('perpustakaan_session_test_offset');
      localStorage.removeItem('perpustakaan_session_logout_reason');
    } catch {
      // ignore
    }

    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    setCurrentUser(updatedUser);

    pushNotification(
      'Login Santri Berhasil',
      `Selamat datang, ${updatedUser.name}!`,
      'success'
    );

    return { success: true, message: 'Login berhasil! Mengalihkan ke Dashboard Santri...', user: updatedUser };
  }, [users, students, pushNotification]);

  const logout = useCallback(async () => {
    const userName = currentUser?.name || 'Pengguna';
    try {
      if (isSupabaseConfigured) {
        await signOutWithSupabase();
      }
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem('perpustakaan_session_last_activity');
      localStorage.removeItem('perpustakaan_session_test_offset');
    } catch {
      // ignore
    }
    setCurrentUser(null);
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

    const assignedEmail = cleanEmail || `${cleanUsername}@darululum.sch.id`;

    // Optionally register user in Supabase in background
    if (isSupabaseConfigured) {
      signUpWithSupabase(assignedEmail, userData.password || 'santri123', {
        name: cleanName,
        username: cleanUsername,
        role: userData.role || 'staff',
        phone: userData.phone,
      }).catch(err => console.warn('Supabase auto-create user background notice:', err));
    }

    const newUser: AppUser = {
      ...userData,
      id: generateUniqueId('usr'),
      username: cleanUsername,
      name: cleanName,
      email: assignedEmail,
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
    broadcastRealtimeAction({
      type: 'USER_CHANGE',
      action: 'INSERT',
      payload: newUser,
    });
    // Save to Supabase Cloud database in background
    saveUserToSupabase(newUser, userData.password).catch(err => {
      console.warn('Background Supabase user save warning:', err);
    });
    pushNotification('Akun Baru Dibuat', `Akun ${newUser.name} (${newUser.username}) berhasil ditambahkan dan disimpan ke database.`, 'success');
    return { success: true, message: 'Akun petugas baru berhasil dibuat dan terhubung ke database.', user: newUser };
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

    let updatedUserObj: AppUser | null = null;
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const updated = { ...u, ...updates };
        updatedUserObj = updated;
        if (currentUser?.id === id) {
          setCurrentUser(updated);
        }
        return updated;
      }
      return u;
    }));

    if (updatedUserObj) {
      broadcastRealtimeAction({
        type: 'USER_CHANGE',
        action: 'UPDATE',
        payload: updatedUserObj,
      });
    }

    // Update in Supabase Cloud database in background
    updateUserInSupabase(target, updates).catch(err => {
      console.warn('Background Supabase user update warning:', err);
    });

    pushNotification('Akun Diperbarui', `Informasi akun ${updates.name || target.name} berhasil diperbarui di database.`, 'success');
    return { success: true, message: 'Akun berhasil diperbarui di database.' };
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
    broadcastRealtimeAction({
      type: 'USER_CHANGE',
      action: 'DELETE',
      payload: null,
      oldPayload: { id, email: target.email, username: target.username },
    });

    // Delete in Supabase Cloud database in background
    deleteUserFromSupabase(target).catch(err => {
      console.warn('Background Supabase user delete warning:', err);
    });

    pushNotification('Akun Dihapus', `Akun ${target.name} (${target.username}) telah dihapus dari database sistem.`, 'info');
    return { success: true, message: 'Akun berhasil dihapus dari database.' };
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
    const updatedUser = { ...target, status: newStatus as 'active' | 'inactive' };
    setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));

    broadcastRealtimeAction({
      type: 'USER_CHANGE',
      action: 'UPDATE',
      payload: updatedUser,
    });

    // Update status in Supabase Cloud database in background
    updateUserInSupabase(target, { status: newStatus }).catch(err => {
      console.warn('Background Supabase status update warning:', err);
    });

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
    pushNotification('Pembersihan Selesai', 'Seluruh data dummy telah dibersihkan dan sistem disetel ke kondisi bersih (Clean Slate).', 'info');
  }, [pushNotification]);

  const clearAllData = useCallback(async (options?: { deleteFromCloud?: boolean; includeUsers?: boolean }): Promise<{ success: boolean; message: string }> => {
    // 1. Reset local application states
    setStudents([]);
    setCards([]);
    setVisits([]);
    setBooks([]);
    setLoans([]);
    setAwards([]);
    setWishlists([]);
    setNotifications([]);
    setWhatsappLogs([]);

    // 2. Remove all related items from localStorage
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.CARDS);
    localStorage.removeItem(STORAGE_KEYS.VISITS);
    localStorage.removeItem(STORAGE_KEYS.BOOKS);
    localStorage.removeItem(STORAGE_KEYS.LOANS);
    localStorage.removeItem(STORAGE_KEYS.AWARDS);
    localStorage.removeItem(STORAGE_KEYS.WISHLISTS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.WA_LOGS);
    clearOfflineRfidQueue();
    setOfflineQueue([]);

    let cloudNote = '';
    // 3. Clear cloud database records if requested and configured
    if (options?.deleteFromCloud && isSupabaseConfigured) {
      try {
        const cloudRes = await clearAllDataFromSupabase(options.includeUsers);
        if (cloudRes.success) {
          cloudNote = ' dan data di Supabase Cloud Database telah dikosongkan.';
        } else {
          cloudNote = ` (Catatan Supabase: ${cloudRes.message})`;
        }
      } catch (err: any) {
        cloudNote = ` (Gagal hapus cloud: ${err.message || 'koneksi error'})`;
      }
    }

    pushNotification(
      'Hapus Data Selesai',
      `Seluruh data santri, kartu, buku, kunjungan, peminjaman, piagam, dan log telah berhasil dihapus bersih${cloudNote}`,
      'success'
    );

    return { 
      success: true, 
      message: `Seluruh data berhasil dihapus bersih${cloudNote}` 
    };
  }, [pushNotification]);

  // Supabase Cloud Sync Operations
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState(false);

  const syncWithSupabase = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!isSupabaseConfigured) {
      return { success: false, message: 'Kredensial Supabase belum dikonfigurasi.' };
    }

    setIsSupabaseSyncing(true);
    try {
      const res = await syncAllToSupabase({
        students,
        cards,
        books,
        loans,
        visits,
        users,
        awards,
        wishlists,
        santriMenus,
      });

      if (res.success) {
        pushNotification('Sinkronisasi Supabase Berhasil', 'Data santri, buku, kartu, arsip piagam, dan menu portal santri telah berhasil diperbarui ke Supabase.', 'success');
      } else {
        pushNotification('Sinkronisasi Supabase Terkendala', res.message, 'warning');
      }

      return res;
    } catch (err: any) {
      const msg = err?.message || String(err);
      pushNotification('Gagal Sinkronisasi', msg, 'error');
      return { success: false, message: msg };
    } finally {
      setIsSupabaseSyncing(false);
    }
  }, [students, cards, books, loans, visits, users, awards, wishlists, santriMenus, pushNotification]);

  const pullFromSupabase = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!isSupabaseConfigured) {
      return { success: false, message: 'Kredensial Supabase belum dikonfigurasi.' };
    }

    setIsSupabaseSyncing(true);
    try {
      const res = await fetchAllFromSupabase();
      if (!res.success) {
        pushNotification('Gagal Mengambil Data Supabase', res.error || 'Terjadi kesalahan saat memuat data.', 'error');
        return { success: false, message: res.error || 'Gagal memuat data' };
      }

      let updatedCount = 0;
      if (res.students !== undefined) {
        setStudents(res.students);
        updatedCount += res.students.length;
      }
      if (res.books !== undefined) {
        setBooks(res.books);
        updatedCount += res.books.length;
      }
      if (res.cards !== undefined) {
        setCards(res.cards);
      }
      if (res.visits !== undefined) {
        setVisits(res.visits);
      }
      if (res.loans !== undefined) {
        setLoans(res.loans);
      }
      if (res.awards !== undefined && res.awards.length > 0) {
        setAwards(res.awards);
        updatedCount += res.awards.length;
      }
      if (res.wishlists !== undefined) {
        setWishlists(res.wishlists);
        updatedCount += res.wishlists.length;
      }
      if (res.santriMenus !== undefined && res.santriMenus.length > 0) {
        setSantriMenus(res.santriMenus);
        updatedCount += res.santriMenus.length;
      }
      if (res.users !== undefined && res.users.length > 0) {
        setUsers(prev => {
          const map = new Map<string, AppUser>();
          prev.forEach(u => map.set(u.email.toLowerCase(), u));
          res.users!.forEach(u => {
            const existing = map.get(u.email.toLowerCase());
            if (existing) {
              map.set(u.email.toLowerCase(), { ...existing, ...u });
            } else {
              map.set(u.email.toLowerCase(), u);
            }
          });
          return Array.from(map.values());
        });
        updatedCount += res.users.length;
      }

      const msg = `Berhasil memuat ${updatedCount} data (termasuk piagam, menu santri, & akun) dari database cloud Supabase.`;
      pushNotification('Tarik Data Supabase Berhasil', msg, 'success');
      return { success: true, message: msg };
    } catch (err: any) {
      const msg = err?.message || String(err);
      pushNotification('Gagal Menarik Data', msg, 'error');
      return { success: false, message: msg };
    } finally {
      setIsSupabaseSyncing(false);
    }
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

  const pendingWishlistsCount = useMemo(() => {
    return wishlists.filter(w => w.status === 'pending').length;
  }, [wishlists]);

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
        testWhatsAppConnection,
        triggerScheduleCheckNow,
        clearWhatsAppLogs,
        handleRfidTap,
        clearCurrentTapResult,
        lastUnregisteredCardUid,
        lastUnregisteredTimestamp,
        clearLastUnregisteredCard,
        manualCheckOut,
        addStudent,
        updateStudent,
        deleteStudent,
        linkCardToStudent,
        unlinkCardFromStudent,
        batchLinkCardsToStudents,
        batchUnlinkCardsFromStudents,
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
        wishlists,
        pendingWishlistsCount,
        addWishlist,
        updateWishlist,
        deleteWishlist,
        santriMenus,
        updateSantriMenu,
        batchUpdateSantriMenus,
        resetSantriMenusToDefault,
        isSantriMenuEnabled,
        santriMenusSql: santriMenusTableSql,
        login,
        loginSantri,
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
        clearAllData,
        supabaseSchema: supabaseSqlSchema,
        bookWishlistsSql: bookWishlistsTableSql,
        literacyAwardsSql: literacyAwardsTableSql,
        isWishlistTableAvailable,
        checkTableAvailability,
        isSupabaseSyncing,
        isRealtimeConnected,
        lastRealtimeSync,
        syncWithSupabase,
        pullFromSupabase,
        offlineQueue,
        offlineQueueCount,
        isProcessingOfflineQueue,
        isOnline,
        flushOfflineQueue,
        clearOfflineQueue,
        removeQueuedTap,
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
