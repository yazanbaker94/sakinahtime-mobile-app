# Implementation Plan: Quran Reading Progress & Khatm Tracker

## Overview

This implementation plan breaks down the Quran Reading Progress & Khatm Tracker feature into discrete coding tasks. Each task builds on previous work, ensuring incremental progress with no orphaned code. The implementation uses TypeScript with React Native and fast-check for property-based testing.

## Tasks

- [x] 1. Create core data types and constants
  - Create `client/types/progress.ts` with all TypeScript interfaces
  - Create `client/constants/quran-constants.ts` with Quran structure data (pages, Juz mappings, verse counts)
  - Define storage keys and default values
  - _Requirements: 1.4, 8.1_

- [x] 2. Implement ProgressTrackerService
  - [x] 2.1 Create base service with storage operations
    - Create `client/services/ProgressTrackerService.ts`
    - Implement `loadProgress()` and `saveProgress()` methods
    - Implement `validateProgress()` for data validation
    - Implement `getDefaultProgress()` for initialization
    - _Requirements: 1.3, 8.1, 8.2, 8.3, 8.4_

  - [x] 2.2 Write property test for progress data round-trip
    - **Property 8: Progress Data Round-Trip**
    - **Validates: Requirements 1.3, 8.1**

  - [x] 2.3 Write property test for data validation and error handling
    - **Property 9: Data Validation and Error Handling**
    - **Validates: Requirements 8.3, 8.4**

  - [x] 2.4 Implement page marking functionality
    - Add `markPageRead(pageNumber)` method
    - Record timestamp and increment read count
    - Persist immediately after marking
    - _Requirements: 1.1, 1.2, 1.5_

  - [x] 2.5 Write property test for page reading
    - **Property 1: Page Reading Records and Persists Data**
    - **Validates: Requirements 1.1, 1.2, 1.5**

- [x] 3. Implement ProgressCalculator
  - [x] 3.1 Create calculator with basic statistics
    - Create `client/services/ProgressCalculator.ts`
    - Implement `getTotalPagesRead()`
    - Implement `getCompletionPercentage()`
    - Implement `getVersesRead()` using page-to-verse mapping
    - Implement `getJuzCompletion()` using Juz-to-page mapping
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.4_

  - [x] 3.2 Write property test for progress calculations
    - **Property 2: Progress Calculation Correctness**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 7.4**

  - [x] 3.3 Implement daily progress calculations
    - Add `getTodayProgress()` method
    - Add `getRemainingForGoal()` method
    - Add `getWeeklyData()` method
    - _Requirements: 3.4, 6.4_

  - [x] 3.4 Write property test for notification remaining calculation
    - **Property 7: Notification Remaining Calculation**
    - **Validates: Requirements 6.4**

- [x] 4. Checkpoint - Ensure all tests pass
  - All 34 tests pass

- [x] 5. Implement daily goal management
  - [x] 5.1 Add goal setting to ProgressTrackerService
    - Implement `setDailyGoal(goal)` method
    - Add validation for page goals (1-20) and verse goals (1-100)
    - Persist goal settings
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 5.2 Write property test for goal validation
    - **Property 3: Daily Goal Validation**
    - **Validates: Requirements 3.1, 3.2**

  - [x] 5.3 Write property test for goal persistence
    - **Property 4: Goal Persistence Round-Trip**
    - **Validates: Requirements 3.3**

- [x] 6. Implement streak tracking
  - [x] 6.1 Add streak calculation to ProgressTrackerService
    - Implement `updateStreak()` method
    - Track currentStreak, longestStreak, lastGoalMetDate
    - Handle streak increment on goal met
    - Handle streak reset on goal missed
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [x] 6.2 Write property test for streak state machine
    - **Property 5: Streak State Machine**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5**

- [x] 7. Implement Khatm tracking
  - [x] 7.1 Add Khatm completion logic
    - Implement `checkKhatmCompletion()` method
    - Implement `startNewKhatmCycle()` method
    - Record completion date and duration
    - Reset page progress after Khatm
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 7.2 Write property test for Khatm completion
    - **Property 6: Khatm Completion Logic**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 8. Checkpoint - Ensure all tests pass
  - All 34 tests pass

- [x] 9. Create useProgressTracker hook
  - [x] 9.1 Implement the React hook
    - Create `client/hooks/useProgressTracker.ts`
    - Load progress on mount
    - Expose markPageRead, setDailyGoal, resetProgress actions
    - Compute stats, todayProgress, isGoalMet
    - Handle loading state
    - _Requirements: 1.1, 2.5, 3.4, 3.5_

- [x] 10. Integrate with MushafScreen
  - [x] 10.1 Add progress tracking to MushafScreen
    - Import and use useProgressTracker hook
    - Call markPageRead when page is viewed
    - Add debounce to avoid excessive writes (mark after 3 seconds on page)
    - _Requirements: 1.1, 1.2_

  - [x] 10.2 Add progress indicator to MushafScreen header
    - Display small progress bar or percentage in header
    - Show daily goal progress
    - Tapping opens ProgressScreen
    - _Requirements: 2.5, 3.4_

- [x] 11. Create ProgressScreen UI
  - [x] 11.1 Create main progress screen
    - Create `client/screens/ProgressScreen.tsx`
    - Display circular progress indicator for overall completion
    - Display total pages read, completion percentage
    - Display Juz completion breakdown
    - _Requirements: 2.1, 2.2, 7.1, 7.4_

  - [x] 11.2 Add streak and Khatm display
    - Display current streak with flame icon
    - Display longest streak
    - Display Khatm count and history
    - _Requirements: 4.4, 5.3, 5.5_

  - [x] 11.3 Add weekly reading chart
    - Display bar chart of pages read per day (last 7 days)
    - Color code based on goal achievement
    - _Requirements: 7.2, 7.3_

  - [x] 11.4 Add goal settings UI
    - Add goal type selector (pages/verses)
    - Add goal target input with validation
    - Add enable/disable toggle
    - _Requirements: 3.1, 3.2, 3.5_

- [x] 12. Implement reading reminders
  - [x] 12.1 Create useReadingReminder hook
    - Create `client/hooks/useReadingReminder.ts`
    - Integrate with existing notification system
    - Schedule daily reminder at user-specified time
    - Include remaining pages/verses in notification body
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 12.2 Add reminder settings to ProgressScreen
    - Add reminder enable/disable toggle
    - Add time picker for reminder time
    - _Requirements: 6.1, 6.2_

  - [x] 12.3 Handle notification tap navigation
    - Navigate to MushafScreen when reminder notification is tapped
    - _Requirements: 6.5_

- [x] 13. Add navigation and integration
  - [x] 13.1 Add ProgressScreen to navigation
    - Add route to RootStackNavigator
    - Add navigation button to MushafScreen or Settings
    - _Requirements: All UI requirements_

  - [x] 13.2 Create ProgressWidget for quick access
    - Create small widget component showing key stats
    - Can be placed on home screen or Mushaf screen
    - _Requirements: 2.1, 4.4_

- [x] 14. Final checkpoint - Ensure all tests pass
  - All 34 tests pass
  - All core requirements implemented
  - Ready for testing on Android device (Galaxy M22)

## Notes

- All tasks including property-based tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use fast-check library with minimum 100 iterations
- Unit tests validate specific examples and edge cases

