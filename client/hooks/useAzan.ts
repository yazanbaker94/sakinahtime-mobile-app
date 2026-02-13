import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AZAN_SETTINGS_KEY = "@azan_settings";

export interface AzanSettings {
  enabled: boolean;
  volume: number;
  prayers: {
    Fajr: boolean;
    Dhuhr: boolean;
    Asr: boolean;
    Maghrib: boolean;
    Isha: boolean;
  };
}

const DEFAULT_SETTINGS: AzanSettings = {
  enabled: true,
  volume: 1.0, // Maximum volume
  prayers: {
    Fajr: true,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true,
  },
};

/**
 * Settings-only hook for azan preferences.
 * All actual azan playback is handled by the native AzanService (Java),
 * which supports flip-to-silence, volume-button-to-silence, and respects
 * silent/vibrate mode. This hook only manages user preferences.
 */
export function useAzan() {
  const [settings, setSettings] = useState<AzanSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(AZAN_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle migration (existing users without prayers setting)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed, prayers: { ...DEFAULT_SETTINGS.prayers, ...parsed.prayers } });
      }
    } catch (error) {
      console.error("Failed to load azan settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: AzanSettings) => {
    // Update state immediately for responsive UI
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem(AZAN_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save azan settings:", error);
    }
  };

  const toggleAzan = async (enabled: boolean) => {
    const newSettings = { ...settings, enabled };
    await saveSettings(newSettings);
  };

  const togglePrayerAzan = async (
    prayer: keyof AzanSettings["prayers"],
    enabled: boolean
  ) => {
    const newSettings = {
      ...settings,
      prayers: { ...settings.prayers, [prayer]: enabled },
    };
    await saveSettings(newSettings);
  };

  const setVolume = async (volume: number) => {
    const newSettings = { ...settings, volume: Math.max(0, Math.min(1, volume)) };
    await saveSettings(newSettings);
  };

  return {
    settings,
    loading,
    toggleAzan,
    togglePrayerAzan,
    setVolume,
  };
}
