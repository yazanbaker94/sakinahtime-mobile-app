# Tasks: Quran Memorization Mode (Hifz)

## Phase 1: Core Hide/Reveal

### Task 1.1: Create Types and Constants
- [ ] Create `client/types/hifz.ts` with all type definitions
- [ ] Create `client/constants/hifz.ts` with default settings and intervals
- [ ] Add HifzModeState type for context
- [ ] Add storage key constants

### Task 1.2: Create Hifz Mode Context
- [ ] Create `client/contexts/HifzModeContext.tsx`
- [ ] Implement HifzModeProvider with state management
- [ ] Add methods: enterHifzMode, exitHifzMode, revealVerse, hideVerse
- [ ] Persist settings to AsyncStorage

### Task 1.3: Implement HifzModeToggle Component
- [ ] Create `client/components/hifz/HifzModeToggle.tsx`
- [ ] Floating button design with icon
- [ ] Toggle animation (green when active)
- [ ] Connect to HifzModeContext

### Task 1.4: Implement HiddenVerseView Component
- [ ] Create `client/components/hifz/HiddenVerseView.tsx`
- [ ] Render blurred/hidden text placeholder
- [ ] Handle tap to reveal with animation
- [ ] Support different hide modes (all, word-by-word, first, last)
- [ ] Auto-hide after configurable delay

### Task 1.5: Create HifzControlPanel Component
- [ ] Create `client/components/hifz/HifzControlPanel.tsx`
- [ ] Bottom sheet layout with sections
- [ ] Hide mode selector (All/Word/First/Last)
- [ ] Auto-hide delay selector
- [ ] Connect all controls to context

### Task 1.6: Integrate with MushafScreen
- [ ] Add HifzModeProvider to MushafScreen
- [ ] Add HifzModeToggle to screen header
- [ ] Modify verse rendering to use HiddenVerseView when active
- [ ] Show HifzControlPanel when mode is active
- [ ] Test hide/reveal functionality

---

## Phase 2: Repeat Controls

### Task 2.1: Extend AudioService for Repeat
- [ ] Add `playWithRepeat()` method to AudioService
- [ ] Implement repeat counter logic
- [ ] Add pause between repeats functionality
- [ ] Add `onRepeatComplete` callback
- [ ] Add `stopRepeat()` method

### Task 2.2: Add Playback Speed Control
- [ ] Add `setPlaybackSpeed()` method to AudioService
- [ ] Support speeds: 0.5x, 0.75x, 1.0x
- [ ] Persist speed preference
- [ ] Update audio player UI with speed indicator

### Task 2.3: Create RepeatControls Component
- [ ] Create `client/components/hifz/RepeatControls.tsx`
- [ ] Repeat count selector (1, 3, 5, 10, 20, ∞)
- [ ] Pause duration selector (0s, 2s, 5s)
- [ ] Speed selector (0.5x, 0.75x, 1x)
- [ ] Current repeat display (e.g., "3/10")
- [ ] Stop button

### Task 2.4: Integrate Repeat with Player
- [ ] Add repeat controls to HifzControlPanel
- [ ] Connect to AudioService repeat methods
- [ ] Show repeat progress in player UI
- [ ] Handle auto-advance after repeats complete

---

## Phase 3: Progress Tracking

### Task 3.1: Implement HifzProgressService
- [ ] Create `client/services/HifzProgressService.ts`
- [ ] Implement `getProgress()` method
- [ ] Implement `markVerseStatus()` method
- [ ] Implement `markPageStatus()` method
- [ ] Implement `markSurahStatus()` method
- [ ] Implement `markJuzStatus()` method
- [ ] Add statistics methods (getMemorizedCount, getProgressPercentage)

### Task 3.2: Create MemorizationBadge Component
- [ ] Create `client/components/hifz/MemorizationBadge.tsx`
- [ ] Three states: not_started, in_progress, memorized
- [ ] Small icon design (○ ◐ ●)
- [ ] Color coding per status

### Task 3.3: Add Mark Memorized UI
- [ ] Add "Mark Memorized" button to HifzControlPanel
- [ ] Add "Mark In Progress" button
- [ ] Long-press verse to show status menu
- [ ] Confirmation for marking entire page/surah

### Task 3.4: Create HifzProgressScreen
- [ ] Create `client/screens/HifzProgressScreen.tsx`
- [ ] Progress bars for verses, pages, juz
- [ ] List of memorized surahs
- [ ] List of in-progress sections
- [ ] Add to navigation stack

### Task 3.5: Create useHifzProgress Hook
- [ ] Create `client/hooks/useHifzProgress.ts`
- [ ] Load progress on mount
- [ ] Provide update methods
- [ ] Calculate statistics

---

## Phase 4: Audio Loop

### Task 4.1: Extend AudioService for Loop
- [ ] Add `playLoop()` method to AudioService
- [ ] Implement loop range tracking
- [ ] Handle seamless loop transition
- [ ] Add `stopLoop()` method
- [ ] Combine loop with repeat count

### Task 4.2: Create LoopRangeSelector Component
- [ ] Create `client/components/hifz/LoopRangeSelector.tsx`
- [ ] "Set Start" and "Set End" buttons
- [ ] Display current loop range
- [ ] Clear loop button
- [ ] Visual indicator on verses in loop

### Task 4.3: Implement Saved Loops
- [ ] Add saved loops to AsyncStorage
- [ ] Create SavedLoopsList component
- [ ] Add "Save Current Loop" button
- [ ] Quick-select saved loops

### Task 4.4: Add Loop Presets
- [ ] "Loop Current Verse" preset
- [ ] "Loop Current Page" preset
- [ ] "Loop Current Juz" preset
- [ ] Integrate presets into LoopRangeSelector

---

## Phase 5: Revision Schedule

### Task 5.1: Implement RevisionScheduleService
- [ ] Create `client/services/RevisionScheduleService.ts`
- [ ] Implement spaced repetition algorithm (SM-2)
- [ ] Track revision history per verse
- [ ] Calculate next revision dates
- [ ] Get due revisions list

### Task 5.2: Create useRevisionSchedule Hook
- [ ] Create `client/hooks/useRevisionSchedule.ts`
- [ ] Load revision schedule on mount
- [ ] Provide recordRevision method
- [ ] Get daily suggestions

### Task 5.3: Create RevisionModal Component
- [ ] Create `client/components/hifz/RevisionModal.tsx`
- [ ] List due revisions
- [ ] "Start Revision" button per item
- [ ] Daily goal progress indicator
- [ ] Show on app launch if revisions due

### Task 5.4: Add Revision Notifications
- [ ] Schedule daily revision reminder notification
- [ ] Configure notification time in settings
- [ ] Deep link to RevisionModal from notification
- [ ] Option to disable notifications

### Task 5.5: Integrate Revision with Progress
- [ ] Update revision schedule when marking memorized
- [ ] Show "Due for revision" badge on verses
- [ ] Add revision stats to HifzProgressScreen

---

## Phase 6: Polish & Testing

### Task 6.1: Data Export/Import
- [ ] Implement `exportProgress()` in HifzProgressService
- [ ] Implement `importProgress()` in HifzProgressService
- [ ] Add export/import buttons in settings
- [ ] Handle import validation and errors

### Task 6.2: Accessibility
- [ ] Add screen reader labels to all Hifz components
- [ ] Ensure proper focus management
- [ ] Test with TalkBack/VoiceOver

### Task 6.3: Performance Optimization
- [ ] Optimize verse rendering with hide/reveal
- [ ] Memoize expensive calculations
- [ ] Test with large progress data

### Task 6.4: Testing
- [ ] Test hide/reveal all modes
- [ ] Test repeat functionality
- [ ] Test loop functionality
- [ ] Test progress persistence
- [ ] Test revision scheduling
- [ ] Test offline behavior

---

## Files to Create

### Types & Constants
- `client/types/hifz.ts`
- `client/constants/hifz.ts`

### Services
- `client/services/HifzProgressService.ts`
- `client/services/RevisionScheduleService.ts`

### Hooks
- `client/hooks/useHifzMode.ts`
- `client/hooks/useHifzProgress.ts`
- `client/hooks/useRevisionSchedule.ts`

### Context
- `client/contexts/HifzModeContext.tsx`

### Components
- `client/components/hifz/HifzModeToggle.tsx`
- `client/components/hifz/HifzControlPanel.tsx`
- `client/components/hifz/HiddenVerseView.tsx`
- `client/components/hifz/MemorizationBadge.tsx`
- `client/components/hifz/RepeatControls.tsx`
- `client/components/hifz/LoopRangeSelector.tsx`
- `client/components/hifz/RevisionModal.tsx`
- `client/components/hifz/SavedLoopsList.tsx`

### Screens
- `client/screens/HifzProgressScreen.tsx`

### Modified Files
- `client/services/AudioService.ts` (extend with repeat/loop)
- `client/screens/MushafScreen.tsx` (integrate Hifz mode)
- `client/navigation/RootStackNavigator.tsx` (add HifzProgressScreen)

---

## Completion Checklist

- [ ] Hide/reveal text working with all modes
- [ ] Repeat verse/page X times working
- [ ] Mark memorized sections working
- [ ] Progress tracking and statistics working
- [ ] Audio loop for verse ranges working
- [ ] Revision schedule with spaced repetition working
- [ ] Data persists across app restarts
- [ ] Export/import progress working
- [ ] Notifications for revision reminders
- [ ] Accessible with screen readers
