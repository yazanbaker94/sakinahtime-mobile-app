/**
 * DownloadProgress Component
 * 
 * Shows current download progress with controls.
 */

import React from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import { DownloadItem } from '../types/offline';
import { formatBytes, SURAH_INFO } from '../constants/offline';

interface DownloadProgressProps {
  item: DownloadItem;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

export function DownloadProgress({ item, onPause, onResume, onCancel }: DownloadProgressProps) {
  const { isDark } = useTheme();

  const surahInfo = SURAH_INFO.find(s => s.number === item.surahNumber);
  const surahName = surahInfo?.nameEn || `Surah ${item.surahNumber}`;

  const isDownloading = item.status === 'downloading';
  const isPaused = item.status === 'paused';
  const isFailed = item.status === 'failed';

  const getStatusColor = () => {
    if (isFailed) return isDark ? '#F87171' : '#EF4444';
    if (isPaused) return isDark ? '#FBBF24' : '#F59E0B';
    return isDark ? '#60A5FA' : '#3B82F6';
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? 'rgba(26, 95, 79, 0.2)' : Colors.light.backgroundDefault }
    ]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {isDownloading ? (
            <ActivityIndicator 
              size="small" 
              color={isDark ? Colors.dark.primary : Colors.light.primary} 
            />
          ) : (
            <Feather 
              name={isFailed ? 'alert-circle' : isPaused ? 'pause-circle' : 'download'} 
              size={20} 
              color={getStatusColor()} 
            />
          )}
          <View style={styles.titleContainer}>
            <ThemedText type="small" style={{ fontWeight: '600' }}>
              {isDownloading ? 'Downloading' : isPaused ? 'Paused' : isFailed ? 'Failed' : 'Pending'}
            </ThemedText>
            <ThemedText type="body" style={{ fontWeight: '500' }}>
              {surahName}
            </ThemedText>
          </View>
        </View>

        <View style={styles.controls}>
          {isDownloading && onPause && (
            <Pressable onPress={onPause} style={styles.controlButton}>
              <Feather name="pause" size={18} color={isDark ? Colors.dark.text : Colors.light.text} />
            </Pressable>
          )}
          {isPaused && onResume && (
            <Pressable onPress={onResume} style={styles.controlButton}>
              <Feather name="play" size={18} color={isDark ? Colors.dark.primary : Colors.light.primary} />
            </Pressable>
          )}
          {onCancel && (
            <Pressable onPress={onCancel} style={styles.controlButton}>
              <Feather name="x" size={18} color={isDark ? '#F87171' : '#EF4444'} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={[
          styles.progressBar,
          { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB' }
        ]}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${item.progress}%`,
                backgroundColor: getStatusColor(),
              }
            ]} 
          />
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText type="caption" secondary>
          {formatBytes(item.downloadedBytes)} / {formatBytes(item.totalBytes)}
        </ThemedText>
        <ThemedText type="caption" style={{ color: getStatusColor(), fontWeight: '600' }}>
          {item.progress}%
        </ThemedText>
      </View>

      {isFailed && item.error && (
        <View style={[styles.errorBanner, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
          <ThemedText type="caption" style={{ color: '#EF4444' }}>
            {item.error}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleContainer: {
    marginLeft: Spacing.sm,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  progressContainer: {
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBanner: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
});
