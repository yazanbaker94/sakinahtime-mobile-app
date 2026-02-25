import React, { useCallback, useRef } from 'react';
import {
    View,
    Modal,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Platform,
    Alert,
    StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useMushafTafsirStore } from '@/stores/useMushafTafsirStore';
import { Spacing } from '@/constants/theme';

// ────────────────────────────────────────
// Pure helper utilities
// ────────────────────────────────────────

/** Darken a hex color by a factor (0 = black, 1 = unchanged) */
const darkenHex = (hex: string, factor: number): string => {
    const h = hex.replace('#', '');
    const r = Math.round(parseInt(h.substring(0, 2), 16) * factor);
    const g = Math.round(parseInt(h.substring(2, 4), 16) * factor);
    const b = Math.round(parseInt(h.substring(4, 6), 16) * factor);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/** Map language code to readable name */
const getLanguageName = (code: string): string => {
    const languageMap: Record<string, string> = {
        'ar': 'Arabic', 'en': 'English', 'bn': 'Bengali', 'id': 'Indonesian', 'tr': 'Turkish',
        'ur': 'Urdu', 'fa': 'Persian', 'fr': 'French', 'de': 'German', 'es': 'Spanish',
        'ru': 'Russian', 'zh': 'Chinese', 'ja': 'Japanese', 'ko': 'Korean', 'it': 'Italian',
        'nl': 'Dutch', 'pl': 'Polish', 'sv': 'Swedish', 'no': 'Norwegian', 'fi': 'Finnish',
        'cs': 'Czech', 'ro': 'Romanian', 'el': 'Greek', 'uk': 'Ukrainian', 'hi': 'Hindi',
        'ta': 'Tamil', 'ml': 'Malayalam', 'as': 'Assamese', 'bs': 'Bosnian', 'km': 'Khmer',
        'ps': 'Pashto', 'uz': 'Uzbek', 'ne': 'Nepali', 'ks': 'Kashmiri', 'si': 'Sinhalese',
        'tl': 'Tagalog', 'vi': 'Vietnamese', 'sq': 'Albanian'
    };
    return languageMap[code] || code.toUpperCase();
};

/** Check if item is a tafsir (commentary) vs translation */
const isTafsir = (id: string): boolean => {
    const tafsirIds = ['jalalayn', 'abridged', 'abu-bakr-jabir-al-jazairi', 'al-i-rab-al-muyassar',
        'ar-tafseer-al-saddi', 'ar-tafsir-al-baghawi', 'ar-tafsir-al-wasit', 'arabic-al-mukhtasar',
        'assamese-mokhtasar', 'asseraj-fi-bayan', 'bengali-mokhtasar', 'bn-tafseer-ibn-e-kaseer',
        'bosnian-mokhtasar', 'chinese-mokhtasar', 'en-tafisr-ibn-kathir', 'french-mokhtasar',
        'i-rab-al-quran', 'id-tafsir-as-saadi', 'indonesian-mokhtasar', 'italian-mokhtasar',
        'japanese-mokhtasar', 'khmer-mokhtasar', 'malayalam-mokhtasar', 'persian-mokhtasar',
        'ru-tafsir-ibne-kahtir', 'russian-mokhtasar', 'sinhalese-mokhtasar', 'sq-saadi',
        'tafseer-ibn-e-kaseer-urdu', 'tafsir-as-saadi-russian', 'tafsir-as-saadi',
        'tafsir-bayan-ul-quran', 'tafsir-ibn-abi-zamanin', 'tagalog-mokhtasar',
        'tr-tafsir-ibne-kathir', 'turkish-mokhtasar', 'vietnamese-mokhtasar'];
    return tafsirIds.includes(id);
};

// ────────────────────────────────────────
// Component
// ────────────────────────────────────────

export const TafsirSourcesModal = React.memo(function TafsirSourcesModal() {
    const { isDark, theme } = useTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    // Refs for horizontal language filter scroll views
    const translationLangScrollRef = useRef<ScrollView>(null);
    const tafsirLangScrollRef = useRef<ScrollView>(null);

    // ---- Zustand store ----
    const {
        tafsirVerse,
        showTafsirSources, setShowTafsirSources,
        expandedTranslations, setExpandedTranslations,
        expandedTafsirs, setExpandedTafsirs,
        expandedAvailable, setExpandedAvailable,
        expandedAvailableTranslations, setExpandedAvailableTranslations,
        expandedAvailableTafsirs, setExpandedAvailableTafsirs,
        translationLanguageFilter, setTranslationLanguageFilter,
        tafsirLanguageFilter, setTafsirLanguageFilter,
        availableTafsirs, setAvailableTafsirs,
        downloadingTafsir, setDownloadingTafsir,
        selectedTafsirId, setSelectedTafsirId,
        isSwipingTafsir,
        setTafsirData,
    } = useMushafTafsirStore();

    // ---- Side effects ----

    // Download a tafsir file from URL to local filesystem
    const downloadTafsirFile = useCallback(async (tafsirId: string, url: string) => {
        setDownloadingTafsir(tafsirId);
        try {
            console.log('Starting download for:', tafsirId);

            if (Platform.OS === 'android') {
                try {
                    const freeDiskStorage = await FileSystem.getFreeDiskStorageAsync();
                    console.log('Free disk storage:', (freeDiskStorage / 1024 / 1024).toFixed(2), 'MB');
                } catch (e) {
                    console.log('Could not check free storage:', e);
                }
            }

            const tafsirDir = `${FileSystem.documentDirectory}tafsirs/`;
            const tafsirPath = `${tafsirDir}${tafsirId}.json`;

            const dirInfo = await FileSystem.getInfoAsync(tafsirDir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(tafsirDir, { intermediates: true });
            }

            const downloadResult = await FileSystem.downloadAsync(url, tafsirPath);

            if (downloadResult.status === 200) {
                console.log('Download successful:', tafsirId);
                setAvailableTafsirs(prev => prev.map(t => t.id === tafsirId ? { ...t, downloaded: true } : t));
            } else {
                throw new Error(`Download failed with status: ${downloadResult.status}`);
            }
        } catch (error: any) {
            console.error('Download failed:', tafsirId, error?.message);
            if (error?.message?.includes('SQLITE_FULL')) {
                alert(t('mushaf.storageFull'));
            } else {
                alert(t('mushaf.downloadFailed'));
            }
        } finally {
            setDownloadingTafsir(null);
        }
    }, [t, setDownloadingTafsir, setAvailableTafsirs]);

    // Delete a downloaded tafsir from filesystem
    const deleteTafsir = useCallback(async (tafsirId: string) => {
        try {
            const tafsirPath = `${FileSystem.documentDirectory}tafsirs/${tafsirId}.json`;
            const fileInfo = await FileSystem.getInfoAsync(tafsirPath);

            if (fileInfo.exists) {
                await FileSystem.deleteAsync(tafsirPath);
                console.log('✅ Deleted tafsir file:', tafsirId);
            }

            setAvailableTafsirs(prev => prev.map(t =>
                t.id === tafsirId ? { ...t, downloaded: false } : t
            ));

            if (selectedTafsirId === tafsirId) {
                setSelectedTafsirId('abridged');
                await AsyncStorage.setItem('@selectedTafsir', 'abridged');
            }
        } catch (error) {
            console.error('❌ Failed to delete tafsir:', error);
            alert('Failed to delete. Please try again.');
        }
    }, [selectedTafsirId, setAvailableTafsirs, setSelectedTafsirId]);

    // Load downloaded tafsirs from filesystem on focus
    useFocusEffect(
        React.useCallback(() => {
            const loadDownloadedTafsirs = async () => {
                try {
                    // Clean up old tafsir data from AsyncStorage
                    const keys = await AsyncStorage.getAllKeys();
                    const tafsirKeys = keys.filter(key => key.startsWith('@tafsir_') && !key.includes('_downloaded_'));
                    if (tafsirKeys.length > 0) {
                        await AsyncStorage.multiRemove(tafsirKeys);
                    }

                    const tafsirDir = `${FileSystem.documentDirectory}tafsirs/`;
                    const dirInfo = await FileSystem.getInfoAsync(tafsirDir);

                    if (dirInfo.exists) {
                        const files = await FileSystem.readDirectoryAsync(tafsirDir);
                        const downloadedIds = files.map(f => f.replace('.json', ''));

                        setAvailableTafsirs(prev => prev.map(t => ({
                            ...t,
                            downloaded: (t.id === 'jalalayn' || t.id === 'abridged' || t.id === 'sahih-international')
                                ? true
                                : downloadedIds.includes(t.id)
                        })));
                    } else {
                        setAvailableTafsirs(prev => prev.map(t => ({
                            ...t,
                            downloaded: t.id === 'jalalayn' || t.id === 'abridged' || t.id === 'sahih-international'
                        })));
                    }
                } catch (error) {
                    console.error('Failed to load downloaded tafsirs:', error);
                }
            };

            loadDownloadedTafsirs();
        }, [])
    );

    // Handle selecting a downloaded tafsir (loads content and closes modal)
    const handleSelectTafsir = useCallback(async (tafsir: any) => {
        if (!tafsir.downloaded) return;

        setSelectedTafsirId(tafsir.id);
        await AsyncStorage.setItem('@selectedTafsir', tafsir.id);

        if (tafsirVerse) {
            try {
                const key = tafsirVerse.verseKey;
                let tafsirContent = null;

                if (tafsir.id === 'abridged') {
                    const enTafsir = await import("@/data/abridged-explanation-of-the-quran.json");
                    tafsirContent = { text: enTafsir[key]?.text || 'No tafsir available' };
                } else if (tafsir.id === 'jalalayn') {
                    const arTafsir = await import("@/data/tafsir-jalalayn.json");
                    tafsirContent = { text: arTafsir[key]?.text || 'No tafsir available' };
                } else if (tafsir.id === 'sahih-international') {
                    const sahihTafsir = await import("@/data/en-sahih-international-inline-footnotes.json");
                    tafsirContent = { text: sahihTafsir[key]?.t || 'No tafsir available' };
                } else {
                    const tafsirPath = `${FileSystem.documentDirectory}tafsirs/${tafsir.id}.json`;
                    const fileInfo = await FileSystem.getInfoAsync(tafsirPath);

                    if (fileInfo.exists) {
                        const fileContent = await FileSystem.readAsStringAsync(tafsirPath);
                        const response = JSON.parse(fileContent);
                        const tafsirDataParsed = response.data || response;

                        if (tafsirDataParsed.surahs) {
                            const surah = tafsirDataParsed.surahs.find((s: any) => s.number === tafsirVerse.surah);
                            const ayah = surah?.ayahs?.find((a: any) => a.numberInSurah === tafsirVerse.ayah);
                            tafsirContent = ayah ? { text: ayah.text || 'No tafsir available' } : { text: 'No tafsir available for this verse' };
                        } else {
                            const entry = tafsirDataParsed[key];

                            if (!entry && key) {
                                const [surah, ayah] = key.split(':');
                                const wordKeys = Object.keys(tafsirDataParsed).filter(k => k.startsWith(`${surah}:${ayah}:`));

                                if (wordKeys.length > 0) {
                                    const words = wordKeys
                                        .sort((a, b) => {
                                            const aWord = parseInt(a.split(':')[2]);
                                            const bWord = parseInt(b.split(':')[2]);
                                            return aWord - bWord;
                                        })
                                        .map(k => tafsirDataParsed[k])
                                        .join(' ');
                                    tafsirContent = { text: words };
                                } else {
                                    tafsirContent = { text: 'No tafsir available for this verse' };
                                }
                            } else {
                                tafsirContent = entry ? { text: entry.t || entry.text || entry.tafsir || entry.content || 'No tafsir available' } : { text: 'No tafsir available for this verse' };
                            }
                        }
                    }
                }

                setTafsirData(tafsirContent ? { en: tafsirContent, ar: tafsirContent } : null);
                setTimeout(() => setShowTafsirSources(false), 50);
            } catch (e) {
                console.error("Failed to reload tafsir:", e);
                setShowTafsirSources(false);
            }
        } else {
            setShowTafsirSources(false);
        }
    }, [tafsirVerse, setSelectedTafsirId, setTafsirData, setShowTafsirSources]);

    // ---- Render helpers ----

    /** Render a downloaded tafsir/translation item (with swipe-to-delete for non-bundled) */
    const renderDownloadedItem = useCallback((tafsir: any) => {
        const isActive = selectedTafsirId === tafsir.id;
        const canDelete = !['jalalayn', 'abridged', 'sahih-international'].includes(tafsir.id);

        const renderRightActions = () => (
            <View style={{ justifyContent: 'center', alignItems: 'flex-end', paddingRight: 10 }}>
                <Pressable
                    onPress={() => deleteTafsir(tafsir.id)}
                    style={({ pressed }) => [{
                        backgroundColor: '#EF4444',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 80,
                        height: '90%',
                        borderRadius: 12,
                        opacity: pressed ? 0.8 : 1
                    }]}
                >
                    <Feather name="trash-2" size={20} color="#FFF" />
                    <ThemedText style={{ color: '#FFF', fontSize: 12, fontWeight: '600', marginTop: 4 }}>{t('mushaf.delete')}</ThemedText>
                </Pressable>
            </View>
        );

        const handleAction = async () => {
            if (tafsir.downloaded) {
                await handleSelectTafsir(tafsir);
            } else if (tafsir.url) {
                await downloadTafsirFile(tafsir.id, tafsir.url);
            }
        };

        const itemContent = (
            <Pressable
                key={tafsir.id}
                onPress={handleAction}
                onLongPress={() => {
                    if (canDelete && Platform.OS === 'android') {
                        Alert.alert(
                            t('mushaf.deleteTafsir'),
                            t('mushaf.deleteTafsirConfirm', { name: tafsir.name }),
                            [
                                { text: t('common.cancel'), style: 'cancel' },
                                { text: t('mushaf.delete'), style: 'destructive', onPress: () => deleteTafsir(tafsir.id) }
                            ]
                        );
                    }
                }}
                disabled={downloadingTafsir === tafsir.id}
                style={({ pressed }) => [{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 16,
                    marginBottom: 10,
                    borderRadius: 16,
                    backgroundColor: isActive
                        ? `${theme.primary}0D`
                        : (isDark ? '#1f2937' : '#FFFFFF'),
                    borderWidth: 0,
                    borderColor: 'transparent',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: isActive ? 0.08 : 0.04,
                    shadowRadius: 24,
                    elevation: isActive ? 4 : 2,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                }]}
            >
                <View style={{ flex: 1, marginRight: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                        <ThemedText type="body" style={{ fontWeight: '600', fontSize: 16, letterSpacing: -0.2, flexShrink: 1 }}>{tafsir.name}</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: `${theme.primary}33` }}>
                            <ThemedText type="caption" style={{ fontSize: 11, fontWeight: '700', color: darkenHex(theme.primary, 0.55), letterSpacing: 0.3 }}>
                                {getLanguageName(tafsir.language)}
                            </ThemedText>
                        </View>
                        <View style={{ paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, backgroundColor: `${theme.primary}1A` }}>
                            <ThemedText type="caption" style={{ fontSize: 10, fontWeight: '700', color: darkenHex(theme.primary, 0.55), letterSpacing: 0.5 }}>
                                {isTafsir(tafsir.id) ? t('mushaf.tafsirBadge') : t('mushaf.translationBadge')}
                            </ThemedText>
                        </View>
                    </View>
                    {isActive && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.primary }} />
                            <ThemedText type="caption" style={{ fontSize: 12, color: theme.primary, fontWeight: '600' }}>
                                {t('mushaf.currentlyActive')}
                            </ThemedText>
                        </View>
                    )}
                </View>
                {downloadingTafsir === tafsir.id ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                ) : isActive ? (
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name="check" size={20} color="#FFFFFF" />
                    </View>
                ) : (
                    <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: `${theme.primary}26` }}>
                        <ThemedText type="caption" style={{ fontSize: 12, color: darkenHex(theme.primary, 0.55), fontWeight: '600' }}>
                            {t('mushaf.select')}
                        </ThemedText>
                    </View>
                )}
            </Pressable>
        );

        return canDelete ? (
            <Swipeable
                key={tafsir.id}
                renderRightActions={renderRightActions}
                overshootRight={false}
                onSwipeableOpen={(direction) => {
                    if (direction === 'right') {
                        deleteTafsir(tafsir.id);
                    }
                }}
            >
                {itemContent}
            </Swipeable>
        ) : itemContent;
    }, [selectedTafsirId, downloadingTafsir, isDark, theme, deleteTafsir, handleSelectTafsir, downloadTafsirFile, t]);

    /** Render an available-to-download item */
    const renderDownloadableItem = useCallback((tafsir: any) => {
        const handleDownload = async () => {
            if (tafsir.url) {
                await downloadTafsirFile(tafsir.id, tafsir.url);
            }
        };

        return (
            <Pressable
                key={tafsir.id}
                onPress={handleDownload}
                disabled={downloadingTafsir === tafsir.id}
                style={({ pressed }) => [{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 16,
                    marginBottom: 10,
                    borderRadius: 16,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    opacity: downloadingTafsir === tafsir.id ? 0.6 : 1,
                }]}
            >
                <View style={{ flex: 1, marginRight: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                        <ThemedText type="body" style={{ fontWeight: '600', fontSize: 16, letterSpacing: -0.2, flexShrink: 1 }}>{tafsir.name}</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: `${theme.primary}33` }}>
                            <ThemedText type="caption" style={{ fontSize: 11, fontWeight: '700', color: theme.primary, letterSpacing: 0.3 }}>
                                {getLanguageName(tafsir.language)}
                            </ThemedText>
                        </View>
                        <View style={{ paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, backgroundColor: `${theme.primary}1A` }}>
                            <ThemedText type="caption" style={{ fontSize: 10, fontWeight: '700', color: darkenHex(theme.primary, 0.55), letterSpacing: 0.5 }}>
                                {isTafsir(tafsir.id) ? t('mushaf.tafsirBadge') : t('mushaf.translationBadge')}
                            </ThemedText>
                        </View>
                    </View>
                    <ThemedText type="caption" style={{ fontSize: 12, opacity: 0.5, marginTop: 8 }}>
                        {t('mushaf.tapToDownload')}
                    </ThemedText>
                </View>
                {downloadingTafsir === tafsir.id ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${theme.primary}26`, alignItems: 'center', justifyContent: 'center' }}>
                        <Feather name="download" size={18} color={theme.primary} />
                    </View>
                )}
            </Pressable>
        );
    }, [downloadingTafsir, isDark, theme, downloadTafsirFile, t]);

    // ---- Render ----

    return (
        <Modal
            visible={showTafsirSources}
            animationType="fade"
            presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
            onRequestClose={() => {
                setShowTafsirSources(false);
            }}
            statusBarTranslucent={Platform.OS === 'android'}
        >
            <ThemedView style={styles.container}>
                {/* Header */}
                <View style={[styles.settingsHeader, {
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                    paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 10) + 10 : insets.top + 10,
                    paddingHorizontal: 20,
                    paddingBottom: 16
                }]}>
                    <Pressable onPress={() => setShowTafsirSources(false)} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]}>
                        <Feather name="arrow-left" size={24} color={theme.text} />
                    </Pressable>
                    <View style={{ flex: 1 }}>
                        <ThemedText type="h3" style={{ fontWeight: '700', fontSize: 24 }}>{t('mushaf.tafsirAndTranslations')}</ThemedText>
                        <ThemedText type="caption" style={{ opacity: 0.5, marginTop: 2, fontSize: 13 }}>
                            {availableTafsirs.filter(tf => tf.downloaded).length} {t('mushaf.downloadedCount')}
                        </ThemedText>
                    </View>
                </View>

                <ScrollView
                    contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
                    scrollEnabled={!isSwipingTafsir}
                >
                    {/* ═══════ Downloaded Translations ═══════ */}
                    {availableTafsirs.filter(t => t.downloaded && !isTafsir(t.id)).length > 0 && (
                        <>
                            <Pressable
                                onPress={() => setExpandedTranslations(!expandedTranslations)}
                                style={({ pressed }) => [{
                                    flexDirection: 'row', alignItems: 'center',
                                    marginBottom: expandedTranslations ? Spacing.md : Spacing.sm,
                                    marginTop: Spacing.xs, opacity: pressed ? 0.7 : 1
                                }]}
                            >
                                <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                                    <Image source={require('../../assets/images/3d-images/globe.webp')} style={{ width: 28, height: 28 }} contentFit="contain" transition={0} cachePolicy="memory" />
                                </View>
                                <ThemedText type="body" style={{ fontWeight: '700', fontSize: 15, letterSpacing: 0.5, opacity: 0.9, flex: 1 }}>
                                    {t('mushaf.myTranslations')}
                                </ThemedText>
                                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)', alignItems: 'center', justifyContent: 'center' }}>
                                    <Feather name={expandedTranslations ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
                                </View>
                            </Pressable>
                            {expandedTranslations && availableTafsirs.filter(t => t.downloaded && !isTafsir(t.id)).map((tafsir) => renderDownloadedItem(tafsir))}
                        </>
                    )}

                    {/* ═══════ Downloaded Tafsirs ═══════ */}
                    {availableTafsirs.filter(t => t.downloaded && isTafsir(t.id)).length > 0 && (
                        <>
                            <Pressable
                                onPress={() => setExpandedTafsirs(!expandedTafsirs)}
                                style={({ pressed }) => [{
                                    flexDirection: 'row', alignItems: 'center',
                                    marginBottom: expandedTafsirs ? Spacing.md : Spacing.sm,
                                    marginTop: Spacing.lg, opacity: pressed ? 0.7 : 1
                                }]}
                            >
                                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                                    <Image source={require('../../assets/images/3d-images/book.webp')} style={{ width: 28, height: 28 }} contentFit="contain" transition={0} cachePolicy="memory" />
                                </View>
                                <ThemedText type="body" style={{ fontWeight: '700', fontSize: 15, letterSpacing: 0.5, opacity: 0.9, flex: 1 }}>
                                    {t('mushaf.myTafsirs')}
                                </ThemedText>
                                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)', alignItems: 'center', justifyContent: 'center' }}>
                                    <Feather name={expandedTafsirs ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
                                </View>
                            </Pressable>
                            {expandedTafsirs && availableTafsirs.filter(t => t.downloaded && isTafsir(t.id)).map((tafsir) => renderDownloadedItem(tafsir))}
                        </>
                    )}

                    {/* ═══════ Available to Download ═══════ */}
                    {availableTafsirs.filter(t => !t.downloaded).length > 0 && (
                        <>
                            <Pressable
                                onPress={() => setExpandedAvailable(!expandedAvailable)}
                                style={({ pressed }) => [{
                                    flexDirection: 'row', alignItems: 'center',
                                    marginBottom: expandedAvailable ? Spacing.md : Spacing.sm,
                                    marginTop: Spacing.lg, opacity: pressed ? 0.7 : 1
                                }]}
                            >
                                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                                    <Image source={require('../../assets/images/3d-images/cloud.webp')} style={{ width: 28, height: 28 }} contentFit="contain" transition={0} cachePolicy="memory" />
                                </View>
                                <ThemedText type="body" style={{ fontWeight: '700', fontSize: 15, letterSpacing: 0.5, opacity: 0.9, flex: 1 }}>
                                    {t('mushaf.availableToDownload')}
                                </ThemedText>
                                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)', alignItems: 'center', justifyContent: 'center' }}>
                                    <Feather name={expandedAvailable ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
                                </View>
                            </Pressable>
                            {expandedAvailable && (
                                <>
                                    {/* Available Translations */}
                                    {availableTafsirs.filter(t => !t.downloaded && !isTafsir(t.id)).length > 0 && (
                                        <>
                                            <Pressable
                                                onPress={() => setExpandedAvailableTranslations(!expandedAvailableTranslations)}
                                                style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 8, opacity: pressed ? 0.7 : 1 }]}
                                            >
                                                <ThemedText type="body" style={{ fontWeight: '600', fontSize: 13, letterSpacing: 0.5, opacity: 0.6, flex: 1 }}>
                                                    {t('mushaf.translationsCount')} ({availableTafsirs.filter(tf => !tf.downloaded && !isTafsir(tf.id) && (!translationLanguageFilter || tf.language === translationLanguageFilter)).length})
                                                </ThemedText>
                                                <Feather name={expandedAvailableTranslations ? "chevron-up" : "chevron-down"} size={14} color={theme.textSecondary} style={{ opacity: 0.6 }} />
                                            </Pressable>
                                            {expandedAvailableTranslations && (
                                                <ScrollView
                                                    ref={translationLangScrollRef}
                                                    horizontal
                                                    showsHorizontalScrollIndicator={false}
                                                    style={{ marginBottom: 12 }}
                                                    onContentSizeChange={() => {
                                                        if (translationLanguageFilter && translationLangScrollRef.current) {
                                                            const langs = [...new Set(availableTafsirs.filter(t => !t.downloaded && !isTafsir(t.id)).map(t => t.language))].sort();
                                                            const idx = langs.indexOf(translationLanguageFilter);
                                                            if (idx >= 0) {
                                                                const scrollX = 50 + (idx * 70) - 40;
                                                                translationLangScrollRef.current.scrollTo({ x: Math.max(0, scrollX), animated: false });
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <Pressable
                                                        onPress={() => setTranslationLanguageFilter(null)}
                                                        style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, backgroundColor: translationLanguageFilter === null ? theme.primary : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') }}
                                                    >
                                                        <ThemedText type="caption" style={{ color: translationLanguageFilter === null ? '#fff' : theme.textSecondary, fontWeight: '600' }}>{t('mushaf.all')}</ThemedText>
                                                    </Pressable>
                                                    {[...new Set(availableTafsirs.filter(t => !t.downloaded && !isTafsir(t.id)).map(t => t.language))].sort().map(lang => (
                                                        <Pressable
                                                            key={lang}
                                                            onPress={() => setTranslationLanguageFilter(translationLanguageFilter === lang ? null : lang)}
                                                            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, backgroundColor: translationLanguageFilter === lang ? theme.primary : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') }}
                                                        >
                                                            <ThemedText type="caption" style={{ color: translationLanguageFilter === lang ? '#fff' : theme.textSecondary, fontWeight: '600' }}>{getLanguageName(lang)}</ThemedText>
                                                        </Pressable>
                                                    ))}
                                                </ScrollView>
                                            )}
                                            {expandedAvailableTranslations && availableTafsirs
                                                .filter(t => !t.downloaded && !isTafsir(t.id) && (!translationLanguageFilter || t.language === translationLanguageFilter))
                                                .map((tafsir) => renderDownloadableItem(tafsir))}
                                        </>
                                    )}

                                    {/* Available Tafsirs */}
                                    {availableTafsirs.filter(t => !t.downloaded && isTafsir(t.id)).length > 0 && (
                                        <>
                                            <Pressable
                                                onPress={() => setExpandedAvailableTafsirs(!expandedAvailableTafsirs)}
                                                style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 20, opacity: pressed ? 0.7 : 1 }]}
                                            >
                                                <ThemedText type="body" style={{ fontWeight: '600', fontSize: 13, letterSpacing: 0.5, opacity: 0.6, flex: 1 }}>
                                                    {t('mushaf.tafsirsCount')} ({availableTafsirs.filter(tf => !tf.downloaded && isTafsir(tf.id) && (!tafsirLanguageFilter || tf.language === tafsirLanguageFilter)).length})
                                                </ThemedText>
                                                <Feather name={expandedAvailableTafsirs ? "chevron-up" : "chevron-down"} size={14} color={theme.textSecondary} style={{ opacity: 0.6 }} />
                                            </Pressable>
                                            {expandedAvailableTafsirs && (
                                                <ScrollView
                                                    ref={tafsirLangScrollRef}
                                                    horizontal
                                                    showsHorizontalScrollIndicator={false}
                                                    style={{ marginBottom: 12 }}
                                                    onContentSizeChange={() => {
                                                        if (tafsirLanguageFilter && tafsirLangScrollRef.current) {
                                                            const langs = [...new Set(availableTafsirs.filter(t => !t.downloaded && isTafsir(t.id)).map(t => t.language))].sort();
                                                            const idx = langs.indexOf(tafsirLanguageFilter);
                                                            if (idx >= 0) {
                                                                const scrollX = 50 + (idx * 70) - 40;
                                                                tafsirLangScrollRef.current.scrollTo({ x: Math.max(0, scrollX), animated: false });
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <Pressable
                                                        onPress={() => setTafsirLanguageFilter(null)}
                                                        style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, backgroundColor: tafsirLanguageFilter === null ? theme.primary : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') }}
                                                    >
                                                        <ThemedText type="caption" style={{ color: tafsirLanguageFilter === null ? '#fff' : theme.textSecondary, fontWeight: '600' }}>{t('mushaf.all')}</ThemedText>
                                                    </Pressable>
                                                    {[...new Set(availableTafsirs.filter(t => !t.downloaded && isTafsir(t.id)).map(t => t.language))].sort().map(lang => (
                                                        <Pressable
                                                            key={lang}
                                                            onPress={() => setTafsirLanguageFilter(tafsirLanguageFilter === lang ? null : lang)}
                                                            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, backgroundColor: tafsirLanguageFilter === lang ? theme.primary : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') }}
                                                        >
                                                            <ThemedText type="caption" style={{ color: tafsirLanguageFilter === lang ? '#fff' : theme.textSecondary, fontWeight: '600' }}>{getLanguageName(lang)}</ThemedText>
                                                        </Pressable>
                                                    ))}
                                                </ScrollView>
                                            )}
                                            {expandedAvailableTafsirs && availableTafsirs
                                                .filter(t => !t.downloaded && isTafsir(t.id) && (!tafsirLanguageFilter || t.language === tafsirLanguageFilter))
                                                .map((tafsir) => renderDownloadableItem(tafsir))}
                                        </>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </ScrollView>
            </ThemedView>
        </Modal>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    settingsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 0,
    },
});
