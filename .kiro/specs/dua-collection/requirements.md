# Requirements Document

## Introduction

The Dua Collection feature expands the existing Azkar functionality to provide a comprehensive library of Islamic supplications (duas). This includes categorized duas for various life situations, Quranic duas with verse references, Prophetic duas from authentic hadith sources, user favorites management, custom dua creation, and audio pronunciation support. The feature integrates seamlessly with the existing app architecture and follows established UI patterns.

## Glossary

- **Dua_Collection_System**: The main system managing all dua-related functionality including browsing, favorites, custom duas, and audio playback
- **Dua**: A supplication or prayer in Islam, containing Arabic text, transliteration, translation, and source reference
- **Dua_Category**: A grouping of related duas by occasion or theme (e.g., travel, eating, sleeping)
- **Quranic_Dua**: A dua that originates from the Quran, including surah and ayah reference
- **Prophetic_Dua**: A dua from authentic hadith collections attributed to Prophet Muhammad (peace be upon him)
- **Favorites_Manager**: Component responsible for storing and retrieving user's favorite duas
- **Custom_Dua**: A user-created dua entry with personal notes
- **Audio_Player**: Component that plays dua pronunciation audio files
- **Dua_Storage**: Local storage system for persisting favorites and custom duas

## Requirements

### Requirement 1: Browse Categorized Duas

**User Story:** As a Muslim user, I want to browse duas organized by category, so that I can easily find supplications relevant to my current situation.

#### Acceptance Criteria

1. WHEN a user opens the Dua Collection screen, THE Dua_Collection_System SHALL display a list of dua categories with icons and counts
2. WHEN a user selects a category, THE Dua_Collection_System SHALL display all duas within that category
3. THE Dua_Collection_System SHALL support the following categories: Travel, Eating & Drinking, Sleeping & Waking, Entering & Leaving Places, Weather & Nature, Health & Healing, Protection, Gratitude, Forgiveness, Guidance, Family & Children, and General Supplications
4. WHEN displaying a dua, THE Dua_Collection_System SHALL show Arabic text, transliteration, English translation, and source reference
5. WHEN a category contains subcategories, THE Dua_Collection_System SHALL display them as expandable sections

### Requirement 2: Quranic Duas with References

**User Story:** As a user, I want to access duas from the Quran with their verse references, so that I can learn and recite authentic Quranic supplications.

#### Acceptance Criteria

1. THE Dua_Collection_System SHALL provide a dedicated "Quranic Duas" section containing supplications from the Quran
2. WHEN displaying a Quranic dua, THE Dua_Collection_System SHALL show the surah name, ayah number, and Arabic verse
3. WHEN a user taps on a Quranic dua reference, THE Dua_Collection_System SHALL navigate to that verse in the Mushaf screen
4. THE Dua_Collection_System SHALL include at least 40 Quranic duas covering major themes (guidance, forgiveness, protection, gratitude)

### Requirement 3: Prophetic Duas from Hadith

**User Story:** As a user, I want to access authentic duas from hadith collections, so that I can follow the Sunnah in my supplications.

#### Acceptance Criteria

1. THE Dua_Collection_System SHALL provide a dedicated "Prophetic Duas" section containing supplications from authentic hadith
2. WHEN displaying a Prophetic dua, THE Dua_Collection_System SHALL show the hadith source (e.g., Bukhari, Muslim, Tirmidhi)
3. WHEN displaying a Prophetic dua, THE Dua_Collection_System SHALL show the hadith grade when available (Sahih, Hasan)
4. THE Dua_Collection_System SHALL include at least 50 Prophetic duas from major hadith collections

### Requirement 4: Favorites Management

**User Story:** As a user, I want to save my favorite duas, so that I can quickly access the supplications I use most often.

#### Acceptance Criteria

1. WHEN a user taps the favorite icon on a dua, THE Favorites_Manager SHALL add that dua to the favorites list
2. WHEN a user taps the favorite icon on an already-favorited dua, THE Favorites_Manager SHALL remove that dua from favorites
3. THE Dua_Collection_System SHALL provide a dedicated "Favorites" section showing all favorited duas
4. WHEN the favorites list is empty, THE Dua_Collection_System SHALL display an empty state with guidance
5. THE Favorites_Manager SHALL persist favorites to local storage using AsyncStorage
6. WHEN the app restarts, THE Favorites_Manager SHALL restore previously saved favorites

### Requirement 5: Custom Duas

**User Story:** As a user, I want to add my own personal duas, so that I can keep all my supplications in one place.

#### Acceptance Criteria

1. WHEN a user taps "Add Custom Dua", THE Dua_Collection_System SHALL display a form with fields for Arabic text (optional), transliteration (optional), translation/meaning (required), and personal notes (optional)
2. WHEN a user submits a valid custom dua form, THE Dua_Storage SHALL save the custom dua locally
3. THE Dua_Collection_System SHALL provide a dedicated "My Duas" section showing all custom duas
4. WHEN a user long-presses a custom dua, THE Dua_Collection_System SHALL show options to edit or delete
5. IF a user confirms deletion, THEN THE Dua_Storage SHALL remove the custom dua permanently
6. THE Dua_Storage SHALL persist custom duas to local storage using AsyncStorage

### Requirement 6: Audio Pronunciation

**User Story:** As a user, I want to hear the correct pronunciation of duas, so that I can learn to recite them properly.

#### Acceptance Criteria

1. WHEN a dua has audio available, THE Dua_Collection_System SHALL display a play button
2. WHEN a user taps the play button, THE Audio_Player SHALL play the dua pronunciation audio
3. WHILE audio is playing, THE Audio_Player SHALL display a pause button and progress indicator
4. WHEN a user taps pause, THE Audio_Player SHALL pause playback and allow resuming
5. IF audio playback fails, THEN THE Audio_Player SHALL display an error message
6. THE Audio_Player SHALL stop playback when navigating away from the dua

### Requirement 7: Search Functionality

**User Story:** As a user, I want to search for duas by keyword, so that I can quickly find specific supplications.

#### Acceptance Criteria

1. THE Dua_Collection_System SHALL provide a search bar on the main Dua Collection screen
2. WHEN a user types in the search bar, THE Dua_Collection_System SHALL filter duas matching the query in real-time
3. THE Dua_Collection_System SHALL search across Arabic text, transliteration, translation, and category names
4. WHEN no results match the search query, THE Dua_Collection_System SHALL display an empty state message
5. WHEN a user clears the search, THE Dua_Collection_System SHALL restore the default category view

### Requirement 8: Dua of the Day

**User Story:** As a user, I want to see a featured dua each day, so that I can learn new supplications regularly.

#### Acceptance Criteria

1. THE Dua_Collection_System SHALL display a "Dua of the Day" card on the main screen
2. THE Dua_Collection_System SHALL rotate the featured dua daily based on the current date
3. WHEN a user taps the "Dua of the Day" card, THE Dua_Collection_System SHALL navigate to the full dua detail view
4. THE Dua_Collection_System SHALL select duas from the complete collection using a deterministic algorithm based on date

### Requirement 9: Share Duas

**User Story:** As a user, I want to share duas with others, so that I can spread beneficial knowledge.

#### Acceptance Criteria

1. WHEN a user taps the share button on a dua, THE Dua_Collection_System SHALL open the native share sheet
2. THE Dua_Collection_System SHALL format the shared content to include Arabic text, transliteration, translation, and source
3. THE Dua_Collection_System SHALL include app attribution in shared content

### Requirement 10: Offline Access

**User Story:** As a user, I want to access duas without internet connection, so that I can use the app anywhere.

#### Acceptance Criteria

1. THE Dua_Collection_System SHALL store all dua data locally within the app bundle
2. THE Favorites_Manager SHALL function fully offline
3. THE Dua_Storage SHALL function fully offline for custom duas
4. IF audio files are not cached, THEN THE Audio_Player SHALL display an offline indicator
