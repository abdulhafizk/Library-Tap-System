import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  MapPin, 
  Info, 
  BookMarked,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { BookLoan, Book, Student } from '../../types';

interface SantriLoansTabProps {
  student: Student;
  loans: BookLoan[];
  books: Book[];
}

export const SantriLoansTab: React.FC<SantriLoansTabProps> = ({ student, loans, books }) => {
  const [activeSubTab, setActiveSubTab] = useState<'active' | 'history'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Map of books for fast lookup
  const booksMap = useMemo(() => new Map<string, Book>(books.map(b => [b.id, b])), [books]);

  // Loans belonging to this student
  const studentLoans = useMemo(() => {
    return loans.filter(loan => loan.student_id === student.id);
  }, [loans, student.id]);

  const now = new Date();

  // Active loans (borrowed or overdue)
  const activeLoans = useMemo(() => {
    return studentLoans.filter(l => l.status === 'borrowed' || l.status === 'overdue' || (l.status as string) === 'active');
  }, [studentLoans]);

  // History loans (returned)
  const historyLoans = useMemo(() => {
    return studentLoans.filter(l => l.status === 'returned');
  }, [studentLoans]);

  // Filtered by sub-tab and search
  const displayedLoans = useMemo(() => {
    const list = activeSubTab === 'active' ? activeLoans : historyLoans;
    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(loan => {
      const book = booksMap.get(loan.book_id);
      const title = book ? book.title.toLowerCase() : '';
      const author = book ? book.author.toLowerCase() : '';
      const category = book ? book.category.toLowerCase() : '';
      const code = loan.loan_code.toLowerCase();
      return title.includes(q) || author.includes(q) || category.includes(q) || code.includes(q);
    });
  }, [activeSubTab, activeLoans, historyLoans, searchQuery, booksMap]);

  // Calculate days remaining or overdue
  const getLoanStatusInfo = (loan: BookLoan) => {
    if (loan.status === 'returned') {
      return {
        type: 'returned',
        badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
        text: 'Sudah Dikembalikan',
        daysText: loan.return_date ? `Dikembalikan: ${new Date(loan.return_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Telah Selesai',
        isOverdue: false
      };
    }

    const dueDate = new Date(loan.due_date);
    const diffMs = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const daysLate = Math.abs(diffDays);
      return {
        type: 'overdue',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
        text: `Terlambat ${daysLate} Hari`,
        daysText: `Batas waktu: ${dueDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        isOverdue: true,
        daysLate
      };
    } else if (diffDays === 0) {
      return {
        type: 'due_today',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold',
        text: 'Jatuh Tempo Hari Ini',
        daysText: 'Batas akhir: Hari Ini pk 17:00 WIB',
        isOverdue: false,
        daysRemaining: 0
      };
    } else if (diffDays <= 2) {
      return {
        type: 'warning',
        badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        text: `Sisa ${diffDays} Hari Lagi`,
        daysText: `Batas waktu: ${dueDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        isOverdue: false,
        daysRemaining: diffDays
      };
    } else {
      return {
        type: 'normal',
        badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        text: `Sisa ${diffDays} Hari`,
        daysText: `Batas waktu: ${dueDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        isOverdue: false,
        daysRemaining: diffDays
      };
    }
  };

  const overdueCount = activeLoans.filter(l => new Date(l.due_date) < now).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Sedang Dipinjam</span>
            <div className="text-2xl font-bold text-white mt-0.5">
              {activeLoans.length} <span className="text-xs font-normal text-slate-400">Kitab / Buku</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            overdueCount > 0 
              ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400' 
              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Melewati Batas Waktu</span>
            <div className={`text-2xl font-bold mt-0.5 ${overdueCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {overdueCount} <span className="text-xs font-normal text-slate-400">Buku</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Selesai Dibaca</span>
            <div className="text-2xl font-bold text-white mt-0.5">
              {historyLoans.length} <span className="text-xs font-normal text-slate-400">Buku</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Toggle Active vs History */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('active')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'active'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>Sedang Dipinjam ({activeLoans.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Riwayat Pengembalian ({historyLoans.length})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul buku, kategori..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Overdue Warning Alert if any */}
      {overdueCount > 0 && activeSubTab === 'active' && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-rose-300 block">Pemberitahuan Batas Waktu</span>
            <p>
              Anda memiliki <strong>{overdueCount} buku</strong> yang telah melampaui batas tanggal pengembalian. Mohon segera mengembalikan buku ke petugas perpustakaan atau mesin Kiosk agar tidak dikenakan pembatasan peminjaman baru.
            </p>
          </div>
        </div>
      )}

      {/* Loan Cards List */}
      {displayedLoans.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-white">
            {activeSubTab === 'active' ? 'Tidak Ada Peminjaman Aktif' : 'Belum Ada Riwayat Pengembalian'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {activeSubTab === 'active'
              ? 'Anda saat ini tidak memiliki pinjaman buku. Silakan berkunjung ke perpustakaan untuk meminjam kitab atau buku umum.'
              : 'Daftar buku yang sudah pernah Anda kembalikan akan tercatat otomatis di sini.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedLoans.map((loan) => {
            const book = booksMap.get(loan.book_id);
            const statusInfo = getLoanStatusInfo(loan);

            return (
              <div
                key={loan.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 backdrop-blur-md transition-all shadow-lg flex flex-col justify-between space-y-4"
              >
                <div className="flex gap-4">
                  {/* Book Cover or Badge */}
                  <div className="w-16 h-22 sm:w-20 sm:h-28 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center text-slate-600 shadow-md">
                    {book?.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="w-8 h-8 text-slate-500" />
                    )}
                  </div>

                  {/* Book Details */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 uppercase tracking-wider">
                        {book?.category || 'Buku Umum'}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.badgeColor}`}>
                        {statusInfo.text}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-white line-clamp-2 leading-snug">
                      {book?.title || 'Judul Buku Tidak Ditemukan'}
                    </h4>

                    <p className="text-xs text-slate-400 truncate">
                      Penulis: <span className="text-slate-300">{book?.author || '-'}</span>
                    </p>

                    {book?.rack_location && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{book.rack_location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dates & Timeline Box */}
                <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-slate-400">
                    <div>
                      <span className="text-[10px] block text-slate-400">Tgl Pinjam</span>
                      <span className="font-medium text-slate-200 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(loan.borrow_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] block text-slate-400">
                        {loan.status === 'returned' ? 'Tgl Kembali' : 'Batas Pengembalian'}
                      </span>
                      <span className={`font-medium flex items-center gap-1 mt-0.5 ${
                        statusInfo.isOverdue ? 'text-rose-300 font-bold' : 'text-slate-200'
                      }`}>
                        <Clock className="w-3 h-3 text-slate-400" />
                        {loan.status === 'returned' && loan.return_date
                          ? new Date(loan.return_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                          : new Date(loan.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Kode: {loan.loan_code}</span>
                    {loan.fine_amount > 0 && (
                      <span className="text-rose-400 font-semibold font-sans">
                        Denda: Rp {loan.fine_amount.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Guide Info Box */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-200 block">Tata Tertib Peminjaman Santri</span>
          <p>
            Maksimal peminjaman kitab/buku adalah 7 hari kalender. Jaga kebersihan dan keutuhan lembaran kitab. Untuk memperpanjang masa pinjam, silakan hubungi petugas perpustakaan sebelum tanggal jatuh tempo.
          </p>
        </div>
      </div>
    </div>
  );
};
