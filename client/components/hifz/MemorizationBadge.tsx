/**
 * MemorizationBadge
 * Small indicator showing memorization status of a verse/page/surah
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { MemorizationStatus } from '../../types/hifz';

// Semantic colors for non-memorized statuses
const STATUS_COLORS = {
  not_started: {
    light: '#9CA3AF', // Gray
    dark: '#6B7280',
  },
  in_progress: {
    light: '#F59E0B', // Amber
    dark: '#FBBF24',
  },
  due_revision: {
    light: '#EF4444', // Red
    dark: '#F87171',
  },
};

interface MemorizationBadgeProps {
  status: MemorizationStatus;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  isDueForRevision?: boolean;
  style?: any;
}

export function MemorizationBadge({
  status,
  size = 'medium',
  showLabel = false,
  isDueForRevision = false,
  style,
}: MemorizationBadgeProps) {
  const { isDark, theme } = useTheme();

  const getColor = () => {
    if (isDueForRevision && status === 'memorized') {
      return isDark ? STATUS_COLORS.due_revision.dark : STATUS_COLORS.due_revision.light;
    }
    if (status === 'memorized') {
      return theme.primary;
    }
    return isDark ? STATUS_COLORS[status].dark : STATUS_COLORS[status].light;
  };

  const getLabel = () => {
    if (isDueForRevision && status === 'memorized') {
      return 'Due';
    }
    switch (status) {
      case 'not_started':
        return 'Not Started';
      case 'in_progress':
        return 'In Progress';
      case 'memorized':
        return 'Memorized';
      default:
        return '';
    }
  };

  const getIcon = () => {
    // Unicode circles for status
    switch (status) {
      case 'not_started':
        return '○'; // Empty circle
      case 'in_progress':
        return '◐'; // Half-filled circle
      case 'memorized':
        return isDueForRevision ? '◉' : '●'; // Filled circle (with dot if due)
      default:
        return '○';
    }
  };

  const badgeSize = size === 'small' ? 12 : size === 'large' ? 20 : 16;
  const fontSize = size === 'small' ? 10 : size === 'large' ? 14 : 12;
  const iconFontSize = size === 'small' ? 12 : size === 'large' ? 20 : 16;

  const color = getColor();

  return (
    <View 
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Memorization status: ${getLabel()}${isDueForRevision ? ', due for revision' : ''}`}
    >
      <Text style={[styles.icon, { color, fontSize: iconFontSize }]}>
        {getIcon()}
      </Text>
      {showLabel && (
        <Text style={[styles.label, { color, fontSize }]}>
          {getLabel()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontWeight: 'bold',
  },
  label: {
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default MemorizationBadge;
