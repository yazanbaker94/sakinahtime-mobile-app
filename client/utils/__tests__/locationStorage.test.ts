import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getLocationMode,
  setLocationMode,
  getManualLocation,
  setManualLocation,
  clearManualLocation,
  getRecentLocations,
  addRecentLocation,
  clearRecentLocations,
} from '../locationStorage';
import { ManualLocation, LOCATION_STORAGE_KEYS, MAX_RECENT_LOCATIONS } from '@/types/location';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

const mockAsyncStorage = AsyncStorage as unknown as {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
};

// Generator for valid ManualLocation
const manualLocationArb = fc.record({
  city: fc.string({ minLength: 1, maxLength: 100 }),
  country: fc.string({ minLength: 1, maxLength: 100 }),
  latitude: fc.double({ min: -90, max: 90, noNaN: true }),
  longitude: fc.double({ min: -180, max: 180, noNaN: true }),
  timezone: fc.stringMatching(/^[A-Za-z]+\/[A-Za-z_]+$/),
});

describe('Location Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Location Mode', () => {
    /**
     * Property 1: Location Mode Switching
     * For any location mode (GPS or manual), when the mode is changed,
     * the stored mode should match the set mode.
     * 
     * Validates: Requirements 1.2, 1.3
     */
    it('Property 1: location mode round-trip', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('gps', 'manual'),
          async (mode) => {
            // Setup mock to return what was set
            let storedValue: string | null = null;
            mockAsyncStorage.setItem.mockImplementation(async (key: string, value: string) => {
              if (key === LOCATION_STORAGE_KEYS.LOCATION_MODE) {
                storedValue = value;
              }
            });
            mockAsyncStorage.getItem.mockImplementation(async (key: string) => {
              if (key === LOCATION_STORAGE_KEYS.LOCATION_MODE) {
                return storedValue;
              }
              return null;
            });

            // Set mode
            await setLocationMode(mode as 'gps' | 'manual');
            
            // Get mode
            const retrieved = await getLocationMode();
            
            // Should match
            expect(retrieved).toBe(mode);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('defaults to gps when no mode stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      const mode = await getLocationMode();
      expect(mode).toBe('gps');
    });

    it('defaults to gps on error', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      const mode = await getLocationMode();
      expect(mode).toBe('gps');
    });
  });

  describe('Manual Location', () => {
    /**
     * Property 2: Location Persistence Round-Trip
     * For any valid ManualLocation object, storing and then loading
     * should produce an equivalent location.
     * 
     * Validates: Requirements 1.4, 3.1, 3.2, 6.4
     */
    it('Property 2: manual location round-trip', async () => {
      await fc.assert(
        fc.asyncProperty(
          manualLocationArb,
          async (location) => {
            // Setup mock
            let storedValue: string | null = null;
            mockAsyncStorage.setItem.mockImplementation(async (key: string, value: string) => {
              if (key === LOCATION_STORAGE_KEYS.MANUAL_LOCATION) {
                storedValue = value;
              }
            });
            mockAsyncStorage.getItem.mockImplementation(async (key: string) => {
              if (key === LOCATION_STORAGE_KEYS.MANUAL_LOCATION) {
                return storedValue;
              }
              return null;
            });

            // Set location
            await setManualLocation(location as ManualLocation);
            
            // Get location
            const retrieved = await getManualLocation();
            
            // Should match
            expect(retrieved).not.toBeNull();
            expect(retrieved?.city).toBe(location.city);
            expect(retrieved?.country).toBe(location.country);
            // Use toBeCloseTo for floating point to handle -0 vs 0
            expect(retrieved?.latitude).toBeCloseTo(location.latitude, 10);
            expect(retrieved?.longitude).toBeCloseTo(location.longitude, 10);
            expect(retrieved?.timezone).toBe(location.timezone);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns null when no location stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      const location = await getManualLocation();
      expect(location).toBeNull();
    });

    it('returns null for invalid stored data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json');
      const location = await getManualLocation();
      expect(location).toBeNull();
    });

    it('clears manual location', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);
      await clearManualLocation();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(LOCATION_STORAGE_KEYS.MANUAL_LOCATION);
    });
  });

  describe('Recent Locations', () => {
    /**
     * Property 5: Recent Locations Limit
     * For any sequence of city selections, the recent locations list
     * SHALL never contain more than 5 items.
     * 
     * Validates: Requirements 6.1
     */
    it('Property 5: recent locations never exceed limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(manualLocationArb, { minLength: 1, maxLength: 20 }),
          async (locations) => {
            // Setup mock with in-memory storage
            let storedRecent: ManualLocation[] = [];
            mockAsyncStorage.setItem.mockImplementation(async (key: string, value: string) => {
              if (key === LOCATION_STORAGE_KEYS.RECENT_LOCATIONS) {
                storedRecent = JSON.parse(value);
              }
            });
            mockAsyncStorage.getItem.mockImplementation(async (key: string) => {
              if (key === LOCATION_STORAGE_KEYS.RECENT_LOCATIONS) {
                return storedRecent.length > 0 ? JSON.stringify(storedRecent) : null;
              }
              return null;
            });

            // Add all locations
            for (const loc of locations) {
              await addRecentLocation(loc as ManualLocation);
            }

            // Get recent
            const recent = await getRecentLocations();
            
            // Should never exceed MAX_RECENT_LOCATIONS
            expect(recent.length).toBeLessThanOrEqual(MAX_RECENT_LOCATIONS);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('most recent location is first', async () => {
      const locations: ManualLocation[] = [
        { city: 'City1', country: 'Country1', latitude: 1, longitude: 1, timezone: 'A/B' },
        { city: 'City2', country: 'Country2', latitude: 2, longitude: 2, timezone: 'C/D' },
        { city: 'City3', country: 'Country3', latitude: 3, longitude: 3, timezone: 'E/F' },
      ];

      let storedRecent: ManualLocation[] = [];
      mockAsyncStorage.setItem.mockImplementation(async (key: string, value: string) => {
        if (key === LOCATION_STORAGE_KEYS.RECENT_LOCATIONS) {
          storedRecent = JSON.parse(value);
        }
      });
      mockAsyncStorage.getItem.mockImplementation(async (key: string) => {
        if (key === LOCATION_STORAGE_KEYS.RECENT_LOCATIONS) {
          return storedRecent.length > 0 ? JSON.stringify(storedRecent) : null;
        }
        return null;
      });

      for (const loc of locations) {
        await addRecentLocation(loc);
      }

      const recent = await getRecentLocations();
      expect(recent[0].city).toBe('City3'); // Most recent first
      expect(recent[1].city).toBe('City2');
      expect(recent[2].city).toBe('City1');
    });

    it('removes duplicates and moves to front', async () => {
      const loc1: ManualLocation = { city: 'City1', country: 'Country1', latitude: 1, longitude: 1, timezone: 'A/B' };
      const loc2: ManualLocation = { city: 'City2', country: 'Country2', latitude: 2, longitude: 2, timezone: 'C/D' };

      let storedRecent: ManualLocation[] = [];
      mockAsyncStorage.setItem.mockImplementation(async (key: string, value: string) => {
        if (key === LOCATION_STORAGE_KEYS.RECENT_LOCATIONS) {
          storedRecent = JSON.parse(value);
        }
      });
      mockAsyncStorage.getItem.mockImplementation(async (key: string) => {
        if (key === LOCATION_STORAGE_KEYS.RECENT_LOCATIONS) {
          return storedRecent.length > 0 ? JSON.stringify(storedRecent) : null;
        }
        return null;
      });

      await addRecentLocation(loc1);
      await addRecentLocation(loc2);
      await addRecentLocation(loc1); // Add loc1 again

      const recent = await getRecentLocations();
      expect(recent.length).toBe(2);
      expect(recent[0].city).toBe('City1'); // loc1 moved to front
      expect(recent[1].city).toBe('City2');
    });

    /**
     * Property 6: Recent Location Selection
     * For any recent location selected by the user, the current manual location
     * SHALL be updated to match that recent location exactly.
     * 
     * Validates: Requirements 6.3
     */
    it('Property 6: selecting recent location updates current location exactly', async () => {
      await fc.assert(
        fc.asyncProperty(
          manualLocationArb,
          async (location) => {
            // Setup mock
            let storedManual: ManualLocation | null = null;
            let storedRecent: ManualLocation[] = [];
            
            mockAsyncStorage.setItem.mockImplementation(async (key: string, value: string) => {
              if (key === LOCATION_STORAGE_KEYS.MANUAL_LOCATION) {
                storedManual = JSON.parse(value);
              }
              if (key === LOCATION_STORAGE_KEYS.RECENT_LOCATIONS) {
                storedRecent = JSON.parse(value);
              }
            });
            mockAsyncStorage.getItem.mockImplementation(async (key: string) => {
              if (key === LOCATION_STORAGE_KEYS.MANUAL_LOCATION) {
                return storedManual ? JSON.stringify(storedManual) : null;
              }
              if (key === LOCATION_STORAGE_KEYS.RECENT_LOCATIONS) {
                return storedRecent.length > 0 ? JSON.stringify(storedRecent) : null;
              }
              return null;
            });

            // Add location to recent
            await addRecentLocation(location as ManualLocation);
            
            // Simulate selecting from recent (which calls setManualLocation)
            await setManualLocation(location as ManualLocation);
            
            // Get the stored manual location
            const retrieved = await getManualLocation();
            
            // Should match exactly
            expect(retrieved).not.toBeNull();
            expect(retrieved?.city).toBe(location.city);
            expect(retrieved?.country).toBe(location.country);
            expect(retrieved?.latitude).toBeCloseTo(location.latitude, 10);
            expect(retrieved?.longitude).toBeCloseTo(location.longitude, 10);
            expect(retrieved?.timezone).toBe(location.timezone);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
