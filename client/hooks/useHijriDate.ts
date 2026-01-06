/**
 * useHijriDate Hook
 * 
 * Provides current Hijri date, Gregorian date, and moon phase.
 * Auto-updates at midnight.
 */

import { useState, useEffect, useCallback } from 'react';
import { HijriDate, MoonPhase } from '../types/hijri';
import { hijriDateService } from '../services/HijriDateService';
import { moonPhaseService } from '../services/MoonPhaseService';
import { widgetDataService } from '../services/WidgetDataService';

interface UseHijriDateResult {
  hijriDate: HijriDate;
  gregorianDate: Date;
  formattedDate: string;
  formattedDateArabic: string;
  moonPhase: MoonPhase;
  refresh: () => void;
}

export function useHijriDate(maghribTime?: Date): UseHijriDateResult {
  const [gregorianDate, setGregorianDate] = useState<Date>(() => new Date());
  const [hijriDate, setHijriDate] = useState<HijriDate>(() => 
    hijriDateService.getCurrentHijriDate(maghribTime)
  );
  const [moonPhase, setMoonPhase] = useState<MoonPhase>(() => 
    moonPhaseService.getCurrentPhase()
  );

  const refresh = useCallback(() => {
    const now = new Date();
    setGregorianDate(now);
    const newHijriDate = hijriDateService.getCurrentHijriDate(maghribTime);
    const newMoonPhase = moonPhaseService.getPhaseForDate(now);
    setHijriDate(newHijriDate);
    setMoonPhase(newMoonPhase);
    
    // Update widget data
    widgetDataService.updateHijriDate(newHijriDate, newMoonPhase, null, null).catch(err => {
      console.warn('[useHijriDate] Failed to update widget:', err);
    });
  }, [maghribTime]);

  useEffect(() => {
    // Calculate time until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    // Set timeout for midnight update
    const midnightTimeout = setTimeout(() => {
      refresh();
      // After first midnight, set up daily interval
      const dailyInterval = setInterval(refresh, 24 * 60 * 60 * 1000);
      return () => clearInterval(dailyInterval);
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimeout);
  }, [refresh]);

  // Update when maghribTime changes
  useEffect(() => {
    if (maghribTime) {
      const now = new Date();
      if (now >= maghribTime) {
        refresh();
      } else {
        // Set timeout for Maghrib update
        const msUntilMaghrib = maghribTime.getTime() - now.getTime();
        const maghribTimeout = setTimeout(refresh, msUntilMaghrib);
        return () => clearTimeout(maghribTimeout);
      }
    }
  }, [maghribTime, refresh]);

  const formattedDate = hijriDateService.formatHijriDate(hijriDate, 'long');
  const formattedDateArabic = hijriDateService.formatHijriDateArabic(hijriDate);

  return {
    hijriDate,
    gregorianDate,
    formattedDate,
    formattedDateArabic,
    moonPhase,
    refresh,
  };
}
