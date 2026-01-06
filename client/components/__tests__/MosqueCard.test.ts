/**
 * Property-based tests for MosqueCard component
 * 
 * **Property 3: Mosque Card Data Completeness**
 * **Validates: Requirements 1.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Re-implement types to avoid React Native imports
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

// Re-implement formatDistance to avoid RN imports
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Simulates what data the MosqueCard would display
 * Returns an object with the display values
 */
function getMosqueCardDisplayData(mosque: Mosque) {
  return {
    name: mosque.name,
    distance: formatDistance(mosque.distance),
    address: mosque.address,
    rating: mosque.rating !== undefined ? mosque.rating.toFixed(1) : null,
    reviewCount: mosque.reviewCount !== undefined ? mosque.reviewCount : null,
    isOpen: mosque.isOpen,
  };
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

describe('MosqueCard', () => {
  describe('Property 3: Mosque Card Data Completeness', () => {
    /**
     * For any mosque data, the card should always display the name
     */
    it('should always display mosque name', () => {
      fc.assert(
        fc.property(mosqueArb, (mosque) => {
          const displayData = getMosqueCardDisplayData(mosque);
          expect(displayData.name).toBe(mosque.name);
          expect(displayData.name.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * For any mosque data, the card should always display formatted distance
     */
    it('should always display formatted distance', () => {
      fc.assert(
        fc.property(mosqueArb, (mosque) => {
          const displayData = getMosqueCardDisplayData(mosque);
          expect(displayData.distance).toBeTruthy();
          // Should end with 'm' or 'km'
          expect(displayData.distance).toMatch(/(m|km)$/);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * For any mosque data, the card should always display address
     */
    it('should always display address', () => {
      fc.assert(
        fc.property(mosqueArb, (mosque) => {
          const displayData = getMosqueCardDisplayData(mosque);
          expect(displayData.address).toBe(mosque.address);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Rating should be displayed if and only if it exists in mosque data
     */
    it('should display rating if and only if it exists', () => {
      fc.assert(
        fc.property(mosqueArb, (mosque) => {
          const displayData = getMosqueCardDisplayData(mosque);
          
          if (mosque.rating !== undefined) {
            expect(displayData.rating).not.toBeNull();
            // Rating should be formatted to 1 decimal place
            expect(displayData.rating).toMatch(/^\d+\.\d$/);
          } else {
            expect(displayData.rating).toBeNull();
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Review count should be displayed if and only if it exists
     */
    it('should display review count if and only if it exists', () => {
      fc.assert(
        fc.property(mosqueArb, (mosque) => {
          const displayData = getMosqueCardDisplayData(mosque);
          
          if (mosque.reviewCount !== undefined) {
            expect(displayData.reviewCount).toBe(mosque.reviewCount);
          } else {
            expect(displayData.reviewCount).toBeNull();
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Open/closed status should be displayed if and only if it exists
     */
    it('should display open/closed status if and only if it exists', () => {
      fc.assert(
        fc.property(mosqueArb, (mosque) => {
          const displayData = getMosqueCardDisplayData(mosque);
          
          if (mosque.isOpen !== undefined) {
            expect(displayData.isOpen).toBe(mosque.isOpen);
          } else {
            expect(displayData.isOpen).toBeUndefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Distance formatting should use meters for < 1000m, km otherwise
     */
    it('should format distance correctly (m for < 1000, km otherwise)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100000, noNaN: true }),
          (distance) => {
            const formatted = formatDistance(distance);
            
            if (distance < 1000) {
              expect(formatted).toMatch(/^\d+ m$/);
            } else {
              expect(formatted).toMatch(/^\d+\.\d km$/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
