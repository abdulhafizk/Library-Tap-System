import { Student, RfidCard, LibraryVisit, AppUser, LibrarySettings, NotificationItem, Book, BookLoan, BookWishlist } from '../types';
import { defaultWhatsAppConfig } from '../utils/whatsappUtils';
import { DEFAULT_READING_STREAK_CONFIG } from '../utils/readingStreakUtils';

export const initialUsers: AppUser[] = [
  {
    id: 'usr-admin-1',
    username: 'admin',
    name: 'Administrator Perpustakaan',
    email: 'admin@darululum.sch.id',
    password: 'admin123',
    role: 'admin',
    avatar: '',
    phone: '081234567890',
    status: 'active',
    is_default: true,
    created_at: '2024-01-10T08:00:00Z',
    last_login: new Date().toISOString()
  }
];

export const initialSettings: LibrarySettings = {
  library_name: 'Perpustakaan Baitul Hikmah',
  institution_name: 'Pondok Pesantren Darul Ulum Modern',
  open_time: '07:30',
  close_time: '17:30',
  max_visit_minutes: 180,
  capacity: 75,
  sound_enabled: true,
  dark_mode: false,
  auto_reset_seconds: 5,
  kiosk_tap_cooldown_seconds: 5,
  anti_passback_seconds: 30,
  kiosk_mode_allowed: true,
  whatsapp: defaultWhatsAppConfig,
  reading_streak: DEFAULT_READING_STREAK_CONFIG,
};

// Clean State: Seluruh data dummy/palsu telah dibersihkan
export const initialStudents: Student[] = [];
export const initialCards: RfidCard[] = [];
export const initialVisits: LibraryVisit[] = [];
export const initialBooks: Book[] = [];
export const initialLoans: BookLoan[] = [];
export const initialWishlists: BookWishlist[] = [];
export const initialNotifications: NotificationItem[] = [];

export const supabaseSqlSchema = `-- ============================================================================
-- SCHEMA DATABASE SUPABASE LENGKAP: Library Tap System & Santri Reading Portal
-- Versi: 2.8.8 (Terpadu: Master, Sirkulasi, Reading Streak & Notifikasi)
-- Jalankan pada Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLE USERS (Petugas, Admin & Akun Santri)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'SANTRI')),
    avatar_url TEXT,
    phone VARCHAR(30),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    student_id UUID,
    is_default BOOLEAN DEFAULT false,
    is_first_login BOOLEAN DEFAULT false,
    password_changed BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. TABLE STUDENTS (Master Data Santri & Siswa)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nis VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    class VARCHAR(50) NOT NULL,
    class_grade VARCHAR(50),
    dormitory VARCHAR(100),
    gender CHAR(1) NOT NULL CHECK (gender IN ('L', 'P')),
    photo_url TEXT,
    phone VARCHAR(30),
    parent_phone VARCHAR(30),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'suspended', 'leave')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. TABLE RFID CARDS (Kartu Akses Perpustakaan)
CREATE TABLE IF NOT EXISTS rfid_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid VARCHAR(100) UNIQUE NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lost')),
    note TEXT,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. TABLE LIBRARY VISITS (Riwayat Presensi Kunjungan Tap RFID)
CREATE TABLE IF NOT EXISTS library_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    rfid_card_id UUID REFERENCES rfid_cards(id) ON DELETE SET NULL,
    rfid_uid VARCHAR(100) NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    check_out TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'inside' CHECK (status IN ('inside', 'completed')),
    notes TEXT,
    device_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABLE BOOKS (Katalog Buku & Kitab Turats)
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    publisher VARCHAR(255),
    year INTEGER,
    category VARCHAR(100) NOT NULL,
    rack_location VARCHAR(100) NOT NULL,
    total_stock INTEGER NOT NULL DEFAULT 1,
    available_stock INTEGER NOT NULL DEFAULT 1,
    cover_url TEXT,
    isbn VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. TABLE BOOK LOANS (Sirkulasi Peminjaman & Pengembalian)
CREATE TABLE IF NOT EXISTS book_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_code VARCHAR(100) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    borrow_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    return_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue')),
    fine_amount NUMERIC(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. TABLE LITERACY AWARDS (Arsip Piagam & Penghargaan Santri)
CREATE TABLE IF NOT EXISTS literacy_awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    student_nis VARCHAR(50),
    student_name VARCHAR(255),
    student_class VARCHAR(50),
    student_photo_url TEXT,
    title VARCHAR(255) NOT NULL,
    period VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'top_reader',
    certificate_no VARCHAR(100) UNIQUE NOT NULL,
    reward_item TEXT NOT NULL,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TABLE BOOK WISHLISTS (Usulan Buku & Kitab Santri)
CREATE TABLE IF NOT EXISTS book_wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    student_nis VARCHAR(50),
    student_name VARCHAR(255) NOT NULL,
    student_class VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    publisher VARCHAR(255),
    category VARCHAR(100) NOT NULL DEFAULT 'Kitab Kuning / Turats',
    reason TEXT NOT NULL,
    urgency VARCHAR(50) NOT NULL DEFAULT 'sedang',
    estimated_volume VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    staff_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. TABLE SANTRI MENUS (Manajemen Fitur & Menu Portal Santri)
CREATE TABLE IF NOT EXISTS santri_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_key VARCHAR(100) UNIQUE NOT NULL,
    menu_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    icon VARCHAR(100) NOT NULL DEFAULT 'BookOpen',
    route VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 1,
    category VARCHAR(50) DEFAULT 'utama',
    badge VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 11. TABLE READING ACTIVITIES (Sesi Membaca & Muthola'ah Terverifikasi)
CREATE TABLE IF NOT EXISTS reading_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    santri_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR(255),
    santri_name VARCHAR(255),
    student_nis VARCHAR(50),
    santri_nis VARCHAR(50),
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    book_title VARCHAR(255),
    date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 0),
    target_reached BOOLEAN NOT NULL DEFAULT FALSE,
    visit_id UUID REFERENCES library_visits(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. TABLE READING DAILY SUMMARIES (Agregat Harian Per Santri)
CREATE TABLE IF NOT EXISTS reading_daily_summaries (
    id VARCHAR(100) PRIMARY KEY, -- Format: sum_{santri_id}_{date}
    santri_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_duration_minutes INTEGER NOT NULL DEFAULT 0,
    target_minutes INTEGER NOT NULL DEFAULT 15,
    target_reached BOOLEAN NOT NULL DEFAULT FALSE,
    sessions_count INTEGER NOT NULL DEFAULT 1,
    books_read JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_santri_date UNIQUE(santri_id, date)
);

-- 13. TABLE READING STREAKS (Cache Metrik & Capaian Streak Santri)
CREATE TABLE IF NOT EXISTS reading_streaks (
    santri_id UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    total_reading_days INTEGER NOT NULL DEFAULT 0,
    total_reading_minutes INTEGER NOT NULL DEFAULT 0,
    total_books_read INTEGER NOT NULL DEFAULT 0,
    last_reading_date DATE,
    current_milestone VARCHAR(100),
    unlocked_milestones JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. TABLE READING STREAK CONFIGS (Pengaturan Target & Milestone)
CREATE TABLE IF NOT EXISTS reading_streak_configs (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'main_config',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    daily_target_minutes INTEGER NOT NULL DEFAULT 15,
    milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. TABLE LIBRARY SETTINGS (Pengaturan Sistem Perpustakaan)
CREATE TABLE IF NOT EXISTS library_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'main_settings',
    settings JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. TABLE SANTRI NOTIFICATIONS (Notifikasi & Pengumuman Santri)
CREATE TABLE IF NOT EXISTS santri_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    category VARCHAR(50) DEFAULT 'general',
    is_read BOOLEAN DEFAULT false,
    is_seen BOOLEAN DEFAULT false,
    link_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    seen_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- SAFE COLUMN MIGRATIONS (Untuk Database yang Telah Ada Sebelumnya)
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE students ADD COLUMN IF NOT EXISTS class_grade VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS dormitory VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(30);
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE books ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE reading_activities ADD COLUMN IF NOT EXISTS student_name VARCHAR(255);
ALTER TABLE reading_activities ADD COLUMN IF NOT EXISTS santri_name VARCHAR(255);
ALTER TABLE reading_activities ADD COLUMN IF NOT EXISTS student_nis VARCHAR(50);
ALTER TABLE reading_activities ADD COLUMN IF NOT EXISTS santri_nis VARCHAR(50);

-- ============================================================================
-- INDEXES UNTUK KINERJA & PENCARIAN TINGGI
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_students_nis ON students(nis);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
CREATE INDEX IF NOT EXISTS idx_rfid_cards_uid ON rfid_cards(uid);
CREATE INDEX IF NOT EXISTS idx_visits_student ON library_visits(student_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON library_visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_check_in ON library_visits(check_in);
CREATE INDEX IF NOT EXISTS idx_books_code ON books(code);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_book_loans_loan_code ON book_loans(loan_code);
CREATE INDEX IF NOT EXISTS idx_book_loans_student ON book_loans(student_id);
CREATE INDEX IF NOT EXISTS idx_book_loans_book ON book_loans(book_id);
CREATE INDEX IF NOT EXISTS idx_book_loans_status ON book_loans(status);
CREATE INDEX IF NOT EXISTS idx_awards_student ON literacy_awards(student_id);
CREATE INDEX IF NOT EXISTS idx_awards_certificate_no ON literacy_awards(certificate_no);
CREATE INDEX IF NOT EXISTS idx_wishlists_student ON book_wishlists(student_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_status ON book_wishlists(status);
CREATE INDEX IF NOT EXISTS idx_reading_activities_santri ON reading_activities(santri_id);
CREATE INDEX IF NOT EXISTS idx_reading_activities_date ON reading_activities(date);
CREATE INDEX IF NOT EXISTS idx_reading_activities_santri_date ON reading_activities(santri_id, date);
CREATE INDEX IF NOT EXISTS idx_notifications_student ON santri_notifications(student_id);

-- ============================================================================
-- OTOMASI DURASI KUNJUNGAN PERPUSTAKAAN
-- ============================================================================
CREATE OR REPLACE FUNCTION compute_visit_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_out IS NOT NULL AND OLD.check_out IS NULL THEN
        NEW.duration_minutes = CEIL(EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 60.0);
        NEW.status = 'completed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_compute_visit_duration ON library_visits;
CREATE TRIGGER trigger_compute_visit_duration
BEFORE UPDATE ON library_visits
FOR EACH ROW
EXECUTE FUNCTION compute_visit_duration();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) & KEBIJAKAN AKSES
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfid_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE literacy_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE santri_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_streak_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE santri_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access for users" ON users;
CREATE POLICY "Allow full access for users" ON users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for students" ON students;
CREATE POLICY "Allow full access for students" ON students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for rfid_cards" ON rfid_cards;
CREATE POLICY "Allow full access for rfid_cards" ON rfid_cards FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for library_visits" ON library_visits;
CREATE POLICY "Allow full access for library_visits" ON library_visits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for books" ON books;
CREATE POLICY "Allow full access for books" ON books FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for book_loans" ON book_loans;
CREATE POLICY "Allow full access for book_loans" ON book_loans FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for literacy_awards" ON literacy_awards;
CREATE POLICY "Allow full access for literacy_awards" ON literacy_awards FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for book_wishlists" ON book_wishlists;
CREATE POLICY "Allow full access for book_wishlists" ON book_wishlists FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for santri_menus" ON santri_menus;
CREATE POLICY "Allow full access for santri_menus" ON santri_menus FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for reading_activities" ON reading_activities;
CREATE POLICY "Allow full access for reading_activities" ON reading_activities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for reading_daily_summaries" ON reading_daily_summaries;
CREATE POLICY "Allow full access for reading_daily_summaries" ON reading_daily_summaries FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for reading_streaks" ON reading_streaks;
CREATE POLICY "Allow full access for reading_streaks" ON reading_streaks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for reading_streak_configs" ON reading_streak_configs;
CREATE POLICY "Allow full access for reading_streak_configs" ON reading_streak_configs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for library_settings" ON library_settings;
CREATE POLICY "Allow full access for library_settings" ON library_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for santri_notifications" ON santri_notifications;
CREATE POLICY "Allow full access for santri_notifications" ON santri_notifications FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- SUPABASE REALTIME & REPLICA IDENTITY (SINKRONISASI LIVE MULTI-PERANGKAT)
-- ============================================================================
DO $$
BEGIN
    PERFORM 1 FROM pg_publication WHERE pubname = 'supabase_realtime';
    IF FOUND THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE 
            users, students, rfid_cards, library_visits, 
            books, book_loans, literacy_awards, book_wishlists, 
            santri_menus, reading_activities, reading_streaks, 
            reading_streak_configs, library_settings, santri_notifications;
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

ALTER TABLE users REPLICA IDENTITY FULL;
ALTER TABLE students REPLICA IDENTITY FULL;
ALTER TABLE rfid_cards REPLICA IDENTITY FULL;
ALTER TABLE library_visits REPLICA IDENTITY FULL;
ALTER TABLE books REPLICA IDENTITY FULL;
ALTER TABLE book_loans REPLICA IDENTITY FULL;
ALTER TABLE literacy_awards REPLICA IDENTITY FULL;
ALTER TABLE book_wishlists REPLICA IDENTITY FULL;
ALTER TABLE santri_menus REPLICA IDENTITY FULL;
ALTER TABLE reading_activities REPLICA IDENTITY FULL;
ALTER TABLE reading_streaks REPLICA IDENTITY FULL;
ALTER TABLE reading_streak_configs REPLICA IDENTITY FULL;
ALTER TABLE library_settings REPLICA IDENTITY FULL;
ALTER TABLE santri_notifications REPLICA IDENTITY FULL;
`;

/**
 * SQL Khusus untuk membuat / migrasi tabel book_wishlists di Supabase
 * Berguna jika database Supabase sudah dibuat sebelumnya tanpa tabel ini
 */
export const bookWishlistsTableSql = `-- ==========================================================
-- SKRIP MIGRASI TABEL: book_wishlists (Usulan Buku Santri)
-- Buka Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==========================================================

CREATE TABLE IF NOT EXISTS book_wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    student_nis VARCHAR(50),
    student_name VARCHAR(255) NOT NULL,
    student_class VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    publisher VARCHAR(255),
    category VARCHAR(100) NOT NULL DEFAULT 'Kitab Kuning / Turats',
    reason TEXT NOT NULL,
    urgency VARCHAR(50) NOT NULL DEFAULT 'sedang',
    estimated_volume VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    staff_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index pencarian cepat
CREATE INDEX IF NOT EXISTS idx_wishlists_student ON book_wishlists(student_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_status ON book_wishlists(status);

-- Keamanan Row Level Security (RLS)
ALTER TABLE book_wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access for book_wishlists" ON book_wishlists;
CREATE POLICY "Allow full access for book_wishlists" ON book_wishlists FOR ALL USING (true) WITH CHECK (true);

-- Realtime & Replica Identity
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'book_wishlists'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE book_wishlists;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

ALTER TABLE book_wishlists REPLICA IDENTITY FULL;
`;

/**
 * SQL Khusus untuk membuat / migrasi tabel literacy_awards di Supabase
 */
export const literacyAwardsTableSql = `-- ==========================================================
-- SKRIP MIGRASI TABEL: literacy_awards (Piagam Kehormatan)
-- Buka Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==========================================================

CREATE TABLE IF NOT EXISTS literacy_awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    student_nis VARCHAR(50),
    student_name VARCHAR(255) NOT NULL,
    student_class VARCHAR(50),
    student_photo_url TEXT,
    title VARCHAR(255) NOT NULL,
    period VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'top_reader',
    certificate_no VARCHAR(100) UNIQUE NOT NULL,
    reward_item TEXT NOT NULL,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pencarian cepat
CREATE INDEX IF NOT EXISTS idx_awards_student ON literacy_awards(student_id);
CREATE INDEX IF NOT EXISTS idx_awards_certificate_no ON literacy_awards(certificate_no);

-- Keamanan Row Level Security (RLS)
ALTER TABLE literacy_awards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access for literacy_awards" ON literacy_awards;
CREATE POLICY "Allow full access for literacy_awards" ON literacy_awards FOR ALL USING (true) WITH CHECK (true);

-- Realtime & Replica Identity
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'literacy_awards'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE literacy_awards;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

ALTER TABLE literacy_awards REPLICA IDENTITY FULL;
`;

export { santriMenusTableSql } from './santriMenuData';

