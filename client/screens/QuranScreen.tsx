import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, FlatList, Pressable, Dimensions } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { surahs, surahAlFatiha, Surah, Verse } from "@/data/quran";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function QuranScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [selectedSurah, setSelectedSurah] = useState<Surah>(surahs[0]);
  const [showSurahList, setShowSurahList] = useState(false);

  const verses = selectedSurah.number === 1 ? surahAlFatiha : [];

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
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
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

        <View style={styles.versesContainer}>
          {verses.length > 0 ? (
            verses.map((verse) => (
              <View
                key={verse.number}
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
                      {verse.number}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="quran" style={styles.verseArabic}>
                  {verse.textAr}
                </ThemedText>
                <ThemedText type="small" secondary style={styles.verseTranslation}>
                  {verse.translation}
                </ThemedText>
              </View>
            ))
          ) : (
            <View style={styles.comingSoonContainer}>
              <Feather
                name="book"
                size={48}
                color={isDark ? Colors.dark.muted : Colors.light.muted}
              />
              <ThemedText type="body" secondary style={styles.comingSoonText}>
                Full Quran text coming soon
              </ThemedText>
              <ThemedText type="small" secondary style={styles.comingSoonSubtext}>
                Currently showing Al-Fatihah. More surahs will be added.
              </ThemedText>
            </View>
          )}
        </View>

        {selectedSurah.number !== 1 ? (
          <Pressable
            onPress={() => handleSelectSurah(surahs[0])}
            style={({ pressed }) => [
              styles.readFatihahButton,
              {
                backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <ThemedText type="body" style={{ color: "#FFFFFF" }}>
              Read Al-Fatihah
            </ThemedText>
          </Pressable>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: Spacing["2xl"],
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
    marginBottom: Spacing["2xl"],
    borderWidth: 1,
    alignItems: "center",
  },
  bismillah: {
    textAlign: "center",
  },
  versesContainer: {
    gap: Spacing.lg,
  },
  verseCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  verseHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
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
  },
  comingSoonContainer: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  comingSoonText: {
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  comingSoonSubtext: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  readFatihahButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    marginTop: Spacing["2xl"],
  },
});
