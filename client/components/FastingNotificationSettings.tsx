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
  const { isDark } = useTheme();
  const {
    settings,
    loading,
    permission,
    toggleEnabled,
    toggleFastingType,
    setReminderTime,
    sendTestNotification,
  } = useFastingNotifications();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
        <ActivityIndicator size="small" color={isDark ? '#34D399' : '#059669'} />
      </View>
    );
  }

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
        <View style={styles.compactRow}>
          <View style={styles.compactInfo}>
            <Text style={[styles.compactTitle, { color: isDark ? '#F9FAFB' : '#1F2937' }]}>Fasting Reminders</Text>
            <Text style={[styles.compactDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Get notified about upcoming fasting days
            </Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={toggleEnabled}
            trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: isDark ? '#065F46' : '#A7F3D0' }}
            thumbColor={settings.enabled ? (isDark ? '#34D399' : '#059669') : (isDark ? '#6B7280' : '#9CA3AF')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
      <Text style={[styles.sectionTitle, { color: isDark ? '#F9FAFB' : '#1F2937' }]}>Fasting Reminders</Text>
      
      {/* Main Toggle */}
      <View style={[styles.settingRow, { borderBottomColor: isDark ? '#374151' : '#F3F4F6' }]}>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingLabel, { color: isDark ? '#F9FAFB' : '#1F2937' }]}>Enable Notifications</Text>
          <Text style={[styles.settingDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Receive reminders for recommended fasting days
          </Text>
        </View>
        <Switch
          value={settings.enabled}
          onValueChange={toggleEnabled}
          trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: isDark ? '#065F46' : '#A7F3D0' }}
          thumbColor={settings.enabled ? (isDark ? '#34D399' : '#059669') : (isDark ? '#6B7280' : '#9CA3AF')}
        />
      </View>

      {settings.enabled && (
        <>
          {/* Reminder Time */}
          <View style={styles.reminderTimeSection}>
            <Text style={[styles.subsectionTitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Reminder Time</Text>
            <View style={styles.reminderTimeOptions}>
              <TouchableOpacity
                style={[
                  styles.reminderTimeOption,
                  { backgroundColor: isDark ? '#374151' : '#F3F4F6' },
                  settings.reminderTime === 'evening' && { 
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5',
                    borderWidth: 2,
                    borderColor: isDark ? '#34D399' : '#059669',
                  },
                ]}
                onPress={() => setReminderTime('evening')}
              >
                <Text style={[
                  styles.reminderTimeText,
                  { color: isDark ? '#9CA3AF' : '#6B7280' },
                  settings.reminderTime === 'evening' && { color: isDark ? '#34D399' : '#059669' },
                ]}>
                  Evening Before
                </Text>
                <Text style={[styles.reminderTimeSubtext, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>8:00 PM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.reminderTimeOption,
                  { backgroundColor: isDark ? '#374151' : '#F3F4F6' },
                  settings.reminderTime === 'morning' && { 
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5',
                    borderWidth: 2,
                    borderColor: isDark ? '#34D399' : '#059669',
                  },
                ]}
                onPress={() => setReminderTime('morning')}
              >
                <Text style={[
                  styles.reminderTimeText,
                  { color: isDark ? '#9CA3AF' : '#6B7280' },
                  settings.reminderTime === 'morning' && { color: isDark ? '#34D399' : '#059669' },
                ]}>
                  Morning Of
                </Text>
                <Text style={[styles.reminderTimeSubtext, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>5:00 AM</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Fasting Types */}
          <View style={styles.fastingTypesSection}>
            <Text style={[styles.subsectionTitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Fasting Days</Text>
            {(Object.keys(FASTING_TYPE_LABELS) as Array<keyof SettingsType['types']>).map((type) => (
              <View key={type} style={styles.fastingTypeRow}>
                <View style={styles.fastingTypeInfo}>
                  <Text style={[styles.fastingTypeLabel, { color: isDark ? '#F9FAFB' : '#1F2937' }]}>
                    {FASTING_TYPE_LABELS[type].label}
                  </Text>
                  <Text style={[styles.fastingTypeDescription, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
                    {FASTING_TYPE_LABELS[type].description}
                  </Text>
                </View>
                <Switch
                  value={settings.types[type]}
                  onValueChange={(value) => toggleFastingType(type, value)}
                  trackColor={{ false: isDark ? '#374151' : '#D1D5DB', true: isDark ? '#065F46' : '#A7F3D0' }}
                  thumbColor={settings.types[type] ? (isDark ? '#34D399' : '#059669') : (isDark ? '#6B7280' : '#9CA3AF')}
                />
              </View>
            ))}
          </View>
        </>
      )}

      {permission !== 'granted' && settings.enabled && (
        <View style={[styles.permissionWarning, { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : '#FEF3C7' }]}>
          <Text style={[styles.permissionWarningText, { color: isDark ? '#FBBF24' : '#92400E' }]}>
            ⚠️ Notification permission required
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
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
    color: '#1F2937',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  reminderTimeSection: {
    marginTop: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
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
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  reminderTimeOptionActive: {
    backgroundColor: '#D1FAE5',
    borderWidth: 2,
    borderColor: '#059669',
  },
  reminderTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  reminderTimeTextActive: {
    color: '#059669',
  },
  reminderTimeSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
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
    color: '#1F2937',
  },
  fastingTypeDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  permissionWarning: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  permissionWarningText: {
    fontSize: 13,
    color: '#92400E',
    textAlign: 'center',
  },
  compactContainer: {
    backgroundColor: '#FFFFFF',
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
    color: '#1F2937',
  },
  compactDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});
