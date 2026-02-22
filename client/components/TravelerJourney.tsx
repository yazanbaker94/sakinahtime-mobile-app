import React, { useMemo, useEffect } from 'react';
import { View, Image, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withSequence,
    withSpring,
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
    /** When true, trigger a celebration animation (jump + glow) */
    celebrate?: boolean;
    /** Index of the prayer that was just marked (triggers happy bounce + spark) */
    celebratePrayerIndex?: number;
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

export function TravelerJourney({ prayerTimes, progress, nextPrayerIndex, celebrate = false, celebratePrayerIndex }: TravelerJourneyProps) {
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

    // Landmark bounce shared values (one per landmark)
    const landmarkScales = [
        useSharedValue(1),
        useSharedValue(1),
        useSharedValue(1),
        useSharedValue(1),
        useSharedValue(1),
    ];

    // Next-prayer glow shared values
    const nextGlowOpacity = useSharedValue(0.3);
    useEffect(() => {
        // Gentle breathing glow on the next prayer icon
        nextGlowOpacity.value = withRepeat(
            withSequence(
                withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.25, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
            true
        );
    }, [nextGlowOpacity]);

    // Spark-of-light shared values
    const sparkProgress = useSharedValue(0);
    const sparkOpacity = useSharedValue(0);
    const sparkFromIndex = useSharedValue(0);
    const sparkToIndex = useSharedValue(1);

    // Happy bounce on landmark + spark-of-light when a specific prayer is marked
    useEffect(() => {
        if (celebratePrayerIndex !== undefined && celebratePrayerIndex >= 0 && celebratePrayerIndex < 5) {
            // Happy bounce on the marked prayer's landmark
            landmarkScales[celebratePrayerIndex].value = withSequence(
                withTiming(1.35, { duration: 150, easing: Easing.out(Easing.cubic) }),
                withSpring(1, { damping: 6, stiffness: 300 }),
            );

            // Spark-of-light: arc from marked prayer to the next one
            const nextIdx = Math.min(celebratePrayerIndex + 1, 4);
            if (nextIdx !== celebratePrayerIndex) {
                sparkFromIndex.value = celebratePrayerIndex;
                sparkToIndex.value = nextIdx;
                sparkProgress.value = 0;
                sparkOpacity.value = 1;
                sparkProgress.value = withTiming(1, {
                    duration: 600,
                    easing: Easing.inOut(Easing.cubic),
                });
                // Fade out spark at the end
                sparkOpacity.value = withSequence(
                    withTiming(1, { duration: 400 }),
                    withTiming(0, { duration: 200 }),
                );
                // Bounce the destination landmark when spark arrives
                setTimeout(() => {
                    landmarkScales[nextIdx].value = withSequence(
                        withTiming(1.25, { duration: 120, easing: Easing.out(Easing.cubic) }),
                        withSpring(1, { damping: 8, stiffness: 350 }),
                    );
                }, 500);
            }
        }
    }, [celebratePrayerIndex]);

    // Animated styles for each landmark
    const landmarkAnimStyles = [
        useAnimatedStyle(() => ({ transform: [{ scale: landmarkScales[0].value }] })),
        useAnimatedStyle(() => ({ transform: [{ scale: landmarkScales[1].value }] })),
        useAnimatedStyle(() => ({ transform: [{ scale: landmarkScales[2].value }] })),
        useAnimatedStyle(() => ({ transform: [{ scale: landmarkScales[3].value }] })),
        useAnimatedStyle(() => ({ transform: [{ scale: landmarkScales[4].value }] })),
    ];

    // Next-prayer glow animated style
    const nextGlowAnimStyle = useAnimatedStyle(() => ({
        opacity: nextGlowOpacity.value,
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
                const isNext = i === nextPrayerIndex;
                const iconOpacity = isPast ? 1 : isNext ? 1 : 0.35;
                const iconScale = isNext ? 1.15 : 1;

                return (
                    <Animated.View
                        key={LANDMARK_KEYS[i]}
                        style={[
                            styles.landmarkContainer,
                            {
                                left: pos.x - landmarkSize / 2,
                                top: pos.y - landmarkSize + 4,
                            },
                            landmarkAnimStyles[i],
                        ]}
                    >
                        {/* Warm glow circle behind the next-prayer icon */}
                        {isNext && (
                            <Animated.View
                                style={[{
                                    position: 'absolute',
                                    width: landmarkSize * 1.6,
                                    height: landmarkSize * 1.6,
                                    borderRadius: landmarkSize * 0.8,
                                    backgroundColor: isDark ? 'rgba(251, 191, 36, 0.35)' : 'rgba(212, 160, 23, 0.25)',
                                    left: -(landmarkSize * 0.3),
                                    top: -(landmarkSize * 0.3),
                                }, nextGlowAnimStyle]}
                            />
                        )}
                        <Image
                            source={landmarkImages[LANDMARK_KEYS[i]]}
                            style={[
                                styles.landmarkImage,
                                {
                                    width: landmarkSize,
                                    height: landmarkSize,
                                    opacity: iconOpacity,
                                    transform: [{ scale: iconScale }],
                                },
                            ]}
                            resizeMode="contain"
                        />
                    </Animated.View>
                );
            })}



            {/* Spark-of-light orb */}
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: isDark ? '#FBBF24' : '#D4A017',
                        zIndex: 30,
                        shadowColor: '#FBBF24',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.8,
                        shadowRadius: 6,
                        elevation: 8,
                    },
                    useAnimatedStyle(() => {
                        // Interpolate position along the path between from and to landmarks
                        const fromT = sparkFromIndex.value / (LANDMARK_KEYS.length - 1);
                        const toT = sparkToIndex.value / (LANDMARK_KEYS.length - 1);
                        const currentT = fromT + (toT - fromT) * sparkProgress.value;
                        const x = currentT * pathWidth;
                        // Add an arc above the path for visual flair (parabolic arc)
                        const arcHeight = -18 * Math.sin(sparkProgress.value * Math.PI);
                        const y = pathYCenter + Math.sin(currentT * Math.PI * 2 - Math.PI / 2) * pathAmplitude + arcHeight;
                        return {
                            left: x + pathPadding - 5,
                            top: y - 5,
                            opacity: sparkOpacity.value,
                        };
                    }),
                ]}
            />
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
});
