# Design Document: Ramadan Mode

## Overview

Ramadan Mode is a comprehensive feature set that provides Muslims with specialized tools during the holy month of Ramadan. The feature automatically activates when the Hijri calendar indicates Ramadan (month 9) and provides Suhoor/Iftar tracking, Quran reading schedules, Taraweeh prayer logging, charity tracking, and Laylatul Qadr features.

The design leverages existing services (`HijriDateService`, `usePrayerTimes`, notification infrastructure) while introducing new services and components specific to Ramadan functionality.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.tsx                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  RamadanProvider                         │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │              RamadanContext                      │    │   │
│  │  │  - isRamadan, currentDay, daysRemaining         │    │   │
│  │  │  - isLastTenNights, ramadanYear                 │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ RamadanService│    │ Screens       │    │ Components    │
│ - detection   │    │ - Dashboard   │    │ - SuhoorIftar │
│ - storage     │    │ - QuranSched  │    │ - QuranCard   │
│ - calculations│    │ - Taraweeh    │    │ - TaraweehCard│
└───────────────┘    │ - Charity     │    │ - CharityCard │
        │            └───────────────┘    │ - LaylatalQadr│
        ▼                                 └───────────────┘
┌───────────────────────────────────────────────────────────┐
│                    Existing Services                       │
│  HijriDateService │ usePrayerTimes │ useNotifications     │
└───────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### RamadanContext

```typescript
// client/contexts/RamadanContext.tsx

interface RamadanState {
  isRamadan: boolean;
  currentDay: number | null;        // 1-30
  daysRemaining: number | null;
  isLastTenNights: boolean;
  ramadanYear: number | null;       // Hijri year
  ramadanStartDate: Date | null;
  ramadanEndDate: Date | null;
}

interface RamadanContextValue extends RamadanState {
  refreshRamadanState: () => void;
}

export const RamadanContext = React.createContext<RamadanContextValue | null>(null);

export function RamadanProvider({ children }: { children: React.ReactNode }): JSX.Element;
```

### RamadanService

```typescript
// client/services/RamadanService.ts

interface RamadanDates {
  startDate: Date;
  endDate: Date;
  hijriYear: number;
}

class RamadanService {
  // Detection
  isRamadan(): boolean;
  getCurrentRamadanDay(): number | null;
  getDaysRemaining(): number | null;
  isLastTenNights(): boolean;
  getRamadanDates(hijriYear?: number): RamadanDates;
  
  // Storage keys (year-specific)
  getStorageKey(key: string, year: number): string;
  
  // Data management
  clearRamadanData(year: number): Promise<void>;
  exportRamadanData(year: number): Promise<RamadanExportData>;
}

export const ramadanService: RamadanService;
```

### Suhoor/Iftar Hook

```typescript
// client/hooks/useSuhoorIftar.ts

interface SuhoorIftarTimes {
  suhoorEnd: string;              // Fajr time (HH:MM)
  iftarTime: string;              // Maghrib time (HH:MM)
  suhoorEndDate: Date;
  iftarDate: Date;
}

interface SuhoorIftarCountdown {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

interface SuhoorIftarSettings {
  suhoorReminderMinutes: number;  // Default: 30
  iftarReminderMinutes: number;   // Default: 15
  suhoorNotificationEnabled: boolean;
  iftarNotificationEnabled: boolean;
}

interface UseSuhoorIftarReturn {
  times: SuhoorIftarTimes | null;
  suhoorCountdown: SuhoorIftarCountdown;
  iftarCountdown: SuhoorIftarCountdown;
  isSuhoorTime: boolean;          // Within 60 min of Fajr
  isIftarTime: boolean;           // Within 30 min of Maghrib
  isIftarNow: boolean;            // Maghrib has arrived
  settings: SuhoorIftarSettings;
  updateSettings: (settings: Partial<SuhoorIftarSettings>) => Promise<void>;
  scheduleNotifications: () => Promise<void>;
}

export function useSuhoorIftar(): UseSuhoorIftarReturn;
```

### Quran Schedule Hook

```typescript
// client/hooks/useQuranSchedule.ts

interface DayReading {
  day: number;                    // 1-30
  juzNumber: number;              // 1-30
  startPage: number;
  endPage: number;
  surahNames: string[];           // Surahs covered
  pagesTotal: number;
  pagesRead: number;
  completed: boolean;
  completedAt: Date | null;
}

interface QuranSchedule {
  year: number;                   // Hijri year
  startDate: Date;
  readings: DayReading[];
}

interface QuranProgress {
  totalPages: number;             // 604
  pagesRead: number;
  percentComplete: number;
  daysCompleted: number;
  totalDays: number;
  onTrack: boolean;
  daysBehind: number;
}

interface UseQuranScheduleReturn {
  schedule: QuranSchedule | null;
  todayReading: DayReading | null;
  progress: QuranProgress;
  markDayComplete: (day: number) => Promise<void>;
  updatePagesRead: (day: number, pages: number) => Promise<void>;
  resetSchedule: () => Promise<void>;
  navigateToMushaf: (page: number) => void;
}

export function useQuranSchedule(): UseQuranScheduleReturn;
```

### Taraweeh Tracker Hook

```typescript
// client/hooks/useTaraweehTracker.ts

interface TaraweehEntry {
  id: string;
  date: Date;
  hijriDay: number;
  rakaat: 8 | 20;
  location: 'mosque' | 'home';
  notes?: string;
  createdAt: Date;
}

interface TaraweehStats {
  totalNights: number;
  nightsCompleted: number;
  currentStreak: number;
  bestStreak: number;
  mosqueNights: number;
  homeNights: number;
  completionRate: number;
}

interface UseTaraweehTrackerReturn {
  entries: TaraweehEntry[];
  todayEntry: TaraweehEntry | null;
  stats: TaraweehStats;
  logTaraweeh: (entry: Omit<TaraweehEntry, 'id' | 'createdAt'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<TaraweehEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getEntryForDate: (date: Date) => TaraweehEntry | null;
}

export function useTaraweehTracker(): UseTaraweehTrackerReturn;
```

### Charity Tracker Hook

```typescript
// client/hooks/useCharityTracker.ts

type CharityType = 'sadaqah' | 'zakat' | 'fidya' | 'kaffarah' | 'other';

interface CharityEntry {
  id: string;
  date: Date;
  type: CharityType;
  amount: number;
  currency: string;
  recipient?: string;
  notes?: string;
  isAnonymous: boolean;
  createdAt: Date;
}

interface CharityStats {
  totalAmount: number;
  totalEntries: number;
  byType: Record<CharityType, number>;
  ramadanTotal: number;
  zakatPaid: boolean;
  zakatAmount: number;
}

interface CharityGoal {
  amount: number;
  currency: string;
}

interface ZakatCalculation {
  totalWealth: number;
  nisabGold: number;
  nisabSilver: number;
  zakatDue: number;
  meetsNisab: boolean;
}

interface UseCharityTrackerReturn {
  entries: CharityEntry[];
  stats: CharityStats;
  goal: CharityGoal | null;
  goalProgress: number;
  addEntry: (entry: Omit<CharityEntry, 'id' | 'createdAt'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<CharityEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  setGoal: (goal: CharityGoal) => Promise<void>;
  calculateZakat: (wealth: number) => ZakatCalculation;
  markZakatPaid: (amount: number) => Promise<void>;
}

export function useCharityTracker(): UseCharityTrackerReturn;
```

### Laylatul Qadr Hook

```typescript
// client/hooks/useLaylatalQadr.ts

interface IbaadahItem {
  id: string;
  name: string;
  nameAr: string;
  completed: boolean;
}

interface LaylatalQadrDua {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference: string;
}

interface UseLaylatalQadrReturn {
  isLastTenNights: boolean;
  currentNight: number | null;    // 21-30
  isOddNight: boolean;
  nightsRemaining: number;
  daysUntilLastTen: number;
  ibaadahChecklist: IbaadahItem[];
  specialDuas: LaylatalQadrDua[];
  toggleIbaadah: (id: string) => Promise<void>;
  resetTonightChecklist: () => Promise<void>;
}

export function useLaylatalQadr(): UseLaylatalQadrReturn;
```

## Data Models

### Storage Schema

```typescript
// AsyncStorage Keys (year-specific)
const STORAGE_KEYS = {
  RAMADAN_SETTINGS: (year: number) => `@ramadan_${year}_settings`,
  QURAN_SCHEDULE: (year: number) => `@ramadan_${year}_quran_schedule`,
  TARAWEEH_ENTRIES: (year: number) => `@ramadan_${year}_taraweeh`,
  CHARITY_ENTRIES: (year: number) => `@ramadan_${year}_charity`,
  CHARITY_GOAL: (year: number) => `@ramadan_${year}_charity_goal`,
  IBAADAH_CHECKLIST: (year: number) => `@ramadan_${year}_ibaadah`,
  SUHOOR_IFTAR_SETTINGS: '@ramadan_suhoor_iftar_settings',
};
```

### Quran Schedule Generation

```typescript
const QURAN_TOTAL_PAGES = 604;
const RAMADAN_DAYS = 30;
const JUZ_COUNT = 30;

function generateQuranSchedule(startDate: Date, hijriYear: number): QuranSchedule {
  const pagesPerDay = Math.ceil(QURAN_TOTAL_PAGES / RAMADAN_DAYS); // ~20
  
  const readings: DayReading[] = Array.from({ length: RAMADAN_DAYS }, (_, i) => {
    const day = i + 1;
    const startPage = i * pagesPerDay + 1;
    const endPage = Math.min((i + 1) * pagesPerDay, QURAN_TOTAL_PAGES);
    
    return {
      day,
      juzNumber: day,
      startPage,
      endPage,
      surahNames: getSurahsForPages(startPage, endPage),
      pagesTotal: endPage - startPage + 1,
      pagesRead: 0,
      completed: false,
      completedAt: null,
    };
  });
  
  return { year: hijriYear, startDate, readings };
}
```

### Notification Configuration

```typescript
interface RamadanNotificationConfig {
  suhoorReminder: {
    channelId: 'ramadan-suhoor';
    title: '🌙 Suhoor Reminder';
    body: 'Suhoor ends in {minutes} minutes - Time to eat!';
  };
  suhoorEnd: {
    channelId: 'ramadan-suhoor';
    title: '🌅 Suhoor Has Ended';
    body: 'May your fast be accepted. Ramadan Day {day}';
  };
  iftarReminder: {
    channelId: 'ramadan-iftar';
    title: '🌙 Iftar Soon';
    body: 'Iftar in {minutes} minutes - Prepare to break your fast';
  };
  iftarTime: {
    channelId: 'ramadan-iftar';
    title: '🌙 Iftar Time!';
    body: 'Bismillah - Break your fast. Ramadan Day {day}';
  };
  quranReminder: {
    channelId: 'ramadan-quran';
    title: '📖 Daily Quran Reading';
    body: 'Today: Juz {juz} (Pages {start}-{end})';
  };
  laylatalQadr: {
    channelId: 'ramadan-laylatul-qadr';
    title: '✨ Blessed Night';
    body: 'Tonight is the {night}th night - Seek Laylatul Qadr!';
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Ramadan Detection Consistency

*For any* valid Hijri date, if the month equals 9 (Ramadan), then `isRamadan()` SHALL return true, and if the month does not equal 9, then `isRamadan()` SHALL return false.

**Validates: Requirements 1.1, 1.4**

### Property 2: Ramadan Day Calculation Bounds

*For any* date during Ramadan, `getCurrentRamadanDay()` SHALL return a value between 1 and 30 inclusive, equal to the Hijri day of the month.

**Validates: Requirements 1.2**

### Property 3: Days Remaining Calculation

*For any* Ramadan day D (1-30), `getDaysRemaining()` SHALL return exactly (30 - D).

**Validates: Requirements 1.3**

### Property 4: Suhoor Time Equals Fajr

*For any* location and date during Ramadan, the Suhoor end time SHALL equal the Fajr prayer time for that location and date.

**Validates: Requirements 2.1**

### Property 5: Iftar Time Equals Maghrib

*For any* location and date during Ramadan, the Iftar time SHALL equal the Maghrib prayer time for that location and date.

**Validates: Requirements 2.2**

### Property 6: Countdown Accuracy

*For any* target time T and current time C where C < T, the countdown SHALL equal (T - C) in hours, minutes, and seconds.

**Validates: Requirements 2.3, 2.4**

### Property 7: Quran Schedule Coverage

*For any* generated Quran schedule, the sum of all page ranges SHALL equal exactly 604 pages with no gaps or overlaps.

**Validates: Requirements 4.1**

### Property 8: Quran Progress Calculation

*For any* Quran schedule with N completed days and P pages read, the progress percentage SHALL equal (P / 604) * 100.

**Validates: Requirements 4.5**

### Property 9: Taraweeh Streak Calculation

*For any* sequence of Taraweeh entries, the current streak SHALL equal the count of consecutive nights ending with the most recent entry, and the best streak SHALL be greater than or equal to the current streak.

**Validates: Requirements 6.4, 6.6**

### Property 10: Charity Total Calculation

*For any* set of charity entries, the total amount SHALL equal the sum of all entry amounts, and the breakdown by type SHALL sum to the total.

**Validates: Requirements 7.3, 7.5**

### Property 11: Zakat Calculation

*For any* wealth amount W and Nisab threshold N, if W >= N then Zakat due SHALL equal (W * 0.025), otherwise Zakat due SHALL equal 0.

**Validates: Requirements 8.2**

### Property 12: Last Ten Nights Detection

*For any* Ramadan day D, `isLastTenNights()` SHALL return true if and only if D >= 21.

**Validates: Requirements 9.1**

### Property 13: Odd Night Detection

*For any* Ramadan day D in the last 10 nights, `isOddNight` SHALL return true if and only if D is in {21, 23, 25, 27, 29}.

**Validates: Requirements 9.2**

### Property 14: Data Persistence Round-Trip

*For any* Ramadan data object, saving to AsyncStorage and then loading SHALL produce an equivalent object.

**Validates: Requirements 11.1, 11.3**

### Property 15: Year-Specific Storage Isolation

*For any* two different Hijri years Y1 and Y2, data stored for Y1 SHALL NOT affect data stored for Y2.

**Validates: Requirements 11.2, 11.5**

## Error Handling

### Network Errors
- Prayer times API failure: Use cached times if available, show offline indicator
- Fall back to calculated times using location coordinates

### Data Corruption
- Invalid JSON in AsyncStorage: Reset to defaults, log error
- Missing required fields: Apply default values

### Edge Cases
- App opened exactly at Fajr/Maghrib: Handle boundary conditions
- Timezone changes during Ramadan: Recalculate times
- Ramadan starting mid-use: Detect and initialize

### User Errors
- Invalid Zakat wealth input: Validate numeric input, show error message
- Duplicate Taraweeh entry for same day: Warn and offer to update existing

## Testing Strategy

### Unit Tests
- `RamadanService.isRamadan()` with various Hijri dates
- `RamadanService.getCurrentRamadanDay()` boundary cases
- Countdown calculation accuracy
- Quran schedule generation correctness
- Zakat calculation with various inputs
- Streak calculation logic

### Property-Based Tests
Using `fast-check` library (already in project):

1. **Ramadan Detection Property**: Generate random Hijri dates, verify isRamadan matches month === 9
2. **Countdown Property**: Generate random time pairs, verify countdown calculation
3. **Quran Schedule Property**: Generate schedules, verify 604 pages covered
4. **Zakat Property**: Generate random wealth values, verify 2.5% calculation
5. **Streak Property**: Generate random entry sequences, verify streak calculation
6. **Storage Round-Trip Property**: Generate random data, verify save/load equivalence

### Integration Tests
- Full Ramadan flow from detection to dashboard display
- Notification scheduling and triggering
- Navigation from Quran schedule to Mushaf
- Data persistence across app restarts

### Manual Testing
- Visual verification of UI components
- Notification appearance and timing
- Dark/light theme consistency
