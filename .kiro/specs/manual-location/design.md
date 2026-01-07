# Design Document: Manual Location for Prayer Times

## Overview

This feature extends the existing LocationContext to support manual location selection alongside GPS-based location. Users can search and select from a bundled database of cities, with the selected location persisted locally. The design prioritizes minimal changes to existing screens while providing a seamless experience.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      LocationContext                         │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │  GPS Mode   │    │ Manual Mode  │    │ Mode Manager  │  │
│  │  (existing) │    │   (new)      │    │   (new)       │  │
│  └─────────────┘    └──────────────┘    └───────────────┘  │
│         │                  │                    │           │
│         └──────────────────┴────────────────────┘           │
│                           │                                  │
│              ┌────────────▼────────────┐                    │
│              │   Unified Location API   │                    │
│              │ (latitude, longitude,    │                    │
│              │  city, country, mode)    │                    │
│              └─────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │  Prayer    │  │   Qibla    │  │  Mosque    │
    │  Times     │  │   Screen   │  │  Finder    │
    └────────────┘  └────────────┘  └────────────┘
```

## Components and Interfaces

### 1. Extended LocationContext Interface

```typescript
interface ManualLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

interface LocationState {
  // Existing fields
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country: string | null;
  loading: boolean;
  error: string | null;
  permission: Location.PermissionResponse | null;
  requestPermission: () => Promise<Location.PermissionResponse>;
  refetch: () => Promise<void>;
  openSettings: () => Promise<void>;
  canAskAgain: boolean;
  
  // New fields for manual location
  locationMode: 'gps' | 'manual';
  manualLocation: ManualLocation | null;
  recentLocations: ManualLocation[];
  setLocationMode: (mode: 'gps' | 'manual') => Promise<void>;
  setManualLocation: (location: ManualLocation) => Promise<void>;
  clearManualLocation: () => Promise<void>;
}
```

### 2. City Database Structure

```typescript
interface City {
  id: string;           // Unique identifier
  name: string;         // City name
  country: string;      // Country name
  countryCode: string;  // ISO country code
  latitude: number;
  longitude: number;
  timezone: string;     // IANA timezone (e.g., "America/New_York")
  population?: number;  // For sorting by relevance
}
```

### 3. CitySearchModal Component

```typescript
interface CitySearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCity: (city: City) => void;
  recentLocations: ManualLocation[];
}
```

### 4. LocationSettingsCard Component

```typescript
interface LocationSettingsCardProps {
  currentMode: 'gps' | 'manual';
  manualLocation: ManualLocation | null;
  gpsCity: string | null;
  onModeChange: (mode: 'gps' | 'manual') => void;
  onSelectCity: () => void;
}
```

## Data Models

### AsyncStorage Keys

```typescript
const STORAGE_KEYS = {
  LOCATION_MODE: '@sakinah/location_mode',        // 'gps' | 'manual'
  MANUAL_LOCATION: '@sakinah/manual_location',    // ManualLocation JSON
  RECENT_LOCATIONS: '@sakinah/recent_locations',  // ManualLocation[] JSON
};
```

### City Database Format

The city database will be a JSON file bundled with the app containing ~15,000 cities with population > 50,000. Structure:

```json
{
  "cities": [
    {
      "id": "new-york-us",
      "name": "New York",
      "country": "United States",
      "countryCode": "US",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "timezone": "America/New_York",
      "population": 8336817
    }
  ]
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Location Mode Switching

*For any* location mode (GPS or manual), when the mode is changed, the LocationContext SHALL provide coordinates from the correct source - GPS coordinates when in GPS mode, manual coordinates when in manual mode.

**Validates: Requirements 1.2, 1.3**

### Property 2: Location Persistence Round-Trip

*For any* valid ManualLocation object and location mode, storing to AsyncStorage and then loading on app restart SHALL produce an equivalent location and mode.

**Validates: Requirements 1.4, 3.1, 3.2, 6.4**

### Property 3: City Search Filtering

*For any* search query string, all returned cities SHALL contain the query string in either the city name OR country name (case-insensitive).

**Validates: Requirements 2.2, 2.5**

### Property 4: Data Completeness

*For any* city in the City_Database and any stored ManualLocation, the object SHALL contain all required fields: name, country, latitude, longitude, and timezone with valid values.

**Validates: Requirements 2.3, 3.3**

### Property 5: Recent Locations Limit

*For any* sequence of city selections, the recent locations list SHALL never contain more than 5 items, with the most recently selected cities appearing first.

**Validates: Requirements 6.1**

### Property 6: Recent Location Selection

*For any* recent location selected by the user, the current manual location SHALL be updated to match that recent location exactly.

**Validates: Requirements 6.3**

## Error Handling

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| AsyncStorage read failure | Fall back to GPS mode, log error |
| AsyncStorage write failure | Show toast error, retry once |
| Invalid stored data | Clear corrupted data, reset to GPS mode |
| City database load failure | Show error state, allow retry |
| No cities match search | Show "No results" message |
| Manual mode with no location set | Prompt to select city |

## Testing Strategy

### Unit Tests
- LocationContext mode switching logic
- City search filtering algorithm
- AsyncStorage persistence helpers
- Recent locations management (add, limit, order)

### Property-Based Tests
- **Property 1**: Generate random mode switches, verify correct coordinate source
- **Property 2**: Generate random ManualLocation objects, verify round-trip persistence
- **Property 3**: Generate random search queries, verify all results match query
- **Property 4**: Validate all cities in database have required fields
- **Property 5**: Generate sequences of city selections, verify list never exceeds 5
- **Property 6**: Generate recent location selections, verify current location updates

### Integration Tests
- Full flow: select manual mode → search city → select → verify prayer times update
- Mode persistence across app restart simulation
- Recent locations display and selection

## UI/UX Design

### Settings Screen - Location Section

```
┌─────────────────────────────────────────┐
│ 📍 Location                             │
├─────────────────────────────────────────┤
│                                         │
│  ○ Use GPS Location                     │
│    Currently: New York, US              │
│                                         │
│  ● Use Manual Location                  │
│    📍 London, United Kingdom     [Edit] │
│                                         │
└─────────────────────────────────────────┘
```

### City Search Modal

```
┌─────────────────────────────────────────┐
│ ← Select City                           │
├─────────────────────────────────────────┤
│ 🔍 Search cities...                     │
├─────────────────────────────────────────┤
│ RECENT                                  │
│ ┌─────────────────────────────────────┐ │
│ │ 📍 London, United Kingdom           │ │
│ │    Europe/London                    │ │
│ ├─────────────────────────────────────┤ │
│ │ 📍 Dubai, UAE                       │ │
│ │    Asia/Dubai                       │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ ALL CITIES                              │
│ ┌─────────────────────────────────────┐ │
│ │ 📍 New York, United States          │ │
│ │    America/New_York                 │ │
│ ├─────────────────────────────────────┤ │
│ │ 📍 Los Angeles, United States       │ │
│ │    America/Los_Angeles              │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Prayer Times Screen - Location Indicator

```
┌─────────────────────────────────────────┐
│ Prayer Times                            │
│ ┌─────────────────────────────────────┐ │
│ │ 📍 London, UK (Manual)        [⚙️]  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Prayer times content...]               │
└─────────────────────────────────────────┘
```

## Implementation Notes

1. **City Database Source**: Use GeoNames database (free, CC license) filtered to cities with population > 50,000
2. **Search Performance**: Use simple string matching with debounce; database is small enough (~15k cities) for in-memory search
3. **Timezone Handling**: Store IANA timezone with manual location for accurate prayer time calculations
4. **Migration**: Existing users default to GPS mode; no data migration needed
