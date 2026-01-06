/**
 * TaraweehTrackerScreen
 * Calendar view and statistics for Taraweeh prayer tracking
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';
import { useTaraweehTracker } from '@/hooks/useTaraweehTracker';
import { useRamadan } from '@/contexts/RamadanContext';
import { RAMADAN_DAYS } from '@/constants/ramadan';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function TaraweehTrackerScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { currentDay } = useRamadan();
  const { entries, stats } = useTaraweehTracker();

  const accentColor = isDark ? '#A78BFA' : '#7C3AED';
  const streakColor = '#FBBF24';

  // Create a map of entries by day
  const entriesByDay = new Map(entries.map(e => [e.hijriDay, e]));

  const handleDayPress = (day: number) => {
    if (currentDay === null || day > currentDay) return;
    
    const existingEntry = entriesByDay.get(day);
    navigation.navigate('LogTaraweeh', { day, existingEntry });
  };

  const renderCalendarGrid = () => {
    const days = Array.from({ length: RAMADAN_DAYS }, (_, i) => i + 1);
    const rows = [];
    
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }

    return (
      <View style={styles.calendarGrid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.calendarRow}>
            {row.map((day) => {
              const entry = entriesByDay.get(day);
              const isToday = day === currentDay;
              const isFuture = currentDay !== null && day > currentDay;

              return (
                <Pressable
                  key={day}
                  style={[
                    styles.calendarDay,
                    {
                      backgroundColor: entry
                        ? (entry.location === 'mosque' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(167, 139, 250, 0.2)')
                        : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                      borderColor: isToday ? accentColor : 'transparent',
                      borderWidth: isToday ? 2 : 0,
                      opacity: isFuture ? 0.4 : 1,
                    },
                  ]}
                  onPress={() => handleDayPress(day)}
                  disabled={isFuture}
                >
                  <ThemedText type="small" style={{ fontWeight: isToday ? '700' : '500' }}>
                    {day}
                  </ThemedText>
                  {entry && (
                    <View style={[
                      styles.dayIndicator,
                      { backgroundColor: entry.location === 'mosque' ? '#10B981' : accentColor }
                    ]}>
                      <Feather name="check" size={8} color="#fff" />
                    </View>
                  )}
                </Pressable>
              );
            })}
            {/* Fill empty cells in last row */}
            {row.length < 7 && Array.from({ length: 7 - row.length }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.calendarDayEmpty} />
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.md,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
          </Pressable>
          <ThemedText type="h2" style={styles.title}>Taraweeh Tracker</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault }]}>
            <Feather name="check-circle" size={20} color="#10B981" />
            <ThemedText type="h3" style={{ color: '#10B981' }}>{stats.nightsCompleted}</ThemedText>
            <ThemedText type="caption" secondary>Nights</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault }]}>
            <Feather name="zap" size={20} color={streakColor} />
            <ThemedText type="h3" style={{ color: streakColor }}>{stats.currentStreak}</ThemedText>
            <ThemedText type="caption" secondary>Streak</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault }]}>
            <Feather name="award" size={20} color={accentColor} />
            <ThemedText type="h3" style={{ color: accentColor }}>{stats.bestStreak}</ThemedText>
            <ThemedText type="caption" secondary>Best</ThemedText>
          </View>
        </View>

        {/* Calendar */}
        <Card elevation={2} style={styles.calendarCard}>
          <ThemedText type="h4" style={styles.calendarTitle}>Ramadan Calendar</ThemedText>
          
          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <ThemedText type="caption" secondary>Mosque</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: accentColor }]} />
              <ThemedText type="caption" secondary>Home</ThemedText>
            </View>
          </View>

          {renderCalendarGrid()}
        </Card>

        {/* Location Breakdown */}
        <Card elevation={2}>
          <ThemedText type="h4" style={styles.sectionTitle}>Location Breakdown</ThemedText>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Feather name="map-pin" size={20} color="#10B981" />
              <ThemedText type="h3" style={{ marginLeft: Spacing.sm }}>{stats.mosqueNights}</ThemedText>
              <ThemedText type="body" secondary style={{ marginLeft: Spacing.xs }}>at Mosque</ThemedText>
            </View>
            <View style={styles.breakdownItem}>
              <Feather name="home" size={20} color={accentColor} />
              <ThemedText type="h3" style={{ marginLeft: Spacing.sm }}>{stats.homeNights}</ThemedText>
              <ThemedText type="body" secondary style={{ marginLeft: Spacing.xs }}>at Home</ThemedText>
            </View>
          </View>
          
          {/* Completion Rate */}
          <View style={styles.completionSection}>
            <ThemedText type="small" secondary>Completion Rate</ThemedText>
            <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
              <View
                style={[styles.progressFill, { width: `${stats.completionRate}%`, backgroundColor: accentColor }]}
              />
            </View>
            <ThemedText type="small" style={{ color: accentColor }}>{stats.completionRate}%</ThemedText>
          </View>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  backButton: { padding: Spacing.xs },
  title: { fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  statCard: { flex: 1, alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.xl, gap: Spacing.xs },
  calendarCard: { marginBottom: Spacing.lg },
  calendarTitle: { marginBottom: Spacing.md },
  legend: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  calendarGrid: { gap: Spacing.xs },
  calendarRow: { flexDirection: 'row', gap: Spacing.xs },
  calendarDay: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.md, position: 'relative' },
  calendarDayEmpty: { flex: 1, aspectRatio: 1 },
  dayIndicator: { position: 'absolute', bottom: 4, width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { marginBottom: Spacing.md },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.lg },
  breakdownItem: { flexDirection: 'row', alignItems: 'center' },
  completionSection: { gap: Spacing.xs },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
});
