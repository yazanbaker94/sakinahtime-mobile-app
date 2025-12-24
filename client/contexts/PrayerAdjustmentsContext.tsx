import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRAYER_ADJUSTMENTS_KEY = "@prayer_time_adjustments";

export interface PrayerAdjustments {
  Fajr: number;
  Dhuhr: number;
  Asr: number;
  Maghrib: number;
  Isha: number;
}

const DEFAULT_ADJUSTMENTS: PrayerAdjustments = {
  Fajr: 0,
  Dhuhr: 0,
  Asr: 0,
  Maghrib: 0,
  Isha: 0,
};

interface PrayerAdjustmentsContextType {
  adjustments: PrayerAdjustments;
  setAdjustment: (prayer: keyof PrayerAdjustments, minutes: number) => Promise<void>;
  resetAdjustments: () => Promise<void>;
  loading: boolean;
}

const PrayerAdjustmentsContext = createContext<PrayerAdjustmentsContextType | undefined>(undefined);

export function PrayerAdjustmentsProvider({ children }: { children: React.ReactNode }) {
  const [adjustments, setAdjustments] = useState<PrayerAdjustments>(DEFAULT_ADJUSTMENTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdjustments();
  }, []);

  const loadAdjustments = async () => {
    try {
      const stored = await AsyncStorage.getItem(PRAYER_ADJUSTMENTS_KEY);
      if (stored) {
        setAdjustments(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load prayer adjustments:", error);
    } finally {
      setLoading(false);
    }
  };

  const setAdjustment = useCallback(async (prayer: keyof PrayerAdjustments, minutes: number) => {
    // Limit adjustments to -30 to +30 minutes
    const clampedMinutes = Math.max(-30, Math.min(30, minutes));
    
    const newAdjustments = {
      ...adjustments,
      [prayer]: clampedMinutes,
    };

    try {
      await AsyncStorage.setItem(PRAYER_ADJUSTMENTS_KEY, JSON.stringify(newAdjustments));
      setAdjustments(newAdjustments);
    } catch (error) {
      console.error("Failed to save prayer adjustment:", error);
    }
  }, [adjustments]);

  const resetAdjustments = useCallback(async () => {
    try {
      await AsyncStorage.setItem(PRAYER_ADJUSTMENTS_KEY, JSON.stringify(DEFAULT_ADJUSTMENTS));
      setAdjustments(DEFAULT_ADJUSTMENTS);
    } catch (error) {
      console.error("Failed to reset prayer adjustments:", error);
    }
  }, []);

  return (
    <PrayerAdjustmentsContext.Provider value={{ adjustments, setAdjustment, resetAdjustments, loading }}>
      {children}
    </PrayerAdjustmentsContext.Provider>
  );
}

export function usePrayerAdjustments() {
  const context = useContext(PrayerAdjustmentsContext);
  if (context === undefined) {
    throw new Error("usePrayerAdjustments must be used within a PrayerAdjustmentsProvider");
  }
  return context;
}

// Helper function to apply adjustment to a time string (HH:MM format)
export function applyAdjustment(timeString: string, adjustmentMinutes: number): string {
  const [hours, minutes] = timeString.split(":").map(Number);
  
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  
  // Add adjustment
  date.setMinutes(date.getMinutes() + adjustmentMinutes);
  
  const newHours = date.getHours().toString().padStart(2, "0");
  const newMinutes = date.getMinutes().toString().padStart(2, "0");
  
  return `${newHours}:${newMinutes}`;
}
