# Requirements Document

## Introduction

This feature allows users to manually set their location for prayer time calculations instead of relying on GPS. This is useful for users who prefer not to grant location permissions, want to check prayer times for a different city, or have unreliable GPS.

## Glossary

- **Manual_Location**: A user-specified location with city name and coordinates stored locally
- **GPS_Location**: The device's current location obtained via location services
- **Location_Mode**: The active location source - either 'gps' or 'manual'
- **City_Database**: A bundled dataset of cities with their coordinates and timezone information
- **Location_Context**: The React context that provides location data to the app

## Requirements

### Requirement 1: Location Mode Selection

**User Story:** As a user, I want to choose between GPS and manual location, so that I can use prayer times without granting location permissions.

#### Acceptance Criteria

1. THE Settings_Screen SHALL display a location settings section with GPS and Manual options
2. WHEN a user selects GPS mode, THE Location_Context SHALL use device location services
3. WHEN a user selects Manual mode, THE Location_Context SHALL use the stored manual location
4. THE Location_Mode SHALL persist across app restarts using AsyncStorage

### Requirement 2: City Search and Selection

**User Story:** As a user, I want to search for and select my city, so that I can set my location without knowing coordinates.

#### Acceptance Criteria

1. WHEN manual mode is selected, THE System SHALL display a city search interface
2. WHEN a user types in the search field, THE System SHALL filter cities matching the query within 300ms
3. THE City_Database SHALL include major cities worldwide with name, country, latitude, longitude, and timezone
4. WHEN a user selects a city, THE System SHALL store the city details as the manual location
5. THE search SHALL support searching by city name or country name
6. THE search results SHALL display city name, country, and timezone

### Requirement 3: Manual Location Storage

**User Story:** As a user, I want my manual location to be saved, so that I don't have to set it every time I open the app.

#### Acceptance Criteria

1. WHEN a manual location is set, THE System SHALL persist it to AsyncStorage
2. WHEN the app starts with manual mode enabled, THE Location_Context SHALL load the saved manual location
3. THE stored location SHALL include city name, country, latitude, longitude, and timezone
4. WHEN no manual location is set but manual mode is selected, THE System SHALL prompt user to select a city

### Requirement 4: Location Indicator

**User Story:** As a user, I want to see which location mode is active, so that I know if prayer times are for my current or manual location.

#### Acceptance Criteria

1. WHEN manual mode is active, THE Prayer_Times_Screen SHALL display an indicator showing the manual city name
2. WHEN GPS mode is active, THE Prayer_Times_Screen SHALL display the detected city name
3. THE location indicator SHALL be tappable to quickly access location settings
4. WHEN manual mode is active, THE indicator SHALL visually distinguish itself from GPS mode (e.g., icon or color)

### Requirement 5: Location Context Integration

**User Story:** As a developer, I want the location context to seamlessly support both modes, so that existing screens work without modification.

#### Acceptance Criteria

1. THE Location_Context SHALL expose the same interface regardless of location mode
2. WHEN location mode changes, THE Location_Context SHALL notify all consumers to refetch data
3. THE Location_Context SHALL expose a `locationMode` property indicating current mode
4. THE Location_Context SHALL expose a `setManualLocation` function for setting manual location
5. IF GPS permission is denied AND no manual location is set, THEN THE System SHALL suggest setting a manual location

### Requirement 6: Recent Locations

**User Story:** As a user, I want quick access to recently used locations, so that I can easily switch between cities I frequently check.

#### Acceptance Criteria

1. THE System SHALL store up to 5 recently selected manual locations
2. WHEN opening the city search, THE System SHALL display recent locations above search results
3. WHEN a user selects a recent location, THE System SHALL set it as the current manual location
4. THE recent locations list SHALL be stored in AsyncStorage
