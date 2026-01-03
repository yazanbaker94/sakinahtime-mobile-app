import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useLocation } from "@/contexts/LocationContext";
import {
  usePrayerTimes,
  useCalculationMethod,
  getNextPrayer,
  getTimeUntilPrayer,
  formatTime,
  isPrayerPast,
} from "@/hooks/usePrayerTimes";
import { useNotifications } from "@/hooks/useNotifications";
import { useAzan } from "@/hooks/useAzan";
import { usePrayerAdjustments, applyAdjustment } from "@/hooks/usePrayerAdjustments";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { Feather } from "@expo/vector-icons";

const PRAYERS = [
  { key: "Fajr", nameEn: "Fajr", nameAr: "الفجر", icon: "sunrise" },
  { key: "Dhuhr", nameEn: "Dhuhr", nameAr: "الظهر", icon: "sun" },
  { key: "Asr", nameEn: "Asr", nameAr: "العصر", icon: "cloud" },
  { key: "Maghrib", nameEn: "Maghrib", nameAr: "المغرب", icon: "sunset" },
  { key: "Isha", nameEn: "Isha", nameAr: "العشاء", icon: "moon" },
] as const;

const ARABIC_NUMERALS: Record<string, string> = {
  "0": "٠",
  "1": "١",
  "2": "٢",
  "3": "٣",
  "4": "٤",
  "5": "٥",
  "6": "٦",
  "7": "٧",
  "8": "٨",
  "9": "٩",
};

function toArabicNumerals(num: number): string {
  return String(num)
    .split("")
    .map((digit) => ARABIC_NUMERALS[digit] || digit)
    .join("");
}

export default function PrayerTimesScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; nameAr: string } | null>(null);
  const { method: calculationMethod, isLoading: methodLoading } = useCalculationMethod();

  const {
    latitude,
    longitude,
    city,
    loading: locationLoading,
    permission,
    requestPermission,
    openSettings,
    canAskAgain,
  } = useLocation();

  const hasValidLocation = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;

  const {
    data: prayerData,
    isLoading: prayerLoading,
    error: prayerError,
    refetch,
    isUsingCache,
    cacheLastSync,
    isOffline,
  } = usePrayerTimes(
    hasValidLocation && !methodLoading ? latitude : null,
    hasValidLocation && !methodLoading ? longitude : null,
    calculationMethod
  );

  const {
    settings: notificationSettings,
    schedulePrayerNotifications,
  } = useNotifications();

  const {
    settings: azanSettings,
  } = useAzan();

  const { adjustments: prayerAdjustments } = usePrayerAdjustments();

  useEffect(() => {
    if (latitude !== null && longitude !== null && latitude !== undefined && longitude !== undefined) {
      refetch();
    }
  }, [calculationMethod, latitude, longitude, refetch]);

  useEffect(() => {
    if (!prayerData?.timings) return;

    const updateCountdown = () => {
      const next = getNextPrayer(prayerData.timings);
      setNextPrayer(next);
      if (next) {
        setCountdown(getTimeUntilPrayer(next.time));
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [prayerData?.timings]);

  useEffect(() => {
    if (prayerData?.timings && notificationSettings.enabled) {
      // Apply adjustments to prayer times before scheduling
      const adjustedTimings = {
        ...prayerData.timings,
        Fajr: applyAdjustment(prayerData.timings.Fajr, prayerAdjustments.Fajr),
        Dhuhr: applyAdjustment(prayerData.timings.Dhuhr, prayerAdjustments.Dhuhr),
        Asr: applyAdjustment(prayerData.timings.Asr, prayerAdjustments.Asr),
        Maghrib: applyAdjustment(prayerData.timings.Maghrib, prayerAdjustments.Maghrib),
        Isha: applyAdjustment(prayerData.timings.Isha, prayerAdjustments.Isha),
      };
      
      schedulePrayerNotifications(adjustedTimings, azanSettings.enabled);
    }
  }, [
    prayerData?.timings, 
    notificationSettings.enabled,
    notificationSettings.prayers.Fajr,
    notificationSettings.prayers.Dhuhr,
    notificationSettings.prayers.Asr,
    notificationSettings.prayers.Maghrib,
    notificationSettings.prayers.Isha,
    azanSettings.enabled,
    prayerAdjustments.Fajr,
    prayerAdjustments.Dhuhr,
    prayerAdjustments.Asr,
    prayerAdjustments.Maghrib,
    prayerAdjustments.Isha,
    schedulePrayerNotifications
  ]);

  if (!permission?.granted) {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[
            styles.content,
            {
              paddingTop: headerHeight + Spacing.xl,
              paddingBottom: tabBarHeight + Spacing.xl,
            },
          ]}
        >
          <View style={styles.permissionContainer}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundSecondary },
              ]}
            >
              <Feather name="map-pin" size={48} color={isDark ? Colors.dark.primary : Colors.light.primary} />
            </View>
            <ThemedText type="h3" style={styles.permissionTitle}>
              Location Access Required
            </ThemedText>
            <ThemedText type="body" secondary style={styles.permissionText}>
              We need your location to calculate accurate prayer times for your area.
            </ThemedText>
            {Platform.OS === "web" ? (
              <ThemedText type="small" secondary style={styles.permissionText}>
                Please enable location in your browser settings.
              </ThemedText>
            ) : canAskAgain ? (
              <Pressable
                onPress={requestPermission}
                style={[styles.permissionButton, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}
              >
                <ThemedText type="body" style={{ color: "#FFFFFF" }}>
                  Enable Location
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable
                onPress={openSettings}
                style={[styles.permissionButton, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}
              >
                <ThemedText type="body" style={{ color: "#FFFFFF" }}>
                  Open Settings
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>
      </ThemedView>
    );
  }

  if (locationLoading || prayerLoading || methodLoading) {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[
            styles.loadingContent,
            {
              paddingTop: headerHeight + Spacing.xl,
              paddingBottom: tabBarHeight + Spacing.xl,
            },
          ]}
        >
          <ThemedText type="body" secondary>
            Loading prayer times...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (prayerError) {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[
            styles.loadingContent,
            {
              paddingTop: headerHeight + Spacing.xl,
              paddingBottom: tabBarHeight + Spacing.xl,
            },
          ]}
        >
          <Feather name="alert-circle" size={48} color={isDark ? Colors.dark.muted : Colors.light.muted} />
          <ThemedText type="body" secondary style={styles.errorText}>
            Failed to load prayer times
          </ThemedText>
          <Pressable
            onPress={() => refetch()}
            style={[styles.retryButton, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}
          >
            <ThemedText type="small" style={{ color: "#FFFFFF" }}>
              Retry
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Offline indicator when using cached data */}
        <OfflineIndicator 
          isOffline={isOffline || isUsingCache} 
          lastSync={cacheLastSync} 
        />

        {nextPrayer ? (
          <View
            style={[
              styles.nextPrayerCard,
              {
                backgroundColor: isDark ? 'rgba(26, 95, 79, 0.95)' : 'rgba(16, 185, 129, 0.95)',
                shadowColor: isDark ? '#34D399' : '#059669',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 6,
              },
            ]}
          >
            {/* Compact Header with Info */}
            <View style={styles.compactHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.nextPrayerBadge}>
                  <Feather name="clock" size={12} color="#FFFFFF" />
                  <ThemedText type="caption" style={{ color: "#FFFFFF", marginLeft: 5, fontWeight: '700', letterSpacing: 0.5, fontSize: 10 }}>
                    NEXT PRAYER
                  </ThemedText>
                </View>
                <View style={styles.prayerNameCompact}>
                  <ThemedText type="h2" style={{ color: "#FFFFFF", fontWeight: '800', fontSize: 28, letterSpacing: -1 }}>
                    {nextPrayer.name}
                  </ThemedText>
                  <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', color: "rgba(255,255,255,0.9)", fontSize: 16, marginLeft: 10 }}>
                    {nextPrayer.nameAr}
                  </ThemedText>
                </View>
              </View>
              
              {/* Metadata */}
              <View style={styles.metadataCompact}>
                {prayerData?.date && (
                  <Pressable 
                    style={styles.calendarButton}
                    onPress={() => navigation.navigate('HijriCalendar')}
                  >
                    <Feather name="calendar" size={14} color="#FFFFFF" />
                    <ThemedText type="caption" style={{ color: "#FFFFFF", marginLeft: 8, fontSize: 13, fontWeight: '600' }}>
                      {toArabicNumerals(Number(prayerData.date.hijri.day) || 0)} {prayerData.date.hijri.month.ar} • View Calendar
                    </ThemedText>
                    <Feather name="chevron-right" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </Pressable>
                )}
                {city && (
                  <View style={styles.metaRow}>
                    <Feather name="map-pin" size={11} color="rgba(255,255,255,0.8)" />
                    <ThemedText type="caption" style={{ color: "rgba(255,255,255,0.9)", marginLeft: 5, fontSize: 11 }}>
                      {city}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
            
            {/* Compact Countdown */}
            <View style={styles.countdownCompact}>
              <View style={styles.countdownItem}>
                <ThemedText type="h1" style={{ color: "#FFFFFF", fontSize: 40, fontWeight: '800', letterSpacing: -1.5 }}>
                  {String(countdown.hours).padStart(2, "0")}
                </ThemedText>
                <ThemedText type="caption" style={{ color: "rgba(255,255,255,0.75)", fontSize: 9, marginTop: 2, fontWeight: '700', letterSpacing: 0.5 }}>
                  HOURS
                </ThemedText>
              </View>
              <ThemedText type="h1" style={{ color: "rgba(255,255,255,0.4)", fontSize: 32, marginHorizontal: 6, marginTop: -8 }}>
                :
              </ThemedText>
              <View style={styles.countdownItem}>
                <ThemedText type="h1" style={{ color: "#FFFFFF", fontSize: 40, fontWeight: '800', letterSpacing: -1.5 }}>
                  {String(countdown.minutes).padStart(2, "0")}
                </ThemedText>
                <ThemedText type="caption" style={{ color: "rgba(255,255,255,0.75)", fontSize: 9, marginTop: 2, fontWeight: '700', letterSpacing: 0.5 }}>
                  MINUTES
                </ThemedText>
              </View>
              <ThemedText type="h1" style={{ color: "rgba(255,255,255,0.4)", fontSize: 32, marginHorizontal: 6, marginTop: -8 }}>
                :
              </ThemedText>
              <View style={styles.countdownItem}>
                <ThemedText type="h1" style={{ color: "#FFFFFF", fontSize: 40, fontWeight: '800', letterSpacing: -1.5 }}>
                  {String(countdown.seconds).padStart(2, "0")}
                </ThemedText>
                <ThemedText type="caption" style={{ color: "rgba(255,255,255,0.75)", fontSize: 9, marginTop: 2, fontWeight: '700', letterSpacing: 0.5 }}>
                  SECONDS
                </ThemedText>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.prayersList}>
          {PRAYERS.map((prayer, index) => {
            const originalTime = prayerData?.timings?.[prayer.key] || "";
            const adjustment = prayerAdjustments[prayer.key as keyof typeof prayerAdjustments] || 0;
            const adjustedTime = adjustment !== 0 ? applyAdjustment(originalTime, adjustment) : originalTime;
            const displayTime = adjustedTime;
            
            const isPast = isPrayerPast(originalTime);
            const isNext = nextPrayer?.name === prayer.nameEn;

            return (
              <View
                key={prayer.key}
                style={[
                  styles.prayerCard,
                  {
                    backgroundColor: isNext 
                      ? (isDark ? 'rgba(52, 211, 153, 0.15)' : Colors.light.backgroundDefault)
                      : (isDark ? 'rgba(26, 95, 79, 0.2)' : Colors.light.backgroundDefault),
                    opacity: isPast && !isNext ? 0.6 : 1,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.3 : 0.08,
                    shadowRadius: 8,
                    elevation: 3,
                    borderWidth: isNext ? 2 : 0,
                    borderColor: isNext ? (isDark ? '#34D399' : '#059669') : 'transparent',
                  },
                ]}
              >
                {isNext && (
                  <View style={[styles.activePrayerIndicator, { 
                    backgroundColor: isDark ? '#34D399' : '#059669' 
                  }]} />
                )}
                
                <View style={styles.prayerCardLeft}>
                  <View
                    style={[
                      styles.prayerIcon,
                      {
                        backgroundColor: isNext
                          ? (isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.15)')
                          : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'),
                        borderWidth: isNext ? 2 : 0,
                        borderColor: isNext ? (isDark ? '#34D399' : '#059669') : 'transparent',
                      },
                    ]}
                  >
                    <Feather
                      name={prayer.icon as any}
                      size={22}
                      color={isNext ? (isDark ? '#34D399' : '#059669') : (isDark ? Colors.dark.textSecondary : Colors.light.textSecondary)}
                    />
                  </View>
                  <View style={styles.prayerNames}>
                    <ThemedText type="body" style={{ fontWeight: isNext ? "700" : "500", fontSize: 17 }}>
                      {prayer.nameEn}
                    </ThemedText>
                    <ThemedText type="arabic" secondary style={{ fontFamily: 'AlMushafQuran', fontSize: 15, textAlign: "left", marginTop: 2 }}>
                      {prayer.nameAr}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.prayerCardRight}>
                  <View style={styles.prayerTimeContainer}>
                    <ThemedText type="h3" style={{ 
                      color: isNext ? (isDark ? '#34D399' : '#059669') : theme.text,
                      fontWeight: '700',
                      fontSize: 22,
                      letterSpacing: -0.5
                    }}>
                      {formatTime(displayTime)}
                    </ThemedText>
                    {adjustment !== 0 && (
                      <ThemedText type="caption" style={{ 
                        color: adjustment > 0 ? (isDark ? '#34D399' : '#059669') : (isDark ? '#F59E0B' : '#D97706'),
                        fontSize: 10,
                        fontWeight: '600',
                        marginTop: 2,
                      }}>
                        {adjustment > 0 ? '+' : ''}{adjustment} min
                      </ThemedText>
                    )}
                    {isPast && !isNext && (
                      <View style={[styles.completedBadge, {
                        backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)'
                      }]}>
                        <Feather name="check" size={14} color={isDark ? '#34D399' : '#059669'} />
                        <ThemedText type="caption" style={{ 
                          color: isDark ? '#34D399' : '#059669',
                          marginLeft: 4,
                          fontSize: 10,
                          fontWeight: '600'
                        }}>
                          PRAYED
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
  },
  permissionTitle: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  permissionText: {
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  permissionButton: {
    paddingHorizontal: Spacing["3xl"],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  errorText: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  dateContainer: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  hijriDate: {
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  nextPrayerCard: {
    padding: Spacing.lg,
    borderRadius: 18,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  compactHeader: {
    marginBottom: Spacing.md,
  },
  headerLeft: {
    marginBottom: Spacing.sm,
  },
  nextPrayerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: Spacing.sm,
  },
  prayerNameCompact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataCompact: {
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  countdownCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  countdownItem: {
    alignItems: 'center',
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  prayersList: {
    gap: Spacing.md,
  },
  prayerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  activePrayerIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  prayerCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  prayerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  prayerNames: {
    flex: 1,
  },
  prayerCardRight: {
    alignItems: "flex-end",
  },
  prayerTimeContainer: {
    alignItems: 'flex-end',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },
});
