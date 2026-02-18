import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Themes, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import type { ThemeId, ColorMode } from "@/types/theme";

const themeOrder: ThemeId[] = ["default", "roseGold", "lavender", "sagePeach", "oceanBreeze"];

const themeNameKeys: Record<ThemeId, string> = {
  default: "themePicker.themeDefault",
  roseGold: "themePicker.themeRoseGold",
  lavender: "themePicker.themeLavender",
  sagePeach: "themePicker.themeSagePeach",
  oceanBreeze: "themePicker.themeOceanBreeze",
};

export function ThemePicker() {
  const { themeId, colorMode, setThemeId, setColorMode, isDark } = useThemeContext();
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Color Mode Selector */}
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t('themePicker.colorMode')}</Text>
      <View style={[styles.modeSelector, {
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#EDEFF2',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
      }]}>
        {(["light", "dark", "auto"] as ColorMode[]).map((mode) => {
          const isActive = colorMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              style={[
                styles.modeButton,
                isActive && {
                  backgroundColor: '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 3,
                },
              ]}
              onPress={() => setColorMode(mode)}
              activeOpacity={0.7}
            >
              <Feather
                name={mode === "light" ? "sun" : mode === "dark" ? "moon" : "smartphone"}
                size={16}
                color={isActive ? theme.primary : (isDark ? '#999' : '#888')}
              />
              <Text
                style={[
                  styles.modeText,
                  { color: isActive ? theme.text : (isDark ? '#999' : '#888') },
                  isActive && { fontWeight: '700' },
                ]}
              >
                {mode === "light" ? t('themePicker.light') : mode === "dark" ? t('themePicker.dark') : t('themePicker.auto')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Theme Selector */}
      <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
        {t('themePicker.theme')}
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
                  borderWidth: 0,
                  borderColor: 'transparent',
                  shadowColor: isSelected ? themeColors.primary : '#000',
                  shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
                  shadowOpacity: isSelected ? 0.45 : (isDark ? 0 : 0.06),
                  shadowRadius: isSelected ? 12 : 6,
                  elevation: isSelected ? 8 : (isDark ? 0 : 2),
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
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
                  {t(themeNameKeys[id])}
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
    overflow: 'visible',
  },
  previewContainer: {
    height: 80,
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
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
