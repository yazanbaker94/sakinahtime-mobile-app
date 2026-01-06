/**
 * Tests for MosqueApiService using OpenStreetMap Overpass API
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Re-implement types and functions to avoid React Native imports
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

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    'name:en'?: string;
    'name:ar'?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
    'addr:postcode'?: string;
    'addr:full'?: string;
    phone?: string;
    website?: string;
    opening_hours?: string;
  };
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function buildAddress(tags?: OverpassElement['tags']): string {
  if (!tags) return 'Address not available';
  
  if (tags['addr:full']) {
    return tags['addr:full'];
  }
  
  const parts: string[] = [];
  
  if (tags['addr:housenumber'] && tags['addr:street']) {
    parts.push(`${tags['addr:housenumber']} ${tags['addr:street']}`);
  } else if (tags['addr:street']) {
    parts.push(tags['addr:street']);
  }
  
  if (tags['addr:city']) {
    parts.push(tags['addr:city']);
  }
  
  if (tags['addr:postcode']) {
    parts.push(tags['addr:postcode']);
  }
  
  return parts.length > 0 ? parts.join(', ') : 'Address not available';
}

function getMosqueName(tags?: OverpassElement['tags']): string {
  if (!tags) return 'Mosque';
  return tags['name:en'] || tags.name || tags['name:ar'] || 'Mosque';
}

function transformOsmToMosque(
  element: OverpassElement,
  userLat: number,
  userLon: number
): Mosque {
  const lat = element.lat ?? element.center?.lat ?? 0;
  const lon = element.lon ?? element.center?.lon ?? 0;
  
  const distance = calculateDistance(userLat, userLon, lat, lon);

  return {
    id: `osm-${element.type}-${element.id}`,
    name: getMosqueName(element.tags),
    address: buildAddress(element.tags),
    latitude: lat,
    longitude: lon,
    distance,
    rating: undefined,
    reviewCount: undefined,
    isOpen: undefined,
    photoReference: undefined,
  };
}

describe('MosqueApiService', () => {
  describe('transformOsmToMosque', () => {
    it('should correctly transform OSM element id to mosque id', () => {
      const element: OverpassElement = {
        type: 'node',
        id: 12345,
        lat: 40.7128,
        lon: -74.006,
        tags: { name: 'Test Mosque' },
      };
      
      const mosque = transformOsmToMosque(element, 40.71, -74.0);
      expect(mosque.id).toBe('osm-node-12345');
    });

    it('should correctly transform name from tags', () => {
      const element: OverpassElement = {
        type: 'node',
        id: 1,
        lat: 40.7128,
        lon: -74.006,
        tags: { name: 'Al-Noor Mosque' },
      };
      
      const mosque = transformOsmToMosque(element, 40.71, -74.0);
      expect(mosque.name).toBe('Al-Noor Mosque');
    });

    it('should prefer English name over default name', () => {
      const element: OverpassElement = {
        type: 'node',
        id: 1,
        lat: 40.7128,
        lon: -74.006,
        tags: { 
          name: 'مسجد النور',
          'name:en': 'Al-Noor Mosque',
          'name:ar': 'مسجد النور',
        },
      };
      
      const mosque = transformOsmToMosque(element, 40.71, -74.0);
      expect(mosque.name).toBe('Al-Noor Mosque');
    });

    it('should use default name "Mosque" when no name tags exist', () => {
      const element: OverpassElement = {
        type: 'node',
        id: 1,
        lat: 40.7128,
        lon: -74.006,
      };
      
      const mosque = transformOsmToMosque(element, 40.71, -74.0);
      expect(mosque.name).toBe('Mosque');
    });

    it('should build address from street and city', () => {
      const element: OverpassElement = {
        type: 'node',
        id: 1,
        lat: 40.7128,
        lon: -74.006,
        tags: { 
          name: 'Test Mosque',
          'addr:housenumber': '123',
          'addr:street': 'Main Street',
          'addr:city': 'New York',
        },
      };
      
      const mosque = transformOsmToMosque(element, 40.71, -74.0);
      expect(mosque.address).toBe('123 Main Street, New York');
    });

    it('should use full address when available', () => {
      const element: OverpassElement = {
        type: 'node',
        id: 1,
        lat: 40.7128,
        lon: -74.006,
        tags: { 
          name: 'Test Mosque',
          'addr:full': '123 Main Street, New York, NY 10001',
        },
      };
      
      const mosque = transformOsmToMosque(element, 40.71, -74.0);
      expect(mosque.address).toBe('123 Main Street, New York, NY 10001');
    });

    it('should correctly transform coordinates from node', () => {
      const element: OverpassElement = {
        type: 'node',
        id: 1,
        lat: 40.7128,
        lon: -74.006,
        tags: { name: 'Test' },
      };
      
      const mosque = transformOsmToMosque(element, 40.71, -74.0);
      expect(mosque.latitude).toBe(40.7128);
      expect(mosque.longitude).toBe(-74.006);
    });

    it('should correctly transform coordinates from way center', () => {
      const element: OverpassElement = {
        type: 'way',
        id: 1,
        center: { lat: 40.7128, lon: -74.006 },
        tags: { name: 'Test' },
      };
      
      const mosque = transformOsmToMosque(element, 40.71, -74.0);
      expect(mosque.latitude).toBe(40.7128);
      expect(mosque.longitude).toBe(-74.006);
    });

    it('should calculate distance correctly', () => {
      const element: OverpassElement = {
        type: 'node',
        id: 1,
        lat: 40.7128,
        lon: -74.006,
        tags: { name: 'Test' },
      };
      
      const mosque = transformOsmToMosque(element, 40.7128, -74.006);
      expect(mosque.distance).toBe(0);
    });
  });

  describe('calculateDistance', () => {
    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(40.7128, -74.006, 40.7128, -74.006);
      expect(distance).toBe(0);
    });

    it('should always return non-negative distance', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          (lat1, lon1, lat2, lon2) => {
            const distance = calculateDistance(lat1, lon1, lat2, lon2);
            expect(distance).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be symmetric (distance A to B equals B to A)', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          (lat1, lon1, lat2, lon2) => {
            const distanceAB = calculateDistance(lat1, lon1, lat2, lon2);
            const distanceBA = calculateDistance(lat2, lon2, lat1, lon1);
            expect(Math.abs(distanceAB - distanceBA)).toBeLessThan(0.001);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate reasonable distances for known coordinates', () => {
      // NYC to LA is approximately 3,940 km
      const nycToLa = calculateDistance(40.7128, -74.006, 34.0522, -118.2437);
      expect(nycToLa).toBeGreaterThan(3900000); // > 3900 km
      expect(nycToLa).toBeLessThan(4000000); // < 4000 km
    });
  });

  describe('buildAddress', () => {
    it('should return "Address not available" for undefined tags', () => {
      expect(buildAddress(undefined)).toBe('Address not available');
    });

    it('should return "Address not available" for empty tags', () => {
      expect(buildAddress({})).toBe('Address not available');
    });

    it('should use full address when available', () => {
      const tags = { 'addr:full': '123 Main St, City, State 12345' };
      expect(buildAddress(tags)).toBe('123 Main St, City, State 12345');
    });

    it('should build address from components', () => {
      const tags = {
        'addr:housenumber': '123',
        'addr:street': 'Main Street',
        'addr:city': 'New York',
        'addr:postcode': '10001',
      };
      expect(buildAddress(tags)).toBe('123 Main Street, New York, 10001');
    });
  });

  describe('getMosqueName', () => {
    it('should return "Mosque" for undefined tags', () => {
      expect(getMosqueName(undefined)).toBe('Mosque');
    });

    it('should prefer name:en over name', () => {
      const tags = { name: 'مسجد', 'name:en': 'Mosque' };
      expect(getMosqueName(tags)).toBe('Mosque');
    });

    it('should fall back to name when name:en is not available', () => {
      const tags = { name: 'Al-Noor Mosque' };
      expect(getMosqueName(tags)).toBe('Al-Noor Mosque');
    });

    it('should fall back to name:ar when others are not available', () => {
      const tags = { 'name:ar': 'مسجد النور' };
      expect(getMosqueName(tags)).toBe('مسجد النور');
    });
  });
});
