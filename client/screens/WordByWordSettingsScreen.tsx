import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform, ActivityIndicator, Switch, Alert } from "react-native";
import { Image } from 'expo-image';
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearWbwCache } from "@/services/WordMeaningService";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Available word-by-word translation languages
// English is bundled, others are downloaded on-demand
const WBW_LANGUAGES = [
  { id: 'english', name: 'English', file: 'english-wbw-translation.json', flag: '🇬🇧', bundled: true },
  { id: 'arabic-gharib', name: 'غريب القرآن', file: 'quran_words.json', flag: '🇸🇦', bundled: true, isArabicMeaning: true },
  { id: 'urdu', name: 'Urdu', file: 'urud-wbw.json', flag: '🇵🇰', bundled: false },
  { id: 'indonesian', name: 'Indonesian', file: 'indonesian-word-by-word-translation.json', flag: '🇮🇩', bundled: false },
  { id: 'bangla', name: 'Bangla', file: 'bangali-word-by-word-translation.json', flag: '🇧🇩', bundled: false },
  { id: 'turkish', name: 'Turkish', file: 'turkish-wbw-translation.json', flag: '🇹🇷', bundled: false },
  { id: 'tamil', name: 'Tamil', file: 'tamil-wbw-translation.json', flag: '🇮🇳', bundled: false },
  { id: 'french', name: 'French', file: 'french-wbw-translation.json', flag: '🇫🇷', bundled: false },
  { id: 'persian', name: 'Persian', file: 'persian-wbw-translation.json', flag: '🇮🇷', bundled: false },
];

const WBW_CDN_BASE = 'https://sakinahtime.com/translations/wbw';
const STORAGE_KEY = '@wbw_language';
const AUDIO_ENABLED_KEY = '@wbw_audio_enabled';
const WBW_DIR = `${FileSystem.documentDirectory}wbw/`;

export default function WordByWordSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [downloadedLanguages, setDownloadedLanguages] = useState<Set<string>>(
    new Set(WBW_LANGUAGES.map(l => l.id))
  );
  const [downloadingLanguage, setDownloadingLanguage] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    loadSavedLanguage();
    loadAudioSetting();
    checkDownloadedLanguages();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSelectedLanguage(saved);
      }
    } catch (e) {
      console.error('Failed to load WBW language:', e);
    }
  };

  const loadAudioSetting = async () => {
    try {
      const saved = await AsyncStorage.getItem(AUDIO_ENABLED_KEY);
      if (saved !== null) {
        setAudioEnabled(saved === 'true');
      }
    } catch (e) {
      console.error('Failed to load audio setting:', e);
    }
  };

  const toggleAudio = async (value: boolean) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setAudioEnabled(value);
      await AsyncStorage.setItem(AUDIO_ENABLED_KEY, value.toString());
    } catch (e) {
      console.error('Failed to save audio setting:', e);
    }
  };

  const checkDownloadedLanguages = async () => {
    try {
      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(WBW_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(WBW_DIR, { intermediates: true });
      }

      const downloaded = new Set<string>(['english', 'arabic-gharib']); // English and Arabic meanings are always available (bundled)

      for (const lang of WBW_LANGUAGES) {
        if (!lang.bundled) {
          const filePath = `${WBW_DIR}${lang.file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          if (fileInfo.exists) {
            // Validate file is valid JSON (not a corrupted HTML error page)
            try {
              const content = await FileSystem.readAsStringAsync(filePath);
              JSON.parse(content);
              downloaded.add(lang.id);
            } catch {
              // Corrupted file — delete it silently
              console.warn(`Deleting corrupted WBW file: ${lang.file}`);
              await FileSystem.deleteAsync(filePath, { idempotent: true });
            }
          }
        }
      }

      setDownloadedLanguages(downloaded);
    } catch (e) {
      console.error('Failed to check downloaded languages:', e);
    }
  };

  const downloadLanguage = async (langId: string) => {
    const lang = WBW_LANGUAGES.find(l => l.id === langId);
    if (!lang || lang.bundled) return;

    try {
      setDownloadingLanguage(langId);
      setDownloadProgress(0);

      const url = `${WBW_CDN_BASE}/${lang.file}`;
      const filePath = `${WBW_DIR}${lang.file}`;

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        filePath,
        {},
        (progress) => {
          const percent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
          setDownloadProgress(percent);
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (result?.uri) {
        // Validate downloaded file is valid JSON
        try {
          const content = await FileSystem.readAsStringAsync(filePath);
          JSON.parse(content);
          setDownloadedLanguages(prev => new Set([...prev, langId]));
          // Auto-select after download
          selectLanguage(langId);
        } catch {
          // Downloaded file is not valid JSON (e.g., HTML error page)
          await FileSystem.deleteAsync(filePath, { idempotent: true });
          Alert.alert(
            'Download Failed',
            'The downloaded file was corrupted. Please check your internet connection and try again.'
          );
        }
      }
    } catch (e) {
      console.error('Failed to download WBW language:', e);
      Alert.alert(
        'Download Failed',
        'Could not download the language file. Please check your connection and try again.'
      );
    } finally {
      setDownloadingLanguage(null);
      setDownloadProgress(0);
    }
  };

  const selectLanguage = async (langId: string) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setSelectedLanguage(langId);
      await AsyncStorage.setItem(STORAGE_KEY, langId);
      // Clear the WBW cache so it reloads with new language
      clearWbwCache();
    } catch (e) {
      console.error('Failed to save WBW language:', e);
    }
  };

  const handleLanguagePress = (lang: typeof WBW_LANGUAGES[0]) => {
    if (downloadingLanguage) return; // Don't allow actions while downloading

    if (downloadedLanguages.has(lang.id)) {
      selectLanguage(lang.id);
    } else {
      downloadLanguage(lang.id);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, {
        paddingTop: insets.top + Spacing.md,
        backgroundColor: isDark ? theme.backgroundRoot : theme.backgroundRoot,
        zIndex: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
      }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3" style={{ fontWeight: '700' }}>
          {t('wordByWord.title')}
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info - moved to top */}
        <View style={[styles.infoBox, {
          backgroundColor: isDark ? 'rgba(94, 156, 170, 0.1)' : 'rgba(212,175,55,0.08)',
          marginBottom: Spacing.lg,
          borderWidth: 0,
          borderColor: 'transparent',
        }]}>
          <Image
            source={require('../../assets/images/3d-images/info.webp')}
            style={{
              width: 28,
              height: 28,
              marginRight: 10,
              shadowColor: '#D4AF37',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
            }}
            contentFit="contain"
            transition={0}
            cachePolicy="memory"
          />
          <ThemedText type="caption" style={{ flex: 1, color: theme.textSecondary }}>
            {t('wordByWord.infoHint')}
          </ThemedText>
        </View>

        {/* Subtitle */}
        <ThemedText type="caption" secondary style={{ marginBottom: Spacing.sm }}>
          {t('wordByWord.translationLanguage')}
        </ThemedText>

        {/* Language Options */}
        <View style={styles.section}>
          <View style={[styles.card, {
            backgroundColor: isDark ? `${theme.primary}33` : '#FFFFFF',
            borderWidth: 0,
            borderColor: 'transparent',
            elevation: isDark ? 0 : 2,
            shadowOpacity: isDark ? 0 : 0.05,
            shadowRadius: 12,
          }]}>
            {WBW_LANGUAGES.map((lang, index) => {
              const isSelected = selectedLanguage === lang.id;
              const isDownloaded = downloadedLanguages.has(lang.id);
              const isDownloading = downloadingLanguage === lang.id;
              const isLast = index === WBW_LANGUAGES.length - 1;
              const isArabicGharib = (lang as any).isArabicMeaning;

              return (
                <Pressable
                  key={lang.id}
                  onPress={() => handleLanguagePress(lang)}
                  disabled={isDownloading}
                  style={({ pressed }) => [
                    styles.languageRow,
                    {
                      opacity: pressed && !isDownloading ? 0.7 : 1,
                      backgroundColor: isSelected
                        ? (isDark ? `${theme.primary}20` : 'rgba(94, 156, 170, 0.08)')
                        : 'transparent',
                      marginHorizontal: isSelected ? 16 : 0,
                      borderRadius: isSelected ? 12 : 0,
                    },
                  ]}
                >
                  <View style={styles.languageLeft}>
                    <ThemedText style={{ fontSize: 24, marginRight: 12 }}>
                      {lang.flag}
                    </ThemedText>
                    <View>
                      <ThemedText type="body" style={{ fontWeight: '500' }}>
                        {lang.name}
                      </ThemedText>
                      {isArabicGharib && (
                        <ThemedText type="caption" secondary style={{ fontSize: 11 }}>
                          {t('wordByWord.arabicMeanings')}
                        </ThemedText>
                      )}
                      {!isDownloaded && !isDownloading && !isArabicGharib && (
                        <ThemedText type="caption" secondary style={{ fontSize: 11 }}>
                          {t('wordByWord.tapToDownload')}
                        </ThemedText>
                      )}
                      {isDownloading && (
                        <ThemedText type="caption" style={{ fontSize: 11, color: theme.primary }}>
                          {t('wordByWord.downloading')} {Math.round(downloadProgress * 100)}%
                        </ThemedText>
                      )}
                    </View>
                  </View>

                  {isDownloading ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : isSelected ? (
                    <View style={[styles.checkCircle, {
                      backgroundColor: theme.primary,
                      shadowColor: theme.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.4,
                      shadowRadius: 4,
                      elevation: 3,
                    }]}>
                      <Feather name="check" size={14} color="#FFF" />
                    </View>
                  ) : isDownloaded ? (
                    <View style={[styles.checkCircle, {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : '#ECEEF1',
                      borderWidth: 1.5,
                      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      borderTopColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.12)',
                    }]} />
                  ) : (
                    <View style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(150, 150, 150, 0.1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Feather name="download" size={14} color={theme.textSecondary} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

      </ScrollView>

      {/* Audio Footer - sticky with upward shadow */}
      <View style={{
        backgroundColor: isDark ? theme.backgroundRoot : theme.backgroundRoot,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: insets.bottom + Spacing.md,
        zIndex: 10,
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        borderTopWidth: 1,
        borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
      }}>
        <View style={[styles.card, {
          backgroundColor: isDark ? `${theme.primary}33` : '#FFFFFF',
          borderWidth: 0,
          borderColor: 'transparent',
          elevation: isDark ? 0 : 2,
          shadowOpacity: isDark ? 0 : 0.05,
          shadowRadius: 12,
        }]}>
          <View style={styles.audioRow}>
            <View style={{ flex: 1 }}>
              <ThemedText type="body" style={{ fontWeight: '500' }}>
                {t('wordByWord.playPronunciation')}
              </ThemedText>
              <ThemedText type="caption" secondary style={{ fontSize: 11, marginTop: 2 }}>
                {t('wordByWord.audioHint')}
              </ThemedText>
            </View>
            <View style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 2,
            }}>
              <Switch
                value={audioEnabled}
                onValueChange={toggleAudio}
                trackColor={{ false: isDark ? '#3A3A3C' : '#E5E5EA', true: theme.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={isDark ? '#3A3A3C' : '#E5E5EA'}
              />
            </View>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
});
