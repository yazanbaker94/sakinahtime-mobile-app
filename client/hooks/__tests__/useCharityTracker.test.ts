/**
 * Property-based tests for useCharityTracker hook
 * 
 * Tests Property 10: Charity Total Calculation
 * Tests Property 11: Zakat Calculation
 */

import * as fc from 'fast-check';
import { calculateTotal, calculateByType, calculateZakatAmount, calculateStats } from '../useCharityTracker';
import { CharityEntry, CharityType } from '../../types/ramadan';
import { ZAKAT_RATE, NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS } from '../../constants/ramadan';

// Arbitrary for CharityType
const charityTypeArb = fc.constantFrom<CharityType>('sadaqah', 'zakat', 'fidya', 'kaffarah', 'other');

// Arbitrary for CharityEntry
const charityEntryArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
  type: charityTypeArb,
  amount: fc.float({ min: 0.01, max: 1000000, noNaN: true }),
  currency: fc.constantFrom('USD', 'EUR', 'GBP', 'SAR', 'AED'),
  recipient: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  notes: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
  isAnonymous: fc.boolean(),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
});

describe('useCharityTracker - Property Tests', () => {
  describe('Property 10: Charity Total Calculation', () => {
    it('total amount equals sum of all entry amounts', () => {
      fc.assert(
        fc.property(
          fc.array(charityEntryArb, { minLength: 0, maxLength: 100 }),
          (entries) => {
            const total = calculateTotal(entries);
            const expectedTotal = entries.reduce((sum, e) => sum + e.amount, 0);
            
            // Allow small floating point tolerance
            return Math.abs(total - expectedTotal) < 0.001;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('breakdown by type sums to total', () => {
      fc.assert(
        fc.property(
          fc.array(charityEntryArb, { minLength: 0, maxLength: 100 }),
          (entries) => {
            const total = calculateTotal(entries);
            const byType = calculateByType(entries);
            const typeSum = Object.values(byType).reduce((sum, val) => sum + val, 0);
            
            // Allow small floating point tolerance
            return Math.abs(total - typeSum) < 0.001;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('each type total equals sum of entries of that type', () => {
      fc.assert(
        fc.property(
          fc.array(charityEntryArb, { minLength: 0, maxLength: 100 }),
          charityTypeArb,
          (entries, targetType) => {
            const byType = calculateByType(entries);
            const expectedTypeTotal = entries
              .filter(e => e.type === targetType)
              .reduce((sum, e) => sum + e.amount, 0);
            
            return Math.abs(byType[targetType] - expectedTypeTotal) < 0.001;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('empty entries returns zero total', () => {
      const total = calculateTotal([]);
      expect(total).toBe(0);
    });

    it('stats totalEntries equals entries length', () => {
      fc.assert(
        fc.property(
          fc.array(charityEntryArb, { minLength: 0, maxLength: 100 }),
          (entries) => {
            const stats = calculateStats(entries);
            return stats.totalEntries === entries.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 11: Zakat Calculation', () => {
    it('zakat due is 2.5% when wealth meets Nisab', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1000, max: 10000000, noNaN: true }), // Wealth
          fc.float({ min: 50, max: 100, noNaN: true }), // Gold price per gram
          fc.float({ min: 0.5, max: 2, noNaN: true }), // Silver price per gram
          (wealth, goldPrice, silverPrice) => {
            const nisabGold = NISAB_GOLD_GRAMS * goldPrice;
            const nisabSilver = NISAB_SILVER_GRAMS * silverPrice;
            const nisabThreshold = Math.min(nisabGold, nisabSilver);
            
            // Only test when wealth meets Nisab
            if (wealth < nisabThreshold) return true;
            
            const result = calculateZakatAmount(wealth, goldPrice, silverPrice);
            const expectedZakat = wealth * ZAKAT_RATE;
            
            return result.meetsNisab === true && 
                   Math.abs(result.zakatDue - expectedZakat) < 0.01;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('zakat due is 0 when wealth below Nisab', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0.01, max: 100, noNaN: true }), // Small wealth
          fc.float({ min: 50, max: 100, noNaN: true }), // Gold price per gram
          fc.float({ min: 0.5, max: 2, noNaN: true }), // Silver price per gram
          (wealth, goldPrice, silverPrice) => {
            const nisabGold = NISAB_GOLD_GRAMS * goldPrice;
            const nisabSilver = NISAB_SILVER_GRAMS * silverPrice;
            const nisabThreshold = Math.min(nisabGold, nisabSilver);
            
            // Only test when wealth is below Nisab
            if (wealth >= nisabThreshold) return true;
            
            const result = calculateZakatAmount(wealth, goldPrice, silverPrice);
            
            return result.meetsNisab === false && result.zakatDue === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Nisab thresholds are calculated correctly', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 1, max: 10000000, noNaN: true }),
          fc.float({ min: 1, max: 500, noNaN: true }),
          fc.float({ min: 0.1, max: 10, noNaN: true }),
          (wealth, goldPrice, silverPrice) => {
            const result = calculateZakatAmount(wealth, goldPrice, silverPrice);
            
            const expectedNisabGold = NISAB_GOLD_GRAMS * goldPrice;
            const expectedNisabSilver = NISAB_SILVER_GRAMS * silverPrice;
            
            return Math.abs(result.nisabGold - expectedNisabGold) < 0.01 &&
                   Math.abs(result.nisabSilver - expectedNisabSilver) < 0.01;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('zakat rate is exactly 2.5%', () => {
      expect(ZAKAT_RATE).toBe(0.025);
    });

    it('meetsNisab is true iff wealth >= min(nisabGold, nisabSilver)', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 10000000, noNaN: true }),
          fc.float({ min: 1, max: 500, noNaN: true }),
          fc.float({ min: 0.1, max: 10, noNaN: true }),
          (wealth, goldPrice, silverPrice) => {
            const result = calculateZakatAmount(wealth, goldPrice, silverPrice);
            const nisabThreshold = Math.min(result.nisabGold, result.nisabSilver);
            
            return result.meetsNisab === (wealth >= nisabThreshold);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles single entry correctly', () => {
      const entry: CharityEntry = {
        id: 'test-1',
        date: new Date(),
        type: 'sadaqah',
        amount: 100,
        currency: 'USD',
        isAnonymous: false,
        createdAt: new Date(),
      };
      
      const total = calculateTotal([entry]);
      const byType = calculateByType([entry]);
      
      expect(total).toBe(100);
      expect(byType.sadaqah).toBe(100);
      expect(byType.zakat).toBe(0);
    });

    it('handles multiple entries of same type', () => {
      const entries: CharityEntry[] = [
        { id: '1', date: new Date(), type: 'sadaqah', amount: 50, currency: 'USD', isAnonymous: false, createdAt: new Date() },
        { id: '2', date: new Date(), type: 'sadaqah', amount: 75, currency: 'USD', isAnonymous: false, createdAt: new Date() },
        { id: '3', date: new Date(), type: 'sadaqah', amount: 25, currency: 'USD', isAnonymous: false, createdAt: new Date() },
      ];
      
      const total = calculateTotal(entries);
      const byType = calculateByType(entries);
      
      expect(total).toBe(150);
      expect(byType.sadaqah).toBe(150);
    });

    it('handles zero wealth for Zakat calculation', () => {
      const result = calculateZakatAmount(0);
      
      expect(result.totalWealth).toBe(0);
      expect(result.zakatDue).toBe(0);
      expect(result.meetsNisab).toBe(false);
    });

    it('stats correctly identifies zakat paid status', () => {
      const entriesWithZakat: CharityEntry[] = [
        { id: '1', date: new Date(), type: 'zakat', amount: 500, currency: 'USD', isAnonymous: false, createdAt: new Date() },
      ];
      
      const entriesWithoutZakat: CharityEntry[] = [
        { id: '1', date: new Date(), type: 'sadaqah', amount: 500, currency: 'USD', isAnonymous: false, createdAt: new Date() },
      ];
      
      const statsWithZakat = calculateStats(entriesWithZakat);
      const statsWithoutZakat = calculateStats(entriesWithoutZakat);
      
      expect(statsWithZakat.zakatPaid).toBe(true);
      expect(statsWithZakat.zakatAmount).toBe(500);
      expect(statsWithoutZakat.zakatPaid).toBe(false);
      expect(statsWithoutZakat.zakatAmount).toBe(0);
    });
  });
});
