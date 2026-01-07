/**
 * DuaAudioPlayer Component
 * 
 * Audio playback controls for dua pronunciation.
 */

import React from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

interface DuaAudioPlayerProps {
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek?: (position: number) => void;
  error?: string | null;
}

// Format milliseconds to mm:ss
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function DuaAudioPlayer({
  isPlaying,
  isLoading,
  progress,
  duration,
  onPlay,
  onPause,
  onSeek,
  error,
}: DuaAudioPlayerProps) {
  const { isDark, theme } = useTheme();

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  if (error) {
    return (
      <View style={[
        styles.container,
        { backgroundColor: isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
      ]}>
        <Feather name="alert-circle" size={20} color="#EF4444" />
        <ThemedText type="caption" style={{ color: '#EF4444', marginLeft: Spacing.sm, flex: 1 }}>
          {error}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: `${theme.primary}26` }
    ]}>
      {/* Play/Pause Button */}
      <Pressable
        onPress={isPlaying ? onPause : onPlay}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.playButton,
          { 
            backgroundColor: theme.primary,
            opacity: pressed ? 0.7 : 1,
          }
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Feather 
            name={isPlaying ? 'pause' : 'play'} 
            size={20} 
            color="#fff" 
          />
        )}
      </Pressable>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        {/* Progress Bar */}
        <Pressable 
          style={styles.progressBarContainer}
          onPress={(e) => {
            if (onSeek && duration > 0) {
              const { locationX } = e.nativeEvent;
              // Approximate width calculation
              const percent = Math.max(0, Math.min(1, locationX / 200));
              onSeek(percent * duration);
            }
          }}
        >
          <View style={[
            styles.progressBar,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)' }
          ]}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${progressPercent}%`,
                  backgroundColor: theme.primary,
                }
              ]} 
            />
          </View>
        </Pressable>

        {/* Time Display */}
        <View style={styles.timeRow}>
          <ThemedText type="caption" secondary>
            {formatTime(progress)}
          </ThemedText>
          <ThemedText type="caption" secondary>
            {formatTime(duration)}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSection: {
    flex: 1,
  },
  progressBarContainer: {
    paddingVertical: Spacing.xs,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
});

export default DuaAudioPlayer;
