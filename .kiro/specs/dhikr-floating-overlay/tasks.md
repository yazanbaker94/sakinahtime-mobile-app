# Implementation Tasks: Dhikr Floating Overlay

## Phase 1: Foundation

### Task 1.1: Create Dhikr Content Data
- [x] Create `client/data/dhikrContent.ts` with 50+ dhikr items
- [x] Include all categories: tasbih, tahmid, takbir, salawat, istighfar, duas
- [x] Add Arabic text, transliteration, English meaning
- [x] Add source references (Quran/Hadith) where applicable
- [x] Add TypeScript types for DhikrItem

### Task 1.2: Create Settings Storage
- [x] Add dhikr overlay settings to AsyncStorage schema
- [x] Create `client/hooks/useDhikrOverlaySettings.ts`
- [x] Implement settings persistence and retrieval
- [x] Add default settings values

## Phase 2: Android Native Module

### Task 2.1: Create Native Module Structure
- [x] Create directory `android/app/src/main/java/com/sakinahtime/app/dhikr/`
- [x] Create `DhikrOverlayModule.java` - Expo module bridge
- [x] Create `DhikrOverlayPackage.java` - Package registration
- [x] Register package in MainApplication

### Task 2.2: Implement Foreground Service
- [x] Create `DhikrForegroundService.java`
- [x] Implement notification channel creation
- [x] Implement persistent notification
- [x] Add AlarmManager scheduling logic
- [x] Handle service lifecycle (start, stop, restart)

### Task 2.3: Implement Overlay View
- [x] Create `DhikrOverlayView.java` custom view
- [x] Design card layout (Arabic, transliteration, meaning)
- [x] Implement theme color support
- [x] Add touch listener for dismiss
- [x] Add drag listener for repositioning
- [x] Implement fade in/out animations
- [x] Add auto-dismiss timer

### Task 2.4: Implement Broadcast Receivers
- [x] Create `DhikrAlarmReceiver.java` for scheduled alarms
- [x] Create `DhikrBootReceiver.java` for device restart
- [x] Implement DND mode checking
- [x] Implement quiet hours logic

### Task 2.5: Create Expo Config Plugin
- [x] Create `plugins/withDhikrOverlay.js`
- [x] Add SYSTEM_ALERT_WINDOW permission
- [x] Add FOREGROUND_SERVICE permission
- [x] Add RECEIVE_BOOT_COMPLETED permission
- [x] Register service in AndroidManifest
- [x] Register receivers in AndroidManifest
- [x] Update `app.json` to include plugin

## Phase 3: React Native Integration

### Task 3.1: Create TypeScript Bridge
- [x] Create `client/services/DhikrOverlayService.ts`
- [x] Define TypeScript interfaces for native module
- [x] Implement permission checking method
- [x] Implement permission request method
- [x] Implement service start/stop methods
- [x] Add event listeners for overlay events

### Task 3.2: Create Settings Screen
- [x] Create `client/screens/DhikrOverlaySettingsScreen.tsx`
- [x] Add master enable/disable toggle
- [x] Add interval selection (30min, 1hr, 2hr, 3hr, 4hr)
- [x] Add category toggles for each dhikr type
- [x] Add quiet hours configuration
- [x] Add auto-dismiss duration selection
- [x] Add preview button to test overlay
- [x] Style with theme colors

### Task 3.3: Permission Flow UI
- [x] Create permission explanation in settings
- [x] Add "Grant Permission" button
- [x] Handle permission denial gracefully

### Task 3.4: Add Navigation
- [x] Add DhikrOverlaySettingsScreen to navigation
- [x] Add entry point in SettingsScreen
- [x] Add appropriate icons and labels

## Phase 4: iOS Fallback

### Task 4.1: iOS Notification Implementation
- [x] Create iOS-specific notification scheduling
- [x] Use expo-notifications for local notifications
- [x] Format notification content (Arabic, transliteration, meaning)
- [x] Implement interval-based scheduling
- [x] Handle notification permissions

### Task 4.2: Platform Detection
- [x] Add Platform.OS checks in service
- [x] Route to appropriate implementation (overlay vs notification)
- [x] Update settings UI to indicate platform differences

## Phase 5: Polish & Testing

### Task 5.1: Theme Integration
- [x] Pass current theme colors to native module
- [x] Overlay colors configured in native view

### Task 5.2: Testing
- [ ] Test permission flow on Android 10, 11, 12, 13, 14
- [ ] Test overlay appearance over various apps
- [ ] Test service persistence after app close
- [ ] Test service restart after device reboot
- [ ] Test quiet hours functionality
- [ ] Test DND mode respect
- [ ] Measure battery impact
- [ ] Test iOS notification fallback

### Task 5.3: Documentation
- [x] Requirements documented
- [x] Design documented
- [x] Tasks documented

---

## Dependencies

- `expo-notifications` (already installed) - for iOS fallback
- No additional npm packages required
- Requires Expo dev client build (not Expo Go)

## Estimated Timeline

- Phase 1: ✅ Complete
- Phase 2: ✅ Complete
- Phase 3: ✅ Complete
- Phase 4: ✅ Complete
- Phase 5: Partially complete (testing pending)

## Files Created

### React Native
- `client/data/dhikrContent.ts` - 50+ dhikr items with categories
- `client/hooks/useDhikrOverlaySettings.ts` - Settings persistence hook
- `client/services/DhikrOverlayService.ts` - Native module bridge
- `client/screens/DhikrOverlaySettingsScreen.tsx` - Settings UI

### Android Native
- `android/app/src/main/java/com/sakinahtime/app/dhikr/DhikrOverlayModule.java`
- `android/app/src/main/java/com/sakinahtime/app/dhikr/DhikrOverlayPackage.java`
- `android/app/src/main/java/com/sakinahtime/app/dhikr/DhikrForegroundService.java`
- `android/app/src/main/java/com/sakinahtime/app/dhikr/DhikrOverlayView.java`
- `android/app/src/main/java/com/sakinahtime/app/dhikr/DhikrAlarmReceiver.java`
- `android/app/src/main/java/com/sakinahtime/app/dhikr/DhikrBootReceiver.java`
- `android/app/src/main/java/com/sakinahtime/app/dhikr/DhikrContentProvider.java`

### Config
- `plugins/withDhikrOverlay.js` - Expo config plugin
- Updated `app.json` - Added plugin reference
- Updated `MainApplication.kt` - Registered native package

### Navigation
- Updated `RootStackNavigator.tsx` - Added screen
- Updated `SettingsScreen.tsx` - Added entry point

## Notes

- This feature requires a development build, not Expo Go
- Android 6.0+ required for SYSTEM_ALERT_WINDOW
- iOS 10+ required for rich notifications
- Feature is disabled by default (opt-in)
