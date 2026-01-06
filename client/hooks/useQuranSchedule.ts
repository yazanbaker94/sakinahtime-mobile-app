/**
 * useQuranSchedule Hook
 * 
 * Manages the 30-day Quran reading schedule for Ramadan completion.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DayReading, QuranSchedule, QuranProgress, QuranScheduleSettings } from '../types/ramadan';
import {
  RAMADAN_STORAGE_KEYS,
  QURAN_TOTAL_PAGES,
  RAMADAN_DAYS,
  JUZ_SURAH_NAMES,
  DEFAULT_QURAN_SCHEDULE_SETTINGS,
} from '../constants/ramadan';
import { getJuzPageRange } from '../constants/quran-constants';
import { useRamadan } from '../contexts/RamadanContext';
import { ramadanService } from '../services/RamadanService';

interface UseQuranScheduleReturn {
  schedule: QuranSchedule | null;
  todayReading: DayReading | null;
  progress: QuranProgress;
  settings: QuranScheduleSettings;
  markDayComplete: (day: number) => Promise<void>;
  updatePagesRead: (day: number, pages: number) => Promise<void>;
  resetSchedule: () => Promise<void>;
  navigateToMushaf: (page: number) => void;
  updateSettings: (settings: Partial<QuranScheduleSettings>) => Promise<void>;
  isLoading: boolean;
}

const DEFAULT_PROGRESS: QuranProgress = {
  totalPages: QURAN_TOTAL_PAGES,
  pagesRead: 0,
  percentComplete: 0,
  daysCompleted: 0,
  totalDays: RAMADAN_DAYS,
  onTrack: true,
  daysBehind: 0,
};

/**
 * Generate a 30-day Quran reading schedule using actual Juz page boundaries
 */
export function generateQuranSchedule(startDate: Date, hijriYear: number): QuranSchedule {
  const readings: DayReading[] = [];
  
  for (let i = 0; i < RAMADAN_DAYS; i++) {
    const day = i + 1;
    const juzNumber = day; // One Juz per day
    
    // Use actual Juz page boundaries instead of evenly dividing
    const { start: startPage, end: endPage } = getJuzPageRange(juzNumber);
    
    readings.push({
      day,
      juzNumber,
      startPage,
      endPage,
      surahNames: JUZ_SURAH_NAMES[juzNumber] || [],
      pagesTotal: endPage - startPage + 1,
      pagesRead: 0,
      completed: false,
      completedAt: null,
    });
  }
  
  return {
    year: hijriYear,
    startDate,
    readings,
  };
}

/**
 * Calculate progress from schedule
 */
export function calculateProgress(schedule: QuranSchedule | null, currentDay: number | null): QuranProgress {
  if (!schedule) {
    return DEFAULT_PROGRESS;
  }
  
  const pagesRead = schedule.readings.reduce((sum, r) => sum + r.pagesRead, 0);
  const daysCompleted = schedule.readings.filter(r => r.completed).length;
  const percentComplete = Math.round((pagesRead / QURAN_TOTAL_PAGES) * 100);
  
  // Calculate if on track
  const expectedDaysCompleted = currentDay || 0;
  const daysBehind = Math.max(0, expectedDaysCompleted - daysCompleted);
  const onTrack = daysBehind === 0;
  
  return {
    totalPages: QURAN_TOTAL_PAGES,
    pagesRead,
    percentComplete,
    daysCompleted,
    totalDays: RAMADAN_DAYS,
    onTrack,
    daysBehind,
  };
}

export function useQuranSchedule(): UseQuranScheduleReturn {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { isRamadan, currentDay, ramadanYear } = useRamadan();
  
  const [schedule, setSchedule] = useState<QuranSchedule | null>(null);
  const [settings, setSettings] = useState<QuranScheduleSettings>(DEFAULT_QURAN_SCHEDULE_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Get storage key for current year
  const storageKey = useMemo(() => {
    if (!ramadanYear) return null;
    return RAMADAN_STORAGE_KEYS.QURAN_SCHEDULE(ramadanYear);
  }, [ramadanYear]);

  // Load schedule function
  const loadSchedule = useCallback(async () => {
    if (!storageKey || !ramadanYear) {
      setIsLoading(false);
      return;
    }

    try {
      const [storedSchedule, storedSettings] = await AsyncStorage.multiGet([
        storageKey,
        RAMADAN_STORAGE_KEYS.QURAN_SCHEDULE_SETTINGS,
      ]);

      let scheduleToUse: QuranSchedule | null = null;

      if (storedSchedule[1]) {
        const parsed = JSON.parse(storedSchedule[1]);
        // Convert date strings back to Date objects
        parsed.startDate = new Date(parsed.startDate);
        parsed.readings = parsed.readings.map((r: any) => ({
          ...r,
          completedAt: r.completedAt ? new Date(r.completedAt) : null,
        }));
        
        // Validate schedule - check if page ranges are correct
        // If any reading has invalid pages (e.g., startPage > 604), regenerate
        const hasInvalidPages = parsed.readings.some((r: DayReading) => 
          r.startPage > QURAN_TOTAL_PAGES || r.endPage > QURAN_TOTAL_PAGES || r.startPage > r.endPage
        );
        
        if (hasInvalidPages) {
          // Regenerate schedule with correct page ranges, preserving completion status
          const dates = ramadanService.getRamadanDates(ramadanYear);
          const newSchedule = generateQuranSchedule(dates.startDate, ramadanYear);
          
          // Preserve completion status from old schedule
          newSchedule.readings = newSchedule.readings.map((r, idx) => {
            const oldReading = parsed.readings[idx];
            if (oldReading) {
              return {
                ...r,
                completed: oldReading.completed,
                completedAt: oldReading.completedAt,
                pagesRead: oldReading.completed ? r.pagesTotal : 0,
              };
            }
            return r;
          });
          
          scheduleToUse = newSchedule;
          await AsyncStorage.setItem(storageKey, JSON.stringify(newSchedule));
        } else {
          scheduleToUse = parsed;
        }
      } else if (isRamadan) {
        // Generate new schedule if none exists and it's Ramadan
        const dates = ramadanService.getRamadanDates(ramadanYear);
        scheduleToUse = generateQuranSchedule(dates.startDate, ramadanYear);
        await AsyncStorage.setItem(storageKey, JSON.stringify(scheduleToUse));
      }

      setSchedule(scheduleToUse);

      if (storedSettings[1]) {
        setSettings({ ...DEFAULT_QURAN_SCHEDULE_SETTINGS, ...JSON.parse(storedSettings[1]) });
      }
    } catch (error) {
      console.error('Failed to load Quran schedule:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey, ramadanYear, isRamadan]);

  // Load schedule from storage on mount
  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSchedule();
    }, [loadSchedule])
  );

  // Get today's reading
  const todayReading = useMemo(() => {
    if (!schedule || !currentDay) return null;
    return schedule.readings.find(r => r.day === currentDay) || null;
  }, [schedule, currentDay]);

  // Calculate progress
  const progress = useMemo(() => {
    return calculateProgress(schedule, currentDay);
  }, [schedule, currentDay]);

  // Save schedule to storage
  const saveSchedule = useCallback(async (newSchedule: QuranSchedule) => {
    if (!storageKey) return;
    setSchedule(newSchedule);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(newSchedule));
    } catch (error) {
      console.error('Failed to save Quran schedule:', error);
    }
  }, [storageKey]);

  // Mark a day as complete
  const markDayComplete = useCallback(async (day: number) => {
    if (!schedule) return;
    
    const newReadings = schedule.readings.map(r => {
      if (r.day === day) {
        return {
          ...r,
          completed: true,
          completedAt: new Date(),
          pagesRead: r.pagesTotal,
        };
      }
      return r;
    });
    
    await saveSchedule({ ...schedule, readings: newReadings });
  }, [schedule, saveSchedule]);

  // Update pages read for a day
  const updatePagesRead = useCallback(async (day: number, pages: number) => {
    if (!schedule) return;
    
    const newReadings = schedule.readings.map(r => {
      if (r.day === day) {
        const pagesRead = Math.min(pages, r.pagesTotal);
        return {
          ...r,
          pagesRead,
          completed: pagesRead >= r.pagesTotal,
          completedAt: pagesRead >= r.pagesTotal ? new Date() : r.completedAt,
        };
      }
      return r;
    });
    
    await saveSchedule({ ...schedule, readings: newReadings });
  }, [schedule, saveSchedule]);

  // Reset schedule
  const resetSchedule = useCallback(async () => {
    if (!storageKey || !ramadanYear) return;
    
    const dates = ramadanService.getRamadanDates(ramadanYear);
    const newSchedule = generateQuranSchedule(dates.startDate, ramadanYear);
    await saveSchedule(newSchedule);
  }, [storageKey, ramadanYear, saveSchedule]);

  // Navigate to Mushaf at specific page
  const navigateToMushaf = useCallback((page: number) => {
    navigation.navigate('Mushaf', { page });
  }, [navigation]);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<QuranScheduleSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      await AsyncStorage.setItem(
        RAMADAN_STORAGE_KEYS.QURAN_SCHEDULE_SETTINGS,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error('Failed to save Quran schedule settings:', error);
    }
  }, [settings]);

  return {
    schedule,
    todayReading,
    progress,
    settings,
    markDayComplete,
    updatePagesRead,
    resetSchedule,
    navigateToMushaf,
    updateSettings,
    isLoading,
  };
}
