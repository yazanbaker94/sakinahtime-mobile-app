/**
 * QuickAccessStrip Component
 * 
 * Horizontal scrollable row of category shortcuts with 3D icons and clay pill design.
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Spacing, BorderRadius } from '@/constants/theme';
import { AzkarCategory } from '@/data/azkar';

// Map category IDs to 3D icon assets
const CATEGORY_3D_ICONS: Record<string, any> = {
  morning: require('../../assets/images/islamic-calendar-icons/dawn.webp'),
  evening: require('../../assets/images/islamic-calendar-icons/sunset.webp'),
  sleep: require('../../assets/images/islamic-calendar-icons/night.webp'),
  'after-prayer': require('../../assets/images/3d-images/AfterPrayer.webp'),
  waking: require('../../assets/images/3d-images/WakingUp.webp'),
  general: require('../../assets/images/3d-images/GeneralAzkar.webp'),
};

interface QuickAccessStripProps {
  categories: AzkarCategory[];
  onCategoryPress: (category: AzkarCategory) => void;
}

export function QuickAccessStrip({ categories, onCategoryPress }: QuickAccessStripProps) {
  const { isDark, theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ThemedText type="small" style={styles.sectionTitle} secondary>
        {t('quickAccess.title')}
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
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: isDark ? 0 : 2,
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
          >
            <Image
              source={CATEGORY_3D_ICONS[category.id] || CATEGORY_3D_ICONS.general}
              style={{ width: 26, height: 26 }}
              contentFit="contain"
              transition={0}
              cachePolicy="memory"
            />
            <ThemedText
              type="caption"
              style={[
                styles.pillText,
                { color: theme.text },
              ]}
            >
              {t(`quickAccess.${category.id === 'after-prayer' ? 'prayer' : category.id === 'waking' ? 'wake' : category.id}`) || category.titleEn}
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
    borderWidth: 0,
    borderColor: 'transparent',
    gap: Spacing.xs,
  },
  pillText: {
    fontWeight: '600',
    fontSize: 13,
  },
});

export default QuickAccessStrip;
