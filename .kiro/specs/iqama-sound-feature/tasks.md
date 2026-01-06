# Iqama Sound Feature - Implementation Tasks

## Prerequisites
- [x] User provides `haya_al_salat.mp3` file

---

## Phase 1: Audio File Setup

### Task 1.1: Add Android Audio Resource
- [x] Copy `iqama.mp3` to `android/app/src/main/res/raw/iqama.mp3`
- [x] Verify file is accessible in Android build

### Task 1.2: Add iOS Audio Resource
- [ ] Convert MP3 to CAF format (if needed for iOS notification)
- [ ] Place `iqama.caf` in `assets/audio/`
- [ ] Update `app.json` to include iOS sound

### Task 1.3: Add Source Audio for Expo
- [x] Place `iqama.mp3` in `assets/audio/` (using haya_al_salat.mp3)

---

## Phase 2: Settings & Storage

### Task 2.1: Create useIqamaSettings Hook
- [x] Create `client/hooks/useIqamaSettings.ts`
- [x] Define `IqamaSettings` interface
- [x] Implement AsyncStorage load/save
- [x] Export toggle functions and state

### Task 2.2: Define Storage Schema
- [x] Use key `@iqama_settings`
- [x] Default: disabled, 15 min delay, all prayers enabled

---

## Phase 3: Android Native Module

### Task 3.1: Update PrayerAlarmModule.java
- [x] Add `scheduleIqamaAlarms(prayers, delayMinutes, promise)` method
- [x] Add `cancelIqamaAlarms(promise)` method
- [x] Use unique request codes for iqama alarms (offset by 1000)

### Task 3.2: Update PrayerAlarmReceiver.java
- [x] Add `alarm_type` intent extra handling
- [x] Add `playIqamaSound()` method using `R.raw.iqama`
- [x] Add `showIqamaNotification()` with stop action
- [x] Handle `STOP_IQAMA` action

### Task 3.3: Update NotificationSoundModule.java
- [x] Add `createIqamaNotificationChannel()` method
- [x] Channel ID: `iqama-reminder`
- [x] Set iqama sound for channel

---

## Phase 4: React Native Integration

### Task 4.1: Update useNotifications.ts
- [x] Import `IqamaSettings` type
- [x] Add `scheduleIqamaNotifications()` function
- [x] Call iqama scheduling when prayer times update
- [x] Handle iqama cancellation when disabled

### Task 4.2: Bridge Native Module
- [x] Ensure `PrayerAlarmModule.scheduleIqamaAlarms` is callable
- [x] Add TypeScript types for native module methods

---

## Phase 5: UI Implementation

### Task 5.1: Update NotificationSettingsModal Props
- [x] Add `iqamaSettings: IqamaSettings` prop
- [x] Add `onToggleIqama: (enabled: boolean) => void`
- [x] Add `onChangeIqamaDelay: (minutes: number) => void`
- [x] Add `onTogglePrayerIqama: (prayer, enabled) => void`

### Task 5.2: Add Iqama UI Section
- [x] Add Iqama master toggle with icon
- [x] Add delay picker (5, 10, 15, 20, 25, 30 min options)
- [x] Add per-prayer iqama toggles (collapsible)
- [x] Style consistently with existing sections

### Task 5.3: Update Parent Components
- [x] Pass iqama props from SettingsScreen
- [x] Connect useIqamaSettings hook
- [x] Update PrayerTimesScreen to schedule iqama

---

## Phase 6: Testing

### Task 6.1: Manual Testing
- [ ] Test iqama plays at prayer time + delay
- [ ] Test iqama works when app closed (Android)
- [ ] Test stop button on notification
- [ ] Test per-prayer toggles
- [ ] Test delay changes persist
- [ ] Test iqama disabled state

### Task 6.2: Edge Cases
- [ ] Test iqama doesn't overlap with next prayer's azan
- [ ] Test rapid enable/disable doesn't cause issues
- [ ] Test device reboot reschedules iqama alarms

---

## Estimated Effort

| Phase | Effort | Status |
|-------|--------|--------|
| Phase 1: Audio Setup | 30 min | ✅ Done |
| Phase 2: Settings Hook | 45 min | ✅ Done |
| Phase 3: Android Native | 1.5 hours | ✅ Done |
| Phase 4: RN Integration | 45 min | ✅ Done |
| Phase 5: UI | 1 hour | ✅ Done |
| Phase 6: Testing | 1 hour | ⏳ Pending |
| **Total** | **~5.5 hours** |

---

## Files Changed

### New Files
- `client/hooks/useIqamaSettings.ts` - Iqama settings hook
- `android/app/src/main/res/raw/iqama.mp3` - Iqama sound file

### Modified Files
- `android/app/src/main/java/com/sakinahtime/app/PrayerAlarmModule.java` - Added iqama scheduling
- `android/app/src/main/java/com/sakinahtime/app/PrayerAlarmReceiver.java` - Added iqama playback
- `android/app/src/main/java/com/sakinahtime/app/NotificationSoundModule.java` - Added iqama channel
- `client/hooks/useNotifications.ts` - Added iqama scheduling integration
- `client/components/NotificationSettingsModal.tsx` - Added iqama UI section
- `client/screens/SettingsScreen.tsx` - Connected iqama settings
- `client/screens/PrayerTimesScreen.tsx` - Schedule iqama with prayer times
