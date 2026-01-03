# Implementation Plan: Hijri Calendar Integration

## Overview

This plan implements a complete Hijri calendar system with Islamic events, fasting day tracking, and moon phase display.

## Tasks

- [x] 1. Create types and constants
  - Create `client/types/hijri.ts` with HijriDate, IslamicEvent, FastingDay, MoonPhase interfaces
  - Create `client/constants/islamic-calendar.ts` with month names, events data
  - _Requirements: 1.1, 2.1, 2.5_

- [x] 2. Implement HijriDateService
  - [x] 2.1 Create `client/services/HijriDateService.ts`
    - Implement Gregorian to Hijri conversion (Umm al-Qura algorithm)
    - Implement Hijri to Gregorian conversion
    - Implement getCurrentHijriDate with Maghrib transition support
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 2.2 Write property tests for HijriDateService
    - Test round-trip conversion (Gregorian → Hijri → Gregorian)
    - Test known date conversions
    - Test month boundary handling
    - _Requirements: 1.1_

- [x] 3. Implement MoonPhaseService
  - [x] 3.1 Create `client/services/MoonPhaseService.ts`
    - Implement moon phase calculation based on lunar cycle
    - Calculate illumination percentage
    - Map day of month to phase
    - _Requirements: 4.1, 4.2, 4.4_
  
  - [x] 3.2 Write property tests for MoonPhaseService
    - Test phase progression through month
    - Test illumination calculation
    - _Requirements: 4.1_

- [x] 4. Implement IslamicEventsService
  - [x] 4.1 Create `client/services/IslamicEventsService.ts`
    - Implement getEventsForMonth
    - Implement getUpcomingEvents
    - Implement getNextMajorEvent with countdown
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2_
  
  - [x] 4.2 Write tests for IslamicEventsService
    - Test event retrieval for specific months
    - Test countdown calculation
    - _Requirements: 2.1, 3.1_

- [x] 5. Implement FastingDayService
  - [x] 5.1 Create `client/services/FastingDayService.ts`
    - Implement isFastingDay (checks all fasting types)
    - Implement getFastingDaysForMonth
    - Implement isWhiteDay, isSunnahFastingDay helpers
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 5.2 Write tests for FastingDayService
    - Test White Day detection (13, 14, 15)
    - Test Monday/Thursday detection
    - Test special fasting days (Ashura, Arafah)
    - _Requirements: 5.1, 5.2_

- [x] 6. Create React hooks
  - [x] 6.1 Create `client/hooks/useHijriDate.ts`
    - Return current Hijri date, Gregorian date, moon phase
    - Auto-update at midnight/Maghrib
    - _Requirements: 1.1, 1.4, 1.5_
  
  - [x] 6.2 Create `client/hooks/useIslamicEvents.ts`
    - Return upcoming events, next major event, events this month
    - _Requirements: 2.2, 2.3, 3.1, 3.2_
  
  - [x] 6.3 Create `client/hooks/useFastingDays.ts`
    - Return today's fasting status, upcoming fasting days
    - _Requirements: 5.1, 5.2, 5.7_

- [x] 7. Create UI components
  - [x] 7.1 Create `client/components/MoonPhaseIndicator.tsx`
    - Display moon icon based on phase
    - Show illumination percentage
    - Support multiple sizes
    - _Requirements: 4.1, 4.4_
  
  - [x] 7.2 Create `client/components/HijriDateHeader.tsx`
    - Display Hijri date prominently
    - Show Arabic and English month names
    - Include moon phase indicator
    - Show Gregorian date
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 4.1_
  
  - [x] 7.3 Create `client/components/EventCountdown.tsx`
    - Display event name and days remaining
    - Show "Today" when event arrives
    - _Requirements: 3.1, 3.4_
  
  - [x] 7.4 Create `client/components/FastingDayBadge.tsx`
    - Badge for different fasting day types
    - Color-coded by type
    - _Requirements: 5.7_
  
  - [x] 7.5 Create `client/components/CalendarGrid.tsx`
    - Monthly grid view
    - Highlight current day, events, fasting days
    - Swipe navigation between months
    - Day press handler
    - Legend component
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 7.6 Create `client/components/UpcomingEventsList.tsx`
    - List upcoming events with countdowns
    - Event descriptions
    - _Requirements: 2.3, 2.4, 3.2_

- [x] 8. Create HijriCalendarScreen
  - [x] 8.1 Create `client/screens/HijriCalendarScreen.tsx`
    - Compose all components
    - HijriDateHeader at top
    - EventCountdown for next major event
    - CalendarGrid with month navigation
    - UpcomingEventsList below calendar
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 6.1_
  
  - [x] 8.2 Add navigation to HijriCalendarScreen
    - Add to tab navigator or accessible from home
    - _Requirements: 1.1_

- [x] 9. Add fasting notifications
  - [x] 9.1 Implement fasting day notification scheduling
    - Created `client/services/FastingNotificationService.ts`
    - Created `client/hooks/useFastingNotifications.ts`
    - Created `client/components/FastingNotificationSettings.tsx`
    - Schedule notifications for upcoming fasting days
    - Allow user to enable/disable per fasting type
    - Choose reminder time (evening before or morning of)
    - _Requirements: 5.6_

- [x] 10. Final checkpoint
  - Run all tests (69 tests passing)
  - Test on iOS and Android
  - Verify date accuracy with known Islamic dates

## Dependencies

- Consider using `hijri-converter` npm package for accurate conversions
- Or implement Umm al-Qura algorithm directly for offline support

## Notes

- Islamic day starts at Maghrib (sunset), consider this for date transitions
- Moon phase is approximate based on lunar cycle calculation
- Events are based on fixed Hijri dates (actual sighting may vary by region)
