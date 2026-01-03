/**
 * Fasting Day Service
 * 
 * Identifies and tracks recommended fasting days in Islam.
 */

import { FastingDay, HijriDate } from '../types/hijri';
import { WHITE_DAYS, FASTING_LABELS } from '../constants/islamic-calendar';
import { hijriDateService } from './HijriDateService';

export class FastingDayService {
  /**
   * Check if a date is a fasting day
   */
  isFastingDay(hijriDate: HijriDate, gregorianDate: Date): FastingDay | null {
    // Check special fasting days first (they take priority)
    
    // Ashura (9th and 10th of Muharram)
    if (hijriDate.month === 1 && (hijriDate.day === 9 || hijriDate.day === 10)) {
      return {
        type: 'ashura',
        hijriDate,
        gregorianDate,
        label: FASTING_LABELS.ashura.en,
      };
    }
    
    // Day of Arafah (9th of Dhul Hijjah)
    if (hijriDate.month === 12 && hijriDate.day === 9) {
      return {
        type: 'arafah',
        hijriDate,
        gregorianDate,
        label: FASTING_LABELS.arafah.en,
      };
    }
    
    // Six days of Shawwal (2nd-7th of Shawwal, after Eid)
    if (hijriDate.month === 10 && hijriDate.day >= 2 && hijriDate.day <= 7) {
      return {
        type: 'shawwal',
        hijriDate,
        gregorianDate,
        label: FASTING_LABELS.shawwal.en,
      };
    }
    
    // White Days (13th, 14th, 15th of each Hijri month)
    if (this.isWhiteDay(hijriDate.day)) {
      return {
        type: 'white_day',
        hijriDate,
        gregorianDate,
        label: FASTING_LABELS.white_day.en,
      };
    }
    
    // Monday and Thursday (Sunnah fasting)
    const dayOfWeek = gregorianDate.getDay();
    if (dayOfWeek === 1) { // Monday
      return {
        type: 'monday',
        hijriDate,
        gregorianDate,
        label: FASTING_LABELS.monday.en,
      };
    }
    if (dayOfWeek === 4) { // Thursday
      return {
        type: 'thursday',
        hijriDate,
        gregorianDate,
        label: FASTING_LABELS.thursday.en,
      };
    }
    
    return null;
  }

  /**
   * Get all fasting days for a Hijri month
   */
  getFastingDaysForMonth(month: number, year: number): FastingDay[] {
    const days = hijriDateService.getMonthDays(month, year);
    const fastingDays: FastingDay[] = [];
    
    for (const hijriDate of days) {
      const gregorianDate = hijriDateService.toGregorian(hijriDate);
      const fastingDay = this.isFastingDay(hijriDate, gregorianDate);
      if (fastingDay) {
        fastingDays.push(fastingDay);
      }
    }
    
    return fastingDays;
  }

  /**
   * Get upcoming fasting days from today
   */
  getUpcomingFastingDays(limit: number = 10): FastingDay[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const fastingDays: FastingDay[] = [];
    const currentDate = new Date(today);
    
    // Look ahead up to 60 days
    for (let i = 0; i < 60 && fastingDays.length < limit; i++) {
      const hijriDate = hijriDateService.toHijri(currentDate);
      const fastingDay = this.isFastingDay(hijriDate, new Date(currentDate));
      
      if (fastingDay) {
        fastingDays.push(fastingDay);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return fastingDays;
  }

  /**
   * Check if a day is a White Day (13th, 14th, or 15th)
   */
  isWhiteDay(day: number): boolean {
    return WHITE_DAYS.includes(day);
  }

  /**
   * Check if a Gregorian date is Monday or Thursday
   */
  isSunnahFastingDay(gregorianDate: Date): boolean {
    const dayOfWeek = gregorianDate.getDay();
    return dayOfWeek === 1 || dayOfWeek === 4; // Monday or Thursday
  }

  /**
   * Check if today is a fasting day
   */
  isTodayFastingDay(): FastingDay | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hijriDate = hijriDateService.toHijri(today);
    return this.isFastingDay(hijriDate, today);
  }

  /**
   * Get fasting day label in Arabic
   */
  getFastingLabelArabic(type: FastingDay['type']): string {
    return FASTING_LABELS[type]?.ar || '';
  }

  /**
   * Get fasting day description
   */
  getFastingDescription(type: FastingDay['type']): string {
    const descriptions: Record<FastingDay['type'], string> = {
      monday: 'Sunnah fasting on Monday, as practiced by the Prophet ﷺ',
      thursday: 'Sunnah fasting on Thursday, as practiced by the Prophet ﷺ',
      white_day: 'Fasting the White Days (Ayyam al-Beed) when the moon is full',
      ashura: 'Fasting on Ashura expiates sins of the previous year',
      arafah: 'Fasting on Arafah expiates sins of the previous and coming year',
      shawwal: 'Fasting 6 days of Shawwal after Ramadan equals fasting the whole year',
    };
    return descriptions[type] || '';
  }

  /**
   * Get priority of fasting day (higher = more important)
   */
  getFastingPriority(type: FastingDay['type']): number {
    const priorities: Record<FastingDay['type'], number> = {
      arafah: 5,
      ashura: 4,
      shawwal: 3,
      white_day: 2,
      monday: 1,
      thursday: 1,
    };
    return priorities[type] || 0;
  }

  /**
   * Check if fasting is prohibited on a date
   * (Eid days, Tashreeq days)
   */
  isFastingProhibited(hijriDate: HijriDate): boolean {
    // Eid al-Fitr (1st Shawwal)
    if (hijriDate.month === 10 && hijriDate.day === 1) return true;
    
    // Eid al-Adha and Tashreeq days (10th-13th Dhul Hijjah)
    if (hijriDate.month === 12 && hijriDate.day >= 10 && hijriDate.day <= 13) return true;
    
    return false;
  }
}

// Export singleton instance
export const fastingDayService = new FastingDayService();
