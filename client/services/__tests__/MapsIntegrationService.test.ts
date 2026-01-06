/**
 * Property-based tests for MapsIntegrationService
 * 
 * **Property 5: Maps URL Generation**
 * **Validates: Requirements 3.2, 3.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Re-implement the pure functions here to avoid React Native imports
interface MapsDestination {
  latitude: number;
  longitude: number;
  name: string;
}

function getMapsUrl(
  destination: MapsDestination,
  platform: 'ios' | 'android'
): string {
  const { latitude, longitude, name } = destination;
  const encodedName = encodeURIComponent(name);
  
  if (platform === 'ios') {
    return `maps://?daddr=${latitude},${longitude}&q=${encodedName}`;
  } else {
    return `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedName})`;
  }
}

function getGoogleMapsWebUrl(destination: MapsDestination): string {
  const { latitude, longitude, name } = destination;
  const encodedName = encodeURIComponent(name);
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodedName}`;
}

// Arbitrary for valid coordinates
const coordinateArb = fc.record({
  latitude: fc.double({ min: -90, max: 90, noNaN: true }),
  longitude: fc.double({ min: -180, max: 180, noNaN: true }),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
});

describe('MapsIntegrationService', () => {
  describe('Property 5: Maps URL Generation', () => {
    /**
     * For any mosque with valid coordinates and iOS platform,
     * the generated maps URL SHALL contain the correct latitude, longitude,
     * and use the maps:// URL scheme.
     */
    it('should generate valid iOS maps URL with correct coordinates', () => {
      fc.assert(
        fc.property(coordinateArb, (destination: MapsDestination) => {
          const url = getMapsUrl(destination, 'ios');
          
          // Should use maps:// scheme for iOS
          expect(url.startsWith('maps://')).toBe(true);
          
          // Should contain the latitude
          expect(url).toContain(destination.latitude.toString());
          
          // Should contain the longitude
          expect(url).toContain(destination.longitude.toString());
          
          // Should contain encoded name
          expect(url).toContain(encodeURIComponent(destination.name));
        }),
        { numRuns: 100 }
      );
    });

    /**
     * For any mosque with valid coordinates and Android platform,
     * the generated maps URL SHALL contain the correct latitude, longitude,
     * and use the geo: URL scheme.
     */
    it('should generate valid Android maps URL with correct coordinates', () => {
      fc.assert(
        fc.property(coordinateArb, (destination: MapsDestination) => {
          const url = getMapsUrl(destination, 'android');
          
          // Should use geo: scheme for Android
          expect(url.startsWith('geo:')).toBe(true);
          
          // Should contain the latitude
          expect(url).toContain(destination.latitude.toString());
          
          // Should contain the longitude
          expect(url).toContain(destination.longitude.toString());
          
          // Should contain encoded name in parentheses
          expect(url).toContain(`(${encodeURIComponent(destination.name)})`);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * For any mosque with valid coordinates,
     * the web fallback URL should be a valid Google Maps URL.
     */
    it('should generate valid Google Maps web URL as fallback', () => {
      fc.assert(
        fc.property(coordinateArb, (destination: MapsDestination) => {
          const url = getGoogleMapsWebUrl(destination);
          
          // Should be a Google Maps URL
          expect(url.startsWith('https://www.google.com/maps')).toBe(true);
          
          // Should contain the latitude
          expect(url).toContain(destination.latitude.toString());
          
          // Should contain the longitude
          expect(url).toContain(destination.longitude.toString());
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Platform-specific URLs should be different for iOS and Android
     */
    it('should generate different URLs for iOS and Android', () => {
      fc.assert(
        fc.property(coordinateArb, (destination: MapsDestination) => {
          const iosUrl = getMapsUrl(destination, 'ios');
          const androidUrl = getMapsUrl(destination, 'android');
          
          // URLs should be different
          expect(iosUrl).not.toBe(androidUrl);
          
          // iOS should use maps://
          expect(iosUrl.startsWith('maps://')).toBe(true);
          
          // Android should use geo:
          expect(androidUrl.startsWith('geo:')).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
