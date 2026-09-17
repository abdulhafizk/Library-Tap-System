import { 
  BookLoan, 
  Book, 
  BookWishlist, 
  Student, 
  RfidCard, 
  LibraryVisit, 
  LibrarySettings 
} from '../types';

export type AdminAlertCategory = 
  | 'overdue_loan'          // Peminjaman terlambat (overdue) / akumulasi denda
  | 'pending_wishlist'      // Usulan buku/kitab baru santri menunggu persetujuan
  | 'capacity_warning'      // Santri tap masuk / kapasitas ruang baca penuh (>90% atau 100%)
  | 'unregistered_rfid'     // Kartu RFID belum terdaftar di-tap
  | 'supabase_disconnected'; // Koneksi real-time Supabase terputus / offline

export type AdminAlertPriority = 'urgent' | 'warning' | 'info';

export interface AdminAlertNotification {
  id: string;
  category: AdminAlertCategory;
  title: string;
  message: string;
  detail?: string;
  priority: AdminAlertPriority;
  timestamp: string;
  read: boolean;
  actionTab?: 'circulation' | 'live' | 'cards' | 'tap' | 'settings' | 'students';
  actionLabel?: string;
  metadata?: {
    overdueCount?: number;
    totalFines?: number;
    loanIds?: string[];
    wishlistId?: string;
    wishlistTitle?: string;
    studentName?: string;
    studentNis?: string;
    cardUid?: string;
    currentOccupancy?: number;
    capacityLimit?: number;
    occupancyPercent?: number;
    connectionError?: string;
  };
}

const STORAGE_KEY_ADMIN_READ = 'admin_read_alerts';
const STORAGE_KEY_ADMIN_DISMISSED = 'admin_dismissed_alerts';

/**
 * Mengambil daftar ID alert yang telah ditandai telah dibaca oleh Admin/Staff
 */
export const getAdminReadAlertIds = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_READ);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
};

/**
 * Menandai satu alert admin sebagai telah dibaca
 */
export const markAdminAlertAsRead = (alertId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const set = getAdminReadAlertIds();
    set.add(alertId);
    localStorage.setItem(STORAGE_KEY_ADMIN_READ, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.error('Failed to save read admin alert:', err);
  }
};

/**
 * Menandai seluruh alert admin sebagai telah dibaca
 */
export const markAllAdminAlertsAsRead = (alertIds: string[]): void => {
  if (typeof window === 'undefined') return;
  try {
    const set = getAdminReadAlertIds();
    alertIds.forEach(id => set.add(id));
    localStorage.setItem(STORAGE_KEY_ADMIN_READ, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.error('Failed to mark all admin alerts read:', err);
  }
};

/**
 * Mengambil daftar ID alert toast yang telah di-close/dismiss oleh admin
 */
export const getAdminDismissedToastIds = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_DISMISSED);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
};

/**
 * Menutup/dismiss toast alert admin sementara
 */
export const dismissAdminToast = (alertId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const set = getAdminDismissedToastIds();
    set.add(alertId);
    localStorage.setItem(STORAGE_KEY_ADMIN_DISMISSED, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.error('Failed to dismiss admin toast:', err);
  }
};

/**
 * Generator Alert Real-time untuk Dashboard Admin & Staff
 * Mengevaluasi 4 skenario utama:
 * 1. Peminjaman Terlambat (Overdue) / Menumpuk Denda Hari Ini
 * 2. Usulan Buku / Kitab Baru dari Santri yang Menunggu Persetujuan
 * 3. Santri Baru yang Tap Masuk Presensi / Ruang Baca Perpustakaan Melebihi Kapasitas
 * 4. Koneksi Supabase Real-time Terputus / Ada Kartu RFID Santri Belum Terdaftar yang Di-tap
 */
export const generateAdminAlerts = (params: {
  loans: BookLoan[];
  books: Book[];
  students: Student[];
  wishlists: BookWishlist[];
  visits: LibraryVisit[];
  settings: LibrarySettings;
  isRealtimeConnected: boolean;
  isSupabaseConfigured: boolean;
  lastUnregisteredCardUid?: string | null;
  lastUnregisteredTimestamp?: string | null;
}): AdminAlertNotification[] => {
  const {
    loans,
    books,
    students,
    wishlists,
    visits,
    settings,
    isRealtimeConnected,
    isSupabaseConfigured,
    lastUnregisteredCardUid,
    lastUnregisteredTimestamp,
  } = params;

  const alerts: AdminAlertNotification[] = [];
  const readSet = getAdminReadAlertIds();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const studentMap = new Map<string, Student>(students.map(s => [s.id, s]));
  const bookMap = new Map<string, Book>(books.map(b => [b.id, b]));

  // =========================================================================
  // 1. ALERT: PEMINJAMAN TERLAMBAT (OVERDUE) / DENDA MENUMPUK HARI INI
  // =========================================================================
  const overdueLoans = loans.filter(l => {
    if (l.status === 'returned') return false;
    const due = new Date(l.due_date);
    due.setHours(0, 0, 0, 0);
    return due < today || l.status === 'overdue';
  });

  if (overdueLoans.length > 0) {
    let totalFines = 0;
    const defaultDailyFine = 1000; // Rp 1.000 / hari jika berlaku

    overdueLoans.forEach(l => {
      const due = new Date(l.due_date);
      due.setHours(0, 0, 0, 0);
      const diffTime = Math.max(0, today.getTime() - due.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const calcFine = l.fine_amount && l.fine_amount > 0 ? l.fine_amount : diffDays * defaultDailyFine;
      totalFines += calcFine;
    });

    const overdueAlertId = `admin-alert-overdue-${overdueLoans.length}-${today.toISOString().split('T')[0]}`;
    const topOverdueLoan = overdueLoans[0];
    const borrower = topOverdueLoan ? studentMap.get(topOverdueLoan.student_id) : null;
    const bookTitle = topOverdueLoan ? bookMap.get(topOverdueLoan.book_id)?.title || 'Kitab/Buku' : 'Kitab/Buku';

    alerts.push({
      id: overdueAlertId,
      category: 'overdue_loan',
      title: `${overdueLoans.length} Peminjaman Terlambat (Overdue)`,
      message: `Terdapat ${overdueLoans.length} peminjaman melewati batas waktu jatuh tempo dengan estimasi total denda Rp ${totalFines.toLocaleString('id-ID')}.`,
      detail: borrower 
        ? `Contoh: ${borrower.name} (${borrower.class}) meminjam "${bookTitle}". Harap kirim pengingat WhatsApp atau hubungi santri.` 
        : `Segera lakukan tindak lanjut melalui menu Sirkulasi.`,
      priority: 'urgent',
      timestamp: topOverdueLoan.due_date || new Date().toISOString(),
      read: readSet.has(overdueAlertId),
      actionTab: 'circulation',
      actionLabel: 'Kelola Peminjaman & Denda',
      metadata: {
        overdueCount: overdueLoans.length,
        totalFines,
        loanIds: overdueLoans.map(l => l.id),
      }
    });
  }

  // =========================================================================
  // 2. ALERT: USULAN BUKU / KITAB BARU DARI SANTRI MENUNGGU PERSETUJUAN
  // =========================================================================
  const pendingWishlists = wishlists.filter(w => w.status === 'pending');
  if (pendingWishlists.length > 0) {
    // Sort newest first
    const sortedPending = [...pendingWishlists].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const newest = sortedPending[0];
    const wishlistAlertId = `admin-alert-wishlist-${pendingWishlists.length}-${newest.id}`;

    alerts.push({
      id: wishlistAlertId,
      category: 'pending_wishlist',
      title: `${pendingWishlists.length} Usulan Kitab/Buku Baru Menunggu Review`,
      message: `Santri telah mengajukan usulan pengadaan buku baru ke perpustakaan.`,
      detail: `Terbaru dari ${newest.student_name} (${newest.student_class}): "${newest.title}" karangan ${newest.author}. Alasan: "${newest.reason.slice(0, 70)}${newest.reason.length > 70 ? '...' : ''}"`,
      priority: 'warning',
      timestamp: newest.created_at || new Date().toISOString(),
      read: readSet.has(wishlistAlertId),
      actionTab: 'circulation',
      actionLabel: 'Review & Setujui Usulan',
      metadata: {
        wishlistId: newest.id,
        wishlistTitle: newest.title,
        studentName: newest.student_name,
        studentNis: newest.student_nis,
      }
    });
  }

  // =========================================================================
  // 3. ALERT: KAPASITAS RUANG BACA MELEBIHI BATAS / PENUH (>90% ATAU >= 100%)
  // =========================================================================
  const activeInsideVisits = visits.filter(v => v.status === 'inside' && v.check_out === null);
  const currentOccupancy = activeInsideVisits.length;
  const capacityLimit = settings.capacity || 60;
  const occupancyPercent = Math.round((currentOccupancy / capacityLimit) * 100);

  if (occupancyPercent >= 90) {
    const isExceeded = currentOccupancy >= capacityLimit;
    const capacityAlertId = `admin-alert-capacity-${isExceeded ? 'exceeded' : 'warning'}-${currentOccupancy}`;

    alerts.push({
      id: capacityAlertId,
      category: 'capacity_warning',
      title: isExceeded 
        ? `⚠️ Peringatan: Kapasitas Perpustakaan Penuh (${currentOccupancy}/${capacityLimit})`
        : `Pengunjung Mendekati Kapasitas Maksimal (${occupancyPercent}%)`,
      message: isExceeded
        ? `Ruang baca telah terisi ${currentOccupancy} santri melebihi kapasitas rekomendasi (${capacityLimit} santri).`
        : `Saat ini terdapat ${currentOccupancy} santri aktif di ruang baca (${occupancyPercent}% dari total kapasitas ${capacityLimit}).`,
      detail: 'Pantau sirkulasi dan pastikan ketertiban ruang baca atau gunakan Kios Display TV untuk melihat daftar pengunjung aktif.',
      priority: isExceeded ? 'urgent' : 'warning',
      timestamp: new Date().toISOString(),
      read: readSet.has(capacityAlertId),
      actionTab: 'live',
      actionLabel: 'Lihat Ruang Baca Live',
      metadata: {
        currentOccupancy,
        capacityLimit,
        occupancyPercent,
      }
    });
  }

  // =========================================================================
  // 4. ALERT: KARTU RFID SANTRI BELUM TERDAFTAR DI-TAP DI SENSOR
  // =========================================================================
  if (lastUnregisteredCardUid) {
    const unregTime = lastUnregisteredTimestamp || new Date().toISOString();
    const unregAlertId = `admin-alert-unreg-card-${lastUnregisteredCardUid}`;

    alerts.push({
      id: unregAlertId,
      category: 'unregistered_rfid',
      title: `Kartu RFID Baru Terdeteksi (${lastUnregisteredCardUid})`,
      message: `Ada kartu/gelang RFID dengan UID ${lastUnregisteredCardUid} yang di-tap namun belum terdaftar atau belum dihubungkan ke santri.`,
      detail: `Klik tombol di bawah untuk mendaftarkan atau menghubungkan kartu fisik ini langsung ke data santri.`,
      priority: 'warning',
      timestamp: unregTime,
      read: readSet.has(unregAlertId),
      actionTab: 'cards',
      actionLabel: 'Daftarkan Kartu RFID',
      metadata: {
        cardUid: lastUnregisteredCardUid,
      }
    });
  }

  // =========================================================================
  // 5. ALERT: KONEKSI SUPABASE REAL-TIME TERPUTUS / OFFLINE
  // =========================================================================
  if (isSupabaseConfigured && !isRealtimeConnected) {
    const offlineAlertId = `admin-alert-supabase-offline`;

    alerts.push({
      id: offlineAlertId,
      category: 'supabase_disconnected',
      title: 'Koneksi Cloud Real-time Terputus',
      message: 'Sistem sedang berjalan dalam mode Offline/Lokal. Sinkronisasi data ke Supabase Cloud tertunda.',
      detail: 'Seluruh transaksi tap kartu, peminjaman, dan usulan tetap tersimpan aman di penyimpanan lokal dan akan disinkronkan otomatis saat koneksi pulih.',
      priority: 'urgent',
      timestamp: new Date().toISOString(),
      read: readSet.has(offlineAlertId),
      actionTab: 'settings',
      actionLabel: 'Cek Pengaturan Supabase',
      metadata: {
        connectionError: 'Real-time WebSocket disconnected',
      }
    });
  }

  // Sort: Unread first, then by priority (urgent > warning > info), then newest
  return alerts.sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    const priorityWeight = { urgent: 3, warning: 2, info: 1 };
    const pDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (pDiff !== 0) return pDiff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
};
