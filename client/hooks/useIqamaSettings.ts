import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const IQAMA_SETTINGS_KEY = "@iqama_settings";

export interface IqamaSettings {
  enabled: boolean;
  delayMinutes: number;
  prayers: {
    Fajr: boolean;
    Dhuhr: boolean;
    Asr: boolean;
    Maghrib: boolean;
    Isha: boolean;
  };
}

const DEFAULT_IQAMA_SETTINGS: IqamaSettings = {
  enabled: false,
  delayMinutes: 15,
  prayers: {
    Fajr: true,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true,
  },
};

export const IQAMA_DELAY_OPTIONS = [5, 10, 15, 20, 25, 30] as const;

export function useIqamaSettings() {
  const [settings, setSettings] = useState<IqamaSettings>(DEFAULT_IQAMA_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(IQAMA_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_IQAMA_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error("Failed to load iqama settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: IqamaSettings) => {
    // Update state immediately for responsive UI
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem(IQAMA_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save iqama settings:", error);
    }
  };

  const toggleIqama = useCallback(async (enabled: boolean) => {
    const newSettings = { ...settings, enabled };
    await saveSettings(newSettings);
  }, [settings]);

  const setDelayMinutes = useCallback(async (delayMinutes: number) => {
    const newSettings = { ...settings, delayMinutes };
    await saveSettings(newSettings);
  }, [settings]);

  const togglePrayerIqama = useCallback(async (
    prayer: keyof IqamaSettings["prayers"],
    enabled: boolean
  ) => {
    const newSettings = {
      ...settings,
      prayers: { ...settings.prayers, [prayer]: enabled },
    };
    await saveSettings(newSettings);
  }, [settings]);

  return {
    settings,
    loading,
    toggleIqama,
    setDelayMinutes,
    togglePrayerIqama,
  };
}
