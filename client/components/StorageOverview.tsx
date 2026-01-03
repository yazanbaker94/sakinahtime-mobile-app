/**
 * StorageOverview Component
 * 
 * Displays total storage usage with a visual progress bar.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import { StorageInfo } from '../types/offline';
import { formatBytes, STORAGE_LIMITS } from '../constants/offline';

interface StorageOverviewProps {
  storageInfo: StorageInfo;
  onManagePress?: () => void;
}

export function StorageOverview({ storageInfo, onManagePress }: StorageOverviewProps) {
  const { isDark } = useTheme();

  const usagePercent = (storageInfo.totalUsed / storageInfo.storageLimit) * 100;
  const isWarning = usagePercent >= STORAGE_LIMITS.WARNING_THRESHOLD * 100;
  const isCritical = usagePercent >= STORAGE_LIMITS.CRITICAL_THRESHOLD * 100;

  const getBarColor = () => {
    if (isCritical) return isDark ? '#F87171' : '#EF4444';
    if (isWarning) return isDark ? '#FBBF24' : '#F59E0B';
    return isDark ? '#34D399' : '#10B981';
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? 'rgba(26, 95, 79, 0.2)' : Colors.light.backgroundDefault }
    ]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[
            styles.iconCircle,
            { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)' }
          ]}>
            <Feather 
              name="hard-drive" 
              size={20} 
              color={isDark ? Colors.dark.primary : Colors.light.primary} 
            />
          </View>
          <View>
            <ThemedText type="body" style={{ fontWeight: '600' }}>
              Storage Used
            </ThemedText>
            <ThemedText type="caption" secondary>
              {formatBytes(storageInfo.totalUsed)} of {formatBytes(storageInfo.storageLimit)}
            </ThemedText>
          </View>
        </View>
        {onManagePress && (
          <Pressable onPress={onManagePress} style={styles.manageButton}>
            <ThemedText type="small" style={{ color: isDark ? Colors.dark.primary : Colors.light.primary }}>
              Manage
            </ThemedText>
            <Feather 
              name="chevron-right" 
              size={16} 
              color={isDark ? Colors.dark.primary : Colors.light.primary} 
            />
          </Pressable>
        )}
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
                width: `${Math.min(usagePercent, 100)}%`,
                backgroundColor: getBarColor(),
              }
            ]} 
          />
        </View>
        <ThemedText type="caption" style={[
          styles.percentText,
          { color: getBarColor() }
        ]}>
          {Math.round(usagePercent)}%
        </ThemedText>
      </View>

      {isCritical && (
        <View style={[styles.warningBanner, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
          <Feather name="alert-triangle" size={14} color="#EF4444" />
          <ThemedText type="caption" style={{ color: '#EF4444', marginLeft: 6 }}>
            Storage almost full. Clear some data to continue downloading.
          </ThemedText>
        </View>
      )}

      <View style={styles.deviceInfo}>
        <Feather 
          name="smartphone" 
          size={12} 
          color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} 
        />
        <ThemedText type="caption" secondary style={{ marginLeft: 4 }}>
          {formatBytes(storageInfo.deviceAvailable)} available on device
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
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
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentText: {
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
