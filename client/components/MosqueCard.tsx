/**
 * MosqueCard - Compact card component for mosque list items
 * Displays mosque name, distance, next prayer time, and directions button
 */

import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';
import { Mosque } from '@/types/mosque';
import { formatDistance } from '@/constants/mosque';
import { useTranslation } from '@/hooks/useTranslation';
import * as Haptics from 'expo-haptics';

export interface MosqueCardProps {
  mosque: Mosque;
  onPress: () => void;
  onDirections: () => void;
  nextPrayerName?: string;
  nextPrayerTimeUntil?: { hours: number; minutes: number };
}

export function MosqueCard({ mosque, onPress, onDirections, nextPrayerName, nextPrayerTimeUntil }: MosqueCardProps) {
  const { isDark, theme } = useTheme();
  const { t } = useTranslation();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const handleDirections = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDirections();
  };

  // Format prayer time badge text
  const prayerBadgeText = nextPrayerName && nextPrayerTimeUntil
    ? nextPrayerTimeUntil.hours > 0
      ? `${nextPrayerName} ${t('mosqueFinder.inTime') || 'in'} ${nextPrayerTimeUntil.hours}h ${nextPrayerTimeUntil.minutes}m`
      : `${nextPrayerName} ${t('mosqueFinder.inTime') || 'in'} ${nextPrayerTimeUntil.minutes}m`
    : null;

  return (
    /* Shadow wrapper — platform-conditional */
    <View style={{
      marginBottom: Spacing.md,
      borderRadius: 16,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 15,
        },
        android: {
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          backgroundColor: isDark ? theme.backgroundSecondary : '#FFFFFF',
        },
      }),
    }}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [{
          backgroundColor: isDark ? theme.backgroundSecondary : '#FFFFFF',
          borderRadius: 16,
          overflow: 'hidden',
          borderLeftWidth: 4,
          borderLeftColor: theme.primary,
          borderTopWidth: 0,
          borderRightWidth: 0,
          borderBottomWidth: 0,
          opacity: pressed ? 0.85 : 1,
        }]}
      >
        <View style={styles.content}>
          {/* Main Info */}
          <View style={styles.mainInfo}>
            <ThemedText type="body" style={styles.name} numberOfLines={1}>
              {mosque.name}
            </ThemedText>

            <View style={styles.detailsRow}>
              {/* Distance */}
              <View style={styles.detailItem}>
                <Feather
                  name="map-pin"
                  size={14}
                  color={theme.textSecondary}
                />
                <ThemedText type="small" secondary style={styles.detailText}>
                  {formatDistance(mosque.distance)}
                </ThemedText>
              </View>

              {/* Rating */}
              {mosque.rating !== undefined && (
                <View style={styles.detailItem}>
                  <Feather
                    name="star"
                    size={14}
                    color="#F59E0B"
                  />
                  <ThemedText type="small" secondary style={styles.detailText}>
                    {mosque.rating.toFixed(1)}
                    {mosque.reviewCount !== undefined && ` (${mosque.reviewCount})`}
                  </ThemedText>
                </View>
              )}

              {/* Prayer Time Badge — the killer differentiator */}
              {prayerBadgeText && (
                <View style={[
                  styles.statusBadge,
                  {
                    backgroundColor: `${theme.primary}15`,
                  }
                ]}>
                  <ThemedText
                    type="small"
                    style={{
                      color: theme.primary,
                      fontWeight: '600',
                    }}
                  >
                    {prayerBadgeText}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Address */}
            <ThemedText type="small" secondary numberOfLines={1} style={styles.address}>
              {mosque.address}
            </ThemedText>
          </View>

          {/* Directions Button — platform-conditional shadow */}
          <View style={{
            borderRadius: 22,
            ...Platform.select({
              ios: {
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
              },
              android: {},
            }),
          }}>
            <Pressable
              onPress={handleDirections}
              style={({ pressed }) => [styles.directionsButton, {
                backgroundColor: theme.primary,
                overflow: 'hidden',
                opacity: pressed ? 0.8 : 1,
              }]}
              hitSlop={8}
            >
              <Feather name="navigation" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  mainInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  name: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    marginLeft: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  address: {
    marginTop: Spacing.xs,
  },
  directionsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
