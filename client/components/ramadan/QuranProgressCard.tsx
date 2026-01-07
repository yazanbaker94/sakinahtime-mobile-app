/**
 * QuranProgressCard Component
 * Displays Quran reading progress and today's assignment
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { Card } from '../Card';
import { useTheme } from '../../hooks/useTheme';
import { useQuranSchedule } from '../../hooks/useQuranSchedule';
import { Spacing, BorderRadius } from '../../constants/theme';

interface QuranProgressCardProps {
  onPress?: () => void;
  onOpenMushaf?: (page: number) => void;
}

export function QuranProgressCard({ onPress, onOpenMushaf }: QuranProgressCardProps) {
  const { isDark, theme } = useTheme();
  const { todayReading, progress, markDayComplete } = useQuranSchedule();

  const progressColor = progress.onTrack ? theme.primary : '#F59E0B';
  const accentColor = theme.primary;

  return (
    <Card elevation={2} onPress={onPress}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}26` }]}>
          <Feather name="book-open" size={20} color={accentColor} />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="h4">Quran Progress</ThemedText>
          <ThemedText type="caption" secondary>
            {progress.daysCompleted}/{progress.totalDays} days completed
          </ThemedText>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${progress.percentComplete}%`,
                backgroundColor: progressColor,
              }
            ]} 
          />
        </View>
        <ThemedText type="small" style={[styles.progressText, { color: progressColor }]}>
          {progress.percentComplete}%
        </ThemedText>
      </View>

      {/* Status Message */}
      {!progress.onTrack && progress.daysBehind > 0 && (
        <View style={[styles.statusBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
          <Feather name="alert-circle" size={14} color="#F59E0B" />
          <ThemedText type="small" style={{ color: '#F59E0B', marginLeft: Spacing.xs }}>
            {progress.daysBehind} day{progress.daysBehind > 1 ? 's' : ''} behind schedule
          </ThemedText>
        </View>
      )}

      {/* Today's Reading */}
      {todayReading && (
        <View style={[styles.todaySection, { backgroundColor: `${theme.primary}1A` }]}>
          <View style={styles.todayHeader}>
            <ThemedText type="body" style={{ fontWeight: '600' }}>Today's Reading</ThemedText>
            {todayReading.completed && (
              <View style={[styles.completedBadge, { backgroundColor: accentColor }]}>
                <Feather name="check" size={12} color="#fff" />
              </View>
            )}
          </View>
          
          <View style={styles.readingDetails}>
            <View style={styles.readingItem}>
              <ThemedText type="caption" secondary>Juz</ThemedText>
              <ThemedText type="h3" style={{ color: accentColor }}>{todayReading.juzNumber}</ThemedText>
            </View>
            <View style={styles.readingItem}>
              <ThemedText type="caption" secondary>Pages</ThemedText>
              <ThemedText type="body" style={{ fontWeight: '600' }}>
                {todayReading.startPage}-{todayReading.endPage}
              </ThemedText>
            </View>
          </View>

          {todayReading.surahNames.length > 0 && (
            <ThemedText type="small" secondary style={styles.surahNames}>
              {todayReading.surahNames.slice(0, 3).join(', ')}
              {todayReading.surahNames.length > 3 && '...'}
            </ThemedText>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {onOpenMushaf && (
              <Pressable 
                style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                onPress={() => onOpenMushaf(todayReading.startPage)}
              >
                <Feather name="book" size={16} color={accentColor} />
                <ThemedText type="small" style={{ marginLeft: Spacing.xs, color: accentColor }}>
                  Open Mushaf
                </ThemedText>
              </Pressable>
            )}
            
            {!todayReading.completed && (
              <Pressable 
                style={[styles.actionButton, { backgroundColor: accentColor }]}
                onPress={() => markDayComplete(todayReading.day)}
              >
                <Feather name="check-circle" size={16} color="#fff" />
                <ThemedText type="small" style={{ marginLeft: Spacing.xs, color: '#fff' }}>
                  Mark Complete
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  todaySection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  completedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readingDetails: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  readingItem: {
    marginRight: Spacing.xl,
  },
  surahNames: {
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

export default QuranProgressCard;
