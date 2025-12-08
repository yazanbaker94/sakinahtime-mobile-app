import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";
import { Platform, Linking } from "react-native";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country: string | null;
  loading: boolean;
  error: string | null;
  permissionStatus: Location.PermissionStatus | null;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    city: null,
    country: null,
    loading: true,
    error: null,
    permissionStatus: null,
  });

  const [permission, requestPermission] = Location.useForegroundPermissions();

  const fetchLocation = useCallback(async () => {
    if (!permission?.granted) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Location permission not granted",
        permissionStatus: permission?.status || null,
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
        console.log("Geocode error:", geocodeError);
      }

      setState({
        latitude,
        longitude,
        city,
        country,
        loading: false,
        error: null,
        permissionStatus: permission.status,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to get location",
        permissionStatus: permission?.status || null,
      }));
    }
  }, [permission?.granted, permission?.status]);

  useEffect(() => {
    if (permission?.granted) {
      fetchLocation();
    } else if (permission?.status === "denied" || permission?.status === "undetermined") {
      setState((prev) => ({
        ...prev,
        loading: false,
        permissionStatus: permission.status,
      }));
    }
  }, [permission?.granted, permission?.status, fetchLocation]);

  const openSettings = useCallback(async () => {
    if (Platform.OS !== "web") {
      try {
        await Linking.openSettings();
      } catch (error) {
        console.log("Error opening settings:", error);
      }
    }
  }, []);

  return {
    ...state,
    permission,
    requestPermission,
    refetch: fetchLocation,
    openSettings,
    canAskAgain: permission?.canAskAgain ?? true,
  };
}
