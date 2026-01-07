import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Switch, Modal } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { NotificationSettings } from "@/hooks/useNotifications";
import { IqamaSettings, IQAMA_DELAY_OPTIONS } from "@/hooks/useIqamaSettings";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { CALCULATION_METHODS } from "@/hooks/usePrayerTimes";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrayerAdjustments } from "@/hooks/usePrayerAdjustments";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

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
  iqamaSettings: IqamaSettings;
  onToggleNotifications: (enabled: boolean) => void;
  onTogglePrayerNotification: (prayer: keyof NotificationSettings["prayers"], enabled: boolean) => void;
  onToggleAzan: (enabled: boolean) => void;
  onChangeCalculationMethod: (method: number) => void;
  onAdjustPrayerTime: (prayer: keyof PrayerAdjustments, minutes: number) => void;
  onTestNotification: () => void;
  onToggleIqama: (enabled: boolean) => void;
  onChangeIqamaDelay: (minutes: number) => void;
  onTogglePrayerIqama: (prayer: keyof IqamaSettings["prayers"], enabled: boolean) => void;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function NotificationSettingsModal({
  visible,
  onClose,
  notificationSettings,
  azanEnabled,
  calculationMethod,
  prayerAdjustments,
  iqamaSettings,
  onToggleNotifications,
  onTogglePrayerNotification,
  onToggleAzan,
  onChangeCalculationMethod,
  onAdjustPrayerTime,
  onTestNotification,
  onToggleIqama,
  onChangeIqamaDelay,
  onTogglePrayerIqama,
}: NotificationSettingsModalProps) {
  const { isDark, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [showIqamaDelayPicker, setShowIqamaDelayPicker] = useState(false);
  const [showIqamaPrayers, setShowIqamaPrayers] = useState(false);

  const handleFindMosques = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    navigation.navigate('MosqueFinder');
  };

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
          { backgroundColor: theme.backgroundDefault }
        ]}>
          {/* Header */}
          <View style={[
            styles.modalHeader,
            { borderBottomColor: theme.border }
          ]}>
            <ThemedText type="h3">Notification Settings</ThemedText>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={24} color={theme.text} />
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
                <Feather name="bell" size={20} color={theme.primary} />
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
                  false: theme.backgroundSecondary,
                  true: theme.primary,
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
                        false: theme.backgroundSecondary,
                        true: theme.primary,
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
                <Feather name="clock" size={20} color={theme.primary} />
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
                color={theme.textSecondary}
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
                          backgroundColor: theme.backgroundSecondary,
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
                            backgroundColor: `${theme.primary}15`,
                          }]}
                        >
                          <Feather name="plus" size={16} color={theme.primary} />
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
                <Feather name="volume-2" size={20} color={theme.primary} />
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
                  false: theme.backgroundSecondary,
                  true: theme.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingDivider} />

            {/* Iqama Reminder */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Feather name="bell" size={20} color={theme.primary} />
                <View style={styles.settingText}>
                  <ThemedText type="body">Iqama Reminder</ThemedText>
                  <ThemedText type="small" secondary>
                    Play "Haya Al Salat" before prayer
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={iqamaSettings.enabled}
                onValueChange={onToggleIqama}
                trackColor={{
                  false: theme.backgroundSecondary,
                  true: theme.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Iqama Delay Picker */}
            {iqamaSettings.enabled && (
              <>
                <Pressable
                  onPress={() => setShowIqamaDelayPicker(!showIqamaDelayPicker)}
                  style={[styles.settingRow, { marginLeft: Spacing.xl + Spacing.md }]}
                >
                  <View style={styles.settingInfo}>
                    <Feather name="clock" size={18} color={theme.textSecondary} />
                    <View style={styles.settingText}>
                      <ThemedText type="body">Reminder Delay</ThemedText>
                      <ThemedText type="small" secondary>
                        {iqamaSettings.delayMinutes} minutes after Azan
                      </ThemedText>
                    </View>
                  </View>
                  <Feather
                    name={showIqamaDelayPicker ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.textSecondary}
                  />
                </Pressable>

                {showIqamaDelayPicker && (
                  <View style={styles.delayPicker}>
                    {IQAMA_DELAY_OPTIONS.map((delay) => (
                      <Pressable
                        key={delay}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          onChangeIqamaDelay(delay);
                          setShowIqamaDelayPicker(false);
                        }}
                        style={[
                          styles.delayItem,
                          iqamaSettings.delayMinutes === delay && {
                            backgroundColor: `${theme.primary}15`
                          }
                        ]}
                      >
                        <ThemedText type="body">{delay} minutes</ThemedText>
                        {iqamaSettings.delayMinutes === delay && (
                          <Feather name="check" size={20} color={theme.primary} />
                        )}
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Per-Prayer Iqama Toggles */}
                <Pressable
                  onPress={() => setShowIqamaPrayers(!showIqamaPrayers)}
                  style={[styles.settingRow, { marginLeft: Spacing.xl + Spacing.md }]}
                >
                  <View style={styles.settingInfo}>
                    <Feather name="list" size={18} color={theme.textSecondary} />
                    <View style={styles.settingText}>
                      <ThemedText type="body">Prayer Selection</ThemedText>
                      <ThemedText type="small" secondary>
                        Choose which prayers get iqama
                      </ThemedText>
                    </View>
                  </View>
                  <Feather
                    name={showIqamaPrayers ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.textSecondary}
                  />
                </Pressable>

                {showIqamaPrayers && (
                  <View style={styles.iqamaPrayerToggles}>
                    {PRAYERS.map((prayer) => (
                      <View key={`iqama-${prayer.key}`} style={styles.prayerNotificationRow}>
                        <ThemedText type="body">{prayer.nameEn} - {prayer.nameAr}</ThemedText>
                        <Switch
                          value={iqamaSettings.prayers[prayer.key as keyof IqamaSettings["prayers"]]}
                          onValueChange={(value) =>
                            onTogglePrayerIqama(prayer.key as keyof IqamaSettings["prayers"], value)
                          }
                          trackColor={{
                            false: theme.backgroundSecondary,
                            true: theme.primary,
                          }}
                          thumbColor="#FFFFFF"
                        />
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* Find Nearby Mosques Button - Removed, now in Qibla screen */}

            <View style={styles.settingDivider} />

            {/* Calculation Method */}
            <Pressable
              onPress={() => setShowMethodPicker(!showMethodPicker)}
              style={styles.settingRow}
            >
              <View style={styles.settingInfo}>
                <Feather name="book" size={20} color={theme.primary} />
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
                color={theme.textSecondary}
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
                        backgroundColor: `${theme.primary}15`
                      }
                    ]}
                  >
                    <ThemedText type="body">{method.name}</ThemedText>
                    {calculationMethod === method.id && (
                      <Feather name="check" size={20} color={theme.primary} />
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
  delayPicker: {
    marginLeft: Spacing.xl + Spacing.md + Spacing.xl,
    marginTop: Spacing.sm,
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
    marginLeft: Spacing.xl + Spacing.md + Spacing.xl,
    marginTop: Spacing.sm,
  },
  findMosquesButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
