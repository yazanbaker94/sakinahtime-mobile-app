import { useState, useEffect, useRef } from "react";
import { Magnetometer, Accelerometer } from "expo-sensors";
import { Platform } from "react-native";

interface CompassState {
  heading: number;
  available: boolean;
  error: string | null;
  accuracy: "low" | "medium" | "high";
}

interface SensorData {
  x: number;
  y: number;
  z: number;
}

const LOW_PASS_ALPHA = 0.15;

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
  heading = (90 - heading + 360) % 360;

  return heading;
}

export function useCompass() {
  const [state, setState] = useState<CompassState>({
    heading: 0,
    available: false,
    error: null,
    accuracy: "low",
  });

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

        Magnetometer.setUpdateInterval(50);
        if (accelAvailable) {
          Accelerometer.setUpdateInterval(50);
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
          } else {
            const { x, y } = mag;
            let angle = Math.atan2(y, x) * (180 / Math.PI);
            angle = (angle + 360) % 360;
            heading = (360 - angle) % 360;
          }

          headingHistoryRef.current.push(heading);
          if (headingHistoryRef.current.length > 10) {
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

          setState((prev) => ({
            ...prev,
            heading: Math.round(smoothedHeading),
            accuracy,
          }));
        }, 100);
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
