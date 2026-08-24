import React from 'react';
import { X, Printer, Share2, CheckCircle, BookOpen, Clock, Calendar, AlertCircle } from 'lucide-react';
import { BookLoan, Book, Student } from '../../types';
import { useLibrary } from '../../context/LibraryContext';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: BookLoan | null;
  book?: Book;
  student?: Student;
  actionType: 'loan' | 'return';
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  loan,
  book,
  student,
  actionType
}) => {
  const { settings, sendLoanWhatsAppReminder } = useLibrary();

  if (!isOpen || !loan) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWA = () => {
    sendLoanWhatsAppReminder(loan.id);
  };

  const isReturned = actionType === 'return' || loan.status === 'returned';
  const isOverdue = !isReturned && new Date(loan.due_date) < new Date();

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] cursor-default"
      >
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isReturned ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'}`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              {isReturned ? 'Bukti Pengembalian Buku' : 'Bukti Peminjaman Buku'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Struk Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-800 dark:text-slate-200">
          {/* Pesantren Info Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
            <h4 className="font-bold text-base text-slate-900 dark:text-white uppercase tracking-wide">
              {settings.library_name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {settings.institution_name}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <span>No. Transaksi:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{loan.loan_code}</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            {isReturned ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle className="w-3.5 h-3.5" />
                SUDAH DIKEMBALIKAN
              </span>
            ) : isOverdue ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-3.5 h-3.5" />
                JATUH TEMPO / TERLAMBAT
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                <Clock className="w-3.5 h-3.5" />
                STATUS: SEDANG DIPINJAM
              </span>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400">Peminjam / Santri:</span>
              <span className="font-semibold text-right">{student?.name || 'Santri Perpustakaan'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400">NIS & Kelas:</span>
              <span className="font-medium text-right">{student?.nis || '-'} • {student?.class || '-'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400">Judul Buku / Kitab:</span>
              <span className="font-bold text-right max-w-[200px] truncate" title={book?.title}>{book?.title || 'Buku Perpustakaan'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400">Pengarang / Kode:</span>
              <span className="font-medium text-right">{book?.author || '-'} ({book?.code || '-'})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400">Tanggal Pinjam:</span>
              <span className="font-medium text-right">{new Date(loan.borrow_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400">Batas Pengembalian:</span>
              <span className="font-bold text-right text-blue-600 dark:text-blue-400">
                {new Date(loan.due_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
              </span>
            </div>
            {loan.return_date && (
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Tanggal Dikembalikan:</span>
                <span className="font-bold text-right text-emerald-600 dark:text-emerald-400">
                  {new Date(loan.return_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                </span>
              </div>
            )}
            {loan.fine_amount !== undefined && loan.fine_amount > 0 && (
              <div className="flex justify-between py-1 text-rose-600 dark:text-rose-400 font-bold">
                <span>Denda Keterlambatan:</span>
                <span>Rp {loan.fine_amount.toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>

          {/* Rules / Note */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300">
            <p className="font-semibold mb-1">Tata Tertib Peminjaman:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-amber-700 dark:text-amber-400/90">
              <li>Maksimal waktu pinjam 7 hari (dapat diperpanjang 1x).</li>
              <li>Wajib merawat keutuhan dan kebersihan kitab/buku.</li>
              <li>Harap menunjukkan struk ini saat mengembalikan buku.</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleSendWA}
            id="btn-receipt-wa"
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            Kirim Bukti WA
          </button>
          <button
            onClick={handlePrint}
            id="btn-receipt-print"
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Struk
          </button>
        </div>
      </div>
    </div>
  );
};
