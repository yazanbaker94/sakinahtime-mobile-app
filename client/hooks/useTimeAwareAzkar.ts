/**
 * useTimeAwareAzkar Hook
 * 
 * Returns the appropriate azkar category based on current time of day.
 * Morning: 4:00 AM - 12:00 PM
 * Evening: 12:00 PM - 4:00 AM (next day)
 */

import { useState, useEffect, useMemo } from 'react';
import { azkarCategories, AzkarCategory } from '@/data/azkar';

// Time thresholds (in hours, 24-hour format)
const MORNING_START = 4;  // 4:00 AM
const MORNING_END = 12;   // 12:00 PM (noon)

// Estimated durations in minutes
export const ESTIMATED_DURATIONS: Record<string, number> = {
  morning: 5,
  evening: 5,
  'after-prayer': 3,
  sleep: 2,
  waking: 2,
  general: 10,
};

interface UseTimeAwareAzkarReturn {
  currentCategory: AzkarCategory;
  isMorning: boolean;
  timeUntilSwitch: number; // minutes until morning/evening switch
  estimatedDuration: number; // minutes
}

function isMorningTime(hour: number): boolean {
  return hour >= MORNING_START && hour < MORNING_END;
}

function getMinutesUntilSwitch(now: Date): number {
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  
  if (isMorningTime(currentHour)) {
    // Time until noon (12:00 PM)
    const minutesUntilNoon = (MORNING_END - currentHour) * 60 - currentMinutes;
    return minutesUntilNoon;
  } else {
    // Time until 4:00 AM
    let hoursUntil4AM: number;
    if (currentHour >= MORNING_END) {
      // After noon, before midnight
      hoursUntil4AM = (24 - currentHour) + MORNING_START;
    } else {
      // After midnight, before 4 AM
      hoursUntil4AM = MORNING_START - currentHour;
    }
    return hoursUntil4AM * 60 - currentMinutes;
  }
}

export function useTimeAwareAzkar(): UseTimeAwareAzkarReturn {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const isMorning = useMemo(() => {
    return isMorningTime(currentTime.getHours());
  }, [currentTime]);

  const currentCategory = useMemo(() => {
    const categoryId = isMorning ? 'morning' : 'evening';
    return azkarCategories.find(c => c.id === categoryId) || azkarCategories[0];
  }, [isMorning]);

  const timeUntilSwitch = useMemo(() => {
    return getMinutesUntilSwitch(currentTime);
  }, [currentTime]);

  const estimatedDuration = useMemo(() => {
    return ESTIMATED_DURATIONS[currentCategory.id] || 5;
  }, [currentCategory.id]);

  return {
    currentCategory,
    isMorning,
    timeUntilSwitch,
    estimatedDuration,
  };
}

export default useTimeAwareAzkar;
