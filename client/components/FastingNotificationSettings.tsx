/**
 * FastingNotificationSettings Component
 * 
 * Settings UI for configuring fasting day notifications.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useFastingNotifications } from '../hooks/useFastingNotifications';
import { FastingNotificationSettings as SettingsType } from '../services/FastingNotificationService';
import { ThemedText } from './ThemedText';
import { Feather } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '../constants/theme';
import { useTranslation } from '../hooks/useTranslation';
import { TactileSwitch } from './TactileSwitch';

interface FastingNotificationSettingsProps {
  compact?: boolean;
}

const FASTING_TYPE_KEYS: Record<keyof SettingsType['types'], { labelKey: string; descKey: string }> = {
  monday: { labelKey: 'fasting.monday', descKey: 'fasting.weeklySunnahFast' },
  thursday: { labelKey: 'fasting.thursday', descKey: 'fasting.weeklySunnahFast' },
  white_day: { labelKey: 'fasting.whiteDays', descKey: 'fasting.whiteDaysDesc' },
  ashura: { labelKey: 'fasting.ashura', descKey: 'fasting.ashuraDesc' },
  arafah: { labelKey: 'fasting.dayOfArafah', descKey: 'fasting.arafahDesc' },
  shawwal: { labelKey: 'fasting.shawwal', descKey: 'fasting.shawwalDesc' },
};

export function FastingNotificationSettings({ compact = false }: FastingNotificationSettingsProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
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
        backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
        borderWidth: 0,
        borderColor: 'transparent',
        elevation: isDark ? 0 : 3,
        shadowOpacity: isDark ? 0 : 0.04,
      }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View style={[styles.iconCircle, { backgroundColor: `${theme.gold}15` }]}>
              <Feather name="moon" size={20} color={theme.gold} />
            </View>
            <View style={styles.settingText}>
              <ThemedText type="body" style={{ fontWeight: '600' }}>{t('fasting.fastingReminders')}</ThemedText>
              <ThemedText type="small" secondary>
                {t('fasting.getNotifiedFasting')}
              </ThemedText>
            </View>
          </View>
          <TactileSwitch
            value={settings.enabled}
            onValueChange={toggleEnabled}
            trackColorFalse={theme.backgroundSecondary}
            trackColorTrue={theme.primary}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, {
      backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
      borderWidth: 0,
      borderColor: 'transparent',
      elevation: isDark ? 0 : 3,
      shadowOpacity: isDark ? 0 : 0.04,
    }]}>
      {/* Main Toggle */}
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.gold}15` }]}>
            <Feather name="moon" size={20} color={theme.gold} />
          </View>
          <View style={styles.settingText}>
            <ThemedText type="body" style={{ fontWeight: '600' }}>{t('fasting.fastingReminders')}</ThemedText>
            <ThemedText type="small" secondary>
              {t('fasting.receiveReminders')}
            </ThemedText>
          </View>
        </View>
        <TactileSwitch
          value={settings.enabled}
          onValueChange={toggleEnabled}
          trackColorFalse={theme.backgroundSecondary}
          trackColorTrue={theme.primary}
        />
      </View>

      {settings.enabled && (
        <>
          {/* Reminder Time */}
          <View style={styles.reminderTimeSection}>
            <ThemedText type="small" secondary style={{ fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm }}>
              {t('fasting.reminderTime')}
            </ThemedText>
            {/* Carved track wrapper */}
            <View style={[
              styles.reminderTimeOptions,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
                borderRadius: BorderRadius.lg,
                padding: 4,
                borderWidth: 0,
                borderTopWidth: 1.5,
                borderTopColor: isDark ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.04)',
              },
            ]}>
              <Pressable
                style={[
                  styles.reminderTimeOption,
                  {
                    backgroundColor: settings.reminderTime === 'evening'
                      ? (isDark ? theme.cardBackground : '#FFFFFF')
                      : 'transparent',
                    borderWidth: 0,
                    ...(settings.reminderTime === 'evening' ? {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      elevation: 3,
                    } : {}),
                  },
                ]}
                onPress={() => setReminderTime('evening')}
              >
                <ThemedText type="body" style={[
                  { fontWeight: '600' },
                  settings.reminderTime === 'evening'
                    ? { color: theme.primary }
                    : { opacity: 0.5 },
                ]}>
                  {t('fasting.eveningBefore')}
                </ThemedText>
                <ThemedText type="caption" style={[
                  settings.reminderTime === 'evening'
                    ? { color: theme.textSecondary }
                    : { opacity: 0.4 },
                ]}>8:00 PM</ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.reminderTimeOption,
                  {
                    backgroundColor: settings.reminderTime === 'morning'
                      ? (isDark ? theme.cardBackground : '#FFFFFF')
                      : 'transparent',
                    borderWidth: 0,
                    ...(settings.reminderTime === 'morning' ? {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      elevation: 3,
                    } : {}),
                  },
                ]}
                onPress={() => setReminderTime('morning')}
              >
                <ThemedText type="body" style={[
                  { fontWeight: '600' },
                  settings.reminderTime === 'morning'
                    ? { color: theme.primary }
                    : { opacity: 0.5 },
                ]}>
                  {t('fasting.beforeFajr')}
                </ThemedText>
                <ThemedText type="caption" style={[
                  settings.reminderTime === 'morning'
                    ? { color: theme.textSecondary }
                    : { opacity: 0.4 },
                ]}>{t('fasting.thirtyMinBefore')}</ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Fasting Types */}
          <View style={styles.fastingTypesSection}>
            <ThemedText type="small" secondary style={{ fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm }}>
              {t('fasting.fastingDays')}
            </ThemedText>
            {(Object.keys(FASTING_TYPE_KEYS) as Array<keyof SettingsType['types']>).map((type) => (
              <View key={type} style={styles.fastingTypeRow}>
                <View style={styles.fastingTypeInfo}>
                  <ThemedText type="body">{t(FASTING_TYPE_KEYS[type].labelKey)}</ThemedText>
                  <ThemedText type="caption" secondary>
                    {t(FASTING_TYPE_KEYS[type].descKey)}
                  </ThemedText>
                </View>
                <TactileSwitch
                  value={settings.types[type]}
                  onValueChange={(value) => toggleFastingType(type, value)}
                  trackColorFalse={theme.backgroundSecondary}
                  trackColorTrue={theme.primary}
                />
              </View>
            ))}
          </View>
        </>
      )}

      {permission !== 'granted' && settings.enabled && (
        <View style={[styles.permissionWarning, { backgroundColor: `${theme.gold}20` }]}>
          <ThemedText type="small" style={{ color: theme.gold, textAlign: 'center' }}>
            {t('fasting.notificationPermissionRequired')}
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
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 15,
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

