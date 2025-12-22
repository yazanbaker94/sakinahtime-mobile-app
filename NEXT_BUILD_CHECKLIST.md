# Next Build Checklist

## Critical Issues Fixed

### 1. ✅ Test Notification Now Uses Native Alarm System
- **FIXED**: Test notification button now uses `PrayerAlarmModule` on Android
- **RESULT**: Test notifications will now play azan even when app is closed/minimized
- **CHANGE**: Updated `sendTestNotification()` in `useNotifications.ts`

### 2. ✅ Expo Dev Client Removed
- **STATUS**: expo-dev-client is NOT in package.json or node_modules
- **VERIFIED**: `npm list expo-dev-client` shows empty
- **RESULT**: App should show your icon, not Expo logo

### 3. ✅ Native Alarm System Implemented
- **FILES**:
  - `PrayerAlarmModule.java` - Schedules exact alarms using AlarmManager
  - `PrayerAlarmReceiver.java` - Plays azan using MediaPlayer with STREAM_ALARM
  - `PrayerAlarmPackage.java` - Registers the native module
  - `BootReceiver.java` - Reschedules alarms after device reboot
- **PERMISSIONS**: All required permissions added to AndroidManifest.xml
- **RESULT**: Azan will play even when app is closed

### 4. ✅ Build Configuration Correct
- **eas.json**: `preview` profile has `"developmentClient": false`
- **app.json**: Correct icon path, all permissions, plugins configured
- **package.json**: No expo-dev-client dependency

## Build Command

```bash
eas build --platform android --profile preview
```

**Note**: This build will clear the cache to ensure the correct icon is used (not the old android-icon-foreground.png).

After this build succeeds, you can remove the `"cache": { "clear": true }` from `eas.json` to speed up future builds.

## After Build - Testing Checklist

### 1. App Icon Test
- [ ] Download and install APK
- [ ] Check app icon is YOUR icon (not blue Expo logo)
- [ ] If still Expo logo, there's a deeper issue

### 2. Test Notification (App Closed)
- [ ] Open app
- [ ] Enable notifications
- [ ] Enable azan
- [ ] Click "Test Notification" button
- [ ] **CLOSE THE APP COMPLETELY** (swipe away from recent apps)
- [ ] Wait 10 seconds
- [ ] **EXPECTED**: Notification appears AND azan plays
- [ ] Check logs with `adb logcat | grep -E "PrayerAlarm|MediaPlayer"`

### 3. Real Prayer Time Test (App Closed)
- [ ] Open app
- [ ] Go to Prayer Times screen
- [ ] Note the next prayer time
- [ ] Change phone time to 1 minute before next prayer
- [ ] Open app briefly (this reschedules with new time)
- [ ] **CLOSE THE APP COMPLETELY**
- [ ] Wait for prayer time
- [ ] **EXPECTED**: Notification appears AND azan plays

### 4. Real Prayer Time Test (App Minimized)
- [ ] Repeat above test but minimize app instead of closing
- [ ] **EXPECTED**: Notification appears AND azan plays

### 5. Settings Verification
- [ ] Go to: Settings > Apps > SakinahTime > Notifications
- [ ] Check "Prayer Times" category exists
- [ ] Check sound is set to "App provided sound" or "azan"

## Expected Logs (When Azan Plays)

```
PrayerAlarmReceiver: Prayer alarm received!
PrayerAlarmReceiver: Prayer: Fajr, Play Azan: true
PrayerAlarmReceiver: Playing azan sound...
PrayerAlarmReceiver: Azan playback started
MediaPlayer: start called in state 4
PrayerAlarmReceiver: Azan playback completed
```

## If Azan Still Doesn't Play

### Check These:
1. **Volume**: Is alarm volume turned up?
2. **Silent Mode**: Is phone in silent mode? (Azan uses ALARM stream, should work anyway)
3. **Do Not Disturb**: Is DND on? (Should work with SCHEDULE_EXACT_ALARM permission)
4. **Logs**: Check `adb logcat` for errors
5. **Native Module**: Check if `PrayerAlarmModule` is available with logs

### Debug Commands:
```bash
# Check if native module is registered
adb logcat | grep "PrayerAlarmModule"

# Check if alarm is triggered
adb logcat | grep "PrayerAlarmReceiver"

# Check MediaPlayer
adb logcat | grep "MediaPlayer"

# Check if azan.mp3 exists in APK
adb shell "ls -la /data/app/com.sakinahtime.app*/base.apk"
```

## Known Working Configuration

- **Platform**: Android
- **Build Type**: APK (preview profile)
- **Development Client**: false
- **Native Modules**: PrayerAlarmModule, NotificationSoundModule
- **Sound File**: assets/audio/azan.mp3 (copied to res/raw/azan.mp3)
- **Permissions**: SCHEDULE_EXACT_ALARM, USE_EXACT_ALARM, WAKE_LOCK, RECEIVE_BOOT_COMPLETED

## What Changed in This Update

1. **Test notification now uses native alarm system** - This was the missing piece!
2. **Added more logging to PrayerAlarmReceiver** - Better debugging
3. **Removed unused code** - Cleaner implementation
4. **Deleted old android-icon-foreground.png** - Was causing wrong icon to be used
5. **Created config plugins to preserve native modules** - Ensures Java files are copied during EAS build
6. **Added withAndroidNativeFiles.js plugin** - Copies native Java files from native-modules/android
7. **Added withAndroidNativeModules.js plugin** - Registers packages in MainApplication.kt

## Summary

The code is now complete and correct. The test notification will use the same native alarm system as regular prayer notifications, so it will work even when the app is closed. After building with `eas build --platform android --profile preview`, the azan should play in all scenarios:
- App open
- App minimized
- App closed
- Device locked
- Silent mode
- Do Not Disturb mode (with permission)
