/**
 * CompactCategoryCard Component
 * 
 * Smaller category card for the grid layout with 3D icon, titles, and count.
 * Borderless clay tile design with soft drop-shadow.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
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

interface CompactCategoryCardProps {
  category: AzkarCategory;
  onPress: () => void;
}

export function CompactCategoryCard({ category, onPress }: CompactCategoryCardProps) {
  const { isDark, theme } = useTheme();
  const { t, locale } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.04,
          shadowRadius: 20,
          // Android elevation creates visible "box" outlines in dark mode — skip it
          elevation: isDark ? 0 : 2,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      {/* 3D Icon */}
      <Image
        source={CATEGORY_3D_ICONS[category.id] || CATEGORY_3D_ICONS.general}
        style={{ width: 44, height: 44, marginBottom: Spacing.sm }}
        contentFit="contain"
        transition={0}
        cachePolicy="memory"
      />

      {/* Title - locale aware via i18n */}
      <ThemedText type={locale === 'ar' ? 'arabic' : 'body'}
        style={[locale === 'ar' ? styles.titleAr : styles.titleEn, locale === 'ar' && { fontFamily: 'AlMushafQuran' }]}
        numberOfLines={1}
      >
        {t(`azkarCategories.${category.id}`)}
      </ThemedText>

      {/* Count Badge */}
      <View style={styles.countContainer}>
        <ThemedText type="caption" secondary>
          {category.count} {t('azkar.adhkarCount')}
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
