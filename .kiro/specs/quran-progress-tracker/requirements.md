# Requirements Document

## Introduction

The Quran Reading Progress & Khatm Tracker is a feature that enables users to track their Quran reading journey, set daily goals, monitor completion progress, and maintain reading streaks. This feature integrates with the existing MushafScreen to automatically track reading progress and provides motivational tools to help users complete the Quran (Khatm).

## Glossary

- **Progress_Tracker**: The system component responsible for tracking and persisting reading progress
- **Khatm**: Complete reading of the entire Quran from beginning to end
- **Reading_Session**: A period of time during which the user reads the Quran
- **Daily_Goal**: The target number of pages or verses a user aims to read per day
- **Reading_Streak**: Consecutive days where the user has met their daily reading goal
- **Progress_Calculator**: The component that computes completion percentages and statistics

## Requirements

### Requirement 1: Track Reading Progress

**User Story:** As a user, I want my Quran reading progress to be automatically tracked, so that I can see how much I have read without manual input.

#### Acceptance Criteria

1. WHEN a user views a page in the Mushaf screen, THE Progress_Tracker SHALL record that page as read
2. WHEN a user has read a page, THE Progress_Tracker SHALL persist the reading data to local storage immediately
3. WHEN the app restarts, THE Progress_Tracker SHALL restore the previously saved reading progress
4. THE Progress_Tracker SHALL track reading progress at the page level (604 pages total)
5. WHEN a user reads a page, THE Progress_Tracker SHALL record the timestamp of when it was read

### Requirement 2: Display Progress Statistics

**User Story:** As a user, I want to see my reading statistics, so that I can understand my progress toward completing the Quran.

#### Acceptance Criteria

1. THE Progress_Calculator SHALL display the total number of pages read
2. THE Progress_Calculator SHALL display the completion percentage (pages read / 604 * 100)
3. THE Progress_Calculator SHALL display the number of verses read based on pages completed
4. THE Progress_Calculator SHALL display the number of Juz completed (out of 30)
5. WHEN displaying statistics, THE Progress_Calculator SHALL update in real-time as the user reads

### Requirement 3: Set Daily Reading Goals

**User Story:** As a user, I want to set a daily reading goal, so that I can pace my Quran completion journey.

#### Acceptance Criteria

1. THE Progress_Tracker SHALL allow users to set a daily goal in pages (1-20 pages)
2. THE Progress_Tracker SHALL allow users to set a daily goal in verses (1-100 verses)
3. WHEN a user sets a goal, THE Progress_Tracker SHALL persist the goal setting to local storage
4. THE Progress_Tracker SHALL display progress toward the daily goal as a progress bar
5. WHEN the daily goal is met, THE Progress_Tracker SHALL display a completion indicator

### Requirement 4: Track Reading Streaks

**User Story:** As a user, I want to see my reading streak, so that I stay motivated to read daily.

#### Acceptance Criteria

1. THE Progress_Tracker SHALL track consecutive days where the daily goal was met
2. WHEN a user meets their daily goal, THE Progress_Tracker SHALL increment the streak counter
3. WHEN a user misses their daily goal, THE Progress_Tracker SHALL reset the streak to zero
4. THE Progress_Tracker SHALL display the current streak prominently
5. THE Progress_Tracker SHALL display the longest streak achieved
6. WHEN the streak is broken, THE Progress_Tracker SHALL show a motivational message

### Requirement 5: Track Khatm Completions

**User Story:** As a user, I want to track how many times I have completed the Quran, so that I can see my lifetime achievement.

#### Acceptance Criteria

1. WHEN all 604 pages have been read, THE Progress_Tracker SHALL increment the Khatm counter
2. WHEN a Khatm is completed, THE Progress_Tracker SHALL record the completion date
3. THE Progress_Tracker SHALL display the total number of Khatm completions
4. WHEN a Khatm is completed, THE Progress_Tracker SHALL reset the page progress for a new cycle
5. THE Progress_Tracker SHALL allow users to view their Khatm history with dates

### Requirement 6: Reading Reminder Notifications

**User Story:** As a user, I want to receive reminders to read the Quran, so that I don't forget my daily reading.

#### Acceptance Criteria

1. THE Progress_Tracker SHALL allow users to enable/disable reading reminders
2. THE Progress_Tracker SHALL allow users to set a preferred reminder time
3. WHEN reminder time arrives and daily goal is not met, THE Progress_Tracker SHALL send a notification
4. THE notification SHALL display the remaining pages/verses to meet the daily goal
5. WHEN the user taps the notification, THE app SHALL open to the Mushaf screen

### Requirement 7: Progress Visualization

**User Story:** As a user, I want to see a visual representation of my progress, so that I can quickly understand my reading journey.

#### Acceptance Criteria

1. THE Progress_Calculator SHALL display a circular progress indicator showing overall completion
2. THE Progress_Calculator SHALL display a weekly reading chart showing pages read per day
3. THE Progress_Calculator SHALL use color coding to indicate goal achievement (green for met, yellow for partial, red for missed)
4. WHEN displaying the Juz breakdown, THE Progress_Calculator SHALL show which Juz are complete vs incomplete

### Requirement 8: Data Persistence and Serialization

**User Story:** As a developer, I want reading progress to be reliably stored and retrieved, so that users never lose their progress data.

#### Acceptance Criteria

1. WHEN storing progress data, THE Progress_Tracker SHALL encode it using JSON format
2. THE Progress_Tracker SHALL use AsyncStorage for local persistence
3. WHEN loading progress data, THE Progress_Tracker SHALL validate the data structure before use
4. IF stored data is corrupted, THEN THE Progress_Tracker SHALL initialize with default values and log the error
