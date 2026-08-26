import React, { useState, useEffect } from 'react';
import { X, BookPlus, BookOpen, Layers, MapPin, Hash, User, Calendar, FileText, Camera, Barcode, Check } from 'lucide-react';
import { Book } from '../../types';
import { useLibrary } from '../../context/LibraryContext';
import { CameraScannerModal } from '../common/CameraScannerModal';
import { soundManager } from '../../utils/audio';

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editBook?: Book | null;
}

const CATEGORIES = [
  'Kitab Kuning / Turats',
  'Fiqih & Ushul Fiqih',
  'Hadits & Ulumul Hadits',
  'Tafsir & Al-Qur\'an',
  'Aqidah & Akhlaq',
  'Bahasa Arab & Nahwu Sharaf',
  'Tarikh & Sejarah Islam',
  'Sains & Pengetahuan Umum',
  'Pelajaran Madrasah / Kemenag',
  'Koleksi Referensi & Kamus'
];

export const BookFormModal: React.FC<BookFormModalProps> = ({
  isOpen,
  onClose,
  editBook
}) => {
  const { addBook, updateBook } = useLibrary();

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    author: '',
    publisher: '',
    category: CATEGORIES[0],
    isbn: '',
    publish_year: new Date().getFullYear(),
    shelf_location: 'Rak A-01',
    total_stock: 3,
    available_stock: 3,
    description: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (editBook) {
      setFormData({
        code: editBook.code,
        title: editBook.title,
        author: editBook.author,
        publisher: editBook.publisher || '',
        category: editBook.category,
        isbn: editBook.isbn || '',
        publish_year: editBook.publish_year || new Date().getFullYear(),
        shelf_location: editBook.shelf_location || 'Rak A-01',
        total_stock: editBook.total_stock,
        available_stock: editBook.available_stock,
        description: editBook.description || ''
      });
    } else {
      const randomCodeNum = Math.floor(100 + Math.random() * 900);
      setFormData({
        code: `KTB-${randomCodeNum}`,
        title: '',
        author: '',
        publisher: '',
        category: CATEGORIES[0],
        isbn: '',
        publish_year: new Date().getFullYear(),
        shelf_location: 'Rak A-01',
        total_stock: 3,
        available_stock: 3,
        description: ''
      });
    }
    setErrors({});
    setScannedFeedback(null);
  }, [editBook, isOpen]);

  const handleCameraScanCode = (scanned: string) => {
    const clean = scanned.trim();
    if (!clean) return;

    soundManager.playSuccess();
    setFormData(prev => {
      const isIsbnLike = /^\d{9,13}[\dX]?$/i.test(clean.replace(/[-\s]/g, ''));
      return {
        ...prev,
        code: clean.toUpperCase(),
        isbn: isIsbnLike && !prev.isbn ? clean : prev.isbn
      };
    });

    setScannedFeedback(`Kode "${clean}" berhasil discan dari kamera!`);
    setTimeout(() => setScannedFeedback(null), 4000);
  };

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.code.trim()) errs.code = 'Kode buku wajib diisi.';
    if (!formData.title.trim()) errs.title = 'Judul buku / kitab wajib diisi.';
    if (!formData.author.trim()) errs.author = 'Pengarang wajib diisi.';
    if (formData.total_stock < 1) errs.total_stock = 'Total stok minimal 1 eksemplar.';
    if (formData.available_stock > formData.total_stock) errs.available_stock = 'Stok tersedia tidak boleh melebihi total stok.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (editBook) {
      updateBook(editBook.id, formData);
    } else {
      addBook(formData);
    }
    onClose();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] cursor-default"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
              <BookPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">{editBook ? 'Edit Data Buku / Kitab' : 'Tambah Buku / Kitab Baru'}</h3>
              <p className="text-xs text-blue-100">Katalog koleksi perpustakaan & inventaris fisik</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-800 dark:text-slate-200">
          {scannedFeedback && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-800 dark:text-emerald-200 flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{scannedFeedback}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Code */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Kode Buku / Kitab <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCameraScannerOpen(true)}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Scan Kamera
                </button>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Contoh: KTB-001 / FIQ-104"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsCameraScannerOpen(true)}
                  className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors flex items-center gap-1 shrink-0"
                  title="Buka Kamera untuk scan Barcode / QR buku"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              {errors.code && <p className="text-[11px] text-rose-500 mt-1">{errors.code}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kategori / Klasifikasi
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Judul Buku / Nama Kitab <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Contoh: Fathul Qorib Al-Mujib / Riyadhus Shalihin"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
          </div>

          {/* Author & Publisher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pengarang / Mu'allif <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Contoh: Syaikh Muhammad bin Qasim Al-Ghazi"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {errors.author && <p className="text-[11px] text-rose-500 mt-1">{errors.author}</p>}
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Penerbit / Maktabah
              </label>
              <input
                type="text"
                placeholder="Contoh: Darul Kutub Al-Ilmiyyah / Toha Putra"
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Shelf & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Lokasi Rak
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Contoh: Rak A-02"
                  value={formData.shelf_location}
                  onChange={(e) => setFormData({ ...formData, shelf_location: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Total Stok (Eksemplar)
              </label>
              <input
                type="number"
                min="1"
                value={formData.total_stock}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  setFormData(prev => ({
                    ...prev,
                    total_stock: val,
                    available_stock: editBook ? Math.min(val, prev.available_stock) : val
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {errors.total_stock && <p className="text-[11px] text-rose-500 mt-1">{errors.total_stock}</p>}
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Stok Tersedia
              </label>
              <input
                type="number"
                min="0"
                max={formData.total_stock}
                value={formData.available_stock}
                onChange={(e) => setFormData({ ...formData, available_stock: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {errors.available_stock && <p className="text-[11px] text-rose-500 mt-1">{errors.available_stock}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Ringkasan / Catatan Kitab (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Deskripsi materi atau jilid kitab..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>

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
            onClick={handleSubmit}
            id="btn-save-book"
            className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            {editBook ? 'Simpan Perubahan' : 'Tambah ke Katalog'}
          </button>
        </div>
      </div>

      {/* Camera Barcode / QR Scanner for Book Code */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={handleCameraScanCode}
        title="Scan Barcode / QR Kode Kitab"
        description="Arahkan kamera ke Barcode ISBN atau QR Code pada sampul buku"
        placeholder="Ketik kode buku / ISBN manual..."
      />
    </div>
  );
};
