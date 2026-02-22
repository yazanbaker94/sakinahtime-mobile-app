/**
 * OnboardingScreen - Premium first-time user onboarding flow
 * Features: 3D clay hero assets, floating pedestal cards, themed glow buttons
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Pressable,
    Platform,
    FlatList,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 3D Hero Assets
const HERO_ASSETS: Record<string, any> = {
    welcome: require('../../assets/images/3d-images/crescent.png'),
    location: require('../../assets/images/3d-images/location.png'),
    notifications: require('../../assets/images/3d-images/bell.png'),
    widget: require('../../assets/images/3d-images/widget.png'),
    done: require('../../assets/images/3d-images/tick.png'),
};

interface OnboardingSlide {
    id: string;
    icon: keyof typeof Feather.glyphMap;
    title: string;
    subtitle: string;
    description: string;
    action?: 'location' | 'notifications' | 'widget';
    image?: any;
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
    // Icons are now pre-warmed in App.tsx via expo-image prefetch
    const assetsReady = true;

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

            if (status === 'granted' && Platform.OS === 'android') {
                const { Alert } = require('react-native');

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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            goToNext();
        } else {
            goToNext();
        }
    };

    // Button label logic
    const getButtonLabel = (item: OnboardingSlide, isLastSlide: boolean) => {
        if (isLastSlide) return t('onboarding.getStarted');
        if (item.action === 'location' || item.action === 'notifications') return t('onboarding.enable');
        return t('onboarding.continue');
    };

    // Button icon logic
    const getButtonIcon = (item: OnboardingSlide, isLastSlide: boolean): keyof typeof Feather.glyphMap => {
        if (isLastSlide) return 'arrow-right';
        if (item.action === 'location') return 'navigation';
        if (item.action === 'notifications') return 'bell';
        if (item.action === 'widget') return 'layout';
        return 'arrow-right';
    };

    const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
        const isLastSlide = index === SLIDES.length - 1;
        const isLocationSlide = item.action === 'location';
        const isNotificationSlide = item.action === 'notifications';
        const isWidgetSlide = item.action === 'widget';
        const heroAsset = HERO_ASSETS[item.id];

        return (
            <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
                {/* Upper spacer — pushes card to bottom half */}
                <View style={{ flex: 1 }} />

                {/* Pedestal Card — position: relative so the hero can be absolutely placed */}
                <View style={{
                    position: 'relative',
                    backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
                    borderTopLeftRadius: 32,
                    borderTopRightRadius: 32,
                    paddingTop: 100,
                    paddingBottom: insets.bottom + 80,
                    paddingHorizontal: 28,
                    alignItems: 'center',
                    overflow: 'visible',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -6 },
                    shadowOpacity: 0.08,
                    shadowRadius: 24,
                    elevation: 8,
                }}>
                    {/* 3D Hero — absolute positioned, overlapping top edge */}
                    <View style={{
                        position: 'absolute',
                        top: -80,
                        left: 0,
                        right: 0,
                        alignItems: 'center',
                        zIndex: 10,
                    }}>
                        {heroAsset ? (
                            <View style={{ alignItems: 'center' }}>
                                {/* Shadow Hack glow */}
                                <View style={{
                                    position: 'absolute',
                                    width: 120,
                                    height: 120,
                                    borderRadius: 60,
                                    backgroundColor: 'transparent',
                                    top: 15,
                                    shadowColor: theme.primary,
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 1,
                                    shadowRadius: 50,
                                    elevation: 20,
                                }} />
                                <Image
                                    source={heroAsset}
                                    style={{ width: 150, height: 150 }}
                                    contentFit="contain"
                                    transition={0}
                                    cachePolicy="memory"
                                />
                            </View>
                        ) : (
                            <View style={[styles.iconFallback, {
                                backgroundColor: `${theme.primary}15`,
                                borderColor: `${theme.primary}30`,
                            }]}>
                                <Feather name={item.icon} size={48} color={theme.primary} />
                            </View>
                        )}
                    </View>

                    {/* Subtitle */}
                    <ThemedText type="caption" style={[styles.subtitle, { color: theme.primary }]}>
                        {t(item.subtitle)}
                    </ThemedText>

                    {/* Title */}
                    <ThemedText type="h2" style={styles.title}>
                        {t(item.title)}
                    </ThemedText>

                    {/* Description */}
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

                    {/* Spacer */}
                    <View style={{ flex: 1, minHeight: 20 }} />

                    {/* CTA Button — colored shadow for tactile pop */}
                    {/* Shadow wrapper — shadow lives here, NOT on the button */}
                    <View style={{
                        width: '100%',
                        borderRadius: 16,
                        shadowColor: theme.primary,
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.35,
                        shadowRadius: 10,
                        elevation: 8,
                    }}>
                        <Pressable
                            onPress={isLastSlide ? handleGetStarted : () => handleAction(item.action)}
                            style={({ pressed }) => [{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingVertical: 16,
                                paddingHorizontal: 32,
                                borderRadius: 16,
                                width: '100%',
                                backgroundColor: theme.primary,
                                overflow: 'hidden',
                                opacity: pressed ? 0.85 : 1,
                                gap: 8,
                            }]}
                        >
                            <ThemedText type="body" style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
                                {getButtonLabel(item, isLastSlide)}
                            </ThemedText>
                            <Feather name={getButtonIcon(item, isLastSlide)} size={18} color="#FFFFFF" />
                        </Pressable>
                    </View>

                    {/* Not Now escape hatch */}
                    {item.action && !isLastSlide && (
                        <Pressable
                            onPress={goToNext}
                            style={({ pressed }) => ({ marginTop: 14, opacity: pressed ? 0.5 : 1 })}
                        >
                            <ThemedText type="body" style={{ color: '#9CA3AF', fontSize: 14 }}>
                                {t('onboarding.notNow')}
                            </ThemedText>
                        </Pressable>
                    )}
                </View>
            </View>
        );
    };

    // Wait for assets before rendering
    if (!assetsReady) {
        return <ThemedView style={styles.container} />;
    }

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
            />

            {/* Pagination dots */}
            <View style={[styles.pagination, { bottom: insets.bottom + Spacing.lg }]}>
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
        justifyContent: 'flex-end',
    },
    iconFallback: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
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
        paddingHorizontal: Spacing.sm,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        marginTop: Spacing.lg,
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
});
