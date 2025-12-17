import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform, Switch } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useLocation } from "@/contexts/LocationContext";
import {
  usePrayerTimes,
  useCalculationMethod,
  CALCULATION_METHODS,
  getNextPrayer,
  getTimeUntilPrayer,
  formatTime,
  isPrayerPast,
} from "@/hooks/usePrayerTimes";
import { useNotifications, NotificationSettings } from "@/hooks/useNotifications";
import { useAzan } from "@/hooks/useAzan";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

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

  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; nameAr: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const { method: calculationMethod, setMethod: setCalculationMethod, isLoading: methodLoading } = useCalculationMethod();

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
  
  console.log('[PrayerTimesScreen] Location state:', { 
    latitude, 
    longitude, 
    hasValidLocation,
    calculationMethod,
    methodLoading,
    locationLoading,
    permissionGranted: permission?.granted
  });

  const {
    data: prayerData,
    isLoading: prayerLoading,
    error: prayerError,
    refetch,
  } = usePrayerTimes(
    hasValidLocation ? latitude : null,
    hasValidLocation ? longitude : null,
    calculationMethod
  );

  const {
    settings: notificationSettings,
    toggleNotifications,
    togglePrayerNotification,
    schedulePrayerNotifications,
  } = useNotifications();

  const {
    settings: azanSettings,
    isPlaying: azanPlaying,
    toggleAzan,
    playPreview,
    stopAzan,
  } = useAzan();

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
      schedulePrayerNotifications(prayerData.timings);
    }
  }, [prayerData?.timings, notificationSettings, schedulePrayerNotifications]);

  const handleToggleNotifications = async (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await toggleNotifications(value);
  };

  const handleTogglePrayerNotification = async (prayer: keyof NotificationSettings["prayers"], value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await togglePrayerNotification(prayer, value);
  };

  const handleToggleAzan = async (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await toggleAzan(value);
  };

  const handlePlayAzan = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (azanPlaying) {
      await stopAzan();
    } else {
      await playPreview();
    }
  };

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
            {permission?.status === "denied" && !canAskAgain ? (
              Platform.OS !== "web" ? (
                <Pressable
                  onPress={openSettings}
                  style={[styles.permissionButton, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}
                >
                  <ThemedText type="body" style={{ color: "#FFFFFF" }}>
                    Open Settings
                  </ThemedText>
                </Pressable>
              ) : (
                <ThemedText type="small" secondary style={styles.permissionText}>
                  Please enable location in your browser settings.
                </ThemedText>
              )
            ) : (
              <Pressable
                onPress={requestPermission}
                style={[styles.permissionButton, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}
              >
                <ThemedText type="body" style={{ color: "#FFFFFF" }}>
                  Enable Location
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
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {city ? (
          <View style={styles.locationBadge}>
            <Feather name="map-pin" size={14} color={isDark ? Colors.dark.primary : Colors.light.primary} />
            <ThemedText type="small" style={{ color: isDark ? Colors.dark.primary : Colors.light.primary, marginLeft: Spacing.xs }}>
              {city}
            </ThemedText>
          </View>
        ) : null}

        {prayerData?.date ? (
          <View style={styles.dateContainer}>
            <ThemedText type="arabic" style={styles.hijriDate}>
              {toArabicNumerals(parseInt(prayerData.date.hijri.day))} {prayerData.date.hijri.month.ar} {toArabicNumerals(parseInt(prayerData.date.hijri.year))}
            </ThemedText>
            <ThemedText type="small" secondary>
              {prayerData.date.gregorian.weekday.en}, {prayerData.date.gregorian.day} {prayerData.date.gregorian.month.en} {prayerData.date.gregorian.year}
            </ThemedText>
          </View>
        ) : null}

        {nextPrayer ? (
          <View
            style={[
              styles.nextPrayerCard,
              {
                backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
              },
            ]}
          >
            <ThemedText type="small" style={{ color: "rgba(255,255,255,0.8)" }}>
              Next Prayer
            </ThemedText>
            <View style={styles.nextPrayerInfo}>
              <View>
                <ThemedText type="h2" style={{ color: "#FFFFFF" }}>
                  {nextPrayer.name}
                </ThemedText>
                <ThemedText type="arabic" style={{ color: "rgba(255,255,255,0.9)", textAlign: "left" }}>
                  {nextPrayer.nameAr}
                </ThemedText>
              </View>
              <View style={styles.countdownContainer}>
                <ThemedText type="h1" style={{ color: "#FFFFFF" }}>
                  {String(countdown.hours).padStart(2, "0")}:{String(countdown.minutes).padStart(2, "0")}
                </ThemedText>
                <ThemedText type="caption" style={{ color: "rgba(255,255,255,0.7)" }}>
                  :{String(countdown.seconds).padStart(2, "0")}
                </ThemedText>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.prayersList}>
          {PRAYERS.map((prayer) => {
            const time = prayerData?.timings?.[prayer.key] || "";
            const isPast = isPrayerPast(time);
            const isNext = nextPrayer?.name === prayer.nameEn;

            return (
              <View
                key={prayer.key}
                style={[
                  styles.prayerCard,
                  {
                    backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault,
                    opacity: isPast && !isNext ? 0.5 : 1,
                    borderLeftColor: isNext ? (isDark ? Colors.dark.primary : Colors.light.primary) : "transparent",
                    borderLeftWidth: isNext ? 3 : 0,
                  },
                ]}
              >
                <View style={styles.prayerCardLeft}>
                  <View
                    style={[
                      styles.prayerIcon,
                      {
                        backgroundColor: isNext
                          ? (isDark ? Colors.dark.primary : Colors.light.primary)
                          : (isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary),
                      },
                    ]}
                  >
                    <Feather
                      name={prayer.icon as any}
                      size={20}
                      color={isNext ? "#FFFFFF" : (isDark ? Colors.dark.textSecondary : Colors.light.textSecondary)}
                    />
                  </View>
                  <View>
                    <ThemedText type="body" style={{ fontWeight: isNext ? "600" : "400" }}>
                      {prayer.nameEn}
                    </ThemedText>
                    <ThemedText type="arabic" secondary style={{ fontSize: 14, textAlign: "left" }}>
                      {prayer.nameAr}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.prayerCardRight}>
                  <ThemedText type="h4" style={{ color: isNext ? (isDark ? Colors.dark.primary : Colors.light.primary) : theme.text }}>
                    {formatTime(time)}
                  </ThemedText>
                  {isPast && !isNext ? (
                    <Feather name="check" size={16} color={isDark ? Colors.dark.success : Colors.light.success} />
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        <Pressable
          onPress={() => setShowSettings(!showSettings)}
          style={[
            styles.settingsHeader,
            { backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundSecondary },
          ]}
        >
          <View style={styles.settingsHeaderLeft}>
            <Feather name="settings" size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
            <ThemedText type="h4" style={{ marginLeft: Spacing.md }}>
              Notification Settings
            </ThemedText>
          </View>
          <Feather
            name={showSettings ? "chevron-up" : "chevron-down"}
            size={20}
            color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary}
          />
        </Pressable>

        {showSettings ? (
          <View
            style={[
              styles.settingsContainer,
              { backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault },
            ]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Feather name="bell" size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                <View style={styles.settingText}>
                  <ThemedText type="body">Prayer Notifications</ThemedText>
                  <ThemedText type="small" secondary>
                    Get notified when it&apos;s time to pray
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={notificationSettings.enabled}
                onValueChange={handleToggleNotifications}
                trackColor={{
                  false: isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary,
                  true: isDark ? Colors.dark.primary : Colors.light.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            {notificationSettings.enabled ? (
              <View style={styles.prayerNotifications}>
                {PRAYERS.map((prayer) => (
                  <View key={prayer.key} style={styles.prayerNotificationRow}>
                    <ThemedText type="body">{prayer.nameEn}</ThemedText>
                    <Switch
                      value={notificationSettings.prayers[prayer.key as keyof NotificationSettings["prayers"]]}
                      onValueChange={(value) =>
                        handleTogglePrayerNotification(prayer.key as keyof NotificationSettings["prayers"], value)
                      }
                      trackColor={{
                        false: isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary,
                        true: isDark ? Colors.dark.primary : Colors.light.primary,
                      }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.settingDivider} />

            <Pressable
              onPress={() => setShowMethodPicker(!showMethodPicker)}
              style={styles.settingRow}
            >
              <View style={styles.settingInfo}>
                <Feather name="book" size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                <View style={styles.settingText}>
                  <ThemedText type="body">Calculation Method</ThemedText>
                  <ThemedText type="small" secondary>
                    {CALCULATION_METHODS.find(m => m.id === calculationMethod)?.name || "ISNA"}
                  </ThemedText>
                </View>
              </View>
              <Feather
                name={showMethodPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary}
              />
            </Pressable>

            {showMethodPicker ? (
              <View style={styles.methodPicker}>
                <ScrollView style={styles.methodList} nestedScrollEnabled>
                  {CALCULATION_METHODS.map((m) => (
                    <Pressable
                      key={m.id}
                      onPress={() => {
                        setCalculationMethod(m.id);
                        setShowMethodPicker(false);
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                      style={[
                        styles.methodItem,
                        {
                          backgroundColor: calculationMethod === m.id
                            ? (isDark ? Colors.dark.primary + "20" : Colors.light.primary + "20")
                            : "transparent",
                        },
                      ]}
                    >
                      <ThemedText
                        type="small"
                        style={{
                          color: calculationMethod === m.id
                            ? (isDark ? Colors.dark.primary : Colors.light.primary)
                            : (isDark ? Colors.dark.text : Colors.light.text),
                        }}
                      >
                        {m.name}
                      </ThemedText>
                      {calculationMethod === m.id ? (
                        <Feather
                          name="check"
                          size={16}
                          color={isDark ? Colors.dark.primary : Colors.light.primary}
                        />
                      ) : null}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.settingDivider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Feather name="volume-2" size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                <View style={styles.settingText}>
                  <ThemedText type="body">Azan Sound</ThemedText>
                  <ThemedText type="small" secondary>
                    Play Azan when prayer time arrives
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={azanSettings.enabled}
                onValueChange={handleToggleAzan}
                trackColor={{
                  false: isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary,
                  true: isDark ? Colors.dark.primary : Colors.light.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            {azanSettings.enabled ? (
              <Pressable
                onPress={handlePlayAzan}
                style={[
                  styles.previewButton,
                  { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary },
                ]}
              >
                <Feather name={azanPlaying ? "stop-circle" : "play-circle"} size={20} color="#FFFFFF" />
                <ThemedText type="body" style={{ color: "#FFFFFF", marginLeft: Spacing.sm }}>
                  {azanPlaying ? "Stop Preview" : "Preview Azan"}
                </ThemedText>
              </Pressable>
            ) : null}

            {Platform.OS === "web" ? (
              <View style={styles.webNotice}>
                <Feather name="info" size={16} color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} />
                <ThemedText type="small" secondary style={{ marginLeft: Spacing.sm, flex: 1 }}>
                  Run in Expo Go for full notification support
                </ThemedText>
              </View>
            ) : null}
          </View>
        ) : null}
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
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing["2xl"],
  },
  nextPrayerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
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
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  prayerCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  prayerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  prayerCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  settingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing["2xl"],
  },
  settingsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsContainer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: Spacing.lg,
  },
  settingText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  settingDivider: {
    height: 1,
    backgroundColor: "rgba(128, 128, 128, 0.2)",
    marginVertical: Spacing.md,
  },
  prayerNotifications: {
    marginLeft: Spacing["3xl"],
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  prayerNotificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  webNotice: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(128, 128, 128, 0.1)",
  },
  methodPicker: {
    marginLeft: Spacing["3xl"],
    marginTop: Spacing.sm,
    maxHeight: 200,
  },
  methodList: {
    maxHeight: 200,
  },
  methodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
});
