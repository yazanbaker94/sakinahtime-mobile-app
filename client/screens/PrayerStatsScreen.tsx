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
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { StreakCard } from '@/components/StreakCard';
import { WeeklyChart } from '@/components/WeeklyChart';
import { MonthlyCalendar } from '@/components/MonthlyCalendar';
import { useTheme } from '@/hooks/useTheme';
import { usePrayerStats, ViewMode } from '@/hooks/usePrayerStats';
import { useQadaTracker } from '@/hooks/useQadaTracker';
import { usePrayerLog } from '@/hooks/usePrayerLog';
import { PRAYER_NAMES, PrayerName, MISSED_REMINDER_DELAY_OPTIONS } from '@/types/prayerLog';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

// 3D clay badge icons
const ICON_LOGGED = require('../../assets/images/progress-tracker/logged.png');
const ICON_BELL = require('../../assets/images/progress-tracker/bell.png');
const ICON_STREAK = require('../../assets/images/progress-tracker/lightning.png');
const ICON_QADA = require('../../assets/images/progress-tracker/qada.png');

// Pastel status colors (soft, non-alarming)
const STATUS_COLORS = {
  prayed: '#6DD5A0',   // soft mint green
  missed: '#F5A5A5',   // pastel coral
  late: '#F5D28B',      // warm pastel gold
};

export default function PrayerStatsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
      Alert.alert(t('prayerStats.exportFailed'), t('prayerStats.exportError'));
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <ThemedText type="body" secondary>{t('prayerStats.loadingStats')}</ThemedText>
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
            <ThemedText type="h2" style={styles.title}>{t('prayerStats.title')}</ThemedText>
          </View>
          <Pressable onPress={handleExport} style={styles.exportButton}>
            <Feather name="share" size={20} color={theme.text} />
          </Pressable>
        </View>

        {/* Tracking Toggle */}
        <View style={[
          styles.trackingToggle,
          {
            backgroundColor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.95)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.04,
            shadowRadius: 30,
            elevation: 4,
          }
        ]}>
          <View style={styles.trackingInfo}>
            <Image source={ICON_LOGGED} style={{ width: 28, height: 28 }} resizeMode="contain" />
            <View style={styles.trackingText}>
              <ThemedText type="body" style={{ fontWeight: '600' }}>{t('prayerStats.prayerTracking')}</ThemedText>
              <ThemedText type="caption" secondary>
                {trackingEnabled ? t('prayerStats.tapToMark') : t('prayerStats.enableToTrack')}
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
            {
              backgroundColor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.95)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.04,
              shadowRadius: 30,
              elevation: 4,
            }
          ]}>
            <ThemedText type="caption" secondary style={{ marginBottom: Spacing.sm }}>{t('prayerStats.tapToMarkStatus')}</ThemedText>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.prayed }]} />
                <ThemedText type="caption">{t('prayerStats.prayed')}</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.missed }]} />
                <ThemedText type="caption">{t('prayerStats.missed')}</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.late }]} />
                <ThemedText type="caption">{t('prayerStats.late')}</ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Missed Prayer Reminder Settings */}
        {trackingEnabled && (
          <View style={[
            styles.reminderCard,
            {
              backgroundColor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.95)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.04,
              shadowRadius: 30,
              elevation: 4,
            }
          ]}>
            <View style={styles.reminderHeader}>
              <View style={styles.reminderInfo}>
                <Image source={ICON_BELL} style={{ width: 28, height: 28 }} resizeMode="contain" />
                <View style={styles.reminderText}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>{t('prayerStats.missedReminder')}</ThemedText>
                  <ThemedText type="caption" secondary>
                    {missedReminderEnabled
                      ? t('prayerStats.remindAfter', { minutes: missedReminderDelayMinutes })
                      : t('prayerStats.getReminded')}
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
                  {t('prayerStats.remindAfterLabel')}
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
            {
              backgroundColor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.95)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.04,
              shadowRadius: 30,
              elevation: 4,
            }
          ]}>
            <Image source={ICON_LOGGED} style={{ width: 32, height: 32 }} resizeMode="contain" />
            <ThemedText type="h3" style={{ color: theme.primary }}>{totalPrayersLogged}</ThemedText>
            <ThemedText type="caption" secondary>{t('prayerStats.totalLogged')}</ThemedText>
          </View>

          <Pressable
            style={[
              styles.quickStatCard,
              {
                backgroundColor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.95)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.04,
                shadowRadius: 30,
                elevation: 4,
              }
            ]}
            onPress={() => navigation.navigate('QadaTracker')}
          >
            <Image source={ICON_QADA} style={{ width: 32, height: 32 }} resizeMode="contain" />
            <ThemedText type="h3" style={{ color: theme.primary }}>{totalQada}</ThemedText>
            <ThemedText type="caption" secondary>{t('prayerStats.qadaDue')}</ThemedText>
          </Pressable>
        </View>

        {/* Streak Card */}
        <StreakCard streak={streak} />

        {/* View mode toggle */}
        <View style={[
          styles.toggleContainer,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          }
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
              {t('prayerStats.weekly')}
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
              {t('prayerStats.monthly')}
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
              backgroundColor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.95)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.04,
              shadowRadius: 30,
              elevation: 4,
            }
          ]}>
            <ThemedText type="h3" style={styles.breakdownTitle}>{t('prayerStats.prayerBreakdown')}</ThemedText>
            {PRAYER_NAMES.map((prayer) => {
              const data = monthlyStats.prayerBreakdown[prayer];
              return (
                <View key={prayer} style={styles.breakdownRow}>
                  <ThemedText type="body" style={{ flex: 1 }}>{t(`prayer.${prayer.toLowerCase()}`)}</ThemedText>
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
    </ThemedView >
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
    borderRadius: 20,
    marginBottom: Spacing.lg,
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
    borderRadius: 20,
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
    borderRadius: 20,
    marginBottom: Spacing.lg,
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
    borderRadius: 20,
    gap: Spacing.xs,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 16,
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
    borderRadius: 20,
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
