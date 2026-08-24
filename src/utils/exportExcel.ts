import * as XLSX from 'xlsx';
import { LibraryVisit, Student } from '../types';

export function exportVisitsToExcel(visits: LibraryVisit[], studentsMap: Map<string, Student>, fileName = 'Riwayat_Kunjungan_Perpustakaan.xlsx') {
  const data = visits.map((visit, index) => {
    const student = studentsMap.get(visit.student_id);
    
    const checkInDate = new Date(visit.check_in);
    const checkInFormatted = checkInDate.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let checkOutFormatted = '-';
    let durationFormatted = 'Sedang berlangsung';

    if (visit.check_out) {
      const checkOutDate = new Date(visit.check_out);
      checkOutFormatted = checkOutDate.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      if (visit.duration_minutes !== null) {
        const hours = Math.floor(visit.duration_minutes / 60);
        const mins = visit.duration_minutes % 60;
        if (hours > 0) {
          durationFormatted = `${hours} jam ${mins} mnt`;
        } else {
          durationFormatted = `${mins} menit`;
        }
      }
    }

    return {
      'No': index + 1,
      'Nama Santri': student ? student.name : 'Santri tidak diketahui',
      'NIS': student ? student.nis : '-',
      'Kelas': student ? student.class : '-',
      'Jenis Kelamin': student ? (student.gender === 'L' ? 'Laki-laki' : 'Perempuan') : '-',
      'UID Kartu': visit.rfid_uid,
      'Waktu Masuk': checkInFormatted,
      'Waktu Keluar': checkOutFormatted,
      'Durasi': durationFormatted,
      'Status Kunjungan': visit.status === 'inside' ? 'Sedang di Dalam' : 'Selesai'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 26 }, // Nama
    { wch: 14 }, // NIS
    { wch: 10 }, // Kelas
    { wch: 14 }, // Gender
    { wch: 18 }, // UID
    { wch: 22 }, // Masuk
    { wch: 22 }, // Keluar
    { wch: 18 }, // Durasi
    { wch: 20 }, // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Kunjungan Perpustakaan');
  
  XLSX.writeFile(workbook, fileName);
}

export function exportStudentsToExcel(students: Student[], fileName = 'Data_Santri_Perpustakaan.xlsx') {
  const data = students.map((s, index) => ({
    'No': index + 1,
    'NIS': s.nis,
    'Nama Lengkap': s.name,
    'Kelas': s.class,
    'Jenis Kelamin': s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
    'UID RFID': s.rfid_uid || 'Belum Terhubung',
    'Status Santri': s.status.toUpperCase(),
    'Tanggal Terdaftar': new Date(s.created_at).toLocaleDateString('id-ID')
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 26 },
    { wch: 10 },
    { wch: 14 },
    { wch: 20 },
    { wch: 14 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Santri');
  XLSX.writeFile(workbook, fileName);
}

export interface StudentStatRow {
  student: Student;
  visitCount: number;
  totalMinutes: number;
  avgMinutes: number;
  lastVisitDate: string | null;
  activityLevel: 'Sangat Aktif' | 'Aktif' | 'Pasif' | 'Belum Pernah';
  isInsideNow: boolean;
}

export function exportStudentStatsToExcel(statsList: StudentStatRow[], fileName = 'Rekap_Statistik_Kunjungan_Santri.xlsx') {
  const data = statsList.map((item, index) => {
    const hours = Math.floor(item.totalMinutes / 60);
    const mins = item.totalMinutes % 60;
    const formattedTotalTime = hours > 0 ? `${hours} jam ${mins} mnt` : `${mins} menit`;

    let lastVisitFormatted = 'Belum pernah';
    if (item.lastVisitDate) {
      lastVisitFormatted = new Date(item.lastVisitDate).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    return {
      'No': index + 1,
      'NIS': item.student.nis,
      'Nama Santri': item.student.name,
      'Kelas': item.student.class,
      'Jenis Kelamin': item.student.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      'Frekuensi Kunjungan': `${item.visitCount} kali`,
      'Total Menit': item.totalMinutes,
      'Total Durasi': formattedTotalTime,
      'Rata-Rata Durasi': `${item.avgMinutes} menit/sesi`,
      'Kunjungan Terakhir': lastVisitFormatted,
      'Kategori Keaktifan': item.activityLevel,
      'Status Saat Ini': item.isInsideNow ? 'Sedang di Dalam' : 'Di Luar Perpustakaan'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 28 },
    { wch: 10 },
    { wch: 14 },
    { wch: 20 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Statistik Kunjungan Santri');
  XLSX.writeFile(workbook, fileName);
}

