import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Download, 
  Filter, 
  Calendar, 
  DoorOpen, 
  CheckCircle2, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  FileText,
  Printer
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { exportVisitsToExcel } from '../../utils/exportExcel';
import { Student } from '../../types';
import { MonthlyReportModal } from './MonthlyReportModal';

export const VisitsPage: React.FC = () => {
  const { visits, students, manualCheckOut } = useLibrary();

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | 'this_month'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'inside' | 'completed'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showMonthlyReportModal, setShowMonthlyReportModal] = useState<boolean>(false);

  const studentsMap = useMemo(() => new Map<string, Student>(students.map(s => [s.id, s])), [students]);
  const uniqueClasses = useMemo(() => Array.from(new Set(students.map(s => s.class))).sort(), [students]);

  // Filtered visits
  const filteredVisits = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return [...visits]
      .sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime())
      .filter(visit => {
        const student = studentsMap.get(visit.student_id);
        const checkInDate = new Date(visit.check_in);

        // Search match
        const matchesSearch = 
          (student && student.name.toLowerCase().includes(search.toLowerCase())) ||
          (student && student.nis.includes(search)) ||
          visit.rfid_uid.toLowerCase().includes(search.toLowerCase());

        // Class match
        const matchesClass = classFilter === 'all' || (student && student.class === classFilter);

        // Status match
        const matchesStatus = statusFilter === 'all' || visit.status === statusFilter;

        // Date match
        let matchesDate = true;
        if (dateFilter === 'today') {
          matchesDate = checkInDate.toDateString() === todayStr;
        } else if (dateFilter === '7days') {
          matchesDate = checkInDate >= sevenDaysAgo;
        } else if (dateFilter === 'this_month') {
          matchesDate = checkInDate.getMonth() === currentMonth && checkInDate.getFullYear() === currentYear;
        }

        return matchesSearch && matchesClass && matchesStatus && matchesDate;
      });
  }, [visits, studentsMap, search, dateFilter, classFilter, statusFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredVisits.length / pageSize));
  const paginatedVisits = filteredVisits.slice((page - 1) * pageSize, page * pageSize);

  const handleExport = () => {
    exportVisitsToExcel(filteredVisits, studentsMap);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Riwayat Kunjungan Perpustakaan
          </h1>
          <p className="text-sm text-slate-500">
            Log lengkap kehadiran, durasi membaca santri, dan status absensi.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-monthly-pdf-report"
            onClick={() => setShowMonthlyReportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Laporan Bulanan (PDF)</span>
          </button>

          <button
            id="btn-export-visits"
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
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
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari santri, NIS, atau UID..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="7days">7 Hari Terakhir</option>
            <option value="this_month">Bulan Ini</option>
          </select>

          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Kelas</option>
            {uniqueClasses.map(c => (
              <option key={c} value={c}>Kelas {c}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Status</option>
            <option value="inside">Sedang di Dalam</option>
            <option value="completed">Selesai (Sudah Keluar)</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Menemukan <strong>{filteredVisits.length}</strong> catatan kunjungan</span>
          {(search || dateFilter !== 'all' || classFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setDateFilter('all');
                setClassFilter('all');
                setStatusFilter('all');
                setPage(1);
              }}
              className="text-emerald-600 font-semibold hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Santri</th>
                <th className="py-3.5 px-4">NIS</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4">Jam Masuk</th>
                <th className="py-3.5 px-4">Jam Keluar</th>
                <th className="py-3.5 px-4">Durasi</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedVisits.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada riwayat kunjungan yang sesuai.
                  </td>
                </tr>
              ) : (
                paginatedVisits.map((visit, idx) => {
                  const student = studentsMap.get(visit.student_id);
                  const isInside = visit.status === 'inside' && visit.check_out === null;

                  const checkInTime = new Date(visit.check_in).toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  const checkOutTime = visit.check_out ? new Date(visit.check_out).toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-';

                  return (
                    <tr key={visit.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center font-medium text-slate-400">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {student?.photo_url ? (
                            <img src={student.photo_url} alt={student.name} className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                              {student?.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <span className="font-bold text-slate-900">{student?.name || 'Santri'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium">{student?.nis || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                          {student?.class || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-800">{checkInTime} WIB</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{checkOutTime} {visit.check_out ? 'WIB' : ''}</td>
                      <td className="py-3 px-4 font-medium">
                        {isInside ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 animate-spin duration-3000" /> Sedang berjalan
                          </span>
                        ) : (
                          <span className="text-slate-800 font-semibold">
                            {visit.duration_minutes ? `${visit.duration_minutes} menit` : '-'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isInside ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            DI DALAM
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-slate-400" />
                            SELESAI
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isInside && (
                          <button
                            onClick={() => manualCheckOut(visit.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] border border-rose-200 transition-colors cursor-pointer"
                          >
                            Check-Out
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Baris per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="p-1 rounded-md bg-slate-50 border border-slate-200"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span>Halaman {page} dari {totalPages}</span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Report PDF Modal */}
      <MonthlyReportModal
        isOpen={showMonthlyReportModal}
        onClose={() => setShowMonthlyReportModal(false)}
      />
    </div>
  );
};
