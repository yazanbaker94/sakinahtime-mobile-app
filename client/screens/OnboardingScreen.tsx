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
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
    id: string;
    icon: keyof typeof Feather.glyphMap;
    title: string;
    subtitle: string;
    description: string;
    action?: 'location' | 'notifications';
}

const SLIDES: OnboardingSlide[] = [
    {
        id: 'welcome',
        icon: 'sun',
        title: 'Assalamu Alaikum',
        subtitle: 'Welcome to SakinahTime',
        description: 'Your companion for prayer times, Quran reading, and spiritual growth.',
    },
    {
        id: 'location',
        icon: 'map-pin',
        title: 'Accurate Prayer Times',
        subtitle: 'Location Access',
        description: 'We use your location to calculate precise prayer times for your area.',
        action: 'location',
    },
    {
        id: 'notifications',
        icon: 'bell',
        title: 'Never Miss a Prayer',
        subtitle: 'Notification Reminders',
        description: 'Get notified with beautiful Azan sounds when prayer time arrives.',
        action: 'notifications',
    },
    {
        id: 'done',
        icon: 'check-circle',
        title: "You're All Set!",
        subtitle: 'Ready to Begin',
        description: 'Start your journey towards a more mindful spiritual practice.',
    },
];

interface OnboardingScreenProps {
    onComplete: () => Promise<void>;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
    const { theme, isDark } = useTheme();
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
            setNotificationsGranted(status === 'granted');
            Haptics.notificationAsync(
                status === 'granted'
                    ? Haptics.NotificationFeedbackType.Success
                    : Haptics.NotificationFeedbackType.Warning
            );
            goToNext();
        } catch (error) {
            console.warn('[Onboarding] Notification permission error:', error);
            goToNext();
        }
    };

    const handleAction = (action?: 'location' | 'notifications') => {
        if (action === 'location') {
            requestLocationPermission();
        } else if (action === 'notifications') {
            requestNotificationPermission();
        } else {
            goToNext();
        }
    };

    const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
        const isLastSlide = index === SLIDES.length - 1;
        const isLocationSlide = item.action === 'location';
        const isNotificationSlide = item.action === 'notifications';

        return (
            <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
                <View style={styles.slideContent}>
                    {/* Icon or App Logo */}
                    {index === 0 ? (
                        // Welcome slide: show app logo
                        <Image
                            source={require('@/../assets/images/logo_white_transparent.png')}
                            style={styles.appLogo}
                            resizeMode="contain"
                        />
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
                        {item.subtitle}
                    </ThemedText>
                    <ThemedText type="h2" style={styles.title}>
                        {item.title}
                    </ThemedText>
                    <ThemedText type="body" secondary style={styles.description}>
                        {item.description}
                    </ThemedText>

                    {/* Permission status indicator */}
                    {isLocationSlide && locationGranted && (
                        <View style={[styles.statusBadge, { backgroundColor: `${theme.primary}20` }]}>
                            <Feather name="check" size={16} color={theme.primary} />
                            <ThemedText type="small" style={{ color: theme.primary, marginLeft: 6 }}>
                                Location enabled
                            </ThemedText>
                        </View>
                    )}
                    {isNotificationSlide && notificationsGranted && (
                        <View style={[styles.statusBadge, { backgroundColor: `${theme.primary}20` }]}>
                            <Feather name="check" size={16} color={theme.primary} />
                            <ThemedText type="small" style={{ color: theme.primary, marginLeft: 6 }}>
                                Notifications enabled
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
                                Get Started
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
                                    {item.action ? 'Enable' : 'Continue'}
                                </ThemedText>
                                <Feather name="arrow-right" size={20} color="#FFFFFF" />
                            </Pressable>

                            {item.action && (
                                <Pressable onPress={goToNext} style={styles.skipActionButton}>
                                    <ThemedText type="small" secondary>
                                        Not now
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
                        Skip
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
});
