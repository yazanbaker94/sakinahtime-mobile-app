import React from 'react';
import { Modal, Pressable, View, TouchableOpacity, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { ThemedText } from '@/components/ThemedText';
import AudioService from '@/services/AudioService';
import { useHifzMode } from '@/contexts/HifzModeContext';
import { useHifzProgress } from '@/hooks/useHifzProgress';
import { Spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HifzStatusMenuProps {
    visible: boolean;
    onClose: () => void;
    verseKey: string | null;
    position: { x: number; y: number };
}

export function HifzStatusMenu({ visible, onClose, verseKey, position }: HifzStatusMenuProps) {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const hifzMode = useHifzMode();
    const { markVerse: markHifzVerse } = useHifzProgress();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable
                style={{ flex: 1 }}
                onPress={onClose}
            >
                <View
                    style={[
                        styles.hifzStatusMenu,
                        {
                            // Menu is approximately 320px tall, up to 240px wide
                            // Ensure it stays within screen bounds with padding
                            top: Math.max(
                                insets.top + 10,
                                Math.min(
                                    position.y - 80,
                                    SCREEN_HEIGHT - insets.bottom - 340
                                )
                            ),
                            left: Math.max(
                                12,
                                Math.min(
                                    position.x - 100,
                                    SCREEN_WIDTH - 252
                                )
                            ),
                            backgroundColor: theme.cardBackground,
                        },
                    ]}
                >
                    <ThemedText style={{ fontSize: 11, opacity: 0.5, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 4 }}>
                        {verseKey}
                    </ThemedText>

                    {/* Not Started */}
                    <TouchableOpacity
                        style={styles.hifzStatusMenuItem}
                        onPress={async () => {
                            if (verseKey) {
                                await markHifzVerse(verseKey, 'not_started');
                            }
                            onClose();
                        }}
                    >
                        <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.border }} />
                        <ThemedText style={styles.hifzStatusMenuText}>{t('mushaf.notStarted')}</ThemedText>
                    </TouchableOpacity>

                    {/* In Progress */}
                    <TouchableOpacity
                        style={styles.hifzStatusMenuItem}
                        onPress={async () => {
                            if (verseKey) {
                                await markHifzVerse(verseKey, 'in_progress');
                            }
                            onClose();
                        }}
                    >
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#F59E0B' }} />
                        <ThemedText style={styles.hifzStatusMenuText}>{t('mushaf.inProgress')}</ThemedText>
                    </TouchableOpacity>

                    {/* Memorized */}
                    <TouchableOpacity
                        style={styles.hifzStatusMenuItem}
                        onPress={async () => {
                            if (verseKey) {
                                await markHifzVerse(verseKey, 'memorized');
                            }
                            onClose();
                        }}
                    >
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: theme.primary }} />
                        <ThemedText style={styles.hifzStatusMenuText}>{t('mushaf.memorized')}</ThemedText>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 8, marginHorizontal: 16 }} />

                    {/* Play Button */}
                    <TouchableOpacity
                        style={styles.hifzStatusMenuItem}
                        onPress={async () => {
                            if (verseKey) {
                                const [surah, ayah] = verseKey.split(':').map(Number);
                                if (hifzMode.settings.repeatCount > 1) {
                                    await AudioService.setPlaybackRate(hifzMode.settings.playbackSpeed);
                                    await AudioService.playWithRepeat(
                                        surah,
                                        ayah,
                                        hifzMode.settings.repeatCount,
                                        hifzMode.settings.pauseBetweenRepeats
                                    );
                                } else {
                                    await AudioService.setPlaybackRate(hifzMode.settings.playbackSpeed);
                                    await AudioService.play(surah, ayah, 'single');
                                }
                            }
                            onClose();
                        }}
                    >
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
                            <Feather name="play" size={12} color="#FFFFFF" />
                        </View>
                        <ThemedText style={styles.hifzStatusMenuText}>
                            {hifzMode.settings.repeatCount > 1
                                ? t('mushaf.playCount', { count: hifzMode.settings.repeatCount })
                                : t('mushaf.play')}
                        </ThemedText>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 8, marginHorizontal: 16 }} />

                    {/* Loop Start */}
                    <TouchableOpacity
                        style={styles.hifzStatusMenuItem}
                        onPress={() => {
                            if (verseKey) {
                                hifzMode.setLoopStart(verseKey);
                            }
                            onClose();
                        }}
                    >
                        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: hifzMode.loopStart ? theme.primary : 'transparent', borderWidth: 2, borderColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
                            {hifzMode.loopStart && <ThemedText style={{ color: '#FFF', fontSize: 9, fontWeight: '700' }}>A</ThemedText>}
                        </View>
                        <ThemedText style={styles.hifzStatusMenuText}>
                            {t('mushaf.setLoopStart')}
                        </ThemedText>
                    </TouchableOpacity>

                    {/* Loop End */}
                    <TouchableOpacity
                        style={styles.hifzStatusMenuItem}
                        onPress={() => {
                            if (verseKey) {
                                hifzMode.setLoopEnd(verseKey);
                            }
                            onClose();
                        }}
                    >
                        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: hifzMode.loopEnd ? theme.primary : 'transparent', borderWidth: 2, borderColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
                            {hifzMode.loopEnd && <ThemedText style={{ color: '#FFF', fontSize: 9, fontWeight: '700' }}>B</ThemedText>}
                        </View>
                        <ThemedText style={styles.hifzStatusMenuText}>
                            {t('mushaf.setLoopEnd')}
                        </ThemedText>
                    </TouchableOpacity>

                    {/* Start Loop (if both set) */}
                    {hifzMode.loopStart && hifzMode.loopEnd && (
                        <TouchableOpacity
                            style={[styles.hifzStatusMenuItem, { backgroundColor: `${theme.primary}15`, marginTop: 4 }]}
                            onPress={async () => {
                                const [startSurah, startAyah] = hifzMode.loopStart!.split(':').map(Number);
                                const [endSurah, endAyah] = hifzMode.loopEnd!.split(':').map(Number);
                                await AudioService.setPlaybackRate(hifzMode.settings.playbackSpeed);
                                await AudioService.playLoop(startSurah, startAyah, endSurah, endAyah, 0);
                                onClose();
                            }}
                        >
                            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
                                <Feather name="play" size={10} color="#FFFFFF" />
                            </View>
                            <ThemedText style={[styles.hifzStatusMenuText, { color: theme.primary }]}>
                                {t('mushaf.playLoop')}
                            </ThemedText>
                        </TouchableOpacity>
                    )}
                </View>
            </Pressable>
        </Modal>
    );
}

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    hifzStatusMenu: {
        position: 'absolute',
        borderRadius: 12,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 20,
        minWidth: 200,
        maxWidth: 240,
    },
    hifzStatusMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 12,
    },
    hifzStatusMenuText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
