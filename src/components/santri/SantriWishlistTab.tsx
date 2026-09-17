import React, { useState, useMemo } from 'react';
import { 
  BookPlus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  ShoppingBag, 
  Library, 
  XCircle, 
  AlertCircle, 
  Plus, 
  X, 
  Sparkles, 
  Info, 
  Trash2,
  Bookmark,
  Calendar
} from 'lucide-react';
import { Student, BookWishlist, WishlistStatus, WishlistUrgency } from '../../types';
import { useLibrary } from '../../context/LibraryContext';

interface SantriWishlistTabProps {
  student: Student;
}

const CATEGORIES = [
  'Fikih & Ushul',
  'Hadits & Musthalah',
  'Tafsir & Ulumul Qur\'an',
  'Bahasa Arab & Nahwu',
  'Akidah & Tauhid',
  'Tasawuf & Akhlak',
  'Sejarah Islam & Tarikh',
  'Buku Pelajaran & Kurikulum',
  'Sains & Umum',
  'Kamus & Ensiklopedia',
  'Novel & Sastra Islami'
];

export const SantriWishlistTab: React.FC<SantriWishlistTabProps> = ({ student }) => {
  const { wishlists, addWishlist, deleteWishlist } = useLibrary();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | WishlistStatus>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [urgency, setUrgency] = useState<WishlistUrgency>('penting');
  const [estimatedVolume, setEstimatedVolume] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Student specific or matching wishlist items
  const studentWishlists = useMemo(() => {
    return wishlists.filter(w => 
      w.student_id === student.id || 
      (w.student_nis && student.nis && w.student_nis === student.nis)
    );
  }, [wishlists, student.id, student.nis]);

  // Filtered by search & status
  const displayedWishlists = useMemo(() => {
    return studentWishlists.filter(item => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.author.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.reason.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [studentWishlists, statusFilter, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Judul buku atau kitab wajib diisi.');
      return;
    }
    if (!author.trim()) {
      setFormError('Nama pengarang / muallif wajib diisi.');
      return;
    }
    if (!reason.trim()) {
      setFormError('Alasan kebutuhan buku wajib diisi untuk pertimbangan pustakawan.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addWishlist({
        student_id: student.id,
        student_name: student.name,
        student_nis: student.nis,
        student_class: student.class,
        title: title.trim(),
        author: author.trim(),
        publisher: publisher.trim() || undefined,
        category,
        urgency,
        estimated_volume: estimatedVolume.trim() || undefined,
        reason: reason.trim()
      });

      // Reset Form
      setTitle('');
      setAuthor('');
      setPublisher('');
      setCategory(CATEGORIES[0]);
      setUrgency('penting');
      setEstimatedVolume('');
      setReason('');
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Gagal mengirim usulan ke database');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus usulan buku ini dari database?')) {
      await deleteWishlist(id);
    }
  };

  const getStatusBadge = (status: WishlistStatus) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          text: 'Menunggu Review'
        };
      case 'approved':
        return {
          icon: CheckCircle2,
          color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          text: 'Disetujui Pengadaan'
        };
      case 'purchased':
        return {
          icon: ShoppingBag,
          color: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
          text: 'Dalam Proses Pembelian'
        };
      case 'available':
        return {
          icon: Library,
          color: 'bg-teal-500/20 text-teal-300 border-teal-500/40 font-bold',
          text: 'Tersedia di Rak'
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          text: 'Belum Disetujui'
        };
      default:
        return {
          icon: Clock,
          color: 'bg-slate-800 text-slate-300 border-slate-700',
          text: status
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            Kotak Aspirasi Literasi Santri
          </span>
          <h3 className="text-xl font-extrabold text-white">Usulan Buku & Kitab Baru</h3>
          <p className="text-xs text-slate-400 max-w-xl">
            Ajukan kitab kuning, kamus, atau buku referensi yang Anda butuhkan untuk pengajian, halaqah, riset, atau tugas madrasah.
          </p>
        </div>

        <button
          id="btn-add-wishlist"
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/60 active:scale-95 shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ajukan Usulan Baru</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">Total Usulan Saya</span>
          <div className="text-2xl font-bold text-white">{studentWishlists.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Judul buku / kitab</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">Menunggu Review</span>
          <div className="text-2xl font-bold text-amber-300">
            {studentWishlists.filter(w => w.status === 'pending').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Dalam penelaahan pustakawan</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">Disetujui / Proses</span>
          <div className="text-2xl font-bold text-blue-300">
            {studentWishlists.filter(w => w.status === 'approved' || w.status === 'purchased').length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Masuk pengadaan berkala</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">Tersedia di Rak</span>
          <div className="text-2xl font-bold text-teal-300">
            {studentWishlists.filter(w => w.status === 'available').length}
          </div>
          <div className="text-[10px] text-teal-400/80 mt-0.5">Sudah siap dipinjam</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua ({studentWishlists.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'pending'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Menunggu ({studentWishlists.filter(w => w.status === 'pending').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'approved'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Disetujui ({studentWishlists.filter(w => w.status === 'approved').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('available')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'available'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tersedia di Rak ({studentWishlists.filter(w => w.status === 'available').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul, muallif, kategori..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Wishlist List Cards */}
      {displayedWishlists.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
            <BookPlus className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-white">Belum Ada Usulan Buku</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Belum menemukan kitab atau buku yang Anda cari di rak perpustakaan? Klik tombol &quot;Ajukan Usulan Baru&quot; di atas untuk mengusulkannya kepada pustakawan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedWishlists.map((item) => {
            const statusInfo = getStatusBadge(item.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={item.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 backdrop-blur-md transition-all shadow-lg flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  {/* Category & Status Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusInfo.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.text}
                    </span>
                  </div>

                  {/* Title & Author */}
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pengarang / Muallif: <span className="text-slate-200 font-medium">{item.author}</span>
                      {item.publisher && <span> • Penerbit: {item.publisher}</span>}
                    </p>
                    {item.estimated_volume && (
                      <span className="text-[11px] text-teal-300 font-mono block mt-0.5">
                        Spesifikasi: {item.estimated_volume}
                      </span>
                    )}
                  </div>

                  {/* Reason Quote Box */}
                  <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 text-xs space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold block">Alasan Kebutuhan Belajar:</span>
                    <p className="text-slate-300 leading-relaxed italic">
                      &quot;{item.reason}&quot;
                    </p>
                  </div>

                  {/* Staff Response Note if any */}
                  {item.staff_notes && (
                    <div className="bg-emerald-950/40 rounded-xl p-3 border border-emerald-500/30 text-xs space-y-1">
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Catatan Tanggapan Petugas:
                      </span>
                      <p className="text-emerald-200/90 leading-relaxed">
                        {item.staff_notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Meta */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Diusulkan: {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  {item.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Batalkan usulan ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Card: Kriteria Pengadaan Kitab */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-xs text-slate-400">
        <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-200 block">Proses Verifikasi Usulan Santri</span>
          <p className="leading-relaxed">
            Setiap usulan buku dan kitab yang masuk akan ditinjau berkala oleh komite perpustakaan bersama dewan asatidz. Kitab-kitab yang menunjang silabus kajian turats dan riset santri akan diprioritaskan dalam anggaran belanja buku bulanan.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL PENGAJUAN USULAN BUKU / KITAB BARU                                   */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative space-y-5 my-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 inline-block">
                Formulir Usulan Santri
              </span>
              <h3 className="text-lg font-bold text-white">Ajukan Buku / Kitab Baru</h3>
              <p className="text-xs text-slate-400">
                Isi data buku atau kitab yang Anda harapkan hadir di perpustakaan
              </p>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Judul Lengkap Buku / Kitab <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Fathul Bari Syarah Shahih Bukhari (Tahqiq Syaikh Bin Baz)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Pengarang / Muallif <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Misal: Ibnu Hajar Al-Asqalani"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Penerbit / Maktabah (Opsional)
                  </label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="Misal: Darul Kutub Ilmiyyah / Toha Putra"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Kategori Keilmuan
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

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Tingkat Kebutuhan
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as WishlistUrgency)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="biasa">Biasa (Bacaan Tambahan)</option>
                    <option value="penting">Penting (Rujukan Halaqah / Ujian)</option>
                    <option value="sangat_mendesak">Sangat Mendesak (Kitab Wajib Pelajaran)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Estimasi Jilid / Spesifikasi (Opsional)
                </label>
                <input
                  type="text"
                  value={estimatedVolume}
                  onChange={(e) => setEstimatedVolume(e.target.value)}
                  placeholder="Misal: 3 Jilid Hardcover / Edisi Terjemah Indonesia"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Alasan Kebutuhan Belajar <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Jelaskan alasan mengapa kitab ini perlu ada di perpustakaan..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                  required
                />
              </div>

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
                  Kirim Usulan Buku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
