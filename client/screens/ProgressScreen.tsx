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
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useProgressTracker } from '@/hooks/useProgressTracker';
import { useReadingReminder } from '@/hooks/useReadingReminder';
import { ProgressCalculator } from '@/services/ProgressCalculator';
import { DailyGoal } from '@/types/progress';
import { QURAN_CONSTANTS } from '@/constants/quran-constants';

export default function ProgressScreen() {
  const { theme, isDark } = useTheme();
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

  const [showTimePicker, setShowTimePicker] = useState(false);  const [showGoalSettings, setShowGoalSettings] = useState(false);
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
      Alert.alert('Invalid Goal', 'Please enter a valid number');
      return;
    }

    const minTarget = goalType === 'pages' ? QURAN_CONSTANTS.MIN_PAGE_GOAL : QURAN_CONSTANTS.MIN_VERSE_GOAL;
    const maxTarget = goalType === 'pages' ? QURAN_CONSTANTS.MAX_PAGE_GOAL : QURAN_CONSTANTS.MAX_VERSE_GOAL;

    if (target < minTarget || target > maxTarget) {
      Alert.alert(
        'Invalid Goal',
        `${goalType === 'pages' ? 'Page' : 'Verse'} goal must be between ${minTarget} and ${maxTarget}`
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
      Alert.alert('Error', 'Failed to save goal settings');
    }
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all reading progress? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetProgress();
            } catch (error) {
              Alert.alert('Error', 'Failed to reset progress');
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
          'Permission Required',
          'Please enable notifications in your device settings to use reading reminders.'
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
          <ThemedText>Loading progress...</ThemedText>
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
          Reading Progress
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall Progress Card */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1a5f4f' : '#f5f5f5' }]}>
          <ThemedText type="h3" style={styles.cardTitle}>
            Overall Progress
          </ThemedText>
          
          {/* Circular Progress */}
          <View style={styles.progressCircleContainer}>
            <View style={[styles.progressCircle, { borderColor: isDark ? '#D4AF37' : '#059669' }]}>
              <ThemedText type="h2" style={styles.progressPercentage}>
                {stats?.completionPercentage.toFixed(1)}%
              </ThemedText>
              <ThemedText type="caption">Complete</ThemedText>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText type="h2">{stats?.totalPagesRead || 0}</ThemedText>
              <ThemedText type="caption">Pages Read</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText type="h2">{stats?.juzCompleted || 0}/30</ThemedText>
              <ThemedText type="caption">Juz Complete</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText type="h2">{stats?.khatmCount || 0}</ThemedText>
              <ThemedText type="caption">Khatm</ThemedText>
            </View>
          </View>
        </View>

        {/* Today's Progress Card */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1a5f4f' : '#f5f5f5' }]}>
          <ThemedText type="h3" style={styles.cardTitle}>
            Today's Progress
          </ThemedText>
          
          <View style={styles.todayStats}>
            <View style={styles.todayStatItem}>
              <Feather 
                name={isGoalMet ? 'check-circle' : 'circle'} 
                size={24} 
                color={isGoalMet ? '#10B981' : (isDark ? '#D4AF37' : '#059669')} 
              />
              <ThemedText type="body" style={styles.todayStatText}>
                {progress?.dailyGoal.type === 'verses' 
                  ? `${todayProgress?.versesRead || 0} verses read`
                  : `${todayProgress?.pagesRead || 0} pages read`}
              </ThemedText>
            </View>
            
            {progress?.dailyGoal.enabled && (
              <View style={styles.goalProgressBar}>
                <View 
                  style={[
                    styles.goalProgressFill, 
                    { 
                      width: `${Math.min(100, todayProgress?.goalProgress || 0)}%`,
                      backgroundColor: isGoalMet ? '#10B981' : (isDark ? '#D4AF37' : '#059669'),
                    }
                  ]} 
                />
              </View>
            )}
            
            {progress?.dailyGoal.enabled && (
              <ThemedText type="caption">
                {progress.dailyGoal.type === 'verses'
                  ? `${todayProgress?.versesRead || 0}/${progress.dailyGoal.target} verses`
                  : `${todayProgress?.pagesRead || 0}/${progress.dailyGoal.target} pages`}
              </ThemedText>
            )}
            
            <ThemedText type="caption" style={{ opacity: 0.7 }}>
              {progress?.dailyGoal.enabled
                ? `Goal: ${progress.dailyGoal.target} ${progress.dailyGoal.type}/day`
                : 'No daily goal set'}
            </ThemedText>
          </View>
        </View>

        {/* Streak Card */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1a5f4f' : '#f5f5f5' }]}>
          <ThemedText type="h3" style={styles.cardTitle}>
            Reading Streak
          </ThemedText>
          
          <View style={styles.streakContainer}>
            <View style={styles.streakItem}>
              <Feather name="zap" size={32} color="#F59E0B" />
              <ThemedText type="h2">{stats?.currentStreak || 0}</ThemedText>
              <ThemedText type="caption">Current Streak</ThemedText>
            </View>
            <View style={styles.streakItem}>
              <Feather name="award" size={32} color="#8B5CF6" />
              <ThemedText type="h2">{stats?.longestStreak || 0}</ThemedText>
              <ThemedText type="caption">Longest Streak</ThemedText>
            </View>
          </View>
        </View>

        {/* Weekly Chart */}
        {weeklyData && (
          <View style={[styles.card, { backgroundColor: isDark ? '#1a5f4f' : '#f5f5f5' }]}>
            <ThemedText type="h3" style={styles.cardTitle}>
              This Week
            </ThemedText>
            
            <View style={styles.weeklyChart}>
              {weeklyData.days.map((day, index) => (
                <View key={day.date} style={styles.dayColumn}>
                  <View 
                    style={[
                      styles.dayBar,
                      { 
                        height: Math.max(4, (day.pagesRead / 20) * 60),
                        backgroundColor: day.goalMet ? '#10B981' : (isDark ? '#D4AF37' : '#059669'),
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
              Average: {weeklyData.averagePerDay.toFixed(1)} pages/day
            </ThemedText>
          </View>
        )}

        {/* Goal Settings */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1a5f4f' : '#f5f5f5' }]}>
          <Pressable 
            style={styles.cardHeader}
            onPress={() => setShowGoalSettings(!showGoalSettings)}
          >
            <ThemedText type="h3" style={styles.cardTitle}>
              Daily Goal Settings
            </ThemedText>
            <Feather 
              name={showGoalSettings ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={isDark ? '#fff' : '#000'} 
            />
          </Pressable>
          
          {showGoalSettings && (
            <View style={styles.goalSettings}>
              <View style={styles.settingRow}>
                <ThemedText>Enable Daily Goal</ThemedText>
                <Switch
                  value={goalEnabled}
                  onValueChange={setGoalEnabled}
                  trackColor={{ false: '#767577', true: isDark ? '#D4AF37' : '#059669' }}
                />
              </View>
              
              <View style={styles.settingRow}>
                <ThemedText>Goal Type</ThemedText>
                <View style={styles.goalTypeButtons}>
                  <Pressable
                    style={[
                      styles.goalTypeButton,
                      goalType === 'pages' && styles.goalTypeButtonActive,
                    ]}
                    onPress={() => setGoalType('pages')}
                  >
                    <ThemedText style={goalType === 'pages' ? styles.goalTypeTextActive : undefined}>
                      Pages
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.goalTypeButton,
                      goalType === 'verses' && styles.goalTypeButtonActive,
                    ]}
                    onPress={() => setGoalType('verses')}
                  >
                    <ThemedText style={goalType === 'verses' ? styles.goalTypeTextActive : undefined}>
                      Verses
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
              
              <View style={styles.settingRow}>
                <ThemedText>Target ({goalType === 'pages' ? '1-20' : '1-100'})</ThemedText>
                <TextInput
                  style={[styles.goalInput, { color: isDark ? '#fff' : '#000' }]}
                  value={goalTarget}
                  onChangeText={setGoalTarget}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              
              <Pressable style={styles.saveButton} onPress={handleSaveGoal}>
                <ThemedText style={styles.saveButtonText}>Save Goal</ThemedText>
              </Pressable>
            </View>
          )}
        </View>

        {/* Reminder Settings */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1a5f4f' : '#f5f5f5' }]}>
          <ThemedText type="h3" style={styles.cardTitle}>
            Reading Reminder
          </ThemedText>
          
          <View style={styles.settingRow}>
            <ThemedText>Enable Reminder</ThemedText>
            <Switch
              value={reminderEnabled}
              onValueChange={handleReminderToggle}
              trackColor={{ false: '#767577', true: isDark ? '#D4AF37' : '#059669' }}
            />
          </View>
          
          {reminderEnabled && (
            <View style={styles.settingRow}>
              <ThemedText>Reminder Time</ThemedText>
              <Pressable 
                style={[styles.timeButton, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Feather name="clock" size={16} color={isDark ? '#D4AF37' : '#059669'} />
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
                  <ThemedText style={{ color: isDark ? '#D4AF37' : '#059669', fontWeight: '600' }}>
                    Done
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
          style={[styles.resetButton, { backgroundColor: '#EF4444' }]}
          onPress={handleResetProgress}
        >
          <Feather name="trash-2" size={20} color="#fff" />
          <ThemedText style={styles.resetButtonText}>Reset All Progress</ThemedText>
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
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
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
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  goalTypeButtonActive: {
    backgroundColor: '#059669',
  },
  goalTypeTextActive: {
    color: '#fff',
  },
  goalInput: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 80,
    textAlign: 'center',
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
    borderWidth: 1,
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
    backgroundColor: '#059669',
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
