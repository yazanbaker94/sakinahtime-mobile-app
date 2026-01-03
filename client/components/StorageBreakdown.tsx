/**
 * StorageBreakdown Component
 * 
 * Shows storage breakdown by category with visual bars.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import { StorageInfo, StorageCategory } from '../types/offline';
import { formatBytes } from '../constants/offline';

interface StorageBreakdownProps {
  storageInfo: StorageInfo;
  onCategoryPress?: (category: StorageCategory) => void;
}

interface CategoryItem {
  key: StorageCategory;
  label: string;
  icon: string;
  size: number;
  color: string;
}

export function StorageBreakdown({ storageInfo, onCategoryPress }: StorageBreakdownProps) {
  const { isDark } = useTheme();

  const categories: CategoryItem[] = [
    {
      key: 'audio',
      label: 'Quran Audio',
      icon: 'headphones',
      size: storageInfo.audioSize,
      color: isDark ? '#60A5FA' : '#3B82F6',
    },
    {
      key: 'tafsir',
      label: 'Tafsir',
      icon: 'book-open',
      size: storageInfo.tafsirSize,
      color: isDark ? '#A78BFA' : '#8B5CF6',
    },
    {
      key: 'prayer',
      label: 'Prayer Times',
      icon: 'clock',
      size: storageInfo.prayerCacheSize,
      color: isDark ? '#34D399' : '#10B981',
    },
    {
      key: 'cache',
      label: 'Other Cache',
      icon: 'archive',
      size: storageInfo.otherCacheSize,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
  ];

  const maxSize = Math.max(...categories.map(c => c.size), 1);

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? 'rgba(26, 95, 79, 0.2)' : Colors.light.backgroundDefault }
    ]}>
      <ThemedText type="body" style={styles.title}>
        Storage Breakdown
      </ThemedText>

      {categories.map((category) => {
        const barWidth = maxSize > 0 ? (category.size / maxSize) * 100 : 0;

        return (
          <Pressable
            key={category.key}
            style={({ pressed }) => [
              styles.categoryRow,
              { opacity: pressed && onCategoryPress ? 0.7 : 1 }
            ]}
            onPress={() => onCategoryPress?.(category.key)}
            disabled={!onCategoryPress}
          >
            <View style={styles.categoryLeft}>
              <View style={[styles.iconCircle, { backgroundColor: `${category.color}20` }]}>
                <Feather name={category.icon as any} size={16} color={category.color} />
              </View>
              <View style={styles.categoryInfo}>
                <ThemedText type="small" style={{ fontWeight: '500' }}>
                  {category.label}
                </ThemedText>
                <ThemedText type="caption" secondary>
                  {formatBytes(category.size)}
                </ThemedText>
              </View>
            </View>

            <View style={styles.barContainer}>
              <View style={[
                styles.bar,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB' }
              ]}>
                <View 
                  style={[
                    styles.barFill,
                    { 
                      width: `${barWidth}%`,
                      backgroundColor: category.color,
                    }
                  ]} 
                />
              </View>
            </View>

            {onCategoryPress && (
              <Feather 
                name="chevron-right" 
                size={16} 
                color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} 
              />
            )}
          </Pressable>
        );
      })}
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
  title: {
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  categoryInfo: {
    flex: 1,
  },
  barContainer: {
    width: 80,
    marginRight: Spacing.sm,
  },
  bar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
