/**
 * MosqueFinderScreen - Main screen for discovering nearby mosques
 * Features search, radius filter, and list of mosque cards
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';
import { useMosqueFinder } from '@/hooks/useMosqueFinder';
import { MosqueCard } from '@/components/MosqueCard';
import { MapsIntegrationService } from '@/services/MapsIntegrationService';
import { RADIUS_OPTIONS } from '@/constants/mosque';
import { Mosque } from '@/types/mosque';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootStackNavigator';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '@/hooks/useTranslation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MosqueFinder'>;

export default function MosqueFinderScreen() {
  const { isDark, theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [showRadiusPicker, setShowRadiusPicker] = useState(false);

  const {
    filteredMosques,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    radius,
    setRadius,
    refetch,
    hasLocation,
  } = useMosqueFinder();

  const handleMosquePress = (mosque: Mosque) => {
    navigation.navigate('MosqueDetail', { mosqueId: mosque.id, mosque });
  };

  const handleDirections = async (mosque: Mosque) => {
    await MapsIntegrationService.openDirections({
      latitude: mosque.latitude,
      longitude: mosque.longitude,
      name: mosque.name,
    });
  };

  const handleRadiusChange = (newRadius: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRadius(newRadius);
    setShowRadiusPicker(false);
  };

  const currentRadiusLabel = RADIUS_OPTIONS.find(r => r.value === radius)?.label || '5 km';

  const renderEmptyState = () => {
    if (!hasLocation) {
      return (
        <View style={styles.emptyState}>
          <Feather
            name="map-pin"
            size={48}
            color={theme.textSecondary}
          />
          <ThemedText type="body" style={styles.emptyTitle}>
            Location Required
          </ThemedText>
          <ThemedText type="small" secondary style={styles.emptyText}>
            Please enable location services to find nearby mosques
          </ThemedText>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Feather
            name="alert-circle"
            size={48}
            color="#EF4444"
          />
          <ThemedText type="body" style={styles.emptyTitle}>
            Something went wrong
          </ThemedText>
          <ThemedText type="small" secondary style={styles.emptyText}>
            {error}
          </ThemedText>
          <Pressable
            onPress={refetch}
            style={[styles.retryButton, {
              backgroundColor: theme.primary,
            }]}
          >
            <ThemedText type="body" style={{ color: '#FFFFFF' }}>
              Try Again
            </ThemedText>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Feather
          name="search"
          size={48}
          color={theme.textSecondary}
        />
        <ThemedText type="body" style={styles.emptyTitle}>
          No mosques found
        </ThemedText>
        <ThemedText type="small" secondary style={styles.emptyText}>
          Try expanding your search radius or changing your search query
        </ThemedText>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, {
        backgroundColor: theme.backgroundDefault
      }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather
            name="arrow-left"
            size={24}
            color={theme.text}
          />
        </Pressable>
        <ThemedText type="h3" style={styles.headerTitle}>{t('mosqueFinder.nearbyMosques')}</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        {/* Search Input — carved clay inset */}
        <View style={[styles.searchInputContainer, {
          backgroundColor: isDark ? theme.backgroundSecondary : '#F2F3F5',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          // Simulate inset shadow with top inner border
          borderTopColor: isDark ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.06)',
          borderTopWidth: 1.5,
        }]}>
          <Feather
            name="search"
            size={18}
            color={theme.textSecondary}
          />
          <TextInput
            style={[styles.searchInput, {
              color: theme.text,
            }]}
            placeholder={t('mosqueFinder.searchPlaceholder')}
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Feather
                name="x"
                size={18}
                color={theme.textSecondary}
              />
            </Pressable>
          )}
        </View>

        {/* Radius Filter Pill — floating clay button */}
        <View style={{
          borderRadius: 12,
          shadowColor: showRadiusPicker ? theme.primary : '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: showRadiusPicker ? 0.3 : 0.06,
          shadowRadius: showRadiusPicker ? 8 : 12,
          elevation: showRadiusPicker ? 6 : 3,
        }}>
          <Pressable
            onPress={() => setShowRadiusPicker(!showRadiusPicker)}
            style={[styles.radiusButton, {
              backgroundColor: showRadiusPicker ? theme.primary : (isDark ? theme.backgroundSecondary : '#FFFFFF'),
              overflow: 'hidden',
            }]}
          >
            <Feather
              name="sliders"
              size={18}
              color={showRadiusPicker ? '#FFFFFF' : theme.primary}
            />
            <ThemedText type="small" style={[styles.radiusText, showRadiusPicker && { color: '#FFFFFF' }]}>
              {currentRadiusLabel}
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Radius Picker Dropdown — premium floating glass panel */}
      {showRadiusPicker && (
        <View style={[styles.radiusPicker, {
          backgroundColor: isDark ? theme.backgroundSecondary : '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.15,
          shadowRadius: 40,
          elevation: 16,
        }]}>
          {RADIUS_OPTIONS.map((option, index) => (
            <React.Fragment key={option.value}>
              <Pressable
                onPress={() => handleRadiusChange(option.value)}
                style={[
                  styles.radiusOption,
                  radius === option.value && {
                    backgroundColor: `${theme.primary}10`,
                  }
                ]}
              >
                <ThemedText type="body" style={radius === option.value ? { fontWeight: '600', color: theme.primary } : undefined}>
                  {option.label}
                </ThemedText>
                {radius === option.value && (
                  <Feather
                    name="check"
                    size={18}
                    color={theme.primary}
                  />
                )}
              </Pressable>
              {index < RADIUS_OPTIONS.length - 1 && (
                <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', marginHorizontal: 16 }} />
              )}
            </React.Fragment>
          ))}
        </View>
      )}

      {/* Loading State */}
      {isLoading && filteredMosques.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={theme.primary}
          />
          <ThemedText type="small" secondary style={styles.loadingText}>
            Finding nearby mosques...
          </ThemedText>
        </View>
      ) : (
        /* Mosque List */
        <FlatList
          data={filteredMosques}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MosqueCard
              mosque={item}
              onPress={() => handleMosquePress(item)}
              onDirections={() => handleDirections(item)}
            />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing["2xl"] }]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isLoading && filteredMosques.length > 0}
              onRefresh={refetch}
              tintColor={theme.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
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
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  radiusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    height: 44,
    gap: Spacing.xs,
  },
  radiusText: {
    fontWeight: '600',
  },
  radiusPicker: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: 16,
  },
  radiusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    marginTop: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing["2xl"],
  },
  emptyTitle: {
    marginTop: Spacing.md,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
});
