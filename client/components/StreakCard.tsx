/**
 * StreakCard Component
 * Displays current and longest prayer streak
 * Feature: prayer-log-statistics
 */

import React from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { ThemedText } from './ThemedText';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { PrayerStreakData } from '../types/prayerLog';
import { Spacing, BorderRadius } from '../constants/theme';

const ICON_STREAK = require('../../assets/images/progress-tracker/lightning.png');

interface StreakCardProps {
  streak: PrayerStreakData | null;
  compact?: boolean;
}

function getStreakMessageKey(currentStreak: number): string {
  if (currentStreak === 0) {
    return 'streak.startToday';
  } else if (currentStreak === 1) {
    return 'streak.greatStart';
  } else if (currentStreak < 7) {
    return 'streak.buildingMomentum';
  } else if (currentStreak < 30) {
    return 'streak.amazingConsistency';
  } else if (currentStreak < 100) {
    return 'streak.incredibleDedication';
  } else {
    return 'streak.trulyInspiring';
  }
}

export function StreakCard({ streak, compact = false }: StreakCardProps) {
  const { isDark, theme } = useTheme();
  const { t } = useTranslation();

  const currentStreak = streak?.currentStreak || 0;
  const longestStreak = streak?.longestStreak || 0;

  if (compact) {
    return (
      <View style={[
        styles.compactContainer,
        { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.1)' }
      ]}>
        <Image source={ICON_STREAK} style={{ width: 18, height: 18 }} resizeMode="contain" />
        <ThemedText type="body" style={[styles.compactText, { color: theme.primary }]}>
          {currentStreak} {currentStreak !== 1 ? t('streak.days') : t('streak.day')}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.95)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.04,
        shadowRadius: 30,
        elevation: 4,
      }
    ]}>
      <View style={styles.header}>
        <Image source={ICON_STREAK} style={{ width: 36, height: 36 }} resizeMode="contain" />
        <ThemedText type="h3" style={styles.title}>{t('streak.prayerStreak')}</ThemedText>
      </View>

      <View style={styles.streakRow}>
        <View style={styles.streakItem}>
          <ThemedText type="h1" style={[styles.streakNumber, { color: theme.primary }]}>
            {currentStreak}
          </ThemedText>
          <ThemedText type="caption" secondary>{t('streak.currentStreak')}</ThemedText>
        </View>

        {/* No divider — whitespace separates */}

        <View style={styles.streakItem}>
          <ThemedText type="h1" style={[styles.streakNumber, { color: theme.primary }]}>
            {longestStreak}
          </ThemedText>
          <ThemedText type="caption" secondary>{t('streak.longestStreak')}</ThemedText>
        </View>
      </View>

      {/* Solid gold motivational button */}
      <View style={[
        styles.messageContainer,
        {
          backgroundColor: '#D4AF37',
          shadowColor: '#D4AF37',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        }
      ]}>
        <ThemedText type="small" style={styles.message}>
          ⭐ {t(getStreakMessageKey(currentStreak))}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: 20,
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    fontWeight: '700',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
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
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: 14,
    gap: Spacing.xs,
  },
  message: {
    color: '#3B2506',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default StreakCard;
