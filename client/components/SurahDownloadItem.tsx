/**
 * SurahDownloadItem Component
 * 
 * Individual surah row for download management.
 */

import React from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import { DownloadStatus } from '../types/offline';
import { formatBytes } from '../constants/offline';

interface SurahDownloadItemProps {
  surahNumber: number;
  surahNameEn: string;
  surahNameAr: string;
  status: DownloadStatus | 'not_downloaded';
  progress?: number;
  size?: number;
  onDownload?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onDelete?: () => void;
}

export function SurahDownloadItem({
  surahNumber,
  surahNameEn,
  surahNameAr,
  status,
  progress = 0,
  size = 0,
  onDownload,
  onPause,
  onResume,
  onDelete,
}: SurahDownloadItemProps) {
  const { isDark } = useTheme();

  const isDownloaded = status === 'completed';
  const isDownloading = status === 'downloading';
  const isPaused = status === 'paused';
  const isPending = status === 'pending';
  const isFailed = status === 'failed';

  const getStatusIcon = () => {
    if (isDownloaded) return 'check-circle';
    if (isDownloading) return 'download';
    if (isPaused) return 'pause-circle';
    if (isPending) return 'clock';
    if (isFailed) return 'alert-circle';
    return 'download-cloud';
  };

  const getStatusColor = () => {
    if (isDownloaded) return isDark ? '#34D399' : '#10B981';
    if (isDownloading) return isDark ? '#60A5FA' : '#3B82F6';
    if (isPaused) return isDark ? '#FBBF24' : '#F59E0B';
    if (isFailed) return isDark ? '#F87171' : '#EF4444';
    return isDark ? Colors.dark.textSecondary : Colors.light.textSecondary;
  };

  const handlePress = () => {
    if (isDownloaded && onDelete) {
      onDelete();
    } else if (isDownloading && onPause) {
      onPause();
    } else if (isPaused && onResume) {
      onResume();
    } else if (!isDownloaded && !isDownloading && !isPending && onDownload) {
      onDownload();
    }
  };

  const getActionIcon = () => {
    if (isDownloaded) return 'trash-2';
    if (isDownloading) return 'pause';
    if (isPaused) return 'play';
    return 'download';
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { 
          backgroundColor: isDark ? 'rgba(26, 95, 79, 0.15)' : Colors.light.backgroundDefault,
          opacity: pressed ? 0.7 : 1,
        }
      ]}
      onPress={handlePress}
    >
      <View style={styles.leftSection}>
        <View style={[
          styles.numberCircle,
          { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)' }
        ]}>
          <ThemedText type="small" style={{ fontWeight: '600' }}>
            {surahNumber}
          </ThemedText>
        </View>

        <View style={styles.nameContainer}>
          <ThemedText type="body" style={{ fontWeight: '500' }}>
            {surahNameEn}
          </ThemedText>
          <ThemedText type="arabic" secondary style={{ fontSize: 14 }}>
            {surahNameAr}
          </ThemedText>
        </View>
      </View>

      <View style={styles.rightSection}>
        {(isDownloading || isPending) && (
          <View style={styles.progressContainer}>
            {isDownloading && (
              <View style={[
                styles.progressBar,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB' }
              ]}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${progress}%`,
                      backgroundColor: getStatusColor(),
                    }
                  ]} 
                />
              </View>
            )}
            <ThemedText type="caption" style={{ color: getStatusColor() }}>
              {isDownloading ? `${progress}%` : 'Queued'}
            </ThemedText>
          </View>
        )}

        {isDownloaded && size > 0 && (
          <ThemedText type="caption" secondary style={{ marginRight: Spacing.sm }}>
            {formatBytes(size)}
          </ThemedText>
        )}

        <View style={[styles.statusIcon, { backgroundColor: `${getStatusColor()}20` }]}>
          {isDownloading ? (
            <ActivityIndicator size="small" color={getStatusColor()} />
          ) : (
            <Feather name={getStatusIcon() as any} size={18} color={getStatusColor()} />
          )}
        </View>

        {!isPending && (
          <Pressable 
            style={styles.actionButton}
            onPress={handlePress}
          >
            <Feather 
              name={getActionIcon() as any} 
              size={18} 
              color={isDownloaded ? (isDark ? '#F87171' : '#EF4444') : getStatusColor()} 
            />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  numberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  nameContainer: {
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressContainer: {
    alignItems: 'flex-end',
    marginRight: Spacing.sm,
  },
  progressBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
