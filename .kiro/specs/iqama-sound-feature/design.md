# Iqama Sound Feature - Design Document

## Overview

Add the ability to play "Haya Al Salat" (حي على الصلاة) sound as an Iqama reminder before each prayer time. Users can configure a custom delay (e.g., 10, 15, 20 minutes after Azan) for when the Iqama sound should play.

## User Story

As a Muslim user, I want to receive an Iqama reminder sound after the Azan, so I can be reminded when it's time to start the actual prayer (after completing Sunnah prayers or preparing for congregation).

---

## Architecture

### Current Azan Flow (Reference)
```
Prayer Time → AlarmManager → PrayerAlarmReceiver → Play azan.mp3 → Show Notification
```

### New Iqama Flow
```
Prayer Time + Iqama Delay → AlarmManager → IqamaAlarmReceiver → Play iqama.mp3 → Show Notification
```

---

## Implementation Plan

### Phase 1: Audio File Setup

#### 1.1 Add Iqama Audio Files

**Android:**
- Place `iqama.mp3` in `android/app/src/main/res/raw/iqama.mp3`
- File requirements: MP3 format, reasonable size (< 1MB recommended)

**iOS:**
- Convert to CAF format: `iqama.caf`
- Place in `assets/audio/iqama.caf`
- Requirements: Linear PCM or IMA4 codec, max 30 seconds for notification sounds
- Update `app.json` to include the sound file

#### 1.2 Update app.json
```json
{
  "ios": {
    "sounds": [
      "./assets/audio/azan.caf",
      "./assets/audio/iqama.caf"  // Add this
    ]
  }
}
```

---

### Phase 2: Settings & Storage

#### 2.1 New Settings Interface

```typescript
// client/hooks/useIqamaSettings.ts

export interface IqamaSettings {
  enabled: boolean;
  delayMinutes: number;  // Minutes after Azan (default: 15)
  prayers: {
    Fajr: boolean;
    Dhuhr: boolean;
    Asr: boolean;
    Maghrib: boolean;
    Isha: boolean;
  };
}

const DEFAULT_IQAMA_SETTINGS: IqamaSettings = {
  enabled: false,
  delayMinutes: 15,
  prayers: {
    Fajr: true,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true,
  },
};
```

#### 2.2 Storage Key
```typescript
const IQAMA_SETTINGS_KEY = "@iqama_settings";
```

#### 2.3 Delay Options
Provide preset options for user convenience:
- 5 minutes
- 10 minutes
- 15 minutes (default)
- 20 minutes
- 25 minutes
- 30 minutes
- Custom (1-60 minutes)

---

### Phase 3: Android Native Module Updates

#### 3.1 Update PrayerAlarmModule.java

Add new method to schedule Iqama alarms:

```java
@ReactMethod
public void scheduleIqamaAlarms(ReadableArray prayers, int delayMinutes, Promise promise) {
    // Similar to schedulePrayerAlarms but:
    // 1. Add delayMinutes to each prayer timestamp
    // 2. Use different request codes (e.g., prayerName.hashCode() + 1000)
    // 3. Set intent extra "alarm_type" = "iqama"
}

@ReactMethod
public void cancelIqamaAlarms(Promise promise) {
    // Cancel all iqama-specific alarms
}
```

#### 3.2 Update PrayerAlarmReceiver.java

Modify to handle both Azan and Iqama:

```java
@Override
public void onReceive(Context context, Intent intent) {
    String alarmType = intent.getStringExtra("alarm_type"); // "azan" or "iqama"
    
    if ("iqama".equals(alarmType)) {
        playIqamaSound(context, prayerName);
    } else {
        playAzanSound(context, prayerName);
    }
}

private void playIqamaSound(Context context, String prayerName) {
    // Similar to playAzanSound but use R.raw.iqama
}
```

#### 3.3 Add Iqama Notification Channel

```java
// In NotificationSoundModule.java
private void createIqamaNotificationChannel() {
    NotificationChannel channel = new NotificationChannel(
        "iqama-reminder",
        "Iqama Reminder",
        NotificationManager.IMPORTANCE_HIGH
    );
    channel.setSound(
        Uri.parse("android.resource://" + context.getPackageName() + "/" + R.raw.iqama),
        audioAttributes
    );
    // ... rest of channel setup
}
```

---

### Phase 4: React Native Integration

#### 4.1 New Hook: useIqamaSettings.ts

```typescript
export function useIqamaSettings() {
  const [settings, setSettings] = useState<IqamaSettings>(DEFAULT_IQAMA_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Load/save settings from AsyncStorage
  // Toggle enabled state
  // Update delay minutes
  // Toggle individual prayers
  
  return {
    settings,
    loading,
    toggleIqama,
    setDelayMinutes,
    togglePrayerIqama,
  };
}
```

#### 4.2 Update useNotifications.ts

Add Iqama scheduling alongside Azan:

```typescript
const scheduleIqamaNotifications = useCallback(async (
  timings: PrayerTimes,
  iqamaSettings: IqamaSettings
) => {
  if (!iqamaSettings.enabled) return;
  
  if (Platform.OS === 'android' && PrayerAlarmModule) {
    const prayers = Object.entries(timings)
      .filter(([key]) => iqamaSettings.prayers[key])
      .map(([key, time]) => ({
        name: key,
        timestamp: parseTime(time) + (iqamaSettings.delayMinutes * 60 * 1000),
      }));
    
    await PrayerAlarmModule.scheduleIqamaAlarms(prayers, iqamaSettings.delayMinutes);
  }
}, []);
```

---

### Phase 5: UI Updates

#### 5.1 Update NotificationSettingsModal.tsx

Add new section for Iqama settings:

```tsx
{/* Iqama Sound Section */}
<View style={styles.settingDivider} />

<View style={styles.settingRow}>
  <View style={styles.settingInfo}>
    <Feather name="bell" size={20} color={primaryColor} />
    <View style={styles.settingText}>
      <ThemedText type="body">Iqama Reminder</ThemedText>
      <ThemedText type="small" secondary>
        Play "Haya Al Salat" before prayer
      </ThemedText>
    </View>
  </View>
  <Switch
    value={iqamaSettings.enabled}
    onValueChange={onToggleIqama}
  />
</View>

{/* Iqama Delay Picker */}
{iqamaSettings.enabled && (
  <View style={styles.iqamaDelaySection}>
    <ThemedText type="body">Reminder after Azan</ThemedText>
    <DelayPicker
      value={iqamaSettings.delayMinutes}
      onChange={onChangeIqamaDelay}
      options={[5, 10, 15, 20, 25, 30]}
    />
  </View>
)}

{/* Per-Prayer Iqama Toggles */}
{iqamaSettings.enabled && (
  <View style={styles.prayerIqamaToggles}>
    {PRAYERS.map((prayer) => (
      <PrayerToggleRow
        key={prayer.key}
        prayer={prayer}
        enabled={iqamaSettings.prayers[prayer.key]}
        onToggle={(enabled) => onTogglePrayerIqama(prayer.key, enabled)}
      />
    ))}
  </View>
)}
```

---

## File Changes Summary

### New Files
| File | Purpose |
|------|---------|
| `assets/audio/iqama.mp3` | Iqama sound file (source) |
| `assets/audio/iqama.caf` | iOS version of Iqama sound |
| `android/app/src/main/res/raw/iqama.mp3` | Android raw resource |
| `client/hooks/useIqamaSettings.ts` | Iqama settings hook |

### Modified Files
| File | Changes |
|------|---------|
| `app.json` | Add iOS sound file reference |
| `android/.../PrayerAlarmModule.java` | Add scheduleIqamaAlarms method |
| `android/.../PrayerAlarmReceiver.java` | Handle iqama alarm type |
| `android/.../NotificationSoundModule.java` | Add iqama notification channel |
| `client/hooks/useNotifications.ts` | Add iqama scheduling logic |
| `client/components/NotificationSettingsModal.tsx` | Add iqama UI section |

---

## Testing Checklist

- [ ] Iqama sound plays at correct time (prayer time + delay)
- [ ] Iqama works when app is closed (Android)
- [ ] Iqama notification shows with stop button
- [ ] Per-prayer iqama toggles work correctly
- [ ] Delay setting persists across app restarts
- [ ] Iqama doesn't play if disabled
- [ ] Iqama doesn't interfere with Azan playback
- [ ] iOS notification sound works (foreground)
- [ ] Settings UI is intuitive and accessible

---

## Notes

1. **Audio File**: You'll need to provide the `haya_al_salat.mp3` file. I'll rename it to `iqama.mp3` for consistency.

2. **iOS Limitation**: Like Azan, iOS can only play notification sounds when app is in foreground/minimized due to system restrictions.

3. **Timing**: The Iqama alarm is scheduled as a separate alarm, not dependent on Azan completion. This ensures reliability even if Azan is skipped or stopped early.

4. **Battery**: Using AlarmManager with exact alarms is battery-efficient as it only wakes the device at scheduled times.
