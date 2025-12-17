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
    console.log('[useLocation] fetchLocation called, permission:', permission?.granted);
    
    if (!permission?.granted) {
      console.log('[useLocation] Permission not granted, status:', permission?.status);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Location permission not granted",
        permissionStatus: permission?.status || null,
      }));
      return;
    }

    try {
      console.log('[useLocation] Starting location fetch...');
      setState((prev) => ({ ...prev, loading: true, error: null, latitude: null, longitude: null }));

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      console.log('[useLocation] Got coordinates:', { latitude, longitude });

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
    console.log('[useLocation] Permission effect triggered:', { 
      granted: permission?.granted, 
      status: permission?.status,
      permission: permission
    });
    
    if (permission?.granted === true) {
      console.log('[useLocation] Permission granted, calling fetchLocation');
      fetchLocation();
    } else if (permission?.status === "denied" || permission?.status === "undetermined") {
      console.log('[useLocation] Permission denied/undetermined');
      setState((prev) => ({
        ...prev,
        loading: false,
        permissionStatus: permission.status,
      }));
    }
  }, [permission]);

  const openSettings = useCallback(async () => {
    if (Platform.OS !== "web") {
      try {
        await Linking.openSettings();
      } catch (error) {
        console.log("Error opening settings:", error);
      }
    }
  }, []);

  const handleRequestPermission = useCallback(async () => {
    console.log('[useLocation] handleRequestPermission called');
    const result = await requestPermission();
    console.log('[useLocation] Permission request result:', result);
    if (result?.granted) {
      console.log('[useLocation] Permission granted, fetching location directly');
      try {
        setState((prev) => ({ ...prev, loading: true, error: null, latitude: null, longitude: null }));

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = location.coords;
        console.log('[useLocation] Got coordinates:', { latitude, longitude });

        let city = null;
        let country = null;

        try {
          const [geocode] = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (geocode) {
            city = geocode.city || geocode.subregion || null;
            country = geocode.country || null;
          }
        } catch (geocodeError) {
          console.log('Geocode error:', geocodeError);
        }

        setState({
          latitude,
          longitude,
          city,
          country,
          loading: false,
          error: null,
          permissionStatus: result.status,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Failed to get location",
          permissionStatus: result.status,
        }));
      }
    }
    return result;
  }, [requestPermission]);

  return {
    ...state,
    permission,
    requestPermission: handleRequestPermission,
    refetch: fetchLocation,
    openSettings,
    canAskAgain: permission?.canAskAgain ?? true,
  };
}
