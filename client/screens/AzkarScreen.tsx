import React, { useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { azkarCategories, AzkarCategory } from "@/data/azkar";
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

export default function AzkarScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleCategoryPress = useCallback(
    (category: AzkarCategory) => {
      navigation.navigate("AzkarDetail", { category });
    },
    [navigation]
  );

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { greeting: "Good Morning", arabic: "صباح الخير", icon: "sunrise" as const };
    return { greeting: "Good Evening", arabic: "مساء الخير", icon: "moon" as const };
  };

  const timeGreeting = getTimeOfDayGreeting();

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
        <View style={styles.greetingContainer}>
          <View
            style={[
              styles.greetingIcon,
              { backgroundColor: isDark ? Colors.dark.gold + "20" : Colors.light.gold + "20" },
            ]}
          >
            <Feather
              name={timeGreeting.icon}
              size={24}
              color={isDark ? Colors.dark.gold : Colors.light.gold}
            />
          </View>
          <View style={styles.greetingText}>
            <ThemedText type="h3">{timeGreeting.greeting}</ThemedText>
            <ThemedText type="arabic" secondary style={{ textAlign: "left" }}>
              {timeGreeting.arabic}
            </ThemedText>
          </View>
        </View>

        <ThemedText type="h4" style={styles.sectionTitle}>
          Daily Remembrance
        </ThemedText>

        <View style={styles.categoriesGrid}>
          {azkarCategories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => handleCategoryPress(category)}
              style={({ pressed }) => [
                styles.categoryCard,
                {
                  backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault,
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
                        ? (isDark ? Colors.dark.gold + "30" : Colors.light.gold + "30")
                        : category.id === "evening"
                          ? (isDark ? Colors.dark.primary + "30" : Colors.light.primary + "30")
                          : (isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary),
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
              <ThemedText type="arabic" secondary style={styles.categoryArabic}>
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
  greetingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  greetingIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingText: {
    marginLeft: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
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
});
