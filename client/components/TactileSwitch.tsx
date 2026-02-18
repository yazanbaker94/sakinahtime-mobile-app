/**
 * TactileSwitch - A custom toggle switch with a physical, tactile feel.
 * The white thumb "pops" out of the track with a visible drop-shadow.
 */

import React, { useRef, useEffect } from 'react';
import { View, Pressable, Animated, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface TactileSwitchProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
    trackColorFalse?: string;
    trackColorTrue?: string;
    disabled?: boolean;
}

const TRACK_WIDTH = 51;
const TRACK_HEIGHT = 31;
const THUMB_SIZE = 27;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - 4; // 4px total padding

export function TactileSwitch({
    value,
    onValueChange,
    trackColorFalse = '#E5E7EB',
    trackColorTrue = '#0D9488',
    disabled = false,
}: TactileSwitchProps) {
    const translateX = useRef(new Animated.Value(value ? THUMB_TRAVEL : 0)).current;
    const trackColor = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(translateX, {
                toValue: value ? THUMB_TRAVEL : 0,
                useNativeDriver: true,
                tension: 60,
                friction: 8,
            }),
            Animated.timing(trackColor, {
                toValue: value ? 1 : 0,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();
    }, [value]);

    const interpolatedTrackColor = trackColor.interpolate({
        inputRange: [0, 1],
        outputRange: [trackColorFalse, trackColorTrue],
    });

    const handlePress = () => {
        if (disabled) return;
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onValueChange(!value);
    };

    return (
        <Pressable onPress={handlePress} disabled={disabled} hitSlop={4}>
            <Animated.View
                style={[
                    styles.track,
                    { backgroundColor: interpolatedTrackColor },
                    disabled && { opacity: 0.5 },
                ]}
            >
                <Animated.View
                    style={[
                        styles.thumb,
                        { transform: [{ translateX }] },
                    ]}
                />
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    track: {
        width: TRACK_WIDTH,
        height: TRACK_HEIGHT,
        borderRadius: TRACK_HEIGHT / 2,
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    thumb: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        backgroundColor: '#FFFFFF',
        // The tactile shadow that makes it pop
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
});
