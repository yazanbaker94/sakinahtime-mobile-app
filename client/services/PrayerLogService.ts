/**
 * Prayer Log Service
 * Handles storage, prayer marking, streak updates, and statistics
 * Feature: prayer-log-statistics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PrayerLogData,
  PrayerEntry,
  DailyPrayerRecord,
  PrayerStreakData,
  QadaCounts,
  PrayerStatus,
  PrayerName,
  WeeklyStats,
  MonthlyStats,
  PRAYER_LOG_STORAGE_KEY,
  DEFAULT_PRAYER_LOG,
  DEFAULT_PRAYER_ENTRY,
  DEFAULT_QADA_COUNTS,
  PRAYER_NAMES,
  PrayerLogSettings,
} from '../types/prayerLog';

// Date utility functions
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function isToday(dateStr: string): boolean {
  return dateStr === getTodayDateString();
}

export function isYesterday(dateStr: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === getDateString(yesterday);
}

export function getWeekStartDate(endDate: Date = new Date()): Date {
  const start = new Date(endDate);
  start.setDate(start.getDate() - 6);
  return start;
}

export function getMonthStartDate(month: number, year: number): Date {
  return new Date(year, month - 1, 1);
}

export function getMonthEndDate(month: number, year: number): Date {
  return new Date(year, month, 0);
}

export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

class PrayerLogService {
  private cachedData: PrayerLogData | null = null;

  /**
   * Load prayer log from AsyncStorage
   */
  async loadPrayerLog(): Promise<PrayerLogData> {
    try {
      const stored = await AsyncStorage.getItem(PRAYER_LOG_STORAGE_KEY);
      if (!stored) {
        return this.getDefaultPrayerLog();
      }

      const parsed = JSON.parse(stored);
      const validated = this.validatePrayerLog(parsed);

      if (!validated) {
        console.error('Prayer log data validation failed, using defaults');
        return this.getDefaultPrayerLog();
      }

      // Merge with defaults to handle migration (add any missing fields)
      const merged: PrayerLogData = {
        ...this.getDefaultPrayerLog(),
        ...validated,
        settings: {
          ...DEFAULT_PRAYER_LOG.settings,
          ...validated.settings,
        },
        streak: {
          ...DEFAULT_PRAYER_LOG.streak,
          ...validated.streak,
        },
        qadaCounts: {
          ...DEFAULT_PRAYER_LOG.qadaCounts,
          ...validated.qadaCounts,
        },
      };

      this.cachedData = merged;
      return merged;
    } catch (error) {
      console.error('Failed to load prayer log:', error);
      return this.getDefaultPrayerLog();
    }
  }

  /**
   * Save prayer log to AsyncStorage
   */
  async savePrayerLog(data: PrayerLogData): Promise<void> {
    try {
      data.lastUpdated = Date.now();
      const json = JSON.stringify(data);
      await AsyncStorage.setItem(PRAYER_LOG_STORAGE_KEY, json);
      this.cachedData = data;
    } catch (error) {
      console.error('Failed to save prayer log:', error);
      throw error;
    }
  }

  /**
   * Validate prayer log data structure
   */
  validatePrayerLog(data: unknown): PrayerLogData | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const obj = data as Record<string, unknown>;

    // Validate dailyRecords
    if (!obj.dailyRecords || typeof obj.dailyRecords !== 'object') {
      return null;
    }

    // Validate streak
    if (!this.isValidStreakData(obj.streak)) {
      return null;
    }

    // Validate qadaCounts
    if (!this.isValidQadaCounts(obj.qadaCounts)) {
      return null;
    }

    // Validate settings
    if (!this.isValidSettings(obj.settings)) {
      return null;
    }

    return obj as unknown as PrayerLogData;
  }

  private isValidStreakData(data: unknown): data is PrayerStreakData {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    return (
      typeof obj.currentStreak === 'number' &&
      typeof obj.longestStreak === 'number' &&
      typeof obj.lastPerfectDate === 'string'
    );
  }

  private isValidQadaCounts(data: unknown): data is QadaCounts {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    return PRAYER_NAMES.every(name => typeof obj[name] === 'number' && obj[name] >= 0);
  }

  private isValidSettings(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    // Only require the original fields, trackingEnabled is optional for migration
    return (
      typeof obj.missedReminderEnabled === 'boolean' &&
      typeof obj.missedReminderDelayMinutes === 'number' &&
      typeof obj.autoMarkEnabled === 'boolean'
    );
  }

  /**
   * Get default prayer log
   */
  getDefaultPrayerLog(): PrayerLogData {
    return JSON.parse(JSON.stringify(DEFAULT_PRAYER_LOG));
  }

  /**
   * Get or create daily record for a date
   */
  getOrCreateDailyRecord(data: PrayerLogData, date: string): DailyPrayerRecord {
    if (data.dailyRecords[date]) {
      return data.dailyRecords[date];
    }

    const newRecord: DailyPrayerRecord = {
      date,
      prayers: {
        Fajr: { ...DEFAULT_PRAYER_ENTRY },
        Dhuhr: { ...DEFAULT_PRAYER_ENTRY },
        Asr: { ...DEFAULT_PRAYER_ENTRY },
        Maghrib: { ...DEFAULT_PRAYER_ENTRY },
        Isha: { ...DEFAULT_PRAYER_ENTRY },
      },
      isPerfectDay: false,
    };

    return newRecord;
  }

  /**
   * Get daily record for a date
   */
  getDailyRecord(data: PrayerLogData, date: string): DailyPrayerRecord | null {
    return data.dailyRecords[date] || null;
  }

  /**
   * Check if a day is perfect (all 5 prayers prayed)
   */
  checkPerfectDay(record: DailyPrayerRecord): boolean {
    return PRAYER_NAMES.every(name => record.prayers[name].status === 'prayed');
  }

  /**
   * Mark a prayer with a status
   */
  async markPrayer(
    date: string,
    prayer: PrayerName,
    status: PrayerStatus,
    prayerTime: string = ''
  ): Promise<PrayerLogData> {
    const data = this.cachedData || await this.loadPrayerLog();
    const record = this.getOrCreateDailyRecord(data, date);
    
    const previousStatus = record.prayers[prayer].status;

    // Update prayer entry
    record.prayers[prayer] = {
      status,
      markedAt: status !== 'unmarked' ? Date.now() : null,
      prayerTime,
    };

    // Update perfect day status
    record.isPerfectDay = this.checkPerfectDay(record);

    // Save record
    data.dailyRecords[date] = record;

    // Handle qada count changes
    if (status === 'missed' && previousStatus !== 'missed') {
      data.qadaCounts[prayer] = Math.max(0, data.qadaCounts[prayer] + 1);
    } else if (previousStatus === 'missed' && status !== 'missed') {
      data.qadaCounts[prayer] = Math.max(0, data.qadaCounts[prayer] - 1);
    }

    // Update streak
    this.updateStreak(data);

    await this.savePrayerLog(data);
    return data;
  }

  /**
   * Update streak based on current data
   */
  updateStreak(data: PrayerLogData): PrayerStreakData {
    const today = getTodayDateString();
    const todayRecord = data.dailyRecords[today];

    // Check if today is perfect
    if (todayRecord?.isPerfectDay) {
      if (data.streak.lastPerfectDate === '') {
        // First perfect day
        data.streak.currentStreak = 1;
      } else if (isToday(data.streak.lastPerfectDate)) {
        // Already counted today
      } else if (isYesterday(data.streak.lastPerfectDate)) {
        // Continuing streak
        data.streak.currentStreak += 1;
      } else {
        // Streak was broken, start new
        data.streak.currentStreak = 1;
      }

      data.streak.lastPerfectDate = today;

      // Update longest streak
      if (data.streak.currentStreak > data.streak.longestStreak) {
        data.streak.longestStreak = data.streak.currentStreak;
      }
    } else {
      // Check if streak should be reset
      if (data.streak.lastPerfectDate && !isToday(data.streak.lastPerfectDate) && !isYesterday(data.streak.lastPerfectDate)) {
        data.streak.currentStreak = 0;
      }
    }

    return data.streak;
  }

  /**
   * Get weekly statistics
   */
  getWeeklyStats(data: PrayerLogData, endDate: Date = new Date()): WeeklyStats {
    const end = getDateString(endDate);
    const startDate = getWeekStartDate(endDate);
    const start = getDateString(startDate);

    let totalPrayed = 0;
    let totalMissed = 0;
    let totalLate = 0;
    const dailyBreakdown: WeeklyStats['dailyBreakdown'] = [];
    let bestDay: string | null = null;
    let bestDayCount = -1;
    let worstDay: string | null = null;
    let worstDayCount = 6;

    // Iterate through each day of the week
    const currentDate = new Date(startDate);
    while (getDateString(currentDate) <= end) {
      const dateStr = getDateString(currentDate);
      const record = data.dailyRecords[dateStr];

      let dayPrayed = 0;
      let dayMissed = 0;
      let dayLate = 0;

      if (record) {
        PRAYER_NAMES.forEach(name => {
          const status = record.prayers[name].status;
          if (status === 'prayed') {
            dayPrayed++;
            totalPrayed++;
          } else if (status === 'missed') {
            dayMissed++;
            totalMissed++;
          } else if (status === 'late') {
            dayLate++;
            totalLate++;
          }
        });
      }

      dailyBreakdown.push({
        date: dateStr,
        prayedCount: dayPrayed,
        isPerfectDay: dayPrayed === 5,
      });

      if (dayPrayed > bestDayCount) {
        bestDayCount = dayPrayed;
        bestDay = dateStr;
      }

      if (dayPrayed < worstDayCount && record) {
        worstDayCount = dayPrayed;
        worstDay = dateStr;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const totalTracked = totalPrayed + totalMissed + totalLate;
    const completionPercentage = totalTracked > 0 ? Math.round((totalPrayed / totalTracked) * 100) : 0;

    return {
      startDate: start,
      endDate: end,
      totalPrayed,
      totalMissed,
      totalLate,
      completionPercentage,
      dailyBreakdown,
      bestDay,
      worstDay,
    };
  }

  /**
   * Get monthly statistics
   */
  getMonthlyStats(data: PrayerLogData, month: number, year: number): MonthlyStats {
    const daysInMonth = getDaysInMonth(month, year);
    
    let totalPrayed = 0;
    let totalMissed = 0;
    let totalLate = 0;
    let perfectDays = 0;
    const calendarData: MonthlyStats['calendarData'] = {};
    const prayerBreakdown: MonthlyStats['prayerBreakdown'] = {
      Fajr: { prayed: 0, missed: 0, late: 0, percentage: 0 },
      Dhuhr: { prayed: 0, missed: 0, late: 0, percentage: 0 },
      Asr: { prayed: 0, missed: 0, late: 0, percentage: 0 },
      Maghrib: { prayed: 0, missed: 0, late: 0, percentage: 0 },
      Isha: { prayed: 0, missed: 0, late: 0, percentage: 0 },
    };

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = data.dailyRecords[dateStr];

      let dayPrayed = 0;

      if (record) {
        PRAYER_NAMES.forEach(name => {
          const status = record.prayers[name].status;
          if (status === 'prayed') {
            dayPrayed++;
            totalPrayed++;
            prayerBreakdown[name].prayed++;
          } else if (status === 'missed') {
            totalMissed++;
            prayerBreakdown[name].missed++;
          } else if (status === 'late') {
            totalLate++;
            prayerBreakdown[name].late++;
          }
        });

        if (record.isPerfectDay) {
          perfectDays++;
        }
      }

      calendarData[dateStr] = {
        prayedCount: dayPrayed,
        isPerfectDay: dayPrayed === 5,
      };
    }

    // Calculate percentages for each prayer
    PRAYER_NAMES.forEach(name => {
      const total = prayerBreakdown[name].prayed + prayerBreakdown[name].missed + prayerBreakdown[name].late;
      prayerBreakdown[name].percentage = total > 0 
        ? Math.round((prayerBreakdown[name].prayed / total) * 100) 
        : 0;
    });

    const totalTracked = totalPrayed + totalMissed + totalLate;
    const completionPercentage = totalTracked > 0 ? Math.round((totalPrayed / totalTracked) * 100) : 0;

    return {
      month,
      year,
      totalPrayed,
      totalMissed,
      totalLate,
      completionPercentage,
      perfectDays,
      calendarData,
      prayerBreakdown,
    };
  }

  /**
   * Increment qada count for a prayer
   */
  async incrementQada(prayer: PrayerName): Promise<PrayerLogData> {
    const data = this.cachedData || await this.loadPrayerLog();
    data.qadaCounts[prayer] = data.qadaCounts[prayer] + 1;
    await this.savePrayerLog(data);
    return data;
  }

  /**
   * Decrement qada count for a prayer (when qada is made up)
   */
  async decrementQada(prayer: PrayerName): Promise<PrayerLogData> {
    const data = this.cachedData || await this.loadPrayerLog();
    data.qadaCounts[prayer] = Math.max(0, data.qadaCounts[prayer] - 1);
    await this.savePrayerLog(data);
    return data;
  }

  /**
   * Set qada count manually
   */
  async setQadaCount(prayer: PrayerName, count: number): Promise<PrayerLogData> {
    const data = this.cachedData || await this.loadPrayerLog();
    data.qadaCounts[prayer] = Math.max(0, count);
    await this.savePrayerLog(data);
    return data;
  }

  /**
   * Get total qada count
   */
  getTotalQada(data: PrayerLogData): number {
    return PRAYER_NAMES.reduce((sum, name) => sum + data.qadaCounts[name], 0);
  }

  /**
   * Export data as JSON string
   */
  async exportData(): Promise<string> {
    const data = this.cachedData || await this.loadPrayerLog();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Update settings
   */
  async updateSettings(settings: Partial<PrayerLogData['settings']>): Promise<PrayerLogData> {
    const data = this.cachedData || await this.loadPrayerLog();
    // Create new object to avoid mutation issues
    const updatedData: PrayerLogData = {
      ...data,
      settings: { ...data.settings, ...settings },
    };
    await this.savePrayerLog(updatedData);
    return updatedData;
  }

  /**
   * Clear old records (keep last N months)
   */
  async clearOldRecords(monthsToKeep: number = 12): Promise<void> {
    const data = this.cachedData || await this.loadPrayerLog();
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep);
    const cutoffStr = getDateString(cutoffDate);

    const newRecords: Record<string, DailyPrayerRecord> = {};
    Object.entries(data.dailyRecords).forEach(([date, record]) => {
      if (date >= cutoffStr) {
        newRecords[date] = record;
      }
    });

    data.dailyRecords = newRecords;
    await this.savePrayerLog(data);
  }

  /**
   * Get cached data (for synchronous access)
   */
  getCachedData(): PrayerLogData | null {
    return this.cachedData;
  }

  /**
   * Clear all prayer log data
   */
  async clearAllData(): Promise<void> {
    await AsyncStorage.removeItem(PRAYER_LOG_STORAGE_KEY);
    this.cachedData = null;
  }
}

// Export singleton instance
export const prayerLogService = new PrayerLogService();
export default prayerLogService;
