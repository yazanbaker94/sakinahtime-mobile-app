/**
 * useIslamicEvents Hook
 * 
 * Provides upcoming Islamic events, next major event, and events for current month.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { HijriDate } from '../types/hijri';
import { EventWithDate, islamicEventsService } from '../services/IslamicEventsService';
import { hijriDateService } from '../services/HijriDateService';

interface UseIslamicEventsResult {
  upcomingEvents: EventWithDate[];
  nextMajorEvent: EventWithDate | null;
  eventsThisMonth: EventWithDate[];
  todayEvent: EventWithDate | null;
  getEventsForMonth: (month: number, year: number) => EventWithDate[];
  getCountdownText: (daysUntil: number) => string;
  refresh: () => void;
}

export function useIslamicEvents(limit: number = 10): UseIslamicEventsResult {
  const [upcomingEvents, setUpcomingEvents] = useState<EventWithDate[]>([]);
  const [nextMajorEvent, setNextMajorEvent] = useState<EventWithDate | null>(null);
  const [todayEvent, setTodayEvent] = useState<EventWithDate | null>(null);
  const [currentHijriDate, setCurrentHijriDate] = useState<HijriDate>(() => 
    hijriDateService.getCurrentHijriDate()
  );

  const refresh = useCallback(() => {
    const hijriDate = hijriDateService.getCurrentHijriDate();
    setCurrentHijriDate(hijriDate);
    setUpcomingEvents(islamicEventsService.getUpcomingEvents(limit));
    setNextMajorEvent(islamicEventsService.getNextMajorEvent());
    setTodayEvent(islamicEventsService.isTodayEvent());
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

  const eventsThisMonth = useMemo(() => {
    return islamicEventsService.getEventsForMonth(
      currentHijriDate.month,
      currentHijriDate.year
    );
  }, [currentHijriDate.month, currentHijriDate.year]);

  const getEventsForMonth = useCallback((month: number, year: number) => {
    return islamicEventsService.getEventsForMonth(month, year);
  }, []);

  const getCountdownText = useCallback((daysUntil: number) => {
    return islamicEventsService.getCountdownText(daysUntil);
  }, []);

  return {
    upcomingEvents,
    nextMajorEvent,
    eventsThisMonth,
    todayEvent,
    getEventsForMonth,
    getCountdownText,
    refresh,
  };
}
