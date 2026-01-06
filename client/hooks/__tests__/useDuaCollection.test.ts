/**
 * Property-based tests for useDuaCollection hook
 * 
 * Feature: dua-collection
 * Tests category filtering, search, and dua of the day
 */

import * as fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { getDuaOfTheDay, searchDuasInternal } from '../useDuaCollection';
import { allDuas, getDuasByCategory } from '@/data/duaData';
import { duaCategories } from '@/data/duaCategories';

describe('useDuaCollection', () => {
  /**
   * Property 1: Category Filtering Returns Only Matching Duas
   * For any category ID, filtering duas by that category returns only duas
   * with matching categoryId, and no matching duas are excluded.
   * 
   * Validates: Requirements 1.2
   */
  describe('Property 1: Category Filtering Returns Only Matching Duas', () => {
    it('all returned duas match the requested category', () => {
      duaCategories.forEach(category => {
        const duas = getDuasByCategory(category.id);
        duas.forEach(dua => {
          expect(dua.categoryId).toBe(category.id);
        });
      });
    });

    it('no matching duas are excluded', () => {
      duaCategories.forEach(category => {
        const filtered = getDuasByCategory(category.id);
        const expected = allDuas.filter(d => d.categoryId === category.id);
        expect(filtered.length).toBe(expected.length);
      });
    });

    it('property: for any category, all returned duas match and none are excluded', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: duaCategories.length - 1 }),
          (index) => {
            const category = duaCategories[index];
            const filtered = getDuasByCategory(category.id);
            
            // All returned duas match
            const allMatch = filtered.every(dua => dua.categoryId === category.id);
            
            // No matching duas excluded
            const expectedCount = allDuas.filter(d => d.categoryId === category.id).length;
            const noneExcluded = filtered.length === expectedCount;
            
            return allMatch && noneExcluded;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: Search Results Match Query
   * For any non-empty search query, all returned duas SHALL contain the query string
   * (case-insensitive) in at least one of: textAr, transliteration, translation, or category name.
   * 
   * Validates: Requirements 7.2, 7.3
   */
  describe('Property 10: Search Results Match Query', () => {
    it('search returns matching duas', () => {
      const results = searchDuasInternal('forgive', allDuas, duaCategories);
      expect(results.length).toBeGreaterThan(0);
      
      results.forEach(dua => {
        const matchesTranslation = dua.translation.toLowerCase().includes('forgive');
        const matchesTranslit = dua.transliteration.toLowerCase().includes('forgive');
        const matchesCategory = dua.categoryId === 'forgiveness'; // Category name contains 'forgive'
        expect(matchesTranslation || matchesTranslit || matchesCategory).toBe(true);
      });
    });

    it('empty query returns empty results', () => {
      const results = searchDuasInternal('', allDuas, duaCategories);
      expect(results).toEqual([]);
    });

    it('property: all search results contain the query in at least one field', () => {
      // Generate search terms from actual dua content
      const searchTerms = [
        'allah', 'lord', 'forgive', 'mercy', 'protect', 'guide',
        'praise', 'peace', 'blessing', 'travel', 'sleep'
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...searchTerms),
          (query) => {
            const results = searchDuasInternal(query, allDuas, duaCategories);
            const normalizedQuery = query.toLowerCase();
            
            // Get category names map
            const categoryNames = new Map<string, string>();
            duaCategories.forEach(cat => {
              categoryNames.set(cat.id, `${cat.titleEn.toLowerCase()} ${cat.titleAr}`);
            });
            
            return results.every(dua => {
              const inArabic = dua.textAr.includes(query);
              const inTranslit = dua.transliteration.toLowerCase().includes(normalizedQuery);
              const inTranslation = dua.translation.toLowerCase().includes(normalizedQuery);
              const inCategory = categoryNames.get(dua.categoryId)?.includes(normalizedQuery) || false;
              const inSurah = dua.surahName?.toLowerCase().includes(normalizedQuery) || false;
              const inHadith = dua.hadithSource?.toLowerCase().includes(normalizedQuery) || false;
              
              return inArabic || inTranslit || inTranslation || inCategory || inSurah || inHadith;
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('search is case-insensitive', () => {
      const lowerResults = searchDuasInternal('allah', allDuas, duaCategories);
      const upperResults = searchDuasInternal('ALLAH', allDuas, duaCategories);
      const mixedResults = searchDuasInternal('Allah', allDuas, duaCategories);
      
      expect(lowerResults.length).toBe(upperResults.length);
      expect(lowerResults.length).toBe(mixedResults.length);
    });
  });

  /**
   * Property 11: Dua of the Day Determinism
   * For any date, calling getDuaOfTheDay multiple times with the same date
   * SHALL return the same dua. Different dates MAY return different duas.
   * 
   * Validates: Requirements 8.2, 8.4
   */
  describe('Property 11: Dua of the Day Determinism', () => {
    it('same date returns same dua', () => {
      const date = new Date(2025, 0, 5); // Fixed date
      const dua1 = getDuaOfTheDay(date);
      const dua2 = getDuaOfTheDay(date);
      const dua3 = getDuaOfTheDay(date);
      
      expect(dua1.id).toBe(dua2.id);
      expect(dua2.id).toBe(dua3.id);
    });

    it('property: for any date, multiple calls return the same dua', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) }),
          (date) => {
            const dua1 = getDuaOfTheDay(date);
            const dua2 = getDuaOfTheDay(date);
            return dua1.id === dua2.id;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('different dates can return different duas', () => {
      // Test a range of dates to ensure variety
      const dates = [
        new Date(2025, 0, 1),
        new Date(2025, 0, 2),
        new Date(2025, 0, 3),
        new Date(2025, 0, 4),
        new Date(2025, 0, 5),
      ];
      
      const duaIds = dates.map(d => getDuaOfTheDay(d).id);
      const uniqueIds = new Set(duaIds);
      
      // At least some variety expected (not all same)
      expect(uniqueIds.size).toBeGreaterThan(1);
    });

    it('returns a valid dua from the collection', () => {
      const dua = getDuaOfTheDay();
      expect(dua).toBeDefined();
      expect(dua.id).toBeTruthy();
      expect(allDuas.some(d => d.id === dua.id)).toBe(true);
    });
  });
});
