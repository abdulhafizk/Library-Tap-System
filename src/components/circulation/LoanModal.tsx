import React, { useState, useMemo } from 'react';
import { X, BookOpen, User, Radio, Calendar, Check, Search, AlertCircle, Camera, Barcode, Zap } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { BookLoan, Student, Book } from '../../types';
import { RfidDetectionModal } from '../common/RfidDetectionModal';
import { CameraScannerModal } from '../common/CameraScannerModal';
import { soundManager } from '../../utils/audio';

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (loan: BookLoan) => void;
  preselectedBookId?: string;
  preselectedStudentId?: string;
}

export const LoanModal: React.FC<LoanModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedBookId,
  preselectedStudentId
}) => {
  const { students, books, cards, borrowBook } = useLibrary();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(preselectedStudentId || '');
  const [selectedBookId, setSelectedBookId] = useState<string>(preselectedBookId || '');
  const [dueDays, setDueDays] = useState<number>(7);
  const [notes, setNotes] = useState<string>('');
  const [rfidInput, setRfidInput] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [bookSearch, setBookSearch] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals for RFID & Book Camera Scanning
  const [isRfidModalOpen, setIsRfidModalOpen] = useState<boolean>(false);
  const [isBookCameraOpen, setIsBookCameraOpen] = useState<boolean>(false);

  // Sync preselected values
  React.useEffect(() => {
    if (preselectedBookId) setSelectedBookId(preselectedBookId);
    if (preselectedStudentId) setSelectedStudentId(preselectedStudentId);
  }, [preselectedBookId, preselectedStudentId, isOpen]);

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students.filter(s => s.status === 'active').slice(0, 8);
    const q = studentSearch.toLowerCase();
    return students.filter(s => 
      s.status === 'active' && 
      (s.name.toLowerCase().includes(q) || s.nis.includes(q) || s.class.toLowerCase().includes(q) || (s.rfid_uid && s.rfid_uid.toLowerCase().includes(q)))
    ).slice(0, 10);
  }, [students, studentSearch]);

  // Filter books
  const filteredBooks = useMemo(() => {
    if (!bookSearch.trim()) return books.filter(b => b.available_stock > 0).slice(0, 8);
    const q = bookSearch.toLowerCase();
    return books.filter(b => 
      (b.title.toLowerCase().includes(q) || b.code.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.category.toLowerCase().includes(q) || (b.isbn && b.isbn.toLowerCase().includes(q)))
    ).slice(0, 10);
  }, [books, bookSearch]);

  const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);
  const selectedBook = useMemo(() => books.find(b => b.id === selectedBookId), [books, selectedBookId]);

  // Quick RFID card match & detection opener
  const handleRfidScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!rfidInput.trim()) {
      setIsRfidModalOpen(true);
      return;
    }
    const clean = rfidInput.trim().toUpperCase();
    
    // 1. Direct card match
    const matchedCard = cards.find(c => c.uid.toUpperCase() === clean);
    if (matchedCard && matchedCard.student_id) {
      const std = students.find(s => s.id === matchedCard.student_id || s.nis === matchedCard.student_id);
      if (std) {
        setSelectedStudentId(std.id);
        setRfidInput('');
        setErrorMsg(null);
        soundManager.playSuccess();
        return;
      }
    }

    // 2. Direct student rfid_uid or NIS
    const directStudent = students.find(s => 
      (s.rfid_uid && s.rfid_uid.toUpperCase() === clean) ||
      s.nis.toUpperCase() === clean ||
      s.id.toUpperCase() === clean
    );
    if (directStudent) {
      setSelectedStudentId(directStudent.id);
      setRfidInput('');
      setErrorMsg(null);
      soundManager.playSuccess();
      return;
    }

    // 3. Digits match
    const cleanDigits = clean.replace(/\D/g, '');
    if (cleanDigits.length >= 4) {
      const stdByDigits = students.find(s => 
        s.nis.includes(cleanDigits) || 
        (s.rfid_uid && s.rfid_uid.replace(/\D/g, '') === cleanDigits)
      );
      if (stdByDigits) {
        setSelectedStudentId(stdByDigits.id);
        setRfidInput('');
        setErrorMsg(null);
        soundManager.playSuccess();
        return;
      }
    }

    setErrorMsg(`Kartu RFID / NIS "${clean}" belum terdaftar atau tidak terhubung dengan santri.`);
    soundManager.playError();
  };

  // Handle Book Code Scanned via Camera
  const handleBookCameraScan = (scannedCode: string) => {
    const clean = scannedCode.trim();
    if (!clean) return;
    const cleanUpper = clean.toUpperCase();
    const cleanDigits = clean.replace(/[-\s]/g, '');

    // 1. Exact Book code match
    let matched = books.find(b => b.code.toUpperCase() === cleanUpper);

    // 2. ISBN match
    if (!matched && cleanDigits.length >= 8) {
      matched = books.find(b => b.isbn && b.isbn.replace(/[-\s]/g, '') === cleanDigits);
    }

    // 3. ID match
    if (!matched) {
      matched = books.find(b => b.id === clean);
    }

    // 4. Substring or code in text
    if (!matched) {
      matched = books.find(b => 
        b.code.toUpperCase().includes(cleanUpper) || 
        cleanUpper.includes(b.code.toUpperCase()) ||
        (b.isbn && cleanDigits.includes(b.isbn.replace(/[-\s]/g, '')))
      );
    }

    if (matched) {
      if (matched.available_stock <= 0) {
        setErrorMsg(`Kitab "${matched.title}" (${matched.code}) ditemukan, namun stok sedang habis.`);
        soundManager.playError();
      } else {
        setSelectedBookId(matched.id);
        setErrorMsg(null);
        soundManager.playSuccess();
      }
    } else {
      setErrorMsg(`Buku / kitab dengan kode barcode "${scannedCode}" tidak ditemukan dalam katalog perpustakaan.`);
      soundManager.playError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedStudentId) {
      setErrorMsg('Silakan pilih santri peminjam.');
      return;
    }
    if (!selectedBookId) {
      setErrorMsg('Silakan pilih buku / kitab yang akan dipinjam.');
      return;
    }
    if (selectedBook && selectedBook.available_stock <= 0) {
      setErrorMsg('Stok buku ini sedang habis.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await borrowBook({
        student_id: selectedStudentId,
        book_id: selectedBookId,
        due_days: dueDays,
        notes
      });

      if (res) {
        onSuccess(res);
        onClose();
        // Reset
        setSelectedStudentId('');
        setSelectedBookId('');
        setNotes('');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan saat memproses peminjaman.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] cursor-default"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base">Form Transaksi Peminjaman Buku</h3>
                <p className="text-xs text-blue-100">Catat peminjaman kitab/buku untuk santri perpustakaan</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Section 1: Santri Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  1. Pilih Santri Peminjam
                </label>
                {selectedStudent && (
                  <button
                    type="button"
                    onClick={() => setSelectedStudentId('')}
                    className="text-[11px] text-rose-600 hover:underline font-medium"
                  >
                    Ganti Santri
                  </button>
                )}
              </div>

              {selectedStudent ? (
                <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {selectedStudent.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{selectedStudent.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        NIS: {selectedStudent.nis} • Kelas: {selectedStudent.class} • {selectedStudent.gender === 'male' ? 'Santriwan' : 'Santriwati'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-600 text-white flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Terpilih
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Fast RFID tap bar */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Radio className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Scan kartu RFID santri atau ketik UID..."
                        value={rfidInput}
                        onChange={(e) => setRfidInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleRfidScan(e);
                          }
                        }}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRfidScan()}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>Deteksi RFID</span>
                    </button>
                  </div>

                  {/* Search & List */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Atau cari santri berdasarkan nama / NIS / kelas..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                    {filteredStudents.map(student => (
                      <button
                        type="button"
                        key={student.id}
                        onClick={() => setSelectedStudentId(student.id)}
                        className="p-2 text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all flex items-center justify-between group"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {student.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            NIS: {student.nis} • {student.class}
                          </p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white font-medium shrink-0">
                          Pilih
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Book Selection */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  2. Pilih Kitab / Buku
                </label>
                {selectedBook && (
                  <button
                    type="button"
                    onClick={() => setSelectedBookId('')}
                    className="text-[11px] text-rose-600 hover:underline font-medium"
                  >
                    Ganti Buku
                  </button>
                )}
              </div>

              {selectedBook ? (
                <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-12 rounded-lg bg-indigo-600 text-white font-bold flex flex-col items-center justify-center text-xs shadow-xs p-1">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-[9px] uppercase tracking-tighter">Buku</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{selectedBook.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Pengarang: {selectedBook.author} • Rak: {selectedBook.shelf_location || '-'} • Kode: <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">{selectedBook.code}</span>
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
                        Sisa Stok: {selectedBook.available_stock} dari {selectedBook.total_stock} eksemplar
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-600 text-white flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Terpilih
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Cari judul kitab / nama pengarang / kode buku..."
                        value={bookSearch}
                        onChange={(e) => setBookSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsBookCameraOpen(true)}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      title="Scan Barcode / QR Code Buku dengan Kamera"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Scan Kamera Buku</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                    {filteredBooks.map(book => {
                      const isOutOfStock = book.available_stock <= 0;
                      return (
                        <button
                          type="button"
                          key={book.id}
                          disabled={isOutOfStock}
                          onClick={() => setSelectedBookId(book.id)}
                          className={`p-2 text-left rounded-xl border transition-all flex items-center justify-between group ${
                            isOutOfStock 
                              ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800' 
                              : 'border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                              {book.title}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {book.author} • <span className="font-mono font-medium text-slate-600 dark:text-slate-300">{book.code}</span>
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                              isOutOfStock 
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' 
                                : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}>
                              {isOutOfStock ? 'Habis' : `Tersedia ${book.available_stock}`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Loan Duration & Notes */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  3. Durasi Peminjaman
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { days: 3, label: '3 Hari', desc: 'Pinjam Cepat' },
                    { days: 7, label: '7 Hari (1 Pekan)', desc: 'Standar Perpustakaan' },
                    { days: 14, label: '14 Hari (2 Pekan)', desc: 'Kitab Kajian' },
                  ].map(opt => (
                    <button
                      type="button"
                      key={opt.days}
                      onClick={() => setDueDays(opt.days)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        dueDays === opt.days 
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <p className="text-xs">{opt.label}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-normal">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Untuk tugas hafalan Fiqih / kondisi jilid kitab baik..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </form>

          {/* Modal Footer */}
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
              onClick={handleSubmit}
              disabled={!selectedStudentId || !selectedBookId || isSubmitting}
              id="btn-confirm-loan"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Memproses...' : 'Konfirmasi Peminjaman'}
            </button>
          </div>
        </div>
      </div>

      {/* RFID Card Detection Modal */}
      <RfidDetectionModal
        isOpen={isRfidModalOpen}
        onClose={() => setIsRfidModalOpen(false)}
        onSelectStudent={(std: Student) => {
          setSelectedStudentId(std.id);
          setErrorMsg(null);
        }}
      />

      {/* Book Barcode / QR Scanner via Camera */}
      <CameraScannerModal
        isOpen={isBookCameraOpen}
        onClose={() => setIsBookCameraOpen(false)}
        onScan={handleBookCameraScan}
        title="Scan Barcode / QR Code Kitab"
        description="Arahkan kamera ke Barcode ISBN, label kode kitab, atau QR Code buku"
        placeholder="Ketik kode buku / ISBN..."
      />
    </>
  );
};

