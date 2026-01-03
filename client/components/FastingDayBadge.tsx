/**
 * FastingDayBadge Component
 * 
 * Badge for different fasting day types, color-coded.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FastingDay } from '../types/hijri';

interface FastingDayBadgeProps {
  type: FastingDay['type'];
  compact?: boolean;
  isDark?: boolean;
}

// Light mode colors
const BADGE_CONFIG_LIGHT: Record<FastingDay['type'], { color: string; bgColor: string; label: string; shortLabel: string }> = {
  monday: { color: '#1D4ED8', bgColor: '#DBEAFE', label: 'Monday Fast', shortLabel: 'Mon' },
  thursday: { color: '#1D4ED8', bgColor: '#DBEAFE', label: 'Thursday Fast', shortLabel: 'Thu' },
  white_day: { color: '#7C3AED', bgColor: '#EDE9FE', label: 'White Day', shortLabel: 'WD' },
  ashura: { color: '#DC2626', bgColor: '#FEE2E2', label: 'Ashura', shortLabel: 'Ash' },
  arafah: { color: '#059669', bgColor: '#D1FAE5', label: 'Arafah', shortLabel: 'Arf' },
  shawwal: { color: '#D97706', bgColor: '#FEF3C7', label: 'Shawwal', shortLabel: 'Shw' },
};

// Dark mode colors - brighter text, darker backgrounds
const BADGE_CONFIG_DARK: Record<FastingDay['type'], { color: string; bgColor: string; label: string; shortLabel: string }> = {
  monday: { color: '#60A5FA', bgColor: 'rgba(59, 130, 246, 0.25)', label: 'Monday Fast', shortLabel: 'Mon' },
  thursday: { color: '#60A5FA', bgColor: 'rgba(59, 130, 246, 0.25)', label: 'Thursday Fast', shortLabel: 'Thu' },
  white_day: { color: '#A78BFA', bgColor: 'rgba(139, 92, 246, 0.25)', label: 'White Day', shortLabel: 'WD' },
  ashura: { color: '#F87171', bgColor: 'rgba(239, 68, 68, 0.25)', label: 'Ashura', shortLabel: 'Ash' },
  arafah: { color: '#34D399', bgColor: 'rgba(16, 185, 129, 0.25)', label: 'Arafah', shortLabel: 'Arf' },
  shawwal: { color: '#FBBF24', bgColor: 'rgba(245, 158, 11, 0.25)', label: 'Shawwal', shortLabel: 'Shw' },
};

export function FastingDayBadge({ type, compact = false, isDark = false }: FastingDayBadgeProps) {
  const config = isDark ? BADGE_CONFIG_DARK[type] : BADGE_CONFIG_LIGHT[type];
  
  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
      <Text style={[styles.text, { color: config.color }]}>
        {compact ? config.shortLabel : config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
