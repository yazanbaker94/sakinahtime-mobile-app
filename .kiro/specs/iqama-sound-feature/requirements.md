# Iqama Sound Feature - Requirements

## Functional Requirements

### FR-1: Iqama Sound Playback
- System SHALL play "Haya Al Salat" audio file at a configurable time after each prayer's Azan
- System SHALL support playback when app is in background or closed (Android)
- System SHALL use alarm-level audio stream to play even in silent mode

### FR-2: Configurable Delay
- User SHALL be able to set delay between Azan and Iqama (5-30 minutes)
- Default delay SHALL be 15 minutes
- Delay setting SHALL persist across app restarts

### FR-3: Per-Prayer Control
- User SHALL be able to enable/disable Iqama for each prayer individually
- User SHALL be able to enable/disable Iqama globally with master toggle

### FR-4: Notification
- System SHALL display notification when Iqama plays
- Notification SHALL include stop button to silence Iqama
- Notification SHALL show prayer name (e.g., "Iqama - Fajr")

### FR-5: Settings Persistence
- All Iqama settings SHALL be saved to device storage
- Settings SHALL be restored when app launches

---

## Non-Functional Requirements

### NFR-1: Performance
- Iqama scheduling SHALL not impact app startup time
- Audio playback SHALL start within 1 second of scheduled time

### NFR-2: Battery
- Iqama feature SHALL use efficient alarm scheduling (AlarmManager)
- SHALL NOT use continuous background services

### NFR-3: Reliability
- Iqama alarms SHALL survive device reboot (via BOOT_COMPLETED receiver)
- Iqama SHALL play even if Azan was skipped or stopped

### NFR-4: User Experience
- Settings UI SHALL be intuitive and consistent with existing notification settings
- Delay picker SHALL provide common presets (5, 10, 15, 20, 25, 30 min)

---

## Technical Constraints

### TC-1: iOS Limitations
- iOS notification sounds limited to 30 seconds
- Background audio requires app to be in foreground/minimized state

### TC-2: Android Requirements
- Requires SCHEDULE_EXACT_ALARM permission (already granted)
- Requires WAKE_LOCK permission (already granted)

### TC-3: Audio Format
- Android: MP3 format in res/raw directory
- iOS: CAF format (Linear PCM or IMA4) in assets/audio

---

## Acceptance Criteria

### AC-1: Basic Functionality
- [ ] Iqama sound plays X minutes after prayer time (where X is user-configured delay)
- [ ] Iqama plays when app is closed on Android
- [ ] Iqama can be stopped via notification button

### AC-2: Settings
- [ ] Master toggle enables/disables all Iqama reminders
- [ ] Delay can be changed and persists
- [ ] Individual prayers can be toggled for Iqama

### AC-3: Independence
- [ ] Iqama works independently of Azan (can have Iqama without Azan)
- [ ] Iqama doesn't interfere with Azan playback
- [ ] Disabling Azan doesn't affect Iqama settings

### AC-4: UI
- [ ] Iqama settings section visible in Notification Settings modal
- [ ] UI matches existing design patterns
- [ ] Delay picker shows current selection clearly
