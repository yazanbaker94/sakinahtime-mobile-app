import { getThemeColors, Themes } from "@/constants/theme";
import { useThemeContext } from "@/contexts/ThemeContext";
import type { ThemeColors, ThemeConfig } from "@/types/theme";

export function useTheme() {
  const { themeId, isDark } = useThemeContext();
  const theme = getThemeColors(themeId, isDark);
  const themeConfig = Themes[themeId];

  return {
    theme,
    isDark,
    themeId,
    themeConfig,
  };
}

export type { ThemeColors, ThemeConfig };
