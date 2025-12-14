import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, ScrollView } from "react-native";
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

type AzkarDetailRouteProp = RouteProp<RootStackParamList, "AzkarDetail">;

export default function AzkarDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const route = useRoute<AzkarDetailRouteProp>();
  const { category } = route.params;

  const [showTransliteration, setShowTransliteration] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  const dhikrList = azkarData[category.id] || [];

  const renderDhikr = useCallback(
    ({ item, index }: { item: Dhikr; index: number }) => {
      return (
        <View
          style={[
            styles.dhikrCard,
            {
              backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault,
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

          {showTransliteration ? (
            <ThemedText type="small" secondary style={styles.transliteration}>
              {item.transliteration}
            </ThemedText>
          ) : null}

          {showTranslation ? (
            <ThemedText type="body" secondary style={styles.translation}>
              {item.translation}
            </ThemedText>
          ) : null}

          {item.repetitions > 0 ? (
            <View style={styles.repBadge}>
              <ThemedText
                type="caption"
                style={{ color: isDark ? Colors.dark.primary : Colors.light.primary }}
              >
                Repeat {item.repetitions}x
              </ThemedText>
            </View>
          ) : null}
        </View>
      );
    },
    [isDark, showTransliteration, showTranslation]
  );

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault,
            borderBottomColor: isDark ? Colors.dark.border : Colors.light.border,
          },
        ]}
      >
        <View style={styles.headerInfo}>
          <ThemedText type="body" style={{ fontWeight: "500" }}>
            {category.titleEn}
          </ThemedText>
          <ThemedText type="arabic" secondary style={{ fontSize: 14, textAlign: "left" }}>
            {category.titleAr}
          </ThemedText>
        </View>
        <View style={styles.toggleContainer}>
          <Pressable
            onPress={() => setShowTransliteration(!showTransliteration)}
            style={({ pressed }) => [
              styles.toggleButton,
              {
                backgroundColor: showTransliteration
                  ? (isDark ? Colors.dark.primary + "20" : Colors.light.primary + "20")
                  : (isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary),
                borderColor: showTransliteration
                  ? (isDark ? Colors.dark.primary : Colors.light.primary)
                  : "transparent",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather
              name="type"
              size={14}
              color={showTransliteration
                ? (isDark ? Colors.dark.primary : Colors.light.primary)
                : theme.textSecondary
              }
            />
            <ThemedText
              type="caption"
              style={{
                marginLeft: 4,
                color: showTransliteration
                  ? (isDark ? Colors.dark.primary : Colors.light.primary)
                  : theme.textSecondary,
              }}
            >
              Translit
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => setShowTranslation(!showTranslation)}
            style={({ pressed }) => [
              styles.toggleButton,
              {
                backgroundColor: showTranslation
                  ? (isDark ? Colors.dark.gold + "20" : Colors.light.gold + "20")
                  : (isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary),
                borderColor: showTranslation
                  ? (isDark ? Colors.dark.gold : Colors.light.gold)
                  : "transparent",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather
              name="globe"
              size={14}
              color={showTranslation
                ? (isDark ? Colors.dark.gold : Colors.light.gold)
                : theme.textSecondary
              }
            />
            <ThemedText
              type="caption"
              style={{
                marginLeft: 4,
                color: showTranslation
                  ? (isDark ? Colors.dark.gold : Colors.light.gold)
                  : theme.textSecondary,
              }}
            >
              English
            </ThemedText>
          </Pressable>
        </View>
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerInfo: {
    marginBottom: Spacing.md,
  },
  toggleContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
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
    marginBottom: Spacing.md,
    lineHeight: 44,
    textAlign: "right",
  },
  transliteration: {
    fontStyle: "italic",
    marginBottom: Spacing.md,
  },
  translation: {
    marginBottom: Spacing.md,
  },
  repBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
});
