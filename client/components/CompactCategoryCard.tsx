/**
 * CompactCategoryCard Component
 * 
 * Smaller category card for the grid layout with icon, titles, and count.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { AzkarCategory } from '@/data/azkar';

const ICON_MAP: Record<string, keyof typeof Feather.glyphMap> = {
  sunrise: 'sunrise',
  sunset: 'sunset',
  heart: 'heart',
  moon: 'moon',
  sun: 'sun',
  star: 'star',
};

interface CompactCategoryCardProps {
  category: AzkarCategory;
  onPress: () => void;
}

export function CompactCategoryCard({ category, onPress }: CompactCategoryCardProps) {
  const { isDark, theme } = useTheme();

  const getIconColor = () => {
    if (category.id === 'morning') {
      return theme.gold;
    }
    if (category.id === 'evening') {
      return theme.primary;
    }
    return theme.textSecondary;
  };

  const getIconBgColor = () => {
    if (category.id === 'morning') {
      return `${theme.gold}33`;
    }
    if (category.id === 'evening') {
      return `${theme.primary}33`;
    }
    return `${theme.primary}15`;
  };

  const cardBgColor = isDark
    ? `${theme.primary}20`
    : theme.backgroundDefault;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: cardBgColor },
        {
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: getIconBgColor() }]}>
        <Feather
          name={ICON_MAP[category.icon] || 'heart'}
          size={22}
          color={getIconColor()}
        />
      </View>

      {/* Titles */}
      <ThemedText type="body" style={styles.titleEn} numberOfLines={1}>
        {category.titleEn}
      </ThemedText>
      <ThemedText
        type="arabic"
        secondary
        style={[styles.titleAr, { fontFamily: 'AlMushafQuran' }]}
        numberOfLines={1}
      >
        {category.titleAr}
      </ThemedText>

      {/* Count Badge */}
      <View style={styles.countContainer}>
        <ThemedText type="caption" secondary>
          {category.count} adhkar
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '47%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  titleEn: {
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 2,
    fontSize: 14,
  },
  titleAr: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  countContainer: {
    marginTop: Spacing.xs,
  },
});

export default CompactCategoryCard;
