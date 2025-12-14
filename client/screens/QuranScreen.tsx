import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Modal,
  Text,
  Platform,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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
  const [selectedVerse, setSelectedVerse] = useState<CombinedVerse | null>(null);

  const { data: surahData, isLoading, error } = useSurah(selectedSurah.number);

  const verses: CombinedVerse[] = surahData
    ? combineVerses(surahData.arabic, surahData.english)
    : [];

  const handleSelectSurah = useCallback((surah: Surah) => {
    setSelectedSurah(surah);
    setShowSurahList(false);
  }, []);


  const closePopover = useCallback(() => {
    setSelectedVerse(null);
  }, []);

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

  const handleVerseLongPress = useCallback((verse: CombinedVerse) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedVerse(verse);
  }, []);

  const renderMushafText = () => {
    return (
      <Text style={[styles.mushafContainer, { direction: "rtl" }]}>
        {verses.map((verse) => (
          <Text
            key={verse.number}
            onLongPress={() => handleVerseLongPress(verse)}
            delayLongPress={300}
          >
            <Text
              style={[
                styles.verseText,
                { color: theme.text },
              ]}
            >
              {verse.textAr}
            </Text>
            <Text
              style={[
                styles.verseMarker,
                {
                  color: isDark ? Colors.dark.gold : Colors.light.gold,
                },
              ]}
            >
              {" "}﴿{toArabicNumerals(verse.numberInSurah)}﴾{" "}
            </Text>
          </Text>
        ))}
      </Text>
    );
  };

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
          <ScrollView
            contentContainerStyle={[
              styles.mushafScrollContent,
              { paddingBottom: tabBarHeight + Spacing.xl },
            ]}
            showsVerticalScrollIndicator={false}
            scrollIndicatorInsets={{ bottom: insets.bottom }}
          >
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

            <View
              style={[
                styles.mushafCard,
                {
                  backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault,
                },
              ]}
            >
              {renderMushafText()}
            </View>
          </ScrollView>
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

                <ThemedText type="h5" style={styles.popoverSectionTitle}>
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
                    { backgroundColor: isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary },
                  ]}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <Feather name="volume-2" size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                  <ThemedText type="small" style={{ marginLeft: Spacing.sm }}>Audio</ThemedText>
                </Pressable>

                <Pressable
                  style={[
                    styles.popoverActionButton,
                    { backgroundColor: isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary },
                  ]}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <Feather name="book-open" size={20} color={isDark ? Colors.dark.gold : Colors.light.gold} />
                  <ThemedText type="small" style={{ marginLeft: Spacing.sm }}>Tafsir</ThemedText>
                </Pressable>

                <Pressable
                  style={[
                    styles.popoverActionButton,
                    { backgroundColor: isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary },
                  ]}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <Feather name="bookmark" size={20} color={theme.textSecondary} />
                  <ThemedText type="small" style={{ marginLeft: Spacing.sm }}>Bookmark</ThemedText>
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
    marginTop: Spacing.xl,
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
  mushafScrollContent: {
    paddingTop: Spacing.sm,
  },
  mushafCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  mushafContainer: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  verseText: {
    fontFamily: Platform.select({
      ios: "AmiriQuran",
      android: "AmiriQuran",
      default: "serif",
    }),
    fontSize: 26,
    lineHeight: 52,
  },
  verseMarker: {
    fontFamily: Platform.select({
      ios: "AmiriQuran",
      android: "AmiriQuran",
      default: "serif",
    }),
    fontSize: 22,
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
