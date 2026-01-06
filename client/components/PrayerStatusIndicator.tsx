/**
 * PrayerStatusIndicator Component
 * Displays and toggles prayer status (prayed/missed/late/unmarked)
 * Feature: prayer-log-statistics
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PrayerStatus, PRAYER_STATUS_INFO } from '../types/prayerLog';
import { useTheme } from '../hooks/useTheme';

interface PrayerStatusIndicatorProps {
  status: PrayerStatus;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

const STATUS_CYCLE: PrayerStatus[] = ['unmarked', 'prayed', 'missed', 'late'];

export function getNextStatus(current: PrayerStatus): PrayerStatus {
  const currentIndex = STATUS_CYCLE.indexOf(current);
  const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
  return STATUS_CYCLE[nextIndex];
}

export function PrayerStatusIndicator({
  status,
  onPress,
  size = 'medium',
  disabled = false,
}: PrayerStatusIndicatorProps) {
  const { isDark } = useTheme();
  const statusInfo = PRAYER_STATUS_INFO[status];

  const sizeConfig = {
    small: { container: 28, icon: 16 },
    medium: { container: 36, icon: 20 },
    large: { container: 44, icon: 24 },
  };

  const { container: containerSize, icon: iconSize } = sizeConfig[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
          backgroundColor: status === 'unmarked'
            ? (isDark ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.1)')
            : `${statusInfo.color}20`,
          borderWidth: 2,
          borderColor: statusInfo.color,
          opacity: pressed ? 0.7 : (disabled ? 0.5 : 1),
        },
      ]}
    >
      <Feather
        name={statusInfo.icon as any}
        size={iconSize}
        color={statusInfo.color}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PrayerStatusIndicator;
