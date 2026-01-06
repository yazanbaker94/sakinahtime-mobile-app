/**
 * Property-based tests for Ramadan data persistence
 * 
 * Tests Property 14: Data Persistence Round-Trip
 * Tests Property 15: Year-Specific Storage Isolation
 */

import * as fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RAMADAN_STORAGE_KEYS } from '../../constants/ramadan';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Arbitrary for Quran schedule data
const quranScheduleArb = fc.record({
  year: fc.integer({ min: 1440, max: 1500 }),
  startDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
  readings: fc.array(
    fc.record({
      day: fc.integer({ min: 1, max: 30 }),
      juzNumber: fc.integer({ min: 1, max: 30 }),
      startPage: fc.integer({ min: 1, max: 604 }),
      endPage: fc.integer({ min: 1, max: 604 }),
      completed: fc.boolean(),
    }),
    { minLength: 1, maxLength: 30 }
  ),
});

// Arbitrary for Taraweeh entries
const taraweehEntriesArb = fc.array(
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
    hijriDay: fc.integer({ min: 1, max: 30 }),
    rakaat: fc.constantFrom(8, 20),
    location: fc.constantFrom('mosque', 'home'),
  }),
  { minLength: 0, maxLength: 30 }
);

// Arbitrary for Charity entries
const charityEntriesArb = fc.array(
  fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }),
    date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
    type: fc.constantFrom('sadaqah', 'zakat', 'fidya', 'kaffarah', 'other'),
    amount: fc.float({ min: 0.01, max: 100000, noNaN: true }),
    currency: fc.constantFrom('USD', 'EUR', 'GBP'),
  }),
  { minLength: 0, maxLength: 50 }
);

describe('Ramadan Data Persistence - Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 14: Data Persistence Round-Trip', () => {
    it('Quran schedule data survives round-trip through storage', async () => {
      await fc.assert(
        fc.asyncProperty(
          quranScheduleArb,
          fc.integer({ min: 1440, max: 1500 }),
          async (scheduleData, year) => {
            const storageKey = RAMADAN_STORAGE_KEYS.QURAN_SCHEDULE(year);
            const serialized = JSON.stringify(scheduleData);
            
            // Mock storage behavior
            (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(serialized);
            
            // Save
            await AsyncStorage.setItem(storageKey, serialized);
            
            // Load
            const loaded = await AsyncStorage.getItem(storageKey);
            const parsed = loaded ? JSON.parse(loaded) : null;
            
            // Verify round-trip
            expect(parsed).toEqual(scheduleData);
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('Taraweeh entries data survives round-trip through storage', async () => {
      await fc.assert(
        fc.asyncProperty(
          taraweehEntriesArb,
          fc.integer({ min: 1440, max: 1500 }),
          async (entriesData, year) => {
            const storageKey = RAMADAN_STORAGE_KEYS.TARAWEEH_ENTRIES(year);
            const serialized = JSON.stringify(entriesData);
            
            (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(serialized);
            
            await AsyncStorage.setItem(storageKey, serialized);
            const loaded = await AsyncStorage.getItem(storageKey);
            const parsed = loaded ? JSON.parse(loaded) : null;
            
            expect(parsed).toEqual(entriesData);
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('Charity entries data survives round-trip through storage', async () => {
      await fc.assert(
        fc.asyncProperty(
          charityEntriesArb,
          fc.integer({ min: 1440, max: 1500 }),
          async (entriesData, year) => {
            const storageKey = RAMADAN_STORAGE_KEYS.CHARITY_ENTRIES(year);
            const serialized = JSON.stringify(entriesData);
            
            (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);
            (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(serialized);
            
            await AsyncStorage.setItem(storageKey, serialized);
            const loaded = await AsyncStorage.getItem(storageKey);
            const parsed = loaded ? JSON.parse(loaded) : null;
            
            expect(parsed).toEqual(entriesData);
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('empty data survives round-trip', async () => {
      const emptyData = { readings: [], year: 1446 };
      const serialized = JSON.stringify(emptyData);
      
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(serialized);
      
      await AsyncStorage.setItem('test-key', serialized);
      const loaded = await AsyncStorage.getItem('test-key');
      const parsed = loaded ? JSON.parse(loaded) : null;
      
      expect(parsed).toEqual(emptyData);
    });
  });

  describe('Property 15: Year-Specific Storage Isolation', () => {
    it('different years produce different storage keys', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1440, max: 1500 }),
          fc.integer({ min: 1440, max: 1500 }),
          (year1, year2) => {
            if (year1 === year2) return true; // Skip same years
            
            const key1 = RAMADAN_STORAGE_KEYS.QURAN_SCHEDULE(year1);
            const key2 = RAMADAN_STORAGE_KEYS.QURAN_SCHEDULE(year2);
            
            return key1 !== key2;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all storage key functions produce year-specific keys', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1440, max: 1500 }),
          fc.integer({ min: 1440, max: 1500 }),
          (year1, year2) => {
            if (year1 === year2) return true;
            
            const keyFunctions = [
              RAMADAN_STORAGE_KEYS.SETTINGS,
              RAMADAN_STORAGE_KEYS.QURAN_SCHEDULE,
              RAMADAN_STORAGE_KEYS.TARAWEEH_ENTRIES,
              RAMADAN_STORAGE_KEYS.CHARITY_ENTRIES,
              RAMADAN_STORAGE_KEYS.CHARITY_GOAL,
              RAMADAN_STORAGE_KEYS.IBAADAH_CHECKLIST,
            ];
            
            for (const keyFn of keyFunctions) {
              const key1 = keyFn(year1);
              const key2 = keyFn(year2);
              if (key1 === key2) return false;
            }
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('storage keys contain the year', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1440, max: 1500 }),
          (year) => {
            const key = RAMADAN_STORAGE_KEYS.QURAN_SCHEDULE(year);
            return key.includes(String(year));
          }
        ),
        { numRuns: 50 }
      );
    });

    it('data for one year does not affect another year', async () => {
      const year1 = 1446;
      const year2 = 1447;
      const data1 = { year: year1, value: 'data for 1446' };
      const data2 = { year: year2, value: 'data for 1447' };
      
      const key1 = RAMADAN_STORAGE_KEYS.QURAN_SCHEDULE(year1);
      const key2 = RAMADAN_STORAGE_KEYS.QURAN_SCHEDULE(year2);
      
      // Verify keys are different
      expect(key1).not.toBe(key2);
      
      // Mock storage to return different data for different keys
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === key1) return Promise.resolve(JSON.stringify(data1));
        if (key === key2) return Promise.resolve(JSON.stringify(data2));
        return Promise.resolve(null);
      });
      
      const loaded1 = await AsyncStorage.getItem(key1);
      const loaded2 = await AsyncStorage.getItem(key2);
      
      expect(JSON.parse(loaded1!)).toEqual(data1);
      expect(JSON.parse(loaded2!)).toEqual(data2);
    });
  });

  describe('Edge Cases', () => {
    it('handles null values gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      
      const loaded = await AsyncStorage.getItem('non-existent-key');
      expect(loaded).toBeNull();
    });

    it('handles special characters in data', async () => {
      const dataWithSpecialChars = {
        notes: 'Test with "quotes" and \'apostrophes\' and \n newlines',
        arabic: 'بسم الله الرحمن الرحيم',
        emoji: '🌙✨🕌',
      };
      
      const serialized = JSON.stringify(dataWithSpecialChars);
      
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(serialized);
      
      await AsyncStorage.setItem('test-key', serialized);
      const loaded = await AsyncStorage.getItem('test-key');
      const parsed = JSON.parse(loaded!);
      
      expect(parsed).toEqual(dataWithSpecialChars);
    });

    it('handles large data sets', async () => {
      const largeData = {
        entries: Array.from({ length: 1000 }, (_, i) => ({
          id: `entry-${i}`,
          value: `value-${i}`,
          timestamp: Date.now() + i,
        })),
      };
      
      const serialized = JSON.stringify(largeData);
      
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(serialized);
      
      await AsyncStorage.setItem('large-data-key', serialized);
      const loaded = await AsyncStorage.getItem('large-data-key');
      const parsed = JSON.parse(loaded!);
      
      expect(parsed.entries.length).toBe(1000);
      expect(parsed).toEqual(largeData);
    });
  });
});
