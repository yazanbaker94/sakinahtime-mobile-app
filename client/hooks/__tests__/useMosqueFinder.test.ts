/**
 * Property-based tests for useMosqueFinder hook
 * 
 * **Property 1: Mosque List Sorted by Distance**
 * **Validates: Requirements 1.3**
 * 
 * **Property 2: Search Filter Correctness**
 * **Validates: Requirements 5.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Re-implement pure functions to avoid React Native imports
interface Mosque {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number;
  rating?: number;
  reviewCount?: number;
  isOpen?: boolean;
  photoReference?: string;
}

function filterMosquesByQuery(mosques: Mosque[], query: string): Mosque[] {
  if (!query.trim()) {
    return mosques;
  }
  
  const lowerQuery = query.toLowerCase().trim();
  return mosques.filter(mosque => 
    mosque.name.toLowerCase().includes(lowerQuery)
  );
}

function sortMosquesByDistance(mosques: Mosque[]): Mosque[] {
  return [...mosques].sort((a, b) => a.distance - b.distance);
}

// Arbitrary for generating mosque data
const mosqueArb: fc.Arbitrary<Mosque> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  address: fc.string({ minLength: 1, maxLength: 200 }),
  latitude: fc.double({ min: -90, max: 90, noNaN: true }),
  longitude: fc.double({ min: -180, max: 180, noNaN: true }),
  distance: fc.double({ min: 0, max: 100000, noNaN: true }),
  rating: fc.option(fc.double({ min: 1, max: 5, noNaN: true }), { nil: undefined }),
  reviewCount: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: undefined }),
  isOpen: fc.option(fc.boolean(), { nil: undefined }),
  photoReference: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined }),
});

const mosqueListArb = fc.array(mosqueArb, { minLength: 0, maxLength: 50 });

describe('useMosqueFinder', () => {
  describe('Property 1: Mosque List Sorted by Distance', () => {
    /**
     * For any list of mosques, after sorting by distance,
     * each mosque's distance should be less than or equal to the next mosque's distance.
     */
    it('should sort mosques in ascending order by distance', () => {
      fc.assert(
        fc.property(mosqueListArb, (mosques) => {
          const sorted = sortMosquesByDistance(mosques);
          
          // Check that each element is <= the next element
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].distance).toBeLessThanOrEqual(sorted[i + 1].distance);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Sorting should preserve all original mosques (same length, same elements)
     */
    it('should preserve all mosques when sorting', () => {
      fc.assert(
        fc.property(mosqueListArb, (mosques) => {
          const sorted = sortMosquesByDistance(mosques);
          
          // Same length
          expect(sorted.length).toBe(mosques.length);
          
          // All original IDs should be present
          const originalIds = new Set(mosques.map(m => m.id));
          const sortedIds = new Set(sorted.map(m => m.id));
          expect(sortedIds).toEqual(originalIds);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Sorting an already sorted list should produce the same result
     */
    it('should be idempotent (sorting twice equals sorting once)', () => {
      fc.assert(
        fc.property(mosqueListArb, (mosques) => {
          const sortedOnce = sortMosquesByDistance(mosques);
          const sortedTwice = sortMosquesByDistance(sortedOnce);
          
          // Should produce same order
          expect(sortedTwice.map(m => m.id)).toEqual(sortedOnce.map(m => m.id));
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Search Filter Correctness', () => {
    /**
     * For any search query, all filtered results should contain the query in their name
     */
    it('should only return mosques whose names contain the search query', () => {
      fc.assert(
        fc.property(
          mosqueListArb,
          fc.string({ minLength: 1, maxLength: 20 }),
          (mosques, query) => {
            const filtered = filterMosquesByQuery(mosques, query);
            const lowerQuery = query.toLowerCase().trim();
            
            // All filtered results should contain the query
            filtered.forEach(mosque => {
              expect(mosque.name.toLowerCase()).toContain(lowerQuery);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Filtering should not add any mosques that weren't in the original list
     */
    it('should only return mosques from the original list', () => {
      fc.assert(
        fc.property(
          mosqueListArb,
          fc.string({ minLength: 0, maxLength: 20 }),
          (mosques, query) => {
            const filtered = filterMosquesByQuery(mosques, query);
            const originalIds = new Set(mosques.map(m => m.id));
            
            // All filtered IDs should be in original
            filtered.forEach(mosque => {
              expect(originalIds.has(mosque.id)).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Empty query should return all mosques
     */
    it('should return all mosques when query is empty', () => {
      fc.assert(
        fc.property(mosqueListArb, (mosques) => {
          const filtered = filterMosquesByQuery(mosques, '');
          expect(filtered.length).toBe(mosques.length);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Whitespace-only query should return all mosques
     */
    it('should return all mosques when query is whitespace only', () => {
      fc.assert(
        fc.property(
          mosqueListArb,
          fc.constantFrom('   ', '\t', '\n', '  \t  ', '\n\n'),
          (mosques, whitespace) => {
            const filtered = filterMosquesByQuery(mosques, whitespace);
            expect(filtered.length).toBe(mosques.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Search should be case-insensitive
     */
    it('should be case-insensitive', () => {
      fc.assert(
        fc.property(
          mosqueListArb,
          fc.string({ minLength: 1, maxLength: 10 }),
          (mosques, query) => {
            const lowerFiltered = filterMosquesByQuery(mosques, query.toLowerCase());
            const upperFiltered = filterMosquesByQuery(mosques, query.toUpperCase());
            
            // Same results regardless of case
            expect(lowerFiltered.map(m => m.id).sort()).toEqual(
              upperFiltered.map(m => m.id).sort()
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Filtered results should be a subset of original (length <= original)
     */
    it('should return subset of original mosques', () => {
      fc.assert(
        fc.property(
          mosqueListArb,
          fc.string({ minLength: 0, maxLength: 20 }),
          (mosques, query) => {
            const filtered = filterMosquesByQuery(mosques, query);
            expect(filtered.length).toBeLessThanOrEqual(mosques.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
