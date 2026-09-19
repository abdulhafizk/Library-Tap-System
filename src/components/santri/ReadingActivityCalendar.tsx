import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, CheckCircle2, AlertCircle, Clock, BookOpen, ChevronRight, X, Info } from 'lucide-react';
import { CalendarDayContribution, formatJakartaFullDate, formatReadingDuration } from '../../utils/readingStreakUtils';

interface ReadingActivityCalendarProps {
  contributions: CalendarDayContribution[];
  targetMinutes: number;
  onOpenSessionForDate?: (dateStr: string) => void;
}

export const ReadingActivityCalendar: React.FC<ReadingActivityCalendarProps> = ({
  contributions,
  targetMinutes,
  onOpenSessionForDate
}) => {
  const [selectedDay, setSelectedDay] = useState<CalendarDayContribution | null>(null);

  // Group contributions by weeks (7 days per column)
  const weeks: CalendarDayContribution[][] = [];
  let currentWeek: CalendarDayContribution[] = [];

  // Pad beginning if first item doesn't start on Sunday (0)
  if (contributions.length > 0) {
    const firstDayOfWeek = contributions[0].dayOfWeek;
    for (let i = 0; i < firstDayOfWeek; i++) {
      // Empty placeholder cell
      currentWeek.push({
        date: '',
        dayOfWeek: i,
        durationMinutes: 0,
        targetReached: false,
        status: 'none',
        books: [],
        isToday: false,
        isFuture: false
      });
    }
  }

  contributions.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({
        date: '',
        dayOfWeek: currentWeek.length,
        durationMinutes: 0,
        targetReached: false,
        status: 'none',
        books: [],
        isToday: false,
        isFuture: true
      });
    }
    weeks.push(currentWeek);
  }

  // Summary counts
  const totalDaysReached = contributions.filter(c => c.status === 'reached').length;
  const totalDaysPartial = contributions.filter(c => c.status === 'partial').length;
  const totalMinutes = contributions.reduce((sum, c) => sum + c.durationMinutes, 0);

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 text-white space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h4 className="text-base font-bold text-white tracking-tight">
              Kalender Aktivitas Membaca (Reading Activity)
            </h4>
          </div>
          <p className="text-xs text-slate-400">
            Peta konsistensi membaca santri selama 90 hari terakhir. Klik kotak tanggal untuk melihat rincian muthola'ah.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/80 shrink-0">
          <span className="font-semibold text-slate-300">Legenda:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 shadow-xs shadow-emerald-500/50" />
            <span>Target Tercapai (≥{targetMinutes}m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-400 shadow-xs shadow-amber-400/50" />
            <span>Belum Capai (&lt;{targetMinutes}m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-800 border border-slate-700/50" />
            <span>Tidak Ada</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="min-w-[680px]">
          {/* Day of Week Labels + Matrix */}
          <div className="flex gap-2">
            {/* Day labels column */}
            <div className="flex flex-col justify-between py-1 text-[9px] font-mono text-slate-400 select-none w-6 shrink-0">
              <span>Min</span>
              <span>Sen</span>
              <span>Sel</span>
              <span>Rab</span>
              <span>Kam</span>
              <span>Jum</span>
              <span>Sab</span>
            </div>

            {/* Matrix of weeks */}
            <div className="flex gap-1.5 flex-1">
              {weeks.map((week, wIdx) => (
                <div key={`w-${wIdx}`} className="flex flex-col gap-1.5">
                  {week.map((cell, cIdx) => {
                    if (!cell.date) {
                      return (
                        <div
                          key={`empty-${wIdx}-${cIdx}`}
                          className="w-3.5 h-3.5 rounded-sm bg-transparent pointer-events-none"
                        />
                      );
                    }

                    const isSelected = selectedDay?.date === cell.date;

                    let bgClass = 'bg-slate-800 hover:bg-slate-700 text-transparent border border-slate-700/40';
                    if (cell.status === 'reached') {
                      bgClass = 'bg-emerald-500 hover:bg-emerald-400 shadow-xs shadow-emerald-500/40 border border-emerald-400/60';
                    } else if (cell.status === 'partial') {
                      bgClass = 'bg-amber-400 hover:bg-amber-300 shadow-xs shadow-amber-400/40 border border-amber-300/60';
                    }

                    return (
                      <button
                        key={cell.date}
                        type="button"
                        onClick={() => setSelectedDay(cell)}
                        title={`${cell.date}: ${cell.durationMinutes} menit (${cell.status === 'reached' ? 'Target Tercapai' : cell.status === 'partial' ? 'Belum Capai' : 'Kosong'})`}
                        className={`w-3.5 h-3.5 rounded-sm transition-all cursor-pointer relative ${bgClass} ${
                          isSelected ? 'ring-2 ring-white scale-125 z-10' : ''
                        } ${cell.isToday ? 'ring-1 ring-amber-400' : ''}`}
                      >
                        {cell.isToday && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Summary Numbers */}
      <div className="grid grid-cols-3 gap-3 pt-2 text-center border-t border-slate-800/80">
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] text-slate-400">Total Hari Berhasil</div>
          <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
            {totalDaysReached} <span className="text-xs font-normal text-slate-400">Hari</span>
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] text-slate-400">Hari Belum Tuntas</div>
          <div className="text-lg font-extrabold text-amber-400 mt-0.5">
            {totalDaysPartial} <span className="text-xs font-normal text-slate-400">Hari</span>
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] text-slate-400">Total Durasi (90 Hari)</div>
          <div className="text-lg font-extrabold text-teal-400 mt-0.5">
            {formatReadingDuration(totalMinutes)}
          </div>
        </div>
      </div>

      {/* Selected Day Detail Popover / Card (Prompt Section 7) */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-emerald-500/40 relative shadow-xl shadow-slate-950/80"
          >
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Rincian Aktivitas Tanggal:</span>
                <h5 className="text-base font-extrabold text-white">
                  {formatJakartaFullDate(selectedDay.date)}
                  {selectedDay.isToday && (
                    <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Hari Ini
                    </span>
                  )}
                </h5>
              </div>

              <div className="flex items-center gap-2">
                {selectedDay.status === 'reached' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                    <span>✓ Target Tercapai</span>
                  </span>
                ) : selectedDay.status === 'partial' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Belum Capai Target ({targetMinutes}m)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 font-medium text-xs">
                    <span>Tidak Ada Aktivitas</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>Waktu Membaca:</span>
                </div>
                <div className="text-sm font-bold text-white pl-5">
                  {selectedDay.durationMinutes > 0 ? (
                    <span>{selectedDay.durationMinutes} Menit</span>
                  ) : (
                    <span className="text-slate-500 italic">0 Menit</span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kitab / Buku yang Dibaca:</span>
                </div>
                <div className="pl-5">
                  {selectedDay.books && selectedDay.books.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-slate-200">
                      {selectedDay.books.map((b, i) => (
                        <li key={i} className="truncate">
                          <strong className="text-white">{b.title}</strong>
                          {b.duration_minutes > 0 && (
                            <span className="text-slate-400 text-[11px] ml-1.5">({b.duration_minutes}m)</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-slate-500 italic">Belum ada catatan buku</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
