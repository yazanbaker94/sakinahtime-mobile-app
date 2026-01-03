/**
 * OfflineStorageService Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock expo-file-system
vi.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  cacheDirectory: '/mock/cache/',
  getInfoAsync: vi.fn(() => Promise.resolve({ exists: true, size: 1024 })),
  makeDirectoryAsync: vi.fn(() => Promise.resolve()),
  deleteAsync: vi.fn(() => Promise.resolve()),
  readDirectoryAsync: vi.fn(() => Promise.resolve(['file1.mp3', 'file2.mp3'])),
  getFreeDiskStorageAsync: vi.fn(() => Promise.resolve(10 * 1024 * 1024 * 1024)), // 10GB
}));

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

import { OfflineStorageServiceImpl } from '../OfflineStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('OfflineStorageService', () => {
  let service: OfflineStorageServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new (OfflineStorageServiceImpl as any)();
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

    it('should load saved settings on init', async () => {
      const mockSettings = JSON.stringify({
        storageLimit: 1024 * 1024 * 1024,
        wifiOnlyDownloads: true,
        autoDeleteOldCache: true,
      });
      (AsyncStorage.getItem as any).mockResolvedValueOnce(mockSettings);

      await service.initialize();
      const settings = service.getSettings();
      
      expect(settings.wifiOnlyDownloads).toBe(true);
    });
  });

  describe('storage calculation', () => {
    it('should return storage info', async () => {
      await service.initialize();
      const info = await service.getStorageInfo();

      expect(info).toHaveProperty('totalUsed');
      expect(info).toHaveProperty('audioSize');
      expect(info).toHaveProperty('tafsirSize');
      expect(info).toHaveProperty('prayerCacheSize');
      expect(info).toHaveProperty('storageLimit');
    });

    it('should return non-negative values', async () => {
      await service.initialize();
      const info = await service.getStorageInfo();

      expect(info.totalUsed).toBeGreaterThanOrEqual(0);
      expect(info.storageLimit).toBeGreaterThan(0);
      expect(info.audioSize).toBeGreaterThanOrEqual(0);
      expect(info.tafsirSize).toBeGreaterThanOrEqual(0);
      expect(info.prayerCacheSize).toBeGreaterThanOrEqual(0);
    });

    it('should get available space', async () => {
      await service.initialize();
      const available = await service.getAvailableSpace();
      
      expect(typeof available).toBe('number');
      expect(available).toBeGreaterThanOrEqual(0);
    });
  });

  describe('clear operations', () => {
    it('should clear all cache', async () => {
      await service.initialize();
      await service.clearAllCache();
      
      // Should not throw
      expect(true).toBe(true);
    });

    it('should clear audio cache', async () => {
      await service.initialize();
      await service.clearAudioCache();
      
      expect(true).toBe(true);
    });

    it('should clear tafsir cache', async () => {
      await service.initialize();
      await service.clearTafsirCache();
      
      expect(true).toBe(true);
    });

    it('should clear prayer times cache', async () => {
      await service.initialize();
      await service.clearPrayerCache();
      
      expect(true).toBe(true);
    });

    it('should clear other cache', async () => {
      await service.initialize();
      await service.clearOtherCache();
      
      expect(true).toBe(true);
    });
  });

  describe('settings management', () => {
    it('should get default settings', async () => {
      await service.initialize();
      const settings = service.getSettings();

      expect(settings).toHaveProperty('storageLimit');
      expect(settings).toHaveProperty('wifiOnlyDownloads');
      expect(settings).toHaveProperty('autoDeleteOldCache');
    });

    it('should update settings', async () => {
      await service.initialize();
      
      await service.updateSettings({
        wifiOnlyDownloads: true,
      });

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should persist settings', async () => {
      await service.initialize();
      
      await service.updateSettings({
        storageLimit: 2 * 1024 * 1024 * 1024, // 2GB
      });

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should enforce minimum storage limit', async () => {
      await service.initialize();
      
      await service.updateSettings({
        storageLimit: 10, // Very low
      });

      const settings = service.getSettings();
      // Should be at least the minimum
      expect(settings.storageLimit).toBeGreaterThanOrEqual(100 * 1024 * 1024); // 100MB min
    });

    it('should enforce maximum storage limit', async () => {
      await service.initialize();
      
      await service.updateSettings({
        storageLimit: 100 * 1024 * 1024 * 1024, // 100GB - way too high
      });

      const settings = service.getSettings();
      // Should be at most the maximum
      expect(settings.storageLimit).toBeLessThanOrEqual(10 * 1024 * 1024 * 1024); // 10GB max
    });
  });
});
