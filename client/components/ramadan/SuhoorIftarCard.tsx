/**
 * SuhoorIftarCard Component
 * Displays Suhoor end time and Iftar time with live countdowns
 */

import React from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { Card } from '../Card';
import { useTheme } from '../../hooks/useTheme';
import { useSuhoorIftar } from '../../hooks/useSuhoorIftar';
import { Spacing, BorderRadius } from '../../constants/theme';

interface SuhoorIftarCardProps {
  onPress?: () => void;
}

function formatCountdown(hours: number, minutes: number, seconds: number): string {
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function SuhoorIftarCard({ onPress }: SuhoorIftarCardProps) {
  const { isDark } = useTheme();
  const {
    times,
    suhoorCountdown,
    iftarCountdown,
    isSuhoorTime,
    isIftarTime,
    isIftarNow,
    settings,
    updateSettings,
  } = useSuhoorIftar();

  if (!times) {
    return (
      <Card elevation={2} onPress={onPress}>
        <View style={styles.loadingContainer}>
          <ThemedText type="body" secondary>Loading prayer times...</ThemedText>
        </View>
      </Card>
    );
  }

  const suhoorColor = isSuhoorTime ? '#8B5CF6' : (isDark ? '#A78BFA' : '#7C3AED');
  const iftarColor = isIftarTime || isIftarNow ? '#F59E0B' : (isDark ? '#FBBF24' : '#D97706');

  return (
    <Card elevation={2} onPress={onPress}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
          <Feather name="moon" size={20} color={suhoorColor} />
        </View>
        <ThemedText type="h4">Suhoor & Iftar</ThemedText>
      </View>

      <View style={styles.timesContainer}>
        {/* Suhoor Section */}
        <View style={styles.timeSection}>
          <View style={styles.timeHeader}>
            <Feather name="sunrise" size={16} color={suhoorColor} />
            <ThemedText type="caption" secondary style={styles.timeLabel}>
              Suhoor Ends
            </ThemedText>
          </View>
          <ThemedText type="h3" style={[styles.time, { color: suhoorColor }]}>
            {times.suhoorEnd}
          </ThemedText>
          {isSuhoorTime && (
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <ThemedText type="small" style={{ color: suhoorColor }}>
                ⏰ {formatCountdown(suhoorCountdown.hours, suhoorCountdown.minutes, suhoorCountdown.seconds)}
              </ThemedText>
            </View>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

        {/* Iftar Section */}
        <View style={styles.timeSection}>
          <View style={styles.timeHeader}>
            <Feather name="sunset" size={16} color={iftarColor} />
            <ThemedText type="caption" secondary style={styles.timeLabel}>
              Iftar Time
            </ThemedText>
          </View>
          <ThemedText type="h3" style={[styles.time, { color: iftarColor }]}>
            {times.iftarTime}
          </ThemedText>
          {isIftarNow ? (
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
              <ThemedText type="small" style={{ color: iftarColor, fontWeight: '700' }}>
                🌙 Iftar Time!
              </ThemedText>
            </View>
          ) : isIftarTime ? (
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <ThemedText type="small" style={{ color: iftarColor }}>
                ⏰ {formatCountdown(iftarCountdown.hours, iftarCountdown.minutes, iftarCountdown.seconds)}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>

      {/* Notification Toggles */}
      <View style={styles.notificationSection}>
        <View style={styles.notificationRow}>
          <ThemedText type="small" secondary>Suhoor Reminder</ThemedText>
          <Switch
            value={settings.suhoorNotificationEnabled}
            onValueChange={(value) => updateSettings({ suhoorNotificationEnabled: value })}
            trackColor={{ false: '#767577', true: suhoorColor }}
          />
        </View>
        <View style={styles.notificationRow}>
          <ThemedText type="small" secondary>Iftar Reminder</ThemedText>
          <Switch
            value={settings.iftarNotificationEnabled}
            onValueChange={(value) => updateSettings({ iftarNotificationEnabled: value })}
            trackColor={{ false: '#767577', true: iftarColor }}
          />
        </View>
      </View>
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
  loadingContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  timesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  timeSection: {
    flex: 1,
    alignItems: 'center',
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  timeLabel: {
    marginLeft: Spacing.xs,
  },
  time: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  divider: {
    width: 1,
    height: 60,
    marginHorizontal: Spacing.md,
  },
  notificationSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
    paddingTop: Spacing.md,
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
});

export default SuhoorIftarCard;
