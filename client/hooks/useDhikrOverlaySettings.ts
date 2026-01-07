import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DhikrCategory } from '@/data/dhikrContent';

const STORAGE_KEY = 'dhikr_overlay_settings';

export interface DhikrOverlaySettings {
  enabled: boolean;
  intervalMinutes: 30 | 60 | 120 | 180 | 240;
  categories: Record<DhikrCategory, boolean>;
  quietHours: {
    enabled: boolean;
    startHour: number;
    endHour: number;
  };
  skipDuringPrayer: boolean;
  autoDismissSeconds: number;
  recentDhikrIds: string[];
}

const DEFAULT_SETTINGS: DhikrOverlaySettings = {
  enabled: false,
  intervalMinutes: 60,
  categories: {
    tasbih: true,
    tahmid: true,
    takbir: true,
    salawat: true,
    istighfar: true,
    dua: true,
  },
  quietHours: {
    enabled: true,
    startHour: 23, // 11 PM
    endHour: 6,    // 6 AM
  },
  skipDuringPrayer: true,
  autoDismissSeconds: 10,
  recentDhikrIds: [],
};

export function useDhikrOverlaySettings() {
  const [settings, setSettings] = useState<DhikrOverlaySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load dhikr overlay settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = useCallback(async (newSettings: Partial<DhikrOverlaySettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSettings(updated);
      return true;
    } catch (error) {
      console.error('Failed to save dhikr overlay settings:', error);
      return false;
    }
  }, [settings]);

  const updateEnabled = useCallback((enabled: boolean) => {
    return saveSettings({ enabled });
  }, [saveSettings]);

  const updateInterval = useCallback((intervalMinutes: DhikrOverlaySettings['intervalMinutes']) => {
    return saveSettings({ intervalMinutes });
  }, [saveSettings]);

  const updateCategory = useCallback((category: DhikrCategory, enabled: boolean) => {
    return saveSettings({
      categories: { ...settings.categories, [category]: enabled }
    });
  }, [saveSettings, settings.categories]);

  const updateQuietHours = useCallback((quietHours: DhikrOverlaySettings['quietHours']) => {
    return saveSettings({ quietHours });
  }, [saveSettings]);

  const updateSkipDuringPrayer = useCallback((skipDuringPrayer: boolean) => {
    return saveSettings({ skipDuringPrayer });
  }, [saveSettings]);

  const updateAutoDismiss = useCallback((autoDismissSeconds: number) => {
    return saveSettings({ autoDismissSeconds });
  }, [saveSettings]);

  const addRecentDhikr = useCallback((dhikrId: string) => {
    const recentIds = [dhikrId, ...settings.recentDhikrIds.filter(id => id !== dhikrId)].slice(0, 10);
    return saveSettings({ recentDhikrIds: recentIds });
  }, [saveSettings, settings.recentDhikrIds]);

  const getEnabledCategories = useCallback((): DhikrCategory[] => {
    return (Object.entries(settings.categories) as [DhikrCategory, boolean][])
      .filter(([_, enabled]) => enabled)
      .map(([category]) => category);
  }, [settings.categories]);

  const resetToDefaults = useCallback(() => {
    return saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  return {
    settings,
    isLoading,
    saveSettings,
    updateEnabled,
    updateInterval,
    updateCategory,
    updateQuietHours,
    updateSkipDuringPrayer,
    updateAutoDismiss,
    addRecentDhikr,
    getEnabledCategories,
    resetToDefaults,
  };
}
