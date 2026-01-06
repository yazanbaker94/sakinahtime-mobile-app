# Design Document: Prayer Log & Statistics

## Overview

This feature provides a comprehensive prayer tracking system that allows users to log their daily prayers, view statistics, maintain streaks, and track Qada (makeup) prayers. The design follows existing patterns from the Quran Progress Tracker feature.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        UI Layer                                  │
├─────────────────────────────────────────────────────────────────┤
│  PrayerTimesScreen    │  PrayerStatsScreen  │  QadaTrackerModal │
│  (status indicators)  │  (statistics view)  │  (qada management)│
└───────────┬───────────┴─────────┬───────────┴─────────┬─────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Hooks Layer                                │
├─────────────────────────────────────────────────────────────────┤
│  usePrayerLog()  │  usePrayerStats()  │  useQadaTracker()       │
└───────────┬──────┴─────────┬──────────┴─────────┬───────────────┘
            │                │                    │
            ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Service Layer                                 │
├─────────────────────────────────────────────────────────────────┤
│              PrayerLogService (singleton)                        │
│  - loadPrayerLog()    - markPrayer()    - updateStreak()        │
│  - getWeeklyStats()   - getMonthlyStats()  - exportData()       │
└───────────┬─────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Storage Layer                                 │
├─────────────────────────────────────────────────────────────────┤
│                    AsyncStorage                                  │
│              @prayer_log_data (JSON)                            │
└─────────────────────────────────────────────────────────────────┘
```

## Data Models

### File: `client/types/prayerLog.ts`

```typescript
/**
 * Prayer Log & Statistics Types
 * Feature: prayer-log-statistics
 */

// Prayer status enum
export type PrayerStatus = 'prayed' | 'missed' | 'late' | 'unmarked';

// Five daily prayers
export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

// Single prayer entry
export interface PrayerEntry {
  status: PrayerStatus;
  markedAt: number | null;      // timestamp when marked
  prayerTime: string;           // original prayer time (HH:MM)
}

// Daily prayer record
export interface DailyPrayerRecord {
  date: string;                 // ISO date (YYYY-MM-DD)
  prayers: Record<PrayerName, PrayerEntry>;
  isPerfectDay: boolean;        // all 5 prayers completed
}

// Streak tracking
export interface PrayerStreakData {
  currentStreak: number;
  longestStreak: number;
  lastPerfectDate: string;      // ISO date of last perfect day
}

// Qada (makeup) prayer counts
export interface QadaCounts {
  Fajr: number;
  Dhuhr: number;
  Asr: number;
  Maghrib: number;
  Isha: number;
}

// Main prayer log data structure
export interface PrayerLogData {
  dailyRecords: Record<string, DailyPrayerRecord>;  // date -> record
  streak: PrayerStreakData;
  qadaCounts: QadaCounts;
  settings: PrayerLogSettings;
  lastUpdated: number;          // timestamp
}

// Settings for prayer log
export interface PrayerLogSettings {
  missedReminderEnabled: boolean;
  missedReminderDelayMinutes: number;  // 15-60
  autoMarkEnabled: boolean;            // auto-mark as unmarked after prayer time
}

// Weekly statistics
export interface WeeklyStats {
  startDate: string;
  endDate: string;
  totalPrayed: number;
  totalMissed: number;
  totalLate: number;
  completionPercentage: number;
  dailyBreakdown: Array<{
    date: string;
    prayedCount: number;
    isPerfectDay: boolean;
  }>;
  bestDay: string | null;
  worstDay: string | null;
}

// Monthly statistics
export interface MonthlyStats {
  month: number;                // 1-12
  year: number;
  totalPrayed: number;
  totalMissed: number;
  totalLate: number;
  completionPercentage: number;
  perfectDays: number;
  calendarData: Record<string, {
    prayedCount: number;
    isPerfectDay: boolean;
  }>;
  prayerBreakdown: Record<PrayerName, {
    prayed: number;
    missed: number;
    late: number;
    percentage: number;
  }>;
}

// Storage key
export const PRAYER_LOG_STORAGE_KEY = '@prayer_log_data';

// Default values
export const DEFAULT_PRAYER_ENTRY: PrayerEntry = {
  status: 'unmarked',
  markedAt: null,
  prayerTime: '',
};

export const DEFAULT_QADA_COUNTS: QadaCounts = {
  Fajr: 0,
  Dhuhr: 0,
  Asr: 0,
  Maghrib: 0,
  Isha: 0,
};

export const DEFAULT_STREAK_DATA: PrayerStreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastPerfectDate: '',
};

export const DEFAULT_PRAYER_LOG_SETTINGS: PrayerLogSettings = {
  missedReminderEnabled: false,
  missedReminderDelayMinutes: 30,
  autoMarkEnabled: true,
};

export const DEFAULT_PRAYER_LOG: PrayerLogData = {
  dailyRecords: {},
  streak: DEFAULT_STREAK_DATA,
  qadaCounts: DEFAULT_QADA_COUNTS,
  settings: DEFAULT_PRAYER_LOG_SETTINGS,
  lastUpdated: 0,
};

export const PRAYER_NAMES: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
```

## Service Layer

### File: `client/services/PrayerLogService.ts`

Core methods:
- `loadPrayerLog(): Promise<PrayerLogData>` - Load from AsyncStorage with validation
- `savePrayerLog(data: PrayerLogData): Promise<void>` - Persist to storage
- `validatePrayerLog(data: unknown): PrayerLogData | null` - Data integrity check
- `markPrayer(date: string, prayer: PrayerName, status: PrayerStatus): Promise<PrayerLogData>` - Mark prayer status
- `getDailyRecord(date: string): DailyPrayerRecord | null` - Get record for date
- `updateStreak(data: PrayerLogData): PrayerStreakData` - Recalculate streak
- `getWeeklyStats(endDate?: string): WeeklyStats` - Calculate weekly statistics
- `getMonthlyStats(month: number, year: number): MonthlyStats` - Calculate monthly statistics
- `incrementQada(prayer: PrayerName): Promise<void>` - Add to qada count
- `decrementQada(prayer: PrayerName): Promise<void>` - Subtract from qada count
- `setQadaCount(prayer: PrayerName, count: number): Promise<void>` - Manual adjustment
- `exportData(): Promise<string>` - Export as JSON
- `clearOldRecords(monthsToKeep: number): Promise<void>` - Cleanup old data

## Hooks Layer

### `usePrayerLog()`
```typescript
interface UsePrayerLogReturn {
  todayRecord: DailyPrayerRecord | null;
  markPrayer: (prayer: PrayerName, status: PrayerStatus) => Promise<void>;
  getPrayerStatus: (prayer: PrayerName) => PrayerStatus;
  isPerfectDay: boolean;
  loading: boolean;
}
```

### `usePrayerStats()`
```typescript
interface UsePrayerStatsReturn {
  streak: PrayerStreakData;
  weeklyStats: WeeklyStats | null;
  monthlyStats: MonthlyStats | null;
  viewMode: 'weekly' | 'monthly';
  setViewMode: (mode: 'weekly' | 'monthly') => void;
  loading: boolean;
}
```

### `useQadaTracker()`
```typescript
interface UseQadaTrackerReturn {
  qadaCounts: QadaCounts;
  totalQada: number;
  logQadaPrayer: (prayer: PrayerName) => Promise<void>;
  adjustQadaCount: (prayer: PrayerName, count: number) => Promise<void>;
  loading: boolean;
}
```

## UI Components

### PrayerTimesScreen Integration
- Add status indicator (checkmark/X/clock icon) next to each prayer
- Tap indicator to cycle: unmarked → prayed → missed → late → unmarked
- Show "Perfect Day" badge when all 5 prayers marked as prayed
- Display current streak in header area

### PrayerStatsScreen (New)
- Tab navigation: Weekly | Monthly
- Streak display card (current + longest)
- Weekly view: 7-day bar chart + completion percentage
- Monthly view: Calendar grid with color-coded days
- Prayer breakdown: which prayers are most/least consistent
- Export button

### QadaTrackerModal (New)
- Display qada count per prayer type
- +/- buttons for manual adjustment
- "Log Qada Prayer" action to decrement count
- Total qada prayers remaining

## Correctness Properties

### P1: Round-Trip Persistence
```
∀ data: PrayerLogData,
  savePrayerLog(data) → loadPrayerLog() = data
```

### P2: Streak Calculation
```
∀ records: DailyPrayerRecord[],
  currentStreak = count of consecutive perfect days ending today/yesterday
  longestStreak ≥ currentStreak (always)
```

### P3: Qada Counter Integrity
```
∀ prayer: PrayerName,
  markPrayer(date, prayer, 'missed') → qadaCounts[prayer]++
  logQadaPrayer(prayer) → qadaCounts[prayer]-- (if > 0)
  qadaCounts[prayer] ≥ 0 (always)
```

### P4: Statistics Accuracy
```
∀ week: WeeklyStats,
  totalPrayed + totalMissed + totalLate ≤ 35 (7 days × 5 prayers)
  completionPercentage = (totalPrayed / (totalPrayed + totalMissed + totalLate)) × 100
```

### P5: Perfect Day Calculation
```
∀ record: DailyPrayerRecord,
  isPerfectDay = true ⟺ all 5 prayers have status 'prayed'
```

## Error Handling

| Error | Handling |
|-------|----------|
| Storage read failure | Return default data, log error |
| Storage write failure | Retry once, show toast on failure |
| Data corruption | Attempt recovery, notify user, offer reset |
| Invalid date format | Reject operation, log warning |
| Negative qada count | Clamp to 0 |

## Testing Strategy

### Unit Tests
- `PrayerLogService` methods (mark, streak, stats calculations)
- Data validation functions
- Date utility functions

### Integration Tests
- AsyncStorage round-trip
- Hook state management
- Statistics calculation accuracy

### Property-Based Tests
- Streak never decreases when marking prayers as prayed
- Qada counts never go negative
- Statistics percentages always 0-100

## File Structure

```
client/
├── types/
│   └── prayerLog.ts              # Type definitions
├── services/
│   └── PrayerLogService.ts       # Core service
├── hooks/
│   ├── usePrayerLog.ts           # Daily logging hook
│   ├── usePrayerStats.ts         # Statistics hook
│   └── useQadaTracker.ts         # Qada management hook
├── screens/
│   └── PrayerStatsScreen.tsx     # Statistics screen
├── components/
│   ├── PrayerStatusIndicator.tsx # Status toggle component
│   ├── StreakCard.tsx            # Streak display
│   ├── WeeklyChart.tsx           # Weekly bar chart
│   ├── MonthlyCalendar.tsx       # Monthly calendar view
│   └── QadaTrackerModal.tsx      # Qada management modal
└── constants/
    └── prayerLog.ts              # Constants and helpers
```

## Navigation Integration

Add to bottom tab navigator or settings:
- "Prayer Stats" screen accessible from main navigation
- Qada tracker accessible from stats screen or settings
