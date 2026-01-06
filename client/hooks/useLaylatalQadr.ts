/**
 * useLaylatalQadr Hook
 * 
 * Manages Laylatul Qadr (Night of Power) features during the last 10 nights of Ramadan.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IbaadahItem, LaylatalQadrDua } from '../types/ramadan';
import { 
  RAMADAN_STORAGE_KEYS, 
  LAYLATUL_QADR_NIGHTS, 
  DEFAULT_IBAADAH_ITEMS, 
  LAYLATUL_QADR_DUAS 
} from '../constants/ramadan';
import { useRamadan } from '../contexts/RamadanContext';

interface UseLaylatalQadrReturn {
  isLastTenNights: boolean;
  currentNight: number | null;
  isOddNight: boolean;
  nightsRemaining: number;
  daysUntilLastTen: number;
  ibaadahChecklist: IbaadahItem[];
  specialDuas: LaylatalQadrDua[];
  toggleIbaadah: (id: string) => Promise<void>;
  resetTonightChecklist: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Check if a night is an odd night (potential Laylatul Qadr)
 */
export function isOddNightCheck(day: number | null): boolean {
  if (day === null) return false;
  return LAYLATUL_QADR_NIGHTS.includes(day);
}

/**
 * Calculate days until last 10 nights begin
 */
export function calculateDaysUntilLastTen(currentDay: number | null): number {
  if (currentDay === null) return 0;
  if (currentDay >= 21) return 0;
  return 21 - currentDay;
}

/**
 * Calculate nights remaining in Ramadan
 */
export function calculateNightsRemaining(currentDay: number | null): number {
  if (currentDay === null) return 0;
  return Math.max(0, 30 - currentDay);
}

export function useLaylatalQadr(): UseLaylatalQadrReturn {
  const { ramadanYear, currentDay, isLastTenNights } = useRamadan();
  
  const [ibaadahChecklist, setIbaadahChecklist] = useState<IbaadahItem[]>(DEFAULT_IBAADAH_ITEMS);
  const [isLoading, setIsLoading] = useState(true);

  // Get storage key for current year and day
  const storageKey = useMemo(() => {
    if (!ramadanYear || !currentDay) return null;
    return `${RAMADAN_STORAGE_KEYS.IBAADAH_CHECKLIST(ramadanYear)}_day_${currentDay}`;
  }, [ramadanYear, currentDay]);

  // Load checklist from storage
  useEffect(() => {
    async function loadChecklist() {
      if (!storageKey) {
        setIbaadahChecklist(DEFAULT_IBAADAH_ITEMS);
        setIsLoading(false);
        return;
      }

      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          setIbaadahChecklist(JSON.parse(stored));
        } else {
          // Reset to defaults for new day
          setIbaadahChecklist(DEFAULT_IBAADAH_ITEMS);
        }
      } catch (error) {
        console.error('Failed to load Ibaadah checklist:', error);
        setIbaadahChecklist(DEFAULT_IBAADAH_ITEMS);
      } finally {
        setIsLoading(false);
      }
    }

    loadChecklist();
  }, [storageKey]);

  // Save checklist to storage
  const saveChecklist = useCallback(async (newChecklist: IbaadahItem[]) => {
    if (!storageKey) return;
    setIbaadahChecklist(newChecklist);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(newChecklist));
    } catch (error) {
      console.error('Failed to save Ibaadah checklist:', error);
    }
  }, [storageKey]);

  // Current night (same as current day in Ramadan context)
  const currentNight = currentDay;

  // Check if tonight is an odd night
  const isOddNight = useMemo(() => {
    return isOddNightCheck(currentNight);
  }, [currentNight]);

  // Calculate nights remaining
  const nightsRemaining = useMemo(() => {
    return calculateNightsRemaining(currentDay);
  }, [currentDay]);

  // Calculate days until last 10 nights
  const daysUntilLastTen = useMemo(() => {
    return calculateDaysUntilLastTen(currentDay);
  }, [currentDay]);

  // Toggle Ibaadah item completion
  const toggleIbaadah = useCallback(async (id: string) => {
    const newChecklist = ibaadahChecklist.map(item => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
    await saveChecklist(newChecklist);
  }, [ibaadahChecklist, saveChecklist]);

  // Reset tonight's checklist
  const resetTonightChecklist = useCallback(async () => {
    const resetChecklist = DEFAULT_IBAADAH_ITEMS.map(item => ({
      ...item,
      completed: false,
    }));
    await saveChecklist(resetChecklist);
  }, [saveChecklist]);

  return {
    isLastTenNights,
    currentNight,
    isOddNight,
    nightsRemaining,
    daysUntilLastTen,
    ibaadahChecklist,
    specialDuas: LAYLATUL_QADR_DUAS,
    toggleIbaadah,
    resetTonightChecklist,
    isLoading,
  };
}
