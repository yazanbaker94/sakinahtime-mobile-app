/**
 * usePrayerStats Hook
 * Manages prayer statistics and analytics
 * Feature: prayer-log-statistics
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PrayerLogData,
  PrayerStreakData,
  WeeklyStats,
  MonthlyStats,
} from '../types/prayerLog';
import { prayerLogService } from '../services/PrayerLogService';

export type ViewMode = 'weekly' | 'monthly';

export interface UsePrayerStatsReturn {
  data: PrayerLogData | null;
  streak: PrayerStreakData | null;
  weeklyStats: WeeklyStats | null;
  monthlyStats: MonthlyStats | null;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  totalPrayersLogged: number;
}

export function usePrayerStats(): UsePrayerStatsReturn {
  const [data, setData] = useState<PrayerLogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedData = await prayerLogService.loadPrayerLog();
      setData(loadedData);
    } catch (err) {
      console.error('Failed to load prayer stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const weeklyStats = useMemo(() => {
    if (!data) return null;
    return prayerLogService.getWeeklyStats(data);
  }, [data]);

  const monthlyStats = useMemo(() => {
    if (!data) return null;
    return prayerLogService.getMonthlyStats(data, selectedMonth, selectedYear);
  }, [data, selectedMonth, selectedYear]);

  const totalPrayersLogged = useMemo(() => {
    if (!data) return 0;
    let total = 0;
    Object.values(data.dailyRecords).forEach(record => {
      Object.values(record.prayers).forEach(prayer => {
        if (prayer.status === 'prayed' || prayer.status === 'late') {
          total++;
        }
      });
    });
    return total;
  }, [data]);

  const streak = data?.streak || null;

  return {
    data,
    streak,
    weeklyStats,
    monthlyStats,
    viewMode,
    setViewMode,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    loading,
    error,
    refresh: loadData,
    totalPrayersLogged,
  };
}

export default usePrayerStats;
