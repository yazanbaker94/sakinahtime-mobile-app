/**
 * useDailyDhikr Hook
 * 
 * Returns a featured dhikr that rotates daily based on the current date.
 * Uses a deterministic algorithm so the same dhikr is shown all day.
 */

import { useMemo } from 'react';
import { azkarData, Dhikr } from '@/data/azkar';

interface UseDailyDhikrReturn {
  dhikr: Dhikr;
  categoryId: string;
}

// Get day of year (1-366)
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// Flatten all dhikr from all categories into a single array
function getAllDhikr(): Dhikr[] {
  const allDhikr: Dhikr[] = [];
  
  Object.values(azkarData).forEach(categoryDhikr => {
    allDhikr.push(...categoryDhikr);
  });
  
  return allDhikr;
}

// Get deterministic daily dhikr based on date
function getDailyDhikr(date: Date): { dhikr: Dhikr; categoryId: string } {
  const allDhikr = getAllDhikr();
  
  if (allDhikr.length === 0) {
    // Fallback dhikr if no data
    const fallback: Dhikr = {
      id: 'fallback',
      categoryId: 'general',
      textAr: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
      transliteration: 'Subhanallahi wa bihamdihi',
      translation: 'Glory and praise be to Allah.',
      repetitions: 100,
      source: 'Muslim',
    };
    return { dhikr: fallback, categoryId: 'general' };
  }
  
  const dayOfYear = getDayOfYear(date);
  const index = dayOfYear % allDhikr.length;
  const dhikr = allDhikr[index];
  
  return {
    dhikr,
    categoryId: dhikr.categoryId,
  };
}

export function useDailyDhikr(): UseDailyDhikrReturn {
  const result = useMemo(() => {
    const today = new Date();
    return getDailyDhikr(today);
  }, []);

  return result;
}

// Export for testing
export { getDayOfYear, getDailyDhikr };

export default useDailyDhikr;
