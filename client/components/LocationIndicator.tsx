import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Modal, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useLocation } from '@/contexts/LocationContext';
import { CitySearchModal } from '@/components/CitySearchModal';
import { Spacing, BorderRadius } from '@/constants/theme';
import type { ManualLocation } from '@/types/location';

interface LocationIndicatorProps {
  variant?: 'default' | 'card';
}

export function LocationIndicator({ variant = 'default' }: LocationIndicatorProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    city,
    country,
    locationMode,
    loading,
    permission,
    manualLocation,
    recentLocations,
    gpsCity,
    gpsCountry,
    setManualLocation,
    setLocationMode,
    requestPermission,
  } = useLocation();
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showCitySearch, setShowCitySearch] = useState(false);

  const isManual = locationMode === 'manual';
  const hasNoLocation = !city && !loading;
  const gpsPermissionDenied = permission?.status === 'denied' && !permission?.canAskAgain;
  const shouldSuggestManual = (gpsPermissionDenied || hasNoLocation) && !manualLocation && locationMode === 'gps';

  const locationText = city && country
    ? `${city}, ${country}`
    : city || (loading ? 'Detecting location...' : (shouldSuggestManual ? 'Set your location' : 'Location unavailable'));

  const handleSelectCity = async (location: ManualLocation) => {
    await setManualLocation(location);
  };

  const handleUseGPS = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (!permission?.granted) {
      await requestPermission();
    }
    await setLocationMode('gps');
    setShowBottomSheet(false);
  };

  const handleSearchCity = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowBottomSheet(false);
    setTimeout(() => setShowCitySearch(true), 300);
  };

  const handleSelectRecent = async (location: ManualLocation) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await setManualLocation(location);
    setShowBottomSheet(false);
  };

  const gpsLocationText = gpsCity && gpsCountry
    ? `${gpsCity}, ${gpsCountry}`
    : gpsCity || (permission?.granted ? 'Detecting...' : 'Permission required');

  // Card variant - styled for inside the prayer card
  if (variant === 'card') {
    return (
      <>
        <Pressable
          onPress={() => setShowBottomSheet(true)}
          style={({ pressed }) => [
            styles.cardContainer,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderColor: 'rgba(255, 255, 255, 0.25)',
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View style={styles.cardContent}>
            <Feather
              name={isManual ? 'edit-3' : 'map-pin'}
              size={13}
              color="#FFFFFF"
            />
            <ThemedText
              type="caption"
              style={styles.cardText}
            >
              {locationText}
            </ThemedText>
            {isManual && (
              <View style={styles.cardBadge}>
                <ThemedText type="caption" style={styles.cardBadgeText}>
                  Manual
                </ThemedText>
              </View>
            )}
          </View>
          <Feather name="chevron-down" size={13} color="rgba(255,255,255,0.7)" />
        </Pressable>

        {/* Bottom Sheet Modal */}
        <Modal
          visible={showBottomSheet}
          transparent
          animationType="fade"
          onRequestClose={() => setShowBottomSheet(false)}
        >
          <Pressable
            style={styles.overlay}
            onPress={() => setShowBottomSheet(false)}
          >
            <Pressable
              style={[
                styles.bottomSheet,
                {
                  backgroundColor: isDark ? '#1a1a1a' : '#fff',
                  paddingBottom: insets.bottom + Spacing.md,
                },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />

              {/* Header */}
              <View style={styles.sheetHeader}>
                <ThemedText type="h3" style={{ fontWeight: '700', fontSize: 18 }}>
                  Location
                </ThemedText>
                <Pressable onPress={() => setShowBottomSheet(false)}>
                  <Feather name="x" size={22} color={theme.textSecondary} />
                </Pressable>
              </View>

              {/* Current Location Display */}
              <View style={[styles.currentLocation, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <Feather name="map-pin" size={18} color={theme.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <ThemedText type="caption" style={{ opacity: 0.6 }}>
                    Current location
                  </ThemedText>
                  <ThemedText type="body" style={{ fontWeight: '600', marginTop: 2 }}>
                    {locationText}
                  </ThemedText>
                </View>
                {isManual && (
                  <View style={[styles.modeBadge, { backgroundColor: `${theme.primary}20` }]}>
                    <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '600', fontSize: 11 }}>
                      Manual
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* GPS Option */}
              <Pressable
                onPress={handleUseGPS}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: pressed
                      ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')
                      : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                    borderColor: locationMode === 'gps' ? theme.primary : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                    borderWidth: locationMode === 'gps' ? 1.5 : 1,
                  },
                ]}
              >
                <View style={[styles.optionIcon, { backgroundColor: `${theme.primary}15` }]}>
                  <Feather name="navigation" size={18} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    Use GPS Location
                  </ThemedText>
                  <ThemedText type="caption" style={{ opacity: 0.6, marginTop: 2 }}>
                    {gpsLocationText}
                  </ThemedText>
                </View>
                {locationMode === 'gps' && (
                  <Feather name="check-circle" size={20} color={theme.primary} />
                )}
              </Pressable>

              {/* Search City Option */}
              <Pressable
                onPress={handleSearchCity}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: pressed
                      ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')
                      : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <View style={[styles.optionIcon, { backgroundColor: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.1)' }]}>
                  <Feather name="search" size={18} color={isDark ? '#60A5FA' : '#3B82F6'} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    Search City
                  </ThemedText>
                  <ThemedText type="caption" style={{ opacity: 0.6, marginTop: 2 }}>
                    Set location manually
                  </ThemedText>
                </View>
                <Feather name="chevron-right" size={18} color={theme.textSecondary} />
              </Pressable>

              {/* Recent Locations */}
              {recentLocations.length > 0 && (
                <View style={styles.recentSection}>
                  <ThemedText type="caption" style={styles.recentHeader}>
                    RECENT
                  </ThemedText>
                  {recentLocations.slice(0, 3).map((loc, index) => (
                    <Pressable
                      key={`${loc.latitude}-${loc.longitude}-${index}`}
                      onPress={() => handleSelectRecent(loc)}
                      style={({ pressed }) => [
                        styles.recentItem,
                        {
                          backgroundColor: pressed
                            ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')
                            : 'transparent',
                          borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                        },
                      ]}
                    >
                      <Feather name="clock" size={14} color={theme.textSecondary} />
                      <ThemedText type="body" style={{ flex: 1, marginLeft: 10 }}>
                        {loc.city}, {loc.country}
                      </ThemedText>
                      {manualLocation?.latitude === loc.latitude && manualLocation?.longitude === loc.longitude && locationMode === 'manual' && (
                        <Feather name="check" size={16} color={theme.primary} />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        <CitySearchModal
          visible={showCitySearch}
          onClose={() => setShowCitySearch(false)}
          onSelectCity={handleSelectCity}
          recentLocations={recentLocations}
        />
      </>
    );
  }

  // Default variant
  return (
    <>
      <Pressable
        onPress={() => setShowBottomSheet(true)}
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
        <Feather name="chevron-down" size={14} color={theme.textSecondary} />
      </Pressable>

      {/* Bottom Sheet Modal */}
      <Modal
        visible={showBottomSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBottomSheet(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setShowBottomSheet(false)}
        >
          <Pressable
            style={[
              styles.bottomSheet,
              {
                backgroundColor: isDark ? '#1a1a1a' : '#fff',
                paddingBottom: insets.bottom + Spacing.md,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <ThemedText type="h3" style={{ fontWeight: '700', fontSize: 18 }}>
                Location
              </ThemedText>
              <Pressable onPress={() => setShowBottomSheet(false)}>
                <Feather name="x" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Current Location Display */}
            <View style={[styles.currentLocation, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <Feather name="map-pin" size={18} color={theme.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <ThemedText type="caption" style={{ opacity: 0.6 }}>
                  Current location
                </ThemedText>
                <ThemedText type="body" style={{ fontWeight: '600', marginTop: 2 }}>
                  {locationText}
                </ThemedText>
              </View>
              {isManual && (
                <View style={[styles.modeBadge, { backgroundColor: `${theme.primary}20` }]}>
                  <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '600', fontSize: 11 }}>
                    Manual
                  </ThemedText>
                </View>
              )}
            </View>

            {/* GPS Option */}
            <Pressable
              onPress={handleUseGPS}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: pressed
                    ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')
                    : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                  borderColor: locationMode === 'gps' ? theme.primary : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                  borderWidth: locationMode === 'gps' ? 1.5 : 1,
                },
              ]}
            >
              <View style={[styles.optionIcon, { backgroundColor: `${theme.primary}15` }]}>
                <Feather name="navigation" size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>
                  Use GPS Location
                </ThemedText>
                <ThemedText type="caption" style={{ opacity: 0.6, marginTop: 2 }}>
                  {gpsLocationText}
                </ThemedText>
              </View>
              {locationMode === 'gps' && (
                <Feather name="check-circle" size={20} color={theme.primary} />
              )}
            </Pressable>

            {/* Search City Option */}
            <Pressable
              onPress={handleSearchCity}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: pressed
                    ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')
                    : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <View style={[styles.optionIcon, { backgroundColor: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.1)' }]}>
                <Feather name="search" size={18} color={isDark ? '#60A5FA' : '#3B82F6'} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>
                  Search City
                </ThemedText>
                <ThemedText type="caption" style={{ opacity: 0.6, marginTop: 2 }}>
                  Set location manually
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={18} color={theme.textSecondary} />
            </Pressable>

            {/* Recent Locations */}
            {recentLocations.length > 0 && (
              <View style={styles.recentSection}>
                <ThemedText type="caption" style={styles.recentHeader}>
                  RECENT
                </ThemedText>
                {recentLocations.slice(0, 3).map((loc, index) => (
                  <Pressable
                    key={`${loc.latitude}-${loc.longitude}-${index}`}
                    onPress={() => handleSelectRecent(loc)}
                    style={({ pressed }) => [
                      styles.recentItem,
                      {
                        backgroundColor: pressed
                          ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')
                          : 'transparent',
                        borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      },
                    ]}
                  >
                    <Feather name="clock" size={14} color={theme.textSecondary} />
                    <ThemedText type="body" style={{ flex: 1, marginLeft: 10 }}>
                      {loc.city}, {loc.country}
                    </ThemedText>
                    {manualLocation?.latitude === loc.latitude && manualLocation?.longitude === loc.longitude && locationMode === 'manual' && (
                      <Feather name="check" size={16} color={theme.primary} />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <CitySearchModal
        visible={showCitySearch}
        onClose={() => setShowCitySearch(false)}
        onSelectCity={handleSelectCity}
        recentLocations={recentLocations}
      />
    </>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cardText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  cardBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  cardBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  currentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  recentSection: {
    marginTop: Spacing.sm,
  },
  recentHeader: {
    opacity: 0.5,
    fontWeight: '600',
    fontSize: 11,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
});
