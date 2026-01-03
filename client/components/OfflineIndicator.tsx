/**
 * OfflineIndicator Component
 * 
 * Banner showing offline status with last sync time.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

interface OfflineIndicatorProps {
  isOffline: boolean;
  lastSync?: Date | null;
  compact?: boolean;
}

export function OfflineIndicator({ isOffline, lastSync, compact = false }: OfflineIndicatorProps) {
  const { isDark } = useTheme();

  if (!isOffline) return null;

  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (compact) {
    return (
      <View style={[
        styles.compactContainer,
        { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(245, 158, 11, 0.15)' }
      ]}>
        <Feather name="wifi-off" size={12} color={isDark ? '#FBBF24' : '#F59E0B'} />
        <ThemedText type="caption" style={{ color: isDark ? '#FBBF24' : '#F59E0B', marginLeft: 4 }}>
          Offline
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(245, 158, 11, 0.1)' }
    ]}>
      <View style={styles.content}>
        <Feather name="wifi-off" size={16} color={isDark ? '#FBBF24' : '#F59E0B'} />
        <View style={styles.textContainer}>
          <ThemedText type="small" style={{ color: isDark ? '#FBBF24' : '#F59E0B', fontWeight: '600' }}>
            You're offline
          </ThemedText>
          <ThemedText type="caption" style={{ color: isDark ? '#FBBF24' : '#F59E0B', opacity: 0.8 }}>
            {lastSync 
              ? `Using cached data from ${formatLastSync(lastSync)}`
              : 'Using cached data'
            }
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
});
