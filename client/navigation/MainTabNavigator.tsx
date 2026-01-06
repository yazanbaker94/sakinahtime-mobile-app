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

  return (
    <Tab.Navigator
      initialRouteName="QiblaTab"
      screenOptions={{
        ...screenOptions,
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
      }}
    >
      <Tab.Screen
        name="QiblaTab"
        component={QiblaScreen}
        options={{
          title: "Qibla",
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
          title: "Prayer",
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
          title: "Quran",
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
          title: "Azkar",
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
          title: "Settings",
          headerTitle: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
