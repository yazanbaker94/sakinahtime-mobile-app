/**
 * NetworkStatusBadge Component
 * 
 * Small badge showing network connection status.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { NetworkStatus } from '../types/offline';

interface NetworkStatusBadgeProps {
  status: NetworkStatus;
  compact?: boolean;
}

export function NetworkStatusBadge({ status, compact = false }: NetworkStatusBadgeProps) {
  const { isDark } = useTheme();

  const getIcon = () => {
    if (!status.isConnected) return 'wifi-off';
    if (status.isWifi) return 'wifi';
    return 'smartphone';
  };

  const getColor = () => {
    if (!status.isConnected) return isDark ? '#F87171' : '#EF4444';
    return isDark ? '#34D399' : '#10B981';
  };

  const getLabel = () => {
    if (!status.isConnected) return 'Offline';
    if (status.isWifi) return 'WiFi';
    return 'Mobile';
  };

  const color = getColor();

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: `${color}20` }]}>
        <Feather name={getIcon() as any} size={12} color={color} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: `${color}15` }]}>
      <Feather name={getIcon() as any} size={14} color={color} />
      <ThemedText type="caption" style={{ color, marginLeft: 4, fontWeight: '500' }}>
        {getLabel()}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  compactContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
