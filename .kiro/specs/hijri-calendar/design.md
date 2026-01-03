# Design: Hijri Calendar Integration

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    HijriCalendarScreen                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              HijriDateHeader                         │    │
│  │  [Moon Icon] 15 Ramadan 1446 | March 15, 2025       │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              EventCountdown                          │    │
│  │  🌙 Eid al-Fitr in 15 days                          │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              CalendarGrid                            │    │
│  │  < Ramadan 1446 >                                   │    │
│  │  [S] [M] [T] [W] [T] [F] [S]                        │    │
│  │  [1] [2] [3] [4] [5] [6] [7]                        │    │
│  │  ...                                                 │    │
│  │  Legend: 🟡 Fasting  🟢 Event  ⚪ White Day         │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              UpcomingEvents                          │    │
│  │  • Laylat al-Qadr (27 Ramadan) - 12 days           │    │
│  │  • Eid al-Fitr (1 Shawwal) - 15 days               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Data Structures

### HijriDate
```typescript
interface HijriDate {
  day: number;        // 1-30
  month: number;      // 1-12
  year: number;       // e.g., 1446
  monthNameAr: string;
  monthNameEn: string;
}
```

### IslamicEvent
```typescript
interface IslamicEvent {
  id: string;
  nameEn: string;
  nameAr: string;
  month: number;      // Hijri month (1-12)
  day: number;        // Hijri day
  duration?: number;  // Days (e.g., Ramadan = 29/30)
  type: 'major' | 'minor' | 'fasting';
  description: string;
  color: string;
}
```

### FastingDay
```typescript
interface FastingDay {
  type: 'monday' | 'thursday' | 'white_day' | 'ashura' | 'arafah' | 'shawwal';
  hijriDate: HijriDate;
  gregorianDate: Date;
  label: string;
}
```

### MoonPhase
```typescript
interface MoonPhase {
  phase: 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous' | 
         'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';
  illumination: number;  // 0-100%
  dayOfMonth: number;
  icon: string;
}
```

## Services

### HijriDateService
Pure calculation service for Hijri date conversions.

```typescript
class HijriDateService {
  // Convert Gregorian to Hijri
  toHijri(date: Date): HijriDate;
  
  // Convert Hijri to Gregorian
  toGregorian(hijriDate: HijriDate): Date;
  
  // Get current Hijri date (considers Maghrib transition)
  getCurrentHijriDate(maghribTime?: Date): HijriDate;
  
  // Get days in Hijri month
  getDaysInMonth(month: number, year: number): number;
  
  // Format Hijri date
  formatHijriDate(date: HijriDate, format: 'short' | 'long'): string;
  
  // Get month name
  getMonthName(month: number, lang: 'ar' | 'en'): string;
}
```

### IslamicEventsService
Manages Islamic events and calculations.

```typescript
class IslamicEventsService {
  // Get all events for a Hijri month
  getEventsForMonth(month: number, year: number): IslamicEvent[];
  
  // Get upcoming events from today
  getUpcomingEvents(limit?: number): IslamicEvent[];
  
  // Get next major event
  getNextMajorEvent(): { event: IslamicEvent; daysUntil: number };
  
  // Check if date is an event
  isEventDay(date: HijriDate): IslamicEvent | null;
}
```

### FastingDayService
Identifies and tracks fasting days.

```typescript
class FastingDayService {
  // Check if date is a fasting day
  isFastingDay(date: HijriDate, gregorianDate: Date): FastingDay | null;
  
  // Get fasting days for a month
  getFastingDaysForMonth(month: number, year: number): FastingDay[];
  
  // Get upcoming fasting days
  getUpcomingFastingDays(limit?: number): FastingDay[];
  
  // Check if White Day (13, 14, 15)
  isWhiteDay(day: number): boolean;
  
  // Check if Monday or Thursday
  isSunnahFastingDay(gregorianDate: Date): boolean;
}
```

### MoonPhaseService
Calculates moon phases.

```typescript
class MoonPhaseService {
  // Get current moon phase
  getCurrentPhase(): MoonPhase;
  
  // Get phase for specific date
  getPhaseForDate(date: Date): MoonPhase;
  
  // Get moon icon for phase
  getMoonIcon(phase: MoonPhase['phase']): string;
}
```

## Components

### HijriDateHeader
Displays current Hijri date with moon phase.

Props:
- `showGregorian?: boolean`
- `showMoonPhase?: boolean`
- `compact?: boolean`

### CalendarGrid
Monthly calendar view with events and fasting days.

Props:
- `month: number`
- `year: number`
- `onDayPress?: (date: HijriDate) => void`
- `onMonthChange?: (month: number, year: number) => void`

### EventCountdown
Shows countdown to next event.

Props:
- `event: IslamicEvent`
- `daysUntil: number`

### UpcomingEventsList
List of upcoming events.

Props:
- `events: IslamicEvent[]`
- `limit?: number`

### MoonPhaseIndicator
Visual moon phase display.

Props:
- `phase: MoonPhase`
- `size?: 'small' | 'medium' | 'large'`

### FastingDayBadge
Badge indicating fasting day type.

Props:
- `type: FastingDay['type']`

## Hooks

### useHijriDate
```typescript
function useHijriDate(): {
  hijriDate: HijriDate;
  gregorianDate: Date;
  formattedDate: string;
  moonPhase: MoonPhase;
}
```

### useIslamicEvents
```typescript
function useIslamicEvents(): {
  upcomingEvents: IslamicEvent[];
  nextMajorEvent: { event: IslamicEvent; daysUntil: number } | null;
  eventsThisMonth: IslamicEvent[];
}
```

### useFastingDays
```typescript
function useFastingDays(): {
  todayFasting: FastingDay | null;
  upcomingFastingDays: FastingDay[];
  fastingDaysThisMonth: FastingDay[];
}
```

## Islamic Events Data

### Major Events (Fixed Hijri Dates)
| Event | Date | Type |
|-------|------|------|
| Islamic New Year | 1 Muharram | major |
| Ashura | 10 Muharram | major/fasting |
| Mawlid al-Nabi | 12 Rabi al-Awwal | major |
| Isra wal Miraj | 27 Rajab | major |
| Start of Ramadan | 1 Ramadan | major |
| Laylat al-Qadr | 27 Ramadan | major |
| Eid al-Fitr | 1 Shawwal | major |
| Day of Arafah | 9 Dhul Hijjah | major/fasting |
| Eid al-Adha | 10 Dhul Hijjah | major |

### Hijri Month Names
| # | Arabic | English |
|---|--------|---------|
| 1 | محرم | Muharram |
| 2 | صفر | Safar |
| 3 | ربيع الأول | Rabi al-Awwal |
| 4 | ربيع الثاني | Rabi al-Thani |
| 5 | جمادى الأولى | Jumada al-Awwal |
| 6 | جمادى الآخرة | Jumada al-Thani |
| 7 | رجب | Rajab |
| 8 | شعبان | Shaban |
| 9 | رمضان | Ramadan |
| 10 | شوال | Shawwal |
| 11 | ذو القعدة | Dhul Qadah |
| 12 | ذو الحجة | Dhul Hijjah |

## Calendar Calculation Algorithm

Using the Umm al-Qura calendar (Saudi Arabia official calendar) algorithm:
1. Based on astronomical calculations
2. Accounts for lunar cycle (~29.53 days)
3. Months alternate between 29 and 30 days
4. Year has 354 or 355 days

## Color Scheme

| Type | Light Mode | Dark Mode |
|------|------------|-----------|
| Current Day | #059669 | #34D399 |
| Event Day | #D4AF37 | #F59E0B |
| Fasting Day | #3B82F6 | #60A5FA |
| White Day | #8B5CF6 | #A78BFA |
| Weekend | rgba(0,0,0,0.05) | rgba(255,255,255,0.05) |

## File Structure

```
client/
├── screens/
│   └── HijriCalendarScreen.tsx
├── components/
│   ├── HijriDateHeader.tsx
│   ├── CalendarGrid.tsx
│   ├── EventCountdown.tsx
│   ├── UpcomingEventsList.tsx
│   ├── MoonPhaseIndicator.tsx
│   └── FastingDayBadge.tsx
├── services/
│   ├── HijriDateService.ts
│   ├── IslamicEventsService.ts
│   ├── FastingDayService.ts
│   └── MoonPhaseService.ts
├── hooks/
│   ├── useHijriDate.ts
│   ├── useIslamicEvents.ts
│   └── useFastingDays.ts
├── constants/
│   └── islamic-calendar.ts
└── types/
    └── hijri.ts
```
