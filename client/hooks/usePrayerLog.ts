/**
 * usePrayerLog Hook
 * Manages daily prayer logging and status tracking
 * Feature: prayer-log-statistics
 */

import { useState, useEffect, useCallback } from 'react';
import {
  PrayerLogData,
  DailyPrayerRecord,
  PrayerStatus,
  PrayerName,
  PrayerStreakData,
  PRAYER_NAMES,
} from '../types/prayerLog';
import { prayerLogService, getTodayDateString } from '../services/PrayerLogService';
import { widgetDataService } from '../services/WidgetDataService';

export interface UsePrayerLogReturn {
  data: PrayerLogData | null;
  todayRecord: DailyPrayerRecord | null;
  streak: PrayerStreakData | null;
  trackingEnabled: boolean;
  missedReminderEnabled: boolean;
  missedReminderDelayMinutes: number;
  markPrayer: (prayer: PrayerName, status: PrayerStatus, prayerTime?: string) => Promise<void>;
  getPrayerStatus: (prayer: PrayerName) => PrayerStatus;
  toggleTracking: (enabled: boolean) => Promise<void>;
  toggleMissedReminder: (enabled: boolean) => Promise<void>;
  setMissedReminderDelay: (minutes: number) => Promise<void>;
  isPerfectDay: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePrayerLog(): UsePrayerLogReturn {
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
      console.error('Failed to load prayer log:', err);
      setError('Failed to load prayer data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const markPrayer = useCallback(async (
    prayer: PrayerName,
    status: PrayerStatus,
    prayerTime: string = ''
  ) => {
    try {
      const today = getTodayDateString();
      const updatedData = await prayerLogService.markPrayer(today, prayer, status, prayerTime);
      setData(updatedData);

      // Sync streak to widget
      if (updatedData.streak) {
        widgetDataService.updateStreakWidget(
          updatedData.streak.currentStreak,
          updatedData.streak.longestStreak,
          updatedData.streak.lastPerfectDate
        );
      }
    } catch (err) {
      console.error('Failed to mark prayer:', err);
      setError('Failed to save prayer status');
    }
  }, []);

  const getPrayerStatus = useCallback((prayer: PrayerName): PrayerStatus => {
    if (!data) return 'unmarked';
    const today = getTodayDateString();
    const record = data.dailyRecords[today];
    return record?.prayers[prayer]?.status || 'unmarked';
  }, [data]);

  const toggleTracking = useCallback(async (enabled: boolean) => {
    try {
      const updatedData = await prayerLogService.updateSettings({ trackingEnabled: enabled });
      // Create a new object reference to ensure React detects the change
      setData({ ...updatedData });
    } catch (err) {
      console.error('Failed to toggle tracking:', err);
      setError('Failed to update settings');
    }
  }, []);

  const toggleMissedReminder = useCallback(async (enabled: boolean) => {
    try {
      const updatedData = await prayerLogService.updateSettings({ missedReminderEnabled: enabled });
      setData({ ...updatedData });
    } catch (err) {
      console.error('Failed to toggle missed reminder:', err);
      setError('Failed to update settings');
    }
  }, []);

  const setMissedReminderDelay = useCallback(async (minutes: number) => {
    try {
      const updatedData = await prayerLogService.updateSettings({ missedReminderDelayMinutes: minutes });
      setData({ ...updatedData });
    } catch (err) {
      console.error('Failed to set missed reminder delay:', err);
      setError('Failed to update settings');
    }
  }, []);

  const todayRecord = data ? prayerLogService.getDailyRecord(data, getTodayDateString()) : null;
  const isPerfectDay = todayRecord?.isPerfectDay || false;
  const streak = data?.streak || null;
  const trackingEnabled = data?.settings?.trackingEnabled ?? false;
  const missedReminderEnabled = data?.settings?.missedReminderEnabled ?? false;
  const missedReminderDelayMinutes = data?.settings?.missedReminderDelayMinutes ?? 30;

  return {
    data,
    todayRecord,
    streak,
    trackingEnabled,
    missedReminderEnabled,
    missedReminderDelayMinutes,
    markPrayer,
    getPrayerStatus,
    toggleTracking,
    toggleMissedReminder,
    setMissedReminderDelay,
    isPerfectDay,
    loading,
    error,
    refresh: loadData,
  };
}

export default usePrayerLog;
