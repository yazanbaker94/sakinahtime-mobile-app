import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { azkarData, Dhikr } from "@/data/azkar";
import { Feather } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

type AzkarDetailRouteProp = RouteProp<RootStackParamList, "AzkarDetail">;

export default function AzkarDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const route = useRoute<AzkarDetailRouteProp>();
  const { category } = route.params;

  const [counts, setCounts] = useState<Record<string, number>>({});

  const dhikrList = azkarData[category.id] || [];

  const handleCount = useCallback(
    (dhikrId: string, maxReps: number) => {
      const currentCount = counts[dhikrId] || 0;
      if (currentCount < maxReps || maxReps === 0) {
        setCounts((prev) => ({
          ...prev,
          [dhikrId]: currentCount + 1,
        }));
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    },
    [counts]
  );

  const resetCount = useCallback((dhikrId: string) => {
    setCounts((prev) => ({
      ...prev,
      [dhikrId]: 0,
    }));
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const renderDhikr = useCallback(
    ({ item, index }: { item: Dhikr; index: number }) => {
      const currentCount = counts[item.id] || 0;
      const isCompleted = item.repetitions > 0 && currentCount >= item.repetitions;
      const progress = item.repetitions > 0 ? currentCount / item.repetitions : 0;

      return (
        <View
          style={[
            styles.dhikrCard,
            {
              backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault,
              opacity: isCompleted ? 0.7 : 1,
            },
          ]}
        >
          <View style={styles.dhikrHeader}>
            <View
              style={[
                styles.dhikrNumber,
                {
                  backgroundColor: isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary,
                },
              ]}
            >
              <ThemedText type="small">{index + 1}</ThemedText>
            </View>
            <ThemedText type="caption" secondary>
              {item.source}
            </ThemedText>
          </View>

          <ThemedText type="arabicLarge" style={styles.arabicText}>
            {item.textAr}
          </ThemedText>

          <ThemedText type="small" secondary style={styles.transliteration}>
            {item.transliteration}
          </ThemedText>

          <ThemedText type="body" secondary style={styles.translation}>
            {item.translation}
          </ThemedText>

          {item.repetitions > 0 ? (
            <View style={styles.counterSection}>
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(progress * 100, 100)}%`,
                      backgroundColor: isCompleted
                        ? (isDark ? Colors.dark.success : Colors.light.success)
                        : (isDark ? Colors.dark.primary : Colors.light.primary),
                    },
                  ]}
                />
              </View>

              <View style={styles.counterContainer}>
                <Pressable
                  onPress={() => resetCount(item.id)}
                  style={({ pressed }) => [
                    styles.resetButton,
                    {
                      backgroundColor: isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Feather name="rotate-ccw" size={16} color={theme.textSecondary} />
                </Pressable>

                <Pressable
                  onPress={() => handleCount(item.id, item.repetitions)}
                  disabled={isCompleted}
                  style={({ pressed }) => [
                    styles.countButton,
                    {
                      backgroundColor: isCompleted
                        ? (isDark ? Colors.dark.success : Colors.light.success)
                        : (isDark ? Colors.dark.primary : Colors.light.primary),
                      opacity: pressed && !isCompleted ? 0.8 : 1,
                      transform: [{ scale: pressed && !isCompleted ? 0.95 : 1 }],
                    },
                  ]}
                >
                  {isCompleted ? (
                    <Feather name="check" size={24} color="#FFFFFF" />
                  ) : (
                    <ThemedText type="h3" style={{ color: "#FFFFFF" }}>
                      {currentCount}
                    </ThemedText>
                  )}
                </Pressable>

                <View style={styles.repInfo}>
                  <ThemedText type="caption" secondary>
                    of {item.repetitions}
                  </ThemedText>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      );
    },
    [counts, isDark, theme, handleCount, resetCount]
  );

  const completedCount = dhikrList.filter(
    (d) => d.repetitions > 0 && (counts[d.id] || 0) >= d.repetitions
  ).length;
  const totalWithReps = dhikrList.filter((d) => d.repetitions > 0).length;

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.progressHeader,
          {
            backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault,
            borderBottomColor: isDark ? Colors.dark.border : Colors.light.border,
          },
        ]}
      >
        <View style={styles.progressInfo}>
          <ThemedText type="body" style={{ fontWeight: "500" }}>
            {category.titleEn}
          </ThemedText>
          <ThemedText type="arabic" secondary style={{ fontSize: 14, textAlign: "left" }}>
            {category.titleAr}
          </ThemedText>
        </View>
        {totalWithReps > 0 ? (
          <View style={styles.completionBadge}>
            <ThemedText
              type="small"
              style={{ color: isDark ? Colors.dark.primary : Colors.light.primary }}
            >
              {completedCount}/{totalWithReps} completed
            </ThemedText>
          </View>
        ) : null}
      </View>

      <FlatList
        data={dhikrList}
        renderItem={renderDhikr}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.lg }} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  progressInfo: {},
  completionBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  listContent: {
    padding: Spacing.lg,
  },
  dhikrCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  dhikrHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  dhikrNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  arabicText: {
    marginBottom: Spacing.lg,
    lineHeight: 44,
    textAlign: "right",
  },
  transliteration: {
    fontStyle: "italic",
    marginBottom: Spacing.md,
  },
  translation: {
    marginBottom: Spacing.lg,
  },
  counterSection: {
    marginTop: Spacing.md,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  resetButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  countButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  repInfo: {
    width: 44,
    alignItems: "center",
  },
});
