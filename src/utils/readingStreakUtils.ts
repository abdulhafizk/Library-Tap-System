import { 
  ReadingActivity, 
  ReadingDailySummary, 
  SantriStreak, 
  ReadingStreakConfig, 
  ReadingStreakMilestone, 
  Student, 
  Book 
} from '../types';

export const DEFAULT_STREAK_MILESTONES: ReadingStreakMilestone[] = [
  {
    days: 3,
    title: 'Mulai Konsisten',
    badgeIcon: 'Flame',
    description: 'Membaca berturut-turut selama 3 hari. Langkah awal membangun kebiasaan mulia.'
  },
  {
    days: 7,
    title: 'Pembaca Konsisten',
    badgeIcon: 'Sparkles',
    description: 'Istiqomah membaca 1 minggu penuh tanpa jeda. Kebiasaan mulai terbentuk mantap!'
  },
  {
    days: 14,
    title: 'Pembaca Rajin',
    badgeIcon: 'BookOpenCheck',
    description: 'Dua pekan membaca setiap hari. Kecintaan terhadap ilmu dan kitab semakin bersemi.'
  },
  {
    days: 30,
    title: 'Pembaca Aktif',
    badgeIcon: 'Award',
    description: 'Satu bulan penuh konsisten membaca! Menjadi teladan literasi bagi santri lainnya.'
  },
  {
    days: 60,
    title: 'Pembaca Istiqamah',
    badgeIcon: 'Medal',
    description: 'Enam puluh hari berturut-turut membaca kitab & buku. Disiplin ilmiah tingkat tinggi!'
  },
  {
    days: 100,
    title: 'Reading Master',
    badgeIcon: 'Crown',
    description: 'Seratus hari membaca tanpa putus! Gelar kehormatan tertinggi pembaca teladan.'
  }
];

export const DEFAULT_READING_STREAK_CONFIG: ReadingStreakConfig = {
  enabled: true,
  daily_target_minutes: 15,
  milestones: DEFAULT_STREAK_MILESTONES
};

export const READING_STREAK_STORAGE_KEYS = {
  ACTIVITIES: 'library_reading_activities_v1',
  CONFIG: 'library_reading_streak_config_v1',
  STREAKS: 'library_santri_streaks_v1',
};

/**
 * Returns YYYY-MM-DD string in Asia/Jakarta timezone (WIB = UTC+7)
 */
export function getJakartaDateString(dateInput?: Date | string | number): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);

  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(d);
  } catch {
    // Fallback using UTC+7 manual offset
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const jakartaTime = new Date(utc + (7 * 3600000));
    return jakartaTime.toISOString().slice(0, 10);
  }
}

/**
 * Returns formatted time HH:mm in Asia/Jakarta
 */
export function formatJakartaTime(dateInput?: Date | string | number): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return '00:00';

  try {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(d);
  } catch {
    return d.toTimeString().slice(0, 5);
  }
}

/**
 * Returns formatted Indonesian date, e.g. "19 September 2026"
 */
export function formatJakartaFullDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  
  const dateObj = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(dateObj);
}

/**
 * Calculates calendar day difference between two YYYY-MM-DD strings
 * Positive means date2 is after date1
 */
export function getCalendarDayDiff(dateStr1: string, dateStr2: string): number {
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Calculates previous date string in YYYY-MM-DD
 */
export function getPreviousDateString(dateStr: string, daysBack = 1): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  dateObj.setUTCDate(dateObj.getUTCDate() - daysBack);
  return dateObj.toISOString().slice(0, 10);
}

/**
 * Generate daily summaries from list of reading activities for a specific santri
 */
export function generateDailySummaries(
  activities: ReadingActivity[],
  santriId: string,
  targetMinutes: number
): Map<string, ReadingDailySummary> {
  const santriActivities = activities.filter(a => a.santri_id === santriId);
  const summaryMap = new Map<string, ReadingDailySummary>();

  for (const act of santriActivities) {
    const date = act.date;
    const existing = summaryMap.get(date);

    if (existing) {
      existing.total_duration_minutes += act.duration_minutes;
      existing.sessions_count += 1;
      existing.target_reached = existing.total_duration_minutes >= targetMinutes;
      existing.updated_at = new Date().toISOString();
      if (act.book_title || act.book_id) {
        existing.books_read.push({
          book_id: act.book_id,
          title: act.book_title || 'Kitab/Buku Bacaan',
          duration_minutes: act.duration_minutes
        });
      }
    } else {
      const isReached = act.duration_minutes >= targetMinutes;
      summaryMap.set(date, {
        id: `sum-${santriId}-${date}`,
        santri_id: santriId,
        date,
        total_duration_minutes: act.duration_minutes,
        target_minutes: targetMinutes,
        target_reached: isReached,
        sessions_count: 1,
        books_read: act.book_title || act.book_id ? [{
          book_id: act.book_id,
          title: act.book_title || 'Kitab/Buku Bacaan',
          duration_minutes: act.duration_minutes
        }] : [],
        updated_at: act.created_at || new Date().toISOString()
      });
    }
  }

  return summaryMap;
}

/**
 * Core Streak Computation Algorithm:
 * 
 * Rules:
 * 1. If santri reached target today and yesterday also reached target: current_streak = current_streak + 1
 * 2. If reached target today but yesterday didn't reach target: current_streak = 1
 * 3. If santri has NOT reached target today yet, but yesterday reached target:
 *    Streak is NOT broken yet; it remains equal to the streak achieved up to yesterday!
 * 4. If yesterday did not reach target and today has not reached target: current_streak = 0
 * 5. Longest streak = max consecutive successful reading days ever achieved
 * 6. Total reading days = count of all calendar days where daily total duration >= targetMinutes
 */
export function calculateSantriStreak(
  santriId: string,
  activities: ReadingActivity[],
  config: ReadingStreakConfig = DEFAULT_READING_STREAK_CONFIG,
  referenceDateStr?: string
): SantriStreak {
  const targetMinutes = config.daily_target_minutes || 15;
  const todayStr = referenceDateStr || getJakartaDateString();
  const yesterdayStr = getPreviousDateString(todayStr, 1);

  const summaryMap = generateDailySummaries(activities, santriId, targetMinutes);
  
  // All dates with target_reached = true, sorted chronologically
  const successfulDates = Array.from(summaryMap.values())
    .filter(s => s.target_reached)
    .map(s => s.date)
    .sort();

  const totalReadingDays = successfulDates.length;

  // Calculate total reading minutes and unique books
  const santriActivities = activities.filter(a => a.santri_id === santriId);
  const totalReadingMinutes = santriActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
  const uniqueBookTitles = new Set<string>();
  santriActivities.forEach(a => {
    if (a.book_title && a.book_title.trim()) uniqueBookTitles.add(a.book_title.trim().toLowerCase());
    else if (a.book_id) uniqueBookTitles.add(a.book_id);
  });
  const totalBooksRead = uniqueBookTitles.size;

  const todaySummary = summaryMap.get(todayStr);
  const todayMinutes = todaySummary ? todaySummary.total_duration_minutes : 0;
  const todayTargetReached = todayMinutes >= targetMinutes;

  const yesterdaySummary = summaryMap.get(yesterdayStr);
  const yesterdayTargetReached = yesterdaySummary ? yesterdaySummary.target_reached : false;

  // Calculate Current Streak
  let currentStreak = 0;
  if (todayTargetReached) {
    // Today reached target! Count back consecutive days ending at today
    currentStreak = 1;
    let checkDate = yesterdayStr;
    while (summaryMap.get(checkDate)?.target_reached) {
      currentStreak++;
      checkDate = getPreviousDateString(checkDate, 1);
    }
  } else if (yesterdayTargetReached) {
    // Today hasn't reached target yet, but yesterday did.
    // Streak is preserved from yesterday while waiting for today's reading
    currentStreak = 1;
    let checkDate = getPreviousDateString(yesterdayStr, 1);
    while (summaryMap.get(checkDate)?.target_reached) {
      currentStreak++;
      checkDate = getPreviousDateString(checkDate, 1);
    }
  } else {
    // Neither today nor yesterday reached target -> streak broken
    currentStreak = 0;
  }

  // Calculate Longest Streak in history
  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate: string | null = null;

  for (const date of successfulDates) {
    if (!prevDate) {
      runningStreak = 1;
    } else {
      const diff = getCalendarDayDiff(prevDate, date);
      if (diff === 1) {
        runningStreak++;
      } else if (diff > 1) {
        runningStreak = 1;
      }
    }
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
    prevDate = date;
  }

  // Current streak can never exceed longest
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  const lastReadingDate = successfulDates.length > 0 ? successfulDates[successfulDates.length - 1] : null;

  // Evaluate Unlocked Milestones
  const unlockedMilestones: string[] = [];
  let currentMilestoneTitle: string | undefined;

  for (const ms of config.milestones) {
    if (longestStreak >= ms.days || currentStreak >= ms.days) {
      unlockedMilestones.push(ms.title);
      currentMilestoneTitle = ms.title;
    }
  }

  return {
    santri_id: santriId,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    total_reading_days: totalReadingDays,
    last_reading_date: lastReadingDate,
    total_reading_minutes: totalReadingMinutes,
    total_books_read: totalBooksRead,
    current_milestone: currentMilestoneTitle,
    unlocked_milestones: unlockedMilestones,
    today_reading_minutes: todayMinutes,
    today_target_reached: todayTargetReached,
    updated_at: new Date().toISOString()
  };
}

/**
 * Finds next milestone for a given current streak
 */
export function getNextMilestone(currentStreak: number, milestones: ReadingStreakMilestone[] = DEFAULT_STREAK_MILESTONES): {
  next: ReadingStreakMilestone | null;
  daysRemaining: number;
  progressPercent: number;
} {
  const sorted = [...milestones].sort((a, b) => a.days - b.days);
  const next = sorted.find(m => m.days > currentStreak);

  if (!next) {
    return {
      next: null,
      daysRemaining: 0,
      progressPercent: 100
    };
  }

  // Find previous milestone threshold to calculate progress bar proportion
  const prevMilestone = [...sorted].reverse().find(m => m.days <= currentStreak);
  const prevDays = prevMilestone ? prevMilestone.days : 0;
  const daysInSegment = next.days - prevDays;
  const progressInSegment = currentStreak - prevDays;
  const progressPercent = Math.min(100, Math.max(0, Math.round((progressInSegment / daysInSegment) * 100)));

  return {
    next,
    daysRemaining: next.days - currentStreak,
    progressPercent
  };
}

/**
 * Formats duration in minutes to Indonesian readable format, e.g. "42 Jam 20 Menit" or "35 Menit"
 */
export function formatReadingDuration(totalMinutes: number): string {
  if (totalMinutes < 60) {
    return `${totalMinutes} Menit`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours} Jam`;
  }
  return `${hours} Jam ${minutes} Menit`;
}

/**
 * Generate contribution heat calendar data for the last N months or weeks
 */
export interface CalendarDayContribution {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ...
  durationMinutes: number;
  targetReached: boolean;
  status: 'reached' | 'partial' | 'none';
  books: Array<{ title: string; duration_minutes: number }>;
  isToday: boolean;
  isFuture: boolean;
}

export function generateCalendarContributions(
  activities: ReadingActivity[],
  santriId: string,
  targetMinutes = 15,
  daysCount = 90
): CalendarDayContribution[] {
  const todayStr = getJakartaDateString();
  const summaryMap = generateDailySummaries(activities, santriId, targetMinutes);
  const result: CalendarDayContribution[] = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const dateStr = getPreviousDateString(todayStr, i);
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    const dayOfWeek = dateObj.getUTCDay();

    const summary = summaryMap.get(dateStr);
    const duration = summary ? summary.total_duration_minutes : 0;
    const reached = duration >= targetMinutes;
    const isToday = dateStr === todayStr;

    let status: 'reached' | 'partial' | 'none' = 'none';
    if (reached) status = 'reached';
    else if (duration > 0) status = 'partial';

    result.push({
      date: dateStr,
      dayOfWeek,
      durationMinutes: duration,
      targetReached: reached,
      status,
      books: summary ? summary.books_read : [],
      isToday,
      isFuture: false
    });
  }

  return result;
}

/**
 * Pre-generate initial sample reading activities for existing students so streak features look alive and authentic
 */
export function generateSampleReadingActivities(students: Student[], targetMinutes = 15): ReadingActivity[] {
  if (!students || students.length === 0) return [];
  const activities: ReadingActivity[] = [];
  const todayStr = getJakartaDateString();

  const sampleBooks = [
    { title: 'Atomic Habits (Terjemahan Santri)', id: 'book-sample-1' },
    { title: 'Riyadhus Shalihin (Bab Ikhlas & Niat)', id: 'book-sample-2' },
    { title: 'Al-Adab Al-Mufrad (Adab Santri Terhadap Guru)', id: 'book-sample-3' },
    { title: 'Fiqh Al-Wajiz (Kitab Shalat)', id: 'book-sample-4' },
    { title: 'Bidayatul Hidayah Imam Al-Ghazali', id: 'book-sample-5' },
    { title: 'Tafsir Jalalain Juz Amma', id: 'book-sample-6' }
  ];

  // For the first student (primary active santri), generate a rich 12-day current streak and historical data
  const primaryStudent = students[0];
  if (primaryStudent) {
    // Generate consecutive streak for the last 12 days
    for (let i = 11; i >= 0; i--) {
      const dateStr = getPreviousDateString(todayStr, i);
      const randomDuration = i === 0 ? 25 : Math.floor(Math.random() * 20) + 18; // >= 18 mins
      const book = sampleBooks[i % sampleBooks.length];

      activities.push({
        id: `act-seed-${primaryStudent.id}-${dateStr}`,
        santri_id: primaryStudent.id,
        student_name: primaryStudent.name,
        student_nis: primaryStudent.nis,
        book_id: book.id,
        book_title: book.title,
        date: dateStr,
        start_time: '14:00',
        end_time: `14:${randomDuration}`,
        duration_minutes: randomDuration,
        target_reached: true,
        notes: 'Muthola\'ah kitab harian ba\'da Ashar di perpustakaan',
        created_at: `${dateStr}T14:30:00.000Z`
      });
    }

    // Add some older activities spanning back to achieve ~84 total reading days and 27 longest streak
    let olderStreakDays = 27;
    let startDateDaysAgo = 20; // gap before previous streak
    for (let i = 0; i < olderStreakDays; i++) {
      const dateStr = getPreviousDateString(todayStr, startDateDaysAgo + i);
      const book = sampleBooks[(i + 2) % sampleBooks.length];
      activities.push({
        id: `act-seed-older-${primaryStudent.id}-${dateStr}`,
        santri_id: primaryStudent.id,
        student_name: primaryStudent.name,
        student_nis: primaryStudent.nis,
        book_id: book.id,
        book_title: book.title,
        date: dateStr,
        start_time: '09:00',
        end_time: '09:30',
        duration_minutes: 30,
        target_reached: true,
        notes: 'Kajian kitab bersama pustakawan',
        created_at: `${dateStr}T09:30:00.000Z`
      });
    }

    // Add another batch to reach ~84 total reading days
    for (let i = 55; i < 99; i++) {
      if (i % 5 === 0) continue; // slight gaps
      const dateStr = getPreviousDateString(todayStr, i);
      const book = sampleBooks[i % sampleBooks.length];
      activities.push({
        id: `act-seed-deep-${primaryStudent.id}-${dateStr}`,
        santri_id: primaryStudent.id,
        student_name: primaryStudent.name,
        student_nis: primaryStudent.nis,
        book_id: book.id,
        book_title: book.title,
        date: dateStr,
        start_time: '16:00',
        end_time: '16:20',
        duration_minutes: 20,
        target_reached: true,
        notes: 'Membaca mandiri',
        created_at: `${dateStr}T16:20:00.000Z`
      });
    }
  }

  // For other students, generate modest active streaks (e.g. 5 days, 8 days)
  students.slice(1, 5).forEach((st, idx) => {
    const streakLength = (idx + 1) * 3 + 2; // e.g. 5, 8, 11
    for (let i = streakLength - 1; i >= 0; i--) {
      const dateStr = getPreviousDateString(todayStr, i);
      const duration = Math.floor(Math.random() * 15) + 16;
      const book = sampleBooks[(idx + i) % sampleBooks.length];
      activities.push({
        id: `act-seed-other-${st.id}-${dateStr}`,
        santri_id: st.id,
        student_name: st.name,
        student_nis: st.nis,
        book_id: book.id,
        book_title: book.title,
        date: dateStr,
        start_time: '13:30',
        end_time: '13:55',
        duration_minutes: duration,
        target_reached: true,
        notes: 'Membaca buku santri',
        created_at: `${dateStr}T13:55:00.000Z`
      });
    }
  });

  return activities;
}

export const SUPABASE_READING_STREAK_SQL = `-- SCHEMA SUPABASE: Reading Streak & Aktivitas Membaca Santri (Versi Terpadu)
-- Jalankan pada Supabase SQL Editor

-- 1. Table Reading Activities
CREATE TABLE IF NOT EXISTS reading_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    santri_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR(255),
    santri_name VARCHAR(255),
    student_nis VARCHAR(50),
    santri_nis VARCHAR(50),
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    book_title VARCHAR(255),
    date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 0),
    target_reached BOOLEAN NOT NULL DEFAULT FALSE,
    visit_id UUID REFERENCES library_visits(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migrasi kolom aman jika tabel sudah ada sebelumnya
ALTER TABLE reading_activities ADD COLUMN IF NOT EXISTS student_name VARCHAR(255);
ALTER TABLE reading_activities ADD COLUMN IF NOT EXISTS santri_name VARCHAR(255);
ALTER TABLE reading_activities ADD COLUMN IF NOT EXISTS student_nis VARCHAR(50);
ALTER TABLE reading_activities ADD COLUMN IF NOT EXISTS santri_nis VARCHAR(50);

-- Index untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_reading_activities_santri ON reading_activities(santri_id);
CREATE INDEX IF NOT EXISTS idx_reading_activities_date ON reading_activities(date);
CREATE INDEX IF NOT EXISTS idx_reading_activities_santri_date ON reading_activities(santri_id, date);

-- 2. Table Reading Daily Summaries (Aggregated per calendar date)
CREATE TABLE IF NOT EXISTS reading_daily_summaries (
    id VARCHAR(100) PRIMARY KEY, -- Format: sum_{santri_id}_{date}
    santri_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_duration_minutes INTEGER NOT NULL DEFAULT 0,
    target_minutes INTEGER NOT NULL DEFAULT 15,
    target_reached BOOLEAN NOT NULL DEFAULT FALSE,
    sessions_count INTEGER NOT NULL DEFAULT 1,
    books_read JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_santri_date UNIQUE(santri_id, date)
);

-- 3. Table Reading Streaks (Snapshot & Cached Streak Metrics)
CREATE TABLE IF NOT EXISTS reading_streaks (
    santri_id UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    total_reading_days INTEGER NOT NULL DEFAULT 0,
    total_reading_minutes INTEGER NOT NULL DEFAULT 0,
    total_books_read INTEGER NOT NULL DEFAULT 0,
    last_reading_date DATE,
    current_milestone VARCHAR(100),
    unlocked_milestones JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Table Reading Streak Config
CREATE TABLE IF NOT EXISTS reading_streak_configs (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'main_config',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    daily_target_minutes INTEGER NOT NULL DEFAULT 15,
    milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Row Level Security (RLS)
ALTER TABLE reading_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_streak_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access for reading_activities" ON reading_activities;
CREATE POLICY "Allow full access for reading_activities" ON reading_activities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for reading_daily_summaries" ON reading_daily_summaries;
CREATE POLICY "Allow full access for reading_daily_summaries" ON reading_daily_summaries FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for reading_streaks" ON reading_streaks;
CREATE POLICY "Allow full access for reading_streaks" ON reading_streaks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for reading_streak_configs" ON reading_streak_configs;
CREATE POLICY "Allow full access for reading_streak_configs" ON reading_streak_configs FOR ALL USING (true) WITH CHECK (true);

-- 6. Enable Realtime
DO $$
BEGIN
    PERFORM 1 FROM pg_publication WHERE pubname = 'supabase_realtime';
    IF FOUND THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE reading_activities, reading_streaks, reading_streak_configs;
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

ALTER TABLE reading_activities REPLICA IDENTITY FULL;
ALTER TABLE reading_streaks REPLICA IDENTITY FULL;
ALTER TABLE reading_streak_configs REPLICA IDENTITY FULL;
`;
