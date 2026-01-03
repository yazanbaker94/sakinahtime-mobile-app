/**
 * Moon Phase Service
 * 
 * Calculates moon phases based on the lunar cycle.
 * The lunar month is approximately 29.53 days.
 */

import { MoonPhase, MoonPhaseName } from '../types/hijri';
import { MOON_ICONS } from '../constants/islamic-calendar';

// Average lunar cycle in days
const LUNAR_CYCLE = 29.530588853;

// Known new moon date (reference point)
// January 6, 2000 at 18:14 UTC was a new moon
const KNOWN_NEW_MOON = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));

/**
 * Calculate the moon age (days since last new moon) for a given date
 */
function getMoonAge(date: Date): number {
  const diffMs = date.getTime() - KNOWN_NEW_MOON.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  // Get the fractional part of the lunar cycle
  let age = diffDays % LUNAR_CYCLE;
  if (age < 0) age += LUNAR_CYCLE;
  
  return age;
}

/**
 * Get moon phase name based on moon age
 */
function getPhaseFromAge(age: number): MoonPhaseName {
  // Divide the lunar cycle into 8 phases
  const phaseLength = LUNAR_CYCLE / 8;
  
  if (age < phaseLength * 0.5) return 'new';
  if (age < phaseLength * 1.5) return 'waxing_crescent';
  if (age < phaseLength * 2.5) return 'first_quarter';
  if (age < phaseLength * 3.5) return 'waxing_gibbous';
  if (age < phaseLength * 4.5) return 'full';
  if (age < phaseLength * 5.5) return 'waning_gibbous';
  if (age < phaseLength * 6.5) return 'last_quarter';
  if (age < phaseLength * 7.5) return 'waning_crescent';
  return 'new';
}

/**
 * Calculate illumination percentage based on moon age
 * 0% at new moon, 100% at full moon
 */
function getIllumination(age: number): number {
  // Use cosine function to model illumination
  // At new moon (age=0), illumination is 0%
  // At full moon (age=LUNAR_CYCLE/2), illumination is 100%
  const phase = (age / LUNAR_CYCLE) * 2 * Math.PI;
  const illumination = (1 - Math.cos(phase)) / 2 * 100;
  return Math.round(illumination);
}

export class MoonPhaseService {
  /**
   * Get current moon phase
   */
  getCurrentPhase(): MoonPhase {
    return this.getPhaseForDate(new Date());
  }

  /**
   * Get moon phase for a specific date
   */
  getPhaseForDate(date: Date): MoonPhase {
    const age = getMoonAge(date);
    const phase = getPhaseFromAge(age);
    const illumination = getIllumination(age);
    const dayOfMonth = Math.floor(age) + 1;
    
    return {
      phase,
      illumination,
      dayOfMonth,
      icon: MOON_ICONS[phase] || '🌑',
    };
  }

  /**
   * Get moon icon for a phase
   */
  getMoonIcon(phase: MoonPhaseName): string {
    return MOON_ICONS[phase] || '🌑';
  }

  /**
   * Get phase name in human-readable format
   */
  getPhaseName(phase: MoonPhaseName): string {
    const names: Record<MoonPhaseName, string> = {
      new: 'New Moon',
      waxing_crescent: 'Waxing Crescent',
      first_quarter: 'First Quarter',
      waxing_gibbous: 'Waxing Gibbous',
      full: 'Full Moon',
      waning_gibbous: 'Waning Gibbous',
      last_quarter: 'Last Quarter',
      waning_crescent: 'Waning Crescent',
    };
    return names[phase];
  }

  /**
   * Get Arabic phase name
   */
  getPhaseNameArabic(phase: MoonPhaseName): string {
    const names: Record<MoonPhaseName, string> = {
      new: 'محاق',
      waxing_crescent: 'هلال متزايد',
      first_quarter: 'تربيع أول',
      waxing_gibbous: 'أحدب متزايد',
      full: 'بدر',
      waning_gibbous: 'أحدب متناقص',
      last_quarter: 'تربيع ثاني',
      waning_crescent: 'هلال متناقص',
    };
    return names[phase];
  }

  /**
   * Check if it's a White Day (13th, 14th, or 15th of lunar month)
   * These are the days around the full moon when fasting is recommended
   */
  isWhiteDay(dayOfMonth: number): boolean {
    return dayOfMonth >= 13 && dayOfMonth <= 15;
  }

  /**
   * Get the next full moon date from a given date
   */
  getNextFullMoon(fromDate: Date = new Date()): Date {
    const age = getMoonAge(fromDate);
    const daysToFull = (LUNAR_CYCLE / 2) - age;
    const adjustedDays = daysToFull < 0 ? daysToFull + LUNAR_CYCLE : daysToFull;
    
    const fullMoonDate = new Date(fromDate);
    fullMoonDate.setDate(fullMoonDate.getDate() + Math.round(adjustedDays));
    return fullMoonDate;
  }

  /**
   * Get the next new moon date from a given date
   */
  getNextNewMoon(fromDate: Date = new Date()): Date {
    const age = getMoonAge(fromDate);
    const daysToNew = LUNAR_CYCLE - age;
    
    const newMoonDate = new Date(fromDate);
    newMoonDate.setDate(newMoonDate.getDate() + Math.round(daysToNew));
    return newMoonDate;
  }

  /**
   * Get moon age in days
   */
  getMoonAge(date: Date = new Date()): number {
    return getMoonAge(date);
  }
}

// Export singleton instance
export const moonPhaseService = new MoonPhaseService();
