/**
 * FastingDayBadge Component
 * 
 * Badge for different fasting day types, color-coded.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FastingDay } from '../types/hijri';
import { useTheme } from '../hooks/useTheme';

interface FastingDayBadgeProps {
  type: FastingDay['type'];
  compact?: boolean;
  isDark?: boolean;
}

export function FastingDayBadge({ type, compact = false, isDark: isDarkProp }: FastingDayBadgeProps) {
  const { isDark: themeIsDark, theme } = useTheme();
  const isDark = isDarkProp ?? themeIsDark;
  
  // Light mode colors
  const BADGE_CONFIG_LIGHT: Record<FastingDay['type'], { color: string; bgColor: string; label: string; shortLabel: string }> = {
    monday: { color: '#1D4ED8', bgColor: '#DBEAFE', label: 'Monday Fast', shortLabel: 'Mon' },
    thursday: { color: '#1D4ED8', bgColor: '#DBEAFE', label: 'Thursday Fast', shortLabel: 'Thu' },
    white_day: { color: '#7C3AED', bgColor: '#EDE9FE', label: 'White Day', shortLabel: 'WD' },
    ashura: { color: '#DC2626', bgColor: '#FEE2E2', label: 'Ashura', shortLabel: 'Ash' },
    arafah: { color: theme.primary, bgColor: `${theme.primary}26`, label: 'Arafah', shortLabel: 'Arf' },
    shawwal: { color: theme.gold, bgColor: `${theme.gold}26`, label: 'Shawwal', shortLabel: 'Shw' },
  };

  // Dark mode colors - brighter text, darker backgrounds
  const BADGE_CONFIG_DARK: Record<FastingDay['type'], { color: string; bgColor: string; label: string; shortLabel: string }> = {
    monday: { color: '#60A5FA', bgColor: 'rgba(59, 130, 246, 0.25)', label: 'Monday Fast', shortLabel: 'Mon' },
    thursday: { color: '#60A5FA', bgColor: 'rgba(59, 130, 246, 0.25)', label: 'Thursday Fast', shortLabel: 'Thu' },
    white_day: { color: '#A78BFA', bgColor: 'rgba(139, 92, 246, 0.25)', label: 'White Day', shortLabel: 'WD' },
    ashura: { color: '#F87171', bgColor: 'rgba(239, 68, 68, 0.25)', label: 'Ashura', shortLabel: 'Ash' },
    arafah: { color: theme.primary, bgColor: `${theme.primary}40`, label: 'Arafah', shortLabel: 'Arf' },
    shawwal: { color: theme.gold, bgColor: `${theme.gold}40`, label: 'Shawwal', shortLabel: 'Shw' },
  };
  
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
