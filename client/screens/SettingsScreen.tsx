import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Switch, Platform, Linking } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useThemeContext } from "@/contexts/ThemeContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { NotificationSettingsModal } from "@/components/NotificationSettingsModal";
import { useNotifications } from "@/hooks/useNotifications";
import { useAzan } from "@/hooks/useAzan";
import { useCalculationMethod, CALCULATION_METHODS } from "@/hooks/usePrayerTimes";
import { usePrayerAdjustments, PrayerAdjustments } from "@/hooks/usePrayerAdjustments";

export default function SettingsScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { themeMode, setThemeMode } = useThemeContext();
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const { method: calculationMethod, setMethod: setCalculationMethod } = useCalculationMethod();
  const { adjustments: prayerAdjustments, setAdjustment } = usePrayerAdjustments();
  const {
    settings: notificationSettings,
    toggleNotifications,
    togglePrayerNotification,
    sendTestNotification,
    schedulePrayerNotifications,
  } = useNotifications();
  const {
    settings: azanSettings,
    toggleAzan,
  } = useAzan();

  const handleThemeChange = async (mode: "light" | "dark" | "system") => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await setThemeMode(mode);
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await toggleNotifications(value);
  };

  const handleToggleAzan = async (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await toggleAzan(value);
  };

  const handleAdjustPrayerTime = async (prayer: keyof PrayerAdjustments, minutes: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await setAdjustment(prayer, minutes);
    // Reschedule notifications with new adjustments
    // This will be handled automatically by the useEffect in PrayerTimesScreen
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance Section */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: isDark ? 'rgba(26, 95, 79, 0.2)' : Colors.light.backgroundDefault }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)' }]}>
                  <Feather name={isDark ? "moon" : "sun"} size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                </View>
                <View style={styles.settingText}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    Theme
                  </ThemedText>
                  <ThemedText type="caption" secondary>
                    {themeMode === "system" ? "System Default" : themeMode === "dark" ? "Dark Mode" : "Light Mode"}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.themeOptions}>
              <Pressable
                onPress={() => handleThemeChange("light")}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: themeMode === "light"
                      ? (isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.15)')
                      : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'),
                    borderWidth: themeMode === "light" ? 2 : 1,
                    borderColor: themeMode === "light"
                      ? (isDark ? Colors.dark.primary : Colors.light.primary)
                      : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                  },
                ]}
              >
                <Feather 
                  name="sun" 
                  size={24} 
                  color={themeMode === "light" ? (isDark ? Colors.dark.primary : Colors.light.primary) : theme.textSecondary} 
                />
                <ThemedText 
                  type="small" 
                  style={{ 
                    marginTop: Spacing.xs,
                    color: themeMode === "light" ? (isDark ? Colors.dark.primary : Colors.light.primary) : theme.textSecondary,
                    fontWeight: themeMode === "light" ? '700' : '500',
                  }}
                >
                  Light
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => handleThemeChange("dark")}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: themeMode === "dark"
                      ? (isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.15)')
                      : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'),
                    borderWidth: themeMode === "dark" ? 2 : 1,
                    borderColor: themeMode === "dark"
                      ? (isDark ? Colors.dark.primary : Colors.light.primary)
                      : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                  },
                ]}
              >
                <Feather 
                  name="moon" 
                  size={24} 
                  color={themeMode === "dark" ? (isDark ? Colors.dark.primary : Colors.light.primary) : theme.textSecondary} 
                />
                <ThemedText 
                  type="small" 
                  style={{ 
                    marginTop: Spacing.xs,
                    color: themeMode === "dark" ? (isDark ? Colors.dark.primary : Colors.light.primary) : theme.textSecondary,
                    fontWeight: themeMode === "dark" ? '700' : '500',
                  }}
                >
                  Dark
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => handleThemeChange("system")}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: themeMode === "system"
                      ? (isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.15)')
                      : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'),
                    borderWidth: themeMode === "system" ? 2 : 1,
                    borderColor: themeMode === "system"
                      ? (isDark ? Colors.dark.primary : Colors.light.primary)
                      : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                  },
                ]}
              >
                <Feather 
                  name="smartphone" 
                  size={24} 
                  color={themeMode === "system" ? (isDark ? Colors.dark.primary : Colors.light.primary) : theme.textSecondary} 
                />
                <ThemedText 
                  type="small" 
                  style={{ 
                    marginTop: Spacing.xs,
                    color: themeMode === "system" ? (isDark ? Colors.dark.primary : Colors.light.primary) : theme.textSecondary,
                    fontWeight: themeMode === "system" ? '700' : '500',
                  }}
                >
                  System
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: isDark ? 'rgba(26, 95, 79, 0.2)' : Colors.light.backgroundDefault }]}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setShowNotificationModal(true);
              }}
              style={({ pressed }) => [
                styles.settingRow,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)' }]}>
                  <Feather name="bell" size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                </View>
                <View style={styles.settingText}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    Prayer Notifications
                  </ThemedText>
                  <ThemedText type="caption" secondary>
                    {notificationSettings.enabled ? "Enabled" : "Disabled"}
                  </ThemedText>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: isDark ? 'rgba(26, 95, 79, 0.2)' : Colors.light.backgroundDefault }]}>
            <Pressable
              onPress={async () => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                try {
                  await Linking.openURL('https://forms.gle/9hrLyzCsEQXUTMYEA');
                } catch (error) {
                  // Failed to open URL
                }
              }}
              style={({ pressed }) => [
                styles.settingRow,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(217, 119, 6, 0.1)' }]}>
                  <Feather name="message-circle" size={20} color={isDark ? Colors.dark.gold : Colors.light.gold} />
                </View>
                <View style={styles.settingText}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    Feedback & Suggestions
                  </ThemedText>
                  <ThemedText type="caption" secondary>
                    Help us improve the app
                  </ThemedText>
                </View>
              </View>
              <Feather name="external-link" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <NotificationSettingsModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        notificationSettings={notificationSettings}
        azanEnabled={azanSettings.enabled}
        calculationMethod={calculationMethod}
        prayerAdjustments={prayerAdjustments}
        onToggleNotifications={handleToggleNotifications}
        onTogglePrayerNotification={togglePrayerNotification}
        onToggleAzan={handleToggleAzan}
        onChangeCalculationMethod={setCalculationMethod}
        onAdjustPrayerTime={handleAdjustPrayerTime}
        onTestNotification={() => sendTestNotification(azanSettings.enabled)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingText: {
    flex: 1,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
});
