import React from "react";

import { View, StyleSheet, ScrollView, Pressable, Platform, Linking, Alert, Image } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemePicker } from "@/components/ThemePicker";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslation } from "@/hooks/useTranslation";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import * as Updates from "expo-updates";

const ICON_THEMES = require('../../assets/images/3d-images/Themes.png');

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t, locale } = useTranslation();
  const { settings: notificationSettings } = useNotifications();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: tabBarHeight + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance Section */}
        <View style={styles.section}>
          <View style={[styles.card, {
            backgroundColor: isDark ? `${theme.primary}33` : '#FFFFFF',
            borderWidth: 0,
            borderColor: 'transparent',
            elevation: isDark ? 0 : 2,
            shadowOpacity: isDark ? 0 : 0.05,
            shadowRadius: 12,
          }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Image source={ICON_THEMES} style={{ width: 44, height: 44, marginRight: Spacing.md }} resizeMode="contain" />
                <View style={styles.settingText}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    {t('settings.appearance')}
                  </ThemedText>
                  <ThemedText type="caption" secondary>
                    {t('settings.customizeTheme')}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
          {/* ThemePicker sits outside the card, directly on the screen background */}
          <ThemePicker />
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <View style={[styles.card, {
            backgroundColor: isDark ? `${theme.primary}33` : theme.cardBackground,
            elevation: isDark ? 0 : 3,
            shadowOpacity: isDark ? 0 : 0.08,
          }]}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                navigation.navigate('LanguageSelector');
              }}
              style={({ pressed }) => [
                styles.settingRow,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}26` }]}>
                  <Feather name="globe" size={20} color={theme.primary} />
                </View>
                <View style={styles.settingText}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    {t('settings.language')}
                  </ThemedText>
                  <ThemedText type="caption" secondary>
                    {(() => {
                      const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === locale);
                      return currentLang ? `${currentLang.flag} ${currentLang.nativeName}` : t('settings.chooseLanguage');
                    })()}
                  </ThemedText>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={[styles.card, {
            backgroundColor: isDark ? `${theme.primary}33` : theme.cardBackground,
            elevation: isDark ? 0 : 3,
            shadowOpacity: isDark ? 0 : 0.08,
          }]}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                navigation.navigate('NotificationSettings');
              }}
              style={({ pressed }) => [
                styles.settingRow,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}26` }]}>
                  <Feather name="bell" size={20} color={theme.primary} />
                </View>
                <View style={styles.settingText}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    {t('settings.prayerFasting')}
                  </ThemedText>
                  <ThemedText type="caption" secondary>
                    {t('settings.notificationsAzanReminders')}
                  </ThemedText>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Storage & Downloads Section */}
        <View style={styles.section}>
          <View style={[styles.card, {
            backgroundColor: isDark ? `${theme.primary}33` : theme.cardBackground,
            elevation: isDark ? 0 : 3,
            shadowOpacity: isDark ? 0 : 0.08,
          }]}>
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
                    {t('settings.storageDownloads')}
                  </ThemedText>
                  <ThemedText type="caption" secondary>
                    {t('settings.manageOfflineContent')}
                  </ThemedText>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Word by Word Settings Section */}
        <View style={styles.section}>
          <View style={[styles.card, {
            backgroundColor: isDark ? `${theme.primary}33` : theme.cardBackground,
            elevation: isDark ? 0 : 3,
            shadowOpacity: isDark ? 0 : 0.08,
          }]}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                navigation.navigate('WordByWordSettings');
              }}
              style={({ pressed }) => [
                styles.settingRow,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}26` }]}>
                  <Feather name="book-open" size={20} color={theme.primary} />
                </View>
                <View style={styles.settingText}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    {t('settings.wordByWord')}
                  </ThemedText>
                  <ThemedText type="caption" secondary>
                    {t('settings.translationLanguage')}
                  </ThemedText>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Dhikr Reminders Section */}
        <View style={styles.section}>
          <View style={[styles.card, {
            backgroundColor: isDark ? `${theme.primary}33` : theme.cardBackground,
            elevation: isDark ? 0 : 3,
            shadowOpacity: isDark ? 0 : 0.08,
          }]}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                navigation.navigate('DhikrOverlaySettings');
              }}
              style={({ pressed }) => [
                styles.settingRow,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: `${theme.gold}26` }]}>
                  <Feather name="sun" size={20} color={theme.gold} />
                </View>
                <View style={styles.settingText}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    {t('settings.dhikrReminders')}
                  </ThemedText>
                  <ThemedText type="caption" secondary>
                    {t('settings.floatingOverlay')}
                  </ThemedText>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <View style={[styles.card, {
            backgroundColor: isDark ? `${theme.primary}33` : theme.cardBackground,
            elevation: isDark ? 0 : 3,
            shadowOpacity: isDark ? 0 : 0.08,
          }]}>
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
                <View style={[styles.iconCircle, { backgroundColor: `${theme.gold}26` }]}>
                  <Feather name="message-circle" size={20} color={theme.gold} />
                </View>
                <View style={styles.settingText}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    {t('settings.feedbackSuggestions')}
                  </ThemedText>
                  <ThemedText type="caption" secondary>
                    {t('settings.helpImprove')}
                  </ThemedText>
                </View>
              </View>
              <Feather name="external-link" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    // elevation and shadowOpacity set dynamically based on dark mode
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
