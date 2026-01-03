/**
 * Property-Based Tests for VideoAudioService
 * 
 * **Property 3: Audio URL Construction**
 * *For any* valid surah, ayah, and reciter combination, the constructed everyayah.com URL 
 * SHALL follow the format `https://everyayah.com/data/{reciterDirectory}/{surah:03d}{ayah:03d}.mp3`.
 * 
 * **Validates: Requirements 3.2**
 * 
 * Feature: quran-video-generator, Property 3: Audio URL Construction
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  buildAudioUrl,
  getReciterDirectory,
  getReciterById,
  getAudioCacheKey,
  RECITERS,
} from '../VideoAudioService';

// Mock dependencies for unit tests
vi.mock('expo-file-system/legacy', () => ({
  cacheDirectory: '/mock/cache/',
  downloadAsync: vi.fn(),
  deleteAsync: vi.fn(),
  writeAsStringAsync: vi.fn(),
}));

vi.mock('../CacheService', () => ({
  cacheService: {
    getCacheDir: () => '/mock/cache/video_generator/',
    get: vi.fn(),
    set: vi.fn(),
    exists: vi.fn(),
  },
}));

vi.mock('../ffmpegService', () => ({
  ffmpegService: {
    getAudioDuration: vi.fn().mockResolvedValue(5.0),
    execute: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('VideoAudioService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 3: Audio URL Construction', () => {
    /**
     * Property: For any valid surah (1-114), ayah (1-286), and reciter,
     * the URL SHALL follow the format:
     * https://everyayah.com/data/{reciterDirectory}/{surah:03d}{ayah:03d}.mp3
     * 
     * **Validates: Requirements 3.2**
     */
    it('should construct valid URLs for any surah, ayah, and reciter combination', () => {
      fc.assert(
        fc.property(
          // Generate valid surah numbers (1-114)
          fc.integer({ min: 1, max: 114 }),
          // Generate valid ayah numbers (1-286, max in Al-Baqarah)
          fc.integer({ min: 1, max: 286 }),
          // Pick a random reciter from the list
          fc.constantFrom(...RECITERS.map(r => r.id)),
          (surah, ayah, reciterId) => {
            const url = buildAudioUrl(surah, ayah, reciterId);
            const reciter = getReciterById(reciterId);
            
            // URL should start with everyayah.com base
            expect(url).toMatch(/^https:\/\/everyayah\.com\/data\//);
            
            // URL should contain the reciter directory
            expect(url).toContain(reciter!.directory);
            
            // URL should end with .mp3
            expect(url).toMatch(/\.mp3$/);
            
            // Surah should be zero-padded to 3 digits
            const surahPadded = String(surah).padStart(3, '0');
            expect(url).toContain(surahPadded);
            
            // Ayah should be zero-padded to 3 digits
            const ayahPadded = String(ayah).padStart(3, '0');
            expect(url).toContain(ayahPadded);
            
            // Full format check
            const expectedUrl = `https://everyayah.com/data/${reciter!.directory}/${surahPadded}${ayahPadded}.mp3`;
            expect(url).toBe(expectedUrl);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Surah and ayah numbers should always be zero-padded to 3 digits
     */
    it('should zero-pad surah and ayah numbers to 3 digits', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 114 }),
          fc.integer({ min: 1, max: 286 }),
          fc.constantFrom(...RECITERS.map(r => r.id)),
          (surah, ayah, reciterId) => {
            const url = buildAudioUrl(surah, ayah, reciterId);
            
            // Extract the filename part (after last /)
            const filename = url.split('/').pop()!;
            
            // Filename should be exactly 10 characters: 3 digits + 3 digits + .mp3
            expect(filename).toMatch(/^\d{3}\d{3}\.mp3$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Different surah/ayah combinations should produce different URLs
     */
    it('should produce unique URLs for different verse combinations', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 114 }),
          fc.integer({ min: 1, max: 286 }),
          fc.integer({ min: 1, max: 114 }),
          fc.integer({ min: 1, max: 286 }),
          fc.constantFrom(...RECITERS.map(r => r.id)),
          (surah1, ayah1, surah2, ayah2, reciterId) => {
            // Skip if same verse
            fc.pre(surah1 !== surah2 || ayah1 !== ayah2);
            
            const url1 = buildAudioUrl(surah1, ayah1, reciterId);
            const url2 = buildAudioUrl(surah2, ayah2, reciterId);
            
            expect(url1).not.toBe(url2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('getReciterDirectory', () => {
    it('should return correct directory for all reciters', () => {
      for (const reciter of RECITERS) {
        const directory = getReciterDirectory(reciter.id);
        expect(directory).toBe(reciter.directory);
      }
    });

    it('should throw error for unknown reciter', () => {
      expect(() => getReciterDirectory('unknown_reciter')).toThrow('Unknown reciter');
    });
  });

  describe('getReciterById', () => {
    it('should return reciter for valid ID', () => {
      for (const reciter of RECITERS) {
        const found = getReciterById(reciter.id);
        expect(found).toBeDefined();
        expect(found!.id).toBe(reciter.id);
        expect(found!.name).toBe(reciter.name);
        expect(found!.nameAr).toBe(reciter.nameAr);
        expect(found!.directory).toBe(reciter.directory);
      }
    });

    it('should return undefined for unknown ID', () => {
      const found = getReciterById('unknown_id');
      expect(found).toBeUndefined();
    });
  });

  describe('getAudioCacheKey', () => {
    /**
     * Property: Cache keys should be unique for different verse/reciter combinations
     */
    it('should generate unique cache keys for different combinations', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 114 }),
          fc.integer({ min: 1, max: 286 }),
          fc.integer({ min: 1, max: 114 }),
          fc.integer({ min: 1, max: 286 }),
          fc.constantFrom(...RECITERS.map(r => r.id)),
          fc.constantFrom(...RECITERS.map(r => r.id)),
          (surah1, ayah1, surah2, ayah2, reciter1, reciter2) => {
            // Skip if same combination
            fc.pre(surah1 !== surah2 || ayah1 !== ayah2 || reciter1 !== reciter2);
            
            const key1 = getAudioCacheKey(surah1, ayah1, reciter1);
            const key2 = getAudioCacheKey(surah2, ayah2, reciter2);
            
            expect(key1).not.toBe(key2);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Same inputs should always produce the same cache key
     */
    it('should be deterministic - same inputs produce same key', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 114 }),
          fc.integer({ min: 1, max: 286 }),
          fc.constantFrom(...RECITERS.map(r => r.id)),
          (surah, ayah, reciterId) => {
            const key1 = getAudioCacheKey(surah, ayah, reciterId);
            const key2 = getAudioCacheKey(surah, ayah, reciterId);
            
            expect(key1).toBe(key2);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Cache key should contain identifying information
     */
    it('should include reciter, surah, and ayah in the key', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 114 }),
          fc.integer({ min: 1, max: 286 }),
          fc.constantFrom(...RECITERS.map(r => r.id)),
          (surah, ayah, reciterId) => {
            const key = getAudioCacheKey(surah, ayah, reciterId);
            
            expect(key).toContain(reciterId);
            expect(key).toContain(String(surah));
            expect(key).toContain(String(ayah));
            expect(key).toMatch(/\.mp3$/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('RECITERS', () => {
    it('should have at least one reciter', () => {
      expect(RECITERS.length).toBeGreaterThan(0);
    });

    it('should have unique IDs for all reciters', () => {
      const ids = RECITERS.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all required fields for each reciter', () => {
      for (const reciter of RECITERS) {
        expect(reciter.id).toBeDefined();
        expect(reciter.id.length).toBeGreaterThan(0);
        expect(reciter.name).toBeDefined();
        expect(reciter.name.length).toBeGreaterThan(0);
        expect(reciter.nameAr).toBeDefined();
        expect(reciter.nameAr.length).toBeGreaterThan(0);
        expect(reciter.directory).toBeDefined();
        expect(reciter.directory.length).toBeGreaterThan(0);
      }
    });
  });
});
