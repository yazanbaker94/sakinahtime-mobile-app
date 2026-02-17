/**
 * WeeklyChart Component
 * Displays 7-day prayer completion bar chart with glass tube design
 * Feature: prayer-log-statistics
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { useTheme } from '../hooks/useTheme';
import { WeeklyStats } from '../types/prayerLog';
import { Spacing, BorderRadius } from '../constants/theme';
import { useTranslation } from '../hooks/useTranslation';

// Pastel status colors (matching PrayerStatsScreen)
const STATUS_COLORS = {
  prayed: '#6DD5A0',
  missed: '#F5A5A5',
  late: '#F5D28B',
};

interface WeeklyChartProps {
  stats: WeeklyStats | null;
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function getDayKey(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return DAY_KEYS[date.getDay()];
}

export function WeeklyChart({ stats }: WeeklyChartProps) {
  const { isDark, theme } = useTheme();
  const { t } = useTranslation();

  if (!stats) {
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
        <ThemedText type="body" secondary>{t('weeklyChart.noData')}</ThemedText>
      </View>
    );
  }

  const maxHeight = 100;
  const todayIndex = new Date().getDay();

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
        <ThemedText type="h3" style={styles.title}>{t('weeklyChart.title')}</ThemedText>
        <View style={[styles.percentageBadge, { backgroundColor: `${theme.primary}20` }]}>
          <ThemedText type="body" style={{ color: theme.primary, fontWeight: '700' }}>
            {stats.completionPercentage}%
          </ThemedText>
        </View>
      </View>

      {/* Glass Tube Bar Chart */}
      <View style={styles.chartContainer}>
        {stats.dailyBreakdown.map((day, index) => {
          const dayOfWeek = new Date(day.date + 'T00:00:00').getDay();
          const isToday = dayOfWeek === todayIndex;
          const fillHeight = (day.prayedCount / 5) * maxHeight;
          const fillColor = day.prayedCount === 5
            ? theme.primary
            : day.prayedCount >= 3
              ? STATUS_COLORS.late
              : day.prayedCount >= 1
                ? STATUS_COLORS.missed
                : 'transparent';

          return (
            <View key={day.date} style={styles.barColumn}>
              {/* Glass tube track */}
              <View style={[
                styles.barTrack,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                }
              ]}>
                {/* Filled portion from bottom */}
                {fillHeight > 0 && (
                  <View style={[
                    styles.barFill,
                    {
                      height: fillHeight,
                      backgroundColor: fillColor,
                    }
                  ]} />
                )}
              </View>
              {/* Day label — today is bold + theme color, no underline */}
              <ThemedText
                type="caption"
                style={[
                  styles.dayLabel,
                  isToday && { fontWeight: '700', color: theme.primary },
                ]}
                secondary={!isToday}
              >
                {t(`weeklyChart.${getDayKey(day.date)}`)}
              </ThemedText>
              <ThemedText type="caption" secondary style={styles.countLabel}>
                {day.prayedCount}/5
              </ThemedText>
            </View>
          );
        })}
      </View>

      {/* Stats row — no border separator */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: STATUS_COLORS.prayed }}>
            {stats.totalPrayed}
          </ThemedText>
          <ThemedText type="caption" secondary>{t('weeklyChart.prayed')}</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: STATUS_COLORS.missed }}>
            {stats.totalMissed}
          </ThemedText>
          <ThemedText type="caption" secondary>{t('weeklyChart.missed')}</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: STATUS_COLORS.late }}>
            {stats.totalLate}
          </ThemedText>
          <ThemedText type="caption" secondary>{t('weeklyChart.late')}</ThemedText>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontWeight: '700',
  },
  percentageBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 14,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'stretch',
    marginBottom: Spacing.lg,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  // Glass tube background track
  barTrack: {
    width: 28,
    height: 100,
    borderRadius: 14,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  // Filled portion inside the tube
  barFill: {
    width: '100%',
    borderRadius: 14,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  countLabel: {
    fontSize: 10,
  },
  // No border separator
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
});

export default WeeklyChart;
