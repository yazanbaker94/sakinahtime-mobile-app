import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useDhikrOverlaySettings } from '@/hooks/useDhikrOverlaySettings';
import { DhikrOverlayService } from '@/services/DhikrOverlayService';
import { DHIKR_CATEGORIES, getRandomDhikr } from '@/data/dhikrContent';
import { BorderRadius, Spacing, Shadows } from '@/constants/theme';

const INTERVAL_OPTIONS = [
  { value: 30, labelKey: 'dhikrReminders.interval30min' },
  { value: 60, labelKey: 'dhikrReminders.interval1hour' },
  { value: 120, labelKey: 'dhikrReminders.interval2hours' },
  { value: 180, labelKey: 'dhikrReminders.interval3hours' },
  { value: 240, labelKey: 'dhikrReminders.interval4hours' },
] as const;

const QUIET_HOUR_OPTIONS = [
  { value: 21, labelKey: 'dhikrReminders.quiet9pm' },
  { value: 22, labelKey: 'dhikrReminders.quiet10pm' },
  { value: 23, labelKey: 'dhikrReminders.quiet11pm' },
  { value: 0, labelKey: 'dhikrReminders.quiet12am' },
];

const WAKE_HOUR_OPTIONS = [
  { value: 5, labelKey: 'dhikrReminders.wake5am' },
  { value: 6, labelKey: 'dhikrReminders.wake6am' },
  { value: 7, labelKey: 'dhikrReminders.wake7am' },
  { value: 8, labelKey: 'dhikrReminders.wake8am' },
];

const AUTO_DISMISS_OPTIONS = [
  { value: 5, labelKey: 'dhikrReminders.autoDismiss5s' },
  { value: 10, labelKey: 'dhikrReminders.autoDismiss10s' },
  { value: 15, labelKey: 'dhikrReminders.autoDismiss15s' },
  { value: 20, labelKey: 'dhikrReminders.autoDismiss20s' },
  { value: 30, labelKey: 'dhikrReminders.autoDismiss30s' },
];

export default function DhikrOverlaySettingsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t, locale } = useTranslation();
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

  const [pendingEnable, setPendingEnable] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    checkPermission();
  }, []);

  // Listen for app coming back to foreground (from system settings)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      // App came back to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[DhikrOverlay] App came to foreground, checking permission...');
        const granted = await DhikrOverlayService.checkPermission();
        console.log('[DhikrOverlay] Permission granted:', granted, 'pendingEnable:', pendingEnable);
        setHasPermission(granted);

        // Auto-enable if permission was just granted and we were waiting for it
        if (granted && pendingEnable) {
          console.log('[DhikrOverlay] Auto-enabling service...');
          setPendingEnable(false);
          // Directly start the service instead of calling handleToggleEnabled
          // This avoids the race condition with hasPermission state
          setTimeout(async () => {
            setIsStartingService(true);
            await updateEnabled(true);
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
              Alert.alert(t('dhikrReminders.error'), t('dhikrReminders.serviceFailed'));
            }
            setIsStartingService(false);
          }, 200);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [pendingEnable, settings, theme, getEnabledCategories, updateEnabled]);

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
    // Set flag so we know to auto-enable when user returns
    setPendingEnable(true);
    // Open the settings
    await DhikrOverlayService.requestPermission();
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
        Alert.alert(t('dhikrReminders.error'), t('dhikrReminders.serviceFailed'));
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
      Alert.alert(t('dhikrReminders.error'), t('dhikrReminders.noCategories'));
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
        Alert.alert(t('dhikrReminders.error'), t('dhikrReminders.previewFailed'));
      }
    } else {
      Alert.alert(t('dhikrReminders.error'), t('dhikrReminders.noDhikr'));
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('dhikrReminders.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Platform Notice */}
        {!supportsOverlay && (
          <View style={[styles.noticeCard, { backgroundColor: theme.backgroundSecondary }]}>
            <Ionicons name="information-circle" size={20} color={theme.primary} />
            <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
              {t('dhikrReminders.iosNotice')}
            </Text>
          </View>
        )}

        {/* Main Toggle */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }, Shadows.card]}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: theme.text }]}>
                {supportsOverlay ? t('dhikrReminders.floatingReminders') : t('dhikrReminders.dhikrNotifications')}
              </Text>
              <Text style={[styles.toggleSubtitle, { color: theme.textSecondary }]}>
                {supportsOverlay
                  ? t('dhikrReminders.showOverlay')
                  : t('dhikrReminders.receiveNotifications')}
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
                {t('dhikrReminders.grantPermission')}
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
            <Text style={styles.previewButtonText}>{t('dhikrReminders.previewOverlay')}</Text>
          </TouchableOpacity>
        )}

        {/* Interval Selection */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }, Shadows.card]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('dhikrReminders.reminderInterval')}</Text>
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
                  {t(option.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Categories */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }, Shadows.card]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('dhikrReminders.dhikrCategories')}</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            {t('dhikrReminders.chooseTypes')}
          </Text>
          {DHIKR_CATEGORIES.map((category) => (
            <View key={category.id} style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: theme.text }]}>{locale === 'ar' ? category.nameAr : category.name}</Text>
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
              <Text style={[styles.toggleTitle, { color: theme.text }]}>{t('dhikrReminders.quietHours')}</Text>
              <Text style={[styles.toggleSubtitle, { color: theme.textSecondary }]}>
                {t('dhikrReminders.pauseSleep')}
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
              <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>{t('dhikrReminders.startAt')}</Text>
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
                      {t(option.labelKey)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.timeLabel, { color: theme.textSecondary, marginTop: Spacing.md }]}>
                {t('dhikrReminders.endAt')}
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
                      {t(option.labelKey)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Auto Dismiss */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }, Shadows.card]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('dhikrReminders.autoDismiss')}</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            {t('dhikrReminders.overlayDisappears')}
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
                  {t(option.labelKey)}
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
