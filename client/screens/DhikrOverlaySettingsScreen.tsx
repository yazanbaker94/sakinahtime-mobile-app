import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/hooks/useTheme';
import { useDhikrOverlaySettings } from '@/hooks/useDhikrOverlaySettings';
import { DhikrOverlayService } from '@/services/DhikrOverlayService';
import { DHIKR_CATEGORIES, getRandomDhikr } from '@/data/dhikrContent';
import { BorderRadius, Spacing, Shadows } from '@/constants/theme';

const INTERVAL_OPTIONS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
] as const;

const QUIET_HOUR_OPTIONS = [
  { value: 21, label: '9 PM' },
  { value: 22, label: '10 PM' },
  { value: 23, label: '11 PM' },
  { value: 0, label: '12 AM' },
];

const WAKE_HOUR_OPTIONS = [
  { value: 5, label: '5 AM' },
  { value: 6, label: '6 AM' },
  { value: 7, label: '7 AM' },
  { value: 8, label: '8 AM' },
];

const AUTO_DISMISS_OPTIONS = [
  { value: 5, label: '5s' },
  { value: 10, label: '10s' },
  { value: 15, label: '15s' },
  { value: 20, label: '20s' },
  { value: 30, label: '30s' },
];

export default function DhikrOverlaySettingsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const {
    settings,
    isLoading,
    updateEnabled,
    updateInterval,
    updateCategory,
    updateQuietHours,
    updateAutoDismiss,
    getEnabledCategories,
  } = useDhikrOverlaySettings();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const [isStartingService, setIsStartingService] = useState(false);

  const supportsOverlay = DhikrOverlayService.supportsFloatingOverlay();

  useEffect(() => {
    checkPermission();
  }, []);

  // Re-check permission when screen comes into focus (user returns from settings)
  useFocusEffect(
    useCallback(() => {
      checkPermission();
    }, [])
  );

  // Update service with new theme colors when theme changes
  useEffect(() => {
    const updateServiceTheme = async () => {
      if (settings.enabled) {
        // Restart service with new theme colors
        await DhikrOverlayService.startService({
          intervalMinutes: settings.intervalMinutes,
          autoDismissSeconds: settings.autoDismissSeconds,
          quietHours: settings.quietHours,
          skipDuringPrayer: settings.skipDuringPrayer,
          enabledCategories: getEnabledCategories(),
          themeColors: theme,
        });
      }
    };
    
    // Only update if service is enabled and we're not in initial load
    if (!isLoading && settings.enabled) {
      updateServiceTheme();
    }
  }, [theme.primary, theme.cardBackground, theme.text, theme.textSecondary]);

  const checkPermission = async () => {
    setIsCheckingPermission(true);
    const granted = await DhikrOverlayService.checkPermission();
    setHasPermission(granted);
    setIsCheckingPermission(false);
  };

  const handleRequestPermission = async () => {
    const granted = await DhikrOverlayService.requestPermission();
    if (Platform.OS === 'android') {
      Alert.alert(
        'Permission Required',
        'Please enable "Display over other apps" permission for SakinahTime, then return to this screen.',
        [{ 
          text: 'OK', 
          onPress: async () => {
            // Check permission after a delay and auto-enable if granted
            setTimeout(async () => {
              const nowGranted = await DhikrOverlayService.checkPermission();
              setHasPermission(nowGranted);
              // Auto-enable the toggle if permission was granted
              if (nowGranted && !settings.enabled) {
                handleToggleEnabled(true);
              }
            }, 1000);
          }
        }]
      );
    } else {
      setHasPermission(granted);
      // Auto-enable on iOS if permission granted
      if (granted && !settings.enabled) {
        handleToggleEnabled(true);
      }
    }
  };

  const handleToggleEnabled = async (enabled: boolean) => {
    if (enabled && !hasPermission) {
      handleRequestPermission();
      return;
    }

    setIsStartingService(true);
    await updateEnabled(enabled);

    if (enabled) {
      const success = await DhikrOverlayService.startService({
        intervalMinutes: settings.intervalMinutes,
        autoDismissSeconds: settings.autoDismissSeconds,
        quietHours: settings.quietHours,
        skipDuringPrayer: settings.skipDuringPrayer,
        enabledCategories: getEnabledCategories(),
        themeColors: theme,
      });

      if (!success) {
        await updateEnabled(false);
        Alert.alert('Error', 'Failed to start dhikr reminder service');
      }
    } else {
      await DhikrOverlayService.stopService();
    }

    setIsStartingService(false);
  };

  const handlePreview = async () => {
    console.log('[DhikrOverlay] Preview button pressed');
    
    const enabledCategories = getEnabledCategories();
    console.log('[DhikrOverlay] Enabled categories:', enabledCategories);
    
    if (enabledCategories.length === 0) {
      Alert.alert('No Categories', 'Please enable at least one dhikr category');
      return;
    }

    const dhikr = getRandomDhikr(enabledCategories);
    console.log('[DhikrOverlay] Random dhikr:', dhikr);
    
    if (dhikr) {
      try {
        console.log('[DhikrOverlay] Calling showNow with current theme...');
        // Pass current theme colors for preview
        await DhikrOverlayService.showNow(dhikr, theme);
        console.log('[DhikrOverlay] showNow completed');
      } catch (error) {
        console.error('[DhikrOverlay] Preview failed:', error);
        Alert.alert('Preview Failed', 'Could not show overlay preview. Please try again.');
      }
    } else {
      Alert.alert('No Dhikr', 'Could not find dhikr content for selected categories');
    }
  };

  const handleIntervalChange = async (value: number) => {
    await updateInterval(value as 30 | 60 | 120 | 180 | 240);
    if (settings.enabled) {
      await DhikrOverlayService.startService({
        intervalMinutes: value,
        autoDismissSeconds: settings.autoDismissSeconds,
        quietHours: settings.quietHours,
        skipDuringPrayer: settings.skipDuringPrayer,
        enabledCategories: getEnabledCategories(),
        themeColors: theme,
      });
    }
  };

  const handleCategoryChange = (categoryId: string, value: boolean) => {
    updateCategory(categoryId as any, value);
  };

  const handleQuietHoursToggle = (enabled: boolean) => {
    updateQuietHours({ ...settings.quietHours, enabled });
  };

  const handleQuietStartChange = (hour: number) => {
    updateQuietHours({ ...settings.quietHours, startHour: hour });
  };

  const handleQuietEndChange = (hour: number) => {
    updateQuietHours({ ...settings.quietHours, endHour: hour });
  };

  const handleAutoDismissChange = (seconds: number) => {
    updateAutoDismiss(seconds);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Dhikr Reminders</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Platform Notice */}
        {!supportsOverlay && (
          <View style={[styles.noticeCard, { backgroundColor: theme.backgroundSecondary }]}>
            <Ionicons name="information-circle" size={20} color={theme.primary} />
            <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
              Floating overlay is only available on Android. On iOS, you'll receive standard notifications instead.
            </Text>
          </View>
        )}

        {/* Main Toggle */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }, Shadows.card]}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: theme.text }]}>
                {supportsOverlay ? 'Floating Reminders' : 'Dhikr Notifications'}
              </Text>
              <Text style={[styles.toggleSubtitle, { color: theme.textSecondary }]}>
                {supportsOverlay
                  ? 'Show dhikr overlay on top of other apps'
                  : 'Receive periodic dhikr notifications'}
              </Text>
            </View>
            {isStartingService ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Switch
                value={settings.enabled}
                onValueChange={handleToggleEnabled}
                trackColor={{ false: theme.border, true: `${theme.primary}80` }}
                thumbColor={settings.enabled ? theme.primary : theme.muted}
              />
            )}
          </View>

          {supportsOverlay && !hasPermission && !isCheckingPermission && (
            <TouchableOpacity
              style={[styles.permissionButton, { backgroundColor: `${theme.primary}15` }]}
              onPress={handleRequestPermission}
            >
              <Ionicons name="shield-checkmark" size={18} color={theme.primary} />
              <Text style={[styles.permissionText, { color: theme.primary }]}>
                Grant overlay permission
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Preview Button */}
        {hasPermission && (
          <TouchableOpacity
            style={[styles.previewButton, { backgroundColor: theme.primary }]}
            onPress={handlePreview}
          >
            <Ionicons name="eye" size={20} color="#FFFFFF" />
            <Text style={styles.previewButtonText}>Preview Overlay</Text>
          </TouchableOpacity>
        )}

        {/* Interval Selection */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }, Shadows.card]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Reminder Interval</Text>
          <View style={styles.optionsRow}>
            {INTERVAL_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      settings.intervalMinutes === option.value
                        ? theme.primary
                        : theme.backgroundSecondary,
                  },
                ]}
                onPress={() => handleIntervalChange(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: settings.intervalMinutes === option.value ? '#FFFFFF' : theme.text,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Categories */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }, Shadows.card]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Dhikr Categories</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Choose which types of dhikr to include
          </Text>
          {DHIKR_CATEGORIES.map((category) => (
            <View key={category.id} style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: theme.text }]}>{category.name}</Text>
                <Text style={[styles.categoryNameAr, { color: theme.textSecondary }]}>
                  {category.nameAr}
                </Text>
              </View>
              <Switch
                value={settings.categories[category.id]}
                onValueChange={(value) => handleCategoryChange(category.id, value)}
                trackColor={{ false: theme.border, true: `${theme.primary}80` }}
                thumbColor={settings.categories[category.id] ? theme.primary : theme.muted}
              />
            </View>
          ))}
        </View>

        {/* Quiet Hours */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }, Shadows.card]}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: theme.text }]}>Quiet Hours</Text>
              <Text style={[styles.toggleSubtitle, { color: theme.textSecondary }]}>
                Pause reminders during sleep time
              </Text>
            </View>
            <Switch
              value={settings.quietHours.enabled}
              onValueChange={handleQuietHoursToggle}
              trackColor={{ false: theme.border, true: `${theme.primary}80` }}
              thumbColor={settings.quietHours.enabled ? theme.primary : theme.muted}
            />
          </View>

          {settings.quietHours.enabled && (
            <View style={styles.quietHoursConfig}>
              <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>Start at</Text>
              <View style={styles.optionsRow}>
                {QUIET_HOUR_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor:
                          settings.quietHours.startHour === option.value
                            ? theme.primary
                            : theme.backgroundSecondary,
                      },
                    ]}
                    onPress={() => handleQuietStartChange(option.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color:
                            settings.quietHours.startHour === option.value ? '#FFFFFF' : theme.text,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.timeLabel, { color: theme.textSecondary, marginTop: Spacing.md }]}>
                End at
              </Text>
              <View style={styles.optionsRow}>
                {WAKE_HOUR_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor:
                          settings.quietHours.endHour === option.value
                            ? theme.primary
                            : theme.backgroundSecondary,
                      },
                    ]}
                    onPress={() => handleQuietEndChange(option.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color:
                            settings.quietHours.endHour === option.value ? '#FFFFFF' : theme.text,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Auto Dismiss */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }, Shadows.card]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Auto Dismiss</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Overlay disappears after this time
          </Text>
          <View style={styles.optionsRow}>
            {AUTO_DISMISS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      settings.autoDismissSeconds === option.value
                        ? theme.primary
                        : theme.backgroundSecondary,
                  },
                ]}
                onPress={() => handleAutoDismissChange(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        settings.autoDismissSeconds === option.value ? '#FFFFFF' : theme.text,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 13,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  permissionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  optionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '500',
  },
  categoryNameAr: {
    fontSize: 13,
  },
  quietHoursConfig: {
    marginTop: Spacing.md,
  },
  timeLabel: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  bottomPadding: {
    height: 40,
  },
});
