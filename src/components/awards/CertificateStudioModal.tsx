import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Trophy, 
  Award, 
  Sparkles, 
  Printer, 
  Share2, 
  X, 
  CheckCircle2, 
  Calendar, 
  User, 
  BookOpen, 
  Gift, 
  QrCode,
  Download,
  Flame,
  Star,
  Check,
  Palette,
  Sliders,
  FileText,
  Search,
  Users,
  Copy,
  Layers,
  ChevronRight,
  ShieldCheck,
  Crown,
  Eye,
  Settings2,
  RefreshCw,
  Save,
  MessageSquare,
  FileCheck
} from 'lucide-react';
import { LiteracyAward, Student } from '../../types';
import { useLibrary } from '../../context/LibraryContext';
import { generateQrDataUrl } from '../../utils/qrUtils';
import { calculateStudentProfile } from '../../utils/gamificationUtils';

export type CertificateTemplateStyle = 
  | 'turats_emerald' 
  | 'royal_navy' 
  | 'burgundy_classic' 
  | 'clean_editorial' 
  | 'vibrant_sunburst';

export type CertificateOrientation = 'landscape' | 'portrait';
export type CertificatePaperSize = 'A4' | 'F4';

export interface CertificateDesignConfig {
  templateStyle: CertificateTemplateStyle;
  orientation: CertificateOrientation;
  paperSize: CertificatePaperSize;
  institutionName: string;
  libraryName: string;
  subHeader: string;
  certificateTitle: string;
  certificateSubtitle: string;
  certificateNo: string;
  period: string;
  citationText: string;
  rewardItem: string;
  showReward: boolean;
  showStudentPhoto: boolean;
  showStatsBadge: boolean;
  showQrCode: boolean;
  showSignatures: boolean;
  showDigitalSeal: boolean;
  signer1Title: string;
  signer1Name: string;
  signer1Nip: string;
  signer2Title: string;
  signer2Name: string;
  signer2Role: string;
  awardedDateHijri: string;
  awardedDateGregorian: string;
  cityLocation: string;
  sealColor: 'emerald' | 'gold' | 'red' | 'blue';
}

interface CertificateStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudent?: Student | null;
  initialAward?: LiteracyAward | null;
}

export const CertificateStudioModal: React.FC<CertificateStudioModalProps> = ({
  isOpen,
  onClose,
  initialStudent,
  initialAward
}) => {
  const { 
    students, 
    visits, 
    loans, 
    books, 
    awards, 
    settings, 
    addAward, 
    sendAwardWhatsAppCongrats 
  } = useLibrary();

  // Mode: Single student design vs Batch generation
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudent?.id || students[0]?.id || '');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'template' | 'content' | 'signer' | 'layout'>('template');

  // Batch mode state
  const [batchClassFilter, setBatchClassFilter] = useState<string>('all');
  const [batchSelectedStudentIds, setBatchSelectedStudentIds] = useState<string[]>([]);
  const [batchCategoryPreset, setBatchCategoryPreset] = useState<string>('top_reader');

  // Status flags
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [waSentSuccess, setWaSentSuccess] = useState(false);
  const [isSavingAward, setIsSavingAward] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Selected single student
  const activeStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId) || students[0] || null;
  }, [students, selectedStudentId]);

  // Selected student gamification stats
  const activeStudentProfile = useMemo(() => {
    if (!activeStudent) return null;
    return calculateStudentProfile(activeStudent, visits, loans, books, awards);
  }, [activeStudent, visits, loans, books, awards]);

  // Distinct classes for batch selection
  const classList = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.class) set.add(s.class);
    });
    return Array.from(set).sort();
  }, [students]);

  // Helper date generators
  const today = new Date();
  const year = today.getFullYear();
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][today.getMonth()];
  const formattedToday = `${today.getDate()} ${monthNames[today.getMonth()]} ${year}`;

  // Initial Design Configuration
  const [config, setConfig] = useState<CertificateDesignConfig>({
    templateStyle: 'turats_emerald',
    orientation: 'landscape',
    paperSize: 'A4',
    institutionName: settings.institution_name || 'PONDOK PESANTREN SALAF & MODERN',
    libraryName: settings.library_name || 'PERPUSTAKAAN MAKTABAH AL-HIKMAH',
    subHeader: 'KEMENTERIAN AGAMA RI & LEMBAGA PENGEMBANGAN LITERASI SANTRI',
    certificateTitle: initialAward?.title || 'PIAGAM PENGHARGAAN DUTA LITERASI',
    certificateSubtitle: 'Apresiasi Prestasi, Ketekunan Membaca, dan Khidmah Keilmuan Santri',
    certificateNo: initialAward?.certificate_no || `PP-LIT/${year}/${monthRoman}/${String(Math.floor(100 + Math.random() * 900))}`,
    period: initialAward?.period || `${monthNames[today.getMonth()]} ${year}`,
    citationText: initialAward?.notes || 
      'Atas dedikasi, keistiqomahan, dan capaian luar biasa dalam meluangkan waktu membaca kitab, mengkaji khazanah keilmuan Islam, serta memakmurkan perpustakaan pesantren.',
    rewardItem: initialAward?.reward_item || 'Satu Set Kitab Turats Pilihan + Piagam & Voucher Pustaka',
    showReward: true,
    showStudentPhoto: true,
    showStatsBadge: true,
    showQrCode: true,
    showSignatures: true,
    showDigitalSeal: true,
    signer1Title: 'Kepala Perpustakaan',
    signer1Name: 'Ustadz Abdullah Hafiz, M.Pd.',
    signer1Nip: 'NIY. 19880412 201201 1 004',
    signer2Title: 'Pengasuh Pondok Pesantren',
    signer2Name: 'K.H. Ahmad Dahlan, Lc., M.A.',
    signer2Role: 'Mudir Ma\'had & Dewan Pembina',
    awardedDateHijri: '19 Shafar 1448 H',
    awardedDateGregorian: formattedToday,
    cityLocation: 'Jombang',
    sealColor: 'emerald'
  });

  // Sync with initial award or student when opened
  useEffect(() => {
    if (initialStudent) {
      setSelectedStudentId(initialStudent.id);
    }
    if (initialAward) {
      setConfig(prev => ({
        ...prev,
        certificateTitle: initialAward.title,
        certificateNo: initialAward.certificate_no,
        period: initialAward.period,
        citationText: initialAward.notes || prev.citationText,
        rewardItem: initialAward.reward_item || prev.rewardItem
      }));
    }
  }, [initialStudent, initialAward, isOpen]);

  // Generate verification QR code
  useEffect(() => {
    if (activeStudent) {
      const qrPayload = `PIAGAM-RESMI|${config.certificateNo}|NIS:${activeStudent.nis}|${activeStudent.name}|${config.period}|VERIFIED`;
      generateQrDataUrl(qrPayload, {
        width: 140,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      }).then(url => {
        setQrCodeUrl(url);
      }).catch(console.error);
    }
  }, [activeStudent, config.certificateNo, config.period]);

  // Narrative Presets
  const applyPresetCitation = (presetType: 'top_reader' | 'turats' | 'discipline' | 'duta' | 'khatam') => {
    if (presetType === 'top_reader') {
      setConfig(prev => ({
        ...prev,
        certificateTitle: 'PIAGAM BINTANG PUSTAKA (SANTRI TERAJIN MEMBACA)',
        certificateSubtitle: 'Penghargaan Kategori Kunjungan & Waktu Muthola\'ah Tertinggi',
        citationText: 'Dianugerahkan sebagai wujud apresiasi atas keistiqomahan, kedisiplinan, dan dedikasi tertinggi dalam menghidupkan waktu luang dengan muthola\'ah dan membaca di perpustakaan pesantren.',
        rewardItem: 'Kitab Fathul Qorib Syarah + Trophy Kehormatan + Voucher Koperasi Rp 50.000'
      }));
    } else if (presetType === 'turats') {
      setConfig(prev => ({
        ...prev,
        certificateTitle: 'PIAGAM PENGKAJI KITAB TURATS & TAFSIR',
        certificateSubtitle: 'Apresiasi Santri Teraktif Membaca dan Meminjam Khazanah Kitab Kuning',
        citationText: 'Dianugerahkan atas kecintaan yang mendalam terhadap khazanah keilmuan Islam klasik (Turats) serta keaktifan mengkaji dan meminjam kitab-kitab induk di perpustakaan.',
        rewardItem: 'Kamus Al-Munawwir Arab-Indonesia + Piagam Resmi Pustaka'
      }));
    } else if (presetType === 'discipline') {
      setConfig(prev => ({
        ...prev,
        certificateTitle: 'BINTANG DISIPLIN & AMANAH BUKU PERPUSTAKAAN',
        certificateSubtitle: 'Penghargaan Integritas dan Ketepatan Pengembalian Amanah Koleksi',
        citationText: 'Dianugerahkan atas integritas, kedisiplinan, dan ketepatan waktu dalam mengembalikan pinjaman kitab serta menjaga fisik buku dengan penuh rasa tanggung jawab.',
        rewardItem: 'Al-Qur\'an Mushaf Tajwid Warna + Sertifikat Kehormatan'
      }));
    } else if (presetType === 'duta') {
      setConfig(prev => ({
        ...prev,
        certificateTitle: 'PIAGAM KEHORMATAN DUTA LITERASI PESANTREN',
        certificateSubtitle: 'Anugerah Tertinggi Penggerak Minat Baca & Keteladanan Santri',
        citationText: 'Ditetapkan secara resmi sebagai Duta Literasi Pesantren atas teladan akhlak keilmuan, wawasan luas, dan kontribusi inspiratif dalam mengajak santri lain gemar membaca.',
        rewardItem: 'Selempang Duta Literasi + 1 Set Kitab Pilihan + Kartu Anggota VIP Maktabah'
      }));
    } else if (presetType === 'khatam') {
      setConfig(prev => ({
        ...prev,
        certificateTitle: 'PIAGAM KHATAM 100 JAM MUTHOLA\'AH MANDIRI',
        certificateSubtitle: 'Pencapaian Milestone Jam Belajar & Riset Perpustakaan',
        citationText: 'Telah berhasil melampaui target pencapaian 100 jam muthola\'ah intensif secara istiqomah di perpustakaan dengan catatan presensi dan resensi yang membanggakan.',
        rewardItem: 'Sertifikat Kompetensi Riset Santri + Souvenir Eksklusif Maktabah'
      }));
    }
  };

  // Filter students for batch mode
  const batchCandidateStudents = useMemo(() => {
    let list = [...students];
    if (batchClassFilter !== 'all') {
      list = list.filter(s => s.class === batchClassFilter);
    }
    return list;
  }, [students, batchClassFilter]);

  const handleSelectAllBatch = () => {
    if (batchSelectedStudentIds.length === batchCandidateStudents.length) {
      setBatchSelectedStudentIds([]);
    } else {
      setBatchSelectedStudentIds(batchCandidateStudents.map(s => s.id));
    }
  };

  const handleToggleBatchStudent = (id: string) => {
    setBatchSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Select Top 3 or Top 10 by XP
  const handleSelectTopRankingBatch = (count: number) => {
    const sorted = [...students].map(s => calculateStudentProfile(s, visits, loans, books, awards))
      .sort((a, b) => b.totalXp - a.totalXp)
      .slice(0, count)
      .map(p => p.student.id);
    setBatchSelectedStudentIds(sorted);
  };

  // Print execution with body isolation and cleanup
  const handlePrint = () => {
    document.body.classList.add('printing-certificate');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-certificate');
    }, 1000);
  };

  // WhatsApp send handler
  const handleSendWa = async () => {
    if (!activeStudent) return;
    setIsSendingWa(true);
    try {
      // Find or generate award record for WhatsApp notification
      let targetAwardId = initialAward?.id;
      if (!targetAwardId) {
        // Save temporary award first if not existing
        const newAward = addAward({
          student_id: activeStudent.id,
          title: config.certificateTitle,
          period: config.period,
          category: 'top_reader',
          certificate_no: config.certificateNo,
          reward_item: config.rewardItem,
          notes: config.citationText
        });
        targetAwardId = newAward.id;
      }

      await sendAwardWhatsAppCongrats(targetAwardId);
      setWaSentSuccess(true);
      setTimeout(() => setWaSentSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingWa(false);
    }
  };

  // Save customized certificate to database archives
  const handleSaveToArchive = () => {
    if (!activeStudent) return;
    setIsSavingAward(true);
    try {
      addAward({
        student_id: activeStudent.id,
        title: config.certificateTitle,
        period: config.period,
        category: 'top_reader',
        certificate_no: config.certificateNo,
        reward_item: config.rewardItem,
        notes: config.citationText
      });
      setSaveSuccessNotice('Piagam berhasil didaftarkan & tersimpan ke Arsip Penghargaan Sistem.');
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingAward(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto print:p-0 print:m-0 print:bg-white print:fixed print:inset-0 print:z-[99999] print:overflow-visible cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-7xl bg-slate-900 rounded-3xl shadow-2xl border border-amber-500/30 overflow-hidden flex flex-col my-auto max-h-[95vh] print:max-h-none print:h-auto print:shadow-none print:border-none print:w-full print:max-w-none print:m-0 print:p-0 print:bg-transparent cursor-default"
      >
        
        {/* TOP BAR / STUDIO CONTROLS (Hidden when printing) */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-white print:hidden shrink-0 gap-3">
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-500 text-slate-950 shadow-md">
              <Trophy className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white font-serif">
                  Studio Desain & Pencetakan Piagam Literasi
                </h3>
                <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Resmi Pesantren
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kustomisasi template, ornamen kaligrafi, stempel resmi, dan personalisasi santri otomatis.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            
            {/* Mode Toggle: Single vs Batch */}
            <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center">
              <button
                type="button"
                onClick={() => setMode('single')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'single'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Per Santri</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('batch')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'batch'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Cetak Massal (Batch)</span>
              </button>
            </div>

            {/* Quick Actions */}
            <button
              onClick={handleSaveToArchive}
              disabled={isSavingAward || !activeStudent}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors disabled:opacity-50"
              title="Simpan konfigurasi piagam ke arsip penghargaan sistem"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Simpan ke Arsip</span>
            </button>

            <button
              onClick={handleSendWa}
              disabled={isSendingWa || !activeStudent}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50"
              title="Kirim sertifikat & ucapan selamat ke WhatsApp santri/wali"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isSendingWa ? 'Mengirim...' : waSentSuccess ? 'Terkirim ✓' : 'Kirim WA'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (A4)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

          </div>

        </div>

        {/* NOTIFICATIONS BANNER */}
        {saveSuccessNotice && (
          <div className="px-6 py-2 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{saveSuccessNotice}</span>
            </div>
            <button onClick={() => setSaveSuccessNotice(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MAIN STUDIO WORKSPACE */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden print:overflow-visible">
          
          {/* LEFT PANEL: CONFIGURATION CONTROLS (Hidden when printing) */}
          <div className="w-full lg:w-96 bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto print:hidden p-4 space-y-4 shrink-0 text-slate-200">
            
            {/* Student Picker (Single Mode) */}
            {mode === 'single' ? (
              <div className="space-y-2 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Santri Penerima Piagam
                  </label>
                  {activeStudentProfile && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      {activeStudentProfile.totalXp.toLocaleString()} XP
                    </span>
                  )}
                </div>

                {/* Search / Dropdown Student */}
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.class} &bull; NIS: {s.nis})
                    </option>
                  ))}
                </select>

                {/* Active Student Badge Info */}
                {activeStudent && activeStudentProfile && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-700/60">
                    <img
                      src={activeStudent.photo_url}
                      alt={activeStudent.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{activeStudent.name}</p>
                      <p className="text-[11px] text-slate-400">
                        Kelas: <span className="text-slate-200 font-medium">{activeStudent.class}</span> &bull; NIS: <span className="text-slate-200 font-mono">{activeStudent.nis}</span>
                      </p>
                      <p className="text-[10px] text-amber-400 font-medium mt-0.5">
                        ⏱️ {Math.round(activeStudentProfile.totalReadingMinutes / 60)} Jam Baca &bull; 📚 {activeStudentProfile.totalBooksBorrowed} Kitab
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Batch Mode Controls */
              <div className="space-y-3 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Pilih Santri Massal ({batchSelectedStudentIds.length} Dipilih)
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllBatch}
                    className="text-[10px] text-amber-300 hover:underline font-bold"
                  >
                    {batchSelectedStudentIds.length === batchCandidateStudents.length ? 'Batal Semua' : 'Pilih Semua'}
                  </button>
                </div>

                {/* Filter Class */}
                <div className="flex items-center gap-2">
                  <select
                    value={batchClassFilter}
                    onChange={(e) => setBatchClassFilter(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="all">Semua Kelas ({students.length})</option>
                    {classList.map(cls => (
                      <option key={cls} value={cls}>Kelas {cls}</option>
                    ))}
                  </select>
                </div>

                {/* Quick Selection Buttons */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSelectTopRankingBatch(3)}
                    className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-amber-300 font-semibold text-[11px] text-center"
                  >
                    🥇 Top 3 Ranking
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTopRankingBatch(10)}
                    className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-amber-300 font-semibold text-[11px] text-center"
                  >
                    🌟 Top 10 Ranking
                  </button>
                </div>

                {/* Student Checklist */}
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1 border border-slate-700 rounded-xl p-1 bg-slate-900/60">
                  {batchCandidateStudents.map(s => {
                    const isChecked = batchSelectedStudentIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-amber-500/20 text-white' : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleBatchStudent(s.id)}
                          className="w-3.5 h-3.5 text-amber-500 rounded"
                        />
                        <span className="truncate flex-1 font-medium">{s.name} ({s.class})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-Tab Navigation for Customization */}
            <div className="flex border-b border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('template')}
                className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                  activeTab === 'template' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Template
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                  activeTab === 'content' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Teks & Redaksi
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('signer')}
                className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                  activeTab === 'signer' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Pengesahan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('layout')}
                className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                  activeTab === 'layout' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Tampilan
              </button>
            </div>

            {/* TAB 1: TEMPLATE STYLES */}
            {activeTab === 'template' && (
              <div className="space-y-4">
                
                {/* Template Cards */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Pilih Tema & Gaya Visual Piagam
                  </label>

                  {/* Template 1: Turats Emerald Islamic */}
                  <div
                    onClick={() => setConfig(prev => ({ ...prev, templateStyle: 'turats_emerald', sealColor: 'emerald' }))}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      config.templateStyle === 'turats_emerald'
                        ? 'border-emerald-500 bg-emerald-950/40 shadow-md ring-1 ring-emerald-500'
                        : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-900 border border-emerald-500/40 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-white">Turats Klasik & Ornamen Islami</h4>
                        {config.templateStyle === 'turats_emerald' && (
                          <Check className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Bingkai hijau zamrud, ornamen geometris Islam, lafadz basmalah kaligrafi, dan cap stempel resmi.
                      </p>
                    </div>
                  </div>

                  {/* Template 2: Royal Gold & Navy */}
                  <div
                    onClick={() => setConfig(prev => ({ ...prev, templateStyle: 'royal_navy', sealColor: 'gold' }))}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      config.templateStyle === 'royal_navy'
                        ? 'border-amber-400 bg-amber-950/40 shadow-md ring-1 ring-amber-400'
                        : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-900 to-slate-950 border border-amber-400/40 flex items-center justify-center shrink-0">
                      <Crown className="w-5 h-5 text-amber-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-white">Modern Royal Gold & Navy</h4>
                        {config.templateStyle === 'royal_navy' && (
                          <Check className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Kesan mewah prestisius dengan garis emas royal, emblem piala kejuaraan, dan tipografi modern formal.
                      </p>
                    </div>
                  </div>

                  {/* Template 3: Burgundy Classic Heritage */}
                  <div
                    onClick={() => setConfig(prev => ({ ...prev, templateStyle: 'burgundy_classic', sealColor: 'red' }))}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      config.templateStyle === 'burgundy_classic'
                        ? 'border-rose-500 bg-rose-950/40 shadow-md ring-1 ring-rose-500'
                        : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-900 to-red-950 border border-rose-400/40 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5 text-rose-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-white">Burgundy Classic & Khazanah Pondok</h4>
                        {config.templateStyle === 'burgundy_classic' && (
                          <Check className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Warna merah marun terhormat, bingkai ukiran ganda, dan kesan piagam sanad keilmuan khas pesantren.
                      </p>
                    </div>
                  </div>

                  {/* Template 4: Clean Editorial Monochrome */}
                  <div
                    onClick={() => setConfig(prev => ({ ...prev, templateStyle: 'clean_editorial', sealColor: 'gold' }))}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      config.templateStyle === 'clean_editorial'
                        ? 'border-slate-400 bg-slate-800 shadow-md ring-1 ring-slate-400'
                        : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-400/40 flex items-center justify-center shrink-0">
                      <FileCheck className="w-5 h-5 text-slate-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-white">Editorial Minimalis & Kertas Linen</h4>
                        {config.templateStyle === 'clean_editorial' && (
                          <Check className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Layout bersih kontemporer dengan tipografi tajam, cocok untuk dicetak di kertas piagam tebal bertekstur.
                      </p>
                    </div>
                  </div>

                  {/* Template 5: Vibrant Sunburst */}
                  <div
                    onClick={() => setConfig(prev => ({ ...prev, templateStyle: 'vibrant_sunburst', sealColor: 'gold' }))}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      config.templateStyle === 'vibrant_sunburst'
                        ? 'border-yellow-400 bg-yellow-950/40 shadow-md ring-1 ring-yellow-400'
                        : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-yellow-600 border border-yellow-300/40 flex items-center justify-center shrink-0">
                      <Star className="w-5 h-5 text-yellow-200" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-white">Bintang Prestasi & Ceria Edukasi</h4>
                        {config.templateStyle === 'vibrant_sunburst' && (
                          <Check className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Warna cerah inspiratif dengan elemen bintang piala, sangat cocok untuk santri muda / tingkat ibtida'/tsanawiyah.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Orientation & Size */}
                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Orientasi Kertas</label>
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
                      <button
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, orientation: 'landscape' }))}
                        className={`py-1 text-[11px] font-bold rounded-lg ${
                          config.orientation === 'landscape' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
                        }`}
                      >
                        Lanskap
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, orientation: 'portrait' }))}
                        className={`py-1 text-[11px] font-bold rounded-lg ${
                          config.orientation === 'portrait' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
                        }`}
                      >
                        Potret
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Ukuran Kertas</label>
                    <select
                      value={config.paperSize}
                      onChange={(e) => setConfig(prev => ({ ...prev, paperSize: e.target.value as 'A4' | 'F4' }))}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-semibold"
                    >
                      <option value="A4">A4 (210 × 297 mm)</option>
                      <option value="F4">F4 / Folio (215 × 330 mm)</option>
                    </select>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: CONTENT & NARRATIVE */}
            {activeTab === 'content' && (
              <div className="space-y-3.5">
                
                {/* One-Click Presets */}
                <div>
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1.5">
                    Preset Kategori & Narasi Cepat
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPresetCitation('top_reader')}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] text-slate-200 text-left truncate font-medium"
                    >
                      🌟 Pembaca Terajin
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetCitation('turats')}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] text-slate-200 text-left truncate font-medium"
                    >
                      📚 Pengkaji Turats
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetCitation('discipline')}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] text-slate-200 text-left truncate font-medium"
                    >
                      🛡️ Disiplin & Amanah
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetCitation('duta')}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] text-slate-200 text-left truncate font-medium"
                    >
                      👑 Duta Literasi
                    </button>
                  </div>
                </div>

                {/* Judul Piagam */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 block">Judul Piagam Utama</label>
                  <input
                    type="text"
                    value={config.certificateTitle}
                    onChange={(e) => setConfig(prev => ({ ...prev, certificateTitle: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* Sub-Judul */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 block">Sub-Judul / Kategori</label>
                  <input
                    type="text"
                    value={config.certificateSubtitle}
                    onChange={(e) => setConfig(prev => ({ ...prev, certificateSubtitle: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                {/* Nomor Surat & Periode */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 block">Nomor Piagam</label>
                    <input
                      type="text"
                      value={config.certificateNo}
                      onChange={(e) => setConfig(prev => ({ ...prev, certificateNo: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 block">Periode</label>
                    <input
                      type="text"
                      value={config.period}
                      onChange={(e) => setConfig(prev => ({ ...prev, period: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                {/* Narasi / Teks Apresiasi */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 block">Redaksi / Narasi Apresiasi</label>
                  <textarea
                    rows={3}
                    value={config.citationText}
                    onChange={(e) => setConfig(prev => ({ ...prev, citationText: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:ring-1 focus:ring-amber-500 leading-relaxed"
                  />
                </div>

                {/* Hadiah / Reward */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-400">Hadiah / Reward Fisik</label>
                    <label className="flex items-center gap-1 text-[10px] text-amber-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.showReward}
                        onChange={(e) => setConfig(prev => ({ ...prev, showReward: e.target.checked }))}
                        className="rounded text-amber-500 w-3 h-3"
                      />
                      <span>Tampilkan</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={config.rewardItem}
                    onChange={(e) => setConfig(prev => ({ ...prev, rewardItem: e.target.value }))}
                    disabled={!config.showReward}
                    className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white disabled:opacity-40"
                  />
                </div>

              </div>
            )}

            {/* TAB 3: SIGNERS & LEGALITY */}
            {activeTab === 'signer' && (
              <div className="space-y-3.5">
                
                {/* Tanggal & Tempat */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 block">Kota Ditetapkan</label>
                    <input
                      type="text"
                      value={config.cityLocation}
                      onChange={(e) => setConfig(prev => ({ ...prev, cityLocation: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 block">Tanggal Hijriyah</label>
                    <input
                      type="text"
                      value={config.awardedDateHijri}
                      onChange={(e) => setConfig(prev => ({ ...prev, awardedDateHijri: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 block">Tanggal Masehi</label>
                  <input
                    type="text"
                    value={config.awardedDateGregorian}
                    onChange={(e) => setConfig(prev => ({ ...prev, awardedDateGregorian: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                {/* Signer 1 (Kepala Perpustakaan) */}
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2">
                  <p className="text-xs font-bold text-amber-400">Penandatangan 1 (Pustakawan)</p>
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={config.signer1Title}
                      onChange={(e) => setConfig(prev => ({ ...prev, signer1Title: e.target.value }))}
                      placeholder="Jabatan (e.g. Kepala Perpustakaan)"
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                    <input
                      type="text"
                      value={config.signer1Name}
                      onChange={(e) => setConfig(prev => ({ ...prev, signer1Name: e.target.value }))}
                      placeholder="Nama Lengkap & Gelar"
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white"
                    />
                    <input
                      type="text"
                      value={config.signer1Nip}
                      onChange={(e) => setConfig(prev => ({ ...prev, signer1Nip: e.target.value }))}
                      placeholder="NIP / NIY"
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-slate-300 font-mono"
                    />
                  </div>
                </div>

                {/* Signer 2 (Pengasuh Pondok Pesantren) */}
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2">
                  <p className="text-xs font-bold text-amber-400">Penandatangan 2 (Pengasuh Pondok)</p>
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={config.signer2Title}
                      onChange={(e) => setConfig(prev => ({ ...prev, signer2Title: e.target.value }))}
                      placeholder="Jabatan (e.g. Pengasuh Pondok Pesantren)"
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                    <input
                      type="text"
                      value={config.signer2Name}
                      onChange={(e) => setConfig(prev => ({ ...prev, signer2Name: e.target.value }))}
                      placeholder="Nama Lengkap Kyai / Mudir"
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white"
                    />
                    <input
                      type="text"
                      value={config.signer2Role}
                      onChange={(e) => setConfig(prev => ({ ...prev, signer2Role: e.target.value }))}
                      placeholder="Keterangan Dewan Pembina"
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-slate-300"
                    />
                  </div>
                </div>

              </div>
            )}

            {/* TAB 4: VISUAL TOGGLES & BADGES */}
            {activeTab === 'layout' && (
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Elemen Visual & Verifikasi
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer">
                  <span className="text-xs font-medium text-slate-200">Foto Resmi Santri</span>
                  <input
                    type="checkbox"
                    checked={config.showStudentPhoto}
                    onChange={(e) => setConfig(prev => ({ ...prev, showStudentPhoto: e.target.checked }))}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer">
                  <span className="text-xs font-medium text-slate-200">QR Code Verifikasi Digital</span>
                  <input
                    type="checkbox"
                    checked={config.showQrCode}
                    onChange={(e) => setConfig(prev => ({ ...prev, showQrCode: e.target.checked }))}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer">
                  <span className="text-xs font-medium text-slate-200">Cap Stempel Resmi Pesantren</span>
                  <input
                    type="checkbox"
                    checked={config.showDigitalSeal}
                    onChange={(e) => setConfig(prev => ({ ...prev, showDigitalSeal: e.target.checked }))}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer">
                  <span className="text-xs font-medium text-slate-200">Tanda Tangan Digital Pejabat</span>
                  <input
                    type="checkbox"
                    checked={config.showSignatures}
                    onChange={(e) => setConfig(prev => ({ ...prev, showSignatures: e.target.checked }))}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer">
                  <span className="text-xs font-medium text-slate-200">Badge Statistik Literasi (XP & Jam)</span>
                  <input
                    type="checkbox"
                    checked={config.showStatsBadge}
                    onChange={(e) => setConfig(prev => ({ ...prev, showStatsBadge: e.target.checked }))}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                </label>

                {/* Kop Lembaga Fields */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <p className="text-xs font-bold text-amber-400">Kop Lembaga & Pesantren</p>
                  <input
                    type="text"
                    value={config.institutionName}
                    onChange={(e) => setConfig(prev => ({ ...prev, institutionName: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white uppercase font-semibold"
                  />
                  <input
                    type="text"
                    value={config.libraryName}
                    onChange={(e) => setConfig(prev => ({ ...prev, libraryName: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white uppercase font-bold"
                  />
                </div>
              </div>
            )}

          </div>

          {/* RIGHT PANEL: LIVE HIGH-RESOLUTION CERTIFICATE PREVIEW & BATCH CONTAINER */}
          <div className="flex-1 bg-slate-950 p-4 sm:p-6 overflow-y-auto flex flex-col items-center justify-start print:p-0 print:bg-white print:overflow-visible print:block print:w-full">
            
            <div 
              ref={printAreaRef}
              className="w-full max-w-5xl flex flex-col items-center gap-8 print:w-full print:max-w-none print:m-0 print:p-0 print:gap-0"
            >
              
              {/* If Single Mode -> Render 1 Certificate */}
              {mode === 'single' && activeStudent && (
                <div className="w-full flex justify-center print:m-0 print:p-0 print:block">
                  <CertificateCardRender
                    student={activeStudent}
                    profile={activeStudentProfile}
                    config={config}
                    qrCodeUrl={qrCodeUrl}
                  />
                </div>
              )}

              {/* If Batch Mode -> Render All Selected Students */}
              {mode === 'batch' && (
                batchSelectedStudentIds.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-800 rounded-3xl w-full">
                    <Users className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                    <h4 className="text-base font-bold text-white">Belum ada santri yang dipilih untuk cetak massal</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Centang santri di panel kiri atau klik "Top 3" / "Top 10" untuk menghasilkan puluhan piagam sekaligus.
                    </p>
                  </div>
                ) : (
                  batchSelectedStudentIds.map((stdId, idx) => {
                    const std = students.find(s => s.id === stdId);
                    if (!std) return null;
                    const prof = calculateStudentProfile(std, visits, loans, books, awards);
                    return (
                      <div key={std.id} className="w-full flex flex-col items-center certificate-sheet-printable certificate-page-break mb-6 print:mb-0 print:p-0">
                        <CertificateCardRender
                          student={std}
                          profile={prof}
                          config={{
                            ...config,
                            certificateNo: `PP-LIT/${year}/${monthRoman}/${String(100 + idx).padStart(3, '0')}`
                          }}
                          qrCodeUrl={qrCodeUrl}
                        />
                      </div>
                    );
                  })
                )
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

// ============================================================================
// SINGLE CERTIFICATE RENDER COMPONENT
// ============================================================================
interface CertificateCardRenderProps {
  student: Student;
  profile: ReturnType<typeof calculateStudentProfile> | null;
  config: CertificateDesignConfig;
  qrCodeUrl: string;
}

const CertificateCardRender: React.FC<CertificateCardRenderProps> = ({
  student,
  profile,
  config,
  qrCodeUrl
}) => {
  const isLandscape = config.orientation === 'landscape';

  // Choose Theme Styles
  let themeContainerStyle = '';
  let themeOuterBorderStyle = '';
  let themeInnerBorderStyle = '';
  let themePrimaryTextColor = '';
  let themeAccentTextColor = '';
  let themeSealColor = '';
  let themeOrnamentColor = '';

  if (config.templateStyle === 'turats_emerald') {
    themeContainerStyle = 'bg-gradient-to-br from-[#fbfdfa] via-[#ffffff] to-[#f4f9f4] text-slate-900';
    themeOuterBorderStyle = 'border-[10px] border-emerald-900/90 shadow-2xl';
    themeInnerBorderStyle = 'border-2 border-double border-amber-600/80';
    themePrimaryTextColor = 'text-emerald-950';
    themeAccentTextColor = 'text-amber-800';
    themeSealColor = 'text-emerald-800 border-emerald-700 bg-emerald-50';
    themeOrnamentColor = 'border-amber-600 text-amber-700';
  } else if (config.templateStyle === 'royal_navy') {
    themeContainerStyle = 'bg-gradient-to-br from-[#f8faff] via-[#ffffff] to-[#eff4fc] text-slate-900';
    themeOuterBorderStyle = 'border-[10px] border-slate-900 shadow-2xl';
    themeInnerBorderStyle = 'border-2 border-amber-500';
    themePrimaryTextColor = 'text-slate-950';
    themeAccentTextColor = 'text-amber-700';
    themeSealColor = 'text-amber-700 border-amber-500 bg-amber-50/70';
    themeOrnamentColor = 'border-amber-500 text-amber-600';
  } else if (config.templateStyle === 'burgundy_classic') {
    themeContainerStyle = 'bg-gradient-to-br from-[#fffdfa] via-[#ffffff] to-[#fbf2f2] text-slate-900';
    themeOuterBorderStyle = 'border-[10px] border-[#66101f] shadow-2xl';
    themeInnerBorderStyle = 'border-2 border-dashed border-amber-600';
    themePrimaryTextColor = 'text-[#440a14]';
    themeAccentTextColor = 'text-[#8b1e2f]';
    themeSealColor = 'text-rose-800 border-rose-700 bg-rose-50';
    themeOrnamentColor = 'border-amber-600 text-amber-700';
  } else if (config.templateStyle === 'clean_editorial') {
    themeContainerStyle = 'bg-white text-slate-900';
    themeOuterBorderStyle = 'border-[6px] border-slate-900 shadow-xl';
    themeInnerBorderStyle = 'border border-slate-300';
    themePrimaryTextColor = 'text-slate-950';
    themeAccentTextColor = 'text-amber-800';
    themeSealColor = 'text-slate-900 border-slate-800 bg-slate-50';
    themeOrnamentColor = 'border-slate-800 text-slate-800';
  } else {
    // vibrant_sunburst
    themeContainerStyle = 'bg-gradient-to-br from-amber-50/70 via-white to-yellow-50/50 text-slate-900';
    themeOuterBorderStyle = 'border-[10px] border-amber-600 shadow-2xl';
    themeInnerBorderStyle = 'border-2 border-amber-400';
    themePrimaryTextColor = 'text-slate-950';
    themeAccentTextColor = 'text-amber-800';
    themeSealColor = 'text-amber-800 border-amber-600 bg-amber-100/60';
    themeOrnamentColor = 'border-amber-500 text-amber-600';
  }

  return (
    <div 
      className={`relative w-full ${isLandscape ? 'aspect-[1.414/1] max-h-[750px] print:aspect-[1.414/1]' : 'aspect-[1/1.414] max-w-[650px] print:aspect-[1/1.414]'} ${themeContainerStyle} ${themeOuterBorderStyle} rounded-xl p-5 sm:p-7 md:p-9 flex flex-col justify-between overflow-hidden print:shadow-none print:rounded-none print:w-full print:h-[100vh] print:max-h-none print:m-0 print:border-[8px] print:p-8 select-none transition-all certificate-sheet-printable`}
      style={{
        boxSizing: 'border-box'
      }}
    >
      
      {/* Background Subtle Watermark Ornaments */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
        <BookOpen className="w-[32rem] h-[32rem] text-slate-900" />
      </div>

      {/* INNER DECORATIVE BORDER */}
      <div className={`relative w-full h-full ${themeInnerBorderStyle} p-4 sm:p-6 md:p-7 rounded-lg flex flex-col justify-between z-10`}>
        
        {/* FOUR CORNER ORNAMENTS (Islamic Geometric Filigree) */}
        <div className={`absolute -top-1.5 -left-1.5 w-7 h-7 border-t-2 border-l-2 ${themeOrnamentColor}`}>
          <div className="w-2 h-2 bg-amber-500 rounded-full m-0.5" />
        </div>
        <div className={`absolute -top-1.5 -right-1.5 w-7 h-7 border-t-2 border-r-2 ${themeOrnamentColor}`}>
          <div className="w-2 h-2 bg-amber-500 rounded-full m-0.5 ml-auto" />
        </div>
        <div className={`absolute -bottom-1.5 -left-1.5 w-7 h-7 border-b-2 border-l-2 ${themeOrnamentColor}`}>
          <div className="w-2 h-2 bg-amber-500 rounded-full m-0.5 mt-auto" />
        </div>
        <div className={`absolute -bottom-1.5 -right-1.5 w-7 h-7 border-b-2 border-r-2 ${themeOrnamentColor}`}>
          <div className="w-2 h-2 bg-amber-500 rounded-full m-0.5 mt-auto ml-auto" />
        </div>

        {/* 1. HEADER / KOP LEMBAGA RESMI */}
        <div className="text-center space-y-1">
          
          {/* Basmalah / Arabic Header */}
          <p className="font-serif text-sm sm:text-base text-amber-900/80 tracking-wide font-medium">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>

          <p className="text-[9px] sm:text-[10px] tracking-widest font-bold uppercase text-slate-600">
            {config.institutionName}
          </p>
          <h1 className={`text-lg sm:text-2xl md:text-3xl font-black tracking-wide uppercase font-serif ${themePrimaryTextColor}`}>
            {config.libraryName}
          </h1>
          <p className="text-[8px] sm:text-[9px] tracking-wider font-semibold text-slate-500 uppercase">
            {config.subHeader}
          </p>
          
          <div className="w-36 sm:w-52 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-1.5" />
        </div>

        {/* 2. PIAGAM TITLE & CERTIFICATE NUMBER */}
        <div className="text-center my-1 sm:my-2 space-y-0.5">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-extrabold text-amber-800 bg-amber-100/80 px-3 py-0.5 rounded-full border border-amber-300">
            PIAGAM PENGHARGAAN RESMI
          </span>
          <h2 className={`text-base sm:text-xl md:text-2xl font-black tracking-wide font-serif ${themeAccentTextColor}`}>
            {config.certificateTitle}
          </h2>
          <p className="text-[10px] sm:text-xs text-slate-600 font-medium">
            {config.certificateSubtitle}
          </p>
          <p className="text-[9px] sm:text-[10px] text-slate-500 font-mono">
            NOMOR: <span className="font-bold text-slate-800">{config.certificateNo}</span> &bull; PERIODE: <span className="font-bold text-slate-800">{config.period}</span>
          </p>
        </div>

        {/* 3. RECIPIENT NAME & IDENTITY (PERSONALIZED) */}
        <div className="text-center my-1 sm:my-2 space-y-1.5">
          <p className="text-xs sm:text-sm italic text-slate-600 font-serif">
            Dengan penuh rasa syukur dan bangga, piagam penghargaan ini dianugerahkan kepada:
          </p>

          <div className="flex items-center justify-center gap-3 sm:gap-4 my-1">
            
            {/* Student Photo (If enabled) */}
            {config.showStudentPhoto && student.photo_url && (
              <img
                src={student.photo_url}
                alt={student.name}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-amber-500 shadow-md ring-2 ring-white"
              />
            )}

            <div className="text-left sm:text-center">
              <h3 className={`text-xl sm:text-2xl md:text-3xl font-extrabold font-serif ${themePrimaryTextColor} border-b-2 border-dashed border-amber-500/80 pb-0.5 inline-block`}>
                {student.name}
              </h3>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-1">
                NIS: <span className="font-mono text-slate-900 font-bold">{student.nis}</span> &nbsp;|&nbsp; Kelas / Asrama: <span className="text-slate-900 font-bold">{student.class}</span>
              </p>
            </div>

          </div>

          {/* Gamification Stats Badge (If enabled) */}
          {config.showStatsBadge && profile && (
            <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-amber-50 border border-amber-300/80 text-[10px] font-bold text-amber-900 shadow-xs">
              <span>🌟 {profile.totalXp.toLocaleString()} Total XP</span>
              <span>&bull;</span>
              <span>⏱️ {Math.round(profile.totalReadingMinutes / 60)} Jam Muthola'ah</span>
              <span>&bull;</span>
              <span>📚 {profile.totalBooksBorrowed} Kitab Dipelajari</span>
            </div>
          )}
        </div>

        {/* 4. CITATION & REWARD TEXT */}
        <div className="max-w-2xl mx-auto text-center my-1 sm:my-2 bg-white/70 p-2.5 sm:p-3.5 rounded-xl border border-amber-200/80 shadow-xs">
          <p className="text-[11px] sm:text-xs text-slate-800 leading-relaxed font-sans">
            "{config.citationText}"
          </p>

          {config.showReward && config.rewardItem && (
            <div className="mt-1.5 pt-1.5 border-t border-amber-200/60 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-amber-900">
              <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Apresiasi Hadiah: {config.rewardItem}</span>
            </div>
          )}
        </div>

        {/* 5. SIGNATURES & OFFICIAL VERIFICATION SEAL */}
        <div className="mt-2 pt-2 grid grid-cols-3 items-end text-center gap-2">
          
          {/* Signer 1: Librarian */}
          <div className="space-y-0.5">
            <p className="text-[10px] sm:text-xs text-slate-600 font-medium">
              {config.signer1Title}
            </p>
            
            <div className="h-10 sm:h-12 flex items-center justify-center">
              {config.showSignatures ? (
                <span className="font-serif italic text-xs sm:text-sm text-emerald-800 font-bold">
                  [ Tanda Tangan Digital ]
                </span>
              ) : (
                <div className="w-20 border-b border-slate-400" />
              )}
            </div>

            <p className="text-[11px] sm:text-xs font-bold text-slate-900 underline">
              {config.signer1Name}
            </p>
            <p className="text-[9px] text-slate-500 font-mono">
              {config.signer1Nip}
            </p>
          </div>

          {/* Center: Digital Seal & QR Code */}
          <div className="flex flex-col items-center justify-center space-y-1">
            {config.showQrCode && qrCodeUrl ? (
              <div className="p-1 bg-white border border-slate-300 rounded-lg shadow-xs">
                <img src={qrCodeUrl} alt="QR Verification" className="w-12 h-12 sm:w-14 sm:h-14" />
              </div>
            ) : config.showDigitalSeal ? (
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed ${themeSealColor} flex flex-col items-center justify-center p-1 shadow-sm`}>
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-wider">Sah & Resmi</span>
              </div>
            ) : null}

            <p className="text-[8px] sm:text-[9px] text-slate-500 font-medium">
              {config.cityLocation}, {config.awardedDateGregorian}
            </p>
            <p className="text-[8px] text-slate-400">
              ({config.awardedDateHijri})
            </p>
          </div>

          {/* Signer 2: Pengasuh Pesantren */}
          <div className="space-y-0.5">
            <p className="text-[10px] sm:text-xs text-slate-600 font-medium">
              {config.signer2Title}
            </p>
            
            <div className="h-10 sm:h-12 flex items-center justify-center">
              {config.showSignatures ? (
                <span className="font-serif italic text-xs sm:text-sm text-emerald-800 font-bold">
                  [ Cap Basah & TTD Kyai ]
                </span>
              ) : (
                <div className="w-20 border-b border-slate-400" />
              )}
            </div>

            <p className="text-[11px] sm:text-xs font-bold text-slate-900 underline">
              {config.signer2Name}
            </p>
            <p className="text-[9px] text-slate-500">
              {config.signer2Role}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
