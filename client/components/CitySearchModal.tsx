import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Modal,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { searchCities } from '@/utils/citySearch';
import type { City, ManualLocation } from '@/types/location';

interface CitySearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCity: (location: ManualLocation) => void;
  recentLocations: ManualLocation[];
}

export function CitySearchModal({
  visible,
  onClose,
  onSelectCity,
  recentLocations,
}: CitySearchModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
    }

    const timer = setTimeout(() => {
      const results = searchCities(searchQuery, 50);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load initial results
  useEffect(() => {
    if (visible && searchQuery.trim().length === 0) {
      const results = searchCities('', 50);
      setSearchResults(results);
    }
  }, [visible]);

  const handleSelectCity = useCallback((city: City) => {
    const location: ManualLocation = {
      city: city.name,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
      timezone: city.timezone,
    };
    onSelectCity(location);
    setSearchQuery('');
    onClose();
  }, [onSelectCity, onClose]);

  const handleSelectRecent = useCallback((location: ManualLocation) => {
    onSelectCity(location);
    setSearchQuery('');
    onClose();
  }, [onSelectCity, onClose]);

  const renderCityItem = useCallback(({ item }: { item: City }) => (
    <Pressable
      onPress={() => handleSelectCity(item)}
      style={({ pressed }) => [
        styles.cityItem,
        {
          backgroundColor: pressed
            ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
            : 'transparent',
          borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        },
      ]}
    >
      <View style={styles.cityInfo}>
        <ThemedText type="body" style={styles.cityName}>
          {item.name}
        </ThemedText>
        <ThemedText type="caption" style={{ opacity: 0.6 }}>
          {item.country}
        </ThemedText>
      </View>
      <ThemedText type="caption" style={{ opacity: 0.4 }}>
        {item.timezone.split('/').pop()?.replace(/_/g, ' ')}
      </ThemedText>
    </Pressable>
  ), [handleSelectCity, isDark]);

  const renderRecentItem = useCallback(({ item }: { item: ManualLocation }) => (
    <Pressable
      onPress={() => handleSelectRecent(item)}
      style={({ pressed }) => [
        styles.cityItem,
        {
          backgroundColor: pressed
            ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
            : 'transparent',
          borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        },
      ]}
    >
      <View style={styles.cityInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Feather name="clock" size={14} color={theme.primary} />
          <ThemedText type="body" style={styles.cityName}>
            {item.city}
          </ThemedText>
        </View>
        <ThemedText type="caption" style={{ opacity: 0.6 }}>
          {item.country}
        </ThemedText>
      </View>
      <ThemedText type="caption" style={{ opacity: 0.4 }}>
        {item.timezone.split('/').pop()?.replace(/_/g, ' ')}
      </ThemedText>
    </Pressable>
  ), [handleSelectRecent, isDark, theme.primary]);

  const ListHeader = useCallback(() => {
    if (searchQuery.trim().length > 0 || recentLocations.length === 0) {
      return null;
    }

    return (
      <View>
        <ThemedText type="caption" style={styles.sectionHeader}>
          RECENT
        </ThemedText>
        {recentLocations.map((loc, index) => (
          <View key={`recent-${loc.latitude}-${loc.longitude}-${index}`}>
            {renderRecentItem({ item: loc })}
          </View>
        ))}
        <ThemedText type="caption" style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>
          ALL CITIES
        </ThemedText>
      </View>
    );
  }, [searchQuery, recentLocations, renderRecentItem]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]}
          >
            <Feather name="arrow-left" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="h3" style={{ fontWeight: '700', fontSize: 20 }}>
            Select City
          </ThemedText>
        </View>

        {/* Search Input */}
        <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search cities..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Results */}
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.primary} />
            <ThemedText type="caption" style={{ marginTop: 8, opacity: 0.6 }}>
              Searching...
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderCityItem}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="map-pin" size={48} color={theme.textSecondary} style={{ opacity: 0.3 }} />
                <ThemedText type="body" style={{ opacity: 0.5, marginTop: 16 }}>
                  No cities found
                </ThemedText>
                <ThemedText type="caption" style={{ opacity: 0.4, marginTop: 4 }}>
                  Try a different search term
                </ThemedText>
              </View>
            }
            contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
          />
        )}
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    opacity: 0.5,
    fontWeight: '600',
    fontSize: 12,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontWeight: '500',
    marginBottom: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
});
