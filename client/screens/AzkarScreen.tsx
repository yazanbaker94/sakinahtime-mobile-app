/**
 * AzkarScreen - Redesigned
 * 
 * Main screen for Azkar tab with time-aware hero, quick access,
 * tasbih counter, daily dhikr, duas, and Islamic guides.
 */

import React, { useCallback, useState, useMemo, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, FlatList, Animated, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, Colors, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { azkarCategories, AzkarCategory } from '@/data/azkar';
import { islamicGuides } from '@/data/islamicGuides';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Components
import { TimeAwareHeroCard } from '@/components/TimeAwareHeroCard';
import { QuickAccessStrip } from '@/components/QuickAccessStrip';
import { TasbihCounter } from '@/components/TasbihCounter';
import { DailyDhikrCard } from '@/components/DailyDhikrCard';
import { CompactCategoryCard } from '@/components/CompactCategoryCard';
import { DuaOfTheDay } from '@/components/DuaOfTheDay';
import { DuaCard } from '@/components/DuaCard';

// Hooks
import { useTimeAwareAzkar } from '@/hooks/useTimeAwareAzkar';
import { useDailyDhikr } from '@/hooks/useDailyDhikr';
import { useDuaCollection } from '@/hooks/useDuaCollection';
import { useDuaFavorites } from '@/hooks/useDuaFavorites';
import { useCustomDuas } from '@/hooks/useCustomDuas';

// Types
import { Dua, DuaCategory, CustomDua } from '@/types/dua';

type TabType = 'azkar' | 'duas' | 'guides';
type DuaSubTab = 'categories' | 'quranic' | 'prophetic' | 'favorites' | 'custom';

const DUA_ICON_MAP: Record<string, keyof typeof Feather.glyphMap> = {
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

const GUIDE_CATEGORIES = [
  { id: 'worship', titleEn: 'Worship & Prayer', titleAr: 'العبادة والصلاة', icon: 'heart' as const, guides: islamicGuides.filter(g => g.category === 'worship') },
  { id: 'purification', titleEn: 'Purification', titleAr: 'الطهارة', icon: 'droplet' as const, guides: islamicGuides.filter(g => g.category === 'purification') },
  { id: 'hajj', titleEn: 'Hajj & Umrah', titleAr: 'الحج والعمرة', icon: 'map-pin' as const, guides: islamicGuides.filter(g => g.category === 'hajj') },
  { id: 'charity', titleEn: 'Charity & Zakat', titleAr: 'الصدقة والزكاة', icon: 'gift' as const, guides: islamicGuides.filter(g => g.category === 'charity') },
  { id: 'fasting', titleEn: 'Fasting', titleAr: 'الصيام', icon: 'moon' as const, guides: islamicGuides.filter(g => g.category === 'fasting') },
  { id: 'funeral', titleEn: 'Funeral Rites', titleAr: 'الجنائز', icon: 'heart' as const, guides: islamicGuides.filter(g => g.category === 'funeral') },
  { id: 'character', titleEn: 'Character & Manners', titleAr: 'الأخلاق والآداب', icon: 'users' as const, guides: islamicGuides.filter(g => g.category === 'character') },
  { id: 'knowledge', titleEn: 'Knowledge & Spirituality', titleAr: 'العلم والروحانية', icon: 'book' as const, guides: islamicGuides.filter(g => g.category === 'knowledge') },
  { id: 'finance', titleEn: 'Islamic Finance', titleAr: 'المعاملات المالية', icon: 'dollar-sign' as const, guides: islamicGuides.filter(g => g.category === 'finance') },
];

export default function AzkarScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const [activeTab, setActiveTab] = useState<TabType>('azkar');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dua state
  const [duaSubTab, setDuaSubTab] = useState<DuaSubTab>('categories');
  const [selectedDuaCategory, setSelectedDuaCategory] = useState<string | null>(null);
  const [duaSearchQuery, setDuaSearchQuery] = useState('');

  // Azkar hooks
  const { currentCategory } = useTimeAwareAzkar();
  const { categoryId: dhikrCategoryId } = useDailyDhikr();

  // Dua hooks
  const { categories: duaCategories, quranicDuas, propheticDuas, searchDuas, duaOfTheDay, getDuasByCategory } = useDuaCollection();
  const { isFavorite, toggleFavorite, favoriteDuas } = useDuaFavorites();
  const { customDuas, deleteCustomDua } = useCustomDuas();

  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  // Dua search results
  const duaSearchResults = useMemo(() => {
    if (!duaSearchQuery.trim()) return [];
    return searchDuas(duaSearchQuery);
  }, [duaSearchQuery, searchDuas]);

  // Category duas
  const categoryDuas = useMemo(() => {
    if (!selectedDuaCategory) return [];
    return getDuasByCategory(selectedDuaCategory);
  }, [selectedDuaCategory, getDuasByCategory]);

  // Azkar handlers
  const handleCategoryPress = useCallback((category: AzkarCategory) => {
    navigation.navigate('AzkarDetail', { category });
  }, [navigation]);

  const handleGuidePress = useCallback((guide: typeof islamicGuides[0]) => {
    navigation.navigate('IslamicGuideDetail', { guide });
  }, [navigation]);

  const handleHeroPress = useCallback(() => {
    navigation.navigate('AzkarDetail', { category: currentCategory });
  }, [navigation, currentCategory]);

  const handleDailyDhikrPress = useCallback(() => {
    const category = azkarCategories.find(c => c.id === dhikrCategoryId);
    if (category) {
      navigation.navigate('AzkarDetail', { category });
    }
  }, [navigation, dhikrCategoryId]);

  // Dua handlers
  const handleDuaPress = useCallback((dua: Dua) => {
    navigation.navigate('DuaDetail', { duaId: dua.id });
  }, [navigation]);

  const handleCustomDuaPress = useCallback((dua: CustomDua) => {
    navigation.navigate('CustomDuaForm', { duaId: dua.id });
  }, [navigation]);

  const handleDuaCategoryPress = useCallback((category: DuaCategory) => {
    setSelectedDuaCategory(category.id);
  }, []);

  const handleBackFromDuaCategory = useCallback(() => {
    setSelectedDuaCategory(null);
  }, []);

  const handleAddCustomDua = useCallback(() => {
    navigation.navigate('CustomDuaForm', {});
  }, [navigation]);

  const handleDeleteCustomDua = useCallback((dua: CustomDua) => {
    Alert.alert('Delete Dua', 'Are you sure you want to delete this dua?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCustomDua(dua.id) },
    ]);
  }, [deleteCustomDua]);

  // Filter guides by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return GUIDE_CATEGORIES;
    const query = searchQuery.toLowerCase();
    return GUIDE_CATEGORIES.map(category => ({
      ...category,
      guides: category.guides.filter(guide =>
        guide.title.toLowerCase().includes(query) ||
        guide.titleAr.includes(query) ||
        guide.description.toLowerCase().includes(query)
      ),
    })).filter(cat => cat.guides.length > 0);
  }, [searchQuery]);

  const renderRightActions = useCallback((progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>, dua: CustomDua) => {
    const scale = dragX.interpolate({ inputRange: [-100, 0], outputRange: [1, 0.5], extrapolate: 'clamp' });
    return (
      <Pressable onPress={() => handleDeleteCustomDua(dua)} style={styles.deleteAction}>
        <Animated.View style={[styles.deleteActionContent, { transform: [{ scale }] }]}>
          <Feather name="trash-2" size={22} color="#fff" />
        </Animated.View>
      </Pressable>
    );
  }, [handleDeleteCustomDua]);

  const renderTab = (tab: TabType, label: string, icon: keyof typeof Feather.glyphMap) => (
    <Pressable
      key={tab}
      onPress={() => setActiveTab(tab)}
      style={[
        styles.tab,
        activeTab === tab && { borderBottomWidth: 3, borderBottomColor: isDark ? Colors.dark.primary : Colors.light.primary },
      ]}
    >
      <Feather name={icon} size={18} color={activeTab === tab ? (isDark ? Colors.dark.primary : Colors.light.primary) : (isDark ? Colors.dark.textSecondary : Colors.light.textSecondary)} />
      <ThemedText type="body" style={{ marginLeft: Spacing.xs, fontWeight: activeTab === tab ? '700' : '500', fontSize: 14, color: activeTab === tab ? (isDark ? Colors.dark.primary : Colors.light.primary) : (isDark ? Colors.dark.textSecondary : Colors.light.textSecondary) }}>
        {label}
      </ThemedText>
    </Pressable>
  );

  const renderDuaSubTab = (tab: DuaSubTab, label: string, icon: keyof typeof Feather.glyphMap) => (
    <Pressable
      key={tab}
      onPress={() => { setDuaSubTab(tab); setSelectedDuaCategory(null); }}
      style={[styles.duaSubTab, duaSubTab === tab && { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)' }]}
    >
      <Feather name={icon} size={14} color={duaSubTab === tab ? (isDark ? Colors.dark.primary : Colors.light.primary) : theme.textSecondary} />
      <ThemedText type="caption" style={{ marginLeft: 4, color: duaSubTab === tab ? (isDark ? Colors.dark.primary : Colors.light.primary) : theme.textSecondary, fontWeight: duaSubTab === tab ? '600' : '400' }}>
        {label}
      </ThemedText>
    </Pressable>
  );

  const renderDuaItem = ({ item }: { item: Dua }) => (
    <DuaCard dua={item} variant="compact" isFavorite={isFavorite(item.id)} onFavoriteToggle={() => toggleFavorite(item.id)} onPress={() => handleDuaPress(item)} />
  );

  const renderCustomDuaItem = ({ item }: { item: CustomDua }) => (
    <Swipeable
      ref={(ref) => { if (ref) swipeableRefs.current.set(item.id, ref); else swipeableRefs.current.delete(item.id); }}
      renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
      overshootRight={false}
      friction={2}
    >
      <DuaCard dua={item} variant="compact" showFavorite={false} showAudio={false} onPress={() => handleCustomDuaPress(item)} />
    </Swipeable>
  );

  const renderEmptyState = (message: string, icon: keyof typeof Feather.glyphMap) => (
    <View style={styles.emptyState}>
      <Feather name={icon} size={48} color={theme.textSecondary} />
      <ThemedText type="body" secondary style={{ marginTop: Spacing.md, textAlign: 'center' }}>{message}</ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Tab Selector */}
      <View style={[styles.tabContainer, { paddingTop: insets.top + Spacing.md, backgroundColor: isDark ? Colors.dark.backgroundDefault : Colors.light.backgroundDefault, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
        {renderTab('azkar', 'Azkar', 'sun')}
        {renderTab('duas', 'Duas', 'book-open')}
        {renderTab('guides', 'Guides', 'compass')}
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + Spacing.xl }]} scrollIndicatorInsets={{ bottom: tabBarHeight }} showsVerticalScrollIndicator={false}>
        {activeTab === 'azkar' && (
          <>
            <TimeAwareHeroCard onPress={handleHeroPress} />
            <QuickAccessStrip categories={azkarCategories} onCategoryPress={handleCategoryPress} />
            <TasbihCounter />
            <DailyDhikrCard onPress={handleDailyDhikrPress} />
            <View style={styles.sectionHeader}><ThemedText type="small" secondary style={styles.sectionTitle}>All Categories</ThemedText></View>
            <View style={styles.categoriesGrid}>
              {azkarCategories.map((category) => (<CompactCategoryCard key={category.id} category={category} onPress={() => handleCategoryPress(category)} />))}
            </View>
            <View style={[styles.tipCard, { backgroundColor: isDark ? Colors.dark.primary + '15' : Colors.light.primary + '10' }]}>
              <View style={styles.tipHeader}>
                <Feather name="info" size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                <ThemedText type="body" style={{ marginLeft: Spacing.sm, fontWeight: '600' }}>Daily Tip</ThemedText>
              </View>
              <ThemedText type="small" secondary style={styles.tipText}>The Prophet (peace be upon him) said: &quot;The best remembrance is La ilaha illallah (There is no god but Allah).&quot;</ThemedText>
              <ThemedText type="caption" style={{ color: isDark ? Colors.dark.primary : Colors.light.primary }}>- Tirmidhi</ThemedText>
            </View>
          </>
        )}

        {activeTab === 'duas' && (
          <View style={styles.duasContainer}>
            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundSecondary }]}>
              <Feather name="search" size={20} color={theme.textSecondary} />
              <TextInput style={[styles.searchInput, { color: theme.text }]} placeholder="Search duas..." placeholderTextColor={theme.textSecondary} value={duaSearchQuery} onChangeText={setDuaSearchQuery} />
              {duaSearchQuery.length > 0 && (<Pressable onPress={() => setDuaSearchQuery('')}><Feather name="x" size={20} color={theme.textSecondary} /></Pressable>)}
            </View>

            {/* Sub Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.duaSubTabsContainer} contentContainerStyle={styles.duaSubTabsContent}>
              {renderDuaSubTab('categories', 'Categories', 'grid')}
              {renderDuaSubTab('quranic', 'Quranic', 'book-open')}
              {renderDuaSubTab('prophetic', 'Prophetic', 'bookmark')}
              {renderDuaSubTab('favorites', 'Favorites', 'heart')}
              {renderDuaSubTab('custom', 'My Duas', 'edit-3')}
            </ScrollView>

            {/* Search Results */}
            {duaSearchQuery.trim() ? (
              duaSearchResults.length > 0 ? (
                <FlatList data={duaSearchResults} renderItem={renderDuaItem} keyExtractor={item => item.id} scrollEnabled={false} ListHeaderComponent={<ThemedText type="small" secondary style={{ marginBottom: Spacing.md }}>{duaSearchResults.length} result{duaSearchResults.length !== 1 ? 's' : ''}</ThemedText>} />
              ) : renderEmptyState(`No duas found for "${duaSearchQuery}"`, 'search')
            ) : (
              <>
                {duaSubTab === 'categories' && !selectedDuaCategory && (
                  <>
                    <DuaOfTheDay dua={duaOfTheDay} onPress={() => handleDuaPress(duaOfTheDay)} />
                    <View style={styles.duaCategoriesGrid}>
                      {duaCategories.map((category) => (
                        <Pressable key={category.id} onPress={() => handleDuaCategoryPress(category)} style={({ pressed }) => [styles.duaCategoryCard, { backgroundColor: isDark ? 'rgba(26, 95, 79, 0.2)' : Colors.light.backgroundDefault, opacity: pressed ? 0.7 : 1 }]}>
                          <View style={[styles.duaCategoryIcon, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)' }]}>
                            <Feather name={DUA_ICON_MAP[category.icon] || 'star'} size={24} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                          </View>
                          <ThemedText type="small" style={styles.duaCategoryTitle}>{category.titleEn}</ThemedText>
                          <ThemedText type="caption" secondary>{category.count} duas</ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}
                {duaSubTab === 'categories' && selectedDuaCategory && (
                  <View>
                    <Pressable onPress={handleBackFromDuaCategory} style={styles.backButton}>
                      <Feather name="arrow-left" size={20} color={theme.text} />
                      <ThemedText type="body" style={{ marginLeft: Spacing.sm, fontWeight: '600' }}>{duaCategories.find(c => c.id === selectedDuaCategory)?.titleEn || 'Back'}</ThemedText>
                    </Pressable>
                    <FlatList data={categoryDuas} renderItem={renderDuaItem} keyExtractor={item => item.id} scrollEnabled={false} />
                  </View>
                )}
                {duaSubTab === 'quranic' && (<FlatList data={quranicDuas} renderItem={renderDuaItem} keyExtractor={item => item.id} scrollEnabled={false} ListEmptyComponent={renderEmptyState('No Quranic duas available', 'book-open')} />)}
                {duaSubTab === 'prophetic' && (<FlatList data={propheticDuas} renderItem={renderDuaItem} keyExtractor={item => item.id} scrollEnabled={false} ListEmptyComponent={renderEmptyState('No Prophetic duas available', 'bookmark')} />)}
                {duaSubTab === 'favorites' && (<FlatList data={favoriteDuas} renderItem={renderDuaItem} keyExtractor={item => item.id} scrollEnabled={false} ListEmptyComponent={renderEmptyState('No favorite duas yet.\nTap the heart icon on any dua.', 'heart')} />)}
                {duaSubTab === 'custom' && (
                  <>
                    <Pressable onPress={handleAddCustomDua} style={({ pressed }) => [styles.addButton, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary, opacity: pressed ? 0.8 : 1 }]}>
                      <Feather name="plus" size={20} color="#fff" />
                      <ThemedText type="body" style={{ color: '#fff', marginLeft: Spacing.sm, fontWeight: '600' }}>Add Custom Dua</ThemedText>
                    </Pressable>
                    <FlatList data={customDuas} renderItem={renderCustomDuaItem} keyExtractor={item => item.id} scrollEnabled={false} ListEmptyComponent={renderEmptyState('No custom duas yet.\nAdd your personal supplications.', 'edit-3')} />
                  </>
                )}
              </>
            )}
          </View>
        )}

        {activeTab === 'guides' && (
          <View style={styles.guidesContainer}>
            <View style={[styles.searchContainer, { backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundSecondary }]}>
              <Feather name="search" size={20} color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} />
              <TextInput style={[styles.searchInput, { color: isDark ? Colors.dark.text : Colors.light.text }]} placeholder="Search guides..." placeholderTextColor={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} value={searchQuery} onChangeText={setSearchQuery} />
              {searchQuery.length > 0 && (<Pressable onPress={() => setSearchQuery('')}><Feather name="x" size={20} color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} /></Pressable>)}
            </View>
            {filteredCategories.length === 0 ? (
              <View style={styles.noResults}><Feather name="search" size={48} color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} /><ThemedText type="body" secondary style={{ marginTop: Spacing.md }}>No guides found for &quot;{searchQuery}&quot;</ThemedText></View>
            ) : (
              filteredCategories.map((category) => (
                <View key={category.id} style={styles.guideCategory}>
                  <View style={styles.guideCategoryHeader}>
                    <View style={[styles.guideCategoryIcon, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.15)' }]}>
                      <Feather name={category.icon} size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                    </View>
                    <View style={styles.guideCategoryTitles}>
                      <View style={styles.categoryTitleRow}><ThemedText type="h4" style={{ flex: 1 }}>{category.titleEn}</ThemedText><ThemedText type="arabic" secondary style={{ fontFamily: 'AlMushafQuran' }}>{category.titleAr}</ThemedText></View>
                    </View>
                    <View style={[styles.guideCount, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.15)' }]}>
                      <ThemedText type="caption" style={{ color: isDark ? Colors.dark.primary : Colors.light.primary }}>{category.guides.length}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.guidesList}>
                    {category.guides.map((guide) => (
                      <Pressable key={guide.id} onPress={() => handleGuidePress(guide)} style={({ pressed }) => [styles.guideItem, { backgroundColor: isDark ? 'rgba(26, 95, 79, 0.2)' : Colors.light.backgroundDefault, opacity: pressed ? 0.7 : 1 }]}>
                        <ThemedText type="body" style={styles.guideTitle}>{guide.title}</ThemedText>
                        <Feather name="chevron-right" size={18} color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} />
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: Spacing.md },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  sectionHeader: { marginBottom: Spacing.md },
  sectionTitle: { fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg },
  tipCard: { padding: Spacing.lg, borderRadius: BorderRadius.lg },
  tipHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  tipText: { marginBottom: Spacing.sm, lineHeight: 20 },
  guidesContainer: { gap: Spacing.xl },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, marginBottom: Spacing.md, gap: Spacing.sm },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: Spacing.xs },
  noResults: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing['2xl'] },
  guideCategory: { marginBottom: Spacing.md },
  guideCategoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  guideCategoryIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  guideCategoryTitles: { flex: 1, marginLeft: Spacing.md },
  categoryTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  guideCount: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  guidesList: { gap: Spacing.xs },
  guideItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderRadius: BorderRadius.md },
  guideTitle: { flex: 1, fontSize: 15 },
  // Duas styles
  duasContainer: { gap: Spacing.md },
  duaSubTabsContainer: { marginBottom: Spacing.md },
  duaSubTabsContent: { gap: Spacing.sm },
  duaSubTab: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full },
  duaCategoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  duaCategoryCard: { width: '47%', padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center' },
  duaCategoryIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  duaCategoryTitle: { fontWeight: '500', textAlign: 'center', marginBottom: Spacing.xs },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, paddingVertical: Spacing.sm },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing['3xl'] },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.lg },
  deleteAction: { backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', width: 80, marginBottom: Spacing.md, borderRadius: BorderRadius.lg },
  deleteActionContent: { alignItems: 'center', justifyContent: 'center' },
});
