import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  User, 
  Share2, 
  Printer, 
  RefreshCw, 
  Radio, 
  Layers, 
  MapPin, 
  Trash2, 
  Edit3, 
  FileSpreadsheet,
  QrCode,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { BookLoan, Book, Student } from '../../types';
import { LoanModal } from './LoanModal';
import { ReturnModal } from './ReturnModal';
import { ReceiptModal } from './ReceiptModal';
import { BookFormModal } from './BookFormModal';

export const CirculationPage: React.FC = () => {
  const { 
    loans, 
    books, 
    students, 
    cards,
    activeLoansCount, 
    overdueLoansCount, 
    totalBooksCount, 
    totalTitlesCount,
    extendLoan,
    deleteBook,
    sendLoanWhatsAppReminder,
    settings
  } = useLibrary();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'loans' | 'books' | 'quick_scan'>('loans');

  // Search & Filters for Loans
  const [loanSearch, setLoanSearch] = useState<string>('');
  const [loanStatusFilter, setLoanStatusFilter] = useState<'all' | 'borrowed' | 'overdue' | 'returned'>('all');

  // Search & Filters for Books
  const [bookSearch, setBookSearch] = useState<string>('');
  const [bookCategoryFilter, setBookCategoryFilter] = useState<string>('all');

  // Modals state
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  const [selectedLoan, setSelectedLoan] = useState<BookLoan | null>(null);
  const [selectedBookForEdit, setSelectedBookForEdit] = useState<Book | null>(null);
  const [preselectedBookId, setPreselectedBookId] = useState<string | undefined>();
  const [preselectedStudentId, setPreselectedStudentId] = useState<string | undefined>();
  const [receiptActionType, setReceiptActionType] = useState<'loan' | 'return'>('loan');

  // Quick Scan Tab State
  const [quickStudentInput, setQuickStudentInput] = useState('');
  const [quickBookInput, setQuickBookInput] = useState('');
  const [matchedQuickStudent, setMatchedQuickStudent] = useState<Student | null>(null);
  const [matchedQuickBook, setMatchedQuickBook] = useState<Book | null>(null);
  const [quickScanMessage, setQuickScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    return loans.filter(loan => {
      const student = students.find(s => s.id === loan.student_id);
      const book = books.find(b => b.id === loan.book_id);
      const now = new Date();
      const isOverdue = loan.status === 'borrowed' && new Date(loan.due_date) < now;

      // Status filter
      if (loanStatusFilter === 'borrowed' && loan.status !== 'borrowed') return false;
      if (loanStatusFilter === 'overdue' && !isOverdue && loan.status !== 'overdue') return false;
      if (loanStatusFilter === 'returned' && loan.status !== 'returned') return false;

      // Search query
      if (loanSearch.trim()) {
        const q = loanSearch.toLowerCase();
        const studentName = student ? student.name.toLowerCase() : '';
        const studentNis = student ? student.nis.toLowerCase() : '';
        const bookTitle = book ? book.title.toLowerCase() : '';
        const bookCode = book ? book.code.toLowerCase() : '';
        const loanCode = loan.loan_code.toLowerCase();

        return (
          studentName.includes(q) ||
          studentNis.includes(q) ||
          bookTitle.includes(q) ||
          bookCode.includes(q) ||
          loanCode.includes(q)
        );
      }

      return true;
    });
  }, [loans, students, books, loanStatusFilter, loanSearch]);

  // Filtered Books
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      if (bookCategoryFilter !== 'all' && book.category !== bookCategoryFilter) return false;
      if (bookSearch.trim()) {
        const q = bookSearch.toLowerCase();
        return (
          book.title.toLowerCase().includes(q) ||
          book.code.toLowerCase().includes(q) ||
          book.author.toLowerCase().includes(q) ||
          (book.shelf_location && book.shelf_location.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [books, bookCategoryFilter, bookSearch]);

  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => set.add(b.category));
    return Array.from(set);
  }, [books]);

  // Open Return Modal
  const handleOpenReturn = (loan: BookLoan) => {
    setSelectedLoan(loan);
    setIsReturnModalOpen(true);
  };

  // Open Receipt Modal
  const handleOpenReceipt = (loan: BookLoan, type: 'loan' | 'return') => {
    setSelectedLoan(loan);
    setReceiptActionType(type);
    setIsReceiptModalOpen(true);
  };

  // Handle Quick Scan Peminjaman
  const handleQuickStudentLookup = () => {
    if (!quickStudentInput.trim()) return;
    const clean = quickStudentInput.trim().toUpperCase();
    const card = cards.find(c => c.uid === clean);
    if (card && card.student_id) {
      const s = students.find(std => std.id === card.student_id);
      if (s) {
        setMatchedQuickStudent(s);
        setQuickScanMessage(null);
        return;
      }
    }
    const directStd = students.find(s => s.rfid_uid === clean || s.nis === clean || s.name.toLowerCase().includes(quickStudentInput.toLowerCase()));
    if (directStd) {
      setMatchedQuickStudent(directStd);
      setQuickScanMessage(null);
      return;
    }
    setQuickScanMessage({ type: 'error', text: `Santri dengan RFID / NIS "${quickStudentInput}" tidak ditemukan.` });
  };

  const handleQuickBookLookup = () => {
    if (!quickBookInput.trim()) return;
    const clean = quickBookInput.trim().toUpperCase();
    const b = books.find(item => item.code.toUpperCase() === clean || item.title.toLowerCase().includes(quickBookInput.toLowerCase()));
    if (b) {
      setMatchedQuickBook(b);
      setQuickScanMessage(null);
      return;
    }
    setQuickScanMessage({ type: 'error', text: `Buku dengan kode "${quickBookInput}" tidak ditemukan.` });
  };

  // Export CSV
  const handleExportCsv = () => {
    const csvRows = [
      ['Kode Pinjam', 'Nama Santri', 'NIS', 'Kelas', 'Judul Buku', 'Kode Buku', 'Tgl Pinjam', 'Tgl Jatuh Tempo', 'Tgl Kembali', 'Status', 'Denda'].join(',')
    ];

    loans.forEach(l => {
      const s = students.find(std => std.id === l.student_id);
      const b = books.find(bk => bk.id === l.book_id);
      csvRows.push([
        `"${l.loan_code}"`,
        `"${s?.name || '-'}"`,
        `"${s?.nis || '-'}"`,
        `"${s?.class || '-'}"`,
        `"${b?.title || '-'}"`,
        `"${b?.code || '-'}"`,
        `"${new Date(l.borrow_date).toLocaleDateString('id-ID')}"`,
        `"${new Date(l.due_date).toLocaleDateString('id-ID')}"`,
        `"${l.return_date ? new Date(l.return_date).toLocaleDateString('id-ID') : '-'}"`,
        `"${l.status}"`,
        `"${l.fine_amount || 0}"`
      ].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_sirkulasi_perpustakaan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none transform translate-x-12"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-xs text-blue-100 border border-white/20">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Modul Sirkulasi Perpustakaan Pesantren</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Sirkulasi Buku & Kitab
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Kelola peminjaman dan pengembalian kitab santri secara otomatis. Dilengkapi notifikasi WhatsApp, slip peminjaman, dan pencatatan jatuh tempo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-new-loan-top"
              onClick={() => {
                setPreselectedBookId(undefined);
                setPreselectedStudentId(undefined);
                setIsLoanModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Pinjam Buku Baru
            </button>
            <button
              id="btn-new-book-top"
              onClick={() => {
                setSelectedBookForEdit(null);
                setIsBookModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 border border-white/20 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              + Tambah Katalog Buku
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sedang Dipinjam</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5">{activeLoansCount}</h3>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Buku beredar di santri</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jatuh Tempo</p>
            <h3 className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{overdueLoansCount}</h3>
            <p className="text-[10px] text-rose-500 font-medium">Perlu pengingat WA</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Judul Kitab</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5">{totalTitlesCount}</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Judul dalam katalog</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Eksemplar</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5">{totalBooksCount}</h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Fisik inventaris buku</p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
          <button
            id="tab-btn-loans"
            onClick={() => setActiveTab('loans')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'loans'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Peminjaman Aktif & Riwayat</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold">
              {loans.length}
            </span>
          </button>

          <button
            id="tab-btn-books"
            onClick={() => setActiveTab('books')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'books'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Katalog Buku / Kitab</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold">
              {books.length}
            </span>
          </button>

          <button
            id="tab-btn-quickscan"
            onClick={() => setActiveTab('quick_scan')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'quick_scan'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>⚡ Meja Sirkulasi Cepat</span>
          </button>
        </div>

        {/* Export & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            id="btn-export-circulation-csv"
            title="Download CSV Laporan Sirkulasi"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LOANS & TRANSACTION HISTORY */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          {/* Controls & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari santri, NIS, judul buku, atau kode pinjam..."
                value={loanSearch}
                onChange={(e) => setLoanSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'Semua Status' },
                { id: 'borrowed', label: 'Sedang Dipinjam' },
                { id: 'overdue', label: 'Jatuh Tempo' },
                { id: 'returned', label: 'Dikembalikan' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setLoanStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    loanStatusFilter === f.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loans Table (Desktop & Tablet) */}
          <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">No. Transaksi</th>
                    <th className="py-3.5 px-4">Santri Peminjam</th>
                    <th className="py-3.5 px-4">Judul Kitab / Buku</th>
                    <th className="py-3.5 px-4">Tgl Pinjam & Jatuh Tempo</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi Sirkulasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-sm">Tidak ada data peminjaman ditemukan</p>
                        <p className="text-xs text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau filter status.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map(loan => {
                      const student = students.find(s => s.id === loan.student_id);
                      const book = books.find(b => b.id === loan.book_id);
                      const now = new Date();
                      const dueDate = new Date(loan.due_date);
                      const isOverdue = loan.status === 'borrowed' && dueDate < now;
                      const isReturned = loan.status === 'returned';

                      return (
                        <tr key={loan.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Loan Code */}
                          <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {loan.loan_code}
                          </td>

                          {/* Student */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {student?.name || 'Santri Tidak Ditemukan'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              NIS: {student?.nis || '-'} • Kelas {student?.class || '-'}
                            </div>
                          </td>

                          {/* Book */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1" title={book?.title}>
                              {book?.title || 'Buku Tidak Ditemukan'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {book?.author} • Kode: {book?.code}
                            </div>
                          </td>

                          {/* Dates */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="text-slate-600 dark:text-slate-400">
                              Pinjam: {new Date(loan.borrow_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                            </div>
                            <div className={`font-semibold ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-blue-600 dark:text-blue-400'}`}>
                              Tempo: {new Date(loan.due_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                              {isOverdue && ' (Terlambat)'}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isReturned ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle className="w-3 h-3" />
                                Dikembalikan
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                Jatuh Tempo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                <Clock className="w-3 h-3" />
                                Dipinjam
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isReturned && (
                                <>
                                  <button
                                    onClick={() => handleOpenReturn(loan)}
                                    title="Proses Pengembalian Buku"
                                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
                                  >
                                    Kembalikan
                                  </button>
                                  <button
                                    onClick={() => extendLoan(loan.id, 7)}
                                    title="Perpanjang Peminjaman (+7 Hari)"
                                    className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                  >
                                    +7 Hari
                                  </button>
                                  <button
                                    onClick={() => sendLoanWhatsAppReminder(loan.id)}
                                    title="Kirim Pengingat WhatsApp ke Santri/Wali"
                                    className="p-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors cursor-pointer"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => handleOpenReceipt(loan, isReturned ? 'return' : 'loan')}
                                title="Lihat & Cetak Struk Peminjaman"
                                className="p-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Loans Card List (Mobile Smartphone View) */}
          <div className="sm:hidden space-y-3">
            {filteredLoans.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-sm">Tidak ada data peminjaman</p>
                <p className="text-xs text-slate-400 mt-1">Sesuaikan filter atau pencarian di atas.</p>
              </div>
            ) : (
              filteredLoans.map(loan => {
                const student = students.find(s => s.id === loan.student_id);
                const book = books.find(b => b.id === loan.book_id);
                const now = new Date();
                const dueDate = new Date(loan.due_date);
                const isOverdue = loan.status === 'borrowed' && dueDate < now;
                const isReturned = loan.status === 'returned';

                return (
                  <div 
                    key={`mobile-loan-${loan.id}`}
                    className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <div>
                        <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                          {loan.loan_code}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                          {student?.name || 'Santri'}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          NIS: {student?.nis || '-'} • Kelas {student?.class || '-'}
                        </p>
                      </div>

                      {isReturned ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 shrink-0">
                          <CheckCircle className="w-3 h-3" />
                          Kembali
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 animate-pulse shrink-0">
                          <AlertTriangle className="w-3 h-3" />
                          Terlambat
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-200 shrink-0">
                          <Clock className="w-3 h-3" />
                          Dipinjam
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="line-clamp-1">{book?.title || 'Kitab'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                        <span>Pinjam: {new Date(loan.borrow_date).toLocaleDateString('id-ID', { dateStyle: 'short' })}</span>
                        <span className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                          Tempo: {new Date(loan.due_date).toLocaleDateString('id-ID', { dateStyle: 'short' })}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons for Mobile */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {!isReturned ? (
                        <>
                          <button
                            onClick={() => handleOpenReturn(loan)}
                            className="py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-transform"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Kembalikan
                          </button>
                          <button
                            onClick={() => extendLoan(loan.id, 7)}
                            className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform"
                          >
                            +7 Hari
                          </button>
                          <button
                            onClick={() => sendLoanWhatsAppReminder(loan.id)}
                            className="py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            Kirim WA
                          </button>
                          <button
                            onClick={() => handleOpenReceipt(loan, 'loan')}
                            className="py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Struk
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleOpenReceipt(loan, 'return')}
                          className="col-span-2 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Cetak Bukti Pengembalian
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BOOKS & INVENTORY CATALOG */}
      {activeTab === 'books' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari judul kitab, pengarang, kode buku, atau rak..."
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={bookCategoryFilter}
                onChange={(e) => setBookCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Kategori Kitab</option>
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <button
                onClick={() => {
                  setSelectedBookForEdit(null);
                  setIsBookModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Buku
              </button>
            </div>
          </div>

          {/* Book Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map(book => {
              const isAvailable = book.available_stock > 0;
              const borrowedCount = Math.max(0, book.total_stock - book.available_stock);
              const percentage = Math.round((book.available_stock / book.total_stock) * 100);

              return (
                <div 
                  key={book.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                        {book.category}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                        {book.code}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2" title={book.title}>
                        {book.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Pengarang: <span className="font-medium text-slate-700 dark:text-slate-300">{book.author}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {book.shelf_location || 'Rak Umum'}
                      </span>
                      {book.publisher && (
                        <span>• {book.publisher}</span>
                      )}
                    </div>

                    {/* Stock Bar */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600 dark:text-slate-400">Ketersediaan Stok:</span>
                        <span className={isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}>
                          {book.available_stock} dari {book.total_stock} eks ({borrowedCount} dipinjam)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedBookForEdit(book);
                          setIsBookModalOpen(true);
                        }}
                        title="Edit Data Buku"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteBook(book.id)}
                        title="Hapus Buku"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      disabled={!isAvailable}
                      onClick={() => {
                        setPreselectedBookId(book.id);
                        setPreselectedStudentId(undefined);
                        setIsLoanModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white shadow-xs transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Pinjamkan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: QUICK SCAN CIRCULATION DESK */}
      {activeTab === 'quick_scan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Input & Tap simulator */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Meja Sirkulasi Cepat (RFID & Barcode)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Scan kartu santri lalu scan kode barcode kitab untuk transaksi instan</p>
                </div>
              </div>

              {quickScanMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  quickScanMessage.type === 'error' 
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900' 
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                }`}>
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{quickScanMessage.text}</span>
                </div>
              )}

              {/* Step 1: Student RFID */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Langkah 1: Tap Kartu RFID Santri / Input NIS
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Radio className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tempel kartu RFID atau ketik NIS santri..."
                      value={quickStudentInput}
                      onChange={(e) => setQuickStudentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickStudentLookup();
                      }}
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    onClick={handleQuickStudentLookup}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                  >
                    Deteksi
                  </button>
                </div>

                {matchedQuickStudent && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                        {matchedQuickStudent.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white">{matchedQuickStudent.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">NIS: {matchedQuickStudent.nis} • Kelas: {matchedQuickStudent.class}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setMatchedQuickStudent(null);
                        setQuickStudentInput('');
                      }}
                      className="text-[11px] text-rose-500 hover:underline"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Book Barcode */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Langkah 2: Scan Barcode / Kode Buku
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Scan barcode kitab (contoh: KTB-001)..."
                      value={quickBookInput}
                      onChange={(e) => setQuickBookInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickBookLookup();
                      }}
                      className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    onClick={handleQuickBookLookup}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                  >
                    Cari Buku
                  </button>
                </div>

                {matchedQuickBook && (
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white">{matchedQuickBook.title}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Kode: {matchedQuickBook.code} • Sisa: {matchedQuickBook.available_stock} eks</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setMatchedQuickBook(null);
                        setQuickBookInput('');
                      }}
                      className="text-[11px] text-rose-500 hover:underline"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  disabled={!matchedQuickStudent || !matchedQuickBook}
                  onClick={() => {
                    if (matchedQuickStudent && matchedQuickBook) {
                      setPreselectedStudentId(matchedQuickStudent.id);
                      setPreselectedBookId(matchedQuickBook.id);
                      setIsLoanModalOpen(true);
                    }
                  }}
                  id="btn-process-quick-loan"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Lanjutkan Proses Peminjaman Instan
                </button>
              </div>
            </div>
          </div>

          {/* Right: Active loans for scanned student */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Daftar Buku yang Sedang Dipinjam Santri Ini
              </h4>

              {matchedQuickStudent ? (
                (() => {
                  const studentActiveLoans = loans.filter(l => l.student_id === matchedQuickStudent.id && l.status === 'borrowed');
                  if (studentActiveLoans.length === 0) {
                    return (
                      <div className="p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Santri belum memiliki pinjaman aktif</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Bebas meminjam buku sesuai batas kuota.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      {studentActiveLoans.map(loan => {
                        const bk = books.find(b => b.id === loan.book_id);
                        const isOver = new Date(loan.due_date) < new Date();
                        return (
                          <div key={loan.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{bk?.title}</p>
                              <p className={`text-[10px] ${isOver ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                                Tempo: {new Date(loan.due_date).toLocaleDateString('id-ID')} {isOver && '(Terlambat)'}
                              </p>
                            </div>
                            <button
                              onClick={() => handleOpenReturn(loan)}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shrink-0"
                            >
                              Kembalikan
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <User className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-medium">Scan atau pilih santri terlebih dahulu di sebelah kiri</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <LoanModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        preselectedBookId={preselectedBookId}
        preselectedStudentId={preselectedStudentId}
        onSuccess={(loan) => {
          setSelectedLoan(loan);
          setReceiptActionType('loan');
          setIsReceiptModalOpen(true);
        }}
      />

      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => {
          setIsReturnModalOpen(false);
          setSelectedLoan(null);
        }}
        loan={selectedLoan}
        onSuccess={() => {
          if (selectedLoan) {
            setReceiptActionType('return');
            setIsReceiptModalOpen(true);
          }
        }}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedLoan(null);
        }}
        loan={selectedLoan}
        book={selectedLoan ? books.find(b => b.id === selectedLoan.book_id) : undefined}
        student={selectedLoan ? students.find(s => s.id === selectedLoan.student_id) : undefined}
        actionType={receiptActionType}
      />

      <BookFormModal
        isOpen={isBookModalOpen}
        onClose={() => {
          setIsBookModalOpen(false);
          setSelectedBookForEdit(null);
        }}
        editBook={selectedBookForEdit}
      />
    </div>
  );
};
