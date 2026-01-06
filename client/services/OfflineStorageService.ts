/**
 * OfflineStorageService
 * 
 * Central service for managing offline storage including
 * storage info, cleanup, and settings management.
 */

import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageInfo, OfflineSettings, StorageCategory } from '../types/offline';
import { 
  DEFAULT_OFFLINE_SETTINGS, 
  STORAGE_KEYS, 
  OFFLINE_DIRS,
  STORAGE_LIMITS 
} from '../constants/offline';

class OfflineStorageServiceImpl {
  private static instance: OfflineStorageServiceImpl;
  private settings: OfflineSettings = DEFAULT_OFFLINE_SETTINGS;
  private initialized = false;

  private constructor() {}

  static getInstance(): OfflineStorageServiceImpl {
    if (!OfflineStorageServiceImpl.instance) {
      OfflineStorageServiceImpl.instance = new OfflineStorageServiceImpl();
    }
    return OfflineStorageServiceImpl.instance;
  }

  /**
   * Initialize the service and load settings
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_SETTINGS);
      if (stored) {
        this.settings = { ...DEFAULT_OFFLINE_SETTINGS, ...JSON.parse(stored) };
      }
      this.initialized = true;
    } catch (error) {
      console.error('[OfflineStorageService] Failed to initialize:', error);
    }
  }

  /**
   * Get base directory for offline storage
   */
  private getBaseDir(): string {
    return FileSystem.documentDirectory || '';
  }

  /**
   * Get directory path for a category
   */
  private getCategoryDir(category: StorageCategory): string {
    const base = this.getBaseDir();
    switch (category) {
      case 'audio':
        return `${base}${OFFLINE_DIRS.AUDIO}/`;
      case 'tafsir':
        return `${base}${OFFLINE_DIRS.TAFSIR}/`;
      case 'prayer':
        return `${base}${OFFLINE_DIRS.PRAYER_CACHE}/`;
      case 'cache':
        return FileSystem.cacheDirectory || '';
      default:
        return base;
    }
  }

  /**
   * Calculate directory size recursively
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists) return 0;

      const files = await FileSystem.readDirectoryAsync(dirPath);
      let totalSize = 0;

      for (const file of files) {
        const filePath = `${dirPath}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        if (fileInfo.exists) {
          if ('size' in fileInfo && typeof fileInfo.size === 'number') {
            totalSize += fileInfo.size;
          } else if (fileInfo.isDirectory) {
            totalSize += await this.getDirectorySize(`${filePath}/`);
          }
        }
      }

      return totalSize;
    } catch (error) {
      console.error('[OfflineStorageService] Error getting directory size:', error);
      return 0;
    }
  }

  /**
   * Get comprehensive storage information
   */
  async getStorageInfo(): Promise<StorageInfo> {
    try {
      const [audioSize, tafsirSize, prayerCacheSize, otherCacheSize, deviceInfo] = await Promise.all([
        this.getDirectorySize(this.getCategoryDir('audio')),
        this.getDirectorySize(this.getCategoryDir('tafsir')),
        this.getDirectorySize(this.getCategoryDir('prayer')),
        this.getDirectorySize(this.getCategoryDir('cache')),
        FileSystem.getFreeDiskStorageAsync(),
      ]);

      const totalUsed = audioSize + tafsirSize + prayerCacheSize + otherCacheSize;

      return {
        totalUsed,
        audioSize,
        tafsirSize,
        prayerCacheSize,
        otherCacheSize,
        deviceAvailable: deviceInfo,
        storageLimit: this.settings.storageLimit,
      };
    } catch (error) {
      console.error('[OfflineStorageService] Error getting storage info:', error);
      return {
        totalUsed: 0,
        audioSize: 0,
        tafsirSize: 0,
        prayerCacheSize: 0,
        otherCacheSize: 0,
        deviceAvailable: 0,
        storageLimit: this.settings.storageLimit,
      };
    }
  }

  /**
   * Get available space (considering storage limit)
   */
  async getAvailableSpace(): Promise<number> {
    const info = await this.getStorageInfo();
    const limitRemaining = this.settings.storageLimit - info.totalUsed;
    return Math.min(limitRemaining, info.deviceAvailable);
  }

  /**
   * Clear all cached data (only audio and tafsir - safe to clear)
   * Does NOT clear prayer cache (essential) or system cache (can break fonts/assets)
   */
  async clearAllCache(): Promise<void> {
    await Promise.all([
      this.clearAudioCache(),
      this.clearTafsirCache(),
      // Don't clear prayer cache - it's essential and will cause UI issues
      // Don't clear other cache - it can break fonts and other assets
    ]);
  }

  /**
   * Clear audio cache
   */
  async clearAudioCache(reciter?: string): Promise<void> {
    try {
      const audioDir = this.getCategoryDir('audio');
      
      if (reciter) {
        // Clear specific reciter
        const reciterDir = `${audioDir}${reciter}/`;
        const dirInfo = await FileSystem.getInfoAsync(reciterDir);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(reciterDir, { idempotent: true });
        }
      } else {
        // Clear all audio
        const dirInfo = await FileSystem.getInfoAsync(audioDir);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(audioDir, { idempotent: true });
        }
      }

      // Clear downloaded surahs metadata
      if (!reciter) {
        await AsyncStorage.removeItem(STORAGE_KEYS.DOWNLOADED_SURAHS);
      }
    } catch (error) {
      console.error('[OfflineStorageService] Error clearing audio cache:', error);
      throw error;
    }
  }

  /**
   * Clear tafsir cache
   */
  async clearTafsirCache(source?: string): Promise<void> {
    try {
      const tafsirDir = this.getCategoryDir('tafsir');
      
      if (source) {
        const sourceDir = `${tafsirDir}${source}/`;
        const dirInfo = await FileSystem.getInfoAsync(sourceDir);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(sourceDir, { idempotent: true });
        }
      } else {
        const dirInfo = await FileSystem.getInfoAsync(tafsirDir);
        if (dirInfo.exists) {
          await FileSystem.deleteAsync(tafsirDir, { idempotent: true });
        }
      }
    } catch (error) {
      console.error('[OfflineStorageService] Error clearing tafsir cache:', error);
      throw error;
    }
  }

  /**
   * Clear prayer times cache
   */
  async clearPrayerCache(): Promise<void> {
    try {
      const prayerDir = this.getCategoryDir('prayer');
      const dirInfo = await FileSystem.getInfoAsync(prayerDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(prayerDir, { idempotent: true });
      }
      await AsyncStorage.removeItem(STORAGE_KEYS.PRAYER_CACHE_META);
    } catch (error) {
      console.error('[OfflineStorageService] Error clearing prayer cache:', error);
      throw error;
    }
  }

  /**
   * Clear other cache (system cache)
   */
  async clearOtherCache(): Promise<void> {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const dirInfo = await FileSystem.getInfoAsync(cacheDir);
        if (dirInfo.exists) {
          const files = await FileSystem.readDirectoryAsync(cacheDir);
          for (const file of files) {
            // Skip system files
            if (!file.startsWith('.')) {
              await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
            }
          }
        }
      }
    } catch (error) {
      console.error('[OfflineStorageService] Error clearing other cache:', error);
      throw error;
    }
  }

  /**
   * Get current settings
   */
  getSettings(): OfflineSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  async updateSettings(updates: Partial<OfflineSettings>): Promise<void> {
    try {
      // Validate storage limit
      if (updates.storageLimit !== undefined) {
        updates.storageLimit = Math.max(
          STORAGE_LIMITS.MIN_LIMIT,
          Math.min(STORAGE_LIMITS.MAX_LIMIT, updates.storageLimit)
        );
      }

      this.settings = { ...this.settings, ...updates };
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_SETTINGS,
        JSON.stringify(this.settings)
      );

      // Perform cleanup if needed
      if (this.settings.autoDeleteOldCache) {
        await this.performCleanupIfNeeded();
      }
    } catch (error) {
      console.error('[OfflineStorageService] Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Perform cleanup if storage exceeds limit
   */
  async performCleanupIfNeeded(): Promise<void> {
    try {
      const info = await this.getStorageInfo();
      
      if (info.totalUsed > this.settings.storageLimit) {
        // Clear other cache first
        await this.clearOtherCache();
        
        // Check again
        const newInfo = await this.getStorageInfo();
        if (newInfo.totalUsed > this.settings.storageLimit) {
          // Clear prayer cache (can be re-fetched)
          await this.clearPrayerCache();
        }
      }
    } catch (error) {
      console.error('[OfflineStorageService] Error performing cleanup:', error);
    }
  }

  /**
   * Check if storage is near limit
   */
  async isStorageNearLimit(): Promise<{ warning: boolean; critical: boolean }> {
    const info = await this.getStorageInfo();
    const usage = info.totalUsed / this.settings.storageLimit;
    
    return {
      warning: usage >= STORAGE_LIMITS.WARNING_THRESHOLD,
      critical: usage >= STORAGE_LIMITS.CRITICAL_THRESHOLD,
    };
  }

  /**
   * Ensure a directory exists
   */
  async ensureDirectory(path: string): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(path);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(path, { intermediates: true });
      }
    } catch (error) {
      console.error('[OfflineStorageService] Error ensuring directory:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const offlineStorageService = OfflineStorageServiceImpl.getInstance();

// Export class for testing
export { OfflineStorageServiceImpl };
