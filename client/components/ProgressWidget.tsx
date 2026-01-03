/**
 * ProgressWidget Component
 * A compact widget showing key reading progress stats
 * Feature: quran-progress-tracker (Task 13.2)
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '@/constants/theme';

interface ProgressWidgetProps {
  currentStreak: number;
  todayPages: number;
  completionPercentage: number;
  dailyGoal?: number;
  onPress?: () => void;
}

export function ProgressWidget({
  currentStreak,
  todayPages,
  completionPercentage,
  dailyGoal,
  onPress,
}: ProgressWidgetProps) {
  const { theme, isDark } = useTheme();
  
  const goalProgress = dailyGoal ? Math.min(100, (todayPages / dailyGoal) * 100) : 0;
  const isGoalMet = dailyGoal ? todayPages >= dailyGoal : false;

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        },
      ]}
      onPress={onPress}
    >
      {/* Streak */}
      <View style={styles.statItem}>
        <View style={styles.iconContainer}>
          <Feather
            name="zap"
            size={16}
            color={currentStreak > 0 ? '#FF9500' : theme.textSecondary}
          />
        </View>
        <ThemedText style={styles.statValue}>{currentStreak}</ThemedText>
        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
          Streak
        </ThemedText>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {/* Today's Pages */}
      <View style={styles.statItem}>
        <View style={styles.iconContainer}>
          <Feather
            name="book-open"
            size={16}
            color={isGoalMet ? '#34C759' : theme.textSecondary}
          />
        </View>
        <ThemedText style={styles.statValue}>
          {todayPages}
          {dailyGoal ? `/${dailyGoal}` : ''}
        </ThemedText>
        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
          Today
        </ThemedText>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {/* Completion */}
      <View style={styles.statItem}>
        <View style={styles.progressRing}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: '#10B981',
                width: `${Math.min(100, completionPercentage)}%`,
              },
            ]}
          />
        </View>
        <ThemedText style={styles.statValue}>
          {completionPercentage.toFixed(1)}%
        </ThemedText>
        <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
          Complete
        </ThemedText>
      </View>

      {/* Arrow indicator */}
      {onPress && (
        <View style={styles.arrowContainer}>
          <Feather name="chevron-right" size={16} color={theme.textSecondary} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 32,
    marginHorizontal: Spacing.xs,
  },
  progressRing: {
    width: 24,
    height: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  arrowContainer: {
    marginLeft: Spacing.xs,
  },
});

export default ProgressWidget;
