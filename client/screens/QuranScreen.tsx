import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import Animated, {
  SlideInUp,
  SlideOutDown,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { surahs, Surah } from "@/data/quran";
import { useSurah, combineVerses, CombinedVerse } from "@/hooks/useQuran";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const BOOKMARKS_KEY = "@quran_bookmarks";

interface Bookmark {
  surahNumber: number;
  surahName: string;
  verseNumber: number;
  verseText: string;
  translation: string;
  timestamp: number;
}

const ARABIC_NUMERALS: Record<string, string> = {
  "0": "٠",
  "1": "١",
  "2": "٢",
  "3": "٣",
  "4": "٤",
  "5": "٥",
  "6": "٦",
  "7": "٧",
  "8": "٨",
  "9": "٩",
};

function toArabicNumerals(num: number): string {
  return String(num)
    .split("")
    .map((digit) => ARABIC_NUMERALS[digit] || digit)
    .join("");
}

export default function QuranScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [selectedSurah, setSelectedSurah] = useState<Surah>(surahs[0]);
  const [showSurahList, setShowSurahList] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<CombinedVerse | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);

  const { data: surahData, isLoading, error } = useSurah(selectedSurah.number);

  const verses: CombinedVerse[] = surahData
    ? combineVerses(surahData.arabic, surahData.english)
    : [];

  useEffect(() => {
    loadBookmarks();
  }, []);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadBookmarks = async () => {
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (stored) {
        setBookmarks(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load bookmarks:", e);
    }
  };

  const saveBookmark = async (verse: CombinedVerse) => {
    try {
      const newBookmark: Bookmark = {
        surahNumber: selectedSurah.number,
        surahName: selectedSurah.nameEn,
        verseNumber: verse.numberInSurah,
        verseText: verse.textAr,
        translation: verse.translation,
        timestamp: Date.now(),
      };

      const exists = bookmarks.some(
        (b) => b.surahNumber === newBookmark.surahNumber && b.verseNumber === newBookmark.verseNumber
      );

      if (exists) {
        const filtered = bookmarks.filter(
          (b) => !(b.surahNumber === newBookmark.surahNumber && b.verseNumber === newBookmark.verseNumber)
        );
        setBookmarks(filtered);
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        const updated = [newBookmark, ...bookmarks];
        setBookmarks(updated);
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (e) {
      console.error("Failed to save bookmark:", e);
    }
  };

  const isBookmarked = (verse: CombinedVerse) => {
    return bookmarks.some(
      (b) => b.surahNumber === selectedSurah.number && b.verseNumber === verse.numberInSurah
    );
  };

  const playAudio = async (surahNum: number, verseNum: number) => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }

      setLoadingAudio(true);

      const response = await fetch(
        `https://api.alquran.cloud/v1/ayah/${surahNum}:${verseNum}/ar.alafasy`
      );
      const data = await response.json();

      if (data.code === 200 && data.data?.audio) {
        const audioUrl = data.data.audio;

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true }
        );

        setSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (e) {
      console.error("Failed to play audio:", e);
    } finally {
      setLoadingAudio(false);
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
  };

  const handleSelectSurah = useCallback((surah: Surah) => {
    setSelectedSurah(surah);
    setShowSurahList(false);
  }, []);

  const handleVersePress = useCallback((verse: CombinedVerse) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedVerse(verse);
  }, []);

  const closePopover = useCallback(() => {
    setSelectedVerse(null);
    stopAudio();
  }, [sound]);

  const goToBookmark = (bookmark: Bookmark) => {
    const surah = surahs.find((s) => s.number === bookmark.surahNumber);
    if (surah) {
      setSelectedSurah(surah);
      setShowBookmarks(false);
    }
  };

  const renderSurahItem = useCallback(
    ({ item }: { item: Surah }) => (
      <Pressable
        onPress={() => handleSelectSurah(item)}
        style={({ pressed }) => [
          styles.surahItem,
          {
            backgroundColor:
              selectedSurah.number === item.number
                ? isDark
                  ? Colors.dark.primary + "20"
                  : Colors.light.primary + "20"
                : isDark
                  ? Colors.dark.backgroundSecondary
                  : Colors.light.backgroundDefault,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.surahNumber,
            {
              backgroundColor: isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary,
            },
          ]}
        >
          <ThemedText type="small">{item.number}</ThemedText>
        </View>
        <View style={styles.surahInfo}>
          <ThemedText type="body" style={{ fontWeight: "500" }}>
            {item.nameEn}
          </ThemedText>
          <ThemedText type="caption" secondary>
            {item.englishMeaning} - {item.versesCount} verses
          </ThemedText>
        </View>
        <View style={styles.surahArabic}>
          <ThemedText type="arabic" style={{ fontSize: 20 }}>
            {item.nameAr}
          </ThemedText>
          <ThemedText
            type="caption"
            secondary
            style={{ color: isDark ? Colors.dark.gold : Colors.light.gold }}
          >
            {item.revelationType}
          </ThemedText>
        </View>
      </Pressable>
    ),
    [selectedSurah, isDark, handleSelectSurah]
  );

  const renderVerseItem = useCallback(
    ({ item: verse }: { item: CombinedVerse }) => (
      <Pressable
        onPress={() => handleVersePress(verse)}
        style={({ pressed }) => [
          styles.verseCard,
          {
            backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <View style={styles.verseHeader}>
          <View
            style={[
              styles.verseNumberBadge,
              {
                backgroundColor: isDark ? Colors.dark.primary + "20" : Colors.light.primary + "20",
                borderColor: isDark ? Colors.dark.primary : Colors.light.primary,
              },
            ]}
          >
            <ThemedText
              type="small"
              style={{ color: isDark ? Colors.dark.primary : Colors.light.primary }}
            >
              {verse.numberInSurah}
            </ThemedText>
          </View>
          {isBookmarked(verse) ? (
            <Feather
              name="bookmark"
              size={16}
              color={isDark ? Colors.dark.gold : Colors.light.gold}
              style={{ marginLeft: "auto" }}
            />
          ) : null}
        </View>
        <ThemedText
          type="quran"
          style={[
            styles.verseArabicText,
            { color: theme.text },
          ]}
        >
          {verse.textAr}
          <ThemedText
            type="arabic"
            style={{ color: isDark ? Colors.dark.gold : Colors.light.gold, fontSize: 20 }}
          >
            {" "}﴿{toArabicNumerals(verse.numberInSurah)}﴾
          </ThemedText>
        </ThemedText>
        <ThemedText type="small" secondary style={styles.verseTranslation}>
          {verse.translation}
        </ThemedText>
      </Pressable>
    ),
    [isDark, theme, handleVersePress, bookmarks, selectedSurah]
  );

  const renderBookmarkItem = useCallback(
    ({ item }: { item: Bookmark }) => (
      <Pressable
        onPress={() => goToBookmark(item)}
        style={({ pressed }) => [
          styles.bookmarkItem,
          {
            backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View style={styles.bookmarkHeader}>
          <View
            style={[
              styles.bookmarkBadge,
              { backgroundColor: isDark ? Colors.dark.gold + "20" : Colors.light.gold + "20" },
            ]}
          >
            <Feather
              name="bookmark"
              size={16}
              color={isDark ? Colors.dark.gold : Colors.light.gold}
            />
          </View>
          <View style={styles.bookmarkInfo}>
            <ThemedText type="body" style={{ fontWeight: "500" }}>
              {item.surahName} - Verse {item.verseNumber}
            </ThemedText>
            <ThemedText type="caption" secondary>
              {new Date(item.timestamp).toLocaleDateString()}
            </ThemedText>
          </View>
        </View>
        <ThemedText
          type="arabic"
          numberOfLines={2}
          style={[styles.bookmarkArabic, { color: theme.text }]}
        >
          {item.verseText}
        </ThemedText>
      </Pressable>
    ),
    [isDark, theme]
  );

  const ListHeader = () => (
    <>
      <Pressable
        onPress={() => setShowSurahList(true)}
        style={({ pressed }) => [
          styles.surahSelector,
          {
            backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View style={styles.surahSelectorContent}>
          <View
            style={[
              styles.surahSelectorNumber,
              { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary },
            ]}
          >
            <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
              {selectedSurah.number}
            </ThemedText>
          </View>
          <View style={styles.surahSelectorInfo}>
            <ThemedText type="h4">{selectedSurah.nameEn}</ThemedText>
            <ThemedText type="small" secondary>
              {selectedSurah.englishMeaning}
            </ThemedText>
          </View>
        </View>
        <View style={styles.surahSelectorRight}>
          <ThemedText type="arabicLarge">{selectedSurah.nameAr}</ThemedText>
          <Feather name="chevron-down" size={20} color={theme.textSecondary} />
        </View>
      </Pressable>

      {selectedSurah.number !== 9 ? (
        <View
          style={[
            styles.bismillahContainer,
            {
              backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault,
              borderColor: isDark ? Colors.dark.gold : Colors.light.gold,
            },
          ]}
        >
          <ThemedText
            type="quran"
            style={[
              styles.bismillah,
              { color: isDark ? Colors.dark.gold : Colors.light.gold },
            ]}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </ThemedText>
        </View>
      ) : null}
    </>
  );

  if (showBookmarks) {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[
            styles.surahListHeader,
            {
              paddingTop: headerHeight + Spacing.md,
              backgroundColor: isDark ? Colors.dark.backgroundRoot : Colors.light.backgroundRoot,
              borderBottomColor: isDark ? Colors.dark.border : Colors.light.border,
            },
          ]}
        >
          <Pressable onPress={() => setShowBookmarks(false)} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="h4">Bookmarks</ThemedText>
          <View style={styles.placeholder} />
        </View>
        {bookmarks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather
              name="bookmark"
              size={48}
              color={isDark ? Colors.dark.muted : Colors.light.muted}
            />
            <ThemedText type="body" secondary style={{ marginTop: Spacing.lg }}>
              No bookmarks yet
            </ThemedText>
            <ThemedText type="small" secondary style={{ marginTop: Spacing.sm, textAlign: "center" }}>
              Tap on a verse and use the bookmark button to save it
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={bookmarks}
            renderItem={renderBookmarkItem}
            keyExtractor={(item) => `${item.surahNumber}-${item.verseNumber}`}
            contentContainerStyle={[
              styles.bookmarkListContent,
              { paddingBottom: tabBarHeight + Spacing.xl },
            ]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </ThemedView>
    );
  }

  if (showSurahList) {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[
            styles.surahListHeader,
            {
              paddingTop: headerHeight + Spacing.md,
              backgroundColor: isDark ? Colors.dark.backgroundRoot : Colors.light.backgroundRoot,
              borderBottomColor: isDark ? Colors.dark.border : Colors.light.border,
            },
          ]}
        >
          <Pressable onPress={() => setShowSurahList(false)} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="h4">Select Surah</ThemedText>
          <View style={styles.placeholder} />
        </View>
        <FlatList
          data={surahs}
          renderItem={renderSurahItem}
          keyExtractor={(item) => String(item.number)}
          contentContainerStyle={[
            styles.surahListContent,
            { paddingBottom: tabBarHeight + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.mainContent, { paddingTop: headerHeight }]}>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setShowBookmarks(true)}
            style={[
              styles.headerButton,
              { backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault },
            ]}
          >
            <Feather
              name="bookmark"
              size={20}
              color={isDark ? Colors.dark.gold : Colors.light.gold}
            />
            {bookmarks.length > 0 ? (
              <View
                style={[
                  styles.bookmarkCountBadge,
                  { backgroundColor: isDark ? Colors.dark.gold : Colors.light.gold },
                ]}
              >
                <ThemedText type="caption" style={{ color: "#FFFFFF", fontSize: 10 }}>
                  {bookmarks.length}
                </ThemedText>
              </View>
            ) : null}
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDark ? Colors.dark.primary : Colors.light.primary} />
            <ThemedText type="body" secondary style={styles.loadingText}>
              Loading Surah...
            </ThemedText>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color={isDark ? Colors.dark.muted : Colors.light.muted} />
            <ThemedText type="body" secondary style={styles.errorText}>
              Failed to load Surah
            </ThemedText>
            <ThemedText type="small" secondary>
              Please check your connection and try again
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={verses}
            renderItem={renderVerseItem}
            keyExtractor={(item) => String(item.number)}
            ListHeaderComponent={ListHeader}
            contentContainerStyle={[
              styles.versesContent,
              { paddingBottom: tabBarHeight + Spacing.xl },
            ]}
            showsVerticalScrollIndicator={false}
            scrollIndicatorInsets={{ bottom: insets.bottom }}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
          />
        )}
      </View>

      <Modal
        visible={selectedVerse !== null}
        transparent
        animationType="fade"
        onRequestClose={closePopover}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closePopover} />
          {selectedVerse ? (
            <Animated.View
              entering={SlideInUp.duration(200)}
              exiting={SlideOutDown.duration(150)}
              style={[
                styles.popoverContainer,
                {
                  backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault,
                },
              ]}
            >
              <View style={styles.popoverHeader}>
                <View
                  style={[
                    styles.popoverVerseNumber,
                    {
                      backgroundColor: isDark ? Colors.dark.primary + "20" : Colors.light.primary + "20",
                      borderColor: isDark ? Colors.dark.primary : Colors.light.primary,
                    },
                  ]}
                >
                  <ThemedText
                    type="small"
                    style={{ color: isDark ? Colors.dark.primary : Colors.light.primary }}
                  >
                    {selectedVerse.numberInSurah}
                  </ThemedText>
                </View>
                <ThemedText type="caption" secondary style={{ flex: 1 }}>
                  {selectedSurah.nameEn} - Verse {selectedVerse.numberInSurah}
                </ThemedText>
                <Pressable onPress={closePopover} style={styles.closeButton}>
                  <Feather name="x" size={20} color={theme.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.popoverContent}>
                <ThemedText type="quran" style={styles.popoverArabic}>
                  {selectedVerse.textAr}
                </ThemedText>
                
                <View
                  style={[
                    styles.popoverDivider,
                    { backgroundColor: isDark ? Colors.dark.border : Colors.light.border },
                  ]}
                />

                <ThemedText type="body" style={[styles.popoverSectionTitle, { fontWeight: "600" }]}>
                  Translation
                </ThemedText>
                <ThemedText type="body" secondary style={styles.popoverTranslation}>
                  {selectedVerse.translation}
                </ThemedText>
              </View>

              <View style={styles.popoverActions}>
                <Pressable
                  style={[
                    styles.popoverActionButton,
                    {
                      backgroundColor: isPlaying
                        ? isDark ? Colors.dark.primary + "30" : Colors.light.primary + "30"
                        : isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary,
                    },
                  ]}
                  onPress={() => {
                    if (isPlaying) {
                      stopAudio();
                    } else {
                      playAudio(selectedSurah.number, selectedVerse.numberInSurah);
                    }
                  }}
                  disabled={loadingAudio}
                >
                  {loadingAudio ? (
                    <ActivityIndicator size="small" color={isDark ? Colors.dark.primary : Colors.light.primary} />
                  ) : (
                    <Feather
                      name={isPlaying ? "pause" : "play"}
                      size={20}
                      color={isDark ? Colors.dark.primary : Colors.light.primary}
                    />
                  )}
                  <ThemedText type="small" style={{ marginLeft: Spacing.sm }}>
                    {loadingAudio ? "Loading..." : isPlaying ? "Pause" : "Play"}
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={[
                    styles.popoverActionButton,
                    {
                      backgroundColor: isBookmarked(selectedVerse)
                        ? isDark ? Colors.dark.gold + "30" : Colors.light.gold + "30"
                        : isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary,
                    },
                  ]}
                  onPress={() => {
                    saveBookmark(selectedVerse);
                  }}
                >
                  <Feather
                    name="bookmark"
                    size={20}
                    color={
                      isBookmarked(selectedVerse)
                        ? isDark ? Colors.dark.gold : Colors.light.gold
                        : theme.textSecondary
                    }
                  />
                  <ThemedText type="small" style={{ marginLeft: Spacing.sm }}>
                    {isBookmarked(selectedVerse) ? "Saved" : "Save"}
                  </ThemedText>
                </Pressable>
              </View>
            </Animated.View>
          ) : null}
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  bookmarkCountBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  surahListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  placeholder: {
    width: 40,
  },
  surahListContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  surahItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  surahNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  surahInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  surahArabic: {
    alignItems: "flex-end",
  },
  surahSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  surahSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  surahSelectorNumber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  surahSelectorInfo: {
    marginLeft: Spacing.md,
  },
  surahSelectorRight: {
    alignItems: "flex-end",
  },
  bismillahContainer: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  bismillah: {
    textAlign: "center",
  },
  versesContent: {
    paddingTop: Spacing.sm,
  },
  verseCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  verseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  verseNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  verseArabicText: {
    textAlign: "right",
    fontSize: 24,
    lineHeight: 48,
    marginBottom: Spacing.md,
  },
  verseTranslation: {
    lineHeight: 22,
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
  },
  loadingText: {
    marginTop: Spacing.lg,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
  },
  errorText: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  bookmarkListContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  bookmarkItem: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  bookmarkHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  bookmarkBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  bookmarkInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  bookmarkArabic: {
    textAlign: "right",
    fontSize: 18,
    lineHeight: 32,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  popoverContainer: {
    borderRadius: BorderRadius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  popoverHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  popoverVerseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  closeButton: {
    padding: Spacing.sm,
    marginRight: -Spacing.sm,
  },
  popoverContent: {
    padding: Spacing.lg,
  },
  popoverArabic: {
    textAlign: "right",
    fontSize: 24,
    lineHeight: 44,
    marginBottom: Spacing.md,
  },
  popoverDivider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  popoverSectionTitle: {
    marginBottom: Spacing.sm,
  },
  popoverTranslation: {
    lineHeight: 24,
    fontStyle: "italic",
  },
  popoverActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  popoverActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
});
