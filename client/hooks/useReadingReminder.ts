/**
 * useReadingReminder Hook
 * Manages reading reminder notifications
 * Feature: quran-progress-tracker
 */

import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { progressTrackerService } from '../services/ProgressTrackerService';
import { ProgressCalculator } from '../services/ProgressCalculator';

interface UseReadingReminderReturn {
  reminderEnabled: boolean;
  reminderTime: string;
  permissionGranted: boolean;
  setReminderEnabled: (enabled: boolean) => Promise<void>;
  setReminderTime: (time: string) => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

const REMINDER_NOTIFICATION_ID = 'quran-reading-reminder';

export function useReadingReminder(): UseReadingReminderReturn {
  const [reminderEnabled, setReminderEnabledState] = useState(false);
  const [reminderTime, setReminderTimeState] = useState('20:00');
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    checkPermission();
  }, []);

  const loadSettings = async () => {
    try {
      const progress = await progressTrackerService.loadProgress();
      setReminderEnabledState(progress.settings.reminderEnabled);
      setReminderTimeState(progress.settings.reminderTime);
    } catch (error) {
      console.error('Failed to load reminder settings:', error);
    }
  };

  const checkPermission = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionGranted(status === 'granted');
    } catch (error) {
      console.error('Failed to check notification permission:', error);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);
      return granted;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, []);

  const scheduleReminder = useCallback(async (time: string, enabled: boolean) => {
    try {
      // Cancel existing reminder
      await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID);

      if (!enabled || !permissionGranted) {
        return;
      }

      // Parse time
      const [hours, minutes] = time.split(':').map(Number);

      // Get remaining pages/verses for notification body
      const progress = await progressTrackerService.loadProgress();
      const remaining = ProgressCalculator.getRemainingForGoal(progress);
      const goalType = progress.dailyGoal.type;

      let body = 'Time for your daily Quran reading!';
      if (progress.dailyGoal.enabled && remaining > 0) {
        body = `You have ${remaining} ${goalType} remaining to meet your daily goal.`;
      } else if (progress.dailyGoal.enabled && remaining === 0) {
        body = 'Great job! You\'ve met your daily goal. Keep up the good work!';
      }

      // Schedule daily notification
      await Notifications.scheduleNotificationAsync({
        identifier: REMINDER_NOTIFICATION_ID,
        content: {
          title: 'Quran Reading Reminder',
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
    }
  }, [permissionGranted]);

  const setReminderEnabled = useCallback(async (enabled: boolean) => {
    try {
      await progressTrackerService.updateSettings({ reminderEnabled: enabled });
      setReminderEnabledState(enabled);
      await scheduleReminder(reminderTime, enabled);
    } catch (error) {
      console.error('Failed to update reminder enabled:', error);
      throw error;
    }
  }, [reminderTime, scheduleReminder]);

  const setReminderTime = useCallback(async (time: string) => {
    try {
      // Validate time format
      if (!/^\d{2}:\d{2}$/.test(time)) {
        throw new Error('Invalid time format. Use HH:MM');
      }

      await progressTrackerService.updateSettings({ reminderTime: time });
      setReminderTimeState(time);
      await scheduleReminder(time, reminderEnabled);
    } catch (error) {
      console.error('Failed to update reminder time:', error);
      throw error;
    }
  }, [reminderEnabled, scheduleReminder]);

  return {
    reminderEnabled,
    reminderTime,
    permissionGranted,
    setReminderEnabled,
    setReminderTime,
    requestPermission,
  };
}

export default useReadingReminder;
