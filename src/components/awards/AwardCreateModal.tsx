import React, { useState } from 'react';
import { 
  Trophy, 
  X, 
  User, 
  Gift, 
  Calendar, 
  FileText, 
  Sparkles, 
  Check, 
  Search,
  MessageSquare
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { LiteracyAward, Student } from '../../types';

interface AwardCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudentId?: string;
}

export const AwardCreateModal: React.FC<AwardCreateModalProps> = ({
  isOpen,
  onClose,
  initialStudentId
}) => {
  const { students, addAward, sendAwardWhatsAppCongrats } = useLibrary();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [title, setTitle] = useState('Juara 1 Santri Paling Rajin Membaca (Bintang Pustaka)');
  const [period, setPeriod] = useState('Agustus 2026');
  const [category, setCategory] = useState<LiteracyAward['category']>('top_reader');
  const [rewardItem, setRewardItem] = useState('Kitab Fathul Qorib Syarah + Voucher Koperasi Rp 50.000');
  const [notes, setNotes] = useState('Dianugerahkan atas kedisiplinan dan capaian jam membaca tertinggi di perpustakaan.');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nis.includes(searchQuery) ||
    s.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert('Pilih santri yang akan menerima penghargaan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const year = new Date().getFullYear();
      const monthRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][new Date().getMonth()];
      const randomNum = Math.floor(100 + Math.random() * 900);
      const certificateNo = `DL-${year}/${monthRoman}/${randomNum}`;

      const newAward = addAward({
        student_id: selectedStudentId,
        title,
        period,
        category,
        certificate_no: certificateNo,
        reward_item: rewardItem,
        notes
      });

      if (sendWhatsApp) {
        await sendAwardWhatsAppCongrats(newAward.id);
      }

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/20">
              <Trophy className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Anugerahkan Penghargaan Santri</h3>
              <p className="text-xs text-amber-100">Penetapan Piagam & Reward Literasi Pesantren</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800 dark:text-slate-200">
          
          {/* Step 1: Select Student */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Pilih Santri Penerima Penghargaan *
            </label>
            
            {selectedStudent ? (
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedStudent.photo_url}
                    alt={selectedStudent.name}
                    className="w-10 h-10 rounded-full object-cover border border-amber-300"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{selectedStudent.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      NIS: {selectedStudent.nis} &bull; Kelas: {selectedStudent.class} &bull; WA: {selectedStudent.phone || '-'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudentId('')}
                  className="px-2.5 py-1 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 rounded-lg transition-colors font-medium"
                >
                  Ganti
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari santri berdasarkan nama, NIS, atau kelas..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
                  {filteredStudents.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-3">Santri tidak ditemukan.</p>
                  ) : (
                    filteredStudents.map(std => (
                      <button
                        key={std.id}
                        type="button"
                        onClick={() => setSelectedStudentId(std.id)}
                        className="w-full flex items-center justify-between p-2 rounded hover:bg-amber-50 dark:hover:bg-slate-800 text-left transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <img src={std.photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                          <div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{std.name}</p>
                            <p className="text-[10px] text-slate-400">NIS: {std.nis} | Kelas: {std.class}</p>
                          </div>
                        </div>
                        <span className="text-xs text-amber-600 font-medium">Pilih</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Award Category & Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Kategori Penghargaan
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as LiteracyAward['category'];
                  setCategory(cat);
                  if (cat === 'top_reader') setTitle('Juara 1 Santri Paling Rajin Membaca (Bintang Pustaka)');
                  if (cat === 'top_borrower') setTitle('Juara 1 Kolektor & Pengkaji Kitab Turats');
                  if (cat === 'discipline_star') setTitle('Bintang Disiplin & Pengembalian Amanah Buku');
                  if (cat === 'special_honor') setTitle('Duta Literasi Perpustakaan Pesantren');
                }}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="top_reader">🌟 Pembaca Terajin (Top Visitor/Reader)</option>
                <option value="top_borrower">📚 Peminjam & Pengkaji Kitab Terbanyak</option>
                <option value="discipline_star">🛡️ Bintang Disiplin Tepat Waktu</option>
                <option value="special_honor">👑 Duta Literasi Pesantren (Penghargaan Khusus)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Periode Penghargaan
              </label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="Contoh: Agustus 2026 atau Semester Ganjil 2026"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          {/* Title of the Award */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Judul Piagam Penghargaan *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
              required
            />
          </div>

          {/* Reward Item / Hadiah */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Hadiah / Reward Apresiasi Santri
            </label>
            <input
              type="text"
              value={rewardItem}
              onChange={(e) => setRewardItem(e.target.value)}
              placeholder="Contoh: Kitab Kuning Fathul Qorib + Voucher Belanja Koperasi Rp 50.000"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Notes / Reason */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Catatan Apresiasi / Alasan Pemilihan
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* WhatsApp Notification Toggle */}
          <label className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 cursor-pointer">
            <input
              type="checkbox"
              checked={sendWhatsApp}
              onChange={(e) => setSendWhatsApp(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <div className="flex-1">
              <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                Kirim Notifikasi Apresiasi via WhatsApp
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Otomatis kirim pesan tahniah & selamat ke nomor santri/wali santri saat disimpan.
              </p>
            </div>
            <MessageSquare className="w-5 h-5 text-emerald-600" />
          </label>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedStudentId}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors shadow disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isSubmitting ? 'Memproses...' : 'Terbitkan Piagam'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
