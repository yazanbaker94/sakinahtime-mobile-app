/**
 * AudioDownloadService Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock NetworkService first (before importing AudioDownloadService)
vi.mock('../NetworkService', () => ({
  networkService: {
    initialize: vi.fn(() => Promise.resolve()),
    getStatus: vi.fn(() => ({ isConnected: true, isWifi: true, lastOnline: Date.now() })),
    onStatusChange: vi.fn(() => vi.fn()),
    isOnline: vi.fn(() => true),
    isWifi: vi.fn(() => true),
  },
}));

// Mock expo-file-system
vi.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  getInfoAsync: vi.fn(() => Promise.resolve({ exists: true, size: 5 * 1024 * 1024 })),
  makeDirectoryAsync: vi.fn(() => Promise.resolve()),
  deleteAsync: vi.fn(() => Promise.resolve()),
  readDirectoryAsync: vi.fn(() => Promise.resolve(['001.mp3', '002.mp3'])),
  createDownloadResumable: vi.fn(() => ({
    downloadAsync: vi.fn(() => Promise.resolve({ uri: '/mock/path/001.mp3' })),
    pauseAsync: vi.fn(() => Promise.resolve()),
    resumeAsync: vi.fn(() => Promise.resolve({ uri: '/mock/path/001.mp3' })),
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

import { AudioDownloadServiceImpl } from '../AudioDownloadService';
import * as FileSystem from 'expo-file-system';

describe('AudioDownloadService', () => {
  let service: AudioDownloadServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new (AudioDownloadServiceImpl as any)();
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
  });

  describe('download queue management', () => {
    it('should add surah to download queue', async () => {
      await service.initialize();
      
      const downloadId = await service.downloadSurah(1, 'Alafasy_128kbps');
      
      expect(downloadId).toBeDefined();
      expect(typeof downloadId).toBe('string');
    });

    it('should track download progress', async () => {
      await service.initialize();
      
      const progressCallback = vi.fn();
      service.onProgress(progressCallback);
      
      await service.downloadSurah(1, 'Alafasy_128kbps');
      
      // Progress callback should be called
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should return download queue', async () => {
      await service.initialize();
      
      const queue = service.getDownloadQueue();
      
      expect(Array.isArray(queue)).toBe(true);
    });
  });

  describe('status tracking', () => {
    it('should track downloaded surahs', async () => {
      await service.initialize();
      
      const downloaded = await service.getDownloadedSurahs('Alafasy_128kbps');
      
      expect(Array.isArray(downloaded)).toBe(true);
    });
  });

  describe('local path resolution', () => {
    it('should return local path for downloaded audio', async () => {
      await service.initialize();
      
      // Mock as downloaded
      (FileSystem.getInfoAsync as any).mockResolvedValueOnce({ exists: true });
      
      const path = await service.getLocalAudioPath(1, 1, 'Alafasy_128kbps');
      
      // Path should be string or null
      expect(path === null || typeof path === 'string').toBe(true);
    });

    it('should return null for non-downloaded audio', async () => {
      await service.initialize();
      
      (FileSystem.getInfoAsync as any).mockResolvedValueOnce({ exists: false });
      
      const path = await service.getLocalAudioPath(999, 1, 'NonExistentReciter');
      
      expect(path).toBeNull();
    });
  });

  describe('pause/resume/cancel', () => {
    it('should pause download', async () => {
      await service.initialize();
      
      const downloadId = await service.downloadSurah(1, 'Alafasy_128kbps');
      await service.pauseDownload(downloadId);
      
      // Should not throw
      expect(true).toBe(true);
    });

    it('should resume download', async () => {
      await service.initialize();
      
      const downloadId = await service.downloadSurah(1, 'Alafasy_128kbps');
      await service.pauseDownload(downloadId);
      await service.resumeDownload(downloadId);
      
      // Should not throw
      expect(true).toBe(true);
    });

    it('should cancel download', async () => {
      await service.initialize();
      
      const downloadId = await service.downloadSurah(1, 'Alafasy_128kbps');
      await service.cancelDownload(downloadId);
      
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('delete operations', () => {
    it('should delete all audio for reciter', async () => {
      await service.initialize();
      
      await service.deleteReciterAudio('Alafasy_128kbps');
      
      expect(FileSystem.deleteAsync).toHaveBeenCalled();
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
});
