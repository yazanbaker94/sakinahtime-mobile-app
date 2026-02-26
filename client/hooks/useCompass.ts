import { useState, useEffect } from "react";
import * as Location from "expo-location";

interface CompassState {
  heading: number;
  available: boolean;
  error: string | null;
  accuracy: "low" | "medium" | "high";
}

/**
 * Uses Location.watchHeadingAsync() — hooks directly into OS-level sensor fusion
 * (Android: SensorManager.TYPE_ROTATION_VECTOR, iOS: CLLocationManager).
 * Returns trueHeading (magnetic declination already applied by the OS).
 */
export function useCompass() {
  const [state, setState] = useState<CompassState>({
    heading: 0,
    available: false,
    error: null,
    accuracy: "low",
  });

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const init = async () => {
      try {
        subscription = await Location.watchHeadingAsync((data) => {
          // trueHeading includes magnetic declination correction from the OS
          // Falls back to magHeading if trueHeading isn't available
          const h = Math.round(
            data.trueHeading >= 0 ? data.trueHeading : data.magHeading
          );

          // accuracy: iOS returns 0-3, Android returns -1 to 3
          // 3 = high, 2 = medium, 1 = low, 0/-1 = unreliable
          const acc: "low" | "medium" | "high" =
            data.accuracy >= 3 ? "high" : data.accuracy >= 2 ? "medium" : "low";

          setState({
            heading: h,
            available: true,
            error: null,
            accuracy: acc,
          });
        });
      } catch (error) {
        setState({
          heading: 0,
          available: false,
          error: error instanceof Error ? error.message : "Compass unavailable",
          accuracy: "low",
        });
      }
    };

    init();

    return () => {
      subscription?.remove();
    };
  }, []);

  return state;
}

// ─── Qibla Calculation (Great-Circle Bearing) ────────────────────────

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

export function calculateQiblaDirection(latitude: number, longitude: number): number {
  const lat1 = (latitude * Math.PI) / 180;
  const lat2 = (KAABA_LAT * Math.PI) / 180;
  const deltaLng = ((KAABA_LNG - longitude) * Math.PI) / 180;

  const y = Math.sin(deltaLng);
  const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(deltaLng);

  let qibla = Math.atan2(y, x) * (180 / Math.PI);
  qibla = (qibla + 360) % 360;

  return Math.round(qibla);
}

// ─── Distance to Mecca (Haversine) ──────────────────────────────────

export function calculateDistanceToMecca(latitude: number, longitude: number): number {
  const earthRadius = 6371;

  const lat1 = (latitude * Math.PI) / 180;
  const lat2 = (KAABA_LAT * Math.PI) / 180;
  const deltaLat = ((KAABA_LAT - latitude) * Math.PI) / 180;
  const deltaLng = ((KAABA_LNG - longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadius * c);
}

// ─── Direction Helpers ──────────────────────────────────────────────

export function getDirectionLabel(degrees: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

export function getRelativeDirection(
  heading: number,
  qiblaDirection: number
): { angle: number; direction: "left" | "right" | "aligned" } {
  let diff = qiblaDirection - heading;

  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  const absDiff = Math.abs(diff);

  if (absDiff <= 5) {
    return { angle: absDiff, direction: "aligned" };
  }

  return {
    angle: absDiff,
    direction: diff > 0 ? "right" : "left",
  };
}
