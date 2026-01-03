/**
 * Hijri Calendar Types
 */

export interface HijriDate {
  day: number;        // 1-30
  month: number;      // 1-12
  year: number;       // e.g., 1446
  monthNameAr: string;
  monthNameEn: string;
}

export interface IslamicEvent {
  id: string;
  nameEn: string;
  nameAr: string;
  month: number;      // Hijri month (1-12)
  day: number;        // Hijri day
  duration?: number;  // Days (e.g., Ramadan = 29/30)
  type: 'major' | 'minor' | 'fasting';
  description: string;
  color: string;
}

export interface FastingDay {
  type: 'monday' | 'thursday' | 'white_day' | 'ashura' | 'arafah' | 'shawwal';
  hijriDate: HijriDate;
  gregorianDate: Date;
  label: string;
}

export type MoonPhaseName = 
  | 'new' 
  | 'waxing_crescent' 
  | 'first_quarter' 
  | 'waxing_gibbous' 
  | 'full' 
  | 'waning_gibbous' 
  | 'last_quarter' 
  | 'waning_crescent';

export interface MoonPhase {
  phase: MoonPhaseName;
  illumination: number;  // 0-100%
  dayOfMonth: number;
  icon: string;
}

export interface CalendarDay {
  hijriDate: HijriDate;
  gregorianDate: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  event?: IslamicEvent;
  fastingDay?: FastingDay;
  moonPhase?: MoonPhase;
}
