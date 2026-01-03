/**
 * Quran Structure Constants
 * Feature: quran-progress-tracker
 */

export const QURAN_CONSTANTS = {
  TOTAL_PAGES: 604,
  TOTAL_VERSES: 6236,
  TOTAL_JUZ: 30,
  TOTAL_SURAHS: 114,
  PAGES_PER_JUZ_APPROX: 20.13,  // approximate average
  
  // Goal limits
  MIN_PAGE_GOAL: 1,
  MAX_PAGE_GOAL: 20,
  MIN_VERSE_GOAL: 1,
  MAX_VERSE_GOAL: 100,
};

// Juz to start page mapping (1-indexed)
// Each Juz starts at these page numbers in the Madani Mushaf
export const JUZ_START_PAGES: Record<number, number> = {
  1: 1,    // Al-Fatihah
  2: 22,   // Al-Baqarah 142
  3: 42,   // Al-Baqarah 253
  4: 62,   // Ali 'Imran 93
  5: 82,   // An-Nisa 24
  6: 102,  // An-Nisa 148
  7: 121,  // Al-Ma'idah 83
  8: 142,  // Al-An'am 111
  9: 162,  // Al-A'raf 88
  10: 182, // Al-Anfal 41
  11: 201, // At-Tawbah 93
  12: 222, // Hud 6
  13: 242, // Yusuf 53
  14: 262, // Al-Hijr 1
  15: 282, // Al-Isra 1
  16: 302, // Al-Kahf 75
  17: 322, // Al-Anbiya 1
  18: 342, // Al-Mu'minun 1
  19: 362, // Al-Furqan 21
  20: 382, // An-Naml 56
  21: 402, // Al-'Ankabut 46
  22: 422, // Al-Ahzab 31
  23: 442, // Ya-Sin 28
  24: 462, // Az-Zumar 32
  25: 482, // Fussilat 47
  26: 502, // Al-Ahqaf 1
  27: 522, // Adh-Dhariyat 31
  28: 542, // Al-Mujadila 1
  29: 562, // Al-Mulk 1
  30: 582, // An-Naba 1
};

// Get the Juz number for a given page
export function getJuzForPage(page: number): number {
  if (page < 1 || page > QURAN_CONSTANTS.TOTAL_PAGES) {
    return 0;
  }
  
  for (let juz = 30; juz >= 1; juz--) {
    if (page >= JUZ_START_PAGES[juz]) {
      return juz;
    }
  }
  return 1;
}

// Get the page range for a Juz
export function getJuzPageRange(juz: number): { start: number; end: number } {
  if (juz < 1 || juz > 30) {
    return { start: 0, end: 0 };
  }
  
  const start = JUZ_START_PAGES[juz];
  const end = juz === 30 ? QURAN_CONSTANTS.TOTAL_PAGES : JUZ_START_PAGES[juz + 1] - 1;
  
  return { start, end };
}

// Get total pages in a Juz
export function getJuzTotalPages(juz: number): number {
  const range = getJuzPageRange(juz);
  return range.end - range.start + 1;
}

// Accurate verse count per page (pages 1-604)
// Generated from quran-uthmani.json - exact counts
export const VERSES_PER_PAGE: number[] = [
  7, 5, 11, 8, 5, 8, 11, 9, 4, 8, 7, 7, 5, 5, 8, 4, 7, 7, 7, 8,
  7, 4, 8, 10, 6, 7, 5, 5, 4, 6, 6, 8, 5, 4, 5, 6, 3, 4, 8, 3,
  4, 4, 3, 5, 5, 5, 7, 1, 4, 9, 6, 7, 7, 8, 8, 7, 9, 9, 7, 6,
  8, 9, 8, 7, 6, 11, 8, 8, 5, 4, 8, 8, 7, 6, 8, 6, 6, 5, 3, 5,
  4, 3, 7, 4, 7, 7, 8, 6, 9, 5, 7, 5, 3, 7, 4, 8, 8, 6, 7, 6,
  7, 7, 8, 8, 5, 3, 3, 4, 4, 4, 6, 8, 5, 5, 4, 5, 7, 7, 6, 6,
  6, 7, 6, 8, 5, 5, 7, 8, 10, 9, 8, 9, 8, 7, 9, 5, 8, 9, 4, 7,
  9, 8, 6, 7, 6, 5, 4, 5, 6, 8, 11, 11, 8, 7, 6, 8, 6, 10, 6, 8,
  6, 8, 9, 16, 10, 7, 6, 6, 6, 4, 4, 7, 8, 9, 8, 11, 8, 8, 9, 8,
  7, 5, 7, 9, 8, 6, 6, 7, 7, 6, 5, 5, 4, 7, 7, 7, 7, 4, 7, 7,
  7, 6, 7, 5, 6, 5, 7, 6, 8, 6, 5, 8, 9, 11, 8, 9, 8, 10, 9, 9,
  8, 7, 7, 9, 9, 8, 8, 9, 9, 10, 7, 9, 11, 9, 10, 10, 8, 8, 7, 6,
  9, 11, 6, 9, 8, 9, 8, 8, 5, 8, 5, 10, 6, 8, 6, 5, 8, 6, 9, 9,
  10, 15, 16, 20, 19, 20, 15, 8, 12, 8, 8, 12, 10, 8, 7, 8, 6, 9, 8, 8,
  10, 7, 10, 10, 11, 11, 9, 8, 9, 11, 10, 8, 11, 11, 5, 7, 7, 11, 8, 8,
  13, 9, 14, 13, 11, 14, 13, 13, 13, 12, 19, 15, 25, 14, 13, 12, 11, 11, 15, 12,
  10, 10, 14, 11, 9, 13, 15, 9, 9, 11, 11, 5, 10, 8, 7, 8, 8, 9, 9, 8,
  6, 17, 10, 15, 17, 15, 15, 15, 14, 10, 10, 7, 4, 5, 7, 10, 5, 3, 5, 9,
  9, 12, 11, 12, 12, 10, 19, 20, 21, 23, 28, 25, 23, 24, 23, 21, 13, 9, 13, 9,
  11, 8, 13, 12, 10, 8, 8, 7, 7, 8, 7, 9, 11, 7, 7, 10, 8, 9, 7, 8,
  7, 7, 11, 11, 10, 9, 8, 9, 9, 10, 11, 8, 9, 6, 11, 9, 10, 6, 9, 7,
  8, 5, 8, 7, 4, 8, 11, 7, 7, 8, 9, 8, 9, 9, 8, 7, 12, 8, 6, 13,
  15, 13, 14, 16, 13, 24, 27, 25, 26, 24, 27, 29, 16, 10, 16, 19, 22, 10, 5, 11,
  10, 9, 7, 9, 11, 7, 8, 9, 9, 8, 7, 9, 9, 8, 11, 8, 11, 9, 9, 9,
  8, 8, 10, 5, 7, 9, 13, 7, 12, 12, 11, 14, 13, 13, 16, 18, 21, 20, 13, 9,
  10, 10, 9, 6, 8, 7, 11, 8, 10, 9, 9, 6, 8, 5, 5, 7, 7, 15, 20, 16,
  24, 21, 23, 17, 18, 26, 18, 24, 21, 22, 22, 24, 27, 27, 34, 26, 23, 8, 7, 6,
  5, 6, 5, 10, 4, 6, 7, 8, 5, 6, 7, 9, 8, 7, 7, 9, 9, 5, 7, 7,
  5, 12, 14, 19, 27, 18, 26, 28, 29, 15, 18, 13, 15, 19, 18, 30, 28, 26, 20, 25,
  31, 30, 25, 31, 42, 29, 25, 28, 27, 22, 32, 30, 23, 27, 29, 26, 27, 12, 18, 21,
  17, 14, 14, 15,
];

// Get exact verse count for a specific page
export function getVersesForPage(page: number): number {
  if (page < 1 || page > 604) return 0;
  return VERSES_PER_PAGE[page - 1]; // Array is 0-indexed
}

// Calculate exact verses for multiple pages
export function getExactVersesForPages(pagesRead: number[]): number {
  return pagesRead.reduce((total, page) => total + getVersesForPage(page), 0);
}

// Legacy: Approximate verses per page (kept for backward compatibility)
export const AVERAGE_VERSES_PER_PAGE = Math.ceil(QURAN_CONSTANTS.TOTAL_VERSES / QURAN_CONSTANTS.TOTAL_PAGES); // ~11

// Estimate verses read based on pages (now uses exact counts)
export function estimateVersesForPages(pagesRead: number[]): number {
  if (pagesRead.length === 0) return 0;
  return getExactVersesForPages(pagesRead);
}

// Check if a page number is valid
export function isValidPage(page: number): boolean {
  return Number.isInteger(page) && page >= 1 && page <= QURAN_CONSTANTS.TOTAL_PAGES;
}

// Check if a goal value is valid
export function isValidGoal(type: 'pages' | 'verses', value: number): boolean {
  if (!Number.isInteger(value)) return false;
  
  if (type === 'pages') {
    return value >= QURAN_CONSTANTS.MIN_PAGE_GOAL && value <= QURAN_CONSTANTS.MAX_PAGE_GOAL;
  } else {
    return value >= QURAN_CONSTANTS.MIN_VERSE_GOAL && value <= QURAN_CONSTANTS.MAX_VERSE_GOAL;
  }
}

// Get today's date in ISO format (YYYY-MM-DD)
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Check if a date string is today
export function isToday(dateString: string): boolean {
  return dateString === getTodayDateString();
}

// Check if a date string is yesterday
export function isYesterday(dateString: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateString === yesterday.toISOString().split('T')[0];
}
