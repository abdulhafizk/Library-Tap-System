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

const STORAGE_KEY_READ = (key: string) => `santri_read_notifs_${key}`;
const STORAGE_KEY_SEEN = (key: string) => `santri_seen_notifs_${key}`;
const STORAGE_KEY_DISMISSED = (key: string) => `santri_dismissed_toasts_${key}`;
const STORAGE_KEY_CUSTOM = (key: string) => `santri_custom_notifs_${key}`;

export interface SantriSeenNotificationRecord {
  id: string;
  seen_at: string;
}

/**
 * Mendapatkan seluruh kunci identifier unik yang valid untuk santri (ID, NIS)
 */
export const getStudentIdentifierKeys = (studentId: string, studentNis?: string): string[] => {
  const keys = new Set<string>();
  if (studentId && typeof studentId === 'string' && studentId.trim()) {
    keys.add(studentId.trim());
  }
  if (studentNis && typeof studentNis === 'string' && studentNis.trim()) {
    keys.add(studentNis.trim());
  }
  return Array.from(keys);
};

/**
 * Mendapatkan daftar ID notifikasi yang telah ditandai dibaca oleh santri
 */
export const getReadNotificationIds = (studentId: string, studentNis?: string): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  const keys = getStudentIdentifierKeys(studentId, studentNis);
  const combined = new Set<string>();

  for (const k of keys) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_READ(k));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(id => {
            if (id && typeof id === 'string') combined.add(id);
          });
        }
      }
    } catch {
      // ignore
    }
  }

  return combined;
};

/**
 * Mendapatkan kumpulan ID notifikasi yang telah berstatus 'seen' (telah dirender/dilihat di dashboard santri)
 */
export const getSeenNotificationIds = (studentId: string, studentNis?: string): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  const keys = getStudentIdentifierKeys(studentId, studentNis);
  const combined = new Set<string>();

  for (const k of keys) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SEEN(k));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(item => {
            if (typeof item === 'string') combined.add(item);
            else if (item && typeof item === 'object' && item.id) combined.add(item.id);
          });
        }
      }
    } catch {
      // ignore
    }
  }

  return combined;
};

/**
 * Mendapatkan record timestamp seen untuk notifikasi santri
 */
export const getSeenNotificationRecords = (studentId: string, studentNis?: string): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const keys = getStudentIdentifierKeys(studentId, studentNis);
  const result: Record<string, string> = {};

  for (const k of keys) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SEEN(k));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(item => {
            if (typeof item === 'string') {
              if (!result[item]) result[item] = new Date().toISOString();
            } else if (item && typeof item === 'object' && item.id) {
              result[item.id] = item.seen_at || new Date().toISOString();
            }
          });
        }
      }
    } catch {
      // ignore
    }
  }

  return result;
};

/**
 * Menandai satu atau beberapa notifikasi sebagai 'seen'
 * Terpicu sesaat setelah notifikasi dirender di dashboard santri
 */
export const markSantriNotificationsAsSeen = (
  studentId: string,
  notifIds: string[],
  studentNis?: string
): void => {
  if (typeof window === 'undefined' || !notifIds || notifIds.length === 0) return;
  const keys = getStudentIdentifierKeys(studentId, studentNis);
  const currentRecords = getSeenNotificationRecords(studentId, studentNis);
  const now = new Date().toISOString();

  let hasChanges = false;
  notifIds.forEach(id => {
    if (!id) return;
    if (!currentRecords[id]) {
      currentRecords[id] = now;
      hasChanges = true;
    }
    // Stabilisasi varian ID notifikasi pinjaman
    if (id.startsWith('notif-loan-due-soon-')) {
      const loanId = id.replace('notif-loan-due-soon-', '').replace(/-\d+$/, '');
      currentRecords[`notif-loan-due-soon-${loanId}`] = now;
      currentRecords[`notif-loan-${loanId}`] = now;
    } else if (id.startsWith('notif-loan-due-today-')) {
      const loanId = id.replace('notif-loan-due-today-', '');
      currentRecords[`notif-loan-due-today-${loanId}`] = now;
      currentRecords[`notif-loan-${loanId}`] = now;
    } else if (id.startsWith('notif-loan-overdue-')) {
      const loanId = id.replace('notif-loan-overdue-', '');
      currentRecords[`notif-loan-overdue-${loanId}`] = now;
      currentRecords[`notif-loan-${loanId}`] = now;
    }
  });

  if (!hasChanges) return;

  const recordsArray: SantriSeenNotificationRecord[] = Object.entries(currentRecords).map(([id, seen_at]) => ({
    id,
    seen_at
  }));
  const serialized = JSON.stringify(recordsArray);

  for (const k of keys) {
    try {
      localStorage.setItem(STORAGE_KEY_SEEN(k), serialized);
    } catch (err) {
      console.error('Failed to save seen notifications state:', err);
    }
  }
};

/**
 * Menandai satu notifikasi sebagai telah dibaca
 */
export const markSantriNotificationAsRead = (studentId: string, notifId: string, studentNis?: string): void => {
  if (typeof window === 'undefined' || !notifId) return;

  // Notifikasi yang dibaca otomatis berstatus 'seen'
  markSantriNotificationsAsSeen(studentId, [notifId], studentNis);

  const keys = getStudentIdentifierKeys(studentId, studentNis);
  const set = getReadNotificationIds(studentId, studentNis);
  set.add(notifId);

  // Jika ID notifikasi pinjaman, tandai juga varian ID lama (stabilisasi backward compatibility)
  if (notifId.startsWith('notif-loan-due-soon-')) {
    const loanId = notifId.replace('notif-loan-due-soon-', '').replace(/-\d+$/, '');
    set.add(`notif-loan-due-soon-${loanId}`);
    set.add(`notif-loan-due-soon-${loanId}-1`);
    set.add(`notif-loan-due-soon-${loanId}-2`);
    set.add(`notif-loan-${loanId}`);
  } else if (notifId.startsWith('notif-loan-due-today-')) {
    const loanId = notifId.replace('notif-loan-due-today-', '');
    set.add(`notif-loan-due-today-${loanId}`);
    set.add(`notif-loan-${loanId}`);
  } else if (notifId.startsWith('notif-loan-overdue-')) {
    const loanId = notifId.replace('notif-loan-overdue-', '');
    set.add(`notif-loan-overdue-${loanId}`);
    set.add(`notif-loan-${loanId}`);
  }

  const serialized = JSON.stringify(Array.from(set));

  // Sinkronkan ke seluruh kunci santri (ID dan NIS)
  for (const k of keys) {
    try {
      localStorage.setItem(STORAGE_KEY_READ(k), serialized);
    } catch (err) {
      console.error('Failed to save read notification:', err);
    }

    // Perbarui juga flag read di custom notifications jika cocok
    try {
      const rawCustom = localStorage.getItem(STORAGE_KEY_CUSTOM(k));
      if (rawCustom) {
        const parsedCustom: SantriNotification[] = JSON.parse(rawCustom);
        let modified = false;
        const updatedCustom = parsedCustom.map(c => {
          if (c.id === notifId || set.has(c.id)) {
            modified = true;
            return { ...c, read: true };
          }
          return c;
        });
        if (modified) {
          localStorage.setItem(STORAGE_KEY_CUSTOM(k), JSON.stringify(updatedCustom));
        }
      }
    } catch {
      // ignore
    }
  }
};

/**
 * Menandai seluruh notifikasi santri sebagai telah dibaca
 */
export const markAllSantriNotificationsAsRead = (studentId: string, notifIds: string[], studentNis?: string): void => {
  if (typeof window === 'undefined') return;

  // Notifikasi yang ditandai dibaca otomatis berstatus 'seen'
  markSantriNotificationsAsSeen(studentId, notifIds, studentNis);

  const keys = getStudentIdentifierKeys(studentId, studentNis);
  const set = getReadNotificationIds(studentId, studentNis);

  notifIds.forEach(id => {
    if (!id) return;
    set.add(id);
    if (id.startsWith('notif-loan-due-soon-')) {
      const loanId = id.replace('notif-loan-due-soon-', '').replace(/-\d+$/, '');
      set.add(`notif-loan-due-soon-${loanId}`);
      set.add(`notif-loan-due-soon-${loanId}-1`);
      set.add(`notif-loan-due-soon-${loanId}-2`);
      set.add(`notif-loan-${loanId}`);
    } else if (id.startsWith('notif-loan-due-today-')) {
      const loanId = id.replace('notif-loan-due-today-', '');
      set.add(`notif-loan-due-today-${loanId}`);
      set.add(`notif-loan-${loanId}`);
    } else if (id.startsWith('notif-loan-overdue-')) {
      const loanId = id.replace('notif-loan-overdue-', '');
      set.add(`notif-loan-overdue-${loanId}`);
      set.add(`notif-loan-${loanId}`);
    }
  });

  const serialized = JSON.stringify(Array.from(set));

  for (const k of keys) {
    try {
      localStorage.setItem(STORAGE_KEY_READ(k), serialized);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }

    try {
      const rawCustom = localStorage.getItem(STORAGE_KEY_CUSTOM(k));
      if (rawCustom) {
        const parsedCustom: SantriNotification[] = JSON.parse(rawCustom);
        const updatedCustom = parsedCustom.map(c => ({ ...c, read: true }));
        localStorage.setItem(STORAGE_KEY_CUSTOM(k), JSON.stringify(updatedCustom));
      }
    } catch {
      // ignore
    }
  }
};

/**
 * Menandai toast notifikasi telah ditutup di sesi pengguna (disimpan persisten di localStorage dan sessionStorage)
 */
export const dismissSantriNotificationToast = (studentId: string, notifId: string, studentNis?: string): void => {
  if (typeof window === 'undefined' || !notifId) return;
  const keys = getStudentIdentifierKeys(studentId, studentNis);

  for (const k of keys) {
    // Simpan ke localStorage agar tidak muncul lagi saat login berikutnya
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DISMISSED(k));
      const set = new Set(raw ? JSON.parse(raw) : []);
      set.add(notifId);
      if (notifId.startsWith('notif-loan-due-soon-')) {
        const loanId = notifId.replace('notif-loan-due-soon-', '').replace(/-\d+$/, '');
        set.add(`notif-loan-due-soon-${loanId}`);
        set.add(`notif-loan-due-soon-${loanId}-1`);
        set.add(`notif-loan-due-soon-${loanId}-2`);
      }
      localStorage.setItem(STORAGE_KEY_DISMISSED(k), JSON.stringify(Array.from(set)));
    } catch {
      // Fail gracefully
    }

    // Juga simpan ke sessionStorage
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_DISMISSED(k));
      const set = new Set(raw ? JSON.parse(raw) : []);
      set.add(notifId);
      sessionStorage.setItem(STORAGE_KEY_DISMISSED(k), JSON.stringify(Array.from(set)));
    } catch {
      // Fail gracefully
    }
  }
};

/**
 * Mengecek apakah toast notifikasi telah ditutup oleh santri
 */
export const isToastDismissed = (studentId: string, notifId: string, studentNis?: string): boolean => {
  if (typeof window === 'undefined' || !notifId) return false;
  const keys = getStudentIdentifierKeys(studentId, studentNis);

  for (const k of keys) {
    try {
      const localRaw = localStorage.getItem(STORAGE_KEY_DISMISSED(k));
      if (localRaw) {
        const set = new Set(JSON.parse(localRaw));
        if (set.has(notifId)) return true;
        if (notifId.startsWith('notif-loan-due-soon-')) {
          const loanId = notifId.replace('notif-loan-due-soon-', '').replace(/-\d+$/, '');
          if (
            set.has(`notif-loan-due-soon-${loanId}`) || 
            set.has(`notif-loan-due-soon-${loanId}-1`) || 
            set.has(`notif-loan-due-soon-${loanId}-2`)
          ) {
            return true;
          }
        }
      }
    } catch {
      // ignore
    }

    try {
      const sessionRaw = sessionStorage.getItem(STORAGE_KEY_DISMISSED(k));
      if (sessionRaw) {
        const set = new Set(JSON.parse(sessionRaw));
        if (set.has(notifId)) return true;
      }
    } catch {
      // ignore
    }
  }
  return false;
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
    seen: payload.seen ?? false,
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

  const readSet = getReadNotificationIds(student.id, student.nis);
  const seenSet = getSeenNotificationIds(student.id, student.nis);
  const seenRecords = getSeenNotificationRecords(student.id, student.nis);
  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];

  const getStatus = (id: string, fallbackKeys: string[] = []) => {
    const isRead = readSet.has(id) || fallbackKeys.some(k => readSet.has(k));
    const isSeen = isRead || seenSet.has(id) || fallbackKeys.some(k => seenSet.has(k));
    const matchedKey = fallbackKeys.find(k => seenRecords[k]);
    const seenAt = seenRecords[id] || (matchedKey ? seenRecords[matchedKey] : (isSeen ? new Date().toISOString() : undefined));
    return { isRead, isSeen, seenAt };
  };

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
      const { isRead, isSeen, seenAt } = getStatus(notifId);
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
        seen: isSeen,
        seen_at: seenAt,
        read: isRead,
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
      const { isRead, isSeen, seenAt } = getStatus(notifId);
      notifications.push({
        id: notifId,
        student_id: student.id,
        category: 'wishlist',
        title: 'Kitab Usulan Telah Tiba! 📚',
        message: `Alhamdulillah! Buku/Kitab "${w.title}" yang Anda usulkan kini telah tersedia di perpustakaan.`,
        detail: 'Silakan berkunjung ke perpustakaan untuk meminjam atau membaca kitab ini di tempat.',
        timestamp: w.updated_at || w.created_at || new Date().toISOString(),
        priority: 'celebration',
        seen: isSeen,
        seen_at: seenAt,
        read: isRead,
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
      const { isRead, isSeen, seenAt } = getStatus(notifId);
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
        seen: isSeen,
        seen_at: seenAt,
        read: isRead,
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
    l => (
      l.student_id === student.id || 
      (student.nis && ((l as { student_nis?: string }).student_nis === student.nis || (l as { nis?: string }).nis === student.nis))
    ) && (l.status === 'borrowed' || l.status === 'overdue' || !l.return_date)
  );

  activeLoans.forEach(l => {
    const book = books.find(b => b.id === l.book_id);
    const bookTitle = book?.title || 'Kitab Perpustakaan';
    const dueDate = new Date(l.due_date);
    const dueDateStr = l.due_date ? l.due_date.split('T')[0] : '';
    
    // Perhitungan selisih hari kalender secara akurat (midnight to midnight)
    let diffDays = 0;
    if (dueDateStr && dueDateStr.includes('-')) {
      const [dueY, dueM, dueD] = dueDateStr.split('-').map(Number);
      const targetMidnight = new Date(dueY, dueM - 1, dueD, 0, 0, 0).getTime();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
      diffDays = Math.round((targetMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
    } else {
      const diffTime = dueDate.getTime() - now.getTime();
      diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // A. Sudah Terlambat (Overdue)
    if (diffDays < 0 || l.status === 'overdue') {
      const daysOverdue = Math.max(1, Math.abs(diffDays));
      const notifId = `notif-loan-overdue-${l.id}`;
      const { isRead, isSeen, seenAt } = getStatus(notifId, [`notif-loan-${l.id}`]);

      notifications.push({
        id: notifId,
        student_id: student.id,
        category: 'overdue',
        title: 'Peringatan: Peminjaman Terlambat! ⚠️',
        message: `Peminjaman "${bookTitle}" telah melewati batas waktu pengembalian.`,
        detail: `Batas tempo adalah ${dueDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} (${daysOverdue} hari terlambat). Segera kembalikan ke meja sirkulasi untuk menghindari sanksi penangguhan.`,
        timestamp: l.due_date,
        priority: 'urgent',
        seen: isSeen,
        seen_at: seenAt,
        read: isRead,
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
      const { isRead, isSeen, seenAt } = getStatus(notifId, [`notif-loan-${l.id}`]);

      notifications.push({
        id: notifId,
        student_id: student.id,
        category: 'due_soon',
        title: 'Jatuh Tempo Hari Ini! ⏳',
        message: `Hari ini adalah batas akhir peminjaman kitab "${bookTitle}".`,
        detail: 'Mohon kembalikan ke perpustakaan sebelum jam tutup operasional sore ini.',
        timestamp: l.due_date,
        priority: 'high',
        seen: isSeen,
        seen_at: seenAt,
        read: isRead,
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
    // C. Mendekati Jatuh Tempo (H-1 s/d H-2) - Gunakan ID stabil tanpa embel-embel diffDays
    else if (diffDays > 0 && diffDays <= 2) {
      const notifId = `notif-loan-due-soon-${l.id}`;
      const { isRead, isSeen, seenAt } = getStatus(notifId, [
        `notif-loan-due-soon-${l.id}-1`,
        `notif-loan-due-soon-${l.id}-2`,
        `notif-loan-${l.id}`
      ]);

      notifications.push({
        id: notifId,
        student_id: student.id,
        category: 'due_soon',
        title: `Masa Pinjam Berakhir ${diffDays === 1 ? 'Besok' : '2 Hari Lagi'} 📅`,
        message: `Kitab "${bookTitle}" akan jatuh tempo pada ${dueDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}.`,
        detail: 'Pastikan kitab telah selesai dimuthola\'ah dan siap dikembalikan tepat waktu.',
        timestamp: l.borrow_date || new Date().toISOString(),
        priority: 'normal',
        seen: isSeen,
        seen_at: seenAt,
        read: isRead,
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
    const { isRead, isSeen, seenAt } = getStatus(notifId);

    notifications.push({
      id: notifId,
      student_id: student.id,
      category: 'award',
      title: 'Mabruk! Penghargaan Baru Diterima 🏆',
      message: `Selamat! Anda dianugerahi penghargaan "${award.title}" pada periode ${award.period}.`,
      detail: `Piagam No: ${award.certificate_no} • Hadiah/Apresiasi: ${award.reward_item || 'Sertifikat Kehormatan'}.`,
      timestamp: award.awarded_at || new Date().toISOString(),
      priority: 'celebration',
      seen: isSeen,
      seen_at: seenAt,
      read: isRead,
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
        const { isRead, isSeen, seenAt } = getStatus(notifId);

        notifications.push({
          id: notifId,
          student_id: student.id,
          category: 'badge',
          title: `Lencana Baru Terbuka: ${badge.title} 🎖️`,
          message: `Barakallah! Anda meraih lencana "${badge.title}" (+${badge.xpReward} XP).`,
          detail: badge.description,
          timestamp: unlockedAt || student.created_at || '2026-01-01T00:00:00.000Z',
          priority: 'celebration',
          seen: isSeen,
          seen_at: seenAt,
          read: isRead,
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
  if (student.nis && student.nis !== student.id) {
    const customNotifsNis = getCustomSantriNotifications(student.nis);
    customNotifsNis.forEach(cn => {
      if (!customNotifs.some(c => c.id === cn.id)) {
        customNotifs.push(cn);
      }
    });
  }

  customNotifs.forEach(cn => {
    const { isRead, isSeen, seenAt } = getStatus(cn.id);
    notifications.push({
      ...cn,
      seen: Boolean(cn.seen || isSeen),
      seen_at: cn.seen_at || seenAt,
      read: Boolean(cn.read || isRead)
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
