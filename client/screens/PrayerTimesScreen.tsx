import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
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

  useEffect(() => {
    if (!prayerData?.timings) return;

    const updateCountdown = () => {
      const next = getNextPrayer(prayerData.timings, adjustments);
      setNextPrayer(next);
      if (next) {
        setCountdown(getTimeUntilPrayer(next.time));
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
            Checking location permission...
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
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <Feather name="map-pin" size={48} color={theme.primary} />
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
            ) : canAskAgain || permission?.status === 'undetermined' ? (
              <Pressable
                onPress={requestPermission}
                style={[styles.permissionButton, { backgroundColor: theme.primary }]}
              >
                <ThemedText type="body" style={{ color: "#FFFFFF" }}>
                  Enable Location
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable
                onPress={openSettings}
                style={[styles.permissionButton, { backgroundColor: theme.primary }]}
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
          <Feather name="alert-circle" size={48} color={theme.muted} />
          <ThemedText type="body" secondary style={styles.errorText}>
            Failed to load prayer times
          </ThemedText>
          <Pressable
            onPress={() => refetch()}
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
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
                backgroundColor: isDark ? `${theme.primary}30` : `${theme.primary}F2`,
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
                      NEXT PRAYER
                    </ThemedText>
                  </View>
                  {trackingEnabled && isPerfectDay && (
                    <View style={styles.perfectDayBadge}>
                      <Feather name="star" size={12} color="#FBBF24" />
                      <ThemedText type="caption" style={{ color: "#FBBF24", marginLeft: 4, fontWeight: '700', fontSize: 10 }}>
                        PERFECT DAY!
                      </ThemedText>
                    </View>
                  )}
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

              {/* Metadata - compact row with calendar, location, and calculation method */}
              <View style={styles.metadataRow}>
                {prayerData?.date?.hijri && (
                  <Pressable
                    style={styles.compactButton}
                    onPress={() => navigation.navigate('HijriCalendar')}
                  >
                    <Feather name="calendar" size={14} color="#FFFFFF" />
                    <ThemedText type="caption" style={styles.compactButtonText}>
                      {toArabicNumerals(Number(prayerData.date.hijri.day) || 0)} {prayerData.date.hijri.month?.ar || ''}
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
                    {CALCULATION_METHODS.find(m => m.id === calculationMethod)?.shortName || 'ISNA'}
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

        {/* Streak indicator */}
        {trackingEnabled && streak && streak.currentStreak > 0 && (
          <StreakCard streak={streak} compact />
        )}

        <View style={styles.prayersList}>
          {PRAYERS.map((prayer) => {
            const originalTime = prayerData?.timings?.[prayer.key] || "";
            const adjustment = prayerAdjustments[prayer.key as keyof typeof prayerAdjustments] || 0;
            const adjustedTime = adjustment !== 0 ? applyAdjustment(originalTime, adjustment) : originalTime;
            const displayTime = adjustedTime;

            const isPast = isPrayerPast(originalTime);
            const isNext = nextPrayer?.name === prayer.nameEn;
            const prayerStatus = getPrayerStatus(prayer.key as PrayerName);

            const handleStatusChange = (newStatus: PrayerStatus) => {
              markPrayer(prayer.key as PrayerName, newStatus, originalTime);
              // Cancel the missed prayer reminder if user marks the prayer
              if (newStatus !== 'unmarked' && missedReminderEnabled) {
                cancelMissedPrayerReminder(prayer.key as PrayerName);
              }
            };

            return (
              <View
                key={prayer.key}
                style={[
                  styles.prayerCard,
                  {
                    backgroundColor: isNext
                      ? (isDark ? `${theme.primary}20` : theme.cardBackground)
                      : (isDark ? theme.cardBackground : theme.cardBackground),
                    opacity: isPast && !isNext ? 0.6 : 1,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0 : 0.08,
                    shadowRadius: 8,
                    elevation: isDark ? 0 : 3,
                    borderWidth: isNext ? 2 : (isDark ? 1 : 0),
                    borderColor: isNext ? theme.primary : (isDark ? theme.border : 'transparent'),
                  },
                ]}
              >
                {isNext && (
                  <View style={[styles.activePrayerIndicator, {
                    backgroundColor: theme.primary
                  }]} />
                )}

                <View style={styles.prayerCardLeft}>
                  <View
                    style={[
                      styles.prayerIcon,
                      {
                        backgroundColor: isNext
                          ? `${theme.primary}20`
                          : (isDark ? theme.backgroundSecondary : 'rgba(0, 0, 0, 0.04)'),
                        borderWidth: isNext ? 2 : 0,
                        borderColor: isNext ? theme.primary : 'transparent',
                      },
                    ]}
                  >
                    <Feather
                      name={prayer.icon as any}
                      size={22}
                      color={isNext ? theme.primary : theme.textSecondary}
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
                      color: isNext ? theme.primary : theme.text,
                      fontWeight: '700',
                      fontSize: 22,
                      letterSpacing: -0.5
                    }}>
                      {formatTime(displayTime)}
                    </ThemedText>
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
                  {trackingEnabled && (
                    <View style={styles.statusIndicatorContainer}>
                      <PrayerStatusIndicator
                        status={prayerStatus}
                        onStatusChange={handleStatusChange}
                        size="compact"
                      />
                    </View>
                  )}
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
    position: 'relative',
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
