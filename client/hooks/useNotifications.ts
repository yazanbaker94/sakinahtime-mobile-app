import { useState, useEffect, useCallback, useRef } from "react";
import { Platform, NativeModules } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PrayerTimes } from "./usePrayerTimes";

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
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
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
    if (!settings.enabled || permission !== "granted") {
      console.log('⚠️ Notifications disabled or permission not granted:', { enabled: settings.enabled, permission });
      return;
    }

    console.log('📅 Scheduling prayer notifications...', { azanEnabled });

    const scheduleKey = JSON.stringify({
      timings: { Fajr: timings.Fajr, Dhuhr: timings.Dhuhr, Asr: timings.Asr, Maghrib: timings.Maghrib, Isha: timings.Isha },
      prayers: settings.prayers,
      azanEnabled,
    });
    
    if (lastScheduledRef.current === scheduleKey) {
      console.log('⏭️ Skipping - already scheduled with same settings');
      return;
    }
    
    lastScheduledRef.current = scheduleKey;

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
          const prayerAlarms = [];

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
  };
}
