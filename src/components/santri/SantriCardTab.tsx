import React, { useState, useEffect, useRef } from 'react';
import { 
  CreditCard, 
  QrCode, 
  Download, 
  Copy, 
  Check, 
  Maximize2, 
  X, 
  Sparkles, 
  ShieldCheck, 
  RotateCw, 
  Printer, 
  Radio, 
  CheckCircle2, 
  GraduationCap, 
  BookOpen, 
  AlertCircle,
  Camera,
  Sun,
  Smartphone,
  ScanLine,
  Sliders,
  CheckCircle,
  ExternalLink,
  Info
} from 'lucide-react';
import { Student, RfidCard, LibrarySettings, TapResult } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { useLibrary } from '../../context/LibraryContext';
import { generateQrDataUrl } from '../../utils/qrUtils';
import { downloadCardElementAsPng } from '../../utils/cardDownloadUtils';

interface SantriCardTabProps {
  student: Student;
  cards: RfidCard[];
  settings: LibrarySettings;
}

export const SantriCardTab: React.FC<SantriCardTabProps> = ({ student, cards, settings }) => {
  const { handleRfidTap } = useLibrary();

  // View state: 'card' (virtual physical card) or 'qr_view' (dedicated camera scanner view)
  const [viewMode, setViewMode] = useState<'card' | 'qr_view'>('card');
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');
  const [qrSize, setQrSize] = useState<'normal' | 'xlarge'>('normal');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedUid, setCopiedUid] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);
  const [testTapResult, setTestTapResult] = useState<TapResult | null>(null);
  const [isTestingTap, setIsTestingTap] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  // Find linked physical RFID card if any
  const linkedCard = cards.find(c => c.student_id === student.id);
  const cardUid = student.rfid_uid || linkedCard?.uid || `RFID-${student.nis}`;
  const isRfidActive = Boolean(student.rfid_uid || linkedCard);

  useEffect(() => {
    // Generate high-resolution QR code with maximum error correction (Level H)
    generateQrDataUrl(cardUid, {
      width: 500,
      margin: 2,
      color: { dark: '#022c22', light: '#ffffff' },
      errorCorrectionLevel: 'H'
    }).then(url => {
      setQrDataUrl(url);
    });
  }, [cardUid]);

  const handleCopyUid = () => {
    navigator.clipboard.writeText(cardUid).then(() => {
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    });
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    setIsDownloadingCard(true);
    try {
      const fileName = `Kartu_Santri_${student.name.replace(/\s+/g, '_')}_${student.nis}_${cardSide}.png`;
      await downloadCardElementAsPng(cardRef.current, fileName, 3);
    } catch (err) {
      console.error('Failed to download card:', err);
    } finally {
      setIsDownloadingCard(false);
    }
  };

  const handleDownloadQrOnly = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_Absensi_${student.name.replace(/\s+/g, '_')}_${student.nis}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRunTestTap = async () => {
    setIsTestingTap(true);
    setTestTapResult(null);
    try {
      const result = await handleRfidTap(cardUid);
      setTestTapResult(result);
    } catch (err) {
      console.error('Error testing tap:', err);
    } finally {
      setIsTestingTap(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Mode Switcher & Actions */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Identitas & Absensi Santri
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
              UID: {cardUid}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white">Kartu Anggota & QR Code Kamera</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Pilih tampilan kartu santri atau buka layar QR beresolusi tinggi untuk diarahkan ke scanner kamera Kiosk.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Segmented View Switcher: Card View vs QR Camera View */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Kartu Digital</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('qr_view')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'qr_view'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Layar Absensi QR</span>
            </button>
          </div>

          {/* Quick Modal Trigger */}
          <button
            id="btn-open-qr-modal"
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/50"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Buka Modal Scanner</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1 & 2: DEDICATED VIEW KHUSUS ABSENSI & KARTU ANGGOTA DIGITAL         */}
      {/* ========================================================================= */}
      <AnimatePresence mode="wait">
        {viewMode === 'qr_view' && (
          <motion.div
            key="qr_view"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="space-y-6"
          >
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
              {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-xl mx-auto text-center space-y-6 relative">
              {/* Header Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <Camera className="w-3.5 h-3.5 animate-pulse" />
                <span>Mode Khusus Absensi Kamera Kiosk</span>
              </div>

              {/* Student Identity Pill */}
              <div className="flex items-center justify-center gap-3">
                {student.photo_url ? (
                  <img
                    src={student.photo_url}
                    alt={student.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500/60 shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-emerald-500/60 flex items-center justify-center text-emerald-400 font-bold">
                    {student.name.charAt(0)}
                  </div>
                )}
                <div className="text-left">
                  <h3 className="text-base font-bold text-white leading-tight">{student.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    NIS: <span className="text-emerald-300 font-bold">{student.nis}</span> • {student.class}
                  </p>
                </div>
              </div>

              {/* HIGH CONTRAST QR SCANNER TARGET FRAME */}
              <div className="relative inline-block mx-auto p-4 sm:p-6 bg-slate-950/90 rounded-3xl border border-slate-800 shadow-2xl">
                {/* Visual Viewfinder Corner Brackets */}
                <div className="absolute top-2 left-2 w-7 h-7 border-t-3 border-l-3 border-emerald-400 rounded-tl-xl pointer-events-none" />
                <div className="absolute top-2 right-2 w-7 h-7 border-t-3 border-r-3 border-emerald-400 rounded-tr-xl pointer-events-none" />
                <div className="absolute bottom-2 left-2 w-7 h-7 border-b-3 border-l-3 border-emerald-400 rounded-bl-xl pointer-events-none" />
                <div className="absolute bottom-2 right-2 w-7 h-7 border-b-3 border-r-3 border-emerald-400 rounded-br-xl pointer-events-none" />

                {/* Pure White Background Box for Zero-Reflection & Max Readability */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-inner relative group cursor-pointer" onClick={() => setIsQrModalOpen(true)}>
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code Absensi - ${student.name}`}
                      className={`mx-auto object-contain transition-all duration-200 ${
                        qrSize === 'xlarge' ? 'w-64 h-64 sm:w-80 sm:h-80' : 'w-52 h-52 sm:w-64 sm:h-64'
                      }`}
                    />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center text-slate-500 font-mono text-xs">
                      Menyiapkan QR Code...
                    </div>
                  )}

                  {/* Subtle scan line animation effect */}
                  <div className="absolute inset-x-4 top-4 bottom-4 pointer-events-none overflow-hidden rounded-xl">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/80 to-transparent shadow-xs animate-pulse opacity-60" />
                  </div>
                </div>

                {/* Live UID Tag Below QR */}
                <div className="mt-3 flex items-center justify-center gap-2 text-xs">
                  <span className="font-mono text-emerald-300 font-bold bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                    {cardUid}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUid}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                    title="Salin UID"
                  >
                    {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* QR Size Toggle & Direct Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setQrSize('normal')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      qrSize === 'normal' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Ukuran Standar
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrSize('xlarge')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      qrSize === 'xlarge' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Ekstra Besar (Jarak Jauh)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadQrOnly}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-teal-400" />
                  <span>Unduh QR (PNG)</span>
                </button>

                <button
                  type="button"
                  onClick={handleRunTestTap}
                  disabled={isTestingTap}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600/30 hover:bg-teal-600/50 text-teal-200 border border-teal-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Simulasi scan langsung pada sistem"
                >
                  <ScanLine className="w-3.5 h-3.5 text-teal-300" />
                  <span>{isTestingTap ? 'Memproses...' : 'Uji Tap Presensi'}</span>
                </button>
              </div>

              {/* Test Tap Result Feedback */}
              {testTapResult && (
                <div className={`p-4 rounded-2xl border text-xs text-left flex items-start gap-3 animate-fade-in ${
                  testTapResult.type.startsWith('success') 
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                }`}>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold block">
                      {testTapResult.type === 'success_in' && '✅ Check-In Berhasil Tercatat'}
                      {testTapResult.type === 'success_out' && '✅ Check-Out Berhasil Tercatat'}
                      {testTapResult.type === 'cooldown_blocked' && '⏳ Proteksi Anti-Passback'}
                    </span>
                    <p>{testTapResult.message}</p>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Waktu: {new Date(testTapResult.timestamp).toLocaleTimeString('id-ID')} WIB
                    </span>
                  </div>
                </div>
              )}

              {/* Tips Camera Scanner Card */}
              <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 text-left text-xs space-y-2">
                <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-400" />
                  Panduan Menghadap Kamera Kiosk:
                </span>
                <ul className="space-y-1.5 text-slate-300 pl-4 list-disc text-[11px] leading-relaxed">
                  <li>
                    <strong>Kecerahan Layar:</strong> Naikkan tingkat kecerahan layar ponsel Anda minimal <strong>80%</strong> agar kontras terbaca jelas oleh sensor kamera.
                  </li>
                  <li>
                    <strong>Jarak Ideal:</strong> Posisikan ponsel sekitar <strong>15 s/d 20 cm</strong> tegak lurus tepat di depan lensa kamera Kiosk.
                  </li>
                  <li>
                    <strong>Hindari Pantulan Lampu:</strong> Pastikan tidak ada pantulan cahaya lampu neon yang menutupi permukaan layar saat diarahkan ke kamera.
                  </li>
                  <li>
                    <strong>Bunyi Verifikasi:</strong> Tahan ponsel secara stabil selama 1 detik hingga terdengar bunyi konfirmasi atau indikator hijau menyala.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: TAMPILAN KARTU ANGGOTA DIGITAL (VIRTUAL PHYSICAL CARD)            */}
      {/* ========================================================================= */}
      {viewMode === 'card' && (
        <motion.div
          key="card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22 }}
          className="flex flex-col lg:flex-row items-center justify-center gap-8 py-2"
        >
          {/* Card Component Container */}
          <div className="w-full max-w-md">
            <div
              ref={cardRef}
              className="relative w-full aspect-[1.586/1] rounded-3xl overflow-hidden shadow-2xl shadow-emerald-950/60 border border-emerald-500/30 text-white select-none transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #064e3b 0%, #042f2e 50%, #0f172a 100%)'
              }}
            >
              {/* Background Texture & Watermark */}
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
              
              <AnimatePresence mode="wait" initial={false}>
                {cardSide === 'front' ? (
                  /* FRONT SIDE */
                  <motion.div
                    key="front"
                    initial={{ rotateY: -90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: 90, opacity: 0 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    className="relative h-full p-5 sm:p-6 flex flex-col justify-between"
                  >
                    {/* Card Top Header */}
                  <div className="flex items-start justify-between border-b border-emerald-500/20 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 p-0.5 shadow-md">
                        <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-emerald-300" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold tracking-tight uppercase leading-tight text-emerald-200">
                          {settings.library_name || 'Perpustakaan Baitul Hikmah'}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-emerald-400/80 font-medium">
                          {settings.institution_name || 'Pondok Pesantren Darul Ulum'}
                        </p>
                      </div>
                    </div>

                    {/* RFID Badge & Chip */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold tracking-widest text-emerald-400/80 uppercase font-mono">
                        RFID SMART
                      </span>
                      <div className="w-7 h-5 rounded-md bg-gradient-to-tr from-amber-400 to-yellow-200 shadow-xs border border-amber-500/50 flex items-center justify-center">
                        <div className="w-4 h-3 border border-amber-700/40 rounded-xs" />
                      </div>
                    </div>
                  </div>

                  {/* Card Center: Student Info & Photo */}
                  <div className="flex items-center gap-4 my-auto">
                    {/* Photo */}
                    <div className="relative">
                      {student.photo_url ? (
                        <img
                          src={student.photo_url}
                          alt={student.name}
                          referrerPolicy="no-referrer"
                          className="w-20 h-24 sm:w-22 sm:h-26 rounded-2xl object-cover border-2 border-emerald-400/60 shadow-lg bg-slate-800"
                        />
                      ) : (
                        <div className="w-20 h-24 sm:w-22 sm:h-26 rounded-2xl bg-slate-800 border-2 border-emerald-400/60 shadow-lg flex items-center justify-center text-emerald-400">
                          <GraduationCap className="w-10 h-10" />
                        </div>
                      )}
                      <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-slate-950 p-1 rounded-full shadow-md" title="Anggota Aktif">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>

                    {/* Text Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 inline-block">
                        KARTU ANGGOTA SANTRI
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white truncate leading-tight">
                        {student.name}
                      </h3>
                      <div className="text-xs text-emerald-100 font-mono">
                        NIS: <strong className="text-emerald-300 font-bold">{student.nis}</strong>
                      </div>
                      <div className="text-xs text-slate-300">
                        Kelas/Asrama: <span className="text-white font-medium">{student.class}</span>
                      </div>
                    </div>

                    {/* QR Mini on Front (Clickable to open scanner modal) */}
                    {qrDataUrl && (
                      <div 
                        onClick={() => setIsQrModalOpen(true)}
                        className="w-16 h-16 sm:w-18 sm:h-18 p-1 rounded-xl bg-white shadow-lg shrink-0 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                        title="Klik untuk membuka QR Absensi Kamera"
                      >
                        <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: RFID UID & Security Line */}
                  <div className="border-t border-emerald-500/20 pt-2.5 flex items-center justify-between text-[10px] text-emerald-400/80">
                    <div className="flex items-center gap-1.5">
                      <Radio className="w-3 h-3 text-emerald-400" />
                      <span className="font-mono tracking-wider font-semibold text-emerald-200">
                        UID: {cardUid}
                      </span>
                    </div>
                    <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-semibold">
                      STATUS: AKTIF
                    </span>
                  </div>
                </motion.div>
              ) : (
                /* BACK SIDE */
                <motion.div
                  key="back"
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  className="relative h-full p-5 sm:p-6 flex flex-col justify-between"
                >
                  {/* Magnetic / Top Dark Strip */}
                  <div className="w-full h-8 bg-slate-950/90 -mx-6 -mt-6 mb-2 rounded-t-3xl border-b border-emerald-500/20 flex items-center px-6">
                    <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">
                      KARTU RESMI SISTEM PERPUSTAKAAN PESANTREN
                    </span>
                  </div>

                  {/* Terms and Usage Rules */}
                  <div className="space-y-1.5 text-[10px] text-slate-300 leading-relaxed my-auto">
                    <span className="text-emerald-300 font-bold block text-[11px] mb-1">
                      Ketentuan Penggunaan Kartu:
                    </span>
                    <ol className="list-decimal pl-4 space-y-0.5 text-slate-300">
                      <li>Kartu ini adalah tanda keanggotaan resmi Perpustakaan.</li>
                      <li>Wajib di-tap atau di-scan saat memasuki area perpustakaan.</li>
                      <li>Digunakan untuk meminjam buku, kitab, dan reservasi literasi.</li>
                      <li>Dilarang meminjamkan kartu ini kepada santri lain.</li>
                    </ol>
                  </div>

                  {/* Big Barcode & Signature */}
                  <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-mono">Kode UID Fisik:</span>
                      <span className="text-xs font-mono font-bold text-emerald-300">{cardUid}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block">Pustakawan / Petugas</span>
                      <span className="text-[10px] text-emerald-200 font-serif italic">Tervalidasi Digital</span>
                    </div>
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
            </div>

            {/* Quick Card Controls */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => setCardSide(prev => prev === 'front' ? 'back' : 'front')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>{cardSide === 'front' ? 'Balik ke Belakang' : 'Balik ke Depan'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCard}
                disabled={isDownloadingCard}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span>{isDownloadingCard ? 'Menyimpan...' : 'Unduh Kartu (PNG)'}</span>
              </button>
            </div>
          </div>

          {/* Right Side Info & Scanner Shortcut */}
          <div className="w-full max-w-sm space-y-4">
            {/* Quick QR Scanner Shortcut Card */}
            <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-teal-950/40 border border-emerald-500/40 rounded-3xl p-5 backdrop-blur-md space-y-3.5 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                    ABSENSI KAMERA KIOSK
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">QR Scanner Siap Pakai</h4>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
              </div>

              <div 
                onClick={() => setIsQrModalOpen(true)}
                className="bg-white p-3 rounded-2xl inline-block shadow-md mx-auto cursor-pointer hover:scale-102 transition-transform w-full text-center"
              >
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="QR Scanner" className="w-36 h-36 mx-auto object-contain" />
                )}
                <span className="text-[10px] text-slate-600 font-semibold block mt-1">
                  Klik untuk Perbesar Layar Penuh
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Tampilkan Modal QR Khusus</span>
              </button>
            </div>

            {/* Detail Identity Summary */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Status Keanggotaan</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Santri Aktif
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Kode Tap UID</span>
                <div className="flex items-center gap-1.5">
                  <code className="text-emerald-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded text-[11px]">
                    {cardUid}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyUid}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    title="Salin UID"
                  >
                    {copiedUid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Format Barcode</span>
                <span className="text-slate-300 font-mono text-[11px]">QR Code 2D (Level H)</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* DEDICATED FULL MODAL KHUSUS ABSENSI QR KAMERA                            */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isQrModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-5"
            >
            {/* Top Close Button */}
            <button
              id="btn-close-qr-modal"
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5">
                <Camera className="w-3 h-3 animate-pulse" />
                Absensi Kamera Kiosk
              </span>
              <h3 className="text-lg font-bold text-white">QR Code Unik Santri</h3>
              <p className="text-xs text-slate-400">
                Arahkan layar ponsel ini tepat di depan kamera scanner Kiosk perpustakaan
              </p>
            </div>

            {/* Santri Identity Banner */}
            <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800/80 flex items-center gap-3">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt={student.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-xl object-cover border border-emerald-500/40 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                  {student.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{student.name}</h4>
                <div className="text-[11px] text-slate-400 font-mono">
                  NIS: <span className="text-emerald-300 font-bold">{student.nis}</span> • {student.class}
                </div>
              </div>
            </div>

            {/* TARGET SCANNER VIEWPORT */}
            <div className="relative mx-auto bg-slate-950 p-4 rounded-3xl border border-slate-800 shadow-xl text-center">
              {/* Corner Reticle Brackets */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-3 border-l-3 border-emerald-400 rounded-tl-xl pointer-events-none" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-3 border-r-3 border-emerald-400 rounded-tr-xl pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-3 border-l-3 border-emerald-400 rounded-bl-xl pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-3 border-r-3 border-emerald-400 rounded-br-xl pointer-events-none" />

              {/* Pure Crisp White Box for Zero-Distortion Reading */}
              <div className="bg-white p-4 rounded-2xl shadow-inner inline-block relative">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code Modal"
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-500 font-mono text-xs">
                    Membuat QR Code...
                  </div>
                )}
              </div>

              {/* Unique UID Tag */}
              <div className="mt-3 flex items-center justify-center gap-2 text-xs">
                <span className="font-mono text-emerald-300 font-bold bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                  KODE TAP: {cardUid}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
                  title="Salin UID"
                >
                  {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Quick Test Tap Simulation Result if triggered */}
            {testTapResult && (
              <div className={`p-3 rounded-xl border text-xs text-left flex items-start gap-2.5 ${
                testTapResult.type.startsWith('success') 
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
              }`}>
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">
                    {testTapResult.type === 'success_in' && 'Absen Masuk Berhasil'}
                    {testTapResult.type === 'success_out' && 'Absen Keluar Berhasil'}
                    {testTapResult.type === 'cooldown_blocked' && 'Proteksi Anti-Passback'}
                  </span>
                  <p className="text-[11px]">{testTapResult.message}</p>
                </div>
              </div>
            )}

            {/* Brightness & Distance Guidance */}
            <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 text-[11px] text-slate-300 space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <Sun className="w-3.5 h-3.5" />
                <span>Tips Mempercepat Pemindaian:</span>
              </div>
              <p className="text-slate-400">
                Tingkatkan kecerahan layar ponsel & posisikan berjarak 15-20 cm tegak lurus di depan kamera Kiosk hingga berbunyi beep.
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadQrOnly}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span>Simpan QR (PNG)</span>
              </button>

              <button
                type="button"
                onClick={handleRunTestTap}
                disabled={isTestingTap}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-950 disabled:opacity-50"
              >
                <ScanLine className="w-3.5 h-3.5" />
                <span>{isTestingTap ? 'Menguji...' : 'Uji Tap Sekarang'}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};
