import { useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback } from "react";
import { prayerTimesCacheService } from "../services/PrayerTimesCacheService";
import { prayerTimesPreloader } from "../services/PrayerTimesPreloader";
import { widgetDataService } from "../services/WidgetDataService";
import { useNetworkStatus } from "./useNetworkStatus";

export const CALCULATION_METHODS = [
  { id: 0, name: "Shia Ithna-Ansari" },
  { id: 1, name: "University of Islamic Sciences, Karachi" },
  { id: 2, name: "Islamic Society of North America" },
  { id: 3, name: "Muslim World League" },
  { id: 4, name: "Umm Al-Qura University, Makkah" },
  { id: 5, name: "Egyptian General Authority of Survey" },
  { id: 7, name: "Institute of Geophysics, University of Tehran" },
  { id: 8, name: "Gulf Region" },
  { id: 9, name: "Kuwait" },
  { id: 10, name: "Qatar" },
  { id: 11, name: "Majlis Ugama Islam Singapura, Singapore" },
  { id: 12, name: "Union Organization Islamic de France" },
  { id: 13, name: "Diyanet İşleri Başkanlığı, Turkey" },
  { id: 14, name: "Spiritual Administration of Muslims of Russia" },
  { id: 15, name: "Moonsighting Committee Worldwide" },
  { id: 16, name: "Ministry of Awqaf, Islamic Affairs, Jordan" },
];

const CALCULATION_METHOD_KEY = "@prayer_calculation_method";

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
}

export interface HijriDate {
  day: string;
  weekday: { en: string; ar: string };
  month: { number: number; en: string; ar: string };
  year: string;
  designation: { abbreviated: string; expanded: string };
}

export interface GregorianDate {
  date: string;
  day: string;
  weekday: { en: string };
  month: { number: number; en: string };
  year: string;
}

export interface PrayerTimesData {
  timings: PrayerTimes;
  date: {
    hijri: HijriDate;
    gregorian: GregorianDate;
  };
  meta: {
    timezone: string;
  };
}

async function fetchPrayerTimes(latitude: number, longitude: number, method: number = 2): Promise<PrayerTimesData> {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    throw new Error("Invalid location coordinates");
  }

  const validMethod = method ?? 2;

  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const url = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${latitude}&longitude=${longitude}&method=${validMethod}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch prayer times");
  }

  const data = await response.json();

  if (data.code !== 200 || !data.data) {
    throw new Error("Invalid response from prayer times API");
  }

  return data.data;
}

export function usePrayerTimes(latitude: number | null, longitude: number | null, method: number = 2) {
  const enabled = latitude !== null && longitude !== null;
  const { isOnline, lastOnline } = useNetworkStatus();
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [cacheLastSync, setCacheLastSync] = useState<Date | null>(null);

  // Get preloaded data from singleton (already loaded at app startup via LocationContext)
  const preloaded = enabled ? prayerTimesPreloader.getPreloadedData() : { data: null, cachedAt: null, isLoaded: false };

  // Use preloaded data as placeholder for instant display
  const placeholderData = preloaded.data as PrayerTimesData | undefined;

  const query = useQuery({
    queryKey: ["prayerTimes", latitude, longitude, method],
    queryFn: async () => {
      if (latitude === null || longitude === null) {
        throw new Error("Location not available");
      }

      // If online, fetch from API and cache the result
      if (isOnline) {
        try {
          const data = await fetchPrayerTimes(latitude, longitude, method);
          setIsUsingCache(false);

          // Cache the prayer times for offline use
          try {
            await prayerTimesCacheService.initialize();
            await prayerTimesCacheService.cachePrayerTimes(
              data,
              { lat: latitude, lng: longitude },
              method
            );
          } catch (cacheError) {
            console.warn('[usePrayerTimes] Failed to cache prayer times:', cacheError);
          }

          // Update widget data
          try {
            await widgetDataService.updatePrayerTimes(data.timings, '');
          } catch (widgetError) {
            console.warn('[usePrayerTimes] Failed to update widget:', widgetError);
          }

          // Update preloader with fresh data for future instant loads
          prayerTimesPreloader.updateData(data);

          return data;
        } catch (error) {
          // If online fetch fails, try cache as fallback
          console.warn('[usePrayerTimes] Online fetch failed, trying cache:', error);
          const cached = await getCachedData(latitude, longitude, method);
          if (cached && cached.date && cached.timings) {
            const transformed = transformCachedData(cached);
            if (transformed) {
              setIsUsingCache(true);
              setCacheLastSync(new Date(cached.cachedAt));
              return transformed;
            }
          }
          throw error;
        }
      }

      // If offline, use cached data
      const cached = await getCachedData(latitude, longitude, method);
      if (cached && cached.date && cached.timings) {
        const transformed = transformCachedData(cached);
        if (transformed) {
          setIsUsingCache(true);
          setCacheLastSync(new Date(cached.cachedAt));
          return transformed;
        }
      }

      throw new Error("No cached prayer times available while offline");
    },
    enabled,
    placeholderData, // Show cached data instantly while fetching
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24,
    retry: isOnline ? 2 : 0, // Don't retry when offline
  });

  return {
    ...query,
    isUsingCache,
    cacheLastSync,
    isOffline: !isOnline,
    // Only show loading if we have no data at all
    isLoading: query.isLoading && !placeholderData,
  };
}

/**
 * Get cached prayer times data
 */
async function getCachedData(latitude: number, longitude: number, method: number) {
  try {
    await prayerTimesCacheService.initialize();
    const cached = await prayerTimesCacheService.getCachedPrayerTimes(
      new Date(),
      { lat: latitude, lng: longitude },
      method
    );
    return cached;
  } catch (error) {
    console.error('[usePrayerTimes] Failed to get cached data:', error);
    return null;
  }
}

/**
 * Transform cached data to match API response format
 */
function transformCachedData(cached: any): PrayerTimesData | null {
  // Validate required fields
  if (!cached || !cached.date || !cached.timings) {
    console.warn('[usePrayerTimes] Invalid cached data structure');
    return null;
  }

  try {
    const [year, month, day] = cached.date.split('-');
    const date = new Date(cached.date);

    return {
      timings: cached.timings,
      date: {
        hijri: {
          day: day || '1',
          weekday: { en: '', ar: '' },
          month: { number: parseInt(month) || 1, en: '', ar: '' },
          year: year || '1446',
          designation: { abbreviated: 'AH', expanded: 'Anno Hegirae' },
        },
        gregorian: {
          date: `${day}-${month}-${year}`,
          day: day || '1',
          weekday: { en: date.toLocaleDateString('en-US', { weekday: 'long' }) },
          month: { number: parseInt(month) || 1, en: date.toLocaleDateString('en-US', { month: 'long' }) },
          year: year || '2025',
        },
      },
      meta: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
  } catch (error) {
    console.warn('[usePrayerTimes] Error transforming cached data:', error);
    return null;
  }
}

export function useCalculationMethod() {
  const queryClient = useQueryClient();

  // Use React Query to share calculation method state across components
  const { data: method = 2, isLoading } = useQuery({
    queryKey: ["calculationMethod"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(CALCULATION_METHOD_KEY);
      if (stored !== null) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
      return 2; // Default method
    },
    staleTime: Infinity, // Never consider stale - only update when we explicitly set it
  });

  const saveMethod = async (newMethod: number) => {
    try {
      await AsyncStorage.setItem(CALCULATION_METHOD_KEY, newMethod.toString());
      // Update the cached calculation method
      queryClient.setQueryData(["calculationMethod"], newMethod);
      // Invalidate prayer times queries to force refetch with new method
      queryClient.invalidateQueries({ queryKey: ["prayerTimes"] });
    } catch (e) {
      console.error("Failed to save calculation method:", e);
    }
  };

  return { method, setMethod: saveMethod, isLoading };
}

export function getNextPrayer(timings: PrayerTimes): { name: string; time: string; nameAr: string } | null {
  // Return null if timings is undefined or missing required values
  if (!timings || !timings.Fajr) {
    return null;
  }

  const prayers = [
    { name: "Fajr", nameAr: "الفجر", time: timings.Fajr },
    { name: "Dhuhr", nameAr: "الظهر", time: timings.Dhuhr },
    { name: "Asr", nameAr: "العصر", time: timings.Asr },
    { name: "Maghrib", nameAr: "المغرب", time: timings.Maghrib },
    { name: "Isha", nameAr: "العشاء", time: timings.Isha },
  ];

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const prayer of prayers) {
    if (!prayer.time) continue; // Skip if time is undefined
    const [hours, minutes] = prayer.time.split(":").map(Number);
    const prayerMinutes = hours * 60 + minutes;

    if (prayerMinutes > currentMinutes) {
      return prayer;
    }
  }

  return prayers[0];
}

export function getTimeUntilPrayer(prayerTime: string): { hours: number; minutes: number; seconds: number } {
  if (!prayerTime) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }

  const now = new Date();
  const [prayerHours, prayerMinutes] = prayerTime.split(":").map(Number);

  let prayerDate = new Date(now);
  prayerDate.setHours(prayerHours, prayerMinutes, 0, 0);

  if (prayerDate <= now) {
    prayerDate.setDate(prayerDate.getDate() + 1);
  }

  const diff = prayerDate.getTime() - now.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

export function formatTime(time: string): string {
  if (!time) {
    return '--:--';
  }

  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function isPrayerPast(prayerTime: string): boolean {
  if (!prayerTime) {
    return false;
  }

  const now = new Date();
  const [hours, minutes] = prayerTime.split(":").map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const prayerMinutes = hours * 60 + minutes;
  return prayerMinutes < currentMinutes;
}
