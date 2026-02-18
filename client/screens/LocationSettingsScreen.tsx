import React, { useState } from 'react';
import { View, Pressable, StyleSheet, ScrollView, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useLocation } from '@/contexts/LocationContext';
import { CitySearchModal } from '@/components/CitySearchModal';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import type { ManualLocation } from '@/types/location';

const locationPin3D = require('../../assets/images/3d-images/location.png');

export default function LocationSettingsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [showCitySearch, setShowCitySearch] = useState(false);

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

  const isManual = locationMode === 'manual';
  const locationText = city && country
    ? `${city}, ${country}`
    : city || (loading ? t('location.detecting') : t('location.unavailable'));

  const gpsLocationText = gpsCity && gpsCountry
    ? `${gpsCity}, ${gpsCountry}`
    : gpsCity || (permission?.granted ? t('location.detecting') : t('location.permissionRequired'));

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
  };

  const handleSearchCity = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowCitySearch(true);
  };

  const handleSelectRecent = async (location: ManualLocation) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await setManualLocation(location);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.md,
            backgroundColor: theme.cardBackground,
            borderBottomWidth: 0,
          },
        ]}
      >
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3" style={{ fontWeight: '700' }}>
          {t('location.title')}
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Location Display — 3D floating card */}
        <View style={{
          borderRadius: 16,
          marginTop: Spacing.lg,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 15,
          elevation: 3,
        }}>
          <View style={[styles.currentLocation, {
            backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
            borderWidth: 0,
          }]}>
            <View style={[styles.locationIconContainer, { backgroundColor: `${theme.primary}10` }]}>
              <Image source={locationPin3D} style={{ width: 36, height: 36 }} resizeMode="contain" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="caption" secondary>
                {t('location.currentLocation')}
              </ThemedText>
              <ThemedText type="h4" style={{ fontWeight: '600', marginTop: 4 }}>
                {locationText}
              </ThemedText>
            </View>
            {isManual && (
              <View style={[styles.modeBadge, { backgroundColor: `${theme.primary}20` }]}>
                <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '600' }}>
                  {t('location.manual')}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Location Options */}
        <ThemedText type="caption" style={styles.sectionHeader}>
          {t('location.locationSource')}
        </ThemedText>

        {/* GPS Option — Ribbon Trick */}
        <View style={{
          borderRadius: 16,
          marginBottom: Spacing.sm,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 15,
          elevation: 3,
        }}>
          <Pressable
            onPress={handleUseGPS}
            style={({ pressed }) => [styles.option, {
              backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
              borderWidth: 0,
              borderLeftWidth: locationMode === 'gps' ? 4 : 0,
              borderLeftColor: theme.primary,
              borderTopWidth: 0,
              borderRightWidth: 0,
              borderBottomWidth: 0,
              opacity: pressed ? 0.85 : 1,
            }]}
          >
            <View style={[styles.optionIcon, { backgroundColor: `${theme.primary}15` }]}>
              <Feather name="navigation" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="body" style={{ fontWeight: '600' }}>
                {t('location.useGPS')}
              </ThemedText>
              <ThemedText type="caption" secondary style={{ marginTop: 2 }}>
                {gpsLocationText}
              </ThemedText>
            </View>
          </Pressable>
        </View>

        {/* Search City Option — Ribbon Trick */}
        <View style={{
          borderRadius: 16,
          marginBottom: Spacing.sm,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 15,
          elevation: 3,
        }}>
          <Pressable
            onPress={handleSearchCity}
            style={({ pressed }) => [styles.option, {
              backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
              borderWidth: 0,
              borderLeftWidth: locationMode === 'manual' ? 4 : 0,
              borderLeftColor: theme.primary,
              borderTopWidth: 0,
              borderRightWidth: 0,
              borderBottomWidth: 0,
              opacity: pressed ? 0.85 : 1,
            }]}
          >
            <View style={[styles.optionIcon, { backgroundColor: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.1)' }]}>
              <Feather name="search" size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="body" style={{ fontWeight: '600' }}>
                {t('location.setManually')}
              </ThemedText>
              <ThemedText type="caption" secondary style={{ marginTop: 2 }}>
                {t('location.searchWorldwide')}
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Recent Locations */}
        {recentLocations.length > 0 && (
          <>
            <ThemedText type="caption" style={styles.sectionHeader}>
              {t('location.recentLocations')}
            </ThemedText>
            {/* Floating Tablet */}
            <View style={{
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.04,
              shadowRadius: 15,
              elevation: 3,
            }}>
              <View style={[styles.recentContainer, {
                backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
                borderWidth: 0,
              }]}>
                {recentLocations.map((loc, index) => {
                  const isSelected = manualLocation?.latitude === loc.latitude &&
                    manualLocation?.longitude === loc.longitude &&
                    locationMode === 'manual';
                  return (
                    <Pressable
                      key={`${loc.latitude}-${loc.longitude}-${index}`}
                      onPress={() => handleSelectRecent(loc)}
                      style={({ pressed }) => [
                        styles.recentItem,
                        {
                          backgroundColor: pressed ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') : 'transparent',
                          borderBottomColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
                          borderBottomWidth: index < recentLocations.length - 1 ? 1 : 0,
                        },
                      ]}
                    >
                      <View style={[styles.recentIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                        <Feather name="clock" size={16} color={theme.textSecondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="body" style={{ fontWeight: '500' }}>
                          {loc.city}
                        </ThemedText>
                        <ThemedText type="caption" secondary>
                          {loc.country}
                        </ThemedText>
                      </View>
                      {isSelected && (
                        <Feather name="check" size={18} color={theme.primary} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
          <Feather name="info" size={16} color={theme.textSecondary} />
          <ThemedText type="caption" secondary style={{ flex: 1, marginLeft: Spacing.sm }}>
            {t('location.info')}
          </ThemedText>
        </View>
      </ScrollView>

      <CitySearchModal
        visible={showCitySearch}
        onClose={() => setShowCitySearch(false)}
        onSelectCity={handleSelectCity}
        recentLocations={recentLocations}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 0,
  },
  backButton: {
    padding: Spacing.xs,
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  currentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: 16,
  },
  locationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  modeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  sectionHeader: {
    fontWeight: '600',
    opacity: 0.5,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  recentContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
});
