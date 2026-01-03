/**
 * useProgressTracker Hook
 * React hook for managing Quran reading progress
 * Feature: quran-progress-tracker
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReadingProgress,
  DailyGoal,
  DailyProgress,
  ReadingStats,
} from '../types/progress';
import { progressTrackerService } from '../services/ProgressTrackerService';
import { ProgressCalculator } from '../services/ProgressCalculator';

interface UseProgressTrackerReturn {
  progress: ReadingProgress | null;
  loading: boolean;
  error: string | null;
  stats: ReadingStats | null;
  todayProgress: DailyProgress | null;
  isGoalMet: boolean;
  markPageRead: (pageNumber: number) => Promise<void>;
  setDailyGoal: (goal: DailyGoal) => Promise<void>;
  resetProgress: () => Promise<void>;
  refreshProgress: () => Promise<void>;
}

export function useProgressTracker(): UseProgressTrackerReturn {
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Load progress on mount
  useEffect(() => {
    mountedRef.current = true;
    loadProgress();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const loaded = await progressTrackerService.loadProgress();
      
      if (mountedRef.current) {
        // Check for streak reset on load
        await progressTrackerService.checkStreakReset(loaded);
        setProgress(loaded);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load progress');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const refreshProgress = useCallback(async () => {
    await loadProgress();
  }, []);

  const markPageRead = useCallback(async (pageNumber: number) => {
    try {
      setError(null);
      const updated = await progressTrackerService.markPageRead(pageNumber);
      if (mountedRef.current) {
        setProgress(updated);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to mark page as read');
      }
      throw err;
    }
  }, []);

  const setDailyGoal = useCallback(async (goal: DailyGoal) => {
    try {
      setError(null);
      await progressTrackerService.setDailyGoal(goal);
      // Reload to get updated progress
      const updated = await progressTrackerService.loadProgress();
      if (mountedRef.current) {
        setProgress(updated);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to set daily goal');
      }
      throw err;
    }
  }, []);

  const resetProgress = useCallback(async () => {
    try {
      setError(null);
      await progressTrackerService.clearProgress();
      const fresh = progressTrackerService.getDefaultProgress();
      if (mountedRef.current) {
        setProgress(fresh);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to reset progress');
      }
      throw err;
    }
  }, []);

  // Computed values
  const stats = progress ? ProgressCalculator.getReadingStats(progress) : null;
  const todayProgress = progress ? ProgressCalculator.getTodayProgress(progress) : null;
  const isGoalMet = todayProgress?.goalMet ?? false;

  return {
    progress,
    loading,
    error,
    stats,
    todayProgress,
    isGoalMet,
    markPageRead,
    setDailyGoal,
    resetProgress,
    refreshProgress,
  };
}

export default useProgressTracker;
