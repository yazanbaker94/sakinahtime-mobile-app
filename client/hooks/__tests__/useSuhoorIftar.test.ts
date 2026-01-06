/**
 * useSuhoorIftar Property-Based Tests
 * 
 * Tests for Suhoor/Iftar time mapping and countdown calculations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { calculateCountdown, parseTimeToDate } from '../useSuhoorIftar';

describe('useSuhoorIftar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  /**
   * Property 4: Suhoor Time Equals Fajr
   * For any location and date during Ramadan, the Suhoor end time SHALL equal 
   * the Fajr prayer time for that location and date.
   * 
   * Note: This is tested at the integration level since it depends on prayer times API.
   * Here we test that the time parsing works correctly.
   * 
   * Validates: Requirements 2.1
   */
  describe('Property 4: Suhoor Time Equals Fajr (Time Parsing)', () => {
    it('should correctly parse time strings to Date objects', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 23 }), // hours
          fc.integer({ min: 0, max: 59 }), // minutes
          (hours, minutes) => {
            const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            const result = parseTimeToDate(timeStr);
            
            expect(result.getHours()).toBe(hours);
            expect(result.getMinutes()).toBe(minutes);
            expect(result.getSeconds()).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Iftar Time Equals Maghrib
   * For any location and date during Ramadan, the Iftar time SHALL equal 
   * the Maghrib prayer time for that location and date.
   * 
   * Note: This is tested at the integration level since it depends on prayer times API.
   * The time parsing test above covers the parsing logic.
   * 
   * Validates: Requirements 2.2
   */
  describe('Property 5: Iftar Time Equals Maghrib', () => {
    it('should parse Maghrib-like evening times correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 17, max: 21 }), // typical Maghrib hours
          fc.integer({ min: 0, max: 59 }),
          (hours, minutes) => {
            const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            const result = parseTimeToDate(timeStr);
            
            expect(result.getHours()).toBe(hours);
            expect(result.getMinutes()).toBe(minutes);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Countdown Accuracy
   * For any target time T and current time C where C < T, the countdown 
   * SHALL equal (T - C) in hours, minutes, and seconds.
   * 
   * Validates: Requirements 2.3, 2.4
   */
  describe('Property 6: Countdown Accuracy', () => {
    it('should calculate countdown correctly for any future time', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 86400 }), // seconds in the future (up to 24 hours)
          (secondsInFuture) => {
            const now = new Date('2024-03-15T12:00:00');
            vi.setSystemTime(now);
            
            const targetDate = new Date(now.getTime() + secondsInFuture * 1000);
            const result = calculateCountdown(targetDate);
            
            // Verify total seconds matches
            expect(result.totalSeconds).toBe(secondsInFuture);
            
            // Verify hours, minutes, seconds decomposition
            const expectedHours = Math.floor(secondsInFuture / 3600);
            const expectedMinutes = Math.floor((secondsInFuture % 3600) / 60);
            const expectedSeconds = secondsInFuture % 60;
            
            expect(result.hours).toBe(expectedHours);
            expect(result.minutes).toBe(expectedMinutes);
            expect(result.seconds).toBe(expectedSeconds);
            
            // Verify reconstruction
            const reconstructed = result.hours * 3600 + result.minutes * 60 + result.seconds;
            expect(reconstructed).toBe(result.totalSeconds);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return zero countdown for past times', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 86400 }), // seconds in the past
          (secondsInPast) => {
            const now = new Date('2024-03-15T12:00:00');
            vi.setSystemTime(now);
            
            const targetDate = new Date(now.getTime() - secondsInPast * 1000);
            const result = calculateCountdown(targetDate);
            
            expect(result.totalSeconds).toBe(0);
            expect(result.hours).toBe(0);
            expect(result.minutes).toBe(0);
            expect(result.seconds).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle exact current time (zero countdown)', () => {
      const now = new Date('2024-03-15T12:00:00');
      vi.setSystemTime(now);
      
      const result = calculateCountdown(now);
      
      expect(result.totalSeconds).toBe(0);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
      expect(result.seconds).toBe(0);
    });
  });

  /**
   * Additional: Countdown components should always be non-negative
   */
  describe('Countdown Non-Negativity', () => {
    it('should never return negative values', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -86400, max: 86400 }), // any time offset
          (secondsOffset) => {
            const now = new Date('2024-03-15T12:00:00');
            vi.setSystemTime(now);
            
            const targetDate = new Date(now.getTime() + secondsOffset * 1000);
            const result = calculateCountdown(targetDate);
            
            expect(result.totalSeconds).toBeGreaterThanOrEqual(0);
            expect(result.hours).toBeGreaterThanOrEqual(0);
            expect(result.minutes).toBeGreaterThanOrEqual(0);
            expect(result.seconds).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
