import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import QiblaScreen from "@/screens/QiblaScreen";
import PrayerTimesScreen from "@/screens/PrayerTimesScreen";
import MushafScreen from "@/screens/MushafScreen";
import AzkarScreen from "@/screens/AzkarScreen";
import { useTheme } from "@/hooks/useTheme";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { Colors } from "@/constants/theme";

export type MainTabParamList = {
  QiblaTab: undefined;
  PrayerTimesTab: undefined;
  QuranTab: undefined;
  AzkarTab: undefined;
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
        tabBarActiveTintColor: isDark ? Colors.dark.primary : Colors.light.primary,
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
          tabBarIcon: ({ color, size }) => (
            <Feather name="heart" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
