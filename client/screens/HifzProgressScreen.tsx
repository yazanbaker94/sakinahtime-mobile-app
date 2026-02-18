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
  Image,
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
import { useTranslation } from '@/hooks/useTranslation';
import { TactileSwitch } from '@/components/TactileSwitch';
import type { MemorizationStatus } from '../types/hifz';

const ICON_CURRENT_STREAK = require('../../assets/images/3d-images/currentstreak.png');
const ICON_LONGEST_STREAK = require('../../assets/images/3d-images/longeststreak.png');
const ICON_TODAY_PROGRESS = require('../../assets/images/3d-images/todayprogress.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HifzProgressScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isDark, theme } = useTheme();
  const { t } = useTranslation();
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
        title: t('hifzProgress.title'),
      });
    } catch (err) {
      Alert.alert(t('hifzProgress.exportFailed'), t('hifzProgress.exportError'));
    }
  }, [exportProgress]);

  const handleReset = useCallback(() => {
    Alert.alert(
      t('hifzProgress.resetProgress'),
      t('hifzProgress.resetConfirm'),
      [
        { text: t('hifzProgress.cancel'), style: 'cancel' },
        {
          text: t('hifzProgress.reset'),
          style: 'destructive',
          onPress: async () => {
            try {
              await resetProgress();
              Alert.alert(t('hifzProgress.success'), t('hifzProgress.resetSuccess'));
            } catch (err) {
              Alert.alert(t('hifzProgress.error'), t('hifzProgress.resetError'));
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
        <View style={[styles.progressBarBg, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#EDEFF2',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 2,
        }]}>
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
    color: string,
    image3d?: any
  ) => (
    <View style={[styles.statCard, {
      backgroundColor: '#FFFFFF',
      borderWidth: 0,
      borderColor: 'transparent',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    }]}>
      {image3d ? (
        <Image source={image3d} style={{ width: 44, height: 44, marginBottom: 8 }} resizeMode="contain" />
      ) : (
        <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
          <Feather name={icon as any} size={20} color={color} />
        </View>
      )}
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
        <ThemedText style={styles.headerTitle}>{t('hifz.title')}</ThemedText>
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
            t('hifz.versesMemorized'),
            stats?.memorizedVerses || 0,
            theme.primary,
            ICON_TODAY_PROGRESS
          )}
          {renderStatCard(
            'loader',
            t('hifz.inProgress'),
            stats?.inProgressVerses || 0,
            '#F59E0B',
            ICON_CURRENT_STREAK
          )}
          {renderStatCard(
            'calendar',
            t('hifz.dueToday'),
            dueRevisions.length,
            '#EF4444'
          )}
          {renderStatCard(
            'check-circle',
            t('hifz.revisedToday'),
            todayCompleted,
            activeColor,
            ICON_LONGEST_STREAK
          )}
        </View>

        {/* Daily Goal Progress */}
        <View style={[styles.section, {
          backgroundColor: '#FFFFFF',
          borderWidth: 0,
          borderColor: 'transparent',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 2,
        }]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>{t('hifz.dailyGoal')}</ThemedText>
            <ThemedText style={[styles.goalText, { color: activeColor }]}>
              {todayCompleted} / {dailyGoal}
            </ThemedText>
          </View>
          <View style={[styles.goalBarBg, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#EDEFF2',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 2,
          }]}>
            <View
              style={[
                styles.goalBarFill,
                {
                  width: `${dailyGoalProgress}%`,
                  backgroundColor: activeColor,
                  borderRadius: 4,
                },
              ]}
            />
          </View>
        </View>

        {/* Overall Progress */}
        <View style={[styles.section, {
          backgroundColor: '#FFFFFF',
          borderWidth: 0,
          borderColor: 'transparent',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 2,
        }]}>
          <ThemedText style={styles.sectionTitle}>{t('hifz.overallProgress')}</ThemedText>
          {renderProgressBar(
            t('hifz.verses'),
            stats?.memorizedVerses || 0,
            QURAN_STATS.totalVerses,
            theme.primary
          )}
          {renderProgressBar(
            t('hifz.pages'),
            stats?.memorizedPages || 0,
            QURAN_STATS.totalPages,
            '#3B82F6'
          )}
          {renderProgressBar(
            t('hifz.juz'),
            stats?.memorizedJuz || 0,
            QURAN_STATS.totalJuz,
            '#8B5CF6'
          )}
        </View>

        {/* Due Revisions */}
        {dueRevisions.length > 0 && (
          <View style={[styles.section, {
            backgroundColor: '#FFFFFF',
            borderWidth: 0,
            borderColor: 'transparent',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
            elevation: 2,
          }]}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>{t('hifz.dueForRevision')}</ThemedText>
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
                    {t('hifz.last')}: {new Date(revision.lastRevision).toLocaleDateString()}
                  </ThemedText>
                </View>
                <View style={[styles.easeBadge, { backgroundColor: `${activeColor}20` }]}>
                  <ThemedText style={[styles.easeText, { color: activeColor }]}>
                    {t('hifz.ease')}: {(revision.easeFactor * 100).toFixed(0)}%
                  </ThemedText>
                </View>
              </View>
            ))}
            {dueRevisions.length > 5 && (
              <ThemedText style={[styles.moreText, { color: theme.textSecondary }]}>
                +{dueRevisions.length - 5} {t('hifz.moreVersesDue')}
              </ThemedText>
            )}
          </View>
        )}

        {/* Status Legend */}
        <View style={[styles.section, {
          backgroundColor: '#FFFFFF',
          borderWidth: 0,
          borderColor: 'transparent',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 2,
        }]}>
          <ThemedText style={styles.sectionTitle}>{t('hifz.statusLegend')}</ThemedText>
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <MemorizationBadge status="not_started" size="large" />
              <ThemedText style={styles.legendText}>{t('hifz.notStarted')}</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <MemorizationBadge status="in_progress" size="large" />
              <ThemedText style={styles.legendText}>{t('hifz.inProgress')}</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <MemorizationBadge status="memorized" size="large" />
              <ThemedText style={styles.legendText}>{t('hifz.memorized')}</ThemedText>
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={[styles.section, {
          backgroundColor: '#FFFFFF',
          borderWidth: 0,
          borderColor: 'transparent',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 2,
        }]}>
          <ThemedText style={styles.sectionTitle}>{t('hifz.notifications')}</ThemedText>
          <View style={styles.notificationRow}>
            <View style={styles.notificationInfo}>
              <Feather name="bell" size={20} color={activeColor} />
              <View style={styles.notificationText}>
                <ThemedText style={styles.notificationLabel}>{t('hifz.dailyReminders')}</ThemedText>
                <ThemedText style={[styles.notificationHint, { color: theme.textSecondary }]}>
                  {t('hifz.reminderHint')}
                </ThemedText>
              </View>
            </View>
            <TactileSwitch
              value={notificationsEnabled}
              onValueChange={async (value) => {
                setNotificationsEnabled(value);
                await hifzNotificationService.setNotificationsEnabled(value);
                if (value && dueRevisions.length > 0) {
                  await hifzNotificationService.scheduleRevisionReminder(dueRevisions.length);
                }
              }}
            />
          </View>
        </View>

        {/* Reset Button */}
        <TouchableOpacity
          onPress={handleReset}
          style={[styles.resetButton, {
            backgroundColor: '#EF4444',
            borderWidth: 0,
            borderColor: 'transparent',
            shadowColor: '#EF4444',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 5,
          }]}
        >
          <Feather name="trash-2" size={18} color="#FFFFFF" />
          <ThemedText style={[styles.resetText, { color: '#FFFFFF' }]}>
            {t('hifz.resetAllProgress')}
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
    gap: 8,
    marginTop: 8,
  },
  resetText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
