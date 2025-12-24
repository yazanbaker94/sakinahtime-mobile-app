import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import AzkarDetailScreen from "@/screens/AzkarDetailScreen";
import IslamicGuideDetailScreen from "@/screens/IslamicGuideDetailScreen";
import MushafScreen from "@/screens/MushafScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import type { AzkarCategory } from "@/data/azkar";
import type { IslamicGuide } from "@/data/islamicGuides";

export type RootStackParamList = {
  Main: undefined;
  AzkarDetail: { category: AzkarCategory };
  IslamicGuideDetail: { guide: IslamicGuide };
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
        options={({ route }) => ({
          presentation: "modal",
          headerTitle: "Azkar",
          headerTransparent: false,
        })}
      />
      <Stack.Screen
        name="IslamicGuideDetail"
        component={IslamicGuideDetailScreen}
        options={({ route }) => ({
          presentation: "modal",
          headerTitle: "Islamic Guide",
          headerTransparent: false,
        })}
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
