# Design Document: Dhikr Floating Overlay

## Overview

This document outlines the technical architecture for implementing floating overlay dhikr reminders on Android with iOS notification fallback.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Native Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  DhikrOverlaySettings.tsx    │    DhikrOverlayService.ts       │
│  - UI for configuration      │    - Bridge to native module     │
│  - Category toggles          │    - Event listeners             │
│  - Interval selection        │    - Permission handling         │
│  - Quiet hours config        │    - Theme color passing         │
└──────────────────────────────┴──────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Native Bridge Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  DhikrOverlayModule.java (Android)  │  DhikrOverlayModule.m    │
│  - Expo module interface            │  - iOS notification API   │
│  - Permission requests              │  - UNUserNotification     │
│  - Service control                  │  - Scheduling             │
└─────────────────────────────────────┴───────────────────────────┘
                    │                              │
                    ▼                              ▼
┌───────────────────────────────┐    ┌────────────────────────────┐
│     Android Native Layer      │    │    iOS Native Layer        │
├───────────────────────────────┤    ├────────────────────────────┤
│  DhikrForegroundService.java  │    │  Standard iOS Notifications│
│  - AlarmManager scheduling    │    │  - Local notification      │
│  - Persistent notification    │    │  - Rich content support    │
│  - Boot receiver              │    │                            │
├───────────────────────────────┤    └────────────────────────────┘
│  DhikrOverlayView.java        │
│  - WindowManager overlay      │
│  - Custom styled view         │
│  - Touch/drag handling        │
│  - Animation controller       │
└───────────────────────────────┘
```

## Component Design

### 1. React Native Components

#### DhikrOverlaySettings.tsx
Location: `client/screens/DhikrOverlaySettingsScreen.tsx`

```typescript
interface DhikrOverlaySettings {
  enabled: boolean;
  intervalMinutes: 30 | 60 | 120 | 180 | 240;
  categories: {
    tasbih: boolean;      // SubhanAllah
    tahmid: boolean;      // Alhamdulillah
    takbir: boolean;      // Allahu Akbar
    salawat: boolean;     // Blessings on Prophet
    istighfar: boolean;   // Astaghfirullah
    duas: boolean;        // Short duas
  };
  quietHours: {
    enabled: boolean;
    startHour: number;    // 0-23
    endHour: number;      // 0-23
  };
  skipDuringPrayer: boolean;
  autoDismissSeconds: number;  // 5-30
}
```

#### DhikrOverlayService.ts
Location: `client/services/DhikrOverlayService.ts`

Responsibilities:
- Initialize native module
- Pass theme colors to native layer
- Handle permission flow
- Manage settings persistence
- Listen for overlay events

### 2. Android Native Module

#### File Structure
```
android/app/src/main/java/com/sakinahtime/dhikr/
├── DhikrOverlayModule.java       # Expo module bridge
├── DhikrOverlayPackage.java      # Package registration
├── DhikrForegroundService.java   # Background service
├── DhikrOverlayView.java         # Overlay UI
├── DhikrAlarmReceiver.java       # Alarm broadcast receiver
├── DhikrBootReceiver.java        # Boot completed receiver
└── DhikrContentProvider.java     # Dhikr data management
```

#### DhikrOverlayModule.java
Exposed methods:
- `checkOverlayPermission()` → Promise<boolean>
- `requestOverlayPermission()` → void (opens settings)
- `startService(config: ReadableMap)` → Promise<void>
- `stopService()` → Promise<void>
- `showOverlayNow(dhikrData: ReadableMap)` → void (for testing)
- `isServiceRunning()` → Promise<boolean>

Events emitted:
- `onOverlayShown` - { dhikrId: string }
- `onOverlayDismissed` - { dhikrId: string, method: 'tap' | 'swipe' | 'timeout' }
- `onServiceStarted`
- `onServiceStopped`

#### DhikrForegroundService.java
```java
public class DhikrForegroundService extends Service {
    // Persistent notification channel
    private static final String CHANNEL_ID = "dhikr_service";
    
    // AlarmManager for scheduling
    private void scheduleNextReminder(long intervalMs) {
        AlarmManager alarmManager = getSystemService(AlarmManager.class);
        // Use setExactAndAllowWhileIdle for reliability
    }
    
    // Show overlay when alarm fires
    private void showDhikrOverlay(DhikrContent dhikr) {
        // Add view to WindowManager with TYPE_APPLICATION_OVERLAY
    }
}
```

#### DhikrOverlayView.java
Custom View with:
- Rounded card background (theme-aware)
- Arabic text (large, centered)
- Transliteration (medium)
- English meaning (small)
- Source reference (caption)
- Touch listener for dismiss
- Drag listener for repositioning
- Fade in/out animations

### 3. Expo Config Plugin

Location: `plugins/withDhikrOverlay.js`

Responsibilities:
- Add SYSTEM_ALERT_WINDOW permission to AndroidManifest.xml
- Add FOREGROUND_SERVICE permission
- Add RECEIVE_BOOT_COMPLETED permission
- Register BroadcastReceivers
- Register ForegroundService

```javascript
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withDhikrOverlay(config) {
  config = withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;
    
    // Add permissions
    manifest['uses-permission'].push(
      { $: { 'android:name': 'android.permission.SYSTEM_ALERT_WINDOW' } },
      { $: { 'android:name': 'android.permission.FOREGROUND_SERVICE' } },
      { $: { 'android:name': 'android.permission.RECEIVE_BOOT_COMPLETED' } }
    );
    
    // Register service and receivers...
    return config;
  });
  
  return config;
};
```

### 4. Dhikr Content Data

Location: `client/data/dhikrContent.ts`

```typescript
interface DhikrItem {
  id: string;
  category: 'tasbih' | 'tahmid' | 'takbir' | 'salawat' | 'istighfar' | 'dua';
  arabic: string;
  transliteration: string;
  meaning: string;
  source?: string;  // Quran reference or Hadith
  virtue?: string;  // Reward/benefit mentioned
}

export const dhikrContent: DhikrItem[] = [
  {
    id: 'tasbih-1',
    category: 'tasbih',
    arabic: 'سُبْحَانَ اللهِ',
    transliteration: 'SubhanAllah',
    meaning: 'Glory be to Allah',
    source: 'Muslim 2137',
    virtue: 'A palm tree is planted in Paradise'
  },
  // ... 50+ items
];
```

### 5. iOS Fallback

Uses `expo-notifications` for local notifications:

```typescript
async function scheduleIOSDhikrNotification(dhikr: DhikrItem, intervalMinutes: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: dhikr.transliteration,
      body: `${dhikr.arabic}\n${dhikr.meaning}`,
      data: { dhikrId: dhikr.id },
    },
    trigger: {
      seconds: intervalMinutes * 60,
      repeats: true,
    },
  });
}
```

## Data Flow

### Enabling Feature
```
User enables feature in Settings
        │
        ▼
Check SYSTEM_ALERT_WINDOW permission
        │
        ├── Not granted → Show explanation → Open system settings
        │                                           │
        │                                           ▼
        │                              User grants permission
        │                                           │
        └── Granted ◄───────────────────────────────┘
        │
        ▼
Save settings to AsyncStorage
        │
        ▼
Call DhikrOverlayModule.startService(config)
        │
        ▼
Android: Start ForegroundService
iOS: Schedule notifications
```

### Showing Overlay (Android)
```
AlarmManager fires at scheduled time
        │
        ▼
DhikrAlarmReceiver.onReceive()
        │
        ▼
Check DND mode and quiet hours
        │
        ├── Should skip → Reschedule next alarm
        │
        └── Should show
        │
        ▼
Select random dhikr (avoiding recent)
        │
        ▼
Create DhikrOverlayView with theme colors
        │
        ▼
Add to WindowManager (TYPE_APPLICATION_OVERLAY)
        │
        ▼
Start auto-dismiss timer
        │
        ▼
Emit 'onOverlayShown' event
```

## Theme Integration

The overlay respects the app's current theme:

```java
public class DhikrOverlayView extends FrameLayout {
    public void setThemeColors(String primaryColor, String backgroundColor, 
                               String textColor, String textSecondaryColor) {
        cardBackground.setBackgroundColor(Color.parseColor(backgroundColor));
        arabicText.setTextColor(Color.parseColor(textColor));
        transliterationText.setTextColor(Color.parseColor(primaryColor));
        meaningText.setTextColor(Color.parseColor(textSecondaryColor));
    }
}
```

React Native passes theme colors when starting service:
```typescript
DhikrOverlayModule.startService({
  ...settings,
  themeColors: {
    primary: theme.primary,
    background: theme.cardBackground,
    text: theme.text,
    textSecondary: theme.textSecondary,
  }
});
```

## Battery Optimization

1. **Efficient Scheduling**: Use `AlarmManager.setExactAndAllowWhileIdle()` with batched wake-ups
2. **Minimal Service**: ForegroundService only holds AlarmManager reference, no continuous work
3. **Quick Overlay**: View creation is lightweight, dismissed quickly
4. **No Network**: All dhikr content is bundled, no network calls

## Security Considerations

1. **Permission Justification**: Clear explanation of why overlay permission is needed
2. **User Control**: Easy toggle to disable feature completely
3. **No Data Collection**: Dhikr shown/dismissed events are local only
4. **Respect System Settings**: Honor DND mode and battery saver

## Testing Strategy

1. **Unit Tests**: Dhikr selection algorithm, quiet hours logic
2. **Integration Tests**: Native module bridge communication
3. **Manual Testing**: 
   - Permission flow on various Android versions
   - Overlay appearance over different apps
   - Service persistence after reboot
   - Battery impact measurement
