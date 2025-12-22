# Debug Azan Not Playing Issue

## FIRST: Check These Immediately

1. **Open the app and look at the console logs**
   - When the app opens, you should see:
     ```
     🔍 Checking native modules...
     📱 PrayerAlarmModule: ✅ Available
     🔊 NotificationSoundModule: ✅ Available
     ```
   - If you see `❌ Not available`, the native module wasn't compiled into the APK!

2. **Check alarm volume**
   - Press volume up button
   - Make sure you're adjusting **ALARM** volume (not media or ringtone)
   - Set it to maximum

3. **Check Do Not Disturb**
   - Swipe down from top
   - Make sure DND is OFF

## Get Logs from Your Phone

### Method 1: Using ADB (Recommended)

1. **Enable USB Debugging on your phone**:
   - Settings > About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings > Developer Options
   - Enable "USB Debugging"

2. **Connect phone to computer via USB**

3. **Run this command**:
   ```bash
   adb logcat -c && adb logcat | findstr /i "PrayerAlarm MediaPlayer azan SakinahTime"
   ```

4. **Trigger a notification** (change phone time or use test notification)

5. **Copy ALL the logs** and send them

### Method 2: Using Logcat App (If no computer)

1. Install "Logcat Reader" from Play Store
2. Open the app
3. Search for "PrayerAlarm"
4. Trigger a notification
5. Screenshot the logs

## What We're Looking For

### If Native Module is Working:
```
PrayerAlarmModule: Scheduled alarm for Maghrib at [timestamp]
PrayerAlarmReceiver: Prayer alarm received!
PrayerAlarmReceiver: Prayer: Maghrib, Play Azan: true
PrayerAlarmReceiver: Playing azan sound...
PrayerAlarmReceiver: Azan playback started
```

### If Native Module is NOT Working:
```
(No logs from PrayerAlarmModule or PrayerAlarmReceiver)
```

### If MediaPlayer Fails:
```
PrayerAlarmReceiver: Prayer alarm received!
PrayerAlarmReceiver: Playing azan sound...
MediaPlayer: error (1, -2147483648)
```

## Quick Test

1. **Open the app**
2. **Enable notifications and azan**
3. **Click "Test Notification" button**
4. **Keep the app OPEN**
5. **Wait 10 seconds**
6. **Does azan play?**

If YES when app is open but NO when closed:
- Native module is not being called
- Check logs for "PrayerAlarmModule"

If NO even when app is open:
- Sound file might be missing
- MediaPlayer error
- Check logs for "MediaPlayer" errors

## Check if Native Module Exists

Run this command:
```bash
adb logcat -c && adb logcat | findstr /i "MainApplication"
```

Then open the app. Look for:
```
MainApplication: Registering PrayerAlarmPackage
```

If you DON'T see this, the native module wasn't compiled into the APK.

## Check if Sound File Exists in APK

```bash
adb shell pm path com.sakinahtime.app
```

This will show the APK path, like:
```
package:/data/app/com.sakinahtime.app-xxx/base.apk
```

Then check if azan.mp3 is inside:
```bash
adb shell "unzip -l /data/app/com.sakinahtime.app-xxx/base.apk | findstr azan"
```

Should show:
```
res/raw/azan.mp3
```

## Most Likely Issues

### 1. Native Module Not Called
**Symptom**: No logs from PrayerAlarmModule or PrayerAlarmReceiver
**Cause**: JavaScript code not calling native module
**Fix**: Check if `PrayerAlarmModule` is available in logs

### 2. Sound File Missing
**Symptom**: Logs show "Playing azan sound..." but no sound
**Cause**: azan.mp3 not copied to res/raw
**Fix**: Check build logs for "✅ Copied azan.mp3"

### 3. MediaPlayer Error
**Symptom**: Logs show MediaPlayer error
**Cause**: File format issue or permission issue
**Fix**: Check exact error code

### 4. Alarm Not Scheduled
**Symptom**: No logs at all when prayer time arrives
**Cause**: AlarmManager not scheduling or permission denied
**Fix**: Check SCHEDULE_EXACT_ALARM permission

## Send Me These

1. **Full logs** from when you trigger a notification
2. **Screenshot** of Settings > Apps > SakinahTime > Permissions
3. **Answer**: Does azan play when app is OPEN?
4. **Answer**: Is alarm volume turned up?
5. **Answer**: Is DND off?
