/**
 * CoachMark - Contextual tooltip for feature hints
 * Shows once per feature to help users discover functionality
 */

import React, { useEffect } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    Modal,
    Dimensions,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CoachMarkProps {
    visible: boolean;
    onDismiss: () => void;
    title: string;
    message: string;
    icon?: keyof typeof Feather.glyphMap;
    position?: 'top' | 'center' | 'bottom';
    delay?: number;
}

export function CoachMark({
    visible,
    onDismiss,
    title,
    message,
    icon = 'info',
    position = 'center',
    delay = 500,
}: CoachMarkProps) {
    const { theme, isDark } = useTheme();
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.9);

    useEffect(() => {
        if (visible) {
            opacity.value = withDelay(delay, withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }));
            scale.value = withDelay(delay, withTiming(1, { duration: 300, easing: Easing.out(Easing.back(1.5)) }));
        } else {
            opacity.value = withTiming(0, { duration: 200 });
            scale.value = withTiming(0.9, { duration: 200 });
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    const handleDismiss = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onDismiss();
    };

    if (!visible) return null;

    const getPositionStyle = () => {
        switch (position) {
            case 'top':
                return { justifyContent: 'flex-start', paddingTop: 120 };
            case 'bottom':
                return { justifyContent: 'flex-end', paddingBottom: 150 };
            default:
                return { justifyContent: 'center' };
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleDismiss}
        >
            <Pressable
                style={[styles.overlay, getPositionStyle() as any]}
                onPress={handleDismiss}
            >
                <Animated.View
                    style={[
                        styles.container,
                        {
                            backgroundColor: isDark ? 'rgba(40, 40, 45, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                            borderColor: `${theme.primary}40`,
                        },
                        animatedStyle,
                    ]}
                >
                    {/* Icon */}
                    <View
                        style={[
                            styles.iconContainer,
                            { backgroundColor: `${theme.primary}20` },
                        ]}
                    >
                        <Feather name={icon} size={24} color={theme.primary} />
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <ThemedText type="h4" style={styles.title}>
                            {title}
                        </ThemedText>
                        <ThemedText type="body" secondary style={styles.message}>
                            {message}
                        </ThemedText>
                    </View>

                    {/* Dismiss Button */}
                    <Pressable
                        onPress={handleDismiss}
                        style={({ pressed }) => [
                            styles.dismissButton,
                            { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
                        ]}
                    >
                        <ThemedText type="small" style={styles.dismissText}>
                            Got it
                        </ThemedText>
                    </Pressable>
                </Animated.View>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    container: {
        width: SCREEN_WIDTH - Spacing.xl * 2,
        maxWidth: 340,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    content: {
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        textAlign: 'center',
        marginBottom: Spacing.xs,
    },
    message: {
        textAlign: 'center',
        lineHeight: 22,
    },
    dismissButton: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing['2xl'],
        borderRadius: BorderRadius.full,
    },
    dismissText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});
