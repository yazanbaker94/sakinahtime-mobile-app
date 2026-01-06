# Implementation Plan: AzkarScreen Redesign

## Overview

This implementation plan transforms the AzkarScreen into a more engaging experience with time-aware hero cards, quick access navigation, an interactive tasbih counter, and improved visual hierarchy. Each task builds incrementally on previous work.

## Tasks

- [x] 1. Create custom hooks for new features
  - [x] 1.1 Create useTimeAwareAzkar hook
    - Create `client/hooks/useTimeAwareAzkar.ts`
    - Implement logic to return morning (4AM-12PM) or evening (12PM-4AM) category
    - Return currentCategory, isMorning, and timeUntilSwitch
    - _Requirements: 2.1, 2.2_
  - [x] 1.2 Create useTasbihCounter hook
    - Create `client/hooks/useTasbihCounter.ts`
    - Implement count state, increment, reset functions
    - Add optional target tracking and completion detection
    - _Requirements: 4.2, 4.4, 4.5, 4.6_
  - [x] 1.3 Create useDailyDhikr hook
    - Create `client/hooks/useDailyDhikr.ts`
    - Implement deterministic daily dhikr selection based on date
    - Return dhikr object and its categoryId
    - _Requirements: 5.2_

- [x] 2. Create new UI components
  - [x] 2.1 Create TimeAwareHeroCard component
    - Create `client/components/TimeAwareHeroCard.tsx`
    - Display gradient background (emerald to teal)
    - Show category icon, title, description, count, duration
    - Include "Start Now" CTA button
    - Use useTimeAwareAzkar hook
    - _Requirements: 2.3, 2.4, 2.5, 2.6_
  - [x] 2.2 Create QuickAccessStrip component
    - Create `client/components/QuickAccessStrip.tsx`
    - Horizontal scrollable row of category pills
    - Show icon and abbreviated title for each category
    - Special gold color for morning, emerald for evening
    - _Requirements: 3.1, 3.3, 3.4, 3.5_
  - [x] 2.3 Create TasbihCounter component
    - Create `client/components/TasbihCounter.tsx`
    - Large tappable counter area with count display
    - Haptic feedback on tap using expo-haptics
    - Pulse animation on increment
    - Long-press to reset with confirmation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7_
  - [x] 2.4 Create DailyDhikrCard component
    - Create `client/components/DailyDhikrCard.tsx`
    - Display Arabic text with proper font
    - Show English translation
    - Source reference badge
    - Decorative styling
    - _Requirements: 5.1, 5.4, 5.5_
  - [x] 2.5 Create CompactCategoryCard component
    - Create `client/components/CompactCategoryCard.tsx`
    - Icon with colored background circle
    - English and Arabic titles
    - Adhkar count
    - Press animation (scale + opacity)
    - _Requirements: 6.3, 6.4, 6.5_

- [x] 3. Checkpoint - Verify components
  - Ensure all components render correctly in isolation
  - Test hooks return expected values
  - Ask the user if questions arise

- [x] 4. Update AzkarScreen layout
  - [x] 4.1 Add three-tab navigation
    - Update tab selector to include "Azkar", "Duas", "Guides" tabs
    - "Duas" tab navigates to DuaCollectionScreen
    - Maintain existing tab styling with active indicator
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 4.2 Integrate TimeAwareHeroCard
    - Add hero card at top of Azkar tab content
    - Wire onPress to navigate to morning/evening azkar detail
    - _Requirements: 2.4_
  - [x] 4.3 Integrate QuickAccessStrip
    - Add below hero card with "Quick Access" section header
    - Wire category press to navigate to azkar detail
    - _Requirements: 3.2_
  - [x] 4.4 Integrate TasbihCounter
    - Add below quick access strip
    - Style with card container
    - _Requirements: 4.1_
  - [x] 4.5 Integrate DailyDhikrCard
    - Add below tasbih counter
    - Wire onPress to navigate to dhikr's category detail
    - _Requirements: 5.3_
  - [x] 4.6 Replace category grid with CompactCategoryCard
    - Add "All Categories" section header
    - Use CompactCategoryCard in 2-column grid
    - Maintain existing navigation behavior
    - _Requirements: 6.1, 6.2_
  - [x] 4.7 Keep Daily Tip section
    - Maintain existing tip card at bottom
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 5. Checkpoint - Verify screen integration
  - Test all navigation flows work correctly
  - Verify time-aware hero switches appropriately
  - Test tasbih counter functionality
  - Ask the user if questions arise

- [x] 6. Add animations and polish
  - [x] 6.1 Add tab transition animations
    - Smooth fade/slide between tab content
    - _Requirements: 8.1_
  - [x] 6.2 Add press animations to cards
    - Scale to 0.98 and opacity to 0.8 on press
    - Use Animated API or Reanimated
    - _Requirements: 8.2_
  - [x] 6.3 Enhance tasbih counter animation
    - Add pulse effect on count increment
    - Animate count number change
    - _Requirements: 8.3_
  - [x] 6.4 Polish hero card gradient
    - Ensure gradient works in both light and dark themes
    - Add subtle shadow for depth
    - _Requirements: 8.4_

- [x] 7. Final checkpoint
  - Ensure all features work correctly
  - Test dark mode appearance
  - Test all navigation paths
  - Verify haptic feedback works on device
  - Ask the user if questions arise

## Notes

- All new components follow existing app patterns and design system
- Hooks are kept simple and focused on single responsibility
- The Duas tab reuses the existing DuaCollectionScreen
- Animations use React Native's Animated API for performance
- Haptic feedback requires expo-haptics (already in project)

