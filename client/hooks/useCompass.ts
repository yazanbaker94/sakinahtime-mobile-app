import { useState, useEffect, useCallback } from "react";
import { Magnetometer } from "expo-sensors";
import { Platform } from "react-native";

interface CompassState {
  heading: number;
  available: boolean;
  error: string | null;
}

export function useCompass() {
  const [state, setState] = useState<CompassState>({
    heading: 0,
    available: false,
    error: null,
  });

  useEffect(() => {
    let subscription: ReturnType<typeof Magnetometer.addListener> | null = null;

    const initCompass = async () => {
      try {
        const isAvailable = await Magnetometer.isAvailableAsync();
        
        if (!isAvailable) {
          setState((prev) => ({
            ...prev,
            available: false,
            error: Platform.OS === "web" ? "Compass not available on web" : "Magnetometer not available",
          }));
          return;
        }

        setState((prev) => ({ ...prev, available: true, error: null }));

        Magnetometer.setUpdateInterval(100);

        subscription = Magnetometer.addListener((data) => {
          const { x, y } = data;
          let angle = Math.atan2(y, x) * (180 / Math.PI);
          angle = (angle + 360) % 360;
          angle = (360 - angle) % 360;

          setState((prev) => ({
            ...prev,
            heading: Math.round(angle),
          }));
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          available: false,
          error: error instanceof Error ? error.message : "Failed to initialize compass",
        }));
      }
    };

    initCompass();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return state;
}

export function calculateQiblaDirection(latitude: number, longitude: number): number {
  const kaabaLat = 21.4225;
  const kaabaLng = 39.8262;

  const lat1 = (latitude * Math.PI) / 180;
  const lat2 = (kaabaLat * Math.PI) / 180;
  const deltaLng = ((kaabaLng - longitude) * Math.PI) / 180;

  const y = Math.sin(deltaLng);
  const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(deltaLng);

  let qibla = Math.atan2(y, x) * (180 / Math.PI);
  qibla = (qibla + 360) % 360;

  return Math.round(qibla);
}

export function calculateDistanceToMecca(latitude: number, longitude: number): number {
  const kaabaLat = 21.4225;
  const kaabaLng = 39.8262;
  const earthRadius = 6371;

  const lat1 = (latitude * Math.PI) / 180;
  const lat2 = (kaabaLat * Math.PI) / 180;
  const deltaLat = ((kaabaLat - latitude) * Math.PI) / 180;
  const deltaLng = ((kaabaLng - longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadius * c);
}

export function getDirectionLabel(degrees: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}
