import { 
  Student, 
  BookLoan, 
  Book, 
  BookWishlist, 
  LiteracyAward, 
  LibraryVisit, 
  SantriNotification, 
  SantriNotificationCategory 
} from '../types';
import { calculateStudentProfile } from './gamificationUtils';

const STORAGE_KEY_READ = (studentId: string) => `santri_read_notifs_${studentId}`;
const STORAGE_KEY_DISMISSED = (studentId: string) => `santri_dismissed_toasts_${studentId}`;
const STORAGE_KEY_CUSTOM = (studentId: string) => `santri_custom_notifs_${studentId}`;

/**
 * Mendapatkan daftar ID notifikasi yang telah ditandai dibaca oleh santri
 */
export const getReadNotificationIds = (studentId: string): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_READ(studentId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
};

/**
 * Menandai satu notifikasi sebagai telah dibaca
 */
export const markSantriNotificationAsRead = (studentId: string, notifId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const set = getReadNotificationIds(studentId);
    set.add(notifId);
    localStorage.setItem(STORAGE_KEY_READ(studentId), JSON.stringify(Array.from(set)));
  } catch (err) {
    console.error('Failed to save read notification:', err);
  }
};

/**
 * Menandai seluruh notifikasi santri sebagai telah dibaca
 */
export const markAllSantriNotificationsAsRead = (studentId: string, notifIds: string[]): void => {
  if (typeof window === 'undefined') return;
  try {
    const set = getReadNotificationIds(studentId);
    notifIds.forEach(id => set.add(id));
    localStorage.setItem(STORAGE_KEY_READ(studentId), JSON.stringify(Array.from(set)));
  } catch (err) {
    console.error('Failed to mark all notifications read:', err);
  }
};

/**
 * Menandai toast notifikasi telah ditutup di sesi pengguna saat ini
 */
export const dismissSantriNotificationToast = (studentId: string, notifId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_DISMISSED(studentId));
    const set = new Set(raw ? JSON.parse(raw) : []);
    set.add(notifId);
    sessionStorage.setItem(STORAGE_KEY_DISMISSED(studentId), JSON.stringify(Array.from(set)));
  } catch {
    // Fail gracefully
  }
};

/**
 * Mengecek apakah toast notifikasi telah ditutup oleh santri
 */
export const isToastDismissed = (studentId: string, notifId: string): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_DISMISSED(studentId));
    if (!raw) return false;
    const set = new Set(JSON.parse(raw));
    return set.has(notifId);
  } catch {
    return false;
  }
};

/**
 * Membaca notifikasi kustom / simulasi yang disimpan lokal
 */
export const getCustomSantriNotifications = (studentId: string): SantriNotification[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM(studentId));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

/**
 * Menambahkan notifikasi kustom / simulasi pengujian secara real-time
 */
export const addCustomSantriNotification = (
  studentId: string,
  payload: Omit<SantriNotification, 'id' | 'timestamp' | 'read' | 'student_id'>
): SantriNotification => {
  const newNotif: SantriNotification = {
    id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    student_id: studentId,
    timestamp: new Date().toISOString(),
    read: false,
    ...payload
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = getCustomSantriNotifications(studentId);
      const updated = [newNotif, ...existing].slice(0, 30);
      localStorage.setItem(STORAGE_KEY_CUSTOM(studentId), JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save custom notification:', err);
    }
  }

  return newNotif;
};

/**
 * Membersihkan notifikasi kustom / simulasi
 */
export const clearAllCustomSantriNotifications = (studentId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_CUSTOM(studentId));
  } catch {
    // Graceful
  }
};

interface NotificationSourceParams {
  student: Student;
  loans: BookLoan[];
  books: Book[];
  wishlists: BookWishlist[];
  awards: LiteracyAward[];
  visits: LibraryVisit[];
}

/**
 * Generator utama notifikasi real-time santri:
 * 1. Usulan buku disetujui / tersedia / ditolak
 * 2. Peminjaman jatuh tempo / batas waktu hari ini / mendekati tempo
 * 3. Penghargaan piagam literasi baru atau lencana baru
 */
export const generateSantriNotifications = ({
  student,
  loans,
  books,
  wishlists,
  awards,
  visits
}: NotificationSourceParams): SantriNotification[] => {
  if (!student || !student.id) return [];

  const readSet = getReadNotificationIds(student.id);
  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];

  const notifications: SantriNotification[] = [];

  // =========================================================================
  // 1. ALERT USULAN BUKU (WISHLIST SANTRI)
  // =========================================================================
  const studentWishlists = wishlists.filter(
    w => w.student_id === student.id || (student.nis && w.student_nis === student.nis)
  );

  studentWishlists.forEach(w => {
    // Usulan Disetujui
    if (w.status === 'approved') {
      const notifId = `notif-wishlist-approved-${w.id}`;
      notifications.push({
        id: notifId,
        student_id: student.id,
        category: 'wishlist',
        title: 'Usulan Buku Disetujui! 📖',
        message: `Kabar baik! Usulan Anda "${w.title}" karya ${w.author || 'penulis'} telah disetujui oleh Ustadz/Pustakawan.`,
        detail: w.staff_notes 
          ? `Catatan Pustakawan: "${w.staff_notes}"` 
          : 'Usulan telah masuk ke daftar rencana belanja koleksi baru perpustakaan.',
        timestamp: w.updated_at || w.created_at || new Date().toISOString(),
        priority: 'high',
        read: readSet.has(notifId),
        actionTab: 'wishlist',
        actionLabel: 'Lihat Detail Usulan',
        metadata: {
          wishlistId: w.id,
          wishlistTitle: w.title,
          wishlistStatus: w.status
        }
      });
    }

    // Usulan Tersedia / Sudah Dibeli
    if (w.status === 'purchased' || w.status === 'available') {
      const notifId = `notif-wishlist-ready-${w.id}`;
      notifications.push({
        id: notifId,
        student_id: student.id,
        category: 'wishlist',
        title: 'Kitab Usulan Telah Tiba! 📚',
        message: `Alhamdulillah! Buku/Kitab "${w.title}" yang Anda usulkan kini telah tersedia di perpustakaan.`,
        detail: 'Silakan berkunjung ke perpustakaan untuk meminjam atau membaca kitab ini di tempat.',
        timestamp: w.updated_at || w.created_at || new Date().toISOString(),
        priority: 'celebration',
        read: readSet.has(notifId),
        actionTab: 'wishlist',
        actionLabel: 'Cek Status Koleksi',
        metadata: {
          wishlistId: w.id,
          wishlistTitle: w.title,
          wishlistStatus: w.status
        }
      });
    }

    // Usulan Ditolak (Informasi santun & catatan ust/ustadzah)
    if (w.status === 'rejected') {
      const notifId = `notif-wishlist-rejected-${w.id}`;
      notifications.push({
        id: notifId,
        student_id: student.id,
        category: 'wishlist',
        title: 'Pembaruan Usulan Buku',
        message: `Usulan buku "${w.title}" belum dapat disetujui untuk pengadaan saat ini.`,
        detail: w.staff_notes 
          ? `Alasan: "${w.staff_notes}"` 
          : 'Koleksi sejenis telah tersedia atau belum sesuai fokus kurikulum asrama.',
        timestamp: w.updated_at || w.created_at || new Date().toISOString(),
        priority: 'normal',
        read: readSet.has(notifId),
        actionTab: 'wishlist',
        actionLabel: 'Buka Usulan Saya',
        metadata: {
          wishlistId: w.id,
          wishlistTitle: w.title,
          wishlistStatus: w.status
        }
      });
    }
  });

  // =========================================================================
  // 2. ALERT JATUH TEMPO PEMINJAMAN (OVERDUE & DUE SOON)
  // =========================================================================
  const activeLoans = loans.filter(
    l => l.student_id === student.id && (l.status === 'borrowed' || l.status === 'overdue' || !l.return_date)
  );

  activeLoans.forEach(l => {
    const book = books.find(b => b.id === l.book_id);
    const bookTitle = book?.title || 'Kitab Perpustakaan';
    const dueDate = new Date(l.due_date);
    const dueDateStr = l.due_date ? l.due_date.split('T')[0] : '';
    
    // Perhitungan selisih hari
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // A. Sudah Terlambat (Overdue)
    if (diffDays < 0 || l.status === 'overdue') {
      const daysOverdue = Math.abs(diffDays) === 0 ? 1 : Math.abs(diffDays);
      const notifId = `notif-loan-overdue-${l.id}`;
      notifications.push({
        id: notifId,
        student_id: student.id,
        category: 'overdue',
        title: 'Peringatan: Peminjaman Terlambat! ⚠️',
        message: `Peminjaman "${bookTitle}" telah melewati batas waktu pengembalian.`,
        detail: `Batas tempo adalah ${dueDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} (${daysOverdue} hari terlambat). Segera kembalikan ke meja sirkulasi untuk menghindari sanksi penangguhan.`,
        timestamp: l.due_date,
        priority: 'urgent',
        read: readSet.has(notifId),
        actionTab: 'loans',
        actionLabel: 'Kembalikan / Cek Pinjaman',
        metadata: {
          loanId: l.id,
          bookTitle,
          dueDate: l.due_date,
          daysOverdue
        }
      });
    } 
    // B. Jatuh Tempo Hari Ini
    else if (diffDays === 0 || dueDateStr === todayDateStr) {
      const notifId = `notif-loan-due-today-${l.id}`;
      notifications.push({
        id: notifId,
        student_id: student.id,
        category: 'due_soon',
        title: 'Jatuh Tempo Hari Ini! ⏳',
        message: `Hari ini adalah batas akhir peminjaman kitab "${bookTitle}".`,
        detail: 'Mohon kembalikan ke perpustakaan sebelum jam tutup operasional sore ini.',
        timestamp: l.due_date,
        priority: 'high',
        read: readSet.has(notifId),
        actionTab: 'loans',
        actionLabel: 'Lihat Daftar Pinjaman',
        metadata: {
          loanId: l.id,
          bookTitle,
          dueDate: l.due_date,
          daysOverdue: 0
        }
      });
    } 
    // C. Mendekati Jatuh Tempo (H-1 s/d H-2)
    else if (diffDays > 0 && diffDays <= 2) {
      const notifId = `notif-loan-due-soon-${l.id}-${diffDays}`;
      notifications.push({
        id: notifId,
        student_id: student.id,
        category: 'due_soon',
        title: `Masa Pinjam Berakhir ${diffDays === 1 ? 'Besok' : '2 Hari Lagi'} 📅`,
        message: `Kitab "${bookTitle}" akan jatuh tempo pada ${dueDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}.`,
        detail: 'Pastikan kitab telah selesai dimuthola\'ah dan siap dikembalikan tepat waktu.',
        timestamp: l.borrow_date || new Date().toISOString(),
        priority: 'normal',
        read: readSet.has(notifId),
        actionTab: 'loans',
        actionLabel: 'Lihat Pinjaman Saya',
        metadata: {
          loanId: l.id,
          bookTitle,
          dueDate: l.due_date
        }
      });
    }
  });

  // =========================================================================
  // 3. ALERT PENGHARGAAN PIAGAM LITERASI BARU (AWARDS)
  // =========================================================================
  const studentAwards = awards.filter(
    a => a.student_id === student.id || (student.nis && a.student_nis === student.nis)
  );
  studentAwards.forEach(award => {
    const notifId = `notif-award-${award.id}`;
    notifications.push({
      id: notifId,
      student_id: student.id,
      category: 'award',
      title: 'Mabruk! Penghargaan Baru Diterima 🏆',
      message: `Selamat! Anda dianugerahi penghargaan "${award.title}" pada periode ${award.period}.`,
      detail: `Piagam No: ${award.certificate_no} • Hadiah/Apresiasi: ${award.reward_item || 'Sertifikat Kehormatan'}.`,
      timestamp: award.awarded_at || new Date().toISOString(),
      priority: 'celebration',
      read: readSet.has(notifId),
      actionTab: 'awards',
      actionLabel: 'Lihat Piagam & Penghargaan',
      metadata: {
        awardId: award.id,
        awardTitle: award.title,
        certificateNo: award.certificate_no,
        rewardItem: award.reward_item
      }
    });
  });

  // =========================================================================
  // 4. ALERT LENCANA LITERASI TERBUKA (BADGES)
  // =========================================================================
  try {
    const profile = calculateStudentProfile(student, visits, loans, books, awards);
    if (profile && profile.unlockedBadges && profile.unlockedBadges.length > 0) {
      profile.unlockedBadges.forEach(({ badge, unlockedAt }) => {
        const notifId = `notif-badge-${badge.code}`;
        notifications.push({
          id: notifId,
          student_id: student.id,
          category: 'badge',
          title: `Lencana Baru Terbuka: ${badge.title} 🎖️`,
          message: `Barakallah! Anda meraih lencana "${badge.title}" (+${badge.xpReward} XP).`,
          detail: badge.description,
          timestamp: unlockedAt || new Date().toISOString(),
          priority: 'celebration',
          read: readSet.has(notifId),
          actionTab: 'awards',
          actionLabel: 'Lihat Lencana & XP'
        });
      });
    }
  } catch (err) {
    console.error('Failed to calculate badges for notifications:', err);
  }

  // =========================================================================
  // 5. NOTIFIKASI KUSTOM / SIMULASI REAL-TIME
  // =========================================================================
  const customNotifs = getCustomSantriNotifications(student.id);
  customNotifs.forEach(cn => {
    notifications.push({
      ...cn,
      read: readSet.has(cn.id)
    });
  });

  // =========================================================================
  // SORTING: Priority (Urgent > Celebration > High > Normal) & Timestamp Desc
  // =========================================================================
  const priorityWeight: Record<string, number> = {
    urgent: 4,
    celebration: 3,
    high: 2,
    normal: 1
  };

  return notifications.sort((a, b) => {
    // Unread first
    if (!a.read && b.read) return -1;
    if (a.read && !b.read) return 1;

    // By priority
    const pA = priorityWeight[a.priority] || 1;
    const pB = priorityWeight[b.priority] || 1;
    if (pA !== pB) return pB - pA;

    // By date descending
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });
};
