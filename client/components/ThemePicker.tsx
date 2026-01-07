import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
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
      <View style={[styles.modeSelector, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
        {(["light", "dark", "auto"] as ColorMode[]).map((mode) => {
          const isActive = colorMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              style={[
                styles.modeButton,
                isActive && { backgroundColor: theme.primary },
              ]}
              onPress={() => setColorMode(mode)}
              activeOpacity={0.7}
            >
              <Feather
                name={mode === "light" ? "sun" : mode === "dark" ? "moon" : "smartphone"}
                size={16}
                color={isActive ? "#FFFFFF" : theme.text}
              />
              <Text
                style={[
                  styles.modeText,
                  { color: isActive ? "#FFFFFF" : theme.text },
                ]}
              >
                {mode === "auto" ? "Auto" : mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Theme Selector */}
      <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
        Theme
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.themeScroll}
      >
        {themeOrder.map((id) => {
          const config = Themes[id];
          const isSelected = themeId === id;
          const themeColors = isDark ? config.dark : config.light;

          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.themeCard,
                { 
                  borderColor: isSelected ? themeColors.primary : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => setThemeId(id)}
              activeOpacity={0.8}
            >
              {/* Theme Preview Card */}
              <View style={[styles.previewContainer, { backgroundColor: themeColors.backgroundRoot }]}>
                {/* Mini header */}
                <View style={[styles.previewHeader, { backgroundColor: themeColors.primary }]}>
                  <View style={styles.previewHeaderDots}>
                    <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.5)' }]} />
                    <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.5)' }]} />
                  </View>
                </View>
                
                {/* Mini content */}
                <View style={styles.previewContent}>
                  {/* Mini card */}
                  <View style={[styles.previewMiniCard, { backgroundColor: themeColors.cardBackground }]}>
                    <View style={[styles.previewAccent, { backgroundColor: themeColors.primary }]} />
                    <View style={styles.previewLines}>
                      <View style={[styles.previewLine, { backgroundColor: themeColors.text, width: '60%' }]} />
                      <View style={[styles.previewLine, { backgroundColor: themeColors.textSecondary, width: '40%' }]} />
                    </View>
                  </View>
                  
                  {/* Color dots */}
                  <View style={styles.previewDots}>
                    <View style={[styles.colorDot, { backgroundColor: themeColors.primary }]} />
                    <View style={[styles.colorDot, { backgroundColor: themeColors.gold }]} />
                    <View style={[styles.colorDot, { backgroundColor: themeColors.success }]} />
                  </View>
                </View>
              </View>
              
              {/* Theme Name */}
              <View style={styles.themeInfo}>
                <Text style={[styles.themeName, { color: theme.text }]} numberOfLines={1}>
                  {config.name}
                </Text>
                <Text style={[styles.themeNameAr, { color: theme.textSecondary }]} numberOfLines={1}>
                  {config.nameAr}
                </Text>
              </View>

              {/* Selected Indicator */}
              {isSelected && (
                <View style={[styles.checkmark, { backgroundColor: themeColors.primary }]}>
                  <Feather name="check" size={10} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  modeSelector: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  modeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  themeScroll: {
    paddingRight: Spacing.md,
    gap: Spacing.sm,
  },
  themeCard: {
    width: 120,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  previewContainer: {
    height: 80,
    borderTopLeftRadius: BorderRadius.md - 1,
    borderTopRightRadius: BorderRadius.md - 1,
    overflow: 'hidden',
  },
  previewHeader: {
    height: 20,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  previewHeaderDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  previewContent: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
  },
  previewMiniCard: {
    flexDirection: 'row',
    borderRadius: 4,
    padding: 6,
    alignItems: 'center',
  },
  previewAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    marginRight: 6,
  },
  previewLines: {
    flex: 1,
    gap: 4,
  },
  previewLine: {
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  previewDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  themeInfo: {
    padding: Spacing.sm,
    alignItems: 'center',
  },
  themeName: {
    fontSize: 12,
    fontWeight: "600",
  },
  themeNameAr: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.7,
  },
  checkmark: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
});
