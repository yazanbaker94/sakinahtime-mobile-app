/**
 * useQuranSchedule Property-Based Tests
 * 
 * Tests for Quran schedule generation and progress calculation.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateQuranSchedule, calculateProgress } from '../useQuranSchedule';
import { QURAN_TOTAL_PAGES, RAMADAN_DAYS } from '../../constants/ramadan';
import { QuranSchedule } from '../../types/ramadan';

describe('useQuranSchedule', () => {
  /**
   * Property 7: Quran Schedule Coverage
   * For any generated Quran schedule, the sum of all page ranges SHALL equal 
   * exactly 604 pages with no gaps or overlaps.
   * 
   * Validates: Requirements 4.1
   */
  describe('Property 7: Quran Schedule Coverage', () => {
    it('should cover exactly 604 pages with no gaps', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          fc.integer({ min: 1440, max: 1500 }),
          (startDate, hijriYear) => {
            const schedule = generateQuranSchedule(startDate, hijriYear);
            
            // Verify we have 30 days
            expect(schedule.readings.length).toBe(RAMADAN_DAYS);
            
            // Calculate total pages covered
            let totalPages = 0;
            let lastEndPage = 0;
            
            for (const reading of schedule.readings) {
              // Verify no gaps (start page should be lastEndPage + 1)
              if (lastEndPage > 0) {
                expect(reading.startPage).toBe(lastEndPage + 1);
              } else {
                expect(reading.startPage).toBe(1);
              }
              
              // Verify page range is valid
              expect(reading.endPage).toBeGreaterThanOrEqual(reading.startPage);
              
              // Add pages
              totalPages += reading.endPage - reading.startPage + 1;
              lastEndPage = reading.endPage;
            }
            
            // Verify total pages equals 604
            expect(totalPages).toBe(QURAN_TOTAL_PAGES);
            
            // Verify last page is 604
            expect(lastEndPage).toBe(QURAN_TOTAL_PAGES);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have no overlapping page ranges', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          fc.integer({ min: 1440, max: 1500 }),
          (startDate, hijriYear) => {
            const schedule = generateQuranSchedule(startDate, hijriYear);
            
            // Check for overlaps
            for (let i = 0; i < schedule.readings.length - 1; i++) {
              const current = schedule.readings[i];
              const next = schedule.readings[i + 1];
              
              // Current end page should be less than next start page
              expect(current.endPage).toBeLessThan(next.startPage);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should assign correct Juz numbers (1-30)', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          fc.integer({ min: 1440, max: 1500 }),
          (startDate, hijriYear) => {
            const schedule = generateQuranSchedule(startDate, hijriYear);
            
            schedule.readings.forEach((reading, index) => {
              expect(reading.day).toBe(index + 1);
              expect(reading.juzNumber).toBe(index + 1);
              expect(reading.juzNumber).toBeGreaterThanOrEqual(1);
              expect(reading.juzNumber).toBeLessThanOrEqual(30);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Quran Progress Calculation
   * For any Quran schedule with N completed days and P pages read, 
   * the progress percentage SHALL equal (P / 604) * 100.
   * 
   * Validates: Requirements 4.5
   */
  describe('Property 8: Quran Progress Calculation', () => {
    it('should calculate progress percentage correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: QURAN_TOTAL_PAGES }), // pages read
          fc.integer({ min: 1, max: 30 }), // current day
          (pagesRead, currentDay) => {
            // Create a mock schedule with the specified pages read
            const schedule: QuranSchedule = {
              year: 1445,
              startDate: new Date(),
              readings: Array.from({ length: 30 }, (_, i) => ({
                day: i + 1,
                juzNumber: i + 1,
                startPage: i * 20 + 1,
                endPage: Math.min((i + 1) * 20, 604),
                surahNames: [],
                pagesTotal: 20,
                pagesRead: i < Math.floor(pagesRead / 20) ? 20 : (i === Math.floor(pagesRead / 20) ? pagesRead % 20 : 0),
                completed: i < Math.floor(pagesRead / 20),
                completedAt: null,
              })),
            };
            
            // Recalculate actual pages read from schedule
            const actualPagesRead = schedule.readings.reduce((sum, r) => sum + r.pagesRead, 0);
            
            const progress = calculateProgress(schedule, currentDay);
            
            // Verify percentage calculation
            const expectedPercent = Math.round((actualPagesRead / QURAN_TOTAL_PAGES) * 100);
            expect(progress.percentComplete).toBe(expectedPercent);
            expect(progress.pagesRead).toBe(actualPagesRead);
            expect(progress.totalPages).toBe(QURAN_TOTAL_PAGES);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly determine if user is on track', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 30 }), // days completed
          fc.integer({ min: 1, max: 30 }), // current day
          (daysCompleted, currentDay) => {
            // Create a mock schedule
            const schedule: QuranSchedule = {
              year: 1445,
              startDate: new Date(),
              readings: Array.from({ length: 30 }, (_, i) => ({
                day: i + 1,
                juzNumber: i + 1,
                startPage: i * 20 + 1,
                endPage: Math.min((i + 1) * 20, 604),
                surahNames: [],
                pagesTotal: 20,
                pagesRead: i < daysCompleted ? 20 : 0,
                completed: i < daysCompleted,
                completedAt: i < daysCompleted ? new Date() : null,
              })),
            };
            
            const progress = calculateProgress(schedule, currentDay);
            
            // On track if daysCompleted >= currentDay
            const expectedOnTrack = daysCompleted >= currentDay;
            expect(progress.onTrack).toBe(expectedOnTrack);
            
            // Days behind calculation
            const expectedDaysBehind = Math.max(0, currentDay - daysCompleted);
            expect(progress.daysBehind).toBe(expectedDaysBehind);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return default progress for null schedule', () => {
      const progress = calculateProgress(null, 15);
      
      expect(progress.totalPages).toBe(QURAN_TOTAL_PAGES);
      expect(progress.pagesRead).toBe(0);
      expect(progress.percentComplete).toBe(0);
      expect(progress.daysCompleted).toBe(0);
      expect(progress.totalDays).toBe(RAMADAN_DAYS);
      expect(progress.onTrack).toBe(true);
      expect(progress.daysBehind).toBe(0);
    });
  });

  /**
   * Additional: Schedule initialization properties
   */
  describe('Schedule Initialization', () => {
    it('should initialize all readings as incomplete', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          fc.integer({ min: 1440, max: 1500 }),
          (startDate, hijriYear) => {
            const schedule = generateQuranSchedule(startDate, hijriYear);
            
            schedule.readings.forEach(reading => {
              expect(reading.completed).toBe(false);
              expect(reading.completedAt).toBeNull();
              expect(reading.pagesRead).toBe(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have valid pagesTotal for each reading', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          fc.integer({ min: 1440, max: 1500 }),
          (startDate, hijriYear) => {
            const schedule = generateQuranSchedule(startDate, hijriYear);
            
            schedule.readings.forEach(reading => {
              const calculatedTotal = reading.endPage - reading.startPage + 1;
              expect(reading.pagesTotal).toBe(calculatedTotal);
              expect(reading.pagesTotal).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
