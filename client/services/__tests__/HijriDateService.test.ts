import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { HijriDateService } from '../HijriDateService';

const service = new HijriDateService();

/**
 * Property-Based Tests for HijriDateService
 * 
 * Feature: hijri-calendar
 * These tests verify the correctness properties for Hijri date calculations.
 */

describe('HijriDateService', () => {
  /**
   * Property 1: Round-trip conversion
   * 
   * For any valid Gregorian date, converting to Hijri and back should
   * return a date within 1-2 days (due to calendar approximation).
   * 
   * **Validates: Requirements 1.1**
   */
  describe('Property 1: Round-trip Gregorian → Hijri → Gregorian', () => {
    it('should return date within 2 days after round-trip conversion', () => {
      fc.assert(
        fc.property(
          // Generate dates between 1950 and 2050
          fc.date({ min: new Date(1950, 0, 1), max: new Date(2050, 11, 31) }),
          (date) => {
            // Normalize to midnight to avoid time issues
            const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            
            const hijri = service.toHijri(normalizedDate);
            const backToGregorian = service.toGregorian(hijri);
            
            // Allow up to 2 days difference due to calendar approximation
            const diffDays = Math.abs(
              (backToGregorian.getTime() - normalizedDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            expect(diffDays).toBeLessThanOrEqual(2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Hijri date validity
   * 
   * For any Gregorian date, the resulting Hijri date should have valid
   * day (1-30), month (1-12), and reasonable year values.
   * 
   * **Validates: Requirements 1.1, 1.2, 1.3**
   */
  describe('Property 2: Hijri date validity', () => {
    it('should produce valid Hijri dates for all Gregorian dates', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date(1900, 0, 1), max: new Date(2100, 11, 31) }),
          (date) => {
            const hijri = service.toHijri(date);
            
            // Day should be 1-30
            expect(hijri.day).toBeGreaterThanOrEqual(1);
            expect(hijri.day).toBeLessThanOrEqual(30);
            
            // Month should be 1-12
            expect(hijri.month).toBeGreaterThanOrEqual(1);
            expect(hijri.month).toBeLessThanOrEqual(12);
            
            // Year should be reasonable (1300-1600 Hijri for 1900-2100 CE)
            expect(hijri.year).toBeGreaterThanOrEqual(1300);
            expect(hijri.year).toBeLessThanOrEqual(1600);
            
            // Month names should be defined
            expect(hijri.monthNameAr).toBeDefined();
            expect(hijri.monthNameEn).toBeDefined();
            expect(hijri.monthNameAr.length).toBeGreaterThan(0);
            expect(hijri.monthNameEn.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Days in month validity
   * 
   * For any Hijri month, the number of days should be 29 or 30.
   * 
   * **Validates: Requirements 1.1**
   */
  describe('Property 3: Days in month validity', () => {
    it('should return 29 or 30 days for any month', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1400, max: 1500 }),
          (month, year) => {
            const days = service.getDaysInMonth(month, year);
            expect(days).toBeGreaterThanOrEqual(29);
            expect(days).toBeLessThanOrEqual(30);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Monotonic date progression
   * 
   * Adding days to a date should always move forward in time.
   * 
   * **Validates: Requirements 1.1**
   */
  describe('Property 4: Monotonic date progression', () => {
    it('should progress forward when adding positive days', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 28 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1420, max: 1450 }), // Use more recent years
          fc.integer({ min: 1, max: 30 }),
          (day, month, year, daysToAdd) => {
            const startDate = {
              day: Math.min(day, service.getDaysInMonth(month, year)),
              month,
              year,
              monthNameAr: '',
              monthNameEn: '',
            };
            
            const endDate = service.addDays(startDate, daysToAdd);
            
            // End date should be after start date
            const comparison = service.compare(startDate, endDate);
            expect(comparison).toBeLessThan(0); // startDate < endDate
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Known date conversions (unit tests)
   */
  describe('Known date conversions', () => {
    it('should convert known historical dates correctly', () => {
      // Test some known conversions
      // January 1, 2000 CE ≈ 24 Ramadan 1420 AH
      const date2000 = new Date(2000, 0, 1);
      const hijri2000 = service.toHijri(date2000);
      expect(hijri2000.year).toBe(1420);
      expect(hijri2000.month).toBe(9); // Ramadan
      
      // January 1, 2025 CE ≈ 1 Rajab 1446 AH
      const date2025 = new Date(2025, 0, 1);
      const hijri2025 = service.toHijri(date2025);
      expect(hijri2025.year).toBe(1446);
    });

    it('should format dates correctly', () => {
      const hijriDate = {
        day: 15,
        month: 9,
        year: 1446,
        monthNameAr: 'رمضان',
        monthNameEn: 'Ramadan',
      };
      
      expect(service.formatHijriDate(hijriDate, 'short')).toBe('15 Ramadan 1446');
      expect(service.formatHijriDate(hijriDate, 'long')).toBe('15 Ramadan 1446 AH');
      expect(service.formatHijriDateArabic(hijriDate)).toBe('15 رمضان 1446 هـ');
    });

    it('should get correct month names', () => {
      expect(service.getMonthName(1, 'en')).toBe('Muharram');
      expect(service.getMonthName(9, 'en')).toBe('Ramadan');
      expect(service.getMonthName(12, 'en')).toBe('Dhul Hijjah');
      expect(service.getMonthName(1, 'ar')).toBe('محرم');
      expect(service.getMonthName(9, 'ar')).toBe('رمضان');
    });

    it('should identify leap years correctly', () => {
      // Years 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29 in 30-year cycle are leap years
      expect(service.isLeapYear(1442)).toBe(true);  // 1442 % 30 = 2
      expect(service.isLeapYear(1445)).toBe(true);  // 1445 % 30 = 5
      expect(service.isLeapYear(1443)).toBe(false); // 1443 % 30 = 3
    });

    it('should get all days in a month', () => {
      const days = service.getMonthDays(9, 1446); // Ramadan 1446
      expect(days.length).toBeGreaterThanOrEqual(29);
      expect(days.length).toBeLessThanOrEqual(30);
      expect(days[0].day).toBe(1);
      expect(days[days.length - 1].day).toBe(days.length);
    });
  });
});
