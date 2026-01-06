# Requirements Document: Prayer Log & Statistics

## Introduction

This feature enables users to track their daily prayer consistency, view statistics, maintain streaks, and manage Qada (makeup) prayers. The goal is to help Muslims build and maintain consistent prayer habits through gentle accountability and visual progress tracking.

## Glossary

- **Prayer_Log**: The system component that records and manages prayer completion data
- **Prayer_Entry**: A single record of a prayer's status (prayed, missed, late) for a specific date
- **Streak**: Consecutive days where all five daily prayers were completed
- **Qada_Prayer**: A makeup prayer for a previously missed obligatory prayer
- **Statistics_Engine**: The component that calculates and aggregates prayer statistics

## Requirements

### Requirement 1: Prayer Status Marking

**User Story:** As a Muslim user, I want to mark my prayers as prayed or missed, so that I can track my daily prayer consistency.

#### Acceptance Criteria

1. WHEN a user views the prayer times screen, THE Prayer_Log SHALL display a status indicator for each of the five daily prayers
2. WHEN a user taps on a prayer's status indicator, THE Prayer_Log SHALL toggle between "prayed", "missed", and "unmarked" states
3. WHEN a prayer time has passed, THE Prayer_Log SHALL auto-mark the prayer as "unmarked" if no status was set
4. WHEN a user marks a prayer as "prayed", THE Prayer_Log SHALL record the timestamp of when it was marked
5. WHEN a user marks a prayer as "late" (after the next prayer time), THE Prayer_Log SHALL distinguish it from on-time prayers in statistics
6. THE Prayer_Log SHALL persist all prayer status data to local storage immediately after changes

### Requirement 2: Daily Prayer Summary

**User Story:** As a user, I want to see a summary of today's prayers at a glance, so that I can quickly know which prayers I've completed.

#### Acceptance Criteria

1. THE Prayer_Log SHALL display a visual summary showing completion status for all five prayers
2. WHEN all five prayers are marked as prayed, THE Prayer_Log SHALL display a "Perfect Day" indicator
3. WHEN viewing past dates, THE Prayer_Log SHALL show the historical prayer status for that day
4. THE Prayer_Log SHALL use distinct visual indicators (icons/colors) for prayed, missed, and unmarked states

### Requirement 3: Weekly Statistics

**User Story:** As a user, I want to see my weekly prayer statistics, so that I can understand my prayer patterns over the past week.

#### Acceptance Criteria

1. THE Statistics_Engine SHALL calculate and display the total prayers completed in the current week
2. THE Statistics_Engine SHALL show a day-by-day breakdown of prayers completed (0-5 per day)
3. THE Statistics_Engine SHALL calculate the weekly completion percentage
4. THE Statistics_Engine SHALL display a visual chart or graph of the weekly data
5. WHEN a new week begins, THE Statistics_Engine SHALL archive the previous week's data

### Requirement 4: Monthly Statistics

**User Story:** As a user, I want to see my monthly prayer statistics, so that I can track my long-term prayer consistency.

#### Acceptance Criteria

1. THE Statistics_Engine SHALL calculate and display the total prayers completed in the current month
2. THE Statistics_Engine SHALL show a calendar view with daily completion indicators
3. THE Statistics_Engine SHALL calculate the monthly completion percentage
4. THE Statistics_Engine SHALL identify the best and worst days of the month
5. WHEN a new month begins, THE Statistics_Engine SHALL archive the previous month's data

### Requirement 5: Streak Tracking

**User Story:** As a user, I want to track my prayer streak, so that I can stay motivated to maintain consistent prayer habits.

#### Acceptance Criteria

1. THE Prayer_Log SHALL track the current streak of consecutive days with all five prayers completed
2. THE Prayer_Log SHALL track the longest streak ever achieved
3. WHEN a user completes all five prayers for a day, THE Prayer_Log SHALL increment the current streak
4. WHEN a user misses any prayer for a day, THE Prayer_Log SHALL reset the current streak to zero
5. IF the current streak exceeds the longest streak, THEN THE Prayer_Log SHALL update the longest streak record
6. THE Prayer_Log SHALL display both current and longest streak prominently

### Requirement 6: Missed Prayer Reminders

**User Story:** As a user, I want gentle reminders about missed prayers, so that I can make up for them.

#### Acceptance Criteria

1. WHEN a prayer time passes without being marked, THE Prayer_Log SHALL send a gentle reminder notification (if enabled)
2. THE Prayer_Log SHALL allow users to enable/disable missed prayer reminders
3. THE Prayer_Log SHALL allow users to set a delay before sending missed prayer reminders (15-60 minutes)
4. WHEN displaying missed prayers, THE Prayer_Log SHALL show them in a non-judgmental, encouraging manner
5. THE Prayer_Log SHALL NOT send reminders for prayers already marked as prayed

### Requirement 7: Qada (Makeup) Prayer Tracker

**User Story:** As a user, I want to track my Qada prayers, so that I can systematically make up for missed prayers.

#### Acceptance Criteria

1. THE Prayer_Log SHALL maintain a count of total missed prayers that need to be made up
2. WHEN a user marks a prayer as missed, THE Prayer_Log SHALL add it to the Qada counter
3. THE Prayer_Log SHALL allow users to log Qada prayers separately from daily prayers
4. WHEN a user logs a Qada prayer, THE Prayer_Log SHALL decrement the Qada counter for that prayer type
5. THE Prayer_Log SHALL display Qada counts per prayer type (Fajr, Dhuhr, Asr, Maghrib, Isha)
6. THE Prayer_Log SHALL allow users to manually adjust Qada counts for historical missed prayers

### Requirement 8: Data Persistence and Export

**User Story:** As a user, I want my prayer data to be safely stored and exportable, so that I don't lose my tracking history.

#### Acceptance Criteria

1. THE Prayer_Log SHALL persist all data to AsyncStorage with automatic saving
2. THE Prayer_Log SHALL validate data integrity when loading from storage
3. IF data corruption is detected, THEN THE Prayer_Log SHALL attempt recovery and notify the user
4. THE Prayer_Log SHALL support data export in JSON format
5. THE Prayer_Log SHALL retain at least 12 months of historical data

### Requirement 9: Statistics Screen

**User Story:** As a user, I want a dedicated statistics screen, so that I can view detailed analytics about my prayer habits.

#### Acceptance Criteria

1. THE Statistics_Engine SHALL provide a dedicated screen accessible from the main navigation
2. THE Statistics_Engine SHALL display current streak, longest streak, and total prayers logged
3. THE Statistics_Engine SHALL show weekly and monthly views with toggle capability
4. THE Statistics_Engine SHALL display completion rate trends over time
5. THE Statistics_Engine SHALL show prayer-specific statistics (which prayers are most/least consistent)
