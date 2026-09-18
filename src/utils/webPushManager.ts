/**
 * Web Push API & Notification Manager
 * Menangani izin notifikasi sistem browser (Notification API & ServiceWorkerRegistration.showNotification),
 * serta pengiriman notifikasi instan langsung ke perangkat santri (Android, Windows, macOS, iOS PWA).
 */

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  vibrate?: number[];
  renotify?: boolean;
  requireInteraction?: boolean;
}

export type WebNotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

class WebPushNotificationManager {
  private hasCheckedSupport: boolean = false;
  private isSupported: boolean = false;

  constructor() {
    this.checkSupport();
  }

  /**
   * Mengecek apakah browser mendukung Notification API & ServiceWorker
   */
  public checkSupport(): boolean {
    if (typeof window === 'undefined') return false;
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.hasCheckedSupport = true;
    return this.isSupported;
  }

  /**
   * Mendapatkan status izin notifikasi saat ini
   */
  public getPermission(): WebNotificationPermissionState {
    if (!this.checkSupport()) return 'unsupported';
    return Notification.permission as WebNotificationPermissionState;
  }

  /**
   * Meminta izin notifikasi kepada pengguna santri
   */
  public async requestPermission(): Promise<WebNotificationPermissionState> {
    if (!this.checkSupport()) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      // Simpan status preferensi ke localStorage
      localStorage.setItem('santri_web_push_permission', permission);
      return permission as WebNotificationPermissionState;
    } catch (err) {
      console.warn('[WebPush] Gagal meminta izin notifikasi browser:', err);
      return Notification.permission as WebNotificationPermissionState;
    }
  }

  /**
   * Mengirimkan notifikasi sistem asli ke perangkat (Notification API / Service Worker)
   */
  public async showNotification(payload: PushNotificationPayload): Promise<boolean> {
    if (!this.checkSupport()) {
      return false;
    }

    // Jika belum granted, jangan paksa tampilkan
    if (Notification.permission !== 'granted') {
      return false;
    }

    const defaultIcon = '/pwa-192x192.png';
    const defaultBadge = '/pwa-192x192.png';

    const notificationOptions: NotificationOptions & { vibrate?: number[]; renotify?: boolean } = {
      body: payload.body,
      icon: payload.icon || defaultIcon,
      badge: payload.badge || defaultBadge,
      tag: payload.tag || `santri-notif-${Date.now()}`,
      data: payload.data || { url: window.location.origin },
      vibrate: payload.vibrate || [100, 50, 100],
      renotify: payload.renotify ?? true,
      requireInteraction: payload.requireInteraction ?? false,
    };

    try {
      // 1. Prioritaskan Service Worker Registration jika aktif (Standar PWA Android & iOS Web Push)
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.showNotification) {
          await registration.showNotification(payload.title, notificationOptions);
          return true;
        }
      }

      // 2. Fallback ke Notification API window biasa jika Service Worker belum siap
      const notif = new Notification(payload.title, notificationOptions);
      notif.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (payload.data?.tab) {
          window.dispatchEvent(new CustomEvent('santri_navigate_tab', { detail: payload.data.tab }));
        }
        notif.close();
      };
      return true;
    } catch (err) {
      console.warn('[WebPush] Gagal memicu showNotification:', err);
      return false;
    }
  }

  /**
   * Helper pengiriman notifikasi instan pembaruan status buku / sirkulasi
   */
  public async notifyLoanStatus(bookTitle: string, status: 'borrowed' | 'returned' | 'overdue' | 'due_today' | 'due_soon', extra?: string): Promise<boolean> {
    let title = 'Pembaruan Sirkulasi Buku 📚';
    let body = `Status buku "${bookTitle}" telah diperbarui.`;
    let tag = `loan-${Date.now()}`;

    if (status === 'overdue') {
      title = '⚠️ Peringatan: Buku Terlambat Dikembalikan!';
      body = `Buku "${bookTitle}" telah melewati batas waktu peminjaman. Segera kembalikan ke perpustakaan.`;
    } else if (status === 'due_today') {
      title = '⏳ Jatuh Tempo Hari Ini!';
      body = `Hari ini adalah batas waktu pengembalian buku "${bookTitle}".`;
    } else if (status === 'due_soon') {
      title = '📅 Pengingat Jatuh Tempo Buku';
      body = `Masa pinjam buku "${bookTitle}" akan segera berakhir (${extra || 'segera'}).`;
    } else if (status === 'returned') {
      title = '✅ Buku Berhasil Dikembalikan';
      body = `Alhamdulillah, buku "${bookTitle}" telah tercatat kembali di meja sirkulasi.`;
    } else if (status === 'borrowed') {
      title = '📖 Peminjaman Buku Berhasil';
      body = `Anda meminjam "${bookTitle}". Selamat membaca dan jaga kitab dengan baik!`;
    }

    return this.showNotification({
      title,
      body,
      tag,
      data: { tab: 'loans' },
      vibrate: status === 'overdue' ? [200, 100, 200, 100, 300] : [100, 50, 100],
    });
  }

  /**
   * Helper pengiriman notifikasi piagam penghargaan / lencana literasi baru
   */
  public async notifyAwardReceived(awardTitle: string, period: string, certificateNo?: string): Promise<boolean> {
    return this.showNotification({
      title: '🏆 Mabruk! Piagam Penghargaan Baru Diterima!',
      body: `Selamat! Anda dianugerahi "${awardTitle}" periode ${period}${certificateNo ? ` (No. Piagam: ${certificateNo})` : ''}. Buka Portal Santri untuk melihat piagam!`,
      tag: `award-${certificateNo || Date.now()}`,
      data: { tab: 'awards' },
      vibrate: [150, 80, 150, 80, 250],
      requireInteraction: true,
    });
  }

  /**
   * Helper pengiriman notifikasi status usulan buku (Wishlist)
   */
  public async notifyWishlistStatus(bookTitle: string, status: 'approved' | 'available' | 'rejected', notes?: string): Promise<boolean> {
    let title = 'Pembaruan Usulan Buku 📖';
    let body = `Usulan buku "${bookTitle}" diperbarui.`;

    if (status === 'approved') {
      title = '🎉 Usulan Buku Disetujui Pustakawan!';
      body = `Alhamdulillah! Usulan "${bookTitle}" telah disetujui untuk pengadaan koleksi perpustakaan.`;
    } else if (status === 'available') {
      title = '📚 Kitab Usulan Anda Telah Tersedia!';
      body = `Kitab "${bookTitle}" kini sudah tiba dan siap dipinjam di perpustakaan.`;
    } else if (status === 'rejected') {
      title = 'Informasi Usulan Buku';
      body = `Usulan "${bookTitle}" belum dapat dipenuhi saat ini${notes ? `: "${notes}"` : '.'}`;
    }

    return this.showNotification({
      title,
      body,
      tag: `wishlist-${Date.now()}`,
      data: { tab: 'wishlist' },
      vibrate: [100, 50, 100],
    });
  }
}

export const webPushManager = new WebPushNotificationManager();
