import React, { useEffect, useState } from 'react';
import { Bell, BellOff, CheckCircle2, Smartphone, ShieldCheck, Sparkles } from 'lucide-react';
import { webPushManager, WebNotificationPermissionState } from '../../utils/webPushManager';

interface SantriWebPushPromptProps {
  studentName?: string;
  onPermissionChange?: (permission: WebNotificationPermissionState) => void;
  className?: string;
}

export const SantriWebPushPrompt: React.FC<SantriWebPushPromptProps> = ({
  studentName = 'Santri',
  onPermissionChange,
  className = '',
}) => {
  const [permission, setPermission] = useState<WebNotificationPermissionState>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showDismissedBanner, setShowDismissedBanner] = useState(false);

  useEffect(() => {
    const supported = webPushManager.checkSupport();
    setIsSupported(supported);
    if (supported) {
      const current = webPushManager.getPermission();
      setPermission(current);
    }
  }, []);

  const handleEnablePush = async () => {
    setIsRequesting(true);
    try {
      const result = await webPushManager.requestPermission();
      setPermission(result);
      if (onPermissionChange) {
        onPermissionChange(result);
      }

      if (result === 'granted') {
        // Kirimkan notifikasi selamat datang / test langsung ke perangkat pengguna
        await webPushManager.showNotification({
          title: '🔔 Notifikasi Perangkat Diaktifkan!',
          body: `Ahlan wa Sahlan, ${studentName}! Anda akan menerima notifikasi langsung di perangkat saat ada pembaruan buku atau piagam baru.`,
          tag: 'welcome-web-push',
          data: { tab: 'overview' },
          vibrate: [100, 50, 100],
        });
      }
    } catch (err) {
      console.warn('Request push error:', err);
    } finally {
      setIsRequesting(false);
    }
  };

  if (!isSupported) return null;

  // Jika sudah diizinkan (granted)
  if (permission === 'granted') {
    return (
      <div className={`p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
              <span>Notifikasi Perangkat Aktif</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </p>
            <p className="text-[11px] text-slate-400">
              Pembaruan status buku, jatuh tempo, dan piagam literasi langsung muncul di HP/Laptop Anda.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            await webPushManager.showNotification({
              title: '🔔 Uji Notifikasi Web Push',
              body: 'Sistem notifikasi real-time perangkat Anda berfungsi dengan baik!',
              tag: 'test-push',
            });
          }}
          className="px-2.5 py-1.5 rounded-lg bg-emerald-800/50 hover:bg-emerald-700/60 text-emerald-200 text-[11px] font-medium transition-colors shrink-0 cursor-pointer border border-emerald-600/30 active:scale-95"
          title="Kirim tes notifikasi ke perangkat Anda"
        >
          Tes Bunyi
        </button>
      </div>
    );
  }

  // Jika diblokir oleh user di browser
  if (permission === 'denied') {
    return (
      <div className={`p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-slate-400 ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <BellOff className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300">Izin Notifikasi Diblokir di Browser</p>
            <p className="text-[10px] text-slate-500">
              Klik ikon gembok / perisai di bilah alamat browser Anda untuk mengaktifkan izin notifikasi.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Jika status default (belum diminta izin)
  if (showDismissedBanner) return null;

  return (
    <div className={`p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-teal-950/60 border border-emerald-500/40 shadow-lg shadow-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}>
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
          <Bell className="w-4 h-4 animate-bounce" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
            <span>Aktifkan Notifikasi Web Push Perangkat</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
              Resmi
            </span>
          </h4>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
            Dapatkan peringatan jatuh tempo buku, konfirmasi usulan kitab baru, dan piagam santri langsung di layar HP/Laptop.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
        <button
          type="button"
          onClick={() => setShowDismissedBanner(true)}
          className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
        >
          Nanti Saja
        </button>
        <button
          type="button"
          disabled={isRequesting}
          onClick={handleEnablePush}
          className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-900/40 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-60"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isRequesting ? 'Meminta Izin...' : 'Aktifkan Sekarang'}</span>
        </button>
      </div>
    </div>
  );
};
