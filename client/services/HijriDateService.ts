/**
 * Hijri Date Service
 * 
 * Implements Hijri (Islamic) calendar calculations.
 * Uses the tabular Islamic calendar algorithm which is widely used
 * and provides consistent results.
 */

import { HijriDate } from '../types/hijri';
import { HIJRI_MONTHS } from '../constants/islamic-calendar';

// Hijri epoch in Julian Day Number (July 16, 622 CE Julian / July 19, 622 CE Gregorian)
const HIJRI_EPOCH = 1948439.5;

/**
 * Convert Gregorian date to Julian Day Number
 */
function gregorianToJD(year: number, month: number, day: number): number {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  
  return Math.floor(365.25 * (year + 4716)) + 
         Math.floor(30.6001 * (month + 1)) + 
         day + B - 1524.5;
}

/**
 * Convert Julian Day Number to Gregorian date
 */
function jdToGregorian(jd: number): { year: number; month: number; day: number } {
  const Z = Math.floor(jd + 0.5);
  const F = jd + 0.5 - Z;
  
  let A: number;
  if (Z < 2299161) {
    A = Z;
  } else {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  
  const day = B - D - Math.floor(30.6001 * E) + F;
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  
  return { year, month, day: Math.floor(day) };
}

/**
 * Check if a Hijri year is a leap year (30-year cycle)
 * Leap years: 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29
 */
function isHijriLeapYear(year: number): boolean {
  return ((11 * year + 14) % 30) < 11;
}

/**
 * Get the number of days in a Hijri year
 */
function daysInHijriYear(year: number): number {
  return isHijriLeapYear(year) ? 355 : 354;
}

/**
 * Get the number of days in a Hijri month
 */
function daysInHijriMonth(month: number, year: number): number {
  // Odd months have 30 days, even months have 29 days
  // Exception: month 12 has 30 days in leap years
  if (month === 12 && isHijriLeapYear(year)) {
    return 30;
  }
  return month % 2 === 1 ? 30 : 29;
}

/**
 * Convert Hijri date to Julian Day Number
 */
function hijriToJD(year: number, month: number, day: number): number {
  return day +
         Math.ceil(29.5 * (month - 1)) +
         (year - 1) * 354 +
         Math.floor((3 + 11 * year) / 30) +
         HIJRI_EPOCH - 1;
}

/**
 * Convert Julian Day Number to Hijri date
 */
function jdToHijri(jd: number): { year: number; month: number; day: number } {
  const jd_floor = Math.floor(jd) + 0.5;
  
  let year = Math.floor((30 * (jd_floor - HIJRI_EPOCH) + 10646) / 10631);
  
  let month = Math.min(12, Math.ceil((jd_floor - (29 + hijriToJD(year, 1, 1))) / 29.5) + 1);
  
  // Adjust month if needed
  while (month > 0 && jd_floor < hijriToJD(year, month, 1)) {
    month--;
  }
  if (month === 0) {
    year--;
    month = 12;
  }
  
  const day = Math.floor(jd_floor - hijriToJD(year, month, 1)) + 1;
  
  return { year, month, day };
}

export class HijriDateService {
  /**
   * Convert Gregorian date to Hijri date
   */
  toHijri(date: Date): HijriDate {
    const jd = gregorianToJD(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const hijri = jdToHijri(jd);
    
    return {
      day: hijri.day,
      month: hijri.month,
      year: hijri.year,
      monthNameAr: HIJRI_MONTHS.ar[hijri.month - 1] || '',
      monthNameEn: HIJRI_MONTHS.en[hijri.month - 1] || '',
    };
  }

  /**
   * Convert Hijri date to Gregorian date
   */
  toGregorian(hijriDate: HijriDate): Date {
    const jd = hijriToJD(hijriDate.year, hijriDate.month, hijriDate.day);
    const greg = jdToGregorian(jd);
    return new Date(greg.year, greg.month - 1, greg.day);
  }

  /**
   * Get current Hijri date
   * Optionally considers Maghrib time for day transition
   */
  getCurrentHijriDate(maghribTime?: Date): HijriDate {
    const now = new Date();
    
    // If Maghrib time is provided and current time is after Maghrib,
    // use tomorrow's date for Hijri calculation (Islamic day starts at sunset)
    if (maghribTime && now >= maghribTime) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return this.toHijri(tomorrow);
    }
    
    return this.toHijri(now);
  }

  /**
   * Get number of days in a Hijri month
   */
  getDaysInMonth(month: number, year: number): number {
    return daysInHijriMonth(month, year);
  }

  /**
   * Format Hijri date as string
   */
  formatHijriDate(date: HijriDate, format: 'short' | 'long' = 'long'): string {
    if (format === 'short') {
      return `${date.day} ${date.monthNameEn} ${date.year}`;
    }
    return `${date.day} ${date.monthNameEn} ${date.year} AH`;
  }

  /**
   * Format Hijri date in Arabic
   */
  formatHijriDateArabic(date: HijriDate): string {
    return `${date.day} ${date.monthNameAr} ${date.year} هـ`;
  }

  /**
   * Get month name
   */
  getMonthName(month: number, lang: 'ar' | 'en' = 'en'): string {
    return HIJRI_MONTHS[lang][month - 1] || '';
  }

  /**
   * Check if Hijri year is a leap year
   */
  isLeapYear(year: number): boolean {
    return isHijriLeapYear(year);
  }

  /**
   * Get days between two Hijri dates
   */
  daysBetween(date1: HijriDate, date2: HijriDate): number {
    const jd1 = hijriToJD(date1.year, date1.month, date1.day);
    const jd2 = hijriToJD(date2.year, date2.month, date2.day);
    return Math.round(jd2 - jd1);
  }

  /**
   * Add days to a Hijri date
   */
  addDays(date: HijriDate, days: number): HijriDate {
    const jd = hijriToJD(date.year, date.month, date.day) + days;
    const hijri = jdToHijri(jd);
    return {
      day: hijri.day,
      month: hijri.month,
      year: hijri.year,
      monthNameAr: HIJRI_MONTHS.ar[hijri.month - 1] || '',
      monthNameEn: HIJRI_MONTHS.en[hijri.month - 1] || '',
    };
  }

  /**
   * Get all days in a Hijri month
   */
  getMonthDays(month: number, year: number): HijriDate[] {
    const daysInMonth = this.getDaysInMonth(month, year);
    const days: HijriDate[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        month,
        year,
        monthNameAr: HIJRI_MONTHS.ar[month - 1] || '',
        monthNameEn: HIJRI_MONTHS.en[month - 1] || '',
      });
    }
    
    return days;
  }

  /**
   * Compare two Hijri dates
   * Returns -1 if date1 < date2, 0 if equal, 1 if date1 > date2
   */
  compare(date1: HijriDate, date2: HijriDate): number {
    if (date1.year !== date2.year) return date1.year < date2.year ? -1 : 1;
    if (date1.month !== date2.month) return date1.month < date2.month ? -1 : 1;
    if (date1.day !== date2.day) return date1.day < date2.day ? -1 : 1;
    return 0;
  }

  /**
   * Check if two Hijri dates are equal
   */
  isEqual(date1: HijriDate, date2: HijriDate): boolean {
    return date1.year === date2.year && date1.month === date2.month && date1.day === date2.day;
  }
}

// Export singleton instance
export const hijriDateService = new HijriDateService();
