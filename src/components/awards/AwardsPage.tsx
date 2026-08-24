import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Award, 
  Sparkles, 
  Crown, 
  Medal, 
  Flame, 
  BookOpen, 
  Clock, 
  Users, 
  Printer, 
  Share2, 
  Search, 
  Plus, 
  Filter, 
  CheckCircle2, 
  ShieldCheck, 
  Sun, 
  Scroll, 
  HelpCircle,
  TrendingUp,
  GraduationCap,
  Calendar,
  Gift,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { Student, LiteracyAward, LiteracyBadge } from '../../types';
import { 
  calculateStudentProfile, 
  calculateClassLeaderboard, 
  LITERACY_BADGES, 
  LITERACY_LEVELS,
  LevelInfo
} from '../../utils/gamificationUtils';
import { CertificateModal } from './CertificateModal';
import { AwardCreateModal } from './AwardCreateModal';
import { StudentProfileAwardsModal } from './StudentProfileAwardsModal';

type AwardsTab = 'leaderboard' | 'tiers_badges' | 'class_ranks' | 'awards_archive';
type LeaderboardCategory = 'all' | 'reading' | 'borrowing' | 'discipline';

export const AwardsPage: React.FC = () => {
  const { students, visits, loans, books, awards, deleteAward, sendAwardWhatsAppCongrats } = useLibrary();

  const [activeTab, setActiveTab] = useState<AwardsTab>('leaderboard');
  const [leaderboardCategory, setLeaderboardCategory] = useState<LeaderboardCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isCreateAwardOpen, setIsCreateAwardOpen] = useState(false);
  const [createAwardStudentId, setCreateAwardStudentId] = useState<string | undefined>(undefined);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [selectedAwardForCert, setSelectedAwardForCert] = useState<{ award: LiteracyAward; student: Student } | null>(null);

  // Compute all student profiles
  const studentProfiles = useMemo(() => {
    return students.map(std => calculateStudentProfile(std, visits, loans, books, awards));
  }, [students, visits, loans, books, awards]);

  // Sort Leaderboard based on selected category
  const sortedProfiles = useMemo(() => {
    let list = [...studentProfiles];
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        p.student.name.toLowerCase().includes(q) ||
        p.student.nis.includes(q) ||
        p.student.class.toLowerCase().includes(q)
      );
    }

    if (leaderboardCategory === 'reading') {
      return list.sort((a, b) => b.totalReadingMinutes - a.totalReadingMinutes);
    } else if (leaderboardCategory === 'borrowing') {
      return list.sort((a, b) => b.totalBooksBorrowed - a.totalBooksBorrowed);
    } else if (leaderboardCategory === 'discipline') {
      return list.sort((a, b) => b.onTimeReturnsCount - a.onTimeReturnsCount);
    }

    // Default: By Total XP
    return list.sort((a, b) => b.totalXp - a.totalXp);
  }, [studentProfiles, searchQuery, leaderboardCategory]);

  // Class Leaderboard
  const classLeaderboard = useMemo(() => {
    return calculateClassLeaderboard(students, visits, loans, books, awards);
  }, [students, visits, loans, books, awards]);

  // Top metrics
  const topStudent = studentProfiles.length > 0 ? [...studentProfiles].sort((a, b) => b.totalXp - a.totalXp)[0] : null;
  const totalSystemXp = studentProfiles.reduce((sum, p) => sum + p.totalXp, 0);
  const totalReadingHours = Math.round(studentProfiles.reduce((sum, p) => sum + p.totalReadingMinutes, 0) / 60);
  const totalBadgesUnlocked = studentProfiles.reduce((sum, p) => sum + p.unlockedBadges.length, 0);

  const handleOpenCreateForStudent = (studentId: string) => {
    setCreateAwardStudentId(studentId);
    setIsCreateAwardOpen(true);
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'Flame': return <Flame className="w-5 h-5 text-amber-500" />;
      case 'Award': return <Award className="w-5 h-5 text-amber-500" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-amber-500" />;
      case 'Library': return <BookOpen className="w-5 h-5 text-amber-500" />;
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-amber-500" />;
      case 'Sun': return <Sun className="w-5 h-5 text-amber-500" />;
      case 'Scroll': return <Scroll className="w-5 h-5 text-amber-500" />;
      case 'Crown': return <Crown className="w-5 h-5 text-amber-500" />;
      default: return <Award className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-700 via-amber-800 to-yellow-800 text-white p-6 sm:p-8 shadow-lg">
        {/* Subtle background decoration */}
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/30 backdrop-blur-md border border-amber-300/30 text-amber-200 text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5" />
              <span>Sistem Gamifikasi & Apresiasi Literasi Pesantren</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-white">
              Penghargaan & Gamifikasi Santri (Literacy Awards)
            </h1>
            <p className="text-amber-100/90 text-sm leading-relaxed">
              Memotivasi tradisi membaca, muthola'ah kitab kuning, dan kedisiplinan santri melalui sistem XP bertingkat, lencana prestasi, serta penerbitan piagam penghargaan resmi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setCreateAwardStudentId(undefined);
                setIsCreateAwardOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              + Anugerahkan Piagam
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Top Student of the Month */}
        <div 
          onClick={() => topStudent && setSelectedStudentForProfile(topStudent.student)}
          className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 shadow-sm cursor-pointer hover:border-amber-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Bintang Pustaka #1
            </span>
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          {topStudent ? (
            <div className="mt-3 flex items-center gap-3">
              <img
                src={topStudent.student.photo_url}
                alt={topStudent.student.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-amber-400"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {topStudent.student.name}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  {topStudent.totalXp.toLocaleString()} XP &bull; {topStudent.levelName}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-2">Belum ada data</p>
          )}
        </div>

        {/* Total System XP */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total XP Santri
            </span>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {totalSystemXp.toLocaleString()} <span className="text-xs font-normal text-slate-500">XP</span>
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              Dari aktivitas presensi & pinjam kitab
            </p>
          </div>
        </div>

        {/* Total Reading Hours */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Akumulasi Muthola'ah
            </span>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {totalReadingHours.toLocaleString()} <span className="text-xs font-normal text-slate-500">Jam</span>
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
              Total waktu belajar di perpustakaan
            </p>
          </div>
        </div>

        {/* Total Badges & Awards */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Lencana & Piagam
            </span>
            <Medal className="w-5 h-5 text-rose-500" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {totalBadgesUnlocked} <span className="text-xs font-normal text-slate-500">Lencana</span>
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-0.5">
              & {awards.length} Piagam Resmi Diterbitkan
            </p>
          </div>
        </div>

      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-2 sm:space-x-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'leaderboard'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Peringkat & Leaderboard Santri
        </button>

        <button
          onClick={() => setActiveTab('tiers_badges')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'tiers_badges'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          Tingkatan Level & Lencana Prestasi
        </button>

        <button
          onClick={() => setActiveTab('class_ranks')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'class_ranks'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Peringkat Kelas & Asrama
        </button>

        <button
          onClick={() => setActiveTab('awards_archive')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'awards_archive'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Scroll className="w-4 h-4" />
          Arsip Piagam ({awards.length})
        </button>
      </div>

      {/* TAB 1: LEADERBOARD SANTRI */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          
          {/* Filters & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            
            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setLeaderboardCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  leaderboardCategory === 'all'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                🌟 Semua (Total XP)
              </button>
              <button
                onClick={() => setLeaderboardCategory('reading')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  leaderboardCategory === 'reading'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                ⏱️ Waktu Membaca
              </button>
              <button
                onClick={() => setLeaderboardCategory('borrowing')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  leaderboardCategory === 'borrowing'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                📚 Kolektor Kitab
              </button>
              <button
                onClick={() => setLeaderboardCategory('discipline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  leaderboardCategory === 'discipline'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                🛡️ Disiplin Tepat Waktu
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, NIS, kelas..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Podium Top 3 (Shown if at least 3 students exist and no specific search query) */}
          {sortedProfiles.length >= 3 && !searchQuery && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 items-end">
              
              {/* Rank 2 (Silver) */}
              <div 
                onClick={() => setSelectedStudentForProfile(sortedProfiles[1].student)}
                className="order-2 md:order-1 p-5 rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200/60 dark:from-slate-800 dark:to-slate-850 border border-slate-300 dark:border-slate-700 shadow-md text-center cursor-pointer hover:-translate-y-1 transition-transform relative"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold shadow-sm flex items-center gap-1">
                  🥈 Juara 2 (Perak)
                </div>
                <img
                  src={sortedProfiles[1].student.photo_url}
                  alt={sortedProfiles[1].student.name}
                  className="w-16 h-16 rounded-full object-cover mx-auto mt-2 border-4 border-slate-300 dark:border-slate-600 shadow"
                />
                <h4 className="font-bold text-base text-slate-900 dark:text-white mt-2 truncate">
                  {sortedProfiles[1].student.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {sortedProfiles[1].student.class} &bull; NIS: {sortedProfiles[1].student.nis}
                </p>
                <div className="mt-3 py-1.5 px-3 rounded-xl bg-white/70 dark:bg-slate-900/60 inline-block">
                  <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                    {sortedProfiles[1].totalXp.toLocaleString()} XP
                  </p>
                  <p className="text-[10px] text-slate-500">{sortedProfiles[1].levelName}</p>
                </div>
                <div className="mt-3 flex justify-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span>⏱️ {Math.round(sortedProfiles[1].totalReadingMinutes / 60)} Jam</span>
                  <span>&bull;</span>
                  <span>📚 {sortedProfiles[1].totalBooksBorrowed} Kitab</span>
                </div>
              </div>

              {/* Rank 1 (Gold / Champion) */}
              <div 
                onClick={() => setSelectedStudentForProfile(sortedProfiles[0].student)}
                className="order-1 md:order-2 p-6 rounded-2xl bg-gradient-to-b from-amber-100 via-amber-50 to-yellow-100/60 dark:from-amber-950/60 dark:via-slate-800 dark:to-slate-800 border-2 border-amber-400 dark:border-amber-500 shadow-xl text-center cursor-pointer hover:-translate-y-1.5 transition-transform relative md:-mt-4"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-extrabold shadow-md flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 fill-slate-950" />
                  🥇 JUARA 1 (EMAS)
                </div>
                <img
                  src={sortedProfiles[0].student.photo_url}
                  alt={sortedProfiles[0].student.name}
                  className="w-20 h-20 rounded-full object-cover mx-auto mt-2 border-4 border-amber-400 shadow-lg"
                />
                <h4 className="font-bold text-lg text-slate-900 dark:text-white mt-2 truncate">
                  {sortedProfiles[0].student.name}
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
                  {sortedProfiles[0].student.class} &bull; NIS: {sortedProfiles[0].student.nis}
                </p>
                <div className="mt-3 py-2 px-4 rounded-xl bg-amber-500/20 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700/60 inline-block">
                  <p className="text-base font-black text-amber-700 dark:text-amber-300">
                    {sortedProfiles[0].totalXp.toLocaleString()} XP
                  </p>
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">{sortedProfiles[0].levelName}</p>
                </div>
                <div className="mt-3 flex justify-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span>⏱️ {Math.round(sortedProfiles[0].totalReadingMinutes / 60)} Jam Membaca</span>
                  <span>&bull;</span>
                  <span>📚 {sortedProfiles[0].totalBooksBorrowed} Kitab</span>
                </div>
              </div>

              {/* Rank 3 (Bronze) */}
              <div 
                onClick={() => setSelectedStudentForProfile(sortedProfiles[2].student)}
                className="order-3 md:order-3 p-5 rounded-2xl bg-gradient-to-b from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-850 border border-amber-300/60 dark:border-amber-900/40 shadow-md text-center cursor-pointer hover:-translate-y-1 transition-transform relative"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-700 text-white text-xs font-bold shadow-sm flex items-center gap-1">
                  🥉 Juara 3 (Perunggu)
                </div>
                <img
                  src={sortedProfiles[2].student.photo_url}
                  alt={sortedProfiles[2].student.name}
                  className="w-16 h-16 rounded-full object-cover mx-auto mt-2 border-4 border-amber-600/60 shadow"
                />
                <h4 className="font-bold text-base text-slate-900 dark:text-white mt-2 truncate">
                  {sortedProfiles[2].student.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {sortedProfiles[2].student.class} &bull; NIS: {sortedProfiles[2].student.nis}
                </p>
                <div className="mt-3 py-1.5 px-3 rounded-xl bg-white/70 dark:bg-slate-900/60 inline-block">
                  <p className="text-sm font-black text-amber-800 dark:text-amber-400">
                    {sortedProfiles[2].totalXp.toLocaleString()} XP
                  </p>
                  <p className="text-[10px] text-slate-500">{sortedProfiles[2].levelName}</p>
                </div>
                <div className="mt-3 flex justify-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span>⏱️ {Math.round(sortedProfiles[2].totalReadingMinutes / 60)} Jam</span>
                  <span>&bull;</span>
                  <span>📚 {sortedProfiles[2].totalBooksBorrowed} Kitab</span>
                </div>
              </div>

            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Daftar Lengkap Peringkat Literasi Santri ({sortedProfiles.length})
              </h3>
              <span className="text-xs text-slate-500">Klik baris santri untuk melihat profil & koleksi lencana</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Rank</th>
                    <th className="py-3 px-4">Santri</th>
                    <th className="py-3 px-4">Level & Pangkat</th>
                    <th className="py-3 px-4 text-center">Total XP</th>
                    <th className="py-3 px-4 text-center">Kunjungan</th>
                    <th className="py-3 px-4 text-center">Waktu Membaca</th>
                    <th className="py-3 px-4 text-center">Kitab Dipinjam</th>
                    <th className="py-3 px-4 text-center">Lencana</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {sortedProfiles.map((prof, idx) => (
                    <tr
                      key={prof.student.id}
                      onClick={() => setSelectedStudentForProfile(prof.student)}
                      className="hover:bg-amber-50/50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-bold">
                        {idx === 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-sm">1</span>
                        ) : idx === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-black text-xs">2</span>
                        ) : idx === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs">3</span>
                        ) : (
                          <span className="text-slate-400 font-semibold">#{idx + 1}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prof.student.photo_url}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-slate-300"
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{prof.student.name}</p>
                            <p className="text-[10px] text-slate-400">NIS: {prof.student.nis} &bull; Kelas: {prof.student.class}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Lv.{prof.levelTier} {prof.levelName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-600 dark:text-amber-400">
                        {prof.totalXp.toLocaleString()} XP
                      </td>
                      <td className="py-3 px-4 text-center font-medium">
                        {prof.totalVisits} kali
                      </td>
                      <td className="py-3 px-4 text-center font-medium">
                        {Math.round(prof.totalReadingMinutes / 60)} jam
                      </td>
                      <td className="py-3 px-4 text-center font-medium">
                        {prof.totalBooksBorrowed} kitab
                      </td>
                      <td className="py-3 px-4 text-center font-medium">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                          {prof.unlockedBadges.length} 🎖️
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCreateForStudent(prof.student.id);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors shadow-sm"
                        >
                          Beri Piagam
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: TIERS & BADGES */}
      {activeTab === 'tiers_badges' && (
        <div className="space-y-8">
          
          {/* Leveling System Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Sistem Pangkat & Tingkatan Literasi Santri
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Setiap santri mengumpulkan XP dari presensi kunjungan, durasi muthola'ah, dan peminjaman kitab.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {LITERACY_LEVELS.map(lvl => (
                <div
                  key={lvl.tier}
                  className={`p-4 rounded-xl border relative flex flex-col justify-between ${lvl.badgeBg} ${lvl.badgeText}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 shadow-xs">
                        Tingkat {lvl.tier}
                      </span>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{lvl.name}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{lvl.title}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-current/20 text-xs">
                    <p className="font-bold">
                      {lvl.minXp} - {lvl.maxXp === 99999 ? '∞' : lvl.maxXp} XP
                    </p>
                    <p className="text-[10px] opacity-80 mt-0.5">Kuota pinjam: {lvl.tier + 1} kitab</p>
                  </div>
                </div>
              ))}
            </div>

            {/* How XP Works */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                Kalkulasi Perolehan XP Santri Otomatis:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                  <span className="font-bold text-amber-600">+15 XP</span> Tap Kunjungan Presensi
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                  <span className="font-bold text-amber-600">+1 XP / 2 Menit</span> Waktu Membaca di Perpus
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                  <span className="font-bold text-amber-600">+35 XP</span> Peminjaman Kitab/Buku
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                  <span className="font-bold text-amber-600">+25 XP</span> Pengembalian Tepat Waktu
                </div>
              </div>
            </div>
          </div>

          {/* Badges Catalog */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Katalog Lencana Prestasi Literasi ({LITERACY_BADGES.length} Badges)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Diberikan otomatis saat santri memenuhi kriteria keistiqomahan tertentu.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {LITERACY_BADGES.map(badge => (
                <div
                  key={badge.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 hover:border-amber-400 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800">
                      {getBadgeIcon(badge.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {badge.title}
                        </h4>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                          +{badge.xpReward} XP
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {badge.description}
                      </p>
                      <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Syarat: {badge.requirement}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: CLASS LEADERBOARD */}
      {activeTab === 'class_ranks' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-amber-500" />
                  Peringkat Kelas & Asrama Terliterat
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Agregat keaktifan membaca, total kunjungan, dan peminjaman kitab per kelas santri.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {classLeaderboard.slice(0, 3).map((item, idx) => (
                <div
                  key={item.className}
                  className={`p-5 rounded-xl border relative shadow-sm ${
                    idx === 0
                      ? 'bg-gradient-to-br from-amber-50 to-yellow-100/60 dark:from-amber-950/40 dark:to-slate-800 border-amber-400'
                      : idx === 1
                      ? 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-850 border-slate-300 dark:border-slate-700'
                      : 'bg-gradient-to-br from-orange-50 to-amber-50/50 dark:from-slate-800 dark:to-slate-850 border-amber-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 shadow-xs">
                      Juara {idx + 1}
                    </span>
                    <Trophy className={`w-5 h-5 ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : 'text-amber-700'}`} />
                  </div>

                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-3 font-serif">
                    Kelas {item.className}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.studentCount} Santri Terdaftar
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-400 text-[10px]">Total XP Kelas</p>
                      <p className="font-bold text-amber-600 dark:text-amber-400">{item.totalXp.toLocaleString()} XP</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px]">Waktu Membaca</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{Math.round(item.totalReadingMinutes / 60)} Jam</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Class Leaderboard Table */}
            <div className="overflow-x-auto mt-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Rank</th>
                    <th className="py-3 px-4">Nama Kelas / Asrama</th>
                    <th className="py-3 px-4 text-center">Jumlah Santri</th>
                    <th className="py-3 px-4 text-center">Total Kunjungan</th>
                    <th className="py-3 px-4 text-center">Total Waktu Baca</th>
                    <th className="py-3 px-4 text-center">Kitab Dipinjam</th>
                    <th className="py-3 px-4 text-center">Total XP</th>
                    <th className="py-3 px-4 text-center">Rata-rata XP / Santri</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {classLeaderboard.map((cls, idx) => (
                    <tr key={cls.className} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                      <td className="py-3 px-4 text-center font-bold">#{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        Kelas {cls.className}
                      </td>
                      <td className="py-3 px-4 text-center">{cls.studentCount} orang</td>
                      <td className="py-3 px-4 text-center">{cls.totalVisits} kali</td>
                      <td className="py-3 px-4 text-center font-medium">{Math.round(cls.totalReadingMinutes / 60)} jam</td>
                      <td className="py-3 px-4 text-center font-medium">{cls.totalBooksBorrowed} kitab</td>
                      <td className="py-3 px-4 text-center font-bold text-amber-600 dark:text-amber-400">
                        {cls.totalXp.toLocaleString()} XP
                      </td>
                      <td className="py-3 px-4 text-center font-semibold">
                        {cls.averageXpPerStudent.toLocaleString()} XP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: AWARDS ARCHIVE & HALL OF FAME */}
      {activeTab === 'awards_archive' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Scroll className="w-5 h-5 text-amber-500" />
                  Arsip Piagam & Penghargaan Resmi Pesantren
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Daftar santri teladan yang telah resmi dianugerahi Piagam Kehormatan Duta Literasi.
                </p>
              </div>

              <button
                onClick={() => {
                  setCreateAwardStudentId(undefined);
                  setIsCreateAwardOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow transition-colors"
              >
                <Plus className="w-4 h-4" />
                + Anugerahkan Piagam Baru
              </button>
            </div>

            {awards.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-700">
                <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Belum ada piagam penghargaan yang diterbitkan.</p>
                <p className="text-xs text-slate-400 mt-1">Klik tombol "+ Anugerahkan Piagam Baru" untuk mulai memberikan penghargaan kepada santri.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {awards.map(award => {
                  const student = students.find(s => s.id === award.student_id);
                  if (!student) return null;

                  return (
                    <div
                      key={award.id}
                      className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-slate-850 border border-amber-200 dark:border-amber-900/40 shadow-sm flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={student.photo_url}
                              alt={student.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-sm"
                            />
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                {student.name}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                NIS: {student.nis} &bull; Kelas: {student.class}
                              </p>
                            </div>
                          </div>

                          <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            {award.certificate_no}
                          </span>
                        </div>

                        <div className="p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-amber-100 dark:border-slate-700">
                          <p className="text-xs font-bold text-amber-800 dark:text-amber-300 font-serif">
                            {award.title}
                          </p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                            {award.notes || 'Penghargaan resmi atas dedikasi membaca santri.'}
                          </p>
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                            <Gift className="w-3.5 h-3.5 text-amber-600" />
                            <span>Hadiah: {award.reward_item}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-slate-700 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">
                          Periode: <strong className="text-slate-700 dark:text-slate-300">{award.period}</strong>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => sendAwardWhatsAppCongrats(award.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg transition-colors"
                            title="Kirim ucapan tahniah via WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedAwardForCert({ award, student })}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg shadow-sm transition-colors text-xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Cetak Piagam
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Modal: Create Award */}
      {isCreateAwardOpen && (
        <AwardCreateModal
          isOpen={isCreateAwardOpen}
          onClose={() => setIsCreateAwardOpen(false)}
          initialStudentId={createAwardStudentId}
        />
      )}

      {/* Modal: Student Literacy Profile & Badges */}
      {selectedStudentForProfile && (
        <StudentProfileAwardsModal
          student={selectedStudentForProfile}
          isOpen={true}
          onClose={() => setSelectedStudentForProfile(null)}
          onOpenCreateAward={handleOpenCreateForStudent}
        />
      )}

      {/* Modal: Certificate View & Print */}
      {selectedAwardForCert && (
        <CertificateModal
          award={selectedAwardForCert.award}
          student={selectedAwardForCert.student}
          isOpen={true}
          onClose={() => setSelectedAwardForCert(null)}
        />
      )}

    </div>
  );
};
