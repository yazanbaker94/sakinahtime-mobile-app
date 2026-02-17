import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import QiblaScreen from "@/screens/QiblaScreen";
import PrayerTimesScreen from "@/screens/PrayerTimesScreen";
import MushafScreen from "@/screens/MushafScreen";
import AzkarScreen from "@/screens/AzkarScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import { useTheme } from "@/hooks/useTheme";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTranslation } from "@/hooks/useTranslation";
import { usePrayerColor } from "@/contexts/PrayerColorContext";

export type MainTabParamList = {
  QiblaTab: undefined;
  PrayerTimesTab: undefined;
  QuranTab: { surahNumber?: number; ayahNumber?: number; page?: number } | undefined;
  AzkarTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const screenOptions = useScreenOptions();
  const { t } = useTranslation();
  const { dynamicColor } = usePrayerColor();

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
          bottom: Platform.OS === "ios" ? 24 : 16,
          left: 16,
          right: 16,
          backgroundColor: Platform.select({
            ios: isDark ? 'rgba(28, 28, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          borderRadius: 28,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.12,
          shadowRadius: 16,
          height: 64,
          paddingBottom: Platform.OS === "ios" ? 0 : 8,
          paddingTop: 8,
          borderWidth: isDark ? 1 : 0,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'transparent',
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={80}
              tint={isDark ? "dark" : "light"}
              style={[StyleSheet.absoluteFill, { borderRadius: 28, overflow: 'hidden' }]}
            />
          ) : null,
      }}
    >
      <Tab.Screen
        name="QiblaTab"
        component={QiblaScreen}
        options={{
          title: t('tabs.qibla'),
          headerTitle: "",
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
          lazy: false, // Pre-render this screen so it's ready instantly
          tabBarIcon: ({ color, size }) => (
            <Feather name="clock" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="QuranTab"
        component={MushafScreen}
        options={{
          title: t('tabs.quran'),
          headerTitle: "",
          headerShown: false,
          lazy: false, // Pre-render this screen so it's ready instantly
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
