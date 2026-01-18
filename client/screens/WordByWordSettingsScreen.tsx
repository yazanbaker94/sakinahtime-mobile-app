import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform, ActivityIndicator, Switch } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
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
  const navigation = useNavigation<NavigationProp>();
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [downloadedLanguages, setDownloadedLanguages] = useState<Set<string>>(new Set(['english', 'arabic-gharib']));
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
            downloaded.add(lang.id);
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
        setDownloadedLanguages(prev => new Set([...prev, langId]));
        // Auto-select after download
        selectLanguage(langId);
      }
    } catch (e) {
      console.error('Failed to download WBW language:', e);
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
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3" style={{ fontWeight: '700' }}>
          Word by Word
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info - moved to top */}
        <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(212,175,55,0.1)' : 'rgba(212,175,55,0.08)', marginBottom: Spacing.lg }]}>
          <Feather name="info" size={16} color={theme.gold} style={{ marginRight: 10 }} />
          <ThemedText type="caption" style={{ flex: 1, color: theme.textSecondary }}>
            Long-press any word in the Mushaf to see its meaning and hear pronunciation.
          </ThemedText>
        </View>

        {/* Subtitle */}
        <ThemedText type="caption" secondary style={{ marginBottom: Spacing.sm }}>
          Translation Language
        </ThemedText>

        {/* Language Options */}
        <View style={styles.section}>
          <View style={[styles.card, { 
            backgroundColor: isDark ? `${theme.primary}33` : theme.cardBackground,
            elevation: isDark ? 0 : 3,
            shadowOpacity: isDark ? 0 : 0.08,
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
                    !isLast && { 
                      borderBottomWidth: 1, 
                      borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' 
                    },
                    { opacity: pressed && !isDownloading ? 0.7 : 1 },
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
                          Arabic meanings of difficult words
                        </ThemedText>
                      )}
                      {!isDownloaded && !isDownloading && !isArabicGharib && (
                        <ThemedText type="caption" secondary style={{ fontSize: 11 }}>
                          Tap to download
                        </ThemedText>
                      )}
                      {isDownloading && (
                        <ThemedText type="caption" style={{ fontSize: 11, color: theme.primary }}>
                          Downloading... {Math.round(downloadProgress * 100)}%
                        </ThemedText>
                      )}
                    </View>
                  </View>
                  
                  {isDownloading ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : isSelected ? (
                    <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                      <Feather name="check" size={14} color="#FFF" />
                    </View>
                  ) : isDownloaded ? (
                    <Feather name="check-circle" size={20} color={theme.textSecondary} />
                  ) : (
                    <Feather name="download" size={20} color={theme.textSecondary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Audio Settings */}
        <ThemedText type="caption" secondary style={{ marginTop: Spacing.xl, marginBottom: Spacing.sm }}>
          Audio
        </ThemedText>
        <View style={[styles.card, { 
          backgroundColor: isDark ? `${theme.primary}33` : theme.cardBackground,
          elevation: isDark ? 0 : 3,
          shadowOpacity: isDark ? 0 : 0.08,
        }]}>
          <View style={styles.audioRow}>
            <View style={{ flex: 1 }}>
              <ThemedText type="body" style={{ fontWeight: '500' }}>
                Play word pronunciation
              </ThemedText>
              <ThemedText type="caption" secondary style={{ fontSize: 11, marginTop: 2 }}>
                Hear the word when you lift your finger
              </ThemedText>
            </View>
            <Switch
              value={audioEnabled}
              onValueChange={toggleAudio}
              trackColor={{ false: isDark ? '#3A3A3C' : '#E5E5EA', true: theme.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={isDark ? '#3A3A3C' : '#E5E5EA'}
            />
          </View>
        </View>
      </ScrollView>
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
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
    alignItems: 'flex-start',
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
