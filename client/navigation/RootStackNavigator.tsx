import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import AzkarDetailScreen from "@/screens/AzkarDetailScreen";
import MushafScreen from "@/screens/MushafScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import type { AzkarCategory } from "@/data/azkar";

export type RootStackParamList = {
  Main: undefined;
  AzkarDetail: { category: AzkarCategory };
  Mushaf: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AzkarDetail"
        component={AzkarDetailScreen}
        options={{
          presentation: "modal",
          headerTitle: "Azkar",
        }}
      />
      <Stack.Screen
        name="Mushaf"
        component={MushafScreen}
        options={{
          headerTitle: "Mushaf",
        }}
      />
    </Stack.Navigator>
  );
}
