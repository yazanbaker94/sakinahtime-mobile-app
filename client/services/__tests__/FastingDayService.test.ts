import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { FastingDayService } from '../FastingDayService';
import { HijriDate } from '../../types/hijri';

const service = new FastingDayService();

/**
 * Tests for FastingDayService
 * 
 * Feature: hijri-calendar
 * These tests verify the fasting day identification functionality.
 */

describe('FastingDayService', () => {
  /**
   * Property 1: White Day detection
   * 
   * For any day 13, 14, or 15, isWhiteDay should return true.
   * 
   * **Validates: Requirements 5.2**
   */
  describe('Property 1: White Day detection', () => {
    it('should correctly identify White Days', () => {
      // White Days are 13, 14, 15
      expect(service.isWhiteDay(12)).toBe(false);
      expect(service.isWhiteDay(13)).toBe(true);
      expect(service.isWhiteDay(14)).toBe(true);
      expect(service.isWhiteDay(15)).toBe(true);
      expect(service.isWhiteDay(16)).toBe(false);
    });

    it('should return false for all non-White Days', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }).filter(d => d < 13 || d > 15),
          (day) => {
            expect(service.isWhiteDay(day)).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 2: Monday/Thursday detection
   * 
   * For any date, isSunnahFastingDay should correctly identify Monday and Thursday.
   * 
   * **Validates: Requirements 5.1**
   */
  describe('Property 2: Monday/Thursday detection', () => {
    it('should identify Monday as Sunnah fasting day', () => {
      // January 6, 2025 is a Monday
      const monday = new Date(2025, 0, 6);
      expect(service.isSunnahFastingDay(monday)).toBe(true);
    });

    it('should identify Thursday as Sunnah fasting day', () => {
      // January 2, 2025 is a Thursday
      const thursday = new Date(2025, 0, 2);
      expect(service.isSunnahFastingDay(thursday)).toBe(true);
    });

    it('should return false for other days', () => {
      // January 1, 2025 is a Wednesday
      const wednesday = new Date(2025, 0, 1);
      expect(service.isSunnahFastingDay(wednesday)).toBe(false);
      
      // January 3, 2025 is a Friday
      const friday = new Date(2025, 0, 3);
      expect(service.isSunnahFastingDay(friday)).toBe(false);
    });
  });

  describe('isFastingDay', () => {
    it('should identify Ashura (10th Muharram)', () => {
      const hijriDate: HijriDate = {
        day: 10,
        month: 1,
        year: 1446,
        monthNameAr: 'محرم',
        monthNameEn: 'Muharram',
      };
      const gregorianDate = new Date(2024, 6, 17); // Approximate
      
      const result = service.isFastingDay(hijriDate, gregorianDate);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('ashura');
    });

    it('should identify Day of Arafah (9th Dhul Hijjah)', () => {
      const hijriDate: HijriDate = {
        day: 9,
        month: 12,
        year: 1446,
        monthNameAr: 'ذو الحجة',
        monthNameEn: 'Dhul Hijjah',
      };
      const gregorianDate = new Date(2025, 5, 6); // Approximate
      
      const result = service.isFastingDay(hijriDate, gregorianDate);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('arafah');
    });

    it('should identify Shawwal fasting days', () => {
      const hijriDate: HijriDate = {
        day: 3,
        month: 10,
        year: 1446,
        monthNameAr: 'شوال',
        monthNameEn: 'Shawwal',
      };
      const gregorianDate = new Date(2025, 3, 2); // Approximate
      
      const result = service.isFastingDay(hijriDate, gregorianDate);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('shawwal');
    });

    it('should identify White Days', () => {
      const hijriDate: HijriDate = {
        day: 14,
        month: 5,
        year: 1446,
        monthNameAr: 'جمادى الأولى',
        monthNameEn: 'Jumada al-Awwal',
      };
      const gregorianDate = new Date(2024, 10, 15); // Approximate
      
      const result = service.isFastingDay(hijriDate, gregorianDate);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('white_day');
    });

    it('should identify Monday fasting', () => {
      const hijriDate: HijriDate = {
        day: 5,
        month: 2,
        year: 1446,
        monthNameAr: 'صفر',
        monthNameEn: 'Safar',
      };
      // January 6, 2025 is a Monday
      const monday = new Date(2025, 0, 6);
      
      const result = service.isFastingDay(hijriDate, monday);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('monday');
    });

    it('should identify Thursday fasting', () => {
      const hijriDate: HijriDate = {
        day: 5,
        month: 2,
        year: 1446,
        monthNameAr: 'صفر',
        monthNameEn: 'Safar',
      };
      // January 2, 2025 is a Thursday
      const thursday = new Date(2025, 0, 2);
      
      const result = service.isFastingDay(hijriDate, thursday);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('thursday');
    });

    it('should prioritize special days over regular fasting', () => {
      // If Ashura falls on a Monday, it should be identified as Ashura
      const hijriDate: HijriDate = {
        day: 10,
        month: 1,
        year: 1446,
        monthNameAr: 'محرم',
        monthNameEn: 'Muharram',
      };
      const monday = new Date(2025, 0, 6); // A Monday
      
      const result = service.isFastingDay(hijriDate, monday);
      expect(result?.type).toBe('ashura');
    });
  });

  describe('getFastingDaysForMonth', () => {
    it('should return fasting days for a month', () => {
      const fastingDays = service.getFastingDaysForMonth(1, 1446);
      expect(fastingDays.length).toBeGreaterThan(0);
      
      // Should include Ashura
      const types = fastingDays.map(d => d.type);
      expect(types).toContain('ashura');
    });

    it('should include White Days for any month', () => {
      const fastingDays = service.getFastingDaysForMonth(5, 1446);
      const whiteDays = fastingDays.filter(d => d.type === 'white_day');
      expect(whiteDays.length).toBe(3); // 13, 14, 15
    });
  });

  describe('getUpcomingFastingDays', () => {
    it('should return upcoming fasting days', () => {
      const fastingDays = service.getUpcomingFastingDays(5);
      expect(fastingDays.length).toBeLessThanOrEqual(5);
      expect(fastingDays.length).toBeGreaterThan(0);
    });

    it('should respect the limit', () => {
      const fastingDays3 = service.getUpcomingFastingDays(3);
      const fastingDays10 = service.getUpcomingFastingDays(10);
      
      expect(fastingDays3.length).toBeLessThanOrEqual(3);
      expect(fastingDays10.length).toBeLessThanOrEqual(10);
    });
  });

  describe('isFastingProhibited', () => {
    it('should identify Eid al-Fitr as prohibited', () => {
      const hijriDate: HijriDate = {
        day: 1,
        month: 10,
        year: 1446,
        monthNameAr: 'شوال',
        monthNameEn: 'Shawwal',
      };
      expect(service.isFastingProhibited(hijriDate)).toBe(true);
    });

    it('should identify Eid al-Adha as prohibited', () => {
      const hijriDate: HijriDate = {
        day: 10,
        month: 12,
        year: 1446,
        monthNameAr: 'ذو الحجة',
        monthNameEn: 'Dhul Hijjah',
      };
      expect(service.isFastingProhibited(hijriDate)).toBe(true);
    });

    it('should identify Tashreeq days as prohibited', () => {
      for (let day = 11; day <= 13; day++) {
        const hijriDate: HijriDate = {
          day,
          month: 12,
          year: 1446,
          monthNameAr: 'ذو الحجة',
          monthNameEn: 'Dhul Hijjah',
        };
        expect(service.isFastingProhibited(hijriDate)).toBe(true);
      }
    });

    it('should return false for regular days', () => {
      const hijriDate: HijriDate = {
        day: 15,
        month: 5,
        year: 1446,
        monthNameAr: 'جمادى الأولى',
        monthNameEn: 'Jumada al-Awwal',
      };
      expect(service.isFastingProhibited(hijriDate)).toBe(false);
    });
  });

  describe('getFastingDescription', () => {
    it('should return descriptions for all fasting types', () => {
      expect(service.getFastingDescription('monday')).toContain('Monday');
      expect(service.getFastingDescription('thursday')).toContain('Thursday');
      expect(service.getFastingDescription('white_day')).toContain('White Days');
      expect(service.getFastingDescription('ashura')).toContain('Ashura');
      expect(service.getFastingDescription('arafah')).toContain('Arafah');
      expect(service.getFastingDescription('shawwal')).toContain('Shawwal');
    });
  });

  describe('getFastingPriority', () => {
    it('should give highest priority to Arafah', () => {
      expect(service.getFastingPriority('arafah')).toBeGreaterThan(service.getFastingPriority('ashura'));
      expect(service.getFastingPriority('arafah')).toBeGreaterThan(service.getFastingPriority('monday'));
    });

    it('should give equal priority to Monday and Thursday', () => {
      expect(service.getFastingPriority('monday')).toBe(service.getFastingPriority('thursday'));
    });
  });
});
