import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  UserCheck, 
  UserX, 
  Power, 
  Trash2, 
  Radio, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Link2,
  Unlink,
  QrCode,
  Sparkles,
  Printer,
  Eye,
  User
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { RfidCard, CardStatus, Student } from '../../types';
import { QrCardGeneratorModal } from './QrCardGeneratorModal';
import { QrCardViewModal } from './QrCardViewModal';

export const CardsPage: React.FC = () => {
  const { 
    cards, 
    students, 
    registerCard, 
    updateCardStatus, 
    deleteCard, 
    linkCardToStudent, 
    unlinkCardFromStudent 
  } = useLibrary();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<string>('all');

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isQrGeneratorModalOpen, setIsQrGeneratorModalOpen] = useState(false);
  const [viewingCardQr, setViewingCardQr] = useState<{ card: RfidCard; student?: Student | null } | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [targetCard, setTargetCard] = useState<RfidCard | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [newCardUid, setNewCardUid] = useState('');
  const [newCardNote, setNewCardNote] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isNfcScanningModal, setIsNfcScanningModal] = useState(false);
  const [nfcModalError, setNfcModalError] = useState<string | null>(null);

  const startNfcReadForRegister = async () => {
    if (!('NDEFReader' in window)) {
      setNfcModalError('Web NFC tidak didukung di browser ini. Gunakan Google Chrome di HP Android.');
      return;
    }
    try {
      setNfcModalError(null);
      setIsNfcScanningModal(true);
      const NDEFReaderClass = (window as any).NDEFReader;
      const ndef = new NDEFReaderClass();
      await ndef.scan();
      ndef.addEventListener('reading', (event: any) => {
        const uid = event.serialNumber || '';
        if (uid) {
          setNewCardUid(uid.toUpperCase());
          setIsNfcScanningModal(false);
          if (navigator.vibrate) navigator.vibrate(100);
        }
      });
    } catch (err: any) {
      setIsNfcScanningModal(false);
      const errMsg = err?.message || '';
      if (err.name === 'SecurityError' || errMsg.includes('top-level')) {
        setNfcModalError('Sensor NFC HP memerlukan aplikasi dibuka di tab baru (bukan iframe).');
      } else if (err.name === 'NotAllowedError') {
        setNfcModalError('Izin akses sensor NFC ditolak.');
      } else {
        setNfcModalError(errMsg || 'Gagal mengaktifkan sensor NFC.');
      }
    }
  };

  const studentsMap = new Map<string, Student>(students.map(s => [s.id, s]));

  // Filter cards
  const filteredCards = cards.filter(card => {
    const student = card.student_id ? studentsMap.get(card.student_id) : null;
    const matchesSearch = 
      card.uid.toLowerCase().includes(search.toLowerCase()) ||
      (card.note && card.note.toLowerCase().includes(search.toLowerCase())) ||
      (student && student.name.toLowerCase().includes(search.toLowerCase())) ||
      (student && student.nis.includes(search));

    const matchesStatus = selectedStatus === 'all' || card.status === selectedStatus;
    const matchesAssignment = 
      selectedAssignment === 'all' ||
      (selectedAssignment === 'assigned' && card.student_id !== null) ||
      (selectedAssignment === 'unassigned' && card.student_id === null);

    return matchesSearch && matchesStatus && matchesAssignment;
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardUid.trim()) return;

    registerCard(newCardUid.trim(), newCardNote.trim());
    setNewCardUid('');
    setNewCardNote('');
    setIsRegisterModalOpen(false);
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetCard && selectedStudentId) {
      linkCardToStudent(selectedStudentId, targetCard.uid);
      setIsLinkModalOpen(false);
      setTargetCard(null);
      setSelectedStudentId('');
    }
  };

  const totalAssigned = cards.filter(c => c.student_id !== null).length;
  const totalUnassigned = cards.filter(c => c.student_id === null && c.status === 'active').length;
  const totalInactive = cards.filter(c => c.status === 'inactive').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Data Kartu RFID & QR Perpustakaan
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Inventarisasi kartu RFID Mifare/NFC santri, generator QR barcode digital, dan status pairing akun.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-generate-qr-card"
            onClick={() => setIsQrGeneratorModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Generate QR Code Kartu</span>
          </button>

          <button
            id="btn-register-card"
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Kartu Manual</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Kartu</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{cards.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 uppercase">Terhubung ke Santri</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{totalAssigned}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-blue-600 uppercase">Kartu Cadangan Aktif</span>
          <p className="text-2xl font-extrabold text-blue-700 mt-1">{totalUnassigned}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Nonaktif / Rusak</span>
          <p className="text-2xl font-extrabold text-slate-500 mt-1">{totalInactive}</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari UID kartu, nama santri, atau catatan..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Status Kartu</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>

          <select
            value={selectedAssignment}
            onChange={(e) => setSelectedAssignment(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Keterhubungan</option>
            <option value="assigned">Terhubung ke Santri</option>
            <option value="unassigned">Belum Terhubung (Cadangan)</option>
          </select>
        </div>
      </div>

      {/* Table Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">UID Kartu RFID</th>
                <th className="py-3.5 px-4">Santri Terhubung</th>
                <th className="py-3.5 px-4">Tanggal Registrasi</th>
                <th className="py-3.5 px-4">Catatan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ditemukan data kartu RFID.
                  </td>
                </tr>
              ) : (
                filteredCards.map((card, idx) => {
                  const student = card.student_id ? studentsMap.get(card.student_id) : null;

                  return (
                    <tr key={card.id || `card-${card.uid}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-emerald-600" />
                          <span>{card.uid}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {student ? (
                          <div className="flex items-center gap-2.5">
                            {student.photo_url && student.photo_url.trim() !== '' ? (
                              <img src={student.photo_url} alt={student.name} className="w-7 h-7 rounded-lg object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <User className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{student.name}</p>
                              <p className="text-[10px] text-slate-400">NIS: {student.nis} • Kelas {student.class}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum terhubung</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(card.registered_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{card.note || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          card.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {card.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* QR Card View / Print */}
                          <button
                            onClick={() => setViewingCardQr({ card, student })}
                            title="Lihat & Cetak QR Code Kartu"
                            className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Link / Unlink button */}
                          {student ? (
                            <button
                              onClick={() => unlinkCardFromStudent(student.id)}
                              title="Lepas Hubungan Santri"
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors cursor-pointer"
                            >
                              <Unlink className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setTargetCard(card);
                                setSelectedStudentId('');
                                setIsLinkModalOpen(true);
                              }}
                              title="Hubungkan ke Santri"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"
                            >
                              <Link2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Toggle Active/Inactive */}
                          <button
                            onClick={() => updateCardStatus(card.id, card.status === 'active' ? 'inactive' : 'active')}
                            title={card.status === 'active' ? 'Nonaktifkan Kartu' : 'Aktifkan Kartu'}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              card.status === 'active' ? 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Delete Card */}
                          <button
                            onClick={() => setDeletingId(card.id)}
                            title="Hapus Kartu"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* MODAL: Register Kartu Baru */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base">Registrasi Kartu RFID Baru</h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">UID Kartu RFID / NFC *</label>
                  {typeof window !== 'undefined' && 'NDEFReader' in window && (
                    <button
                      type="button"
                      onClick={startNfcReadForRegister}
                      className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Radio className={`w-3 h-3 ${isNfcScanningModal ? 'animate-pulse text-emerald-600' : ''}`} />
                      {isNfcScanningModal ? 'Mendengarkan NFC HP...' : 'Tap via NFC HP'}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCardUid}
                  onChange={(e) => setNewCardUid(e.target.value.toUpperCase())}
                  placeholder="Tempelkan kartu pada HP/scanner atau ketik UID..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
                {isNfcScanningModal && (
                  <p className="text-[11px] text-emerald-600 font-medium mt-1 animate-pulse">
                    Tempelkan kartu santri ke bagian belakang HP sekarang...
                  </p>
                )}
                {nfcModalError && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    {nfcModalError}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan / Keterangan</label>
                <input
                  type="text"
                  value={newCardNote}
                  onChange={(e) => setNewCardNote(e.target.value)}
                  placeholder="Contoh: Kartu Cadangan Perpustakaan / Mifare 1K"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                >
                  Daftarkan Kartu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Hubungkan Kartu ke Santri */}
      {isLinkModalOpen && targetCard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base">Hubungkan Kartu ke Santri</h3>
              <button onClick={() => setIsLinkModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mb-4 text-xs">
              <span className="text-slate-400 block text-[11px]">UID Kartu Terpilih:</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{targetCard.uid}</span>
            </div>

            <form onSubmit={handleLinkSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Santri *</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Pilih Santri --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.nis} - Kelas {s.class}) {s.rfid_uid ? '• (Sudah ada kartu)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!selectedStudentId}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold cursor-pointer"
                >
                  Hubungkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-2">Hapus Kartu RFID?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Kartu akan dihapus permanen dari basis data sistem.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteCard(deletingId);
                  setDeletingId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: QR Code Generator */}
      <QrCardGeneratorModal
        isOpen={isQrGeneratorModalOpen}
        onClose={() => setIsQrGeneratorModalOpen(false)}
      />

      {/* MODAL: View & Print QR Card */}
      {viewingCardQr && (
        <QrCardViewModal
          isOpen={true}
          onClose={() => setViewingCardQr(null)}
          card={viewingCardQr.card}
          student={viewingCardQr.student}
        />
      )}
    </div>
  );
};
