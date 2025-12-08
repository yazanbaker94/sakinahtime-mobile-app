import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, FlatList, Pressable, Dimensions, ActivityIndicator } from "react-native";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function QuranScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [selectedSurah, setSelectedSurah] = useState<Surah>(surahs[0]);
  const [showSurahList, setShowSurahList] = useState(false);

  const { data: surahData, isLoading, error } = useSurah(selectedSurah.number);

  const verses: CombinedVerse[] = surahData
    ? combineVerses(surahData.arabic, surahData.english)
    : [];

  const handleSelectSurah = useCallback((surah: Surah) => {
    setSelectedSurah(surah);
    setShowSurahList(false);
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

  const renderVerseItem = useCallback(
    ({ item }: { item: CombinedVerse }) => (
      <View
        style={[
          styles.verseCard,
          {
            backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault,
          },
        ]}
      >
        <View style={styles.verseHeader}>
          <View
            style={[
              styles.verseNumber,
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
              {item.numberInSurah}
            </ThemedText>
          </View>
          <ThemedText type="caption" secondary>
            Juz {item.juz} - Page {item.page}
          </ThemedText>
        </View>
        <ThemedText type="quran" style={styles.verseArabic}>
          {item.textAr}
        </ThemedText>
        <ThemedText type="small" secondary style={styles.verseTranslation}>
          {item.translation}
        </ThemedText>
      </View>
    ),
    [isDark]
  );

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
            contentContainerStyle={[
              styles.versesContent,
              { paddingBottom: tabBarHeight + Spacing.xl },
            ]}
            showsVerticalScrollIndicator={false}
            scrollIndicatorInsets={{ bottom: insets.bottom }}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        )}
      </View>
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
  versesContent: {
    paddingTop: Spacing.sm,
    gap: Spacing.lg,
  },
  verseCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  verseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  verseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  verseArabic: {
    marginBottom: Spacing.md,
    textAlign: "right",
  },
  verseTranslation: {
    textAlign: "left",
    fontStyle: "italic",
    lineHeight: 22,
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
});
