import React, { useState } from 'react';
import { Download, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'sidebar' | 'banner';
  className?: string;
  label?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
  label,
}) => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = async () => {
    if (isInstallable) {
      const outcome = await promptInstall();
      if (outcome === 'accepted') {
        return;
      }
    }
    // If not direct installable or iOS or dismissed, open guidance modal with QR code
    setIsModalOpen(true);
  };

  if (isInstalled && variant !== 'sidebar') {
    return null;
  }

  return (
    <>
      {variant === 'compact' && (
        <button
          type="button"
          onClick={handleClick}
          id="btn-pwa-install-compact"
          title="Download & Pasang Aplikasi Perpustakaan"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer min-h-[36px] ${className}`}
        >
          <Download className="w-3.5 h-3.5 animate-pulse" />
          <span>{label || 'Download App'}</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <div className={`p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 ${className}`}>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              {isInstalled ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {isInstalled ? 'Aplikasi Terpasang' : 'Download Aplikasi'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {isInstalled ? 'PWA Standalone' : 'Akses Cepat di HP/PC'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClick}
            id="btn-pwa-install-sidebar"
            className="w-full py-2 px-3 text-[11px] font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isInstalled ? 'Panduan & Info PWA' : 'Pasang di Perangkat'}</span>
          </button>
        </div>
      )}

      {variant === 'full' && (
        <button
          type="button"
          onClick={handleClick}
          id="btn-pwa-install-full"
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer min-h-[40px] ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>{label || 'Download & Pasang Aplikasi'}</span>
        </button>
      )}

      {variant === 'banner' && (
        <div className={`p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight truncate">
                {label || 'Download Aplikasi Perpustakaan'}
              </p>
              <p className="text-[11px] text-emerald-100/90 leading-tight mt-0.5">
                Pasang di layar HP Anda, akses cepat & offline!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClick}
            id="btn-pwa-install-banner"
            className="px-3.5 py-2 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 text-xs font-bold shrink-0 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Pasang
          </button>
        </div>
      )}

      <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
