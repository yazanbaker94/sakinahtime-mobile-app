import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { MoonPhaseService } from '../MoonPhaseService';

const service = new MoonPhaseService();

/**
 * Property-Based Tests for MoonPhaseService
 * 
 * Feature: hijri-calendar
 * These tests verify the correctness properties for moon phase calculations.
 */

describe('MoonPhaseService', () => {
  /**
   * Property 1: Illumination bounds
   * 
   * For any date, the moon illumination should be between 0% and 100%.
   * 
   * **Validates: Requirements 4.4**
   */
  describe('Property 1: Illumination bounds', () => {
    it('should return illumination between 0 and 100 for all dates', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date(1900, 0, 1), max: new Date(2100, 11, 31) })
            .filter(d => !isNaN(d.getTime())),
          (date) => {
            const phase = service.getPhaseForDate(date);
            expect(phase.illumination).toBeGreaterThanOrEqual(0);
            expect(phase.illumination).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Day of month bounds
   * 
   * For any date, the day of lunar month should be between 1 and 30.
   * 
   * **Validates: Requirements 4.2**
   */
  describe('Property 2: Day of month bounds', () => {
    it('should return day of month between 1 and 30 for all dates', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date(1900, 0, 1), max: new Date(2100, 11, 31) }),
          (date) => {
            const phase = service.getPhaseForDate(date);
            expect(phase.dayOfMonth).toBeGreaterThanOrEqual(1);
            expect(phase.dayOfMonth).toBeLessThanOrEqual(30);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Phase validity
   * 
   * For any date, the phase should be one of the 8 valid phases.
   * 
   * **Validates: Requirements 4.1**
   */
  describe('Property 3: Phase validity', () => {
    it('should return a valid phase for all dates', () => {
      const validPhases = [
        'new', 'waxing_crescent', 'first_quarter', 'waxing_gibbous',
        'full', 'waning_gibbous', 'last_quarter', 'waning_crescent'
      ];
      
      fc.assert(
        fc.property(
          fc.date({ min: new Date(1900, 0, 1), max: new Date(2100, 11, 31) }),
          (date) => {
            const phase = service.getPhaseForDate(date);
            expect(validPhases).toContain(phase.phase);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Icon consistency
   * 
   * For any date, the icon should match the phase.
   * 
   * **Validates: Requirements 4.1**
   */
  describe('Property 4: Icon consistency', () => {
    it('should return consistent icon for phase', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date(1900, 0, 1), max: new Date(2100, 11, 31) }),
          (date) => {
            const phase = service.getPhaseForDate(date);
            const expectedIcon = service.getMoonIcon(phase.phase);
            expect(phase.icon).toBe(expectedIcon);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Phase progression
   * 
   * Adding ~7.4 days should advance the phase by approximately one step.
   * 
   * **Validates: Requirements 4.1**
   */
  describe('Property 5: Phase progression', () => {
    it('should progress through phases over lunar cycle', () => {
      const startDate = new Date(2025, 0, 1);
      const phases: string[] = [];
      
      // Sample phases over a full lunar cycle (~30 days)
      for (let i = 0; i < 30; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const phase = service.getPhaseForDate(date);
        if (phases.length === 0 || phases[phases.length - 1] !== phase.phase) {
          phases.push(phase.phase);
        }
      }
      
      // Should see multiple different phases over a month
      expect(phases.length).toBeGreaterThanOrEqual(4);
    });
  });

  /**
   * Unit tests for specific functionality
   */
  describe('Specific functionality', () => {
    it('should identify White Days correctly', () => {
      expect(service.isWhiteDay(12)).toBe(false);
      expect(service.isWhiteDay(13)).toBe(true);
      expect(service.isWhiteDay(14)).toBe(true);
      expect(service.isWhiteDay(15)).toBe(true);
      expect(service.isWhiteDay(16)).toBe(false);
    });

    it('should return phase names', () => {
      expect(service.getPhaseName('new')).toBe('New Moon');
      expect(service.getPhaseName('full')).toBe('Full Moon');
      expect(service.getPhaseName('first_quarter')).toBe('First Quarter');
    });

    it('should return Arabic phase names', () => {
      expect(service.getPhaseNameArabic('new')).toBe('محاق');
      expect(service.getPhaseNameArabic('full')).toBe('بدر');
    });

    it('should get current phase without error', () => {
      const phase = service.getCurrentPhase();
      expect(phase).toBeDefined();
      expect(phase.phase).toBeDefined();
      expect(phase.illumination).toBeDefined();
      expect(phase.dayOfMonth).toBeDefined();
      expect(phase.icon).toBeDefined();
    });

    it('should calculate next full moon', () => {
      const nextFull = service.getNextFullMoon(new Date(2025, 0, 1));
      expect(nextFull).toBeInstanceOf(Date);
      expect(nextFull.getTime()).toBeGreaterThan(new Date(2025, 0, 1).getTime());
    });

    it('should calculate next new moon', () => {
      const nextNew = service.getNextNewMoon(new Date(2025, 0, 1));
      expect(nextNew).toBeInstanceOf(Date);
      expect(nextNew.getTime()).toBeGreaterThan(new Date(2025, 0, 1).getTime());
    });
  });
});
