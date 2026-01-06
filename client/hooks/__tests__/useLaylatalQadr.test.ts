/**
 * Property-based tests for useLaylatalQadr hook
 * 
 * Tests Property 13: Odd Night Detection
 */

import * as fc from 'fast-check';
import { isOddNightCheck, calculateDaysUntilLastTen, calculateNightsRemaining } from '../useLaylatalQadr';
import { LAYLATUL_QADR_NIGHTS } from '../../constants/ramadan';

describe('useLaylatalQadr - Property Tests', () => {
  describe('Property 13: Odd Night Detection', () => {
    it('isOddNight returns true only for nights in {21, 23, 25, 27, 29}', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }),
          (day) => {
            const isOdd = isOddNightCheck(day);
            const expectedOdd = LAYLATUL_QADR_NIGHTS.includes(day);
            
            return isOdd === expectedOdd;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all odd nights are in the last 10 nights (day >= 21)', () => {
      for (const night of LAYLATUL_QADR_NIGHTS) {
        expect(night).toBeGreaterThanOrEqual(21);
        expect(night).toBeLessThanOrEqual(30);
      }
    });

    it('odd nights are exactly {21, 23, 25, 27, 29}', () => {
      expect(LAYLATUL_QADR_NIGHTS).toEqual([21, 23, 25, 27, 29]);
    });

    it('returns false for null day', () => {
      expect(isOddNightCheck(null)).toBe(false);
    });

    it('returns false for days outside Ramadan range', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 31, max: 100 }),
          (day) => {
            return isOddNightCheck(day) === false;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('returns false for days before last 10 nights', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (day) => {
            return isOddNightCheck(day) === false;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Days Until Last Ten Calculation', () => {
    it('returns 0 when already in last 10 nights', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 21, max: 30 }),
          (day) => {
            return calculateDaysUntilLastTen(day) === 0;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('returns (21 - currentDay) when before last 10 nights', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (day) => {
            const daysUntil = calculateDaysUntilLastTen(day);
            return daysUntil === (21 - day);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('returns 0 for null day', () => {
      expect(calculateDaysUntilLastTen(null)).toBe(0);
    });

    it('day 20 returns 1 day until last 10', () => {
      expect(calculateDaysUntilLastTen(20)).toBe(1);
    });

    it('day 1 returns 20 days until last 10', () => {
      expect(calculateDaysUntilLastTen(1)).toBe(20);
    });
  });

  describe('Nights Remaining Calculation', () => {
    it('returns (30 - currentDay) for valid days', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 30 }),
          (day) => {
            const remaining = calculateNightsRemaining(day);
            return remaining === (30 - day);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('returns 0 for null day', () => {
      expect(calculateNightsRemaining(null)).toBe(0);
    });

    it('returns 0 for day 30', () => {
      expect(calculateNightsRemaining(30)).toBe(0);
    });

    it('returns 29 for day 1', () => {
      expect(calculateNightsRemaining(1)).toBe(29);
    });

    it('never returns negative values', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          (day) => {
            const remaining = calculateNightsRemaining(day);
            return remaining >= 0;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('specific odd nights are correctly identified', () => {
      expect(isOddNightCheck(21)).toBe(true);
      expect(isOddNightCheck(23)).toBe(true);
      expect(isOddNightCheck(25)).toBe(true);
      expect(isOddNightCheck(27)).toBe(true);
      expect(isOddNightCheck(29)).toBe(true);
    });

    it('even nights in last 10 are not odd nights', () => {
      expect(isOddNightCheck(22)).toBe(false);
      expect(isOddNightCheck(24)).toBe(false);
      expect(isOddNightCheck(26)).toBe(false);
      expect(isOddNightCheck(28)).toBe(false);
      expect(isOddNightCheck(30)).toBe(false);
    });

    it('boundary day 21 is correctly handled', () => {
      expect(isOddNightCheck(21)).toBe(true);
      expect(calculateDaysUntilLastTen(21)).toBe(0);
      expect(calculateNightsRemaining(21)).toBe(9);
    });

    it('boundary day 20 is correctly handled', () => {
      expect(isOddNightCheck(20)).toBe(false);
      expect(calculateDaysUntilLastTen(20)).toBe(1);
      expect(calculateNightsRemaining(20)).toBe(10);
    });
  });
});
