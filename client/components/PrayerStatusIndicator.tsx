import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { PrayerStatus, PRAYER_STATUS_INFO } from '../types/prayerLog';
import { useTheme } from '../hooks/useTheme';

interface PrayerStatusIndicatorProps {
  status: PrayerStatus;
  onStatusChange: (status: PrayerStatus) => void;
  size?: 'compact' | 'normal';
  showLabels?: boolean;
  disabled?: boolean;
}

// Status options to display (excludes 'unmarked' since that's the default/unselected state)
const STATUS_OPTIONS: Array<{ status: PrayerStatus; icon: string; color: string; label: string }> = [
  { status: 'prayed', icon: 'check', color: '#10B981', label: 'Prayed' },
  { status: 'missed', icon: 'x', color: '#EF4444', label: 'Missed' },
  { status: 'late', icon: 'clock', color: '#F59E0B', label: 'Late' },
];

// Legacy function for backwards compatibility
export function getNextStatus(current: PrayerStatus): PrayerStatus {
  const cycle: PrayerStatus[] = ['unmarked', 'prayed', 'missed', 'late'];
  const currentIndex = cycle.indexOf(current);
  const nextIndex = (currentIndex + 1) % cycle.length;
  return cycle[nextIndex];
}

export function PrayerStatusIndicator({
  status,
  onStatusChange,
  size = 'compact',
  showLabels = false,
  disabled = false,
}: PrayerStatusIndicatorProps) {
  const { theme, isDark } = useTheme();

  const sizeConfig = {
    compact: { button: 28, icon: 14, gap: 6, fontSize: 9 },
    normal: { button: 36, icon: 18, gap: 8, fontSize: 11 },
  };

  const config = sizeConfig[size];

  const handlePress = (newStatus: PrayerStatus) => {
    if (disabled) return;

    // If same status, toggle back to unmarked
    if (status === newStatus) {
      onStatusChange('unmarked');
    } else {
      onStatusChange(newStatus);
    }
  };

  return (
    <View style={[styles.container, { gap: config.gap }]}>
      {STATUS_OPTIONS.map((option) => {
        const isSelected = status === option.status;

        return (
          <View key={option.status} style={styles.buttonWrapper}>
            <Pressable
              onPress={() => handlePress(option.status)}
              disabled={disabled}
              style={({ pressed }) => [
                styles.button,
                {
                  width: config.button,
                  height: config.button,
                  borderRadius: config.button / 2,
                  backgroundColor: isSelected
                    ? option.color
                    : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'),
                  borderWidth: isSelected ? 0 : 1.5,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                  opacity: pressed ? 0.7 : (disabled ? 0.4 : 1),
                },
              ]}
            >
              <Feather
                name={option.icon as any}
                size={config.icon}
                color={isSelected ? '#FFFFFF' : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)')}
              />
            </Pressable>
            {showLabels && (
              <ThemedText
                type="caption"
                style={[
                  styles.label,
                  {
                    fontSize: config.fontSize,
                    color: isSelected ? option.color : theme.textSecondary,
                    fontWeight: isSelected ? '600' : '400',
                  },
                ]}
              >
                {option.label}
              </ThemedText>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonWrapper: {
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 2,
    textAlign: 'center',
  },
});

export default PrayerStatusIndicator;
