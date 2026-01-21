import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import AzkarDetailScreen from "@/screens/AzkarDetailScreen";
import IslamicGuideDetailScreen from "@/screens/IslamicGuideDetailScreen";
import MushafScreen from "@/screens/MushafScreen";
import ProgressScreen from "@/screens/ProgressScreen";
import HifzProgressScreen from "@/screens/HifzProgressScreen";
import PrayerStatsScreen from "@/screens/PrayerStatsScreen";
import QadaTrackerScreen from "@/screens/QadaTrackerScreen";
import { HijriCalendarScreen } from "@/screens/HijriCalendarScreen";
import { StorageManagementScreen } from "@/screens/StorageManagementScreen";
import { AudioDownloadScreen } from "@/screens/AudioDownloadScreen";
import { DuaCollectionScreen } from "@/screens/DuaCollectionScreen";
import { DuaDetailScreen } from "@/screens/DuaDetailScreen";
import { CustomDuaFormScreen } from "@/screens/CustomDuaFormScreen";
import RamadanDashboardScreen from "@/screens/RamadanDashboardScreen";
import QuranScheduleScreen from "@/screens/QuranScheduleScreen";
import TaraweehTrackerScreen from "@/screens/TaraweehTrackerScreen";
import CharityTrackerScreen from "@/screens/CharityTrackerScreen";
import ZakatCalculatorScreen from "@/screens/ZakatCalculatorScreen";
import AddDonationScreen from "@/screens/AddDonationScreen";
import SetCharityGoalScreen from "@/screens/SetCharityGoalScreen";
import LogTaraweehScreen from "@/screens/LogTaraweehScreen";
import MosqueFinderScreen from "@/screens/MosqueFinderScreen";
import MosqueDetailScreen from "@/screens/MosqueDetailScreen";
import DhikrOverlaySettingsScreen from "@/screens/DhikrOverlaySettingsScreen";
import NotificationSettingsScreen from "@/screens/NotificationSettingsScreen";
import WordByWordSettingsScreen from "@/screens/WordByWordSettingsScreen";
import { ReciterSelectionScreen } from "@/screens/ReciterSelectionScreen";
import LocationSettingsScreen from "@/screens/LocationSettingsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import type { AzkarCategory } from "@/data/azkar";
import type { IslamicGuide } from "@/data/islamicGuides";
import type { TaraweehEntry } from "@/types/ramadan";
import type { Mosque } from "@/types/mosque";

export type RootStackParamList = {
  Main: undefined;
  AzkarDetail: { category: AzkarCategory };
  IslamicGuideDetail: { guide: IslamicGuide };
  Mushaf: { surahNumber?: number; ayahNumber?: number } | undefined;
  Progress: undefined;
  HifzProgress: undefined;
  PrayerStats: undefined;
  QadaTracker: undefined;
  HijriCalendar: undefined;
  StorageManagement: undefined;
  AudioDownload: undefined;
  DuaCollection: undefined;
  DuaDetail: { duaId: string };
  CustomDuaForm: { duaId?: string };
  RamadanDashboard: undefined;
  QuranSchedule: undefined;
  TaraweehTracker: undefined;
  CharityTracker: undefined;
  ZakatCalculator: undefined;
  AddDonation: undefined;
  SetCharityGoal: undefined;
  LogTaraweeh: { day: number; existingEntry?: TaraweehEntry };
  MosqueFinder: undefined;
  MosqueDetail: { mosqueId: string; mosque?: Mosque };
  DhikrOverlaySettings: undefined;
  NotificationSettings: { openSection?: 'calculationMethod' } | undefined;
  WordByWordSettings: undefined;
  ReciterSelection: { currentReciter: string; onSelect: (reciterId: string) => void };
  LocationSettings: undefined;
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
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="IslamicGuideDetail"
        component={IslamicGuideDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Mushaf"
        component={MushafScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="HifzProgress"
        component={HifzProgressScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PrayerStats"
        component={PrayerStatsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="QadaTracker"
        component={QadaTrackerScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="HijriCalendar"
        component={HijriCalendarScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="StorageManagement"
        component={StorageManagementScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AudioDownload"
        component={AudioDownloadScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DuaCollection"
        component={DuaCollectionScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DuaDetail"
        component={DuaDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CustomDuaForm"
        component={CustomDuaFormScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="RamadanDashboard"
        component={RamadanDashboardScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="QuranSchedule"
        component={QuranScheduleScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TaraweehTracker"
        component={TaraweehTrackerScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CharityTracker"
        component={CharityTrackerScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ZakatCalculator"
        component={ZakatCalculatorScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AddDonation"
        component={AddDonationScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="SetCharityGoal"
        component={SetCharityGoalScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="LogTaraweeh"
        component={LogTaraweehScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MosqueFinder"
        component={MosqueFinderScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MosqueDetail"
        component={MosqueDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DhikrOverlaySettings"
        component={DhikrOverlaySettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="WordByWordSettings"
        component={WordByWordSettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ReciterSelection"
        component={ReciterSelectionScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="LocationSettings"
        component={LocationSettingsScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
