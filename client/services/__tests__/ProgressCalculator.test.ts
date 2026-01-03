/**
 * Property-Based Tests for ProgressCalculator
 * Feature: quran-progress-tracker
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ProgressCalculator } from '../ProgressCalculator';
import {
  ReadingProgress,
  PageReadData,
  DailyGoal,
  DEFAULT_READING_PROGRESS,
} from '../../types/progress';
import { QURAN_CONSTANTS, getJuzPageRange } from '../../constants/quran-constants';

// Arbitraries for generating test data
const pageNumberArb = fc.integer({ min: 1, max: QURAN_CONSTANTS.TOTAL_PAGES });

const pageReadDataArb: fc.Arbitrary<PageReadData> = fc.record({
  firstReadAt: fc.integer({ min: 1609459200000, max: Date.now() }),
  lastReadAt: fc.integer({ min: 1609459200000, max: Date.now() }),
  readCount: fc.integer({ min: 1, max: 100 }),
}).map(data => ({
  ...data,
  lastReadAt: Math.max(data.firstReadAt, data.lastReadAt),
}));

// Generate a set of unique page numbers
const pageSetArb = fc.uniqueArray(pageNumberArb, { minLength: 0, maxLength: 100 });

// Generate progress with specific pages read
const progressWithPagesArb = (pages: number[]): ReadingProgress => {
  const pagesRead: Record<number, PageReadData> = {};
  const now = Date.now();
  for (const page of pages) {
    pagesRead[page] = {
      firstReadAt: now - Math.random() * 86400000,
      lastReadAt: now,
      readCount: 1,
    };
  }
  return {
    ...DEFAULT_READING_PROGRESS,
    pagesRead,
  };
};

describe('ProgressCalculator', () => {
  describe('Property 2: Progress Calculation Correctness', () => {
    // Feature: quran-progress-tracker, Property 2: Progress Calculation Correctness
    // For any set of read pages, the Progress_Calculator should return:
    // - Total pages read equal to the set size
    // - Completion percentage equal to (set size / 604) * 100
    // - Verses read equal to the sum of verses on those pages
    // - Juz completion status correctly reflecting which Juz have all pages read
    // Validates: Requirements 2.1, 2.2, 2.3, 2.4, 7.4

    it('should return total pages read equal to set size', () => {
      fc.assert(
        fc.property(pageSetArb, (pages) => {
          const progress = progressWithPagesArb(pages);
          const totalPagesRead = ProgressCalculator.getTotalPagesRead(progress);
          expect(totalPagesRead).toBe(pages.length);
        }),
        { numRuns: 100 }
      );
    });

    it('should return completion percentage equal to (pages / 604) * 100', () => {
      fc.assert(
        fc.property(pageSetArb, (pages) => {
          const progress = progressWithPagesArb(pages);
          const percentage = ProgressCalculator.getCompletionPercentage(progress);
          const expected = (pages.length / QURAN_CONSTANTS.TOTAL_PAGES) * 100;
          expect(percentage).toBeCloseTo(expected, 10);
        }),
        { numRuns: 100 }
      );
    });

    it('should return verses read using exact page counts', () => {
      fc.assert(
        fc.property(pageSetArb, (pages) => {
          const versesRead = ProgressCalculator.getVersesRead(pages);
          // Verses should be sum of exact verse counts for each page
          // For any set of pages, verses should be >= 0 and <= total verses
          expect(versesRead).toBeGreaterThanOrEqual(0);
          expect(versesRead).toBeLessThanOrEqual(QURAN_CONSTANTS.TOTAL_VERSES);
          // If pages are read, verses should be > 0
          if (pages.length > 0) {
            expect(versesRead).toBeGreaterThan(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should return exact verse count for known pages', () => {
      // Page 1 (Al-Fatiha) has exactly 7 verses
      expect(ProgressCalculator.getVersesRead([1])).toBe(7);
      // Page 1 + Page 2 = 7 + 5 = 12 verses
      expect(ProgressCalculator.getVersesRead([1, 2])).toBe(12);
      // Empty array = 0 verses
      expect(ProgressCalculator.getVersesRead([])).toBe(0);
    });

    it('should correctly identify complete Juz', () => {
      // Test with a complete Juz (all pages of Juz 1)
      const juz1Range = getJuzPageRange(1);
      const juz1Pages: number[] = [];
      for (let p = juz1Range.start; p <= juz1Range.end; p++) {
        juz1Pages.push(p);
      }

      const progress = progressWithPagesArb(juz1Pages);
      const juzStatuses = ProgressCalculator.getJuzCompletion(progress);

      // Juz 1 should be complete
      expect(juzStatuses[0].isComplete).toBe(true);
      expect(juzStatuses[0].pagesRead).toBe(juzStatuses[0].totalPages);

      // Other Juz should not be complete
      for (let i = 1; i < 30; i++) {
        expect(juzStatuses[i].isComplete).toBe(false);
        expect(juzStatuses[i].pagesRead).toBe(0);
      }
    });

    it('should return 30 Juz statuses', () => {
      fc.assert(
        fc.property(pageSetArb, (pages) => {
          const progress = progressWithPagesArb(pages);
          const juzStatuses = ProgressCalculator.getJuzCompletion(progress);
          expect(juzStatuses.length).toBe(30);
          
          // Each Juz should have valid data
          for (let i = 0; i < 30; i++) {
            expect(juzStatuses[i].juzNumber).toBe(i + 1);
            expect(juzStatuses[i].pagesRead).toBeGreaterThanOrEqual(0);
            expect(juzStatuses[i].pagesRead).toBeLessThanOrEqual(juzStatuses[i].totalPages);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should count pages correctly per Juz', () => {
      fc.assert(
        fc.property(pageSetArb, (pages) => {
          const progress = progressWithPagesArb(pages);
          const juzStatuses = ProgressCalculator.getJuzCompletion(progress);
          
          // Sum of all Juz pages read should equal total pages read
          const sumFromJuz = juzStatuses.reduce((sum, j) => sum + j.pagesRead, 0);
          expect(sumFromJuz).toBe(pages.length);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: Notification Remaining Calculation', () => {
    // Feature: quran-progress-tracker, Property 7: Notification Remaining Calculation
    // For any daily goal and current day's reading progress, the remaining amount
    // should equal max(0, goal.target - todayProgress).
    // Validates: Requirements 6.4

    it('should calculate remaining pages correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: QURAN_CONSTANTS.MAX_PAGE_GOAL }),
          fc.integer({ min: 0, max: 30 }),
          (goalTarget, pagesReadToday) => {
            // Create progress with pages read today
            const now = Date.now();
            const todayStart = new Date().setHours(0, 0, 0, 0);
            const pagesRead: Record<number, PageReadData> = {};
            
            for (let i = 0; i < pagesReadToday && i < QURAN_CONSTANTS.TOTAL_PAGES; i++) {
              pagesRead[i + 1] = {
                firstReadAt: todayStart + 1000,
                lastReadAt: now,
                readCount: 1,
              };
            }

            const progress: ReadingProgress = {
              ...DEFAULT_READING_PROGRESS,
              pagesRead,
              dailyGoal: {
                type: 'pages',
                target: goalTarget,
                enabled: true,
              },
            };

            const remaining = ProgressCalculator.getRemainingForGoal(progress);
            const expected = Math.max(0, goalTarget - pagesReadToday);
            
            expect(remaining).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 when goal is disabled', () => {
      fc.assert(
        fc.property(pageSetArb, (pages) => {
          const progress: ReadingProgress = {
            ...progressWithPagesArb(pages),
            dailyGoal: {
              type: 'pages',
              target: 10,
              enabled: false,
            },
          };

          const remaining = ProgressCalculator.getRemainingForGoal(progress);
          expect(remaining).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should never return negative remaining', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: QURAN_CONSTANTS.MAX_PAGE_GOAL }),
          fc.integer({ min: 0, max: 50 }),
          (goalTarget, pagesReadToday) => {
            const now = Date.now();
            const todayStart = new Date().setHours(0, 0, 0, 0);
            const pagesRead: Record<number, PageReadData> = {};
            
            for (let i = 0; i < pagesReadToday && i < QURAN_CONSTANTS.TOTAL_PAGES; i++) {
              pagesRead[i + 1] = {
                firstReadAt: todayStart + 1000,
                lastReadAt: now,
                readCount: 1,
              };
            }

            const progress: ReadingProgress = {
              ...DEFAULT_READING_PROGRESS,
              pagesRead,
              dailyGoal: {
                type: 'pages',
                target: goalTarget,
                enabled: true,
              },
            };

            const remaining = ProgressCalculator.getRemainingForGoal(progress);
            expect(remaining).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Daily and Weekly Progress', () => {
    it('should return valid today progress structure', () => {
      fc.assert(
        fc.property(pageSetArb, (pages) => {
          const progress = progressWithPagesArb(pages);
          const todayProgress = ProgressCalculator.getTodayProgress(progress);

          expect(todayProgress.pagesRead).toBeGreaterThanOrEqual(0);
          expect(todayProgress.versesRead).toBeGreaterThanOrEqual(0);
          expect(todayProgress.goalProgress).toBeGreaterThanOrEqual(0);
          expect(todayProgress.goalProgress).toBeLessThanOrEqual(100);
          expect(typeof todayProgress.goalMet).toBe('boolean');
        }),
        { numRuns: 100 }
      );
    });

    it('should return 7 days of weekly data', () => {
      fc.assert(
        fc.property(pageSetArb, (pages) => {
          const progress = progressWithPagesArb(pages);
          const weeklyData = ProgressCalculator.getWeeklyData(progress);

          expect(weeklyData.days.length).toBe(7);
          expect(weeklyData.totalPages).toBeGreaterThanOrEqual(0);
          expect(weeklyData.averagePerDay).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Reading Stats', () => {
    it('should return consistent reading stats', () => {
      fc.assert(
        fc.property(pageSetArb, (pages) => {
          const progress = progressWithPagesArb(pages);
          const stats = ProgressCalculator.getReadingStats(progress);

          expect(stats.totalPagesRead).toBe(pages.length);
          expect(stats.completionPercentage).toBeCloseTo(
            (pages.length / QURAN_CONSTANTS.TOTAL_PAGES) * 100,
            10
          );
          expect(stats.juzCompleted).toBeGreaterThanOrEqual(0);
          expect(stats.juzCompleted).toBeLessThanOrEqual(30);
          expect(stats.currentStreak).toBeGreaterThanOrEqual(0);
          expect(stats.longestStreak).toBeGreaterThanOrEqual(stats.currentStreak);
          expect(stats.khatmCount).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });
  });
});
