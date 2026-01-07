# Requirements Document

## Introduction

This feature adds floating overlay dhikr reminders that appear on top of other apps on Android devices. The overlay displays random Islamic remembrances (dhikr, salawat, duas) at configurable intervals throughout the day, providing gentle spiritual reminders without requiring the user to open the app.

## Glossary

- **Floating_Overlay**: A UI element that draws on top of other applications using Android's SYSTEM_ALERT_WINDOW permission
- **Dhikr**: Islamic remembrance phrases (SubhanAllah, Alhamdulillah, Allahu Akbar, etc.)
- **Salawat**: Blessings upon the Prophet Muhammad ﷺ
- **Foreground_Service**: An Android service that runs with a persistent notification, required for reliable background scheduling
- **Overlay_Permission**: The SYSTEM_ALERT_WINDOW permission that allows drawing over other apps

## Requirements

### Requirement 1: Floating Overlay Display

**User Story:** As a Muslim user, I want to see beautiful dhikr reminders floating on my screen, so that I can be reminded to remember Allah throughout my day without opening the app.

#### Acceptance Criteria

1. WHEN a dhikr reminder is triggered, THE Floating_Overlay SHALL display a styled card on top of other applications
2. THE Floating_Overlay SHALL display Arabic text, transliteration, and English meaning
3. THE Floating_Overlay SHALL be draggable to reposition on screen
4. WHEN the user taps the overlay, THE System SHALL dismiss it
5. WHEN the user swipes the overlay, THE System SHALL dismiss it with animation
6. THE Floating_Overlay SHALL auto-dismiss after a configurable duration (default 10 seconds)
7. THE Floating_Overlay SHALL respect the current app theme colors

### Requirement 2: Dhikr Content Management

**User Story:** As a user, I want a variety of dhikr content, so that I receive diverse spiritual reminders.

#### Acceptance Criteria

1. THE System SHALL include a curated collection of at least 50 dhikr phrases
2. THE System SHALL categorize dhikr into types: tasbih, tahmid, takbir, salawat, istighfar, and duas
3. WHEN selecting dhikr to display, THE System SHALL randomly choose from enabled categories
4. THE System SHALL track recently shown dhikr to avoid immediate repetition
5. THE System SHALL include source references (Quran verse or Hadith) where applicable

### Requirement 3: Scheduling and Intervals

**User Story:** As a user, I want to configure how often I receive reminders, so that I can balance spiritual benefit with avoiding distraction.

#### Acceptance Criteria

1. THE System SHALL allow users to set reminder intervals (30min, 1hr, 2hr, 3hr, 4hr)
2. THE System SHALL use a Foreground_Service to ensure reliable delivery
3. WHEN the device is in Do Not Disturb mode, THE System SHALL respect system DND settings
4. THE System SHALL allow users to set quiet hours (e.g., 11pm - 6am)
5. THE System SHALL optionally skip reminders during prayer times (±15 minutes)
6. WHEN the app is force-closed, THE Foreground_Service SHALL restart on device boot

### Requirement 4: Permission Handling

**User Story:** As a user, I want clear guidance on required permissions, so that I can enable the feature without confusion.

#### Acceptance Criteria

1. WHEN the feature is first enabled, THE System SHALL check for Overlay_Permission
2. IF Overlay_Permission is not granted, THE System SHALL show an explanation dialog
3. THE System SHALL provide a button to navigate directly to system settings
4. THE System SHALL detect when permission is granted and enable the feature automatically
5. IF permission is denied, THE System SHALL gracefully disable the feature with explanation

### Requirement 5: Settings and Customization

**User Story:** As a user, I want to customize my dhikr reminders, so that they fit my preferences and schedule.

#### Acceptance Criteria

1. THE Settings_Screen SHALL provide toggles for each dhikr category
2. THE Settings_Screen SHALL allow selection of reminder interval
3. THE Settings_Screen SHALL allow configuration of quiet hours
4. THE Settings_Screen SHALL allow configuration of auto-dismiss duration
5. THE Settings_Screen SHALL show a preview of the overlay appearance
6. THE Settings_Screen SHALL allow enabling/disabling the entire feature
7. THE System SHALL persist all settings across app restarts

### Requirement 6: Native Module Integration

**User Story:** As a developer, I want a clean native module interface, so that the React Native app can control the overlay feature.

#### Acceptance Criteria

1. THE Native_Module SHALL expose methods: startService(), stopService(), showOverlay(), hideOverlay()
2. THE Native_Module SHALL expose method to check and request Overlay_Permission
3. THE Native_Module SHALL emit events when overlay is shown, dismissed, or tapped
4. THE Native_Module SHALL accept configuration parameters (interval, categories, theme colors)
5. THE Native_Module SHALL work with Expo dev client builds

### Requirement 7: iOS Fallback

**User Story:** As an iOS user, I want an alternative experience, so that I'm not left without dhikr reminders.

#### Acceptance Criteria

1. WHEN running on iOS, THE System SHALL use standard push notifications instead of overlay
2. THE iOS notifications SHALL include the same dhikr content (Arabic, transliteration, meaning)
3. THE Settings_Screen SHALL indicate that overlay is Android-only with iOS using notifications
4. THE System SHALL use iOS notification scheduling for reliable delivery

### Requirement 8: Battery and Performance

**User Story:** As a user, I want the feature to be efficient, so that it doesn't drain my battery.

#### Acceptance Criteria

1. THE Foreground_Service SHALL use minimal resources when idle
2. THE System SHALL batch wake-ups with Android's AlarmManager for efficiency
3. THE Overlay SHALL use hardware acceleration for smooth animations
4. THE System SHALL not exceed 1% additional battery usage per day
