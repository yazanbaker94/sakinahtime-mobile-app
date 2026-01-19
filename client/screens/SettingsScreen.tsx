import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform, Linking } from "react-native";
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

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { settings: notificationSettings } = useNotifications();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance Section */}
        <View style={styles.section}>
          <View style={[styles.card, {
            backgroundColor: isDark ? `${theme.primary}33` : theme.cardBackground,
            elevation: isDark ? 0 : 3,
            shadowOpacity: isDark ? 0 : 0.08,
          }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}26` }]}>
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
                    Prayer & Fasting
                  </ThemedText>
                  <ThemedText type="caption" secondary>
                    Notifications, azan, and reminders
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
                    Word by Word
                  </ThemedText>
                  <ThemedText type="caption" secondary>
                    Translation language
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
                    Dhikr Reminders
                  </ThemedText>
                  <ThemedText type="caption" secondary>
                    Floating overlay reminders
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
    shadowRadius: 8,
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
