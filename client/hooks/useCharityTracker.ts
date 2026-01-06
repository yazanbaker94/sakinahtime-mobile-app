/**
 * useCharityTracker Hook
 * 
 * Manages charity (Sadaqah, Zakat, etc.) tracking during Ramadan.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CharityEntry, CharityStats, CharityGoal, CharityType, ZakatCalculation } from '../types/ramadan';
import { RAMADAN_STORAGE_KEYS, ZAKAT_RATE, NISAB_GOLD_GRAMS, NISAB_SILVER_GRAMS } from '../constants/ramadan';
import { useRamadan } from '../contexts/RamadanContext';

interface UseCharityTrackerReturn {
  entries: CharityEntry[];
  stats: CharityStats;
  goal: CharityGoal | null;
  goalProgress: number;
  addEntry: (entry: Omit<CharityEntry, 'id' | 'createdAt'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<CharityEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  setGoal: (goal: CharityGoal) => Promise<void>;
  calculateZakat: (wealth: number, goldPricePerGram?: number, silverPricePerGram?: number) => ZakatCalculation;
  markZakatPaid: (amount: number) => Promise<void>;
  isLoading: boolean;
}

const DEFAULT_STATS: CharityStats = {
  totalAmount: 0,
  totalEntries: 0,
  byType: {
    sadaqah: 0,
    zakat: 0,
    fidya: 0,
    kaffarah: 0,
    other: 0,
  },
  ramadanTotal: 0,
  zakatPaid: false,
  zakatAmount: 0,
};

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `charity_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Calculate total amount from entries
 */
export function calculateTotal(entries: CharityEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.amount, 0);
}

/**
 * Calculate breakdown by charity type
 */
export function calculateByType(entries: CharityEntry[]): Record<CharityType, number> {
  const byType: Record<CharityType, number> = {
    sadaqah: 0,
    zakat: 0,
    fidya: 0,
    kaffarah: 0,
    other: 0,
  };

  for (const entry of entries) {
    byType[entry.type] += entry.amount;
  }

  return byType;
}

/**
 * Calculate Zakat based on wealth and Nisab threshold
 */
export function calculateZakatAmount(
  totalWealth: number,
  goldPricePerGram: number = 70, // Default USD price per gram
  silverPricePerGram: number = 0.85 // Default USD price per gram
): ZakatCalculation {
  const nisabGold = NISAB_GOLD_GRAMS * goldPricePerGram;
  const nisabSilver = NISAB_SILVER_GRAMS * silverPricePerGram;
  
  // Use the lower Nisab threshold (silver) as is traditional
  const nisabThreshold = Math.min(nisabGold, nisabSilver);
  const meetsNisab = totalWealth >= nisabThreshold;
  const zakatDue = meetsNisab ? totalWealth * ZAKAT_RATE : 0;

  return {
    totalWealth,
    nisabGold,
    nisabSilver,
    zakatDue,
    meetsNisab,
  };
}

/**
 * Calculate statistics from entries
 */
export function calculateStats(entries: CharityEntry[]): CharityStats {
  if (entries.length === 0) {
    return DEFAULT_STATS;
  }

  const totalAmount = calculateTotal(entries);
  const byType = calculateByType(entries);
  const zakatEntries = entries.filter(e => e.type === 'zakat');
  const zakatAmount = zakatEntries.reduce((sum, e) => sum + e.amount, 0);

  return {
    totalAmount,
    totalEntries: entries.length,
    byType,
    ramadanTotal: totalAmount,
    zakatPaid: zakatAmount > 0,
    zakatAmount,
  };
}

export function useCharityTracker(): UseCharityTrackerReturn {
  const { ramadanYear } = useRamadan();
  
  const [entries, setEntries] = useState<CharityEntry[]>([]);
  const [goal, setGoalState] = useState<CharityGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get storage keys for current year
  const entriesStorageKey = useMemo(() => {
    if (!ramadanYear) return null;
    return RAMADAN_STORAGE_KEYS.CHARITY_ENTRIES(ramadanYear);
  }, [ramadanYear]);

  const goalStorageKey = useMemo(() => {
    if (!ramadanYear) return null;
    return RAMADAN_STORAGE_KEYS.CHARITY_GOAL(ramadanYear);
  }, [ramadanYear]);

  // Load data function
  const loadData = useCallback(async () => {
    if (!entriesStorageKey || !goalStorageKey) {
      setIsLoading(false);
      return;
    }

    try {
      const [storedEntries, storedGoal] = await Promise.all([
        AsyncStorage.getItem(entriesStorageKey),
        AsyncStorage.getItem(goalStorageKey),
      ]);

      if (storedEntries) {
        const parsed = JSON.parse(storedEntries);
        const entriesWithDates = parsed.map((e: any) => ({
          ...e,
          date: new Date(e.date),
          createdAt: new Date(e.createdAt),
        }));
        setEntries(entriesWithDates);
      } else {
        setEntries([]);
      }

      if (storedGoal) {
        setGoalState(JSON.parse(storedGoal));
      }
    } catch (error) {
      console.error('Failed to load charity data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [entriesStorageKey, goalStorageKey]);

  // Load entries and goal from storage on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Save entries to storage
  const saveEntries = useCallback(async (newEntries: CharityEntry[]) => {
    if (!entriesStorageKey) return;
    setEntries(newEntries);
    try {
      await AsyncStorage.setItem(entriesStorageKey, JSON.stringify(newEntries));
    } catch (error) {
      console.error('Failed to save charity entries:', error);
    }
  }, [entriesStorageKey]);

  // Calculate stats
  const stats = useMemo(() => {
    return calculateStats(entries);
  }, [entries]);

  // Calculate goal progress
  const goalProgress = useMemo(() => {
    if (!goal || goal.amount <= 0) return 0;
    return Math.min(100, Math.round((stats.totalAmount / goal.amount) * 100));
  }, [goal, stats.totalAmount]);

  // Add entry
  const addEntry = useCallback(async (entry: Omit<CharityEntry, 'id' | 'createdAt'>) => {
    const newEntry: CharityEntry = {
      ...entry,
      id: generateId(),
      createdAt: new Date(),
    };
    await saveEntries([...entries, newEntry]);
  }, [entries, saveEntries]);

  // Update entry
  const updateEntry = useCallback(async (id: string, updates: Partial<CharityEntry>) => {
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

  // Set goal
  const setGoal = useCallback(async (newGoal: CharityGoal) => {
    if (!goalStorageKey) return;
    setGoalState(newGoal);
    try {
      await AsyncStorage.setItem(goalStorageKey, JSON.stringify(newGoal));
    } catch (error) {
      console.error('Failed to save charity goal:', error);
    }
  }, [goalStorageKey]);

  // Calculate Zakat
  const calculateZakat = useCallback((
    wealth: number,
    goldPricePerGram?: number,
    silverPricePerGram?: number
  ): ZakatCalculation => {
    return calculateZakatAmount(wealth, goldPricePerGram, silverPricePerGram);
  }, []);

  // Mark Zakat as paid
  const markZakatPaid = useCallback(async (amount: number) => {
    const zakatEntry: Omit<CharityEntry, 'id' | 'createdAt'> = {
      date: new Date(),
      type: 'zakat',
      amount,
      currency: 'USD',
      isAnonymous: false,
      notes: 'Zakat payment',
    };
    await addEntry(zakatEntry);
  }, [addEntry]);

  return {
    entries,
    stats,
    goal,
    goalProgress,
    addEntry,
    updateEntry,
    deleteEntry,
    setGoal,
    calculateZakat,
    markZakatPaid,
    isLoading,
  };
}
