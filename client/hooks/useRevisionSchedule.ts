/**
 * useRevisionSchedule Hook
 * Provides access to revision scheduling functionality with spaced repetition
 */

import { useState, useEffect, useCallback } from 'react';
import { revisionScheduleService } from '../services/RevisionScheduleService';
import type { VerseKey, RevisionEntry } from '../types/hifz';

interface UseRevisionScheduleReturn {
  dueRevisions: RevisionEntry[];
  todayRevisions: RevisionEntry[];
  isLoading: boolean;
  error: string | null;
  
  // Record a revision
  recordRevision: (verseKey: VerseKey, quality: number) => Promise<void>;
  
  // Get revision info
  getNextRevisionDate: (verseKey: VerseKey) => Date | null;
  getRevisionHistory: (verseKey: VerseKey) => RevisionEntry | null;
  isVerseDueForRevision: (verseKey: VerseKey) => boolean;
  
  // Daily suggestions
  getDailySuggestions: (limit?: number) => RevisionEntry[];
  
  // Stats
  getTodayCompletedCount: () => number;
  getDailyGoal: () => number;
  setDailyGoal: (goal: number) => Promise<void>;
  
  // Refresh
  refresh: () => Promise<void>;
}

export function useRevisionSchedule(): UseRevisionScheduleReturn {
  const [dueRevisions, setDueRevisions] = useState<RevisionEntry[]>([]);
  const [todayRevisions, setTodayRevisions] = useState<RevisionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load revisions on mount
  useEffect(() => {
    loadRevisions();
  }, []);

  const loadRevisions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await revisionScheduleService.initialize();
      
      const due = revisionScheduleService.getDueRevisions();
      const today = revisionScheduleService.getTodayRevisions();
      
      setDueRevisions(due);
      setTodayRevisions(today);
    } catch (err) {
      console.error('[useRevisionSchedule] Failed to load revisions:', err);
      setError('Failed to load revision schedule');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const recordRevision = useCallback(async (verseKey: VerseKey, quality: number) => {
    try {
      await revisionScheduleService.recordRevision(verseKey, quality);
      
      // Refresh the lists
      const due = revisionScheduleService.getDueRevisions();
      const today = revisionScheduleService.getTodayRevisions();
      
      setDueRevisions(due);
      setTodayRevisions(today);
    } catch (err) {
      console.error('[useRevisionSchedule] Failed to record revision:', err);
      throw err;
    }
  }, []);

  const getNextRevisionDate = useCallback((verseKey: VerseKey): Date | null => {
    return revisionScheduleService.getNextRevisionDate(verseKey);
  }, []);

  const getRevisionHistory = useCallback((verseKey: VerseKey): RevisionEntry | null => {
    return revisionScheduleService.getRevisionEntry(verseKey);
  }, []);

  const isVerseDueForRevision = useCallback((verseKey: VerseKey): boolean => {
    return dueRevisions.some(r => r.verseKey === verseKey);
  }, [dueRevisions]);

  const getDailySuggestions = useCallback((limit: number = 10): RevisionEntry[] => {
    return revisionScheduleService.getDailySuggestions(limit);
  }, []);

  const getTodayCompletedCount = useCallback((): number => {
    return revisionScheduleService.getTodayCompletedCount();
  }, []);

  const getDailyGoal = useCallback((): number => {
    return revisionScheduleService.getDailyGoal();
  }, []);

  const setDailyGoal = useCallback(async (goal: number) => {
    await revisionScheduleService.setDailyGoal(goal);
  }, []);

  const refresh = useCallback(async () => {
    await loadRevisions();
  }, [loadRevisions]);

  return {
    dueRevisions,
    todayRevisions,
    isLoading,
    error,
    recordRevision,
    getNextRevisionDate,
    getRevisionHistory,
    isVerseDueForRevision,
    getDailySuggestions,
    getTodayCompletedCount,
    getDailyGoal,
    setDailyGoal,
    refresh,
  };
}

export default useRevisionSchedule;
