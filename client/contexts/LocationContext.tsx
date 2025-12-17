import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";
import { Platform, Linking } from "react-native";

interface LocationState {
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
}

const LocationContext = createContext<LocationState | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState({
    latitude: null as number | null,
    longitude: null as number | null,
    city: null as string | null,
    country: null as string | null,
    loading: true,
    error: null as string | null,
  });

  const [permission, requestPermission] = Location.useForegroundPermissions();

  const fetchLocation = useCallback(async () => {
    if (!permission?.granted) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Location permission not granted",
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

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

      setState({
        latitude,
        longitude,
        city,
        country,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to get location",
      }));
    }
  }, [permission?.granted]);

  useEffect(() => {
    if (permission?.granted === true) {
      fetchLocation();
    } else if (permission?.status === "denied" || permission?.status === "undetermined") {
      setState((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  }, [permission]);

  const handleRequestPermission = useCallback(async () => {
    const result = await requestPermission();
    if (result?.granted) {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

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

        setState({
          latitude,
          longitude,
          city,
          country,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Failed to get location",
        }));
      }
    }
    return result;
  }, [requestPermission]);

  const openSettings = useCallback(async () => {
    if (Platform.OS !== "web") {
      try {
        await Linking.openSettings();
      } catch (error) {
        // Failed to open settings
      }
    }
  }, []);

  return (
    <LocationContext.Provider
      value={{
        ...state,
        permission,
        requestPermission: handleRequestPermission,
        refetch: fetchLocation,
        openSettings,
        canAskAgain: permission?.canAskAgain ?? true,
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
