import { useState, useEffect, useCallback, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PrayerTimes } from "./usePrayerTimes";

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

  const schedulePrayerNotifications = useCallback(async (timings: PrayerTimes) => {
    if (!settings.enabled || permission !== "granted") return;

    const scheduleKey = JSON.stringify({
      timings: { Fajr: timings.Fajr, Dhuhr: timings.Dhuhr, Asr: timings.Asr, Maghrib: timings.Maghrib, Isha: timings.Isha },
      prayers: settings.prayers,
    });
    
    if (lastScheduledRef.current === scheduleKey) {
      return;
    }
    
    lastScheduledRef.current = scheduleKey;
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
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${prayer.key} - ${PRAYER_NAMES_AR[prayer.key]}`,
            body: `It's time for ${prayer.key} prayer`,
            data: { prayer: prayer.key },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: prayerDate,
          },
        });
      } catch (error) {
        console.error(`Failed to schedule ${prayer.key} notification:`, error);
      }
    }
  }, [settings, permission]);

  return {
    permission,
    settings,
    loading,
    requestPermission,
    toggleNotifications,
    togglePrayerNotification,
    schedulePrayerNotifications,
    cancelAllNotifications,
  };
}
