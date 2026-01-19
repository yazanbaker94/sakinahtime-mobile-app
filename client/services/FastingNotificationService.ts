/**
 * Fasting Notification Service
 * 
 * Schedules notifications for upcoming fasting days.
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { FastingDay } from '../types/hijri';
import { fastingDayService } from './FastingDayService';
import { prayerTimesCacheService } from './PrayerTimesCacheService';
import { getLastGpsLocation } from '../utils/locationStorage';

const FASTING_NOTIFICATION_SETTINGS_KEY = '@fasting_notification_settings';
const FASTING_NOTIFICATION_CHANNEL = 'fasting-reminders';

export interface FastingNotificationSettings {
  enabled: boolean;
  reminderTime: 'evening' | 'morning'; // Evening before or morning of
  types: {
    monday: boolean;
    thursday: boolean;
    white_day: boolean;
    ashura: boolean;
    arafah: boolean;
    shawwal: boolean;
  };
}

const DEFAULT_SETTINGS: FastingNotificationSettings = {
  enabled: false,
  reminderTime: 'evening',
  types: {
    monday: true,
    thursday: true,
    white_day: true,
    ashura: true,
    arafah: true,
    shawwal: true,
  },
};

const FASTING_MESSAGES: Record<FastingDay['type'], { title: string; body: string }> = {
  monday: {
    title: '🌙 Monday Fast Tomorrow',
    body: 'Tomorrow is Monday - a recommended day for Sunnah fasting',
  },
  thursday: {
    title: '🌙 Thursday Fast Tomorrow',
    body: 'Tomorrow is Thursday - a recommended day for Sunnah fasting',
  },
  white_day: {
    title: '🌕 White Day Fast Tomorrow',
    body: 'Tomorrow is one of the White Days (Ayyam al-Beed) - fasting is highly recommended',
  },
  ashura: {
    title: '🕌 Ashura Fast Tomorrow',
    body: 'Tomorrow is Ashura (10th Muharram) - fasting expiates sins of the previous year',
  },
  arafah: {
    title: '🕋 Day of Arafah Tomorrow',
    body: 'Tomorrow is the Day of Arafah - fasting expiates sins of the previous and coming year',
  },
  shawwal: {
    title: '🌙 Shawwal Fast Tomorrow',
    body: 'Tomorrow is one of the 6 days of Shawwal - complete your fasting reward',
  },
};

const MORNING_MESSAGES: Record<FastingDay['type'], { title: string; body: string }> = {
  monday: {
    title: '🌅 Monday Fast Today',
    body: 'Today is Monday - make your intention for Sunnah fasting',
  },
  thursday: {
    title: '🌅 Thursday Fast Today',
    body: 'Today is Thursday - make your intention for Sunnah fasting',
  },
  white_day: {
    title: '🌕 White Day Fast Today',
    body: 'Today is one of the White Days - make your intention for fasting',
  },
  ashura: {
    title: '🕌 Ashura Fast Today',
    body: 'Today is Ashura - make your intention for this blessed fast',
  },
  arafah: {
    title: '🕋 Day of Arafah Today',
    body: 'Today is the Day of Arafah - make your intention for this blessed fast',
  },
  shawwal: {
    title: '🌙 Shawwal Fast Today',
    body: 'Today is one of the 6 days of Shawwal - make your intention for fasting',
  },
};

async function setupAndroidChannel() {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync(FASTING_NOTIFICATION_CHANNEL, {
        name: 'Fasting Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B5CF6',
        enableVibrate: true,
        enableLights: true,
      });
    } catch (error) {
      console.error('Failed to create fasting notification channel:', error);
    }
  }
}

// Initialize channel
setupAndroidChannel();

export class FastingNotificationService {
  private settings: FastingNotificationSettings = DEFAULT_SETTINGS;

  async loadSettings(): Promise<FastingNotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(FASTING_NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load fasting notification settings:', error);
    }
    return this.settings;
  }

  async saveSettings(settings: FastingNotificationSettings): Promise<void> {
    try {
      this.settings = settings;
      await AsyncStorage.setItem(FASTING_NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save fasting notification settings:', error);
    }
  }

  async toggleEnabled(enabled: boolean): Promise<void> {
    const newSettings = { ...this.settings, enabled };
    await this.saveSettings(newSettings);

    if (!enabled) {
      await this.cancelAllFastingNotifications();
    }
  }

  async toggleFastingType(type: keyof FastingNotificationSettings['types'], enabled: boolean): Promise<void> {
    const newSettings = {
      ...this.settings,
      types: { ...this.settings.types, [type]: enabled },
    };
    await this.saveSettings(newSettings);
  }

  async setReminderTime(time: 'evening' | 'morning'): Promise<void> {
    const newSettings = { ...this.settings, reminderTime: time };
    await this.saveSettings(newSettings);
  }

  async cancelAllFastingNotifications(): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const fastingNotifications = scheduled.filter(
      n => n.content.data?.type === 'fasting_reminder'
    );

    for (const notification of fastingNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  /**
   * Get Fajr time for a specific date (with user's adjustment applied)
   * Returns the time in HH:MM format, or null if not available
   */
  private async getFajrTimeForDate(date: Date): Promise<string | null> {
    try {
      // Get cached location
      const location = await getLastGpsLocation();
      if (!location) {
        return null;
      }

      // Get calculation method from storage (default to 2 - ISNA)
      const methodStr = await AsyncStorage.getItem('@prayer_calculation_method');
      const method = methodStr ? parseInt(methodStr, 10) : 2;

      // Try to get cached prayer times
      await prayerTimesCacheService.initialize();
      const cached = await prayerTimesCacheService.getCachedPrayerTimes(
        date,
        { lat: location.latitude, lng: location.longitude },
        method
      );

      if (cached?.timings?.Fajr) {
        // Fajr time format might be "05:30 (EET)" - extract just the time
        const timeMatch = cached.timings.Fajr.match(/(\d{2}):(\d{2})/);
        if (timeMatch) {
          let fajrTime = `${timeMatch[1]}:${timeMatch[2]}`;

          // Also apply user's Fajr adjustment if any
          const adjustmentsStr = await AsyncStorage.getItem('@prayer_time_adjustments');
          if (adjustmentsStr) {
            try {
              const adjustments = JSON.parse(adjustmentsStr);
              const fajrAdjustment = adjustments.Fajr || 0;

              if (fajrAdjustment !== 0) {
                // Apply adjustment
                const [hours, minutes] = fajrTime.split(':').map(Number);
                const adjustedDate = new Date();
                adjustedDate.setHours(hours, minutes + fajrAdjustment, 0, 0);
                fajrTime = `${adjustedDate.getHours().toString().padStart(2, '0')}:${adjustedDate.getMinutes().toString().padStart(2, '0')}`;
              }
            } catch (e) {
              console.error('[FastingNotificationService] Failed to parse adjustments:', e);
            }
          }

          return fajrTime;
        }
      }

      return null;
    } catch (error) {
      console.error('[FastingNotificationService] Failed to get Fajr time:', error);
      return null;
    }
  }

  async scheduleFastingNotifications(): Promise<number> {
    if (!this.settings.enabled) {
      return 0;
    }

    await this.cancelAllFastingNotifications();

    const upcomingFastingDays = fastingDayService.getUpcomingFastingDays(14);
    let scheduledCount = 0;

    for (const fastingDay of upcomingFastingDays) {
      // Skip if this type is disabled
      if (!this.settings.types[fastingDay.type]) {
        continue;
      }

      // Skip if fasting is prohibited (Eid days)
      if (fastingDayService.isFastingProhibited(fastingDay.hijriDate)) {
        continue;
      }

      const messages = this.settings.reminderTime === 'evening'
        ? FASTING_MESSAGES
        : MORNING_MESSAGES;

      const message = messages[fastingDay.type];
      if (!message) continue;

      // Calculate notification time
      const notificationDate = new Date(fastingDay.gregorianDate);

      if (this.settings.reminderTime === 'evening') {
        // Evening before: 8 PM the day before
        notificationDate.setDate(notificationDate.getDate() - 1);
        notificationDate.setHours(20, 0, 0, 0);
      } else {
        // Morning of: 30 minutes before Fajr
        const fajrTime = await this.getFajrTimeForDate(notificationDate);

        if (fajrTime) {
          const [hours, minutes] = fajrTime.split(':').map(Number);
          notificationDate.setHours(hours, minutes, 0, 0);
          // Subtract 30 minutes
          notificationDate.setMinutes(notificationDate.getMinutes() - 30);
        } else {
          // Fallback to 4:30 AM if Fajr time not available
          notificationDate.setHours(4, 30, 0, 0);
        }
      }

      // Skip if notification time has passed
      if (notificationDate <= new Date()) {
        continue;
      }

      try {
        const notificationContent: Notifications.NotificationContentInput = {
          title: message.title,
          body: message.body,
          data: {
            type: 'fasting_reminder',
            fastingType: fastingDay.type,
            date: fastingDay.gregorianDate.toISOString(),
          },
        };

        if (Platform.OS === 'android') {
          (notificationContent as any).channelId = FASTING_NOTIFICATION_CHANNEL;
        }

        await Notifications.scheduleNotificationAsync({
          content: notificationContent,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: notificationDate,
          },
        });

        scheduledCount++;
      } catch (error) {
        console.error(`Failed to schedule fasting notification for ${fastingDay.type}:`, error);
      }
    }

    return scheduledCount;
  }

  async sendTestNotification(): Promise<void> {
    const notificationContent: Notifications.NotificationContentInput = {
      title: '🌙 Fasting Reminder Test',
      body: 'This is a test notification for fasting reminders',
      data: { type: 'fasting_reminder', test: true },
    };

    if (Platform.OS === 'android') {
      (notificationContent as any).channelId = FASTING_NOTIFICATION_CHANNEL;
    }

    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
      },
    });
  }

  getSettings(): FastingNotificationSettings {
    return this.settings;
  }
}

// Export singleton instance
export const fastingNotificationService = new FastingNotificationService();
