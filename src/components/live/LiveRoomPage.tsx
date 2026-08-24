import React, { useState, useEffect, useMemo } from 'react';
import { 
  DoorOpen, 
  Clock, 
  LogOut, 
  Search, 
  Users, 
  AlertTriangle, 
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Filter,
  User
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { Student } from '../../types';

export const LiveRoomPage: React.FC = () => {
  const { visits, students, manualCheckOut, settings } = useLibrary();

  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [ticker, setTicker] = useState(Date.now());

  // Second-by-second live ticker
  useEffect(() => {
    const timer = setInterval(() => setTicker(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const studentsMap = useMemo(() => new Map<string, Student>(students.map(s => [s.id, s])), [students]);

  // Active visits
  const activeVisits = useMemo(() => {
    return visits.filter(v => v.status === 'inside' && v.check_out === null);
  }, [visits]);

  // Unique classes of active students
  const activeClasses = useMemo(() => {
    const set = new Set<string>();
    activeVisits.forEach(v => {
      const s = studentsMap.get(v.student_id);
      if (s) set.add(s.class);
    });
    return Array.from(set).sort();
  }, [activeVisits, studentsMap]);

  // Filtered active visits
  const filteredActiveVisits = useMemo(() => {
    return activeVisits.filter(v => {
      const student = studentsMap.get(v.student_id);
      if (!student) return false;

      const matchesSearch = 
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.nis.includes(search) ||
        v.rfid_uid.toLowerCase().includes(search.toLowerCase());

      const matchesClass = selectedClass === 'all' || student.class === selectedClass;

      return matchesSearch && matchesClass;
    });
  }, [activeVisits, studentsMap, search, selectedClass]);

  const formatDurationLive = (checkInIso: string) => {
    const diffSeconds = Math.max(0, Math.floor((ticker - new Date(checkInIso).getTime()) / 1000));
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;

    return {
      hours,
      minutes,
      seconds,
      text: hours > 0 ? `${hours} jam ${minutes} mnt ${seconds} dtk` : `${minutes} menit ${seconds} detik`,
      totalMinutes: Math.floor(diffSeconds / 60)
    };
  };

  const capacityPercentage = Math.min(100, Math.round((activeVisits.length / (settings.capacity || 60)) * 100));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Santri di Dalam Perpustakaan
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Live monitor kehadiran dan durasi membaca santri secara realtime.
          </p>
        </div>

        {/* Live Capacity Meter */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs min-w-[260px]">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-600">Kapasitas Ruangan</span>
            <span className="text-emerald-700 font-bold font-mono">
              {activeVisits.length} / {settings.capacity || 60} Santri
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                capacityPercentage > 85 ? 'bg-rose-500' : capacityPercentage > 65 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${capacityPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari santri yang sedang di dalam..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Kelas ({activeVisits.length})</option>
            {activeClasses.map(c => (
              <option key={c} value={c}>Kelas {c}</option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 whitespace-nowrap">
          Menampilkan <strong>{filteredActiveVisits.length}</strong> santri aktif
        </span>
      </div>

      {/* Grid of Active Santri Cards */}
      {filteredActiveVisits.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-xs max-w-lg mx-auto">
          <DoorOpen className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {activeVisits.length === 0 ? 'Perpustakaan Sedang Kosong' : 'Tidak Ada Santri Sesuai Filter'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {activeVisits.length === 0
              ? 'Santri yang melakukan tap masuk di scanner RFID akan otomatis muncul di sini lengkap dengan durasi berjalan.'
              : 'Coba ubah kata kunci pencarian atau filter kelas.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActiveVisits.map((visit) => {
            const student = studentsMap.get(visit.student_id);
            if (!student) return null;

            const duration = formatDurationLive(visit.check_in);
            const isOverstay = duration.totalMinutes > (settings.max_visit_minutes || 180);

            return (
              <div
                key={visit.id}
                className={`bg-white rounded-3xl p-5 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                  isOverstay ? 'border-amber-300 bg-amber-50/20' : 'border-emerald-200/90'
                }`}
              >
                <div>
                  {/* Top Badge: Sedang di perpustakaan */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Sedang di Perpustakaan
                    </span>

                    <span className="font-mono text-xs font-semibold text-slate-500">
                      {new Date(visit.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                  </div>

                  {/* Student Info */}
                  <div className="flex items-center gap-3.5 mb-4">
                    {student.photo_url && student.photo_url.trim() !== '' ? (
                      <img
                        src={student.photo_url}
                        alt={student.name}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/30 shadow-xs"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 ring-2 ring-emerald-500/30 shadow-xs flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <User className="w-7 h-7" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{student.name}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        NIS: {student.nis}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                          Kelas {student.class}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          UID: {visit.rfid_uid}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Live Duration Display Box */}
                  <div className={`p-3 rounded-2xl border text-center mb-4 ${
                    isOverstay ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50/70 border-emerald-100 text-emerald-950'
                  }`}>
                    <div className="flex items-center justify-center gap-1.5 text-xs font-medium mb-0.5 opacity-80">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Durasi Membaca Berjalan</span>
                    </div>
                    <div className="text-xl font-extrabold font-mono tracking-tight">
                      {duration.text}
                    </div>
                    {isOverstay && (
                      <div className="flex items-center justify-center gap-1 text-[10px] text-amber-700 font-bold mt-1">
                        <AlertTriangle className="w-3 h-3" /> Melebihi batas rekomendasi ({settings.max_visit_minutes} mnt)
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action: Manual Check-Out */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Sesi aktif #{visit.id.slice(-4)}
                  </span>
                  <button
                    onClick={() => manualCheckOut(visit.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Check-out Manual</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
