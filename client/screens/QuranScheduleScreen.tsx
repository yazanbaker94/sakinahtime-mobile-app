/**
 * QuranScheduleScreen
 * Full 30-day Quran reading schedule view
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';
import { useQuranSchedule } from '@/hooks/useQuranSchedule';
import { useRamadan } from '@/contexts/RamadanContext';
import { DayReading } from '@/types/ramadan';
import { Spacing, BorderRadius } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootStackNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function QuranScheduleScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { currentDay } = useRamadan();
  const { schedule, progress, markDayComplete, navigateToMushaf } = useQuranSchedule();
  
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const accentColor = theme.primary;

  const handleOpenMushaf = (page: number) => {
    // Navigate directly to the specific page in QuranTab
    navigation.navigate('Main', { 
      screen: 'QuranTab', 
      params: { page } 
    } as any);
  };

  const renderDayItem = ({ item }: { item: DayReading }) => {
    const isToday = item.day === currentDay;
    const isPast = currentDay !== null && item.day < currentDay;
    const isSelected = selectedDay === item.day;

    return (
      <Pressable
        style={[
          styles.dayItem,
          {
            backgroundColor: isSelected
              ? (isDark ? `${theme.primary}30` : `${theme.primary}15`)
              : theme.cardBackground,
            borderColor: isToday ? accentColor : 'transparent',
            borderWidth: isToday ? 2 : 0,
          },
        ]}
        onPress={() => setSelectedDay(isSelected ? null : item.day)}
      >
        <View style={styles.dayHeader}>
          <View style={styles.dayInfo}>
            <ThemedText type="body" style={{ fontWeight: '700' }}>
              Day {item.day}
            </ThemedText>
            {isToday && (
              <View style={[styles.todayBadge, { backgroundColor: accentColor }]}>
                <ThemedText type="caption" style={{ color: '#fff', fontWeight: '600' }}>
                  Today
                </ThemedText>
              </View>
            )}
          </View>
          {item.completed ? (
            <View style={[styles.completedIcon, { backgroundColor: accentColor }]}>
              <Feather name="check" size={14} color="#fff" />
            </View>
          ) : isPast ? (
            <View style={[styles.missedIcon, { backgroundColor: '#EF4444' }]}>
              <Feather name="x" size={14} color="#fff" />
            </View>
          ) : null}
        </View>

        <View style={styles.readingInfo}>
          <ThemedText type="h4" style={{ color: accentColor }}>
            Juz {item.juzNumber}
          </ThemedText>
          <ThemedText type="small" secondary>
            Pages {item.startPage}-{item.endPage}
          </ThemedText>
        </View>

        {/* Expanded Details */}
        {isSelected && (
          <View style={styles.expandedDetails}>
            <View style={styles.surahList}>
              <ThemedText type="caption" secondary style={{ marginBottom: Spacing.xs }}>
                Surahs:
              </ThemedText>
              <ThemedText type="small">
                {item.surahNames.join(', ')}
              </ThemedText>
            </View>

            <View style={styles.actionButtons}>
              <Pressable
                style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                onPress={() => handleOpenMushaf(item.startPage)}
              >
                <Feather name="book" size={16} color={accentColor} />
                <ThemedText type="small" style={{ marginLeft: Spacing.xs, color: accentColor }}>
                  Open Mushaf
                </ThemedText>
              </Pressable>

              {!item.completed && (
                <Pressable
                  style={[styles.actionButton, { backgroundColor: accentColor }]}
                  onPress={() => markDayComplete(item.day)}
                >
                  <Feather name="check-circle" size={16} color="#fff" />
                  <ThemedText type="small" style={{ marginLeft: Spacing.xs, color: '#fff' }}>
                    Mark Complete
                  </ThemedText>
                </Pressable>
              )}
            </View>

            {item.completedAt && (
              <ThemedText type="caption" secondary style={{ marginTop: Spacing.sm }}>
                Completed: {new Date(item.completedAt).toLocaleDateString()}
              </ThemedText>
            )}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h2" style={styles.title}>Quran Schedule</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Summary */}
      <View style={[
        styles.progressCard,
        { backgroundColor: theme.cardBackground }
      ]}>
        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <ThemedText type="h2" style={{ color: accentColor }}>{progress.daysCompleted}</ThemedText>
            <ThemedText type="caption" secondary>Days Done</ThemedText>
          </View>
          <View style={styles.progressStat}>
            <ThemedText type="h2" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
              {progress.totalDays - progress.daysCompleted}
            </ThemedText>
            <ThemedText type="caption" secondary>Remaining</ThemedText>
          </View>
          <View style={styles.progressStat}>
            <ThemedText type="h2" style={{ color: progress.onTrack ? accentColor : '#F59E0B' }}>
              {progress.percentComplete}%
            </ThemedText>
            <ThemedText type="caption" secondary>Complete</ThemedText>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress.percentComplete}%`,
                  backgroundColor: progress.onTrack ? accentColor : '#F59E0B',
                },
              ]}
            />
          </View>
        </View>

        {!progress.onTrack && progress.daysBehind > 0 && (
          <View style={[styles.behindBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Feather name="alert-circle" size={14} color="#F59E0B" />
            <ThemedText type="small" style={{ color: '#F59E0B', marginLeft: Spacing.xs }}>
              {progress.daysBehind} day{progress.daysBehind > 1 ? 's' : ''} behind schedule
            </ThemedText>
          </View>
        )}
      </View>

      {/* Schedule List */}
      <FlatList
        data={schedule?.readings || []}
        renderItem={renderDayItem}
        keyExtractor={(item) => `day-${item.day}`}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    fontWeight: '700',
  },
  progressCard: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  progressStat: {
    alignItems: 'center',
  },
  progressBarContainer: {
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  behindBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  dayItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  todayBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  completedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readingInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.md,
  },
  expandedDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  surahList: {
    marginBottom: Spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
});
