import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useLocation } from '@/contexts/LocationContext';
import { Spacing, BorderRadius } from '@/constants/theme';

interface LocationIndicatorProps {
  variant?: 'default' | 'card';
}

export function LocationIndicator({ variant = 'default' }: LocationIndicatorProps) {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    city,
    country,
    locationMode,
    loading,
    permission,
    manualLocation,
  } = useLocation();

  const isManual = locationMode === 'manual';
  const hasNoLocation = !city && !loading;
  const gpsPermissionDenied = permission?.status === 'denied' && !permission?.canAskAgain;
  const shouldSuggestManual = (gpsPermissionDenied || hasNoLocation) && !manualLocation && locationMode === 'gps';

  const locationText = city && country
    ? `${city}, ${country}`
    : city || (loading ? 'Detecting location...' : (shouldSuggestManual ? 'Set your location' : 'Location unavailable'));

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('LocationSettings');
  };

  // Card variant - styled for inside the prayer card
  if (variant === 'card') {
    const shortLocationText = city || (loading ? 'Detecting...' : 'Set location');

    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.cardContainer,
          {
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Feather
          name={isManual ? 'edit-3' : 'map-pin'}
          size={14}
          color="#FFFFFF"
        />
        <ThemedText
          type="caption"
          style={styles.cardText}
          numberOfLines={1}
        >
          {shortLocationText}
        </ThemedText>
      </Pressable>
    );
  }

  // Default variant
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isDark
            ? (isManual ? `${theme.primary}15` : shouldSuggestManual ? `${theme.gold}15` : 'rgba(255,255,255,0.05)')
            : (isManual ? `${theme.primary}10` : shouldSuggestManual ? `${theme.gold}10` : 'rgba(0,0,0,0.03)'),
          borderColor: isDark
            ? (isManual ? `${theme.primary}30` : shouldSuggestManual ? `${theme.gold}30` : 'rgba(255,255,255,0.08)')
            : (isManual ? `${theme.primary}20` : shouldSuggestManual ? `${theme.gold}20` : 'rgba(0,0,0,0.06)'),
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        <Feather
          name={isManual ? 'edit-3' : shouldSuggestManual ? 'alert-circle' : 'navigation'}
          size={14}
          color={isManual ? theme.primary : shouldSuggestManual ? theme.gold : theme.textSecondary}
        />
        <ThemedText
          type="caption"
          style={[
            styles.text,
            { color: isManual ? theme.primary : shouldSuggestManual ? theme.gold : theme.text },
          ]}
        >
          {locationText}
        </ThemedText>
        {isManual && (
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <ThemedText type="caption" style={styles.badgeText}>
              Manual
            </ThemedText>
          </View>
        )}
        {shouldSuggestManual && (
          <View style={[styles.badge, { backgroundColor: theme.gold }]}>
            <ThemedText type="caption" style={styles.badgeText}>
              Tap to set
            </ThemedText>
          </View>
        )}
      </View>
      <Feather name="chevron-right" size={14} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  // Card variant styles
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  cardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
