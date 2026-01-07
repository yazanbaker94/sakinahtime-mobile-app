/**
 * RepeatControls
 * Controls for audio repeat functionality in Hifz mode
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useHifzMode } from '../../contexts/HifzModeContext';
import { useTheme } from '../../hooks/useTheme';
import { ThemedText } from '../ThemedText';
import {
  REPEAT_COUNT_OPTIONS,
  PAUSE_DURATION_OPTIONS,
  PLAYBACK_SPEED_OPTIONS,
} from '../../constants/hifz';

interface RepeatControlsProps {
  onStop?: () => void;
  isRepeating?: boolean;
  currentRepeat?: number;
  totalRepeats?: number;
  style?: any;
}

export function RepeatControls({ onStop, isRepeating, currentRepeat: externalCurrentRepeat, totalRepeats: externalTotalRepeats, style }: RepeatControlsProps) {
  const {
    settings,
    currentRepeat: contextCurrentRepeat,
    totalRepeats: contextTotalRepeats,
    setRepeatCount,
    setPauseBetweenRepeats,
    setPlaybackSpeed,
    resetRepeat,
  } = useHifzMode();
  const { isDark, theme } = useTheme();

  const activeColor = theme.primary;
  
  // Use external values if provided (from AudioService), otherwise use context
  const displayCurrentRepeat = externalCurrentRepeat ?? contextCurrentRepeat;
  const displayTotalRepeats = externalTotalRepeats ?? contextTotalRepeats;
  const showingProgress = isRepeating && displayCurrentRepeat > 0;

  const handleStop = () => {
    resetRepeat();
    onStop?.();
  };

  const renderOptionButton = (
    value: number,
    label: string,
    isSelected: boolean,
    onPress: () => void,
    accessibilityLabel?: string
  ) => (
    <TouchableOpacity
      key={value}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={accessibilityLabel || label}
      style={[
        styles.optionButton,
        {
          backgroundColor: isSelected ? activeColor : theme.cardBackground,
          borderColor: isSelected ? activeColor : theme.border,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.optionText,
          { color: isSelected ? '#FFFFFF' : theme.text },
        ]}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
          Audio Repeat Settings
        </ThemedText>
        <ThemedText style={[styles.headerSubtitle, { color: theme.text, opacity: 0.6 }]}>
          For memorization practice
        </ThemedText>
      </View>

      {/* Repeat Count */}
      <View style={styles.section} accessible={true} accessibilityLabel="How many times to repeat the verse">
        <View style={styles.sectionHeader}>
          <View>
            <ThemedText style={styles.sectionTitle}>Times to Repeat</ThemedText>
            <ThemedText style={[styles.sectionHint, { color: theme.text, opacity: 0.5 }]}>
              Verse plays this many times
            </ThemedText>
          </View>
          {showingProgress && (
            <View style={[styles.progressBadge, { backgroundColor: activeColor }]}>
              <ThemedText style={styles.progressText} accessibilityLabel={`Playing repeat ${displayCurrentRepeat} of ${displayTotalRepeats === 0 ? 'infinite' : displayTotalRepeats}`}>
                {displayCurrentRepeat}/{displayTotalRepeats === 0 ? '∞' : displayTotalRepeats}
              </ThemedText>
            </View>
          )}
        </View>
        <View style={styles.optionsRow}>
          {REPEAT_COUNT_OPTIONS.map(option =>
            renderOptionButton(
              option.value,
              option.label,
              settings.repeatCount === option.value,
              () => setRepeatCount(option.value),
              `Repeat ${option.value === 0 ? 'unlimited' : option.value} times`
            )
          )}
        </View>
      </View>

      {/* Pause Duration */}
      <View style={styles.section} accessible={true} accessibilityLabel="Pause between repeats">
        <View>
          <ThemedText style={styles.sectionTitle}>Gap Between Repeats</ThemedText>
          <ThemedText style={[styles.sectionHint, { color: theme.text, opacity: 0.5 }]}>
            Time to recite along before next play
          </ThemedText>
        </View>
        <View style={styles.optionsRow}>
          {PAUSE_DURATION_OPTIONS.map(option =>
            renderOptionButton(
              option.value,
              option.label,
              settings.pauseBetweenRepeats === option.value,
              () => setPauseBetweenRepeats(option.value),
              `${option.label} pause between repeats`
            )
          )}
        </View>
      </View>

      {/* Playback Speed */}
      <View style={styles.section} accessible={true} accessibilityLabel="Playback speed">
        <View>
          <ThemedText style={styles.sectionTitle}>Recitation Speed</ThemedText>
          <ThemedText style={[styles.sectionHint, { color: theme.text, opacity: 0.5 }]}>
            Slower helps with learning pronunciation
          </ThemedText>
        </View>
        <View style={styles.optionsRow}>
          {PLAYBACK_SPEED_OPTIONS.map(option =>
            renderOptionButton(
              option.value,
              option.label,
              settings.playbackSpeed === option.value,
              () => setPlaybackSpeed(option.value),
              `${option.label} playback speed`
            )
          )}
        </View>
      </View>

      {/* Stop Button - only show when actively repeating */}
      {isRepeating && (
        <TouchableOpacity
          onPress={handleStop}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Stop repeat playback"
          style={[styles.stopButton, { backgroundColor: '#EF4444' }]}
        >
          <Feather name="square" size={16} color="#FFFFFF" />
          <ThemedText style={styles.stopText}>Stop Repeating</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerRow: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHint: {
    fontSize: 11,
    marginTop: 2,
  },
  progressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 48,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  stopText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default RepeatControls;
