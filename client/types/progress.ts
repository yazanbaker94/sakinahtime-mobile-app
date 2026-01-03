/**
 * Quran Reading Progress & Khatm Tracker Types
 * Feature: quran-progress-tracker
 */

// Core progress data structure
export interface ReadingProgress {
  pagesRead: Record<number, PageReadData>;  // page number -> read data
  dailyGoal: DailyGoal;
  streak: StreakData;
  khatmHistory: KhatmRecord[];
  settings: ProgressSettings;
}

export interface PageReadData {
  firstReadAt: number;      // timestamp of first read
  lastReadAt: number;       // timestamp of most recent read
  readCount: number;        // how many times this page was read
}

export interface DailyGoal {
  type: 'pages' | 'verses';
  target: number;           // 1-20 for pages, 1-100 for verses
  enabled: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastGoalMetDate: string;  // ISO date string (YYYY-MM-DD)
  streakHistory: DailyRecord[];
}

export interface DailyRecord {
  date: string;             // ISO date string (YYYY-MM-DD)
  pagesRead: number;
  versesRead: number;
  goalMet: boolean;
}

export interface KhatmRecord {
  completedAt: number;      // timestamp
  durationDays: number;     // days taken to complete
  startedAt: number;        // timestamp when this khatm cycle started
}

export interface ProgressSettings {
  reminderEnabled: boolean;
  reminderTime: string;     // HH:MM format
  trackingEnabled: boolean;
}

// Computed statistics types
export interface JuzStatus {
  juzNumber: number;
  pagesRead: number;
  totalPages: number;
  isComplete: boolean;
}

export interface DailyProgress {
  pagesRead: number;
  versesRead: number;
  goalProgress: number;  // 0-100 percentage
  goalMet: boolean;
}

export interface WeeklyData {
  days: Array<{
    date: string;
    pagesRead: number;
    goalMet: boolean;
  }>;
  totalPages: number;
  averagePerDay: number;
}

export interface ReadingStats {
  totalPagesRead: number;
  completionPercentage: number;
  totalVersesRead: number;
  juzCompleted: number;
  currentStreak: number;
  longestStreak: number;
  khatmCount: number;
}

// Storage key constant
export const PROGRESS_STORAGE_KEY = '@quran_reading_progress';

// Default values
export const DEFAULT_DAILY_GOAL: DailyGoal = {
  type: 'pages',
  target: 5,
  enabled: true,
};

export const DEFAULT_STREAK_DATA: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastGoalMetDate: '',
  streakHistory: [],
};

export const DEFAULT_PROGRESS_SETTINGS: ProgressSettings = {
  reminderEnabled: false,
  reminderTime: '20:00',
  trackingEnabled: true,
};

export const DEFAULT_READING_PROGRESS: ReadingProgress = {
  pagesRead: {},
  dailyGoal: DEFAULT_DAILY_GOAL,
  streak: DEFAULT_STREAK_DATA,
  khatmHistory: [],
  settings: DEFAULT_PROGRESS_SETTINGS,
};
