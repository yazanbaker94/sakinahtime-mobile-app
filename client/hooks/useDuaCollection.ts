/**
 * useDuaCollection Hook
 * 
 * Main hook for accessing dua data including categories, search, and dua of the day.
 */

import { useMemo, useCallback } from 'react';
import { Dua } from '@/types/dua';
import { duaCategories } from '@/data/duaCategories';
import { allDuas, quranicDuas, propheticDuas, getDuasByCategory as getByCategory, getDuaById as getById } from '@/data/duaData';

export interface UseDuaCollectionReturn {
  categories: typeof duaCategories;
  quranicDuas: Dua[];
  propheticDuas: Dua[];
  allDuas: Dua[];
  getDuasByCategory: (categoryId: string) => Dua[];
  getDuaById: (id: string) => Dua | undefined;
  searchDuas: (query: string) => Dua[];
  duaOfTheDay: Dua;
  isLoading: boolean;
}

/**
 * Normalize Arabic text by removing diacritics (tashkeel) for better search matching
 */
function normalizeArabicText(text: string): string {
  return text
    // Remove Arabic diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, '') // Fathatan, Dammatan, Kasratan, Fatha, Damma, Kasra, Shadda, Sukun, etc.
    .replace(/[\u0617-\u061A]/g, '') // Additional diacritics
    // Remove tatweel (kashida)
    .replace(/\u0640/g, '')
    // Remove Quranic symbols and markers
    .replace(/[\u0600-\u0605\u06D6-\u06ED]/g, '')
    // Normalize alef variations (أ إ آ ٱ -> ا)
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    // Normalize teh marbuta to heh (ة -> ه)
    .replace(/\u0629/g, '\u0647')
    // Normalize yeh variations (ى ي ی ې -> ي)
    .replace(/[\u0649\u06CC\u06D0]/g, '\u064A')
    // Normalize waw with hamza (ؤ -> و)
    .replace(/\u0624/g, '\u0648')
    // Remove zero-width characters
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Get a deterministic dua of the day based on the current date
 */
function getDuaOfTheDay(date: Date = new Date()): Dua {
  // Create a deterministic seed from the date
  const dateString = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % allDuas.length;
  return allDuas[index];
}

/**
 * Search duas by query string
 * Searches across Arabic text, transliteration, translation, and category names
 * Arabic search is normalized to ignore diacritics (tashkeel)
 */
function searchDuasInternal(query: string, duas: Dua[], categories: typeof duaCategories): Dua[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const trimmedQuery = query.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();
  const normalizedArabicQuery = normalizeArabicText(trimmedQuery);
  
  // Check if query contains Arabic characters
  const isArabicQuery = /[\u0600-\u06FF]/.test(trimmedQuery);
  
  // Create a map of category IDs to names for searching
  const categoryNames = new Map<string, string>();
  categories.forEach(cat => {
    categoryNames.set(cat.id, `${cat.titleEn.toLowerCase()} ${normalizeArabicText(cat.titleAr)}`);
  });

  return duas.filter(dua => {
    // Search in Arabic text (normalized to ignore diacritics)
    if (isArabicQuery) {
      const normalizedDuaArabic = normalizeArabicText(dua.textAr);
      if (normalizedDuaArabic.includes(normalizedArabicQuery)) {
        return true;
      }
    } else {
      // For non-Arabic queries, still check Arabic text as-is
      if (dua.textAr.includes(trimmedQuery)) {
        return true;
      }
    }
    
    // Search in transliteration (case-insensitive)
    if (dua.transliteration.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    
    // Search in translation (case-insensitive)
    if (dua.translation.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    
    // Search in category name
    const categoryName = categoryNames.get(dua.categoryId);
    if (categoryName && categoryName.includes(isArabicQuery ? normalizedArabicQuery : normalizedQuery)) {
      return true;
    }
    
    // Search in surah name for Quranic duas
    if (dua.surahName && dua.surahName.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    
    // Search in hadith source for Prophetic duas
    if (dua.hadithSource && dua.hadithSource.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    
    return false;
  });
}

export function useDuaCollection(): UseDuaCollectionReturn {
  // Memoize the dua of the day (changes daily)
  const duaOfTheDay = useMemo(() => getDuaOfTheDay(), []);

  // Memoize search function
  const searchDuas = useCallback((query: string): Dua[] => {
    return searchDuasInternal(query, allDuas, duaCategories);
  }, []);

  // Memoize getDuasByCategory
  const getDuasByCategory = useCallback((categoryId: string): Dua[] => {
    return getByCategory(categoryId);
  }, []);

  // Memoize getDuaById
  const getDuaById = useCallback((id: string): Dua | undefined => {
    return getById(id);
  }, []);

  return {
    categories: duaCategories,
    quranicDuas,
    propheticDuas,
    allDuas,
    getDuasByCategory,
    getDuaById,
    searchDuas,
    duaOfTheDay,
    isLoading: false, // Data is bundled, no loading needed
  };
}

// Export helper functions for testing
export { getDuaOfTheDay, searchDuasInternal };

export default useDuaCollection;
