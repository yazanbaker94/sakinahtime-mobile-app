/**
 * useTaraweehTracker Hook
 * 
 * Manages Taraweeh prayer logging and statistics during Ramadan.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TaraweehEntry, TaraweehStats } from '../types/ramadan';
import { RAMADAN_STORAGE_KEYS, RAMADAN_DAYS } from '../constants/ramadan';
import { useRamadan } from '../contexts/RamadanContext';

interface UseTaraweehTrackerReturn {
  entries: TaraweehEntry[];
  todayEntry: TaraweehEntry | null;
  stats: TaraweehStats;
  logTaraweeh: (entry: Omit<TaraweehEntry, 'id' | 'createdAt'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<TaraweehEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getEntryForDate: (date: Date) => TaraweehEntry | null;
  isLoading: boolean;
}

const DEFAULT_STATS: TaraweehStats = {
  totalNights: RAMADAN_DAYS,
  nightsCompleted: 0,
  currentStreak: 0,
  bestStreak: 0,
  mosqueNights: 0,
  homeNights: 0,
  completionRate: 0,
};

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `taraweeh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Calculate streak from entries
 */
export function calculateStreak(entries: TaraweehEntry[], currentDay: number | null): { current: number; best: number } {
  if (entries.length === 0 || !currentDay) {
    return { current: 0, best: 0 };
  }

  // Sort entries by hijriDay
  const sortedEntries = [...entries].sort((a, b) => a.hijriDay - b.hijriDay);
  
  // Get unique days with entries
  const daysWithEntries = new Set(sortedEntries.map(e => e.hijriDay));
  
  // Calculate current streak (consecutive days ending at current day or yesterday)
  let currentStreak = 0;
  for (let day = currentDay; day >= 1; day--) {
    if (daysWithEntries.has(day)) {
      currentStreak++;
    } else if (day < currentDay) {
      // Allow gap for today if not logged yet
      break;
    }
  }
  
  // If today not logged, check streak ending yesterday
  if (!daysWithEntries.has(currentDay) && currentDay > 1) {
    let streakFromYesterday = 0;
    for (let day = currentDay - 1; day >= 1; day--) {
      if (daysWithEntries.has(day)) {
        streakFromYesterday++;
      } else {
        break;
      }
    }
    currentStreak = Math.max(currentStreak, streakFromYesterday);
  }
  
  // Calculate best streak
  let bestStreak = 0;
  let tempStreak = 0;
  
  for (let day = 1; day <= RAMADAN_DAYS; day++) {
    if (daysWithEntries.has(day)) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  
  return { current: currentStreak, best: bestStreak };
}

/**
 * Calculate statistics from entries
 */
export function calculateStats(entries: TaraweehEntry[], currentDay: number | null): TaraweehStats {
  if (entries.length === 0) {
    return DEFAULT_STATS;
  }

  const nightsCompleted = new Set(entries.map(e => e.hijriDay)).size;
  const mosqueNights = entries.filter(e => e.location === 'mosque').length;
  const homeNights = entries.filter(e => e.location === 'home').length;
  const { current, best } = calculateStreak(entries, currentDay);
  const completionRate = Math.round((nightsCompleted / RAMADAN_DAYS) * 100);

  return {
    totalNights: RAMADAN_DAYS,
    nightsCompleted,
    currentStreak: current,
    bestStreak: best,
    mosqueNights,
    homeNights,
    completionRate,
  };
}

export function useTaraweehTracker(): UseTaraweehTrackerReturn {
  const { ramadanYear, currentDay } = useRamadan();
  
  const [entries, setEntries] = useState<TaraweehEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get storage key for current year
  const storageKey = useMemo(() => {
    if (!ramadanYear) return null;
    return RAMADAN_STORAGE_KEYS.TARAWEEH_ENTRIES(ramadanYear);
  }, [ramadanYear]);

  // Load entries function
  const loadEntries = useCallback(async () => {
    if (!storageKey) {
      setIsLoading(false);
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const entriesWithDates = parsed.map((e: any) => ({
          ...e,
          date: new Date(e.date),
          createdAt: new Date(e.createdAt),
        }));
        setEntries(entriesWithDates);
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error('Failed to load Taraweeh entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  // Load entries from storage on mount
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  // Save entries to storage
  const saveEntries = useCallback(async (newEntries: TaraweehEntry[]) => {
    if (!storageKey) return;
    setEntries(newEntries);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(newEntries));
    } catch (error) {
      console.error('Failed to save Taraweeh entries:', error);
    }
  }, [storageKey]);

  // Get today's entry
  const todayEntry = useMemo(() => {
    if (!currentDay) return null;
    return entries.find(e => e.hijriDay === currentDay) || null;
  }, [entries, currentDay]);

  // Calculate stats
  const stats = useMemo(() => {
    return calculateStats(entries, currentDay);
  }, [entries, currentDay]);

  // Log Taraweeh
  const logTaraweeh = useCallback(async (entry: Omit<TaraweehEntry, 'id' | 'createdAt'>) => {
    const newEntry: TaraweehEntry = {
      ...entry,
      id: generateId(),
      createdAt: new Date(),
    };
    
    // Remove existing entry for the same day if exists
    const filteredEntries = entries.filter(e => e.hijriDay !== entry.hijriDay);
    await saveEntries([...filteredEntries, newEntry]);
  }, [entries, saveEntries]);

  // Update entry
  const updateEntry = useCallback(async (id: string, updates: Partial<TaraweehEntry>) => {
    const newEntries = entries.map(e => {
      if (e.id === id) {
        return { ...e, ...updates };
      }
      return e;
    });
    await saveEntries(newEntries);
  }, [entries, saveEntries]);

  // Delete entry
  const deleteEntry = useCallback(async (id: string) => {
    const newEntries = entries.filter(e => e.id !== id);
    await saveEntries(newEntries);
  }, [entries, saveEntries]);

  // Get entry for specific date
  const getEntryForDate = useCallback((date: Date): TaraweehEntry | null => {
    return entries.find(e => isSameDay(e.date, date)) || null;
  }, [entries]);

  return {
    entries,
    todayEntry,
    stats,
    logTaraweeh,
    updateEntry,
    deleteEntry,
    getEntryForDate,
    isLoading,
  };
}
