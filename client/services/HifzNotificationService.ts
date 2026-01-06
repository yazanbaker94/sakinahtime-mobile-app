/**
 * HifzNotificationService
 * Handles scheduling and managing revision reminder notifications
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIFICATION_SETTINGS_KEY = '@hifz_notification_settings';
const NOTIFICATION_ID_KEY = '@hifz_notification_id';

interface NotificationSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  hour: 9, // 9 AM
  minute: 0,
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class HifzNotificationService {
  private static instance: HifzNotificationService;
  private settings: NotificationSettings = DEFAULT_SETTINGS;
  private initialized = false;

  private constructor() {}

  static getInstance(): HifzNotificationService {
    if (!HifzNotificationService.instance) {
      HifzNotificationService.instance = new HifzNotificationService();
    }
    return HifzNotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load settings
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }

      // Request permissions
      await this.requestPermissions();

      this.initialized = true;
      console.log('[HifzNotificationService] Initialized');
    } catch (error) {
      console.error('[HifzNotificationService] Initialization error:', error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[HifzNotificationService] Permission not granted');
        return false;
      }

      // For Android, set up notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('hifz-reminders', {
          name: 'Hifz Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10B981',
          sound: 'default',
        });
      }

      return true;
    } catch (error) {
      console.error('[HifzNotificationService] Permission request error:', error);
      return false;
    }
  }

  async scheduleRevisionReminder(dueCount: number): Promise<string | null> {
    if (!this.settings.enabled) {
      console.log('[HifzNotificationService] Notifications disabled');
      return null;
    }

    try {
      // Cancel existing notification
      await this.cancelRevisionReminder();

      // Schedule new notification
      const trigger: Notifications.NotificationTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: this.settings.hour,
        minute: this.settings.minute,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📖 Time for Quran Revision',
          body: dueCount > 0 
            ? `You have ${dueCount} verse${dueCount > 1 ? 's' : ''} due for revision today.`
            : 'Keep up your memorization practice!',
          data: { type: 'hifz_revision' },
          sound: 'default',
          badge: dueCount,
        },
        trigger,
      });

      // Save notification ID
      await AsyncStorage.setItem(NOTIFICATION_ID_KEY, notificationId);
      console.log('[HifzNotificationService] Scheduled notification:', notificationId);

      return notificationId;
    } catch (error) {
      console.error('[HifzNotificationService] Schedule error:', error);
      return null;
    }
  }

  async cancelRevisionReminder(): Promise<void> {
    try {
      const notificationId = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
        console.log('[HifzNotificationService] Cancelled notification:', notificationId);
      }
    } catch (error) {
      console.error('[HifzNotificationService] Cancel error:', error);
    }
  }

  async setNotificationTime(hour: number, minute: number): Promise<void> {
    this.settings.hour = hour;
    this.settings.minute = minute;
    await this.saveSettings();
  }

  async setNotificationsEnabled(enabled: boolean): Promise<void> {
    this.settings.enabled = enabled;
    await this.saveSettings();

    if (!enabled) {
      await this.cancelRevisionReminder();
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('[HifzNotificationService] Save settings error:', error);
    }
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  async sendImmediateReminder(dueCount: number): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📖 Revision Reminder',
          body: `You have ${dueCount} verse${dueCount > 1 ? 's' : ''} due for revision.`,
          data: { type: 'hifz_revision' },
          sound: 'default',
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error('[HifzNotificationService] Immediate notification error:', error);
    }
  }

  // Add notification response listener
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription | null {
    try {
      return Notifications.addNotificationResponseReceivedListener(callback);
    } catch (error) {
      console.log('[HifzNotificationService] Failed to add response listener:', error);
      return null;
    }
  }

  // Add notification received listener
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription | null {
    try {
      return Notifications.addNotificationReceivedListener(callback);
    } catch (error) {
      console.log('[HifzNotificationService] Failed to add received listener:', error);
      return null;
    }
  }

  // Check if notification data is for Hifz revision
  isHifzRevisionNotification(data: any): boolean {
    return data?.type === 'hifz_revision';
  }
}

export const hifzNotificationService = HifzNotificationService.getInstance();
export default hifzNotificationService;
