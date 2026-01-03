# Requirements: Quran Memorization Mode (Hifz)

## Overview
Implement a dedicated memorization mode in the Mushaf screen to help users memorize Quran through hide/reveal testing, repetition controls, progress tracking, and revision scheduling.

## User Stories

### Requirement 1: Hide/Reveal Text for Testing
**User Story:** As a Quran memorizer, I want to hide verses and reveal them on demand so I can test my memorization.

**Acceptance Criteria:**
- 1.1 Toggle button to enter/exit Hifz mode
- 1.2 Hide all Arabic text when in Hifz mode (show placeholder/blur)
- 1.3 Tap on hidden verse to reveal it temporarily
- 1.4 Option to hide word-by-word (progressive reveal)
- 1.5 Option to hide first word only (prompt mode)
- 1.6 Option to hide last word only (completion mode)
- 1.7 Auto-hide after configurable delay (2s, 5s, 10s, manual)
- 1.8 Visual indicator showing which verses are hidden vs revealed

### Requirement 2: Repeat Verse/Page X Times
**User Story:** As a memorizer, I want to repeat audio for specific verses or pages multiple times so I can learn through repetition.

**Acceptance Criteria:**
- 2.1 Set repeat count for current verse (1, 3, 5, 10, 20, unlimited)
- 2.2 Set repeat count for verse range (e.g., verses 1-5)
- 2.3 Set repeat count for current page
- 2.4 Display current repeat count (e.g., "3/10")
- 2.5 Pause between repeats (configurable: 0s, 2s, 5s)
- 2.6 Option to slow down audio playback (0.75x, 0.5x)
- 2.7 Stop button to exit repeat loop
- 2.8 Auto-advance to next verse/page after completing repeats

### Requirement 3: Mark Memorized Sections
**User Story:** As a memorizer, I want to mark verses/pages as memorized so I can track my progress.

**Acceptance Criteria:**
- 3.1 Mark individual verse as memorized
- 3.2 Mark page as memorized
- 3.3 Mark surah as memorized
- 3.4 Mark juz as memorized
- 3.5 Three status levels: Not started, In progress, Memorized
- 3.6 Visual indicator on verses/pages showing memorization status
- 3.7 Progress summary (X/6236 verses, X/604 pages, X/30 juz)
- 3.8 Persist memorization data locally
- 3.9 Option to reset/clear memorization progress

### Requirement 4: Revision Schedule Suggestions
**User Story:** As a memorizer, I want the app to suggest what to revise based on spaced repetition so I don't forget what I've memorized.

**Acceptance Criteria:**
- 4.1 Track last revision date for each memorized section
- 4.2 Calculate next revision date using spaced repetition algorithm
- 4.3 Show "Due for revision" badge on sections needing review
- 4.4 Daily revision suggestion screen/modal
- 4.5 Revision intervals: 1 day, 3 days, 7 days, 14 days, 30 days, 90 days
- 4.6 Mark revision as complete to update schedule
- 4.7 Option to set daily revision goal (e.g., 2 pages/day)
- 4.8 Notification reminder for daily revision (optional)

### Requirement 5: Audio Loop for Specific Verses
**User Story:** As a memorizer, I want to loop audio for a specific verse range so I can focus on memorizing that section.

**Acceptance Criteria:**
- 5.1 Select start verse for loop
- 5.2 Select end verse for loop
- 5.3 Visual indicator showing loop range
- 5.4 Loop plays continuously until stopped
- 5.5 Combine with repeat count (loop X times then stop)
- 5.6 Quick loop presets: current verse, current page, current juz
- 5.7 Save favorite loop ranges for quick access

## Technical Requirements

### TR-1: Data Storage
- Store memorization progress in AsyncStorage
- Store revision schedule data
- Store user preferences for Hifz mode
- Support data export/import for backup

### TR-2: Integration with Existing Features
- Integrate with existing AudioService for playback
- Integrate with MushafScreen for display
- Integrate with existing verse/page navigation
- Work with both online and offline audio

### TR-3: Performance
- Efficient rendering when hiding/revealing text
- Smooth animations for reveal effects
- No lag when switching between modes

### TR-4: Accessibility
- Hifz mode should work with screen readers
- Clear visual feedback for all states
- Support for different text sizes

## Constraints
- Must work offline with cached audio
- Must not interfere with normal Mushaf reading mode
- Progress data must persist across app updates
- Should work on both Android and iOS

## Priority Order
1. Hide/Reveal Text (core feature)
2. Repeat Verse/Page (essential for memorization)
3. Mark Memorized Sections (progress tracking)
4. Audio Loop (enhanced repetition)
5. Revision Schedule (advanced feature)
