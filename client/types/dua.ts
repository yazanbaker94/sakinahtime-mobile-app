/**
 * Dua Collection Type Definitions
 * 
 * Types for the comprehensive dua/supplication feature including
 * Quranic duas, Prophetic duas, favorites, and custom duas.
 */

export type DuaSource = 'quran' | 'hadith' | 'general';
export type HadithGrade = 'sahih' | 'hasan' | 'daif';

export interface Dua {
  id: string;
  categoryId: string;
  textAr: string;
  transliteration: string;
  translation: string;
  source: DuaSource;
  // For Quranic duas
  surahNumber?: number;
  ayahNumber?: number;
  surahName?: string;
  // For Hadith duas
  hadithSource?: string;  // e.g., "Bukhari", "Muslim"
  hadithGrade?: HadithGrade;
  hadithNumber?: string;
  // Audio
  audioUrl?: string;
  hasAudio: boolean;
  // Metadata
  occasion?: string;
  benefits?: string;
  repetitions?: number;
}

export interface DuaCategory {
  id: string;
  titleAr: string;
  titleEn: string;
  icon: string;
  description?: string;
  subcategories?: DuaSubcategory[];
  count: number;
}

export interface DuaSubcategory {
  id: string;
  titleAr: string;
  titleEn: string;
  parentId: string;
}

export interface CustomDua {
  id: string;
  textAr?: string;
  transliteration?: string;
  translation: string;  // Required
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DuaFavorite {
  duaId: string;
  addedAt: number;
}

// Storage schemas
export interface StoredFavorites {
  version: number;
  favorites: DuaFavorite[];
}

export interface StoredCustomDuas {
  version: number;
  duas: CustomDua[];
}
