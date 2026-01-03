# Design: Android Home Screen Widgets

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        React Native App                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  WidgetDataService (TypeScript)                              │    │
│  │  - Writes prayer times, hijri date, verse to SharedPrefs     │    │
│  │  - Called when data changes in app                           │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  WidgetBridge (Native Module)                                │    │
│  │  - Exposes updateWidgetData() to JS                          │    │
│  │  - Triggers widget refresh via broadcast                     │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SharedPreferences                                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  sakinahtime_widget_data                                     │    │
│  │  - prayer_times_json                                         │    │
│  │  - hijri_date_json                                           │    │
│  │  - daily_verse_json                                          │    │
│  │  - tasbeeh_count                                             │    │
│  │  - location_name                                             │    │
│  │  - last_updated                                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Android Widgets (Kotlin)                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │ PrayerTimes  │ │  HijriDate   │ │  DailyVerse  │ │   Tasbeeh   │ │
│  │   Widget     │ │   Widget     │ │    Widget    │ │   Widget    │ │
│  │              │ │              │ │              │ │             │ │
│  │ Provider     │ │ Provider     │ │ Provider     │ │ Provider    │ │
│  │ RemoteViews  │ │ RemoteViews  │ │ RemoteViews  │ │ RemoteViews │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Structures

### SharedPreferences Keys
```kotlin
object WidgetPrefs {
    const val PREFS_NAME = "sakinahtime_widget_data"
    
    // Prayer Times
    const val KEY_PRAYER_TIMES = "prayer_times_json"
    const val KEY_LOCATION_NAME = "location_name"
    const val KEY_CALCULATION_METHOD = "calculation_method"
    
    // Hijri Date
    const val KEY_HIJRI_DATE = "hijri_date_json"
    const val KEY_TODAY_EVENT = "today_event"
    const val KEY_TODAY_FASTING = "today_fasting"
    
    // Daily Verse
    const val KEY_DAILY_VERSE = "daily_verse_json"
    const val KEY_VERSE_DATE = "verse_date"
    
    // Tasbeeh
    const val KEY_TASBEEH_COUNT = "tasbeeh_count"
    const val KEY_TASBEEH_TARGET = "tasbeeh_target"
    const val KEY_TASBEEH_DHIKR = "tasbeeh_dhikr"
    
    // Meta
    const val KEY_LAST_UPDATED = "last_updated"
    const val KEY_THEME = "widget_theme" // "light", "dark", "system"
}
```

### Prayer Times JSON Structure
```json
{
  "fajr": "05:23",
  "sunrise": "06:45",
  "dhuhr": "12:30",
  "asr": "15:45",
  "maghrib": "18:15",
  "isha": "19:45",
  "date": "2026-01-03",
  "timezone": "Asia/Riyadh"
}
```

### Hijri Date JSON Structure
```json
{
  "day": 3,
  "month": 7,
  "year": 1447,
  "monthNameAr": "رجب",
  "monthNameEn": "Rajab",
  "gregorianDate": "2026-01-03",
  "moonPhase": "waxing_crescent",
  "moonIcon": "🌒"
}
```

### Daily Verse JSON Structure
```json
{
  "surah": 2,
  "ayah": 255,
  "surahNameAr": "البقرة",
  "surahNameEn": "Al-Baqarah",
  "textAr": "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...",
  "textEn": "Allah - there is no deity except Him, the Ever-Living...",
  "verseKey": "2:255"
}
```

## Widget Layouts

### 1. Prayer Times Widget

#### Small (2x2) - Next Prayer Only
```
┌─────────────────────┐
│  🕌 Next Prayer     │
│  ━━━━━━━━━━━━━━━━━  │
│  DHUHR              │
│  12:30 PM           │
│  in 2h 15m          │
└─────────────────────┘
```

#### Medium (4x2) - All Prayers
```
┌─────────────────────────────────────────┐
│  🕌 Prayer Times          📍 Riyadh     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Fajr    Dhuhr   Asr    Maghrib  Isha   │
│  5:23    12:30   3:45   6:15     7:45   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ▶ Next: Dhuhr in 2h 15m               │
└─────────────────────────────────────────┘
```

### 2. Hijri Date Widget

#### Small (2x2)
```
┌─────────────────────┐
│  🌒                 │
│  3 Rajab            │
│  1447 AH            │
│  ━━━━━━━━━━━━━━━━━  │
│  Jan 3, 2026        │
└─────────────────────┘
```

#### Medium (4x1)
```
┌─────────────────────────────────────────┐
│  🌒  3 Rajab 1447  |  ٣ رجب ١٤٤٧       │
│      Saturday, January 3, 2026          │
└─────────────────────────────────────────┘
```

### 3. Daily Verse Widget

#### Medium (4x2)
```
┌─────────────────────────────────────────┐
│  📖 Verse of the Day                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ        │
│  Allah - there is no deity except Him   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Al-Baqarah 2:255                   🔄  │
└─────────────────────────────────────────┘
```

### 4. Tasbeeh Counter Widget

#### Small (2x2)
```
┌─────────────────────┐
│  📿 Tasbeeh         │
│  ━━━━━━━━━━━━━━━━━  │
│       33            │
│      / 99           │
│  ━━━━━━━━━━━━━━━━━  │
│  [  TAP TO COUNT  ] │
└─────────────────────┘
```

## File Structure

```
android/app/src/main/
├── java/com/sakinahtime/app/
│   ├── widget/
│   │   ├── WidgetPrefs.kt              # SharedPreferences constants
│   │   ├── WidgetDataManager.kt        # Read/write widget data
│   │   ├── WidgetUpdateService.kt      # Background update service
│   │   │
│   │   ├── prayer/
│   │   │   ├── PrayerTimesWidget.kt    # AppWidgetProvider
│   │   │   └── PrayerTimesHelper.kt    # Time calculations
│   │   │
│   │   ├── hijri/
│   │   │   └── HijriDateWidget.kt      # AppWidgetProvider
│   │   │
│   │   ├── verse/
│   │   │   └── DailyVerseWidget.kt     # AppWidgetProvider
│   │   │
│   │   └── tasbeeh/
│   │       └── TasbeehWidget.kt        # AppWidgetProvider
│   │
│   └── bridge/
│       ├── WidgetBridgeModule.kt       # React Native bridge
│       └── WidgetBridgePackage.kt      # Package registration
│
├── res/
│   ├── layout/
│   │   ├── widget_prayer_times_small.xml
│   │   ├── widget_prayer_times_medium.xml
│   │   ├── widget_hijri_date_small.xml
│   │   ├── widget_hijri_date_medium.xml
│   │   ├── widget_daily_verse.xml
│   │   └── widget_tasbeeh.xml
│   │
│   ├── drawable/
│   │   ├── widget_background_light.xml
│   │   ├── widget_background_dark.xml
│   │   └── widget_preview_*.png
│   │
│   ├── values/
│   │   ├── widget_colors.xml
│   │   └── widget_strings.xml
│   │
│   └── xml/
│       ├── widget_prayer_times_info.xml
│       ├── widget_hijri_date_info.xml
│       ├── widget_daily_verse_info.xml
│       └── widget_tasbeeh_info.xml
│
└── AndroidManifest.xml  # Widget receivers registration
```

## React Native Bridge

### WidgetBridgeModule.kt
```kotlin
class WidgetBridgeModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {
    
    override fun getName() = "WidgetBridge"
    
    @ReactMethod
    fun updatePrayerTimes(prayerTimesJson: String, locationName: String) {
        // Save to SharedPreferences
        // Trigger widget update broadcast
    }
    
    @ReactMethod
    fun updateHijriDate(hijriDateJson: String, eventName: String?, fastingType: String?) {
        // Save to SharedPreferences
        // Trigger widget update broadcast
    }
    
    @ReactMethod
    fun updateDailyVerse(verseJson: String) {
        // Save to SharedPreferences
        // Trigger widget update broadcast
    }
    
    @ReactMethod
    fun updateTasbeehCount(count: Int, target: Int, dhikr: String) {
        // Save to SharedPreferences
        // Trigger widget update broadcast
    }
    
    @ReactMethod
    fun refreshAllWidgets() {
        // Send broadcast to all widget providers
    }
}
```

### TypeScript Service
```typescript
// client/services/WidgetDataService.ts
import { NativeModules, Platform } from 'react-native';

const { WidgetBridge } = NativeModules;

class WidgetDataService {
  private isAndroid = Platform.OS === 'android';
  
  async updatePrayerTimes(timings: PrayerTimes, locationName: string): Promise<void> {
    if (!this.isAndroid || !WidgetBridge) return;
    
    const data = JSON.stringify({
      fajr: timings.Fajr,
      dhuhr: timings.Dhuhr,
      asr: timings.Asr,
      maghrib: timings.Maghrib,
      isha: timings.Isha,
      date: new Date().toISOString().split('T')[0],
    });
    
    await WidgetBridge.updatePrayerTimes(data, locationName);
  }
  
  async updateHijriDate(hijriDate: HijriDate, event?: IslamicEvent, fasting?: FastingDay): Promise<void> {
    if (!this.isAndroid || !WidgetBridge) return;
    // ...
  }
  
  async updateDailyVerse(verse: Verse): Promise<void> {
    if (!this.isAndroid || !WidgetBridge) return;
    // ...
  }
  
  async updateTasbeehCount(count: number, target: number, dhikr: string): Promise<void> {
    if (!this.isAndroid || !WidgetBridge) return;
    // ...
  }
}

export const widgetDataService = new WidgetDataService();
```

## Widget Update Strategy

### Update Triggers
1. **App Launch**: Sync all widget data
2. **Prayer Times Fetch**: Update prayer widget
3. **Date Change**: Update hijri widget (midnight + maghrib)
4. **User Action**: Tasbeeh tap, verse refresh
5. **Periodic**: WorkManager every 15-30 minutes for countdown

### WorkManager Setup
```kotlin
class WidgetUpdateWorker(context: Context, params: WorkerParameters) : 
    CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        // Update prayer countdown
        // Check if date changed
        // Refresh widgets
        return Result.success()
    }
}

// Schedule periodic updates
val updateRequest = PeriodicWorkRequestBuilder<WidgetUpdateWorker>(
    15, TimeUnit.MINUTES
).build()

WorkManager.getInstance(context).enqueueUniquePeriodicWork(
    "widget_update",
    ExistingPeriodicWorkPolicy.KEEP,
    updateRequest
)
```

## Color Scheme

### Light Theme
| Element | Color |
|---------|-------|
| Background | #FFFFFF |
| Card Background | #F3F4F6 |
| Primary Text | #1F2937 |
| Secondary Text | #6B7280 |
| Accent (Green) | #059669 |
| Highlight | #D1FAE5 |

### Dark Theme
| Element | Color |
|---------|-------|
| Background | #1F2937 |
| Card Background | #374151 |
| Primary Text | #F9FAFB |
| Secondary Text | #9CA3AF |
| Accent (Green) | #34D399 |
| Highlight | #064E3B |

## AndroidManifest.xml Additions

```xml
<!-- Prayer Times Widget -->
<receiver
    android:name=".widget.prayer.PrayerTimesWidget"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/widget_prayer_times_info" />
</receiver>

<!-- Hijri Date Widget -->
<receiver
    android:name=".widget.hijri.HijriDateWidget"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/widget_hijri_date_info" />
</receiver>

<!-- Daily Verse Widget -->
<receiver
    android:name=".widget.verse.DailyVerseWidget"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/widget_daily_verse_info" />
</receiver>

<!-- Tasbeeh Widget -->
<receiver
    android:name=".widget.tasbeeh.TasbeehWidget"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
        <action android:name="com.sakinahtime.TASBEEH_INCREMENT" />
        <action android:name="com.sakinahtime.TASBEEH_RESET" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/widget_tasbeeh_info" />
</receiver>
```

## Implementation Order

### Phase 1: Foundation
1. Create WidgetPrefs.kt constants
2. Create WidgetDataManager.kt for SharedPreferences
3. Create WidgetBridgeModule.kt native module
4. Register native module in MainApplication.kt
5. Create WidgetDataService.ts in React Native

### Phase 2: Prayer Times Widget
1. Create widget_prayer_times_info.xml
2. Create widget_prayer_times_small.xml layout
3. Create widget_prayer_times_medium.xml layout
4. Implement PrayerTimesWidget.kt provider
5. Add to AndroidManifest.xml
6. Integrate with usePrayerTimes hook

### Phase 3: Hijri Date Widget
1. Create widget_hijri_date_info.xml
2. Create layouts
3. Implement HijriDateWidget.kt
4. Integrate with useHijriDate hook

### Phase 4: Daily Verse Widget
1. Create widget_daily_verse_info.xml
2. Create layout
3. Implement DailyVerseWidget.kt
4. Create verse selection logic

### Phase 5: Tasbeeh Widget
1. Create widget_tasbeeh_info.xml
2. Create layout
3. Implement TasbeehWidget.kt with click handling
4. Handle increment/reset actions

### Phase 6: Polish
1. Add WorkManager for periodic updates
2. Implement theme support
3. Add widget preview images
4. Test on various Android versions
