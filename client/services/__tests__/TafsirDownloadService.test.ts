/**
 * TafsirDownloadService Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock expo-file-system
vi.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  getInfoAsync: vi.fn(() => Promise.resolve({ exists: true, size: 5 * 1024 * 1024 })),
  makeDirectoryAsync: vi.fn(() => Promise.resolve()),
  deleteAsync: vi.fn(() => Promise.resolve()),
  readAsStringAsync: vi.fn(() => Promise.resolve(JSON.stringify({
    '1:1': { text: 'In the name of Allah, the Most Gracious, the Most Merciful.' },
    '1:2': { text: 'All praise is due to Allah, Lord of the worlds.' },
  }))),
  writeAsStringAsync: vi.fn(() => Promise.resolve()),
  createDownloadResumable: vi.fn(() => ({
    downloadAsync: vi.fn(() => Promise.resolve({ uri: '/mock/path/tafsir.json' })),
  })),
}));

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

import { TafsirDownloadServiceImpl } from '../TafsirDownloadService';
import * as FileSystem from 'expo-file-system';

describe('TafsirDownloadService', () => {
  let service: TafsirDownloadServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new (TafsirDownloadServiceImpl as any)();
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

    it('should create tafsir directory if not exists', async () => {
      (FileSystem.getInfoAsync as any).mockResolvedValueOnce({ exists: false });
      
      await service.initialize();
      
      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalled();
    });
  });

  describe('available tafsirs', () => {
    it('should return list of available tafsirs', () => {
      const tafsirs = service.getAvailableTafsirs();
      
      expect(Array.isArray(tafsirs)).toBe(true);
      expect(tafsirs.length).toBeGreaterThan(0);
    });

    it('should include tafsir metadata', () => {
      const tafsirs = service.getAvailableTafsirs();
      
      tafsirs.forEach(tafsir => {
        expect(tafsir).toHaveProperty('id');
        expect(tafsir).toHaveProperty('name');
        expect(tafsir).toHaveProperty('language');
        expect(tafsir).toHaveProperty('estimatedSize');
        expect(tafsir).toHaveProperty('isDownloaded');
      });
    });
  });

  describe('download and retrieval', () => {
    it('should download tafsir', async () => {
      await service.initialize();
      
      await service.downloadTafsir('jalalayn');
      
      expect(FileSystem.createDownloadResumable).toHaveBeenCalled();
    });

    it('should track download progress', async () => {
      await service.initialize();
      
      const progressCallback = vi.fn();
      service.onProgress(progressCallback);
      
      await service.downloadTafsir('jalalayn');
      
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should retrieve tafsir for verse', async () => {
      await service.initialize();
      
      // Mock as downloaded
      (service as any).meta.downloadedTafsirs = ['jalalayn'];
      
      const tafsir = await service.getTafsir('jalalayn', '1:1');
      
      expect(tafsir).not.toBeNull();
      expect(tafsir?.text).toBeDefined();
    });

    it('should return null for non-downloaded tafsir', async () => {
      await service.initialize();
      
      const tafsir = await service.getTafsir('non-existent', '1:1');
      
      expect(tafsir).toBeNull();
    });

    it('should get full tafsir data', async () => {
      await service.initialize();
      
      // Mock as downloaded
      (service as any).meta.downloadedTafsirs = ['jalalayn'];
      
      const fullTafsir = await service.getFullTafsir('jalalayn');
      
      expect(fullTafsir).not.toBeNull();
      expect(fullTafsir?.['1:1']).toBeDefined();
    });
  });

  describe('storage calculation', () => {
    it('should return storage used', async () => {
      await service.initialize();
      
      const size = await service.getStorageUsed();
      
      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('delete operations', () => {
    it('should delete tafsir', async () => {
      await service.initialize();
      
      // Mock as downloaded
      (service as any).meta.downloadedTafsirs = ['jalalayn'];
      
      await service.deleteTafsir('jalalayn');
      
      expect(FileSystem.deleteAsync).toHaveBeenCalled();
    });

    it('should delete all tafsirs', async () => {
      await service.initialize();
      
      await service.deleteAllTafsirs();
      
      expect(FileSystem.deleteAsync).toHaveBeenCalled();
    });
  });

  describe('download status', () => {
    it('should check if tafsir is downloaded', async () => {
      await service.initialize();
      
      const isDownloaded = service.isDownloaded('jalalayn');
      
      expect(typeof isDownloaded).toBe('boolean');
    });

    it('should return downloaded tafsirs list', () => {
      const downloaded = service.getDownloadedTafsirs();
      
      expect(Array.isArray(downloaded)).toBe(true);
    });

    it('should return download queue', () => {
      const queue = service.getDownloadQueue();
      
      expect(Array.isArray(queue)).toBe(true);
    });
  });

  describe('progress subscription', () => {
    it('should allow subscribing to progress', () => {
      const callback = vi.fn();
      const unsubscribe = service.onProgress(callback);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should allow unsubscribing from progress', () => {
      const callback = vi.fn();
      const unsubscribe = service.onProgress(callback);
      
      unsubscribe();
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw for unknown tafsir', async () => {
      await service.initialize();
      
      await expect(service.downloadTafsir('unknown-tafsir')).rejects.toThrow();
    });

    it('should not re-download already downloaded tafsir', async () => {
      await service.initialize();
      
      // Mock as already downloaded
      (service as any).meta.downloadedTafsirs = ['jalalayn'];
      
      await service.downloadTafsir('jalalayn');
      
      // Should not call download
      expect(FileSystem.createDownloadResumable).not.toHaveBeenCalled();
    });
  });
});
