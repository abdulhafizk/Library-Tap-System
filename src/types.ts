export type Gender = 'L' | 'P'; // Laki-laki / Perempuan
export type StudentStatus = 'active' | 'graduated' | 'suspended' | 'leave';
export type CardStatus = 'active' | 'inactive' | 'lost';
export type VisitStatus = 'inside' | 'completed';
export type LoanStatus = 'borrowed' | 'returned' | 'overdue';
export type UserRole = 'admin' | 'staff';

export interface Book {
  id: string;
  code: string; // Barcode / Kode Buku (e.g. BK-001, KTB-014, ISBN)
  title: string;
  author: string;
  publisher?: string;
  year?: number;
  category: string; // e.g. 'Fikih & Ushul', 'Hadits', 'Tafsir & Al-Qur\'an', 'Bahasa & Nahwu', 'Sejarah Islam / Tarikh', 'Buku Umum & Sains', 'Novel & Sastra'
  rack_location: string; // e.g. 'Rak A-01 (Kitab Kuning)', 'Rak B-02 (Fikih)'
  total_stock: number;
  available_stock: number;
  cover_url?: string;
  isbn?: string;
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
  kiosk_mode_allowed: boolean;
  whatsapp?: WhatsAppNotificationConfig;
}

export interface TapResult {
  type: 'success_in' | 'success_out' | 'unregistered_card' | 'inactive_card' | 'inactive_student';
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
}

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
