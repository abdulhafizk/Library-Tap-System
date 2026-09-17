export type Gender = 'L' | 'P'; // Laki-laki / Perempuan
export type StudentStatus = 'active' | 'graduated' | 'suspended' | 'leave';
export type CardStatus = 'active' | 'inactive' | 'lost';
export type VisitStatus = 'inside' | 'completed';
export type LoanStatus = 'borrowed' | 'returned' | 'overdue';
export type UserRole = 'admin' | 'staff' | 'SANTRI';

export interface Book {
  id: string;
  code: string; // Barcode / Kode Buku (e.g. BK-001, KTB-014, ISBN)
  title: string;
  author: string;
  publisher?: string;
  year?: number;
  publish_year?: number; // Alias kompatibilitas
  category: string; // e.g. 'Fikih & Ushul', 'Hadits', 'Tafsir & Al-Qur\'an', 'Bahasa & Nahwu', 'Sejarah Islam / Tarikh', 'Buku Umum & Sains', 'Novel & Sastra'
  rack_location: string; // e.g. 'Rak A-01 (Kitab Kuning)', 'Rak B-02 (Fikih)'
  shelf_location?: string; // Alias kompatibilitas
  total_stock: number;
  available_stock: number;
  cover_url?: string;
  isbn?: string;
  description?: string;
  created_at: string;
}

export interface BookLoan {
  id: string;
  loan_code: string; // e.g. PINJAM-20260821-001
  student_id: string;
  book_id: string;
  borrow_date: string; // ISO string
  due_date: string; // ISO string
  return_date: string | null; // ISO string or null
  status: LoanStatus;
  fine_amount: number; // in Rupiah (e.g. 0 if on time, 1000 per day overdue)
  notes?: string;
  created_at: string;
}

export interface Student {
  id: string;
  nis: string;
  name: string;
  class: string;
  gender: Gender;
  photo_url: string;
  rfid_uid?: string;
  status: StudentStatus;
  phone?: string;
  created_at: string;
}

export interface RfidCard {
  id: string;
  uid: string;
  student_id: string | null;
  status: CardStatus;
  registered_at: string;
  note?: string;
}

export interface LibraryVisit {
  id: string;
  student_id: string;
  rfid_card_id?: string;
  rfid_uid: string;
  check_in: string; // ISO string
  check_out: string | null; // ISO string or null
  duration_minutes: number | null;
  status: VisitStatus;
  created_at: string;
  notes?: string;
}

export type UserStatus = 'active' | 'inactive';

export interface AppUser {
  id: string;
  username: string; // Unique username for login (e.g. 'admin', 'fatimah')
  name: string;
  email: string;
  password?: string; // Plaintext/hash for client mock storage
  role: UserRole; // 'admin' (Hak Akses Penuh & Kelola Pengguna) | 'staff' (Petugas Operasional)
  avatar: string;
  phone?: string;
  status: UserStatus;
  is_default?: boolean; // Default admin protection
  last_login?: string; // ISO string
  created_at: string;
  student_id?: string; // Relasi ID ke Santri
  santri_id?: string; // Alias kompatibilitas
}

import { WhatsAppNotificationConfig, WhatsAppLog } from './utils/whatsappUtils';
export type { WhatsAppNotificationConfig, WhatsAppLog };

export interface LibrarySettings {
  library_name: string;
  institution_name: string;
  open_time: string; // e.g. "07:30"
  close_time: string; // e.g. "17:00"
  max_visit_minutes: number; // e.g. 180
  capacity: number; // e.g. 60
  sound_enabled: boolean;
  dark_mode?: boolean;
  auto_reset_seconds: number; // e.g. 5
  kiosk_tap_cooldown_seconds?: number; // e.g. 5 (Delay interval between taps to prevent double tap)
  anti_passback_seconds?: number; // e.g. 30 (Minimum seconds between In and Out to prevent accidental instant checkout)
  kiosk_mode_allowed: boolean;
  whatsapp?: WhatsAppNotificationConfig;
}

export interface TapResult {
  type: 'success_in' | 'success_out' | 'unregistered_card' | 'inactive_card' | 'inactive_student' | 'cooldown_blocked';
  message: string;
  student?: Student;
  visit?: LibraryVisit;
  checkInTime?: string;
  checkOutTime?: string;
  durationText?: string;
  timestamp: string;
  whatsappLog?: WhatsAppLog;
  whatsappParentLog?: WhatsAppLog;
  whatsappMessage?: string;
  whatsappDirectUrl?: string;
  whatsappParentDirectUrl?: string;
  whatsappAdminDirectUrl?: string;
  whatsappParentPhone?: string;
  whatsappAdminPhone?: string;
  isOfflineQueued?: boolean;
  offlineQueueCount?: number;
}

export type { QueuedRfidTap } from './lib/offlineRfidQueue';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export interface LiteracyBadge {
  id: string;
  code: string;
  title: string;
  description: string;
  category: 'reading' | 'borrowing' | 'discipline' | 'special';
  icon: string;
  xpReward: number;
  requirement: string;
}

export interface LiteracyAward {
  id: string;
  student_id: string;
  student_name?: string;
  student_nis?: string;
  student_class?: string;
  student_photo_url?: string;
  title: string;
  period: string; // e.g. "Agustus 2026", "Semester Ganjil 2026/2027"
  category: 'top_reader' | 'top_borrower' | 'class_champion' | 'discipline_star' | 'special_honor';
  certificate_no: string;
  reward_item: string; // e.g. "Kitab Fathul Qorib Syarah + Voucher Koperasi Rp 50.000"
  awarded_at: string;
  notes?: string;
}

export interface StudentLiteracyProfile {
  student: Student;
  totalXp: number;
  levelTier: number;
  levelName: string;
  levelTitle: string;
  levelColor: string;
  nextLevelXp: number;
  progressPercent: number;
  totalVisits: number;
  totalReadingMinutes: number;
  totalBooksBorrowed: number;
  onTimeReturnsCount: number;
  lateReturnsCount: number;
  unlockedBadges: Array<{ badge: LiteracyBadge; unlockedAt: string }>;
  recentAwards: LiteracyAward[];
}

export type WishlistStatus = 'pending' | 'approved' | 'purchased' | 'available' | 'rejected';
export type WishlistUrgency = 'biasa' | 'penting' | 'sangat_mendesak';

export interface BookWishlist {
  id: string;
  student_id: string;
  student_name: string;
  student_nis: string;
  student_class?: string;
  title: string;
  author: string;
  publisher?: string;
  category: string;
  reason: string;
  urgency: WishlistUrgency;
  estimated_volume?: string;
  status: WishlistStatus;
  staff_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface ReadingJournalEntry {
  id: string;
  student_id: string;
  student_name: string;
  student_nis: string;
  book_id?: string;
  book_title: string;
  book_author: string;
  chapter_or_page?: string;
  category: string;
  title: string;
  key_quote?: string;
  summary: string;
  reflection?: string;
  rating?: number;
  created_at: string;
  updated_at?: string;
}

export type SantriNotificationCategory = 'wishlist' | 'overdue' | 'due_soon' | 'award' | 'badge' | 'general';

export interface SantriNotification {
  id: string;
  student_id: string;
  category: SantriNotificationCategory;
  title: string;
  message: string;
  detail?: string;
  timestamp: string;
  priority: 'urgent' | 'high' | 'normal' | 'celebration';
  read: boolean;
  actionTab?: 'overview' | 'loans' | 'card' | 'visits' | 'wishlist' | 'journal' | 'awards';
  actionLabel?: string;
  metadata?: {
    wishlistId?: string;
    wishlistTitle?: string;
    wishlistStatus?: WishlistStatus;
    loanId?: string;
    bookTitle?: string;
    dueDate?: string;
    daysOverdue?: number;
    awardId?: string;
    awardTitle?: string;
    certificateNo?: string;
    rewardItem?: string;
  };
}

export type { AdminAlertCategory, AdminAlertPriority, AdminAlertNotification } from './utils/adminNotificationUtils';

export type SantriMenuKey = 
  | 'overview' 
  | 'catalog' 
  | 'loans' 
  | 'returns' 
  | 'history' 
  | 'card' 
  | 'visits' 
  | 'wishlist' 
  | 'journal' 
  | 'awards' 
  | 'profile' 
  | 'notifications' 
  | 'bookmark';

export interface SantriMenu {
  id: string;
  menu_key: string;
  menu_name: string;
  description?: string;
  is_enabled: boolean;
  icon: string; // e.g. 'Home', 'BookOpen', 'BookMarked', 'Undo2', 'History', 'CreditCard', 'PenTool', 'Trophy', 'User', 'Bookmark', 'Bell'
  route: string; // e.g. '/santri/dashboard', '/santri/katalog', '/santri/peminjaman', etc.
  sort_order: number;
  category?: 'utama' | 'sirkulasi' | 'literasi' | 'pengguna';
  badge?: string;
  created_at?: string;
  updated_at?: string;
}
