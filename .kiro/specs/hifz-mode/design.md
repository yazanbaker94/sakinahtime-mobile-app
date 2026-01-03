# Design: Quran Memorization Mode (Hifz)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MushafScreen                                 │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  HifzModeToggle                                              │    │
│  │  - Enter/Exit Hifz mode                                      │    │
│  │  - Show Hifz controls when active                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  HifzOverlay (when active)                                   │    │
│  │  - Hide/reveal controls                                      │    │
│  │  - Repeat controls                                           │    │
│  │  - Loop range selector                                       │    │
│  │  - Progress indicator                                        │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  QuranPageView (modified)                                    │    │
│  │  - Render verses with hide/reveal state                      │    │
│  │  - Show memorization status indicators                       │    │
│  │  - Handle tap to reveal                                      │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Services                                     │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐ │
│  │ HifzProgressSvc  │ │ RevisionSchedule │ │ AudioService         │ │
│  │                  │ │ Service          │ │ (extended)           │ │
│  │ - Track progress │ │ - Spaced repet.  │ │ - Repeat controls    │ │
│  │ - Mark memorized │ │ - Due dates      │ │ - Loop range         │ │
│  │ - Get stats      │ │ - Suggestions    │ │ - Speed control      │ │
│  └──────────────────┘ └──────────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      AsyncStorage                                    │
│  - hifz_progress: { verses: {}, pages: {}, surahs: {}, juz: {} }    │
│  - hifz_revision: { lastRevised: {}, nextDue: {} }                  │
│  - hifz_settings: { hideMode, autoHideDelay, repeatCount, ... }     │
│  - hifz_loops: [{ name, startVerse, endVerse }]                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Structures

### Types (client/types/hifz.ts)
```typescript
// Memorization status for a unit (verse, page, surah, juz)
export type MemorizationStatus = 'not_started' | 'in_progress' | 'memorized';

// Hide mode options
export type HideMode = 'all' | 'word_by_word' | 'first_word' | 'last_word';

// Verse key format: "surah:ayah" e.g., "2:255"
export type VerseKey = string;

// Progress data for a single verse
export interface VerseProgress {
  status: MemorizationStatus;
  lastRevised: string | null; // ISO date
  revisionCount: number;
  nextRevisionDue: string | null; // ISO date
}

// Overall progress summary
export interface HifzProgress {
  verses: Record<VerseKey, VerseProgress>;
  totalMemorized: number;
  totalInProgress: number;
  lastUpdated: string;
}

// Hifz mode settings
export interface HifzSettings {
  hideMode: HideMode;
  autoHideDelay: number; // ms, 0 = manual
  repeatCount: number; // 0 = unlimited
  pauseBetweenRepeats: number; // ms
  playbackSpeed: number; // 0.5, 0.75, 1.0
  autoAdvance: boolean;
  showRevisionReminders: boolean;
  dailyRevisionGoal: number; // pages per day
}

// Saved loop range
export interface SavedLoop {
  id: string;
  name: string;
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
  createdAt: string;
}

// Revision schedule entry
export interface RevisionEntry {
  verseKey: VerseKey;
  dueDate: string;
  interval: number; // days
  easeFactor: number; // for spaced repetition
}

// Hifz mode state
export interface HifzModeState {
  isActive: boolean;
  revealedVerses: Set<VerseKey>;
  currentRepeat: number;
  totalRepeats: number;
  loopStart: VerseKey | null;
  loopEnd: VerseKey | null;
  isLooping: boolean;
}
```

### Storage Keys
```typescript
const STORAGE_KEYS = {
  HIFZ_PROGRESS: 'hifz_progress',
  HIFZ_SETTINGS: 'hifz_settings',
  HIFZ_REVISION: 'hifz_revision_schedule',
  HIFZ_SAVED_LOOPS: 'hifz_saved_loops',
};
```

## UI Components

### 1. HifzModeToggle
Floating button to enter/exit Hifz mode.

```
┌─────────┐
│  📖 Hifz │  ← Toggle button (green when active)
└─────────┘
```

### 2. HifzControlPanel
Bottom sheet with all Hifz controls when mode is active.

```
┌─────────────────────────────────────────────────────────────────┐
│  Hifz Mode                                              [X]     │
├─────────────────────────────────────────────────────────────────┤
│  Hide Mode:  [All] [Word] [First] [Last]                        │
│  Auto-hide:  [Off] [2s] [5s] [10s]                              │
├─────────────────────────────────────────────────────────────────┤
│  Repeat:     [1] [3] [5] [10] [∞]     Current: 3/5              │
│  Pause:      [0s] [2s] [5s]                                     │
│  Speed:      [0.5x] [0.75x] [1x]                                │
├─────────────────────────────────────────────────────────────────┤
│  Loop:       [Set Start] [Set End] [Clear]                      │
│              2:255 → 2:260  [▶ Play Loop]                       │
├─────────────────────────────────────────────────────────────────┤
│  Progress:   [Mark Memorized] [Mark In Progress]                │
│              This page: In Progress                             │
└─────────────────────────────────────────────────────────────────┘
```

### 3. HiddenVerseView
Renders a verse in hidden state with tap-to-reveal.

```
┌─────────────────────────────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                        Tap to reveal                            │
└─────────────────────────────────────────────────────────────────┘
```

### 4. MemorizationStatusBadge
Small indicator showing memorization status.

```
○ Not started (gray outline)
◐ In progress (half-filled green)
● Memorized (solid green)
```

### 5. RevisionSuggestionModal
Daily revision suggestions.

```
┌─────────────────────────────────────────────────────────────────┐
│  📅 Today's Revision                                            │
├─────────────────────────────────────────────────────────────────┤
│  Due for review:                                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Al-Baqarah 2:255-260                    Last: 7 days ago │   │
│  │ [Start Revision]                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Al-Fatihah (Full Surah)                Last: 14 days ago │   │
│  │ [Start Revision]                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Daily goal: 2/2 pages ✓                                        │
└─────────────────────────────────────────────────────────────────┘
```

### 6. HifzProgressScreen
Dedicated screen showing overall memorization progress.

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Memorization Progress                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         Verses: 312 / 6,236 (5%)                        │   │
│  │  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │          Pages: 12 / 604 (2%)                           │   │
│  │  █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Juz: 1 / 30 (3%)                              │   │
│  │  █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Memorized Surahs:                                              │
│  ● Al-Fatihah  ● Al-Ikhlas  ● Al-Falaq  ● An-Nas               │
│                                                                 │
│  In Progress:                                                   │
│  ◐ Al-Baqarah (verses 1-20)                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## File Structure

```
client/
├── types/
│   └── hifz.ts                    # Type definitions
├── services/
│   ├── HifzProgressService.ts     # Progress tracking
│   └── RevisionScheduleService.ts # Spaced repetition
├── hooks/
│   ├── useHifzMode.ts             # Hifz mode state management
│   ├── useHifzProgress.ts         # Progress data
│   └── useRevisionSchedule.ts     # Revision suggestions
├── components/
│   └── hifz/
│       ├── HifzModeToggle.tsx     # Enter/exit button
│       ├── HifzControlPanel.tsx   # Main controls
│       ├── HiddenVerseView.tsx    # Hidden text display
│       ├── MemorizationBadge.tsx  # Status indicator
│       ├── RepeatControls.tsx     # Repeat settings
│       ├── LoopRangeSelector.tsx  # Loop controls
│       └── RevisionModal.tsx      # Daily suggestions
├── screens/
│   └── HifzProgressScreen.tsx     # Progress overview
└── constants/
    └── hifz.ts                    # Default settings, intervals
```

## Service Implementations

### HifzProgressService
```typescript
class HifzProgressService {
  // Progress tracking
  async getProgress(): Promise<HifzProgress>;
  async markVerseStatus(verseKey: VerseKey, status: MemorizationStatus): Promise<void>;
  async markPageStatus(page: number, status: MemorizationStatus): Promise<void>;
  async markSurahStatus(surah: number, status: MemorizationStatus): Promise<void>;
  async markJuzStatus(juz: number, status: MemorizationStatus): Promise<void>;
  
  // Statistics
  async getMemorizedCount(): Promise<{ verses: number; pages: number; juz: number }>;
  async getProgressPercentage(): Promise<number>;
  async getMemorizedSurahs(): Promise<number[]>;
  
  // Data management
  async exportProgress(): Promise<string>; // JSON
  async importProgress(data: string): Promise<void>;
  async resetProgress(): Promise<void>;
}
```

### RevisionScheduleService
```typescript
class RevisionScheduleService {
  // Spaced repetition intervals (SM-2 inspired)
  private intervals = [1, 3, 7, 14, 30, 60, 90]; // days
  
  // Schedule management
  async recordRevision(verseKey: VerseKey, quality: number): Promise<void>;
  async getDueRevisions(): Promise<RevisionEntry[]>;
  async getNextRevisionDate(verseKey: VerseKey): Promise<Date>;
  
  // Suggestions
  async getDailySuggestions(limit: number): Promise<RevisionEntry[]>;
  async getOverdueCount(): Promise<number>;
}
```

### AudioService Extensions
```typescript
// Add to existing AudioService
interface RepeatOptions {
  count: number; // 0 = unlimited
  pauseMs: number;
  speed: number;
  onRepeatComplete?: (current: number, total: number) => void;
}

interface LoopOptions {
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
  repeatCount?: number;
}

// New methods
async playWithRepeat(surah: number, ayah: number, options: RepeatOptions): Promise<void>;
async playLoop(options: LoopOptions): Promise<void>;
async setPlaybackSpeed(speed: number): Promise<void>;
stopRepeat(): void;
stopLoop(): void;
```

## Spaced Repetition Algorithm

Simplified SM-2 algorithm:

```typescript
function calculateNextInterval(
  currentInterval: number,
  quality: number // 0-5, where 5 = perfect recall
): { interval: number; easeFactor: number } {
  const minEaseFactor = 1.3;
  let easeFactor = 2.5; // default
  
  if (quality < 3) {
    // Failed recall - reset to beginning
    return { interval: 1, easeFactor: minEaseFactor };
  }
  
  // Adjust ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(minEaseFactor, easeFactor);
  
  // Calculate next interval
  let nextInterval: number;
  if (currentInterval === 0) {
    nextInterval = 1;
  } else if (currentInterval === 1) {
    nextInterval = 3;
  } else {
    nextInterval = Math.round(currentInterval * easeFactor);
  }
  
  return { interval: nextInterval, easeFactor };
}
```

## Integration Points

### MushafScreen Modifications
1. Add HifzModeToggle button to header/toolbar
2. Wrap verse rendering with HifzModeContext
3. Modify verse tap handler to support reveal
4. Add memorization status badges to verses
5. Connect audio player to repeat/loop controls

### Navigation
1. Add HifzProgressScreen to navigation stack
2. Add "Memorization" item to settings/menu
3. Deep link support for revision reminders

### Notifications
1. Daily revision reminder notification
2. Streak maintenance reminder
3. Milestone celebrations (e.g., "You memorized 1 juz!")

## Color Scheme

| Element | Light | Dark |
|---------|-------|------|
| Hifz mode active | #059669 | #34D399 |
| Hidden text bg | #E5E7EB | #374151 |
| Not started | #9CA3AF | #6B7280 |
| In progress | #F59E0B | #FBBF24 |
| Memorized | #10B981 | #34D399 |
| Due for revision | #EF4444 | #F87171 |

## Implementation Order

### Phase 1: Core Hide/Reveal
1. Create types and constants
2. Implement HifzModeToggle
3. Implement HiddenVerseView
4. Add hide mode options
5. Integrate with MushafScreen

### Phase 2: Repeat Controls
1. Extend AudioService with repeat functionality
2. Create RepeatControls component
3. Add playback speed control
4. Implement pause between repeats

### Phase 3: Progress Tracking
1. Implement HifzProgressService
2. Create MemorizationBadge component
3. Add mark memorized UI
4. Create HifzProgressScreen

### Phase 4: Audio Loop
1. Extend AudioService with loop functionality
2. Create LoopRangeSelector component
3. Implement saved loops
4. Add loop presets

### Phase 5: Revision Schedule
1. Implement RevisionScheduleService
2. Create RevisionModal component
3. Add revision notifications
4. Implement daily suggestions
