# Word Scrubber Feature Requirements

## Overview
A drag-to-explore word-by-word magnifier for the Mushaf screen, similar to Quran.com's iOS implementation. Users can drag their finger across the Quran page to see word meanings in real-time.

## Functional Requirements

### FR-1: Activation
- FR-1.1: A floating action button (FAB) appears on the Mushaf screen when no modals are open
- FR-1.2: Tapping the FAB activates Word Scrubber mode
- FR-1.3: The FAB should be positioned in the bottom-right corner, above the tab bar
- FR-1.4: The FAB should have an accessible label "Word Explorer"

### FR-2: Drag Interaction
- FR-2.1: When active, an overlay covers the Mushaf page to capture touch events
- FR-2.2: User can drag finger anywhere on the page
- FR-2.3: System detects which word is under the finger using coordinate data
- FR-2.4: Word detection uses the existing `allCoords` data structure

### FR-3: Magnifier/Loupe Display
- FR-3.1: A floating "loupe" bubble follows the user's finger
- FR-3.2: The loupe appears above the finger position (not obscuring the touch point)
- FR-3.3: The loupe displays:
  - Arabic word (large, prominent)
  - Transliteration (italic, secondary)
  - Translation in selected language
  - Verse reference (surah:ayah)
- FR-3.4: The loupe stays within screen bounds (clamped positioning)
- FR-3.5: The loupe animates in/out smoothly (fade + scale)

### FR-4: Haptic Feedback
- FR-4.1: Light haptic feedback triggers when moving to a new word
- FR-4.2: No haptic when staying on the same word

### FR-5: Audio Playback
- FR-5.1: When user releases finger, play audio for the last selected word
- FR-5.2: Use existing `wordAudioService.playWord()` function

### FR-6: Deactivation
- FR-6.1: A close button (X) in the top-right corner closes the scrubber
- FR-6.2: The overlay and loupe disappear with animation
- FR-6.3: Normal Mushaf interaction resumes

### FR-7: Instructions
- FR-7.1: When first activated (before dragging), show instruction overlay
- FR-7.2: Instructions explain: "Drag your finger across the page to explore words"
- FR-7.3: Instructions disappear once user starts dragging

## Non-Functional Requirements

### NFR-1: Performance
- NFR-1.1: Word detection must be fast (<16ms) to maintain 60fps during drag
- NFR-1.2: Use memoization for coordinate lookups
- NFR-1.3: Avoid re-renders during drag (use refs for position)

### NFR-2: Accessibility
- NFR-2.1: FAB has proper accessibility labels
- NFR-2.2: Close button is accessible
- NFR-2.3: Screen reader announces mode activation/deactivation

### NFR-3: Theme Support
- NFR-3.1: Loupe adapts to light/dark theme
- NFR-3.2: Colors use theme tokens (theme.gold, theme.primary, etc.)

### NFR-4: Platform Compatibility
- NFR-4.1: Works on iOS and Android
- NFR-4.2: Uses React Native's PanResponder (not gesture-handler) to avoid conflicts
