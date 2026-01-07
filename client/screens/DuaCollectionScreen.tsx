/**
 * DuaCollectionScreen
 * 
 * Main screen for browsing duas by category, Quranic, Prophetic, favorites, and custom.
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, FlatList, Animated, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useDuaCollection } from '@/hooks/useDuaCollection';
import { useDuaFavorites } from '@/hooks/useDuaFavorites';
import { useCustomDuas } from '@/hooks/useCustomDuas';
import { DuaOfTheDay } from '@/components/DuaOfTheDay';
import { DuaCard } from '@/components/DuaCard';
import { Dua, DuaCategory, CustomDua } from '@/types/dua';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';

type TabType = 'categories' | 'quranic' | 'prophetic' | 'favorites' | 'custom';

const ICON_MAP: Record<string, keyof typeof Feather.glyphMap> = {
  navigation: 'navigation',
  coffee: 'coffee',
  moon: 'moon',
  home: 'home',
  cloud: 'cloud',
  heart: 'heart',
  shield: 'shield',
  gift: 'gift',
  'refresh-cw': 'refresh-cw',
  compass: 'compass',
  users: 'users',
  star: 'star',
};

export function DuaCollectionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark, theme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { categories, quranicDuas, propheticDuas, searchDuas, duaOfTheDay, getDuasByCategory } = useDuaCollection();
  const { favorites, isFavorite, toggleFavorite, favoriteDuas } = useDuaFavorites();
  const { customDuas, deleteCustomDua } = useCustomDuas();

  // Track open swipeable refs
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchDuas(searchQuery);
  }, [searchQuery, searchDuas]);

  // Category duas
  const categoryDuas = useMemo(() => {
    if (!selectedCategory) return [];
    return getDuasByCategory(selectedCategory);
  }, [selectedCategory, getDuasByCategory]);

  const handleDuaPress = useCallback((dua: Dua) => {
    navigation.navigate('DuaDetail', { duaId: dua.id });
  }, [navigation]);

  const handleCustomDuaPress = useCallback((dua: CustomDua) => {
    navigation.navigate('CustomDuaForm', { duaId: dua.id });
  }, [navigation]);

  const handleCategoryPress = useCallback((category: DuaCategory) => {
    setSelectedCategory(category.id);
  }, []);

  const handleBackFromCategory = useCallback(() => {
    setSelectedCategory(null);
  }, []);

  const handleAddCustomDua = useCallback(() => {
    navigation.navigate('CustomDuaForm', {});
  }, [navigation]);

  const handleDeleteCustomDua = useCallback((dua: CustomDua) => {
    Alert.alert(
      'Delete Dua',
      'Are you sure you want to delete this dua?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomDua(dua.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete dua');
            }
          },
        },
      ]
    );
  }, [deleteCustomDua]);

  const renderRightActions = useCallback((
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    dua: CustomDua
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <Pressable
        onPress={() => handleDeleteCustomDua(dua)}
        style={styles.deleteAction}
      >
        <Animated.View style={[styles.deleteActionContent, { transform: [{ scale }] }]}>
          <Feather name="trash-2" size={22} color="#fff" />
          <ThemedText type="small" style={{ color: '#fff', marginTop: 4 }}>Delete</ThemedText>
        </Animated.View>
      </Pressable>
    );
  }, [handleDeleteCustomDua]);

  const renderTab = (tab: TabType, label: string, icon: keyof typeof Feather.glyphMap) => (
    <Pressable
      key={tab}
      onPress={() => {
        setActiveTab(tab);
        setSelectedCategory(null);
      }}
      style={[
        styles.tab,
        activeTab === tab && {
          borderBottomWidth: 3,
          borderBottomColor: theme.primary,
        },
      ]}
    >
      <Feather
        name={icon}
        size={18}
        color={
          activeTab === tab
            ? theme.primary
            : theme.textSecondary
        }
      />
      <ThemedText
        type="small"
        numberOfLines={1}
        style={{
          marginLeft: 6,
          fontWeight: activeTab === tab ? '700' : '500',
          color:
            activeTab === tab
              ? theme.primary
              : theme.textSecondary,
        }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  const renderDuaItem = ({ item }: { item: Dua }) => (
    <DuaCard
      dua={item}
      variant="compact"
      isFavorite={isFavorite(item.id)}
      onFavoriteToggle={() => toggleFavorite(item.id)}
      onPress={() => handleDuaPress(item)}
    />
  );

  const renderCustomDuaItem = ({ item }: { item: CustomDua }) => (
    <Swipeable
      ref={(ref) => {
        if (ref) {
          swipeableRefs.current.set(item.id, ref);
        } else {
          swipeableRefs.current.delete(item.id);
        }
      }}
      renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
      overshootRight={false}
      friction={2}
    >
      <DuaCard
        dua={item}
        variant="compact"
        showFavorite={false}
        showAudio={false}
        onPress={() => handleCustomDuaPress(item)}
      />
    </Swipeable>
  );

  const renderCategoryGrid = () => (
    <View style={styles.categoriesGrid}>
      {categories.map((category) => (
        <Pressable
          key={category.id}
          onPress={() => handleCategoryPress(category)}
          style={({ pressed }) => [
            styles.categoryCard,
            {
              backgroundColor: theme.cardBackground,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.categoryIcon,
              { backgroundColor: `${theme.primary}15` },
            ]}
          >
            <Feather
              name={ICON_MAP[category.icon] || 'star'}
              size={24}
              color={theme.primary}
            />
          </View>
          <ThemedText type="small" style={styles.categoryTitle}>
            {category.titleEn}
          </ThemedText>
          <ThemedText type="arabic" secondary style={[styles.categoryArabic, { fontFamily: 'AlMushafQuran' }]}>
            {category.titleAr}
          </ThemedText>
          <ThemedText type="caption" secondary>
            {category.count} duas
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );

  const renderCategoryDuas = () => {
    const category = categories.find(c => c.id === selectedCategory);
    return (
      <View>
        <Pressable onPress={handleBackFromCategory} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={theme.text} />
          <ThemedText type="body" style={{ marginLeft: Spacing.sm, fontWeight: '600' }}>
            {category?.titleEn || 'Back'}
          </ThemedText>
        </Pressable>
        <FlatList
          data={categoryDuas}
          renderItem={renderDuaItem}
          keyExtractor={item => item.id}
          scrollEnabled={false}
        />
      </View>
    );
  };

  const renderEmptyState = (message: string, icon: keyof typeof Feather.glyphMap) => (
    <View style={styles.emptyState}>
      <Feather name={icon} size={48} color={theme.textSecondary} />
      <ThemedText type="body" secondary style={{ marginTop: Spacing.md, textAlign: 'center' }}>
        {message}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBackButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h2">Duas</ThemedText>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search duas..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={[
          styles.tabsContainer,
          { backgroundColor: theme.backgroundDefault }
        ]}
        contentContainerStyle={styles.tabsContent}
      >
        {renderTab('categories', 'Categories', 'grid')}
        {renderTab('quranic', 'Quranic', 'book-open')}
        {renderTab('prophetic', 'Prophetic', 'bookmark')}
        {renderTab('favorites', 'Favorites', 'heart')}
        {renderTab('custom', 'My Duas', 'edit-3')}
      </ScrollView>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Results */}
        {searchQuery.trim() && (
          <>
            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderDuaItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                ListHeaderComponent={
                  <ThemedText type="small" secondary style={{ marginBottom: Spacing.md }}>
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                  </ThemedText>
                }
              />
            ) : (
              renderEmptyState(`No duas found for "${searchQuery}"`, 'search')
            )}
          </>
        )}

        {/* Tab Content (when not searching) */}
        {!searchQuery.trim() && (
          <>
            {activeTab === 'categories' && (
              <>
                {!selectedCategory && (
                  <>
                    <DuaOfTheDay 
                      dua={duaOfTheDay} 
                      onPress={() => handleDuaPress(duaOfTheDay)} 
                    />
                    {renderCategoryGrid()}
                  </>
                )}
                {selectedCategory && renderCategoryDuas()}
              </>
            )}

            {activeTab === 'quranic' && (
              <FlatList
                data={quranicDuas}
                renderItem={renderDuaItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                ListEmptyComponent={renderEmptyState('No Quranic duas available', 'book-open')}
              />
            )}

            {activeTab === 'prophetic' && (
              <FlatList
                data={propheticDuas}
                renderItem={renderDuaItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                ListEmptyComponent={renderEmptyState('No Prophetic duas available', 'bookmark')}
              />
            )}

            {activeTab === 'favorites' && (
              <FlatList
                data={favoriteDuas}
                renderItem={renderDuaItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                ListEmptyComponent={renderEmptyState('No favorite duas yet.\nTap the heart icon on any dua to add it here.', 'heart')}
              />
            )}

            {activeTab === 'custom' && (
              <>
                <Pressable
                  onPress={handleAddCustomDua}
                  style={({ pressed }) => [
                    styles.addButton,
                    { 
                      backgroundColor: theme.primary,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Feather name="plus" size={20} color="#fff" />
                  <ThemedText type="body" style={{ color: '#fff', marginLeft: Spacing.sm, fontWeight: '600' }}>
                    Add Custom Dua
                  </ThemedText>
                </Pressable>
                <FlatList
                  data={customDuas}
                  renderItem={renderCustomDuaItem}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                  ListEmptyComponent={renderEmptyState('No custom duas yet.\nAdd your personal supplications here.', 'edit-3')}
                />
              </>
            )}
          </>
        )}
      </ScrollView>
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerBackButton: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  tabsContainer: {
    minHeight: 48,
    maxHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  tabsContent: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  categoryCard: {
    width: '47%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  categoryTitle: {
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  categoryArabic: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  deleteActionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DuaCollectionScreen;
