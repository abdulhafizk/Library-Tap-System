import React from 'react';
import { motion } from 'motion/react';
import { 
  Hammer, 
  Sparkles, 
  Construction, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  ShieldAlert,
  Info
} from 'lucide-react';
import { SantriMenu } from '../../types';

interface UnderDevelopmentOverlayProps {
  menu?: SantriMenu;
  menuName?: string;
  onBackToHome: () => void;
}

export const UnderDevelopmentOverlay: React.FC<UnderDevelopmentOverlayProps> = ({
  menu,
  menuName,
  onBackToHome
}) => {
  const title = menu?.menu_name || menuName || 'Fitur Menu';
  const description = menu?.description || 'Fitur ini sedang dalam tahap pengembangan dan penyempurnaan sistem perpustakaan.';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-3xl mx-auto my-8 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/90 border border-amber-500/30 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden text-center"
    >
      {/* Glow effect background */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Illustration Icon */}
      <div className="relative mx-auto mb-6 w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-yellow-500/10 to-transparent border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-950/50">
        <Construction className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 animate-pulse" />
        <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md">
          <Hammer className="w-4 h-4" />
        </div>
      </div>

      {/* Badge Status */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold mb-4">
        <Clock className="w-3.5 h-3.5" />
        <span>Sedang Dalam Pengembangan</span>
      </div>

      {/* Title & Heading */}
      <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
        Menu {title}
      </h2>

      {/* Description */}
      <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mb-6 leading-relaxed">
        {description}
      </p>

      {/* Info Callout Box */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 max-w-xl mx-auto mb-8 text-left space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Informasi Akses Menu Santri:</span>
        </div>
        <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-5 leading-normal">
          <li>Menu ini saat ini dinonaktifkan oleh Administrator Perpustakaan.</li>
          <li>Fitur akan segera aktif secara otomatis setelah rilis pembaruan selesai.</li>
          <li>Seluruh riwayat akun, peminjaman aktif, dan data presensi RFID Anda tetap aman.</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onBackToHome}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda Santri</span>
        </button>
      </div>
    </motion.div>
  );
};
