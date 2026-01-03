/**
 * useFastingNotifications Hook
 * 
 * Manages fasting day notification settings and scheduling.
 */

import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import {
  FastingNotificationSettings,
  fastingNotificationService,
} from '../services/FastingNotificationService';
import { FastingDay } from '../types/hijri';

interface UseFastingNotificationsResult {
  settings: FastingNotificationSettings;
  loading: boolean;
  permission: Notifications.PermissionStatus | null;
  toggleEnabled: (enabled: boolean) => Promise<void>;
  toggleFastingType: (type: keyof FastingNotificationSettings['types'], enabled: boolean) => Promise<void>;
  setReminderTime: (time: 'evening' | 'morning') => Promise<void>;
  scheduleNotifications: () => Promise<number>;
  sendTestNotification: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

export function useFastingNotifications(): UseFastingNotificationsResult {
  const [settings, setSettings] = useState<FastingNotificationSettings>(
    fastingNotificationService.getSettings()
  );
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<Notifications.PermissionStatus | null>(null);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const loadedSettings = await fastingNotificationService.loadSettings();
        setSettings(loadedSettings);
        
        const { status } = await Notifications.getPermissionsAsync();
        setPermission(status);
      } catch (error) {
        console.error('Failed to initialize fasting notifications:', error);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermission(status);
    return status === 'granted';
  }, []);

  const toggleEnabled = useCallback(async (enabled: boolean) => {
    if (enabled && permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return;
    }

    await fastingNotificationService.toggleEnabled(enabled);
    setSettings(fastingNotificationService.getSettings());

    if (enabled) {
      await fastingNotificationService.scheduleFastingNotifications();
    }
  }, [permission, requestPermission]);

  const toggleFastingType = useCallback(async (
    type: keyof FastingNotificationSettings['types'],
    enabled: boolean
  ) => {
    await fastingNotificationService.toggleFastingType(type, enabled);
    setSettings(fastingNotificationService.getSettings());

    if (settings.enabled) {
      await fastingNotificationService.scheduleFastingNotifications();
    }
  }, [settings.enabled]);

  const setReminderTime = useCallback(async (time: 'evening' | 'morning') => {
    await fastingNotificationService.setReminderTime(time);
    setSettings(fastingNotificationService.getSettings());

    if (settings.enabled) {
      await fastingNotificationService.scheduleFastingNotifications();
    }
  }, [settings.enabled]);

  const scheduleNotifications = useCallback(async (): Promise<number> => {
    return fastingNotificationService.scheduleFastingNotifications();
  }, []);

  const sendTestNotification = useCallback(async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return;
    }
    await fastingNotificationService.sendTestNotification();
  }, [permission, requestPermission]);

  return {
    settings,
    loading,
    permission,
    toggleEnabled,
    toggleFastingType,
    setReminderTime,
    scheduleNotifications,
    sendTestNotification,
    requestPermission,
  };
}
