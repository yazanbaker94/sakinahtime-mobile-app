import React, { useCallback, useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, Pressable, TextInput } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { azkarCategories, AzkarCategory } from "@/data/azkar";
import { islamicGuides } from "@/data/islamicGuides";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const ICON_MAP: Record<string, keyof typeof Feather.glyphMap> = {
  sunrise: "sunrise",
  sunset: "sunset",
  heart: "heart",
  moon: "moon",
  sun: "sun",
  star: "star",
};

type TabType = "azkar" | "guides";

const GUIDE_CATEGORIES = [
  {
    id: "worship",
    titleEn: "Worship & Prayer",
    titleAr: "العبادة والصلاة",
    icon: "sun",
    guides: islamicGuides.filter(g => g.category === "worship"),
  },
  {
    id: "purification",
    titleEn: "Purification",
    titleAr: "الطهارة",
    icon: "droplet",
    guides: islamicGuides.filter(g => g.category === "purification"),
  },
  {
    id: "hajj",
    titleEn: "Hajj & Umrah",
    titleAr: "الحج والعمرة",
    icon: "map-pin",
    guides: islamicGuides.filter(g => g.category === "hajj"),
  },
  {
    id: "charity",
    titleEn: "Charity & Zakat",
    titleAr: "الصدقة والزكاة",
    icon: "gift",
    guides: islamicGuides.filter(g => g.category === "charity"),
  },
  {
    id: "fasting",
    titleEn: "Fasting",
    titleAr: "الصيام",
    icon: "moon",
    guides: islamicGuides.filter(g => g.category === "fasting"),
  },
  {
    id: "funeral",
    titleEn: "Funeral Rites",
    titleAr: "الجنائز",
    icon: "heart",
    guides: islamicGuides.filter(g => g.category === "funeral"),
  },
  {
    id: "character",
    titleEn: "Character & Manners",
    titleAr: "الأخلاق والآداب",
    icon: "smile",
    guides: islamicGuides.filter(g => g.category === "character"),
  },
  {
    id: "supplications",
    titleEn: "Supplications",
    titleAr: "الأدعية",
    icon: "book",
    guides: islamicGuides.filter(g => g.category === "supplications"),
  },
  {
    id: "knowledge",
    titleEn: "Knowledge & Spirituality",
    titleAr: "العلم والروحانية",
    icon: "book-open",
    guides: islamicGuides.filter(g => g.category === "knowledge"),
  },
  {
    id: "finance",
    titleEn: "Islamic Finance",
    titleAr: "المعاملات المالية",
    icon: "dollar-sign",
    guides: islamicGuides.filter(g => g.category === "finance"),
  },
].filter(cat => cat.guides.length > 0); // Only show categories with guides

export default function AzkarScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<TabType>("azkar");
  const [searchQuery, setSearchQuery] = useState("");

  const handleCategoryPress = useCallback(
    (category: AzkarCategory) => {
      navigation.navigate("AzkarDetail", { category });
    },
    [navigation]
  );

  const handleGuidePress = useCallback((guide: typeof islamicGuides[0]) => {
    navigation.navigate("IslamicGuideDetail", { guide });
  }, [navigation]);

  // Filter guides based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return GUIDE_CATEGORIES;
    }

    const query = searchQuery.toLowerCase();
    return GUIDE_CATEGORIES.map(category => ({
      ...category,
      guides: category.guides.filter(guide =>
        guide.title.toLowerCase().includes(query) ||
        guide.titleAr.includes(query) ||
        guide.description.toLowerCase().includes(query)
      ),
    })).filter(cat => cat.guides.length > 0);
  }, [searchQuery]);

  return (
    <ThemedView style={styles.container}>
      {/* Tab Selector */}
      <View
        style={[
          styles.tabContainer,
          {
            paddingTop: insets.top + Spacing.md,
            backgroundColor: isDark ? Colors.dark.backgroundDefault : Colors.light.backgroundDefault,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary,
          },
        ]}
      >
        <Pressable
          onPress={() => setActiveTab("azkar")}
          style={[
            styles.tab,
            activeTab === "azkar" && {
              borderBottomWidth: 3,
              borderBottomColor: isDark ? Colors.dark.primary : Colors.light.primary,
            },
          ]}
        >
          <Feather
            name="heart"
            size={20}
            color={
              activeTab === "azkar"
                ? isDark ? Colors.dark.primary : Colors.light.primary
                : isDark ? Colors.dark.textSecondary : Colors.light.textSecondary
            }
          />
          <ThemedText
            type="body"
            style={{
              marginLeft: Spacing.xs,
              fontWeight: activeTab === "azkar" ? "700" : "500",
              color:
                activeTab === "azkar"
                  ? isDark ? Colors.dark.primary : Colors.light.primary
                  : isDark ? Colors.dark.textSecondary : Colors.light.textSecondary,
            }}
          >
            Azkar
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("guides")}
          style={[
            styles.tab,
            activeTab === "guides" && {
              borderBottomWidth: 3,
              borderBottomColor: isDark ? Colors.dark.primary : Colors.light.primary,
            },
          ]}
        >
          <Feather
            name="book-open"
            size={20}
            color={
              activeTab === "guides"
                ? isDark ? Colors.dark.primary : Colors.light.primary
                : isDark ? Colors.dark.textSecondary : Colors.light.textSecondary
            }
          />
          <ThemedText
            type="body"
            style={{
              marginLeft: Spacing.xs,
              fontWeight: activeTab === "guides" ? "700" : "500",
              color:
                activeTab === "guides"
                  ? isDark ? Colors.dark.primary : Colors.light.primary
                  : isDark ? Colors.dark.textSecondary : Colors.light.textSecondary,
            }}
          >
            Islamic Guides
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "azkar" ? (
          <>
            <View style={styles.categoriesGrid}>
              {azkarCategories.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => handleCategoryPress(category)}
                  style={({ pressed }) => [
                    styles.categoryCard,
                    {
                      backgroundColor: isDark ? 'rgba(26, 95, 79, 0.2)' : Colors.light.backgroundDefault,
                      opacity: pressed ? 0.7 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      {
                        backgroundColor:
                          category.id === "morning"
                            ? (isDark ? 'rgba(212, 175, 55, 0.2)' : Colors.light.gold + "30")
                            : category.id === "evening"
                              ? (isDark ? 'rgba(52, 211, 153, 0.2)' : Colors.light.primary + "30")
                              : (isDark ? 'rgba(52, 211, 153, 0.15)' : Colors.light.backgroundSecondary),
                      },
                    ]}
                  >
                    <Feather
                      name={ICON_MAP[category.icon] || "heart"}
                      size={28}
                      color={
                        category.id === "morning"
                          ? (isDark ? Colors.dark.gold : Colors.light.gold)
                          : category.id === "evening"
                            ? (isDark ? Colors.dark.primary : Colors.light.primary)
                            : (isDark ? Colors.dark.textSecondary : Colors.light.textSecondary)
                      }
                    />
                  </View>
                  <ThemedText type="body" style={styles.categoryTitle}>
                    {category.titleEn}
                  </ThemedText>
                  <ThemedText type="arabic" secondary style={[styles.categoryArabic, { fontFamily: 'AlMushafQuran' }]}>
                    {category.titleAr}
                  </ThemedText>
                  <View style={styles.categoryCount}>
                    <ThemedText type="caption" secondary>
                      {category.count} adhkar
                    </ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>

            <View
              style={[
                styles.tipCard,
                { backgroundColor: isDark ? Colors.dark.primary + "15" : Colors.light.primary + "15" },
              ]}
            >
              <View style={styles.tipHeader}>
                <Feather
                  name="info"
                  size={20}
                  color={isDark ? Colors.dark.primary : Colors.light.primary}
                />
                <ThemedText
                  type="body"
                  style={{
                    marginLeft: Spacing.sm,
                    color: isDark ? Colors.dark.primary : Colors.light.primary,
                    fontWeight: "600",
                  }}
                >
                  Daily Tip
                </ThemedText>
              </View>
              <ThemedText type="small" secondary style={styles.tipText}>
                The Prophet (peace be upon him) said: &quot;The best remembrance is La ilaha
                illallah (There is no god but Allah).&quot;
              </ThemedText>
              <ThemedText
                type="caption"
                style={{ color: isDark ? Colors.dark.primary : Colors.light.primary }}
              >
                - Tirmidhi
              </ThemedText>
            </View>
          </>
        ) : (
          <View style={styles.guidesContainer}>
            {/* Search Bar */}
            <View
              style={[
                styles.searchContainer,
                {
                  backgroundColor: isDark
                    ? Colors.dark.backgroundSecondary
                    : Colors.light.backgroundSecondary,
                },
              ]}
            >
              <Feather
                name="search"
                size={20}
                color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary}
              />
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    color: isDark ? Colors.dark.text : Colors.light.text,
                  },
                ]}
                placeholder="Search guides..."
                placeholderTextColor={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Feather
                    name="x"
                    size={20}
                    color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary}
                  />
                </Pressable>
              )}
            </View>

            {/* Results */}
            {filteredCategories.length === 0 ? (
              <View style={styles.noResults}>
                <Feather
                  name="search"
                  size={48}
                  color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary}
                />
                <ThemedText type="body" secondary style={{ marginTop: Spacing.md, textAlign: "center" }}>
                  No guides found for &quot;{searchQuery}&quot;
                </ThemedText>
              </View>
            ) : (
              filteredCategories.map((category) => (
                <View key={category.id} style={styles.guideCategory}>
                <View style={styles.guideCategoryHeader}>
                  <View
                    style={[
                      styles.guideCategoryIcon,
                      {
                        backgroundColor: isDark
                          ? 'rgba(52, 211, 153, 0.15)'
                          : Colors.light.primary + "15",
                      },
                    ]}
                  >
                    <Feather
                      name={category.icon as any}
                      size={20}
                      color={isDark ? Colors.dark.primary : Colors.light.primary}
                    />
                  </View>
                  <View style={styles.guideCategoryTitles}>
                    <View style={styles.categoryTitleRow}>
                      <ThemedText type="h4" style={{ flex: 1 }}>{category.titleEn}</ThemedText>
                      <ThemedText type="arabic" secondary style={{ fontSize: 14, fontFamily: 'AlMushafQuran', marginLeft: Spacing.sm }}>
                        {category.titleAr}
                      </ThemedText>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.guideCount,
                      {
                        backgroundColor: isDark
                          ? Colors.dark.backgroundTertiary
                          : Colors.light.backgroundSecondary,
                      },
                    ]}
                  >
                    <ThemedText type="caption" secondary>
                      {category.guides.length}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.guidesList}>
                  {category.guides.map((guide, index) => (
                    <Pressable
                      key={index}
                      onPress={() => handleGuidePress(guide)}
                      style={({ pressed }) => [
                        styles.guideItem,
                        {
                          backgroundColor: isDark
                            ? 'rgba(26, 95, 79, 0.2)'
                            : Colors.light.backgroundDefault,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <ThemedText type="body" style={styles.guideTitle}>
                        {guide.title}
                      </ThemedText>
                      <Feather
                        name="chevron-right"
                        size={18}
                        color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>
            ))
            )}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 0,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  categoryCard: {
    width: "47%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  categoryTitle: {
    fontWeight: "500",
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  categoryArabic: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  categoryCount: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tipCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  tipText: {
    marginBottom: Spacing.sm,
    fontStyle: "italic",
  },
  guidesContainer: {
    gap: Spacing.xl,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  noResults: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
  },
  guideCategory: {
    marginBottom: Spacing.md,
  },
  guideCategoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  guideCategoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  guideCategoryTitles: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  categoryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  guideCount: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  guidesList: {
    gap: Spacing.xs,
  },
  guideItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  guideTitle: {
    flex: 1,
    fontSize: 15,
  },
});
