# Requirements Document

## Introduction

The AzkarScreen Redesign feature improves the main Azkar tab to provide a more engaging, visually appealing, and user-friendly experience for accessing daily adhkar (remembrances), duas (supplications), and Islamic guides. The redesign introduces a time-aware hero section, quick access navigation, an interactive tasbih counter, and better visual hierarchy while maintaining all existing functionality.

## Glossary

- **Azkar_Screen**: The main screen in the Azkar tab displaying categories, duas link, and Islamic guides
- **Time_Aware_Hero**: A dynamic hero card that displays Morning or Evening azkar based on current time
- **Quick_Access_Strip**: A horizontal scrollable row of category shortcuts for fast navigation
- **Tasbih_Counter**: An interactive counter widget for tracking dhikr repetitions
- **Daily_Dhikr**: A featured dhikr that rotates daily to encourage learning new remembrances
- **Category_Card**: A visual card representing an azkar category with icon, title, and count
- **Tab_Navigator**: The tab selector at the top of the screen for switching between Azkar, Duas, and Guides

## Requirements

### Requirement 1: Three-Tab Navigation

**User Story:** As a user, I want to quickly switch between Azkar, Duas, and Islamic Guides, so that I can access all spiritual content from one screen.

#### Acceptance Criteria

1. THE Azkar_Screen SHALL display three tabs: "Azkar", "Duas", and "Guides"
2. WHEN a user taps the "Azkar" tab, THE Azkar_Screen SHALL display the azkar content with hero card and categories
3. WHEN a user taps the "Duas" tab, THE Azkar_Screen SHALL navigate to the DuaCollectionScreen
4. WHEN a user taps the "Guides" tab, THE Azkar_Screen SHALL display the Islamic guides content
5. THE Tab_Navigator SHALL visually indicate the currently active tab with primary color highlight

### Requirement 2: Time-Aware Hero Card

**User Story:** As a user, I want to see the most relevant azkar for the current time of day, so that I can quickly start my morning or evening remembrances.

#### Acceptance Criteria

1. THE Time_Aware_Hero SHALL display "Morning Azkar" content between 4:00 AM and 12:00 PM
2. THE Time_Aware_Hero SHALL display "Evening Azkar" content between 12:00 PM and 4:00 AM
3. THE Time_Aware_Hero SHALL show the category icon, title, description, adhkar count, and estimated duration
4. WHEN a user taps the hero card, THE Azkar_Screen SHALL navigate to the corresponding azkar detail screen
5. THE Time_Aware_Hero SHALL use a gradient background with emerald/teal colors
6. THE Time_Aware_Hero SHALL include a "Start Now" call-to-action button

### Requirement 3: Quick Access Strip

**User Story:** As a user, I want quick shortcuts to all azkar categories, so that I can navigate to any category with minimal scrolling.

#### Acceptance Criteria

1. THE Quick_Access_Strip SHALL display all azkar categories in a horizontal scrollable row
2. WHEN a user taps a category in the strip, THE Azkar_Screen SHALL navigate to that category's detail screen
3. THE Quick_Access_Strip SHALL show category icon and abbreviated title for each item
4. THE Quick_Access_Strip SHALL be positioned below the hero card
5. THE Quick_Access_Strip SHALL highlight Morning/Evening categories with distinct colors (gold for morning, emerald for evening)

### Requirement 4: Interactive Tasbih Counter

**User Story:** As a user, I want an interactive counter on the main screen, so that I can quickly count my dhikr without navigating to another screen.

#### Acceptance Criteria

1. THE Tasbih_Counter SHALL display a large, tappable counter area
2. WHEN a user taps the counter, THE Tasbih_Counter SHALL increment the count by 1
3. THE Tasbih_Counter SHALL provide haptic feedback on each tap
4. THE Tasbih_Counter SHALL display the current count prominently
5. WHEN a user long-presses the counter, THE Tasbih_Counter SHALL reset to zero
6. THE Tasbih_Counter SHALL persist the count during the session
7. THE Tasbih_Counter SHALL show a subtle animation on each tap

### Requirement 5: Daily Dhikr Feature

**User Story:** As a user, I want to see a featured dhikr each day, so that I can learn new remembrances regularly.

#### Acceptance Criteria

1. THE Daily_Dhikr card SHALL display a featured dhikr with Arabic text and translation
2. THE Daily_Dhikr SHALL rotate daily based on the current date using a deterministic algorithm
3. WHEN a user taps the Daily_Dhikr card, THE Azkar_Screen SHALL navigate to the full dhikr in its category
4. THE Daily_Dhikr SHALL show the source reference (e.g., "Bukhari & Muslim")
5. THE Daily_Dhikr card SHALL have a distinct visual style with decorative elements

### Requirement 6: Compact Category Grid

**User Story:** As a user, I want to see all azkar categories in a clean grid, so that I can browse and select any category easily.

#### Acceptance Criteria

1. THE Azkar_Screen SHALL display all categories in a 2-column grid below the featured sections
2. WHEN a user taps a Category_Card, THE Azkar_Screen SHALL navigate to that category's detail screen
3. THE Category_Card SHALL display icon, English title, Arabic title, and adhkar count
4. THE Category_Card SHALL use consistent styling with the app's design system
5. THE Category_Card SHALL provide visual feedback on press (scale and opacity change)

### Requirement 7: Daily Tip Section

**User Story:** As a user, I want to see inspirational tips about dhikr, so that I can be motivated to maintain my remembrance practice.

#### Acceptance Criteria

1. THE Azkar_Screen SHALL display a Daily Tip card at the bottom of the azkar tab
2. THE Daily Tip SHALL show a hadith or wisdom about dhikr with source attribution
3. THE Daily Tip SHALL use a subtle background color that complements the theme

### Requirement 8: Visual Polish and Animations

**User Story:** As a user, I want the screen to feel polished and responsive, so that using the app is a pleasant experience.

#### Acceptance Criteria

1. THE Azkar_Screen SHALL use smooth transitions between tabs
2. THE Category_Card components SHALL animate on press with scale effect
3. THE Tasbih_Counter SHALL animate the count change with a subtle pulse
4. THE Time_Aware_Hero SHALL use a gradient background that respects dark/light theme
5. ALL interactive elements SHALL provide appropriate visual feedback on interaction

