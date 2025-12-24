# Azan Playback Fix - Full Duration & Volume

## Problem
- Azan was cutting off after 10-15 seconds
- Volume was too low

## Root Cause
1. **BroadcastReceiver Timeout**: Android limits BroadcastReceivers to ~10 seconds of execution time
2. **Background Process Killing**: Android aggressively kills background processes to save battery
3. **Low Volume**: Default volume was set to 0.8 instead of maximum

## Solution Implemented

### 1. Created Foreground Service (`AzanService.java`)
- Foreground services can run indefinitely and won't be killed by Android
- Displays persistent notification during playback
- Properly manages MediaPlayer lifecycle
- Uses `FOREGROUND_SERVICE_MEDIA_PLAYBACK` type for Android 14+

### 2. Updated Volume Settings
- Changed default volume from 0.8 to 1.0 (maximum)
- Set MediaPlayer volume to maximum: `mediaPlayer.setVolume(1.0f, 1.0f)`
- Uses `STREAM_ALARM` to ensure playback even in silent mode

### 3. Proper Wake Lock Management
- Acquires `PARTIAL_WAKE_LOCK` for 10 minutes
- Keeps device awake during full azan playback
- Properly releases wake lock when playback completes

### 4. Updated Architecture
**Before:**
```
PrayerAlarmReceiver → MediaPlayer (dies after 10s)
```

**After:**
```
PrayerAlarmReceiver → AzanService (Foreground) → MediaPlayer (runs until completion)
```

## Files Modified

### New Files
- `android/app/src/main/java/com/sakinahtime/app/AzanService.java` - Foreground service for azan playback

### Modified Files
1. `client/hooks/useAzan.ts` - Changed default volume to 1.0
2. `android/app/src/main/java/com/sakinahtime/app/PrayerAlarmReceiver.java` - Now starts AzanService instead of playing directly
3. `android/app/src/main/java/com/sakinahtime/app/PrayerAlarmModule.java` - Updated stopAzan to stop service
4. `android/app/src/main/AndroidManifest.xml` - Added service registration and permissions

## Permissions Added
- `FOREGROUND_SERVICE_MEDIA_PLAYBACK` - Required for Android 14+ media playback in foreground service

## Testing Instructions
1. Rebuild the app: `eas build --platform android --profile preview --clear-cache`
2. Install on device
3. Enable azan in Settings
4. Schedule a test prayer notification
5. Verify:
   - Azan plays at full volume
   - Azan plays for complete duration (full audio file)
   - Notification shows "Playing azan..." with stop button
   - Tapping notification stops azan immediately

## Technical Details

### MediaPlayer Configuration
```java
AudioAttributes audioAttributes = new AudioAttributes.Builder()
    .setUsage(AudioAttributes.USAGE_ALARM)
    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
    .build();
mediaPlayer.setAudioAttributes(audioAttributes);
mediaPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);
mediaPlayer.setVolume(1.0f, 1.0f); // Maximum volume
mediaPlayer.setWakeMode(context, PowerManager.PARTIAL_WAKE_LOCK);
```

### Foreground Service Benefits
1. **No Time Limit**: Can run as long as needed
2. **Protected from Killing**: Android won't kill foreground services
3. **User Visibility**: Shows notification so user knows what's happening
4. **Proper Lifecycle**: Can be stopped cleanly via notification or app

## Expected Behavior
- ✅ Azan plays at maximum volume
- ✅ Azan plays for full duration (entire audio file)
- ✅ Works even when device is locked
- ✅ Works even in silent/vibrate mode
- ✅ Can be stopped via notification
- ✅ Automatically stops when complete
- ✅ Releases resources properly
