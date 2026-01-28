import { useState, useEffect, useRef, useCallback } from "react";
import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AZAN_SETTINGS_KEY = "@azan_settings";

export interface AzanSettings {
  enabled: boolean;
  volume: number;
  prayers: {
    Fajr: boolean;
    Dhuhr: boolean;
    Asr: boolean;
    Maghrib: boolean;
    Isha: boolean;
  };
}

const DEFAULT_SETTINGS: AzanSettings = {
  enabled: true,
  volume: 1.0, // Maximum volume
  prayers: {
    Fajr: true,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true,
  },
};

// Use local azan file - place azan.mp3 in assets/audio/
const AZAN_AUDIO = require('../../assets/audio/azan.mp3');

export function useAzan() {
  const [settings, setSettings] = useState<AzanSettings>(DEFAULT_SETTINGS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    loadSettings();
    setupAudio();

    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      if (notification.request.content.data?.prayer && settings.enabled) {
        playAzan();
      }
    });

    return () => {
      subscription.remove();
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [settings.enabled]);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true, // Allow audio to play in background
        shouldDuckAndroid: true,
        interruptionModeIOS: 2, // Mix with other audio
        interruptionModeAndroid: 1, // Duck other audio
      });
    } catch (error) {
      console.error("Failed to setup audio:", error);
    }
  };

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(AZAN_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle migration (existing users without prayers setting)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed, prayers: { ...DEFAULT_SETTINGS.prayers, ...parsed.prayers } });
      }
    } catch (error) {
      console.error("Failed to load azan settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: AzanSettings) => {
    // Update state immediately for responsive UI
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem(AZAN_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save azan settings:", error);
    }
  };

  const toggleAzan = async (enabled: boolean) => {
    const newSettings = { ...settings, enabled };
    await saveSettings(newSettings);
  };

  const togglePrayerAzan = async (
    prayer: keyof AzanSettings["prayers"],
    enabled: boolean
  ) => {
    const newSettings = {
      ...settings,
      prayers: { ...settings.prayers, [prayer]: enabled },
    };
    await saveSettings(newSettings);
  };

  const setVolume = async (volume: number) => {
    const newSettings = { ...settings, volume: Math.max(0, Math.min(1, volume)) };
    await saveSettings(newSettings);
    if (soundRef.current) {
      await soundRef.current.setVolumeAsync(newSettings.volume);
    }
  };

  const playAzan = useCallback(async () => {
    if (!settings.enabled) return;

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        AZAN_AUDIO,
        { shouldPlay: true, volume: settings.volume }
      );

      soundRef.current = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error("Failed to play azan:", error);
      setIsPlaying(false);
    }
  }, [settings]);

  const stopAzan = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (error) {
        console.error("Failed to stop azan:", error);
      }
    }
    setIsPlaying(false);
  }, []);

  const playPreview = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        AZAN_AUDIO,
        { shouldPlay: true, volume: settings.volume }
      );

      soundRef.current = sound;
      setIsPlaying(true);

      setTimeout(async () => {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
          setIsPlaying(false);
        }
      }, 10000);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error("Failed to play azan preview:", error);
      setIsPlaying(false);
    }
  }, [settings.volume]);

  // Test azan for a specific prayer - returns true if played, false if prayer is disabled
  const testAzanForPrayer = useCallback(async (
    prayer: keyof AzanSettings["prayers"]
  ): Promise<boolean> => {
    // Check if azan is globally enabled and prayer is enabled
    if (!settings.enabled) {
      return false;
    }
    if (!settings.prayers[prayer]) {
      return false;
    }

    // Play a short preview (5 seconds)
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        AZAN_AUDIO,
        { shouldPlay: true, volume: settings.volume }
      );

      soundRef.current = sound;
      setIsPlaying(true);

      // Stop after 5 seconds
      setTimeout(async () => {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
          setIsPlaying(false);
        }
      }, 5000);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      return true;
    } catch (error) {
      console.error("Failed to test azan:", error);
      setIsPlaying(false);
      return false;
    }
  }, [settings]);

  return {
    settings,
    isPlaying,
    loading,
    toggleAzan,
    togglePrayerAzan,
    testAzanForPrayer,
    setVolume,
    playAzan,
    stopAzan,
    playPreview,
  };
}
