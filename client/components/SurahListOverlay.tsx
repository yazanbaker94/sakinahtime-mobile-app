import React, { useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import {
    View,
    FlatList,
    ScrollView,
    Pressable,
    TextInput,
    ActivityIndicator,
    Platform,
    StyleSheet,
    Image as RNImage,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useMushafNavigationStore } from '@/stores/useMushafNavigationStore';
import { useMushafSearchStore } from '@/stores/useMushafSearchStore';
import { useMushafTafsirStore } from '@/stores/useMushafTafsirStore';
import { surahs } from '@/data/quran';
import { surahPages } from '@/data/surah-pages';
import { mushafImages } from '@/data/mushaf-images';
import { Spacing } from '@/constants/theme';

import { QuranDataBridge } from '@/services/QuranDataBridge';

// Type for verse region (matches MushafScreen usage)
interface VerseRegion {
    verseKey: string;
    surah: number;
    ayah: number;
}

interface SurahListOverlayProps {
    /** Callback to scroll the pager to a specific page number (1-604) */
    scrollToPage: (page: number) => void;
}

export const SurahListOverlay = React.memo(function SurahListOverlay({
    scrollToPage,
}: SurahListOverlayProps) {
    const { isDark, theme } = useTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const tabBarHeightContext = React.useContext(BottomTabBarHeightContext);
    const tabBarHeight = tabBarHeightContext ?? 0;

    // Refs
    const surahListRef = useRef<FlatList>(null);
    const searchInputRef = useRef<TextInput>(null);
    const justNavigatedRef = useRef(false);

    // ---- Zustand stores ----
    const {
        currentPage, setCurrentPage,
        setIsNavigating,
        showSurahList, setShowSurahList,
        navigationMode, setNavigationMode,
        recentPages,
        juzSortAsc, setJuzSortAsc,
        hizbGranularity, setHizbGranularity,
        showGranularityPicker, setShowGranularityPicker,
        setJumpTarget,
    } = useMushafNavigationStore();

    const {
        showSearchBar, setShowSearchBar,
        searchQuery, setSearchQuery,
        searchResults,
        isSearching,
        includeTafsirInSearch, setIncludeTafsirInSearch,
        setHighlightedVerse,
        setLastSearchTerm,
    } = useMushafSearchStore();

    const {
        setSelectedTafsirId,
        setTafsirData,
        setTafsirVerse,
        setShowArabicTafsir,
    } = useMushafTafsirStore();

    // Calculate current surah from current page for initial scroll position
    const currentSurahIndex = useMemo(() => {
        const currentSurahNumber = Object.entries(surahPages).reduce((found, [surahNum, startPage]) => {
            if (startPage <= currentPage) {
                return parseInt(surahNum);
            }
            return found;
        }, 1);
        return currentSurahNumber - 1; // 0-based index
    }, [currentPage]);

    // Keep surah list scroll position synced with current page
    useLayoutEffect(() => {
        if (justNavigatedRef.current) {
            justNavigatedRef.current = false;
            return;
        }
        if (surahListRef.current && currentSurahIndex > 0) {
            surahListRef.current.scrollToOffset({
                offset: currentSurahIndex * 80,
                animated: false,
            });
        }
    }, [currentSurahIndex]);

    // Pre-prefetch all 114 surah start pages when overlay opens
    // By the time user scrolls and taps, the target image is already in RAM
    React.useEffect(() => {
        if (!showSurahList) return;
        const pages = Object.values(surahPages) as number[];
        // Stagger prefetch in batches to avoid CPU spike
        let cancelled = false;
        (async () => {
            for (let i = 0; i < pages.length; i += 10) {
                if (cancelled) return;
                const batch = pages.slice(i, i + 10);
                await Promise.all(batch.map(page => {
                    const src = mushafImages[page];
                    if (!src) return;
                    const resolved = RNImage.resolveAssetSource(src);
                    if (!resolved?.uri) return;
                    return Image.prefetch(resolved.uri, 'memory').catch(() => { });
                }));
            }
        })();
        return () => { cancelled = true; };
    }, [showSurahList]);

    // Track pages already decoded in memory to skip redundant awaits
    const prefetchedPages = useRef(new Set<number>()).current;

    // Resolve local require() to URI and await full memory prefetch
    const awaitPrefetch = useCallback(async (page: number) => {
        if (prefetchedPages.has(page)) return; // Already in RAM
        try {
            const src = mushafImages[page];
            if (src) {
                const resolved = RNImage.resolveAssetSource(src);
                if (resolved?.uri) {
                    await Image.prefetch(resolved.uri, 'memory');
                    prefetchedPages.add(page);
                }
            }
        } catch (e) {
            // Prefetch failed — proceed anyway, image will decode on mount
        }
    }, []);

    // Fire-and-forget prefetch on touch (pre-warms while finger is on screen)
    const prefetchPage = useCallback((page: number) => {
        if (!page) return;
        awaitPrefetch(page);
        // Also prefetch adjacent pages for smoother swiping after jump
        if (page > 1) awaitPrefetch(page - 1);
        if (page < 604) awaitPrefetch(page + 1);
    }, [awaitPrefetch]);

    // Navigate to a specific surah — Asymmetric Jump pattern
    // 1. Set jumpTarget (window=0, mount only target page)
    // 2. Yield to OS (let GPU paint overlay hide)
    // 3. Imperative PagerView jump
    // 4. Expand window back to ±3 neighbors (background)
    const goToSurah = useCallback((surahNumber: number) => {
        const page = surahPages[surahNumber];
        if (!page) return;

        justNavigatedRef.current = true;

        // Step 1: Hide overlay + mount ONLY target page (Asymmetric Jump)
        setShowSurahList(false);
        setJumpTarget(page);

        // Step 2: Yield to let the overlay hide paint, then jump
        requestAnimationFrame(() => {
            // Step 3: Imperative native jump (target is already mounted)
            scrollToPage(page);

            // Step 4: After the frame paints, expand window to ±3 neighbors
            setTimeout(() => {
                setCurrentPage(page);
                setJumpTarget(null); // Reverts to normal ±3 window
            }, 50);
        });
    }, [scrollToPage, setCurrentPage, setShowSurahList, setJumpTarget]);

    // Navigate to page and close overlay (juz/recent tabs)
    const navigateToPageFromOverlay = useCallback((page: number) => {
        setCurrentPage(page);
        scrollToPage(page);
        setShowSurahList(false);
    }, [scrollToPage, setCurrentPage, setShowSurahList]);

    // Close overlay button handler
    const handleClose = useCallback(() => {
        setShowSurahList(false);
        requestAnimationFrame(() => {
            scrollToPage(currentPage);
        });
    }, [currentPage, scrollToPage, setShowSurahList]);

    // Memoized Juz data for FlatList
    const juzData = useMemo(() => {
        const data: any[] = [];
        const hizbQuarters = new Map();
        QuranDataBridge.quranData.data.surahs.forEach((s: any) => {
            s.ayahs.forEach((a: any) => {
                const key = a.hizbQuarter;
                if (!hizbQuarters.has(key)) {
                    const hizb = Math.ceil(key / 4);
                    const quarter = ((key - 1) % 4) + 1;
                    const juz = a.juz;
                    hizbQuarters.set(key, { juz, hizb, quarter, verse: { ...a, surah: s.number }, surah: surahs.find(su => su.number === s.number) });
                }
            });
        });

        let filtered = Array.from(hizbQuarters.values());
        if (hizbGranularity === 'half') {
            filtered = filtered.filter(item => item.quarter === 2 || item.quarter === 4);
        } else if (hizbGranularity === 'fullJuz') {
            filtered = filtered.filter(item => item.quarter === 1 && item.hizb === (item.juz - 1) * 2 + 1);
        }

        filtered
            .sort((a, b) => juzSortAsc ? (a.juz - b.juz || a.hizb - b.hizb || a.quarter - b.quarter) : (b.juz - a.juz || b.hizb - a.hizb || b.quarter - a.quarter))
            .forEach(item => data.push(item));
        return data;
    }, [juzSortAsc, hizbGranularity]);

    // Render function for Surah FlatList item
    const renderSurahItem = useCallback(({ item }: { item: any }) => (
        <Pressable
            onPressIn={() => prefetchPage(surahPages[item.number])}
            onPress={() => goToSurah(item.number)}
            style={({ pressed }) => [
                styles.surahItem,
                {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                    transform: [{ scale: pressed ? 0.98 : 1 }, { translateY: pressed ? 1 : 0 }],
                    elevation: isDark ? 0 : 1,
                    shadowOpacity: isDark ? 0 : 0.04,
                },
            ]}
        >
            <View style={styles.surahItemContent}>
                <View style={styles.surahLeft}>
                    <View style={[styles.surahNumber, {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.06,
                        shadowRadius: 8,
                        elevation: 2,
                    }]}>
                        <ThemedText type="small" style={{ color: theme.text, fontWeight: '800', fontSize: 13 }}>{item.number}</ThemedText>
                    </View>
                    <View style={{ gap: 3 }}>
                        <ThemedText type="body" style={{ fontWeight: '600', fontSize: 15 }}>{item.nameEn}</ThemedText>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Image
                                source={item.revelationType === 'Meccan' ? require('../../assets/images/qibla3d/kaaba.png') : require('../../assets/images/qibla3d/madinah.png')}
                                style={{ width: 14, height: 14, opacity: 0.7 }}
                                contentFit="contain"
                                transition={0}
                                cachePolicy="memory"
                            />
                            <ThemedText type="caption" style={{ opacity: 0.5, fontSize: 12 }}>{item.versesCount} {t('mushaf.verses')}</ThemedText>
                        </View>
                    </View>
                </View>
                <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 18, opacity: 0.8 }}>{item.nameAr}</ThemedText>
            </View>
        </Pressable>
    ), [isDark, theme, goToSurah, prefetchPage, t]);

    // Render function for Juz FlatList item
    const renderJuzItem = useCallback(({ item, index }: { item: any; index: number }) => {
        const isNewJuz = index === 0 || item.juz !== juzData[index - 1]?.juz;
        const isNewHizb = isNewJuz || item.hizb !== juzData[index - 1]?.hizb;
        const quarterLabel = ['¼', '½', '¾', '1'][item.quarter - 1];
        const hizbLabel = `${t('mushaf.hizbLabel')} ${(item.juz - 1) * 2 + item.hizb}`;

        return (
            <View>
                {isNewJuz && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: index === 0 ? 0 : Spacing.lg, marginBottom: Spacing.sm }}>
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                            <ThemedText type="small" style={{ fontWeight: '800', fontSize: 13, color: theme.text }}>{item.juz}</ThemedText>
                        </View>
                        <ThemedText type="body" style={{ fontSize: 14, fontWeight: '600', opacity: 0.7 }}>{t('mushaf.juzLabel')} {item.juz}</ThemedText>
                    </View>
                )}
                {isNewHizb && (
                    <View style={{ alignSelf: 'center', marginTop: Spacing.sm, marginBottom: Spacing.sm, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 14, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                        <ThemedText type="caption" style={{ fontSize: 12, fontWeight: '600', opacity: 0.6 }}>{hizbLabel}</ThemedText>
                    </View>
                )}
                <Pressable
                    onPressIn={() => prefetchPage(item.verse.page)}
                    onPress={() => {
                        navigateToPageFromOverlay(item.verse.page);
                    }}
                    style={({ pressed }) => [{
                        marginLeft: 44,
                        marginBottom: Spacing.xs,
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                        opacity: pressed ? 0.7 : 1,
                    }]}
                >
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 }}>
                                    <ThemedText type="small" style={{ fontSize: 10, fontWeight: '800', color: theme.text }}>{quarterLabel}</ThemedText>
                                </View>
                                <ThemedText type="body" style={{ fontWeight: '600', fontSize: 14 }}>{item.surah?.nameEn} {item.verse.numberInSurah}</ThemedText>
                            </View>
                            <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 16, opacity: 0.7 }}>{item.surah?.nameAr}</ThemedText>
                        </View>
                        <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 14, opacity: 0.6, textAlign: 'right', lineHeight: 24 }} numberOfLines={2}>{item.verse.text}</ThemedText>
                    </View>
                </Pressable>
            </View>
        );
    }, [juzData, isDark, theme.primary, theme.text, navigateToPageFromOverlay, t]);

    // Handle search result press
    const handleSearchResultPress = useCallback(async (result: any) => {
        const page = result.page;
        setShowSurahList(false);
        setSearchQuery('');
        setIsNavigating(true);
        setCurrentPage(page);

        // If match is from tafsir, load that tafsir and skip selection menu
        if (result.matchType === 'tafsir' && result.tafsirSource) {
            setSelectedTafsirId(result.tafsirSource);

            try {
                const tafsirPath = `${FileSystem.documentDirectory}tafsir-${result.tafsirSource}.json`;
                const fileInfo = await FileSystem.getInfoAsync(tafsirPath);

                let verseData;
                if (fileInfo.exists) {
                    const content = await FileSystem.readAsStringAsync(tafsirPath);
                    const fullData = JSON.parse(content);
                    verseData = fullData[result.verseKey];
                } else {
                    let fullData;
                    if (result.tafsirSource === 'jalalayn') {
                        fullData = await import("@/data/tafsir-jalalayn.json");
                    } else if (result.tafsirSource === 'sahih-international') {
                        fullData = await import("@/data/en-sahih-international-inline-footnotes.json");
                    } else {
                        fullData = await import("@/data/abridged-explanation-of-the-quran.json");
                    }
                    verseData = fullData[result.verseKey];
                }

                if (verseData) {
                    setTafsirData({ text: verseData.text || verseData.t || verseData });
                }
            } catch (error) {
                console.error('Error loading tafsir:', error);
            }
        }

        requestAnimationFrame(() => {
            scrollToPage(page);
            setTimeout(() => {
                setIsNavigating(false);
                setHighlightedVerse(result.verseKey);
                setLastSearchTerm(searchQuery);
                setTimeout(() => setHighlightedVerse(null), 3000);

                if (result.matchType === 'tafsir') {
                    setTafsirVerse({
                        verseKey: result.verseKey,
                        surah: result.surah,
                        ayah: result.ayah
                    } as VerseRegion);
                    setShowArabicTafsir(result.tafsirSource === 'jalalayn');
                }
            }, 300);
        });
    }, [scrollToPage, searchQuery, setCurrentPage, setHighlightedVerse, setIsNavigating, setLastSearchTerm, setSearchQuery, setSelectedTafsirId, setShowArabicTafsir, setShowSurahList, setTafsirData, setTafsirVerse]);

    return (
        <View
            pointerEvents={showSurahList ? 'auto' : 'none'}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isDark ? '#000000' : '#FFFFFF',
                zIndex: showSurahList ? 100 : -1,
                opacity: showSurahList ? 1 : 0,
            }}
        >
            <View style={[styles.surahListHeader, {
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 10) + 10 : insets.top + 10,
                zIndex: 10,
            }]}>
                <View style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <View>
                            <ThemedText type="h3" style={{ fontWeight: '700', letterSpacing: -1, fontSize: 28 }}>{t('mushaf.quran')}</ThemedText>
                            <ThemedText type="caption" style={{ opacity: 0.5, marginTop: 2, fontSize: 13 }}>{navigationMode === 'surah' ? t('mushaf.surahs114') : navigationMode === 'juz' ? t('mushaf.juz30') : `${recentPages.length} ${t('mushaf.recentCount')}`}</ThemedText>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                            <Pressable
                                onPress={() => setShowSearchBar(!showSearchBar)}
                                style={({ pressed }) => [{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: showSearchBar ? `${theme.primary}20` : (isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF'),
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: showSearchBar ? 0 : 0.05,
                                    shadowRadius: 10,
                                    elevation: showSearchBar ? 0 : 2,
                                    transform: [{ scale: pressed ? 0.92 : 1 }],
                                }]}
                            >
                                <Feather name="search" size={18} color={showSearchBar ? theme.primary : theme.text} />
                            </Pressable>
                            <Pressable
                                onPress={handleClose}
                                style={({ pressed }) => [{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 10,
                                    elevation: 2,
                                    transform: [{ scale: pressed ? 0.92 : 1 }],
                                }]}
                            >
                                <Feather name="x" size={20} color={theme.text} />
                            </Pressable>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4, marginTop: Spacing.md, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)', padding: 4, borderRadius: 14 }}>
                        {(['surah', 'juz', 'recent'] as const).map((mode) => (
                            <Pressable
                                key={mode}
                                onPress={() => setNavigationMode(mode)}
                                style={({ pressed }) => [{
                                    flex: 1,
                                    paddingVertical: 10,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    backgroundColor: navigationMode === mode ? theme.primary : 'transparent',
                                    shadowColor: navigationMode === mode ? '#000' : 'transparent',
                                    shadowOffset: { width: 0, height: 6 },
                                    shadowOpacity: navigationMode === mode ? 0.15 : 0,
                                    shadowRadius: 12,
                                    elevation: navigationMode === mode ? 4 : 0,
                                    transform: [{ scale: pressed ? 0.96 : 1 }],
                                }]}
                            >
                                <ThemedText type="body" style={{ fontWeight: navigationMode === mode ? '700' : '500', color: navigationMode === mode ? '#FFF' : (isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'), fontSize: 14 }}>
                                    {mode === 'surah' ? t('mushaf.surahTab') : mode === 'juz' ? t('mushaf.juzTab') : t('mushaf.recentTab')}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </View>

                    {/* Search Bar - collapsible */}
                    {showSearchBar && (
                        <View style={{ marginTop: Spacing.md }}>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                                borderRadius: 12,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                            }}>
                                <Feather name="search" size={18} color={theme.textSecondary} style={{ marginRight: 8 }} />
                                <TextInput
                                    ref={searchInputRef}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholder={t('mushaf.searchPlaceholder')}
                                    placeholderTextColor={theme.textSecondary}
                                    autoFocus={true}
                                    style={{
                                        flex: 1,
                                        fontSize: 15,
                                        color: theme.text,
                                        height: Platform.OS === 'ios' ? 36 : 40,
                                        paddingVertical: Platform.OS === 'ios' ? 8 : 0,
                                        textAlignVertical: 'center',
                                    }}
                                />
                                {searchQuery.length > 0 && (
                                    <Pressable onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                                        <Feather name="x" size={16} color={theme.textSecondary} />
                                    </Pressable>
                                )}
                            </View>
                            {searchQuery.length > 0 && searchQuery.length < 2 && (
                                <ThemedText type="caption" style={{ marginTop: 4, marginLeft: 4, opacity: 0.5, fontSize: 11 }}>
                                    Type at least 2 characters to search
                                </ThemedText>
                            )}

                            {/* Tafsir Search Toggle */}
                            <Pressable
                                onPress={() => setIncludeTafsirInSearch(!includeTafsirInSearch)}
                                style={({ pressed }) => [{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginTop: 8,
                                    paddingVertical: 8,
                                    paddingHorizontal: 12,
                                    borderRadius: 10,
                                    backgroundColor: includeTafsirInSearch
                                        ? `${theme.primary}15`
                                        : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)'),
                                    opacity: pressed ? 0.7 : 1,
                                }]}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Feather
                                        name="book-open"
                                        size={14}
                                        color={includeTafsirInSearch ? theme.primary : theme.textSecondary}
                                    />
                                    <ThemedText
                                        type="caption"
                                        style={{
                                            fontSize: 13,
                                            fontWeight: includeTafsirInSearch ? '600' : '400',
                                            color: includeTafsirInSearch ? theme.primary : theme.text
                                        }}
                                    >
                                        {t('mushaf.includeTafsir')}
                                    </ThemedText>
                                </View>
                                <View style={{
                                    width: 40,
                                    height: 22,
                                    borderRadius: 11,
                                    backgroundColor: includeTafsirInSearch
                                        ? theme.primary
                                        : (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'),
                                    padding: 2,
                                    justifyContent: 'center',
                                    alignItems: includeTafsirInSearch ? 'flex-end' : 'flex-start',
                                }}>
                                    <View style={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: 9,
                                        backgroundColor: '#FFF',
                                    }} />
                                </View>
                            </Pressable>
                        </View>
                    )}
                </View>
            </View>

            {/* ScrollView - only for Search results and Recent tab */}
            {
                (searchQuery.trim().length >= 2 || navigationMode === 'recent') && (
                    <ScrollView contentContainerStyle={{ paddingBottom: tabBarHeight + 60 }}>
                        {/* Search Results */}
                        {searchQuery.trim().length >= 2 && (
                            <View style={{ padding: Spacing.lg }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
                                    {isSearching ? (
                                        <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 8 }} />
                                    ) : (
                                        <Feather name="search" size={16} color={theme.primary} style={{ marginRight: 8 }} />
                                    )}
                                    <ThemedText type="body" style={{ fontWeight: '600', fontSize: 13, opacity: 0.6 }}>
                                        {isSearching ? t('mushaf.searching') : `${searchResults.length} ${t('mushaf.resultsCount')}`}
                                    </ThemedText>
                                </View>
                                {searchResults.length === 0 && !isSearching ? (
                                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                                        <Feather name="search" size={48} color={theme.textSecondary} style={{ opacity: 0.3, marginBottom: 16 }} />
                                        <ThemedText type="body" style={{ opacity: 0.5 }}>{t('mushaf.noResults')}</ThemedText>
                                        <ThemedText type="caption" style={{ opacity: 0.4, marginTop: 4 }}>{t('mushaf.tryDifferent')}</ThemedText>
                                    </View>
                                ) : (
                                    searchResults.map((result: any, index: number) => {
                                        const surahInfo = surahs.find(s => s.number === result.surah);
                                        return (
                                            <Pressable
                                                key={`${result.verseKey}-${index}`}
                                                onPress={() => handleSearchResultPress(result)}
                                                style={({ pressed }) => [{
                                                    padding: 14,
                                                    marginBottom: 8,
                                                    borderRadius: 12,
                                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                                                    borderWidth: 1,
                                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                                                    transform: [{ scale: pressed ? 0.98 : 1 }],
                                                }]}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                                    <View style={{
                                                        paddingHorizontal: 8,
                                                        paddingVertical: 4,
                                                        borderRadius: 6,
                                                        backgroundColor: `${theme.primary}15`,
                                                        marginRight: 8,
                                                    }}>
                                                        <ThemedText type="caption" style={{ fontSize: 11, fontWeight: '700', color: theme.primary }}>
                                                            {result.verseKey}
                                                        </ThemedText>
                                                    </View>
                                                    {result.matchType === 'tafsir' && (
                                                        <>
                                                            <View style={{
                                                                paddingHorizontal: 6,
                                                                paddingVertical: 3,
                                                                borderRadius: 4,
                                                                backgroundColor: `${theme.primary}1A`,
                                                                marginRight: 8,
                                                            }}>
                                                                <ThemedText type="caption" style={{
                                                                    fontSize: 10,
                                                                    fontWeight: '600',
                                                                    color: theme.primary,
                                                                }}>
                                                                    {result.tafsirSource === 'sahih-international' ? 'TRANSLATION' : 'TAFSIR'}
                                                                </ThemedText>
                                                            </View>
                                                            <View style={{
                                                                paddingHorizontal: 6,
                                                                paddingVertical: 3,
                                                                borderRadius: 4,
                                                                backgroundColor: `${theme.primary}1A`,
                                                                marginRight: 8,
                                                            }}>
                                                                <ThemedText type="caption" style={{
                                                                    fontSize: 10,
                                                                    fontWeight: '600',
                                                                    color: theme.primary,
                                                                }}>
                                                                    {result.tafsirSource === 'jalalayn' ? 'JALALAYN' : result.tafsirSource === 'sahih-international' ? 'SAHIH INT\'L' : 'ABRIDGED'}
                                                                </ThemedText>
                                                            </View>
                                                        </>
                                                    )}
                                                    <ThemedText type="body" style={{ fontWeight: '600', fontSize: 14 }}>
                                                        {surahInfo?.nameEn}
                                                    </ThemedText>
                                                    <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 14, opacity: 0.6, marginLeft: 6 }}>
                                                        {surahInfo?.nameAr}
                                                    </ThemedText>
                                                </View>
                                                {result.matchType === 'tafsir' ? (
                                                    <ThemedText
                                                        type="body"
                                                        style={{
                                                            fontSize: 13,
                                                            lineHeight: 20,
                                                            opacity: 0.7,
                                                            fontStyle: 'italic',
                                                        }}
                                                        numberOfLines={3}
                                                    >
                                                        {result.tafsirPreview}
                                                    </ThemedText>
                                                ) : (
                                                    <ThemedText
                                                        type="arabic"
                                                        style={{ fontFamily: 'AlMushafQuran', fontSize: 15, lineHeight: 26, textAlign: 'right', opacity: 0.8 }}
                                                        numberOfLines={2}
                                                    >
                                                        {result.text}
                                                    </ThemedText>
                                                )}
                                            </Pressable>
                                        );
                                    })
                                )}
                            </View>
                        )}

                        {/* Recent Tab Content */}
                        {navigationMode === 'recent' && searchQuery.trim().length < 2 && (
                            <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm }}>
                                {recentPages.length === 0 ? (
                                    <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                                        <Image
                                            source={require('../../assets/images/3d-images/quranstand.webp')}
                                            style={{ width: 96, height: 96, marginBottom: 20 }}
                                            contentFit="contain"
                                            transition={0}
                                            cachePolicy="memory"
                                        />
                                        <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center', fontWeight: '600' }}>
                                            {t('mushaf.noRecentPages')}
                                        </ThemedText>
                                        <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 6, opacity: 0.7 }}>
                                            {t('mushaf.pagesYouVisit')}
                                        </ThemedText>
                                    </View>
                                ) : (
                                    <>
                                        <ThemedText type="body" style={{ fontWeight: '600', opacity: 0.6, fontSize: 13, marginBottom: Spacing.md }}>{t('mushaf.recentlyViewedLabel')}</ThemedText>
                                        {recentPages.map((page: number, index: number) => {
                                            const pageSurah = Object.entries(surahPages).find(([surahNum, startPage]) => {
                                                const nextSurahStart = Object.values(surahPages).find(p => p > startPage) || 605;
                                                return page >= startPage && page < nextSurahStart;
                                            });
                                            const surahNum = pageSurah ? parseInt(pageSurah[0]) : 1;
                                            const surah = surahs.find(s => s.number === surahNum);
                                            const timeAgo = index === 0 ? t('mushaf.justNow') : index < 3 ? t('mushaf.recently') : t('mushaf.earlier');

                                            return (
                                                <Pressable
                                                    key={`recent-${page}-${index}`}
                                                    onPressIn={() => prefetchPage(page)}
                                                    onPress={() => navigateToPageFromOverlay(page)}
                                                    style={({ pressed }) => [{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        paddingVertical: 14,
                                                        paddingHorizontal: 16,
                                                        marginBottom: 8,
                                                        borderRadius: 12,
                                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                                                        opacity: pressed ? 0.7 : 1,
                                                    }]}
                                                >
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                                                            <ThemedText type="body" style={{ fontWeight: '800', fontSize: 12, color: theme.text }}>{surah?.number || page}</ThemedText>
                                                        </View>
                                                        <View>
                                                            <ThemedText type="body" style={{ fontWeight: '600', fontSize: 15 }}>{surah?.nameEn || `${t('mushaf.pageNumber')} ${page}`}</ThemedText>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                                                <Image
                                                                    source={surah?.revelationType === 'Meccan' ? require('../../assets/images/qibla3d/kaaba.png') : require('../../assets/images/qibla3d/madinah.png')}
                                                                    style={{ width: 14, height: 14, opacity: 0.7 }}
                                                                    resizeMode="contain"
                                                                />
                                                                <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 14, opacity: 0.7 }}>{surah?.nameAr}</ThemedText>
                                                            </View>
                                                        </View>
                                                    </View>
                                                    <View style={{ alignItems: 'flex-end' }}>
                                                        <ThemedText type="caption" style={{ color: theme.textSecondary, fontSize: 11 }}>{timeAgo}</ThemedText>
                                                        <ThemedText type="caption" style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>{t('mushaf.pageNumber')} {page}</ThemedText>
                                                    </View>
                                                </Pressable>
                                            );
                                        })}
                                    </>
                                )}
                            </View>
                        )
                        }
                    </ScrollView>
                )
            }

            {/* Surah Tab - Direct FlatList for virtualization */}
            {
                navigationMode === 'surah' && searchQuery.trim().length < 2 && (
                    <FlatList
                        ref={surahListRef}
                        data={surahs}
                        keyExtractor={(item) => `surah-${item.number}`}
                        renderItem={renderSurahItem}
                        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: tabBarHeight + 60 }}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={
                            <ThemedText type="body" style={{ fontWeight: '600', opacity: 0.6, fontSize: 13, marginTop: Spacing.sm, marginBottom: Spacing.md }}>{t('mushaf.allSurahs')}</ThemedText>
                        }
                        initialNumToRender={114}
                        getItemLayout={(data, index) => ({
                            length: 80,
                            offset: 80 * index,
                            index,
                        })}
                        initialScrollIndex={currentSurahIndex > 0 ? currentSurahIndex : undefined}
                        onScrollToIndexFailed={() => { }}
                    />
                )
            }

            {/* Juz Tab - Direct FlatList for virtualization */}
            {
                navigationMode === 'juz' && searchQuery.trim().length < 2 && (
                    <FlatList
                        data={juzData}
                        keyExtractor={(item, index) => `juz-${item.juz}-${item.hizb}-${item.quarter}-${index}`}
                        renderItem={renderJuzItem}
                        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: tabBarHeight + 60 }}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={
                            <View style={{ marginTop: Spacing.sm, marginBottom: Spacing.md }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <ThemedText type="body" style={{ fontWeight: '600', opacity: 0.6, fontSize: 13 }}>
                                        {juzData.length} {hizbGranularity === 'quarter' ? t('mushaf.quartersLabel') : hizbGranularity === 'half' ? t('mushaf.halvesLabel') : t('mushaf.juzLabel')}
                                    </ThemedText>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        {/* Granularity Dropdown Button */}
                                        <Pressable
                                            onPress={() => setShowGranularityPicker(!showGranularityPicker)}
                                            style={({ pressed }) => [{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 4,
                                                paddingVertical: 6,
                                                paddingHorizontal: 12,
                                                borderRadius: 10,
                                                backgroundColor: showGranularityPicker ? `${theme.primary}20` : (isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF'),
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: showGranularityPicker ? 0 : 0.08,
                                                shadowRadius: 10,
                                                elevation: showGranularityPicker ? 0 : 3,
                                                transform: [{ scale: pressed ? 0.92 : 1 }],
                                            }]}
                                        >
                                            <ThemedText style={{ fontSize: 12, fontWeight: '600', color: showGranularityPicker ? theme.primary : theme.text }}>
                                                {hizbGranularity === 'quarter' ? '¼' : hizbGranularity === 'half' ? '½' : 'Juz'}
                                            </ThemedText>
                                            <Feather name={showGranularityPicker ? 'chevron-up' : 'chevron-down'} size={14} color={showGranularityPicker ? theme.primary : theme.text} />
                                        </Pressable>
                                        {/* Sort Button */}
                                        <Pressable
                                            onPress={() => setJuzSortAsc(!juzSortAsc)}
                                            style={({ pressed }) => [{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 4,
                                                paddingVertical: 6,
                                                paddingHorizontal: 12,
                                                borderRadius: 10,
                                                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: 0.08,
                                                shadowRadius: 10,
                                                elevation: 3,
                                                transform: [{ scale: pressed ? 0.92 : 1 }],
                                            }]}
                                        >
                                            <Feather name={juzSortAsc ? 'arrow-up' : 'arrow-down'} size={14} color={theme.text} />
                                        </Pressable>
                                    </View>
                                </View>
                                {/* Dropdown Options */}
                                {showGranularityPicker && (
                                    <View style={{
                                        marginTop: Spacing.sm,
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
                                        borderRadius: 10,
                                        overflow: 'hidden',
                                    }}>
                                        <Pressable
                                            onPress={() => { setHizbGranularity('quarter'); setShowGranularityPicker(false); }}
                                            style={({ pressed }) => [{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                paddingVertical: 12,
                                                paddingHorizontal: 14,
                                                backgroundColor: hizbGranularity === 'quarter' ? `${theme.primary}15` : 'transparent',
                                                opacity: pressed ? 0.7 : 1,
                                            }]}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                <ThemedText style={{ fontSize: 16, fontWeight: '600' }}>¼</ThemedText>
                                                <ThemedText style={{ fontSize: 13 }}>{t('mushaf.quarterHizb')}</ThemedText>
                                            </View>
                                            {hizbGranularity === 'quarter' && <Feather name="check" size={16} color={theme.primary} />}
                                        </Pressable>
                                        <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
                                        <Pressable
                                            onPress={() => { setHizbGranularity('half'); setShowGranularityPicker(false); }}
                                            style={({ pressed }) => [{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                paddingVertical: 12,
                                                paddingHorizontal: 14,
                                                backgroundColor: hizbGranularity === 'half' ? `${theme.primary}15` : 'transparent',
                                                opacity: pressed ? 0.7 : 1,
                                            }]}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                <ThemedText style={{ fontSize: 16, fontWeight: '600' }}>½</ThemedText>
                                                <ThemedText style={{ fontSize: 13 }}>{t('mushaf.halfHizb')}</ThemedText>
                                            </View>
                                            {hizbGranularity === 'half' && <Feather name="check" size={16} color={theme.primary} />}
                                        </Pressable>
                                        <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
                                        <Pressable
                                            onPress={() => { setHizbGranularity('fullJuz'); setShowGranularityPicker(false); }}
                                            style={({ pressed }) => [{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                paddingVertical: 12,
                                                paddingHorizontal: 14,
                                                backgroundColor: hizbGranularity === 'fullJuz' ? `${theme.primary}15` : 'transparent',
                                                opacity: pressed ? 0.7 : 1,
                                            }]}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                <ThemedText style={{ fontSize: 16, fontWeight: '600' }}>{t('mushaf.juz')}</ThemedText>
                                                <ThemedText style={{ fontSize: 13 }}>{t('mushaf.fullJuzOnly')}</ThemedText>
                                            </View>
                                            {hizbGranularity === 'fullJuz' && <Feather name="check" size={16} color={theme.primary} />}
                                        </Pressable>
                                    </View>
                                )}
                            </View>
                        }
                        initialNumToRender={15}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                    />
                )
            }

        </View >
    );
});

const styles = StyleSheet.create({
    surahListHeader: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 0,
    },
    headerContent: {
        // Container for header content
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    surahItem: {
        marginBottom: 6,
        borderRadius: 14,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
    },
    surahItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    surahLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    surahNumber: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
