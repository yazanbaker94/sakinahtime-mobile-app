/**
 * StorageSettingsCard Component
 * 
 * Settings card for storage management options.
 */

import React from 'react';
import { View, StyleSheet, Switch, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Spacing, BorderRadius } from '@/constants/theme';
import { OfflineSettings } from '../types/offline';
import { formatBytes, STORAGE_LIMITS } from '../constants/offline';

interface StorageSettingsCardProps {
  settings: OfflineSettings;
  onSettingsChange: (settings: Partial<OfflineSettings>) => void;
}

const STORAGE_PRESETS = [
  { label: '500 MB', value: 500 * 1024 * 1024 },
  { label: '1 GB', value: 1024 * 1024 * 1024 },
  { label: '2 GB', value: 2 * 1024 * 1024 * 1024 },
  { label: '5 GB', value: 5 * 1024 * 1024 * 1024 },
];

export function StorageSettingsCard({ settings, onSettingsChange }: StorageSettingsCardProps) {
  const { isDark, theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isDark ? `${theme.primary}33` : '#FFFFFF',
        borderWidth: 0,
        borderColor: 'transparent',
        elevation: isDark ? 0 : 2,
        shadowOpacity: isDark ? 0 : 0.05,
      }
    ]}>
      <View style={styles.header}>
        <View style={[
          styles.iconCircle,
          { backgroundColor: `${theme.primary}26` }
        ]}>
          <Feather
            name="settings"
            size={20}
            color={theme.primary}
          />
        </View>
        <ThemedText type="body" style={{ fontWeight: '600' }}>
          {t('storageSettings.downloadSettings')}
        </ThemedText>
      </View>

      {/* Storage Limit */}
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <ThemedText type="small" style={{ fontWeight: '500' }}>
            {t('storageSettings.storageLimit')}
          </ThemedText>
          <ThemedText type="caption" secondary>
            {t('storageSettings.maxSpace')}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.presetContainer, {
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#EDEFF2',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
      }]}>
        {STORAGE_PRESETS.map((preset) => {
          const isActive = settings.storageLimit === preset.value;
          return (
            <Pressable
              key={preset.value}
              style={[
                styles.presetButton,
                isActive && {
                  backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.1,
                  shadowRadius: 6,
                  elevation: 3,
                  borderWidth: 0,
                },
              ]}
              onPress={() => onSettingsChange({ storageLimit: preset.value })}
            >
              <ThemedText
                type="small"
                style={{
                  fontWeight: isActive ? '700' : '400',
                  color: isActive
                    ? (isDark ? '#FFFFFF' : theme.text)
                    : (isDark ? '#A0A0A0' : '#888'),
                }}
              >
                {preset.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: Spacing.md }} />

      {/* WiFi Only */}
      <View style={styles.toggleRow}>
        <View style={styles.settingInfo}>
          <View style={styles.settingLabel}>
            <Feather
              name="wifi"
              size={16}
              color={theme.textSecondary}
            />
            <ThemedText type="small" style={{ fontWeight: '500', marginLeft: Spacing.xs }}>
              {t('storageSettings.wifiOnly')}
            </ThemedText>
          </View>
          <ThemedText type="caption" secondary>
            {t('storageSettings.wifiOnlyDesc')}
          </ThemedText>
        </View>
        <Switch
          value={settings.wifiOnlyDownloads}
          onValueChange={(value) => onSettingsChange({ wifiOnlyDownloads: value })}
          trackColor={{
            false: isDark ? 'rgba(255, 255, 255, 0.2)' : '#E5E7EB',
            true: `${theme.primary}80`,
          }}
          thumbColor={settings.wifiOnlyDownloads
            ? theme.primary
            : (isDark ? '#9CA3AF' : '#F3F4F6')
          }
        />
      </View>

      <View style={styles.divider} />

      {/* Auto Delete */}
      <View style={styles.toggleRow}>
        <View style={styles.settingInfo}>
          <View style={styles.settingLabel}>
            <Feather
              name="trash-2"
              size={16}
              color={theme.textSecondary}
            />
            <ThemedText type="small" style={{ fontWeight: '500', marginLeft: Spacing.xs }}>
              {t('storageSettings.autoDelete')}
            </ThemedText>
          </View>
          <ThemedText type="caption" secondary>
            {t('storageSettings.autoDeleteDesc')}
          </ThemedText>
        </View>
        <Switch
          value={settings.autoDeleteOldCache}
          onValueChange={(value) => onSettingsChange({ autoDeleteOldCache: value })}
          trackColor={{
            false: isDark ? 'rgba(255, 255, 255, 0.2)' : '#E5E7EB',
            true: `${theme.primary}80`,
          }}
          thumbColor={settings.autoDeleteOldCache
            ? theme.primary
            : (isDark ? '#9CA3AF' : '#F3F4F6')
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    // elevation and shadowOpacity set dynamically
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingRow: {
    marginBottom: Spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  presetContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  presetButton: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    borderWidth: 0,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    marginVertical: Spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
