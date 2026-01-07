/**
 * DailyDhikrCard Component
 * 
 * Featured dhikr that rotates daily to encourage learning new remembrances.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useDailyDhikr } from '@/hooks/useDailyDhikr';

interface DailyDhikrCardProps {
  onPress: () => void;
}

export function DailyDhikrCard({ onPress }: DailyDhikrCardProps) {
  const { isDark, theme } = useTheme();
  const { dhikr } = useDailyDhikr();

  const bgColor = isDark
    ? `${theme.primary}33`
    : theme.backgroundDefault;

  const accentColor = theme.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: bgColor },
        { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      {/* Decorative corner */}
      <View style={[styles.decorativeCorner, { borderColor: accentColor }]} />

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${accentColor}20` }]}>
          <Feather name="star" size={18} color={accentColor} />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="body" style={{ fontWeight: '600' }}>
            Daily Dhikr
          </ThemedText>
          <ThemedText type="caption" secondary>
            Today's featured remembrance
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </View>

      {/* Arabic Text */}
      <View style={styles.arabicContainer}>
        <ThemedText
          type="arabic"
          style={[styles.arabicText, { fontFamily: 'AlMushafQuran' }]}
          numberOfLines={2}
        >
          {dhikr.textAr}
        </ThemedText>
      </View>

      {/* Translation */}
      <ThemedText
        type="small"
        secondary
        style={styles.translation}
        numberOfLines={2}
      >
        {dhikr.translation}
      </ThemedText>

      {/* Footer with source */}
      <View style={styles.footer}>
        <View style={[styles.sourceBadge, { backgroundColor: `${accentColor}15` }]}>
          <Feather name="book" size={12} color={accentColor} />
          <ThemedText type="caption" style={{ color: accentColor, marginLeft: 4 }}>
            {dhikr.source}
          </ThemedText>
        </View>
        {dhikr.repetitions > 0 && (
          <View style={[styles.repetitionBadge, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
            <ThemedText type="caption" style={{ color: isDark ? '#FBBF24' : '#F59E0B' }}>
              ×{dhikr.repetitions}
            </ThemedText>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderTopRightRadius: BorderRadius.lg,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  arabicContainer: {
    paddingVertical: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(128, 128, 128, 0.3)',
    paddingLeft: Spacing.md,
    marginBottom: Spacing.sm,
  },
  arabicText: {
    fontSize: 22,
    lineHeight: 38,
    textAlign: 'right',
  },
  translation: {
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  repetitionBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
});

export default DailyDhikrCard;
