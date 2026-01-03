# Requirements Document

## Introduction

This feature redesigns the MushafScreen layout to use a consistent, responsive approach that works identically across all devices (iOS and Android, old and new phones). The current implementation uses absolute positioning with hardcoded values and `Dimensions.get("window")` which behaves inconsistently across devices. The new design will use React Native's flex layout system combined with safe area insets to ensure consistent positioning of all UI elements.

## Glossary

- **Mushaf_Screen**: The Quran reading screen that displays page images with interactive verse regions
- **Safe_Area**: The portion of the screen not covered by system UI (status bar, home indicator, navigation bar)
- **Tab_Bar**: The bottom navigation bar with app sections (Qibla, Prayer, Quran, Azkar, Settings)
- **Action_Pill**: The floating button group containing stats, bookmarks, notes, and surah chooser buttons
- **Page_Overlay**: UI elements displayed over the Mushaf page (Juz/Hizb badge, Surah name, Page number)
- **Available_Content_Area**: The screen area between top safe area and tab bar, where content should be displayed

## Requirements

### Requirement 1: Consistent Layout Container

**User Story:** As a user, I want the Mushaf screen to look the same on my phone as it does on other devices, so that I have a consistent reading experience.

#### Acceptance Criteria

1. THE Mushaf_Screen SHALL use flex layout instead of absolute positioning for the main container
2. THE Mushaf_Screen SHALL calculate Available_Content_Area using safe area insets and tab bar height
3. WHEN the screen renders, THE Mushaf_Screen SHALL position all elements relative to Available_Content_Area
4. THE Mushaf_Screen SHALL NOT use `Dimensions.get("window").height` for layout calculations

### Requirement 2: Mushaf Image Positioning

**User Story:** As a user, I want the Quran page image to be centered in the available space on any device, so that I can read comfortably without the image being cut off or positioned incorrectly.

#### Acceptance Criteria

1. THE Mushaf_Screen SHALL center the page image vertically within Available_Content_Area
2. THE Mushaf_Screen SHALL scale the image to fit the screen width while maintaining aspect ratio
3. WHEN the image is smaller than Available_Content_Area, THE Mushaf_Screen SHALL add equal padding above and below
4. THE Mushaf_Screen SHALL ensure verse touch regions align exactly with the rendered image position

### Requirement 3: Top Overlay Positioning (Juz/Hizb and Surah Name)

**User Story:** As a user, I want to see the Juz/Hizb number and Surah name at the top of the page without overlapping the status bar or action buttons.

#### Acceptance Criteria

1. THE Juz_Hizb_Badge SHALL be positioned at the top-left, below the safe area top inset
2. THE Surah_Badge SHALL be positioned at the top-right, below the safe area top inset
3. WHEN on Android, THE overlays SHALL account for the status bar height
4. WHEN on iOS, THE overlays SHALL account for the notch/Dynamic Island
5. THE overlays SHALL NOT overlap with the Action_Pill buttons

### Requirement 4: Action Pill Positioning

**User Story:** As a user, I want the action buttons (stats, bookmarks, notes, surah list) to be consistently positioned at the top center of the screen on all devices.

#### Acceptance Criteria

1. THE Action_Pill SHALL be horizontally centered on the screen
2. THE Action_Pill SHALL be positioned below the safe area top inset
3. THE Action_Pill SHALL maintain consistent spacing from the top on all devices
4. THE Action_Pill SHALL NOT overlap with Juz_Hizb_Badge or Surah_Badge

### Requirement 5: Page Number Positioning

**User Story:** As a user, I want to see the page number at the bottom of the screen without it overlapping the Mushaf content or being hidden behind the tab bar.

#### Acceptance Criteria

1. THE Page_Number SHALL be positioned above the Tab_Bar
2. THE Page_Number SHALL account for the bottom safe area inset (home indicator)
3. THE Page_Number SHALL NOT overlap with the Mushaf page image
4. WHEN the image is tall, THE Page_Number SHALL remain visible above the tab bar

### Requirement 6: Cross-Platform Consistency

**User Story:** As a user switching between iOS and Android devices, I want the Mushaf screen to look and behave the same way.

#### Acceptance Criteria

1. THE Mushaf_Screen SHALL use platform-agnostic layout calculations
2. THE Mushaf_Screen SHALL use `useSafeAreaInsets()` for all safe area calculations
3. THE Mushaf_Screen SHALL use `useBottomTabBarHeight()` for tab bar height
4. IF platform-specific adjustments are needed, THEN THE Mushaf_Screen SHALL document them clearly

### Requirement 7: Verse Touch Region Accuracy

**User Story:** As a user, I want to tap on a verse and have it correctly identified, regardless of what device I'm using.

#### Acceptance Criteria

1. THE verse touch regions SHALL be positioned relative to the actual rendered image position
2. WHEN the image position changes due to device differences, THE touch regions SHALL adjust accordingly
3. THE touch regions SHALL use the same offset calculations as the image positioning
