import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform, useWindowDimensions, Image } from "react-native";

import { TravelerJourney } from '@/components/TravelerJourney';
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useLocation } from "@/contexts/LocationContext";
import {
  usePrayerTimes,
  useCalculationMethod,
  useAutoDetectCalculationMethod,
  CALCULATION_METHODS,
  getNextPrayer,
  getTimeUntilPrayer,
  formatTime,
  isPrayerPast,
} from "@/hooks/usePrayerTimes";
import { useNotifications } from "@/hooks/useNotifications";
import { useAzan } from "@/hooks/useAzan";
import { useIqamaSettings } from "@/hooks/useIqamaSettings";
import { usePrayerAdjustments, applyAdjustment } from "@/hooks/usePrayerAdjustments";
import { usePrayerLog } from "@/hooks/usePrayerLog";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PrayerStatusIndicator } from "@/components/PrayerStatusIndicator";
import { StreakCard } from "@/components/StreakCard";
import { LocationIndicator } from "@/components/LocationIndicator";
import { Feather } from "@expo/vector-icons";
import { PrayerName, PrayerStatus } from "@/types/prayerLog";
import { useTranslation } from "@/hooks/useTranslation";
import { usePrayerColor } from "@/contexts/PrayerColorContext";

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
  const { t, locale } = useTranslation();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { height: screenHeight } = useWindowDimensions();

  // Responsive sizes based on screen height (smaller screens = smaller elements)
  const isSmallScreen = screenHeight < 700;
  const iconSize = isSmallScreen ? 40 : 48;
  const prayerNameFontSize = isSmallScreen ? 15 : 17;
  const timeFontSize = isSmallScreen ? 18 : 22;

  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; nameAr: string } | null>(null);
  const [travelerProgress, setTravelerProgress] = useState(0);
  const [nextPrayerIndex, setNextPrayerIndex] = useState(0);
  const [celebrateKey, setCelebrateKey] = useState(0);
  const celebrateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setDynamicColor } = usePrayerColor();
  const { method: calculationMethod, isLoading: methodLoading } = useCalculationMethod();

  const {
    latitude,
    longitude,
    city,
    country,
    loading: locationLoading,
    permission,
    requestPermission,
    openSettings,
    canAskAgain,
  } = useLocation();

  // Auto-detect calculation method based on country (only on first launch)
  useAutoDetectCalculationMethod(country);

  // Get prayer time adjustments
  const { adjustments } = usePrayerAdjustments();

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
    calculationMethod,
    city && country ? `${city}, ${country}` : city || country || ''
  );

  const {
    settings: notificationSettings,
    schedulePrayerNotifications,
    scheduleIqamaNotifications,
    scheduleMissedPrayerReminders,
    cancelMissedPrayerReminder,
    clearScheduleCache,
  } = useNotifications();

  const {
    settings: azanSettings,
  } = useAzan();

  const {
    settings: iqamaSettings,
  } = useIqamaSettings();

  const { adjustments: prayerAdjustments } = usePrayerAdjustments();

  const {
    markPrayer,
    getPrayerStatus,
    isPerfectDay,
    streak,
    trackingEnabled,
    missedReminderEnabled,
    missedReminderDelayMinutes,
    refresh: refreshPrayerLog,
  } = usePrayerLog();

  // Refresh prayer log when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshPrayerLog();
      // Clear schedule cache to force rescheduling when returning to screen
      // This handles phone time changes, timezone changes, etc.
      clearScheduleCache();
    }, [refreshPrayerLog, clearScheduleCache])
  );

  useEffect(() => {
    if (latitude !== null && longitude !== null && latitude !== undefined && longitude !== undefined) {
      refetch();
    }
  }, [calculationMethod, latitude, longitude, refetch]);

  // Sync tab bar color with current prayer's time-of-day palette
  const PRAYER_COLORS: Record<string, string> = {
    Fajr: '#5B8FB9',    // Dawn blue
    Dhuhr: '#D4A017',   // Solar gold
    Asr: '#CD853F',     // Amber
    Maghrib: '#E06666', // Coral sunset
    Isha: '#6C63AC',    // Deep indigo
  };

  useEffect(() => {
    if (nextPrayer?.name) {
      setDynamicColor(PRAYER_COLORS[nextPrayer.name] || theme.primary);
    } else {
      setDynamicColor(theme.primary);
    }
  }, [nextPrayer?.name, theme.primary, setDynamicColor]);

  useEffect(() => {
    if (!prayerData?.timings) return;

    const prayerKeys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

    const updateCountdown = () => {
      const next = getNextPrayer(prayerData.timings, adjustments);
      setNextPrayer(next);
      if (next) {
        setCountdown(getTimeUntilPrayer(next.time));
      }

      // Calculate traveler progress
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

      const prayerMinutes = prayerKeys.map(key => {
        const timeStr = prayerData.timings[key];
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        const adj = adjustments?.[key] || 0;
        return h * 60 + m + adj;
      });

      // Find which segment we're in
      let nextIdx: number = prayerKeys.length; // After Isha by default
      for (let i = 0; i < prayerMinutes.length; i++) {
        if (prayerMinutes[i] > currentMinutes) {
          nextIdx = i;
          break;
        }
      }

      setNextPrayerIndex(nextIdx);

      if (nextIdx === 0) {
        // Before Fajr
        setTravelerProgress(0);
      } else if (nextIdx >= prayerKeys.length) {
        // After Isha
        setTravelerProgress(1);
      } else {
        const prevTime = prayerMinutes[nextIdx - 1];
        const nextTime = prayerMinutes[nextIdx];
        const range = nextTime - prevTime;
        const elapsed = currentMinutes - prevTime;
        setTravelerProgress(range > 0 ? Math.max(0, Math.min(1, elapsed / range)) : 0);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [prayerData?.timings, adjustments]);

  // Schedule prayer alarms when notifications OR azan is enabled
  // This fixes the first-install azan issue: azan defaults to true, notifications to false
  useEffect(() => {
    if (prayerData?.timings && (notificationSettings.enabled || azanSettings.enabled)) {
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
    schedulePrayerNotifications,
  ]);

  // Schedule iqama notifications separately (independent of prayer notifications)
  useEffect(() => {
    if (prayerData?.timings && iqamaSettings.enabled) {
      const adjustedTimings = {
        ...prayerData.timings,
        Fajr: applyAdjustment(prayerData.timings.Fajr, prayerAdjustments.Fajr),
        Dhuhr: applyAdjustment(prayerData.timings.Dhuhr, prayerAdjustments.Dhuhr),
        Asr: applyAdjustment(prayerData.timings.Asr, prayerAdjustments.Asr),
        Maghrib: applyAdjustment(prayerData.timings.Maghrib, prayerAdjustments.Maghrib),
        Isha: applyAdjustment(prayerData.timings.Isha, prayerAdjustments.Isha),
      };

      scheduleIqamaNotifications(adjustedTimings, iqamaSettings);
    }
  }, [
    prayerData?.timings,
    iqamaSettings.enabled,
    iqamaSettings.delayMinutes,
    iqamaSettings.prayers.Fajr,
    iqamaSettings.prayers.Dhuhr,
    iqamaSettings.prayers.Asr,
    iqamaSettings.prayers.Maghrib,
    iqamaSettings.prayers.Isha,
    prayerAdjustments.Fajr,
    prayerAdjustments.Dhuhr,
    prayerAdjustments.Asr,
    prayerAdjustments.Maghrib,
    prayerAdjustments.Isha,
    scheduleIqamaNotifications
  ]);

  // Schedule missed prayer reminders when tracking is enabled
  useEffect(() => {
    if (prayerData?.timings && trackingEnabled) {
      const adjustedTimings = {
        ...prayerData.timings,
        Fajr: applyAdjustment(prayerData.timings.Fajr, prayerAdjustments.Fajr),
        Dhuhr: applyAdjustment(prayerData.timings.Dhuhr, prayerAdjustments.Dhuhr),
        Asr: applyAdjustment(prayerData.timings.Asr, prayerAdjustments.Asr),
        Maghrib: applyAdjustment(prayerData.timings.Maghrib, prayerAdjustments.Maghrib),
        Isha: applyAdjustment(prayerData.timings.Isha, prayerAdjustments.Isha),
      };

      scheduleMissedPrayerReminders(
        adjustedTimings,
        missedReminderDelayMinutes,
        missedReminderEnabled
      );
    }
  }, [
    prayerData?.timings,
    trackingEnabled,
    missedReminderEnabled,
    missedReminderDelayMinutes,
    prayerAdjustments.Fajr,
    prayerAdjustments.Dhuhr,
    prayerAdjustments.Asr,
    prayerAdjustments.Maghrib,
    prayerAdjustments.Isha,
    scheduleMissedPrayerReminders,
  ]);

  // Show loading while permission status is being determined
  if (permission === null) {
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
            {t('prayer.checkingPermission')}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

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
            {/* 3D Location Pin with Glow */}
            <View style={{ alignItems: 'center', marginBottom: -40, zIndex: 2 }}>
              {/* Glow behind pin */}
              <View style={{
                position: 'absolute',
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: theme.primary,
                opacity: 0.12,
                top: 10,
              }} />
              <Image
                source={require('../../assets/images/3d-images/location.png')}
                style={{ width: 120, height: 120 }}
                resizeMode="contain"
                fadeDuration={0}
              />
            </View>

            {/* Floating Pedestal Card */}
            <View style={{
              backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
              borderRadius: 24,
              paddingTop: 56,
              paddingBottom: 32,
              paddingHorizontal: 28,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.08,
              shadowRadius: 24,
              elevation: 5,
              width: '100%',
            }}>
              <ThemedText type="h3" style={styles.permissionTitle}>
                {t('prayer.locationRequired')}
              </ThemedText>
              <ThemedText type="body" secondary style={styles.permissionText}>
                {t('prayer.locationExplanation')}
              </ThemedText>
              {Platform.OS === "web" ? (
                <ThemedText type="small" secondary style={styles.permissionText}>
                  {t('prayer.browserLocationHint')}
                </ThemedText>
              ) : canAskAgain || permission?.status === 'undetermined' ? (
                <Pressable
                  onPress={requestPermission}
                  style={({ pressed }) => [styles.permissionButton, {
                    backgroundColor: theme.primary,
                    shadowColor: theme.primary,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.35,
                    shadowRadius: 12,
                    elevation: 6,
                    opacity: pressed ? 0.85 : 1,
                    width: '100%',
                  }]}
                >
                  <Feather name="navigation" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: '700', fontSize: 16 }}>
                    {t('prayer.enableLocation')}
                  </ThemedText>
                </Pressable>
              ) : (
                <Pressable
                  onPress={openSettings}
                  style={({ pressed }) => [styles.permissionButton, {
                    backgroundColor: theme.primary,
                    shadowColor: theme.primary,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.35,
                    shadowRadius: 12,
                    elevation: 6,
                    opacity: pressed ? 0.85 : 1,
                    width: '100%',
                  }]}
                >
                  <Feather name="settings" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: '700', fontSize: 16 }}>
                    {t('prayer.openSettings')}
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </ThemedView>
    );
  }

  // Only show loading if we have NO data at all (no cached/preloaded data)
  if ((locationLoading || prayerLoading || methodLoading) && !prayerData) {
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
            {t('prayer.loadingPrayerTimes')}
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
          <Feather name="alert-circle" size={48} color={theme.muted} />
          <ThemedText type="body" secondary style={styles.errorText}>
            {t('prayer.failedToLoad')}
          </ThemedText>
          <Pressable
            onPress={() => refetch()}
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
          >
            <ThemedText type="small" style={{ color: "#FFFFFF" }}>
              {t('common.retry')}
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.md,
            paddingBottom: tabBarHeight,
            flex: 1,
          },
        ]}
      >
        {nextPrayer ? (
          <View
            style={[
              styles.nextPrayerCard,
              {
                backgroundColor: isDark ? theme.cardBackground : theme.primary,
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: isDark ? 0 : 0.25,
                shadowRadius: 12,
                elevation: isDark ? 0 : 6,
              },
            ]}
          >
            {/* Header buttons row */}
            <View style={styles.headerButtons}>
              {/* Calendar button */}
              <Pressable
                style={styles.statsButton}
                onPress={() => navigation.navigate('PrayerCalendar')}
              >
                <Feather name="calendar" size={18} color="#FFFFFF" />
              </Pressable>
              {/* Stats button */}
              <Pressable
                style={styles.statsButton}
                onPress={() => navigation.navigate('PrayerStats')}
              >
                <Feather name="bar-chart-2" size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* Compact Header with Info */}
            <View style={styles.compactHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.nextPrayerBadgeRow}>
                  <View style={styles.nextPrayerBadge}>
                    <Feather name="clock" size={12} color="#FFFFFF" />
                    <ThemedText type="caption" style={{ color: "#FFFFFF", marginLeft: 5, fontWeight: '700', letterSpacing: 0.5, fontSize: 10 }}>
                      {t('prayer.nextPrayer')}
                    </ThemedText>
                  </View>
                  {trackingEnabled && streak && streak.currentStreak > 0 && (
                    <View style={[styles.nextPrayerBadge, { backgroundColor: 'rgba(251, 191, 36, 0.25)' }]}>
                      <Feather name="zap" size={12} color="#FBBF24" />
                      <ThemedText type="caption" style={{ color: "#FBBF24", marginLeft: 4, fontWeight: '700', fontSize: 10 }}>
                        {streak.currentStreak} {streak.currentStreak > 1 ? t('prayer.days') : t('prayer.day')}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.prayerNameCompact}>
                  <ThemedText type="h2" style={{ color: "#FFFFFF", fontWeight: '800', fontSize: 28, letterSpacing: -1 }}>
                    {nextPrayer.name}
                  </ThemedText>
                  <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', color: "rgba(255,255,255,0.9)", fontSize: 20, marginLeft: 10, marginTop: 2 }}>
                    {nextPrayer.nameAr}
                  </ThemedText>
                </View>
              </View>

              {/* Metadata - compact row with calendar, location, and calculation method */}
              <View style={styles.metadataRow}>
                {prayerData?.date?.hijri && (
                  <Pressable
                    style={styles.compactButton}
                    onPress={() => navigation.navigate('HijriCalendar')}
                  >
                    <Feather name="calendar" size={14} color="#FFFFFF" />
                    <ThemedText type="caption" style={styles.compactButtonText}>
                      {toArabicNumerals(Number(prayerData.date.hijri.day) || 0)} {t(`hijri.months.${prayerData.date.hijri.month?.number || 1}`)}
                    </ThemedText>
                  </Pressable>
                )}
                {/* Calculation method badge */}
                <Pressable
                  style={styles.compactButton}
                  onPress={() => navigation.navigate('NotificationSettings', { openSection: 'calculationMethod' })}
                >
                  <Feather name="book" size={14} color="#FFFFFF" />
                  <ThemedText type="caption" style={styles.compactButtonText} numberOfLines={1}>
                    {(() => { const m = CALCULATION_METHODS.find(m => m.id === calculationMethod); return m?.shortName || 'ISNA'; })()}
                  </ThemedText>
                </Pressable>
                {/* Location button */}
                <LocationIndicator variant="card" />
              </View>
            </View>

            {/* Compact Countdown */}
            <View style={styles.countdownCompact}>
              <View style={styles.countdownItem}>
                <ThemedText type="h1" style={{ color: "#FFFFFF", fontSize: 40, fontWeight: '800', letterSpacing: -1.5 }}>
                  {String(countdown.hours).padStart(2, "0")}
                </ThemedText>
                <ThemedText type="caption" style={{ color: "rgba(255,255,255,0.75)", fontSize: 9, marginTop: 2, fontWeight: '700', letterSpacing: 0.5 }}>
                  {t('prayer.hours')}
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
                  {t('prayer.minutes')}
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
                  {t('prayer.seconds')}
                </ThemedText>
              </View>
            </View>

            {/* Traveler Journey */}
            {prayerData?.timings && (
              <TravelerJourney
                prayerTimes={{
                  Fajr: prayerData.timings.Fajr,
                  Dhuhr: prayerData.timings.Dhuhr,
                  Asr: prayerData.timings.Asr,
                  Maghrib: prayerData.timings.Maghrib,
                  Isha: prayerData.timings.Isha,
                }}
                progress={travelerProgress}
                nextPrayerIndex={nextPrayerIndex}
                celebrate={celebrateKey > 0}
              />
            )}
          </View>
        ) : null}

        {/* Prayer list with vertical timeline */}
        <View style={[styles.prayersList, { flex: 1, marginBottom: Spacing.md, position: 'relative' }]}>
          {/* Vertical timeline line (unfilled background) */}
          <View style={{
            position: 'absolute',
            left: 15,
            top: 24,
            bottom: 24,
            width: 2,
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            borderRadius: 1,
            zIndex: 0,
          }}>
            {/* Filled portion - progresses between specific prayer dots */}
            <View style={{
              width: '100%',
              height: `${Math.min(100, Math.max(0, (() => {
                // Fill up to the current prayer dot, then progressively fill toward the next
                const totalSegments = PRAYERS.length - 1;
                if (totalSegments <= 0) return 0;
                const completedSegments = nextPrayerIndex > 0 ? nextPrayerIndex - 1 : 0;
                const partialFill = travelerProgress;
                return ((completedSegments + partialFill) / totalSegments) * 100;
              })()))}%`,
              backgroundColor: theme.primary,
              borderRadius: 1,
              opacity: 0.8,
            }} />
          </View>
          {PRAYERS.map((prayer, index) => {
            const originalTime = prayerData?.timings?.[prayer.key] || "";
            const adjustment = prayerAdjustments[prayer.key as keyof typeof prayerAdjustments] || 0;
            const adjustedTime = adjustment !== 0 ? applyAdjustment(originalTime, adjustment) : originalTime;
            const displayTime = adjustedTime;

            const isPast = isPrayerPast(originalTime);
            const isNext = nextPrayer?.name === prayer.nameEn;
            const prayerStatus = getPrayerStatus(prayer.key as PrayerName);

            // "Active Now" = this prayer's time has passed, and the NEXT prayer in list is the upcoming one
            const nextPrayerIdx = PRAYERS.findIndex(p => p.nameEn === nextPrayer?.name);
            const isCurrent = isPast && !isNext && index === nextPrayerIdx - 1;

            const handleStatusChange = (newStatus: PrayerStatus) => {
              markPrayer(prayer.key as PrayerName, newStatus, originalTime);
              // Cancel the missed prayer reminder if user marks the prayer
              if (newStatus !== 'unmarked' && missedReminderEnabled) {
                cancelMissedPrayerReminder(prayer.key as PrayerName);
              }
            };

            return (
              <View key={prayer.key} style={{ flexDirection: 'row', alignItems: 'stretch', flex: 1 }}>
                {/* Timeline dot — Y-centered with the card's status circle */}
                <View style={{
                  width: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                }}>
                  <View style={{
                    width: (isNext || isCurrent) ? 12 : 8,
                    height: (isNext || isCurrent) ? 12 : 8,
                    borderRadius: (isNext || isCurrent) ? 6 : 4,
                    backgroundColor: (isPast || isCurrent || isNext) ? theme.primary : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'),
                    borderWidth: (isNext || isCurrent) ? 2.5 : 0,
                    borderColor: (isNext || isCurrent) ? `${theme.primary}40` : 'transparent',
                  }} />
                </View>
                <View
                  style={[
                    styles.prayerCard,
                    { marginLeft: 8 },
                    {
                      flex: 1,
                      backgroundColor: isNext
                        ? (isDark ? `${theme.primary}20` : theme.cardBackground)
                        : isCurrent
                          ? (isDark ? `${theme.primary}10` : `${theme.primary}08`)
                          : (isDark ? theme.cardBackground : theme.cardBackground),
                      opacity: (isPast && !isNext && !isCurrent) ? 0.45 : 1,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDark ? 0 : 0.08,
                      shadowRadius: 8,
                      elevation: isDark ? 0 : 3,
                      borderWidth: isNext ? 2 : isCurrent ? 1 : (isDark ? 1 : 0),
                      borderColor: isNext ? theme.primary : isCurrent ? `${theme.primary}40` : (isDark ? theme.border : 'transparent'),
                    },
                  ]}
                >
                  {isNext && (
                    <View style={[styles.activePrayerIndicator, {
                      backgroundColor: theme.primary
                    }]} />
                  )}
                  {isCurrent && (
                    <View style={[styles.activePrayerIndicator, {
                      backgroundColor: theme.primary,
                      opacity: 0.5,
                    }]} />
                  )}

                  <View style={styles.prayerCardLeft}>
                    {/* Status indicator - shows auto-filled check for past unmarked prayers */}
                    {trackingEnabled && (
                      <PrayerStatusIndicator
                        status={prayerStatus}
                        onStatusChange={handleStatusChange}
                        size="compact"
                        isPastAndUnmarked={isPast && !isCurrent && prayerStatus === 'unmarked'}
                        isCurrent={isCurrent && prayerStatus === 'unmarked'}
                        onCelebrate={() => {
                          setCelebrateKey(k => k + 1);
                          // Reset after animation completes
                          if (celebrateTimerRef.current) clearTimeout(celebrateTimerRef.current);
                          celebrateTimerRef.current = setTimeout(() => setCelebrateKey(0), 1200);
                        }}
                      />
                    )}

                    <View style={styles.prayerNames}>
                      <ThemedText type="body" style={{ fontWeight: (isNext || isCurrent) ? "700" : "500", fontSize: prayerNameFontSize }}>
                        {t(`prayer.${prayer.key.toLowerCase()}`)}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.prayerCardRight}>
                    <View style={styles.prayerTimeContainer}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <ThemedText type="h3" style={{
                          color: isNext ? theme.primary : isCurrent ? (isDark ? '#FFFFFF' : '#3D2E2E') : theme.text,
                          fontWeight: '700',
                          fontSize: timeFontSize,
                          letterSpacing: -0.5
                        }}>
                          {formatTime(displayTime)}
                        </ThemedText>
                        {isCurrent && (
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: `${theme.primary}25`,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 10,
                            gap: 4,
                            marginLeft: 2,
                          }}>
                            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: isDark ? '#FFFFFF' : '#5A3D3D' }} />
                            <ThemedText type="caption" style={{ color: isDark ? '#FFFFFF' : '#5A3D3D', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>
                              {t('prayer.active') || 'ACTIVE'}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                      {adjustment !== 0 && (
                        <ThemedText type="caption" style={{
                          color: adjustment > 0 ? theme.primary : theme.gold,
                          fontSize: 10,
                          fontWeight: '600',
                          marginTop: 2,
                        }}>
                          {adjustment > 0 ? '+' : ''}{adjustment} min
                        </ThemedText>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

      </View>
    </ThemedView >
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    position: 'relative',
  },
  prayerCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  headerButtons: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  statsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactHeader: {
    marginBottom: Spacing.md,
  },
  headerLeft: {
    marginBottom: Spacing.sm,
  },
  nextPrayerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingRight: 90, // Space for header buttons
    flexWrap: 'wrap',
  },
  nextPrayerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  perfectDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
  prayerNameCompact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  compactButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
    gap: Spacing.sm,
  },
  prayerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
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
  statusIndicatorContainer: {
    marginTop: Spacing.sm,
  },
  viewingDateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
});
