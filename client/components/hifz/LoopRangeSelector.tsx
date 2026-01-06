/**
 * LoopRangeSelector
 * Component for displaying and controlling audio loop range
 * Loop start/end are set via long-press menu on verses
 */

import React, { useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useHifzMode } from '../../contexts/HifzModeContext';
import { useTheme } from '../../hooks/useTheme';
import { ThemedText } from '../ThemedText';
import { HIFZ_ACTIVE_COLOR } from '../../constants/hifz';
import AudioService from '../../services/AudioService';

interface LoopRangeSelectorProps {
  currentVerseKey?: string;
  currentPage?: number;
  currentJuz?: number;
  onLoopStart?: () => void;
  style?: any;
}

export function LoopRangeSelector({
  currentVerseKey,
  currentPage,
  currentJuz,
  onLoopStart,
  style,
}: LoopRangeSelectorProps) {
  const { isDark, theme } = useTheme();
  const {
    loopRange,
    clearLoop,
    isLooping,
    setIsLooping,
  } = useHifzMode();

  const activeColor = isDark ? HIFZ_ACTIVE_COLOR.dark : HIFZ_ACTIVE_COLOR.light;

  const handleStartLoop = useCallback(async () => {
    if (loopRange.start && loopRange.end) {
      const [startSurah, startAyah] = loopRange.start.split(':').map(Number);
      const [endSurah, endAyah] = loopRange.end.split(':').map(Number);
      
      if (isLooping) {
        await AudioService.stopLoop();
        setIsLooping(false);
      } else {
        await AudioService.playLoop(startSurah, startAyah, endSurah, endAyah, 0);
        setIsLooping(true);
      }
      onLoopStart?.();
    }
  }, [loopRange, isLooping, setIsLooping, onLoopStart]);

  const hasValidRange = loopRange.start && loopRange.end;

  return (
    <View style={[styles.container, style]}>
      {/* Current Range Display */}
      <View style={[styles.rangeDisplay, { backgroundColor: theme.backgroundSecondary }]}>
        <View style={styles.rangeItem}>
          <View style={[styles.rangeBadge, { backgroundColor: loopRange.start ? '#3B82F6' : theme.border }]}>
            <ThemedText style={styles.rangeBadgeText}>A</ThemedText>
          </View>
          <ThemedText style={[styles.rangeLabel, { color: theme.textSecondary }]}>
            Start
          </ThemedText>
          <ThemedText style={styles.rangeValue}>
            {loopRange.start || 'Not set'}
          </ThemedText>
        </View>
        <Feather name="arrow-right" size={20} color={theme.textSecondary} />
        <View style={styles.rangeItem}>
          <View style={[styles.rangeBadge, { backgroundColor: loopRange.end ? '#3B82F6' : theme.border }]}>
            <ThemedText style={styles.rangeBadgeText}>B</ThemedText>
          </View>
          <ThemedText style={[styles.rangeLabel, { color: theme.textSecondary }]}>
            End
          </ThemedText>
          <ThemedText style={styles.rangeValue}>
            {loopRange.end || 'Not set'}
          </ThemedText>
        </View>
      </View>

      {/* Help Text */}
      {!hasValidRange && (
        <View style={[styles.helpBox, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="info" size={16} color={theme.textSecondary} />
          <ThemedText style={[styles.helpText, { color: theme.textSecondary }]}>
            Long-press a verse and tap "Set Loop Start" or "Set Loop End" to define the range
          </ThemedText>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {hasValidRange && (
          <TouchableOpacity
            onPress={clearLoop}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Clear loop range"
            style={[styles.clearButton, { borderColor: '#EF4444' }]}
          >
            <Feather name="x" size={16} color="#EF4444" />
            <ThemedText style={[styles.clearText, { color: '#EF4444' }]}>
              Clear
            </ThemedText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleStartLoop}
          disabled={!hasValidRange}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isLooping ? 'Stop loop playback' : 'Start loop playback'}
          accessibilityState={{ disabled: !hasValidRange }}
          style={[
            styles.startLoopButton,
            {
              backgroundColor: hasValidRange 
                ? (isLooping ? '#EF4444' : activeColor) 
                : theme.backgroundSecondary,
              flex: 1,
            },
          ]}
        >
          <Feather
            name={isLooping ? 'square' : 'play'}
            size={18}
            color={hasValidRange ? '#FFFFFF' : theme.textSecondary}
          />
          <ThemedText
            style={[
              styles.startLoopText,
              { color: hasValidRange ? '#FFFFFF' : theme.textSecondary },
            ]}
          >
            {isLooping ? 'Stop Loop' : 'Play Loop'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  rangeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  rangeItem: {
    alignItems: 'center',
    flex: 1,
  },
  rangeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  rangeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rangeLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  rangeValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  helpText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
  },
  startLoopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  startLoopText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default LoopRangeSelector;
