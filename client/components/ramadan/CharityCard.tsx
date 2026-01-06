/**
 * CharityCard Component
 * Displays charity total, goal progress, and Zakat status
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { Card } from '../Card';
import { useTheme } from '../../hooks/useTheme';
import { useCharityTracker } from '../../hooks/useCharityTracker';
import { Spacing, BorderRadius } from '../../constants/theme';

interface CharityCardProps {
  onPress?: () => void;
  onAddEntry?: () => void;
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CharityCard({ onPress, onAddEntry }: CharityCardProps) {
  const { isDark } = useTheme();
  const { stats, goal, goalProgress } = useCharityTracker();

  const accentColor = isDark ? '#34D399' : '#059669';
  const zakatColor = stats.zakatPaid ? '#10B981' : '#F59E0B';

  return (
    <Card elevation={2} onPress={onPress}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
          <Feather name="heart" size={20} color={accentColor} />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="h4">Charity</ThemedText>
          <ThemedText type="caption" secondary>
            {stats.totalEntries} donation{stats.totalEntries !== 1 ? 's' : ''} this Ramadan
          </ThemedText>
        </View>
      </View>

      {/* Total Amount */}
      <View style={styles.totalSection}>
        <ThemedText type="caption" secondary>Total Given</ThemedText>
        <ThemedText type="h2" style={[styles.totalAmount, { color: accentColor }]}>
          {formatCurrency(stats.totalAmount)}
        </ThemedText>
      </View>

      {/* Goal Progress */}
      {goal && goal.amount > 0 && (
        <View style={styles.goalSection}>
          <View style={styles.goalHeader}>
            <ThemedText type="small" secondary>Goal Progress</ThemedText>
            <ThemedText type="small" style={{ color: accentColor }}>
              {formatCurrency(stats.totalAmount)} / {formatCurrency(goal.amount)}
            </ThemedText>
          </View>
          <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${goalProgress}%`,
                  backgroundColor: goalProgress >= 100 ? '#10B981' : accentColor,
                }
              ]} 
            />
          </View>
          {goalProgress >= 100 && (
            <View style={[styles.goalCompleteBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Feather name="check-circle" size={14} color="#10B981" />
              <ThemedText type="small" style={{ color: '#10B981', marginLeft: 4 }}>
                Goal Reached! Mashallah!
              </ThemedText>
            </View>
          )}
        </View>
      )}

      {/* Zakat Status */}
      <View style={[
        styles.zakatSection, 
        { backgroundColor: stats.zakatPaid 
          ? 'rgba(16, 185, 129, 0.1)' 
          : 'rgba(245, 158, 11, 0.1)' 
        }
      ]}>
        <View style={styles.zakatHeader}>
          <Feather 
            name={stats.zakatPaid ? 'check-circle' : 'alert-circle'} 
            size={16} 
            color={zakatColor} 
          />
          <ThemedText type="body" style={{ marginLeft: Spacing.sm, fontWeight: '600' }}>
            Zakat
          </ThemedText>
        </View>
        {stats.zakatPaid ? (
          <ThemedText type="small" style={{ color: zakatColor }}>
            Paid: {formatCurrency(stats.zakatAmount)}
          </ThemedText>
        ) : (
          <ThemedText type="small" style={{ color: zakatColor }}>
            Not yet paid this year
          </ThemedText>
        )}
      </View>

      {/* Breakdown by Type */}
      <View style={styles.breakdownSection}>
        <ThemedText type="caption" secondary style={styles.breakdownTitle}>Breakdown</ThemedText>
        <View style={styles.breakdownGrid}>
          {Object.entries(stats.byType).map(([type, amount]) => (
            amount > 0 && (
              <View key={type} style={styles.breakdownItem}>
                <ThemedText type="small" secondary style={{ textTransform: 'capitalize' }}>
                  {type}
                </ThemedText>
                <ThemedText type="small" style={{ fontWeight: '600' }}>
                  {formatCurrency(amount)}
                </ThemedText>
              </View>
            )
          ))}
        </View>
      </View>

      {/* Quick Add Button */}
      {onAddEntry && (
        <Pressable 
          style={[styles.addButton, { backgroundColor: accentColor }]}
          onPress={onAddEntry}
        >
          <Feather name="plus" size={16} color="#fff" />
          <ThemedText type="small" style={{ color: '#fff', marginLeft: 4 }}>
            Add Donation
          </ThemedText>
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  totalSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  totalAmount: {
    fontWeight: '800',
  },
  goalSection: {
    marginBottom: Spacing.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
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
  goalCompleteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  zakatSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  zakatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownSection: {
    marginBottom: Spacing.md,
  },
  breakdownTitle: {
    marginBottom: Spacing.sm,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  breakdownItem: {
    minWidth: 80,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
});

export default CharityCard;
