/**
 * Hifz Mode Constants
 * Default settings and configuration for Quran memorization mode
 */

import { HifzSettings, HideMode } from '../types/hifz';

// Storage keys for AsyncStorage
export const HIFZ_STORAGE_KEYS = {
  PROGRESS: '@hifz_progress',
  SETTINGS: '@hifz_settings',
  REVISION_SCHEDULE: '@hifz_revision_schedule',
  SAVED_LOOPS: '@hifz_saved_loops',
  LAST_ACTIVITY: '@hifz_last_activity',
  STREAK: '@hifz_streak',
};

// Default settings for Hifz mode
export const DEFAULT_HIFZ_SETTINGS: HifzSettings = {
  hideMode: 'solid',
  autoHideDelay: 0, // Manual (no auto-hide)
  repeatCount: 3,
  pauseBetweenRepeats: 2000, // 2 seconds
  playbackSpeed: 1.0,
  autoAdvance: true,
  showRevisionReminders: true,
  dailyRevisionGoal: 2, // 2 pages per day
  playWordAudioOnReveal: true, // Play word pronunciation when revealing
};

// Hide mode is fixed to 'solid' for image-based Mushaf
// Word-level hiding not possible with image coordinates
export const HIDE_MODE_OPTIONS: { value: HideMode; label: string; description: string }[] = [
  { value: 'solid', label: 'Full Verse', description: 'Hide entire verse, tap to reveal all' },
  { value: 'word', label: 'Word by Word', description: 'Reveal one word at a time as you recite' },
];

// Auto-hide delay options (in milliseconds)
export const AUTO_HIDE_DELAY_OPTIONS = [
  { value: 0, label: 'Manual' },
  { value: 2000, label: '2s' },
  { value: 5000, label: '5s' },
  { value: 10000, label: '10s' },
];

// Repeat count options
export const REPEAT_COUNT_OPTIONS = [
  { value: 1, label: '1×' },
  { value: 3, label: '3×' },
  { value: 5, label: '5×' },
  { value: 10, label: '10×' },
  { value: 20, label: '20×' },
  { value: 0, label: '∞' }, // 0 = unlimited
];

// Pause between repeats options (in milliseconds)
export const PAUSE_DURATION_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 2000, label: '2 sec' },
  { value: 5000, label: '5 sec' },
];

// Playback speed options
export const PLAYBACK_SPEED_OPTIONS = [
  { value: 0.5, label: 'Slow' },
  { value: 0.75, label: 'Medium' },
  { value: 1.0, label: 'Normal' },
];

// Spaced repetition intervals (in days) - SM-2 inspired
export const REVISION_INTERVALS = [1, 3, 7, 14, 30, 60, 90, 180];

// Minimum ease factor for spaced repetition
export const MIN_EASE_FACTOR = 1.3;

// Default ease factor for new items
export const DEFAULT_EASE_FACTOR = 2.5;

// Quality ratings for revision (0-5 scale)
export const REVISION_QUALITY = {
  COMPLETE_BLACKOUT: 0,
  INCORRECT_REMEMBERED: 1,
  INCORRECT_EASY_RECALL: 2,
  CORRECT_DIFFICULT: 3,
  CORRECT_HESITATION: 4,
  PERFECT: 5,
};

// Quran statistics
export const QURAN_STATS = {
  TOTAL_VERSES: 6236,
  TOTAL_PAGES: 604,
  TOTAL_JUZ: 30,
  TOTAL_SURAHS: 114,
  // Lowercase aliases for compatibility
  totalVerses: 6236,
  totalPages: 604,
  totalJuz: 30,
  totalSurahs: 114,
};

// Colors for memorization status
export const MEMORIZATION_COLORS = {
  not_started: {
    light: '#9CA3AF', // Gray
    dark: '#6B7280',
  },
  in_progress: {
    light: '#F59E0B', // Amber
    dark: '#FBBF24',
  },
  memorized: {
    light: '#10B981', // Green
    dark: '#34D399',
  },
  due_revision: {
    light: '#EF4444', // Red
    dark: '#F87171',
  },
};

// Hifz mode active color
export const HIFZ_ACTIVE_COLOR = {
  light: '#059669',
  dark: '#34D399',
};

// Hidden text background color
export const HIDDEN_TEXT_BG = {
  light: '#E5E7EB',
  dark: '#374151',
};
