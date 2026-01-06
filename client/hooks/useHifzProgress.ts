/**
 * useHifzProgress Hook
 * Provides access to Hifz progress tracking functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { hifzProgressService } from '../services/HifzProgressService';
import type {
  HifzProgress,
  VerseKey,
  MemorizationStatus,
  HifzStats,
} from '../types/hifz';

interface UseHifzProgressReturn {
  progress: HifzProgress | null;
  stats: HifzStats | null;
  isLoading: boolean;
  error: string | null;
  
  // Verse operations
  markVerse: (verseKey: VerseKey, status: MemorizationStatus) => Promise<void>;
  getVerseStatus: (verseKey: VerseKey) => MemorizationStatus;
  
  // Bulk operations
  markPage: (page: number, status: MemorizationStatus) => Promise<void>;
  markSurah: (surah: number, status: MemorizationStatus) => Promise<void>;
  markJuz: (juz: number, status: MemorizationStatus) => Promise<void>;
  
  // Stats
  refreshStats: () => Promise<void>;
  
  // Data management
  exportProgress: () => Promise<string>;
  importProgress: (data: string) => Promise<boolean>;
  resetProgress: () => Promise<void>;
}

export function useHifzProgress(): UseHifzProgressReturn {
  const [progress, setProgress] = useState<HifzProgress | null>(null);
  const [stats, setStats] = useState<HifzStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load progress on mount and subscribe to changes
  useEffect(() => {
    loadProgress();
    
    // Subscribe to progress changes from other hook instances
    const unsubscribe = hifzProgressService.subscribe(() => {
      loadProgress();
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  const loadProgress = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await hifzProgressService.initialize();
      const loadedProgress = await hifzProgressService.getProgress();
      const loadedStats = await hifzProgressService.getStats();
      
      setProgress(loadedProgress);
      setStats(loadedStats);
    } catch (err) {
      console.error('[useHifzProgress] Failed to load progress:', err);
      setError('Failed to load memorization progress');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markVerse = useCallback(async (verseKey: VerseKey, status: MemorizationStatus) => {
    try {
      await hifzProgressService.markVerseStatus(verseKey, status);
      
      // Update local state
      const updatedProgress = await hifzProgressService.getProgress();
      const updatedStats = await hifzProgressService.getStats();
      setProgress(updatedProgress);
      setStats(updatedStats);
    } catch (err) {
      console.error('[useHifzProgress] Failed to mark verse:', err);
      throw err;
    }
  }, []);

  const getVerseStatus = useCallback((verseKey: VerseKey): MemorizationStatus => {
    if (!progress?.verses[verseKey]) {
      return 'not_started';
    }
    return progress.verses[verseKey].status;
  }, [progress]);

  const markPage = useCallback(async (page: number, status: MemorizationStatus) => {
    try {
      await hifzProgressService.markPageStatus(page, status);
      
      const updatedProgress = await hifzProgressService.getProgress();
      const updatedStats = await hifzProgressService.getStats();
      setProgress(updatedProgress);
      setStats(updatedStats);
    } catch (err) {
      console.error('[useHifzProgress] Failed to mark page:', err);
      throw err;
    }
  }, []);

  const markSurah = useCallback(async (surah: number, status: MemorizationStatus) => {
    try {
      await hifzProgressService.markSurahStatus(surah, status);
      
      const updatedProgress = await hifzProgressService.getProgress();
      const updatedStats = await hifzProgressService.getStats();
      setProgress(updatedProgress);
      setStats(updatedStats);
    } catch (err) {
      console.error('[useHifzProgress] Failed to mark surah:', err);
      throw err;
    }
  }, []);

  const markJuz = useCallback(async (juz: number, status: MemorizationStatus) => {
    try {
      await hifzProgressService.markJuzStatus(juz, status);
      
      const updatedProgress = await hifzProgressService.getProgress();
      const updatedStats = await hifzProgressService.getStats();
      setProgress(updatedProgress);
      setStats(updatedStats);
    } catch (err) {
      console.error('[useHifzProgress] Failed to mark juz:', err);
      throw err;
    }
  }, []);

  const refreshStats = useCallback(async () => {
    const updatedStats = await hifzProgressService.getStats();
    setStats(updatedStats);
  }, []);

  const exportProgress = useCallback(async (): Promise<string> => {
    return hifzProgressService.exportProgress();
  }, []);

  const importProgress = useCallback(async (data: string): Promise<boolean> => {
    try {
      const success = await hifzProgressService.importProgress(data);
      if (success) {
        await loadProgress();
      }
      return success;
    } catch (err) {
      console.error('[useHifzProgress] Failed to import progress:', err);
      return false;
    }
  }, [loadProgress]);

  const resetProgress = useCallback(async () => {
    try {
      await hifzProgressService.resetProgress();
      await loadProgress();
    } catch (err) {
      console.error('[useHifzProgress] Failed to reset progress:', err);
      throw err;
    }
  }, [loadProgress]);

  return {
    progress,
    stats,
    isLoading,
    error,
    markVerse,
    getVerseStatus,
    markPage,
    markSurah,
    markJuz,
    refreshStats,
    exportProgress,
    importProgress,
    resetProgress,
  };
}

export default useHifzProgress;
