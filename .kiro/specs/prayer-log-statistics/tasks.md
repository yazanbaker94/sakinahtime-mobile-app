# Implementation Tasks: Prayer Log & Statistics

## Task 1: Create Type Definitions
- [x] Create `client/types/prayerLog.ts` with all type definitions
- [x] Define `PrayerStatus`, `PrayerName`, `PrayerEntry`, `DailyPrayerRecord`
- [x] Define `PrayerStreakData`, `QadaCounts`, `PrayerLogData`, `PrayerLogSettings`
- [x] Define `WeeklyStats`, `MonthlyStats` interfaces
- [x] Add storage key constant and default values

## Task 2: Create PrayerLogService
- [x] Create `client/services/PrayerLogService.ts`
- [x] Implement `loadPrayerLog()` and `savePrayerLog()` with AsyncStorage
- [x] Implement `validatePrayerLog()` for data integrity
- [x] Implement `markPrayer()` to update prayer status
- [x] Implement `getDailyRecord()` and `getOrCreateDailyRecord()`
- [x] Implement `updateStreak()` for streak calculation
- [x] Implement `checkPerfectDay()` helper

## Task 3: Add Statistics Methods to Service
- [x] Implement `getWeeklyStats()` for 7-day statistics
- [x] Implement `getMonthlyStats()` for calendar month statistics
- [x] Implement `getPrayerBreakdown()` for per-prayer analysis (included in getMonthlyStats)
- [x] Add date utility helpers (week start/end, month boundaries)

## Task 4: Add Qada Tracking to Service
- [x] Implement `incrementQada()` when prayer marked as missed
- [x] Implement `decrementQada()` when qada prayer logged
- [x] Implement `setQadaCount()` for manual adjustment
- [x] Add validation to prevent negative counts

## Task 5: Create usePrayerLog Hook
- [x] Create `client/hooks/usePrayerLog.ts`
- [x] Load today's record on mount
- [x] Expose `markPrayer()` function
- [x] Expose `getPrayerStatus()` for each prayer
- [x] Track `isPerfectDay` state
- [x] Handle loading state

## Task 6: Create usePrayerStats Hook
- [x] Create `client/hooks/usePrayerStats.ts`
- [x] Load streak data on mount
- [x] Compute weekly and monthly stats
- [x] Expose `viewMode` toggle (weekly/monthly)
- [x] Handle loading and refresh

## Task 7: Create useQadaTracker Hook
- [x] Create `client/hooks/useQadaTracker.ts`
- [x] Load qada counts on mount
- [x] Expose `logQadaPrayer()` function
- [x] Expose `adjustQadaCount()` for manual edits
- [x] Calculate `totalQada` sum

## Task 8: Create PrayerStatusIndicator Component
- [x] Create `client/components/PrayerStatusIndicator.tsx`
- [x] Display icon based on status (check/X/clock/circle)
- [x] Handle tap to cycle through statuses
- [x] Style with appropriate colors per status

## Task 9: Integrate Status Indicators into PrayerTimesScreen
- [x] Import `usePrayerLog` hook
- [x] Add `PrayerStatusIndicator` to each prayer card
- [x] Show current streak in header area
- [x] Display "Perfect Day" badge when applicable

## Task 10: Create StreakCard Component
- [x] Create `client/components/StreakCard.tsx`
- [x] Display current streak with flame icon
- [x] Display longest streak record
- [x] Add encouraging message based on streak

## Task 11: Create WeeklyChart Component
- [x] Create `client/components/WeeklyChart.tsx`
- [x] Display 7-day bar chart (0-5 prayers per day)
- [x] Color-code perfect days
- [x] Show completion percentage

## Task 12: Create MonthlyCalendar Component
- [x] Create `client/components/MonthlyCalendar.tsx`
- [x] Display calendar grid for current month
- [x] Color-code days by completion (green/yellow/red)
- [x] Show month navigation

## Task 13: Create PrayerStatsScreen
- [x] Create `client/screens/PrayerStatsScreen.tsx`
- [x] Add tab toggle for Weekly/Monthly view
- [x] Include StreakCard at top
- [x] Show WeeklyChart or MonthlyCalendar based on mode
- [x] Display prayer-specific breakdown

## Task 14: Create QadaTrackerModal
- [x] Create `client/components/QadaTrackerModal.tsx`
- [x] Display qada count per prayer type
- [x] Add +/- buttons for adjustment
- [x] Add "Log Qada Prayer" action button
- [x] Show total qada remaining

## Task 15: Add Navigation and Settings Integration
- [x] Add PrayerStatsScreen to navigation
- [x] Add "Prayer Stats" entry point (tab or settings)
- [x] Add Qada tracker access from stats screen
- [x] Missed prayer reminder settings already exist in NotificationSettingsModal

## Task 16: Implement Data Export
- [x] Add `exportData()` method to service
- [x] Create export button in PrayerStatsScreen
- [x] Generate JSON with all prayer log data
- [x] Use Share API to export file

## Task 17: Add Missed Prayer Reminders (Optional)
- [ ] Extend useNotifications for missed prayer reminders
- [ ] Schedule reminder X minutes after prayer time if unmarked
- [ ] Add settings toggle and delay picker
- [ ] Cancel reminder if prayer is marked

Note: Task 17 is optional and can be implemented in a future iteration. The core prayer log and statistics functionality is complete.
