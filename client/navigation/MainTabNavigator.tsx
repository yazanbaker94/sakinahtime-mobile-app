import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QiblaScreen from "@/screens/QiblaScreen";
import PrayerTimesScreen from "@/screens/PrayerTimesScreen";
import MushafScreen from "@/screens/MushafScreen";
import AzkarScreen from "@/screens/AzkarScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import { useTheme } from "@/hooks/useTheme";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTranslation } from "@/hooks/useTranslation";
import { usePrayerColorStore } from "@/stores/usePrayerColorStore";

export type MainTabParamList = {
  QiblaTab: undefined;
  PrayerTimesTab: undefined;
  QuranTab: { surahNumber?: number; ayahNumber?: number; page?: number } | undefined;
  AzkarTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// Floating tab bar geometry (exported for screens that need to position above the bar)
export const TAB_BAR_HEIGHT = 64;
// Base bottom offset; screens should use useTabBarBottom() for the dynamic inset-aware value
export const TAB_BAR_BOTTOM_BASE = Platform.OS === 'ios' ? 24 : 16;

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const screenOptions = useScreenOptions();
  const { t } = useTranslation();
  const dynamicColor = usePrayerColorStore((s) => s.dynamicColor);
  const insets = useSafeAreaInsets();

  // Use actual device safe area bottom inset, with a minimum fallback
  const tabBarBottom = Math.max(insets.bottom > 0 ? insets.bottom : TAB_BAR_BOTTOM_BASE, TAB_BAR_BOTTOM_BASE);

  return (
    <Tab.Navigator
      initialRouteName="QiblaTab"
      screenOptions={{
        ...(() => { const { header, animation, ...rest } = screenOptions; return rest; })(),
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: "absolute",
          bottom: tabBarBottom,
          left: 16,
          right: 16,
          backgroundColor: isDark ? '#2A2A2C' : '#FFFFFF',
          borderTopWidth: 0,
          borderRadius: 28,
          elevation: 15,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: isDark ? 0.4 : 0.05,
          shadowRadius: 15,
          height: TAB_BAR_HEIGHT,
          paddingBottom: Platform.OS === "ios" ? 0 : 8,
          paddingTop: 8,
          borderWidth: 0,
          borderColor: 'transparent',
        },
      }}
    >
      <Tab.Screen
        name="QiblaTab"
        component={QiblaScreen}
        options={{
          title: t('tabs.qibla'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="compass" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PrayerTimesTab"
        component={PrayerTimesScreen}
        options={{
          title: t('tabs.prayer'),
          headerTitle: "",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="QuranTab"
        component={MushafScreen}
        options={{
          lazy: false, // Data is pre-loaded from SQLite at startup — mount immediately
          title: t('tabs.quran'),
          headerTitle: "",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="book-open" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AzkarTab"
        component={AzkarScreen}
        options={{
          title: t('tabs.azkar'),
          headerTitle: "",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="heart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: t('tabs.settings'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
