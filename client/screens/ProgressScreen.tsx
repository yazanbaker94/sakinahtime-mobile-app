/**
 * Progress Screen
 * Displays Quran reading progress, statistics, and goal settings
 * Feature: quran-progress-tracker
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useProgressTracker } from '@/hooks/useProgressTracker';
import { useReadingReminder } from '@/hooks/useReadingReminder';
import { ProgressCalculator } from '@/services/ProgressCalculator';
import { DailyGoal } from '@/types/progress';
import { QURAN_CONSTANTS } from '@/constants/quran-constants';
import { useTranslation } from '@/hooks/useTranslation';
import { TactileSwitch } from '@/components/TactileSwitch';

const ICON_CURRENT_STREAK = require('../../assets/images/3d-images/currentstreak.webp');
const ICON_LONGEST_STREAK = require('../../assets/images/3d-images/longeststreak.webp');
const ICON_TODAY_PROGRESS = require('../../assets/images/3d-images/todayprogress.webp');

const DUSTY_ROSE = '#C88E8D';
const DUSTY_ROSE_SHADOW = '#C88E8D';

export default function ProgressScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {
    progress,
    loading,
    stats,
    todayProgress,
    isGoalMet,
    setDailyGoal,
    resetProgress,
  } = useProgressTracker();
  const {
    reminderEnabled,
    reminderTime,
    permissionGranted,
    setReminderEnabled,
    setReminderTime,
    requestPermission,
  } = useReadingReminder();

  const [showTimePicker, setShowTimePicker] = useState(false); const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [goalType, setGoalType] = useState<'pages' | 'verses'>(
    progress?.dailyGoal.type || 'pages'
  );
  const [goalTarget, setGoalTarget] = useState(
    String(progress?.dailyGoal.target || 5)
  );
  const [goalEnabled, setGoalEnabled] = useState(
    progress?.dailyGoal.enabled ?? true
  );

  const weeklyData = progress ? ProgressCalculator.getWeeklyData(progress) : null;
  const juzCompletion = progress ? ProgressCalculator.getJuzCompletion(progress) : [];

  const handleSaveGoal = async () => {
    const target = parseInt(goalTarget, 10);
    if (isNaN(target)) {
      Alert.alert(t('progress.invalidGoal'), t('progress.invalidGoalMessage'));
      return;
    }

    const minTarget = goalType === 'pages' ? QURAN_CONSTANTS.MIN_PAGE_GOAL : QURAN_CONSTANTS.MIN_VERSE_GOAL;
    const maxTarget = goalType === 'pages' ? QURAN_CONSTANTS.MAX_PAGE_GOAL : QURAN_CONSTANTS.MAX_VERSE_GOAL;

    if (target < minTarget || target > maxTarget) {
      Alert.alert(
        t('progress.invalidGoal'),
        `${goalType === 'pages' ? t('progress.pages') : t('progress.verses')} ${t('progress.goalRange')} ${minTarget} ${t('progress.and')} ${maxTarget}`
      );
      return;
    }

    try {
      const goal: DailyGoal = {
        type: goalType,
        target,
        enabled: goalEnabled,
      };
      await setDailyGoal(goal);
      setShowGoalSettings(false);
    } catch (error) {
      Alert.alert(t('common.error'), t('progress.errorSavingGoal'));
    }
  };

  const handleResetProgress = () => {
    Alert.alert(
      t('progress.resetAllProgress'),
      t('progress.resetConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('progress.resetButton'),
          style: 'destructive',
          onPress: async () => {
            try {
              await resetProgress();
            } catch (error) {
              Alert.alert(t('common.error'), t('progress.errorResetting'));
            }
          },
        },
      ]
    );
  };

  const handleReminderToggle = async (enabled: boolean) => {
    if (enabled && !permissionGranted) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          t('progress.permissionRequired'),
          t('progress.permissionMessage')
        );
        return;
      }
    }
    await setReminderEnabled(enabled);
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ThemedText>{t('progress.loadingProgress')}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={isDark ? '#fff' : '#000'} />
        </Pressable>
        <ThemedText type="h2" style={styles.headerTitle}>
          {t('progress.readingProgress')}
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall Progress Card */}
        <View style={[styles.card, {
          backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
          borderWidth: 0,
          borderColor: 'transparent',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 2,
        }]}>
          <ThemedText type="h3" style={styles.cardTitle}>
            {t('progress.overallProgress')}
          </ThemedText>

          {/* Circular Progress */}
          <View style={styles.progressCircleContainer}>
            <View style={[styles.progressCircle, { borderColor: DUSTY_ROSE }]}>
              <ThemedText type="h2" style={styles.progressPercentage}>
                {stats?.completionPercentage.toFixed(1)}%
              </ThemedText>
              <ThemedText type="caption">{t('progress.complete')}</ThemedText>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText type="h2">{stats?.totalPagesRead || 0}</ThemedText>
              <ThemedText type="caption">{t('progress.pagesRead')}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText type="h2">{stats?.juzCompleted || 0}/30</ThemedText>
              <ThemedText type="caption">{t('progress.juzComplete')}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText type="h2">{stats?.khatmCount || 0}</ThemedText>
              <ThemedText type="caption">{t('progress.khatm')}</ThemedText>
            </View>
          </View>
        </View>

        {/* Today's Progress Card */}
        <View style={[styles.card, {
          backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
          borderWidth: 0,
          borderColor: 'transparent',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 2,
        }]}>
          <ThemedText type="h3" style={styles.cardTitle}>
            {t('progress.todaysProgress')}
          </ThemedText>

          <View style={styles.todayStats}>
            <View style={styles.todayStatItem}>
              <Image source={ICON_TODAY_PROGRESS} style={{ width: 32, height: 32 }} contentFit="contain" transition={0} cachePolicy="memory" />
              <ThemedText type="body" style={styles.todayStatText}>
                {progress?.dailyGoal.type === 'verses'
                  ? `${todayProgress?.versesRead || 0} ${t('progress.versesRead')}`
                  : `${todayProgress?.pagesRead || 0} ${(todayProgress?.pagesRead || 0) === 1 ? t('progress.pageRead') : t('progress.pagesReadToday')}`}
              </ThemedText>
            </View>

            {progress?.dailyGoal.enabled && (
              <View style={[styles.goalProgressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#EDEFF2' }]}>
                <View
                  style={[
                    styles.goalProgressFill,
                    {
                      width: `${Math.min(100, todayProgress?.goalProgress || 0)}%`,
                      backgroundColor: isGoalMet ? DUSTY_ROSE : theme.gold,
                    }
                  ]}
                />
              </View>
            )}

            {progress?.dailyGoal.enabled && (
              <ThemedText type="caption">
                {progress.dailyGoal.type === 'verses'
                  ? `${todayProgress?.versesRead || 0}/${progress.dailyGoal.target} ${t('progress.verses').toLowerCase()}`
                  : `${todayProgress?.pagesRead || 0}/${progress.dailyGoal.target} ${t('progress.pages').toLowerCase()}`}
              </ThemedText>
            )}

            <ThemedText type="caption" style={{ opacity: 0.7 }}>
              {progress?.dailyGoal.enabled
                ? `${t('progress.goal')}: ${progress.dailyGoal.target} ${progress.dailyGoal.type === 'pages' ? t('progress.pages').toLowerCase() : t('progress.verses').toLowerCase()}/${t('prayer.day').toLowerCase()}`
                : t('progress.noGoalSet')}
            </ThemedText>
          </View>
        </View>

        {/* Streak Card */}
        <View style={[styles.card, {
          backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
          borderWidth: 0,
          borderColor: 'transparent',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 2,
        }]}>
          <ThemedText type="h3" style={styles.cardTitle}>
            {t('progress.readingStreak')}
          </ThemedText>

          <View style={styles.streakContainer}>
            <View style={styles.streakItem}>
              <View style={{
                shadowColor: '#F59E0B',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.4,
                shadowRadius: 6,
                elevation: 4,
              }}>
                <Image source={ICON_CURRENT_STREAK} style={{ width: 48, height: 48 }} contentFit="contain" transition={0} cachePolicy="memory" />
              </View>
              <ThemedText type="h2">{stats?.currentStreak || 0}</ThemedText>
              <ThemedText type="caption">{t('progress.currentStreak')}</ThemedText>
            </View>
            <View style={styles.streakItem}>
              <View style={{
                shadowColor: '#8B5CF6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.4,
                shadowRadius: 6,
                elevation: 4,
              }}>
                <Image source={ICON_LONGEST_STREAK} style={{ width: 48, height: 48 }} contentFit="contain" transition={0} cachePolicy="memory" />
              </View>
              <ThemedText type="h2">{stats?.longestStreak || 0}</ThemedText>
              <ThemedText type="caption">{t('progress.longestStreak')}</ThemedText>
            </View>
          </View>
        </View>

        {/* Weekly Chart */}
        {weeklyData && (
          <View style={[styles.card, {
            backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
            borderWidth: 0,
            borderColor: 'transparent',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
            elevation: 2,
          }]}>
            <ThemedText type="h3" style={styles.cardTitle}>
              {t('progress.thisWeek')}
            </ThemedText>

            <View style={styles.weeklyChart}>
              {weeklyData.days.map((day, index) => (
                <View key={day.date} style={styles.dayColumn}>
                  <View
                    style={[
                      styles.dayBar,
                      {
                        height: Math.min(60, Math.max(4, (day.pagesRead / 20) * 60)),
                        backgroundColor: day.goalMet ? DUSTY_ROSE : theme.gold,
                      }
                    ]}
                  />
                  <ThemedText type="caption" style={styles.dayLabel}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(day.date).getDay()]}
                  </ThemedText>
                </View>
              ))}
            </View>

            <ThemedText type="caption" style={styles.weeklyAverage}>
              {t('progress.average')}: {weeklyData.averagePerDay.toFixed(1)} {t('progress.pagesPerDay')}
            </ThemedText>
          </View>
        )}

        {/* Goal Settings */}
        <View style={[styles.card, {
          backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
          borderWidth: 0,
          borderColor: 'transparent',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 2,
        }]}>
          <Pressable
            style={styles.cardHeader}
            onPress={() => setShowGoalSettings(!showGoalSettings)}
          >
            <ThemedText type="h3" style={styles.cardTitle}>
              {t('progress.dailyGoalSettings')}
            </ThemedText>
            <Feather
              name={showGoalSettings ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.text}
            />
          </Pressable>

          {showGoalSettings && (
            <View style={styles.goalSettings}>
              <View style={styles.settingRow}>
                <ThemedText>{t('progress.enableDailyGoal')}</ThemedText>
                <TactileSwitch
                  value={goalEnabled}
                  onValueChange={setGoalEnabled}
                  trackColorTrue={DUSTY_ROSE}
                />
              </View>

              <View style={styles.settingRow}>
                <ThemedText>{t('progress.goalType')}</ThemedText>
                <View style={[styles.goalTypeButtons, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6',
                  borderRadius: 10,
                  padding: 3,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 2,
                }]}>
                  <Pressable
                    style={[
                      styles.goalTypeButton,
                      goalType === 'pages'
                        ? {
                          backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.08,
                          shadowRadius: 4,
                          elevation: 2,
                        }
                        : { backgroundColor: 'transparent' },
                    ]}
                    onPress={() => setGoalType('pages')}
                  >
                    <ThemedText style={goalType === 'pages' ? { fontWeight: '600' } : { opacity: 0.6 }}>
                      {t('progress.pages')}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.goalTypeButton,
                      goalType === 'verses'
                        ? {
                          backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.08,
                          shadowRadius: 4,
                          elevation: 2,
                        }
                        : { backgroundColor: 'transparent' },
                    ]}
                    onPress={() => setGoalType('verses')}
                  >
                    <ThemedText style={goalType === 'verses' ? { fontWeight: '600' } : { opacity: 0.6 }}>
                      {t('progress.verses')}
                    </ThemedText>
                  </Pressable>
                </View>
              </View>

              <View style={styles.settingRow}>
                <ThemedText>{t('progress.target')} ({goalType === 'pages' ? '1-20' : '1-100'})</ThemedText>
                <TextInput
                  style={[styles.goalInput, {
                    color: theme.text,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#EDEFF2',
                    borderWidth: 0,
                    borderColor: 'transparent',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 2,
                  }]}
                  value={goalTarget}
                  onChangeText={setGoalTarget}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>

              <Pressable style={[styles.saveButton, {
                backgroundColor: DUSTY_ROSE,
                borderWidth: 0,
                borderColor: 'transparent',
                shadowColor: DUSTY_ROSE_SHADOW,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 5,
              }]} onPress={handleSaveGoal}>
                <ThemedText style={styles.saveButtonText}>{t('progress.saveGoal')}</ThemedText>
              </Pressable>
            </View>
          )}
        </View>

        {/* Reminder Settings */}
        <View style={[styles.card, {
          backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
          borderWidth: 0,
          borderColor: 'transparent',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 2,
        }]}>
          <ThemedText type="h3" style={styles.cardTitle}>
            {t('progress.readingReminder')}
          </ThemedText>

          <View style={styles.settingRow}>
            <ThemedText>{t('progress.enableReminder')}</ThemedText>
            <TactileSwitch
              value={reminderEnabled}
              onValueChange={handleReminderToggle}
              trackColorTrue={DUSTY_ROSE}
            />
          </View>

          {reminderEnabled && (
            <View style={styles.settingRow}>
              <ThemedText>{t('progress.reminderTime')}</ThemedText>
              <Pressable
                style={[styles.timeButton, {
                  borderWidth: 0,
                  borderColor: 'transparent',
                  backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Feather name="clock" size={16} color={DUSTY_ROSE} />
                <ThemedText style={styles.timeButtonText}>
                  {(() => {
                    const [h, m] = reminderTime.split(':').map(Number);
                    const hour12 = h % 12 || 12;
                    const ampm = h < 12 ? 'AM' : 'PM';
                    return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
                  })()}
                </ThemedText>
              </Pressable>
            </View>
          )}

          {showTimePicker && Platform.OS === 'ios' && (
            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerHeader}>
                <Pressable onPress={() => setShowTimePicker(false)}>
                  <ThemedText style={{ color: theme.primary, fontWeight: '600' }}>
                    {t('progress.done')}
                  </ThemedText>
                </Pressable>
              </View>
              <DateTimePicker
                value={(() => {
                  const [h, m] = reminderTime.split(':').map(Number);
                  const date = new Date();
                  date.setHours(h, m, 0, 0);
                  return date;
                })()}
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    const hours = selectedDate.getHours().toString().padStart(2, '0');
                    const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
                    setReminderTime(`${hours}:${minutes}`);
                  }
                }}
                themeVariant={isDark ? 'dark' : 'light'}
              />
            </View>
          )}

          {showTimePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={(() => {
                const [h, m] = reminderTime.split(':').map(Number);
                const date = new Date();
                date.setHours(h, m, 0, 0);
                return date;
              })()}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={(event, selectedDate) => {
                setShowTimePicker(false);
                if (selectedDate && event.type !== 'dismissed') {
                  const hours = selectedDate.getHours().toString().padStart(2, '0');
                  const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
                  setReminderTime(`${hours}:${minutes}`);
                }
              }}
              themeVariant={isDark ? 'dark' : 'light'}
            />
          )}
        </View>

        {/* Reset Button */}
        <Pressable
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
          onPress={handleResetProgress}
        >
          <Feather name="trash-2" size={20} color="#fff" />
          <ThemedText style={styles.resetButtonText}>{t('progress.resetAllProgress')}</ThemedText>
        </Pressable>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    marginBottom: 12,
  },
  progressCircleContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  todayStats: {
    alignItems: 'center',
    gap: 8,
  },
  todayStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayStatText: {
    fontSize: 16,
  },
  goalProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#EDEFF2',
    borderRadius: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  streakItem: {
    alignItems: 'center',
    gap: 4,
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 80,
    marginVertical: 16,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 4,
  },
  dayBar: {
    width: 24,
    borderRadius: 4,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 10,
  },
  weeklyAverage: {
    textAlign: 'center',
  },
  goalSettings: {
    marginTop: 12,
    gap: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  goalTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  goalTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  goalTypeButtonActive: {
    backgroundColor: undefined, // Will be set dynamically with theme.primary
  },
  goalTypeTextActive: {
    color: '#fff',
  },
  goalInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 80,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 80,
    textAlign: 'center',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timePickerContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButton: {
    // backgroundColor set dynamically with theme.primary
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
