import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  CreditCard, 
  Edit3, 
  Trash2, 
  Eye, 
  X, 
  Check, 
  UserCheck, 
  UserX, 
  Radio,
  Sparkles,
  QrCode,
  Printer,
  User
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { Student, Gender, StudentStatus } from '../../types';
import { exportStudentsToExcel } from '../../utils/exportExcel';
import { QrCardGeneratorModal } from '../cards/QrCardGeneratorModal';
import { QrCardViewModal } from '../cards/QrCardViewModal';
import { ImageUpload } from '../common/ImageUpload';

interface StudentsPageProps {
  onOpenDetail?: (student: Student) => void;
}

export const StudentsPage: React.FC<StudentsPageProps> = () => {
  const { 
    students, 
    addStudent, 
    updateStudent, 
    deleteStudent, 
    linkCardToStudent, 
    unlinkCardFromStudent,
    cards
  } = useLibrary();

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQrGeneratorModalOpen, setIsQrGeneratorModalOpen] = useState(false);
  const [viewingStudentQr, setViewingStudentQr] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [pairingStudent, setPairingStudent] = useState<Student | null>(null);
  const [selectedDetailStudent, setSelectedDetailStudent] = useState<Student | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    nis: '',
    name: '',
    class: '7A',
    gender: 'L' as Gender,
    photo_url: '',
    rfid_uid: '',
    status: 'active' as StudentStatus,
    phone: ''
  });

  const [cardPairingUid, setCardPairingUid] = useState('');

  // Extract unique classes for filter dropdown
  const uniqueClasses = Array.from(new Set(students.map(s => s.class))).sort();

  // Filtered students
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.includes(search) ||
      (s.rfid_uid && s.rfid_uid.toLowerCase().includes(search.toLowerCase()));

    const matchesClass = selectedClass === 'all' || s.class === selectedClass;
    const matchesGender = selectedGender === 'all' || s.gender === selectedGender;
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;

    return matchesSearch && matchesClass && matchesGender && matchesStatus;
  });

  const handleOpenAdd = () => {
    setFormData({
      nis: `202407${String(students.length + 1).padStart(3, '0')}`,
      name: '',
      class: '10 IPA 1',
      gender: 'L',
      photo_url: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random()*100000000)}?w=200&auto=format&fit=crop&q=80`,
      rfid_uid: '',
      status: 'active',
      phone: '0812' + Math.floor(10000000 + Math.random() * 90000000)
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      nis: student.nis,
      name: student.name,
      class: student.class,
      gender: student.gender,
      photo_url: student.photo_url,
      rfid_uid: student.rfid_uid || '',
      status: student.status,
      phone: student.phone || ''
    });
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.nis.trim()) return;

    addStudent({
      nis: formData.nis.trim(),
      name: formData.name.trim(),
      class: formData.class,
      gender: formData.gender,
      photo_url: formData.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      rfid_uid: formData.rfid_uid.trim() || undefined,
      status: formData.status,
      phone: formData.phone.trim() || undefined
    });

    setIsAddModalOpen(false);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !formData.name.trim() || !formData.nis.trim()) return;

    updateStudent(editingStudent.id, {
      nis: formData.nis.trim(),
      name: formData.name.trim(),
      class: formData.class,
      gender: formData.gender,
      photo_url: formData.photo_url,
      rfid_uid: formData.rfid_uid.trim() || undefined,
      status: formData.status,
      phone: formData.phone.trim() || undefined
    });

    setEditingStudent(null);
  };

  const handlePairCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (pairingStudent && cardPairingUid.trim()) {
      linkCardToStudent(pairingStudent.id, cardPairingUid.trim());
      setPairingStudent(null);
      setCardPairingUid('');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Data Santri Perpustakaan
          </h1>
          <p className="text-sm text-slate-500">
            Kelola data identitas santri, kelas, dan integrasi kartu RFID absensi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsQrGeneratorModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Generate QR Kartu</span>
          </button>

          <button
            onClick={() => exportStudentsToExcel(filteredStudents)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Excel</span>
          </button>

          <button
            id="btn-add-student"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Santri</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, NIS, atau UID..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Filter Kelas */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Kelas</option>
            {uniqueClasses.map(c => (
              <option key={c} value={c}>Kelas {c}</option>
            ))}
          </select>

          {/* Filter Gender */}
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Jenis Kelamin</option>
            <option value="L">Santri Putra (L)</option>
            <option value="P">Santri Putri (P)</option>
          </select>

          {/* Filter Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="graduated">Alumni (Lulus)</option>
            <option value="suspended">Skorsing</option>
            <option value="leave">Cuti</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Menampilkan <strong>{filteredStudents.length}</strong> dari {students.length} santri</span>
          {(search || selectedClass !== 'all' || selectedGender !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedClass('all');
                setSelectedGender('all');
                setSelectedStatus('all');
              }}
              className="text-emerald-600 font-semibold hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Table Data Santri (Desktop & Tablet) */}
      <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Santri</th>
                <th className="py-3.5 px-4">NIS</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4">Gender</th>
                <th className="py-3.5 px-4">Kartu RFID</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada data santri yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => (
                  <tr key={student.id || `student-${student.nis}-${idx}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {student.photo_url && student.photo_url.trim() !== '' ? (
                          <img
                            src={student.photo_url}
                            alt={student.name}
                            className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700 shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white text-sm">{student.name}</p>
                          <p className="text-[11px] text-slate-400">{student.phone || 'Tanpa no. telepon'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">{student.nis}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-semibold text-[11px] border border-indigo-100 dark:border-indigo-900">
                        {student.class}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {student.gender === 'L' ? (
                        <span className="text-blue-700 dark:text-blue-400 font-medium">Laki-laki</span>
                      ) : (
                        <span className="text-pink-700 dark:text-pink-400 font-medium">Perempuan</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {student.rfid_uid ? (
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {student.rfid_uid}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setPairingStudent(student);
                            setCardPairingUid('');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-400 text-[11px] font-semibold border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                        >
                          <Radio className="w-3 h-3 animate-pulse" />
                          Hubungkan Kartu
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        student.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400' :
                        student.status === 'graduated' ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400' :
                        student.status === 'suspended' ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {student.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Cetak / Lihat QR Code */}
                        <button
                          onClick={() => setViewingStudentQr(student)}
                          title="Lihat & Cetak Kartu QR Santri"
                          className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setSelectedDetailStudent(student)}
                          title="Lihat Detail"
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setPairingStudent(student);
                            setCardPairingUid(student.rfid_uid || '');
                          }}
                          title="Ganti Kartu RFID"
                          className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(student)}
                          title="Edit Santri"
                          className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingId(student.id)}
                          title="Hapus Santri"
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Cards List (Mobile Smartphone View) */}
      <div className="sm:hidden space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400">
            <User className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-sm">Tidak ada santri ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau filter.</p>
          </div>
        ) : (
          filteredStudents.map((student, idx) => (
            <div 
              key={`mobile-std-${student.id}-${idx}`}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3"
            >
              {/* Header Info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {student.photo_url && student.photo_url.trim() !== '' ? (
                    <img
                      src={student.photo_url}
                      alt={student.name}
                      className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700 shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                      {student.name}
                    </h4>
                    <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      NIS: {student.nis}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-bold text-[10px] border border-indigo-100 dark:border-indigo-900">
                        Kelas {student.class}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                        student.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400' :
                        student.status === 'graduated' ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}>
                        {student.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RFID badge / pair button */}
                {student.rfid_uid ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-[10px] border border-emerald-200 dark:border-emerald-800 shrink-0">
                    <CreditCard className="w-3 h-3" />
                    {student.rfid_uid.slice(-6)}
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setPairingStudent(student);
                      setCardPairingUid('');
                    }}
                    className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-semibold text-[10px] border border-amber-200 shrink-0"
                  >
                    + RFID
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setViewingStudentQr(student)}
                  className="py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold text-[11px] flex items-center justify-center gap-1 border border-blue-200 dark:border-blue-800 active:scale-95 transition-transform"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  QR
                </button>
                <button
                  onClick={() => setSelectedDetailStudent(student)}
                  className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] flex items-center justify-center gap-1 active:scale-95 transition-transform"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Detail
                </button>
                <button
                  onClick={() => handleOpenEdit(student)}
                  className="py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] flex items-center justify-center gap-1 border border-indigo-200 dark:border-indigo-800 active:scale-95 transition-transform"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => setDeletingId(student.id)}
                  className="py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold text-[11px] flex items-center justify-center gap-1 border border-rose-200 dark:border-rose-800 active:scale-95 transition-transform"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: Tambah Santri */}
      {isAddModalOpen && (
        <div 
          onClick={() => setIsAddModalOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base">Tambah Data Santri Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Induk Santri (NIS) *</label>
                <input
                  type="text"
                  required
                  value={formData.nis}
                  onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Santri *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Muhammad Ilham Pratama"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas *</label>
                  <input
                    type="text"
                    required
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    placeholder="Contoh: 10 IPA 1"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="L">Laki-laki (Putra)</option>
                    <option value="P">Perempuan (Putri)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">UID Kartu RFID / Nomor Kartu</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.rfid_uid}
                    onChange={(e) => setFormData({ ...formData, rfid_uid: e.target.value.toUpperCase() })}
                    placeholder={`Tempelkan pada scanner atau ketik UID (Otomatis: RFID-${formData.nis || 'NIS'})...`}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  ✨ Kartu RFID akan <strong>langsung terdaftar otomatis</strong> di menu Data Kartu RFID saat santri disimpan.
                </p>
              </div>

              {/* Upload Foto Santri */}
              <ImageUpload
                id="upload-student-add"
                value={formData.photo_url}
                onChange={(newPhoto) => setFormData({ ...formData, photo_url: newPhoto })}
                label="Foto Santri"
                helperText="Upload foto santri dari perangkat (JPG, PNG, WEBP, GIF). Maks. 10 MB per foto."
                maxSizeMB={10}
                allowUrlInput={true}
                shape="rounded"
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                >
                  Simpan Santri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Santri */}
      {editingStudent && (
        <div 
          onClick={() => setEditingStudent(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base">Edit Data Santri</h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Induk Santri (NIS) *</label>
                <input
                  type="text"
                  required
                  value={formData.nis}
                  onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Santri *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas *</label>
                  <input
                    type="text"
                    required
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="L">Laki-laki (Putra)</option>
                    <option value="P">Perempuan (Putri)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">UID Kartu RFID</label>
                <input
                  type="text"
                  value={formData.rfid_uid}
                  onChange={(e) => setFormData({ ...formData, rfid_uid: e.target.value.toUpperCase() })}
                  placeholder="UID Kartu RFID..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Santri</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as StudentStatus })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="active">Aktif</option>
                  <option value="graduated">Alumni</option>
                  <option value="suspended">Skorsing</option>
                  <option value="leave">Cuti</option>
                </select>
              </div>

              {/* Upload Foto Santri di Edit Modal */}
              <ImageUpload
                id="upload-student-edit"
                value={formData.photo_url}
                onChange={(newPhoto) => setFormData({ ...formData, photo_url: newPhoto })}
                label="Foto Santri"
                helperText="Upload foto santri dari perangkat (JPG, PNG, WEBP, GIF). Maks. 10 MB per foto."
                maxSizeMB={10}
                allowUrlInput={true}
                shape="rounded"
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Hubungkan Kartu RFID */}
      {pairingStudent && (
        <div 
          onClick={() => setPairingStudent(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
                <h3 className="font-bold text-slate-800 text-base">Hubungkan Kartu RFID</h3>
              </div>
              <button onClick={() => setPairingStudent(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 mb-4 flex items-center gap-3">
              {pairingStudent.photo_url && pairingStudent.photo_url.trim() !== '' ? (
                <img src={pairingStudent.photo_url} alt={pairingStudent.name} className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div>
                <p className="font-bold text-slate-800 text-sm">{pairingStudent.name}</p>
                <p className="text-xs text-slate-500">NIS: {pairingStudent.nis} • Kelas {pairingStudent.class}</p>
              </div>
            </div>

            <form onSubmit={handlePairCard} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tempelkan Kartu pada Reader atau Masukkan UID
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={cardPairingUid}
                  onChange={(e) => setCardPairingUid(e.target.value.toUpperCase())}
                  placeholder="Contoh: E28068940001"
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 font-mono text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Suggestions from unassigned cards */}
              <div>
                <p className="text-[11px] text-slate-400 font-semibold mb-1.5">Pilih dari Kartu Cadangan Tersedia:</p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {cards.filter(c => !c.student_id && c.status === 'active').map((c, idx) => (
                    <button
                      type="button"
                      key={c.id || `unassigned-${c.uid}-${idx}`}
                      onClick={() => setCardPairingUid(c.uid)}
                      className="w-full text-left p-1.5 px-2 rounded-lg bg-slate-100 hover:bg-emerald-50 text-[11px] font-mono text-slate-700 hover:text-emerald-800 flex justify-between cursor-pointer"
                    >
                      <span>{c.uid}</span>
                      <span className="text-[10px] text-slate-400">{c.note || 'Cadangan'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                {pairingStudent.rfid_uid && (
                  <button
                    type="button"
                    onClick={() => {
                      unlinkCardFromStudent(pairingStudent.id);
                      setPairingStudent(null);
                    }}
                    className="text-rose-600 font-semibold hover:underline cursor-pointer"
                  >
                    Lepas Kartu
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setPairingStudent(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                  >
                    Simpan Kartu
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detail Santri */}
      {selectedDetailStudent && (
        <div 
          onClick={() => setSelectedDetailStudent(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base">Profil & Riwayat Santri</h3>
              <button onClick={() => setSelectedDetailStudent(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              {selectedDetailStudent.photo_url && selectedDetailStudent.photo_url.trim() !== '' ? (
                <img
                  src={selectedDetailStudent.photo_url}
                  alt={selectedDetailStudent.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/20 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 ring-2 ring-emerald-500/20 shadow-md shrink-0">
                  <User className="w-8 h-8" />
                </div>
              )}
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{selectedDetailStudent.name}</h4>
                <p className="text-xs text-slate-500">NIS: {selectedDetailStudent.nis} • Kelas {selectedDetailStudent.class}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {selectedDetailStudent.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-400">
                    {selectedDetailStudent.gender === 'L' ? 'Santri Putra' : 'Santri Putri'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Kartu RFID Terhubung</span>
                <span className="font-mono font-bold text-slate-800 mt-1 block">
                  {selectedDetailStudent.rfid_uid || 'Belum ada kartu'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Terdaftar Sejak</span>
                <span className="font-semibold text-slate-800 mt-1 block">
                  {new Date(selectedDetailStudent.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedDetailStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingId && (
        <div 
          onClick={() => setDeletingId(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-center cursor-default"
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-2">Hapus Data Santri?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Tindakan ini tidak dapat dibatalkan. Kartu RFID yang terhubung akan otomatis dilepas.
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
                  deleteStudent(deletingId);
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
      {viewingStudentQr && (
        <QrCardViewModal
          isOpen={true}
          onClose={() => setViewingStudentQr(null)}
          student={viewingStudentQr}
        />
      )}
    </div>
  );
};
