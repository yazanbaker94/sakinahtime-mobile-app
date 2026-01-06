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
import { Spacing, Colors, BorderRadius } from '@/constants/theme';
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

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MosqueFinder'>;

export default function MosqueFinderScreen() {
  const { isDark } = useTheme();
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
            color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} 
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
              backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
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
          color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} 
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
        backgroundColor: isDark ? Colors.dark.backgroundDefault : Colors.light.backgroundDefault 
      }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather 
            name="arrow-left" 
            size={24} 
            color={isDark ? Colors.dark.text : Colors.light.text} 
          />
        </Pressable>
        <ThemedText type="h3" style={styles.headerTitle}>Nearby Mosques</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        {/* Search Input */}
        <View style={[styles.searchInputContainer, {
          backgroundColor: isDark 
            ? Colors.dark.backgroundSecondary 
            : Colors.light.backgroundSecondary,
        }]}>
          <Feather 
            name="search" 
            size={18} 
            color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} 
          />
          <TextInput
            style={[styles.searchInput, {
              color: isDark ? Colors.dark.text : Colors.light.text,
            }]}
            placeholder="Search mosques..."
            placeholderTextColor={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Feather 
                name="x" 
                size={18} 
                color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} 
              />
            </Pressable>
          )}
        </View>

        {/* Radius Filter */}
        <Pressable
          onPress={() => setShowRadiusPicker(!showRadiusPicker)}
          style={[styles.radiusButton, {
            backgroundColor: isDark 
              ? Colors.dark.backgroundSecondary 
              : Colors.light.backgroundSecondary,
          }]}
        >
          <Feather 
            name="sliders" 
            size={18} 
            color={isDark ? Colors.dark.primary : Colors.light.primary} 
          />
          <ThemedText type="small" style={styles.radiusText}>
            {currentRadiusLabel}
          </ThemedText>
        </Pressable>
      </View>

      {/* Radius Picker Dropdown */}
      {showRadiusPicker && (
        <View style={[styles.radiusPicker, {
          backgroundColor: isDark 
            ? Colors.dark.backgroundSecondary 
            : Colors.light.backgroundSecondary,
        }]}>
          {RADIUS_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => handleRadiusChange(option.value)}
              style={[
                styles.radiusOption,
                radius === option.value && {
                  backgroundColor: isDark 
                    ? 'rgba(52, 211, 153, 0.15)' 
                    : 'rgba(16, 185, 129, 0.1)',
                }
              ]}
            >
              <ThemedText type="body">{option.label}</ThemedText>
              {radius === option.value && (
                <Feather 
                  name="check" 
                  size={18} 
                  color={isDark ? Colors.dark.primary : Colors.light.primary} 
                />
              )}
            </Pressable>
          ))}
        </View>
      )}

      {/* Loading State */}
      {isLoading && filteredMosques.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="large" 
            color={isDark ? Colors.dark.primary : Colors.light.primary} 
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
              tintColor={isDark ? Colors.dark.primary : Colors.light.primary}
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
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
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
