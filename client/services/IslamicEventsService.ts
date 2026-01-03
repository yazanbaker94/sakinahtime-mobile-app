/**
 * Islamic Events Service
 * 
 * Manages Islamic events and calculates upcoming events.
 */

import { IslamicEvent, HijriDate } from '../types/hijri';
import { ISLAMIC_EVENTS } from '../constants/islamic-calendar';
import { hijriDateService } from './HijriDateService';

export interface EventWithDate extends IslamicEvent {
  hijriDate: HijriDate;
  gregorianDate: Date;
  daysUntil: number;
}

export class IslamicEventsService {
  /**
   * Get all events for a specific Hijri month
   */
  getEventsForMonth(month: number, year: number): EventWithDate[] {
    const events = ISLAMIC_EVENTS.filter(event => event.month === month);
    
    return events.map(event => {
      const hijriDate: HijriDate = {
        day: event.day,
        month: event.month,
        year,
        monthNameAr: hijriDateService.getMonthName(event.month, 'ar'),
        monthNameEn: hijriDateService.getMonthName(event.month, 'en'),
      };
      
      const gregorianDate = hijriDateService.toGregorian(hijriDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((gregorianDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        ...event,
        hijriDate,
        gregorianDate,
        daysUntil,
      };
    });
  }

  /**
   * Get upcoming events from today
   */
  getUpcomingEvents(limit: number = 10): EventWithDate[] {
    const today = hijriDateService.getCurrentHijriDate();
    const events: EventWithDate[] = [];
    
    // Check current year and next year
    for (let yearOffset = 0; yearOffset <= 1 && events.length < limit; yearOffset++) {
      const year = today.year + yearOffset;
      
      for (const event of ISLAMIC_EVENTS) {
        const hijriDate: HijriDate = {
          day: event.day,
          month: event.month,
          year,
          monthNameAr: hijriDateService.getMonthName(event.month, 'ar'),
          monthNameEn: hijriDateService.getMonthName(event.month, 'en'),
        };
        
        const gregorianDate = hijriDateService.toGregorian(hijriDate);
        const todayGregorian = new Date();
        todayGregorian.setHours(0, 0, 0, 0);
        
        const daysUntil = Math.ceil((gregorianDate.getTime() - todayGregorian.getTime()) / (1000 * 60 * 60 * 24));
        
        // Only include future events or today's events
        if (daysUntil >= 0) {
          events.push({
            ...event,
            hijriDate,
            gregorianDate,
            daysUntil,
          });
        }
      }
    }
    
    // Sort by days until and limit
    return events
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, limit);
  }

  /**
   * Get the next major event
   */
  getNextMajorEvent(): EventWithDate | null {
    const upcoming = this.getUpcomingEvents(20);
    const majorEvent = upcoming.find(e => e.type === 'major');
    return majorEvent || null;
  }

  /**
   * Get the next event of any type
   */
  getNextEvent(): EventWithDate | null {
    const upcoming = this.getUpcomingEvents(1);
    return upcoming[0] || null;
  }

  /**
   * Check if a specific Hijri date is an event day
   */
  isEventDay(date: HijriDate): IslamicEvent | null {
    const event = ISLAMIC_EVENTS.find(e => e.month === date.month && e.day === date.day);
    return event || null;
  }

  /**
   * Get event by ID
   */
  getEventById(id: string): IslamicEvent | null {
    return ISLAMIC_EVENTS.find(e => e.id === id) || null;
  }

  /**
   * Get all events
   */
  getAllEvents(): IslamicEvent[] {
    return [...ISLAMIC_EVENTS];
  }

  /**
   * Get events by type
   */
  getEventsByType(type: 'major' | 'minor' | 'fasting'): IslamicEvent[] {
    return ISLAMIC_EVENTS.filter(e => e.type === type);
  }

  /**
   * Check if today is an event day
   */
  isTodayEvent(): EventWithDate | null {
    const today = hijriDateService.getCurrentHijriDate();
    const event = this.isEventDay(today);
    
    if (event) {
      const gregorianDate = hijriDateService.toGregorian(today);
      return {
        ...event,
        hijriDate: today,
        gregorianDate,
        daysUntil: 0,
      };
    }
    
    return null;
  }

  /**
   * Get countdown text for an event
   */
  getCountdownText(daysUntil: number): string {
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil < 7) return `In ${daysUntil} days`;
    if (daysUntil < 30) {
      const weeks = Math.floor(daysUntil / 7);
      return `In ${weeks} week${weeks > 1 ? 's' : ''}`;
    }
    const months = Math.floor(daysUntil / 30);
    return `In ${months} month${months > 1 ? 's' : ''}`;
  }

  /**
   * Get Arabic countdown text
   */
  getCountdownTextArabic(daysUntil: number): string {
    if (daysUntil === 0) return 'اليوم';
    if (daysUntil === 1) return 'غداً';
    if (daysUntil === 2) return 'بعد يومين';
    if (daysUntil < 11) return `بعد ${daysUntil} أيام`;
    return `بعد ${daysUntil} يوماً`;
  }
}

// Export singleton instance
export const islamicEventsService = new IslamicEventsService();
