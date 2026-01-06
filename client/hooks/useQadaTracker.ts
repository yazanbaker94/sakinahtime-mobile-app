/**
 * useQadaTracker Hook
 * Manages Qada (makeup) prayer tracking
 * Feature: prayer-log-statistics
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PrayerLogData,
  QadaCounts,
  PrayerName,
  PRAYER_NAMES,
} from '../types/prayerLog';
import { prayerLogService } from '../services/PrayerLogService';

export interface UseQadaTrackerReturn {
  qadaCounts: QadaCounts | null;
  totalQada: number;
  logQadaPrayer: (prayer: PrayerName) => Promise<void>;
  adjustQadaCount: (prayer: PrayerName, count: number) => Promise<void>;
  incrementQada: (prayer: PrayerName) => Promise<void>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useQadaTracker(): UseQadaTrackerReturn {
  const [data, setData] = useState<PrayerLogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedData = await prayerLogService.loadPrayerLog();
      setData(loadedData);
    } catch (err) {
      console.error('Failed to load qada data:', err);
      setError('Failed to load qada data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const logQadaPrayer = useCallback(async (prayer: PrayerName) => {
    try {
      const updatedData = await prayerLogService.decrementQada(prayer);
      setData(updatedData);
    } catch (err) {
      console.error('Failed to log qada prayer:', err);
      setError('Failed to log qada prayer');
    }
  }, []);

  const adjustQadaCount = useCallback(async (prayer: PrayerName, count: number) => {
    try {
      const updatedData = await prayerLogService.setQadaCount(prayer, count);
      setData(updatedData);
    } catch (err) {
      console.error('Failed to adjust qada count:', err);
      setError('Failed to adjust qada count');
    }
  }, []);

  const incrementQada = useCallback(async (prayer: PrayerName) => {
    try {
      const updatedData = await prayerLogService.incrementQada(prayer);
      setData(updatedData);
    } catch (err) {
      console.error('Failed to increment qada:', err);
      setError('Failed to increment qada');
    }
  }, []);

  const qadaCounts = data?.qadaCounts || null;

  const totalQada = useMemo(() => {
    if (!qadaCounts) return 0;
    return PRAYER_NAMES.reduce((sum, name) => sum + qadaCounts[name], 0);
  }, [qadaCounts]);

  return {
    qadaCounts,
    totalQada,
    logQadaPrayer,
    adjustQadaCount,
    incrementQada,
    loading,
    error,
    refresh: loadData,
  };
}

export default useQadaTracker;
