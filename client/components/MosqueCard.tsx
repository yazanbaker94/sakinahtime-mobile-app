/**
 * MosqueCard - Compact card component for mosque list items
 * Displays mosque name, distance, rating, and open/closed status
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';
import { Mosque } from '@/types/mosque';
import { formatDistance } from '@/constants/mosque';
import * as Haptics from 'expo-haptics';

export interface MosqueCardProps {
  mosque: Mosque;
  onPress: () => void;
  onDirections: () => void;
}

export function MosqueCard({ mosque, onPress, onDirections }: MosqueCardProps) {
  const { isDark, theme } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const handleDirections = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDirections();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.backgroundSecondary,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
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

            {/* Open/Closed Status */}
            {mosque.isOpen !== undefined && (
              <View style={[
                styles.statusBadge,
                {
                  backgroundColor: mosque.isOpen 
                    ? `${theme.primary}26`
                    : (isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.1)'),
                }
              ]}>
                <ThemedText 
                  type="small" 
                  style={{ 
                    color: mosque.isOpen 
                      ? theme.primary
                      : '#EF4444',
                    fontWeight: '600',
                  }}
                >
                  {mosque.isOpen ? 'Open' : 'Closed'}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Address */}
          <ThemedText type="small" secondary numberOfLines={1} style={styles.address}>
            {mosque.address}
          </ThemedText>
        </View>

        {/* Directions Button */}
        <Pressable
          onPress={handleDirections}
          style={({ pressed }) => [
            styles.directionsButton,
            {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          hitSlop={8}
        >
          <Feather name="navigation" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
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
