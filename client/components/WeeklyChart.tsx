/**
 * WeeklyChart Component
 * Displays 7-day prayer completion bar chart
 * Feature: prayer-log-statistics
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { useTheme } from '../hooks/useTheme';
import { WeeklyStats } from '../types/prayerLog';
import { Spacing, BorderRadius, Colors } from '../constants/theme';

interface WeeklyChartProps {
  stats: WeeklyStats | null;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDayName(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return DAY_NAMES[date.getDay()];
}

function getBarColor(prayedCount: number, isDark: boolean): string {
  if (prayedCount === 5) return isDark ? '#34D399' : '#10B981';
  if (prayedCount >= 3) return isDark ? '#FBBF24' : '#F59E0B';
  if (prayedCount >= 1) return isDark ? '#FB923C' : '#F97316';
  return isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
}

export function WeeklyChart({ stats }: WeeklyChartProps) {
  const { isDark } = useTheme();

  if (!stats) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault }]}>
        <ThemedText type="body" secondary>No data available</ThemedText>
      </View>
    );
  }

  const maxHeight = 100;

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 8,
        elevation: 3,
      }
    ]}>
      <View style={styles.header}>
        <ThemedText type="h3" style={styles.title}>This Week</ThemedText>
        <View style={[styles.percentageBadge, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)' }]}>
          <ThemedText type="body" style={{ color: isDark ? '#34D399' : '#10B981', fontWeight: '700' }}>
            {stats.completionPercentage}%
          </ThemedText>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {stats.dailyBreakdown.map((day, index) => {
          const barHeight = (day.prayedCount / 5) * maxHeight;
          const barColor = getBarColor(day.prayedCount, isDark);
          const isToday = index === stats.dailyBreakdown.length - 1;

          return (
            <View key={day.date} style={styles.barColumn}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(barHeight, 4),
                      backgroundColor: barColor,
                      borderWidth: isToday ? 2 : 0,
                      borderColor: isDark ? '#fff' : '#000',
                    },
                  ]}
                />
              </View>
              <ThemedText
                type="caption"
                style={[styles.dayLabel, isToday && styles.todayLabel]}
                secondary={!isToday}
              >
                {getDayName(day.date)}
              </ThemedText>
              <ThemedText type="caption" secondary style={styles.countLabel}>
                {day.prayedCount}/5
              </ThemedText>
            </View>
          );
        })}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: isDark ? '#34D399' : '#10B981' }}>
            {stats.totalPrayed}
          </ThemedText>
          <ThemedText type="caption" secondary>Prayed</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: '#EF4444' }}>
            {stats.totalMissed}
          </ThemedText>
          <ThemedText type="caption" secondary>Missed</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: '#F59E0B' }}>
            {stats.totalLate}
          </ThemedText>
          <ThemedText type="caption" secondary>Late</ThemedText>
        </View>
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
    borderRadius: BorderRadius.lg,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    marginBottom: Spacing.lg,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    height: 100,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  bar: {
    width: '60%',
    borderRadius: BorderRadius.sm,
    minHeight: 4,
  },
  dayLabel: {
    marginTop: Spacing.xs,
    fontSize: 11,
    fontWeight: '500',
  },
  todayLabel: {
    fontWeight: '700',
  },
  countLabel: {
    fontSize: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  statItem: {
    alignItems: 'center',
  },
});

export default WeeklyChart;
