/**
 * OnboardingScreen - First-time user onboarding flow
 * Welcomes users and requests necessary permissions
 */

import React, { useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Pressable,
    Platform,
    FlatList,
    NativeSyntheticEvent,
    NativeScrollEvent,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { checkBatteryOptimization, requestBatteryOptimizationExemption, canScheduleExactAlarms, requestExactAlarmPermission } from '@/hooks/useNotifications';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
    id: string;
    icon: keyof typeof Feather.glyphMap;
    title: string;
    subtitle: string;
    description: string;
    action?: 'location' | 'notifications' | 'widget';
    image?: any; // For widget preview image
}

const SLIDES: OnboardingSlide[] = [
    {
        id: 'welcome',
        icon: 'sun',
        title: 'onboarding.welcomeTitle',
        subtitle: 'onboarding.welcomeSubtitle',
        description: 'onboarding.welcomeDescription',
    },
    {
        id: 'location',
        icon: 'map-pin',
        title: 'onboarding.locationTitle',
        subtitle: 'onboarding.locationSubtitle',
        description: 'onboarding.locationDescription',
        action: 'location',
    },
    {
        id: 'notifications',
        icon: 'bell',
        title: 'onboarding.notificationsTitle',
        subtitle: 'onboarding.notificationsSubtitle',
        description: 'onboarding.notificationsDescription',
        action: 'notifications',
    },
    {
        id: 'widget',
        icon: 'layout',
        title: 'onboarding.widgetTitle',
        subtitle: 'onboarding.widgetSubtitle',
        description: 'onboarding.widgetDescription',
        action: 'widget',
        image: require('@/../assets/images/widget-image.png'),
    },
    {
        id: 'done',
        icon: 'check-circle',
        title: 'onboarding.doneTitle',
        subtitle: 'onboarding.doneSubtitle',
        description: 'onboarding.doneDescription',
    },
];

interface OnboardingScreenProps {
    onComplete: () => Promise<void>;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [locationGranted, setLocationGranted] = useState(false);
    const [notificationsGranted, setNotificationsGranted] = useState(false);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        if (index !== currentIndex) {
            setCurrentIndex(index);
        }
    };

    const goToNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        }
    };

    const finishOnboarding = async () => {
        await onComplete();
        // Reset navigation stack to Main so user can't go back to onboarding
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'Main' }],
            })
        );
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        finishOnboarding();
    };

    const handleGetStarted = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        finishOnboarding();
    };

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationGranted(status === 'granted');
            Haptics.notificationAsync(
                status === 'granted'
                    ? Haptics.NotificationFeedbackType.Success
                    : Haptics.NotificationFeedbackType.Warning
            );
            goToNext();
        } catch (error) {
            console.warn('[Onboarding] Location permission error:', error);
            goToNext();
        }
    };

    const requestNotificationPermission = async () => {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            console.log('[Onboarding] Notification permission status:', status);
            setNotificationsGranted(status === 'granted');
            Haptics.notificationAsync(
                status === 'granted'
                    ? Haptics.NotificationFeedbackType.Success
                    : Haptics.NotificationFeedbackType.Warning
            );

            // On Android, if notifications are granted, also request battery optimization exemption
            // This ensures Azan alarms work reliably after device reboot
            if (status === 'granted' && Platform.OS === 'android') {
                const { Alert } = require('react-native');

                // Step 1: Check and request SCHEDULE_EXACT_ALARM permission (Android 12+)
                // This is CRITICAL - without it, alarms fail silently!
                console.log('[Onboarding] Checking exact alarm permission...');
                try {
                    const canSchedule = await canScheduleExactAlarms();
                    console.log('[Onboarding] Can schedule exact alarms:', canSchedule);

                    if (!canSchedule) {
                        console.log('[Onboarding] Requesting exact alarm permission');
                        Alert.alert(
                            t('onboarding.enableExactAlarms'),
                            t('onboarding.exactAlarmsDescription'),
                            [
                                {
                                    text: t('onboarding.openSettings'),
                                    onPress: async () => {
                                        const result = await requestExactAlarmPermission();
                                        console.log('[Onboarding] Exact alarm result:', result);
                                    }
                                },
                                { text: t('common.skip'), style: 'cancel' }
                            ]
                        );
                    }
                } catch (alarmError) {
                    console.error('[Onboarding] Exact alarm check failed:', alarmError);
                }

                // Step 2: Check and request battery optimization exemption
                console.log('[Onboarding] Checking battery optimization status...');
                try {
                    const isBatteryOptimized = await checkBatteryOptimization();
                    console.log('[Onboarding] Battery optimized:', isBatteryOptimized);
                    if (isBatteryOptimized) {
                        console.log('[Onboarding] Requesting battery optimization exemption for reliable alarms');
                        Alert.alert(
                            t('onboarding.enableReliableAzan'),
                            t('onboarding.reliableAzanDescription'),
                            [
                                {
                                    text: t('onboarding.openSettings'),
                                    onPress: async () => {
                                        const result = await requestBatteryOptimizationExemption();
                                        console.log('[Onboarding] Battery exemption result:', result);
                                    }
                                },
                                { text: t('common.skip'), style: 'cancel' }
                            ]
                        );
                    } else {
                        console.log('[Onboarding] App already exempt from battery optimization');
                    }
                } catch (batteryError) {
                    console.error('[Onboarding] Battery optimization check failed:', batteryError);
                }
            }

            goToNext();
        } catch (error) {
            console.warn('[Onboarding] Notification permission error:', error);
            goToNext();
        }
    };

    const handleAction = (action?: 'location' | 'notifications' | 'widget') => {
        if (action === 'location') {
            requestLocationPermission();
        } else if (action === 'notifications') {
            requestNotificationPermission();
        } else if (action === 'widget') {
            // For widget slide, just go to next - user will add widget manually
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            goToNext();
        } else {
            goToNext();
        }
    };

    const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
        const isLastSlide = index === SLIDES.length - 1;
        const isLocationSlide = item.action === 'location';
        const isNotificationSlide = item.action === 'notifications';
        const isWidgetSlide = item.action === 'widget';

        return (
            <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
                <View style={styles.slideContent}>
                    {/* Icon, App Logo, or Widget Image */}
                    {index === 0 ? (
                        // Welcome slide: show app logo
                        <Image
                            source={require('@/../assets/images/logo_white_transparent.png')}
                            style={styles.appLogo}
                            resizeMode="contain"
                        />
                    ) : isWidgetSlide && item.image ? (
                        // Widget slide: show widget preview image
                        <View style={styles.widgetImageContainer}>
                            <Image
                                source={item.image}
                                style={styles.widgetImage}
                                resizeMode="contain"
                            />
                        </View>
                    ) : (
                        // Other slides: show icon
                        <View
                            style={[
                                styles.iconContainer,
                                {
                                    backgroundColor: `${theme.primary}15`,
                                    borderColor: `${theme.primary}30`,
                                },
                            ]}
                        >
                            <Feather name={item.icon} size={48} color={theme.primary} />
                        </View>
                    )}

                    {/* Text */}
                    <ThemedText type="caption" style={[styles.subtitle, { color: theme.primary }]}>
                        {t(item.subtitle)}
                    </ThemedText>
                    <ThemedText type="h2" style={styles.title}>
                        {t(item.title)}
                    </ThemedText>
                    <ThemedText type="body" secondary style={styles.description}>
                        {t(item.description)}
                    </ThemedText>

                    {/* Permission status indicator */}
                    {isLocationSlide && locationGranted && (
                        <View style={[styles.statusBadge, { backgroundColor: `${theme.primary}20` }]}>
                            <Feather name="check" size={16} color={theme.primary} />
                            <ThemedText type="small" style={{ color: theme.primary, marginLeft: 6 }}>
                                {t('onboarding.locationEnabled')}
                            </ThemedText>
                        </View>
                    )}
                    {isNotificationSlide && notificationsGranted && (
                        <View style={[styles.statusBadge, { backgroundColor: `${theme.primary}20` }]}>
                            <Feather name="check" size={16} color={theme.primary} />
                            <ThemedText type="small" style={{ color: theme.primary, marginLeft: 6 }}>
                                {t('onboarding.notificationsEnabled')}
                            </ThemedText>
                        </View>
                    )}
                </View>

                {/* Action Button */}
                <View style={styles.buttonContainer}>
                    {isLastSlide ? (
                        <Pressable
                            onPress={handleGetStarted}
                            style={({ pressed }) => [
                                styles.primaryButton,
                                { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
                            ]}
                        >
                            <ThemedText type="body" style={styles.buttonText}>
                                {t('onboarding.getStarted')}
                            </ThemedText>
                            <Feather name="arrow-right" size={20} color="#FFFFFF" />
                        </Pressable>
                    ) : (
                        <>
                            <Pressable
                                onPress={() => handleAction(item.action)}
                                style={({ pressed }) => [
                                    styles.primaryButton,
                                    { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
                                ]}
                            >
                                <ThemedText type="body" style={styles.buttonText}>
                                    {item.action ? t('onboarding.enable') : t('onboarding.continue')}
                                </ThemedText>
                                <Feather name="arrow-right" size={20} color="#FFFFFF" />
                            </Pressable>

                            {item.action && (
                                <Pressable onPress={goToNext} style={styles.skipActionButton}>
                                    <ThemedText type="small" secondary>
                                        {t('onboarding.notNow')}
                                    </ThemedText>
                                </Pressable>
                            )}
                        </>
                    )}
                </View>
            </View>
        );
    };

    return (
        <ThemedView style={styles.container}>
            {/* Skip button */}
            {currentIndex < SLIDES.length - 1 && (
                <Pressable
                    onPress={handleSkip}
                    style={[styles.skipButton, { top: insets.top + Spacing.md }]}
                >
                    <ThemedText type="small" secondary>
                        {t('common.skip')}
                    </ThemedText>
                </Pressable>
            )}

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                bounces={false}
                contentContainerStyle={{ paddingTop: insets.top + 60 }}
            />

            {/* Pagination dots */}
            <View style={[styles.pagination, { bottom: insets.bottom + Spacing.xl }]}>
                {SLIDES.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            {
                                backgroundColor:
                                    index === currentIndex ? theme.primary : `${theme.text}20`,
                                width: index === currentIndex ? 24 : 8,
                            },
                        ]}
                    />
                ))}
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    skipButton: {
        position: 'absolute',
        right: Spacing.lg,
        zIndex: 10,
        padding: Spacing.sm,
    },
    slide: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: Spacing['2xl'],
    },
    slideContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: Spacing['3xl'],
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing['2xl'],
        borderWidth: 2,
    },
    appLogo: {
        width: 140,
        height: 140,
        marginBottom: Spacing['2xl'],
    },
    subtitle: {
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: Spacing.sm,
        fontWeight: '600',
    },
    title: {
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    description: {
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: Spacing.lg,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        marginTop: Spacing.lg,
    },
    buttonContainer: {
        paddingBottom: 100,
        alignItems: 'center',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing['2xl'],
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
        minWidth: 200,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    skipActionButton: {
        marginTop: Spacing.md,
        padding: Spacing.sm,
    },
    pagination: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    widgetImageContainer: {
        marginBottom: Spacing['2xl'],
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 4,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 12,
    },
    widgetImage: {
        width: SCREEN_WIDTH - 88,
        height: 116,
        borderRadius: 20,
    },
});
