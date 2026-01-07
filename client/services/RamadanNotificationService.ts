/**
 * Ramadan Notification Service
 * 
 * Handles scheduling of Suhoor, Iftar, Quran, and Laylatul Qadr notifications.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { RAMADAN_NOTIFICATION_CHANNELS, RAMADAN_NOTIFICATIONS } from '../constants/ramadan';
import { SuhoorIftarSettings } from '../types/ramadan';

// Setup Android notification channels
async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync(RAMADAN_NOTIFICATION_CHANNELS.SUHOOR, {
        name: 'Suhoor Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B5CF6',
        enableVibrate: true,
        enableLights: true,
      });

      await Notifications.setNotificationChannelAsync(RAMADAN_NOTIFICATION_CHANNELS.IFTAR, {
        name: 'Iftar Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F59E0B',
        enableVibrate: true,
        enableLights: true,
      });

      await Notifications.setNotificationChannelAsync(RAMADAN_NOTIFICATION_CHANNELS.QURAN, {
        name: 'Quran Reading Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#10B981',
        enableVibrate: true,
        enableLights: true,
      });

      await Notifications.setNotificationChannelAsync(RAMADAN_NOTIFICATION_CHANNELS.LAYLATUL_QADR, {
        name: 'Laylatul Qadr Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#EAB308',
        enableVibrate: true,
        enableLights: true,
      });
    } catch (error) {
      console.error('Failed to create Ramadan notification channels:', error);
    }
  }
}

// Initialize channels
setupNotificationChannels();

class RamadanNotificationService {
  /**
   * Cancel all Ramadan-related notifications
   */
  async cancelAllRamadanNotifications(): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const ramadanNotifications = scheduled.filter(
      n => typeof n.content.data?.type === 'string' && n.content.data.type.startsWith('ramadan_')
    );
    
    for (const notification of ramadanNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  /**
   * Cancel specific type of Ramadan notifications
   */
  async cancelNotificationType(type: string): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const targetNotifications = scheduled.filter(
      n => n.content.data?.type === type
    );
    
    for (const notification of targetNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  /**
   * Schedule Suhoor reminder notification
   */
  async scheduleSuhoorReminder(
    suhoorEndTime: Date,
    minutesBefore: number,
    ramadanDay: number
  ): Promise<string | null> {
    const notificationTime = new Date(suhoorEndTime.getTime() - minutesBefore * 60 * 1000);
    
    if (notificationTime <= new Date()) {
      return null;
    }

    try {
      const content: Notifications.NotificationContentInput = {
        title: RAMADAN_NOTIFICATIONS.suhoorReminder.title,
        body: RAMADAN_NOTIFICATIONS.suhoorReminder.body(minutesBefore),
        data: { type: 'ramadan_suhoor_reminder', day: ramadanDay },
        sound: true,
      };

      if (Platform.OS === 'android') {
        (content as any).channelId = RAMADAN_NOTIFICATION_CHANNELS.SUHOOR;
      }

      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationTime,
        },
      });

      return id;
    } catch (error) {
      console.error('Failed to schedule Suhoor reminder:', error);
      return null;
    }
  }

  /**
   * Schedule Suhoor end notification
   */
  async scheduleSuhoorEnd(suhoorEndTime: Date, ramadanDay: number): Promise<string | null> {
    if (suhoorEndTime <= new Date()) {
      return null;
    }

    try {
      const content: Notifications.NotificationContentInput = {
        title: RAMADAN_NOTIFICATIONS.suhoorEnd.title,
        body: RAMADAN_NOTIFICATIONS.suhoorEnd.body(ramadanDay),
        data: { type: 'ramadan_suhoor_end', day: ramadanDay },
        sound: true,
      };

      if (Platform.OS === 'android') {
        (content as any).channelId = RAMADAN_NOTIFICATION_CHANNELS.SUHOOR;
      }

      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: suhoorEndTime,
        },
      });

      return id;
    } catch (error) {
      console.error('Failed to schedule Suhoor end notification:', error);
      return null;
    }
  }

  /**
   * Schedule Iftar reminder notification
   */
  async scheduleIftarReminder(
    iftarTime: Date,
    minutesBefore: number,
    ramadanDay: number
  ): Promise<string | null> {
    const notificationTime = new Date(iftarTime.getTime() - minutesBefore * 60 * 1000);
    
    if (notificationTime <= new Date()) {
      return null;
    }

    try {
      const content: Notifications.NotificationContentInput = {
        title: RAMADAN_NOTIFICATIONS.iftarReminder.title,
        body: RAMADAN_NOTIFICATIONS.iftarReminder.body(minutesBefore),
        data: { type: 'ramadan_iftar_reminder', day: ramadanDay },
        sound: true,
      };

      if (Platform.OS === 'android') {
        (content as any).channelId = RAMADAN_NOTIFICATION_CHANNELS.IFTAR;
      }

      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationTime,
        },
      });

      return id;
    } catch (error) {
      console.error('Failed to schedule Iftar reminder:', error);
      return null;
    }
  }

  /**
   * Schedule Iftar time notification
   */
  async scheduleIftarTime(iftarTime: Date, ramadanDay: number): Promise<string | null> {
    if (iftarTime <= new Date()) {
      return null;
    }

    try {
      const content: Notifications.NotificationContentInput = {
        title: RAMADAN_NOTIFICATIONS.iftarTime.title,
        body: RAMADAN_NOTIFICATIONS.iftarTime.body(ramadanDay),
        data: { type: 'ramadan_iftar_time', day: ramadanDay },
        sound: true,
      };

      if (Platform.OS === 'android') {
        (content as any).channelId = RAMADAN_NOTIFICATION_CHANNELS.IFTAR;
      }

      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: iftarTime,
        },
      });

      return id;
    } catch (error) {
      console.error('Failed to schedule Iftar time notification:', error);
      return null;
    }
  }

  /**
   * Schedule all Suhoor/Iftar notifications for today
   */
  async scheduleSuhoorIftarNotifications(
    suhoorEndTime: Date,
    iftarTime: Date,
    ramadanDay: number,
    settings: SuhoorIftarSettings
  ): Promise<void> {
    // Cancel existing Suhoor/Iftar notifications
    await this.cancelNotificationType('ramadan_suhoor_reminder');
    await this.cancelNotificationType('ramadan_suhoor_end');
    await this.cancelNotificationType('ramadan_iftar_reminder');
    await this.cancelNotificationType('ramadan_iftar_time');

    // Schedule Suhoor notifications
    if (settings.suhoorNotificationEnabled) {
      await this.scheduleSuhoorReminder(suhoorEndTime, settings.suhoorReminderMinutes, ramadanDay);
      await this.scheduleSuhoorEnd(suhoorEndTime, ramadanDay);
    }

    // Schedule Iftar notifications
    if (settings.iftarNotificationEnabled) {
      await this.scheduleIftarReminder(iftarTime, settings.iftarReminderMinutes, ramadanDay);
      await this.scheduleIftarTime(iftarTime, ramadanDay);
    }
  }

  /**
   * Schedule Quran reading reminder
   */
  async scheduleQuranReminder(
    reminderTime: Date,
    juzNumber: number,
    startPage: number,
    endPage: number
  ): Promise<string | null> {
    if (reminderTime <= new Date()) {
      return null;
    }

    try {
      const content: Notifications.NotificationContentInput = {
        title: RAMADAN_NOTIFICATIONS.quranReminder.title,
        body: RAMADAN_NOTIFICATIONS.quranReminder.body(juzNumber, startPage, endPage),
        data: { type: 'ramadan_quran_reminder', juz: juzNumber },
        sound: true,
      };

      if (Platform.OS === 'android') {
        (content as any).channelId = RAMADAN_NOTIFICATION_CHANNELS.QURAN;
      }

      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderTime,
        },
      });

      return id;
    } catch (error) {
      console.error('Failed to schedule Quran reminder:', error);
      return null;
    }
  }

  /**
   * Schedule Laylatul Qadr notification for odd nights
   */
  async scheduleLaylatalQadrNotification(
    notificationTime: Date,
    nightNumber: number
  ): Promise<string | null> {
    if (notificationTime <= new Date()) {
      return null;
    }

    try {
      const content: Notifications.NotificationContentInput = {
        title: RAMADAN_NOTIFICATIONS.laylatalQadr.title,
        body: RAMADAN_NOTIFICATIONS.laylatalQadr.body(nightNumber),
        data: { type: 'ramadan_laylatul_qadr', night: nightNumber },
        sound: true,
      };

      if (Platform.OS === 'android') {
        (content as any).channelId = RAMADAN_NOTIFICATION_CHANNELS.LAYLATUL_QADR;
      }

      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationTime,
        },
      });

      return id;
    } catch (error) {
      console.error('Failed to schedule Laylatul Qadr notification:', error);
      return null;
    }
  }
}

// Export singleton instance
export const ramadanNotificationService = new RamadanNotificationService();
