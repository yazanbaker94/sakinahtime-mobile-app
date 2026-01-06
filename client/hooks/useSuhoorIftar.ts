/**
 * useSuhoorIftar Hook
 * 
 * Manages Suhoor and Iftar times, countdowns, and notifications during Ramadan.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SuhoorIftarTimes, SuhoorIftarCountdown, SuhoorIftarSettings } from '../types/ramadan';
import { RAMADAN_STORAGE_KEYS, DEFAULT_SUHOOR_IFTAR_SETTINGS } from '../constants/ramadan';
import { useRamadan } from '../contexts/RamadanContext';
import { useLocation } from '../contexts/LocationContext';
import { usePrayerTimes } from './usePrayerTimes';

interface UseSuhoorIftarReturn {
  times: SuhoorIftarTimes | null;
  suhoorCountdown: SuhoorIftarCountdown;
  iftarCountdown: SuhoorIftarCountdown;
  isSuhoorTime: boolean;
  isIftarTime: boolean;
  isIftarNow: boolean;
  settings: SuhoorIftarSettings;
  updateSettings: (settings: Partial<SuhoorIftarSettings>) => Promise<void>;
  isLoading: boolean;
}

const ZERO_COUNTDOWN: SuhoorIftarCountdown = {
  hours: 0,
  minutes: 0,
  seconds: 0,
  totalSeconds: 0,
};

/**
 * Parse time string (HH:MM) to Date object for today
 */
function parseTimeToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Calculate countdown from now to target time
 */
function calculateCountdown(targetDate: Date): SuhoorIftarCountdown {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  
  if (diff <= 0) {
    return ZERO_COUNTDOWN;
  }
  
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return { hours, minutes, seconds, totalSeconds };
}

export function useSuhoorIftar(): UseSuhoorIftarReturn {
  const { isRamadan } = useRamadan();
  const { latitude, longitude } = useLocation();
  const { data: prayerData, isLoading: prayerLoading } = usePrayerTimes(latitude, longitude);
  
  const [settings, setSettings] = useState<SuhoorIftarSettings>(DEFAULT_SUHOOR_IFTAR_SETTINGS);
  const [suhoorCountdown, setSuhoorCountdown] = useState<SuhoorIftarCountdown>(ZERO_COUNTDOWN);
  const [iftarCountdown, setIftarCountdown] = useState<SuhoorIftarCountdown>(ZERO_COUNTDOWN);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load settings from storage
  useEffect(() => {
    async function loadSettings() {
      try {
        const stored = await AsyncStorage.getItem(RAMADAN_STORAGE_KEYS.SUHOOR_IFTAR_SETTINGS);
        if (stored) {
          setSettings({ ...DEFAULT_SUHOOR_IFTAR_SETTINGS, ...JSON.parse(stored) });
        }
      } catch (error) {
        console.error('Failed to load Suhoor/Iftar settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    }
    loadSettings();
  }, []);

  // Calculate times from prayer data
  const times = useMemo((): SuhoorIftarTimes | null => {
    if (!prayerData?.timings?.Fajr || !prayerData?.timings?.Maghrib) {
      return null;
    }
    
    // Extract time without timezone suffix (e.g., "04:32 (EDT)" -> "04:32")
    const fajrTime = prayerData.timings.Fajr.split(' ')[0];
    const maghribTime = prayerData.timings.Maghrib.split(' ')[0];
    
    return {
      suhoorEnd: fajrTime,
      iftarTime: maghribTime,
      suhoorEndDate: parseTimeToDate(fajrTime),
      iftarDate: parseTimeToDate(maghribTime),
    };
  }, [prayerData?.timings?.Fajr, prayerData?.timings?.Maghrib]);

  // Update countdowns every second
  useEffect(() => {
    if (!times) return;

    const updateCountdowns = () => {
      setSuhoorCountdown(calculateCountdown(times.suhoorEndDate));
      setIftarCountdown(calculateCountdown(times.iftarDate));
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);

    return () => clearInterval(interval);
  }, [times]);

  // Determine if it's Suhoor time (within 60 minutes of Fajr)
  const isSuhoorTime = useMemo(() => {
    if (!times) return false;
    const now = new Date();
    const minutesUntilFajr = (times.suhoorEndDate.getTime() - now.getTime()) / (1000 * 60);
    return minutesUntilFajr > 0 && minutesUntilFajr <= 60;
  }, [times, suhoorCountdown]); // Re-evaluate when countdown changes

  // Determine if it's almost Iftar time (within 30 minutes of Maghrib)
  const isIftarTime = useMemo(() => {
    if (!times) return false;
    const now = new Date();
    const minutesUntilMaghrib = (times.iftarDate.getTime() - now.getTime()) / (1000 * 60);
    return minutesUntilMaghrib > 0 && minutesUntilMaghrib <= 30;
  }, [times, iftarCountdown]); // Re-evaluate when countdown changes

  // Determine if Iftar has arrived
  const isIftarNow = useMemo(() => {
    if (!times) return false;
    const now = new Date();
    // Iftar is "now" for 15 minutes after Maghrib
    const minutesSinceMaghrib = (now.getTime() - times.iftarDate.getTime()) / (1000 * 60);
    return minutesSinceMaghrib >= 0 && minutesSinceMaghrib <= 15;
  }, [times, iftarCountdown]);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<SuhoorIftarSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      await AsyncStorage.setItem(
        RAMADAN_STORAGE_KEYS.SUHOOR_IFTAR_SETTINGS,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error('Failed to save Suhoor/Iftar settings:', error);
    }
  }, [settings]);

  return {
    times,
    suhoorCountdown,
    iftarCountdown,
    isSuhoorTime,
    isIftarTime,
    isIftarNow,
    settings,
    updateSettings,
    isLoading: prayerLoading || !settingsLoaded,
  };
}

// Export utility functions for testing
export { calculateCountdown, parseTimeToDate };
