import React from "react";
import { StyleSheet, Platform } from "react-native";
import { NavigationContainer, LinkingOptions, createNavigationContainerRef } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { widgetDataService } from "./services/WidgetDataService";

import { hijriDateService } from "./services/HijriDateService";
import { moonPhaseService } from "./services/MoonPhaseService";

SplashScreen.preventAutoHideAsync();

// Navigation ref for handling notification taps
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Reading reminder notification ID
const READING_REMINDER_ID = 'quran-reading-reminder';

/**
 * Deep linking configuration for the app
 * Supports URLs like:
 * - sakinahtime://video-generator
 * - sakinahtime://video-generator?surah=2&ayahStart=255&ayahEnd=256
 * 
 * Requirements: 11.2
 */
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['sakinahtime://'],
  config: {
    screens: {
      Main: {
        screens: {
          QiblaTab: 'qibla',
          PrayerTimesTab: 'prayer',
          QuranTab: 'quran',
          AzkarTab: 'azkar',
          SettingsTab: 'settings',
        },
      },
      AzkarDetail: 'azkar-detail',
      IslamicGuideDetail: 'islamic-guide',
      Mushaf: 'mushaf',
    },
  },
};

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LocationProvider } from "@/contexts/LocationContext";
import { CoordinatesProvider } from "@/contexts/CoordinatesContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PrayerAdjustmentsProvider } from "@/contexts/PrayerAdjustmentsContext";
import { RamadanProvider } from "@/contexts/RamadanContext";

// Sample verses for daily verse widget
const DAILY_VERSES = [
  { surah: 1, ayah: 1, surahNameAr: "الفاتحة", surahNameEn: "Al-Fatihah", textAr: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", textEn: "In the name of Allah, the Most Gracious, the Most Merciful" },
  { surah: 2, ayah: 255, surahNameAr: "البقرة", surahNameEn: "Al-Baqarah", textAr: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ", textEn: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence" },
  { surah: 2, ayah: 286, surahNameAr: "البقرة", surahNameEn: "Al-Baqarah", textAr: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", textEn: "Allah does not burden a soul beyond that it can bear" },
  { surah: 3, ayah: 139, surahNameAr: "آل عمران", surahNameEn: "Ali 'Imran", textAr: "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ", textEn: "So do not weaken and do not grieve, and you will be superior" },
  { surah: 13, ayah: 28, surahNameAr: "الرعد", surahNameEn: "Ar-Ra'd", textAr: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", textEn: "Verily, in the remembrance of Allah do hearts find rest" },
  { surah: 94, ayah: 5, surahNameAr: "الشرح", surahNameEn: "Ash-Sharh", textAr: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", textEn: "For indeed, with hardship comes ease" },
  { surah: 112, ayah: 1, surahNameAr: "الإخلاص", surahNameEn: "Al-Ikhlas", textAr: "قُلْ هُوَ اللَّهُ أَحَدٌ", textEn: "Say, He is Allah, the One" },
  { surah: 55, ayah: 13, surahNameAr: "الرحمن", surahNameEn: "Ar-Rahman", textAr: "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ", textEn: "So which of the favors of your Lord would you deny?" },
];

/**
 * Sync widget data on app launch
 * Updates all widgets: daily verse, hijri date, and tasbeeh
 */
async function syncWidgetDataOnLaunch() {
  try {
    // 1. Update Daily Verse widget
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const verseIndex = dayOfYear % DAILY_VERSES.length;
    const verse = DAILY_VERSES[verseIndex];
    
    await widgetDataService.updateDailyVerse({
      surah: verse.surah,
      ayah: verse.ayah,
      surahNameAr: verse.surahNameAr,
      surahNameEn: verse.surahNameEn,
      textAr: verse.textAr,
      textEn: verse.textEn,
      verseKey: `${verse.surah}:${verse.ayah}`,
    });
    
    // 2. Update Hijri Date widget
    const hijriDate = hijriDateService.getCurrentHijriDate();
    const moonPhase = moonPhaseService.getCurrentPhase();
    await widgetDataService.updateHijriDate(hijriDate, moonPhase, null, null);
    
    // 3. Update Tasbeeh widget with default values
    await widgetDataService.updateTasbeehCount(0, 33, 'سبحان الله');
    
    console.log('[App] All widget data synced on launch');
  } catch (error) {
    console.warn('[App] Failed to sync widget data:', error);
  }
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);
  const notificationResponseListener = React.useRef<Notifications.Subscription | null>(null);

  React.useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'AlMushafQuran': require('../assets/fonts/AlMushafQuran.ttf'),
        });
        setFontsLoaded(true);
        
        // Sync widget data on app launch (Android only)
        if (Platform.OS === 'android') {
          syncWidgetDataOnLaunch();
        }
      } catch (error) {
        console.error('Error loading fonts:', error);
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    loadFonts();
  }, []);

  // Handle notification taps - navigate to Mushaf for reading reminders
  React.useEffect(() => {
    // Handle notification tap when app is in background/closed
    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const notificationId = response.notification.request.identifier;
      console.log('📬 Notification tapped:', notificationId);
      
      // Check if this is our reading reminder notification
      if (notificationId === READING_REMINDER_ID) {
        console.log('📖 Reading reminder tapped, navigating to Mushaf');
        // Small delay to ensure navigation is ready
        setTimeout(() => {
          if (navigationRef.isReady()) {
            // Navigate to QuranTab within Main tabs (where MushafScreen is)
            navigationRef.navigate('Main', { screen: 'QuranTab' } as any);
          }
        }, 100);
      }
    });

    // Check if app was opened from a notification (cold start)
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response && response.notification.request.identifier === READING_REMINDER_ID) {
        console.log('📖 App opened from reading reminder notification');
        setTimeout(() => {
          if (navigationRef.isReady()) {
            // Navigate to QuranTab within Main tabs (where MushafScreen is)
            navigationRef.navigate('Main', { screen: 'QuranTab' } as any);
          }
        }, 500);
      }
    });

    return () => {
      if (notificationResponseListener.current) {
        notificationResponseListener.current.remove();
      }
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <PrayerAdjustmentsProvider>
          <QueryClientProvider client={queryClient}>
            <CoordinatesProvider>
              <LocationProvider>
                <RamadanProvider>
                  <SafeAreaProvider>
                    <GestureHandlerRootView style={styles.root}>
                      <KeyboardProvider>
                        <NavigationContainer ref={navigationRef} linking={linking}>
                          <RootStackNavigator />
                        </NavigationContainer>
                        <StatusBar style="auto" translucent backgroundColor="transparent" />
                      </KeyboardProvider>
                    </GestureHandlerRootView>
                  </SafeAreaProvider>
                </RamadanProvider>
              </LocationProvider>
            </CoordinatesProvider>
          </QueryClientProvider>
        </PrayerAdjustmentsProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
