# Requirements: Android Home Screen Widgets

## Overview
Implement native Android home screen widgets for SakinahTime to provide quick access to prayer times, Hijri date, daily verse, and tasbeeh counter without opening the app.

## User Stories

### Requirement 1: Prayer Times Widget
**User Story:** As a Muslim user, I want a home screen widget showing prayer times so I can quickly see the next prayer without opening the app.

**Acceptance Criteria:**
- 1.1 Display next prayer name and time with countdown
- 1.2 Show all 5 daily prayer times in expanded view
- 1.3 Highlight current/next prayer
- 1.4 Auto-update countdown every minute
- 1.5 Tap widget to open app's prayer times screen
- 1.6 Support multiple widget sizes (small: next prayer only, medium: all prayers)
- 1.7 Use cached prayer times data (shared with app)
- 1.8 Show location name if available

### Requirement 2: Hijri Date Widget
**User Story:** As a Muslim user, I want a widget showing the current Hijri date so I can track Islamic dates at a glance.

**Acceptance Criteria:**
- 2.1 Display current Hijri date (day, month name, year)
- 2.2 Show Arabic and English month names
- 2.3 Display corresponding Gregorian date
- 2.4 Show moon phase icon
- 2.5 Indicate if today is a special Islamic event
- 2.6 Indicate if today is a recommended fasting day
- 2.7 Tap to open Hijri Calendar screen
- 2.8 Update daily at midnight/Maghrib

### Requirement 3: Daily Verse Widget
**User Story:** As a Muslim user, I want a widget showing a Quran verse so I can read and reflect on Allah's words throughout the day.

**Acceptance Criteria:**
- 3.1 Display a verse in Arabic text
- 3.2 Show English translation below
- 3.3 Display surah name and verse number
- 3.4 New verse each day (or on refresh)
- 3.5 Tap to open verse in Mushaf screen
- 3.6 Optional: Manual refresh button
- 3.7 Support different widget sizes for text length

### Requirement 4: Tasbeeh Counter Widget
**User Story:** As a Muslim user, I want a tasbeeh counter widget so I can do dhikr quickly without opening the app.

**Acceptance Criteria:**
- 4.1 Display current count prominently
- 4.2 Tap anywhere on widget to increment count
- 4.3 Show target count (e.g., 33, 99, 100)
- 4.4 Visual/haptic feedback on tap
- 4.5 Reset button to start over
- 4.6 Persist count across widget updates
- 4.7 Optional: Show current dhikr text (SubhanAllah, Alhamdulillah, etc.)

## Technical Requirements

### TR-1: Widget Framework
- Use Android App Widgets with RemoteViews
- Support Android 8.0+ (API 26+)
- Use Kotlin for widget implementation
- Implement AppWidgetProvider for each widget type

### TR-2: Data Sharing
- Share data between React Native app and widgets via SharedPreferences
- Use app group/content provider for data access
- Implement WorkManager for periodic updates
- Handle offline scenarios gracefully

### TR-3: Widget Sizes
- Small (2x1): Minimal info, single action
- Medium (4x2): Standard info display
- Large (4x4): Full information (optional)

### TR-4: Theming
- Support light and dark themes
- Follow system theme or app preference
- Use consistent colors with main app

### TR-5: Performance
- Minimize battery usage
- Efficient update intervals (not too frequent)
- Lazy loading of data
- Handle widget updates in background

## Constraints
- Widgets require development/production build (not Expo Go)
- Must work offline with cached data
- Limited interactivity (RemoteViews restrictions)
- Update frequency limited by Android system

## Priority Order
1. Prayer Times Widget (highest value)
2. Hijri Date Widget
3. Daily Verse Widget
4. Tasbeeh Counter Widget
