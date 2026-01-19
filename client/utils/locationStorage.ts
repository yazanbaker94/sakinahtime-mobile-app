import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LocationMode,
  ManualLocation,
  LOCATION_STORAGE_KEYS,
  MAX_RECENT_LOCATIONS
} from '@/types/location';

/**
 * Storage helpers for location persistence
 */

export async function getLocationMode(): Promise<LocationMode> {
  try {
    const mode = await AsyncStorage.getItem(LOCATION_STORAGE_KEYS.LOCATION_MODE);
    return (mode === 'manual' ? 'manual' : 'gps') as LocationMode;
  } catch (error) {
    console.error('Failed to get location mode:', error);
    return 'gps';
  }
}

export async function setLocationMode(mode: LocationMode): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCATION_STORAGE_KEYS.LOCATION_MODE, mode);
  } catch (error) {
    console.error('Failed to set location mode:', error);
    throw error;
  }
}

export async function getManualLocation(): Promise<ManualLocation | null> {
  try {
    const data = await AsyncStorage.getItem(LOCATION_STORAGE_KEYS.MANUAL_LOCATION);
    if (!data) return null;
    const parsed = JSON.parse(data);
    // Validate required fields
    if (parsed.city && parsed.country &&
      typeof parsed.latitude === 'number' &&
      typeof parsed.longitude === 'number' &&
      parsed.timezone) {
      return parsed as ManualLocation;
    }
    return null;
  } catch (error) {
    console.error('Failed to get manual location:', error);
    return null;
  }
}

export async function setManualLocation(location: ManualLocation): Promise<void> {
  try {
    await AsyncStorage.setItem(
      LOCATION_STORAGE_KEYS.MANUAL_LOCATION,
      JSON.stringify(location)
    );
  } catch (error) {
    console.error('Failed to set manual location:', error);
    throw error;
  }
}

export async function clearManualLocation(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOCATION_STORAGE_KEYS.MANUAL_LOCATION);
  } catch (error) {
    console.error('Failed to clear manual location:', error);
    throw error;
  }
}

export async function getRecentLocations(): Promise<ManualLocation[]> {
  try {
    const data = await AsyncStorage.getItem(LOCATION_STORAGE_KEYS.RECENT_LOCATIONS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed.filter(loc =>
        loc.city && loc.country &&
        typeof loc.latitude === 'number' &&
        typeof loc.longitude === 'number' &&
        loc.timezone
      ).slice(0, MAX_RECENT_LOCATIONS);
    }
    return [];
  } catch (error) {
    console.error('Failed to get recent locations:', error);
    return [];
  }
}

export async function addRecentLocation(location: ManualLocation): Promise<ManualLocation[]> {
  try {
    const recent = await getRecentLocations();

    // Remove if already exists (to move to front)
    const filtered = recent.filter(loc =>
      !(loc.latitude === location.latitude && loc.longitude === location.longitude)
    );

    // Add to front and limit to MAX_RECENT_LOCATIONS
    const updated = [location, ...filtered].slice(0, MAX_RECENT_LOCATIONS);

    await AsyncStorage.setItem(
      LOCATION_STORAGE_KEYS.RECENT_LOCATIONS,
      JSON.stringify(updated)
    );

    return updated;
  } catch (error) {
    console.error('Failed to add recent location:', error);
    throw error;
  }
}

export async function clearRecentLocations(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOCATION_STORAGE_KEYS.RECENT_LOCATIONS);
  } catch (error) {
    console.error('Failed to clear recent locations:', error);
    throw error;
  }
}

/**
 * Cached GPS location for fallback when GPS is unavailable
 */
export interface CachedGpsLocation {
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  timestamp: number; // When it was cached (Date.now())
}

export async function getLastGpsLocation(): Promise<CachedGpsLocation | null> {
  try {
    const data = await AsyncStorage.getItem(LOCATION_STORAGE_KEYS.LAST_GPS_LOCATION);
    if (!data) return null;
    const parsed = JSON.parse(data);
    // Validate required fields
    if (typeof parsed.latitude === 'number' &&
      typeof parsed.longitude === 'number' &&
      typeof parsed.timestamp === 'number') {
      return parsed as CachedGpsLocation;
    }
    return null;
  } catch (error) {
    console.error('Failed to get cached GPS location:', error);
    return null;
  }
}

export async function setLastGpsLocation(location: CachedGpsLocation): Promise<void> {
  try {
    await AsyncStorage.setItem(
      LOCATION_STORAGE_KEYS.LAST_GPS_LOCATION,
      JSON.stringify(location)
    );
  } catch (error) {
    console.error('Failed to cache GPS location:', error);
    // Don't throw - caching is non-critical
  }
}
