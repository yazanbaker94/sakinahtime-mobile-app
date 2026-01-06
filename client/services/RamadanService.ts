/**
 * Ramadan Service
 * 
 * Core service for Ramadan detection, calculations, and data management.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { hijriDateService } from './HijriDateService';
import { RamadanState } from '../types/ramadan';
import { RAMADAN_STORAGE_KEYS, RAMADAN_DAYS, LAYLATUL_QADR_NIGHTS } from '../constants/ramadan';

const RAMADAN_MONTH = 9; // Ramadan is the 9th month in Hijri calendar

export interface RamadanDates {
  startDate: Date;
  endDate: Date;
  hijriYear: number;
}

export interface RamadanExportData {
  year: number;
  quranSchedule: unknown;
  taraweehEntries: unknown;
  charityEntries: unknown;
  charityGoal: unknown;
  ibaadahChecklist: unknown;
}

class RamadanService {
  /**
   * Check if current date is in Ramadan
   */
  isRamadan(): boolean {
    const hijriDate = hijriDateService.getCurrentHijriDate();
    return hijriDate.month === RAMADAN_MONTH;
  }

  /**
   * Get current Ramadan day (1-30)
   * Returns null if not Ramadan
   */
  getCurrentRamadanDay(): number | null {
    if (!this.isRamadan()) return null;
    const hijriDate = hijriDateService.getCurrentHijriDate();
    return hijriDate.day;
  }

  /**
   * Get days remaining until Eid al-Fitr
   * Returns null if not Ramadan
   */
  getDaysRemaining(): number | null {
    const currentDay = this.getCurrentRamadanDay();
    if (currentDay === null) return null;
    return RAMADAN_DAYS - currentDay;
  }

  /**
   * Check if currently in the last 10 nights of Ramadan
   */
  isLastTenNights(): boolean {
    const currentDay = this.getCurrentRamadanDay();
    if (currentDay === null) return false;
    return currentDay >= 21;
  }

  /**
   * Check if current night is an odd night (potential Laylatul Qadr)
   */
  isOddNight(): boolean {
    const currentDay = this.getCurrentRamadanDay();
    if (currentDay === null) return false;
    return LAYLATUL_QADR_NIGHTS.includes(currentDay);
  }

  /**
   * Get days until the last 10 nights begin
   * Returns 0 if already in last 10 nights, null if not Ramadan
   */
  getDaysUntilLastTenNights(): number | null {
    const currentDay = this.getCurrentRamadanDay();
    if (currentDay === null) return null;
    if (currentDay >= 21) return 0;
    return 21 - currentDay;
  }

  /**
   * Get current Hijri year
   */
  getCurrentHijriYear(): number {
    const hijriDate = hijriDateService.getCurrentHijriDate();
    return hijriDate.year;
  }

  /**
   * Get Ramadan dates for a specific Hijri year
   */
  getRamadanDates(hijriYear?: number): RamadanDates {
    const year = hijriYear || this.getCurrentHijriYear();
    
    const startHijri = {
      day: 1,
      month: RAMADAN_MONTH,
      year,
      monthNameAr: 'رمضان',
      monthNameEn: 'Ramadan',
    };
    
    const endHijri = {
      day: 30,
      month: RAMADAN_MONTH,
      year,
      monthNameAr: 'رمضان',
      monthNameEn: 'Ramadan',
    };
    
    return {
      startDate: hijriDateService.toGregorian(startHijri),
      endDate: hijriDateService.toGregorian(endHijri),
      hijriYear: year,
    };
  }

  /**
   * Get complete Ramadan state
   */
  getRamadanState(): RamadanState {
    const isRamadan = this.isRamadan();
    const currentDay = this.getCurrentRamadanDay();
    const daysRemaining = this.getDaysRemaining();
    const isLastTenNights = this.isLastTenNights();
    
    let ramadanYear: number | null = null;
    let ramadanStartDate: Date | null = null;
    let ramadanEndDate: Date | null = null;
    
    if (isRamadan) {
      const dates = this.getRamadanDates();
      ramadanYear = dates.hijriYear;
      ramadanStartDate = dates.startDate;
      ramadanEndDate = dates.endDate;
    }
    
    return {
      isRamadan,
      currentDay,
      daysRemaining,
      isLastTenNights,
      ramadanYear,
      ramadanStartDate,
      ramadanEndDate,
    };
  }

  /**
   * Get year-specific storage key
   */
  getStorageKey(keyFn: (year: number) => string, year?: number): string {
    const targetYear = year || this.getCurrentHijriYear();
    return keyFn(targetYear);
  }

  /**
   * Clear all Ramadan data for a specific year
   */
  async clearRamadanData(year: number): Promise<void> {
    const keys = [
      RAMADAN_STORAGE_KEYS.SETTINGS(year),
      RAMADAN_STORAGE_KEYS.QURAN_SCHEDULE(year),
      RAMADAN_STORAGE_KEYS.TARAWEEH_ENTRIES(year),
      RAMADAN_STORAGE_KEYS.CHARITY_ENTRIES(year),
      RAMADAN_STORAGE_KEYS.CHARITY_GOAL(year),
      RAMADAN_STORAGE_KEYS.IBAADAH_CHECKLIST(year),
    ];
    
    await AsyncStorage.multiRemove(keys);
  }

  /**
   * Export all Ramadan data for a specific year
   */
  async exportRamadanData(year: number): Promise<RamadanExportData> {
    const [
      quranSchedule,
      taraweehEntries,
      charityEntries,
      charityGoal,
      ibaadahChecklist,
    ] = await AsyncStorage.multiGet([
      RAMADAN_STORAGE_KEYS.QURAN_SCHEDULE(year),
      RAMADAN_STORAGE_KEYS.TARAWEEH_ENTRIES(year),
      RAMADAN_STORAGE_KEYS.CHARITY_ENTRIES(year),
      RAMADAN_STORAGE_KEYS.CHARITY_GOAL(year),
      RAMADAN_STORAGE_KEYS.IBAADAH_CHECKLIST(year),
    ]);
    
    return {
      year,
      quranSchedule: quranSchedule[1] ? JSON.parse(quranSchedule[1]) : null,
      taraweehEntries: taraweehEntries[1] ? JSON.parse(taraweehEntries[1]) : null,
      charityEntries: charityEntries[1] ? JSON.parse(charityEntries[1]) : null,
      charityGoal: charityGoal[1] ? JSON.parse(charityGoal[1]) : null,
      ibaadahChecklist: ibaadahChecklist[1] ? JSON.parse(ibaadahChecklist[1]) : null,
    };
  }

  /**
   * Check if data exists for a specific year
   */
  async hasDataForYear(year: number): Promise<boolean> {
    const key = RAMADAN_STORAGE_KEYS.QURAN_SCHEDULE(year);
    const data = await AsyncStorage.getItem(key);
    return data !== null;
  }

  /**
   * Get list of years with saved Ramadan data
   */
  async getSavedYears(): Promise<number[]> {
    const allKeys = await AsyncStorage.getAllKeys();
    const ramadanKeys = allKeys.filter(key => key.startsWith('@ramadan_'));
    
    const years = new Set<number>();
    ramadanKeys.forEach(key => {
      const match = key.match(/@ramadan_(\d+)_/);
      if (match) {
        years.add(parseInt(match[1], 10));
      }
    });
    
    return Array.from(years).sort((a, b) => b - a);
  }
}

// Export singleton instance
export const ramadanService = new RamadanService();
