import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Layers, 
  BookMarked, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Eye,
  Tag,
  MapPin,
  Bookmark,
  Share2,
  Info
} from 'lucide-react';
import { Book, Student } from '../../types';

interface SantriCatalogTabProps {
  books: Book[];
  student: Student;
  onNavigateWishlist?: () => void;
}

export const SantriCatalogTab: React.FC<SantriCatalogTabProps> = ({
  books,
  student,
  onNavigateWishlist
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState<'all' | 'available' | 'borrowed'>('all');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    books.forEach(b => {
      if (b.category) cats.add(b.category);
    });
    return Array.from(cats);
  }, [books]);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = 
        !searchQuery.trim() ||
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (book.isbn && book.isbn.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (book.publisher && book.publisher.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (book.code && book.code.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedCategory !== 'all' && book.category !== selectedCategory) {
        return false;
      }

      if (selectedAvailability === 'available' && book.available <= 0) {
        return false;
      }

      if (selectedAvailability === 'borrowed' && book.available > 0) {
        return false;
      }

      return true;
    });
  }, [books, searchQuery, selectedCategory, selectedAvailability]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900/40 via-slate-900/90 to-teal-950/40 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Perpustakaan Digital Santri</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Katalog Koleksi Buku & Kitab Kuning
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Telusuri ribuan judul literatur Islam, kitab fiqih, hadits, tafsir, sains, dan karya ulama yang tersedia di perpustakaan.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center shrink-0 min-w-[160px]">
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              {books.length}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">
              Total Judul Terkatalog
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari judul buku, pengarang/mualif, penerbit, kode..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Category Dropdown */}
          <div className="sm:w-56">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="all">Semua Kategori ({books.length})</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setSelectedAvailability('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                selectedAvailability === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setSelectedAvailability('available')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                selectedAvailability === 'available'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tersedia
            </button>
          </div>
        </div>

        {/* Quick Filter Tag Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
          <span className="text-[11px] text-slate-400 font-semibold shrink-0">Filter Populer:</span>
          {categories.slice(0, 6).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(selectedCategory === cat ? 'all' : cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 cursor-pointer transition-all border ${
                selectedCategory === cat
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Book Grid */}
      {filteredBooks.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-400">
            <BookOpen className="w-8 h-8 opacity-60" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Tidak Ada Buku Ditemukan</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Buku yang Anda cari belum terdaftar atau kata kunci tidak sesuai. Ingin mengusulkan buku ini kepada pustakawan?
            </p>
          </div>
          {onNavigateWishlist && (
            <button
              type="button"
              onClick={onNavigateWishlist}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Usulkan Buku / Kitab Ini</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredBooks.map((book) => {
            const isAvailable = book.available > 0;
            return (
              <motion.div
                key={book.id}
                whileHover={{ y: -4, scale: 1.01 }}
                className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 backdrop-blur-md flex flex-col justify-between transition-all duration-200 shadow-lg hover:shadow-emerald-950/30 group"
              >
                <div className="space-y-3">
                  {/* Book cover / placeholder header */}
                  <div className="relative h-36 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/60 border border-slate-800/80 p-3 flex flex-col justify-between overflow-hidden">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900/90 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                        {book.category || 'Kitab / Buku'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                        isAvailable 
                          ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-rose-950/90 text-rose-300 border border-rose-500/40'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {isAvailable ? `Tersedia (${book.available})` : 'Dipinjam'}
                      </span>
                    </div>

                    <div className="text-center py-2">
                      <BookOpen className="w-8 h-8 text-emerald-500/30 mx-auto group-hover:text-emerald-400/60 transition-colors" />
                    </div>

                    {book.rack_location && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Rak: {book.rack_location}</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug">
                      {book.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      Karya: <span className="text-slate-300">{book.author}</span>
                    </p>
                    {book.publisher && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        Penerbit: {book.publisher} {book.year ? `(${book.year})` : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">
                    {book.code || `ID: ${book.id.slice(0, 6)}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedBook(book)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detail</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Book Detail Modal */}
      <AnimatePresence>
        {selectedBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                    {selectedBook.category || 'Kitab'}
                  </span>
                  <h3 className="text-lg font-bold text-white leading-snug">
                    {selectedBook.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pengarang / Mualif: <span className="text-slate-200 font-semibold">{selectedBook.author}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBook(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div>
                  <span className="text-slate-500 block">Penerbit:</span>
                  <span className="text-slate-200 font-medium">{selectedBook.publisher || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tahun Terbit:</span>
                  <span className="text-slate-200 font-medium">{selectedBook.year || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Lokasi Rak:</span>
                  <span className="text-emerald-400 font-mono font-bold">{selectedBook.rack_location || 'Rak Utama'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Stok Tersedia:</span>
                  <span className={`font-bold ${selectedBook.available > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedBook.available} dari {selectedBook.stock} eksemplar
                  </span>
                </div>
                {selectedBook.isbn && (
                  <div className="col-span-2">
                    <span className="text-slate-500 block">ISBN / Barcode:</span>
                    <span className="text-slate-300 font-mono">{selectedBook.isbn}</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center gap-2.5">
                <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Untuk meminjam buku ini, silakan ambil fisik buku di rak dan tap kartu RFID Anda di meja sirkulasi perpustakaan.</span>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedBook(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
