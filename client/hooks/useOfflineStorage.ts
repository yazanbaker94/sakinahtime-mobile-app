/**
 * useOfflineStorage Hook
 * 
 * Provides storage information and management functions.
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineStorageService } from '../services/OfflineStorageService';
import { StorageInfo, StorageCategory } from '../types/offline';

export function useOfflineStorage() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshStorageInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      await offlineStorageService.initialize();
      const info = await offlineStorageService.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('[useOfflineStorage] Failed to get storage info:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStorageInfo();
  }, [refreshStorageInfo]);

  const clearCache = useCallback(async (type: StorageCategory = 'all') => {
    try {
      switch (type) {
        case 'audio':
          await offlineStorageService.clearAudioCache();
          break;
        case 'tafsir':
          await offlineStorageService.clearTafsirCache();
          break;
        case 'prayer':
          await offlineStorageService.clearPrayerCache();
          break;
        case 'cache':
          await offlineStorageService.clearOtherCache();
          break;
        case 'all':
        default:
          await offlineStorageService.clearAllCache();
          break;
      }
      await refreshStorageInfo();
    } catch (error) {
      console.error('[useOfflineStorage] Failed to clear cache:', error);
      throw error;
    }
  }, [refreshStorageInfo]);

  return {
    storageInfo,
    isLoading,
    clearCache,
    refreshStorageInfo,
  };
}
