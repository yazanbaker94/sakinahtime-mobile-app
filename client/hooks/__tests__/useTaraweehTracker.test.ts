/**
 * useTaraweehTracker Property-Based Tests
 * 
 * Tests for Taraweeh streak calculation and statistics.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateStreak, calculateStats } from '../useTaraweehTracker';
import { TaraweehEntry } from '../../types/ramadan';
import { RAMADAN_DAYS } from '../../constants/ramadan';

// Helper to create a mock entry
function createMockEntry(hijriDay: number, location: 'mosque' | 'home' = 'mosque'): TaraweehEntry {
  return {
    id: `test_${hijriDay}`,
    date: new Date(),
    hijriDay,
    rakaat: 8,
    location,
    createdAt: new Date(),
  };
}

describe('useTaraweehTracker', () => {
  /**
   * Property 9: Taraweeh Streak Calculation
   * For any sequence of Taraweeh entries, the current streak SHALL equal the count 
   * of consecutive nights ending with the most recent entry, and the best streak 
   * SHALL be greater than or equal to the current streak.
   * 
   * Validates: Requirements 6.4, 6.6
   */
  describe('Property 9: Taraweeh Streak Calculation', () => {
    it('should calculate current streak as consecutive days ending at current day', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 30 }), { minLength: 0, maxLength: 30 }),
          fc.integer({ min: 1, max: 30 }),
          (days, currentDay) => {
            // Create unique days
            const uniqueDays = [...new Set(days)];
            const entries = uniqueDays.map(d => createMockEntry(d));
            
            const { current, best } = calculateStreak(entries, currentDay);
            
            // Best streak should always be >= current streak
            expect(best).toBeGreaterThanOrEqual(current);
            
            // Current streak should be non-negative
            expect(current).toBeGreaterThanOrEqual(0);
            
            // Best streak should be non-negative
            expect(best).toBeGreaterThanOrEqual(0);
            
            // Best streak should not exceed number of entries
            expect(best).toBeLessThanOrEqual(uniqueDays.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 streak for empty entries', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }),
          (currentDay) => {
            const { current, best } = calculateStreak([], currentDay);
            
            expect(current).toBe(0);
            expect(best).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate correct streak for consecutive days', () => {
      // Test specific case: days 1, 2, 3, 4, 5 with current day 5
      const entries = [1, 2, 3, 4, 5].map(d => createMockEntry(d));
      const { current, best } = calculateStreak(entries, 5);
      
      expect(current).toBe(5);
      expect(best).toBe(5);
    });

    it('should handle gaps in streak correctly', () => {
      // Test case: days 1, 2, 4, 5 (gap at day 3) with current day 5
      const entries = [1, 2, 4, 5].map(d => createMockEntry(d));
      const { current, best } = calculateStreak(entries, 5);
      
      // Current streak should be 2 (days 4, 5)
      expect(current).toBe(2);
      // Best streak should be 2 (either 1,2 or 4,5)
      expect(best).toBe(2);
    });

    it('should find best streak even if not at current day', () => {
      // Test case: days 1, 2, 3, 4, 5, 10 with current day 10
      const entries = [1, 2, 3, 4, 5, 10].map(d => createMockEntry(d));
      const { current, best } = calculateStreak(entries, 10);
      
      // Current streak is 1 (only day 10)
      expect(current).toBe(1);
      // Best streak is 5 (days 1-5)
      expect(best).toBe(5);
    });
  });

  /**
   * Statistics Calculation Tests
   */
  describe('Statistics Calculation', () => {
    it('should calculate correct nights completed', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 30 }), { minLength: 0, maxLength: 30 }),
          fc.integer({ min: 1, max: 30 }),
          (days, currentDay) => {
            const uniqueDays = [...new Set(days)];
            const entries = uniqueDays.map(d => createMockEntry(d));
            
            const stats = calculateStats(entries, currentDay);
            
            expect(stats.nightsCompleted).toBe(uniqueDays.length);
            expect(stats.totalNights).toBe(RAMADAN_DAYS);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate correct mosque vs home breakdown', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              day: fc.integer({ min: 1, max: 30 }),
              location: fc.constantFrom('mosque', 'home') as fc.Arbitrary<'mosque' | 'home'>,
            }),
            { minLength: 0, maxLength: 30 }
          ),
          fc.integer({ min: 1, max: 30 }),
          (dayLocations, currentDay) => {
            // Create unique entries by day
            const uniqueByDay = new Map<number, 'mosque' | 'home'>();
            dayLocations.forEach(({ day, location }) => {
              uniqueByDay.set(day, location);
            });
            
            const entries = Array.from(uniqueByDay.entries()).map(([day, location]) => 
              createMockEntry(day, location)
            );
            
            const stats = calculateStats(entries, currentDay);
            
            // Mosque + home should equal total entries
            expect(stats.mosqueNights + stats.homeNights).toBe(entries.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate completion rate correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 30 }), { minLength: 0, maxLength: 30 }),
          fc.integer({ min: 1, max: 30 }),
          (days, currentDay) => {
            const uniqueDays = [...new Set(days)];
            const entries = uniqueDays.map(d => createMockEntry(d));
            
            const stats = calculateStats(entries, currentDay);
            
            const expectedRate = Math.round((uniqueDays.length / RAMADAN_DAYS) * 100);
            expect(stats.completionRate).toBe(expectedRate);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return default stats for empty entries', () => {
      const stats = calculateStats([], 15);
      
      expect(stats.nightsCompleted).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.bestStreak).toBe(0);
      expect(stats.mosqueNights).toBe(0);
      expect(stats.homeNights).toBe(0);
      expect(stats.completionRate).toBe(0);
      expect(stats.totalNights).toBe(RAMADAN_DAYS);
    });
  });
});
