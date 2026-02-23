import { useState, useEffect, useCallback, useRef } from "react";
import { Platform, NativeModules } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PrayerTimes, CALCULATION_METHODS, useCalculationMethod } from "./usePrayerTimes";
import { useLocation } from "../contexts/LocationContext";
import { IqamaSettings } from "./useIqamaSettings";
import { PrayerName, PRAYER_NAMES } from "../types/prayerLog";
import { prayerLogService, getTodayDateString } from "../services/PrayerLogService";

const { NotificationSoundModule, PrayerAlarmModule } = NativeModules;

const NOTIFICATION_SETTINGS_KEY = "@prayer_notification_settings";

/**
 * Check if the app can schedule exact alarms.
 * On Android 12+, this requires explicit SCHEDULE_EXACT_ALARM permission.
 * Returns true if permission is granted, false otherwise.
 */
export async function canScheduleExactAlarms(): Promise<boolean> {
  if (Platform.OS !== 'android' || !PrayerAlarmModule) {
    return true; // iOS doesn't need this, assume ok
  }
  try {
    return await PrayerAlarmModule.canScheduleExactAlarms();
  } catch (e) {
    console.warn('Failed to check exact alarm permission:', e);
    return true; // Assume ok on error to not block scheduling attempts
  }
}

/**
 * Request exact alarm permission.
 * Opens system settings page where user grants the permission.
 * Returns: 'opened' | 'already_granted' | 'not_needed' | null (on error)
 */
export async function requestExactAlarmPermission(): Promise<string | null> {
  if (Platform.OS !== 'android' || !PrayerAlarmModule) {
    return 'not_needed';
  }
  try {
    return await PrayerAlarmModule.requestExactAlarmPermission();
  } catch (e) {
    console.warn('Failed to request exact alarm permission:', e);
    return null;
  }
}

/**
 * Check if battery optimization is active (blocking background work).
 * Returns true if optimization is ON (bad for alarms), false if exempt (good).
 * On iOS or if unavailable, returns false (no action needed).
 */
export async function checkBatteryOptimization(): Promise<boolean> {
  if (Platform.OS !== 'android' || !PrayerAlarmModule) {
    return false;
  }
  try {
    return await PrayerAlarmModule.isBatteryOptimized();
  } catch (e) {
    console.warn('Failed to check battery optimization:', e);
    return false;
  }
}

/**
 * Request battery optimization exemption.
 * Opens system dialog asking user to allow background work.
 * Returns: 'opened' | 'already_exempt' | 'not_needed' | null (on error)
 */
export async function requestBatteryOptimizationExemption(): Promise<string | null> {
  if (Platform.OS !== 'android' || !PrayerAlarmModule) {
    return 'not_needed';
  }
  try {
    return await PrayerAlarmModule.requestBatteryOptimizationExemption();
  } catch (e) {
    console.warn('Failed to request battery optimization exemption:', e);
    return null;
  }
}

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
  const { latitude, longitude } = useLocation();
  const { method: calculationMethodId } = useCalculationMethod();
  const [permission, setPermission] = useState<Notifications.PermissionStatus | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const lastScheduledRef = useRef<string | null>(null);
  const lastScheduleTimeRef = useRef<number>(0);
  const lastIqamaScheduledRef = useRef<string | null>(null);
  const lastIqamaScheduleTimeRef = useRef<number>(0);
  const [scheduleVersion, setScheduleVersion] = useState(0); // Trigger re-scheduling

  // Helper to map API calc method ID to adhan-java string
  const getCalculationMethodString = (id: number) => {
    switch (id) {
      case 1: return "KARACHI";
      case 2: return "ISNA";
      case 3: return "MUSLIM_WORLD_LEAGUE";
      case 4: return "MAKKAH";
      case 5: return "EGYPTIAN";
      case 7: return "TEHRAN";
      case 8: return "GULF";
      case 9: return "KUWAIT";
      case 10: return "QATAR";
      case 11: return "SINGAPORE";
      case 16: return "JORDAN";
      default: return "MUSLIM_WORLD_LEAGUE";
    }
  };

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

  const schedulePrayerNotifications = useCallback(async (timings: PrayerTimes, azanEnabled: boolean = false, iqamaSettings?: IqamaSettings) => {
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
      iqamaEnabled: iqamaSettings?.enabled,
      iqamaDelay: iqamaSettings?.delayMinutes,
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
        console.log('✅ Using native PrayerAlarmModule Configuration Flow');
        try {
          // Send unified configuration to Native (Azan + Iqama Sidecar Shadow)
          if (latitude !== null && longitude !== null && latitude !== undefined && longitude !== undefined) {
            const result = await PrayerAlarmModule.saveConfiguration({
              latitude,
              longitude,
              calculationMethod: getCalculationMethodString(calculationMethodId),
              madhab: "SHAFI",
              azanEnabled,
              fajrEnabled: settings.prayers.Fajr,
              dhuhrEnabled: settings.prayers.Dhuhr,
              asrEnabled: settings.prayers.Asr,
              maghribEnabled: settings.prayers.Maghrib,
              ishaEnabled: settings.prayers.Isha,
              // Iqama Sidecar Shadow config — native side schedules iqama
              // as a trailing shadow of each Azan via setExactAndAllowWhileIdle
              iqamaEnabled: iqamaSettings?.enabled ?? false,
              iqamaDelayMinutes: iqamaSettings?.delayMinutes ?? 15,
              iqamaFajrEnabled: iqamaSettings?.prayers?.Fajr ?? true,
              iqamaDhuhrEnabled: iqamaSettings?.prayers?.Dhuhr ?? true,
              iqamaAsrEnabled: iqamaSettings?.prayers?.Asr ?? true,
              iqamaMaghribEnabled: iqamaSettings?.prayers?.Maghrib ?? true,
              iqamaIshaEnabled: iqamaSettings?.prayers?.Isha ?? true,
            });
            console.log('✅ Native azan + iqama configured and Daisy Chain triggered:', result);
          } else {
            console.warn('⚠️ Missing location for native azan. Skipping.');
          }

          // Fallback to Expo Notifications for visual notifications
          // The native service only handles the alarm sound + foreground service currently
          await scheduleExpoNotifications(timings, false); // false to avoid double sound
        } catch (error) {
          console.error('❌ Failed to configure native azan:', error);
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
  }, [settings, permission, latitude, longitude, calculationMethodId]);

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
    // Iqama scheduling is handled entirely by the native Sidecar Shadow architecture.
    // saveConfiguration() already sends iqama config (enabled, delayMinutes, per-prayer toggles)
    // to SharedPreferences. When PrayerAlarmReceiver fires for each Azan, it reads the config
    // and schedules the iqama via setExactAndAllowWhileIdle → IqamaReceiver.
    // This function only logs for debugging — no separate native call needed.

    if (!iqamaSettings.enabled) {
      console.log('⏭️ [IQAMA] Iqama disabled — native side will skip iqama scheduling after azan');
      lastIqamaScheduledRef.current = null;
      return;
    }

    if (permission !== "granted") {
      console.log('⚠️ [IQAMA] Notification permission not granted for iqama');
      return;
    }

    // Create schedule key for deduplication logging
    const today = new Date().toDateString();
    const iqamaScheduleKey = JSON.stringify({
      date: today,
      timings: { Fajr: timings.Fajr, Dhuhr: timings.Dhuhr, Asr: timings.Asr, Maghrib: timings.Maghrib, Isha: timings.Isha },
      prayers: iqamaSettings.prayers,
      delayMinutes: iqamaSettings.delayMinutes,
      version: scheduleVersion,
    });

    if (lastIqamaScheduledRef.current === iqamaScheduleKey && !shouldForceIqamaReschedule()) {
      console.log('⏭️ [IQAMA] Skipping — already configured with same settings for today');
      return;
    }

    lastIqamaScheduledRef.current = iqamaScheduleKey;
    lastIqamaScheduleTimeRef.current = Date.now();

    console.log('✅ [IQAMA] Iqama config active — native Sidecar Shadow will schedule after each azan:', {
      delayMinutes: iqamaSettings.delayMinutes,
      enabledPrayers: Object.entries(iqamaSettings.prayers).filter(([_, v]) => v).map(([k]) => k),
    });
  }, [permission, scheduleVersion]);

  const cancelIqamaNotifications = useCallback(async () => {
    // Iqama cancellation is handled by saveConfiguration(iqamaEnabled: false).
    // The native PrayerAlarmReceiver checks iqamaEnabled before scheduling.
    // Just clear the JS-side cache so next config push is accepted.
    lastIqamaScheduledRef.current = null;
    lastIqamaScheduleTimeRef.current = 0;
    console.log('✅ [IQAMA] Cleared iqama schedule cache — native side governed by saveConfiguration');
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

  // Test iqama notification — fires a test azan alarm in 10s (iqama follows as sidecar)
  const testIqamaNotification = useCallback(async () => {
    console.log('🧪 [TEST IQAMA] Iqama is tested as a sidecar of the test azan alarm');
    console.log('🧪 [TEST IQAMA] Use sendTestNotification(true) — iqama will fire delayMinutes after');
    return { success: true, message: 'Use test azan — iqama fires as sidecar shadow' };
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
