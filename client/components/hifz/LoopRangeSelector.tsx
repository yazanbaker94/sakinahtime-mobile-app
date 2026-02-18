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
import { useTranslation } from '../../hooks/useTranslation';
import { ThemedText } from '../ThemedText';
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
  const { t } = useTranslation();
  const {
    loopRange,
    clearLoop,
    isLooping,
    setIsLooping,
  } = useHifzMode();

  const activeColor = theme.primary;

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
      <View style={[styles.rangeDisplay, {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }]}>
        <View style={styles.rangeItem}>
          <View style={[styles.rangeBadge, { backgroundColor: loopRange.start ? '#3B82F6' : theme.border }]}>
            <ThemedText style={styles.rangeBadgeText}>A</ThemedText>
          </View>
          <ThemedText style={[styles.rangeLabel, { color: theme.textSecondary }]}>
            {t('loopRange.start')}
          </ThemedText>
          <ThemedText style={styles.rangeValue}>
            {loopRange.start || t('loopRange.notSet')}
          </ThemedText>
        </View>
        <Feather name="arrow-right" size={20} color={theme.textSecondary} />
        <View style={styles.rangeItem}>
          <View style={[styles.rangeBadge, { backgroundColor: loopRange.end ? '#3B82F6' : theme.border }]}>
            <ThemedText style={styles.rangeBadgeText}>B</ThemedText>
          </View>
          <ThemedText style={[styles.rangeLabel, { color: theme.textSecondary }]}>
            {t('loopRange.end')}
          </ThemedText>
          <ThemedText style={styles.rangeValue}>
            {loopRange.end || t('loopRange.notSet')}
          </ThemedText>
        </View>
      </View>

      {/* Help Text */}
      {!hasValidRange && (
        <View style={[styles.helpBox, {
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
          elevation: 1,
        }]}>
          <Feather name="info" size={16} color={theme.textSecondary} />
          <ThemedText style={[styles.helpText, { color: theme.textSecondary }]}>
            {t('loopRange.helpText')}
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
            style={[styles.clearButton, {
              backgroundColor: 'rgba(239, 68, 68, 0.10)',
              borderWidth: 0,
              borderColor: 'transparent',
            }]}
          >
            <Feather name="x" size={16} color="#EF4444" />
            <ThemedText style={[styles.clearText, { color: '#EF4444' }]}>
              {t('loopRange.clear')}
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
                ? (isLooping ? '#EF4444' : '#FFFFFF')
                : theme.backgroundSecondary,
              flex: 1,
              borderWidth: 0,
              borderColor: 'transparent',
              ...(hasValidRange && !isLooping ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
                elevation: 3,
              } : hasValidRange && isLooping ? {
                shadowColor: '#EF4444',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 4,
              } : {}),
            },
          ]}
        >
          <Feather
            name={isLooping ? 'square' : 'play'}
            size={18}
            color={hasValidRange ? (isLooping ? '#FFFFFF' : activeColor) : theme.textSecondary}
          />
          <ThemedText
            style={[
              styles.startLoopText,
              { color: hasValidRange ? (isLooping ? '#FFFFFF' : activeColor) : theme.textSecondary },
            ]}
          >
            {isLooping ? t('loopRange.stopLoop') : t('loopRange.playLoop')}
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
