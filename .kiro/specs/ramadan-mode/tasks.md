# Implementation Plan: Ramadan Mode

## Overview

This implementation plan breaks down the Ramadan Mode feature into discrete, incremental tasks. Each task builds on previous work, ensuring no orphaned code. The plan follows a bottom-up approach: types → services → hooks → components → screens → integration.

## Tasks

- [x] 1. Create type definitions and constants
  - Create `client/types/ramadan.ts` with all TypeScript interfaces
  - Create `client/constants/ramadan.ts` with storage keys, Juz data, and notification configs
  - Define: `RamadanState`, `SuhoorIftarTimes`, `DayReading`, `TaraweehEntry`, `CharityEntry`, `IbaadahItem`
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 4.1, 6.2, 7.1, 9.4_

- [x] 2. Implement RamadanService
  - [x] 2.1 Create `client/services/RamadanService.ts` with Ramadan detection logic
    - Implement `isRamadan()` using HijriDateService (month === 9)
    - Implement `getCurrentRamadanDay()` returning 1-30
    - Implement `getDaysRemaining()` returning (30 - currentDay)
    - Implement `isLastTenNights()` returning (day >= 21)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 9.1_
  - [x] 2.2 Write property tests for RamadanService
    - **Property 1: Ramadan Detection Consistency**
    - **Property 2: Ramadan Day Calculation Bounds**
    - **Property 3: Days Remaining Calculation**
    - **Property 12: Last Ten Nights Detection**
    - **Validates: Requirements 1.1, 1.2, 1.3, 9.1**

- [x] 3. Implement RamadanContext
  - Create `client/contexts/RamadanContext.tsx`
  - Implement `RamadanProvider` component
  - Expose: `isRamadan`, `currentDay`, `daysRemaining`, `isLastTenNights`, `ramadanYear`
  - Use HijriDateService for date calculations
  - _Requirements: 1.1, 1.2, 1.3, 9.1_

- [x] 4. Implement useSuhoorIftar hook
  - [x] 4.1 Create `client/hooks/useSuhoorIftar.ts`
    - Integrate with existing `usePrayerTimes` hook
    - Map Fajr time to Suhoor end, Maghrib time to Iftar
    - Implement countdown calculation (hours, minutes, seconds)
    - Implement threshold indicators (isSuhoorTime, isIftarTime)
    - Implement settings persistence to AsyncStorage
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  - [x] 4.2 Write property tests for countdown calculation
    - **Property 4: Suhoor Time Equals Fajr**
    - **Property 5: Iftar Time Equals Maghrib**
    - **Property 6: Countdown Accuracy**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [x] 5. Implement Suhoor/Iftar notifications
  - [x] 5.1 Create notification scheduling in useSuhoorIftar
    - Schedule Suhoor reminder (configurable minutes before Fajr)
    - Schedule Suhoor end notification (at Fajr)
    - Schedule Iftar reminder (configurable minutes before Maghrib)
    - Schedule Iftar notification (at Maghrib)
    - Create Android notification channel 'ramadan-suhoor' and 'ramadan-iftar'
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 6. Checkpoint - Core Ramadan infrastructure
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement useQuranSchedule hook
  - [x] 7.1 Create `client/hooks/useQuranSchedule.ts`
    - Implement schedule generation (604 pages / 30 days)
    - Implement `markDayComplete()` with timestamp
    - Implement progress calculation (pagesRead, percentComplete, onTrack)
    - Persist schedule to AsyncStorage with year-specific key
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [x] 7.2 Write property tests for Quran schedule
    - **Property 7: Quran Schedule Coverage**
    - **Property 8: Quran Progress Calculation**
    - **Validates: Requirements 4.1, 4.5**

- [x] 8. Implement Quran reading notifications
  - Add daily reminder scheduling to useQuranSchedule
  - Include Juz number and page range in notification
  - Skip reminder if day already completed
  - Create Android notification channel 'ramadan-quran'
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9. Implement useTaraweehTracker hook
  - [x] 9.1 Create `client/hooks/useTaraweehTracker.ts`
    - Implement CRUD operations for TaraweehEntry
    - Implement streak calculation (current and best)
    - Implement statistics calculation (total nights, mosque/home breakdown)
    - Persist entries to AsyncStorage with year-specific key
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_
  - [x] 9.2 Write property tests for Taraweeh tracker
    - **Property 9: Taraweeh Streak Calculation**
    - **Validates: Requirements 6.4, 6.6**

- [x] 10. Implement useCharityTracker hook
  - [x] 10.1 Create `client/hooks/useCharityTracker.ts`
    - Implement CRUD operations for CharityEntry
    - Implement total and breakdown calculations
    - Implement goal tracking with progress percentage
    - Implement Zakat calculator (2.5% above Nisab)
    - Persist entries and goal to AsyncStorage with year-specific key
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3_
  - [x] 10.2 Write property tests for Charity tracker
    - **Property 10: Charity Total Calculation**
    - **Property 11: Zakat Calculation**
    - **Validates: Requirements 7.3, 7.5, 8.2**

- [x] 11. Checkpoint - All hooks complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement useLaylatalQadr hook
  - [x] 12.1 Create `client/hooks/useLaylatalQadr.ts`
    - Implement odd night detection ({21, 23, 25, 27, 29})
    - Implement Ibaadah checklist with toggle functionality
    - Implement countdown to last 10 nights (21 - currentDay)
    - Include special Laylatul Qadr duas data
    - Persist checklist state to AsyncStorage
    - _Requirements: 9.1, 9.2, 9.4, 9.5, 9.6, 9.7_
  - [x] 12.2 Write property tests for Laylatul Qadr
    - **Property 13: Odd Night Detection**
    - **Validates: Requirements 9.2**

- [x] 13. Create Ramadan UI components
  - [x] 13.1 Create `client/components/ramadan/SuhoorIftarCard.tsx`
    - Display Suhoor end time and Iftar time
    - Show live countdown timers
    - Show "Suhoor Time" / "Almost Iftar" / "Iftar Time!" indicators
    - Notification toggle controls
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  - [x] 13.2 Create `client/components/ramadan/QuranProgressCard.tsx`
    - Display progress bar and percentage
    - Show today's reading assignment (Juz, pages)
    - "Open in Mushaf" and "Mark Complete" buttons
    - _Requirements: 4.3, 4.5, 4.7_
  - [x] 13.3 Create `client/components/ramadan/TaraweehCard.tsx`
    - Display tonight's status (logged or not)
    - Quick log form (rakaat, location)
    - Show current streak
    - _Requirements: 6.1, 6.2, 6.4, 6.6_
  - [x] 13.4 Create `client/components/ramadan/CharityCard.tsx`
    - Display total charity and goal progress
    - Zakat status indicator
    - Quick add entry button
    - _Requirements: 7.3, 7.4, 7.6_
  - [x] 13.5 Create `client/components/ramadan/LaylatalQadrBanner.tsx`
    - Prominent banner for odd nights
    - Ibaadah checklist display
    - Special dua access
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6_
  - [x] 13.6 Create `client/components/ramadan/RamadanCountdown.tsx`
    - Display current Ramadan day
    - Days remaining until Eid
    - Days until last 10 nights (if applicable)
    - _Requirements: 1.2, 1.3, 9.7_

- [x] 14. Create Ramadan screens
  - [x] 14.1 Create `client/screens/RamadanDashboardScreen.tsx`
    - Compose all Ramadan cards into unified dashboard
    - Show Ramadan day header with countdown
    - Laylatul Qadr banner (when applicable)
    - Navigation to detail screens
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_
  - [x] 14.2 Create `client/screens/QuranScheduleScreen.tsx`
    - Full 30-day schedule view
    - Calendar grid with completion status
    - Detailed day view with Surah names
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.8_
  - [x] 14.3 Create `client/screens/TaraweehTrackerScreen.tsx`
    - Calendar view of Taraweeh nights
    - Statistics display
    - Entry form for logging
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - [x] 14.4 Create `client/screens/CharityTrackerScreen.tsx`
    - Entry list with filters by type
    - Goal setting and progress
    - Zakat calculator modal
    - Add/edit entry form
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4_

- [x] 15. Checkpoint - All screens complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Navigation integration
  - [x] 16.1 Update `client/navigation/RootStackNavigator.tsx`
    - Add RamadanDashboard, QuranSchedule, TaraweehTracker, CharityTracker screens
    - Update RootStackParamList type
    - _Requirements: 1.6_
  - [x] 16.2 Add Ramadan entry point to PrayerTimesScreen
    - Show "Ramadan Mode" button/banner when isRamadan is true
    - Navigate to RamadanDashboard on tap
    - _Requirements: 1.6, 10.7_

- [x] 17. Integrate RamadanProvider into App.tsx
  - Wrap app with RamadanProvider
  - Ensure context is available throughout app
  - _Requirements: 1.1_

- [x] 18. Implement data persistence and reset
  - [x] 18.1 Add data export/reset functionality to RamadanService
    - Implement `clearRamadanData(year)` to reset all data for a year
    - Implement `exportRamadanData(year)` for backup
    - _Requirements: 11.4_
  - [x] 18.2 Write property tests for data persistence
    - **Property 14: Data Persistence Round-Trip**
    - **Property 15: Year-Specific Storage Isolation**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.5**

- [x] 19. Final checkpoint - Full integration
  - All tasks completed
  - Ramadan detection implemented via RamadanService and RamadanContext
  - All notifications scheduled via RamadanNotificationService
  - Data persists via AsyncStorage with year-specific keys

## Notes

- All tasks including property-based tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
