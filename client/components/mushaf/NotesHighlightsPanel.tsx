import React from 'react';
import {
    View,
    Pressable,
    ScrollView,
    FlatList,
    Platform,
    Animated as RNAnimated,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';

interface NotesHighlightsPanelProps {
    notes: Record<string, string>;
    highlights: Record<string, string>;
    noteTimestamps: Record<string, number>;
    highlightTimestamps: Record<string, number>;
    quranData: any;
    surahs: any[];
    isDark: boolean;
    theme: any;
    insets: any;
    styles: any;
    t: (key: string, params?: any) => string;
    onClose: () => void;
    onDeleteNote: (verseKey: string) => void;
    onRemoveHighlight: (verseKey: string) => void;
    onNavigateToPage: (page: number) => void;
}

export const NotesHighlightsPanel = React.memo(function NotesHighlightsPanel({
    notes,
    highlights,
    noteTimestamps,
    highlightTimestamps,
    quranData,
    surahs,
    isDark,
    theme,
    insets,
    styles,
    t,
    onClose,
    onDeleteNote,
    onRemoveHighlight,
    onNavigateToPage,
}: NotesHighlightsPanelProps) {
    const formatTimeAgo = (timestamp: number | undefined) => {
        if (!timestamp) return '';
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (days > 0) return t('mushaf.daysAgo', { count: days });
        if (hrs > 0) return t('mushaf.hoursAgo', { count: hrs });
        if (mins > 0) return t('mushaf.minutesAgo', { count: mins });
        return t('mushaf.justNow');
    };

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.surahListHeader, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)', paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 10) + 10 : insets.top + 10 }]}>
                <View style={styles.headerContent}>
                    <View style={[styles.headerTop, { justifyContent: 'flex-start' }]}>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [{ padding: Spacing.xs, opacity: pressed ? 0.6 : 1 }]}
                        >
                            <Feather name="arrow-left" size={24} color={theme.text} />
                        </Pressable>
                        <View style={{ flex: 1, alignItems: 'center', marginRight: 32 }}>
                            <ThemedText type="h3" style={{ fontWeight: '700', letterSpacing: -1, fontSize: 22 }}>{t('mushaf.notes')}</ThemedText>
                        </View>
                    </View>
                </View>
            </View>
            {Object.keys(highlights).length === 0 && Object.keys(notes).length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
                    <Feather name="edit-3" size={48} color={theme.textSecondary} style={{ opacity: 0.3, marginBottom: Spacing.md }} />
                    <ThemedText type="body" style={{ opacity: 0.5, textAlign: 'center' }}>{t('mushaf.noNotesYet')}</ThemedText>
                    <ThemedText type="caption" style={{ opacity: 0.4, textAlign: 'center', marginTop: Spacing.xs }}>{t('mushaf.tapToAddNote')}</ThemedText>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                    {/* Notes with Text Section */}
                    {Object.keys(notes).length > 0 && (
                        <View style={{ marginTop: Spacing.lg }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
                                <Image source={require('../../../assets/images/3d-images/Notes.png')} style={{ width: 36, height: 36, marginRight: 10 }} contentFit="contain" transition={0} cachePolicy="memory" />
                                <ThemedText type="body" style={{ fontWeight: '700', fontSize: 15, letterSpacing: 0.5, opacity: 0.9 }}>
                                    {t('mushaf.notesSection')} ({Object.keys(notes).length})
                                </ThemedText>
                            </View>
                            {Object.keys(notes).map((verseKey) => {
                                const [surah, ayah] = verseKey.split(':');
                                const surahData = quranData.data.surahs.find((s: any) => s.number === parseInt(surah));
                                const surahInfo = surahs.find((s: any) => s.number === parseInt(surah));
                                const ayahData = surahData?.ayahs.find((a: any) => a.numberInSurah === parseInt(ayah));
                                const verseText = ayahData?.text || '';
                                const timestamp = noteTimestamps[verseKey];
                                const timeAgo = formatTimeAgo(timestamp);

                                const renderRightActions = (progress: RNAnimated.AnimatedInterpolation<number>, dragX: RNAnimated.AnimatedInterpolation<number>) => {
                                    const trans = dragX.interpolate({
                                        inputRange: [-100, 0],
                                        outputRange: [0, 100],
                                        extrapolate: 'clamp',
                                    });
                                    return (
                                        <RNAnimated.View style={{ transform: [{ translateX: trans }], flexDirection: 'row' }}>
                                            <Pressable
                                                onPress={() => {
                                                    onDeleteNote(verseKey);
                                                    if (highlights[verseKey]) {
                                                        onRemoveHighlight(verseKey);
                                                    }
                                                }}
                                                style={{ width: 80, backgroundColor: '#FF4444', justifyContent: 'center', alignItems: 'center', marginHorizontal: Spacing.lg, borderRadius: 12 }}
                                            >
                                                <Feather name="trash-2" size={20} color="#FFF" />
                                                <ThemedText type="caption" style={{ color: '#FFF', fontSize: 11, marginTop: 4 }}>{t('mushaf.delete')}</ThemedText>
                                            </Pressable>
                                        </RNAnimated.View>
                                    );
                                };

                                return (
                                    <Swipeable
                                        key={verseKey}
                                        renderRightActions={renderRightActions}
                                        onSwipeableOpen={(direction) => {
                                            if (direction === 'right') {
                                                onDeleteNote(verseKey);
                                                if (highlights[verseKey]) {
                                                    onRemoveHighlight(verseKey);
                                                }
                                            }
                                        }}
                                        overshootRight={false}
                                    >
                                        <Pressable
                                            onPress={() => onNavigateToPage(ayahData?.page || 1)}
                                            style={({ pressed }) => [{
                                                marginHorizontal: Spacing.lg,
                                                marginBottom: Spacing.sm,
                                                padding: Spacing.md,
                                                borderRadius: 12,
                                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                                                borderWidth: 0,
                                                borderColor: 'transparent',
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: 0.05,
                                                shadowRadius: 12,
                                                elevation: 2,
                                                opacity: pressed ? 0.7 : 1,
                                            }]}
                                        >
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                                <View style={{ flex: 1 }}>
                                                    <ThemedText type="body" style={{ fontWeight: '600', fontSize: 15 }}>{surahInfo?.nameEn} {surah}:{ayah}</ThemedText>
                                                    {timeAgo && <ThemedText type="caption" style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>{timeAgo}</ThemedText>}
                                                </View>
                                                {highlights[verseKey] && (
                                                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: highlights[verseKey], marginLeft: 8, shadowColor: highlights[verseKey], shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.6, shadowRadius: 5, elevation: 4 }} />
                                                )}
                                            </View>
                                            <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 16, opacity: 0.7, marginBottom: 8, textAlign: 'right', lineHeight: 28 }}>{verseText}</ThemedText>
                                            <View style={{
                                                padding: 10,
                                                borderRadius: 8,
                                                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
                                                borderLeftWidth: 3,
                                                borderLeftColor: theme.primary,
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: 0.05,
                                                shadowRadius: 3,
                                            }}>
                                                <ThemedText type="caption" style={{ fontSize: 13, fontStyle: 'italic' }}>{notes[verseKey]}</ThemedText>
                                            </View>
                                        </Pressable>
                                    </Swipeable>
                                );
                            })}
                        </View>
                    )}

                    {/* Highlights Only Section */}
                    {Object.keys(highlights).filter(key => !notes[key]).length > 0 && (
                        <View style={{ marginTop: Spacing.lg }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
                                <Image source={require('../../../assets/images/3d-images/Highlights.png')} style={{ width: 36, height: 36, marginRight: 10 }} contentFit="contain" transition={0} cachePolicy="memory" />
                                <ThemedText type="body" style={{ fontWeight: '700', fontSize: 15, letterSpacing: 0.5, opacity: 0.9 }}>
                                    {t('mushaf.highlightsSection')} ({Object.keys(highlights).filter(key => !notes[key]).length})
                                </ThemedText>
                            </View>
                            {Object.keys(highlights).filter(key => !notes[key]).map((verseKey) => {
                                const color = highlights[verseKey];
                                const [surah, ayah] = verseKey.split(':');
                                const surahData = quranData.data.surahs.find((s: any) => s.number === parseInt(surah));
                                const surahInfo = surahs.find((s: any) => s.number === parseInt(surah));
                                const ayahData = surahData?.ayahs.find((a: any) => a.numberInSurah === parseInt(ayah));
                                const verseText = ayahData?.text || '';
                                const timestamp = highlightTimestamps[verseKey];
                                const timeAgo = formatTimeAgo(timestamp);

                                const renderRightActions = (progress: RNAnimated.AnimatedInterpolation<number>, dragX: RNAnimated.AnimatedInterpolation<number>) => {
                                    const trans = dragX.interpolate({
                                        inputRange: [-100, 0],
                                        outputRange: [0, 100],
                                        extrapolate: 'clamp',
                                    });
                                    return (
                                        <RNAnimated.View style={{ transform: [{ translateX: trans }], flexDirection: 'row' }}>
                                            <Pressable
                                                onPress={() => onRemoveHighlight(verseKey)}
                                                style={{ width: 80, backgroundColor: '#FF4444', justifyContent: 'center', alignItems: 'center', marginHorizontal: Spacing.lg, borderRadius: 12 }}
                                            >
                                                <Feather name="trash-2" size={20} color="#FFF" />
                                                <ThemedText type="caption" style={{ color: '#FFF', fontSize: 11, marginTop: 4 }}>{t('mushaf.delete')}</ThemedText>
                                            </Pressable>
                                        </RNAnimated.View>
                                    );
                                };

                                return (
                                    <Swipeable
                                        key={verseKey}
                                        renderRightActions={renderRightActions}
                                        overshootRight={false}
                                        onSwipeableOpen={(direction) => {
                                            if (direction === 'right') {
                                                onRemoveHighlight(verseKey);
                                            }
                                        }}
                                    >
                                        <Pressable
                                            onPress={() => onNavigateToPage(ayahData?.page || 1)}
                                            style={({ pressed }) => [{
                                                marginHorizontal: Spacing.lg,
                                                marginBottom: Spacing.sm,
                                                padding: Spacing.md,
                                                borderRadius: 12,
                                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                                                borderWidth: 0,
                                                borderColor: 'transparent',
                                                shadowColor: '#000',
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: 0.05,
                                                shadowRadius: 12,
                                                elevation: 2,
                                                opacity: pressed ? 0.7 : 1,
                                            }]}
                                        >
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                                <View style={{ flex: 1 }}>
                                                    <ThemedText type="body" style={{ fontWeight: '600', fontSize: 15 }}>{surahInfo?.nameEn} {surah}:{ayah}</ThemedText>
                                                    {timeAgo && <ThemedText type="caption" style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>{timeAgo}</ThemedText>}
                                                </View>
                                                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: color, marginLeft: 8, shadowColor: color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.6, shadowRadius: 5, elevation: 4 }} />
                                            </View>
                                            <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 16, opacity: 0.7, textAlign: 'right', lineHeight: 28 }}>{verseText}</ThemedText>
                                        </Pressable>
                                    </Swipeable>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
            )}
        </ThemedView>
    );
});
