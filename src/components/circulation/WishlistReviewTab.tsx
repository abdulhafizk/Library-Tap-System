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
  User, 
  Calendar, 
  MessageSquare, 
  PlusCircle, 
  Trash2, 
  Check, 
  X, 
  FileSpreadsheet, 
  ExternalLink,
  Sparkles,
  BookOpen,
  ArrowRight,
  Copy,
  Database,
  RefreshCw
} from 'lucide-react';
import { BookWishlist, WishlistStatus, WishlistUrgency, Book } from '../../types';
import { useLibrary } from '../../context/LibraryContext';

interface WishlistReviewTabProps {
  onOpenBookCatalogModal?: (initialData: Partial<Book>) => void;
}

export const WishlistReviewTab: React.FC<WishlistReviewTabProps> = ({
  onOpenBookCatalogModal
}) => {
  const { 
    wishlists, 
    updateWishlist, 
    deleteWishlist, 
    isSupabaseSyncing, 
    pullFromSupabase,
    isRealtimeConnected,
    bookWishlistsSql,
    isWishlistTableAvailable,
    checkTableAvailability
  } = useLibrary();

  const [copiedSql, setCopiedSql] = useState(false);
  const [isCheckingTable, setIsCheckingTable] = useState(false);
  const [dismissNotice, setDismissNotice] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | WishlistStatus>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | WishlistUrgency>('all');

  // Review & Response Modal State
  const [selectedItemForReview, setSelectedItemForReview] = useState<BookWishlist | null>(null);
  const [reviewStatus, setReviewStatus] = useState<WishlistStatus>('approved');
  const [staffNoteInput, setStaffNoteInput] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Metrics
  const stats = useMemo(() => {
    const total = wishlists.length;
    const pending = wishlists.filter(w => w.status === 'pending').length;
    const approved = wishlists.filter(w => w.status === 'approved').length;
    const purchased = wishlists.filter(w => w.status === 'purchased').length;
    const available = wishlists.filter(w => w.status === 'available').length;
    const rejected = wishlists.filter(w => w.status === 'rejected').length;
    return { total, pending, approved, purchased, available, rejected };
  }, [wishlists]);

  // Filtered list
  const filteredWishlists = useMemo(() => {
    return wishlists.filter(item => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (urgencyFilter !== 'all' && item.urgency !== urgencyFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.author.toLowerCase().includes(q) ||
          item.student_name.toLowerCase().includes(q) ||
          item.student_nis.toLowerCase().includes(q) ||
          (item.student_class && item.student_class.toLowerCase().includes(q)) ||
          item.category.toLowerCase().includes(q) ||
          item.reason.toLowerCase().includes(q) ||
          (item.staff_notes && item.staff_notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [wishlists, statusFilter, urgencyFilter, searchQuery]);

  // Open review modal
  const handleOpenReviewModal = (item: BookWishlist) => {
    setSelectedItemForReview(item);
    setReviewStatus(item.status);
    setStaffNoteInput(item.staff_notes || '');
  };

  // Save review / approval
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForReview) return;
    setIsSubmittingReview(true);

    try {
      await updateWishlist(selectedItemForReview.id, {
        status: reviewStatus,
        staff_notes: staffNoteInput.trim() || undefined
      });
      setSelectedItemForReview(null);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Quick 1-click status updater
  const handleQuickStatusUpdate = async (id: string, newStatus: WishlistStatus, defaultNote?: string) => {
    const item = wishlists.find(w => w.id === id);
    if (!item) return;

    await updateWishlist(id, {
      status: newStatus,
      staff_notes: defaultNote || item.staff_notes
    });
  };

  // Delete wishlist
  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus usulan "${title}" dari database?`)) {
      await deleteWishlist(id);
    }
  };

  // Convert wishlist item to catalog book
  const handleTransferToCatalog = (item: BookWishlist) => {
    if (onOpenBookCatalogModal) {
      onOpenBookCatalogModal({
        title: item.title,
        author: item.author,
        publisher: item.publisher || '',
        category: item.category,
        description: `Pengadaan dari usulan santri ${item.student_name} (${item.student_nis}). Alasan: ${item.reason}`
      });
    }
  };

  // Export Procurement CSV
  const handleExportCsv = () => {
    const rows = [
      ['No', 'Judul Kitab/Buku', 'Pengarang/Muallif', 'Penerbit/Maktabah', 'Kategori', 'Volume/Spesifikasi', 'Santri Pengusul', 'NIS', 'Kelas/Kamar', 'Tingkat Kebutuhan', 'Status', 'Catatan Pustakawan', 'Tgl Usulan'].join(',')
    ];

    filteredWishlists.forEach((item, index) => {
      rows.push([
        index + 1,
        `"${item.title.replace(/"/g, '""')}"`,
        `"${item.author.replace(/"/g, '""')}"`,
        `"${(item.publisher || '-').replace(/"/g, '""')}"`,
        `"${item.category.replace(/"/g, '""')}"`,
        `"${(item.estimated_volume || '-').replace(/"/g, '""')}"`,
        `"${item.student_name.replace(/"/g, '""')}"`,
        `"${item.student_nis}"`,
        `"${(item.student_class || '-').replace(/"/g, '""')}"`,
        `"${item.urgency}"`,
        `"${item.status}"`,
        `"${(item.staff_notes || '-').replace(/"/g, '""')}"`,
        `"${new Date(item.created_at).toLocaleDateString('id-ID')}"`
      ].join(','));
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `daftar_pengadaan_kitab_santri_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper status badge styling
  const renderStatusBadge = (status: WishlistStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40">
            <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Menunggu Review</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Disetujui Pengadaan</span>
          </span>
        );
      case 'purchased':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300/40">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Dalam Pemesanan</span>
          </span>
        );
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
            <Library className="w-3.5 h-3.5" />
            <span>Tersedia di Perpustakaan</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300/40">
            <XCircle className="w-3.5 h-3.5" />
            <span>Belum Disetujui</span>
          </span>
        );
    }
  };

  const renderUrgencyBadge = (urgency: WishlistUrgency) => {
    switch (urgency) {
      case 'sangat_mendesak':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            Sangat Mendesak
          </span>
        );
      case 'penting':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
            Penting
          </span>
        );
      case 'biasa':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Biasa
          </span>
        );
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(bookWishlistsSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleRecheckTable = async () => {
    setIsCheckingTable(true);
    try {
      const res = await checkTableAvailability();
      if (res.wishlists) {
        await pullFromSupabase();
      }
    } finally {
      setIsCheckingTable(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Missing table migration banner if public.book_wishlists is not yet in Supabase */}
      {isWishlistTableAvailable === false && !dismissNotice && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Database className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <span>Tabel Supabase Cloud</span>
                <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono text-[11px] text-amber-800 dark:text-amber-300">public.book_wishlists</code>
                <span>Belum Dibuat</span>
              </p>
              <p className="text-amber-700/90 dark:text-amber-300/80 leading-relaxed">
                Semua usulan dan perubahan status tetap aktif & tersimpan aman di penyimpanan lokal browser. Salin skrip SQL di bawah dan jalankan di <strong>Supabase Dashboard &gt; SQL Editor</strong> untuk mengaktifkan sinkronisasi cloud.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              type="button"
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Tersalin!' : 'Salin Skrip SQL'}</span>
            </button>
            <button
              type="button"
              onClick={handleRecheckTable}
              disabled={isCheckingTable}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-slate-700 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingTable ? 'animate-spin' : ''}`} />
              <span>{isCheckingTable ? 'Mengecek...' : 'Cek Status'}</span>
            </button>
            <button
              type="button"
              onClick={() => setDismissNotice(true)}
              className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-200/50 dark:hover:bg-amber-900/40 rounded-lg transition-colors cursor-pointer"
              title="Tutup pemberitahuan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Usulan</span>
            <BookPlus className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.total}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Semua aspirasi santri</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Perlu Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {stats.pending}
          </div>
          <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">Menunggu respon ustadz</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('approved')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'approved'
              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Disetujui</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {stats.approved}
          </div>
          <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">Daftar pengadaan</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('purchased')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'purchased'
              ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 ring-2 ring-purple-500/20 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Pemesanan</span>
            <ShoppingBag className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {stats.purchased}
          </div>
          <p className="text-[10px] text-purple-600/80 dark:text-purple-400/80 mt-0.5">Sedang dibeli/distributor</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('available')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            statusFilter === 'available'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Sudah di Rak</span>
            <Library className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.available}
          </div>
          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Siap dipinjam santri</p>
        </button>
      </div>

      {/* Action & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-wishlist-staff"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul kitab, muallif, santri, atau alasan..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Status */}
          <select
            id="filter-status-wishlist-staff"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status Usulan</option>
            <option value="pending">⏳ Menunggu Review ({stats.pending})</option>
            <option value="approved">✅ Disetujui Pengadaan ({stats.approved})</option>
            <option value="purchased">🛒 Dalam Pemesanan ({stats.purchased})</option>
            <option value="available">📚 Tersedia di Rak ({stats.available})</option>
            <option value="rejected">❌ Belum Disetujui ({stats.rejected})</option>
          </select>

          {/* Filter Urgensi */}
          <select
            id="filter-urgency-wishlist-staff"
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Kebutuhan</option>
            <option value="sangat_mendesak">🔥 Sangat Mendesak</option>
            <option value="penting">⭐ Penting</option>
            <option value="biasa">📘 Biasa</option>
          </select>
        </div>

        {/* Action: Export CSV Daftar Pengadaan */}
        <button
          id="btn-export-procurement-csv"
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer shrink-0"
          title="Ekspor daftar buku yang diusulkan santri untuk nota pengadaan"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Ekspor Daftar Belanja (CSV)</span>
        </button>
      </div>

      {/* Items List */}
      {filteredWishlists.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
            <BookPlus className="w-8 h-8 opacity-70" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Tidak ada usulan buku yang cocok
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchQuery || statusFilter !== 'all' || urgencyFilter !== 'all'
              ? 'Coba ubah kata kunci pencarian atau sesuaikan opsi filter status/urgensi.'
              : 'Belum ada santri yang mengajukan usulan buku atau kitab baru saat ini.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredWishlists.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-400/50 rounded-2xl p-5 shadow-xs transition-all space-y-4"
            >
              {/* Top Meta Bar */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {renderStatusBadge(item.status)}
                    {renderUrgencyBadge(item.urgency)}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {item.category}
                    </span>
                    {item.estimated_volume && (
                      <span className="text-[11px] text-slate-500 font-medium">
                        • {item.estimated_volume}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pt-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Karya / Muallif: <span className="font-semibold text-blue-600 dark:text-blue-400">{item.author}</span>
                    {item.publisher && (
                      <span className="text-slate-400 font-normal"> (Penerbit: {item.publisher})</span>
                    )}
                  </p>
                </div>

                {/* Quick Action Buttons for Ustadz/Staff */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Review & Add Note Button */}
                  <button
                    id={`btn-review-wishlist-${item.id}`}
                    type="button"
                    onClick={() => handleOpenReviewModal(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Review & Putuskan</span>
                  </button>

                  {/* Add Directly to Catalog */}
                  {onOpenBookCatalogModal && (
                    <button
                      id={`btn-catalog-wishlist-${item.id}`}
                      type="button"
                      onClick={() => handleTransferToCatalog(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                      title="Salin judul kitab ini ke formulir input buku perpustakaan"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Input ke Katalog</span>
                    </button>
                  )}

                  {/* Delete option */}
                  <button
                    id={`btn-delete-wishlist-${item.id}`}
                    type="button"
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    title="Hapus Usulan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Santri info & Reason */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                {/* Santri info */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>Santri Pengusul: {item.student_name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
                    <span>NIS: {item.student_nis}</span>
                    {item.student_class && <span>• {item.student_class}</span>}
                    <span>• {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Reason */}
                <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-xl p-3 text-xs space-y-1 border border-amber-200/40 dark:border-amber-900/40">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Alasan Kebutuhan Santri:</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    "{item.reason}"
                  </p>
                </div>
              </div>

              {/* Staff Notes / Response if exists */}
              {item.staff_notes ? (
                <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 rounded-xl p-3 flex items-start gap-2.5">
                  <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <div className="font-bold text-blue-900 dark:text-blue-200">
                      Tanggapan / Catatan Pustakawan:
                    </div>
                    <p className="text-blue-800/90 dark:text-blue-300/90 leading-relaxed">
                      {item.staff_notes}
                    </p>
                    {item.updated_at && (
                      <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 pt-0.5">
                        Diperbarui: {new Date(item.updated_at).toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Belum ada catatan pustakawan yang dilampirkan.</span>
                  <button
                    type="button"
                    onClick={() => handleOpenReviewModal(item)}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-xs flex items-center gap-1 cursor-pointer"
                  >
                    + Berikan Catatan & Status
                  </button>
                </div>
              )}

              {/* Quick Approval Pill Strip */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="text-slate-400 text-[11px] font-medium">Ubah Cepat Status:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleQuickStatusUpdate(item.id, 'approved', 'Usulan disetujui untuk pengadaan.')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      item.status === 'approved' 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-950'
                    }`}
                  >
                    ✓ Setujui
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickStatusUpdate(item.id, 'purchased', 'Kitab dalam proses pemesanan ke distributor/penerbit.')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      item.status === 'purchased' 
                        ? 'bg-purple-600 text-white shadow-xs' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-950'
                    }`}
                  >
                    🛍️ Dipesan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickStatusUpdate(item.id, 'available', 'Kitab sudah tiba dan tersedia di rak perpustakaan. Silakan dipinjam!')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      item.status === 'available' 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950'
                    }`}
                  >
                    📚 Tersedia di Rak
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickStatusUpdate(item.id, 'rejected', 'Mohon maaf usulan belum dapat dipenuhi saat ini.')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      item.status === 'rejected' 
                        ? 'bg-rose-600 text-white shadow-xs' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-950'
                    }`}
                  >
                    ✕ Tolak
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review & Approval Modal Dialog */}
      {selectedItemForReview && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <BookPlus className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Keputusan Review Usulan Buku
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForReview(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Book & Santri Brief */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 space-y-1 text-xs border border-slate-100 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {selectedItemForReview.title}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Pengarang: <span className="font-semibold">{selectedItemForReview.author}</span> • Kategori: {selectedItemForReview.category}
              </p>
              <p className="text-slate-500 dark:text-slate-400 pt-1">
                Diusulkan oleh: <span className="font-medium text-slate-800 dark:text-slate-200">{selectedItemForReview.student_name}</span> ({selectedItemForReview.student_nis})
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveReview} className="space-y-4 text-xs">
              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Pilih Status Keputusan:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label 
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      reviewStatus === 'approved'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 font-bold text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reviewStatus"
                      value="approved"
                      checked={reviewStatus === 'approved'}
                      onChange={() => setReviewStatus('approved')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>✅ Disetujui Pengadaan</span>
                  </label>

                  <label 
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      reviewStatus === 'purchased'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/50 font-bold text-purple-700 dark:text-purple-300'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reviewStatus"
                      value="purchased"
                      checked={reviewStatus === 'purchased'}
                      onChange={() => setReviewStatus('purchased')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>🛍️ Sedang Dipesan / Beli</span>
                  </label>

                  <label 
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      reviewStatus === 'available'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 font-bold text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reviewStatus"
                      value="available"
                      checked={reviewStatus === 'available'}
                      onChange={() => setReviewStatus('available')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>📚 Tersedia di Rak</span>
                  </label>

                  <label 
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      reviewStatus === 'rejected'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 font-bold text-rose-700 dark:text-rose-300'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reviewStatus"
                      value="rejected"
                      checked={reviewStatus === 'rejected'}
                      onChange={() => setReviewStatus('rejected')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>❌ Belum / Tidak Disetujui</span>
                  </label>
                </div>
              </div>

              {/* Staff Notes */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Tanggapan / Catatan Pustakawan untuk Santri:
                </label>
                <textarea
                  id="textarea-staff-notes"
                  rows={3}
                  value={staffNoteInput}
                  onChange={(e) => setStaffNoteInput(e.target.value)}
                  placeholder="Contoh: 'Usulan disetujui, sedang dipesan dari distributor Darul Fikr, perkiraan tiba pertengahan bulan ini.'"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
                <p className="text-[11px] text-slate-400">
                  Catatan ini akan langsung terbaca oleh santri pada tab Usulan Buku di akun mereka.
                </p>
              </div>

              {/* Preset quick response suggestions */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400">Template Jawaban Cepat:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setStaffNoteInput('Usulan disetujui dan telah dimasukkan ke dalam daftar pengadaan kitab semester ini.')}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                  >
                    + Disetujui Masuk Belanja
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffNoteInput('Kitab sudah dalam perjalanan ekspedisi pemesanan penerbit.')}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                  >
                    + Sedang Dikirim
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffNoteInput('Kitab sudah tersedia di rak perpustakaan. Silakan hubungi ustadz untuk peminjaman.')}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                  >
                    + Sudah Ada di Rak
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedItemForReview(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Keputusan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
