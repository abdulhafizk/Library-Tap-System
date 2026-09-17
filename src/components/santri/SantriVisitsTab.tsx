import React, { useState, useMemo } from 'react';
import { 
  History, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  DoorOpen, 
  Radio, 
  Filter, 
  Search, 
  Sparkles, 
  TrendingUp, 
  Timer, 
  BookOpen 
} from 'lucide-react';
import { Student, LibraryVisit } from '../../types';

interface SantriVisitsTabProps {
  student: Student;
  visits: LibraryVisit[];
}

export const SantriVisitsTab: React.FC<SantriVisitsTabProps> = ({ student, visits }) => {
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Visits belonging to this student (either by student_id or rfid_uid)
  const studentVisits = useMemo(() => {
    return visits.filter(v => 
      v.student_id === student.id || 
      (student.rfid_uid && v.rfid_uid && v.rfid_uid.toLowerCase() === student.rfid_uid.toLowerCase())
    ).sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime());
  }, [visits, student.id, student.rfid_uid]);

  // Check if student is currently inside the library
  const currentActiveVisit = useMemo(() => {
    return studentVisits.find(v => v.status === 'inside');
  }, [studentVisits]);

  // Calculate metrics
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const monthVisits = useMemo(() => {
    return studentVisits.filter(v => new Date(v.check_in) >= startOfMonth);
  }, [studentVisits, startOfMonth]);

  const weekVisits = useMemo(() => {
    return studentVisits.filter(v => new Date(v.check_in) >= sevenDaysAgo);
  }, [studentVisits, sevenDaysAgo]);

  // Total reading minutes across completed visits
  const totalMinutes = useMemo(() => {
    return studentVisits.reduce((acc, v) => {
      if (v.duration_minutes && v.duration_minutes > 0) {
        return acc + v.duration_minutes;
      }
      if (v.check_in && v.check_out) {
        const diff = Math.round((new Date(v.check_out).getTime() - new Date(v.check_in).getTime()) / (1000 * 60));
        return acc + Math.max(diff, 1);
      }
      return acc;
    }, 0);
  }, [studentVisits]);

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  const averageMinutes = studentVisits.length > 0 ? Math.round(totalMinutes / studentVisits.length) : 0;

  // Filtered visits based on UI selection
  const filteredVisits = useMemo(() => {
    let list = studentVisits;
    if (timeFilter === 'month') {
      list = monthVisits;
    } else if (timeFilter === 'week') {
      list = weekVisits;
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(v => {
      const dateStr = new Date(v.check_in).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).toLowerCase();
      const notes = v.notes ? v.notes.toLowerCase() : '';
      return dateStr.includes(q) || notes.includes(q);
    });
  }, [studentVisits, timeFilter, monthVisits, weekVisits, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Current Presence Status Banner */}
      {currentActiveVisit ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-emerald-950/40">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0 relative">
              <DoorOpen className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Status Presensi: Sedang di Perpustakaan
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                Check-in hari ini pk {new Date(currentActiveVisit.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </h4>
            </div>
          </div>

          <div className="text-xs text-emerald-200/90 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30">
            Jangan lupa tap kartu saat keluar
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Kunjungan Terakhir:{' '}
              <strong className="text-slate-200">
                {studentVisits.length > 0
                  ? new Date(studentVisits[0].check_in).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) + ' WIB'
                  : 'Belum ada riwayat kunjungan'}
              </strong>
            </span>
          </div>
          <span className="hidden sm:inline text-slate-500">Tap kartu RFID Anda di pintu perpustakaan untuk absen</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Total Kunjungan</span>
            <History className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {studentVisits.length} <span className="text-xs font-normal text-slate-400">Kali</span>
          </div>
          <div className="text-[11px] text-emerald-400/90 mt-1">
            {monthVisits.length} kali di bulan ini
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Akumulasi Jam Baca</span>
            <Timer className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-teal-300">
            {totalHours > 0 ? `${totalHours}j ` : ''}{remainingMinutes}m
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total {totalMinutes} menit membaca
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Rata-rata Durasi</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-300">
            {averageMinutes} <span className="text-xs font-normal text-slate-400">Menit / visit</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Konsistensi belajar
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Kunjungan Minggu Ini</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300">
            {weekVisits.length} <span className="text-xs font-normal text-slate-400">Kali</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            7 hari terakhir
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Time Filter Buttons */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setTimeFilter('all')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              timeFilter === 'all'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua ({studentVisits.length})
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('month')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              timeFilter === 'month'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bulan Ini ({monthVisits.length})
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('week')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              timeFilter === 'week'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            7 Hari ({weekVisits.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari hari atau tanggal..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Visits List */}
      {filteredVisits.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-white">Belum Ada Catatan Kunjungan</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Riwayat tap kartu masuk dan keluar perpustakaan santri akan tercatat otomatis di sini secara real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVisits.map((visit) => {
            const checkInDate = new Date(visit.check_in);
            const checkOutDate = visit.check_out ? new Date(visit.check_out) : null;
            const isInside = visit.status === 'inside';

            // Calculate duration in minutes if not precalculated
            let durationMins = visit.duration_minutes;
            if (!durationMins && checkOutDate) {
              durationMins = Math.max(Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60)), 1);
            }

            return (
              <div
                key={visit.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isInside 
                    ? 'bg-emerald-950/30 border-emerald-500/40 shadow-md shadow-emerald-950/20' 
                    : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Date and Day */}
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    isInside 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    <Calendar className="w-5 h-5" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {checkInDate.toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        Masuk: <strong className="text-slate-200">{checkInDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Keluar: {checkOutDate ? (
                          <strong className="text-slate-200">{checkOutDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</strong>
                        ) : (
                          <span className="text-emerald-400 font-semibold">Masih di Ruangan</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Badges: Duration & Status */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  {/* Reading Duration Badge */}
                  {durationMins ? (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Durasi Belajar</span>
                      <span className="text-xs font-bold text-teal-300 bg-teal-950/60 border border-teal-500/30 px-2 py-0.5 rounded-md font-mono">
                        {durationMins >= 60 
                          ? `${Math.floor(durationMins / 60)}j ${durationMins % 60}m` 
                          : `${durationMins} Menit`}
                      </span>
                    </div>
                  ) : isInside ? (
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Sedang Aktif Membaca
                    </span>
                  ) : null}

                  {/* Visit Status Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    isInside
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {isInside ? 'Di Ruangan' : 'Selesai'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
