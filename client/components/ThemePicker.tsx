import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Themes, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useTheme } from "@/hooks/useTheme";
import type { ThemeId, ColorMode } from "@/types/theme";

const themeOrder: ThemeId[] = ["default", "roseGold", "lavender", "sagePeach", "oceanBreeze"];

export function ThemePicker() {
  const { themeId, colorMode, setThemeId, setColorMode, isDark } = useThemeContext();
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {/* Color Mode Selector */}
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Color Mode</Text>
      <View style={[styles.modeSelector, { backgroundColor: theme.backgroundSecondary }]}>
        {(["light", "dark", "auto"] as ColorMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.modeButton,
              colorMode === mode && { backgroundColor: theme.primary },
            ]}
            onPress={() => setColorMode(mode)}
          >
            <Feather
              name={mode === "light" ? "sun" : mode === "dark" ? "moon" : "smartphone"}
              size={16}
              color={colorMode === mode ? theme.buttonText : theme.text}
            />
            <Text
              style={[
                styles.modeText,
                { color: colorMode === mode ? theme.buttonText : theme.text },
              ]}
            >
              {mode === "auto" ? "Auto" : mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Theme Selector */}
      <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: Spacing.xl }]}>
        Theme
      </Text>
      <View style={styles.themeGrid}>
        {themeOrder.map((id) => {
          const config = Themes[id];
          const isSelected = themeId === id;
          const previewColors = isDark 
            ? [config.dark.primary, config.dark.gold, config.dark.backgroundRoot]
            : config.previewColors;

          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.themeCard,
                { 
                  backgroundColor: theme.cardBackground,
                  borderColor: isSelected ? theme.primary : theme.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => setThemeId(id)}
            >
              {/* Color Preview */}
              <View style={styles.colorPreview}>
                {previewColors.map((color, index) => (
                  <View
                    key={index}
                    style={[styles.colorSwatch, { backgroundColor: color }]}
                  />
                ))}
              </View>
              
              {/* Theme Name */}
              <Text style={[styles.themeName, { color: theme.text }]} numberOfLines={1}>
                {config.name}
              </Text>
              <Text style={[styles.themeNameAr, { color: theme.textSecondary }]} numberOfLines={1}>
                {config.nameAr}
              </Text>

              {/* Selected Indicator */}
              {isSelected && (
                <View style={[styles.checkmark, { backgroundColor: theme.primary }]}>
                  <Feather name="check" size={12} color={theme.buttonText} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  sectionLabel: {
    ...Typography.small,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  modeSelector: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    gap: Spacing.xs,
  },
  modeText: {
    ...Typography.small,
    fontWeight: "500",
  },
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  themeCard: {
    width: "30%",
    minWidth: 95,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    alignItems: "center",
  },
  colorPreview: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
    gap: 2,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.xs,
  },
  themeName: {
    ...Typography.small,
    fontWeight: "500",
  },
  themeNameAr: {
    ...Typography.caption,
    marginTop: 2,
  },
  checkmark: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
