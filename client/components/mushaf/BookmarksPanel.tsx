import React from 'react';
import {
    View,
    Pressable,
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

interface BookmarksPanelProps {
    bookmarks: string[];
    quranData: any;
    surahs: any[];
    isDark: boolean;
    theme: any;
    insets: any;
    styles: any;
    t: (key: string, params?: any) => string;
    onClose: () => void;
    onToggleBookmark: (verseKey: string) => void;
    onNavigateToPage: (page: number) => void;
}

export const BookmarksPanel = React.memo(function BookmarksPanel({
    bookmarks,
    quranData,
    surahs,
    isDark,
    theme,
    insets,
    styles,
    t,
    onClose,
    onToggleBookmark,
    onNavigateToPage,
}: BookmarksPanelProps) {
    return (
        <ThemedView style={styles.container}>
            <View style={[styles.surahListHeader, {
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 10) + 10 : insets.top + 10,
            }]}>
                <View style={styles.headerContent}>
                    <View style={[styles.headerTop, { justifyContent: 'flex-start' }]}>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [{ padding: Spacing.xs, opacity: pressed ? 0.6 : 1 }]}
                        >
                            <Feather name="arrow-left" size={24} color={theme.text} />
                        </Pressable>
                        <View style={{ flex: 1, alignItems: 'center', marginRight: 32 }}>
                            <ThemedText type="h3" style={{ fontWeight: '700', letterSpacing: -1, fontSize: 22 }}>{t('mushaf.bookmarks')}</ThemedText>
                        </View>
                    </View>
                </View>
            </View>
            {bookmarks.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
                    <Feather name="bookmark" size={48} color={theme.textSecondary} style={{ opacity: 0.3, marginBottom: Spacing.md }} />
                    <ThemedText type="body" style={{ opacity: 0.5, textAlign: 'center' }}>{t('mushaf.noBookmarksYet')}</ThemedText>
                    <ThemedText type="caption" style={{ opacity: 0.4, textAlign: 'center', marginTop: Spacing.xs }}>{t('mushaf.tapToBookmark')}</ThemedText>
                </View>
            ) : (
                <FlatList
                    data={bookmarks}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => {
                        const [surah, ayah] = item.split(':');
                        const surahData = quranData.data.surahs.find((s: any) => s.number === parseInt(surah));
                        const surahInfo = surahs.find((s: any) => s.number === parseInt(surah));
                        const ayahData = surahData?.ayahs.find((a: any) => a.numberInSurah === parseInt(ayah));
                        const verseText = ayahData?.text || '';
                        const preview = verseText.length > 60 ? verseText.substring(0, 60) + '...' : verseText;

                        const renderRightActions = (progress: RNAnimated.AnimatedInterpolation<number>, dragX: RNAnimated.AnimatedInterpolation<number>) => {
                            const trans = dragX.interpolate({
                                inputRange: [-100, 0],
                                outputRange: [0, 100],
                                extrapolate: 'clamp',
                            });
                            return (
                                <RNAnimated.View style={{ transform: [{ translateX: trans }], flexDirection: 'row' }}>
                                    <Pressable
                                        onPress={() => onToggleBookmark(item)}
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
                                renderRightActions={renderRightActions}
                                onSwipeableOpen={(direction) => {
                                    if (direction === 'right') {
                                        onToggleBookmark(item);
                                    }
                                }}
                                overshootRight={false}
                            >
                                <Pressable
                                    onPress={() => {
                                        console.log('Bookmark clicked:', { item, surah, ayah });
                                        onNavigateToPage(ayahData?.page || 1);
                                    }}
                                    style={({ pressed }) => [
                                        styles.surahItem,
                                        {
                                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                                            borderWidth: 0,
                                            borderColor: 'transparent',
                                            transform: [{ scale: pressed ? 0.98 : 1 }],
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: isDark ? 0 : 0.05,
                                            shadowRadius: 12,
                                            elevation: isDark ? 0 : 2,
                                        },
                                    ]}
                                >
                                    <View style={styles.surahItemContent}>
                                        <View style={styles.surahLeft}>
                                            <View style={[styles.surahNumber, {
                                                backgroundColor: 'transparent',
                                            }]}>
                                                <Image source={require('../../../assets/images/3d-images/Bookmark.png')} style={{ width: 36, height: 36 }} contentFit="contain" transition={0} cachePolicy="memory" />
                                            </View>
                                            <View style={styles.surahInfo}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                    <ThemedText type="body" style={{ fontWeight: '600', fontSize: 16 }}>{surahInfo?.nameEn || `Surah ${surah}`}, Verse {ayah}</ThemedText>
                                                    <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 16, opacity: 0.7 }}>({surahInfo?.nameAr})</ThemedText>
                                                </View>
                                                <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', marginTop: 4, opacity: 0.7, lineHeight: 22, fontSize: 16, textAlign: 'right' }} numberOfLines={2}>{preview}</ThemedText>
                                            </View>
                                        </View>
                                    </View>
                                </Pressable>
                            </Swipeable>
                        );
                    }}
                    contentContainerStyle={{ padding: Spacing.lg }}
                />
            )}
        </ThemedView>
    );
});
