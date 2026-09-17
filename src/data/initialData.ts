import { Student, RfidCard, LibraryVisit, AppUser, LibrarySettings, NotificationItem, Book, BookLoan, BookWishlist } from '../types';
import { defaultWhatsAppConfig } from '../utils/whatsappUtils';

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
};

// Clean State: Seluruh data dummy/palsu telah dibersihkan
export const initialStudents: Student[] = [];
export const initialCards: RfidCard[] = [];
export const initialVisits: LibraryVisit[] = [];
export const initialBooks: Book[] = [];
export const initialLoans: BookLoan[] = [];
export const initialWishlists: BookWishlist[] = [];
export const initialNotifications: NotificationItem[] = [];

export const supabaseSqlSchema = `-- SCHEMA DATABASE SUPABASE: Library Tap System
-- Dijalankan pada Supabase SQL Editor

-- 1. Table Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table Students
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nis VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    class VARCHAR(50) NOT NULL,
    gender CHAR(1) NOT NULL CHECK (gender IN ('L', 'P')),
    photo_url TEXT,
    phone VARCHAR(30),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'suspended', 'leave')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table RFID Cards
CREATE TABLE IF NOT EXISTS rfid_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid VARCHAR(100) UNIQUE NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lost')),
    note TEXT,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Table Library Visits
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Table Books (Katalog Buku & Kitab)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Table Book Loans (Sirkulasi Peminjaman & Pengembalian)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Table Literacy Awards (Arsip Piagam & Penghargaan Santri)
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

-- 8. Table Usulan Buku & Kitab Baru Santri (Wishlist)
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

-- 9. Table Pengaturan Menu Santri (Santri Menus Management)
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Indexes for fast lookup and reporting
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_rfid_cards_uid ON rfid_cards(uid);
CREATE INDEX IF NOT EXISTS idx_students_nis ON students(nis);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
CREATE INDEX IF NOT EXISTS idx_visits_status ON library_visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_student_active ON library_visits(student_id, status);
CREATE INDEX IF NOT EXISTS idx_visits_check_in ON library_visits(check_in);
CREATE INDEX IF NOT EXISTS idx_books_code ON books(code);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_book_loans_status ON book_loans(status);
CREATE INDEX IF NOT EXISTS idx_book_loans_student ON book_loans(student_id);
CREATE INDEX IF NOT EXISTS idx_book_loans_book ON book_loans(book_id);
CREATE INDEX IF NOT EXISTS idx_awards_student ON literacy_awards(student_id);
CREATE INDEX IF NOT EXISTS idx_awards_certificate_no ON literacy_awards(certificate_no);
CREATE INDEX IF NOT EXISTS idx_wishlists_student ON book_wishlists(student_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_status ON book_wishlists(status);

-- 10. Trigger to automatically compute duration on check_out
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

CREATE OR REPLACE TRIGGER trigger_compute_visit_duration
BEFORE UPDATE ON library_visits
FOR EACH ROW
EXECUTE FUNCTION compute_visit_duration();

-- 11. Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfid_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE literacy_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE santri_menus ENABLE ROW LEVEL SECURITY;

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

-- 12. Enable Supabase Realtime (Instant Live Updates across all devices without page refresh)
DO $$
BEGIN
    -- Tambahkan tabel ke publication realtime jika belum ada
    PERFORM 1 FROM pg_publication WHERE pubname = 'supabase_realtime';
    IF FOUND THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE users, students, rfid_cards, library_visits, books, book_loans, literacy_awards, book_wishlists, santri_menus;
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL; -- Abaikan jika tabel sudah terdaftar dalam publikasi
END $$;

-- Full Replica Identity ensures updated/deleted rows contain complete records in realtime payloads
ALTER TABLE users REPLICA IDENTITY FULL;
ALTER TABLE students REPLICA IDENTITY FULL;
ALTER TABLE rfid_cards REPLICA IDENTITY FULL;
ALTER TABLE library_visits REPLICA IDENTITY FULL;
ALTER TABLE books REPLICA IDENTITY FULL;
ALTER TABLE book_loans REPLICA IDENTITY FULL;
ALTER TABLE literacy_awards REPLICA IDENTITY FULL;
ALTER TABLE book_wishlists REPLICA IDENTITY FULL;
ALTER TABLE santri_menus REPLICA IDENTITY FULL;
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

