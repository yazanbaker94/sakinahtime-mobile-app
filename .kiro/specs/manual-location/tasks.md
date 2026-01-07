# Implementation Plan: Manual Location for Prayer Times

## Overview

This implementation adds manual location support to the app, allowing users to set their location by searching and selecting a city instead of using GPS. The implementation extends the existing LocationContext and adds new UI components.

## Tasks

- [x] 1. Create city database and types
  - [x] 1.1 Create city types and interfaces
    - Create `client/types/location.ts` with City, ManualLocation, and LocationMode types
    - _Requirements: 2.3, 3.3_
  - [x] 1.2 Create city database JSON file
    - Download and process GeoNames data for cities with population > 50,000
    - Create `client/data/cities.json` with ~15k cities
    - Include: id, name, country, countryCode, latitude, longitude, timezone, population
    - _Requirements: 2.3_
  - [x] 1.3 Write property test for city database completeness
    - **Property 4: Data Completeness**
    - **Validates: Requirements 2.3, 3.3**

- [x] 2. Extend LocationContext with manual location support
  - [x] 2.1 Add storage helpers for location persistence
    - Create functions to save/load location mode, manual location, and recent locations from AsyncStorage
    - _Requirements: 1.4, 3.1, 6.4_
  - [x] 2.2 Extend LocationContext state and interface
    - Add locationMode, manualLocation, recentLocations to state
    - Add setLocationMode, setManualLocation, clearManualLocation functions
    - _Requirements: 5.1, 5.3, 5.4_
  - [x] 2.3 Implement mode switching logic
    - When GPS mode: use existing GPS location logic
    - When Manual mode: use stored manual location
    - Trigger refetch for consumers on mode change
    - _Requirements: 1.2, 1.3, 5.2_
  - [x] 2.4 Implement recent locations management
    - Add to recent when city selected, limit to 5, most recent first
    - _Requirements: 6.1_
  - [x] 2.5 Write property test for location mode switching
    - **Property 1: Location Mode Switching**
    - **Validates: Requirements 1.2, 1.3**
  - [x] 2.6 Write property test for persistence round-trip
    - **Property 2: Location Persistence Round-Trip**
    - **Validates: Requirements 1.4, 3.1, 3.2, 6.4**
  - [x] 2.7 Write property test for recent locations limit
    - **Property 5: Recent Locations Limit**
    - **Validates: Requirements 6.1**

- [x] 3. Checkpoint - Ensure LocationContext tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create city search functionality
  - [x] 4.1 Create city search utility function
    - Implement search that filters by city name or country name
    - Case-insensitive matching
    - Return sorted by population (larger cities first)
    - _Requirements: 2.2, 2.5_
  - [x] 4.2 Write property test for city search filtering
    - **Property 3: City Search Filtering**
    - **Validates: Requirements 2.2, 2.5**

- [x] 5. Create CitySearchModal component
  - [x] 5.1 Create CitySearchModal UI
    - Full-screen modal with search input
    - Display recent locations section at top
    - Display search results below
    - Show city name, country, and timezone for each result
    - _Requirements: 2.1, 2.6, 6.2_
  - [x] 5.2 Implement search with debounce
    - 300ms debounce on search input
    - Show loading indicator while searching
    - _Requirements: 2.2_
  - [x] 5.3 Implement city selection
    - On select: update manual location, add to recent, close modal
    - _Requirements: 2.4, 6.3_
  - [x] 5.4 Write property test for recent location selection
    - **Property 6: Recent Location Selection**
    - **Validates: Requirements 6.3**

- [x] 6. Create LocationSettingsCard component
  - [x] 6.1 Create LocationSettingsCard UI
    - Radio buttons for GPS and Manual mode
    - Show current GPS city when in GPS mode
    - Show manual city with Edit button when in manual mode
    - _Requirements: 1.1_
  - [x] 6.2 Integrate with LocationContext
    - Wire up mode switching
    - Open CitySearchModal when Edit clicked or Manual selected without location
    - _Requirements: 1.2, 1.3, 3.4_

- [x] 7. Integrate into Settings screen
  - [x] 7.1 Add LocationSettingsCard to SettingsScreen
    - Add in appropriate section (near top, before other settings)
    - _Requirements: 1.1_

- [x] 8. Add location indicator to Prayer Times screen
  - [x] 8.1 Create location indicator component
    - Show city name and mode indicator (GPS icon vs pin icon)
    - Make tappable to navigate to settings
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 8.2 Integrate indicator into PrayerTimesScreen
    - Add below header, above prayer times
    - _Requirements: 4.1, 4.2_

- [x] 9. Handle edge cases
  - [x] 9.1 Handle GPS permission denied with no manual location
    - Show suggestion to set manual location
    - _Requirements: 5.5_
  - [x] 9.2 Handle manual mode with no location set
    - Auto-open city search modal
    - _Requirements: 3.4_

- [x] 10. Final checkpoint - Full integration test
  - Ensure all tests pass, ask the user if questions arise.
  - Test full flow: GPS → Manual → search → select → verify prayer times update

- [x] 11. UX Improvement - Move location management to bottom sheet
  - [x] 11.1 Update LocationIndicator to show bottom sheet on tap
    - Bottom sheet includes: current location display, GPS option, Search City option, recent locations
    - Removed navigation to Settings screen
    - _Requirements: 4.3 (improved UX)_
  - [x] 11.2 Remove LocationSettingsCard from Settings screen
    - Location management is now contextual to Prayer Times screen
    - Deleted LocationSettingsCard.tsx component

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- The city database will be ~2-3MB; consider lazy loading if app size is a concern
