import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  X,
  Sparkles,
  User,
  CreditCard,
  Download,
  Printer,
  Copy,
  Check,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Layers,
  Palette,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { Student, Gender, StudentStatus } from '../../types';
import { generateQrDataUrl, generateRandomCardUid } from '../../utils/qrUtils';

interface QrCardGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudent?: Student | null;
  onSuccess?: (createdCardUid: string) => void;
}

export const QrCardGeneratorModal: React.FC<QrCardGeneratorModalProps> = ({
  isOpen,
  onClose,
  initialStudent,
  onSuccess
}) => {
  const { students, addStudent, registerCard, registerCardsBatch, settings } = useLibrary();

  // Pilihan Utama: Apakah ingin langsung dibuatkan data santri atau hanya kartu cadangan kosong
  const [createWithStudent, setCreateWithStudent] = useState<boolean>(!initialStudent ? true : false);

  // Student Form Data
  const [studentData, setStudentData] = useState({
    nis: `202407${String(students.length + 1).padStart(3, '0')}`,
    name: '',
    class: '7A',
    gender: 'L' as Gender,
    photo_url: `https://images.unsplash.com/photo-${1535713875000 + Math.floor(Math.random() * 100000)}?w=200&auto=format&fit=crop&q=80`,
    phone: '',
    status: 'active' as StudentStatus
  });

  // Spare Card Form Data
  const [spareCardData, setSpareCardData] = useState({
    note: 'Kartu Cadangan Perpustakaan',
    batchCount: 1
  });

  // QR Code settings & generated UID
  const [cardUid, setCardUid] = useState<string>('');
  const [qrColor, setQrColor] = useState<string>('#0f172a');
  const [qrErrorCorrection, setQrErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);
  const [savedMessage, setSavedMessage] = useState<string>('');

  const cardPreviewRef = useRef<HTMLDivElement>(null);

  // Initialize or re-generate UID when opening
  useEffect(() => {
    if (isOpen) {
      if (initialStudent) {
        setCreateWithStudent(false);
        setCardUid(initialStudent.rfid_uid || `QR-${initialStudent.nis}`);
      } else {
        const nextNis = `202407${String(students.length + 1).padStart(3, '0')}`;
        setStudentData(prev => ({
          ...prev,
          nis: nextNis,
          name: '',
          photo_url: `https://images.unsplash.com/photo-${1535713875000 + Math.floor(Math.random() * 100000)}?w=200&auto=format&fit=crop&q=80`
        }));
        setCardUid(`QR-${nextNis}`);
      }
      setIsSavedSuccess(false);
    }
  }, [isOpen, initialStudent, students.length]);

  // Sync QR code when cardUid, color, or EC changes
  useEffect(() => {
    if (!cardUid) return;
    generateQrDataUrl(cardUid, {
      width: 320,
      margin: 1,
      color: { dark: qrColor, light: '#ffffff' },
      errorCorrectionLevel: qrErrorCorrection
    }).then(url => {
      setQrDataUrl(url);
    });
  }, [cardUid, qrColor, qrErrorCorrection]);

  if (!isOpen) return null;

  const handleRandomizeUid = () => {
    if (createWithStudent && studentData.nis) {
      setCardUid(`QR-${studentData.nis}`);
    } else {
      setCardUid(generateRandomCardUid('LIB-QR'));
    }
  };

  const handleRandomizeAvatar = () => {
    const randomSeed = Math.floor(Math.random() * 1000);
    const genderTerm = studentData.gender === 'L' ? 'boy' : 'girl';
    setStudentData(prev => ({
      ...prev,
      photo_url: `https://images.unsplash.com/photo-${1534528741775 + randomSeed}?w=200&auto=format&fit=crop&q=80`
    }));
  };

  const handleCopyUid = () => {
    if (!cardUid) return;
    navigator.clipboard.writeText(cardUid).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Download Standalone QR Code as PNG
  const handleDownloadQrOnly = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR-CODE-${cardUid}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Card layout
  const handlePrintCard = () => {
    window.print();
  };

  // Submit and Save to Database
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardUid.trim()) return;

    const cleanUid = cardUid.trim().toUpperCase();

    if (createWithStudent) {
      if (!studentData.name.trim() || !studentData.nis.trim()) return;

      // 1. Create student and link to this card UID
      const newStudent = addStudent({
        nis: studentData.nis.trim(),
        name: studentData.name.trim(),
        class: studentData.class,
        gender: studentData.gender,
        photo_url: studentData.photo_url,
        rfid_uid: cleanUid,
        status: studentData.status,
        phone: studentData.phone.trim() || undefined
      });

      setIsSavedSuccess(true);
      setSavedMessage(`Kartu QR & Data Santri "${newStudent.name}" (${newStudent.nis}) berhasil disimpan ke sistem!`);
      if (onSuccess) onSuccess(cleanUid);
    } else {
      // 2. Generate blank spare card(s)
      if (spareCardData.batchCount > 1) {
        const batchItems: Array<{ uid: string; note: string }> = [];
        for (let i = 0; i < spareCardData.batchCount; i++) {
          const batchUid = i === 0 ? cleanUid : generateRandomCardUid('LIB-QR');
          batchItems.push({
            uid: batchUid,
            note: `${spareCardData.note.trim()} (#${i + 1})`
          });
        }
        registerCardsBatch(batchItems);
        setIsSavedSuccess(true);
        setSavedMessage(`Berhasil men-generate & mendaftarkan ${spareCardData.batchCount} Kartu QR Cadangan ke sistem!`);
        if (onSuccess) onSuccess(cleanUid);
      } else {
        registerCard(cleanUid, spareCardData.note.trim());
        setIsSavedSuccess(true);
        setSavedMessage(`Kartu QR Cadangan (${cleanUid}) berhasil didaftarkan ke sistem.`);
        if (onSuccess) onSuccess(cleanUid);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 my-auto max-h-[95vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                Generator QR Code Kartu Perpustakaan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Buat barcode QR digital untuk kartu santri atau kartu cadangan perpustakaan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {/* Main Option Banner (Decision Switch) */}
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
              Pilihan Pembuatan Data:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Langsung dengan Data Santri */}
              <button
                type="button"
                onClick={() => {
                  setCreateWithStudent(true);
                  if (studentData.nis) setCardUid(`QR-${studentData.nis}`);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  createWithStudent
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 opacity-75'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  createWithStudent ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                }`}>
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <span>Langsung Buatkan Data Santri</span>
                    {createWithStudent && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Input identitas santri (Nama, NIS, Kelas) & otomatis hubungkan ke QR Code.
                  </p>
                </div>
              </button>

              {/* Option 2: Hanya Kartu Kosong / Cadangan */}
              <button
                type="button"
                onClick={() => {
                  setCreateWithStudent(false);
                  setCardUid(generateRandomCardUid('LIB-QR'));
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  !createWithStudent
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 opacity-75'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  !createWithStudent ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                }`}>
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <span>Hanya Kartu QR Kosong / Cadangan</span>
                    {!createWithStudent && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Buat kode QR kartu kosong untuk cadangan atau dihubungkan santri nanti.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Form & Live Preview 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* LEFT COLUMN: Input Form Controls */}
            <div className="lg:col-span-6 space-y-4">
              <form id="qr-form" onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                
                {/* 1. Student Identity Fields (If Create With Student = true) */}
                {createWithStudent && (
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        Identitas Santri
                      </span>
                      <span className="text-[10px] text-slate-400">Data otomatis terdaftar</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          NIS Santri *
                        </label>
                        <input
                          type="text"
                          required
                          value={studentData.nis}
                          onChange={(e) => {
                            const newNis = e.target.value;
                            setStudentData({ ...studentData, nis: newNis });
                            if (newNis) setCardUid(`QR-${newNis}`);
                          }}
                          placeholder="202407001"
                          className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Kelas *
                        </label>
                        <input
                          type="text"
                          required
                          value={studentData.class}
                          onChange={(e) => setStudentData({ ...studentData, class: e.target.value })}
                          placeholder="7A, 10 IPA 1"
                          className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nama Lengkap Santri *
                      </label>
                      <input
                        type="text"
                        required
                        value={studentData.name}
                        onChange={(e) => setStudentData({ ...studentData, name: e.target.value })}
                        placeholder="Contoh: Muhammad Ilham Santoso"
                        className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Jenis Kelamin
                        </label>
                        <select
                          value={studentData.gender}
                          onChange={(e) => setStudentData({ ...studentData, gender: e.target.value as Gender })}
                          className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="L">Laki-laki (Putra)</option>
                          <option value="P">Perempuan (Putri)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          No. HP / WA (Opsional)
                        </label>
                        <input
                          type="text"
                          value={studentData.phone}
                          onChange={(e) => setStudentData({ ...studentData, phone: e.target.value })}
                          placeholder="08123456789"
                          className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-slate-700 dark:text-slate-300">
                          URL Foto Profil
                        </label>
                        <button
                          type="button"
                          onClick={handleRandomizeAvatar}
                          className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> Ganti Foto Acak
                        </button>
                      </div>
                      <input
                        type="text"
                        value={studentData.photo_url}
                        onChange={(e) => setStudentData({ ...studentData, photo_url: e.target.value })}
                        placeholder="https://..."
                        className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 text-[11px]"
                      />
                    </div>
                  </div>
                )}

                {/* 2. Spare Card Settings (If Create With Student = false) */}
                {!createWithStudent && (
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        Pengaturan Kartu Cadangan
                      </span>
                      <span className="text-[10px] text-slate-400">Siap pairing nanti</span>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Catatan / Label Kartu
                      </label>
                      <input
                        type="text"
                        value={spareCardData.note}
                        onChange={(e) => setSpareCardData({ ...spareCardData, note: e.target.value })}
                        placeholder="Contoh: Kartu Cadangan Kelas 7 / Kartu Tamu Perpustakaan"
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Jumlah Kartu yang Ingin Dibuat Sekaligus
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 3, 5, 10].map((num) => (
                          <button
                            type="button"
                            key={num}
                            onClick={() => setSpareCardData({ ...spareCardData, batchCount: num })}
                            className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                              spareCardData.batchCount === num
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {num} Kartu
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Card UID & QR Formatting */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                      Payload & Desain QR
                    </span>
                    <button
                      type="button"
                      onClick={handleRandomizeUid}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Acak UID Baru
                    </button>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      UID / Kode Kartu QR *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={cardUid}
                        onChange={(e) => setCardUid(e.target.value.toUpperCase())}
                        placeholder="LIB-QR-12345"
                        className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleCopyUid}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
                        title="Salin UID"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Warna Barcode QR
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[
                          { color: '#0f172a', label: 'Hitam Slate' },
                          { color: '#047857', label: 'Emerald Hijau' },
                          { color: '#1d4ed8', label: 'Royal Blue' },
                          { color: '#6d28d9', label: 'Purple' }
                        ].map(c => (
                          <button
                            type="button"
                            key={c.color}
                            onClick={() => setQrColor(c.color)}
                            className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                              qrColor === c.color ? 'scale-125 border-white ring-2 ring-indigo-500' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: c.color }}
                            title={c.label}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Koreksi Error (EC)
                      </label>
                      <select
                        value={qrErrorCorrection}
                        onChange={(e) => setQrErrorCorrection(e.target.value as any)}
                        className="w-full p-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs"
                      >
                        <option value="L">L (7% Toleransi)</option>
                        <option value="M">M (15% Standar)</option>
                        <option value="Q">Q (25% Kualitas)</option>
                        <option value="H">H (30% Cetak Tajam)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: Live Interactive ID Card Preview & Output */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  Pratinjau Fisik Kartu Anggota
                </span>
                <span className="text-[10px] font-mono text-slate-400">CR80 (85.6 × 54mm)</span>
              </div>

              {/* REALISTIC ID CARD DESIGN CANVAS */}
              <div 
                ref={cardPreviewRef}
                className="w-full bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-xl border border-blue-800/60 relative overflow-hidden select-none"
                style={{ aspectRatio: '1.586 / 1' }}
              >
                {/* Background holographic mesh & curves */}
                <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-indigo-500/20 blur-xl pointer-events-none" />
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-400 via-emerald-400 to-indigo-400 opacity-80" />

                {/* Card Header */}
                <div className="relative z-10 flex items-center justify-between pb-2.5 border-b border-white/15 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-blue-300">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs tracking-wider uppercase leading-none text-white">
                        {settings.institution_name || 'PERPUSTAKAAN PESANTREN'}
                      </h3>
                      <p className="text-[9px] text-blue-200 font-medium tracking-tight mt-0.5">
                        {settings.library_name || 'Kartu Anggota Perpustakaan Digital'}
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/40 text-[9px] font-mono font-bold uppercase tracking-wider text-blue-200">
                    {createWithStudent ? 'SANTRI' : 'CADANGAN'}
                  </span>
                </div>

                {/* Card Body */}
                <div className="relative z-10 flex items-center justify-between gap-3 h-[calc(100%-4.2rem)]">
                  
                  {/* Left: Photo & Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {createWithStudent ? (
                      studentData.photo_url && studentData.photo_url.trim() !== '' ? (
                        <img
                          src={studentData.photo_url}
                          alt="Foto Santri"
                          className="w-16 h-20 sm:w-18 sm:h-22 rounded-xl object-cover border-2 border-white/30 shadow-md bg-slate-800 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-20 sm:w-18 sm:h-22 rounded-xl bg-white/10 border-2 border-white/20 flex flex-col items-center justify-center text-center p-1 shrink-0 text-blue-200">
                          <User className="w-8 h-8 sm:w-10 sm:h-10 text-white/80" />
                          <span className="text-[7px] font-bold text-blue-200 uppercase mt-0.5">SANTRI</span>
                        </div>
                      )
                    ) : (
                      <div className="w-16 h-20 sm:w-18 sm:h-22 rounded-xl bg-white/10 border-2 border-white/20 flex flex-col items-center justify-center text-center p-1 shrink-0">
                        <CreditCard className="w-6 h-6 text-emerald-400 mb-1" />
                        <span className="text-[8px] font-bold text-slate-300 uppercase leading-tight">KARTU CADANGAN</span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-1">
                      {createWithStudent ? (
                        <>
                          <h4 className="font-bold text-sm sm:text-base text-white truncate leading-tight">
                            {studentData.name || 'Nama Lengkap Santri'}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-blue-200">
                            <span className="font-mono">NIS: {studentData.nis || '-'}</span>
                            <span>•</span>
                            <span className="font-semibold">Kelas {studentData.class || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-slate-300">
                            <span>{studentData.gender === 'L' ? 'Santri Putra' : 'Santri Putri'}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <h4 className="font-bold text-sm text-white leading-tight">
                            KARTU CADANGAN / VISITOR
                          </h4>
                          <p className="text-[10px] text-emerald-300 line-clamp-2">
                            {spareCardData.note || 'Dapat dipasangkan dengan santri baru kapan saja.'}
                          </p>
                        </>
                      )}

                      {/* Barcode representation */}
                      <div className="pt-1">
                        <span className="text-[9px] font-mono text-blue-300 tracking-wider block">
                          UID: {cardUid || 'QR-LIB-XXXX'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Sharp QR Code Display */}
                  <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-white shadow-lg border border-white/40 shrink-0">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QR Code"
                        className="w-18 h-18 sm:w-22 sm:h-22 object-contain"
                      />
                    ) : (
                      <div className="w-18 h-18 sm:w-22 sm:h-22 bg-slate-100 flex items-center justify-center text-slate-400">
                        <QrCode className="w-8 h-8 animate-pulse" />
                      </div>
                    )}
                    <span className="text-[8px] font-mono font-bold text-slate-700 mt-0.5">
                      SCAN TERMINAL
                    </span>
                  </div>
                </div>

                {/* Card Footer Stripe */}
                <div className="absolute bottom-1 left-4 right-4 flex items-center justify-between text-[8px] text-blue-300/70 font-mono">
                  <span>SISTEM ABSENSI PERPUSTAKAAN</span>
                  <span>TAP / SCAN VALID</span>
                </div>
              </div>

              {/* Action Buttons & Outputs */}
              <div className="space-y-2.5 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadQrOnly}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Download QR (.PNG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintCard}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Cetak Kartu Fisik</span>
                  </button>
                </div>

                {/* Success Feedback Alert */}
                {isSavedSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="flex-1 font-medium">{savedMessage}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>QR Code kompatibel dengan scanner kamera & USB barcode reader</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="submit"
              form="qr-form"
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {createWithStudent ? 'Simpan Data Santri & QR' : `Daftarkan ${spareCardData.batchCount} Kartu Cadangan`}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
