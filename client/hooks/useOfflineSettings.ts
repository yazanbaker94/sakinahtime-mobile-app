/**
 * useOfflineSettings Hook
 * 
 * Manages offline mode settings.
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineStorageService } from '../services/OfflineStorageService';
import { OfflineSettings } from '../types/offline';
import { DEFAULT_OFFLINE_SETTINGS } from '../constants/offline';

export function useOfflineSettings() {
  const [settings, setSettings] = useState<OfflineSettings>(DEFAULT_OFFLINE_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        await offlineStorageService.initialize();
        setSettings(offlineStorageService.getSettings());
      } catch (error) {
        console.error('[useOfflineSettings] Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = useCallback(async (updates: Partial<OfflineSettings>) => {
    try {
      await offlineStorageService.updateSettings(updates);
      setSettings(offlineStorageService.getSettings());
    } catch (error) {
      console.error('[useOfflineSettings] Failed to update settings:', error);
      throw error;
    }
  }, []);

  return {
    settings,
    updateSettings,
    isLoading,
  };
}
