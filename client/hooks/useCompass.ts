import { useState, useEffect, useRef } from "react";
import { Magnetometer, Accelerometer } from "expo-sensors";
import { Platform } from "react-native";
import * as Location from "expo-location";

interface CompassState {
  heading: number;
  available: boolean;
  error: string | null;
  accuracy: "low" | "medium" | "high";
  declination: number;
}

interface SensorData {
  x: number;
  y: number;
  z: number;
}

const LOW_PASS_ALPHA = 0.2; // Lower = more smoothing, less jitter

function applyLowPassFilter(
  current: SensorData,
  previous: SensorData | null
): SensorData {
  if (!previous) return current;
  return {
    x: previous.x + LOW_PASS_ALPHA * (current.x - previous.x),
    y: previous.y + LOW_PASS_ALPHA * (current.y - previous.y),
    z: previous.z + LOW_PASS_ALPHA * (current.z - previous.z),
  };
}

function calculateTiltCompensatedHeading(
  mag: SensorData,
  accel: SensorData
): number {
  const ax = accel.x;
  const ay = accel.y;
  const az = accel.z;
  const mx = mag.x;
  const my = mag.y;
  const mz = mag.z;

  const normA = Math.sqrt(ax * ax + ay * ay + az * az);
  if (normA < 0.1) return 0;

  const axNorm = ax / normA;
  const ayNorm = ay / normA;
  const azNorm = az / normA;

  const pitch = Math.asin(-axNorm);
  const roll = Math.atan2(ayNorm, azNorm);

  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);
  const cosRoll = Math.cos(roll);
  const sinRoll = Math.sin(roll);

  const xH = mx * cosPitch + my * sinRoll * sinPitch + mz * cosRoll * sinPitch;
  const yH = my * cosRoll - mz * sinRoll;

  let heading = Math.atan2(yH, xH) * (180 / Math.PI);
  heading = (heading + 360) % 360;

  return heading;
}

export function useCompass() {
  const [state, setState] = useState<CompassState>({
    heading: 0,
    available: false,
    error: null,
    accuracy: "low",
    declination: 0,
  });
  const [magneticDeclination, setMagneticDeclination] = useState(0);

  const magDataRef = useRef<SensorData | null>(null);
  const accelDataRef = useRef<SensorData | null>(null);
  const lastMagRef = useRef<SensorData | null>(null);
  const lastAccelRef = useRef<SensorData | null>(null);
  const headingHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    let magSubscription: ReturnType<typeof Magnetometer.addListener> | null = null;
    let accelSubscription: ReturnType<typeof Accelerometer.addListener> | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const initCompass = async () => {
      try {
        // Get magnetic declination for Android
        if (Platform.OS === 'android') {
          try {
            // Check if location permission is granted before trying to get location
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status === 'granted') {
              const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Lowest, // Use lowest accuracy for declination
              });
              const { latitude, longitude } = location.coords;

              // Calculate magnetic declination using World Magnetic Model
              // This is an approximation - for production, use a proper WMM library
              const declination = await getMagneticDeclination(latitude, longitude);
              setMagneticDeclination(declination);
            } else {
              console.log('Location permission not granted, skipping magnetic declination');
            }
          } catch (error) {
            console.warn('Could not get magnetic declination:', error);
            // Continue without declination - compass will still work
          }
        }

        const [magAvailable, accelAvailable] = await Promise.all([
          Magnetometer.isAvailableAsync(),
          Accelerometer.isAvailableAsync(),
        ]);

        if (!magAvailable) {
          setState((prev) => ({
            ...prev,
            available: false,
            error:
              Platform.OS === "web"
                ? "Compass not available on web"
                : "Magnetometer not available",
          }));
          return;
        }

        setState((prev) => ({ ...prev, available: true, error: null }));

        Magnetometer.setUpdateInterval(16);
        if (accelAvailable) {
          Accelerometer.setUpdateInterval(16);
        }

        magSubscription = Magnetometer.addListener((data) => {
          const filtered = applyLowPassFilter(data, lastMagRef.current);
          lastMagRef.current = filtered;
          magDataRef.current = filtered;
        });

        if (accelAvailable) {
          accelSubscription = Accelerometer.addListener((data) => {
            const filtered = applyLowPassFilter(data, lastAccelRef.current);
            lastAccelRef.current = filtered;
            accelDataRef.current = filtered;
          });
        }

        intervalId = setInterval(() => {
          const mag = magDataRef.current;
          const accel = accelDataRef.current;

          if (!mag) return;

          let heading: number;

          if (accel) {
            heading = calculateTiltCompensatedHeading(mag, accel);
            // iOS needs 270 degree offset, Android needs 180 degree offset
            if (Platform.OS === 'ios') {
              heading = (270 - heading + 360) % 360;
            } else {
              // Android: subtract 90 degrees to match iOS
              heading = (heading - 90 + 360) % 360;
            }
          } else {
            const { x, y } = mag;
            let angle = Math.atan2(y, x) * (180 / Math.PI);
            angle = (angle + 360) % 360;
            if (Platform.OS === 'ios') {
              heading = (360 - angle) % 360;
            } else {
              // Android: subtract 90 degrees to match iOS
              heading = (angle - 90 + 360) % 360;
            }
          }

          headingHistoryRef.current.push(heading);
          if (headingHistoryRef.current.length > 5) {
            headingHistoryRef.current.shift();
          }

          const history = headingHistoryRef.current;
          let smoothedHeading: number;

          if (history.length >= 3) {
            const sinSum = history.reduce((sum, h) => sum + Math.sin((h * Math.PI) / 180), 0);
            const cosSum = history.reduce((sum, h) => sum + Math.cos((h * Math.PI) / 180), 0);
            smoothedHeading = (Math.atan2(sinSum, cosSum) * 180) / Math.PI;
            smoothedHeading = (smoothedHeading + 360) % 360;
          } else {
            smoothedHeading = heading;
          }

          const variance = history.length >= 3
            ? history.reduce((sum, h) => {
              let diff = Math.abs(h - smoothedHeading);
              if (diff > 180) diff = 360 - diff;
              return sum + diff * diff;
            }, 0) / history.length
            : 100;

          let accuracy: "low" | "medium" | "high" = "low";
          if (variance < 25) accuracy = "high";
          else if (variance < 100) accuracy = "medium";

          // Apply magnetic declination to get true north
          let trueHeading = smoothedHeading;
          if (Platform.OS === 'android' && magneticDeclination !== 0) {
            // Apply declination correction for Android
            trueHeading = (smoothedHeading + magneticDeclination + 360) % 360;
          }

          const roundedHeading = Math.round(trueHeading);

          // Dead zone: only update if change is >= 2 degrees to prevent jitter
          setState((prev) => {
            let headingDiff = Math.abs(prev.heading - roundedHeading);
            if (headingDiff > 180) headingDiff = 360 - headingDiff;

            // Skip update if change is less than 2 degrees (reduces jitter)
            if (headingDiff < 2) {
              return prev;
            }

            return {
              ...prev,
              heading: roundedHeading,
              accuracy,
              declination: magneticDeclination,
            };
          });
        }, 32);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          available: false,
          error:
            error instanceof Error ? error.message : "Failed to initialize compass",
        }));
      }
    };

    initCompass();

    return () => {
      if (magSubscription) magSubscription.remove();
      if (accelSubscription) accelSubscription.remove();
      if (intervalId) clearInterval(intervalId);
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

// Simplified magnetic declination calculation
// For production, use a proper World Magnetic Model library
async function getMagneticDeclination(latitude: number, longitude: number): Promise<number> {
  try {
    // Use NOAA API to get magnetic declination
    const response = await fetch(
      `https://www.ngdc.noaa.gov/geomag-web/calculators/calculateDeclination?lat1=${latitude}&lon1=${longitude}&resultFormat=json`
    );
    const data = await response.json();
    return data.result[0].declination || 0;
  } catch (error) {
    console.warn('Failed to fetch magnetic declination, using approximation');
    // Rough approximation based on location
    // This is very simplified - real declination varies significantly
    return 0;
  }
}
