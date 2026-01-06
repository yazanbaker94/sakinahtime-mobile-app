# Implementation Plan: Mosque Finder

## Overview

This implementation plan breaks down the Mosque Finder feature into discrete coding tasks. The approach is to build the foundation (types, services) first, then the hook, then the UI components, and finally integrate with the existing iqama settings.

## Tasks

- [x] 1. Set up project structure and types
  - Create `client/types/mosque.ts` with Mosque and MosqueDetail interfaces
  - Create `client/constants/mosque.ts` with radius options and defaults
  - Add MosqueFinderScreen and MosqueDetailScreen to RootStackNavigator
  - _Requirements: 1.2, 1.3, 5.3_

- [x] 2. Implement MapsIntegrationService
  - [x] 2.1 Create `client/services/MapsIntegrationService.ts`
    - Implement `getMapsUrl()` for iOS (maps://) and Android (geo:)
    - Implement `openDirections()` using Linking API
    - Handle errors when maps app is unavailable
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 2.2 Write property test for maps URL generation
    - **Property 5: Maps URL Generation**
    - **Validates: Requirements 3.2, 3.3**

- [x] 3. Implement MosqueApiService
  - [x] 3.1 Create `client/services/MosqueApiService.ts`
    - Implement `searchNearbyMosques()` using Google Places Nearby Search
    - Implement `getMosqueDetails()` using Google Places Details
    - Calculate distance from user location
    - Parse and transform API responses to Mosque/MosqueDetail types
    - _Requirements: 1.2, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Write unit tests for API response parsing
    - Test mosque data transformation
    - Test distance calculation
    - _Requirements: 1.2_

- [x] 4. Implement useMosqueFinder hook
  - [x] 4.1 Create `client/hooks/useMosqueFinder.ts`
    - Manage mosques state, loading, error
    - Integrate with useLocation for GPS coordinates
    - Implement search query state and filtering
    - Implement radius state and re-fetching
    - Sort results by distance
    - _Requirements: 1.1, 1.2, 1.3, 5.2, 5.4_

  - [x] 4.2 Write property test for distance sorting
    - **Property 1: Mosque List Sorted by Distance**
    - **Validates: Requirements 1.3**

  - [x] 4.3 Write property test for search filtering
    - **Property 2: Search Filter Correctness**
    - **Validates: Requirements 5.2**

- [x] 5. Checkpoint - Ensure all tests pass
  - All tests pass

- [x] 6. Implement MosqueCard component
  - [x] 6.1 Create `client/components/MosqueCard.tsx`
    - Display mosque name, distance, rating, open/closed status
    - Add "Directions" button that calls MapsIntegrationService
    - Handle tap to navigate to detail screen
    - Style consistent with app theme
    - _Requirements: 1.4, 3.1_

  - [x] 6.2 Write property test for card data completeness
    - **Property 3: Mosque Card Data Completeness**
    - **Validates: Requirements 1.4**

- [x] 7. Implement MosqueFinderScreen
  - [x] 7.1 Create `client/screens/MosqueFinderScreen.tsx`
    - Add search input at top
    - Add radius filter dropdown
    - Display list of MosqueCard components
    - Handle loading state with spinner
    - Handle error state with retry button
    - Handle empty state with expand radius suggestion
    - Handle location permission denied state
    - _Requirements: 1.1, 1.5, 1.6, 5.1, 5.3, 6.1, 6.2, 7.1_

- [x] 8. Implement MosqueDetailScreen
  - [x] 8.1 Create `client/screens/MosqueDetailScreen.tsx`
    - Display mosque name, address, phone, website
    - Display photos in horizontal scroll
    - Display ratings and review count
    - Display operating hours
    - Add "Get Directions" button
    - Handle loading state with skeleton placeholders
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 7.2_

  - [x] 8.2 Write property test for detail data completeness
    - **Property 4: Mosque Detail Data Completeness**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

- [x] 9. Integrate with Iqama Settings
  - [x] 9.1 Update `client/components/NotificationSettingsModal.tsx`
    - Add "Find Nearby Mosques" button in Iqama section
    - Button should be visible regardless of iqama enabled state
    - Navigate to MosqueFinderScreen on tap
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 9.2 Write property test for button visibility
    - **Property 7: Find Mosques Button Visibility**
    - **Validates: Requirements 4.3**

- [x] 10. Final checkpoint - Ensure all tests pass
  - All tests pass

## Notes

- All tasks including property tests are required for comprehensive coverage
- Google Places API requires an API key - ensure it's configured in environment
- The feature uses the existing useLocation hook from LocationContext
- Distance is calculated client-side using Haversine formula
- Photos require a separate API call to get the actual image URL
