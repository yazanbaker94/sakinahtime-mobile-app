# Requirements Document

## Introduction

The Mosque Finder feature enables users to discover nearby mosques using GPS location, view prayer times and Jummah schedules at specific mosques, and get directions. This feature integrates with the existing iqama settings screen, providing a natural entry point for users who want to find mosques with specific iqama times.

## Glossary

- **Mosque_Finder**: The system component responsible for discovering and displaying nearby mosques
- **Google_Places_API**: External service used to search for mosques based on location
- **Maps_Integration**: System component that opens native maps app for directions
- **Mosque_Card**: UI component displaying mosque information in a list
- **Mosque_Detail_Screen**: Screen showing full details of a selected mosque

## Requirements

### Requirement 1: Discover Nearby Mosques

**User Story:** As a Muslim user, I want to find mosques near my current location, so that I can pray in congregation.

#### Acceptance Criteria

1. WHEN the user opens the Mosque Finder screen, THE Mosque_Finder SHALL request the user's current GPS location
2. WHEN location is obtained, THE Mosque_Finder SHALL query Google Places API for mosques within a configurable radius (default 5km)
3. WHEN results are returned, THE Mosque_Finder SHALL display mosques sorted by distance from the user
4. THE Mosque_Card SHALL display mosque name, distance, rating (if available), and open/closed status
5. IF location permission is denied, THEN THE Mosque_Finder SHALL display a message explaining why location is needed with a button to open settings
6. IF no mosques are found within the radius, THEN THE Mosque_Finder SHALL display a helpful message and option to expand search radius

### Requirement 2: View Mosque Details

**User Story:** As a user, I want to view detailed information about a mosque, so that I can decide if it meets my needs.

#### Acceptance Criteria

1. WHEN the user taps on a Mosque_Card, THE Mosque_Finder SHALL navigate to the Mosque_Detail_Screen
2. THE Mosque_Detail_Screen SHALL display mosque name, address, phone number (if available), and website (if available)
3. THE Mosque_Detail_Screen SHALL display mosque photos from Google Places (if available)
4. THE Mosque_Detail_Screen SHALL display user ratings and review count (if available)
5. THE Mosque_Detail_Screen SHALL display operating hours (if available from Google Places)

### Requirement 3: Get Directions to Mosque

**User Story:** As a user, I want to get directions to a mosque, so that I can navigate there easily.

#### Acceptance Criteria

1. WHEN the user taps the "Directions" button on a Mosque_Card or Mosque_Detail_Screen, THE Maps_Integration SHALL open the device's default maps application
2. THE Maps_Integration SHALL pass the mosque's coordinates and name to the maps application
3. THE Maps_Integration SHALL support both Google Maps and Apple Maps based on platform
4. IF no maps application is available, THEN THE Maps_Integration SHALL display an error message

### Requirement 4: Access from Iqama Settings

**User Story:** As a user configuring iqama reminders, I want quick access to find nearby mosques, so that I can set appropriate iqama times based on local mosques.

#### Acceptance Criteria

1. THE NotificationSettingsModal SHALL display a "Find Nearby Mosques" button in the Iqama Reminder section
2. WHEN the user taps the button, THE system SHALL navigate to the Mosque Finder screen
3. THE button SHALL be visible regardless of whether iqama is enabled or disabled

### Requirement 5: Search and Filter Mosques

**User Story:** As a user, I want to search for mosques by name and filter results, so that I can find specific mosques.

#### Acceptance Criteria

1. THE Mosque_Finder SHALL provide a search input field at the top of the screen
2. WHEN the user types in the search field, THE Mosque_Finder SHALL filter results by mosque name
3. THE Mosque_Finder SHALL provide a radius filter option (1km, 5km, 10km, 25km)
4. WHEN the user changes the radius filter, THE Mosque_Finder SHALL re-query and display updated results

### Requirement 6: Offline Handling

**User Story:** As a user with intermittent connectivity, I want the app to handle offline scenarios gracefully.

#### Acceptance Criteria

1. IF the device is offline when opening Mosque Finder, THEN THE Mosque_Finder SHALL display a clear offline message
2. THE Mosque_Finder SHALL provide a "Retry" button when offline
3. WHEN connectivity is restored and user taps Retry, THE Mosque_Finder SHALL attempt to fetch mosque data

### Requirement 7: Loading States

**User Story:** As a user, I want clear feedback while data is loading.

#### Acceptance Criteria

1. WHILE fetching mosque data, THE Mosque_Finder SHALL display a loading indicator
2. WHILE fetching mosque details, THE Mosque_Detail_Screen SHALL display skeleton placeholders
3. THE loading states SHALL not block user interaction with other parts of the screen
