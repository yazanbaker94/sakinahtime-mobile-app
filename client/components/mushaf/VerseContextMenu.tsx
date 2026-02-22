import React from 'react';
import {
    View,
    Pressable,
    Share,
    Platform,
    Dimensions,
    StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { ThemedText } from '@/components/ThemedText';
import AudioService from '@/services/AudioService';
import { QuranDataBridge } from '@/services/QuranDataBridge';
import { surahs } from '@/data/quran';
import { useHifzMode } from '@/contexts/HifzModeContext';
import { useMushafAudioStore } from '@/stores/useMushafAudioStore';
import { useMushafAnnotationStore } from '@/stores/useMushafAnnotationStore';
import { getVersesToPlay } from '@/components/mushaf/AudioPlayerBar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HIGHLIGHT_COLORS = [
    { name: 'Yellow', value: 'rgba(255, 235, 59, 0.4)' },
    { name: 'Green', value: 'rgba(76, 175, 80, 0.4)' },
    { name: 'Blue', value: 'rgba(33, 150, 243, 0.4)' },
    { name: 'Pink', value: 'rgba(233, 30, 99, 0.4)' },
    { name: 'Orange', value: 'rgba(255, 152, 0, 0.4)' },
];

interface VerseRegion {
    surah: number;
    ayah: number;
    verseKey: string;
    touchX?: number;
    touchY?: number;
}

interface VerseContextMenuProps {
    selectedVerse: VerseRegion;
    onClose: () => void;
    onTafsirPress: () => void;
}

export function VerseContextMenu({ selectedVerse, onClose, onTafsirPress }: VerseContextMenuProps) {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const hifzMode = useHifzMode();
    const { playUntil } = useMushafAudioStore();
    const quranData = QuranDataBridge.quranData;

    const {
        highlights, addHighlight, removeHighlight,
        notes,
        bookmarks, toggleBookmark,
        showNoteModal, setShowNoteModal,
        noteText, setNoteText,
        noteVerseKey, setNoteVerseKey,
        selectedColor, setSelectedColor,
    } = useMushafAnnotationStore();

    return (
        <Pressable style={styles.menuOverlay} onPress={onClose}>
            <Animated.View
                entering={SlideInDown.duration(200)}
                exiting={SlideOutDown.duration(150)}
                style={[
                    styles.verseMenu,
                    {
                        backgroundColor: isDark ? '#141414' : '#FFFFFF',
                        borderRadius: 16,
                        position: 'absolute',
                        ...Platform.select({
                            ios: {
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: isDark ? 0.4 : 0.15,
                                shadowRadius: 12,
                            },
                            android: {
                                elevation: 10,
                            },
                        }),
                        left: (() => {
                            const menuWidth = 180;
                            const x = selectedVerse.touchX || 0;
                            if (x + menuWidth > SCREEN_WIDTH) {
                                return SCREEN_WIDTH - menuWidth - 10;
                            }
                            return Math.max(10, x);
                        })(),
                        top: (() => {
                            const menuHeight = 460;
                            const y = selectedVerse.touchY || 0;
                            const headerHeight = insets.top + 100;
                            const bottomSafeArea = insets.bottom + 20;

                            if (y + menuHeight > SCREEN_HEIGHT - bottomSafeArea) {
                                return Math.max(headerHeight, y - menuHeight - 20);
                            }
                            if (y < headerHeight) {
                                return headerHeight + 10;
                            }
                            return y;
                        })(),
                    },
                ]}
            >
                {/* Play */}
                <Pressable
                    onPress={async () => {
                        onClose();
                        if (hifzMode.isActive && hifzMode.settings.repeatCount > 1) {
                            await AudioService.setPlaybackRate(hifzMode.settings.playbackSpeed);
                            await AudioService.playWithRepeat(
                                selectedVerse.surah,
                                selectedVerse.ayah,
                                hifzMode.settings.repeatCount,
                                hifzMode.settings.pauseBetweenRepeats
                            );
                        } else {
                            const verses = getVersesToPlay(selectedVerse.surah, selectedVerse.ayah, playUntil);
                            if (verses.length > 1) {
                                AudioService.playQueue(verses);
                            } else {
                                if (hifzMode.isActive) {
                                    await AudioService.setPlaybackRate(hifzMode.settings.playbackSpeed);
                                }
                                await AudioService.play(selectedVerse.surah, selectedVerse.ayah, 'single');
                            }
                        }
                    }}
                    style={({ pressed }) => [
                        styles.menuItem,
                        { opacity: pressed ? 0.6 : 1 },
                    ]}
                >
                    <View style={{ width: 28, alignItems: 'center' }}><Feather name="play" size={20} color={theme.primary} /></View>
                    <ThemedText type="body" style={{ marginLeft: 12, fontWeight: '500' }}>
                        {hifzMode.isActive && hifzMode.settings.repeatCount > 1
                            ? `${t('mushaf.play')} ${hifzMode.settings.repeatCount}×`
                            : t('mushaf.play')}
                    </ThemedText>
                </Pressable>

                <View style={[styles.menuDivider, { backgroundColor: `${theme.primary}33` }]} />

                {/* Copy */}
                <Pressable
                    onPress={async () => {
                        const verseData = quranData.data.surahs
                            .find((s: any) => s.number === selectedVerse.surah)
                            ?.ayahs.find((a: any) => a.numberInSurah === selectedVerse.ayah);
                        const surah = surahs.find(s => s.number === selectedVerse.surah);
                        const text = `${verseData?.text || ''}\n\n${surah?.nameAr || ''} (${surah?.nameEn || ''}), Ayah ${selectedVerse.ayah}`;
                        await Clipboard.setStringAsync(text);
                        onClose();
                    }}
                    style={({ pressed }) => [
                        styles.menuItem,
                        { opacity: pressed ? 0.6 : 1 },
                    ]}
                >
                    <View style={{ width: 28, alignItems: 'center' }}><Feather name="copy" size={20} color={theme.primary} /></View>
                    <ThemedText type="body" style={{ marginLeft: 12, fontWeight: '500' }}>{t('mushaf.copyVerse')}</ThemedText>
                </Pressable>

                <View style={[styles.menuDivider, { backgroundColor: `${theme.primary}33` }]} />

                {/* Share */}
                <Pressable
                    onPress={async () => {
                        const verseData = quranData.data.surahs
                            .find((s: any) => s.number === selectedVerse.surah)
                            ?.ayahs.find((a: any) => a.numberInSurah === selectedVerse.ayah);
                        const surah = surahs.find(s => s.number === selectedVerse.surah);
                        const text = `${verseData?.text || ''}\n\n${surah?.nameAr || ''} (${surah?.nameEn || ''}), Ayah ${selectedVerse.ayah}`;
                        try {
                            await Share.share({ message: text });
                        } catch (error) {
                            console.error('Error sharing:', error);
                        }
                        onClose();
                    }}
                    style={({ pressed }) => [
                        styles.menuItem,
                        { opacity: pressed ? 0.6 : 1 },
                    ]}
                >
                    <View style={{ width: 28, alignItems: 'center' }}><Feather name="share-2" size={20} color={theme.primary} /></View>
                    <ThemedText type="body" style={{ marginLeft: 12, fontWeight: '500' }}>{t('mushaf.shareVerse')}</ThemedText>
                </Pressable>

                <View style={[styles.menuDivider, { backgroundColor: `${theme.primary}33` }]} />

                {/* Bookmark */}
                <Pressable
                    onPress={() => {
                        toggleBookmark(selectedVerse.verseKey);
                        onClose();
                    }}
                    style={({ pressed }) => [
                        styles.menuItem,
                        { opacity: pressed ? 0.6 : 1 },
                    ]}
                >
                    <View style={{ width: 28, alignItems: 'center' }}><Feather
                        name="bookmark"
                        size={20}
                        color={theme.primary}
                        fill={bookmarks.includes(selectedVerse.verseKey) ? theme.primary : 'none'}
                    /></View>
                    <ThemedText type="body" style={{ marginLeft: 12, fontWeight: '500' }}>
                        {bookmarks.includes(selectedVerse.verseKey) ? t('mushaf.removeBookmark') : t('mushaf.bookmark')}
                    </ThemedText>
                </Pressable>

                <View style={[styles.menuDivider, { backgroundColor: `${theme.primary}33` }]} />

                {/* Tafsir */}
                <Pressable
                    onPress={onTafsirPress}
                    style={({ pressed }) => [
                        styles.menuItem,
                        { opacity: pressed ? 0.6 : 1 },
                    ]}
                >
                    <View style={{ width: 28, alignItems: 'center' }}><Feather name="book" size={20} color={theme.primary} /></View>
                    <ThemedText type="body" style={{ marginLeft: 12, fontWeight: '500' }}>{t('mushaf.tafsirTranslation')}</ThemedText>
                </Pressable>

                <View style={[styles.menuDivider, { backgroundColor: `${theme.primary}33` }]} />

                {/* Note */}
                <Pressable
                    onPress={() => {
                        setNoteVerseKey(selectedVerse.verseKey);
                        setNoteText(notes[selectedVerse.verseKey] || '');
                        setShowNoteModal(true);
                        onClose();
                    }}
                    style={({ pressed }) => [
                        styles.menuItem,
                        { opacity: pressed ? 0.6 : 1 },
                    ]}
                >
                    <View style={{ width: 28, alignItems: 'center' }}><Feather name="file-text" size={20} color={theme.primary} /></View>
                    <ThemedText type="body" style={{ marginLeft: 12, fontWeight: '500' }}>
                        {notes[selectedVerse.verseKey] ? t('mushaf.editNote') : t('mushaf.addNote')}
                    </ThemedText>
                </Pressable>

                <View style={[styles.menuDivider, { backgroundColor: `${theme.primary}33` }]} />

                {/* Highlight */}
                <Pressable
                    onPress={() => {
                        if (highlights[selectedVerse.verseKey]) {
                            removeHighlight(selectedVerse.verseKey);
                        } else {
                            addHighlight(selectedVerse.verseKey, selectedColor);
                        }
                        onClose();
                    }}
                    style={({ pressed }) => [
                        styles.menuItem,
                        { opacity: pressed ? 0.6 : 1 },
                    ]}
                >
                    <View style={{ width: 28, alignItems: 'center' }}><Feather name="edit-3" size={20} color={theme.primary} /></View>
                    <ThemedText type="body" style={{ marginLeft: 12, fontWeight: '500' }}>
                        {highlights[selectedVerse.verseKey] ? t('mushaf.removeHighlight') : t('mushaf.highlight')}
                    </ThemedText>
                </Pressable>

                {/* Inline color row */}
                <View style={[styles.menuDivider, { backgroundColor: `${theme.primary}33` }]} />
                <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: 10, paddingTop: 8, paddingBottom: 16 }}>
                    {HIGHLIGHT_COLORS.map((color) => {
                        const isSelected = (highlights[selectedVerse.verseKey] === color.value || (!highlights[selectedVerse.verseKey] && selectedColor === color.value));
                        return (
                            <Pressable
                                key={color.name}
                                onPress={() => {
                                    setSelectedColor(color.value);
                                    if (highlights[selectedVerse.verseKey]) {
                                        addHighlight(selectedVerse.verseKey, color.value);
                                    }
                                }}
                                style={({ pressed }) => [{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    borderWidth: isSelected ? 2 : 0,
                                    borderColor: isSelected ? theme.primary : 'transparent',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: pressed ? 0.7 : 1,
                                }]}
                            >
                                <View style={{
                                    width: isSelected ? 18 : 24,
                                    height: isSelected ? 18 : 24,
                                    borderRadius: isSelected ? 9 : 12,
                                    backgroundColor: color.value,
                                }} />
                            </Pressable>
                        );
                    })}
                </View>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    menuOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
    },
    verseMenu: {
        paddingVertical: 8,
        width: 180,
        zIndex: 51,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    menuDivider: {
        height: 1,
        marginHorizontal: 12,
    },
});
