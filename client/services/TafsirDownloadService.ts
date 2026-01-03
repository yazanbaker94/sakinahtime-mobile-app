/**
 * TafsirDownloadService
 * 
 * Manages downloading and caching of tafsir (Quran commentary) for offline access.
 */

import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DownloadItem, DownloadStatus } from '../types/offline';
import { OFFLINE_DIRS, STORAGE_KEYS } from '../constants/offline';

interface TafsirMeta {
  downloadedTafsirs: string[];
  lastSync: number;
  totalSize: number;
}

interface TafsirInfo {
  id: string;
  name: string;
  language: string;
  size: number;
  downloadedAt?: number;
}

// Available tafsirs with their download URLs
const AVAILABLE_TAFSIRS: Record<string, { name: string; language: string; url: string; estimatedSize: number }> = {
  'jalalayn': {
    name: 'Tafsir Jalalayn',
    language: 'ar',
    url: 'https://sakinahtime.com/tafsirs/jalalayn.json',
    estimatedSize: 2 * 1024 * 1024, // ~2MB
  },
  'ibn-kathir-en': {
    name: 'Tafsir Ibn Kathir (English)',
    language: 'en',
    url: 'https://sakinahtime.com/tafsirs/en-tafisr-ibn-kathir.json',
    estimatedSize: 15 * 1024 * 1024, // ~15MB
  },
  'ibn-kathir-ar': {
    name: 'Tafsir Ibn Kathir (Arabic)',
    language: 'ar',
    url: 'https://sakinahtime.com/tafsirs/tafsir-ibn-kathir-ar.json',
    estimatedSize: 20 * 1024 * 1024, // ~20MB
  },
  'as-saadi': {
    name: 'Tafsir As-Saadi',
    language: 'ar',
    url: 'https://sakinahtime.com/tafsirs/tafsir-as-saadi.json',
    estimatedSize: 8 * 1024 * 1024, // ~8MB
  },
  'mokhtasar': {
    name: 'Al-Mukhtasar',
    language: 'ar',
    url: 'https://sakinahtime.com/tafsirs/arabic-al-mukhtasar-in-interpreting-the-noble-quran.json',
    estimatedSize: 5 * 1024 * 1024, // ~5MB
  },
};

class TafsirDownloadServiceImpl {
  private static instance: TafsirDownloadServiceImpl;
  private tafsirDir: string;
  private meta: TafsirMeta = { downloadedTafsirs: [], lastSync: 0, totalSize: 0 };
  private initialized = false;
  private downloadQueue: Map<string, DownloadItem> = new Map();
  private listeners: Set<(tafsirId: string, status: DownloadStatus, progress: number) => void> = new Set();

  private constructor() {
    this.tafsirDir = `${FileSystem.documentDirectory}${OFFLINE_DIRS.TAFSIR}/`;
  }

  static getInstance(): TafsirDownloadServiceImpl {
    if (!TafsirDownloadServiceImpl.instance) {
      TafsirDownloadServiceImpl.instance = new TafsirDownloadServiceImpl();
    }
    return TafsirDownloadServiceImpl.instance;
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure tafsir directory exists
      const dirInfo = await FileSystem.getInfoAsync(this.tafsirDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.tafsirDir, { intermediates: true });
      }

      // Load metadata
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TAFSIR_META);
      if (stored) {
        this.meta = JSON.parse(stored);
      }

      this.initialized = true;
    } catch (error) {
      console.error('[TafsirDownloadService] Failed to initialize:', error);
    }
  }

  /**
   * Save metadata
   */
  private async saveMeta(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TAFSIR_META, JSON.stringify(this.meta));
    } catch (error) {
      console.error('[TafsirDownloadService] Failed to save meta:', error);
    }
  }

  /**
   * Get file path for a tafsir
   */
  private getTafsirPath(tafsirId: string): string {
    return `${this.tafsirDir}${tafsirId}.json`;
  }

  /**
   * Subscribe to download progress updates
   */
  onProgress(callback: (tafsirId: string, status: DownloadStatus, progress: number) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify listeners of progress
   */
  private notifyProgress(tafsirId: string, status: DownloadStatus, progress: number): void {
    this.listeners.forEach(cb => cb(tafsirId, status, progress));
  }

  /**
   * Get list of available tafsirs
   */
  getAvailableTafsirs(): Array<{ id: string; name: string; language: string; estimatedSize: number; isDownloaded: boolean }> {
    return Object.entries(AVAILABLE_TAFSIRS).map(([id, info]) => ({
      id,
      name: info.name,
      language: info.language,
      estimatedSize: info.estimatedSize,
      isDownloaded: this.meta.downloadedTafsirs.includes(id),
    }));
  }

  /**
   * Get list of downloaded tafsirs
   */
  getDownloadedTafsirs(): string[] {
    return [...this.meta.downloadedTafsirs];
  }

  /**
   * Check if a tafsir is downloaded
   */
  isDownloaded(tafsirId: string): boolean {
    return this.meta.downloadedTafsirs.includes(tafsirId);
  }

  /**
   * Download a tafsir
   */
  async downloadTafsir(tafsirId: string): Promise<void> {
    await this.initialize();

    const tafsirInfo = AVAILABLE_TAFSIRS[tafsirId];
    if (!tafsirInfo) {
      throw new Error(`Unknown tafsir: ${tafsirId}`);
    }

    if (this.isDownloaded(tafsirId)) {
      console.log(`[TafsirDownloadService] Tafsir ${tafsirId} already downloaded`);
      return;
    }

    // Check if already downloading
    if (this.downloadQueue.has(tafsirId)) {
      console.log(`[TafsirDownloadService] Tafsir ${tafsirId} already in queue`);
      return;
    }

    const downloadItem: DownloadItem = {
      id: tafsirId,
      type: 'tafsir',
      status: 'downloading',
      progress: 0,
      totalSize: tafsirInfo.estimatedSize,
      downloadedSize: 0,
      startedAt: Date.now(),
    };

    this.downloadQueue.set(tafsirId, downloadItem);
    this.notifyProgress(tafsirId, 'downloading', 0);

    try {
      const filePath = this.getTafsirPath(tafsirId);
      
      // Download with progress tracking
      const downloadResumable = FileSystem.createDownloadResumable(
        tafsirInfo.url,
        filePath,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          const item = this.downloadQueue.get(tafsirId);
          if (item) {
            item.progress = progress;
            item.downloadedSize = downloadProgress.totalBytesWritten;
            item.totalSize = downloadProgress.totalBytesExpectedToWrite;
          }
          this.notifyProgress(tafsirId, 'downloading', progress);
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (result?.uri) {
        // Get actual file size
        const fileInfo = await FileSystem.getInfoAsync(result.uri);
        const fileSize = (fileInfo as any).size || tafsirInfo.estimatedSize;

        // Update metadata
        this.meta.downloadedTafsirs.push(tafsirId);
        this.meta.totalSize += fileSize;
        this.meta.lastSync = Date.now();
        await this.saveMeta();

        this.downloadQueue.delete(tafsirId);
        this.notifyProgress(tafsirId, 'completed', 1);
      } else {
        throw new Error('Download failed - no result');
      }
    } catch (error) {
      console.error(`[TafsirDownloadService] Failed to download ${tafsirId}:`, error);
      
      const item = this.downloadQueue.get(tafsirId);
      if (item) {
        item.status = 'failed';
        item.error = error instanceof Error ? error.message : 'Download failed';
      }
      
      this.notifyProgress(tafsirId, 'failed', 0);
      this.downloadQueue.delete(tafsirId);
      throw error;
    }
  }

  /**
   * Download all available tafsirs
   */
  async downloadAllTafsirs(): Promise<void> {
    await this.initialize();

    const notDownloaded = Object.keys(AVAILABLE_TAFSIRS).filter(
      id => !this.meta.downloadedTafsirs.includes(id)
    );

    for (const tafsirId of notDownloaded) {
      try {
        await this.downloadTafsir(tafsirId);
      } catch (error) {
        console.error(`[TafsirDownloadService] Failed to download ${tafsirId}:`, error);
        // Continue with next tafsir
      }
    }
  }

  /**
   * Get tafsir content for a verse
   */
  async getTafsir(tafsirId: string, verseKey: string): Promise<{ text: string } | null> {
    await this.initialize();

    if (!this.isDownloaded(tafsirId)) {
      return null;
    }

    try {
      const filePath = this.getTafsirPath(tafsirId);
      const content = await FileSystem.readAsStringAsync(filePath);
      const data = JSON.parse(content);

      // Handle different tafsir formats
      if (data[verseKey]) {
        return data[verseKey];
      }

      // Some tafsirs use different key formats
      const [surah, ayah] = verseKey.split(':');
      const altKey = `${surah}:${ayah}`;
      if (data[altKey]) {
        return data[altKey];
      }

      return null;
    } catch (error) {
      console.error(`[TafsirDownloadService] Failed to get tafsir for ${verseKey}:`, error);
      return null;
    }
  }

  /**
   * Get full tafsir data
   */
  async getFullTafsir(tafsirId: string): Promise<Record<string, { text: string }> | null> {
    await this.initialize();

    if (!this.isDownloaded(tafsirId)) {
      return null;
    }

    try {
      const filePath = this.getTafsirPath(tafsirId);
      const content = await FileSystem.readAsStringAsync(filePath);
      return JSON.parse(content);
    } catch (error) {
      console.error(`[TafsirDownloadService] Failed to get full tafsir:`, error);
      return null;
    }
  }

  /**
   * Delete a downloaded tafsir
   */
  async deleteTafsir(tafsirId: string): Promise<void> {
    await this.initialize();

    if (!this.isDownloaded(tafsirId)) {
      return;
    }

    try {
      const filePath = this.getTafsirPath(tafsirId);
      
      // Get file size before deleting
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      const fileSize = (fileInfo as any).size || 0;

      await FileSystem.deleteAsync(filePath, { idempotent: true });

      // Update metadata
      this.meta.downloadedTafsirs = this.meta.downloadedTafsirs.filter(id => id !== tafsirId);
      this.meta.totalSize = Math.max(0, this.meta.totalSize - fileSize);
      await this.saveMeta();
    } catch (error) {
      console.error(`[TafsirDownloadService] Failed to delete ${tafsirId}:`, error);
      throw error;
    }
  }

  /**
   * Delete all downloaded tafsirs
   */
  async deleteAllTafsirs(): Promise<void> {
    await this.initialize();

    try {
      // Delete the entire tafsir directory
      const dirInfo = await FileSystem.getInfoAsync(this.tafsirDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.tafsirDir, { idempotent: true });
        await FileSystem.makeDirectoryAsync(this.tafsirDir, { intermediates: true });
      }

      // Reset metadata
      this.meta = { downloadedTafsirs: [], lastSync: 0, totalSize: 0 };
      await this.saveMeta();
    } catch (error) {
      console.error('[TafsirDownloadService] Failed to delete all tafsirs:', error);
      throw error;
    }
  }

  /**
   * Get total storage used by tafsirs
   */
  async getStorageUsed(): Promise<number> {
    await this.initialize();
    return this.meta.totalSize;
  }

  /**
   * Get download queue status
   */
  getDownloadQueue(): DownloadItem[] {
    return Array.from(this.downloadQueue.values());
  }
}

// Export singleton instance
export const tafsirDownloadService = TafsirDownloadServiceImpl.getInstance();

// Export class for testing
export { TafsirDownloadServiceImpl };
