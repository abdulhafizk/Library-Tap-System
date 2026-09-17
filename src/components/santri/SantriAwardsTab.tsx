import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Printer, 
  Share2, 
  Calendar, 
  Gift, 
  Flame, 
  BookOpen, 
  ShieldCheck, 
  Sun, 
  Scroll, 
  Crown, 
  GraduationCap, 
  Medal, 
  Book, 
  Search, 
  Filter, 
  ExternalLink,
  ChevronRight,
  Info,
  Clock,
  Compass,
  ArrowRight,
  Sparkle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, LiteracyAward, LiteracyBadge } from '../../types';
import { useLibrary } from '../../context/LibraryContext';
import { 
  calculateStudentProfile, 
  LITERACY_BADGES, 
  LITERACY_LEVELS, 
  LevelInfo 
} from '../../utils/gamificationUtils';
import { CertificateModal } from '../awards/CertificateModal';

interface SantriAwardsTabProps {
  student: Student;
}

export const SantriAwardsTab: React.FC<SantriAwardsTabProps> = ({ student }) => {
  const { visits, loans, books, awards, settings } = useLibrary();

  // Sub-tabs: 'badges' | 'awards' | 'tiers'
  const [subTab, setSubTab] = useState<'badges' | 'awards' | 'tiers'>('badges');

  // Badge filters
  const [badgeCategory, setBadgeCategory] = useState<'all' | 'reading' | 'borrowing' | 'discipline' | 'special'>('all');
  const [badgeStatus, setBadgeStatus] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected award for full certificate view & printing
  const [selectedAwardForCert, setSelectedAwardForCert] = useState<LiteracyAward | null>(null);

  // Info modal state
  const [showXpBreakdown, setShowXpBreakdown] = useState(false);

  // Calculate full literacy profile for this student
  const profile = useMemo(() => {
    return calculateStudentProfile(student, visits, loans, books, awards);
  }, [student, visits, loans, books, awards]);

  // Student specific official awards
  const studentAwards = useMemo(() => {
    return awards
      .filter(a => a.student_id === student.id)
      .sort((a, b) => new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime());
  }, [awards, student.id]);

  // Filtered badges
  const filteredBadges = useMemo(() => {
    return LITERACY_BADGES.filter(b => {
      const isUnlocked = profile.unlockedBadges.some(ub => ub.badge.code === b.code);

      if (badgeCategory !== 'all' && b.category !== badgeCategory) return false;
      if (badgeStatus === 'unlocked' && !isUnlocked) return false;
      if (badgeStatus === 'locked' && isUnlocked) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchDesc = b.description.toLowerCase().includes(q);
        const matchReq = b.requirement.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchReq) return false;
      }

      return true;
    });
  }, [profile.unlockedBadges, badgeCategory, badgeStatus, searchQuery]);

  // Helper for rendering badge icons
  const renderBadgeIcon = (iconName: string, isUnlocked: boolean) => {
    const iconClass = `w-6 h-6 ${isUnlocked ? 'text-amber-400' : 'text-slate-500'}`;
    switch (iconName) {
      case 'Sparkles': return <Sparkles className={iconClass} />;
      case 'Flame': return <Flame className={iconClass} />;
      case 'Award': return <Award className={iconClass} />;
      case 'BookOpen': return <BookOpen className={iconClass} />;
      case 'Library': return <BookOpen className={iconClass} />;
      case 'ShieldCheck': return <ShieldCheck className={iconClass} />;
      case 'Sun': return <Sun className={iconClass} />;
      case 'Scroll': return <Scroll className={iconClass} />;
      case 'Crown': return <Crown className={iconClass} />;
      default: return <Award className={iconClass} />;
    }
  };

  // Helper to share award to WhatsApp
  const handleShareAwardWhatsApp = (award: LiteracyAward) => {
    const text = `*Piagam Penghargaan Literasi Pesantren*\n\n` +
      `Alhamdulillah! Santri *${student.name}* (NIS: ${student.nis}, Kelas: ${student.class}) ` +
      `telah meraih penghargaan resmi:\n\n` +
      `🏆 *${award.title}*\n` +
      `📜 No. Piagam: ${award.certificate_no}\n` +
      `📅 Periode: ${award.period}\n` +
      `🎁 Hadiah/Apresiasi: ${award.reward_item || 'Piagam Kehormatan'}\n\n` +
      `Diterbitkan resmi oleh ${settings.library_name || 'Perpustakaan Baitul Hikmah Pesantren'}.\n` +
      `Semoga barakah dan memotivasi santri untuk senantiasa tekun dalam muthola'ah ilmu syar'i.`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Profil Gelar Literasi & XP Santri */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900/90 to-emerald-950/50 border border-amber-500/30 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt={student.name}
                  referrerPolicy="no-referrer"
                  className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl object-cover border-2 border-amber-500/50 shadow-xl"
                />
              ) : (
                <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-amber-600 to-yellow-700 flex items-center justify-center border-2 border-amber-500/50 shadow-xl text-white">
                  <GraduationCap className="w-10 h-10" />
                </div>
              )}
              <div 
                className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[11px] font-extrabold shadow-lg border border-amber-300 flex items-center gap-1"
                title={`Level ${profile.levelTier} (${profile.levelName})`}
              >
                <Crown className="w-3 h-3 fill-slate-950" />
                Lv.{profile.levelTier}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                  Gelar Literasi Pesantren
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {profile.levelName}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                {student.name}
              </h2>
              <p className="text-xs text-slate-300">
                NIS: <span className="font-mono text-emerald-400">{student.nis}</span> &bull; Kelas: <span className="text-white font-medium">{student.class}</span> &bull; {profile.levelTitle}
              </p>
            </div>
          </div>

          {/* XP & Level Progress */}
          <div className="w-full md:w-80 bg-slate-950/60 border border-amber-500/20 rounded-2xl p-4 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{profile.totalXp.toLocaleString()} XP Terkumpul</span>
              </div>
              <button
                type="button"
                onClick={() => setShowXpBreakdown(!showXpBreakdown)}
                className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <Info className="w-3 h-3" />
                <span>Rincian XP</span>
              </button>
            </div>

            {/* Progress bar to next level */}
            <div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${profile.progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full shadow-sm"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-medium">
                <span>Tier {profile.levelTier}</span>
                <span>
                  {profile.levelTier === 5 
                    ? 'Peringkat Tertinggi (Syaikhul Kutub)' 
                    : `Menuju Level ${profile.levelTier + 1}: ${profile.nextLevelXp} XP (${profile.progressPercent}%)`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable XP Breakdown Info */}
        <AnimatePresence>
          {showXpBreakdown && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-5 border-t border-amber-500/20 overflow-hidden"
            >
              <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Sumber Akumulasi Poin XP Literasi Anda:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Presensi Tap</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">+{profile.totalVisits * 15} XP</div>
                  <div className="text-[9px] text-slate-500">{profile.totalVisits}x tap (15 XP/tap)</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Waktu Baca</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">+{Math.floor(profile.totalReadingMinutes / 2)} XP</div>
                  <div className="text-[9px] text-slate-500">{profile.totalReadingMinutes} menit (1 XP/2m)</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Pinjam Kitab</div>
                  <div className="text-sm font-bold text-blue-400 mt-0.5">+{profile.totalBooksBorrowed * 35} XP</div>
                  <div className="text-[9px] text-slate-500">{profile.totalBooksBorrowed} kitab (35 XP/buku)</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Disiplin Waktu</div>
                  <div className="text-sm font-bold text-teal-400 mt-0.5">+{profile.onTimeReturnsCount * 25} XP</div>
                  <div className="text-[9px] text-slate-500">{profile.onTimeReturnsCount}x tepat (25 XP)</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Piagam Resmi</div>
                  <div className="text-sm font-bold text-purple-400 mt-0.5">+{studentAwards.length * 200} XP</div>
                  <div className="text-[9px] text-slate-500">{studentAwards.length} piagam (200 XP)</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Bonus Lencana</div>
                  <div className="text-sm font-bold text-yellow-400 mt-0.5">
                    +{profile.unlockedBadges.reduce((sum, b) => sum + b.badge.xpReward, 0)} XP
                  </div>
                  <div className="text-[9px] text-slate-500">{profile.unlockedBadges.length} lencana diraih</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Key Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Piagam Resmi</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {studentAwards.length} <span className="text-xs font-normal text-slate-400">Piagam</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Lencana Terbuka</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {profile.unlockedBadges.length} <span className="text-xs font-normal text-slate-400">/ {LITERACY_BADGES.length}</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Buku & Kitab Dikaji</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {profile.totalBooksBorrowed} <span className="text-xs font-normal text-slate-400">Judul</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Tingkat Disiplin</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {profile.lateReturnsCount === 0 ? '100%' : `${Math.round((profile.onTimeReturnsCount / Math.max(1, profile.onTimeReturnsCount + profile.lateReturnsCount)) * 100)}%`}
              <span className="text-xs font-normal text-emerald-400 ml-1">Tepat</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setSubTab('badges')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'badges'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Koleksi Lencana ({profile.unlockedBadges.length}/{LITERACY_BADGES.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('awards')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'awards'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Piagam Kehormatan ({studentAwards.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('tiers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === 'tiers'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Tingkatan Gelar (Roadmap)</span>
          </button>
        </div>

        {subTab === 'awards' && studentAwards.length > 0 && (
          <div className="text-xs text-amber-300 flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Klik kartu piagam untuk melihat sertifikat digital & cetak resmi</span>
          </div>
        )}
      </div>

      {/* 4. Tab 1: KOLEKSI LENCANA PRESTASI (BADGES) */}
      {subTab === 'badges' && (
        <div className="space-y-4">
          {/* Controls: Category Filter, Status Filter & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Kategori:
              </span>
              {(['all', 'reading', 'borrowing', 'discipline', 'special'] as const).map(cat => {
                const label = 
                  cat === 'all' ? 'Semua' :
                  cat === 'reading' ? 'Membaca' :
                  cat === 'borrowing' ? 'Peminjaman' :
                  cat === 'discipline' ? 'Disiplin' : 'Turats & Khusus';
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setBadgeCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      badgeCategory === cat
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setBadgeStatus('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                  badgeStatus === 'all' ? 'bg-amber-600/80 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setBadgeStatus('unlocked')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1 ${
                  badgeStatus === 'unlocked' ? 'bg-emerald-600/80 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Terbuka
              </button>
              <button
                type="button"
                onClick={() => setBadgeStatus('locked')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1 ${
                  badgeStatus === 'locked' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3 h-3" />
                Terkunci
              </button>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBadges.map(badge => {
              const unlockedRecord = profile.unlockedBadges.find(ub => ub.badge.code === badge.code);
              const isUnlocked = Boolean(unlockedRecord);

              return (
                <motion.div
                  key={badge.id}
                  whileHover={{ y: -2 }}
                  className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/40 shadow-lg shadow-amber-950/20'
                      : 'bg-slate-900/50 border-slate-800/80 opacity-65'
                  }`}
                >
                  {/* Subtle Background Glow for Unlocked Badges */}
                  {isUnlocked && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                  )}

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                          isUnlocked
                            ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border-amber-500/40 shadow-md shadow-amber-950/30'
                            : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}>
                          {renderBadgeIcon(badge.icon, isUnlocked)}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className={`text-sm font-bold ${isUnlocked ? 'text-white' : 'text-slate-300'}`}>
                              {badge.title}
                            </h4>
                          </div>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                            badge.category === 'reading' ? 'bg-blue-950/80 text-blue-300 border border-blue-800/50' :
                            badge.category === 'borrowing' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50' :
                            badge.category === 'discipline' ? 'bg-teal-950/80 text-teal-300 border border-teal-800/50' :
                            'bg-purple-950/80 text-purple-300 border border-purple-800/50'
                          }`}>
                            {badge.category === 'reading' ? 'Membaca' :
                             badge.category === 'borrowing' ? 'Peminjaman' :
                             badge.category === 'discipline' ? 'Disiplin' : 'Turats & Khusus'}
                          </span>
                        </div>
                      </div>

                      {isUnlocked ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Diraih</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full shrink-0">
                          <Lock className="w-3 h-3" />
                          <span>Terkunci</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>

                  {/* Footer info: XP & Requirement */}
                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 font-bold text-amber-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>+{badge.xpReward} XP</span>
                    </div>

                    <div className="text-[11px] text-slate-400 text-right truncate max-w-[170px]" title={badge.requirement}>
                      {badge.requirement}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredBadges.length === 0 && (
            <div className="text-center py-12 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 p-6">
              <Award className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">Tidak ada lencana yang cocok dengan filter.</p>
              <p className="text-xs text-slate-500 mt-1">Coba ubah opsi kategori atau status lencana.</p>
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 2: PIAGAM KEHORMATAN RESMI (OFFICIAL LITERACY AWARDS) */}
      {subTab === 'awards' && (
        <div className="space-y-4">
          {studentAwards.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 p-8 space-y-3">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Belum Ada Piagam Kehormatan Resmi</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Piagam kehormatan diterbitkan resmi oleh Pengasuh Pesantren dan Pustakawan untuk santri dengan dedikasi literasi luar biasa setiap semester atau bulan.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSubTab('badges')}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Kumpulkan XP Lewat Lencana →
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {studentAwards.map(award => (
                <motion.div
                  key={award.id}
                  whileHover={{ scale: 1.005 }}
                  className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-start gap-4 sm:gap-5 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/30 to-yellow-600/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-md shadow-amber-950/40 shrink-0">
                      <Trophy className="w-7 h-7" />
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                          Piagam Kehormatan Resmi
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          No: {award.certificate_no}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                          {award.period}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-extrabold text-white">
                        {award.title}
                      </h3>

                      {award.notes && (
                        <p className="text-xs text-slate-300 italic leading-relaxed">
                          "{award.notes}"
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                        {award.reward_item && (
                          <span className="flex items-center gap-1.5 text-amber-300 font-medium bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                            <Gift className="w-3.5 h-3.5 text-amber-400" />
                            Hadiah: {award.reward_item}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          Ditetapkan: {new Date(award.awarded_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: View & Print Certificate Modal + Share WA */}
                  <div className="flex items-center gap-2.5 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleShareAwardWhatsApp(award)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                      title="Kirim ke WhatsApp Wali / Keluarga"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Kirim WA</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedAwardForCert(award)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-all cursor-pointer active:scale-95"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Buka & Cetak Piagam</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Tab 3: ROADMAP TINGKATAN GELAR SANTRI (TIER PROGRESSION) */}
      {subTab === 'tiers' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-white flex items-center gap-1.5 mb-1 text-sm">
              <Crown className="w-4 h-4 text-amber-400" />
              Hirarki Gelar Literasi Santri Baitul Hikmah
            </span>
            Tingkatan literasi dihitung otomatis berdasarkan akumulasi waktu baca, frekuensi kehadiran presensi RFID, kitab yang dimuthola'ah, serta komitmen pengembalian tepat waktu tanpa denda.
          </div>

          <div className="space-y-3">
            {LITERACY_LEVELS.map(level => {
              const isCurrentTier = profile.levelTier === level.tier;
              const isPassed = profile.levelTier > level.tier;

              return (
                <div
                  key={level.tier}
                  className={`p-5 rounded-2xl border transition-all ${
                    isCurrentTier
                      ? 'bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-900 border-amber-500/60 shadow-xl shadow-amber-950/30 ring-1 ring-amber-500/30'
                      : isPassed
                      ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                      : 'bg-slate-900/40 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm border ${
                        isCurrentTier
                          ? 'bg-gradient-to-br from-amber-500 to-yellow-400 text-slate-950 border-amber-300 shadow-md'
                          : isPassed
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        Lv.{level.tier}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">
                            {level.name}
                          </h4>
                          {isCurrentTier && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold">
                              GELAR ANDA SAAT INI
                            </span>
                          )}
                          {isPassed && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800">
                              Lulus
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {level.title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:text-right">
                      <div>
                        <div className="text-xs font-bold text-amber-400">
                          {level.minXp} {level.maxXp >= 90000 ? '+ XP' : `- ${level.maxXp} XP`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Syarat Minimum
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Official Digital Certificate Modal */}
      {selectedAwardForCert && (
        <CertificateModal
          award={selectedAwardForCert}
          student={student}
          isOpen={true}
          onClose={() => setSelectedAwardForCert(null)}
        />
      )}
    </div>
  );
};
