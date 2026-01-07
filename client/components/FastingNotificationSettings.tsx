/**
 * FastingNotificationSettings Component
 * 
 * Settings UI for configuring fasting day notifications.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useFastingNotifications } from '../hooks/useFastingNotifications';
import { FastingNotificationSettings as SettingsType } from '../services/FastingNotificationService';

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
  const { theme } = useTheme();
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
      <View style={[styles.loadingContainer, { backgroundColor: theme.cardBackground }]}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.compactRow}>
          <View style={styles.compactInfo}>
            <Text style={[styles.compactTitle, { color: theme.text }]}>Fasting Reminders</Text>
            <Text style={[styles.compactDescription, { color: theme.textSecondary }]}>
              Get notified about upcoming fasting days
            </Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={toggleEnabled}
            trackColor={{ false: theme.border, true: `${theme.primary}4D` }}
            thumbColor={settings.enabled ? theme.primary : theme.muted}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Fasting Reminders</Text>
      
      {/* Main Toggle */}
      <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Enable Notifications</Text>
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            Receive reminders for recommended fasting days
          </Text>
        </View>
        <Switch
          value={settings.enabled}
          onValueChange={toggleEnabled}
          trackColor={{ false: theme.border, true: `${theme.primary}4D` }}
          thumbColor={settings.enabled ? theme.primary : theme.muted}
        />
      </View>

      {settings.enabled && (
        <>
          {/* Reminder Time */}
          <View style={styles.reminderTimeSection}>
            <Text style={[styles.subsectionTitle, { color: theme.textSecondary }]}>Reminder Time</Text>
            <View style={styles.reminderTimeOptions}>
              <TouchableOpacity
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
                <Text style={[
                  styles.reminderTimeText,
                  { color: theme.textSecondary },
                  settings.reminderTime === 'evening' && { color: theme.primary },
                ]}>
                  Evening Before
                </Text>
                <Text style={[styles.reminderTimeSubtext, { color: theme.muted }]}>8:00 PM</Text>
              </TouchableOpacity>
              <TouchableOpacity
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
                <Text style={[
                  styles.reminderTimeText,
                  { color: theme.textSecondary },
                  settings.reminderTime === 'morning' && { color: theme.primary },
                ]}>
                  Morning Of
                </Text>
                <Text style={[styles.reminderTimeSubtext, { color: theme.muted }]}>5:00 AM</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fasting Types */}
          <View style={styles.fastingTypesSection}>
            <Text style={[styles.subsectionTitle, { color: theme.textSecondary }]}>Fasting Days</Text>
            {(Object.keys(FASTING_TYPE_LABELS) as Array<keyof SettingsType['types']>).map((type) => (
              <View key={type} style={styles.fastingTypeRow}>
                <View style={styles.fastingTypeInfo}>
                  <Text style={[styles.fastingTypeLabel, { color: theme.text }]}>
                    {FASTING_TYPE_LABELS[type].label}
                  </Text>
                  <Text style={[styles.fastingTypeDescription, { color: theme.muted }]}>
                    {FASTING_TYPE_LABELS[type].description}
                  </Text>
                </View>
                <Switch
                  value={settings.types[type]}
                  onValueChange={(value) => toggleFastingType(type, value)}
                  trackColor={{ false: theme.border, true: `${theme.primary}4D` }}
                  thumbColor={settings.types[type] ? theme.primary : theme.muted}
                />
              </View>
            ))}
          </View>
        </>
      )}

      {permission !== 'granted' && settings.enabled && (
        <View style={[styles.permissionWarning, { backgroundColor: `${theme.gold}20` }]}>
          <Text style={[styles.permissionWarningText, { color: theme.gold }]}>
            ⚠️ Notification permission required
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  reminderTimeSection: {
    marginTop: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reminderTimeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  reminderTimeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  reminderTimeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reminderTimeSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  fastingTypesSection: {
    marginTop: 20,
  },
  fastingTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  fastingTypeInfo: {
    flex: 1,
    marginRight: 12,
  },
  fastingTypeLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  fastingTypeDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  permissionWarning: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  permissionWarningText: {
    fontSize: 13,
    textAlign: 'center',
  },
  compactContainer: {
    borderRadius: 12,
    padding: 16,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactInfo: {
    flex: 1,
    marginRight: 12,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  compactDescription: {
    fontSize: 13,
    marginTop: 2,
  },
});
