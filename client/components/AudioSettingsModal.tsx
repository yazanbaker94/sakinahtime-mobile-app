import React from 'react';
import {
    View,
    Modal,
    ScrollView,
    FlatList,
    Pressable,
    StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useMushafAudioStore } from '@/stores/useMushafAudioStore';
import { Spacing } from '@/constants/theme';
import { QuranDataBridge } from '@/services/QuranDataBridge';
import AudioService from '@/services/AudioService';

// ────────────────────────────────────────
// Static reciter data
// ────────────────────────────────────────

export const reciters = [
    { value: 'Alafasy_128kbps', label: 'Mishary Alafasy', labelAr: 'مشاري العفاسي' },
    { value: 'Abdul_Basit_Murattal_192kbps', label: 'Abdul Basit', labelAr: 'عبد الباسط عبد الصمد' },
    { value: 'Abdullah_Basfar_192kbps', label: 'Abdullah Basfar', labelAr: 'عبدالله بصفر' },
    { value: 'Abdurrahmaan_As-Sudais_192kbps', label: 'Abdurrahman As-Sudais', labelAr: 'عبدالرحمن السديس' },
    { value: 'Abu_Bakr_Ash-Shaatree_128kbps', label: 'Abu Bakr Ash-Shatri', labelAr: 'أبو بكر الشاطري' },
    { value: 'Ahmed_Neana_128kbps', label: 'Ahmed Neana', labelAr: 'أحمد نعينع' },
    { value: 'Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net', label: 'Ahmed Al-Ajamy', labelAr: 'أحمد العجمي' },
    { value: 'Akram_AlAlaqimy_128kbps', label: 'Akram AlAlaqimy', labelAr: 'أكرم العلاقمي' },
    { value: 'Ali_Jaber_64kbps', label: 'Ali Jaber', labelAr: 'علي جابر' },
    { value: 'Ayman_Sowaid_64kbps', label: 'Ayman Sowaid', labelAr: 'أيمن سويد' },
    { value: 'Fares_Abbad_64kbps', label: 'Fares Abbad', labelAr: 'فارس عبّاد' },
    { value: 'Ghamadi_40kbps', label: 'Saad Al-Ghamadi', labelAr: 'سعد الغامدي' },
    { value: 'Hani_Rifai_192kbps', label: 'Hani Rifai', labelAr: 'هاني الرفاعي' },
    { value: 'Hudhaify_128kbps', label: 'Ali Hudhaify', labelAr: 'علي الحذيفي' },
    { value: 'Husary_128kbps', label: 'Mahmoud Al-Hussary', labelAr: 'محمود الحصري' },
    { value: 'Ibrahim_Akhdar_32kbps', label: 'Ibrahim Akhdar', labelAr: 'إبراهيم الأخضر' },
    { value: 'Khaalid_Abdullaah_al-Qahtaanee_192kbps', label: 'Khalid Al-Qahtani', labelAr: 'خالد القحطاني' },
    { value: 'MaherAlMuaiqly128kbps', label: 'Maher Al-Muaiqly', labelAr: 'ماهر المعيقلي' },
    { value: 'Minshawy_Murattal_128kbps', label: 'Mohamed Al-Minshawi', labelAr: 'محمد المنشاوي' },
    { value: 'Mohammad_al_Tablaway_128kbps', label: 'Mohammad Al-Tablaway', labelAr: 'محمد الطبلاوي' },
    { value: 'Muhammad_Ayyoub_128kbps', label: 'Muhammad Ayyub', labelAr: 'محمد أيوب' },
    { value: 'Muhammad_Jibreel_128kbps', label: 'Muhammad Jibreel', labelAr: 'محمد جبريل' },
    { value: 'Muhsin_Al_Qasim_192kbps', label: 'Muhsin Al-Qasim', labelAr: 'محسن القاسم' },
    { value: 'Nasser_Alqatami_128kbps', label: 'Nasser Al-Qatami', labelAr: 'ناصر القطامي' },
    { value: 'Salaah_AbdulRahman_Bukhatir_128kbps', label: 'Salah Bukhatir', labelAr: 'صلاح بوخاطر' },
    { value: 'Salah_Al_Budair_128kbps', label: 'Salah Al-Budair', labelAr: 'صالح البدير' },
    { value: 'Saood_ash-Shuraym_128kbps', label: 'Saud Ash-Shuraim', labelAr: 'سعود الشريم' },
    { value: 'warsh/warsh_yassin_al_jazaery_64kbps', label: 'Yassin Al-Jazaery (Warsh)', labelAr: 'ياسين الجزائري (ورش)' },
];

// ────────────────────────────────────────
// Reciter Picker Modal
// ────────────────────────────────────────

export const ReciterPickerModal = React.memo(function ReciterPickerModal() {
    const { isDark, theme } = useTheme();
    const { t, locale } = useTranslation();
    const insets = useSafeAreaInsets();

    const {
        showReciterPicker, setShowReciterPicker,
        selectedReciter, setSelectedReciter,
    } = useMushafAudioStore();

    const handleReciterChange = (reciter: string) => {
        setSelectedReciter(reciter);
        AudioService.setReciter(reciter);
    };

    return (
        <>
            {showReciterPicker && (
                <Modal
                    visible={true}
                    animationType="slide"
                    presentationStyle="fullScreen"
                    onRequestClose={() => setShowReciterPicker(false)}
                >
                    <ThemedView style={styles.container}>
                        <View style={[styles.settingsHeader, { paddingTop: insets.top + Spacing.md, backgroundColor: isDark ? 'rgba(0, 0, 0, 0.98)' : 'rgba(255, 255, 255, 0.98)' }]}>
                            <Pressable onPress={() => setShowReciterPicker(false)} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]}>
                                <Feather name="arrow-left" size={24} color={theme.text} />
                            </Pressable>
                            <ThemedText type="h3" style={{ fontWeight: '700', fontSize: 24, flex: 1 }}>{t('mushaf.selectReciter')}</ThemedText>
                        </View>
                        <FlatList
                            data={reciters}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <Pressable
                                    onPress={() => {
                                        handleReciterChange(item.value);
                                        setShowReciterPicker(false);
                                    }}
                                    style={({ pressed }) => [{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingVertical: 16,
                                        paddingHorizontal: Spacing.lg,
                                        backgroundColor: pressed ? (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)') : 'transparent',
                                        borderBottomWidth: 1,
                                        borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                                    }]}
                                >
                                    <ThemedText type="body" style={{ fontWeight: selectedReciter === item.value ? '600' : '400', fontSize: 16 }}>{locale === 'ar' ? item.labelAr : item.label}</ThemedText>
                                    {selectedReciter === item.value && <Feather name="check" size={20} color={theme.primary} />}
                                </Pressable>
                            )}
                            contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                        />
                    </ThemedView>
                </Modal>
            )}
        </>
    );
});

// ────────────────────────────────────────
// Audio Settings Modal
// ────────────────────────────────────────

export const AudioSettingsModal = React.memo(function AudioSettingsModal() {
    const { isDark, theme } = useTheme();
    const { t, locale } = useTranslation();
    const insets = useSafeAreaInsets();

    const {
        showAudioSettings, setShowAudioSettings,
        showReciterPicker, setShowReciterPicker,
        playUntil, setPlayUntil,
        selectedReciter,
        audioState,
    } = useMushafAudioStore();

    const quranData = QuranDataBridge.quranData;

    return (
        <Modal
            visible={showAudioSettings}
            transparent
            animationType="slide"
            onRequestClose={() => setShowAudioSettings(false)}
        >
            <ThemedView style={styles.settingsContainer}>
                <View style={[styles.settingsHeader, { paddingTop: insets.top + Spacing.md, backgroundColor: isDark ? 'rgba(0, 0, 0, 0.98)' : 'rgba(255, 255, 255, 0.98)' }]}>
                    <ThemedText type="h3" style={{ fontWeight: '700', fontSize: 24 }}>{t('mushaf.audioSettings')}</ThemedText>
                    <Pressable onPress={() => setShowAudioSettings(false)} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
                        <Feather name="x" size={24} color={theme.text} />
                    </Pressable>
                </View>

                <ScrollView style={styles.settingsContent}>
                    <View style={styles.settingsSection}>
                        <ThemedText type="body" style={{ fontWeight: '600', marginBottom: Spacing.sm, opacity: 0.6, fontSize: 13 }}>{t('mushaf.playUntil')}</ThemedText>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {[
                                { value: 'verse', label: t('mushaf.verse'), icon: 'type' },
                                { value: 'surah', label: t('mushaf.surah'), icon: 'book' },
                                { value: 'page', label: t('mushaf.page'), icon: 'file-text' },
                                { value: 'juz', label: t('mushaf.juz'), icon: 'layers' },
                            ].map((option) => (
                                <Pressable
                                    key={option.value}
                                    onPress={async () => {
                                        const newPlayUntil = option.value as 'verse' | 'surah' | 'page' | 'juz';
                                        setPlayUntil(newPlayUntil);

                                        // If audio is currently playing, restart with new playUntil setting
                                        if (audioState?.current && audioState.isPlaying) {
                                            const currentSurah = audioState.current.surah;
                                            const currentAyah = audioState.current.ayah;

                                            await AudioService.stop();

                                            setTimeout(() => {
                                                const surahData = quranData.data.surahs.find((s: any) => s.number === currentSurah);
                                                if (!surahData) return;

                                                let verses: any[] = [];
                                                if (newPlayUntil === 'verse') {
                                                    verses = [{ surah: currentSurah, ayah: currentAyah }];
                                                } else if (newPlayUntil === 'surah') {
                                                    verses = surahData.ayahs.filter((a: any) => a.numberInSurah >= currentAyah).map((a: any) => ({ surah: currentSurah, ayah: a.numberInSurah }));
                                                } else if (newPlayUntil === 'page') {
                                                    const currentPage = surahData.ayahs.find((a: any) => a.numberInSurah === currentAyah)?.page;
                                                    quranData.data.surahs.forEach((s: any) => {
                                                        s.ayahs.forEach((a: any) => {
                                                            if (a.page === currentPage && (s.number > currentSurah || (s.number === currentSurah && a.numberInSurah >= currentAyah))) {
                                                                verses.push({ surah: s.number, ayah: a.numberInSurah });
                                                            }
                                                        });
                                                    });
                                                } else {
                                                    const currentJuz = surahData.ayahs.find((a: any) => a.numberInSurah === currentAyah)?.juz;
                                                    quranData.data.surahs.forEach((s: any) => {
                                                        s.ayahs.forEach((a: any) => {
                                                            if (a.juz === currentJuz && (s.number > currentSurah || (s.number === currentSurah && a.numberInSurah >= currentAyah))) {
                                                                verses.push({ surah: s.number, ayah: a.numberInSurah });
                                                            }
                                                        });
                                                    });
                                                }

                                                if (verses.length > 0) {
                                                    AudioService.playQueue(verses);
                                                }
                                            }, 300);
                                        }
                                    }}
                                    style={({ pressed }) => [{
                                        flex: 1,
                                        paddingVertical: 14,
                                        borderRadius: 12,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: playUntil === option.value ? theme.primary : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'),
                                        opacity: pressed ? 0.7 : 1,
                                    }]}
                                >
                                    <Feather name={option.icon as any} size={20} color={playUntil === option.value ? '#FFF' : theme.textSecondary} style={{ marginBottom: 4 }} />
                                    <ThemedText type="small" style={{ fontWeight: playUntil === option.value ? '600' : '400', color: playUntil === option.value ? '#FFF' : theme.text, fontSize: 12 }}>{option.label}</ThemedText>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View style={styles.settingsSection}>
                        <ThemedText type="body" style={{ fontWeight: '600', marginBottom: Spacing.sm, opacity: 0.6, fontSize: 13 }}>{t('mushaf.reciterLabel')}</ThemedText>
                        <Pressable
                            onPress={() => {
                                setShowAudioSettings(false);
                                setTimeout(() => setShowReciterPicker(true), 100);
                            }}
                            style={({ pressed }) => [{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingVertical: 14,
                                paddingHorizontal: 16,
                                borderRadius: 12,
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                opacity: pressed ? 0.7 : 1,
                            }]}
                        >
                            <ThemedText type="body" style={{ fontSize: 15, pointerEvents: 'none' }}>{locale === 'ar' ? reciters.find(r => r.value === selectedReciter)?.labelAr : reciters.find(r => r.value === selectedReciter)?.label}</ThemedText>
                            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                        </Pressable>
                    </View>
                </ScrollView>
            </ThemedView>
        </Modal>
    );
});

// ────────────────────────────────────────
// Styles
// ────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    settingsContainer: {
        flex: 1,
        marginTop: 'auto',
    },
    settingsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(128, 128, 128, 0.2)',
    },
    settingsContent: {
        flex: 1,
        padding: Spacing.lg,
    },
    settingsSection: {
        marginBottom: Spacing.xl,
    },
});
