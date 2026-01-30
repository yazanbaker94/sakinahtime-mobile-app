/**
 * Prayer Log & Statistics Types
 * Feature: prayer-log-statistics
 */

// Prayer status enum
export type PrayerStatus = 'prayed' | 'missed' | 'late' | 'unmarked';

// Five daily prayers
export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

// Single prayer entry
export interface PrayerEntry {
  status: PrayerStatus;
  markedAt: number | null;      // timestamp when marked
  prayerTime: string;           // original prayer time (HH:MM)
}

// Daily prayer record
export interface DailyPrayerRecord {
  date: string;                 // ISO date (YYYY-MM-DD)
  prayers: Record<PrayerName, PrayerEntry>;
  isPerfectDay: boolean;        // all 5 prayers completed
}

// Streak tracking
export interface PrayerStreakData {
  currentStreak: number;
  longestStreak: number;
  lastPerfectDate: string;      // ISO date of last perfect day
}

// Qada (makeup) prayer counts
export interface QadaCounts {
  Fajr: number;
  Dhuhr: number;
  Asr: number;
  Maghrib: number;
  Isha: number;
}

// Main prayer log data structure
export interface PrayerLogData {
  dailyRecords: Record<string, DailyPrayerRecord>;  // date -> record
  streak: PrayerStreakData;
  qadaCounts: QadaCounts;
  settings: PrayerLogSettings;
  lastUpdated: number;          // timestamp
}

// Settings for prayer log
export interface PrayerLogSettings {
  trackingEnabled: boolean;                // master toggle for prayer tracking
  missedReminderEnabled: boolean;
  missedReminderDelayMinutes: number;  // 15-60
  autoMarkEnabled: boolean;            // auto-mark as unmarked after prayer time
}

// Missed reminder delay options
export const MISSED_REMINDER_DELAY_OPTIONS = [15, 30, 45, 60];

// Weekly statistics
export interface WeeklyStats {
  startDate: string;
  endDate: string;
  totalPrayed: number;
  totalMissed: number;
  totalLate: number;
  completionPercentage: number;
  dailyBreakdown: Array<{
    date: string;
    prayedCount: number;
    isPerfectDay: boolean;
  }>;
  bestDay: string | null;
  worstDay: string | null;
}

// Monthly statistics
export interface MonthlyStats {
  month: number;                // 1-12
  year: number;
  totalPrayed: number;
  totalMissed: number;
  totalLate: number;
  completionPercentage: number;
  perfectDays: number;
  calendarData: Record<string, {
    prayedCount: number;
    isPerfectDay: boolean;
  }>;
  prayerBreakdown: Record<PrayerName, {
    prayed: number;
    missed: number;
    late: number;
    percentage: number;
  }>;
}

// Storage key
export const PRAYER_LOG_STORAGE_KEY = '@prayer_log_data';

// Default values
export const DEFAULT_PRAYER_ENTRY: PrayerEntry = {
  status: 'unmarked',
  markedAt: null,
  prayerTime: '',
};

export const DEFAULT_QADA_COUNTS: QadaCounts = {
  Fajr: 0,
  Dhuhr: 0,
  Asr: 0,
  Maghrib: 0,
  Isha: 0,
};

export const DEFAULT_STREAK_DATA: PrayerStreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastPerfectDate: '',
};

export const DEFAULT_PRAYER_LOG_SETTINGS: PrayerLogSettings = {
  trackingEnabled: false,
  missedReminderEnabled: false,
  missedReminderDelayMinutes: 30,
  autoMarkEnabled: true,
};

export const DEFAULT_PRAYER_LOG: PrayerLogData = {
  dailyRecords: {},
  streak: DEFAULT_STREAK_DATA,
  qadaCounts: DEFAULT_QADA_COUNTS,
  settings: DEFAULT_PRAYER_LOG_SETTINGS,
  lastUpdated: 0,
};

export const PRAYER_NAMES: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// Status display info
export const PRAYER_STATUS_INFO: Record<PrayerStatus, { icon: string; color: string; label: string }> = {
  prayed: { icon: 'check-circle', color: '#10B981', label: 'Prayed' },
  missed: { icon: 'x-circle', color: '#EF4444', label: 'Missed' },
  late: { icon: 'clock', color: '#F59E0B', label: 'Late' },
  unmarked: { icon: 'circle', color: '#6B7280', label: 'Not marked' },
};
