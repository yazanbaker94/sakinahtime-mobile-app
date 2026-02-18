import React from "react";
import { StyleSheet, Platform, Image } from "react-native";
import { NavigationContainer, LinkingOptions, createNavigationContainerRef } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Font from "expo-font";
import { Asset } from "expo-asset";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { widgetDataService } from "./services/WidgetDataService";
import audioService from "./services/AudioService";
import { LanguageProvider } from "@/contexts/LanguageContext";

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
      Progress: 'progress',
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
import { PrayerColorProvider } from "@/contexts/PrayerColorContext";

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
        await Promise.all([
          Font.loadAsync({
            'AlMushafQuran': require('../assets/fonts/AlMushafQuran.ttf'),
          }),
          // Pre-cache all 3D icon assets so they render instantly on tab navigation
          Asset.loadAsync([
            require('../assets/images/3d-images/travel.png'),
            require('../assets/images/3d-images/eating.png'),
            require('../assets/images/3d-images/entering.png'),
            require('../assets/images/3d-images/cloud.png'),
            require('../assets/images/3d-images/quranstand.png'),
            require('../assets/images/3d-images/book.png'),
            require('../assets/images/3d-images/globe.png'),
            require('../assets/images/3d-images/Guidance.png'),
            require('../assets/images/3d-images/Family.png'),
            require('../assets/images/3d-images/Gratitude.png'),
            require('../assets/images/3d-images/Forgiveness.png'),
            require('../assets/images/3d-images/Weather.png'),
            require('../assets/images/3d-images/customdua.png'),
            require('../assets/images/3d-images/GeneralAzkar.png'),
            require('../assets/images/3d-images/AfterPrayer.png'),
            require('../assets/images/3d-images/WakingUp.png'),
            require('../assets/images/3d-images/Worship.png'),
            require('../assets/images/3d-images/Purification.png'),
            require('../assets/images/3d-images/Knowledge.png'),
            require('../assets/images/3d-images/Character.png'),
            require('../assets/images/3d-images/Finance.png'),
            require('../assets/images/3d-images/location.png'),
          ]),
        ]);
        setFontsLoaded(true);

        // Sync widget data on app launch (Android only)
        if (Platform.OS === 'android') {
          syncWidgetDataOnLaunch();
        }



        // Pre-fetch word timing data for default reciter in background
        // This ensures word-by-word highlighting is ready when user plays audio
        audioService.prefetchTimingData();
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
    // Helper to get most recently read page from progress
    const getMostRecentPage = async (): Promise<number> => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const stored = await AsyncStorage.getItem('@quran_reading_progress');
        if (stored) {
          const progress = JSON.parse(stored);
          const pagesRead = progress.pagesRead || {};
          let mostRecentPage = 1;
          let mostRecentTime = 0;

          for (const [pageStr, data] of Object.entries(pagesRead)) {
            const pageData = data as { lastReadAt?: number };
            if (pageData.lastReadAt && pageData.lastReadAt > mostRecentTime) {
              mostRecentTime = pageData.lastReadAt;
              mostRecentPage = parseInt(pageStr, 10);
            }
          }
          return mostRecentPage;
        }
      } catch (e) {
        console.warn('[App] Failed to get most recent page:', e);
      }
      return 1; // Default to page 1
    };

    // Handle notification tap when app is in background/closed
    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(async response => {
      const notificationId = response.notification.request.identifier;
      console.log('📬 Notification tapped:', notificationId);

      // Check if this is our reading reminder notification
      if (notificationId === READING_REMINDER_ID) {
        console.log('📖 Reading reminder tapped, navigating to Mushaf');
        const lastPage = await getMostRecentPage();
        console.log('📖 Navigating to page:', lastPage);

        // Small delay to ensure navigation is ready
        setTimeout(() => {
          if (navigationRef.isReady()) {
            // Navigate to QuranTab with initialPage parameter
            navigationRef.navigate('Main', { screen: 'QuranTab', params: { page: lastPage } } as any);
          }
        }, 100);
      }
    });

    // Check if app was opened from a notification (cold start)
    Notifications.getLastNotificationResponseAsync().then(async response => {
      if (response && response.notification.request.identifier === READING_REMINDER_ID) {
        console.log('📖 App opened from reading reminder notification');
        const lastPage = await getMostRecentPage();
        console.log('📖 Navigating to page:', lastPage);

        setTimeout(() => {
          if (navigationRef.isReady()) {
            // Navigate to QuranTab with initialPage parameter
            navigationRef.navigate('Main', { screen: 'QuranTab', params: { page: lastPage } } as any);
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
      <LanguageProvider>
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
                            <PrayerColorProvider>
                              <RootStackNavigator />
                            </PrayerColorProvider>
                          </NavigationContainer>
                        </KeyboardProvider>
                      </GestureHandlerRootView>
                    </SafeAreaProvider>
                  </RamadanProvider>
                </LocationProvider>
              </CoordinatesProvider>
            </QueryClientProvider>
          </PrayerAdjustmentsProvider>
        </ErrorBoundary>
      </LanguageProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
