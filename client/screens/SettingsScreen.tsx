import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform, Linking } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { NotificationSettingsModal } from "@/components/NotificationSettingsModal";
import { ThemePicker } from "@/components/ThemePicker";
import { useNotifications } from "@/hooks/useNotifications";
import { useAzan } from "@/hooks/useAzan";
import { useIqamaSettings, IqamaSettings } from "@/hooks/useIqamaSettings";
import { useCalculationMethod } from "@/hooks/usePrayerTimes";
import { usePrayerAdjustments, PrayerAdjustments } from "@/hooks/usePrayerAdjustments";

export default function SettingsScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
  const {
    settings: iqamaSettings,
    toggleIqama,
    setDelayMinutes: setIqamaDelay,
    togglePrayerIqama,
  } = useIqamaSettings();

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

  const handleToggleIqama = async (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await toggleIqama(value);
  };

  const handleChangeIqamaDelay = async (minutes: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await setIqamaDelay(minutes);
  };

  const handleTogglePrayerIqama = async (prayer: keyof IqamaSettings["prayers"], value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await togglePrayerIqama(prayer, value);
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
          <View style={[styles.card, { backgroundColor: isDark ? 'rgba(26, 95, 79, 0.2)' : theme.cardBackground }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : `${theme.primary}15` }]}>
                  <Feather name="droplet" size={20} color={theme.primary} />
                </View>
                <View style={styles.settingText}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    Appearance
                  </ThemedText>
                  <ThemedText type="caption" secondary>
                    Customize your theme
                  </ThemedText>
                </View>
              </View>
            </View>
            <ThemePicker />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: isDark ? 'rgba(26, 95, 79, 0.2)' : theme.cardBackground }]}>
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
                <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : `${theme.primary}15` }]}>
                  <Feather name="bell" size={20} color={theme.primary} />
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

        {/* Storage & Downloads Section */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: isDark ? 'rgba(26, 95, 79, 0.2)' : theme.cardBackground }]}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                navigation.navigate('StorageManagement');
              }}
              style={({ pressed }) => [
                styles.settingRow,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.1)' }]}>
                  <Feather name="download-cloud" size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
                </View>
                <View style={styles.settingText}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    Storage & Downloads
                  </ThemedText>
                  <ThemedText type="caption" secondary>
                    Manage offline content
                  </ThemedText>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: isDark ? 'rgba(26, 95, 79, 0.2)' : theme.cardBackground }]}>
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
                <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(212, 175, 55, 0.15)' : `${theme.gold}15` }]}>
                  <Feather name="message-circle" size={20} color={theme.gold} />
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
        iqamaSettings={iqamaSettings}
        onToggleNotifications={handleToggleNotifications}
        onTogglePrayerNotification={togglePrayerNotification}
        onToggleAzan={handleToggleAzan}
        onChangeCalculationMethod={setCalculationMethod}
        onAdjustPrayerTime={handleAdjustPrayerTime}
        onTestNotification={() => sendTestNotification(azanSettings.enabled)}
        onToggleIqama={handleToggleIqama}
        onChangeIqamaDelay={handleChangeIqamaDelay}
        onTogglePrayerIqama={handleTogglePrayerIqama}
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
});
