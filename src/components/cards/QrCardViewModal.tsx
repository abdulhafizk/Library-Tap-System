import React, { useState, useEffect } from 'react';
import {
  QrCode,
  X,
  Printer,
  Download,
  Copy,
  Check,
  CreditCard,
  User,
  ShieldCheck,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Student, RfidCard } from '../../types';
import { useLibrary } from '../../context/LibraryContext';
import { generateQrDataUrl } from '../../utils/qrUtils';

interface QrCardViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  card?: RfidCard | null;
  onTestTap?: (uid: string) => void;
}

export const QrCardViewModal: React.FC<QrCardViewModalProps> = ({
  isOpen,
  onClose,
  student,
  card,
  onTestTap
}) => {
  const { settings } = useLibrary();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');

  const cardUid = student?.rfid_uid || card?.uid || (student ? `QR-${student.nis}` : 'QR-LIB-UNKNOWN');

  useEffect(() => {
    if (isOpen && cardUid) {
      generateQrDataUrl(cardUid, {
        width: 320,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
        errorCorrectionLevel: 'H'
      }).then(url => {
        setQrDataUrl(url);
      });
    }
  }, [isOpen, cardUid]);

  if (!isOpen) return null;

  const handleCopyUid = () => {
    navigator.clipboard.writeText(cardUid).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR-${student ? student.name.replace(/\s+/g, '_') : cardUid}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 my-auto max-h-[95vh] flex flex-col cursor-default"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Kartu & QR Code Digital
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {student ? `Kartu Santri: ${student.name}` : `Kartu Cadangan Perpustakaan (${cardUid})`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          
          {/* Card Front / Back Toggle */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCardSide('front')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                cardSide === 'front'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Tampak Depan (Identitas & QR)
            </button>
            <button
              onClick={() => setCardSide('back')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                cardSide === 'back'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Tampak Belakang (Tata Tertib)
            </button>
          </div>

          {/* PHYSICAL CARD PREVIEW */}
          {cardSide === 'front' ? (
            <div 
              className="w-full max-w-md mx-auto bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-xl border border-blue-800/60 relative overflow-hidden select-none"
              style={{ aspectRatio: '1.586 / 1' }}
            >
              {/* Background glows */}
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-blue-500/20 blur-xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-indigo-500/20 blur-xl pointer-events-none" />
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-400 via-emerald-400 to-indigo-400 opacity-80" />

              {/* Card Header */}
              <div className="relative z-10 flex items-center justify-between pb-2 border-b border-white/15 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-blue-300">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[11px] uppercase leading-none text-white">
                      {settings.institution_name || 'PERPUSTAKAAN PESANTREN'}
                    </h4>
                    <p className="text-[8px] text-blue-200 font-medium mt-0.5">
                      {settings.library_name || 'Kartu Anggota Perpustakaan'}
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/40 text-[8px] font-mono font-bold text-blue-200">
                  {student ? 'SANTRI' : 'CADANGAN'}
                </span>
              </div>

              {/* Card Body */}
              <div className="relative z-10 flex items-center justify-between gap-3 h-[calc(100%-3.6rem)]">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {student ? (
                    student.photo_url && student.photo_url.trim() !== '' ? (
                      <img
                        src={student.photo_url}
                        alt={student.name}
                        className="w-14 h-18 rounded-xl object-cover border-2 border-white/30 shadow-md bg-slate-800 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-18 rounded-xl bg-white/10 border-2 border-white/20 flex flex-col items-center justify-center text-center p-1 shrink-0 text-blue-200">
                        <User className="w-8 h-8 text-white/80" />
                        <span className="text-[7px] font-bold text-blue-200 uppercase mt-0.5">SANTRI</span>
                      </div>
                    )
                  ) : (
                    <div className="w-14 h-18 rounded-xl bg-white/10 border-2 border-white/20 flex flex-col items-center justify-center text-center p-1 shrink-0">
                      <CreditCard className="w-5 h-5 text-emerald-400 mb-1" />
                      <span className="text-[7px] font-bold text-slate-300 uppercase">CADANGAN</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-0.5">
                    {student ? (
                      <>
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate leading-tight">
                          {student.name}
                        </h4>
                        <p className="text-[9px] text-blue-200 font-mono">
                          NIS: {student.nis} • Kelas {student.class}
                        </p>
                        <p className="text-[8px] text-slate-300">
                          {student.gender === 'L' ? 'Santri Putra' : 'Santri Putri'}
                        </p>
                      </>
                    ) : (
                      <>
                        <h4 className="font-bold text-xs text-white leading-tight">
                          KARTU ANGGOTA PERPUSTAKAAN
                        </h4>
                        <p className="text-[9px] text-emerald-300">
                          {card?.note || 'Kartu Cadangan Siap Pakai'}
                        </p>
                      </>
                    )}

                    <div className="pt-1">
                      <span className="text-[8px] font-mono text-blue-300 tracking-wider block">
                        UID: {cardUid}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-1 rounded-xl bg-white shadow-lg border border-white/40 shrink-0">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 flex items-center justify-center">
                      <QrCode className="w-6 h-6 animate-pulse text-slate-400" />
                    </div>
                  )}
                  <span className="text-[7px] font-mono font-bold text-slate-700 mt-0.5">
                    SCAN TERMINAL
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="absolute bottom-1 left-4 right-4 flex items-center justify-between text-[7px] text-blue-300/70 font-mono">
                <span>DIGITAL LIBRARY ATTENDANCE</span>
                <span>STATUS: AKTIF</span>
              </div>
            </div>
          ) : (
            /* BACK OF CARD: Terms & Rules */
            <div 
              className="w-full max-w-md mx-auto bg-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-xl border border-slate-700 relative overflow-hidden select-none"
              style={{ aspectRatio: '1.586 / 1' }}
            >
              <h4 className="font-bold text-[11px] uppercase tracking-wider text-blue-400 mb-2 border-b border-slate-700 pb-1">
                Ketentuan Penggunaan Kartu Perpustakaan
              </h4>
              <ul className="text-[9px] text-slate-300 space-y-1 list-disc list-inside leading-relaxed">
                <li>Kartu ini wajib dibawa saat memasuki ruang perpustakaan.</li>
                <li>Tap kartu pada terminal scanner saat masuk dan saat keluar.</li>
                <li>Kartu ini tidak boleh dipindahtangankan kepada santri lain.</li>
                <li>Jika kartu hilang atau rusak, segera lapor kepada petugas.</li>
                <li>Maksimal durasi kunjungan per sesi: {settings.max_visit_minutes || 180} menit.</li>
              </ul>
              <div className="absolute bottom-2 left-4 right-4 flex justify-between items-center text-[8px] text-slate-500 font-mono border-t border-slate-800 pt-1.5">
                <span>{settings.institution_name}</span>
                <span>JAM: {settings.open_time} - {settings.close_time} WIB</span>
              </div>
            </div>
          )}

          {/* Quick Details & Copy UID */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Isi Kode QR / UID:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{cardUid}</span>
              </div>
            </div>

            <button
              onClick={handleCopyUid}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin UID'}</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDownloadQr}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Download QR</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kartu</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
