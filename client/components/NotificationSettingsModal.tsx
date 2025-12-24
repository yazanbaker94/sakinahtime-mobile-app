import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Switch, Modal } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { NotificationSettings } from "@/hooks/useNotifications";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { CALCULATION_METHODS } from "@/hooks/usePrayerTimes";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrayerAdjustments } from "@/hooks/usePrayerAdjustments";

const PRAYERS = [
  { key: "Fajr", nameEn: "Fajr", nameAr: "الفجر" },
  { key: "Dhuhr", nameEn: "Dhuhr", nameAr: "الظهر" },
  { key: "Asr", nameEn: "Asr", nameAr: "العصر" },
  { key: "Maghrib", nameEn: "Maghrib", nameAr: "المغرب" },
  { key: "Isha", nameEn: "Isha", nameAr: "العشاء" },
] as const;

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  notificationSettings: NotificationSettings;
  azanEnabled: boolean;
  calculationMethod: number;
  prayerAdjustments: PrayerAdjustments;
  onToggleNotifications: (enabled: boolean) => void;
  onTogglePrayerNotification: (prayer: keyof NotificationSettings["prayers"], enabled: boolean) => void;
  onToggleAzan: (enabled: boolean) => void;
  onChangeCalculationMethod: (method: number) => void;
  onAdjustPrayerTime: (prayer: keyof PrayerAdjustments, minutes: number) => void;
  onTestNotification: () => void;
}

export function NotificationSettingsModal({
  visible,
  onClose,
  notificationSettings,
  azanEnabled,
  calculationMethod,
  prayerAdjustments,
  onToggleNotifications,
  onTogglePrayerNotification,
  onToggleAzan,
  onChangeCalculationMethod,
  onAdjustPrayerTime,
  onTestNotification,
}: NotificationSettingsModalProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showAdjustments, setShowAdjustments] = useState(false);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent,
          { backgroundColor: isDark ? Colors.dark.backgroundDefault : Colors.light.backgroundDefault }
        ]}>
          {/* Header */}
          <View style={[
            styles.modalHeader,
            { borderBottomColor: isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary }
          ]}>
            <ThemedText type="h3">Notification Settings</ThemedText>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
            </Pressable>
          </View>

          <ScrollView 
            style={styles.modalScroll} 
            contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
            showsVerticalScrollIndicator={false}
          >
            {/* Prayer Notifications */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Feather name="bell" size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                <View style={styles.settingText}>
                  <ThemedText type="body">Prayer Notifications</ThemedText>
                  <ThemedText type="small" secondary>
                    Get notified when it's time to pray
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={notificationSettings.enabled}
                onValueChange={onToggleNotifications}
                trackColor={{
                  false: isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary,
                  true: isDark ? Colors.dark.primary : Colors.light.primary,
                }}
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
                      value={notificationSettings.prayers[prayer.key as keyof NotificationSettings["prayers"]]}
                      onValueChange={(value) =>
                        onTogglePrayerNotification(prayer.key as keyof NotificationSettings["prayers"], value)
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
            )}

            <View style={styles.settingDivider} />

            {/* Prayer Time Adjustments */}
            <Pressable
              onPress={() => setShowAdjustments(!showAdjustments)}
              style={styles.settingRow}
            >
              <View style={styles.settingInfo}>
                <Feather name="clock" size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                <View style={styles.settingText}>
                  <ThemedText type="body">Time Adjustments</ThemedText>
                  <ThemedText type="small" secondary>
                    Fine-tune prayer times (±30 min)
                  </ThemedText>
                </View>
              </View>
              <Feather
                name={showAdjustments ? "chevron-up" : "chevron-down"}
                size={20}
                color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary}
              />
            </Pressable>

            {showAdjustments && (
              <View style={styles.adjustmentsPicker}>
                {PRAYERS.map((prayer) => {
                  const adjustment = prayerAdjustments[prayer.key as keyof PrayerAdjustments];
                  return (
                    <View key={prayer.key} style={styles.adjustmentRow}>
                      <ThemedText type="body" style={{ flex: 1 }}>
                        {prayer.nameEn}
                      </ThemedText>
                      <View style={styles.adjustmentControls}>
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onAdjustPrayerTime(prayer.key as keyof PrayerAdjustments, adjustment - 1);
                          }}
                          style={[styles.adjustmentButton, {
                            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.1)',
                          }]}
                        >
                          <Feather name="minus" size={16} color={isDark ? '#EF4444' : '#DC2626'} />
                        </Pressable>
                        <View style={[styles.adjustmentValue, {
                          backgroundColor: isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary,
                        }]}>
                          <ThemedText type="body" style={{ fontWeight: '700', minWidth: 50, textAlign: 'center' }}>
                            {adjustment > 0 ? '+' : ''}{adjustment} min
                          </ThemedText>
                        </View>
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onAdjustPrayerTime(prayer.key as keyof PrayerAdjustments, adjustment + 1);
                          }}
                          style={[styles.adjustmentButton, {
                            backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                          }]}
                        >
                          <Feather name="plus" size={16} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.settingDivider} />

            {/* Azan Sound */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Feather name="volume-2" size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                <View style={styles.settingText}>
                  <ThemedText type="body">Azan Sound</ThemedText>
                  <ThemedText type="small" secondary>
                    Play azan when prayer time arrives
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={azanEnabled}
                onValueChange={onToggleAzan}
                trackColor={{
                  false: isDark ? Colors.dark.backgroundTertiary : Colors.light.backgroundSecondary,
                  true: isDark ? Colors.dark.primary : Colors.light.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingDivider} />

            {/* Calculation Method */}
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

            {showMethodPicker && (
              <View style={styles.methodPicker}>
                {CALCULATION_METHODS.map((method) => (
                  <Pressable
                    key={method.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onChangeCalculationMethod(method.id);
                      setShowMethodPicker(false);
                    }}
                    style={[
                      styles.methodItem,
                      calculationMethod === method.id && {
                        backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)'
                      }
                    ]}
                  >
                    <ThemedText type="body">{method.name}</ThemedText>
                    {calculationMethod === method.id && (
                      <Feather name="check" size={20} color={isDark ? Colors.dark.primary : Colors.light.primary} />
                    )}
                  </Pressable>
                ))}
              </View>
            )}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalScroll: {
    padding: Spacing.lg,
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
  },
  settingText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  settingDivider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginVertical: Spacing.md,
  },
  prayerNotifications: {
    marginLeft: Spacing.xl + Spacing.md,
    marginTop: Spacing.sm,
  },
  prayerNotificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  methodPicker: {
    marginLeft: Spacing.xl + Spacing.md,
    marginTop: Spacing.sm,
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
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  adjustmentsPicker: {
    marginLeft: Spacing.xl + Spacing.md,
    marginTop: Spacing.sm,
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
});
