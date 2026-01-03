/**
 * usePrayerTimesCache Hook
 * 
 * Manages prayer times caching for offline access.
 */

import { useState, useEffect, useCallback } from 'react';
import { prayerTimesCacheService } from '../services/PrayerTimesCacheService';

interface CacheStatus {
  cachedDays: number;
  lastSync: Date | null;
  isStale: boolean;
}

export function usePrayerTimesCache(location: { lat: number; lng: number } | null) {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadCacheStatus = useCallback(async () => {
    if (!location) {
      setCacheStatus(null);
      setIsLoading(false);
      return;
    }

    try {
      await prayerTimesCacheService.initialize();
      const status = await prayerTimesCacheService.getCacheStatus();
      const isStale = await prayerTimesCacheService.isCacheStale(location);

      setCacheStatus({
        cachedDays: status.cachedDays,
        lastSync: status.lastSync,
        isStale,
      });
    } catch (error) {
      console.error('[usePrayerTimesCache] Failed to load cache status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [location?.lat, location?.lng]);

  useEffect(() => {
    loadCacheStatus();
  }, [loadCacheStatus]);

  const refreshCache = useCallback(async () => {
    if (!location) return;

    setIsLoading(true);
    try {
      await prayerTimesCacheService.clearExpiredCache();
      await loadCacheStatus();
    } catch (error) {
      console.error('[usePrayerTimesCache] Failed to refresh cache:', error);
    } finally {
      setIsLoading(false);
    }
  }, [location, loadCacheStatus]);

  const clearCache = useCallback(async () => {
    try {
      await prayerTimesCacheService.invalidateCache();
      setCacheStatus({
        cachedDays: 0,
        lastSync: null,
        isStale: true,
      });
    } catch (error) {
      console.error('[usePrayerTimesCache] Failed to clear cache:', error);
      throw error;
    }
  }, []);

  const getCachedPrayerTimes = useCallback(async (date: Date, method: number) => {
    if (!location) return null;

    try {
      const cached = await prayerTimesCacheService.getCachedPrayerTimes(
        date,
        location,
        method
      );
      setIsUsingCache(cached !== null);
      return cached;
    } catch (error) {
      console.error('[usePrayerTimesCache] Failed to get cached prayer times:', error);
      return null;
    }
  }, [location]);

  const cachePrayerTimes = useCallback(async (data: any, method: number) => {
    if (!location) return;

    try {
      await prayerTimesCacheService.cachePrayerTimes(data, location, method);
      await loadCacheStatus();
    } catch (error) {
      console.error('[usePrayerTimesCache] Failed to cache prayer times:', error);
    }
  }, [location, loadCacheStatus]);

  return {
    cacheStatus,
    isUsingCache,
    isLoading,
    refreshCache,
    clearCache,
    getCachedPrayerTimes,
    cachePrayerTimes,
    setIsUsingCache,
  };
}
