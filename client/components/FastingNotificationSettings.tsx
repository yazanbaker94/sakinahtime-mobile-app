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
import { useTranslation } from '../hooks/useTranslation';

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
              <ThemedText type="body" style={{ fontWeight: '600' }}>{t('fasting.fastingReminders')}</ThemedText>
              <ThemedText type="small" secondary>
                {t('fasting.getNotifiedFasting')}
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
            <ThemedText type="body" style={{ fontWeight: '600' }}>{t('fasting.fastingReminders')}</ThemedText>
            <ThemedText type="small" secondary>
              {t('fasting.receiveReminders')}
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
              {t('fasting.reminderTime')}
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
                  {t('fasting.eveningBefore')}
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
                  {t('fasting.beforeFajr')}
                </ThemedText>
                <ThemedText type="caption" secondary>{t('fasting.thirtyMinBefore')}</ThemedText>
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

