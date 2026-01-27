import { useState, useEffect, useCallback, useRef } from "react";
import { Platform, NativeModules } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PrayerTimes } from "./usePrayerTimes";
import { IqamaSettings } from "./useIqamaSettings";
import { PrayerName, PRAYER_NAMES } from "../types/prayerLog";
import { prayerLogService, getTodayDateString } from "../services/PrayerLogService";

const { NotificationSoundModule, PrayerAlarmModule } = NativeModules;

const NOTIFICATION_SETTINGS_KEY = "@prayer_notification_settings";

export interface NotificationSettings {
  enabled: boolean;
  prayers: {
    Fajr: boolean;
    Dhuhr: boolean;
    Asr: boolean;
    Maghrib: boolean;
    Isha: boolean;
  };
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  prayers: {
    Fajr: true,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true,
  },
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Set up notification channel for Android with custom sound
async function setupAndroidChannel() {
  if (Platform.OS === 'android') {
    try {
      console.log('🔊 Setting up Android notification channel with native module');

      if (NotificationSoundModule) {
        // Use native module to create channel with proper sound
        const result = await NotificationSoundModule.createNotificationChannel();
        console.log('✅ Native module result:', result);

        // Verify channel was created
        const channel = await Notifications.getNotificationChannelAsync('prayer-times');
        console.log('✅ Android notification channel created:', JSON.stringify(channel, null, 2));
      } else {
        console.warn('⚠️ NotificationSoundModule not available, falling back to expo-notifications');

        // Fallback to expo-notifications
        try {
          await Notifications.deleteNotificationChannelAsync('prayer-times');
          console.log('🗑️ Deleted old channel');
        } catch (e) {
          console.log('No old channel to delete');
        }

        await Notifications.setNotificationChannelAsync('prayer-times', {
          name: 'Prayer Times',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'azan',
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10B981',
          enableVibrate: true,
          enableLights: true,
        });

        const channel = await Notifications.getNotificationChannelAsync('prayer-times');
        console.log('✅ Fallback channel created:', JSON.stringify(channel, null, 2));
      }
    } catch (error) {
      console.error('❌ Failed to create Android notification channel:', error);
    }
  }
}

// Initialize channel
setupAndroidChannel();

// Check if native modules are available
if (Platform.OS === 'android') {
  console.log('🔍 Checking native modules...');
  console.log('📱 PrayerAlarmModule:', PrayerAlarmModule ? '✅ Available' : '❌ Not available');
  console.log('🔊 NotificationSoundModule:', NotificationSoundModule ? '✅ Available' : '❌ Not available');

  if (!PrayerAlarmModule) {
    console.error('❌ CRITICAL: PrayerAlarmModule not found! Azan will not play when app is closed.');
  }
}

const PRAYER_NAMES_AR: Record<string, string> = {
  Fajr: "الفجر",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  const cleanTime = timeStr.replace(/\s*\([^)]*\)\s*/g, "").trim();
  const match = cleanTime.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3];

  if (ampm) {
    if (ampm.toUpperCase() === "PM" && hours !== 12) {
      hours += 12;
    } else if (ampm.toUpperCase() === "AM" && hours === 12) {
      hours = 0;
    }
  }

  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
}

export function useNotifications() {
  const [permission, setPermission] = useState<Notifications.PermissionStatus | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const lastScheduledRef = useRef<string | null>(null);
  const lastScheduleTimeRef = useRef<number>(0);
  const lastIqamaScheduledRef = useRef<string | null>(null);
  const lastIqamaScheduleTimeRef = useRef<number>(0);
  const [scheduleVersion, setScheduleVersion] = useState(0); // Trigger re-scheduling

  // Force reschedule if more than 1 minute has passed since last schedule
  // This handles phone time changes
  const shouldForceReschedule = () => {
    const now = Date.now();
    const timeSinceLastSchedule = now - lastScheduleTimeRef.current;
    // If system time jumped backwards or more than 5 minutes passed, force reschedule
    if (timeSinceLastSchedule < 0 || timeSinceLastSchedule > 5 * 60 * 1000) {
      console.log('⏰ Time jump detected, forcing reschedule');
      return true;
    }
    return false;
  };

  useEffect(() => {
    loadSettings();
    checkPermission();

    // Stop azan when app opens
    if (Platform.OS === 'android' && PrayerAlarmModule) {
      PrayerAlarmModule.stopAzan().catch(() => {
        // Ignore errors if azan isn't playing
      });
    }

    // Listen for notifications being received (foreground and background)
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification RECEIVED:', {
        title: notification.request.content.title,
        body: notification.request.content.body,
        sound: notification.request.content.sound,
        channelId: (notification.request.content as any).channelId,
        data: notification.request.content.data,
      });

      // Trigger azan playback if it's a prayer notification
      if (notification.request.content.data?.prayer) {
        console.log('🕌 Prayer notification received, azan should play via useAzan hook');
      }
    });

    // Listen for notifications being tapped - STOP AZAN
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification TAPPED:', {
        title: response.notification.request.content.title,
        data: response.notification.request.content.data,
      });

      // Stop azan when notification is tapped
      if (Platform.OS === 'android' && PrayerAlarmModule) {
        console.log('🛑 Stopping azan (notification tapped)');
        PrayerAlarmModule.stopAzan().catch((error: any) => {
          console.log('Azan was not playing or already stopped');
        });
      }
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermission(status);
  };

  const requestPermission = async (): Promise<boolean> => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermission(status);
    return status === "granted";
  };

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load notification settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    // Update state immediately for responsive UI
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save notification settings:", error);
    }
  };

  const toggleNotifications = async (enabled: boolean) => {
    if (enabled && permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }

    const newSettings = { ...settings, enabled };
    await saveSettings(newSettings);

    if (!enabled) {
      await cancelAllNotifications();
    }
  };

  const togglePrayerNotification = async (prayer: keyof NotificationSettings["prayers"], enabled: boolean) => {
    const newSettings = {
      ...settings,
      prayers: { ...settings.prayers, [prayer]: enabled },
    };
    await saveSettings(newSettings);
  };

  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const schedulePrayerNotifications = useCallback(async (timings: PrayerTimes, azanEnabled: boolean = false) => {
    // For expo notifications, we need both enabled and permission
    const canScheduleExpoNotifications = settings.enabled && permission === "granted";

    // For native azan alarms, we only need azanEnabled (works independently of expo notifications)
    // Native PrayerAlarmModule uses Android AlarmManager which doesn't require notification permission
    if (!canScheduleExpoNotifications && !azanEnabled) {
      console.log('⚠️ Neither notifications enabled nor azan enabled, skipping scheduling');
      return;
    }

    console.log('📅 Scheduling prayer alarms...', { azanEnabled, notificationsEnabled: settings.enabled });

    // Include current date in schedule key so alarms are rescheduled each day
    // and when phone time changes
    const today = new Date().toDateString();
    const scheduleKey = JSON.stringify({
      date: today,
      timings: { Fajr: timings.Fajr, Dhuhr: timings.Dhuhr, Asr: timings.Asr, Maghrib: timings.Maghrib, Isha: timings.Isha },
      prayers: settings.prayers,
      azanEnabled,
    });

    if (lastScheduledRef.current === scheduleKey && !shouldForceReschedule()) {
      console.log('⏭️ Skipping - already scheduled with same settings for today');
      return;
    }

    lastScheduledRef.current = scheduleKey;
    lastScheduleTimeRef.current = Date.now();
    console.log('🔄 Rescheduling alarms (new schedule key)');

    // Use native alarm module for Android (works even when app is closed)
    if (Platform.OS === 'android') {
      console.log('🤖 Android detected');
      console.log('📱 PrayerAlarmModule available?', !!PrayerAlarmModule);

      if (PrayerAlarmModule) {
        console.log('✅ Using native PrayerAlarmModule');
        try {
          const prayers: Array<{ key: keyof NotificationSettings["prayers"]; time: string }> = [
            { key: "Fajr", time: timings.Fajr },
            { key: "Dhuhr", time: timings.Dhuhr },
            { key: "Asr", time: timings.Asr },
            { key: "Maghrib", time: timings.Maghrib },
            { key: "Isha", time: timings.Isha },
          ];

          const now = new Date();
          const prayerAlarms: Array<{ name: string; timestamp: number }> = [];

          for (const prayer of prayers) {
            if (!settings.prayers[prayer.key]) continue;

            const parsedTime = parseTimeString(prayer.time);
            if (!parsedTime) {
              console.warn(`Invalid time format for ${prayer.key}: ${prayer.time}`);
              continue;
            }

            const { hours, minutes } = parsedTime;
            const prayerDate = new Date(now);
            prayerDate.setHours(hours, minutes, 0, 0);

            if (prayerDate <= now) {
              prayerDate.setDate(prayerDate.getDate() + 1);
            }

            prayerAlarms.push({
              name: prayer.key,
              timestamp: prayerDate.getTime(),
            });
          }

          const result = await PrayerAlarmModule.schedulePrayerAlarms(prayerAlarms, azanEnabled);
          console.log('✅ Native alarms scheduled:', result);
          console.log('🔔 Scheduled alarms:', prayerAlarms.map(a => `${a.name} at ${new Date(a.timestamp).toLocaleString()}`));

          // Native alarm will show notification, no need for expo notifications
        } catch (error) {
          console.error('❌ Failed to schedule native alarms:', error);
          // Fallback to expo notifications only
          await scheduleExpoNotifications(timings, azanEnabled);
        }
      } else {
        console.log('⚠️ PrayerAlarmModule not available, using expo-notifications only');
        // iOS or fallback: use expo notifications
        await scheduleExpoNotifications(timings, azanEnabled);
      }
    } else {
      // iOS or fallback: use expo notifications
      await scheduleExpoNotifications(timings, azanEnabled);
    }
  }, [settings, permission]);

  const scheduleExpoNotifications = async (timings: PrayerTimes, azanEnabled: boolean) => {
    await cancelAllNotifications();

    const prayers: Array<{ key: keyof NotificationSettings["prayers"]; time: string }> = [
      { key: "Fajr", time: timings.Fajr },
      { key: "Dhuhr", time: timings.Dhuhr },
      { key: "Asr", time: timings.Asr },
      { key: "Maghrib", time: timings.Maghrib },
      { key: "Isha", time: timings.Isha },
    ];

    const now = new Date();

    for (const prayer of prayers) {
      if (!settings.prayers[prayer.key]) continue;

      const parsedTime = parseTimeString(prayer.time);
      if (!parsedTime) {
        console.warn(`Invalid time format for ${prayer.key}: ${prayer.time}`);
        continue;
      }

      const { hours, minutes } = parsedTime;
      const prayerDate = new Date(now);
      prayerDate.setHours(hours, minutes, 0, 0);

      if (prayerDate <= now) {
        prayerDate.setDate(prayerDate.getDate() + 1);
      }

      try {
        const notificationContent: any = {
          title: `${prayer.key} - ${PRAYER_NAMES_AR[prayer.key]}`,
          body: `It's time for ${prayer.key} prayer`,
          data: { prayer: prayer.key },
        };

        if (Platform.OS === 'android') {
          notificationContent.channelId = 'prayer-times';
          // Don't set sound here - native alarm plays it
          // The notification is just for display
        }

        await Notifications.scheduleNotificationAsync({
          content: notificationContent,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: prayerDate,
          },
        });
      } catch (error) {
        console.error(`Failed to schedule ${prayer.key} notification:`, error);
      }
    }
  };

  const sendTestNotification = useCallback(async (azanEnabled: boolean = false) => {
    try {
      console.log('🚀 Starting test notification...');
      console.log('📱 Platform:', Platform.OS);
      console.log('🔊 Azan enabled:', azanEnabled);

      // Use native alarm module for Android (works even when app is closed)
      if (Platform.OS === 'android' && PrayerAlarmModule) {
        console.log('🤖 Android: Using native alarm module for test');

        // Schedule alarm for 10 seconds from now
        const testTime = Date.now() + 10000;

        const result = await PrayerAlarmModule.schedulePrayerAlarms(
          [{ name: 'Test', timestamp: testTime }],
          azanEnabled
        );

        console.log('✅ Native test alarm scheduled:', result);
        console.log('⏰ Will trigger in 10 seconds');

        // Native alarm will show notification, no need for expo notification
        return;
      }

      // iOS or fallback: use expo notifications
      const notificationContent: any = {
        title: `Test Prayer - الاختبار`,
        body: `This is a test notification with ${azanEnabled ? 'azan sound' : 'no sound'}`,
        data: { prayer: 'test', azanEnabled },
      };

      // Add sound for iOS - use .caf format for notifications
      if (azanEnabled && Platform.OS === 'ios') {
        notificationContent.sound = 'azan.caf';
        console.log('🍎 iOS: Setting sound to azan.caf');
      }

      // Add channel for Android fallback
      if (Platform.OS === 'android') {
        notificationContent.channelId = 'prayer-times';
        if (azanEnabled) {
          notificationContent.sound = 'azan';
          console.log('🤖 Android fallback: Setting sound to azan');
        }
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 10,
        },
      });

      console.log('✅ Test notification scheduled successfully:', {
        id: notificationId,
        platform: Platform.OS,
        azanEnabled,
        willTriggerIn: '10 seconds',
      });
    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
    }
  }, []);

  // Force reschedule iqama if time jumped
  const shouldForceIqamaReschedule = () => {
    const now = Date.now();
    const timeSinceLastSchedule = now - lastIqamaScheduleTimeRef.current;
    if (timeSinceLastSchedule < 0 || timeSinceLastSchedule > 5 * 60 * 1000) {
      console.log('⏰ Time jump detected for iqama, forcing reschedule');
      return true;
    }
    return false;
  };

  const scheduleIqamaNotifications = useCallback(async (
    timings: PrayerTimes,
    iqamaSettings: IqamaSettings
  ) => {
    if (!iqamaSettings.enabled) {
      console.log('⏭️ Iqama disabled, cancelling any existing iqama alarms');
      lastIqamaScheduledRef.current = null;
      if (Platform.OS === 'android' && PrayerAlarmModule) {
        try {
          await PrayerAlarmModule.cancelIqamaAlarms();
        } catch (error) {
          console.error('Failed to cancel iqama alarms:', error);
        }
      }
      return;
    }

    if (permission !== "granted") {
      console.log('⚠️ Notification permission not granted for iqama');
      return;
    }

    // Create schedule key for deduplication
    const today = new Date().toDateString();
    const iqamaScheduleKey = JSON.stringify({
      date: today,
      timings: { Fajr: timings.Fajr, Dhuhr: timings.Dhuhr, Asr: timings.Asr, Maghrib: timings.Maghrib, Isha: timings.Isha },
      prayers: iqamaSettings.prayers,
      delayMinutes: iqamaSettings.delayMinutes,
      version: scheduleVersion,
    });

    if (lastIqamaScheduledRef.current === iqamaScheduleKey && !shouldForceIqamaReschedule()) {
      console.log('⏭️ Skipping iqama - already scheduled with same settings for today');
      return;
    }

    lastIqamaScheduledRef.current = iqamaScheduleKey;
    lastIqamaScheduleTimeRef.current = Date.now();

    console.log('📅 [IQAMA SCHEDULE] Starting iqama scheduling...', {
      currentTime: new Date().toLocaleString(),
      delayMinutes: iqamaSettings.delayMinutes,
      enabledPrayers: Object.entries(iqamaSettings.prayers).filter(([_, v]) => v).map(([k]) => k)
    });

    if (Platform.OS === 'android' && PrayerAlarmModule) {
      try {
        const prayers: Array<{ key: keyof IqamaSettings["prayers"]; time: string }> = [
          { key: "Fajr", time: timings.Fajr },
          { key: "Dhuhr", time: timings.Dhuhr },
          { key: "Asr", time: timings.Asr },
          { key: "Maghrib", time: timings.Maghrib },
          { key: "Isha", time: timings.Isha },
        ];

        const now = new Date();
        const iqamaAlarms: Array<{ name: string; timestamp: number }> = [];
        const delayMs = iqamaSettings.delayMinutes * 60 * 1000;

        console.log('📅 [IQAMA SCHEDULE] Processing prayers, current time:', now.toLocaleString());

        for (const prayer of prayers) {
          if (!iqamaSettings.prayers[prayer.key]) {
            console.log(`⏭️ [IQAMA SCHEDULE] Skipping ${prayer.key} - disabled`);
            continue;
          }

          const parsedTime = parseTimeString(prayer.time);
          if (!parsedTime) {
            console.warn(`Invalid time format for ${prayer.key}: ${prayer.time}`);
            continue;
          }

          const { hours, minutes } = parsedTime;
          const prayerDate = new Date(now);
          prayerDate.setHours(hours, minutes, 0, 0);

          // Calculate iqama time (prayer time + delay)
          const iqamaDate = new Date(prayerDate.getTime() + delayMs);

          console.log(`🕐 [IQAMA SCHEDULE] ${prayer.key}:`, {
            azanTime: prayer.time,
            prayerTimestamp: prayerDate.toLocaleString(),
            iqamaTime: iqamaDate.toLocaleString(),
            isPast: iqamaDate <= now
          });

          // Check if IQAMA time is in the past, not prayer time
          if (iqamaDate <= now) {
            console.log(`⏭️ [IQAMA SCHEDULE] ${prayer.key} iqama already passed, scheduling for tomorrow`);
            prayerDate.setDate(prayerDate.getDate() + 1);
          }

          const finalIqamaTime = new Date(prayerDate.getTime() + delayMs);
          const minutesUntilIqama = Math.round((finalIqamaTime.getTime() - now.getTime()) / 60000);

          console.log(`✅ [IQAMA SCHEDULE] ${prayer.key} iqama will fire at ${finalIqamaTime.toLocaleString()} (in ${minutesUntilIqama} minutes)`);

          iqamaAlarms.push({
            name: prayer.key,
            timestamp: prayerDate.getTime(),
          });
        }

        console.log('📤 [IQAMA SCHEDULE] Sending to native module:', {
          alarmCount: iqamaAlarms.length,
          delayMinutes: iqamaSettings.delayMinutes
        });

        const result = await PrayerAlarmModule.scheduleIqamaAlarms(
          iqamaAlarms,
          iqamaSettings.delayMinutes
        );

        console.log('✅ [IQAMA SCHEDULE] Native module result:', result);
        console.log('🔔 [IQAMA SCHEDULE] Summary - Iqama sounds will play at:');
        iqamaAlarms.forEach(a => {
          const iqamaTime = new Date(a.timestamp + iqamaSettings.delayMinutes * 60000);
          const minutesUntil = Math.round((iqamaTime.getTime() - Date.now()) / 60000);
          console.log(`   - ${a.name}: ${iqamaTime.toLocaleTimeString()} (in ${minutesUntil} min)`);
        });
      } catch (error) {
        console.error('❌ [IQAMA SCHEDULE] Failed to schedule iqama alarms:', error);
      }
    } else {
      console.log('⚠️ [IQAMA SCHEDULE] Only supported on Android with native module');
    }
  }, [permission, scheduleVersion]);

  const cancelIqamaNotifications = useCallback(async () => {
    if (Platform.OS === 'android' && PrayerAlarmModule) {
      try {
        await PrayerAlarmModule.cancelIqamaAlarms();
        console.log('✅ Iqama alarms cancelled');
      } catch (error) {
        console.error('Failed to cancel iqama alarms:', error);
      }
    }
  }, []);

  /**
   * Schedule missed prayer reminder notifications
   * These fire X minutes after each prayer time if the prayer is still unmarked
   */
  const scheduleMissedPrayerReminders = useCallback(async (
    timings: PrayerTimes,
    delayMinutes: number,
    enabled: boolean
  ) => {
    // Cancel existing missed prayer reminders first
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const missedReminderIds = scheduled
      .filter(n => n.content.data?.type === 'missed_prayer_reminder')
      .map(n => n.identifier);

    for (const id of missedReminderIds) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }

    if (!enabled) {
      console.log('⏭️ Missed prayer reminders disabled');
      return;
    }

    if (permission !== "granted") {
      console.log('⚠️ Notification permission not granted for missed prayer reminders');
      return;
    }

    console.log('📅 Scheduling missed prayer reminders...', { delayMinutes });

    const prayers: Array<{ key: PrayerName; time: string }> = [
      { key: "Fajr", time: timings.Fajr },
      { key: "Dhuhr", time: timings.Dhuhr },
      { key: "Asr", time: timings.Asr },
      { key: "Maghrib", time: timings.Maghrib },
      { key: "Isha", time: timings.Isha },
    ];

    const now = new Date();
    const today = getTodayDateString();

    for (const prayer of prayers) {
      const parsedTime = parseTimeString(prayer.time);
      if (!parsedTime) {
        console.warn(`Invalid time format for ${prayer.key}: ${prayer.time}`);
        continue;
      }

      const { hours, minutes } = parsedTime;

      // Calculate reminder time (prayer time + delay)
      const reminderDate = new Date(now);
      reminderDate.setHours(hours, minutes, 0, 0);
      reminderDate.setMinutes(reminderDate.getMinutes() + delayMinutes);

      // If reminder time has passed, schedule for tomorrow
      if (reminderDate <= now) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }

      try {
        const notificationContent: any = {
          title: `Did you pray ${prayer.key}?`,
          body: `It's been ${delayMinutes} minutes since ${prayer.key}. Tap to mark your prayer.`,
          data: {
            type: 'missed_prayer_reminder',
            prayer: prayer.key,
            date: today,
          },
        };

        if (Platform.OS === 'android') {
          notificationContent.channelId = 'prayer-times';
        }

        await Notifications.scheduleNotificationAsync({
          content: notificationContent,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: reminderDate,
          },
        });

        console.log(`✅ Missed reminder scheduled for ${prayer.key} at ${reminderDate.toLocaleString()}`);
      } catch (error) {
        console.error(`Failed to schedule missed reminder for ${prayer.key}:`, error);
      }
    }
  }, [permission]);

  /**
   * Cancel missed prayer reminder for a specific prayer (when user marks it)
   */
  const cancelMissedPrayerReminder = useCallback(async (prayer: PrayerName) => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const reminderToCancel = scheduled.find(
        n => n.content.data?.type === 'missed_prayer_reminder' && n.content.data?.prayer === prayer
      );

      if (reminderToCancel) {
        await Notifications.cancelScheduledNotificationAsync(reminderToCancel.identifier);
        console.log(`✅ Cancelled missed reminder for ${prayer}`);
      }
    } catch (error) {
      console.error(`Failed to cancel missed reminder for ${prayer}:`, error);
    }
  }, []);

  // Test iqama notification - plays immediately for debugging
  const testIqamaNotification = useCallback(async () => {
    console.log('🧪 [TEST IQAMA] Starting test iqama notification...');

    if (Platform.OS !== 'android') {
      console.log('⚠️ [TEST IQAMA] Only supported on Android');
      return { success: false, message: 'Only supported on Android' };
    }

    if (!PrayerAlarmModule) {
      console.log('❌ [TEST IQAMA] PrayerAlarmModule not available');
      return { success: false, message: 'PrayerAlarmModule not available' };
    }

    try {
      // Use the native testIqamaSound method which handles silent mode gracefully
      const result = await PrayerAlarmModule.testIqamaSound();
      console.log('✅ [TEST IQAMA] Result:', result);
      return { success: true, message: result };
    } catch (error) {
      console.error('❌ [TEST IQAMA] Failed:', error);
      return { success: false, message: String(error) };
    }
  }, []);

  // Force clear the schedule cache to trigger rescheduling
  const clearScheduleCache = useCallback(() => {
    lastScheduledRef.current = null;
    lastScheduleTimeRef.current = 0;
    lastIqamaScheduledRef.current = null;
    lastIqamaScheduleTimeRef.current = 0;
    setScheduleVersion(v => v + 1);
  }, []);

  return {
    permission,
    settings,
    loading,
    requestPermission,
    toggleNotifications,
    togglePrayerNotification,
    schedulePrayerNotifications,
    cancelAllNotifications,
    sendTestNotification,
    scheduleIqamaNotifications,
    cancelIqamaNotifications,
    testIqamaNotification,
    scheduleMissedPrayerReminders,
    cancelMissedPrayerReminder,
    clearScheduleCache,
  };
}
