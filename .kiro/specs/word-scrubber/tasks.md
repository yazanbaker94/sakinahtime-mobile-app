# Word Scrubber Implementation Tasks

## Task 1: Add State and Refs
- [x] Add `isWordScrubberActive` state
- [x] Add `scrubberWord` state for current word data
- [x] Add `loupeOpacity` and `loupeScale` animated values
- [x] Add `lastWordKey` ref to track word changes
- [x] Add `isDragging` ref to track drag state
- [x] Add `currentPageRef` to track current page (fixes stale closure)

**Files:** `client/screens/MushafScreen.tsx`

---

## Task 2: Implement Word Detection Helper
- [x] Create `findWordAtPosition(screenX, screenY)` function
- [x] Convert screen coordinates to image coordinates using `layout.imageScale` and `layout.imageOffsetY`
- [x] Search through `allCoords[currentPage]` for matching word
- [x] Calculate word index within verse
- [x] Return `{ surah, ayah, wordIndex }` or null
- [x] Use `currentPageRef.current` to avoid stale closure issues

**Files:** `client/screens/MushafScreen.tsx`

---

## Task 3: Implement PanResponder Handlers
- [x] Create `handleScrubberStart` - show loupe animation, find initial word
- [x] Create `handleScrubberMove` - update position, find word, trigger haptic on change
- [x] Create `handleScrubberEnd` - hide loupe, play word audio
- [x] Create `scrubberPanResponder` using PanResponder.create()
- [x] Ensure handlers only activate when `isWordScrubberActive` is true

**Files:** `client/screens/MushafScreen.tsx`

---

## Task 4: Implement Word Loading
- [x] Create `loadScrubberWord(surah, ayah, wordIndex)` async function
- [x] Use `findWordMeaningByIndex` to get word data
- [x] Update `scrubberWord` state with result
- [x] Skip loading if same word as before (use `lastWordKey` ref)
- [x] Trigger haptic feedback on word change

**Files:** `client/screens/MushafScreen.tsx`

---

## Task 5: Add FAB Button
- [x] Add floating action button JSX
- [x] Position bottom-right, above tab bar
- [x] Style with theme colors (gold/primary)
- [x] Add shadow and elevation
- [x] Hide when modals are open or scrubber is active
- [x] Add accessibility labels

**Files:** `client/screens/MushafScreen.tsx`

---

## Task 6: Add Scrubber Overlay
- [x] Add overlay View with absoluteFill
- [x] Attach panResponder handlers
- [x] Add semi-transparent background
- [x] Add close button (X) in top-right
- [x] Add instruction text when not dragging

**Files:** `client/screens/MushafScreen.tsx`

---

## Task 7: Add Loupe Component
- [x] Add Animated.View for loupe
- [x] Style with rounded corners, border, shadow
- [x] Position based on touch with screen clamping
- [x] Apply opacity and scale animations
- [x] Add arrow pointer at bottom

**Files:** `client/screens/MushafScreen.tsx`

---

## Task 8: Add Loupe Content
- [x] Display Arabic word (large, gold/primary color)
- [x] Display transliteration (italic, secondary color)
- [x] Display translation (medium weight)
- [x] Display verse reference (small, muted)
- [x] Handle missing data gracefully

**Files:** `client/screens/MushafScreen.tsx`

---

## Task 9: Add Styles
- [x] Inline styles used (no separate StyleSheet needed)

**Files:** `client/screens/MushafScreen.tsx`

---

## Task 10: Testing & Polish
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Verify haptic feedback works
- [ ] Verify audio plays on release
- [ ] Test theme switching (light/dark)
- [ ] Test with different page sizes
- [ ] Verify no performance issues during drag
- [ ] Verify correct page data shown on all pages

**Files:** N/A (manual testing)

---

## Bug Fixes Applied

### Fix 1: Stale Closure Issue (2024-01-16)
**Problem:** Word scrubber was showing Fatiha (page 1) data on all pages.
**Cause:** The `findWordAtScreenPosition` callback was capturing `currentPage` in its closure, but the closure wasn't being updated when the page changed.
**Solution:** Added `currentPageRef` ref that's kept in sync with `currentPage` state. The `findWordAtScreenPosition` function now reads from `currentPageRef.current` to always get the latest page value.

---

## Implementation Order

1. Tasks 1-2: Foundation (state, word detection)
2. Tasks 3-4: Core interaction (pan handlers, word loading)
3. Tasks 5-6: UI activation (FAB, overlay)
4. Tasks 7-8: Visual feedback (loupe display)
5. Task 9: Styling
6. Task 10: Testing

## Dependencies

- Existing: `allCoords`, `layout`, `findWordMeaningByIndex`, `wordAudioService`
- Existing: `Animated` from react-native
- Existing: `PanResponder` from react-native
- Existing: `Haptics` from expo-haptics
