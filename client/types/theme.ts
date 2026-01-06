export type ThemeId = "default" | "roseGold" | "lavender" | "sagePeach" | "oceanBreeze";
export type ColorMode = "light" | "dark" | "auto";

export interface ThemeColors {
  text: string;
  textSecondary: string;
  buttonText: string;
  tabIconDefault: string;
  tabIconSelected: string;
  link: string;
  backgroundRoot: string;
  backgroundDefault: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  primary: string;
  primaryLight: string;
  gold: string;
  goldLight: string;
  success: string;
  muted: string;
  border: string;
  cardBackground: string;
  prayerActive: string;
  prayerPast: string;
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  nameAr: string;
  description: string;
  previewColors: [string, string, string];
  light: ThemeColors;
  dark: ThemeColors;
}
