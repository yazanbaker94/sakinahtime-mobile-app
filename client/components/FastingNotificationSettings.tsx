/**
 * FastingNotificationSettings Component
 * 
 * Settings UI for configuring fasting day notifications.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Switch,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useFastingNotifications } from '../hooks/useFastingNotifications';
import { FastingNotificationSettings as SettingsType } from '../services/FastingNotificationService';
import { ThemedText } from './ThemedText';
import { Feather } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '../constants/theme';

interface FastingNotificationSettingsProps {
  compact?: boolean;
}

const FASTING_TYPE_LABELS: Record<keyof SettingsType['types'], { label: string; description: string }> = {
  monday: { label: 'Monday', description: 'Weekly Sunnah fast' },
  thursday: { label: 'Thursday', description: 'Weekly Sunnah fast' },
  white_day: { label: 'White Days', description: '13th, 14th, 15th of each month' },
  ashura: { label: 'Ashura', description: '10th of Muharram' },
  arafah: { label: 'Day of Arafah', description: '9th of Dhul Hijjah' },
  shawwal: { label: 'Shawwal', description: '6 days after Ramadan' },
};

export function FastingNotificationSettings({ compact = false }: FastingNotificationSettingsProps) {
  const { theme, isDark } = useTheme();
  const {
    settings,
    loading,
    permission,
    toggleEnabled,
    toggleFastingType,
    setReminderTime,
  } = useFastingNotifications();

  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  if (compact) {
    return (
      <View style={[styles.card, {
        backgroundColor: theme.cardBackground,
        borderColor: isDark ? theme.border : 'transparent',
        borderWidth: isDark ? 1 : 0,
        elevation: isDark ? 0 : 3,
        shadowOpacity: isDark ? 0 : 0.08,
      }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View style={[styles.iconCircle, { backgroundColor: `${theme.gold}15` }]}>
              <Feather name="moon" size={20} color={theme.gold} />
            </View>
            <View style={styles.settingText}>
              <ThemedText type="body" style={{ fontWeight: '600' }}>Fasting Reminders</ThemedText>
              <ThemedText type="small" secondary>
                Get notified about upcoming fasting days
              </ThemedText>
            </View>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={toggleEnabled}
            trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, {
      backgroundColor: theme.cardBackground,
      borderColor: isDark ? theme.border : 'transparent',
      borderWidth: isDark ? 1 : 0,
      elevation: isDark ? 0 : 3,
      shadowOpacity: isDark ? 0 : 0.08,
    }]}>
      {/* Main Toggle */}
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.gold}15` }]}>
            <Feather name="moon" size={20} color={theme.gold} />
          </View>
          <View style={styles.settingText}>
            <ThemedText type="body" style={{ fontWeight: '600' }}>Fasting Reminders</ThemedText>
            <ThemedText type="small" secondary>
              Receive reminders for recommended fasting days
            </ThemedText>
          </View>
        </View>
        <Switch
          value={settings.enabled}
          onValueChange={toggleEnabled}
          trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      {settings.enabled && (
        <>
          {/* Reminder Time */}
          <View style={styles.reminderTimeSection}>
            <ThemedText type="small" secondary style={{ fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm }}>
              Reminder Time
            </ThemedText>
            <View style={styles.reminderTimeOptions}>
              <Pressable
                style={[
                  styles.reminderTimeOption,
                  { backgroundColor: theme.backgroundSecondary },
                  settings.reminderTime === 'evening' && {
                    backgroundColor: `${theme.primary}20`,
                    borderWidth: 2,
                    borderColor: theme.primary,
                  },
                ]}
                onPress={() => setReminderTime('evening')}
              >
                <ThemedText type="body" style={[
                  { fontWeight: '600' },
                  settings.reminderTime === 'evening' && { color: theme.primary },
                ]}>
                  Evening Before
                </ThemedText>
                <ThemedText type="caption" secondary>8:00 PM</ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.reminderTimeOption,
                  { backgroundColor: theme.backgroundSecondary },
                  settings.reminderTime === 'morning' && {
                    backgroundColor: `${theme.primary}20`,
                    borderWidth: 2,
                    borderColor: theme.primary,
                  },
                ]}
                onPress={() => setReminderTime('morning')}
              >
                <ThemedText type="body" style={[
                  { fontWeight: '600' },
                  settings.reminderTime === 'morning' && { color: theme.primary },
                ]}>
                  Before Fajr
                </ThemedText>
                <ThemedText type="caption" secondary>30 min before</ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Fasting Types */}
          <View style={styles.fastingTypesSection}>
            <ThemedText type="small" secondary style={{ fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm }}>
              Fasting Days
            </ThemedText>
            {(Object.keys(FASTING_TYPE_LABELS) as Array<keyof SettingsType['types']>).map((type) => (
              <View key={type} style={styles.fastingTypeRow}>
                <View style={styles.fastingTypeInfo}>
                  <ThemedText type="body">{FASTING_TYPE_LABELS[type].label}</ThemedText>
                  <ThemedText type="caption" secondary>
                    {FASTING_TYPE_LABELS[type].description}
                  </ThemedText>
                </View>
                <Switch
                  value={settings.types[type]}
                  onValueChange={(value) => toggleFastingType(type, value)}
                  trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </View>
        </>
      )}

      {permission !== 'granted' && settings.enabled && (
        <View style={[styles.permissionWarning, { backgroundColor: `${theme.gold}20` }]}>
          <ThemedText type="small" style={{ color: theme.gold, textAlign: 'center' }}>
            ⚠️ Notification permission required
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingText: {
    flex: 1,
  },
  reminderTimeSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  reminderTimeOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  reminderTimeOption: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  fastingTypesSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  fastingTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  fastingTypeInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  permissionWarning: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});

