/**
 * AnimatedAudioWordHighlight
 * Smooth animated word highlight for audio playback in MushafScreen
 * Uses Reanimated for smooth transitions between words
 */

import React, { useEffect } from 'react';
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
                const timing = { duration: 120, easing: Easing.out(Easing.quad) };

                left.value = withTiming(coord.x * imageScale, timing);
                top.value = withTiming((coord.y * imageScale) + imageOffsetY, timing);
                width.value = withTiming(Math.max(coord.width * imageScale, 20), timing);
                height.value = withTiming(Math.max(coord.height * imageScale, 20), timing);
                opacity.value = withTiming(1, { duration: 80 });
            }
        } else {
            // Hide when no word is active
            opacity.value = withTiming(0, { duration: 100 });
        }
    }, [currentWordIndex, wordCoords, imageScale, imageOffsetY]);

    // Animated style
    const animatedStyle = useAnimatedStyle(() => ({
        position: 'absolute' as const,
        left: left.value,
        top: top.value,
        width: width.value,
        height: height.value,
        opacity: opacity.value,
        backgroundColor: `${primaryColor}66`, // 40% opacity
        borderRadius: 6,
        borderWidth: 2,
        borderColor: primaryColor,
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
