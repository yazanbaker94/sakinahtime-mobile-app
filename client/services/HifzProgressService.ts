/**
 * HifzProgressService
 * Service for tracking Quran memorization progress
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HifzProgress,
  VerseProgress,
  VerseKey,
  MemorizationStatus,
  HifzStats,
  PageProgress,
  SurahProgress,
  JuzProgress,
} from '../types/hifz';
import {
  HIFZ_STORAGE_KEYS,
  QURAN_STATS,
  DEFAULT_EASE_FACTOR,
} from '../constants/hifz';
import { surahs } from '../data/quran';
import { surahPages } from '../data/surah-pages';

// Juz boundaries (start surah:ayah for each juz)
const JUZ_BOUNDARIES: { juz: number; startSurah: number; startAyah: number }[] = [
  { juz: 1, startSurah: 1, startAyah: 1 },
  { juz: 2, startSurah: 2, startAyah: 142 },
  { juz: 3, startSurah: 2, startAyah: 253 },
  { juz: 4, startSurah: 3, startAyah: 93 },
  { juz: 5, startSurah: 4, startAyah: 24 },
  { juz: 6, startSurah: 4, startAyah: 148 },
  { juz: 7, startSurah: 5, startAyah: 83 },
  { juz: 8, startSurah: 6, startAyah: 111 },
  { juz: 9, startSurah: 7, startAyah: 88 },
  { juz: 10, startSurah: 8, startAyah: 41 },
  { juz: 11, startSurah: 9, startAyah: 93 },
  { juz: 12, startSurah: 11, startAyah: 6 },
  { juz: 13, startSurah: 12, startAyah: 53 },
  { juz: 14, startSurah: 15, startAyah: 1 },
  { juz: 15, startSurah: 17, startAyah: 1 },
  { juz: 16, startSurah: 18, startAyah: 75 },
  { juz: 17, startSurah: 21, startAyah: 1 },
  { juz: 18, startSurah: 23, startAyah: 1 },
  { juz: 19, startSurah: 25, startAyah: 21 },
  { juz: 20, startSurah: 27, startAyah: 56 },
  { juz: 21, startSurah: 29, startAyah: 46 },
  { juz: 22, startSurah: 33, startAyah: 31 },
  { juz: 23, startSurah: 36, startAyah: 28 },
  { juz: 24, startSurah: 39, startAyah: 32 },
  { juz: 25, startSurah: 41, startAyah: 47 },
  { juz: 26, startSurah: 46, startAyah: 1 },
  { juz: 27, startSurah: 51, startAyah: 31 },
  { juz: 28, startSurah: 58, startAyah: 1 },
  { juz: 29, startSurah: 67, startAyah: 1 },
  { juz: 30, startSurah: 78, startAyah: 1 },
];

class HifzProgressService {
  private progress: HifzProgress | null = null;
  private initialized = false;
  private listeners: Set<() => void> = new Set();

  // Subscribe to progress changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners of changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const stored = await AsyncStorage.getItem(HIFZ_STORAGE_KEYS.PROGRESS);
      if (stored) {
        this.progress = JSON.parse(stored);
      } else {
        this.progress = {
          verses: {},
          totalMemorized: 0,
          totalInProgress: 0,
          lastUpdated: new Date().toISOString(),
        };
      }
      this.initialized = true;
    } catch (error) {
      console.error('[HifzProgressService] Failed to initialize:', error);
      this.progress = {
        verses: {},
        totalMemorized: 0,
        totalInProgress: 0,
        lastUpdated: new Date().toISOString(),
      };
      this.initialized = true;
    }
  }

  private async saveProgress(): Promise<void> {
    if (!this.progress) return;
    
    try {
      this.progress.lastUpdated = new Date().toISOString();
      await AsyncStorage.setItem(HIFZ_STORAGE_KEYS.PROGRESS, JSON.stringify(this.progress));
      // Notify listeners after saving
      this.notifyListeners();
    } catch (error) {
      console.error('[HifzProgressService] Failed to save progress:', error);
    }
  }

  async getProgress(): Promise<HifzProgress> {
    await this.initialize();
    return this.progress!;
  }

  async getVerseProgress(verseKey: VerseKey): Promise<VerseProgress | null> {
    await this.initialize();
    return this.progress?.verses[verseKey] || null;
  }

  async markVerseStatus(verseKey: VerseKey, status: MemorizationStatus): Promise<void> {
    await this.initialize();
    if (!this.progress) return;

    console.log('[HifzProgressService] markVerseStatus:', verseKey, status);

    const existing = this.progress.verses[verseKey];
    const now = new Date().toISOString();

    if (status === 'not_started') {
      // Remove from progress
      delete this.progress.verses[verseKey];
    } else {
      this.progress.verses[verseKey] = {
        status,
        lastRevised: status === 'memorized' ? now : (existing?.lastRevised || null),
        revisionCount: existing?.revisionCount || 0,
        nextRevisionDue: status === 'memorized' ? this.calculateNextRevisionDate(1) : null,
        easeFactor: existing?.easeFactor || DEFAULT_EASE_FACTOR,
        interval: status === 'memorized' ? 1 : 0,
      };
    }

    // Update totals
    this.updateTotals();
    await this.saveProgress();
    await this.updateLastActivity();
  }

  async markPageStatus(page: number, status: MemorizationStatus): Promise<void> {
    const verses = this.getVersesForPage(page);
    await this.markVersesStatusBatch(verses, status);
  }

  async markSurahStatus(surah: number, status: MemorizationStatus): Promise<void> {
    const surahInfo = surahs.find(s => s.number === surah);
    if (!surahInfo) return;

    const verses: VerseKey[] = [];
    for (let ayah = 1; ayah <= surahInfo.versesCount; ayah++) {
      verses.push(`${surah}:${ayah}`);
    }
    await this.markVersesStatusBatch(verses, status);
  }

  async markJuzStatus(juz: number, status: MemorizationStatus): Promise<void> {
    const verses = this.getVersesForJuz(juz);
    await this.markVersesStatusBatch(verses, status);
  }

  // Batch update multiple verses at once - single save operation
  private async markVersesStatusBatch(verseKeys: VerseKey[], status: MemorizationStatus): Promise<void> {
    await this.initialize();
    if (!this.progress) return;

    console.log('[HifzProgressService] markVersesStatusBatch:', verseKeys.length, 'verses as', status);
    const now = new Date().toISOString();

    for (const verseKey of verseKeys) {
      const existing = this.progress.verses[verseKey];

      if (status === 'not_started') {
        delete this.progress.verses[verseKey];
      } else {
        this.progress.verses[verseKey] = {
          status,
          lastRevised: status === 'memorized' ? now : (existing?.lastRevised || null),
          revisionCount: existing?.revisionCount || 0,
          nextRevisionDue: status === 'memorized' ? this.calculateNextRevisionDate(1) : null,
          easeFactor: existing?.easeFactor || DEFAULT_EASE_FACTOR,
          interval: status === 'memorized' ? 1 : 0,
        };
      }
    }

    // Single save and notify at the end
    this.updateTotals();
    await this.saveProgress();
    await this.updateLastActivity();
  }

  async getStats(): Promise<HifzStats> {
    await this.initialize();
    
    const memorizedVerses = Object.values(this.progress?.verses || {})
      .filter(v => v.status === 'memorized').length;
    const inProgressVerses = Object.values(this.progress?.verses || {})
      .filter(v => v.status === 'in_progress').length;
    
    // Calculate memorized pages
    let memorizedPages = 0;
    for (let page = 1; page <= QURAN_STATS.TOTAL_PAGES; page++) {
      const pageProgress = await this.getPageProgress(page);
      if (pageProgress.status === 'memorized') {
        memorizedPages++;
      }
    }

    // Calculate memorized juz
    let memorizedJuz = 0;
    for (let juz = 1; juz <= QURAN_STATS.TOTAL_JUZ; juz++) {
      const juzProgress = await this.getJuzProgress(juz);
      if (juzProgress.status === 'memorized') {
        memorizedJuz++;
      }
    }

    // Get memorized surahs
    const memorizedSurahs: number[] = [];
    for (const surah of surahs) {
      const surahProgress = await this.getSurahProgress(surah.number);
      if (surahProgress.status === 'memorized') {
        memorizedSurahs.push(surah.number);
      }
    }

    // Count due for revision
    const now = new Date();
    const dueForRevision = Object.values(this.progress?.verses || {})
      .filter(v => v.status === 'memorized' && v.nextRevisionDue && new Date(v.nextRevisionDue) <= now)
      .length;

    // Get streak
    const streak = await this.getStreak();
    const lastActivity = await this.getLastActivity();

    return {
      totalVerses: QURAN_STATS.TOTAL_VERSES,
      memorizedVerses,
      inProgressVerses,
      memorizedPages,
      memorizedJuz,
      memorizedSurahs,
      dueForRevision,
      streakDays: streak,
      lastActivityDate: lastActivity,
    };
  }

  async getPageProgress(page: number): Promise<PageProgress> {
    await this.initialize();
    
    const verses = this.getVersesForPage(page);
    let memorizedCount = 0;
    let inProgressCount = 0;

    for (const verseKey of verses) {
      const progress = this.progress?.verses[verseKey];
      if (progress?.status === 'memorized') {
        memorizedCount++;
      } else if (progress?.status === 'in_progress') {
        inProgressCount++;
      }
    }

    const totalCount = verses.length;
    let status: MemorizationStatus = 'not_started';
    if (memorizedCount === totalCount && totalCount > 0) {
      status = 'memorized';
    } else if (memorizedCount > 0 || inProgressCount > 0) {
      status = 'in_progress';
    }

    return {
      page,
      status,
      memorizedCount,
      totalCount,
      percentage: totalCount > 0 ? (memorizedCount / totalCount) * 100 : 0,
    };
  }

  async getSurahProgress(surah: number): Promise<SurahProgress> {
    await this.initialize();
    
    const surahInfo = surahs.find(s => s.number === surah);
    if (!surahInfo) {
      return {
        surah,
        surahName: '',
        surahNameAr: '',
        status: 'not_started',
        memorizedCount: 0,
        totalCount: 0,
        percentage: 0,
      };
    }

    let memorizedCount = 0;
    let inProgressCount = 0;

    for (let ayah = 1; ayah <= surahInfo.versesCount; ayah++) {
      const progress = this.progress?.verses[`${surah}:${ayah}`];
      if (progress?.status === 'memorized') {
        memorizedCount++;
      } else if (progress?.status === 'in_progress') {
        inProgressCount++;
      }
    }

    const totalCount = surahInfo.versesCount;
    let status: MemorizationStatus = 'not_started';
    if (memorizedCount === totalCount) {
      status = 'memorized';
    } else if (memorizedCount > 0 || inProgressCount > 0) {
      status = 'in_progress';
    }

    return {
      surah,
      surahName: surahInfo.nameEn,
      surahNameAr: surahInfo.nameAr,
      status,
      memorizedCount,
      totalCount,
      percentage: totalCount > 0 ? (memorizedCount / totalCount) * 100 : 0,
    };
  }

  async getJuzProgress(juz: number): Promise<JuzProgress> {
    await this.initialize();
    
    const verses = this.getVersesForJuz(juz);
    let memorizedCount = 0;
    let inProgressCount = 0;

    for (const verseKey of verses) {
      const progress = this.progress?.verses[verseKey];
      if (progress?.status === 'memorized') {
        memorizedCount++;
      } else if (progress?.status === 'in_progress') {
        inProgressCount++;
      }
    }

    const totalCount = verses.length;
    let status: MemorizationStatus = 'not_started';
    if (memorizedCount === totalCount && totalCount > 0) {
      status = 'memorized';
    } else if (memorizedCount > 0 || inProgressCount > 0) {
      status = 'in_progress';
    }

    return {
      juz,
      status,
      memorizedCount,
      totalCount,
      percentage: totalCount > 0 ? (memorizedCount / totalCount) * 100 : 0,
    };
  }

  async exportProgress(): Promise<string> {
    await this.initialize();
    return JSON.stringify(this.progress, null, 2);
  }

  async importProgress(data: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(data);
      if (parsed.verses && typeof parsed.verses === 'object') {
        this.progress = parsed;
        this.updateTotals();
        await this.saveProgress();
        return true;
      }
      return false;
    } catch (error) {
      console.error('[HifzProgressService] Failed to import progress:', error);
      return false;
    }
  }

  async resetProgress(): Promise<void> {
    this.progress = {
      verses: {},
      totalMemorized: 0,
      totalInProgress: 0,
      lastUpdated: new Date().toISOString(),
    };
    await this.saveProgress();
    await AsyncStorage.removeItem(HIFZ_STORAGE_KEYS.STREAK);
    await AsyncStorage.removeItem(HIFZ_STORAGE_KEYS.LAST_ACTIVITY);
  }

  // Helper methods
  private getVersesForPage(page: number): VerseKey[] {
    const verses: VerseKey[] = [];
    
    for (const surah of surahs) {
      const surahStartPage = surahPages[surah.number];
      const nextSurahStartPage = surah.number < 114 ? surahPages[surah.number + 1] : 605;
      
      if (page >= surahStartPage && page < nextSurahStartPage) {
        // This surah is on this page
        for (let ayah = 1; ayah <= surah.versesCount; ayah++) {
          // Simplified: add all verses from surahs that span this page
          // In a real implementation, you'd use verse-to-page mapping
          verses.push(`${surah.number}:${ayah}`);
        }
      }
    }
    
    return verses;
  }

  private getVersesForJuz(juz: number): VerseKey[] {
    const verses: VerseKey[] = [];
    const boundary = JUZ_BOUNDARIES[juz - 1];
    const nextBoundary = juz < 30 ? JUZ_BOUNDARIES[juz] : null;

    for (const surah of surahs) {
      for (let ayah = 1; ayah <= surah.versesCount; ayah++) {
        const isAfterStart = 
          surah.number > boundary.startSurah ||
          (surah.number === boundary.startSurah && ayah >= boundary.startAyah);
        
        const isBeforeEnd = nextBoundary
          ? surah.number < nextBoundary.startSurah ||
            (surah.number === nextBoundary.startSurah && ayah < nextBoundary.startAyah)
          : true;

        if (isAfterStart && isBeforeEnd) {
          verses.push(`${surah.number}:${ayah}`);
        }
      }
    }

    return verses;
  }

  private updateTotals(): void {
    if (!this.progress) return;
    
    this.progress.totalMemorized = Object.values(this.progress.verses)
      .filter(v => v.status === 'memorized').length;
    this.progress.totalInProgress = Object.values(this.progress.verses)
      .filter(v => v.status === 'in_progress').length;
  }

  private calculateNextRevisionDate(intervalDays: number): string {
    const date = new Date();
    date.setDate(date.getDate() + intervalDays);
    return date.toISOString();
  }

  private async updateLastActivity(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = await AsyncStorage.getItem(HIFZ_STORAGE_KEYS.LAST_ACTIVITY);
    
    if (lastActivity !== today) {
      // Update streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      let streak = 1;
      if (lastActivity === yesterdayStr) {
        const storedStreak = await AsyncStorage.getItem(HIFZ_STORAGE_KEYS.STREAK);
        streak = storedStreak ? parseInt(storedStreak, 10) + 1 : 1;
      }
      
      await AsyncStorage.setItem(HIFZ_STORAGE_KEYS.STREAK, streak.toString());
      await AsyncStorage.setItem(HIFZ_STORAGE_KEYS.LAST_ACTIVITY, today);
    }
  }

  private async getStreak(): Promise<number> {
    const streak = await AsyncStorage.getItem(HIFZ_STORAGE_KEYS.STREAK);
    return streak ? parseInt(streak, 10) : 0;
  }

  private async getLastActivity(): Promise<string | null> {
    return await AsyncStorage.getItem(HIFZ_STORAGE_KEYS.LAST_ACTIVITY);
  }
}

export const hifzProgressService = new HifzProgressService();
