import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  Users, 
  Clock, 
  Trophy, 
  School, 
  CheckSquare, 
  Square, 
  Settings2, 
  UserCheck, 
  X, 
  Sparkles,
  FileSpreadsheet,
  AlertCircle,
  FileCheck2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { Student } from '../../types';
import { 
  MONTH_NAMES_ID, 
  computeMonthlyVisitStats, 
  downloadMonthlyVisitPdfReport, 
  generateMonthlyVisitPdfReport,
  MonthlyReportConfig,
  formatMinutes
} from '../../utils/exportPdfReport';
import { exportVisitsToExcel } from '../../utils/exportExcel';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMonth?: number;
  initialYear?: number;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  isOpen,
  onClose,
  initialMonth,
  initialYear
}) => {
  const { visits, students, settings } = useLibrary();

  const now = new Date();
  const currentMonth = initialMonth !== undefined ? initialMonth : now.getMonth();
  const currentYear = initialYear !== undefined ? initialYear : now.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Administration settings
  const [documentNo, setDocumentNo] = useState<string>('');
  const [city, setCity] = useState<string>('Jombang');
  const [reportDate, setReportDate] = useState<string>(
    new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  );
  const [headName, setHeadName] = useState<string>('Drs. H. Ahmad Dahlan, M.Pd.');
  const [headNip, setHeadNip] = useState<string>('19780512 200312 1 002');
  const [officerName, setOfficerName] = useState<string>('Siti Aminah, S.I.Pust.');
  const [officerNip, setOfficerNip] = useState<string>('19900824 201602 2 003');

  // Report section toggles
  const [includeTopStudents, setIncludeTopStudents] = useState<boolean>(true);
  const [includeClassBreakdown, setIncludeClassBreakdown] = useState<boolean>(true);
  const [includeDailyBreakdown, setIncludeDailyBreakdown] = useState<boolean>(true);
  const [includeDetailedLogs, setIncludeDetailedLogs] = useState<boolean>(true);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);

  // Accordion for advanced admin signatures
  const [showAdminSettings, setShowAdminSettings] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Available years from visit dataset + reasonable range
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([now.getFullYear(), now.getFullYear() - 1, now.getFullYear() + 1]);
    visits.forEach(v => {
      const y = new Date(v.check_in).getFullYear();
      if (!isNaN(y)) yearsSet.add(y);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [visits, now]);

  // Computed statistics for the currently selected month & year
  const monthlyStats = useMemo(() => {
    return computeMonthlyVisitStats(visits, students, selectedMonth, selectedYear);
  }, [visits, students, selectedMonth, selectedYear]);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const config: MonthlyReportConfig = {
          month: selectedMonth,
          year: selectedYear,
          documentNo: documentNo.trim() || undefined,
          reportDate,
          city,
          headName,
          headNip,
          officerName,
          officerNip,
          includeDetailedLogs,
          includeTopStudents,
          includeClassBreakdown,
          includeDailyBreakdown,
          includeSignatures,
          institutionName: settings.institution_name,
          libraryName: settings.library_name
        };

        downloadMonthlyVisitPdfReport(visits, students, settings, config);
      } catch (err) {
        console.error('Failed to generate PDF:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 150);
  };

  const handlePrintPdf = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const config: MonthlyReportConfig = {
          month: selectedMonth,
          year: selectedYear,
          documentNo: documentNo.trim() || undefined,
          reportDate,
          city,
          headName,
          headNip,
          officerName,
          officerNip,
          includeDetailedLogs,
          includeTopStudents,
          includeClassBreakdown,
          includeDailyBreakdown,
          includeSignatures,
          institutionName: settings.institution_name,
          libraryName: settings.library_name
        };

        const doc = generateMonthlyVisitPdfReport(visits, students, settings, config);
        const blobUrl = doc.output('bloburl');
        
        // Open PDF in new tab and auto print
        const printWindow = window.open(blobUrl as unknown as string, '_blank');
        if (printWindow) {
          printWindow.focus();
        }
      } catch (err) {
        console.error('Failed to print PDF:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 150);
  };

  const handleExportMonthExcel = () => {
    const studentsMap = new Map<string, Student>(students.map(s => [s.id, s]));
    const monthName = MONTH_NAMES_ID[selectedMonth];
    exportVisitsToExcel(
      monthlyStats.rawVisits, 
      studentsMap, 
      `Laporan_Kunjungan_${monthName}_${selectedYear}.xlsx`
    );
  };

  // Quick month shortcuts
  const selectCurrentMonth = () => {
    const d = new Date();
    setSelectedMonth(d.getMonth());
    setSelectedYear(d.getFullYear());
  };

  const selectPreviousMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    setSelectedMonth(d.getMonth());
    setSelectedYear(d.getFullYear());
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden cursor-default animate-in fade-in zoom-in-95 my-auto"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                Laporan Kunjungan Bulanan (PDF)
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                Format resmi administrasi perpustakaan & madrasah / pesantren
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* 1. Pilih Bulan & Tahun */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Pilih Periode Laporan
              </label>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectCurrentMonth}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    selectedMonth === now.getMonth() && selectedYear === now.getFullYear()
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Bulan Ini ({MONTH_NAMES_ID[now.getMonth()]})
                </button>
                <button
                  type="button"
                  onClick={selectPreviousMonth}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
                >
                  Bulan Lalu
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Dropdown Bulan */}
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Bulan</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {MONTH_NAMES_ID.map((name, index) => (
                    <option key={name} value={index}>
                      {index + 1}. {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown Tahun */}
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Tahun</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>
                      Tahun {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Live Summary Preview Card */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Ringkasan Data {monthlyStats.monthName} {selectedYear}
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {monthlyStats.totalVisits} Kunjungan
              </span>
            </div>

            {monthlyStats.totalVisits === 0 ? (
              <div className="text-center py-6 px-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  Belum ada catatan kunjungan pada bulan {monthlyStats.monthName} {selectedYear}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Anda tetap dapat mencetak laporan kosong atau memilih bulan lain dengan riwayat kehadiran aktif.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium block">Total Kunjungan</span>
                  <p className="text-lg font-black text-emerald-900 dark:text-emerald-200 mt-0.5">
                    {monthlyStats.totalVisits} <span className="text-xs font-normal">x</span>
                  </p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    {monthlyStats.uniqueStudentsCount} santri berbeda
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                  <span className="text-[11px] text-blue-700 dark:text-blue-400 font-medium block">Total Waktu Baca</span>
                  <p className="text-base sm:text-lg font-black text-blue-900 dark:text-blue-200 mt-0.5 truncate">
                    {formatMinutes(monthlyStats.totalDurationMinutes)}
                  </p>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400">
                    ~{monthlyStats.avgDurationMinutes} mnt / kunjungan
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                  <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium block">Rata-rata Harian</span>
                  <p className="text-lg font-black text-amber-900 dark:text-amber-200 mt-0.5">
                    {monthlyStats.dailyAvgVisits} <span className="text-xs font-normal">/hari</span>
                  </p>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 truncate block">
                    {monthlyStats.busiestDay.date}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                  <span className="text-[11px] text-purple-700 dark:text-purple-400 font-medium block">Santri Teraktif</span>
                  <p className="text-xs font-bold text-purple-900 dark:text-purple-200 mt-0.5 truncate">
                    {monthlyStats.topStudents.length > 0 ? monthlyStats.topStudents[0].name : '-'}
                  </p>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 truncate block">
                    {monthlyStats.topClassName}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Pengaturan Konten Laporan (Checkbox Section) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Pilihan Lampiran & Struktur PDF
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              <button
                type="button"
                onClick={() => setIncludeTopStudents(!includeTopStudents)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  includeTopStudents
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {includeTopStudents ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 shrink-0" />
                )}
                <div>
                  <span className="text-xs font-bold block">Peringkat 10 Santri Teraktif</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Tabel juara membaca & waktu baca</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIncludeClassBreakdown(!includeClassBreakdown)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  includeClassBreakdown
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {includeClassBreakdown ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 shrink-0" />
                )}
                <div>
                  <span className="text-xs font-bold block">Distribusi per Kelas</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Rekapitulasi kelas & persentase hadir</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIncludeDailyBreakdown(!includeDailyBreakdown)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  includeDailyBreakdown
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {includeDailyBreakdown ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 shrink-0" />
                )}
                <div>
                  <span className="text-xs font-bold block">Rekapitulasi Kunjungan Harian</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Tabel tanggal 1 s/d akhir bulan</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIncludeDetailedLogs(!includeDetailedLogs)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  includeDetailedLogs
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {includeDetailedLogs ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 shrink-0" />
                )}
                <div>
                  <span className="text-xs font-bold block">Lampiran Log Detail Presensi</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Daftar lengkap baris per baris santri</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIncludeSignatures(!includeSignatures)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all sm:col-span-2 cursor-pointer ${
                  includeSignatures
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {includeSignatures ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 shrink-0" />
                )}
                <div>
                  <span className="text-xs font-bold block">Kolom Tanda Tangan Resmi & Pengesahan</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Mengetahui Kepala Perpustakaan & Petugas Pelapor</span>
                </div>
              </button>

            </div>
          </div>

          {/* 4. Collapsible: Pengaturan Administrasi Surat & Penandatangan */}
          <div className="border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdminSettings(!showAdminSettings)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Pengaturan Nomor Dokumen & Nama Penandatangan (Opsional)
                </span>
              </div>
              {showAdminSettings ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showAdminSettings && (
              <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700/80 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Nomor Dokumen / Surat
                    </label>
                    <input
                      type="text"
                      value={documentNo}
                      onChange={(e) => setDocumentNo(e.target.value)}
                      placeholder={`LAP-PERPUS/${selectedYear}/...`}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Kota & Tanggal Laporan
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Kota (e.g. Jombang)"
                        className="w-1/3 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                      <input
                        type="text"
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                        placeholder="24 Agustus 2026"
                        className="w-2/3 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {/* Kepala Perpustakaan */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">
                      Kepala Perpustakaan
                    </span>
                    <input
                      type="text"
                      value={headName}
                      onChange={(e) => setHeadName(e.target.value)}
                      placeholder="Nama Kepala Perpustakaan"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      value={headNip}
                      onChange={(e) => setHeadNip(e.target.value)}
                      placeholder="NIP / NIY"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Petugas Administrasi */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 block">
                      Petugas Administrasi / Pelapor
                    </span>
                    <input
                      type="text"
                      value={officerName}
                      onChange={(e) => setOfficerName(e.target.value)}
                      placeholder="Nama Petugas"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      value={officerNip}
                      onChange={(e) => setOfficerNip(e.target.value)}
                      placeholder="NIP / NIY"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer (Action Buttons) */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleExportMonthExcel}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handlePrintPdf}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Print</span>
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleDownloadPdf}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Menyiapkan...' : 'Download Laporan PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
