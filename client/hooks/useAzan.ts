import { useState, useEffect, useRef, useCallback } from "react";
import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AZAN_SETTINGS_KEY = "@azan_settings";

export interface AzanSettings {
  enabled: boolean;
  volume: number;
}

const DEFAULT_SETTINGS: AzanSettings = {
  enabled: true,
  volume: 1.0, // Maximum volume
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
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load azan settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: AzanSettings) => {
    try {
      await AsyncStorage.setItem(AZAN_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to save azan settings:", error);
    }
  };

  const toggleAzan = async (enabled: boolean) => {
    const newSettings = { ...settings, enabled };
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

  return {
    settings,
    isPlaying,
    loading,
    toggleAzan,
    setVolume,
    playAzan,
    stopAzan,
    playPreview,
  };
}
