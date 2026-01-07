import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Switch, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useNotifications } from "@/hooks/useNotifications";
import { useAzan } from "@/hooks/useAzan";
import { useIqamaSettings, IqamaSettings, IQAMA_DELAY_OPTIONS } from "@/hooks/useIqamaSettings";
import { useCalculationMethod, CALCULATION_METHODS } from "@/hooks/usePrayerTimes";
import { usePrayerAdjustments, PrayerAdjustments } from "@/hooks/usePrayerAdjustments";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const PRAYERS = [
  { key: "Fajr", nameEn: "Fajr", nameAr: "الفجر" },
  { key: "Dhuhr", nameEn: "Dhuhr", nameAr: "الظهر" },
  { key: "Asr", nameEn: "Asr", nameAr: "العصر" },
  { key: "Maghrib", nameEn: "Maghrib", nameAr: "المغرب" },
  { key: "Isha", nameEn: "Isha", nameAr: "العشاء" },
] as const;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function NotificationSettingsScreen() {
  const { isDark, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  
  const { method: calculationMethod, setMethod: setCalculationMethod } = useCalculationMethod();
  const { adjustments: prayerAdjustments, setAdjustment } = usePrayerAdjustments();
  const {
    settings: notificationSettings,
    toggleNotifications,
    togglePrayerNotification,
  } = useNotifications();
  const { settings: azanSettings, toggleAzan } = useAzan();
  const {
    settings: iqamaSettings,
    toggleIqama,
    setDelayMinutes: setIqamaDelay,
    togglePrayerIqama,
  } = useIqamaSettings();

  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [showIqamaDelayPicker, setShowIqamaDelayPicker] = useState(false);
  const [showIqamaPrayers, setShowIqamaPrayers] = useState(false);

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

  const handleAdjustPrayerTime = async (prayer: keyof PrayerAdjustments, minutes: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await setAdjustment(prayer, minutes);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3" style={{ fontWeight: '700' }}>
          Notification Settings
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Prayer Notifications */}
        <View style={[styles.card, { 
          backgroundColor: isDark ? theme.cardBackground : theme.cardBackground,
          borderColor: isDark ? theme.border : 'transparent',
          borderWidth: isDark ? 1 : 0,
          elevation: isDark ? 0 : 3,
          shadowOpacity: isDark ? 0 : 0.08,
        }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}15` }]}>
                <Feather name="bell" size={20} color={theme.primary} />
              </View>
              <View style={styles.settingText}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>Prayer Notifications</ThemedText>
                <ThemedText type="small" secondary>
                  Get notified when it's time to pray
                </ThemedText>
              </View>
            </View>
            <Switch
              value={notificationSettings.enabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Individual Prayer Toggles */}
          {notificationSettings.enabled && (
            <View style={styles.prayerNotifications}>
              {PRAYERS.map((prayer) => (
                <View key={prayer.key} style={styles.prayerNotificationRow}>
                  <ThemedText type="body">{prayer.nameEn} - {prayer.nameAr}</ThemedText>
                  <Switch
                    value={notificationSettings.prayers[prayer.key as keyof typeof notificationSettings.prayers]}
                    onValueChange={(value) => togglePrayerNotification(prayer.key as keyof typeof notificationSettings.prayers, value)}
                    trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Time Adjustments */}
        <View style={[styles.card, { 
          backgroundColor: isDark ? theme.cardBackground : theme.cardBackground,
          borderColor: isDark ? theme.border : 'transparent',
          borderWidth: isDark ? 1 : 0,
          elevation: isDark ? 0 : 3,
          shadowOpacity: isDark ? 0 : 0.08,
        }]}>
          <Pressable onPress={() => setShowAdjustments(!showAdjustments)} style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconCircle, { backgroundColor: `${theme.gold}15` }]}>
                <Feather name="clock" size={20} color={theme.gold} />
              </View>
              <View style={styles.settingText}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>Time Adjustments</ThemedText>
                <ThemedText type="small" secondary>
                  Fine-tune prayer times (±30 min)
                </ThemedText>
              </View>
            </View>
            <Feather name={showAdjustments ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
          </Pressable>

          {showAdjustments && (
            <View style={styles.adjustmentsPicker}>
              {PRAYERS.map((prayer) => {
                const adjustment = prayerAdjustments[prayer.key as keyof PrayerAdjustments];
                return (
                  <View key={prayer.key} style={styles.adjustmentRow}>
                    <ThemedText type="body" style={{ flex: 1 }}>{prayer.nameEn}</ThemedText>
                    <View style={styles.adjustmentControls}>
                      <Pressable
                        onPress={() => handleAdjustPrayerTime(prayer.key as keyof PrayerAdjustments, adjustment - 1)}
                        style={[styles.adjustmentButton, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.1)' }]}
                      >
                        <Feather name="minus" size={16} color={isDark ? '#EF4444' : '#DC2626'} />
                      </Pressable>
                      <View style={[styles.adjustmentValue, { backgroundColor: theme.backgroundSecondary }]}>
                        <ThemedText type="body" style={{ fontWeight: '700', minWidth: 50, textAlign: 'center' }}>
                          {adjustment > 0 ? '+' : ''}{adjustment} min
                        </ThemedText>
                      </View>
                      <Pressable
                        onPress={() => handleAdjustPrayerTime(prayer.key as keyof PrayerAdjustments, adjustment + 1)}
                        style={[styles.adjustmentButton, { backgroundColor: `${theme.primary}15` }]}
                      >
                        <Feather name="plus" size={16} color={theme.primary} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Azan Sound */}
        <View style={[styles.card, { 
          backgroundColor: isDark ? theme.cardBackground : theme.cardBackground,
          borderColor: isDark ? theme.border : 'transparent',
          borderWidth: isDark ? 1 : 0,
          elevation: isDark ? 0 : 3,
          shadowOpacity: isDark ? 0 : 0.08,
        }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}15` }]}>
                <Feather name="volume-2" size={20} color={theme.primary} />
              </View>
              <View style={styles.settingText}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>Azan Sound</ThemedText>
                <ThemedText type="small" secondary>
                  Play azan when prayer time arrives
                </ThemedText>
              </View>
            </View>
            <Switch
              value={azanSettings.enabled}
              onValueChange={handleToggleAzan}
              trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Iqama Reminder */}
        <View style={[styles.card, { 
          backgroundColor: isDark ? theme.cardBackground : theme.cardBackground,
          borderColor: isDark ? theme.border : 'transparent',
          borderWidth: isDark ? 1 : 0,
          elevation: isDark ? 0 : 3,
          shadowOpacity: isDark ? 0 : 0.08,
        }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconCircle, { backgroundColor: `${theme.gold}15` }]}>
                <Feather name="bell" size={20} color={theme.gold} />
              </View>
              <View style={styles.settingText}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>Iqama Reminder</ThemedText>
                <ThemedText type="small" secondary>
                  Play "Haya Al Salat" before prayer
                </ThemedText>
              </View>
            </View>
            <Switch
              value={iqamaSettings.enabled}
              onValueChange={handleToggleIqama}
              trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {iqamaSettings.enabled && (
            <>
              {/* Iqama Delay */}
              <Pressable onPress={() => setShowIqamaDelayPicker(!showIqamaDelayPicker)} style={[styles.settingRow, { marginTop: Spacing.md }]}>
                <View style={styles.settingInfo}>
                  <View style={{ width: 44 }} />
                  <View style={styles.settingText}>
                    <ThemedText type="body">Reminder Delay</ThemedText>
                    <ThemedText type="small" secondary>
                      {iqamaSettings.delayMinutes} minutes after Azan
                    </ThemedText>
                  </View>
                </View>
                <Feather name={showIqamaDelayPicker ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
              </Pressable>

              {showIqamaDelayPicker && (
                <View style={styles.delayPicker}>
                  {IQAMA_DELAY_OPTIONS.map((delay) => (
                    <Pressable
                      key={delay}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setIqamaDelay(delay);
                        setShowIqamaDelayPicker(false);
                      }}
                      style={[styles.delayItem, iqamaSettings.delayMinutes === delay && { backgroundColor: `${theme.primary}15` }]}
                    >
                      <ThemedText type="body">{delay} minutes</ThemedText>
                      {iqamaSettings.delayMinutes === delay && <Feather name="check" size={20} color={theme.primary} />}
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Per-Prayer Iqama */}
              <Pressable onPress={() => setShowIqamaPrayers(!showIqamaPrayers)} style={[styles.settingRow, { marginTop: Spacing.md }]}>
                <View style={styles.settingInfo}>
                  <View style={{ width: 44 }} />
                  <View style={styles.settingText}>
                    <ThemedText type="body">Prayer Selection</ThemedText>
                    <ThemedText type="small" secondary>
                      Choose which prayers get iqama
                    </ThemedText>
                  </View>
                </View>
                <Feather name={showIqamaPrayers ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
              </Pressable>

              {showIqamaPrayers && (
                <View style={styles.iqamaPrayerToggles}>
                  {PRAYERS.map((prayer) => (
                    <View key={`iqama-${prayer.key}`} style={styles.prayerNotificationRow}>
                      <ThemedText type="body">{prayer.nameEn} - {prayer.nameAr}</ThemedText>
                      <Switch
                        value={iqamaSettings.prayers[prayer.key as keyof IqamaSettings["prayers"]]}
                        onValueChange={(value) => togglePrayerIqama(prayer.key as keyof IqamaSettings["prayers"], value)}
                        trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* Calculation Method */}
        <View style={[styles.card, { 
          backgroundColor: isDark ? theme.cardBackground : theme.cardBackground,
          borderColor: isDark ? theme.border : 'transparent',
          borderWidth: isDark ? 1 : 0,
          elevation: isDark ? 0 : 3,
          shadowOpacity: isDark ? 0 : 0.08,
        }]}>
          <Pressable onPress={() => setShowMethodPicker(!showMethodPicker)} style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.1)' }]}>
                <Feather name="book" size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
              </View>
              <View style={styles.settingText}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>Calculation Method</ThemedText>
                <ThemedText type="small" secondary>
                  {CALCULATION_METHODS.find(m => m.id === calculationMethod)?.name || "ISNA"}
                </ThemedText>
              </View>
            </View>
            <Feather name={showMethodPicker ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
          </Pressable>

          {showMethodPicker && (
            <View style={styles.methodPicker}>
              {CALCULATION_METHODS.map((method) => (
                <Pressable
                  key={method.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCalculationMethod(method.id);
                    setShowMethodPicker(false);
                  }}
                  style={[styles.methodItem, calculationMethod === method.id && { backgroundColor: `${theme.primary}15` }]}
                >
                  <ThemedText type="body">{method.name}</ThemedText>
                  {calculationMethod === method.id && <Feather name="check" size={20} color={theme.primary} />}
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
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
  prayerNotifications: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  prayerNotificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  adjustmentsPicker: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  adjustmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  adjustmentControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  adjustmentButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  adjustmentValue: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  delayPicker: {
    marginTop: Spacing.sm,
    marginLeft: 44 + Spacing.md,
  },
  delayItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  iqamaPrayerToggles: {
    marginTop: Spacing.sm,
    marginLeft: 44 + Spacing.md,
  },
  methodPicker: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  methodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
});
