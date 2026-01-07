/**
 * MonthlyCalendar Component
 * Displays monthly prayer completion calendar
 * Feature: prayer-log-statistics
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useTheme } from '../hooks/useTheme';
import { MonthlyStats } from '../types/prayerLog';
import { Spacing, BorderRadius, Colors } from '../constants/theme';

interface MonthlyCalendarProps {
  stats: MonthlyStats | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getDayColor(prayedCount: number, isDark: boolean, theme: any): string {
  if (prayedCount === 5) return theme.primary;
  if (prayedCount >= 3) return isDark ? '#FBBF24' : '#F59E0B';
  if (prayedCount >= 1) return isDark ? '#FB923C' : '#F97316';
  return 'transparent';
}

export function MonthlyCalendar({ stats, onPrevMonth, onNextMonth }: MonthlyCalendarProps) {
  const { isDark, theme } = useTheme();

  if (!stats) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault }]}>
        <ThemedText type="body" secondary>No data available</ThemedText>
      </View>
    );
  }

  const { month, year, calendarData, completionPercentage, perfectDays } = stats;
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
  const todayDate = today.getDate();

  // Build calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Pad to complete last row
  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(null);
  }

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

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
      {/* Header with navigation */}
      <View style={styles.header}>
        <Pressable onPress={onPrevMonth} style={styles.navButton}>
          <Feather name="chevron-left" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
        </Pressable>
        <View style={styles.monthTitle}>
          <ThemedText type="h3" style={styles.monthText}>
            {MONTH_NAMES[month - 1]} {year}
          </ThemedText>
        </View>
        <Pressable onPress={onNextMonth} style={styles.navButton}>
          <Feather name="chevron-right" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
        </Pressable>
      </View>

      {/* Stats summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryBadge, { backgroundColor: `${theme.primary}26` }]}>
          <ThemedText type="small" style={{ color: theme.primary, fontWeight: '600' }}>
            {completionPercentage}% Complete
          </ThemedText>
        </View>
        <View style={[styles.summaryBadge, { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.1)' }]}>
          <ThemedText type="small" style={{ color: '#FBBF24', fontWeight: '600' }}>
            {perfectDays} Perfect Days
          </ThemedText>
        </View>
      </View>

      {/* Day headers */}
      <View style={styles.dayHeaderRow}>
        {DAY_HEADERS.map((day, index) => (
          <View key={index} style={styles.dayHeaderCell}>
            <ThemedText type="caption" secondary style={styles.dayHeaderText}>
              {day}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => {
            if (day === null) {
              return <View key={dayIndex} style={styles.dayCell} />;
            }

            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayData = calendarData[dateStr];
            const prayedCount = dayData?.prayedCount || 0;
            const dayColor = getDayColor(prayedCount, isDark, theme);
            const isToday = isCurrentMonth && day === todayDate;
            const isFuture = new Date(year, month - 1, day) > today;

            return (
              <View key={dayIndex} style={styles.dayCell}>
                <View
                  style={[
                    styles.dayCircle,
                    {
                      backgroundColor: isFuture ? 'transparent' : dayColor,
                      borderWidth: isToday ? 2 : 0,
                      borderColor: isDark ? '#fff' : '#000',
                    },
                  ]}
                >
                  <ThemedText
                    type="small"
                    style={[
                      styles.dayText,
                      prayedCount > 0 && !isFuture && { color: '#fff' },
                      isFuture && { opacity: 0.4 },
                    ]}
                  >
                    {day}
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </View>
      ))}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
          <ThemedText type="caption" secondary>5/5</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: isDark ? '#FBBF24' : '#F59E0B' }]} />
          <ThemedText type="caption" secondary>3-4</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: isDark ? '#FB923C' : '#F97316' }]} />
          <ThemedText type="caption" secondary>1-2</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]} />
          <ThemedText type="caption" secondary>0</ThemedText>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  navButton: {
    padding: Spacing.xs,
  },
  monthTitle: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  summaryBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  dayHeaderText: {
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayCircle: {
    width: '85%',
    aspectRatio: 1,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default MonthlyCalendar;
