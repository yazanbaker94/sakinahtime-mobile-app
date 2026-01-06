/**
 * RamadanService Property-Based Tests
 * 
 * Tests for Ramadan detection, day calculation, and last 10 nights detection.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { ramadanService } from '../RamadanService';
import { hijriDateService } from '../HijriDateService';
import { RAMADAN_DAYS, LAYLATUL_QADR_NIGHTS } from '../../constants/ramadan';

// Mock HijriDateService
vi.mock('../HijriDateService', () => ({
  hijriDateService: {
    getCurrentHijriDate: vi.fn(),
    toGregorian: vi.fn((hijri) => new Date(2024, 2, hijri.day)),
  },
}));

describe('RamadanService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 1: Ramadan Detection Consistency
   * For any valid Hijri date, if the month equals 9 (Ramadan), then isRamadan() 
   * SHALL return true, and if the month does not equal 9, then isRamadan() SHALL return false.
   * 
   * Validates: Requirements 1.1, 1.4
   */
  describe('Property 1: Ramadan Detection Consistency', () => {
    it('should return true if and only if month is 9 (Ramadan)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 12 }), // Hijri month (1-12)
          fc.integer({ min: 1, max: 30 }), // Hijri day (1-30)
          fc.integer({ min: 1440, max: 1500 }), // Hijri year
          (month, day, year) => {
            vi.mocked(hijriDateService.getCurrentHijriDate).mockReturnValue({
              day,
              month,
              year,
              monthNameAr: 'test',
              monthNameEn: 'test',
            });

            const result = ramadanService.isRamadan();
            const expected = month === 9;

            expect(result).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Ramadan Day Calculation Bounds
   * For any date during Ramadan, getCurrentRamadanDay() SHALL return a value 
   * between 1 and 30 inclusive, equal to the Hijri day of the month.
   * 
   * Validates: Requirements 1.2
   */
  describe('Property 2: Ramadan Day Calculation Bounds', () => {
    it('should return day between 1-30 during Ramadan, matching Hijri day', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }), // Hijri day (1-30)
          fc.integer({ min: 1440, max: 1500 }), // Hijri year
          (day, year) => {
            vi.mocked(hijriDateService.getCurrentHijriDate).mockReturnValue({
              day,
              month: 9, // Ramadan
              year,
              monthNameAr: 'رمضان',
              monthNameEn: 'Ramadan',
            });

            const result = ramadanService.getCurrentRamadanDay();

            expect(result).toBe(day);
            expect(result).toBeGreaterThanOrEqual(1);
            expect(result).toBeLessThanOrEqual(30);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null when not Ramadan', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 12 }).filter(m => m !== 9), // Non-Ramadan month
          fc.integer({ min: 1, max: 30 }),
          fc.integer({ min: 1440, max: 1500 }),
          (month, day, year) => {
            vi.mocked(hijriDateService.getCurrentHijriDate).mockReturnValue({
              day,
              month,
              year,
              monthNameAr: 'test',
              monthNameEn: 'test',
            });

            const result = ramadanService.getCurrentRamadanDay();
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Days Remaining Calculation
   * For any Ramadan day D (1-30), getDaysRemaining() SHALL return exactly (30 - D).
   * 
   * Validates: Requirements 1.3
   */
  describe('Property 3: Days Remaining Calculation', () => {
    it('should return (30 - currentDay) during Ramadan', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }), // Hijri day (1-30)
          fc.integer({ min: 1440, max: 1500 }), // Hijri year
          (day, year) => {
            vi.mocked(hijriDateService.getCurrentHijriDate).mockReturnValue({
              day,
              month: 9, // Ramadan
              year,
              monthNameAr: 'رمضان',
              monthNameEn: 'Ramadan',
            });

            const result = ramadanService.getDaysRemaining();
            const expected = RAMADAN_DAYS - day;

            expect(result).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null when not Ramadan', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 12 }).filter(m => m !== 9),
          fc.integer({ min: 1, max: 30 }),
          fc.integer({ min: 1440, max: 1500 }),
          (month, day, year) => {
            vi.mocked(hijriDateService.getCurrentHijriDate).mockReturnValue({
              day,
              month,
              year,
              monthNameAr: 'test',
              monthNameEn: 'test',
            });

            const result = ramadanService.getDaysRemaining();
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 12: Last Ten Nights Detection
   * For any Ramadan day D, isLastTenNights() SHALL return true if and only if D >= 21.
   * 
   * Validates: Requirements 9.1
   */
  describe('Property 12: Last Ten Nights Detection', () => {
    it('should return true if and only if day >= 21', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }), // Hijri day (1-30)
          fc.integer({ min: 1440, max: 1500 }), // Hijri year
          (day, year) => {
            vi.mocked(hijriDateService.getCurrentHijriDate).mockReturnValue({
              day,
              month: 9, // Ramadan
              year,
              monthNameAr: 'رمضان',
              monthNameEn: 'Ramadan',
            });

            const result = ramadanService.isLastTenNights();
            const expected = day >= 21;

            expect(result).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false when not Ramadan', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 12 }).filter(m => m !== 9),
          fc.integer({ min: 1, max: 30 }),
          fc.integer({ min: 1440, max: 1500 }),
          (month, day, year) => {
            vi.mocked(hijriDateService.getCurrentHijriDate).mockReturnValue({
              day,
              month,
              year,
              monthNameAr: 'test',
              monthNameEn: 'test',
            });

            const result = ramadanService.isLastTenNights();
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 13: Odd Night Detection
   * For any Ramadan day D in the last 10 nights, isOddNight SHALL return true 
   * if and only if D is in {21, 23, 25, 27, 29}.
   * 
   * Validates: Requirements 9.2
   */
  describe('Property 13: Odd Night Detection', () => {
    it('should return true if and only if day is in {21, 23, 25, 27, 29}', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }), // Hijri day (1-30)
          fc.integer({ min: 1440, max: 1500 }), // Hijri year
          (day, year) => {
            vi.mocked(hijriDateService.getCurrentHijriDate).mockReturnValue({
              day,
              month: 9, // Ramadan
              year,
              monthNameAr: 'رمضان',
              monthNameEn: 'Ramadan',
            });

            const result = ramadanService.isOddNight();
            const expected = LAYLATUL_QADR_NIGHTS.includes(day);

            expect(result).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
