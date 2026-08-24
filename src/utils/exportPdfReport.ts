import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LibraryVisit, Student, LibrarySettings } from '../types';

export interface MonthlyReportConfig {
  month: number; // 0 = Januari, 11 = Desember
  year: number;
  documentNo?: string;
  reportDate?: string;
  city?: string;
  headName?: string;
  headNip?: string;
  officerName?: string;
  officerNip?: string;
  includeDetailedLogs?: boolean;
  includeTopStudents?: boolean;
  includeClassBreakdown?: boolean;
  includeDailyBreakdown?: boolean;
  includeSignatures?: boolean;
  institutionName?: string;
  libraryName?: string;
}

export interface MonthlyVisitStats {
  monthName: string;
  year: number;
  totalVisits: number;
  uniqueStudentsCount: number;
  totalDurationMinutes: number;
  avgDurationMinutes: number;
  dailyAvgVisits: number;
  completedVisitsCount: number;
  activeInsideCount: number;
  maleVisitsCount: number;
  femaleVisitsCount: number;
  topStudentName: string;
  topClassName: string;
  busiestDay: { date: string; count: number };
  dailyStats: Array<{
    dayNumber: number;
    dateFormatted: string;
    dayName: string;
    visitCount: number;
    totalMinutes: number;
    avgMinutes: number;
    uniqueStudents: number;
  }>;
  topStudents: Array<{
    rank: number;
    name: string;
    nis: string;
    className: string;
    gender: string;
    visitCount: number;
    totalMinutes: number;
    avgMinutes: number;
  }>;
  classStats: Array<{
    className: string;
    visitCount: number;
    percentage: number;
    totalMinutes: number;
  }>;
  rawVisits: LibraryVisit[];
}

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const DAY_NAMES_ID = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

const ROMAN_MONTHS = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
];

/**
 * Calculates all statistical metrics for a specific month and year
 */
export function computeMonthlyVisitStats(
  visits: LibraryVisit[],
  students: Student[],
  month: number,
  year: number
): MonthlyVisitStats {
  const studentsMap = new Map<string, Student>(students.map(s => [s.id, s]));
  const monthName = MONTH_NAMES_ID[month];

  // Filter visits for the chosen month and year
  const monthVisits = visits.filter(v => {
    const d = new Date(v.check_in);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  // Sort chronological
  monthVisits.sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime());

  const totalVisits = monthVisits.length;
  const uniqueStudentsSet = new Set<string>();
  let totalDurationMinutes = 0;
  let completedVisitsCount = 0;
  let activeInsideCount = 0;
  let maleVisitsCount = 0;
  let femaleVisitsCount = 0;

  // Student aggregation for top visitors
  const studentStatsMap = new Map<string, { visitCount: number; totalMinutes: number }>();
  // Class aggregation
  const classStatsMap = new Map<string, { visitCount: number; totalMinutes: number }>();

  // Daily map
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyMap = new Map<number, { visits: LibraryVisit[]; uniqueStudents: Set<string> }>();
  for (let i = 1; i <= daysInMonth; i++) {
    dailyMap.set(i, { visits: [], uniqueStudents: new Set() });
  }

  monthVisits.forEach(v => {
    uniqueStudentsSet.add(v.student_id);
    const dur = v.duration_minutes || 0;
    totalDurationMinutes += dur;

    if (v.status === 'completed') {
      completedVisitsCount++;
    } else {
      activeInsideCount++;
    }

    const student = studentsMap.get(v.student_id);
    if (student) {
      if (student.gender === 'L') maleVisitsCount++;
      else if (student.gender === 'P') femaleVisitsCount++;

      // Student aggregation
      const sStat = studentStatsMap.get(v.student_id) || { visitCount: 0, totalMinutes: 0 };
      sStat.visitCount += 1;
      sStat.totalMinutes += dur;
      studentStatsMap.set(v.student_id, sStat);

      // Class aggregation
      const cStat = classStatsMap.get(student.class) || { visitCount: 0, totalMinutes: 0 };
      cStat.visitCount += 1;
      cStat.totalMinutes += dur;
      classStatsMap.set(student.class, cStat);
    }

    // Daily bucket
    const checkInDate = new Date(v.check_in);
    const day = checkInDate.getDate();
    const dayBucket = dailyMap.get(day);
    if (dayBucket) {
      dayBucket.visits.push(v);
      dayBucket.uniqueStudents.add(v.student_id);
    }
  });

  const avgDurationMinutes = totalVisits > 0 ? Math.round(totalDurationMinutes / totalVisits) : 0;
  const daysWithVisitsCount = Array.from(dailyMap.values()).filter(d => d.visits.length > 0).length;
  const dailyAvgVisits = daysWithVisitsCount > 0 ? Math.round((totalVisits / daysWithVisitsCount) * 10) / 10 : 0;

  // Daily stats array
  const dailyStats: MonthlyVisitStats['dailyStats'] = [];
  let maxDayVisits = 0;
  let busiestDateStr = '-';

  for (let d = 1; d <= daysInMonth; d++) {
    const bucket = dailyMap.get(d)!;
    const dateObj = new Date(year, month, d);
    const dayName = DAY_NAMES_ID[dateObj.getDay()];
    const count = bucket.visits.length;
    const dayMinutes = bucket.visits.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
    const dayAvg = count > 0 ? Math.round(dayMinutes / count) : 0;

    if (count > maxDayVisits) {
      maxDayVisits = count;
      busiestDateStr = `${d} ${monthName} (${count} kunjungan)`;
    }

    dailyStats.push({
      dayNumber: d,
      dateFormatted: `${d < 10 ? '0' + d : d}/${month + 1 < 10 ? '0' + (month + 1) : month + 1}/${year}`,
      dayName,
      visitCount: count,
      totalMinutes: dayMinutes,
      avgMinutes: dayAvg,
      uniqueStudents: bucket.uniqueStudents.size
    });
  }

  // Top Students
  const topStudents: MonthlyVisitStats['topStudents'] = Array.from(studentStatsMap.entries())
    .map(([studentId, data]) => {
      const student = studentsMap.get(studentId);
      return {
        rank: 0,
        name: student ? student.name : 'Santri #' + studentId,
        nis: student ? student.nis : '-',
        className: student ? student.class : '-',
        gender: student ? (student.gender === 'L' ? 'L' : 'P') : '-',
        visitCount: data.visitCount,
        totalMinutes: data.totalMinutes,
        avgMinutes: data.visitCount > 0 ? Math.round(data.totalMinutes / data.visitCount) : 0
      };
    })
    .sort((a, b) => b.visitCount - a.visitCount || b.totalMinutes - a.totalMinutes)
    .slice(0, 10)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  // Class stats
  const classStats: MonthlyVisitStats['classStats'] = Array.from(classStatsMap.entries())
    .map(([className, data]) => ({
      className,
      visitCount: data.visitCount,
      percentage: totalVisits > 0 ? Math.round((data.visitCount / totalVisits) * 1000) / 10 : 0,
      totalMinutes: data.totalMinutes
    }))
    .sort((a, b) => b.visitCount - a.visitCount);

  const topStudentName = topStudents.length > 0 ? `${topStudents[0].name} (${topStudents[0].visitCount}x)` : '-';
  const topClassName = classStats.length > 0 ? `Kelas ${classStats[0].className} (${classStats[0].visitCount}x)` : '-';

  return {
    monthName,
    year,
    totalVisits,
    uniqueStudentsCount: uniqueStudentsSet.size,
    totalDurationMinutes,
    avgDurationMinutes,
    dailyAvgVisits,
    completedVisitsCount,
    activeInsideCount,
    maleVisitsCount,
    femaleVisitsCount,
    topStudentName,
    topClassName,
    busiestDay: {
      date: busiestDateStr,
      count: maxDayVisits
    },
    dailyStats,
    topStudents,
    classStats,
    rawVisits: monthVisits
  };
}

/**
 * Format minutes to human readable string
 */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h} jam ${m} mnt`;
  if (h > 0) return `${h} jam`;
  return `${m} menit`;
}

/**
 * Generates and downloads the Official PDF Monthly Library Report
 */
export function generateMonthlyVisitPdfReport(
  visits: LibraryVisit[],
  students: Student[],
  settings: LibrarySettings,
  config: MonthlyReportConfig
): jsPDF {
  const {
    month,
    year,
    city = 'Jombang',
    reportDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    headName = 'Drs. H. Ahmad Dahlan, M.Pd.',
    headNip = '19780512 200312 1 002',
    officerName = 'Siti Aminah, S.I.Pust.',
    officerNip = '19900824 201602 2 003',
    includeDetailedLogs = true,
    includeTopStudents = true,
    includeClassBreakdown = true,
    includeDailyBreakdown = true,
    includeSignatures = true,
    institutionName = settings.institution_name || 'Pondok Pesantren & Madrasah Modern',
    libraryName = settings.library_name || 'Perpustakaan Baitul Hikmah'
  } = config;

  const stats = computeMonthlyVisitStats(visits, students, month, year);
  const studentsMap = new Map<string, Student>(students.map(s => [s.id, s]));

  const romanMonth = ROMAN_MONTHS[month];
  const autoDocNo = config.documentNo || `LAP-PERPUS/${year}/${romanMonth}/${String(month + 1).padStart(2, '0')}`;

  // Initialize jsPDF (A4, portrait, mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftMargin = 14;
  const rightMargin = 14;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  // Helper for adding official header / kop surat
  const renderKopSurat = (yStart: number) => {
    // Institution Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text(institutionName.toUpperCase(), pageWidth / 2, yStart, { align: 'center' });

    // Library Name
    doc.setFontSize(16);
    doc.setTextColor(13, 148, 136); // Teal-600 / Emerald
    doc.text(libraryName.toUpperCase(), pageWidth / 2, yStart + 6, { align: 'center' });

    // Subheader / System details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text('Sistem Informasi Presensi & Manajemen Sirkulasi Perpustakaan Berbasis RFID / NFC', pageWidth / 2, yStart + 11, { align: 'center' });

    // Decorative double line
    doc.setDrawColor(13, 148, 136);
    doc.setLineWidth(0.8);
    doc.line(leftMargin, yStart + 14, pageWidth - rightMargin, yStart + 14);

    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.setLineWidth(0.2);
    doc.line(leftMargin, yStart + 15.2, pageWidth - rightMargin, yStart + 15.2);

    return yStart + 22;
  };

  // --- PAGE 1: COVER & EXECUTIVE SUMMARY ---
  let currentY = renderKopSurat(14);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text('LAPORAN BULANAN KUNJUNGAN PERPUSTAKAAN', pageWidth / 2, currentY, { align: 'center' });

  // Subtitle / Periode
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Periode: ${stats.monthName.toUpperCase()} ${year}`, pageWidth / 2, currentY + 5, { align: 'center' });

  // Document Meta Box (Nomor & Tanggal)
  currentY += 10;
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.roundedRect(leftMargin, currentY, contentWidth, 12, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Nomor Dokumen:', leftMargin + 4, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(autoDocNo, leftMargin + 32, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.text('Tanggal Terbit:', pageWidth / 2 + 10, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(reportDate, pageWidth / 2 + 34, currentY + 7);

  currentY += 18;

  // SECTION 1: RINGKASAN EKSEKUTIF (KEY STATS CARDS)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('I. RINGKASAN EKSEKUTIF & STATISTIK KUNJUNGAN', leftMargin, currentY);

  currentY += 4;

  // Render 6 stat metric cards (2 rows of 3)
  const cardWidth = (contentWidth - 6) / 3;
  const cardHeight = 16;

  const statCards = [
    { title: 'Total Kunjungan', value: `${stats.totalVisits} Kunjungan`, sub: `${stats.uniqueStudentsCount} Santri Berbeda`, bg: [240, 253, 244], stroke: [187, 247, 208], text: [22, 101, 52] },
    { title: 'Total Waktu Membaca', value: formatMinutes(stats.totalDurationMinutes), sub: `Rata-rata: ${stats.avgDurationMinutes} mnt/kunjungan`, bg: [239, 246, 255], stroke: [191, 219, 254], text: [30, 64, 175] },
    { title: 'Rata-rata Harian', value: `${stats.dailyAvgVisits} Kunjungan/Hari`, sub: `Hari teramai: ${stats.busiestDay.count} kunjungan`, bg: [254, 243, 199], stroke: [253, 230, 138], text: [146, 64, 14] },
    { title: 'Santri Teraktif', value: stats.topStudents.length > 0 ? stats.topStudents[0].name.slice(0, 18) : '-', sub: stats.topStudents.length > 0 ? `${stats.topStudents[0].visitCount}x kunjungan (${stats.topStudents[0].className})` : '-', bg: [250, 245, 255], stroke: [233, 213, 255], text: [107, 33, 168] },
    { title: 'Kelas Teraktif', value: stats.classStats.length > 0 ? `Kelas ${stats.classStats[0].className}` : '-', sub: stats.classStats.length > 0 ? `${stats.classStats[0].visitCount} kunjungan (${stats.classStats[0].percentage}%)` : '-', bg: [255, 241, 242], stroke: [254, 205, 211], text: [159, 18, 57] },
    { title: 'Komposisi Gender', value: `${stats.maleVisitsCount} Santriwan`, sub: `${stats.femaleVisitsCount} Santriwati`, bg: [248, 250, 252], stroke: [226, 232, 240], text: [51, 65, 85] }
  ];

  statCards.forEach((card, index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const x = leftMargin + col * (cardWidth + 3);
    const y = currentY + row * (cardHeight + 3);

    doc.setFillColor(card.bg[0], card.bg[1], card.bg[2]);
    doc.setDrawColor(card.stroke[0], card.stroke[1], card.stroke[2]);
    doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(card.title, x + 3, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(card.text[0], card.text[1], card.text[2]);
    doc.text(card.value, x + 3, y + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(card.sub, x + 3, y + 13.5);
  });

  currentY += (cardHeight * 2) + 10;

  // SECTION 2: TOP 10 SANTRI TERAKTIF (JUARA MEMBACA BULAN INI)
  if (includeTopStudents && stats.topStudents.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('II. PERINGKAT 10 SANTRI PALING AKTIF BERKUNJUNG', leftMargin, currentY);

    currentY += 3;

    const topTableBody = stats.topStudents.map(s => [
      s.rank.toString(),
      s.name,
      s.nis,
      s.className,
      s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      `${s.visitCount} kali`,
      formatMinutes(s.totalMinutes),
      `${s.avgMinutes} mnt`
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Rank', 'Nama Santri', 'NIS', 'Kelas', 'Gender', 'Total Hadir', 'Total Durasi', 'Rata-rata']],
      body: topTableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129], // Emerald-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { fontStyle: 'bold', cellWidth: 46 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'center', cellWidth: 16 },
        4: { halign: 'center', cellWidth: 22 },
        5: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
        6: { halign: 'center', cellWidth: 24 },
        7: { halign: 'center', cellWidth: 20 }
      },
      margin: { left: leftMargin, right: rightMargin },
      styles: { cellPadding: 1.8 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // SECTION 3: REKAPITULASI KELAS (Jika cukup ruang di hal 1, atau lanjut)
  if (includeClassBreakdown && stats.classStats.length > 0) {
    if (currentY > pageHeight - 65) {
      doc.addPage();
      currentY = renderKopSurat(14);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('III. DISTRIBUSI KUNJUNGAN BERDASARKAN KELAS', leftMargin, currentY);

    currentY += 3;

    const classTableBody = stats.classStats.map((c, i) => [
      (i + 1).toString(),
      `Kelas ${c.className}`,
      `${c.visitCount} kunjungan`,
      `${c.percentage}%`,
      formatMinutes(c.totalMinutes)
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Tingkat / Kelas', 'Jumlah Kunjungan', 'Persentase Kontribusi', 'Total Waktu Baca']],
      body: classTableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59], // Slate-800
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 14 },
        1: { fontStyle: 'bold', cellWidth: 45 },
        2: { halign: 'center', cellWidth: 38 },
        3: { halign: 'center', cellWidth: 42 },
        4: { halign: 'center', cellWidth: 43 }
      },
      margin: { left: leftMargin, right: rightMargin },
      styles: { cellPadding: 1.8 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // SECTION 4: REKAPITULASI HARIAN (TANGGAL 1 - AKHIR BULAN)
  if (includeDailyBreakdown) {
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = renderKopSurat(14);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`IV. REKAPITULASI KUNJUNGAN HARIAN (1 - ${stats.dailyStats.length} ${stats.monthName.toUpperCase()} ${year})`, leftMargin, currentY);

    currentY += 3;

    const dailyTableBody = stats.dailyStats.map(d => [
      d.dateFormatted,
      d.dayName,
      d.visitCount > 0 ? `${d.visitCount} santri` : '-',
      d.uniqueStudents > 0 ? `${d.uniqueStudents} orang` : '-',
      d.totalMinutes > 0 ? formatMinutes(d.totalMinutes) : '-',
      d.avgMinutes > 0 ? `${d.avgMinutes} mnt` : '-'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Tanggal', 'Hari', 'Total Kunjungan', 'Santri Unik', 'Total Durasi', 'Rata-rata/Santri']],
      body: dailyTableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246], // Blue-500
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 26 },
        1: { halign: 'center', cellWidth: 24 },
        2: { halign: 'center', fontStyle: 'bold', cellWidth: 35 },
        3: { halign: 'center', cellWidth: 30 },
        4: { halign: 'center', cellWidth: 35 },
        5: { halign: 'center', cellWidth: 32 }
      },
      margin: { left: leftMargin, right: rightMargin },
      styles: { cellPadding: 1.4 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // SECTION 5: LAMPIRAN LOG DETAIL KUNJUNGAN
  if (includeDetailedLogs && stats.rawVisits.length > 0) {
    doc.addPage();
    currentY = renderKopSurat(14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`V. LAMPIRAN LOG LENGKAP KUNJUNGAN SANTRI (${stats.rawVisits.length} DATA)`, leftMargin, currentY);

    currentY += 3;

    const detailedTableBody = stats.rawVisits.map((v, idx) => {
      const student = studentsMap.get(v.student_id);
      const checkInDate = new Date(v.check_in);
      const inTime = checkInDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const inDate = checkInDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });

      let outTime = '-';
      let durationStr = 'Sedang membaca';

      if (v.check_out) {
        const checkOutDate = new Date(v.check_out);
        outTime = checkOutDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        if (v.duration_minutes !== null) {
          durationStr = `${v.duration_minutes} mnt`;
        }
      }

      return [
        (idx + 1).toString(),
        `${inDate} ${inTime}`,
        outTime,
        durationStr,
        student ? student.name : 'Tidak Diketahui',
        student ? student.nis : '-',
        student ? student.class : '-',
        v.status === 'completed' ? 'Selesai' : 'Di Dalam'
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Masuk', 'Keluar', 'Durasi', 'Nama Santri', 'NIS', 'Kelas', 'Status']],
      body: detailedTableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [71, 85, 105], // Slate-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 6.8,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 24 },
        2: { halign: 'center', cellWidth: 18 },
        3: { halign: 'center', cellWidth: 20 },
        4: { fontStyle: 'bold', cellWidth: 48 },
        5: { halign: 'center', cellWidth: 20 },
        6: { halign: 'center', cellWidth: 16 },
        7: { halign: 'center', cellWidth: 26 }
      },
      margin: { left: leftMargin, right: rightMargin },
      styles: { cellPadding: 1.3 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // SECTION 6: TANDA TANGAN & PENGESAHAN RESMI
  if (includeSignatures) {
    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = renderKopSurat(14);
    }

    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    // City and Date
    doc.text(`${city}, ${reportDate}`, pageWidth - rightMargin - 60, currentY, { align: 'left' });

    currentY += 6;

    // Signature Column Left: Petugas Administrasi
    doc.text('Petugas Administrasi Perpustakaan,', leftMargin + 10, currentY);
    
    // Signature Column Right: Kepala Perpustakaan
    doc.text('Mengetahui,', pageWidth - rightMargin - 60, currentY);
    doc.text('Kepala Perpustakaan,', pageWidth - rightMargin - 60, currentY + 4);

    currentY += 22; // Signature space

    // Petugas Name & NIP
    doc.setFont('helvetica', 'bold');
    doc.text(officerName, leftMargin + 10, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`NIP/NIY: ${officerNip}`, leftMargin + 10, currentY + 4);

    // Kepala Perpustakaan Name & NIP
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(headName, pageWidth - rightMargin - 60, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`NIP/NIY: ${headNip}`, pageWidth - rightMargin - 60, currentY + 4);
  }

  // ADD FOOTER PAGE NUMBERS ON ALL PAGES
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // Slate-400

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(leftMargin, pageHeight - 10, pageWidth - rightMargin, pageHeight - 10);

    // Left footer text
    doc.text(
      `${libraryName} - Laporan Kunjungan ${stats.monthName} ${year}`,
      leftMargin,
      pageHeight - 6
    );

    // Right footer text (Page X of Y)
    doc.text(
      `Halaman ${i} dari ${totalPages}`,
      pageWidth - rightMargin,
      pageHeight - 6,
      { align: 'right' }
    );
  }

  return doc;
}

/**
 * Trigger immediate download of the PDF
 */
export function downloadMonthlyVisitPdfReport(
  visits: LibraryVisit[],
  students: Student[],
  settings: LibrarySettings,
  config: MonthlyReportConfig
): void {
  const doc = generateMonthlyVisitPdfReport(visits, students, settings, config);
  const monthName = MONTH_NAMES_ID[config.month];
  const safeInst = (settings.institution_name || 'Perpustakaan').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Laporan_Kunjungan_${monthName}_${config.year}_${safeInst}.pdf`;
  doc.save(fileName);
}
