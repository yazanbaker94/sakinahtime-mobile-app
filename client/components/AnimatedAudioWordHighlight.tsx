/**
 * AnimatedAudioWordHighlight
 * Smooth animated word highlight for audio playback in MushafScreen
 * Uses Reanimated for smooth transitions between words
 */

import React, { useEffect, useRef } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';

interface AnimatedAudioWordHighlightProps {
    wordCoords: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    currentWordIndex: number;
    imageScale: number;
    imageOffsetY: number;
    primaryColor: string;
    verseKey: string;
}

export function AnimatedAudioWordHighlight({
    wordCoords,
    currentWordIndex,
    imageScale,
    imageOffsetY,
    primaryColor,
    verseKey,
}: AnimatedAudioWordHighlightProps) {
    // Track if we've initialized position (to prevent flying-from-origin on first render)
    const hasInitialized = useRef(false);

    // Shared values for smooth animation
    const left = useSharedValue(0);
    const top = useSharedValue(0);
    const width = useSharedValue(0);
    const height = useSharedValue(0);
    const opacity = useSharedValue(0);

    // Animate when word index changes
    useEffect(() => {
        if (currentWordIndex >= 0 && currentWordIndex < wordCoords.length) {
            const coord = wordCoords[currentWordIndex];
            if (coord) {
                const targetLeft = coord.x * imageScale;
                const targetTop = (coord.y * imageScale) + imageOffsetY;
                const targetWidth = Math.max(coord.width * imageScale, 20);
                const targetHeight = Math.max(coord.height * imageScale, 20);

                // On first appearance, set position immediately (no animation)
                // This prevents the "flying from above" effect
                if (!hasInitialized.current) {
                    hasInitialized.current = true;
                    left.value = targetLeft;
                    top.value = targetTop;
                    width.value = targetWidth;
                    height.value = targetHeight;
                    opacity.value = withTiming(1, { duration: 150 });
                } else {
                    // Animate to new position for subsequent words
                    const timing = { duration: 120, easing: Easing.out(Easing.quad) };
                    left.value = withTiming(targetLeft, timing);
                    top.value = withTiming(targetTop, timing);
                    width.value = withTiming(targetWidth, timing);
                    height.value = withTiming(targetHeight, timing);
                    opacity.value = withTiming(1, { duration: 80 });
                }
            }
        } else {
            // Hide when no word is active
            opacity.value = withTiming(0, { duration: 100 });
            // Reset initialization so next time highlight appears, it won't fly in
            hasInitialized.current = false;
        }
    }, [currentWordIndex, wordCoords, imageScale, imageOffsetY]);

    // Animated style - softer highlight without harsh border
    const animatedStyle = useAnimatedStyle(() => ({
        position: 'absolute' as const,
        left: left.value,
        top: top.value,
        width: width.value,
        height: height.value,
        opacity: opacity.value,
        backgroundColor: `${primaryColor}50`, // 31% opacity - slightly softer
        borderRadius: 4,
        // Removed harsh border - using subtle shadow-like effect instead
    }));

    // Don't render if no valid word
    if (currentWordIndex < 0 || wordCoords.length === 0) {
        return null;
    }

    return (
        <Animated.View
            key={`word-highlight-${verseKey}`}
            pointerEvents="none"
            style={animatedStyle}
        />
    );
}

export default AnimatedAudioWordHighlight;
