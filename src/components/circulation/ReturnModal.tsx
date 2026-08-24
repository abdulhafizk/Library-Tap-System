import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, BookCheck, ShieldCheck, DollarSign } from 'lucide-react';
import { BookLoan, Book, Student } from '../../types';
import { useLibrary } from '../../context/LibraryContext';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  loan: BookLoan | null;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  loan
}) => {
  const { books, students, returnBook } = useLibrary();

  const [bookCondition, setBookCondition] = useState<'good' | 'minor_damage' | 'damaged' | 'lost'>('good');
  const [returnNotes, setReturnNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !loan) return null;

  const book = books.find(b => b.id === loan.book_id);
  const student = students.find(s => s.id === loan.student_id);

  const now = new Date();
  const dueDate = new Date(loan.due_date);
  const isOverdue = dueDate < now;
  const daysOverdue = isOverdue ? Math.max(1, Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))) : 0;
  
  // Rp 500 / day default
  const defaultFine = daysOverdue * 500;
  const [customFine, setCustomFine] = useState<number>(defaultFine);
  const [waiveFine, setWaiveFine] = useState<boolean>(false);

  const finalFine = waiveFine ? 0 : customFine;

  const handleConfirmReturn = async () => {
    setIsSubmitting(true);
    try {
      const fullNote = `Kondisi: ${bookCondition === 'good' ? 'Baik' : bookCondition === 'minor_damage' ? 'Sedikit Rusak' : bookCondition === 'damaged' ? 'Rusak' : 'Hilang'}${returnNotes ? ' | ' + returnNotes : ''}`;
      const success = await returnBook(loan.id, fullNote, finalFine);
      if (success) {
        onSuccess();
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] cursor-default"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
              <BookCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Konfirmasi Pengembalian Buku</h3>
              <p className="text-xs text-emerald-100">Proses pengembalian kitab & cek denda/kondisi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-800 dark:text-slate-200 text-xs">
          {/* Overview Info */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Kode Peminjaman:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{loan.loan_code}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Santri Peminjam:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{student?.name || '-'} ({student?.class || '-'})</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Judul Buku / Kitab:</span>
              <span className="font-bold text-slate-900 dark:text-white truncate max-w-[220px]">{book?.title || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Jatuh Tempo:</span>
              <span className={`font-semibold ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                {new Date(loan.due_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                {isOverdue && ` (Terlambat ${daysOverdue} Hari)`}
              </span>
            </div>
          </div>

          {/* Overdue / Fine section */}
          {isOverdue && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Keterlambatan Pengembalian</span>
              </div>
              <p className="text-rose-700 dark:text-rose-400/90 text-[11px]">
                Pengembalian terlambat {daysOverdue} hari dari batas yang ditentukan (Tarif Rp 500/hari).
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-rose-200 dark:border-rose-900/60">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-rose-600" />
                  <span className="font-semibold text-rose-900 dark:text-rose-200">Nominal Denda:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={waiveFine ? 0 : customFine}
                    disabled={waiveFine}
                    onChange={(e) => setCustomFine(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 px-2 py-1 text-right text-xs font-bold rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <label className="inline-flex items-center gap-2 cursor-pointer text-[11px] text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={waiveFine}
                    onChange={(e) => setWaiveFine(e.target.checked)}
                    className="rounded-sm text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Bebaskan Denda (Kebijakan Pustakawan / Udzur Syar'i)</span>
                </label>
              </div>
            </div>
          )}

          {/* Condition of the book */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
              Kondisi Fisik Buku / Kitab yang Dikembalikan:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'good', label: 'Baik & Lengkap', desc: 'Tidak ada kerusakan' },
                { id: 'minor_damage', label: 'Sedikit Rusak', desc: 'Lipatan / noda ringan' },
                { id: 'damaged', label: 'Rusak Berat', desc: 'Halaman robek / jilid lepas' },
                { id: 'lost', label: 'Buku Hilang', desc: 'Perlu ganti buku/uang' },
              ].map(c => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setBookCondition(c.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    bookCondition === c.id 
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <p className="text-xs">{c.label}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{c.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Note input */}
          <div>
            <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
              Catatan Pengembalian (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Diserahkan langsung ke ustadz pustakawan..."
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirmReturn}
            disabled={isSubmitting}
            id="btn-submit-return"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            {isSubmitting ? 'Menyimpan...' : 'Proses Selesai Dikembalikan'}
          </button>
        </div>
      </div>
    </div>
  );
};
