# Ramadan Mode - Design Document

## Overview

Ramadan Mode is a comprehensive feature set that activates during the holy month of Ramadan, providing Muslims with specialized tools for worship, fasting, and spiritual growth.

---

## Feature Summary

| Feature | Description | Priority |
|---------|-------------|----------|
| Suhoor/Iftar Times | Automatic calculation with notifications | P0 |
| Daily Quran Schedule | 30-day Khatm (completion) planner | P0 |
| Taraweeh Tracker | Track nightly Taraweeh prayers | P1 |
| Charity Tracker | Log Sadaqah and Zakat contributions | P1 |
| Laylatul Qadr Countdown | Last 10 nights countdown & reminders | P1 |
| Ramadan Dashboard | Unified view of all Ramadan features | P0 |

---

## Architecture

### New Files Structure

```
client/
├── contexts/
│   └── RamadanContext.tsx          # Global Ramadan state
├── services/
│   └── RamadanService.ts           # Ramadan calculations & storage
├── hooks/
│   ├── useRamadanMode.ts           # Main Ramadan hook
│   ├── useSuhoorIftar.ts           # Suhoor/Iftar times
│   ├── useQuranSchedule.ts         # Daily reading schedule
│   ├── useTaraweehTracker.ts       # Taraweeh tracking
│   ├── useCharityTracker.ts        # Sadaqah/Zakat logging
│   └── useLaylatalQadr.ts          # Last 10 nights
├── screens/
│   ├── RamadanDashboardScreen.tsx  # Main Ramadan hub
│   ├── QuranScheduleScreen.tsx     # Daily reading plan
│   ├── TaraweehTrackerScreen.tsx   # Taraweeh log
│   └── CharityTrackerScreen.tsx    # Charity log
├── components/
│   ├── ramadan/
│   │   ├── SuhoorIftarCard.tsx     # Countdown card
│   │   ├── QuranProgressCard.tsx   # Reading progress
│   │   ├── TaraweehCard.tsx        # Tonight's Taraweeh
│   │   ├── CharityCard.tsx         # Charity summary
│   │   ├── LaylatalQadrBanner.tsx  # Last 10 nights alert
│   │   └── RamadanCountdown.tsx    # Days remaining
└── types/
    └── ramadan.ts                  # Type definitions
```

---

## 1. Suhoor/Iftar Times with Notifications

### Data Model

```typescript
// types/ramadan.ts
interface SuhoorIftarTimes {
  date: Date;
  hijriDay: number;
  suhoorEnd: string;      // Same as Fajr time
  iftarTime: string;      // Same as Maghrib time
  suhoorNotified: boolean;
  iftarNotified: boolean;
}

interface SuhoorIftarSettings {
  suhoorReminderMinutes: number;  // Default: 30 min before
  iftarReminderMinutes: number;   // Default: 15 min before
  suhoorEnabled: boolean;
  iftarEnabled: boolean;
  soundEnabled: boolean;
}
```

### Hook: `useSuhoorIftar.ts`

```typescript
export function useSuhoorIftar() {
  // Leverages existing usePrayerTimes hook
  const { data: prayerData } = usePrayerTimes(lat, lng, method);
  
  return {
    suhoorEnd: prayerData?.timings?.Fajr,      // Suhoor ends at Fajr
    iftarTime: prayerData?.timings?.Maghrib,   // Iftar at Maghrib
    timeUntilSuhoor: calculateCountdown(suhoorEnd),
    timeUntilIftar: calculateCountdown(iftarTime),
    isSuhoorTime: isWithinWindow(suhoorEnd, 60), // 1 hour window
    isIftarTime: isWithinWindow(iftarTime, 30),
    settings,
    updateSettings,
    scheduleNotifications,
  };
}
```

### Notifications

| Notification | Trigger | Message |
|--------------|---------|---------|
| Suhoor Reminder | 30 min before Fajr | "🌙 Suhoor time ending soon - {time} remaining" |
| Suhoor End | At Fajr | "🌅 Suhoor has ended - May your fast be accepted" |
| Iftar Reminder | 15 min before Maghrib | "🌙 Iftar in {time} - Prepare to break your fast" |
| Iftar Time | At Maghrib | "🌙 Iftar time! Bismillah - Break your fast" |

### UI Component: `SuhoorIftarCard.tsx`

```
┌─────────────────────────────────────────────┐
│  🌙 RAMADAN DAY 15                          │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐    ┌─────────────┐        │
│  │   SUHOOR    │    │    IFTAR    │        │
│  │   Ends at   │    │   Begins    │        │
│  │   04:32 AM  │    │   06:45 PM  │        │
│  │             │    │             │        │
│  │  ⏱ 2h 15m  │    │  ⏱ 8h 30m  │        │
│  └─────────────┘    └─────────────┘        │
│                                             │
│  [🔔 Notifications: ON]                     │
└─────────────────────────────────────────────┘
```

---

## 2. Daily Quran Reading Schedule

### Data Model

```typescript
interface QuranSchedule {
  type: 'standard' | 'custom';
  startDate: Date;
  targetDate: Date;           // End of Ramadan
  dailyPages: number;         // ~20 pages/day for 30-day completion
  currentDay: number;
  completedDays: DayProgress[];
}

interface DayProgress {
  day: number;
  date: Date;
  juzNumber: number;          // 1-30
  startPage: number;
  endPage: number;
  pagesRead: number;
  completed: boolean;
  completedAt?: Date;
}

interface QuranScheduleSettings {
  reminderEnabled: boolean;
  reminderTime: string;       // e.g., "21:00" after Isha
  notifyOnMissed: boolean;
}
```

### Schedule Calculation

```typescript
// Standard 30-day Khatm schedule
const QURAN_TOTAL_PAGES = 604;
const RAMADAN_DAYS = 30;
const PAGES_PER_DAY = Math.ceil(QURAN_TOTAL_PAGES / RAMADAN_DAYS); // ~20 pages

function generateSchedule(startDate: Date): DayProgress[] {
  return Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    date: addDays(startDate, i),
    juzNumber: i + 1,
    startPage: i * 20 + 1,
    endPage: Math.min((i + 1) * 20, 604),
    pagesRead: 0,
    completed: false,
  }));
}
```

### Hook: `useQuranSchedule.ts`

```typescript
export function useQuranSchedule() {
  return {
    schedule: QuranSchedule,
    todayReading: DayProgress,
    progress: {
      daysCompleted: number,
      totalDays: number,
      pagesRead: number,
      totalPages: number,
      percentComplete: number,
      onTrack: boolean,
    },
    markDayComplete: (day: number) => void,
    updatePagesRead: (day: number, pages: number) => void,
    resetSchedule: () => void,
  };
}
```

### UI: `QuranScheduleScreen.tsx`

```
┌─────────────────────────────────────────────┐
│  📖 QURAN COMPLETION TRACKER                │
├─────────────────────────────────────────────┤
│                                             │
│  Progress: ████████░░░░░░░░ 50%             │
│  302 / 604 pages                            │
│                                             │
├─────────────────────────────────────────────┤
│  TODAY'S READING - Day 15                   │
│  ┌─────────────────────────────────────┐   │
│  │  Juz 15: Al-Isra - Al-Kahf          │   │
│  │  Pages 281-300 (20 pages)           │   │
│  │                                      │   │
│  │  [Open in Mushaf]  [Mark Complete]  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  SCHEDULE                                   │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  │ ✓1 │ ✓2 │ ✓3 │ ...│ 15 │ 16 │ ... │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘
└─────────────────────────────────────────────┘
```

---

## 3. Taraweeh Prayer Tracker

### Data Model

```typescript
interface TaraweehLog {
  date: Date;
  hijriDay: number;
  rakaat: number;           // 8 or 20
  completed: boolean;
  location: 'mosque' | 'home';
  notes?: string;
  juzRecited?: number;      // Which Juz was recited
}

interface TaraweehStats {
  totalNights: number;
  nightsCompleted: number;
  streakCurrent: number;
  streakBest: number;
  mosqueNights: number;
  homeNights: number;
}
```

### Hook: `useTaraweehTracker.ts`

```typescript
export function useTaraweehTracker() {
  return {
    logs: TaraweehLog[],
    todayLog: TaraweehLog | null,
    stats: TaraweehStats,
    logTaraweeh: (log: Partial<TaraweehLog>) => void,
    updateLog: (date: Date, updates: Partial<TaraweehLog>) => void,
    getLogForDate: (date: Date) => TaraweehLog | null,
  };
}
```

### UI: `TaraweehTrackerScreen.tsx`

```
┌─────────────────────────────────────────────┐
│  🕌 TARAWEEH TRACKER                        │
├─────────────────────────────────────────────┤
│                                             │
│  TONIGHT - Day 15                           │
│  ┌─────────────────────────────────────┐   │
│  │  ○ Not logged yet                    │   │
│  │                                      │   │
│  │  Rakaat: [8] [20]                   │   │
│  │  Location: [🕌 Mosque] [🏠 Home]    │   │
│  │                                      │   │
│  │  [Log Taraweeh]                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  STATS                                      │
│  ┌──────────┬──────────┬──────────┐        │
│  │ 12/15    │ 🔥 5     │ 🕌 8     │        │
│  │ Nights   │ Streak   │ Mosque   │        │
│  └──────────┴──────────┴──────────┘        │
│                                             │
│  CALENDAR VIEW                              │
│  [Calendar grid with ✓ marks]               │
└─────────────────────────────────────────────┘
```

---

## 4. Charity (Sadaqah) Tracker

### Data Model

```typescript
interface CharityEntry {
  id: string;
  date: Date;
  type: 'sadaqah' | 'zakat' | 'fidya' | 'kaffarah' | 'other';
  amount: number;
  currency: string;
  recipient?: string;
  notes?: string;
  isAnonymous: boolean;
}

interface CharityStats {
  totalAmount: number;
  totalEntries: number;
  byType: Record<CharityEntry['type'], number>;
  ramadanTotal: number;
  zakatPaid: boolean;
  zakatAmount?: number;
}

interface ZakatCalculation {
  nisabGold: number;        // Current gold nisab threshold
  nisabSilver: number;      // Current silver nisab threshold
  totalWealth: number;
  zakatDue: number;         // 2.5% of wealth above nisab
  isPaid: boolean;
}
```

### Hook: `useCharityTracker.ts`

```typescript
export function useCharityTracker() {
  return {
    entries: CharityEntry[],
    stats: CharityStats,
    addEntry: (entry: Omit<CharityEntry, 'id'>) => void,
    updateEntry: (id: string, updates: Partial<CharityEntry>) => void,
    deleteEntry: (id: string) => void,
    calculateZakat: (wealth: number) => ZakatCalculation,
    markZakatPaid: (amount: number) => void,
    getRamadanTotal: () => number,
  };
}
```

### UI: `CharityTrackerScreen.tsx`

```
┌─────────────────────────────────────────────┐
│  💝 CHARITY TRACKER                         │
├─────────────────────────────────────────────┤
│                                             │
│  RAMADAN GIVING                             │
│  ┌─────────────────────────────────────┐   │
│  │  Total: $1,250                       │   │
│  │  ████████████░░░░░░░░ 62%           │   │
│  │  of $2,000 goal                      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ZAKAT STATUS                               │
│  ┌─────────────────────────────────────┐   │
│  │  ✓ Zakat Paid: $500                 │   │
│  │  [Calculate Zakat]                   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  RECENT ENTRIES                             │
│  ┌─────────────────────────────────────┐   │
│  │ 📅 Today    Sadaqah    $50          │   │
│  │ 📅 Mar 15   Zakat      $500         │   │
│  │ 📅 Mar 10   Sadaqah    $100         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [+ Add Charity Entry]                      │
└─────────────────────────────────────────────┘
```

---

## 5. Laylatul Qadr Countdown

### Data Model

```typescript
interface LaylatalQadrData {
  isLastTenNights: boolean;
  currentNight: number | null;  // 21, 23, 25, 27, 29
  isOddNight: boolean;
  nightsRemaining: number;
  specialDuas: Dua[];
  ibaadahChecklist: IbaadahItem[];
}

interface IbaadahItem {
  id: string;
  name: string;
  nameAr: string;
  completed: boolean;
  night: number;
}

// Odd nights of last 10 (most likely Laylatul Qadr)
const LAYLATUL_QADR_NIGHTS = [21, 23, 25, 27, 29];
```

### Hook: `useLaylatalQadr.ts`

```typescript
export function useLaylatalQadr() {
  const { hijriDate } = useHijriDate();
  
  const isRamadan = hijriDate.month === 9;
  const isLastTenNights = isRamadan && hijriDate.day >= 21;
  const isOddNight = LAYLATUL_QADR_NIGHTS.includes(hijriDate.day);
  
  return {
    isLastTenNights,
    isOddNight,
    currentNight: isLastTenNights ? hijriDate.day : null,
    nightsRemaining: isRamadan ? 30 - hijriDate.day : null,
    daysUntilLastTen: isRamadan && hijriDate.day < 21 ? 21 - hijriDate.day : 0,
    specialDuas: getLaylatulQadrDuas(),
    ibaadahChecklist,
    toggleIbaadah: (id: string) => void,
  };
}
```

### UI: `LaylatalQadrBanner.tsx`

```
┌─────────────────────────────────────────────┐
│  ✨ LAYLATUL QADR - THE NIGHT OF POWER ✨   │
├─────────────────────────────────────────────┤
│                                             │
│  🌙 Tonight is the 27th Night               │
│  One of the most likely nights!             │
│                                             │
│  "The Night of Power is better than         │
│   a thousand months" - Quran 97:3           │
│                                             │
│  TONIGHT'S IBAADAH                          │
│  ☑ Pray Taraweeh                           │
│  ☑ Read Quran                              │
│  ☐ Make special dua                        │
│  ☐ Give charity                            │
│  ☐ Pray Tahajjud                           │
│                                             │
│  [View Special Duas]                        │
└─────────────────────────────────────────────┘
```

---

## 6. Ramadan Dashboard

### Main Screen: `RamadanDashboardScreen.tsx`

```
┌─────────────────────────────────────────────┐
│  🌙 RAMADAN MUBARAK                         │
│  Day 15 of 30                               │
├─────────────────────────────────────────────┤
│                                             │
│  [SuhoorIftarCard - Countdown to Iftar]     │
│                                             │
│  [LaylatalQadrBanner - if last 10 nights]   │
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ 📖 QURAN     │  │ 🕌 TARAWEEH  │        │
│  │ 50% done    │  │ 12/15 nights │        │
│  │ Juz 15 today│  │ 🔥 5 streak  │        │
│  └──────────────┘  └──────────────┘        │
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ 💝 CHARITY   │  │ 📿 DHIKR     │        │
│  │ $1,250 given│  │ Daily Azkar  │        │
│  │ Zakat: ✓    │  │ [Start]      │        │
│  └──────────────┘  └──────────────┘        │
│                                             │
│  UPCOMING                                   │
│  • Iftar in 3h 45m                         │
│  • Laylatul Qadr in 6 days                 │
│  • Eid al-Fitr in 15 days                  │
└─────────────────────────────────────────────┘
```

---

## 7. Ramadan Context & Service

### `RamadanContext.tsx`

```typescript
interface RamadanState {
  isRamadan: boolean;
  currentDay: number;
  daysRemaining: number;
  isLastTenNights: boolean;
  ramadanStartDate: Date;
  ramadanEndDate: Date;
}

interface RamadanContextValue extends RamadanState {
  suhoorIftar: ReturnType<typeof useSuhoorIftar>;
  quranSchedule: ReturnType<typeof useQuranSchedule>;
  taraweehTracker: ReturnType<typeof useTaraweehTracker>;
  charityTracker: ReturnType<typeof useCharityTracker>;
  laylatalQadr: ReturnType<typeof useLaylatalQadr>;
}
```

### `RamadanService.ts`

```typescript
class RamadanService {
  // Detect if current date is in Ramadan
  isRamadan(): boolean {
    const hijri = hijriDateService.getCurrentHijriDate();
    return hijri.month === 9; // Ramadan is month 9
  }
  
  // Get Ramadan dates for current/upcoming year
  getRamadanDates(year?: number): { start: Date; end: Date } {
    // Calculate based on Hijri calendar
  }
  
  // Get current Ramadan day (1-30)
  getCurrentRamadanDay(): number | null {
    if (!this.isRamadan()) return null;
    return hijriDateService.getCurrentHijriDate().day;
  }
  
  // Storage keys
  STORAGE_KEYS = {
    QURAN_SCHEDULE: '@ramadan_quran_schedule',
    TARAWEEH_LOGS: '@ramadan_taraweeh_logs',
    CHARITY_ENTRIES: '@ramadan_charity_entries',
    SETTINGS: '@ramadan_settings',
  };
}
```

---

## 8. Navigation Integration

### Add to `RootStackNavigator.tsx`

```typescript
// Add to RootStackParamList
export type RootStackParamList = {
  // ... existing routes
  RamadanDashboard: undefined;
  QuranSchedule: undefined;
  TaraweehTracker: undefined;
  CharityTracker: undefined;
};

// Add screens
<Stack.Screen name="RamadanDashboard" component={RamadanDashboardScreen} />
<Stack.Screen name="QuranSchedule" component={QuranScheduleScreen} />
<Stack.Screen name="TaraweehTracker" component={TaraweehTrackerScreen} />
<Stack.Screen name="CharityTracker" component={CharityTrackerScreen} />
```

### Conditional Tab/Banner

During Ramadan, show a prominent entry point:
- Add "Ramadan" tab to bottom navigation, OR
- Show persistent banner on Prayer Times screen

---

## 9. Notifications Summary

| Notification | Channel | Timing | Sound |
|--------------|---------|--------|-------|
| Suhoor Reminder | ramadan-suhoor | 30 min before Fajr | Soft chime |
| Suhoor End | ramadan-suhoor | At Fajr | None |
| Iftar Reminder | ramadan-iftar | 15 min before Maghrib | Soft chime |
| Iftar Time | ramadan-iftar | At Maghrib | Celebration |
| Quran Reminder | ramadan-quran | User-set time | Soft chime |
| Taraweeh Reminder | ramadan-taraweeh | After Isha | Soft chime |
| Laylatul Qadr | ramadan-laylatul-qadr | Odd nights, after Maghrib | Special |

---

## 10. Implementation Phases

### Phase 1 (MVP)
- [ ] RamadanService with detection logic
- [ ] RamadanContext provider
- [ ] SuhoorIftarCard with countdown
- [ ] Basic notifications for Suhoor/Iftar
- [ ] RamadanDashboardScreen (basic)

### Phase 2
- [ ] QuranSchedule hook and screen
- [ ] Daily reading notifications
- [ ] Integration with existing Mushaf

### Phase 3
- [ ] TaraweehTracker hook and screen
- [ ] CharityTracker hook and screen
- [ ] Zakat calculator

### Phase 4
- [ ] LaylatalQadr features
- [ ] Ibaadah checklist
- [ ] Special duas collection
- [ ] Polish and animations

---

## 11. Integration Points

### Existing Services to Leverage
- `HijriDateService` - Ramadan detection, day calculation
- `usePrayerTimes` - Suhoor (Fajr) and Iftar (Maghrib) times
- `useNotifications` - Notification scheduling
- `FastingNotificationService` - Notification patterns
- `IslamicEventsService` - Eid detection

### Existing Components to Reuse
- `ThemedText`, `ThemedView` - Consistent styling
- `StreakCard` - For Taraweeh streaks
- `CalendarGrid` - For schedule visualization
- `ProgressCalculator` - For Quran progress

---

## 12. Data Persistence

All Ramadan data stored via AsyncStorage:

```typescript
const STORAGE_KEYS = {
  RAMADAN_SETTINGS: '@ramadan_settings',
  QURAN_SCHEDULE: '@ramadan_quran_schedule_2024',  // Year-specific
  TARAWEEH_LOGS: '@ramadan_taraweeh_2024',
  CHARITY_ENTRIES: '@ramadan_charity_2024',
  IBAADAH_CHECKLIST: '@ramadan_ibaadah_2024',
};
```

Data is year-specific to allow fresh start each Ramadan while preserving historical data.

---

## 13. Testing Considerations

- Mock Hijri date to test Ramadan detection
- Test notification scheduling edge cases
- Test timezone handling for Suhoor/Iftar
- Test data persistence across app restarts
- Test Ramadan mode activation/deactivation

---

## Summary

This Ramadan Mode design provides a comprehensive spiritual companion for Muslims during the holy month, integrating seamlessly with the existing SakinahTime architecture while adding meaningful features for fasting, prayer, Quran reading, and charity tracking.
