/**
 * useFastingDays Hook
 * 
 * Provides today's fasting status and upcoming fasting days.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FastingDay, HijriDate } from '../types/hijri';
import { fastingDayService } from '../services/FastingDayService';
import { hijriDateService } from '../services/HijriDateService';

interface UseFastingDaysResult {
  todayFasting: FastingDay | null;
  upcomingFastingDays: FastingDay[];
  fastingDaysThisMonth: FastingDay[];
  isTodayFastingDay: boolean;
  isFastingProhibited: boolean;
  getFastingDescription: (type: FastingDay['type']) => string;
  refresh: () => void;
}

export function useFastingDays(limit: number = 10): UseFastingDaysResult {
  const [todayFasting, setTodayFasting] = useState<FastingDay | null>(null);
  const [upcomingFastingDays, setUpcomingFastingDays] = useState<FastingDay[]>([]);
  const [currentHijriDate, setCurrentHijriDate] = useState<HijriDate>(() => 
    hijriDateService.getCurrentHijriDate()
  );

  const refresh = useCallback(() => {
    const hijriDate = hijriDateService.getCurrentHijriDate();
    setCurrentHijriDate(hijriDate);
    setTodayFasting(fastingDayService.isTodayFastingDay());
    setUpcomingFastingDays(fastingDayService.getUpcomingFastingDays(limit));
  }, [limit]);

  useEffect(() => {
    refresh();

    // Refresh at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      refresh();
      const dailyInterval = setInterval(refresh, 24 * 60 * 60 * 1000);
      return () => clearInterval(dailyInterval);
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimeout);
  }, [refresh]);

  const fastingDaysThisMonth = useMemo(() => {
    return fastingDayService.getFastingDaysForMonth(
      currentHijriDate.month,
      currentHijriDate.year
    );
  }, [currentHijriDate.month, currentHijriDate.year]);

  const isTodayFastingDay = todayFasting !== null;

  const isFastingProhibited = useMemo(() => {
    return fastingDayService.isFastingProhibited(currentHijriDate);
  }, [currentHijriDate]);

  const getFastingDescription = useCallback((type: FastingDay['type']) => {
    return fastingDayService.getFastingDescription(type);
  }, []);

  return {
    todayFasting,
    upcomingFastingDays,
    fastingDaysThisMonth,
    isTodayFastingDay,
    isFastingProhibited,
    getFastingDescription,
    refresh,
  };
}
