/**
 * RamadanCountdown Component
 * Displays current Ramadan day and days remaining
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../hooks/useTheme';
import { useRamadan } from '../../contexts/RamadanContext';
import { Spacing, BorderRadius } from '../../constants/theme';

interface RamadanCountdownProps {
  compact?: boolean;
}

export function RamadanCountdown({ compact = false }: RamadanCountdownProps) {
  const { isDark, theme } = useTheme();
  const { isRamadan, currentDay, daysRemaining, isLastTenNights } = useRamadan();

  if (!isRamadan || currentDay === null) {
    return null;
  }

  const accentColor = isLastTenNights ? '#FBBF24' : theme.primary;

  if (compact) {
    return (
      <View style={[
        styles.compactContainer,
        { backgroundColor: `${theme.primary}26` }
      ]}>
        <Feather name="moon" size={14} color={accentColor} />
        <ThemedText type="small" style={{ color: accentColor, fontWeight: '600', marginLeft: 4 }}>
          Day {currentDay}
        </ThemedText>
        {daysRemaining !== null && daysRemaining > 0 && (
          <ThemedText type="small" secondary style={{ marginLeft: 4 }}>
            • {daysRemaining} left
          </ThemedText>
        )}
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: isLastTenNights 
          ? (isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.1)')
          : `${theme.primary}26`
      }
    ]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${accentColor}30` }]}>
          <Feather name="moon" size={24} color={accentColor} />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="h4" style={{ color: accentColor }}>
            Ramadan Mubarak
          </ThemedText>
          {isLastTenNights && (
            <ThemedText type="caption" style={{ color: accentColor }}>
              ✨ Last 10 Nights
            </ThemedText>
          )}
        </View>
      </View>

      <View style={styles.statsRow}>
        {/* Current Day */}
        <View style={styles.statItem}>
          <ThemedText type="h1" style={[styles.statNumber, { color: accentColor }]}>
            {currentDay}
          </ThemedText>
          <ThemedText type="caption" secondary>Day</ThemedText>
        </View>

        <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

        {/* Days Remaining */}
        <View style={styles.statItem}>
          <ThemedText type="h1" style={[styles.statNumber, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            {daysRemaining ?? 0}
          </ThemedText>
          <ThemedText type="caption" secondary>Days Left</ThemedText>
        </View>

        {/* Days Until Last 10 (if applicable) */}
        {!isLastTenNights && currentDay < 21 && (
          <>
            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
            <View style={styles.statItem}>
              <ThemedText type="h1" style={[styles.statNumber, { color: '#FBBF24' }]}>
                {21 - currentDay}
              </ThemedText>
              <ThemedText type="caption" secondary>To Last 10</ThemedText>
            </View>
          </>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${(currentDay / 30) * 100}%`,
                backgroundColor: accentColor,
              }
            ]} 
          />
          {/* Last 10 nights marker */}
          <View style={[styles.lastTenMarker, { left: '70%' }]}>
            <View style={[styles.markerLine, { backgroundColor: '#FBBF24' }]} />
          </View>
        </View>
        <View style={styles.progressLabels}>
          <ThemedText type="caption" secondary>Day 1</ThemedText>
          <ThemedText type="caption" style={{ color: '#FBBF24' }}>21</ThemedText>
          <ThemedText type="caption" secondary>30</ThemedText>
        </View>
      </View>

      {/* Motivational Message */}
      {currentDay === 30 && (
        <View style={[styles.messageBox, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }]}>
          <Feather name="gift" size={16} color={accentColor} />
          <ThemedText type="body" style={{ marginLeft: Spacing.sm, color: accentColor }}>
            Last day of Ramadan! Eid Mubarak tomorrow! 🎉
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 44,
  },
  divider: {
    width: 1,
    height: 50,
  },
  progressSection: {
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  lastTenMarker: {
    position: 'absolute',
    top: -4,
    bottom: -4,
  },
  markerLine: {
    width: 2,
    height: 16,
    borderRadius: 1,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
});

export default RamadanCountdown;
