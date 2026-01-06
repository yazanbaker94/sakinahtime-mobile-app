/**
 * MemorizationBadge
 * Small indicator showing memorization status of a verse/page/surah
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { MemorizationStatus } from '../../types/hifz';
import { MEMORIZATION_COLORS } from '../../constants/hifz';

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
      return isDark ? MEMORIZATION_COLORS.due_revision.dark : MEMORIZATION_COLORS.due_revision.light;
    }
    return isDark ? MEMORIZATION_COLORS[status].dark : MEMORIZATION_COLORS[status].light;
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
