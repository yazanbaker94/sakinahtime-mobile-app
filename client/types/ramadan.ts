/**
 * Ramadan Mode Type Definitions
 */

// Ramadan State
export interface RamadanState {
  isRamadan: boolean;
  currentDay: number | null;
  daysRemaining: number | null;
  isLastTenNights: boolean;
  ramadanYear: number | null;
  ramadanStartDate: Date | null;
  ramadanEndDate: Date | null;
}

// Suhoor/Iftar Types
export interface SuhoorIftarTimes {
  suhoorEnd: string;
  iftarTime: string;
  suhoorEndDate: Date;
  iftarDate: Date;
}

export interface SuhoorIftarCountdown {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export interface SuhoorIftarSettings {
  suhoorReminderMinutes: number;
  iftarReminderMinutes: number;
  suhoorNotificationEnabled: boolean;
  iftarNotificationEnabled: boolean;
}

// Quran Schedule Types
export interface DayReading {
  day: number;
  juzNumber: number;
  startPage: number;
  endPage: number;
  surahNames: string[];
  pagesTotal: number;
  pagesRead: number;
  completed: boolean;
  completedAt: Date | null;
}

export interface QuranSchedule {
  year: number;
  startDate: Date;
  readings: DayReading[];
}

export interface QuranProgress {
  totalPages: number;
  pagesRead: number;
  percentComplete: number;
  daysCompleted: number;
  totalDays: number;
  onTrack: boolean;
  daysBehind: number;
}

export interface QuranScheduleSettings {
  reminderEnabled: boolean;
  reminderTime: string;
  notifyOnMissed: boolean;
}

// Taraweeh Types
export interface TaraweehEntry {
  id: string;
  date: Date;
  hijriDay: number;
  rakaat: 8 | 20;
  location: 'mosque' | 'home';
  notes?: string;
  createdAt: Date;
}

export interface TaraweehStats {
  totalNights: number;
  nightsCompleted: number;
  currentStreak: number;
  bestStreak: number;
  mosqueNights: number;
  homeNights: number;
  completionRate: number;
}

// Charity Types
export type CharityType = 'sadaqah' | 'zakat' | 'fidya' | 'kaffarah' | 'other';

export interface CharityEntry {
  id: string;
  date: Date;
  type: CharityType;
  amount: number;
  currency: string;
  recipient?: string;
  notes?: string;
  isAnonymous: boolean;
  createdAt: Date;
}

export interface CharityStats {
  totalAmount: number;
  totalEntries: number;
  byType: Record<CharityType, number>;
  ramadanTotal: number;
  zakatPaid: boolean;
  zakatAmount: number;
}

export interface CharityGoal {
  amount: number;
  currency: string;
}

export interface ZakatCalculation {
  totalWealth: number;
  nisabGold: number;
  nisabSilver: number;
  zakatDue: number;
  meetsNisab: boolean;
}

// Laylatul Qadr Types
export interface IbaadahItem {
  id: string;
  name: string;
  nameAr: string;
  completed: boolean;
}

export interface LaylatalQadrDua {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference: string;
}

// Notification Types
export interface RamadanNotificationConfig {
  channelId: string;
  title: string;
  body: string;
}
