/**
 * TimeAwareHeroCard Component
 * 
 * Displays Morning or Evening azkar based on current time of day.
 * Features colored background, category info, and "Start Now" CTA.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import { useTimeAwareAzkar } from '@/hooks/useTimeAwareAzkar';

interface TimeAwareHeroCardProps {
  onPress: () => void;
}

export function TimeAwareHeroCard({ onPress }: TimeAwareHeroCardProps) {
  const { isDark } = useTheme();
  const { currentCategory, isMorning, estimatedDuration } = useTimeAwareAzkar();

  const backgroundColor = isDark
    ? isMorning ? 'rgba(212, 175, 55, 0.25)' : 'rgba(5, 150, 105, 0.3)'
    : isMorning ? 'rgba(212, 175, 55, 0.2)' : '#059669';

  const textColor = isDark
    ? '#fff'
    : isMorning ? Colors.light.text : '#fff';

  const secondaryTextColor = isDark
    ? 'rgba(255, 255, 255, 0.85)'
    : isMorning ? Colors.light.textSecondary : 'rgba(255, 255, 255, 0.9)';

  const icon = isMorning ? 'sunrise' : 'sunset';
  const description = isMorning
    ? 'Start your day with remembrance of Allah'
    : 'End your day with peace and gratitude';

  const ctaColor = isMorning
    ? isDark ? Colors.dark.gold : Colors.light.gold
    : isDark ? Colors.dark.primary : '#059669';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { 
          backgroundColor,
          opacity: pressed ? 0.9 : 1, 
          transform: [{ scale: pressed ? 0.98 : 1 }] 
        },
      ]}
    >
      {/* Icon and Title Row */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
          <Feather name={icon} size={28} color={textColor} />
        </View>
        <View style={styles.titleContainer}>
          <ThemedText type="h3" style={[styles.title, { color: textColor }]}>
            {currentCategory.titleEn}
          </ThemedText>
          <ThemedText type="arabic" style={[styles.arabicTitle, { color: secondaryTextColor }]}>
            {currentCategory.titleAr}
          </ThemedText>
        </View>
      </View>

      {/* Description */}
      <ThemedText type="body" style={[styles.description, { color: secondaryTextColor }]}>
        {description}
      </ThemedText>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Feather name="list" size={14} color={secondaryTextColor} />
          <ThemedText type="small" style={[styles.statText, { color: secondaryTextColor }]}>
            {currentCategory.count} adhkar
          </ThemedText>
        </View>
        <View style={styles.stat}>
          <Feather name="clock" size={14} color={secondaryTextColor} />
          <ThemedText type="small" style={[styles.statText, { color: secondaryTextColor }]}>
            ~{estimatedDuration} min
          </ThemedText>
        </View>
      </View>

      {/* CTA Button */}
      <View style={styles.ctaContainer}>
        <View style={styles.ctaButton}>
          <ThemedText type="body" style={[styles.ctaText, { color: ctaColor }]}>
            Start Now
          </ThemedText>
          <Feather name="arrow-right" size={18} color={ctaColor} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  title: {
    fontWeight: '700',
    marginBottom: 2,
  },
  arabicTitle: {
    fontSize: 16,
    fontFamily: 'AlMushafQuran',
  },
  description: {
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {},
  ctaContainer: {
    alignItems: 'flex-start',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  ctaText: {
    fontWeight: '600',
  },
});

export default TimeAwareHeroCard;
