import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";
import { Platform, Linking } from "react-native";
import { LocationMode, ManualLocation } from "@/types/location";
import {
  getLocationMode,
  setLocationMode as saveLocationMode,
  getManualLocation,
  setManualLocation as saveManualLocation,
  clearManualLocation as clearSavedManualLocation,
  getRecentLocations,
  addRecentLocation,
} from "@/utils/locationStorage";

interface LocationState {
  // Core location data (works for both GPS and manual)
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country: string | null;
  loading: boolean;
  error: string | null;
  
  // GPS-specific
  permission: Location.PermissionResponse | null;
  requestPermission: () => Promise<Location.PermissionResponse>;
  refetch: () => Promise<void>;
  openSettings: () => Promise<void>;
  canAskAgain: boolean;
  
  // Manual location support
  locationMode: LocationMode;
  manualLocation: ManualLocation | null;
  recentLocations: ManualLocation[];
  setLocationMode: (mode: LocationMode) => Promise<void>;
  setManualLocation: (location: ManualLocation) => Promise<void>;
  clearManualLocation: () => Promise<void>;
  
  // GPS location (always available for reference)
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  gpsCity: string | null;
  gpsCountry: string | null;
}

const LocationContext = createContext<LocationState | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  // GPS state
  const [gpsState, setGpsState] = useState({
    latitude: null as number | null,
    longitude: null as number | null,
    city: null as string | null,
    country: null as string | null,
  });
  
  // Manual location state
  const [locationMode, setLocationModeState] = useState<LocationMode>('gps');
  const [manualLocation, setManualLocationState] = useState<ManualLocation | null>(null);
  const [recentLocations, setRecentLocations] = useState<ManualLocation[]>([]);
  
  // Loading and error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const [permission, requestPermission] = Location.useForegroundPermissions();

  // Load saved settings on mount
  useEffect(() => {
    async function loadSavedSettings() {
      try {
        const [savedMode, savedManual, savedRecent] = await Promise.all([
          getLocationMode(),
          getManualLocation(),
          getRecentLocations(),
        ]);
        
        setLocationModeState(savedMode);
        setManualLocationState(savedManual);
        setRecentLocations(savedRecent);
        setInitialized(true);
      } catch (err) {
        console.error('Failed to load location settings:', err);
        setInitialized(true);
      }
    }
    loadSavedSettings();
  }, []);

  // Fetch GPS location
  const fetchGpsLocation = useCallback(async () => {
    if (!permission?.granted) {
      setError("Location permission not granted");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      let city = null;
      let country = null;

      try {
        const [geocode] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode) {
          city = geocode.city || geocode.subregion || null;
          country = geocode.country || null;
        }
      } catch (geocodeError) {
        // Geocode failed, continue without city/country
      }

      setGpsState({ latitude, longitude, city, country });
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get location");
      setLoading(false);
    }
  }, [permission?.granted]);

  // Fetch GPS when permission granted
  useEffect(() => {
    if (!initialized) return;
    
    if (permission?.granted === true) {
      fetchGpsLocation();
    } else if (permission?.status === "denied" || permission?.status === "undetermined") {
      setLoading(false);
    }
  }, [permission, initialized, fetchGpsLocation]);

  const handleRequestPermission = useCallback(async () => {
    const result = await requestPermission();
    if (result?.granted) {
      await fetchGpsLocation();
    }
    return result;
  }, [requestPermission, fetchGpsLocation]);

  const openSettings = useCallback(async () => {
    if (Platform.OS !== "web") {
      try {
        await Linking.openSettings();
      } catch (err) {
        // Failed to open settings
      }
    }
  }, []);

  // Set location mode
  const handleSetLocationMode = useCallback(async (mode: LocationMode) => {
    try {
      await saveLocationMode(mode);
      setLocationModeState(mode);
      
      // If switching to GPS, refetch
      if (mode === 'gps' && permission?.granted) {
        await fetchGpsLocation();
      }
    } catch (err) {
      console.error('Failed to set location mode:', err);
      throw err;
    }
  }, [permission?.granted, fetchGpsLocation]);

  // Set manual location
  const handleSetManualLocation = useCallback(async (location: ManualLocation) => {
    try {
      await saveManualLocation(location);
      setManualLocationState(location);
      
      // Add to recent locations
      const updated = await addRecentLocation(location);
      setRecentLocations(updated);
      
      // Switch to manual mode
      await saveLocationMode('manual');
      setLocationModeState('manual');
    } catch (err) {
      console.error('Failed to set manual location:', err);
      throw err;
    }
  }, []);

  // Clear manual location
  const handleClearManualLocation = useCallback(async () => {
    try {
      await clearSavedManualLocation();
      setManualLocationState(null);
      
      // Switch back to GPS
      await saveLocationMode('gps');
      setLocationModeState('gps');
    } catch (err) {
      console.error('Failed to clear manual location:', err);
      throw err;
    }
  }, []);

  // Compute effective location based on mode
  const effectiveLocation = locationMode === 'manual' && manualLocation
    ? {
        latitude: manualLocation.latitude,
        longitude: manualLocation.longitude,
        city: manualLocation.city,
        country: manualLocation.country,
      }
    : {
        latitude: gpsState.latitude,
        longitude: gpsState.longitude,
        city: gpsState.city,
        country: gpsState.country,
      };

  return (
    <LocationContext.Provider
      value={{
        // Effective location (based on mode)
        latitude: effectiveLocation.latitude,
        longitude: effectiveLocation.longitude,
        city: effectiveLocation.city,
        country: effectiveLocation.country,
        loading,
        error,
        
        // GPS-specific
        permission,
        requestPermission: handleRequestPermission,
        refetch: fetchGpsLocation,
        openSettings,
        canAskAgain: permission?.canAskAgain ?? true,
        
        // Manual location support
        locationMode,
        manualLocation,
        recentLocations,
        setLocationMode: handleSetLocationMode,
        setManualLocation: handleSetManualLocation,
        clearManualLocation: handleClearManualLocation,
        
        // GPS location (always available)
        gpsLatitude: gpsState.latitude,
        gpsLongitude: gpsState.longitude,
        gpsCity: gpsState.city,
        gpsCountry: gpsState.country,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
