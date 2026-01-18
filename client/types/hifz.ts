/**
 * Hifz Mode Types
 * Types for Quran memorization mode functionality
 */

// Memorization status for a unit (verse, page, surah, juz)
export type MemorizationStatus = 'not_started' | 'in_progress' | 'memorized';

// Hide mode options for testing memorization (simplified for image-based Mushaf)
// 'solid' = hide entire verse, 'word' = hide word by word (reveal one at a time)
export type HideMode = 'solid' | 'word';

// Verse key format: "surah:ayah" e.g., "2:255"
export type VerseKey = string;

// Word key format: "surah:ayah:wordIndex" e.g., "2:255:0"
export type WordKey = string;

// Progress data for a single verse
export interface VerseProgress {
  status: MemorizationStatus;
  lastRevised: string | null; // ISO date
  revisionCount: number;
  nextRevisionDue: string | null; // ISO date
  easeFactor: number; // For spaced repetition (default 2.5)
  interval: number; // Current interval in days
}

// Overall progress summary
export interface HifzProgress {
  verses: Record<VerseKey, VerseProgress>;
  totalMemorized: number;
  totalInProgress: number;
  lastUpdated: string;
}

// Hifz mode settings
export interface HifzSettings {
  hideMode: HideMode;
  autoHideDelay: number; // ms, 0 = manual
  repeatCount: number; // 0 = unlimited
  pauseBetweenRepeats: number; // ms
  playbackSpeed: number; // 0.5, 0.75, 1.0
  autoAdvance: boolean;
  showRevisionReminders: boolean;
  dailyRevisionGoal: number; // pages per day
  playWordAudioOnReveal: boolean; // Play word pronunciation when revealing hidden word
}

// Saved loop range for audio
export interface SavedLoop {
  id: string;
  name: string;
  startVerse: VerseKey;
  endVerse: VerseKey;
  startSurah?: number;
  startAyah?: number;
  endSurah?: number;
  endAyah?: number;
  createdAt: number;
}

// Revision schedule entry
export interface RevisionEntry {
  verseKey: VerseKey;
  surah: number;
  ayah: number;
  dueDate: string;
  interval: number; // days
  easeFactor: number; // for spaced repetition
  lastRevised: string | null;
  lastRevision: number; // timestamp for compatibility
  status: MemorizationStatus;
}

// Hifz mode runtime state
export interface HifzModeState {
  isActive: boolean;
  revealedVerses: Set<VerseKey>;
  currentRepeat: number;
  totalRepeats: number;
  loopStart: VerseKey | null;
  loopEnd: VerseKey | null;
  isLooping: boolean;
  isPaused: boolean;
}

// Repeat options for audio
export interface RepeatOptions {
  count: number; // 0 = unlimited
  pauseMs: number;
  speed: number;
  onRepeatComplete?: (current: number, total: number) => void;
  onAllRepeatsComplete?: () => void;
}

// Loop options for audio
export interface LoopOptions {
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
  repeatCount?: number; // 0 = unlimited
  pauseMs?: number;
  speed?: number;
}

// Statistics for progress screen
export interface HifzStats {
  totalVerses: number;
  memorizedVerses: number;
  inProgressVerses: number;
  memorizedPages: number;
  memorizedJuz: number;
  memorizedSurahs: number[];
  dueForRevision: number;
  streakDays: number;
  lastActivityDate: string | null;
}

// Page memorization status (derived from verses)
export interface PageProgress {
  page: number;
  status: MemorizationStatus;
  memorizedCount: number;
  totalCount: number;
  percentage: number;
}

// Surah memorization status (derived from verses)
export interface SurahProgress {
  surah: number;
  surahName: string;
  surahNameAr: string;
  status: MemorizationStatus;
  memorizedCount: number;
  totalCount: number;
  percentage: number;
}

// Juz memorization status (derived from verses)
export interface JuzProgress {
  juz: number;
  status: MemorizationStatus;
  memorizedCount: number;
  totalCount: number;
  percentage: number;
}
