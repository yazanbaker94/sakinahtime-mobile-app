import React from 'react';
import {
    View,
    Modal,
    ScrollView,
    Platform,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { SlideInUp, SlideOutDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useMushafTafsirStore } from '@/stores/useMushafTafsirStore';
import { useMushafSearchStore } from '@/stores/useMushafSearchStore';
import { surahs } from '@/data/quran';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

/** Remove Arabic diacritics and normalize text for search matching */
const normalizeArabicText = (text: string) => {
    return text
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/[\u0617-\u061A\u064B-\u065F]/g, '')
        .replace(/\u0640/g, '')
        .replace(/[\u0600-\u0605\u0610-\u061A\u06D6-\u06ED]/g, '')
        .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
        .replace(/\u0629/g, '\u0647')
        .replace(/[\u0649\u064A\u06CC\u06D0]/g, '\u064A')
        .replace(/\u0624/g, '\u0648')
        .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '')
        .replace(/[\uFB50-\uFDFF\uFE70-\uFEFF]/g, (char) => {
            const code = char.charCodeAt(0);
            if (code >= 0xFE70 && code <= 0xFEFF) {
                return char.normalize('NFKD');
            }
            return char;
        })
        .normalize('NFKD')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
};

// ────────────────────────────────────────
// Component
// ────────────────────────────────────────

export const TafsirViewerModal = React.memo(function TafsirViewerModal() {
    const { isDark, theme } = useTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    // ---- Zustand stores ----
    const {
        tafsirData, setTafsirData,
        showTafsirSources, setShowTafsirSources,
        tafsirVerse,
        availableTafsirs,
        selectedTafsirId,
        showArabicTafsir,
    } = useMushafTafsirStore();

    const { lastSearchTerm } = useMushafSearchStore();

    // ---- Render ----

    return (
        <Modal
            visible={tafsirData !== null && !showTafsirSources}
            transparent
            animationType="fade"
            onRequestClose={() => {
                setTafsirData(null);
            }}
            hardwareAccelerated={true}
            statusBarTranslucent={false}
        >
            <View style={styles.modalOverlay}>
                <Animated.View
                    entering={SlideInUp.duration(300).springify()}
                    exiting={SlideOutDown.duration(200)}
                    style={[
                        styles.modalContainer,
                        {
                            backgroundColor: isDark ? 'rgba(15, 15, 15, 0.92)' : 'rgba(255, 255, 255, 0.82)',
                            maxHeight: SCREEN_HEIGHT * 0.85,
                            width: SCREEN_WIDTH * 0.9,
                            height: SCREEN_HEIGHT * 0.75,
                            overflow: 'hidden',
                        },
                    ]}
                >
                    {Platform.OS === 'ios' && (
                        <BlurView
                            intensity={60}
                            tint={isDark ? 'dark' : 'light'}
                            style={StyleSheet.absoluteFill}
                        />
                    )}

                    {/* Elegant Header */}
                    <View style={{
                        paddingHorizontal: 20,
                        paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 10) + 10 : 20,
                        paddingBottom: 16,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                    }}>
                        {/* Verse Reference */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: `${theme.primary}15`,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Feather name="book-open" size={18} color={theme.primary} />
                                </View>
                                <View>
                                    <ThemedText type="body" style={{ fontWeight: "700", fontSize: 18, letterSpacing: -0.3 }}>
                                        {surahs.find(s => s.number === tafsirVerse?.surah)?.nameEn || `Surah ${tafsirVerse?.surah}`}, Ayah {tafsirVerse?.ayah}
                                    </ThemedText>
                                    <ThemedText type="caption" style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                                        Surah {tafsirVerse?.surah}
                                    </ThemedText>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    requestAnimationFrame(() => {
                                        setTafsirData(null);
                                    });
                                }}
                                activeOpacity={0.7}
                                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Feather name="x" size={22} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Tafsir Source Selector */}
                        <TouchableOpacity
                            onPress={() => {
                                setTafsirData(null);
                                setShowTafsirSources(true);
                            }}
                            activeOpacity={0.7}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingVertical: 12,
                                paddingHorizontal: 14,
                                borderRadius: 14,
                                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.06,
                                shadowRadius: 12,
                                elevation: 3,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                                <View style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: `${theme.primary}33`,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Feather name="layers" size={14} color={theme.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ThemedText type="caption" style={{ fontSize: 10, opacity: 0.6, marginBottom: 2, letterSpacing: 0.5 }}>
                                        TAFSIR SOURCE
                                    </ThemedText>
                                    <ThemedText type="body" style={{ fontWeight: "600", fontSize: 14, letterSpacing: -0.2 }}>
                                        {availableTafsirs.find(t => t.id === selectedTafsirId)?.name || 'Abridged Explanation'}
                                    </ThemedText>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <ThemedText type="caption" style={{ fontSize: 12, color: darkenHex(theme.primary, 0.55), fontWeight: '600' }}>
                                    Change
                                </ThemedText>
                                <Feather name="chevron-right" size={16} color={theme.primary} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Content Area */}
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ padding: 20, paddingBottom: 30, flexGrow: 1 }}
                        showsVerticalScrollIndicator={true}
                    >
                        {tafsirData ? (
                            <View>
                                {/* Decorative Quote Mark */}
                                <View style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 24,
                                    backgroundColor: `${theme.primary}1A`,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 16
                                }}>
                                    <ThemedText style={{ fontSize: 24, opacity: 0.4, lineHeight: 28, textAlign: 'center', includeFontPadding: false }}>"</ThemedText>
                                </View>

                                {/* Tafsir Text */}
                                <View style={{ padding: 0 }}>
                                    <ThemedText
                                        style={{
                                            fontSize: 16,
                                            lineHeight: 26,
                                            letterSpacing: -0.2,
                                            color: theme.text,
                                        }}
                                    >
                                        {(() => {
                                            // Try all possible text locations
                                            const text = tafsirData?.en?.text || tafsirData?.ar?.text || tafsirData?.text;

                                            if (!text) {
                                                return t('mushaf.noTafsirAvailable');
                                            }

                                            // Strip HTML tags
                                            let cleanText = typeof text === 'string' ? text : String(text);
                                            cleanText = cleanText.replace(/<[^>]*>/g, '');
                                            cleanText = cleanText.replace(/&nbsp;/g, ' ');
                                            cleanText = cleanText.replace(/&amp;/g, '&');
                                            cleanText = cleanText.replace(/&lt;/g, '<');
                                            cleanText = cleanText.replace(/&gt;/g, '>');
                                            cleanText = cleanText.replace(/&quot;/g, '"');
                                            cleanText = cleanText.trim();

                                            // If we have a search term, highlight it
                                            if (lastSearchTerm && cleanText) {
                                                const normalizedSearch = showArabicTafsir ? normalizeArabicText(lastSearchTerm) : lastSearchTerm.toLowerCase();

                                                // For Arabic, use sliding window matching
                                                if (showArabicTafsir) {
                                                    const parts: JSX.Element[] = [];
                                                    let partKey = 0;
                                                    let lastIndex = 0;
                                                    let i = 0;

                                                    while (i < cleanText.length) {
                                                        let matchFound = false;

                                                        for (let len = lastSearchTerm.length; len <= cleanText.length - i && len <= lastSearchTerm.length * 3; len++) {
                                                            const substring = cleanText.substring(i, i + len);
                                                            const normalizedSubstring = normalizeArabicText(substring);

                                                            if (normalizedSubstring === normalizedSearch) {
                                                                if (i > lastIndex) {
                                                                    parts.push(
                                                                        <ThemedText key={`text-${partKey++}`} style={{ fontSize: 16, lineHeight: 26, letterSpacing: -0.2, color: theme.text }}>
                                                                            {cleanText.substring(lastIndex, i)}
                                                                        </ThemedText>
                                                                    );
                                                                }
                                                                parts.push(
                                                                    <ThemedText
                                                                        key={`highlight-${partKey++}`}
                                                                        style={{
                                                                            fontSize: 16,
                                                                            lineHeight: 26,
                                                                            letterSpacing: -0.2,
                                                                            backgroundColor: 'rgba(255, 215, 0, 0.4)',
                                                                            color: theme.text,
                                                                            fontWeight: '600',
                                                                        }}
                                                                    >
                                                                        {substring}
                                                                    </ThemedText>
                                                                );
                                                                i += len;
                                                                lastIndex = i;
                                                                matchFound = true;
                                                                break;
                                                            }
                                                        }

                                                        if (!matchFound) {
                                                            i++;
                                                        }
                                                    }

                                                    if (lastIndex < cleanText.length) {
                                                        parts.push(
                                                            <ThemedText key={`text-${partKey++}`} style={{ fontSize: 16, lineHeight: 26, letterSpacing: -0.2, color: theme.text }}>
                                                                {cleanText.substring(lastIndex)}
                                                            </ThemedText>
                                                        );
                                                    }

                                                    return parts.length > 0 ? parts : cleanText;
                                                } else {
                                                    // For English, use simple case-insensitive matching
                                                    const lowerText = cleanText.toLowerCase();
                                                    const lowerSearch = normalizedSearch;

                                                    if (lowerText.includes(lowerSearch)) {
                                                        const parts: JSX.Element[] = [];
                                                        let partKey = 0;
                                                        let lastIndex = 0;
                                                        let searchIndex = lowerText.indexOf(lowerSearch);

                                                        while (searchIndex !== -1) {
                                                            if (searchIndex > lastIndex) {
                                                                parts.push(
                                                                    <ThemedText key={`text-${partKey++}`} style={{ fontSize: 16, lineHeight: 26, letterSpacing: -0.2, color: theme.text }}>
                                                                        {cleanText.substring(lastIndex, searchIndex)}
                                                                    </ThemedText>
                                                                );
                                                            }
                                                            parts.push(
                                                                <ThemedText
                                                                    key={`highlight-${partKey++}`}
                                                                    style={{
                                                                        fontSize: 16,
                                                                        lineHeight: 26,
                                                                        letterSpacing: -0.2,
                                                                        backgroundColor: 'rgba(255, 215, 0, 0.4)',
                                                                        color: theme.text,
                                                                        fontWeight: '600',
                                                                    }}
                                                                >
                                                                    {cleanText.substring(searchIndex, searchIndex + lowerSearch.length)}
                                                                </ThemedText>
                                                            );
                                                            lastIndex = searchIndex + lowerSearch.length;
                                                            searchIndex = lowerText.indexOf(lowerSearch, lastIndex);
                                                        }

                                                        if (lastIndex < cleanText.length) {
                                                            parts.push(
                                                                <ThemedText key={`text-${partKey++}`} style={{ fontSize: 16, lineHeight: 26, letterSpacing: -0.2, color: theme.text }}>
                                                                    {cleanText.substring(lastIndex)}
                                                                </ThemedText>
                                                            );
                                                        }

                                                        return parts;
                                                    }
                                                }
                                            }

                                            return cleanText || t('mushaf.noTafsirAvailable');
                                        })()}
                                    </ThemedText>
                                </View>

                                {/* Bottom Decoration */}
                                <View style={{
                                    marginTop: 24,
                                    paddingTop: 20,
                                    borderTopWidth: 1,
                                    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8
                                }}>
                                    <View style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: `${theme.primary}66`
                                    }} />
                                    <ThemedText type="caption" style={{ fontSize: 11, opacity: 0.4, letterSpacing: 1 }}>
                                        END OF TAFSIR
                                    </ThemedText>
                                    <View style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: `${theme.primary}66`
                                    }} />
                                </View>
                            </View>
                        ) : (
                            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                                <View style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 32,
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 16
                                }}>
                                    <Feather name="book" size={28} color={theme.textSecondary} style={{ opacity: 0.3 }} />
                                </View>
                                <ThemedText type="body" style={{ opacity: 0.5, textAlign: 'center' }}>
                                    No tafsir available
                                </ThemedText>
                            </View>
                        )}
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
});

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        borderRadius: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 40,
        elevation: 20,
    },
});
