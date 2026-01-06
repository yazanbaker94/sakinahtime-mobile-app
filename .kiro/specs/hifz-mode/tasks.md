# Tasks: Quran Memorization Mode (Hifz)

## Phase 1: Core Hide/Reveal

### Task 1.1: Create Types and Constants
- [x] Create `client/types/hifz.ts` with all type definitions
- [x] Create `client/constants/hifz.ts` with default settings and intervals
- [x] Add HifzModeState type for context
- [x] Add storage key constants

### Task 1.2: Create Hifz Mode Context
- [x] Create `client/contexts/HifzModeContext.tsx`
- [x] Implement HifzModeProvider with state management
- [x] Add methods: enterHifzMode, exitHifzMode, revealVerse, hideVerse
- [x] Persist settings to AsyncStorage

### Task 1.3: Implement HifzModeToggle Component
- [x] Create `client/components/hifz/HifzModeToggle.tsx`
- [x] Floating button design with icon
- [x] Toggle animation (green when active)
- [x] Connect to HifzModeContext

### Task 1.4: Implement HiddenVerseView Component
- [x] Create `client/components/hifz/HiddenVerseView.tsx`
- [x] Render blurred/hidden text placeholder
- [x] Handle tap to reveal with animation
- [x] Support different hide modes (all, word-by-word, first, last)
- [x] Auto-hide after configurable delay

### Task 1.5: Create HifzControlPanel Component
- [x] Create `client/components/hifz/HifzControlPanel.tsx`
- [x] Bottom sheet layout with sections
- [x] Hide mode selector (All/Word/First/Last)
- [x] Auto-hide delay selector
- [x] Connect all controls to context

### Task 1.6: Integrate with MushafScreen
- [x] Add HifzModeProvider to MushafScreen
- [x] Add HifzModeToggle to screen header (via MushafHifzOverlay)
- [x] Modify verse rendering to use HiddenVerseView when active
- [x] Show HifzControlPanel when mode is active (via MushafHifzOverlay)
- [ ] Test hide/reveal functionality

---

## Phase 2: Repeat Controls

### Task 2.1: Extend AudioService for Repeat
- [x] Add `playWithRepeat()` method to AudioService
- [x] Implement repeat counter logic
- [x] Add pause between repeats functionality
- [x] Add `onRepeatComplete` callback
- [x] Add `stopRepeat()` method

### Task 2.2: Add Playback Speed Control
- [x] Add `setPlaybackSpeed()` method to AudioService (already existed)
- [x] Support speeds: 0.5x, 0.75x, 1.0x
- [x] Persist speed preference
- [x] Update audio player UI with speed indicator

### Task 2.3: Create RepeatControls Component
- [x] Create `client/components/hifz/RepeatControls.tsx`
- [x] Repeat count selector (1, 3, 5, 10, 20, ∞)
- [x] Pause duration selector (0s, 2s, 5s)
- [x] Speed selector (0.5x, 0.75x, 1x)
- [x] Current repeat display (e.g., "3/10")
- [x] Stop button

### Task 2.4: Integrate Repeat with Player
- [x] Add repeat controls to HifzControlPanel
- [x] Connect to AudioService repeat methods
- [x] Show repeat progress in player UI
- [x] Handle auto-advance after repeats complete (via onRepeatComplete callback)

---

## Phase 3: Progress Tracking

### Task 3.1: Implement HifzProgressService
- [x] Create `client/services/HifzProgressService.ts`
- [x] Implement `getProgress()` method
- [x] Implement `markVerseStatus()` method
- [x] Implement `markPageStatus()` method
- [x] Implement `markSurahStatus()` method
- [x] Implement `markJuzStatus()` method
- [x] Add statistics methods (getMemorizedCount, getProgressPercentage)

### Task 3.2: Create MemorizationBadge Component
- [x] Create `client/components/hifz/MemorizationBadge.tsx`
- [x] Three states: not_started, in_progress, memorized
- [x] Small icon design (○ ◐ ●)
- [x] Color coding per status

### Task 3.3: Add Mark Memorized UI
- [x] Add "Mark Memorized" button to HifzControlPanel
- [x] Add "Mark In Progress" button
- [x] Long-press verse to show status menu
- [x] Confirmation for marking entire page/surah

### Task 3.4: Create HifzProgressScreen
- [x] Create `client/screens/HifzProgressScreen.tsx`
- [x] Progress bars for verses, pages, juz
- [x] List of memorized surahs
- [x] List of in-progress sections
- [x] Add to navigation stack

### Task 3.5: Create useHifzProgress Hook
- [x] Create `client/hooks/useHifzProgress.ts`
- [x] Load progress on mount
- [x] Provide update methods
- [x] Calculate statistics

---

## Phase 4: Audio Loop

### Task 4.1: Extend AudioService for Loop
- [x] Add `playLoop()` method to AudioService
- [x] Implement loop range tracking
- [x] Handle seamless loop transition
- [x] Add `stopLoop()` method
- [x] Combine loop with repeat count

### Task 4.2: Create LoopRangeSelector Component
- [x] Create `client/components/hifz/LoopRangeSelector.tsx`
- [x] "Set Start" and "Set End" buttons
- [x] Display current loop range
- [x] Clear loop button
- [x] Visual indicator on verses in loop

### Task 4.3: Implement Saved Loops
- [x] Add saved loops to AsyncStorage
- [x] Create SavedLoopsList component
- [x] Add "Save Current Loop" button
- [x] Quick-select saved loops

### Task 4.4: Add Loop Presets
- [x] "Loop Current Verse" preset (UI added)
- [x] "Loop Current Page" preset (UI added)
- [x] "Loop Current Juz" preset (UI added)
- [x] Integrate presets with actual functionality

---

## Phase 5: Revision Schedule

### Task 5.1: Implement RevisionScheduleService
- [x] Create `client/services/RevisionScheduleService.ts`
- [x] Implement spaced repetition algorithm (SM-2)
- [x] Track revision history per verse
- [x] Calculate next revision dates
- [x] Get due revisions list

### Task 5.2: Create useRevisionSchedule Hook
- [x] Create `client/hooks/useRevisionSchedule.ts`
- [x] Load revision schedule on mount
- [x] Provide recordRevision method
- [x] Get daily suggestions

### Task 5.3: Create RevisionModal Component
- [x] Create `client/components/hifz/RevisionModal.tsx`
- [x] List due revisions
- [x] "Start Revision" button per item
- [x] Daily goal progress indicator
- [x] Show on app launch if revisions due

### Task 5.4: Add Revision Notifications
- [x] Schedule daily revision reminder notification
- [x] Configure notification time in settings
- [x] Deep link to RevisionModal from notification
- [x] Option to disable notifications

### Task 5.5: Integrate Revision with Progress
- [x] Update revision schedule when marking memorized
- [x] Show "Due for revision" badge on verses
- [x] Add revision stats to HifzProgressScreen

---

## Phase 6: Polish & Testing

### Task 6.1: Data Export/Import
- [x] Implement `exportProgress()` in HifzProgressService
- [x] Implement `importProgress()` in HifzProgressService
- [x] Add export/import buttons in settings (in HifzProgressScreen)
- [x] Handle import validation and errors

### Task 6.2: Accessibility
- [x] Add screen reader labels to all Hifz components
- [ ] Ensure proper focus management
- [ ] Test with TalkBack/VoiceOver

### Task 6.3: Performance Optimization
- [x] Optimize verse rendering with hide/reveal
- [x] Memoize expensive calculations
- [ ] Test with large progress data

### Task 6.4: Testing
- [x] Test hide/reveal all modes (word-by-word mode implemented with individual word overlays)
- [ ] Test repeat functionality
- [ ] Test loop functionality
- [ ] Test progress persistence
- [ ] Test revision scheduling
- [ ] Test offline behavior

### Task 6.5: Word-by-Word Mode (Completed)
- [x] Added `WordKey` type (`"surah:ayah:wordIndex"`)
- [x] Added `revealedWords` state to HifzModeContext
- [x] Added word-level methods: `revealWord`, `hideWord`, `isWordRevealed`, `revealNextWord`, `getRevealedWordCount`
- [x] Updated MushafScreen to render individual word overlays when `hideMode === 'word'`
- [x] Tap on word reveals/hides just that word
- [x] Long press on word shows Hifz status menu (not started, in progress, memorized)

---

## Files Created

### Types & Constants
- [x] `client/types/hifz.ts`
- [x] `client/constants/hifz.ts`

### Services
- [x] `client/services/HifzProgressService.ts`
- [x] `client/services/RevisionScheduleService.ts`
- [x] `client/services/HifzNotificationService.ts`

### Hooks
- [x] `client/hooks/useHifzProgress.ts`
- [x] `client/hooks/useRevisionSchedule.ts`

### Context
- [x] `client/contexts/HifzModeContext.tsx`

### Components
- [x] `client/components/hifz/HifzModeToggle.tsx`
- [x] `client/components/hifz/HifzControlPanel.tsx`
- [x] `client/components/hifz/HiddenVerseView.tsx`
- [x] `client/components/hifz/MemorizationBadge.tsx`
- [x] `client/components/hifz/RepeatControls.tsx`
- [x] `client/components/hifz/LoopRangeSelector.tsx`
- [x] `client/components/hifz/RevisionModal.tsx`
- [x] `client/components/hifz/SavedLoopsList.tsx`

### Screens
- [x] `client/screens/HifzProgressScreen.tsx`

### Modified Files
- [x] `client/services/AudioService.ts` (extended with repeat/loop)
- [x] `client/screens/MushafScreen.tsx` (integrated with HifzModeProvider and overlay)
- [x] `client/navigation/RootStackNavigator.tsx` (added HifzProgressScreen)

---

## Completion Checklist

- [x] Hide/reveal text components created
- [x] Word-by-word mode with individual word overlays
- [x] Repeat verse/page X times - AudioService extended
- [x] Mark memorized sections - UI and service created
- [x] Progress tracking and statistics - service and screen created
- [x] Audio loop for verse ranges - AudioService extended
- [x] Revision schedule with spaced repetition - service created
- [x] Data persists across app restarts - AsyncStorage implemented
- [x] Export/import progress - implemented in service
- [x] Notifications for revision reminders
- [x] Accessible with screen readers (labels added)
- [x] MushafScreen integration (full integration with hide/reveal, status menu, revision badges)
