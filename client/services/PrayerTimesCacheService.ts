/**
 * PrayerTimesCacheService
 * 
 * Manages caching of prayer times for offline access.
 * Caches prayer times for 30 days ahead and handles
 * cache invalidation on location/method changes.
 */

import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CachedPrayerTimes } from '../types/offline';
import { CACHE_DURATIONS, STORAGE_KEYS, OFFLINE_DIRS } from '../constants/offline';

interface CacheMeta {
  locations: {
    [key: string]: {
      method: number;
      cachedDates: string[];
      lastSync: number;
    };
  };
}

class PrayerTimesCacheServiceImpl {
  private static instance: PrayerTimesCacheServiceImpl;
  private cacheDir: string;
  private meta: CacheMeta = { locations: {} };
  private initialized = false;

  private constructor() {
    this.cacheDir = `${FileSystem.documentDirectory}${OFFLINE_DIRS.PRAYER_CACHE}/`;
  }

  static getInstance(): PrayerTimesCacheServiceImpl {
    if (!PrayerTimesCacheServiceImpl.instance) {
      PrayerTimesCacheServiceImpl.instance = new PrayerTimesCacheServiceImpl();
    }
    return PrayerTimesCacheServiceImpl.instance;
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure cache directory exists
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }

      // Load metadata
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PRAYER_CACHE_META);
      if (stored) {
        this.meta = JSON.parse(stored);
      }

      this.initialized = true;
    } catch (error) {
      console.error('[PrayerTimesCacheService] Failed to initialize:', error);
    }
  }

  /**
   * Generate location key from coordinates
   */
  private getLocationKey(lat: number, lng: number): string {
    // Round to 2 decimal places (~1km precision)
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLng = Math.round(lng * 100) / 100;
    return `${roundedLat}_${roundedLng}`;
  }

  /**
   * Get cache file path for a specific date and location
   */
  private getCacheFilePath(locationKey: string, method: number, date: string): string {
    return `${this.cacheDir}${locationKey}_${method}_${date}.json`;
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Save metadata
   */
  private async saveMeta(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PRAYER_CACHE_META, JSON.stringify(this.meta));
    } catch (error) {
      console.error('[PrayerTimesCacheService] Failed to save meta:', error);
    }
  }

  /**
   * Cache prayer times for a single day
   */
  async cachePrayerTimes(
    data: {
      timings: CachedPrayerTimes['timings'];
      date: { gregorian: { date: string } };
    },
    location: { lat: number; lng: number },
    method: number
  ): Promise<void> {
    await this.initialize();

    try {
      const locationKey = this.getLocationKey(location.lat, location.lng);
      const dateStr = data.date.gregorian.date; // DD-MM-YYYY format from API
      const [day, month, year] = dateStr.split('-');
      const normalizedDate = `${year}-${month}-${day}`; // YYYY-MM-DD

      const cached: CachedPrayerTimes = {
        latitude: location.lat,
        longitude: location.lng,
        method,
        date: normalizedDate,
        timings: data.timings,
        cachedAt: Date.now(),
        expiresAt: Date.now() + CACHE_DURATIONS.PRAYER_TIMES_DAYS * 24 * 60 * 60 * 1000,
      };

      const filePath = this.getCacheFilePath(locationKey, method, normalizedDate);
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(cached));

      // Update metadata
      if (!this.meta.locations[locationKey]) {
        this.meta.locations[locationKey] = {
          method,
          cachedDates: [],
          lastSync: Date.now(),
        };
      }

      if (!this.meta.locations[locationKey].cachedDates.includes(normalizedDate)) {
        this.meta.locations[locationKey].cachedDates.push(normalizedDate);
      }
      this.meta.locations[locationKey].lastSync = Date.now();
      this.meta.locations[locationKey].method = method;

      await this.saveMeta();
    } catch (error) {
      console.error('[PrayerTimesCacheService] Failed to cache prayer times:', error);
      throw error;
    }
  }

  /**
   * Get cached prayer times for a specific date
   */
  async getCachedPrayerTimes(
    date: Date,
    location: { lat: number; lng: number },
    method: number
  ): Promise<CachedPrayerTimes | null> {
    await this.initialize();

    try {
      const locationKey = this.getLocationKey(location.lat, location.lng);
      const dateStr = this.formatDate(date);
      const filePath = this.getCacheFilePath(locationKey, method, dateStr);

      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        return null;
      }

      const content = await FileSystem.readAsStringAsync(filePath);
      const cached: CachedPrayerTimes = JSON.parse(content);

      // Check if expired
      if (cached.expiresAt < Date.now()) {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
        return null;
      }

      return cached;
    } catch (error) {
      console.error('[PrayerTimesCacheService] Failed to get cached prayer times:', error);
      return null;
    }
  }

  /**
   * Cache prayer times for multiple days ahead
   */
  async cacheNextDays(
    days: number,
    location: { lat: number; lng: number },
    method: number,
    fetchFn: (date: Date) => Promise<any>
  ): Promise<void> {
    await this.initialize();

    const today = new Date();
    const promises: Promise<void>[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      // Check if already cached
      const cached = await this.getCachedPrayerTimes(date, location, method);
      if (!cached) {
        promises.push(
          fetchFn(date)
            .then(data => this.cachePrayerTimes(data, location, method))
            .catch(error => {
              console.error(`[PrayerTimesCacheService] Failed to cache day ${i}:`, error);
            })
        );
      }
    }

    await Promise.all(promises);
  }

  /**
   * Get cache status
   */
  async getCacheStatus(): Promise<{
    cachedDays: number;
    oldestDate: Date | null;
    newestDate: Date | null;
    lastSync: Date | null;
  }> {
    await this.initialize();

    let cachedDays = 0;
    let oldestDate: Date | null = null;
    let newestDate: Date | null = null;
    let lastSync: Date | null = null;

    for (const locationKey in this.meta.locations) {
      const loc = this.meta.locations[locationKey];
      cachedDays += loc.cachedDates.length;

      if (loc.lastSync && (!lastSync || loc.lastSync > lastSync.getTime())) {
        lastSync = new Date(loc.lastSync);
      }

      for (const dateStr of loc.cachedDates) {
        const date = new Date(dateStr);
        if (!oldestDate || date < oldestDate) oldestDate = date;
        if (!newestDate || date > newestDate) newestDate = date;
      }
    }

    return { cachedDays, oldestDate, newestDate, lastSync };
  }

  /**
   * Invalidate all cache
   */
  async invalidateCache(): Promise<void> {
    await this.initialize();

    try {
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }

      this.meta = { locations: {} };
      await this.saveMeta();
    } catch (error) {
      console.error('[PrayerTimesCacheService] Failed to invalidate cache:', error);
      throw error;
    }
  }

  /**
   * Invalidate cache for a specific location
   */
  async invalidateForLocation(lat: number, lng: number): Promise<void> {
    await this.initialize();

    try {
      const locationKey = this.getLocationKey(lat, lng);
      const loc = this.meta.locations[locationKey];

      if (loc) {
        // Delete all cached files for this location
        for (const dateStr of loc.cachedDates) {
          const filePath = this.getCacheFilePath(locationKey, loc.method, dateStr);
          await FileSystem.deleteAsync(filePath, { idempotent: true });
        }

        delete this.meta.locations[locationKey];
        await this.saveMeta();
      }
    } catch (error) {
      console.error('[PrayerTimesCacheService] Failed to invalidate location cache:', error);
      throw error;
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<void> {
    await this.initialize();

    try {
      const now = Date.now();

      for (const locationKey in this.meta.locations) {
        const loc = this.meta.locations[locationKey];
        const validDates: string[] = [];

        for (const dateStr of loc.cachedDates) {
          const filePath = this.getCacheFilePath(locationKey, loc.method, dateStr);
          
          try {
            const content = await FileSystem.readAsStringAsync(filePath);
            const cached: CachedPrayerTimes = JSON.parse(content);

            if (cached.expiresAt > now) {
              validDates.push(dateStr);
            } else {
              await FileSystem.deleteAsync(filePath, { idempotent: true });
            }
          } catch {
            // File doesn't exist or is corrupted, skip it
          }
        }

        loc.cachedDates = validDates;
      }

      await this.saveMeta();
    } catch (error) {
      console.error('[PrayerTimesCacheService] Failed to clear expired cache:', error);
    }
  }

  /**
   * Check if cache is stale (needs refresh)
   */
  async isCacheStale(location: { lat: number; lng: number }): Promise<boolean> {
    await this.initialize();

    const locationKey = this.getLocationKey(location.lat, location.lng);
    const loc = this.meta.locations[locationKey];

    if (!loc) return true;

    const staleThreshold = CACHE_DURATIONS.PRAYER_TIMES_STALE_HOURS * 60 * 60 * 1000;
    return Date.now() - loc.lastSync > staleThreshold;
  }

  /**
   * Check if location has changed significantly (>10km)
   */
  hasLocationChanged(
    oldLat: number,
    oldLng: number,
    newLat: number,
    newLng: number
  ): boolean {
    // Haversine formula for distance
    const R = 6371; // Earth's radius in km
    const dLat = (newLat - oldLat) * Math.PI / 180;
    const dLng = (newLng - oldLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(oldLat * Math.PI / 180) * Math.cos(newLat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance > 10; // More than 10km
  }
}

// Export singleton instance
export const prayerTimesCacheService = PrayerTimesCacheServiceImpl.getInstance();

// Export class for testing
export { PrayerTimesCacheServiceImpl };
