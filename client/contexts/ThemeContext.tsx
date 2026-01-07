import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme as useSystemColorScheme, Platform, StatusBar } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { getThemeColors } from "@/constants/theme";
import type { ThemeId, ColorMode } from "@/types/theme";

interface ThemeContextType {
  themeId: ThemeId;
  colorMode: ColorMode;
  isDark: boolean;
  setThemeId: (id: ThemeId) => Promise<void>;
  setColorMode: (mode: ColorMode) => Promise<void>;
  // Legacy compatibility
  themeMode: "light" | "dark" | "system";
  setThemeMode: (mode: "light" | "dark" | "system") => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_ID_KEY = "@app_theme_id";
const COLOR_MODE_KEY = "@app_color_mode";
const LEGACY_THEME_KEY = "@app_theme_mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themeId, setThemeIdState] = useState<ThemeId>("default");
  const [colorMode, setColorModeState] = useState<ColorMode>("auto");

  // Load saved preferences on mount (with migration)
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Check for new storage keys first
        const savedThemeId = await AsyncStorage.getItem(THEME_ID_KEY);
        const savedColorMode = await AsyncStorage.getItem(COLOR_MODE_KEY);

        if (savedThemeId) {
          setThemeIdState(savedThemeId as ThemeId);
          if (savedColorMode) {
            setColorModeState(savedColorMode as ColorMode);
          }
        } else {
          // Migration: check for legacy theme mode
          const legacyMode = await AsyncStorage.getItem(LEGACY_THEME_KEY);
          if (legacyMode) {
            // Migrate to new system
            await AsyncStorage.setItem(THEME_ID_KEY, "default");
            const newColorMode: ColorMode = legacyMode === "system" ? "auto" : (legacyMode as ColorMode);
            await AsyncStorage.setItem(COLOR_MODE_KEY, newColorMode);
            setColorModeState(newColorMode);
          }
        }
      } catch (error) {
        // Silently fail, use defaults
      }
    };
    loadTheme();
  }, []);

  const setThemeId = useCallback(async (id: ThemeId) => {
    setThemeIdState(id);
    try {
      await AsyncStorage.setItem(THEME_ID_KEY, id);
    } catch (error) {
      // Silently fail
    }
  }, []);

  const setColorMode = useCallback(async (mode: ColorMode) => {
    setColorModeState(mode);
    try {
      await AsyncStorage.setItem(COLOR_MODE_KEY, mode);
    } catch (error) {
      // Silently fail
    }
  }, []);

  // Legacy compatibility
  const setThemeMode = useCallback(async (mode: "light" | "dark" | "system") => {
    const newColorMode: ColorMode = mode === "system" ? "auto" : mode;
    await setColorMode(newColorMode);
  }, [setColorMode]);

  const isDark = colorMode === "auto" 
    ? systemColorScheme === "dark" 
    : colorMode === "dark";

  const themeMode = colorMode === "auto" ? "system" : colorMode;

  // Update Android navigation bar to match theme
  useEffect(() => {
    if (Platform.OS === "android") {
      const updateNavigationBar = async () => {
        try {
          const theme = getThemeColors(themeId, isDark);
          await NavigationBar.setBackgroundColorAsync(theme.backgroundRoot);
          await NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
        } catch {
          // expo-navigation-bar not available in Expo Go, works in production builds
        }
      };
      updateNavigationBar();
    }
  }, [themeId, isDark]);

  // Update status bar to match theme (time, battery, signal icons)
  useEffect(() => {
    StatusBar.setBarStyle(isDark ? "light-content" : "dark-content", true);
    if (Platform.OS === "android") {
      const theme = getThemeColors(themeId, isDark);
      StatusBar.setBackgroundColor(theme.backgroundRoot, true);
    }
  }, [themeId, isDark]);

  return (
    <ThemeContext.Provider value={{ 
      themeId, 
      colorMode, 
      isDark, 
      setThemeId, 
      setColorMode,
      themeMode,
      setThemeMode,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}
