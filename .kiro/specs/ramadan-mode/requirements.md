# Requirements Document

## Introduction

Ramadan Mode is a comprehensive feature set that activates during the holy month of Ramadan, providing Muslims with specialized tools for worship, fasting, and spiritual growth. The feature includes Suhoor/Iftar time tracking with notifications, a daily Quran reading schedule for completing the Quran during Ramadan, Taraweeh prayer tracking, charity (Sadaqah/Zakat) logging, and Laylatul Qadr countdown with special features for the last 10 nights.

## Glossary

- **Ramadan_Service**: The core service that detects Ramadan month and manages Ramadan-specific state
- **Suhoor_Timer**: Component that calculates and displays time until Suhoor ends (Fajr time)
- **Iftar_Timer**: Component that calculates and displays time until Iftar begins (Maghrib time)
- **Quran_Schedule**: Service that manages the 30-day Quran completion reading plan
- **Taraweeh_Tracker**: Service that logs and tracks nightly Taraweeh prayers
- **Charity_Tracker**: Service that logs Sadaqah, Zakat, and other charitable contributions
- **Laylatul_Qadr_Service**: Service that manages last 10 nights features and countdowns
- **Ramadan_Dashboard**: Main screen displaying all Ramadan features in a unified view
- **Notification_Scheduler**: Component that schedules Ramadan-specific notifications

## Requirements

### Requirement 1: Ramadan Detection and State Management

**User Story:** As a Muslim user, I want the app to automatically detect when it's Ramadan so that I can access special Ramadan features without manual configuration.

#### Acceptance Criteria

1. WHEN the current Hijri month is Ramadan (month 9), THE Ramadan_Service SHALL activate Ramadan Mode automatically
2. WHEN Ramadan Mode is active, THE Ramadan_Service SHALL calculate and provide the current Ramadan day (1-30)
3. WHEN Ramadan Mode is active, THE Ramadan_Service SHALL calculate days remaining until Eid al-Fitr
4. WHEN the Hijri date transitions from Ramadan to Shawwal, THE Ramadan_Service SHALL deactivate Ramadan Mode
5. THE Ramadan_Service SHALL persist Ramadan data (schedules, logs) using year-specific storage keys
6. WHEN a user opens the app during Ramadan, THE Ramadan_Dashboard SHALL be accessible from the main navigation

### Requirement 2: Suhoor and Iftar Time Display

**User Story:** As a fasting Muslim, I want to see Suhoor and Iftar times with countdowns so that I can properly time my pre-dawn meal and breaking of fast.

#### Acceptance Criteria

1. WHEN Ramadan Mode is active, THE Suhoor_Timer SHALL display the Suhoor end time (equal to Fajr prayer time)
2. WHEN Ramadan Mode is active, THE Iftar_Timer SHALL display the Iftar time (equal to Maghrib prayer time)
3. THE Suhoor_Timer SHALL display a live countdown (hours, minutes, seconds) until Suhoor ends
4. THE Iftar_Timer SHALL display a live countdown (hours, minutes, seconds) until Iftar begins
5. WHEN the current time is within 60 minutes of Suhoor end, THE Suhoor_Timer SHALL display a visual "Suhoor Time" indicator
6. WHEN the current time is within 30 minutes of Iftar, THE Iftar_Timer SHALL display a visual "Almost Iftar" indicator
7. WHEN Iftar time arrives, THE Iftar_Timer SHALL display a celebratory "Iftar Time!" message

### Requirement 3: Suhoor and Iftar Notifications

**User Story:** As a fasting Muslim, I want to receive notifications for Suhoor and Iftar so that I don't miss important fasting times.

#### Acceptance Criteria

1. WHEN Suhoor notifications are enabled, THE Notification_Scheduler SHALL send a reminder notification at a configurable time before Fajr (default: 30 minutes)
2. WHEN Suhoor notifications are enabled, THE Notification_Scheduler SHALL send a notification when Suhoor time ends (at Fajr)
3. WHEN Iftar notifications are enabled, THE Notification_Scheduler SHALL send a reminder notification at a configurable time before Maghrib (default: 15 minutes)
4. WHEN Iftar notifications are enabled, THE Notification_Scheduler SHALL send a notification when Iftar time arrives (at Maghrib)
5. THE Notification_Scheduler SHALL allow users to enable/disable Suhoor and Iftar notifications independently
6. THE Notification_Scheduler SHALL allow users to configure reminder times (5, 10, 15, 30, 45, 60 minutes before)

### Requirement 4: Daily Quran Reading Schedule

**User Story:** As a Muslim during Ramadan, I want a daily Quran reading schedule so that I can complete reading the entire Quran during the month.

#### Acceptance Criteria

1. WHEN Ramadan begins, THE Quran_Schedule SHALL generate a 30-day reading plan dividing 604 pages across 30 days (~20 pages/day)
2. THE Quran_Schedule SHALL assign one Juz (part) per day for the standard schedule
3. FOR each day, THE Quran_Schedule SHALL display the Juz number, start page, end page, and Surah names
4. WHEN a user marks a day as complete, THE Quran_Schedule SHALL record the completion with timestamp
5. THE Quran_Schedule SHALL calculate and display overall progress (pages read, percentage complete)
6. THE Quran_Schedule SHALL indicate whether the user is on track, ahead, or behind schedule
7. WHEN a user taps "Open in Mushaf", THE Quran_Schedule SHALL navigate to the Mushaf screen at the correct page
8. IF a user misses a day, THE Quran_Schedule SHALL show the missed reading and allow catching up

### Requirement 5: Quran Reading Notifications

**User Story:** As a Muslim during Ramadan, I want daily reminders to read my Quran portion so that I stay on track to complete the Quran.

#### Acceptance Criteria

1. WHEN Quran reading reminders are enabled, THE Notification_Scheduler SHALL send a daily notification at a user-configured time
2. THE notification SHALL include today's reading assignment (Juz number, page range)
3. WHEN a user has not completed today's reading by the reminder time, THE Notification_Scheduler SHALL send the reminder
4. IF a user has already completed today's reading, THE Notification_Scheduler SHALL skip the reminder for that day
5. THE Notification_Scheduler SHALL allow users to set their preferred reminder time (default: after Isha)

### Requirement 6: Taraweeh Prayer Tracking

**User Story:** As a Muslim during Ramadan, I want to track my Taraweeh prayers so that I can maintain consistency throughout the month.

#### Acceptance Criteria

1. THE Taraweeh_Tracker SHALL allow users to log Taraweeh prayer for each night of Ramadan
2. WHEN logging Taraweeh, THE Taraweeh_Tracker SHALL record: date, rakaat count (8 or 20), location (mosque or home)
3. THE Taraweeh_Tracker SHALL allow optional notes for each entry
4. THE Taraweeh_Tracker SHALL calculate and display statistics: total nights prayed, current streak, best streak, mosque vs home breakdown
5. THE Taraweeh_Tracker SHALL display a calendar view showing which nights Taraweeh was prayed
6. WHEN a user has prayed Taraweeh for consecutive nights, THE Taraweeh_Tracker SHALL display the streak count prominently

### Requirement 7: Charity (Sadaqah) Tracking

**User Story:** As a Muslim during Ramadan, I want to track my charitable giving so that I can monitor my generosity during the blessed month.

#### Acceptance Criteria

1. THE Charity_Tracker SHALL allow users to log charity entries with: date, amount, currency, type (Sadaqah, Zakat, Fidya, Kaffarah, Other)
2. THE Charity_Tracker SHALL allow optional recipient name and notes for each entry
3. THE Charity_Tracker SHALL calculate and display total charity given during Ramadan
4. THE Charity_Tracker SHALL allow users to set a Ramadan charity goal and track progress toward it
5. THE Charity_Tracker SHALL display a breakdown of charity by type
6. THE Charity_Tracker SHALL allow users to mark Zakat as paid with the amount

### Requirement 8: Zakat Calculator

**User Story:** As a Muslim, I want to calculate my Zakat obligation so that I can fulfill this pillar of Islam correctly.

#### Acceptance Criteria

1. THE Charity_Tracker SHALL provide a Zakat calculator that accepts total wealth amount
2. THE Zakat calculator SHALL calculate Zakat due as 2.5% of wealth above the Nisab threshold
3. THE Zakat calculator SHALL display current Nisab values (gold and silver thresholds)
4. WHEN a user calculates Zakat, THE Charity_Tracker SHALL offer to log the calculated amount as a Zakat entry

### Requirement 9: Laylatul Qadr Features

**User Story:** As a Muslim during the last 10 nights of Ramadan, I want special features to help me seek Laylatul Qadr so that I can maximize worship during these blessed nights.

#### Acceptance Criteria

1. WHEN the current Ramadan day is 21 or greater, THE Laylatul_Qadr_Service SHALL activate last 10 nights mode
2. THE Laylatul_Qadr_Service SHALL highlight odd nights (21, 23, 25, 27, 29) as most likely Laylatul Qadr nights
3. WHEN it is an odd night, THE Laylatul_Qadr_Service SHALL display a prominent banner indicating the special night
4. THE Laylatul_Qadr_Service SHALL provide an Ibaadah (worship) checklist for each night including: Taraweeh, Quran reading, Special dua, Charity, Tahajjud
5. THE Laylatul_Qadr_Service SHALL allow users to check off completed Ibaadah items
6. THE Laylatul_Qadr_Service SHALL display special duas for Laylatul Qadr
7. BEFORE the last 10 nights begin, THE Laylatul_Qadr_Service SHALL show a countdown to the start of the last 10 nights

### Requirement 10: Ramadan Dashboard

**User Story:** As a Muslim during Ramadan, I want a unified dashboard showing all Ramadan features so that I can easily access and monitor my Ramadan activities.

#### Acceptance Criteria

1. THE Ramadan_Dashboard SHALL display the current Ramadan day and days remaining
2. THE Ramadan_Dashboard SHALL display the Suhoor/Iftar countdown card prominently
3. THE Ramadan_Dashboard SHALL display a Quran reading progress summary with today's assignment
4. THE Ramadan_Dashboard SHALL display Taraweeh tracking summary with streak information
5. THE Ramadan_Dashboard SHALL display charity tracking summary with total given
6. WHEN in the last 10 nights, THE Ramadan_Dashboard SHALL display the Laylatul Qadr banner prominently
7. THE Ramadan_Dashboard SHALL provide quick navigation to detailed screens for each feature
8. THE Ramadan_Dashboard SHALL display upcoming milestones (Laylatul Qadr start, Eid)

### Requirement 11: Data Persistence

**User Story:** As a user, I want my Ramadan data to be saved so that I don't lose my progress if I close the app.

#### Acceptance Criteria

1. THE Ramadan_Service SHALL persist all Ramadan data to AsyncStorage
2. THE Ramadan_Service SHALL use year-specific storage keys to separate data between Ramadan years
3. WHEN the app launches during Ramadan, THE Ramadan_Service SHALL restore all saved progress
4. THE Ramadan_Service SHALL allow users to reset/clear Ramadan data if desired
5. THE Ramadan_Service SHALL preserve historical Ramadan data from previous years

## Technical Notes

- Leverage existing `HijriDateService` for Ramadan detection and day calculations
- Leverage existing `usePrayerTimes` hook for Suhoor (Fajr) and Iftar (Maghrib) times
- Leverage existing notification infrastructure from `useNotifications` hook
- Integrate with existing Mushaf screen for Quran reading navigation
- Use AsyncStorage with year-specific keys (e.g., `@ramadan_2024_quran_schedule`)
- Consider timezone handling for accurate Suhoor/Iftar times across locations
