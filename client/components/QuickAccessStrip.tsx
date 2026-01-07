/**
 * QuickAccessStrip Component
 * 
 * Horizontal scrollable row of category shortcuts for fast navigation.
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
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

// Short titles for compact display
const SHORT_TITLES: Record<string, string> = {
  morning: 'Morning',
  evening: 'Evening',
  'after-prayer': 'Prayer',
  sleep: 'Sleep',
  waking: 'Wake',
  general: 'General',
};

interface QuickAccessStripProps {
  categories: AzkarCategory[];
  onCategoryPress: (category: AzkarCategory) => void;
}

export function QuickAccessStrip({ categories, onCategoryPress }: QuickAccessStripProps) {
  const { theme } = useTheme();

  const getCategoryColor = (categoryId: string) => {
    if (categoryId === 'morning') {
      return theme.gold;
    }
    if (categoryId === 'evening') {
      return theme.primary;
    }
    return theme.textSecondary;
  };

  const getCategoryBgColor = (categoryId: string) => {
    if (categoryId === 'morning') {
      return `${theme.gold}20`;
    }
    if (categoryId === 'evening') {
      return `${theme.primary}15`;
    }
    return `${theme.primary}10`;
  };

  return (
    <View style={styles.container}>
      <ThemedText type="small" style={styles.sectionTitle} secondary>
        Quick Access
      </ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => onCategoryPress(category)}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: getCategoryBgColor(category.id),
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: getCategoryBgColor(category.id) },
              ]}
            >
              <Feather
                name={ICON_MAP[category.icon] || 'heart'}
                size={18}
                color={getCategoryColor(category.id)}
              />
            </View>
            <ThemedText
              type="caption"
              style={[
                styles.pillText,
                { color: getCategoryColor(category.id) },
              ]}
            >
              {SHORT_TITLES[category.id] || category.titleEn}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  scrollContent: {
    paddingRight: Spacing.lg,
    gap: Spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontWeight: '600',
    fontSize: 13,
  },
});

export default QuickAccessStrip;
