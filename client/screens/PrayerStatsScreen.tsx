/**
 * PrayerStatsScreen
 * Displays prayer statistics, streaks, and analytics
 * Feature: prayer-log-statistics
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  Alert,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { StreakCard } from '@/components/StreakCard';
import { WeeklyChart } from '@/components/WeeklyChart';
import { MonthlyCalendar } from '@/components/MonthlyCalendar';
import { QadaTrackerModal } from '@/components/QadaTrackerModal';
import { useTheme } from '@/hooks/useTheme';
import { usePrayerStats, ViewMode } from '@/hooks/usePrayerStats';
import { useQadaTracker } from '@/hooks/useQadaTracker';
import { usePrayerLog } from '@/hooks/usePrayerLog';
import { PRAYER_NAMES, PrayerName, MISSED_REMINDER_DELAY_OPTIONS } from '@/types/prayerLog';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function PrayerStatsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useTheme();
  const navigation = useNavigation();
  const {
    streak,
    weeklyStats,
    monthlyStats,
    viewMode,
    setViewMode,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    loading,
    totalPrayersLogged,
    refresh: refreshStats,
  } = usePrayerStats();
  const { totalQada, refresh: refreshQada } = useQadaTracker();
  const { 
    trackingEnabled, 
    toggleTracking, 
    missedReminderEnabled,
    missedReminderDelayMinutes,
    toggleMissedReminder,
    setMissedReminderDelay,
    refresh: refreshPrayerLog 
  } = usePrayerLog();
  const [qadaModalVisible, setQadaModalVisible] = useState(false);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshStats();
      refreshQada();
      refreshPrayerLog();
    }, [refreshStats, refreshQada, refreshPrayerLog])
  );

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const now = new Date();
    const isCurrentMonth = selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();
    if (isCurrentMonth) return;

    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleExport = async () => {
    try {
      // Create a human-readable summary
      const currentStreak = streak?.currentStreak || 0;
      const longestStreak = streak?.longestStreak || 0;
      const weeklyCompletion = weeklyStats?.completionPercentage || 0;
      const weeklyPrayed = weeklyStats?.totalPrayed || 0;
      const monthlyCompletion = monthlyStats?.completionPercentage || 0;
      const monthlyPerfectDays = monthlyStats?.perfectDays || 0;

      const summary = `🕌 My Prayer Statistics

📊 Streaks
• Current Streak: ${currentStreak} day${currentStreak !== 1 ? 's' : ''}
• Longest Streak: ${longestStreak} day${longestStreak !== 1 ? 's' : ''}

📅 This Week
• Completion: ${weeklyCompletion}%
• Prayers Completed: ${weeklyPrayed}/35

📆 This Month
• Completion: ${monthlyCompletion}%
• Perfect Days: ${monthlyPerfectDays}

🤲 Total Prayers Logged: ${totalPrayersLogged}
📿 Qada Remaining: ${totalQada}

Tracked with SakinahTime 🌙`;

      await Share.share({
        message: summary,
        title: 'My Prayer Statistics',
      });
    } catch (error) {
      Alert.alert('Export Failed', 'Could not share prayer statistics.');
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <ThemedText type="body" secondary>Loading statistics...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h2" style={styles.title}>Prayer Statistics</ThemedText>
          </View>
          <Pressable onPress={handleExport} style={styles.exportButton}>
            <Feather name="share" size={20} color={theme.text} />
          </Pressable>
        </View>

        {/* Tracking Toggle */}
        <View style={[
          styles.trackingToggle,
          { backgroundColor: theme.cardBackground }
        ]}>
          <View style={styles.trackingInfo}>
            <Feather name="check-square" size={20} color={theme.primary} />
            <View style={styles.trackingText}>
              <ThemedText type="body" style={{ fontWeight: '600' }}>Prayer Tracking</ThemedText>
              <ThemedText type="caption" secondary>
                {trackingEnabled ? 'Tap prayers to mark as prayed' : 'Enable to track your prayers'}
              </ThemedText>
            </View>
          </View>
          <Switch
            value={trackingEnabled}
            onValueChange={toggleTracking}
            trackColor={{
              false: theme.backgroundTertiary,
              true: theme.primary,
            }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Status Legend */}
        {trackingEnabled && (
          <View style={[
            styles.legendCard,
            { backgroundColor: theme.cardBackground }
          ]}>
            <ThemedText type="caption" secondary style={{ marginBottom: Spacing.sm }}>Tap to cycle through:</ThemedText>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#6B7280' }]} />
                <ThemedText type="caption">Not marked</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
                <ThemedText type="caption">Prayed</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <ThemedText type="caption">Missed</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <ThemedText type="caption">Late</ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Missed Prayer Reminder Settings */}
        {trackingEnabled && (
          <View style={[
            styles.reminderCard,
            { backgroundColor: theme.cardBackground }
          ]}>
            <View style={styles.reminderHeader}>
              <View style={styles.reminderInfo}>
                <Feather name="bell" size={20} color={theme.primary} />
                <View style={styles.reminderText}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>Missed Prayer Reminder</ThemedText>
                  <ThemedText type="caption" secondary>
                    {missedReminderEnabled 
                      ? `Remind after ${missedReminderDelayMinutes} min if unmarked` 
                      : 'Get reminded to mark your prayers'}
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={missedReminderEnabled}
                onValueChange={toggleMissedReminder}
                trackColor={{
                  false: theme.backgroundTertiary,
                  true: theme.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            {/* Delay Options */}
            {missedReminderEnabled && (
              <View style={styles.delayOptions}>
                <ThemedText type="caption" secondary style={{ marginBottom: Spacing.sm }}>
                  Remind me after:
                </ThemedText>
                <View style={styles.delayButtonsRow}>
                  {MISSED_REMINDER_DELAY_OPTIONS.map((minutes) => (
                    <Pressable
                      key={minutes}
                      style={[
                        styles.delayButton,
                        {
                          backgroundColor: missedReminderDelayMinutes === minutes
                            ? theme.primary
                            : theme.backgroundTertiary,
                        },
                      ]}
                      onPress={() => setMissedReminderDelay(minutes)}
                    >
                      <ThemedText
                        type="caption"
                        style={{
                          fontWeight: '600',
                          color: missedReminderDelayMinutes === minutes ? '#FFFFFF' : undefined,
                        }}
                      >
                        {minutes} min
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Quick stats row */}
        <View style={styles.quickStatsRow}>
          <View style={[
            styles.quickStatCard,
            { backgroundColor: theme.cardBackground }
          ]}>
            <Feather name="check-circle" size={20} color={theme.primary} />
            <ThemedText type="h3" style={{ color: theme.primary }}>{totalPrayersLogged}</ThemedText>
            <ThemedText type="caption" secondary>Total Logged</ThemedText>
          </View>

          <Pressable
            style={[
              styles.quickStatCard,
              { backgroundColor: theme.cardBackground }
            ]}
            onPress={() => setQadaModalVisible(true)}
          >
            <Feather name="rotate-ccw" size={20} color="#EF4444" />
            <ThemedText type="h3" style={{ color: '#EF4444' }}>{totalQada}</ThemedText>
            <ThemedText type="caption" secondary>Qada Due</ThemedText>
          </Pressable>
        </View>

        {/* Streak Card */}
        <StreakCard streak={streak} />

        {/* View mode toggle */}
        <View style={[
          styles.toggleContainer,
          { backgroundColor: theme.backgroundSecondary }
        ]}>
          <Pressable
            style={[
              styles.toggleButton,
              viewMode === 'weekly' && {
                backgroundColor: theme.primary,
              },
            ]}
            onPress={() => setViewMode('weekly')}
          >
            <ThemedText
              type="body"
              style={[
                styles.toggleText,
                viewMode === 'weekly' && { color: '#fff' },
              ]}
            >
              Weekly
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.toggleButton,
              viewMode === 'monthly' && {
                backgroundColor: theme.primary,
              },
            ]}
            onPress={() => setViewMode('monthly')}
          >
            <ThemedText
              type="body"
              style={[
                styles.toggleText,
                viewMode === 'monthly' && { color: '#fff' },
              ]}
            >
              Monthly
            </ThemedText>
          </Pressable>
        </View>

        {/* Chart/Calendar */}
        {viewMode === 'weekly' ? (
          <WeeklyChart stats={weeklyStats} />
        ) : (
          <MonthlyCalendar
            stats={monthlyStats}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />
        )}

        {/* Prayer breakdown (monthly view) */}
        {viewMode === 'monthly' && monthlyStats && (
          <View style={[
            styles.breakdownCard,
            {
              backgroundColor: theme.cardBackground,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 3,
            }
          ]}>
            <ThemedText type="h3" style={styles.breakdownTitle}>Prayer Breakdown</ThemedText>
            {PRAYER_NAMES.map((prayer) => {
              const data = monthlyStats.prayerBreakdown[prayer];
              return (
                <View key={prayer} style={styles.breakdownRow}>
                  <ThemedText type="body" style={{ flex: 1 }}>{prayer}</ThemedText>
                  <View style={styles.breakdownBar}>
                    <View
                      style={[
                        styles.breakdownFill,
                        {
                          width: `${data.percentage}%`,
                          backgroundColor: theme.primary,
                        },
                      ]}
                    />
                  </View>
                  <ThemedText type="body" style={{ width: 45, textAlign: 'right' }}>
                    {data.percentage}%
                  </ThemedText>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Qada Modal */}
      <QadaTrackerModal
        visible={qadaModalVisible}
        onClose={() => setQadaModalVisible(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  title: {
    fontWeight: '700',
  },
  exportButton: {
    padding: Spacing.sm,
  },
  trackingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  trackingText: {
    flex: 1,
  },
  legendCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
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
  reminderCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  reminderText: {
    flex: 1,
  },
  delayOptions: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  delayButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  delayButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  quickStatCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  toggleText: {
    fontWeight: '600',
  },
  breakdownCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  breakdownTitle: {
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  breakdownBar: {
    flex: 2,
    height: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    borderRadius: 4,
  },
});
