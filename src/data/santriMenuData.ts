import { SantriMenu } from '../types';

export const SANTRI_MENU_STORAGE_KEY = 'library_tap_santri_menus_v1';

export const DEFAULT_SANTRI_MENUS: SantriMenu[] = [
  {
    id: 'smenu-overview',
    menu_key: 'overview',
    menu_name: 'Beranda / Dashboard',
    description: 'Ringkasan aktivitas, status kartu RFID, dan alert sirkulasi santri',
    is_enabled: true,
    icon: 'Home',
    route: '/santri/dashboard',
    sort_order: 1,
    category: 'utama',
    created_at: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'smenu-card',
    menu_key: 'card',
    menu_name: 'Kartu Anggota Digital',
    description: 'Kartu tanda anggota virtual dengan kode QR dan identitas RFID santri',
    is_enabled: true,
    icon: 'CreditCard',
    route: '/santri/kartu-digital',
    sort_order: 2,
    category: 'utama',
    created_at: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'smenu-visits',
    menu_key: 'visits',
    menu_name: 'Riwayat Kunjungan',
    description: 'Rekap kehadiran tap RFID dan akumulasi jam baca di ruang perpustakaan',
    is_enabled: true,
    icon: 'Clock',
    route: '/santri/kunjungan',
    sort_order: 3,
    category: 'utama',
    created_at: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'smenu-loans',
    menu_key: 'loans',
    menu_name: 'Peminjaman Saya',
    description: 'Daftar buku yang sedang dipinjam santri dan hitungan jatuh tempo',
    is_enabled: true,
    icon: 'BookMarked',
    route: '/santri/peminjaman',
    sort_order: 4,
    category: 'sirkulasi',
    created_at: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'smenu-reading-streak',
    menu_key: 'reading-streak',
    menu_name: 'Reading Streak',
    description: 'Catatan konsistensi membaca harian santri, grafik kalender, target, dan lencana milestone',
    is_enabled: true,
    icon: 'Flame',
    route: '/santri/reading-streak',
    sort_order: 5,
    category: 'literasi',
    badge: '🔥 Streak',
    created_at: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'smenu-journal',
    menu_key: 'journal',
    menu_name: 'Catatan Baca & Faedah',
    description: 'Jurnal rangkuman faedah ilmiah dan kutipan mutiara kitab yang dibaca',
    is_enabled: true,
    icon: 'PenTool',
    route: '/santri/jurnal-baca',
    sort_order: 6,
    category: 'literasi',
    created_at: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'smenu-awards',
    menu_key: 'awards',
    menu_name: 'Lencana & Penghargaan',
    description: 'Koleksi piagam digital kehormatan literasi, level XP, dan gelar prestasi',
    is_enabled: true,
    icon: 'Trophy',
    route: '/santri/penghargaan',
    sort_order: 7,
    category: 'literasi',
    created_at: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'smenu-profile',
    menu_key: 'profile',
    menu_name: 'Profil Santri',
    description: 'Data biodata santri, NIS, kelas/asrama, dan status keanggotaan',
    is_enabled: true,
    icon: 'User',
    route: '/santri/profil',
    sort_order: 8,
    category: 'pengguna',
    created_at: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'smenu-catalog',
    menu_key: 'catalog',
    menu_name: 'Katalog Buku & Kitab',
    description: 'Cari, filter, dan telusuri koleksi buku serta kitab kuning perpustakaan',
    is_enabled: true,
    icon: 'BookOpen',
    route: '/santri/katalog',
    sort_order: 9,
    category: 'utama',
    created_at: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'smenu-wishlist',
    menu_key: 'wishlist',
    menu_name: 'Usulan Buku & Kitab',
    description: 'Formulir permohonan pengadaan kitab dan buku baru kepada ustadz/pustakawan',
    is_enabled: true,
    icon: 'BookPlus',
    route: '/santri/usulan-buku',
    sort_order: 10,
    category: 'literasi',
    created_at: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'smenu-returns',
    menu_key: 'returns',
    menu_name: 'Pengembalian Mandiri',
    description: 'Pengembalian buku dan konfirmasi pengembalian melalui scan barcode mandiri',
    is_enabled: false,
    icon: 'Undo2',
    route: '/santri/pengembalian',
    sort_order: 11,
    category: 'sirkulasi',
    created_at: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'smenu-history',
    menu_key: 'history',
    menu_name: 'Riwayat Peminjaman',
    description: 'Catatan arsip seluruh buku dan kitab yang pernah selesai dipinjam',
    is_enabled: false,
    icon: 'History',
    route: '/santri/riwayat-peminjaman',
    sort_order: 12,
    category: 'sirkulasi',
    created_at: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'smenu-bookmark',
    menu_key: 'bookmark',
    menu_name: 'Buku Favorit / Bookmark',
    description: 'Koleksi simpanan buku pilihan yang ingin dibaca di kemudian waktu',
    is_enabled: false,
    icon: 'Bookmark',
    route: '/santri/bookmark',
    sort_order: 13,
    category: 'pengguna',
    created_at: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'smenu-notifications',
    menu_key: 'notifications',
    menu_name: 'Pusat Notifikasi & Alert',
    description: 'Pemberitahuan real-time terkait jatuh tempo buku dan persetujuan usulan',
    is_enabled: true,
    icon: 'Bell',
    route: '/santri/notifikasi',
    sort_order: 14,
    category: 'pengguna',
    created_at: '2026-08-01T00:00:00.000Z'
  }
];

export function getSantriMenusFromStorage(): SantriMenu[] {
  try {
    const raw = localStorage.getItem(SANTRI_MENU_STORAGE_KEY);
    if (!raw) return DEFAULT_SANTRI_MENUS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge with default to ensure any new keys exist
      const existingMap = new Map(parsed.map((item: SantriMenu) => [item.menu_key, item]));
      const merged = DEFAULT_SANTRI_MENUS.map(def => {
        const found = existingMap.get(def.menu_key);
        return found ? { ...def, ...found } : def;
      });
      // Also add custom added menus if any
      parsed.forEach((item: SantriMenu) => {
        if (!merged.some(m => m.menu_key === item.menu_key)) {
          merged.push(item);
        }
      });
      return merged.sort((a, b) => a.sort_order - b.sort_order);
    }
  } catch (err) {
    console.error('Error reading santri menus from localStorage:', err);
  }
  return DEFAULT_SANTRI_MENUS;
}

export function saveSantriMenusToStorage(menus: SantriMenu[]): void {
  try {
    localStorage.setItem(SANTRI_MENU_STORAGE_KEY, JSON.stringify(menus));
    // Dispatch custom event for reactive tabs/windows updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('santri_menus_updated', { detail: menus }));
    }
  } catch (err) {
    console.error('Error saving santri menus to localStorage:', err);
  }
}

export const santriMenusTableSql = `-- ============================================================
-- TABEL PENGATURAN MENU DASHBOARD SANTRI (santri_menus)
-- ============================================================
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

-- Index untuk performa pencarian menu
CREATE INDEX IF NOT EXISTS idx_santri_menus_key ON santri_menus(menu_key);
CREATE INDEX IF NOT EXISTS idx_santri_menus_enabled ON santri_menus(is_enabled);
CREATE INDEX IF NOT EXISTS idx_santri_menus_order ON santri_menus(sort_order);

-- Row Level Security (RLS)
ALTER TABLE santri_menus ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access for santri_menus" ON santri_menus;
CREATE POLICY "Allow full access for santri_menus" ON santri_menus FOR ALL USING (true) WITH CHECK (true);

-- Realtime Publication
DO $$
BEGIN
    PERFORM 1 FROM pg_publication WHERE pubname = 'supabase_realtime';
    IF FOUND THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE santri_menus;
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

ALTER TABLE santri_menus REPLICA IDENTITY FULL;

-- Initial Seed Data
INSERT INTO santri_menus (menu_key, menu_name, description, is_enabled, icon, route, sort_order, category)
VALUES
    ('overview', 'Dashboard / Beranda', 'Ringkasan aktivitas, status kartu RFID, dan alert sirkulasi santri', true, 'Home', '/santri/dashboard', 1, 'utama'),
    ('catalog', 'Katalog Buku & Kitab', 'Cari, filter, dan telusuri koleksi buku serta kitab kuning perpustakaan', true, 'BookOpen', '/santri/katalog', 2, 'utama'),
    ('loans', 'Peminjaman Saya', 'Daftar buku yang sedang dipinjam santri dan hitungan jatuh tempo', true, 'BookMarked', '/santri/peminjaman', 3, 'sirkulasi'),
    ('returns', 'Pengembalian Mandiri', 'Pengembalian buku dan konfirmasi pengembalian melalui scan barcode mandiri', false, 'Undo2', '/santri/pengembalian', 4, 'sirkulasi'),
    ('history', 'Riwayat Peminjaman', 'Catatan arsip seluruh buku dan kitab yang pernah selesai dipinjam', false, 'History', '/santri/riwayat-peminjaman', 5, 'sirkulasi'),
    ('card', 'Kartu Anggota Digital', 'Kartu tanda anggota virtual dengan kode QR dan identitas RFID santri', true, 'CreditCard', '/santri/kartu-digital', 6, 'utama'),
    ('visits', 'Riwayat Kunjungan', 'Rekap kehadiran tap RFID dan akumulasi jam baca di ruang perpustakaan', true, 'Clock', '/santri/kunjungan', 7, 'utama'),
    ('wishlist', 'Usulan Buku & Kitab', 'Formulir permohonan pengadaan kitab dan buku baru kepada ustadz/pustakawan', true, 'BookPlus', '/santri/usulan-buku', 8, 'literasi'),
    ('journal', 'Catatan Baca & Faedah', 'Jurnal rangkuman faedah ilmiah dan kutipan mutiara kitab yang dibaca', true, 'PenTool', '/santri/jurnal-baca', 9, 'literasi'),
    ('awards', 'Lencana & Penghargaan', 'Koleksi piagam digital kehormatan literasi, level XP, dan gelar prestasi', true, 'Trophy', '/santri/penghargaan', 10, 'literasi'),
    ('bookmark', 'Buku Favorit / Bookmark', 'Koleksi simpanan buku pilihan yang ingin dibaca di kemudian waktu', false, 'Bookmark', '/santri/bookmark', 11, 'pengguna'),
    ('notifications', 'Pusat Notifikasi & Alert', 'Pemberitahuan real-time terkait jatuh tempo buku dan persetujuan usulan', true, 'Bell', '/santri/notifikasi', 12, 'pengguna'),
    ('profile', 'Profil Santri', 'Data biodata santri, NIS, kelas/asrama, dan penggantian kata sandi', true, 'User', '/santri/profil', 13, 'pengguna')
ON CONFLICT (menu_key) DO UPDATE SET
    menu_name = EXCLUDED.menu_name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    route = EXCLUDED.route,
    sort_order = EXCLUDED.sort_order,
    category = EXCLUDED.category,
    updated_at = NOW();
`;
