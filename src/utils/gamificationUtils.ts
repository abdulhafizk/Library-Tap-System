import { Student, LibraryVisit, BookLoan, Book, LiteracyBadge, LiteracyAward, StudentLiteracyProfile } from '../types';

export const LITERACY_BADGES: LiteracyBadge[] = [
  {
    id: 'badge-first-visit',
    code: 'FIRST_VISIT',
    title: 'Langkah Pertama',
    description: 'Melakukan kunjungan presensi pertama kali ke perpustakaan.',
    category: 'reading',
    icon: 'Sparkles',
    xpReward: 50,
    requirement: 'Minimal 1 kali tap kunjungan'
  },
  {
    id: 'badge-5-visits',
    code: 'VISITS_5',
    title: 'Santri Istiqomah',
    description: 'Menunjukkan komitmen belajar dengan 5 kali hadir di perpustakaan.',
    category: 'reading',
    icon: 'Flame',
    xpReward: 100,
    requirement: 'Minimal 5 kali kunjungan presensi'
  },
  {
    id: 'badge-15-visits',
    code: 'VISITS_15',
    title: 'Sahabat Maktabah',
    description: 'Menjadi pengunjung setia dengan 15 kali hadir di perpustakaan.',
    category: 'reading',
    icon: 'Award',
    xpReward: 250,
    requirement: 'Minimal 15 kali kunjungan presensi'
  },
  {
    id: 'badge-1st-borrow',
    code: 'BORROW_1',
    title: 'Peminjam Perdana',
    description: 'Meminjam kitab/buku fisik pertama untuk muthola\'ah di asrama.',
    category: 'borrowing',
    icon: 'BookOpen',
    xpReward: 75,
    requirement: 'Meminjam minimal 1 kitab/buku'
  },
  {
    id: 'badge-5-books',
    code: 'BORROW_5',
    title: 'Khatam 5 Kitab',
    description: 'Telah meminjam dan mengkaji sedikitnya 5 judul buku/kitab.',
    category: 'borrowing',
    icon: 'Library',
    xpReward: 200,
    requirement: 'Meminjam minimal 5 kitab/buku'
  },
  {
    id: 'badge-discipline',
    code: 'DISCIPLINE_STAR',
    title: 'Disiplin Emas',
    description: 'Menjaga amanah buku dengan mengembalikan tepat waktu tanpa denda.',
    category: 'discipline',
    icon: 'ShieldCheck',
    xpReward: 150,
    requirement: 'Minimal 2 kali pengembalian tepat waktu (0 denda)'
  },
  {
    id: 'badge-morning',
    code: 'MORNING_READER',
    title: 'Muthola\'ah Pagi',
    description: 'Mengisi waktu istirahat Dhuha / pagi untuk membaca di perpustakaan.',
    category: 'reading',
    icon: 'Sun',
    xpReward: 75,
    requirement: 'Kunjungan presensi sebelum pukul 11:30'
  },
  {
    id: 'badge-turats',
    code: 'TURATS_LOVER',
    title: 'Pecinta Kitab Kuning',
    description: 'Aktif mengkaji khazanah Turats, Fiqih, Tafsir, atau Hadits.',
    category: 'special',
    icon: 'Scroll',
    xpReward: 150,
    requirement: 'Meminjam kitab berkategori Turats / Fiqih / Tafsir'
  },
  {
    id: 'badge-duta',
    code: 'DUTA_LITERASI',
    title: 'Duta Literasi Pesantren',
    description: 'Dianugerahi piagam kehormatan khusus oleh pengasuh & pustakawan.',
    category: 'special',
    icon: 'Crown',
    xpReward: 500,
    requirement: 'Menerima penetapan Piagam Penghargaan Resmi'
  }
];

export interface LevelInfo {
  tier: number;
  name: string;
  title: string;
  minXp: number;
  maxXp: number;
  color: string;
  badgeBg: string;
  badgeText: string;
  icon: string;
}

export const LITERACY_LEVELS: LevelInfo[] = [
  {
    tier: 1,
    name: 'Muhibbul Kutub',
    title: 'Pencinta Kitab Pemula',
    minXp: 0,
    maxXp: 150,
    color: 'from-slate-500 to-blue-600',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
    badgeText: 'text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    icon: 'Book'
  },
  {
    tier: 2,
    name: 'Thalibul \'Ilm',
    title: 'Penuntut Ilmu Rajin',
    minXp: 151,
    maxXp: 400,
    color: 'from-emerald-600 to-teal-700',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    icon: 'GraduationCap'
  },
  {
    tier: 3,
    name: 'Muthaala\'ah Cendekia',
    title: 'Pembaca Tekun & Aktif',
    minXp: 401,
    maxXp: 850,
    color: 'from-indigo-600 to-purple-700',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60',
    badgeText: 'text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    icon: 'Sparkles'
  },
  {
    tier: 4,
    name: 'Faqihul Maktabah',
    title: 'Pakar Pustaka Pesantren',
    minXp: 851,
    maxXp: 1500,
    color: 'from-amber-500 to-orange-600',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeText: 'text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    icon: 'Medal'
  },
  {
    tier: 5,
    name: 'Syaikhul Kutub',
    title: 'Duta Literasi Mahasantri',
    minXp: 1501,
    maxXp: 99999,
    color: 'from-rose-600 via-amber-500 to-yellow-500',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60',
    badgeText: 'text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    icon: 'Crown'
  }
];

export function getLevelForXp(xp: number): LevelInfo {
  for (let i = LITERACY_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LITERACY_LEVELS[i].minXp) {
      return LITERACY_LEVELS[i];
    }
  }
  return LITERACY_LEVELS[0];
}

export function calculateStudentProfile(
  student: Student,
  allVisits: LibraryVisit[],
  allLoans: BookLoan[],
  allBooks: Book[],
  allAwards: LiteracyAward[]
): StudentLiteracyProfile {
  const studentVisits = allVisits.filter(v => v.student_id === student.id);
  const studentLoans = allLoans.filter(l => l.student_id === student.id);
  const studentAwards = allAwards.filter(a => a.student_id === student.id);

  // 1. Visit stats & XP
  const totalVisits = studentVisits.length;
  let totalReadingMinutes = 0;
  let morningVisits = 0;

  studentVisits.forEach(v => {
    const dur = v.duration_minutes || 25; // default estimation if not checked out yet
    totalReadingMinutes += dur;

    const checkInDate = new Date(v.check_in);
    if (checkInDate.getHours() < 12) {
      morningVisits++;
    }
  });

  // 2. Loan stats
  const totalBooksBorrowed = studentLoans.length;
  let onTimeReturnsCount = 0;
  let lateReturnsCount = 0;
  let turatsBorrowed = 0;

  studentLoans.forEach(loan => {
    if (loan.status === 'returned') {
      if (loan.fine_amount === 0) {
        onTimeReturnsCount++;
      } else {
        lateReturnsCount++;
      }
    }
    const book = allBooks.find(b => b.id === loan.book_id);
    if (book && (book.category.toLowerCase().includes('turats') || 
                 book.category.toLowerCase().includes('fiqih') || 
                 book.category.toLowerCase().includes('hadits') || 
                 book.category.toLowerCase().includes('tafsir'))) {
      turatsBorrowed++;
    }
  });

  // 3. XP Breakdown Calculation
  // - Tap Presensi: 15 XP per visit
  // - Reading Time: 1 XP per 2 minutes
  // - Book Borrowing: 35 XP per book
  // - On-time return: 25 XP per clean return
  // - Official Awards: 200 XP per award
  const visitXp = totalVisits * 15;
  const timeXp = Math.floor(totalReadingMinutes / 2);
  const borrowXp = totalBooksBorrowed * 35;
  const disciplineXp = onTimeReturnsCount * 25;
  const awardsXp = studentAwards.length * 200;

  // Unlocked Badges Check
  const unlockedBadges: Array<{ badge: LiteracyBadge; unlockedAt: string }> = [];

  LITERACY_BADGES.forEach(b => {
    let unlocked = false;
    let unlockedDate = student.created_at || new Date().toISOString();

    if (b.code === 'FIRST_VISIT' && totalVisits >= 1) unlocked = true;
    if (b.code === 'VISITS_5' && totalVisits >= 5) unlocked = true;
    if (b.code === 'VISITS_15' && totalVisits >= 15) unlocked = true;
    if (b.code === 'BORROW_1' && totalBooksBorrowed >= 1) unlocked = true;
    if (b.code === 'BORROW_5' && totalBooksBorrowed >= 5) unlocked = true;
    if (b.code === 'DISCIPLINE_STAR' && onTimeReturnsCount >= 2 && lateReturnsCount === 0) unlocked = true;
    if (b.code === 'MORNING_READER' && morningVisits >= 3) unlocked = true;
    if (b.code === 'TURATS_LOVER' && turatsBorrowed >= 1) unlocked = true;
    if (b.code === 'DUTA_LITERASI' && studentAwards.length >= 1) unlocked = true;

    if (unlocked) {
      unlockedBadges.push({
        badge: b,
        unlockedAt: unlockedDate
      });
    }
  });

  const badgeXp = unlockedBadges.reduce((sum, item) => sum + item.badge.xpReward, 0);
  const totalXp = visitXp + timeXp + borrowXp + disciplineXp + awardsXp + badgeXp;

  const currentLevel = getLevelForXp(totalXp);
  const nextLevel = LITERACY_LEVELS.find(lvl => lvl.tier === currentLevel.tier + 1) || currentLevel;

  const xpInCurrentTier = totalXp - currentLevel.minXp;
  const tierXpSpan = nextLevel.minXp - currentLevel.minXp;
  const progressPercent = currentLevel.tier === 5 
    ? 100 
    : Math.min(100, Math.max(0, Math.round((xpInCurrentTier / Math.max(1, tierXpSpan)) * 100)));

  return {
    student,
    totalXp,
    levelTier: currentLevel.tier,
    levelName: currentLevel.name,
    levelTitle: currentLevel.title,
    levelColor: currentLevel.color,
    nextLevelXp: nextLevel.minXp,
    progressPercent,
    totalVisits,
    totalReadingMinutes,
    totalBooksBorrowed,
    onTimeReturnsCount,
    lateReturnsCount,
    unlockedBadges,
    recentAwards: studentAwards
  };
}

export interface ClassLeaderboardItem {
  className: string;
  studentCount: number;
  totalVisits: number;
  totalReadingMinutes: number;
  totalBooksBorrowed: number;
  totalXp: number;
  averageXpPerStudent: number;
}

export function calculateClassLeaderboard(
  students: Student[],
  visits: LibraryVisit[],
  loans: BookLoan[],
  books: Book[],
  awards: LiteracyAward[]
): ClassLeaderboardItem[] {
  const classMap = new Map<string, Student[]>();

  students.forEach(std => {
    const c = std.class || 'Lainnya';
    if (!classMap.has(c)) classMap.set(c, []);
    classMap.get(c)!.push(std);
  });

  const list: ClassLeaderboardItem[] = [];

  classMap.forEach((classStudents, className) => {
    let totalVisits = 0;
    let totalReadingMinutes = 0;
    let totalBooksBorrowed = 0;
    let totalXp = 0;

    classStudents.forEach(std => {
      const prof = calculateStudentProfile(std, visits, loans, books, awards);
      totalVisits += prof.totalVisits;
      totalReadingMinutes += prof.totalReadingMinutes;
      totalBooksBorrowed += prof.totalBooksBorrowed;
      totalXp += prof.totalXp;
    });

    const studentCount = classStudents.length;
    const averageXpPerStudent = studentCount > 0 ? Math.round(totalXp / studentCount) : 0;

    list.push({
      className,
      studentCount,
      totalVisits,
      totalReadingMinutes,
      totalBooksBorrowed,
      totalXp,
      averageXpPerStudent
    });
  });

  return list.sort((a, b) => b.totalXp - a.totalXp);
}

export const INITIAL_AWARDS: LiteracyAward[] = [
  {
    id: 'award-001',
    student_id: 'std-001',
    title: 'Juara 1 Santri Paling Rajin Membaca (Bintang Pustaka)',
    period: 'Agustus 2026',
    category: 'top_reader',
    certificate_no: 'DL-2026/VIII/001',
    reward_item: 'Kitab Fathul Qorib Syarah + Voucher Koperasi Rp 50.000',
    awarded_at: '2026-08-15T09:00:00Z',
    notes: 'Kunjungan presensi tertinggi dengan total waktu membaca di atas 120 jam.'
  },
  {
    id: 'award-002',
    student_id: 'std-003',
    title: 'Juara 1 Kolektor & Pembaca Kitab Turats',
    period: 'Agustus 2026',
    category: 'top_borrower',
    certificate_no: 'DL-2026/VIII/002',
    reward_item: 'Kamus Al-Munawwir Arab-Indonesia + Piagam Penghargaan',
    awarded_at: '2026-08-15T09:00:00Z',
    notes: 'Telah meminjam dan menyelesaikan 8 kitab kuning dalam satu semester.'
  },
  {
    id: 'award-003',
    student_id: 'std-004',
    title: 'Bintang Disiplin & Amanah Buku',
    period: 'Semester Ganjil 2026',
    category: 'discipline_star',
    certificate_no: 'DL-2026/VIII/003',
    reward_item: 'Al-Qur\'an Mushaf Tajwid Warna + Sertifikat Kehormatan',
    awarded_at: '2026-08-01T10:00:00Z',
    notes: 'Selalu mengembalikan kitab tepat waktu dengan kondisi fisik yang sangat terawat.'
  }
];
