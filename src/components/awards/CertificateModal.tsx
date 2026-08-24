import React, { useState } from 'react';
import { 
  Trophy, 
  Award, 
  Sparkles, 
  Printer, 
  Share2, 
  X, 
  CheckCircle2, 
  Calendar, 
  User, 
  BookOpen, 
  Gift, 
  QrCode,
  Download,
  Flame,
  Star
} from 'lucide-react';
import { LiteracyAward, Student } from '../../types';
import { useLibrary } from '../../context/LibraryContext';

interface CertificateModalProps {
  award: LiteracyAward;
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  award,
  student,
  isOpen,
  onClose
}) => {
  const { settings, sendAwardWhatsAppCongrats } = useLibrary();
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [waSentSuccess, setWaSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWa = async () => {
    setIsSendingWa(true);
    try {
      await sendAwardWhatsAppCongrats(award.id);
      setWaSentSuccess(true);
      setTimeout(() => setWaSentSuccess(false), 4000);
    } catch {
      // handled in context
    } finally {
      setIsSendingWa(false);
    }
  };

  const formattedDate = new Date(award.awarded_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-amber-200 dark:border-amber-900/40 overflow-hidden flex flex-col my-auto print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 text-white print:hidden border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-lg">Pratinjau Piagam Penghargaan Literasi</h3>
            <span className="px-2.5 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {award.certificate_no}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWa}
              disabled={isSendingWa}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
              title="Kirim ucapan tahniah & piagam ke WhatsApp santri/wali"
            >
              <Share2 className="w-3.5 h-3.5" />
              {isSendingWa ? 'Mengirim...' : waSentSuccess ? 'Terkirim ✓' : 'Kirim WA'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors shadow-sm font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Piagam (A4)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body Container */}
        <div className="p-6 md:p-10 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 print:p-8 print:bg-white text-slate-800 dark:text-slate-100">
          
          {/* Ornate Frame Border */}
          <div className="relative border-4 border-double border-amber-600/60 dark:border-amber-500/50 p-6 md:p-8 rounded-xl bg-white dark:bg-slate-900/90 shadow-inner print:border-amber-700 print:bg-white">
            
            {/* Corner Decorative Ornaments */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-600 dark:border-amber-400"></div>
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-600 dark:border-amber-400"></div>
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-600 dark:border-amber-400"></div>
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-600 dark:border-amber-400"></div>

            {/* Header / Kop */}
            <div className="text-center space-y-1 mb-6">
              <div className="inline-flex items-center justify-center p-2 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 mb-2">
                <Trophy className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-xs tracking-widest font-semibold uppercase text-amber-800 dark:text-amber-300">
                {settings.institution_name}
              </p>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide text-slate-900 dark:text-white uppercase font-serif">
                {settings.library_name}
              </h1>
              <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-1"></div>
            </div>

            {/* Certificate Title */}
            <div className="text-center my-6 space-y-1">
              <span className="text-xs uppercase tracking-widest font-medium text-slate-500 dark:text-slate-400">
                Piagam Penghargaan Literasi Santri
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-amber-700 dark:text-amber-400 font-serif">
                {award.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nomor: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{award.certificate_no}</span> | Periode: <span className="font-semibold">{award.period}</span>
              </p>
            </div>

            {/* Award Recipient */}
            <div className="text-center space-y-2 my-6">
              <p className="text-sm italic text-slate-600 dark:text-slate-300">
                Dengan penuh rasa syukur dan bangga, piagam ini dianugerahkan kepada:
              </p>
              <div className="py-2">
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white font-serif border-b-2 border-dotted border-amber-400/80 inline-block px-8 pb-1">
                  {student.name}
                </h3>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                NIS: <span className="font-semibold">{student.nis}</span> &nbsp;|&nbsp; Kelas / Asrama: <span className="font-semibold">{student.class}</span>
              </p>
            </div>

            {/* Citation Statement */}
            <div className="max-w-xl mx-auto text-center my-5 bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
              <p className="text-xs md:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {award.notes || 'Atas dedikasi, kedisiplinan, dan keistiqomahan luar biasa dalam membaca, mengkaji kitab, serta memakmurkan perpustakaan pesantren.'}
              </p>
              {award.reward_item && (
                <div className="mt-2.5 pt-2 border-t border-amber-200/50 dark:border-amber-800/50 flex items-center justify-center gap-1.5 text-xs text-amber-900 dark:text-amber-200 font-medium">
                  <Gift className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Apresiasi: {award.reward_item}</span>
                </div>
              )}
            </div>

            {/* Signatures & Seal */}
            <div className="mt-8 pt-4 grid grid-cols-3 items-end text-center">
              
              {/* Head Librarian Signature */}
              <div className="space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">Kepala Perpustakaan</p>
                <div className="h-14 flex items-center justify-center">
                  <span className="font-serif italic text-base text-slate-400 dark:text-slate-500">[ Tanda Tangan Digital ]</span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 underline">Ustadz Abdullah Hafiz, M.Pd.</p>
                <p className="text-[10px] text-slate-400">NIP. 19850412 201101 1 004</p>
              </div>

              {/* Digital Seal / QR Badge */}
              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-600 dark:border-amber-400 flex flex-col items-center justify-center bg-amber-50 dark:bg-amber-950/40 p-1">
                  <QrCode className="w-8 h-8 text-amber-700 dark:text-amber-300" />
                  <span className="text-[8px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">Resmi</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Ditetapkan: {formattedDate}</p>
              </div>

              {/* Board / Pengasuh Pesantren */}
              <div className="space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">Pengasuh Pesantren</p>
                <div className="h-14 flex items-center justify-center">
                  <span className="font-serif italic text-base text-slate-400 dark:text-slate-500">[ Cap & Tanda Tangan ]</span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 underline">K.H. Ahmad Dahlan, Lc., M.A.</p>
                <p className="text-[10px] text-slate-400">Pengasuh Pondok Pesantren</p>
              </div>

            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Dokumen piagam terdaftar resmi dalam basis data sistem perpustakaan.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold shadow transition-colors"
            >
              <Printer className="w-4 h-4" />
              Cetak Piagam
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
