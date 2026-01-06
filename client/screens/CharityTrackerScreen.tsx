/**
 * CharityTrackerScreen
 * Charity tracking with goal setting and Zakat calculator
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
import { useCharityTracker } from '@/hooks/useCharityTracker';
import { CharityEntry, CharityType } from '@/types/ramadan';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CHARITY_TYPES: { value: CharityType; label: string; icon: string }[] = [
  { value: 'sadaqah', label: 'Sadaqah', icon: 'heart' },
  { value: 'zakat', label: 'Zakat', icon: 'percent' },
  { value: 'fidya', label: 'Fidya', icon: 'coffee' },
  { value: 'kaffarah', label: 'Kaffarah', icon: 'shield' },
  { value: 'other', label: 'Other', icon: 'gift' },
];

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function CharityTrackerScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { entries, stats, goal, goalProgress, deleteEntry } = useCharityTracker();

  const accentColor = isDark ? '#34D399' : '#059669';

  const renderEntryItem = ({ item }: { item: CharityEntry }) => {
    const typeInfo = CHARITY_TYPES.find(t => t.value === item.type);
    
    return (
      <View style={[
        styles.entryItem,
        { backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault }
      ]}>
        <View style={[styles.entryIcon, { backgroundColor: `${accentColor}20` }]}>
          <Feather name={typeInfo?.icon as any || 'heart'} size={16} color={accentColor} />
        </View>
        <View style={styles.entryDetails}>
          <ThemedText type="body" style={{ fontWeight: '600' }}>
            {formatCurrency(item.amount)}
          </ThemedText>
          <ThemedText type="caption" secondary>
            {typeInfo?.label} • {new Date(item.date).toLocaleDateString()}
          </ThemedText>
          {item.recipient && (
            <ThemedText type="small" secondary>To: {item.recipient}</ThemedText>
          )}
        </View>
        <Pressable onPress={() => deleteEntry(item.id)} style={styles.deleteButton}>
          <Feather name="trash-2" size={16} color="#EF4444" />
        </Pressable>
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
          <ThemedText type="h2" style={styles.title}>Charity Tracker</ThemedText>
          <Pressable onPress={() => navigation.navigate('AddDonation')}>
            <Feather name="plus" size={24} color={accentColor} />
          </Pressable>
        </View>

        {/* Total Card */}
        <Card elevation={2} style={styles.totalCard}>
          <ThemedText type="caption" secondary>Total Given This Ramadan</ThemedText>
          <ThemedText type="h1" style={[styles.totalAmount, { color: accentColor }]}>
            {formatCurrency(stats.totalAmount)}
          </ThemedText>
          
          {/* Goal Progress */}
          {goal && goal.amount > 0 ? (
            <View style={styles.goalSection}>
              <View style={styles.goalHeader}>
                <ThemedText type="small" secondary>Goal: {formatCurrency(goal.amount)}</ThemedText>
                <ThemedText type="small" style={{ color: accentColor }}>{goalProgress}%</ThemedText>
              </View>
              <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${goalProgress}%`, backgroundColor: goalProgress >= 100 ? '#10B981' : accentColor },
                  ]}
                />
              </View>
            </View>
          ) : (
            <Pressable
              style={[styles.setGoalButton, { borderColor: accentColor }]}
              onPress={() => navigation.navigate('SetCharityGoal')}
            >
              <Feather name="target" size={16} color={accentColor} />
              <ThemedText type="small" style={{ color: accentColor, marginLeft: Spacing.xs }}>
                Set a Goal
              </ThemedText>
            </Pressable>
          )}
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable
            style={[styles.quickAction, { backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault }]}
            onPress={() => navigation.navigate('ZakatCalculator')}
          >
            <Feather name="percent" size={20} color={accentColor} />
            <ThemedText type="small">Zakat Calculator</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.quickAction, { backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault }]}
            onPress={() => navigation.navigate('SetCharityGoal')}
          >
            <Feather name="target" size={20} color={accentColor} />
            <ThemedText type="small">Edit Goal</ThemedText>
          </Pressable>
        </View>

        {/* Zakat Status */}
        <Card elevation={2} style={styles.zakatCard}>
          <View style={styles.zakatHeader}>
            <Feather
              name={stats.zakatPaid ? 'check-circle' : 'alert-circle'}
              size={20}
              color={stats.zakatPaid ? '#10B981' : '#F59E0B'}
            />
            <ThemedText type="h4" style={{ marginLeft: Spacing.sm }}>Zakat Status</ThemedText>
          </View>
          {stats.zakatPaid ? (
            <ThemedText type="body" style={{ color: '#10B981' }}>
              Paid: {formatCurrency(stats.zakatAmount)}
            </ThemedText>
          ) : (
            <ThemedText type="body" secondary>
              Not yet paid this year
            </ThemedText>
          )}
        </Card>

        {/* Breakdown by Type */}
        <Card elevation={2}>
          <ThemedText type="h4" style={styles.sectionTitle}>Breakdown by Type</ThemedText>
          {CHARITY_TYPES.map(({ value, label, icon }) => {
            const amount = stats.byType[value];
            const percentage = stats.totalAmount > 0 ? (amount / stats.totalAmount) * 100 : 0;
            
            return (
              <View key={value} style={styles.breakdownRow}>
                <View style={styles.breakdownLabel}>
                  <Feather name={icon as any} size={16} color={accentColor} />
                  <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>{label}</ThemedText>
                </View>
                <View style={styles.breakdownValue}>
                  <View style={[styles.breakdownBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                    <View
                      style={[styles.breakdownFill, { width: `${percentage}%`, backgroundColor: accentColor }]}
                    />
                  </View>
                  <ThemedText type="small" style={{ minWidth: 60, textAlign: 'right' }}>
                    {formatCurrency(amount)}
                  </ThemedText>
                </View>
              </View>
            );
          })}
        </Card>

        {/* Recent Entries */}
        {entries.length > 0 && (
          <View style={styles.entriesSection}>
            <ThemedText type="h4" style={styles.sectionTitle}>Recent Donations</ThemedText>
            {entries.slice(0, 10).map((entry) => (
              <View key={entry.id}>
                {renderEntryItem({ item: entry })}
              </View>
            ))}
          </View>
        )}
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
  totalCard: { alignItems: 'center', marginBottom: Spacing.lg },
  totalAmount: { fontSize: 48, fontWeight: '800', marginVertical: Spacing.sm },
  goalSection: { width: '100%', marginTop: Spacing.md },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  setGoalButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, marginTop: Spacing.md },
  quickActions: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  quickAction: { flex: 1, alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.xl, gap: Spacing.xs },
  zakatCard: { marginBottom: Spacing.lg },
  zakatHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { marginBottom: Spacing.md },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  breakdownLabel: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  breakdownValue: { flexDirection: 'row', alignItems: 'center', flex: 2 },
  breakdownBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden', marginRight: Spacing.sm },
  breakdownFill: { height: '100%', borderRadius: 3 },
  entriesSection: { marginTop: Spacing.lg },
  entryItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm },
  entryIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  entryDetails: { flex: 1 },
  deleteButton: { padding: Spacing.sm },
});
