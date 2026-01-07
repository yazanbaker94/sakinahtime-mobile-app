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

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: isDark ? `${theme.primary}33` : theme.backgroundDefault,
        elevation: isDark ? 0 : 3,
        shadowOpacity: isDark ? 0 : 0.08,
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
          Download Settings
        </ThemedText>
      </View>

      {/* Storage Limit */}
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <ThemedText type="small" style={{ fontWeight: '500' }}>
            Storage Limit
          </ThemedText>
          <ThemedText type="caption" secondary>
            Maximum space for offline content
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.presetContainer}>
        {STORAGE_PRESETS.map((preset) => (
          <Pressable
            key={preset.value}
            style={[
              styles.presetButton,
              {
                backgroundColor: settings.storageLimit === preset.value
                  ? `${theme.primary}33`
                  : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'),
                borderWidth: settings.storageLimit === preset.value ? 2 : 1,
                borderColor: settings.storageLimit === preset.value
                  ? theme.primary
                  : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
              }
            ]}
            onPress={() => onSettingsChange({ storageLimit: preset.value })}
          >
            <ThemedText 
              type="small" 
              style={{ 
                fontWeight: settings.storageLimit === preset.value ? '600' : '400',
                color: settings.storageLimit === preset.value 
                  ? theme.primary
                  : theme.text,
              }}
            >
              {preset.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={styles.divider} />

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
              Download over WiFi only
            </ThemedText>
          </View>
          <ThemedText type="caption" secondary>
            Save mobile data by downloading only on WiFi
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
              Auto-delete old cache
            </ThemedText>
          </View>
          <ThemedText type="caption" secondary>
            Automatically remove old cached data when limit is reached
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
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
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  presetButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
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
