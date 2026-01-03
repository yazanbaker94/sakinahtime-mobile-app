/**
 * PrayerTimesCacheService Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock expo-file-system
vi.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  getInfoAsync: vi.fn(() => Promise.resolve({ exists: true, size: 1024 })),
  makeDirectoryAsync: vi.fn(() => Promise.resolve()),
  deleteAsync: vi.fn(() => Promise.resolve()),
  writeAsStringAsync: vi.fn(() => Promise.resolve()),
  readAsStringAsync: vi.fn(() => Promise.resolve(JSON.stringify({
    latitude: 21.42,
    longitude: 39.83,
    method: 4,
    date: '2026-01-02',
    timings: {
      Fajr: '05:30',
      Sunrise: '06:45',
      Dhuhr: '12:15',
      Asr: '15:30',
      Maghrib: '18:00',
      Isha: '19:30',
    },
    cachedAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  }))),
}));

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

import { PrayerTimesCacheServiceImpl } from '../PrayerTimesCacheService';
import * as FileSystem from 'expo-file-system';

describe('PrayerTimesCacheService', () => {
  let service: PrayerTimesCacheServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new (PrayerTimesCacheServiceImpl as any)();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await service.initialize();
      // Should not throw
      expect(true).toBe(true);
    });

    it('should create cache directory if not exists', async () => {
      (FileSystem.getInfoAsync as any).mockResolvedValueOnce({ exists: false });
      
      await service.initialize();
      
      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalled();
    });
  });

  describe('cache storage and retrieval', () => {
    it('should cache prayer times', async () => {
      await service.initialize();
      
      const data = {
        timings: {
          Fajr: '05:30',
          Sunrise: '06:45',
          Dhuhr: '12:15',
          Asr: '15:30',
          Maghrib: '18:00',
          Isha: '19:30',
        },
        date: { gregorian: { date: '02-01-2026' } },
      };
      
      await service.cachePrayerTimes(
        data,
        { lat: 21.42, lng: 39.83 },
        4
      );

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });

    it('should retrieve cached prayer times', async () => {
      await service.initialize();
      
      const cached = await service.getCachedPrayerTimes(
        new Date('2026-01-02'),
        { lat: 21.42, lng: 39.83 },
        4
      );

      expect(cached).not.toBeNull();
      expect(cached?.timings).toBeDefined();
    });

    it('should return null for non-existent cache', async () => {
      (FileSystem.getInfoAsync as any).mockResolvedValueOnce({ exists: true });
      (FileSystem.getInfoAsync as any).mockResolvedValueOnce({ exists: false });
      
      await service.initialize();
      
      const cached = await service.getCachedPrayerTimes(
        new Date('2025-01-01'),
        { lat: 0, lng: 0 },
        1
      );

      expect(cached).toBeNull();
    });
  });

  describe('location-based invalidation', () => {
    it('should detect significant location change', () => {
      // ~111km apart (1 degree latitude)
      const hasChanged = service.hasLocationChanged(21.42, 39.83, 22.42, 39.83);
      expect(hasChanged).toBe(true);
    });

    it('should not detect minor location change', () => {
      // ~1km apart
      const hasChanged = service.hasLocationChanged(21.42, 39.83, 21.43, 39.83);
      expect(hasChanged).toBe(false);
    });

    it('should invalidate cache for location', async () => {
      await service.initialize();
      
      await service.invalidateForLocation(21.42, 39.83);
      
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('expiration handling', () => {
    it('should return null for expired cache', async () => {
      const expiredData = JSON.stringify({
        latitude: 21.42,
        longitude: 39.83,
        method: 4,
        date: '2026-01-02',
        timings: { Fajr: '05:30' },
        cachedAt: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
        expiresAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // Expired 30 days ago
      });
      
      (FileSystem.readAsStringAsync as any).mockResolvedValueOnce(expiredData);
      
      await service.initialize();
      
      const cached = await service.getCachedPrayerTimes(
        new Date('2026-01-02'),
        { lat: 21.42, lng: 39.83 },
        4
      );

      expect(cached).toBeNull();
    });

    it('should clear expired cache entries', async () => {
      await service.initialize();
      
      await service.clearExpiredCache();
      
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('cache status', () => {
    it('should return cache status', async () => {
      await service.initialize();
      
      const status = await service.getCacheStatus();
      
      expect(status).toHaveProperty('cachedDays');
      expect(status).toHaveProperty('oldestDate');
      expect(status).toHaveProperty('newestDate');
      expect(status).toHaveProperty('lastSync');
    });

    it('should detect stale cache', async () => {
      await service.initialize();
      
      const isStale = await service.isCacheStale({ lat: 21.42, lng: 39.83 });
      
      expect(typeof isStale).toBe('boolean');
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate all cache', async () => {
      await service.initialize();
      
      await service.invalidateCache();
      
      expect(FileSystem.deleteAsync).toHaveBeenCalled();
    });
  });

  describe('bulk caching', () => {
    it('should cache multiple days', async () => {
      await service.initialize();
      
      const fetchFn = vi.fn(() => Promise.resolve({
        timings: { Fajr: '05:30' },
        date: { gregorian: { date: '02-01-2026' } },
      }));

      // Mock getCachedPrayerTimes to return null (not cached)
      (FileSystem.getInfoAsync as any).mockResolvedValue({ exists: false });

      await service.cacheNextDays(3, { lat: 21.42, lng: 39.83 }, 4, fetchFn);

      // fetchFn should be called for each day
      expect(fetchFn).toHaveBeenCalled();
    });
  });
});
