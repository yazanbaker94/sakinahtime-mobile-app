import React, { useMemo } from 'react';
import { View, Image, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';

// Landmark images
const landmarkImages = {
    lantern: require('../../assets/images/minature/lantern.png'),
    palm_tree: require('../../assets/images/minature/palm_tree.png'),
    well: require('../../assets/images/minature/well.png'),
    campfire: require('../../assets/images/minature/campfire.png'),
    tent: require('../../assets/images/minature/tent.png'),
};

const characterImage = require('../../assets/images/minature/character.png');

interface TravelerJourneyProps {
    prayerTimes: {
        Fajr: string;
        Dhuhr: string;
        Asr: string;
        Maghrib: string;
        Isha: string;
    };
    /** 0-1 progress through the current prayer interval */
    progress: number;
    /** Index of the next prayer (0=Fajr, 1=Dhuhr, ..., 4=Isha) */
    nextPrayerIndex: number;
}

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
const LANDMARK_KEYS = ['lantern', 'palm_tree', 'well', 'campfire', 'tent'] as const;

/**
 * Calculate a point on a gentle wave path.
 * The path goes from left to right with a smooth sine wave.
 */
function getPointOnPath(t: number, width: number, height: number, yCenter: number, amplitude: number) {
    const x = t * width;
    // Gentle wave — one full period across the width
    const y = yCenter + Math.sin(t * Math.PI * 2 - Math.PI / 2) * amplitude;
    return { x, y };
}

/**
 * Generate SVG path data for the wave
 */
function generateWavePath(width: number, yCenter: number, amplitude: number, steps = 100): string {
    const points: string[] = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const { x, y } = getPointOnPath(t, width, 0, yCenter, amplitude);
        points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(' ');
}

export function TravelerJourney({ prayerTimes, progress, nextPrayerIndex }: TravelerJourneyProps) {
    const { isDark, theme } = useTheme();
    const { width: screenWidth } = useWindowDimensions();

    // Dimensions
    const containerWidth = screenWidth - 48; // Account for card padding
    const containerHeight = 100;
    const pathPadding = 30; // Horizontal padding for path start/end
    const pathWidth = containerWidth - pathPadding * 2;
    const pathYCenter = containerHeight * 0.45;
    const pathAmplitude = 12; // Subtle wave

    // Landmark icon size
    const landmarkSize = 36;
    const characterSize = 22; // ~20% smaller for better miniature illusion

    // Calculate positions for 5 landmarks along the path
    const landmarkPositions = useMemo(() => {
        return LANDMARK_KEYS.map((_, i) => {
            const t = i / (LANDMARK_KEYS.length - 1);
            const { x, y } = getPointOnPath(t, pathWidth, containerHeight, pathYCenter, pathAmplitude);
            return { x: x + pathPadding, y };
        });
    }, [pathWidth, containerHeight, pathYCenter, pathAmplitude, pathPadding]);

    // Calculate traveler position
    // nextPrayerIndex tells us which prayer we're heading toward
    // progress tells us how far between prev and next prayer
    const travelerPosition = useMemo(() => {
        let globalProgress: number;

        if (nextPrayerIndex <= 0) {
            // Before Fajr — traveler at start
            globalProgress = progress * (1 / (PRAYERS.length - 1));
        } else if (nextPrayerIndex >= PRAYERS.length) {
            // After Isha — traveler at end
            globalProgress = 1;
        } else {
            // Between prayers
            const segmentWidth = 1 / (PRAYERS.length - 1);
            const segmentStart = (nextPrayerIndex - 1) * segmentWidth;
            globalProgress = segmentStart + progress * segmentWidth;
        }

        globalProgress = Math.max(0, Math.min(1, globalProgress));
        const { x, y } = getPointOnPath(globalProgress, pathWidth, containerHeight, pathYCenter, pathAmplitude);
        return { x: x + pathPadding, y, progress: globalProgress };
    }, [nextPrayerIndex, progress, pathWidth, containerHeight, pathYCenter, pathAmplitude, pathPadding]);

    // Bobbing animation for the character
    const bobOffset = useSharedValue(0);
    React.useEffect(() => {
        bobOffset.value = withRepeat(
            withSequence(
                withTiming(-2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                withTiming(2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
            true
        );
    }, [bobOffset]);

    const characterAnimStyle = useAnimatedStyle(() => ({
        transform: [
            { scaleX: -1 }, // Flip to face right (toward destination)
            { translateY: bobOffset.value },
        ],
    }));

    // SVG paths
    const fullPath = useMemo(
        () => generateWavePath(pathWidth, pathYCenter, pathAmplitude),
        [pathWidth, pathYCenter, pathAmplitude]
    );

    // Trail path (path behind the traveler)
    const trailPath = useMemo(() => {
        const steps = 100;
        const endStep = Math.floor(travelerPosition.progress * steps);
        const points: string[] = [];
        for (let i = 0; i <= endStep; i++) {
            const t = i / steps;
            const { x, y } = getPointOnPath(t, pathWidth, 0, pathYCenter, pathAmplitude);
            points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
        }
        return points.join(' ');
    }, [travelerPosition.progress, pathWidth, pathYCenter, pathAmplitude]);

    // Trail color
    const trailColor = isDark ? 'rgba(251, 191, 36, 0.8)' : 'rgba(180, 140, 60, 0.7)';
    const pathColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';

    return (
        <View style={[styles.container, { height: containerHeight }]}>
            {/* SVG Path Layer */}
            <Svg
                width={containerWidth}
                height={containerHeight}
                style={StyleSheet.absoluteFill}
            >
                {/* Full path (translucent ahead) */}
                <Path
                    d={fullPath}
                    stroke={pathColor}
                    strokeWidth={2.5}
                    fill="none"
                    strokeLinecap="round"
                    transform={`translate(${pathPadding}, 0)`}
                />
                {/* Trail path (glowing behind traveler) */}
                {trailPath && (
                    <Path
                        d={trailPath}
                        stroke={trailColor}
                        strokeWidth={3}
                        fill="none"
                        strokeLinecap="round"
                        transform={`translate(${pathPadding}, 0)`}
                    />
                )}
                {/* Glow dots at each landmark position on the path */}
                {landmarkPositions.map((pos, i) => {
                    const isPast = i < nextPrayerIndex;
                    return (
                        <Circle
                            key={i}
                            cx={pos.x}
                            cy={pos.y}
                            r={isPast ? 4 : 3}
                            fill={isPast ? trailColor : pathColor}
                            opacity={isPast ? 1 : 0.5}
                        />
                    );
                })}
            </Svg>

            {/* Landmarks */}
            {landmarkPositions.map((pos, i) => {
                const isPast = i < nextPrayerIndex;
                const isActive = isPast;

                return (
                    <View
                        key={LANDMARK_KEYS[i]}
                        style={[
                            styles.landmarkContainer,
                            {
                                left: pos.x - landmarkSize / 2,
                                top: pos.y - landmarkSize + 4, // Anchor bottom of icon to sit on the path dot
                            },
                        ]}
                    >
                        <Image
                            source={landmarkImages[LANDMARK_KEYS[i]]}
                            style={[
                                styles.landmarkImage,
                                {
                                    width: landmarkSize,
                                    height: landmarkSize,
                                    opacity: isActive ? 1 : 0.35,
                                },
                            ]}
                            resizeMode="contain"
                        />
                    </View>
                );
            })}

            {/* Traveler Character */}
            <Animated.View
                style={[
                    styles.characterContainer,
                    {
                        left: travelerPosition.x - characterSize / 2,
                        top: travelerPosition.y - characterSize + 2,
                    },
                    characterAnimStyle,
                ]}
            >
                <Image
                    source={characterImage}
                    style={{
                        width: characterSize,
                        height: characterSize,
                    }}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        position: 'relative',
        overflow: 'visible',
    },
    landmarkContainer: {
        position: 'absolute',
        alignItems: 'center',
    },
    landmarkImage: {},
    characterContainer: {
        position: 'absolute',
        zIndex: 20, // Above landmarks so he walks in front
    },
});
