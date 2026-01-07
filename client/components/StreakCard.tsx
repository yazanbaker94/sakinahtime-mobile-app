/**
 * StreakCard Component
 * Displays current and longest prayer streak
 * Feature: prayer-log-statistics
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useTheme } from '../hooks/useTheme';
import { PrayerStreakData } from '../types/prayerLog';
import { Spacing, BorderRadius } from '../constants/theme';

interface StreakCardProps {
  streak: PrayerStreakData | null;
  compact?: boolean;
}

function getStreakMessage(currentStreak: number): string {
  if (currentStreak === 0) {
    return "Start your streak today!";
  } else if (currentStreak === 1) {
    return "Great start! Keep it going!";
  } else if (currentStreak < 7) {
    return "You're building momentum!";
  } else if (currentStreak < 30) {
    return "Amazing consistency!";
  } else if (currentStreak < 100) {
    return "Incredible dedication!";
  } else {
    return "Mashallah! Truly inspiring!";
  }
}

export function StreakCard({ streak, compact = false }: StreakCardProps) {
  const { isDark, theme } = useTheme();

  const currentStreak = streak?.currentStreak || 0;
  const longestStreak = streak?.longestStreak || 0;

  if (compact) {
    return (
      <View style={[
        styles.compactContainer,
        { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.1)' }
      ]}>
        <Feather name="zap" size={16} color="#FBBF24" />
        <ThemedText type="body" style={styles.compactText}>
          {currentStreak} day{currentStreak !== 1 ? 's' : ''}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.cardBackground,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 8,
        elevation: 3,
      }
    ]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
          <Feather name="zap" size={24} color="#FBBF24" />
        </View>
        <ThemedText type="h3" style={styles.title}>Prayer Streak</ThemedText>
      </View>

      <View style={styles.streakRow}>
        <View style={styles.streakItem}>
          <ThemedText type="h1" style={[styles.streakNumber, { color: '#FBBF24' }]}>
            {currentStreak}
          </ThemedText>
          <ThemedText type="caption" secondary>Current Streak</ThemedText>
        </View>

        <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

        <View style={styles.streakItem}>
          <ThemedText type="h1" style={[styles.streakNumber, { color: theme.primary }]}>
            {longestStreak}
          </ThemedText>
          <ThemedText type="caption" secondary>Longest Streak</ThemedText>
        </View>
      </View>

      <View style={[styles.messageContainer, { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.08)' }]}>
        <Feather name="star" size={14} color="#FBBF24" />
        <ThemedText type="small" style={styles.message}>
          {getStreakMessage(currentStreak)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  compactText: {
    fontWeight: '600',
    color: '#FBBF24',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  title: {
    fontWeight: '700',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  streakItem: {
    alignItems: 'center',
    flex: 1,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 56,
  },
  divider: {
    width: 1,
    height: 60,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  message: {
    color: '#FBBF24',
    fontWeight: '500',
  },
});

export default StreakCard;
