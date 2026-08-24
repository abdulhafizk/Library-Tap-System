import React, { useState } from 'react';
import { 
  Trophy, 
  X, 
  Sparkles, 
  Award, 
  BookOpen, 
  History, 
  ShieldCheck, 
  Flame, 
  Sun, 
  Scroll, 
  Crown, 
  Lock, 
  CheckCircle2, 
  Printer, 
  Share2, 
  Gift,
  Calendar,
  GraduationCap
} from 'lucide-react';
import { Student, LiteracyAward, LiteracyBadge } from '../../types';
import { useLibrary } from '../../context/LibraryContext';
import { calculateStudentProfile, LITERACY_BADGES, LITERACY_LEVELS } from '../../utils/gamificationUtils';
import { CertificateModal } from './CertificateModal';

interface StudentProfileAwardsModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateAward?: (studentId: string) => void;
}

export const StudentProfileAwardsModal: React.FC<StudentProfileAwardsModalProps> = ({
  student,
  isOpen,
  onClose,
  onOpenCreateAward
}) => {
  const { visits, loans, books, awards, sendAwardWhatsAppCongrats } = useLibrary();
  const [selectedAwardForCert, setSelectedAwardForCert] = useState<LiteracyAward | null>(null);

  if (!isOpen) return null;

  const profile = calculateStudentProfile(student, visits, loans, books, awards);

  const getBadgeIcon = (iconName: string, isUnlocked: boolean) => {
    const className = `w-6 h-6 ${isUnlocked ? 'text-amber-500' : 'text-slate-400 dark:text-slate-600'}`;
    switch (iconName) {
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Flame': return <Flame className={className} />;
      case 'Award': return <Award className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'Library': return <BookOpen className={className} />;
      case 'ShieldCheck': return <ShieldCheck className={className} />;
      case 'Sun': return <Sun className={className} />;
      case 'Scroll': return <Scroll className={className} />;
      case 'Crown': return <Crown className={className} />;
      default: return <Award className={className} />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[90vh] flex flex-col">
          
          {/* Header Banner */}
          <div className="relative bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-600 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="relative">
                <img
                  src={student.photo_url}
                  alt={student.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white/30 shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 p-1.5 bg-amber-400 text-slate-900 rounded-full shadow font-bold text-xs">
                  Lv.{profile.levelTier}
                </div>
              </div>

              <div className="text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h3 className="text-xl font-bold">{student.name}</h3>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                    {profile.levelName}
                  </span>
                </div>

                <p className="text-xs text-amber-100 mb-3">
                  NIS: {student.nis} &bull; Kelas: {student.class} &bull; {profile.levelTitle}
                </p>

                {/* Level XP Bar */}
                <div className="max-w-md">
                  <div className="flex items-center justify-between text-xs font-medium text-amber-100 mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      Total {profile.totalXp.toLocaleString()} XP
                    </span>
                    <span>
                      {profile.levelTier === 5 ? 'Peringkat Maksimal' : `Target: ${profile.nextLevelXp} XP (${profile.progressPercent}%)`}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-300 to-amber-200 rounded-full transition-all duration-500"
                      style={{ width: `${profile.progressPercent}%` }}
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-center">
            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Total Kunjungan</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">{profile.totalVisits} kali</p>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Waktu Membaca</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">{Math.round(profile.totalReadingMinutes / 60)} jam</p>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Kitab/Buku Dipinjam</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">{profile.totalBooksBorrowed} kitab</p>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Pengembalian Tepat</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{profile.onTimeReturnsCount} kali</p>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-6 space-y-6 overflow-y-auto">
            
            {/* Badges Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Koleksi Lencana Prestasi ({profile.unlockedBadges.length}/{LITERACY_BADGES.length} Terbuka)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {LITERACY_BADGES.map(badge => {
                  const isUnlocked = profile.unlockedBadges.some(b => b.badge.code === badge.code);
                  return (
                    <div
                      key={badge.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isUnlocked
                          ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/70 shadow-sm'
                          : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`p-2 rounded-lg ${isUnlocked ? 'bg-amber-100 dark:bg-amber-900/60' : 'bg-slate-200 dark:bg-slate-800'}`}>
                          {getBadgeIcon(badge.icon, isUnlocked)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                              {badge.title}
                            </h5>
                            {isUnlocked ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {badge.description}
                          </p>
                          <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium">
                            <span className="text-amber-600 dark:text-amber-400">+{badge.xpReward} XP</span>
                            <span className="text-slate-400">{badge.requirement}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Official Awards Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Piagam & Gelar Penghargaan Resmi ({profile.recentAwards.length})
                </h4>
                {onOpenCreateAward && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCreateAward(student.id);
                    }}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                  >
                    + Beri Penghargaan
                  </button>
                )}
              </div>

              {profile.recentAwards.length === 0 ? (
                <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Belum ada piagam penghargaan resmi yang diterbitkan untuk santri ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {profile.recentAwards.map(award => (
                    <div
                      key={award.id}
                      className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                              {award.title}
                            </h5>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-medium">
                              {award.period}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                            No. {award.certificate_no} &bull; Hadiah: <span className="font-medium text-amber-700 dark:text-amber-300">{award.reward_item}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => setSelectedAwardForCert(award)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors shadow-sm"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Lihat Piagam
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              XP dan lencana dihitung otomatis oleh sistem presensi & sirkulasi buku.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg transition-colors"
            >
              Tutup
            </button>
          </div>

        </div>
      </div>

      {/* Certificate Modal */}
      {selectedAwardForCert && (
        <CertificateModal
          award={selectedAwardForCert}
          student={student}
          isOpen={true}
          onClose={() => setSelectedAwardForCert(null)}
        />
      )}
    </>
  );
};
