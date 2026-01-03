/**
 * WidgetDataService
 * 
 * Bridges React Native app data to Android home screen widgets.
 * Sends prayer times, hijri date, daily verse, and tasbeeh data to native widgets.
 */

import { NativeModules, Platform } from 'react-native';
import { PrayerTimes } from '../hooks/usePrayerTimes';
import { HijriDate, MoonPhase, IslamicEvent, FastingDay } from '../types/hijri';

const { WidgetBridge } = NativeModules;

// Types for widget data
export interface WidgetPrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  date: string;
  timezone: string;
}

export interface WidgetHijriDate {
  day: number;
  month: number;
  year: number;
  monthNameAr: string;
  monthNameEn: string;
  gregorianDate: string;
  moonPhase: string;
  moonIcon: string;
}

export interface WidgetDailyVerse {
  surah: number;
  ayah: number;
  surahNameAr: string;
  surahNameEn: string;
  textAr: string;
  textEn: string;
  verseKey: string;
}

class WidgetDataService {
  private isAndroid = Platform.OS === 'android';
  private isAvailable = this.isAndroid && WidgetBridge != null;

  /**
   * Update prayer times widget data
   */
  async updatePrayerTimes(timings: PrayerTimes, locationName: string = ''): Promise<void> {
    if (!this.isAvailable) return;

    try {
      const data: WidgetPrayerTimes = {
        fajr: this.cleanTime(timings.Fajr),
        sunrise: this.cleanTime(timings.Sunrise),
        dhuhr: this.cleanTime(timings.Dhuhr),
        asr: this.cleanTime(timings.Asr),
        maghrib: this.cleanTime(timings.Maghrib),
        isha: this.cleanTime(timings.Isha),
        date: new Date().toISOString().split('T')[0],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      await WidgetBridge.updatePrayerTimes(JSON.stringify(data), locationName);
      console.log('[WidgetDataService] Prayer times updated');
    } catch (error) {
      console.error('[WidgetDataService] Failed to update prayer times:', error);
    }
  }

  /**
   * Update Hijri date widget data
   */
  async updateHijriDate(
    hijriDate: HijriDate,
    moonPhase: MoonPhase,
    event?: IslamicEvent | null,
    fasting?: FastingDay | null
  ): Promise<void> {
    if (!this.isAvailable) return;

    try {
      const data: WidgetHijriDate = {
        day: hijriDate.day,
        month: hijriDate.month,
        year: hijriDate.year,
        monthNameAr: hijriDate.monthNameAr,
        monthNameEn: hijriDate.monthNameEn,
        gregorianDate: new Date().toISOString().split('T')[0],
        moonPhase: moonPhase.phase,
        moonIcon: moonPhase.icon,
      };

      await WidgetBridge.updateHijriDate(
        JSON.stringify(data),
        event?.nameEn || null,
        fasting?.type || null
      );
      console.log('[WidgetDataService] Hijri date updated');
    } catch (error) {
      console.error('[WidgetDataService] Failed to update hijri date:', error);
    }
  }

  /**
   * Update daily verse widget data
   */
  async updateDailyVerse(verse: WidgetDailyVerse): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await WidgetBridge.updateDailyVerse(JSON.stringify(verse));
      console.log('[WidgetDataService] Daily verse updated');
    } catch (error) {
      console.error('[WidgetDataService] Failed to update daily verse:', error);
    }
  }

  /**
   * Update tasbeeh counter widget data
   */
  async updateTasbeehCount(count: number, target: number = 33, dhikr: string = 'سبحان الله'): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await WidgetBridge.updateTasbeehCount(count, target, dhikr);
      console.log('[WidgetDataService] Tasbeeh count updated:', count);
    } catch (error) {
      console.error('[WidgetDataService] Failed to update tasbeeh count:', error);
    }
  }

  /**
   * Get current tasbeeh count from widget
   */
  async getTasbeehCount(): Promise<number> {
    if (!this.isAvailable) return 0;

    try {
      const count = await WidgetBridge.getTasbeehCount();
      return count;
    } catch (error) {
      console.error('[WidgetDataService] Failed to get tasbeeh count:', error);
      return 0;
    }
  }

  /**
   * Refresh all widgets
   */
  async refreshAllWidgets(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await WidgetBridge.refreshAllWidgets();
      console.log('[WidgetDataService] All widgets refreshed');
    } catch (error) {
      console.error('[WidgetDataService] Failed to refresh widgets:', error);
    }
  }

  /**
   * Clean time string by removing timezone info (e.g., "05:23 (PKT)" -> "05:23")
   */
  private cleanTime(time: string): string {
    return time.split(' ')[0];
  }

  /**
   * Check if widget bridge is available
   */
  isWidgetBridgeAvailable(): boolean {
    return this.isAvailable;
  }
}

export const widgetDataService = new WidgetDataService();
