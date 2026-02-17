/**
 * AzkarScreen - Redesigned
 * 
 * Main screen for Azkar tab with time-aware hero, quick access,
 * tasbih counter, daily dhikr, duas, and Islamic guides.
 */

import React, { useCallback, useState, useMemo, useRef } from 'react';
import { Image } from 'react-native';
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
import { useTranslation } from '@/hooks/useTranslation';

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

// 3D icon assets for dua categories
const DUA_3D_ICONS: Record<string, any> = {
  navigation: require('../../assets/images/3d-images/travel.png'),
  coffee: require('../../assets/images/3d-images/eating.png'),
  home: require('../../assets/images/3d-images/entering.png'),
  moon: require('../../assets/images/3d-images/cloud.png'),
  star: require('../../assets/images/3d-images/quranstand.png'),
  heart: require('../../assets/images/3d-images/book.png'),
  shield: require('../../assets/images/3d-images/globe.png'),
  compass: require('../../assets/images/3d-images/Guidance.png'),
  users: require('../../assets/images/3d-images/Family.png'),
  gift: require('../../assets/images/3d-images/Gratitude.png'),
  'refresh-cw': require('../../assets/images/3d-images/Forgiveness.png'),
  cloud: require('../../assets/images/3d-images/Weather.png'),
};

const CUSTOM_DUA_ICON = require('../../assets/images/3d-images/customdua.png');

// Daily tips — simple rotating hadith reminders
const DAILY_TIPS = [
  { text: 'The Prophet ﷺ said: "The best remembrance is La ilaha illallah (There is no god but Allah)."', source: 'Tirmidhi' },
  { text: 'The Prophet ﷺ said: "Whoever says SubhanAllah wa bihamdihi 100 times, his sins will be forgiven even if they were like foam of the sea."', source: 'Bukhari & Muslim' },
  { text: 'The Prophet ﷺ said: "Two words are light on the tongue, heavy on the scales, beloved to the Most Merciful: SubhanAllahi wa bihamdihi, SubhanAllahil Adheem."', source: 'Bukhari & Muslim' },
  { text: 'The Prophet ﷺ said: "Whoever reads Ayat al-Kursi after every obligatory prayer, nothing prevents him from entering Paradise except death."', source: "An-Nasa'i" },
  { text: 'The Prophet ﷺ said: "The closest a servant is to his Lord is when he is in prostration, so increase your supplication."', source: 'Muslim' },
  { text: 'The Prophet ﷺ said: "None of you truly believes until he loves for his brother what he loves for himself."', source: 'Bukhari & Muslim' },
  { text: 'The Prophet ﷺ said: "Whoever believes in Allah and the Last Day, let him speak good or remain silent."', source: 'Bukhari & Muslim' },
  { text: 'The Prophet ﷺ said: "The best of you are those who learn the Quran and teach it."', source: 'Bukhari' },
  { text: 'The Prophet ﷺ said: "A smile in the face of your brother is charity."', source: 'Tirmidhi' },
  { text: 'The Prophet ﷺ said: "Whoever treads a path seeking knowledge, Allah will make easy for him the path to Paradise."', source: 'Muslim' },
  { text: 'The Prophet ﷺ said: "The supplication between the Adhan and Iqamah is not rejected."', source: 'Abu Dawud & Tirmidhi' },
];

function getDailyTip() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}

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
  const { t, locale } = useTranslation();
  const localeFiles: Record<string, any> = {
    en: require('../i18n/locales/en.json'),
    ar: require('../i18n/locales/ar.json'),
    fr: require('../i18n/locales/fr.json'),
    de: require('../i18n/locales/de.json'),
    ru: require('../i18n/locales/ru.json'),
    zh: require('../i18n/locales/zh.json'),
  };
  const currentLocale = localeFiles[locale] || localeFiles.en;
  const localeTips = currentLocale?.azkar?.dailyTips || localeFiles.en?.azkar?.dailyTips;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const tip = Array.isArray(localeTips) ? localeTips[dayOfYear % localeTips.length] : getDailyTip();

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

  const scrollRef = useRef<ScrollView>(null);

  const handleDuaCategoryPress = useCallback((category: DuaCategory) => {
    setSelectedDuaCategory(category.id);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const handleBackFromDuaCategory = useCallback(() => {
    setSelectedDuaCategory(null);
  }, []);

  const handleAddCustomDua = useCallback(() => {
    navigation.navigate('CustomDuaForm', {});
  }, [navigation]);

  const handleDeleteCustomDua = useCallback((dua: CustomDua) => {
    Alert.alert(t('azkar.deleteDua'), t('azkar.deleteDuaConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteCustomDua(dua.id) },
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

  const renderTab = (tab: TabType, label: string, icon: keyof typeof Feather.glyphMap) => {
    const isActive = activeTab === tab;
    return (
      <Pressable
        key={tab}
        onPress={() => setActiveTab(tab)}
        style={[
          styles.tabButton,
          isActive && {
            backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 3,
          },
        ]}
      >
        <Feather name={icon} size={16} color={isActive ? theme.primary : theme.textSecondary} />
        <ThemedText type="body" style={{ marginLeft: Spacing.xs, fontWeight: isActive ? '700' : '500', fontSize: 14, color: isActive ? theme.primary : theme.textSecondary }}>
          {label}
        </ThemedText>
      </Pressable>
    );
  };

  const renderDuaSubTab = (tab: DuaSubTab, label: string, icon: keyof typeof Feather.glyphMap) => {
    const isActive = duaSubTab === tab;
    return (
      <Pressable
        key={tab}
        onPress={() => { setDuaSubTab(tab); setSelectedDuaCategory(null); }}
        style={[styles.duaSubTab, {
          backgroundColor: isActive ? theme.primary : (isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF'),
          shadowColor: isActive ? theme.primary : '#000',
          shadowOffset: { width: 0, height: isActive ? 4 : 3 },
          shadowOpacity: isActive ? 0.25 : 0.06,
          shadowRadius: isActive ? 10 : 8,
          elevation: isActive ? 4 : 2,
          borderWidth: 0,
          borderColor: 'transparent',
        }]}
      >
        <Feather name={icon} size={14} color={isActive ? '#FFFFFF' : theme.textSecondary} />
        <ThemedText type="caption" style={{ marginLeft: 4, color: isActive ? '#FFFFFF' : theme.textSecondary, fontWeight: isActive ? '700' : '500' }}>
          {label}
        </ThemedText>
      </Pressable>
    );
  };

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

  const renderEmptyState = useCallback((message: string, icon: keyof typeof Feather.glyphMap) => (
    <View style={styles.emptyState}>
      {icon === 'edit-3' ? (
        <Image source={CUSTOM_DUA_ICON} style={{ width: 64, height: 64 }} resizeMode="contain" fadeDuration={0} />
      ) : (
        <Feather name={icon} size={48} color={theme.textSecondary} />
      )}
      <ThemedText type="body" secondary style={{ marginTop: Spacing.md, textAlign: 'center' }}>{message}</ThemedText>
    </View>
  ), [theme.textSecondary]);

  return (
    <ThemedView style={styles.container}>
      {/* Tab Selector — Clay Sliding Pill */}
      <View style={[styles.tabContainer, { paddingTop: insets.top + Spacing.md, backgroundColor: theme.backgroundDefault }]}>
        <View style={[styles.tabTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
          {renderTab('azkar', t('tabs.azkar'), 'sun')}
          {renderTab('duas', t('azkar.duas'), 'book-open')}
          {renderTab('guides', t('azkar.guides'), 'compass')}
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + Spacing.xl }]} scrollIndicatorInsets={{ bottom: tabBarHeight }} showsVerticalScrollIndicator={false}>
        <View style={{ display: activeTab === 'azkar' ? 'flex' : 'none' }}>
          <QuickAccessStrip categories={azkarCategories} onCategoryPress={handleCategoryPress} />
          <TasbihCounter />
          <View style={styles.sectionHeader}><ThemedText type="small" secondary style={styles.sectionTitle}>{t('azkar.allCategories')}</ThemedText></View>
          <View style={styles.categoriesGrid}>
            {azkarCategories.map((category) => (<CompactCategoryCard key={category.id} category={category} onPress={() => handleCategoryPress(category)} />))}
          </View>
          <View style={[styles.tipCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 20, elevation: 2 }]}>
            <View style={styles.tipHeader}>
              <Feather name="info" size={20} color={theme.primary} />
              <ThemedText type="body" style={{ marginLeft: Spacing.sm, fontWeight: '600' }}>{t('azkar.dailyTip')}</ThemedText>
            </View>
            <ThemedText type="small" secondary style={styles.tipText}>{tip.text}</ThemedText>
            <ThemedText type="caption" style={{ color: theme.primary }}>- {tip.source}</ThemedText>
          </View>
        </View>

        <View style={{ display: activeTab === 'duas' ? 'flex' : 'none' }}>
          <View style={styles.duasContainer}>
            {/* Search Bar — Inset Clay Dish */}
            <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderWidth: 0, borderColor: 'transparent', borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
              <Feather name="search" size={20} color={theme.textSecondary} />
              <TextInput style={[styles.searchInput, { color: theme.text }]} placeholder={t('azkar.searchDuas')} placeholderTextColor={theme.textSecondary} value={duaSearchQuery} onChangeText={setDuaSearchQuery} />
              {duaSearchQuery.length > 0 && (<Pressable onPress={() => setDuaSearchQuery('')}><Feather name="x" size={20} color={theme.textSecondary} /></Pressable>)}
            </View>

            {/* Sub Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.duaSubTabsContainer} contentContainerStyle={styles.duaSubTabsContent}>
              {renderDuaSubTab('categories', t('azkar.categories'), 'grid')}
              {renderDuaSubTab('quranic', t('azkar.quranic'), 'book-open')}
              {renderDuaSubTab('prophetic', t('azkar.prophetic'), 'bookmark')}
              {renderDuaSubTab('favorites', t('azkar.favorites'), 'heart')}
              {renderDuaSubTab('custom', t('azkar.myDuas'), 'edit-3')}
            </ScrollView>

            {/* Search Results */}
            {duaSearchQuery.trim() ? (
              duaSearchResults.length > 0 ? (
                <FlatList data={duaSearchResults} renderItem={renderDuaItem} keyExtractor={item => item.id} scrollEnabled={false} ListHeaderComponent={<ThemedText type="small" secondary style={{ marginBottom: Spacing.md }}>{duaSearchResults.length} {duaSearchResults.length !== 1 ? t('azkar.results') : t('azkar.result')}</ThemedText>} />
              ) : renderEmptyState(`${t('azkar.noDuasFound')} "${duaSearchQuery}"`, 'search')
            ) : (
              <>
                <View style={{ display: duaSubTab === 'categories' && !selectedDuaCategory ? 'flex' : 'none' }}>
                  <DuaOfTheDay dua={duaOfTheDay} onPress={() => handleDuaPress(duaOfTheDay)} />
                  <View style={styles.duaCategoriesGrid}>
                    {duaCategories.map((category) => (
                      <Pressable key={category.id} onPress={() => handleDuaCategoryPress(category)} style={({ pressed }) => [styles.duaCategoryCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 3, borderWidth: 0, borderColor: 'transparent', opacity: pressed ? 0.7 : 1 }]}>
                        <View style={[styles.duaCategoryIcon, { backgroundColor: `${theme.primary}10` }]}>
                          {DUA_3D_ICONS[category.icon] ? (
                            <Image source={DUA_3D_ICONS[category.icon]} style={{ width: 28, height: 28 }} resizeMode="contain" fadeDuration={0} />
                          ) : (
                            <Feather name={DUA_ICON_MAP[category.icon] || 'star'} size={24} color={theme.primary} />
                          )}
                        </View>
                        <ThemedText type="small" style={styles.duaCategoryTitle}>{t(`duaCategories.${category.id}`)}</ThemedText>
                        <ThemedText type="caption" secondary>{category.count} {t('azkar.duas').toLowerCase()}</ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={{ display: duaSubTab === 'categories' && selectedDuaCategory ? 'flex' : 'none' }}>
                  <Pressable onPress={handleBackFromDuaCategory} style={styles.backButton}>
                    <Feather name="arrow-left" size={20} color={theme.text} />
                    <ThemedText type="body" style={{ marginLeft: Spacing.sm, fontWeight: '600' }}>{t(`duaCategories.${selectedDuaCategory}`) || t('azkar.back')}</ThemedText>
                  </Pressable>
                  <FlatList data={categoryDuas} renderItem={renderDuaItem} keyExtractor={item => item.id} scrollEnabled={false} />
                </View>
                <View style={{ display: duaSubTab === 'quranic' ? 'flex' : 'none' }}>
                  <FlatList data={quranicDuas} renderItem={renderDuaItem} keyExtractor={item => item.id} scrollEnabled={false} ListEmptyComponent={renderEmptyState(t('azkar.noQuranicDuas'), 'book-open')} />
                </View>
                <View style={{ display: duaSubTab === 'prophetic' ? 'flex' : 'none' }}>
                  <FlatList data={propheticDuas} renderItem={renderDuaItem} keyExtractor={item => item.id} scrollEnabled={false} ListEmptyComponent={renderEmptyState(t('azkar.noPropheticDuas'), 'bookmark')} />
                </View>
                <View style={{ display: duaSubTab === 'favorites' ? 'flex' : 'none' }}>
                  <FlatList data={favoriteDuas} renderItem={renderDuaItem} keyExtractor={item => item.id} scrollEnabled={false} ListEmptyComponent={renderEmptyState(t('azkar.tapHeartTip'), 'heart')} />
                </View>
                <View style={{ display: duaSubTab === 'custom' ? 'flex' : 'none' }}>
                  <Pressable onPress={handleAddCustomDua} style={({ pressed }) => [styles.addButton, { backgroundColor: theme.primary, shadowColor: theme.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4, opacity: pressed ? 0.8 : 1 }]}>
                    <Feather name="plus" size={20} color="#fff" />
                    <ThemedText type="body" style={{ color: '#fff', marginLeft: Spacing.sm, fontWeight: '600' }}>{t('azkar.addCustomDua')}</ThemedText>
                  </Pressable>
                  <FlatList data={customDuas} renderItem={renderCustomDuaItem} keyExtractor={item => item.id} scrollEnabled={false} ListEmptyComponent={renderEmptyState(t('azkar.addPersonalSupplications'), 'edit-3')} />
                </View>
              </>
            )}
          </View>
        </View>

        <View style={{ display: activeTab === 'guides' ? 'flex' : 'none' }}>
          <View style={styles.guidesContainer}>
            <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderWidth: 0, borderColor: 'transparent', borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
              <Feather name="search" size={20} color={theme.textSecondary} />
              <TextInput style={[styles.searchInput, { color: theme.text }]} placeholder={t('azkar.searchGuides')} placeholderTextColor={theme.textSecondary} value={searchQuery} onChangeText={setSearchQuery} />
              {searchQuery.length > 0 && (<Pressable onPress={() => setSearchQuery('')}><Feather name="x" size={20} color={theme.textSecondary} /></Pressable>)}
            </View>
            {filteredCategories.length === 0 ? (
              <View style={styles.noResults}><Feather name="search" size={48} color={theme.textSecondary} /><ThemedText type="body" secondary style={{ marginTop: Spacing.md }}>{t('azkar.noGuidesFound')} "{searchQuery}"</ThemedText></View>
            ) : (
              filteredCategories.map((category) => (
                <View key={category.id} style={styles.guideCategory}>
                  <View style={styles.guideCategoryHeader}>
                    <View style={styles.guideCategoryTitles}>
                      <View style={styles.categoryTitleRow}><ThemedText type="h4" style={{ flex: 1 }}>{t(`guideCategories.${category.id}`)}</ThemedText></View>
                    </View>

                  </View>
                  <View style={styles.guidesList}>
                    {category.guides.map((guide) => (
                      <Pressable key={guide.id} onPress={() => handleGuidePress(guide)} style={({ pressed }) => [styles.guideItem, { backgroundColor: theme.cardBackground, opacity: pressed ? 0.7 : 1 }]}>
                        <ThemedText type="body" style={styles.guideTitle}>{t(`guides.${guide.id}.title`)}</ThemedText>
                        <Feather name="chevron-right" size={18} color={theme.textSecondary} />
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabContainer: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, zIndex: 10 },
  tabTrack: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 14, padding: 4, gap: 4, overflow: 'hidden' },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 11, backgroundColor: 'transparent' },
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
