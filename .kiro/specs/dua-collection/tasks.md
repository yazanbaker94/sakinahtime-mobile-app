# Implementation Plan: Dua Collection

## Overview

This implementation plan breaks down the Dua Collection feature into incremental coding tasks. Each task builds on previous work, ensuring no orphaned code. The plan follows the existing app architecture patterns established in the Azkar feature.

## Tasks

- [x] 1. Set up types and data structures
  - [x] 1.1 Create dua type definitions
    - Create `client/types/dua.ts` with Dua, DuaCategory, CustomDua, DuaFasrite interfaces
    - Include DuaSource and HadithGrade type unions
    - _Requirements: 1.4, 2.2, 3.2_
  - [x] 1.2 Create dua categories data
    - Create `client/data/duaCategories.ts` with 12 category definitions
    - Include icons, Arabic/English titles, and counts
    - _Requirements: 1.3_
  - [x] 1.3 Create initial dua data file
    - Create `client/data/duaData.ts` with sample Quranic and Prophetic duas
    - Include at least 10 Quranic duas and 10 Prophetic duas for initial testing
    - _Requirements: 2.4, 3.4_
  - [x] 1.4 Write property test for dua data completeness
    - **Property 2: Dua Data Completeness**
    - **Validates: Requirements 1.4**

- [x] 2. Implement storage services
  - [x] 2.1 Create DuaFavoritesService
    - Create `client/services/DuaFavoritesService.ts`
    - Implement getFavorites, addFavorite, removeFavorite, isFavorite, clearAll methods
    - Use AsyncStorage with @dua_favorites key
    - _Requirements: 4.5, 4.6_
  - [x] 2.2 Write property test for favorites persistence
    - **Property 6: Favorites Persistence Round-Trip**
    - **Validates: Requirements 4.5, 4.6**
  - [x] 2.3 Create CustomDuaService
    - Create `client/services/CustomDuaService.ts`
    - Implement getAll, getById, create, update, delete methods
    - Use AsyncStorage with @custom_duas key
    - Generate unique IDs and timestamps
    - _Requirements: 5.2, 5.5, 5.6_
  - [x] 2.4 Write property test for custom dua persistence
    - **Property 7: Custom Dua Persistence Round-Trip**
    - **Validates: Requirements 5.2, 5.6**
  - [x] 2.5 Write property test for custom dua deletion
    - **Property 8: Custom Dua Deletion Removes From Storage**
    - **Validates: Requirements 5.5**

- [x] 3. Checkpoint - Verify services
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement custom hooks
  - [x] 4.1 Create useDuaCollection hook
    - Create `client/hooks/useDuaCollection.ts`
    - Implement categories, getDuasByCategory, getDuaById, searchDuas, duaOfTheDay
    - Load data from duaData.ts
    - _Requirements: 1.2, 7.2, 7.3, 8.2_
  - [x] 4.2 Write property test for category filtering
    - **Property 1: Category Filtering Returns Only Matching Duas**
    - **Validates: Requirements 1.2**
  - [x] 4.3 Write property test for search functionality
    - **Property 10: Search Results Match Query**
    - **Validates: Requirements 7.2, 7.3**
  - [x] 4.4 Write property test for dua of the day
    - **Property 11: Dua of the Day Determinism**
    - **Validates: Requirements 8.2, 8.4**
  - [x] 4.5 Create useDuaFavorites hook
    - Create `client/hooks/useDuaFavorites.ts`
    - Wrap DuaFavoritesService with React state management
    - Implement favorites, isFavorite, toggleFavorite, addFavorite, removeFavorite
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 4.6 Write property test for favorites toggle
    - **Property 5: Favorites Toggle Consistency**
    - **Validates: Requirements 4.1, 4.2**
  - [x] 4.7 Create useCustomDuas hook
    - Create `client/hooks/useCustomDuas.ts`
    - Wrap CustomDuaService with React state management
    - Implement customDuas, addCustomDua, updateCustomDua, deleteCustomDua
    - _Requirements: 5.1, 5.2, 5.4, 5.5_
  - [x] 4.8 Create useDuaAudio hook
    - Create `client/hooks/useDuaAudio.ts`
    - Use expo-av for audio playback
    - Implement play, pause, stop, seekTo with state tracking
    - _Requirements: 6.2, 6.3, 6.4, 6.6_

- [x] 5. Checkpoint - Verify hooks
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement UI components
  - [x] 6.1 Create FavoriteButton component
    - Create `client/components/FavoriteButton.tsx`
    - Heart icon with filled/outline states
    - Animated toggle feedback
    - _Requirements: 4.1, 4.2_
  - [x] 6.2 Create DuaCard component
    - Create `client/components/DuaCard.tsx`
    - Support compact and full variants
    - Display Arabic text, transliteration, translation, source
    - Include favorite button, share button, audio button slots
    - _Requirements: 1.4, 2.2, 3.2_
  - [x] 6.3 Write property test for audio availability indicator
    - **Property 9: Audio Availability Indicator**
    - **Validates: Requirements 6.1**
  - [x] 6.4 Create DuaAudioPlayer component
    - Create `client/components/DuaAudioPlayer.tsx`
    - Play/pause button, progress bar, duration display
    - Loading and error states
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 6.5 Create DuaOfTheDay component
    - Create `client/components/DuaOfTheDay.tsx`
    - Compact card with Arabic preview and translation snippet
    - Tap to navigate to detail
    - _Requirements: 8.1, 8.3_

- [x] 7. Implement screens
  - [x] 7.1 Create DuaCollectionScreen
    - Create `client/screens/DuaCollectionScreen.tsx`
    - Tab navigation: Categories | Quranic | Prophetic | Favorites | My Duas
    - Search bar with real-time filtering
    - Dua of the Day card at top
    - Category grid with icons
    - _Requirements: 1.1, 1.3, 2.1, 3.1, 4.3, 5.3, 7.1, 8.1_
  - [x] 7.2 Create DuaDetailScreen
    - Create `client/screens/DuaDetailScreen.tsx`
    - Full dua display with DuaCard (full variant)
    - Audio player integration
    - Favorite toggle in header
    - Share button in header
    - Navigate to Mushaf for Quranic duas
    - _Requirements: 2.3, 6.1, 6.2, 6.3, 6.4, 9.1_
  - [x] 7.3 Implement share functionality
    - Add share handler using React Native Share API
    - Format dua content with Arabic, transliteration, translation, source, attribution
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 7.4 Write property test for share content
    - **Property 12: Share Content Completeness**
    - **Validates: Requirements 9.2, 9.3**
  - [x] 7.5 Create CustomDuaFormScreen
    - Create `client/screens/CustomDuaFormScreen.tsx`
    - Form fields: Arabic (optional), transliteration (optional), translation (required), notes (optional)
    - Save and cancel buttons
    - Edit mode for existing duas
    - Validation for required field
    - _Requirements: 5.1, 5.2, 5.4_

- [x] 8. Checkpoint - Verify screens
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Navigation and integration
  - [x] 9.1 Add navigation routes
    - Update `client/navigation/RootStackNavigator.tsx` with DuaCollection, DuaDetail, CustomDuaForm routes
    - Add route params types to RootStackParamList
    - _Requirements: 2.3, 8.3_
  - [x] 9.2 Integrate with existing Azkar tab
    - Add "Duas" tab to AzkarScreen tab selector (alongside Azkar and Islamic Guides)
    - Or create separate navigation entry point based on app structure
    - _Requirements: 1.1_
  - [x] 9.3 Add Mushaf navigation for Quranic duas
    - Implement navigation from Quranic dua reference to MushafScreen with surah/ayah params
    - _Requirements: 2.3_

- [x] 10. Expand dua data
  - [x] 10.1 Add complete Quranic duas
    - Expand duaData.ts with 40+ Quranic duas
    - Include major themes: guidance, forgiveness, protection, gratitude, patience
    - Verify surah/ayah references
    - _Requirements: 2.4_
  - [x] 10.2 Add complete Prophetic duas
    - Expand duaData.ts with 50+ Prophetic duas
    - Include hadith sources and grades
    - Cover all categories
    - _Requirements: 3.4_
  - [x] 10.3 Write property test for Quranic dua structure
    - **Property 3: Quranic Dua Structure Validity**
    - **Validates: Requirements 2.2**
  - [x] 10.4 Write property test for Prophetic dua source
    - **Property 4: Prophetic Dua Source Validity**
    - **Validates: Requirements 3.2, 3.3**

- [x] 11. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all 12 categories have duas
  - Verify favorites persist across app restart
  - Verify custom duas CRUD operations
  - Verify search works across all fields
  - Verify dua of the day changes daily

## Notes

- All tasks including property-based tests are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The implementation follows existing patterns from AzkarScreen and related components
- Audio files will need to be sourced/created separately - initial implementation can work without audio
