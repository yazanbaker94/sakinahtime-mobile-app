/**
 * useDuaAudio Hook
 * 
 * Hook for audio playback of dua pronunciations using expo-av.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';

export interface UseDuaAudioReturn {
  isPlaying: boolean;
  isLoading: boolean;
  currentDuaId: string | null;
  progress: number;
  duration: number;
  play: (duaId: string, audioUrl: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  error: string | null;
}

export function useDuaAudio(): UseDuaAudioReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDuaId, setCurrentDuaId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const soundRef = useRef<Audio.Sound | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Handle playback status updates
  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        setError(`Playback error: ${status.error}`);
        setIsPlaying(false);
        setIsLoading(false);
      }
      return;
    }

    setIsPlaying(status.isPlaying);
    setDuration(status.durationMillis || 0);
    setProgress(status.positionMillis || 0);

    // Handle playback finished
    if (status.didJustFinish) {
      setIsPlaying(false);
      setProgress(0);
    }
  }, []);

  // Play audio
  const play = useCallback(async (duaId: string, audioUrl: string): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);

      // Stop current playback if different dua
      if (soundRef.current && currentDuaId !== duaId) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // If same dua and paused, just resume
      if (soundRef.current && currentDuaId === duaId) {
        await soundRef.current.playAsync();
        setIsLoading(false);
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Load and play new audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setCurrentDuaId(duaId);
      setIsLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to play audio';
      setError(message);
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, [currentDuaId, onPlaybackStatusUpdate]);

  // Pause playback
  const pause = useCallback(async (): Promise<void> => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pause';
      setError(message);
    }
  }, []);

  // Resume playback
  const resume = useCallback(async (): Promise<void> => {
    try {
      if (soundRef.current) {
        await soundRef.current.playAsync();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resume';
      setError(message);
    }
  }, []);

  // Stop playback
  const stop = useCallback(async (): Promise<void> => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.setPositionAsync(0);
      }
      setIsPlaying(false);
      setProgress(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop';
      setError(message);
    }
  }, []);

  // Seek to position
  const seekTo = useCallback(async (position: number): Promise<void> => {
    try {
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(position);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to seek';
      setError(message);
    }
  }, []);

  return {
    isPlaying,
    isLoading,
    currentDuaId,
    progress,
    duration,
    play,
    pause,
    resume,
    stop,
    seekTo,
    error,
  };
}

export default useDuaAudio;
