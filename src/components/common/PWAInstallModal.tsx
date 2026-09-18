import React, { useEffect, useState } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  Laptop, 
  Apple, 
  CheckCircle2, 
  Share2, 
  PlusSquare, 
  Sparkles, 
  QrCode, 
  Database,
  ExternalLink,
  ShieldCheck, 
  Wifi,
  AlertCircle,
  Bell
} from 'lucide-react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, openInNewTab, promptInstall } = usePWAInstall();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isIOS) {
      setActiveTab('ios');
    } else {
      const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
      setActiveTab(isMobile ? 'android' : 'desktop');
    }
  }, [isIOS]);

  useEffect(() => {
    if (isOpen) {
      // Generate QR Code of current URL
      const currentUrl = window.location.href;
      QRCode.toDataURL(currentUrl, {
        width: 200,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }).then(url => {
        setQrDataUrl(url);
      }).catch(err => {
        console.error('Failed to generate QR code', err);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    const res = await promptInstall();
    if (res === 'accepted') {
      setInstallStatus('Aplikasi berhasil dipasang di perangkat Anda!');
      setTimeout(() => {
        onClose();
      }, 1800);
    } else if (res === 'dismissed') {
      setInstallStatus('Pemasangan dibatalkan oleh pengguna.');
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm cursor-pointer animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] cursor-default"
      >
        {/* Header with Emerald Gradient */}
        <div className="relative px-5 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 text-white flex items-center justify-between overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Download className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">Download Aplikasi Perpustakaan</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 flex items-center gap-1">
                  <Database className="w-3 h-3 text-emerald-300" />
                  Online Cloud Database
                </span>
              </div>
              <p className="text-xs text-emerald-100/90">Pasang di HP Android, iPhone, Tablet, atau Laptop/PC — Terhubung Langsung ke Cloud Supabase</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer relative z-10"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-700 dark:text-slate-300">
          
          {/* Live Cloud Database Banner */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 dark:from-emerald-950/40 dark:to-slate-900/60 rounded-2xl border border-emerald-500/20 flex items-start gap-3 text-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Database className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>100% Online & Terkoneksi Real-Time dengan Database Supabase</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Sync
                </span>
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Aplikasi yang Anda unduh <strong>tidak berjalan secara offline statis</strong>. Seluruh data buku, presensi santri, sirkulasi peminjaman, usulan buku, dan denda langsung tersimpan dan tersinkronisasi online ke cloud database Supabase PostgreSQL.
              </p>
            </div>
          </div>

          {/* Iframe Warning & Fix for "This app cannot be installed" */}
          {isInIframe && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-amber-950 dark:text-amber-200 space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-amber-900 dark:text-amber-100">
                    Kenapa Muncul "This app cannot be installed" di Menu Browser?
                  </p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    Browser Google Chrome & Edge <strong>memblokir pemasangan aplikasi jika dibuka di dalam jendela pratinjau editor (iFrame)</strong> karena alasan keamanan web. 
                  </p>
                  <p className="text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                    Solusi Cepat: Buka aplikasi di <span className="underline">Tab Baru</span> di bawah ini. Tombol install di browser akan langsung aktif!
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-pwa-open-new-tab"
                onClick={openInNewTab}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka di Tab Baru Sekarang (Untuk Menginstal)</span>
              </button>
            </div>
          )}

          {/* Status Message if installed */}
          {isInstalled && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Aplikasi Sudah Terpasang!</p>
                <p className="text-[11px] opacity-90">Aplikasi berjalan mandiri di perangkat Anda dan tetap terhubung online ke cloud database.</p>
              </div>
            </div>
          )}

          {installStatus && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{installStatus}</span>
            </div>
          )}

          {/* Quick 1-Click Install Button (Chrome / Android / Desktop if prompt available) */}
          {isInstallable && !isInstalled && (
            <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-900/5 dark:from-emerald-900/30 dark:to-slate-900/50 rounded-2xl border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left w-full sm:w-auto">
                <p className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Pemasangan Instan 1-Klik
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Browser Anda siap memasang aplikasi ke layar utama secara langsung.
                </p>
              </div>
              <button
                type="button"
                onClick={handleNativeInstall}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95 min-h-[42px]"
              >
                <Download className="w-4 h-4" />
                <span>Pasang Sekarang</span>
              </button>
            </div>
          )}

          {/* Device Tabs */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/70 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android / Chrome</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              <span>iPhone / iPad</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('desktop')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'desktop'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Laptop / PC</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-3">
            {activeTab === 'android' && (
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Panduan Pasang di HP Android (Chrome / Edge / Samsung)
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-900 dark:text-white">Buka di Tab Baru / Browser Asli (Bukan iFrame)</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">Pastikan membuka URL aplikasi langsung di browser Chrome HP, bukan di dalam frame pratinjau.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-900 dark:text-white">Buka menu titik tiga (⋮) &gt; "Install Aplikasi"</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">Pilih <strong>"Install aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-900 dark:text-white">Aplikasi langsung siap dibuka & Terhubung Online ke Supabase</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">Ikon <strong>LibraryTap</strong> muncul di beranda HP dan otomatis sinkron dengan database cloud.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ios' && (
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Panduan Pasang di iPhone / iPad (Safari)
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        Tekan tombol Bagikan <Share2 className="w-3.5 h-3.5 text-blue-600" /> (Share)
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">Di bilah bawah browser Safari pada iPhone Anda.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        Geser ke bawah lalu pilih "Tambah ke Layar Utama" <PlusSquare className="w-3.5 h-3.5 text-blue-600" />
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">(Add to Home Screen) dengan ikon kotak bertanda plus.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-900 dark:text-white">Tekan "Tambah" (Add) di pojok kanan atas</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">Aplikasi resmi terpasang seperti aplikasi App Store di layar iPhone Anda dengan koneksi online penuh.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'desktop' && (
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Panduan Pasang di Komputer / Laptop (Windows, Mac, Linux)
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-900 dark:text-white">Buka di Tab Baru (Bukan di Frame Editor)</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">Buka tautan aplikasi langsung di Chrome atau Edge pada tab baru.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-900 dark:text-white">Klik Ikon Pasang di Bilah Alamat (Address Bar)</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">Di sebelah kanan URL akan muncul ikon monitor dengan tanda panah ke bawah, atau menu titik tiga &gt; <strong>"Install Library Tap System"</strong>.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* QR Code section to open and install on Mobile */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
              {qrDataUrl ? (
                <div className="p-2 bg-white rounded-xl shadow-xs shrink-0 border border-slate-200 dark:border-slate-700">
                  <img src={qrDataUrl} alt="QR Code Link Aplikasi" className="w-24 h-24 sm:w-28 sm:h-28" />
                </div>
              ) : (
                <div className="w-24 h-24 bg-slate-200 rounded-xl flex items-center justify-center shrink-0">
                  <QrCode className="w-8 h-8 text-slate-400" />
                </div>
              )}
              <div className="space-y-1 text-center sm:text-left">
                <p className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  Buka & Download Lewat HP
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Arahkan kamera smartphone Anda ke QR code ini untuk langsung membuka URL aplikasi di tab browser mandiri HP Anda, lalu pasang ke layar utama.
                </p>
                <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    <Database className="w-3 h-3" /> Supabase Cloud Database
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                    <Wifi className="w-3 h-3" /> Online Real-Time Sync
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    <ShieldCheck className="w-3 h-3" /> Antrean Darurat Failover
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                    <Bell className="w-3 h-3" /> Web Push API Real-Time
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            Versi PWA v2.8.5 • Cloud Database PostgreSQL Online
          </p>
          <div className="flex items-center gap-2">
            {isInIframe && (
              <button
                type="button"
                onClick={openInNewTab}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Tab Baru</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer min-h-[38px]"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
