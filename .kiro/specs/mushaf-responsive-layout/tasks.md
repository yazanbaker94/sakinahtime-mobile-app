# Implementation Plan: Mushaf Responsive Layout

## Overview

This plan refactors MushafScreen to use a flex-based layout system that works consistently across all devices. The implementation is broken into incremental steps that can be tested individually.

## Tasks

- [x] 1. Create useLayoutDimensions hook
  - Create new file `client/hooks/useLayoutDimensions.ts`
  - Implement hook that calculates all layout dimensions
  - Use `useSafeAreaInsets()`, `useBottomTabBarHeight()`, and `useWindowDimensions()`
  - Export `LayoutDimensions` interface
  - _Requirements: 1.2, 1.3, 6.2, 6.3_

- [x] 2. Refactor MushafScreen container structure
  - [x] 2.1 Replace absolute container with flex layout
    - Update main container to use `flex: 1` layout
    - Add safe area top spacer view
    - Add tab bar + safe area bottom spacer view
    - _Requirements: 1.1, 1.4_
  
  - [x] 2.2 Create Header Zone component
    - Fixed height zone (60px) below safe area
    - Contains Juz/Hizb badge (left), Action Pill (center), Surah badge (right)
    - Use `flexDirection: 'row'` with `justifyContent: 'space-between'`
    - _Requirements: 3.1, 3.2, 4.1, 4.2_
  
  - [x] 2.3 Create Footer Zone component
    - Fixed height zone (40px) above tab bar spacer
    - Contains centered page number
    - _Requirements: 5.1, 5.2_
  
  - [x] 2.4 Create Content Zone for FlatList
    - Flex: 1 to fill remaining space
    - Contains the horizontal FlatList with Mushaf pages
    - _Requirements: 2.1_

- [x] 3. Update renderPage function
  - [x] 3.1 Update image positioning
    - Use `contentZoneHeight` instead of `SCREEN_HEIGHT`
    - Calculate `imageOffsetY` to center within content zone
    - Apply `top: imageOffsetY` to Image component
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 3.2 Update verse touch region positioning
    - Use same `imageOffsetY` for touch region top calculation
    - Ensure regions align with actual image position
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 4. Remove hardcoded positioning values
  - [x] 4.1 Remove SCREEN_HEIGHT usage from layout calculations
    - Replace with calculated dimensions from hook
    - _Requirements: 1.4_
  
  - [x] 4.2 Update overlay positioning to use zone-relative values
    - Remove absolute `top` values from Juz/Hizb badge (now in headerZone flex layout)
    - Remove absolute `top` values from Surah badge (now in headerZone flex layout)
    - Remove absolute `bottom` values from page footer (now in footerZone flex layout)
    - _Requirements: 3.1, 3.2, 4.1, 5.1_

- [x] 5. Update styles
  - [x] 5.1 Update pageContainer style
    - Remove fixed height, use flex: 1
    - _Requirements: 1.1_
  
  - [x] 5.2 Update pageFooter style
    - Remove absolute positioning
    - Use flex layout within footer zone
    - _Requirements: 5.1, 5.3_
  
  - [x] 5.3 Update pillButtonContainer style
    - Position within header zone instead of absolute
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 6. Handle edge cases
  - [x] 6.1 Add fallback for tab bar height
    - Wrap `useBottomTabBarHeight()` in try-catch
    - Default to 49px if not in tab context
    - _Requirements: 6.4_
  
  - [x] 6.2 Ensure modals/overlays still work
    - Verify bookmarks modal positioning
    - Verify notes modal positioning
    - Verify surah list modal positioning
    - _Requirements: 1.3_

- [x] 7. Checkpoint - Test on multiple devices
  - Ensure all tests pass, ask the user if questions arise
  - Test on iOS simulator (iPhone SE, iPhone 14)
  - Test on Android emulator (different screen sizes)

- [x] 8. Write property tests
  - [x] 8.1 Write property test for layout zone sum
    - **Property 1: Layout Zone Heights Sum to Screen Height**
    - **Validates: Requirements 1.2, 1.3**
  
  - [x] 8.2 Write property test for image centering
    - **Property 2: Image Centering Within Content Zone**
    - **Validates: Requirements 2.1, 2.3**

- [x] 9. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise
  - Verify consistent layout across devices

## Notes

- Each task references specific requirements for traceability
- The refactor maintains all existing functionality while fixing layout issues
- Modals and overlays may need separate handling as they render outside the main layout
