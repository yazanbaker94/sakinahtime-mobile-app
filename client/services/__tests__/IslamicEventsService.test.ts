import { describe, it, expect } from 'vitest';
import { IslamicEventsService } from '../IslamicEventsService';

const service = new IslamicEventsService();

/**
 * Tests for IslamicEventsService
 * 
 * Feature: hijri-calendar
 * These tests verify the Islamic events functionality.
 */

describe('IslamicEventsService', () => {
  describe('getEventsForMonth', () => {
    it('should return events for Ramadan (month 9)', () => {
      const events = service.getEventsForMonth(9, 1446);
      expect(events.length).toBeGreaterThan(0);
      
      // Should include Ramadan start and Laylat al-Qadr
      const eventIds = events.map(e => e.id);
      expect(eventIds).toContain('ramadan_start');
      expect(eventIds).toContain('laylat_qadr');
    });

    it('should return events for Muharram (month 1)', () => {
      const events = service.getEventsForMonth(1, 1446);
      expect(events.length).toBeGreaterThan(0);
      
      // Should include Islamic New Year and Ashura
      const eventIds = events.map(e => e.id);
      expect(eventIds).toContain('new_year');
      expect(eventIds).toContain('ashura');
    });

    it('should return events for Dhul Hijjah (month 12)', () => {
      const events = service.getEventsForMonth(12, 1446);
      expect(events.length).toBeGreaterThan(0);
      
      // Should include Arafah and Eid al-Adha
      const eventIds = events.map(e => e.id);
      expect(eventIds).toContain('arafah');
      expect(eventIds).toContain('eid_adha');
    });

    it('should return empty array for months with no events', () => {
      // Month 2 (Safar) typically has no major events
      const events = service.getEventsForMonth(2, 1446);
      expect(events).toEqual([]);
    });

    it('should include Gregorian date for each event', () => {
      const events = service.getEventsForMonth(9, 1446);
      events.forEach(event => {
        expect(event.gregorianDate).toBeInstanceOf(Date);
        expect(event.hijriDate).toBeDefined();
        expect(event.hijriDate.month).toBe(9);
      });
    });
  });

  describe('getUpcomingEvents', () => {
    it('should return upcoming events sorted by date', () => {
      const events = service.getUpcomingEvents(5);
      expect(events.length).toBeLessThanOrEqual(5);
      
      // Should be sorted by daysUntil
      for (let i = 1; i < events.length; i++) {
        expect(events[i].daysUntil).toBeGreaterThanOrEqual(events[i - 1].daysUntil);
      }
    });

    it('should only return future events', () => {
      const events = service.getUpcomingEvents(10);
      events.forEach(event => {
        expect(event.daysUntil).toBeGreaterThanOrEqual(0);
      });
    });

    it('should respect the limit parameter', () => {
      const events3 = service.getUpcomingEvents(3);
      const events10 = service.getUpcomingEvents(10);
      
      expect(events3.length).toBeLessThanOrEqual(3);
      expect(events10.length).toBeLessThanOrEqual(10);
    });
  });

  describe('getNextMajorEvent', () => {
    it('should return a major event', () => {
      const event = service.getNextMajorEvent();
      expect(event).not.toBeNull();
      if (event) {
        expect(event.type).toBe('major');
      }
    });

    it('should include countdown information', () => {
      const event = service.getNextMajorEvent();
      if (event) {
        expect(event.daysUntil).toBeGreaterThanOrEqual(0);
        expect(event.gregorianDate).toBeInstanceOf(Date);
      }
    });
  });

  describe('isEventDay', () => {
    it('should identify Eid al-Fitr', () => {
      const event = service.isEventDay({
        day: 1,
        month: 10,
        year: 1446,
        monthNameAr: 'شوال',
        monthNameEn: 'Shawwal',
      });
      expect(event).not.toBeNull();
      expect(event?.id).toBe('eid_fitr');
    });

    it('should identify Ashura', () => {
      const event = service.isEventDay({
        day: 10,
        month: 1,
        year: 1446,
        monthNameAr: 'محرم',
        monthNameEn: 'Muharram',
      });
      expect(event).not.toBeNull();
      expect(event?.id).toBe('ashura');
    });

    it('should return null for non-event days', () => {
      const event = service.isEventDay({
        day: 5,
        month: 2,
        year: 1446,
        monthNameAr: 'صفر',
        monthNameEn: 'Safar',
      });
      expect(event).toBeNull();
    });
  });

  describe('getEventById', () => {
    it('should return event by ID', () => {
      const event = service.getEventById('eid_fitr');
      expect(event).not.toBeNull();
      expect(event?.nameEn).toBe('Eid al-Fitr');
    });

    it('should return null for unknown ID', () => {
      const event = service.getEventById('unknown_event');
      expect(event).toBeNull();
    });
  });

  describe('getAllEvents', () => {
    it('should return all events', () => {
      const events = service.getAllEvents();
      expect(events.length).toBeGreaterThan(0);
      
      // Should include major events
      const ids = events.map(e => e.id);
      expect(ids).toContain('eid_fitr');
      expect(ids).toContain('eid_adha');
      expect(ids).toContain('ramadan_start');
    });
  });

  describe('getEventsByType', () => {
    it('should filter by major type', () => {
      const events = service.getEventsByType('major');
      events.forEach(event => {
        expect(event.type).toBe('major');
      });
    });

    it('should filter by fasting type', () => {
      const events = service.getEventsByType('fasting');
      events.forEach(event => {
        expect(event.type).toBe('fasting');
      });
      
      // Should include Ashura and Arafah
      const ids = events.map(e => e.id);
      expect(ids).toContain('ashura');
      expect(ids).toContain('arafah');
    });
  });

  describe('getCountdownText', () => {
    it('should return "Today" for 0 days', () => {
      expect(service.getCountdownText(0)).toBe('Today');
    });

    it('should return "Tomorrow" for 1 day', () => {
      expect(service.getCountdownText(1)).toBe('Tomorrow');
    });

    it('should return days for less than a week', () => {
      expect(service.getCountdownText(5)).toBe('In 5 days');
    });

    it('should return weeks for less than a month', () => {
      expect(service.getCountdownText(14)).toBe('In 2 weeks');
    });

    it('should return months for longer periods', () => {
      expect(service.getCountdownText(60)).toBe('In 2 months');
    });
  });

  describe('getCountdownTextArabic', () => {
    it('should return Arabic text for today', () => {
      expect(service.getCountdownTextArabic(0)).toBe('اليوم');
    });

    it('should return Arabic text for tomorrow', () => {
      expect(service.getCountdownTextArabic(1)).toBe('غداً');
    });

    it('should return Arabic text for 2 days', () => {
      expect(service.getCountdownTextArabic(2)).toBe('بعد يومين');
    });
  });
});
