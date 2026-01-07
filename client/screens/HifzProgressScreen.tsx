/**
 * HifzProgressScreen
 * Displays memorization progress, statistics, and revision schedule
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Share,
  Dimensions,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { MemorizationBadge } from '../components/hifz/MemorizationBadge';
import { useTheme } from '../hooks/useTheme';
import { useHifzProgress } from '../hooks/useHifzProgress';
import { useRevisionSchedule } from '../hooks/useRevisionSchedule';
import { hifzNotificationService } from '../services/HifzNotificationService';
import { QURAN_STATS } from '../constants/hifz';
import type { MemorizationStatus } from '../types/hifz';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HifzProgressScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isDark, theme } = useTheme();
  const {
    stats,
    isLoading: progressLoading,
    exportProgress,
    resetProgress,
  } = useHifzProgress();
  const {
    dueRevisions,
    todayRevisions,
    isLoading: revisionLoading,
    getTodayCompletedCount,
    getDailyGoal,
    refresh: refreshRevisions,
  } = useRevisionSchedule();

  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Load notification settings
  useEffect(() => {
    const loadNotificationSettings = async () => {
      await hifzNotificationService.initialize();
      const settings = hifzNotificationService.getSettings();
      setNotificationsEnabled(settings.enabled);
    };
    loadNotificationSettings();
  }, []);
  const activeColor = theme.primary;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshRevisions();
    setRefreshing(false);
  }, [refreshRevisions]);

  const handleExport = useCallback(async () => {
    try {
      const data = await exportProgress();
      await Share.share({
        message: data,
        title: 'Hifz Progress Export',
      });
    } catch (err) {
      Alert.alert('Export Failed', 'Could not export progress data');
    }
  }, [exportProgress]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all memorization progress? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetProgress();
              Alert.alert('Success', 'Progress has been reset');
            } catch (err) {
              Alert.alert('Error', 'Failed to reset progress');
            }
          },
        },
      ]
    );
  }, [resetProgress]);

  const renderProgressBar = (
    label: string,
    current: number,
    total: number,
    color: string
  ) => {
    const percentage = total > 0 ? (current / total) * 100 : 0;
    return (
      <View style={styles.progressItem}>
        <View style={styles.progressHeader}>
          <ThemedText style={styles.progressLabel}>{label}</ThemedText>
          <ThemedText style={[styles.progressCount, { color: theme.textSecondary }]}>
            {current} / {total}
          </ThemedText>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: theme.backgroundSecondary }]}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${percentage}%`, backgroundColor: color },
            ]}
          />
        </View>
        <ThemedText style={[styles.progressPercent, { color }]}>
          {percentage.toFixed(1)}%
        </ThemedText>
      </View>
    );
  };

  const renderStatCard = (
    icon: string,
    label: string,
    value: string | number,
    color: string
  ) => (
    <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
    </View>
  );

  const isLoading = progressLoading || revisionLoading;
  const dailyGoal = getDailyGoal();
  const todayCompleted = getTodayCompletedCount();

  // Memoize expensive calculations
  const progressPercentages = useMemo(() => ({
    verses: QURAN_STATS.totalVerses > 0 
      ? ((stats?.memorizedVerses || 0) / QURAN_STATS.totalVerses) * 100 
      : 0,
    pages: QURAN_STATS.totalPages > 0 
      ? ((stats?.memorizedPages || 0) / QURAN_STATS.totalPages) * 100 
      : 0,
    juz: QURAN_STATS.totalJuz > 0 
      ? ((stats?.memorizedJuz || 0) / QURAN_STATS.totalJuz) * 100 
      : 0,
  }), [stats?.memorizedVerses, stats?.memorizedPages, stats?.memorizedJuz]);

  const dailyGoalProgress = useMemo(() => 
    Math.min((todayCompleted / dailyGoal) * 100, 100),
    [todayCompleted, dailyGoal]
  );

  const displayedRevisions = useMemo(() => 
    dueRevisions.slice(0, 5),
    [dueRevisions]
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Hifz Progress</ThemedText>
        <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
          <Feather name="share" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          {renderStatCard(
            'book-open',
            'Verses Memorized',
            stats?.memorizedVerses || 0,
            theme.primary
          )}
          {renderStatCard(
            'loader',
            'In Progress',
            stats?.inProgressVerses || 0,
            '#F59E0B'
          )}
          {renderStatCard(
            'calendar',
            'Due Today',
            dueRevisions.length,
            '#EF4444'
          )}
          {renderStatCard(
            'check-circle',
            'Revised Today',
            todayCompleted,
            activeColor
          )}
        </View>

        {/* Daily Goal Progress */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Daily Goal</ThemedText>
            <ThemedText style={[styles.goalText, { color: activeColor }]}>
              {todayCompleted} / {dailyGoal}
            </ThemedText>
          </View>
          <View style={[styles.goalBarBg, { backgroundColor: theme.backgroundSecondary }]}>
            <View
              style={[
                styles.goalBarFill,
                {
                  width: `${dailyGoalProgress}%`,
                  backgroundColor: activeColor,
                },
              ]}
            />
          </View>
        </View>

        {/* Overall Progress */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <ThemedText style={styles.sectionTitle}>Overall Progress</ThemedText>
          {renderProgressBar(
            'Verses',
            stats?.memorizedVerses || 0,
            QURAN_STATS.totalVerses,
            theme.primary
          )}
          {renderProgressBar(
            'Pages',
            stats?.memorizedPages || 0,
            QURAN_STATS.totalPages,
            '#3B82F6'
          )}
          {renderProgressBar(
            'Juz',
            stats?.memorizedJuz || 0,
            QURAN_STATS.totalJuz,
            '#8B5CF6'
          )}
        </View>

        {/* Due Revisions */}
        {dueRevisions.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Due for Revision</ThemedText>
              <View style={[styles.badge, { backgroundColor: '#EF444420' }]}>
                <ThemedText style={[styles.badgeText, { color: '#EF4444' }]}>
                  {dueRevisions.length}
                </ThemedText>
              </View>
            </View>
            {displayedRevisions.map((revision, index) => (
              <View
                key={revision.verseKey}
                style={[
                  styles.revisionItem,
                  { borderBottomColor: theme.border },
                  index === displayedRevisions.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.revisionInfo}>
                  <ThemedText style={styles.revisionVerse}>
                    {revision.verseKey}
                  </ThemedText>
                  <ThemedText style={[styles.revisionDate, { color: theme.textSecondary }]}>
                    Last: {new Date(revision.lastRevision).toLocaleDateString()}
                  </ThemedText>
                </View>
                <View style={[styles.easeBadge, { backgroundColor: `${activeColor}20` }]}>
                  <ThemedText style={[styles.easeText, { color: activeColor }]}>
                    Ease: {(revision.easeFactor * 100).toFixed(0)}%
                  </ThemedText>
                </View>
              </View>
            ))}
            {dueRevisions.length > 5 && (
              <ThemedText style={[styles.moreText, { color: theme.textSecondary }]}>
                +{dueRevisions.length - 5} more verses due
              </ThemedText>
            )}
          </View>
        )}

        {/* Status Legend */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <ThemedText style={styles.sectionTitle}>Status Legend</ThemedText>
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <MemorizationBadge status="not_started" size="large" />
              <ThemedText style={styles.legendText}>Not Started</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <MemorizationBadge status="in_progress" size="large" />
              <ThemedText style={styles.legendText}>In Progress</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <MemorizationBadge status="memorized" size="large" />
              <ThemedText style={styles.legendText}>Memorized</ThemedText>
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>
          <View style={styles.notificationRow}>
            <View style={styles.notificationInfo}>
              <Feather name="bell" size={20} color={activeColor} />
              <View style={styles.notificationText}>
                <ThemedText style={styles.notificationLabel}>Daily Reminders</ThemedText>
                <ThemedText style={[styles.notificationHint, { color: theme.textSecondary }]}>
                  Get reminded to review your memorization
                </ThemedText>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={async (value) => {
                setNotificationsEnabled(value);
                await hifzNotificationService.setNotificationsEnabled(value);
                if (value && dueRevisions.length > 0) {
                  await hifzNotificationService.scheduleRevisionReminder(dueRevisions.length);
                }
              }}
              trackColor={{ false: theme.border, true: `${activeColor}50` }}
              thumbColor={notificationsEnabled ? activeColor : theme.textSecondary}
            />
          </View>
        </View>

        {/* Reset Button */}
        <TouchableOpacity
          onPress={handleReset}
          style={[styles.resetButton, { borderColor: '#EF4444' }]}
        >
          <Feather name="trash-2" size={18} color="#EF4444" />
          <ThemedText style={[styles.resetText, { color: '#EF4444' }]}>
            Reset All Progress
          </ThemedText>
        </TouchableOpacity>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  exportButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  goalText: {
    fontSize: 15,
    fontWeight: '600',
  },
  goalBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressCount: {
    fontSize: 13,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'right',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  revisionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  revisionInfo: {
    flex: 1,
  },
  revisionVerse: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  revisionDate: {
    fontSize: 13,
  },
  easeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  easeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
  legendGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  legendItem: {
    alignItems: 'center',
    gap: 8,
  },
  legendText: {
    fontSize: 13,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  notificationHint: {
    fontSize: 13,
    marginTop: 2,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
  },
  resetText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
