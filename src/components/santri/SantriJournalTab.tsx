import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  PenTool, 
  Search, 
  Plus, 
  Star, 
  Calendar, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  Quote, 
  Sparkles, 
  X, 
  AlertCircle, 
  Filter, 
  Printer, 
  BookMarked,
  Share2
} from 'lucide-react';
import { Student, ReadingJournalEntry, BookLoan } from '../../types';
import { 
  getJournalsFromStorage, 
  addJournalToStorage, 
  updateJournalInStorage, 
  deleteJournalFromStorage 
} from '../../utils/santriStorageUtils';

interface SantriJournalTabProps {
  student: Student;
  loans: BookLoan[];
}

const CATEGORIES = [
  'Adab & Akhlak',
  'Fikih & Ushul',
  'Hadits & Sunnah',
  'Tafsir & Al-Qur\'an',
  'Bahasa & Nahwu',
  'Akidah & Tauhid',
  'Tarikh & Sirah Nabawiyah',
  'Tasawuf & Tazkiyatun Nafs',
  'Wawasan & Umum'
];

export const SantriJournalTab: React.FC<SantriJournalTabProps> = ({ student, loans }) => {
  const [journals, setJournals] = useState<ReadingJournalEntry[]>(() => getJournalsFromStorage());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewingDetail, setViewingDetail] = useState<ReadingJournalEntry | null>(null);

  // Form Fields
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [chapterOrPage, setChapterOrPage] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [keyQuote, setKeyQuote] = useState('');
  const [summary, setSummary] = useState('');
  const [reflection, setReflection] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [formError, setFormError] = useState<string | null>(null);

  // Student's borrowed books list for easy quick pick
  const myBorrowedBooks = useMemo(() => {
    return loans.filter(l => l.student_id === student.id && l.book);
  }, [loans, student.id]);

  // Filter student journals
  const studentJournals = useMemo(() => {
    return journals.filter(j => 
      j.student_id === student.id || 
      (j.student_nis && student.nis && j.student_nis === student.nis)
    );
  }, [journals, student.id, student.nis]);

  // Search and category filter
  const displayedJournals = useMemo(() => {
    return studentJournals.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.book_title.toLowerCase().includes(q) ||
          item.book_author.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          (item.key_quote && item.key_quote.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [studentJournals, selectedCategory, searchQuery]);

  // Unique books count
  const uniqueBooksCount = useMemo(() => {
    const set = new Set(studentJournals.map(j => j.book_title.toLowerCase().trim()));
    return set.size;
  }, [studentJournals]);

  const openCreateModal = () => {
    setEditingId(null);
    setBookTitle('');
    setBookAuthor('');
    setChapterOrPage('');
    setCategory(CATEGORIES[0]);
    setTitle('');
    setKeyQuote('');
    setSummary('');
    setReflection('');
    setRating(5);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (entry: ReadingJournalEntry) => {
    setEditingId(entry.id);
    setBookTitle(entry.book_title);
    setBookAuthor(entry.book_author);
    setChapterOrPage(entry.chapter_or_page || '');
    setCategory(entry.category);
    setTitle(entry.title);
    setKeyQuote(entry.key_quote || '');
    setSummary(entry.summary);
    setReflection(entry.reflection || '');
    setRating(entry.rating || 5);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSelectBorrowedBook = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const loanId = e.target.value;
    if (!loanId) return;
    const found = myBorrowedBooks.find(l => l.id === loanId);
    if (found && found.book) {
      setBookTitle(found.book.title);
      setBookAuthor(found.book.author);
      if (found.book.category) {
        const matchedCat = CATEGORIES.find(c => c.toLowerCase().includes(found.book!.category.toLowerCase()));
        if (matchedCat) setCategory(matchedCat);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Judul faedah atau pokok bahasan wajib diisi.');
      return;
    }
    if (!bookTitle.trim()) {
      setFormError('Nama kitab atau buku rujukan wajib diisi.');
      return;
    }
    if (!summary.trim()) {
      setFormError('Rangkuman atau isi faedah wajib diisi.');
      return;
    }

    if (editingId) {
      const updated = updateJournalInStorage(editingId, {
        book_title: bookTitle.trim(),
        book_author: bookAuthor.trim(),
        chapter_or_page: chapterOrPage.trim() || undefined,
        category,
        title: title.trim(),
        key_quote: keyQuote.trim() || undefined,
        summary: summary.trim(),
        reflection: reflection.trim() || undefined,
        rating
      });
      if (updated) {
        setJournals(prev => prev.map(j => j.id === editingId ? updated : j));
      }
    } else {
      const created = addJournalToStorage({
        student_id: student.id,
        student_name: student.name,
        student_nis: student.nis,
        book_title: bookTitle.trim(),
        book_author: bookAuthor.trim() || 'Muallif Kitab',
        chapter_or_page: chapterOrPage.trim() || undefined,
        category,
        title: title.trim(),
        key_quote: keyQuote.trim() || undefined,
        summary: summary.trim(),
        reflection: reflection.trim() || undefined,
        rating
      });
      setJournals(prev => [created, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus catatan faedah kitab ini dari jurnal Anda?')) {
      deleteJournalFromStorage(id);
      setJournals(prev => prev.filter(j => j.id !== id));
      if (viewingDetail?.id === id) setViewingDetail(null);
    }
  };

  const handleCopyQuote = (quoteText: string, id: string) => {
    navigator.clipboard.writeText(quoteText).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5">
            <BookMarked className="w-3 h-3" />
            Jurnal Literasi & Pembacaan Santri
          </span>
          <h3 className="text-xl font-extrabold text-white">Catatan Baca & Faedah Kitab</h3>
          <p className="text-xs text-slate-400 max-w-xl">
            Ikatlah ilmu dengan menulisnya (قَيِّدُوا الْعِلْمَ بِالْكِتَابِ). Catat mutiara kutipan, ringkasan bab, dan faedah ilmiah dari kitab-kitab yang Anda baca.
          </p>
        </div>

        <button
          id="btn-add-journal"
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/60 active:scale-95 shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tulis Faedah Baru</span>
        </button>
      </div>

      {/* Literacy Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">Total Faedah Dicatat</span>
          <div className="text-2xl font-bold text-white">{studentJournals.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Catatan ilmu pribadi</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">Kitab / Buku Diulas</span>
          <div className="text-2xl font-bold text-emerald-300">{uniqueBooksCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Judul referensi berbeda</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">Kutipan / Matan Indah</span>
          <div className="text-2xl font-bold text-teal-300">
            {studentJournals.filter(j => Boolean(j.key_quote)).length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Disertai teks mutiara</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">Poin Apresiasi Literasi</span>
          <div className="text-2xl font-bold text-amber-300">
            {studentJournals.length * 25} XP
          </div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">+25 XP per faedah</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Filter */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua ({studentJournals.length})
          </button>
          {CATEGORIES.slice(0, 4).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari faedah, judul kitab, kutipan..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Journal Cards Feed */}
      {displayedJournals.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
            <PenTool className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-white">Belum Ada Catatan Faedah</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Abadikan mutiara ilmu yang Anda petik dari kitab yang dibaca hari ini. Klik &quot;Tulis Faedah Baru&quot; untuk mencatat rangkuman dan hikmah berharga.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedJournals.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/85 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-5 sm:p-6 backdrop-blur-md transition-all shadow-xl flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Header Category & Rating */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 uppercase tracking-wider border border-emerald-500/20">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < (item.rating || 5)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Note Title */}
                <div>
                  <h4 
                    onClick={() => setViewingDetail(item)}
                    className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors cursor-pointer leading-snug"
                  >
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-slate-200 font-medium truncate">{item.book_title}</span>
                    {item.book_author && <span className="text-slate-400 text-[11px]">• {item.book_author}</span>}
                  </div>
                  {item.chapter_or_page && (
                    <span className="text-[11px] text-teal-300 font-mono block mt-0.5">
                      📖 {item.chapter_or_page}
                    </span>
                  )}
                </div>

                {/* Key Arabic / Quote Box if present */}
                {item.key_quote && (
                  <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-emerald-500/20 relative">
                    <Quote className="w-4 h-4 text-emerald-500/40 absolute top-2.5 right-2.5" />
                    <p className="text-emerald-200 text-xs sm:text-sm font-serif leading-relaxed italic pr-5">
                      &quot;{item.key_quote}&quot;
                    </p>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleCopyQuote(item.key_quote!, item.id)}
                        className="text-[10px] text-slate-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin Kutipan</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Summary Snippet */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {item.summary}
                </p>

                {/* Reflection Tag if any */}
                {item.reflection && (
                  <div className="bg-slate-950/50 rounded-xl p-2.5 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="italic leading-relaxed text-slate-300">
                      <strong>Refleksi Diri:</strong> {item.reflection}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Actions & Date */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(item.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingDetail(item)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Buka Faedah
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Ubah catatan"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Hapus catatan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL FORM TULIS / EDIT FAEDAH BACAAN                                     */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative space-y-5 my-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/30 inline-block">
                Jurnal Ilmiah Santri
              </span>
              <h3 className="text-lg font-bold text-white">
                {editingId ? 'Ubah Catatan Faedah' : 'Tulis Catatan Faedah Baru'}
              </h3>
              <p className="text-xs text-slate-400">
                Dokumentasikan pemahaman, ibrah, dan faedah yang Anda pelajari
              </p>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Optional Quick Selector from Borrowed Books */}
              {myBorrowedBooks.length > 0 && !editingId && (
                <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <label className="block text-emerald-400 font-semibold text-[11px]">
                    ⚡ Pilih Cepat dari Buku Pinjaman Saya:
                  </label>
                  <select
                    onChange={handleSelectBorrowedBook}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Ketik Bebas / Pilih Buku Sedang Dipinjam --</option>
                    {myBorrowedBooks.map(loan => (
                      <option key={loan.id} value={loan.id}>
                        {loan.book?.title} ({loan.book?.author})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Judul Faedah */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Judul Faedah / Pokok Pembahasan <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Hakikat Adab Sebelum Menuntut Ilmu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Book Info Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nama Kitab / Buku Rujukan <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    placeholder="Misal: Ta'limul Muta'allim"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Pengarang / Muallif
                  </label>
                  <input
                    type="text"
                    value={bookAuthor}
                    onChange={(e) => setBookAuthor(e.target.value)}
                    placeholder="Misal: Syaikh Az-Zarnuji"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Bab/Page & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Bab / Halaman
                  </label>
                  <input
                    type="text"
                    value={chapterOrPage}
                    onChange={(e) => setChapterOrPage(e.target.value)}
                    placeholder="Misal: Fashl Thaharah, hal 24-28"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Kategori Ilmu
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Key Quote */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Kutipan Mutiara / Matan Kitab (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={keyQuote}
                  onChange={(e) => setKeyQuote(e.target.value)}
                  placeholder="Kutipan teks Arab atau perkataan berharga dari kitab..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none font-serif"
                />
              </div>

              {/* Summary */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Rangkuman & Faedah Ilmiah <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Uraikan intisari pembahasan dan penjelasan yang Anda pelajari..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                  required
                />
              </div>

              {/* Reflection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Refleksi Diri / Pengamalan (Opsional)
                </label>
                <input
                  type="text"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Bagaimana Anda akan mengamalkan ilmu ini dalam ibadah/keseharian santri..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <span className="text-slate-300 font-semibold">Tingkat Manfaat:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-950 cursor-pointer"
                >
                  {editingId ? 'Simpan Perubahan' : 'Simpan Faedah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DETAIL FAEDAH LENGKAP (FULL READER VIEW)                            */}
      {/* ========================================================================= */}
      {viewingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative space-y-5 my-8">
            <button
              type="button"
              onClick={() => setViewingDetail(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 uppercase tracking-wider">
                {viewingDetail.category}
              </span>
              <h3 className="text-xl font-extrabold text-white leading-snug">
                {viewingDetail.title}
              </h3>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>{viewingDetail.book_title}</span>
                {viewingDetail.book_author && <span>• {viewingDetail.book_author}</span>}
              </div>
              {viewingDetail.chapter_or_page && (
                <span className="text-[11px] text-teal-300 font-mono block">
                  Bab / Hal: {viewingDetail.chapter_or_page}
                </span>
              )}
            </div>

            {viewingDetail.key_quote && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 relative">
                <Quote className="w-5 h-5 text-emerald-500/30 absolute top-3 right-3" />
                <p className="text-sm font-serif italic text-emerald-200 leading-relaxed pr-6">
                  &quot;{viewingDetail.key_quote}&quot;
                </p>
              </div>
            )}

            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-300 block">Rangkuman Faedah Ilmiah:</span>
              <p className="text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                {viewingDetail.summary}
              </p>
            </div>

            {viewingDetail.reflection && (
              <div className="bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-500/20 text-xs space-y-1">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Refleksi & Pengamalan:
                </span>
                <p className="text-slate-300 leading-relaxed italic">
                  {viewingDetail.reflection}
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                Dicatat: {new Date(viewingDetail.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
              <button
                type="button"
                onClick={() => setViewingDetail(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
