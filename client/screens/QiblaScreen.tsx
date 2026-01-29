import React, { useMemo, useEffect, useRef } from "react";
import { View, StyleSheet, Platform, Pressable, useWindowDimensions, PixelRatio, Image } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useLocation } from "@/contexts/LocationContext";
import {
  useCompass,
  calculateQiblaDirection,
  calculateDistanceToMecca,
  getRelativeDirection,
} from "@/hooks/useCompass";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

// Helper to normalize sizes across different pixel densities
const normalize = (size: number) => {
  const scale = PixelRatio.get();
  // Normalize to a baseline of 2x density
  if (scale < 2) return Math.round(size * 0.85);
  if (scale > 3) return Math.round(size * 1.1);
  return size;
};

// Hook to get responsive compass dimensions
const useCompassDimensions = () => {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const screenMin = Math.min(width, height);
    // Use percentage of screen width, with min/max bounds
    // Account for padding (40px each side = 80px total)
    const availableWidth = width - 80;
    // Also consider height - we want compass to fit comfortably
    const availableHeight = height * 0.42; // ~42% of screen height for compass

    const compassSize = Math.min(
      Math.max(availableWidth * 0.85, 220), // Min 220
      Math.min(availableHeight, 340) // Max 340
    );

    const innerRingSize = compassSize * 0.8; // 80% of compass size
    // Position Kaaba slightly beyond cardinal letters (outer edge of inner ring)
    const cardinalRadius = innerRingSize / 2 - normalize(32);
    const qiblaIndicatorRadius = innerRingSize / 2 - normalize(15); // Outer than cardinals

    return {
      compassSize,
      innerRingSize,
      qiblaIndicatorRadius,
      // Scaled values for various elements
      borderWidth: normalize(3),
      tickMajorLength: normalize(14),
      tickMinorLength: normalize(10),
      tickSmallLength: normalize(5),
      tickMajorWidth: normalize(2.5),
      tickMinorWidth: normalize(1.5),
      tickSmallWidth: normalize(1),
      kaabaSize: normalize(28), // Smaller Kaaba icon
      centerDotSize: normalize(22),
      pointerWidth: normalize(11),
      pointerHeight: normalize(65),
      cardinalFontSize: normalize(17),
      cardinalNorthFontSize: normalize(20),
      cardinalRadius: innerRingSize / 2 - normalize(32),
    };
  }, [width, height]);
};

export default function QiblaScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  useKeepAwake(); // Keep screen on while finding Qibla
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const wasAlignedRef = useRef(false);
  const compassInitializedRef = useRef(false);
  const prevHeadingRef = useRef<number | null>(null);
  const [showCalibrationHint, setShowCalibrationHint] = React.useState(false);
  const [isLocked, setIsLocked] = React.useState(false);
  const [lockedHeading, setLockedHeading] = React.useState<number | null>(null);
  const calibrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const smoothRotation = useSharedValue(0);

  // Get responsive dimensions
  const dims = useCompassDimensions();

  const {
    latitude,
    longitude,
    city,
    loading: locationLoading,
    permission,
    requestPermission,
    openSettings,
    canAskAgain,
  } = useLocation();

  const { heading, available: compassAvailable, error: compassError, accuracy } = useCompass();

  // Debounce calibration hint to prevent flickering
  useEffect(() => {
    if (accuracy !== "high" && compassAvailable) {
      // Show hint after 2 seconds of low accuracy
      if (!showCalibrationHint && !calibrationTimeoutRef.current) {
        calibrationTimeoutRef.current = setTimeout(() => {
          setShowCalibrationHint(true);
          calibrationTimeoutRef.current = null;
        }, 2000);
      }
    } else {
      // Hide hint after 3 seconds of high accuracy (sticky)
      if (showCalibrationHint && !calibrationTimeoutRef.current) {
        calibrationTimeoutRef.current = setTimeout(() => {
          setShowCalibrationHint(false);
          calibrationTimeoutRef.current = null;
        }, 3000);
      } else if (!showCalibrationHint && calibrationTimeoutRef.current) {
        // Cancel pending show if accuracy improved
        clearTimeout(calibrationTimeoutRef.current);
        calibrationTimeoutRef.current = null;
      }
    }

    return () => {
      if (calibrationTimeoutRef.current) {
        clearTimeout(calibrationTimeoutRef.current);
      }
    };
  }, [accuracy, compassAvailable, showCalibrationHint]);

  const qiblaDirection = useMemo(() => {
    if (latitude === null || longitude === null) return 0;
    return calculateQiblaDirection(latitude, longitude);
  }, [latitude, longitude]);

  const distanceToMecca = useMemo(() => {
    if (latitude === null || longitude === null) return 0;
    return calculateDistanceToMecca(latitude, longitude);
  }, [latitude, longitude]);

  const { angle: relativeAngle, direction } = useMemo(() => {
    return getRelativeDirection(heading, qiblaDirection);
  }, [heading, qiblaDirection]);

  const isAligned = direction === "aligned";
  const lastHapticRef = useRef<number>(0);
  const lastHeadingRef = useRef<number | null>(null);

  // Haptic feedback on every movement - stops when aligned (silence = "locked in" feeling)
  // Note: Only on iOS - Android's haptic hardware doesn't support subtle per-scroll vibrations
  useEffect(() => {
    if (!isFocused || Platform.OS !== "ios" || isAligned || isLocked) return;
    if (heading === null) return;

    // Check if heading actually changed significantly (at least 2 degrees)
    if (lastHeadingRef.current !== null) {
      const headingChange = Math.abs(heading - lastHeadingRef.current);
      if (headingChange < 2 && headingChange !== 0) return; // Skip tiny changes
    }
    lastHeadingRef.current = heading;

    const now = Date.now();

    // Minimum interval between haptics (to not overwhelm)
    const minInterval = 40; // 40ms minimum between vibrations

    if (now - lastHapticRef.current > minInterval) {
      lastHapticRef.current = now;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [heading, isFocused, isAligned, isLocked]);

  useEffect(() => {
    // Only trigger haptics and animations when screen is focused
    if (!isFocused) return;

    if (isAligned && !wasAlignedRef.current) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
    wasAlignedRef.current = isAligned;
  }, [isAligned, isFocused]);

  // Update smooth rotation when heading changes - this prevents spinning when crossing 0°/360°
  useEffect(() => {
    if (heading === null) return;

    // Don't update rotation when locked
    if (isLocked) return;

    if (prevHeadingRef.current === null) {
      // First heading - set directly
      smoothRotation.value = -heading;
    } else {
      // Calculate delta with wraparound handling
      let delta = heading - prevHeadingRef.current;

      // Normalize delta to be between -180 and 180 (take shortest path)
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      // Apply delta to smooth rotation
      smoothRotation.value = smoothRotation.value - delta;
    }

    prevHeadingRef.current = heading;
  }, [heading, smoothRotation, isLocked]);

  const compassRotationStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${smoothRotation.value}deg`,
        },
      ],
    };
  });



  const qiblaIndicatorAnimStyle = useAnimatedStyle(() => {
    const angleRad = ((qiblaDirection - 90) * Math.PI) / 180;
    const x = Math.cos(angleRad) * dims.qiblaIndicatorRadius;
    const y = Math.sin(angleRad) * dims.qiblaIndicatorRadius;
    return {
      transform: [
        { translateX: x },
        { translateY: y },
      ],
    };
  }, [qiblaDirection, dims.qiblaIndicatorRadius]);

  const getDirectionText = () => {
    if (direction === "aligned") return "Facing Qibla";
    const turnDegrees = Math.round(relativeAngle);
    if (direction === "left") return `Turn Left ${turnDegrees}°`;
    return `Turn Right ${turnDegrees}°`;
  };

  const getDirectionIcon = (): "check-circle" | "chevron-left" | "chevron-right" => {
    if (direction === "aligned") return "check-circle";
    if (direction === "left") return "chevron-left";
    return "chevron-right";
  };

  if (!permission?.granted) {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[
            styles.content,
            {
              paddingTop: headerHeight + Spacing.xl,
              paddingBottom: tabBarHeight + Spacing.xl,
            },
          ]}
        >
          <View style={styles.permissionContainer}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: `${theme.primary}15`,
                  borderWidth: 2,
                  borderColor: `${theme.primary}30`,
                },
              ]}
            >
              <Feather name="map-pin" size={48} color={theme.primary} />
            </View>
            <ThemedText type="h3" style={styles.permissionTitle}>
              Location Access Required
            </ThemedText>
            <ThemedText type="body" secondary style={styles.permissionText}>
              We need your location to calculate the Qibla direction from your current position.
            </ThemedText>
            {Platform.OS === "web" ? (
              <ThemedText type="small" secondary style={styles.permissionText}>
                Please enable location in your browser settings.
              </ThemedText>
            ) : canAskAgain ? (
              <Pressable
                onPress={requestPermission}
                style={[styles.permissionButton, {
                  backgroundColor: theme.primary,
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }]}
              >
                <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: '600' }}>
                  Enable Location
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable
                onPress={openSettings}
                style={[styles.permissionButton, {
                  backgroundColor: theme.primary,
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }]}
              >
                <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: '600' }}>
                  Open Settings
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>
      </ThemedView>
    );
  }

  // Track when compass is initialized - once we have a heading, don't show loading again
  if (heading !== null) {
    compassInitializedRef.current = true;
  }

  // Only show loading if we haven't initialized the compass yet
  const shouldShowLoading = locationLoading || (latitude !== null && !compassInitializedRef.current && heading === null);

  if (shouldShowLoading) {
    return (
      <ThemedView style={styles.container}>
        <View
          style={[
            styles.content,
            {
              paddingTop: headerHeight + Spacing.xl,
              paddingBottom: tabBarHeight + Spacing.xl,
            },
          ]}
        >
          <ThemedText type="body" secondary>
            {locationLoading ? "Getting your location..." : "Initializing compass..."}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const primaryColor = theme.primary;
  const goldColor = theme.gold;

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: tabBarHeight + Spacing["2xl"],
          },
        ]}
      >
        {/* Header Row - Location Badge and Mosque Icon */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: Spacing.lg }}>
          {/* Location Badge */}
          {city ? (
            <View style={styles.locationBadge}>
              <Feather name="map-pin" size={15} color={primaryColor} />
              <ThemedText type="small" style={{
                marginLeft: 7,
                color: primaryColor,
                fontWeight: '700',
                fontSize: 13,
              }}>
                {city}
              </ThemedText>
            </View>
          ) : <View />}

          {/* Mosque Icon Button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('MosqueFinder');
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: pressed ? `${primaryColor}25` : `${primaryColor}15`,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              gap: 6,
            })}
          >
            <Feather name="home" size={16} color={primaryColor} />
            <ThemedText type="caption" style={{ color: primaryColor, fontWeight: '600', fontSize: 12 }}>
              Mosques
            </ThemedText>
          </Pressable>
        </View>

        {/* Premium Compass */}
        <View style={[styles.compassWrapper, {
          width: dims.compassSize + 20,
          height: dims.compassSize + 20,
        }]}>
          {/* Subtle outer ring - only changes when locked */}
          <View style={[styles.glowRing, {
            width: dims.compassSize + 12,
            height: dims.compassSize + 12,
            borderRadius: (dims.compassSize + 12) / 2,
            borderColor: isLocked ? primaryColor : `${primaryColor}20`,
            borderWidth: isLocked ? 3 : 2,
          }]} />

          <View style={[styles.compassOuter, {
            width: dims.compassSize,
            height: dims.compassSize,
            borderRadius: dims.compassSize / 2,
            backgroundColor: isDark ? `${theme.backgroundDefault}FA` : `${theme.backgroundDefault}FA`,
            borderWidth: dims.borderWidth,
            borderColor: `${primaryColor}40`,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: isDark ? 0.6 : 0.18,
            shadowRadius: 30,
            elevation: 12,
          }]}>
            <Animated.View style={[styles.compassInner, {
              width: dims.innerRingSize,
              height: dims.innerRingSize,
            }, compassRotationStyle]}>
              <View style={[styles.innerRing, {
                width: dims.innerRingSize,
                height: dims.innerRingSize,
                borderRadius: dims.innerRingSize / 2,
                borderColor: `${primaryColor}59`,
                borderWidth: normalize(2.5),
              }]}>
                {/* Cardinal Directions */}
                {["N", "E", "S", "W"].map((dir, index) => {
                  const angle = index * 90;
                  const angleRad = ((angle - 90) * Math.PI) / 180;
                  const radius = dims.cardinalRadius;
                  const x = Math.cos(angleRad) * radius;
                  const y = Math.sin(angleRad) * radius;
                  const labelSize = 40;

                  return (
                    <View
                      key={dir}
                      style={[
                        styles.directionLabelContainer,
                        {
                          width: labelSize,
                          height: labelSize,
                          // Position from center of innerRing
                          left: dims.innerRingSize / 2 - labelSize / 2 + x,
                          top: dims.innerRingSize / 2 - labelSize / 2 + y,
                        },
                      ]}
                    >
                      <ThemedText
                        type="h4"
                        style={{
                          color: dir === "N" ? primaryColor : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'),
                          fontWeight: dir === "N" ? '800' : '600',
                          fontSize: dir === "N" ? dims.cardinalNorthFontSize : dims.cardinalFontSize,
                        }}
                      >
                        {dir}
                      </ThemedText>
                    </View>
                  );
                })}

                {/* Compass Ticks */}
                {[...Array(72)].map((_, i) => {
                  const angle = i * 5;
                  const isMajor = i % 18 === 0;
                  const isMinor = i % 9 === 0 && !isMajor;
                  const tickLength = isMajor ? dims.tickMajorLength : isMinor ? dims.tickMinorLength : dims.tickSmallLength;
                  const tickWidth = isMajor ? dims.tickMajorWidth : isMinor ? dims.tickMinorWidth : dims.tickSmallWidth;

                  // Calculate position on the circle edge
                  const angleRad = ((angle - 90) * Math.PI) / 180;
                  const outerRadius = dims.innerRingSize / 2 - 4; // Just inside the border
                  const innerRadius = outerRadius - tickLength;
                  const centerX = dims.innerRingSize / 2;
                  const centerY = dims.innerRingSize / 2;

                  // Position tick at outer edge, pointing inward
                  const x = centerX + Math.cos(angleRad) * (outerRadius - tickLength / 2);
                  const y = centerY + Math.sin(angleRad) * (outerRadius - tickLength / 2);

                  return (
                    <View
                      key={i}
                      style={[
                        styles.tick,
                        {
                          width: tickWidth,
                          height: tickLength,
                          backgroundColor: isMajor
                            ? (isDark ? '#FFFFFF' : '#000000')
                            : (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)'),
                          left: x - tickWidth / 2,
                          top: y - tickLength / 2,
                          transform: [{ rotate: `${angle}deg` }],
                          opacity: isMajor ? 1 : isMinor ? 0.75 : 0.5,
                        },
                      ]}
                    />
                  );
                })}

                {/* Kaaba/Qibla Indicator */}
                <Animated.View
                  style={[
                    styles.qiblaIndicator,
                    qiblaIndicatorAnimStyle,
                  ]}
                >
                  <Image
                    source={require('../../assets/images/kaabaa.png')}
                    style={{
                      width: dims.kaabaSize,
                      height: dims.kaabaSize,
                      transform: [{ rotate: `${heading || 0}deg` }]
                    }}
                    resizeMode="contain"
                  />
                </Animated.View>
              </View>
            </Animated.View>

            {/* Center Pointer */}
            <View style={styles.centerPoint}>
              <View style={[styles.pointerUp, {
                borderLeftWidth: dims.pointerWidth,
                borderRightWidth: dims.pointerWidth,
                borderBottomWidth: dims.pointerHeight,
                borderBottomColor: isAligned ? primaryColor : goldColor,
                shadowColor: isAligned ? primaryColor : goldColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.7,
                shadowRadius: 12,
                marginBottom: -dims.centerDotSize / 2,
              }]} />
              <View style={[styles.centerDot, {
                width: dims.centerDotSize,
                height: dims.centerDotSize,
                borderRadius: dims.centerDotSize / 2,
                backgroundColor: isAligned ? primaryColor : goldColor,
                shadowColor: isAligned ? primaryColor : goldColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 10,
                elevation: 6,
                borderWidth: dims.borderWidth,
                borderColor: '#FFFFFF',
              }]} />
            </View>
          </View>
        </View>

        {/* Direction Indicator */}
        <View
          style={styles.directionIndicator}
        >
          <ThemedText
            type="body"
            style={[
              styles.directionText,
              {
                color: isAligned ? primaryColor : theme.text,
                fontWeight: '800',
                fontSize: 18,
                letterSpacing: -0.5,
              },
            ]}
          >
            {isLocked ? "Direction Locked" : getDirectionText()}
          </ThemedText>
        </View>

        {/* Lock Button - Always reserves space, visible only when aligned or locked */}
        <Pressable
          onPress={() => {
            if (!isAligned && !isLocked) return; // No action if not aligned
            if (isLocked) {
              setIsLocked(false);
              setLockedHeading(null);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } else {
              setIsLocked(true);
              setLockedHeading(heading);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }}
          style={({ pressed }) => [{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: isLocked
              ? primaryColor
              : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'),
            opacity: (isAligned || isLocked) ? (pressed ? 0.7 : 1) : 0,
            gap: 6,
          }]}
          disabled={!isAligned && !isLocked}
        >
          <Feather
            name={isLocked ? "lock" : "unlock"}
            size={14}
            color={isLocked ? '#FFFFFF' : primaryColor}
          />
          <ThemedText
            type="caption"
            style={{
              color: isLocked ? '#FFFFFF' : primaryColor,
              fontWeight: '600',
              fontSize: 13,
            }}
          >
            {isLocked ? "Tap to Unlock" : "Lock Direction"}
          </ThemedText>
        </Pressable>

        {/* Info Cards */}
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Feather name="navigation" size={18} color={isDark ? '#94A3B8' : '#64748B'} style={{ marginBottom: 6 }} />
            <ThemedText type="h2" style={{ fontWeight: '800', fontSize: 24, letterSpacing: -1 }}>
              {heading}°
            </ThemedText>
            <ThemedText type="caption" secondary style={{ marginTop: 4, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
              YOUR HEADING
            </ThemedText>
          </View>

          <View style={styles.infoCard}>
            <Feather name="compass" size={18} color={primaryColor} style={{ marginBottom: 6 }} />
            <ThemedText type="h2" style={{ color: primaryColor, fontWeight: '800', fontSize: 24, letterSpacing: -1 }}>
              {qiblaDirection}°
            </ThemedText>
            <ThemedText type="caption" secondary style={{ marginTop: 4, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
              QIBLA BEARING
            </ThemedText>
          </View>

          <View style={styles.infoCard}>
            <Feather name="map-pin" size={18} color={goldColor} style={{ marginBottom: 6 }} />
            <ThemedText type="h2" style={{ color: goldColor, fontWeight: '800', fontSize: 24, letterSpacing: -1 }}>
              {distanceToMecca.toLocaleString()}
            </ThemedText>
            <ThemedText type="caption" secondary style={{ marginTop: 4, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
              KM TO MECCA
            </ThemedText>
          </View>
        </View>



        {/* Calibration Hint */}
        {showCalibrationHint ? (
          <View style={[styles.calibrationHint, {
            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(217, 119, 6, 0.1)',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(217, 119, 6, 0.25)',
          }]}>
            <Feather name="info" size={16} color={goldColor} />
            <ThemedText type="caption" style={{
              marginLeft: 10,
              color: goldColor,
              fontWeight: '600',
              flex: 1,
            }}>
              Move your phone in a figure-8 pattern to calibrate
            </ThemedText>
          </View>
        ) : null}

        {/* Warning */}
        {!compassAvailable || compassError ? (
          <View style={[styles.warningContainer, {
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.1)',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(220, 38, 38, 0.25)',
          }]}>
            <Feather name="alert-circle" size={18} color={isDark ? '#EF4444' : '#DC2626'} />
            <ThemedText type="small" style={{
              marginLeft: 10,
              color: isDark ? '#EF4444' : '#DC2626',
              fontWeight: '600',
              flex: 1,
            }}>
              {Platform.OS === "web"
                ? "Compass not available on web. Use on mobile device."
                : compassError || "Compass not available"}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  permissionContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
  },
  permissionTitle: {
    marginBottom: Spacing.md,
    textAlign: "center",
    fontWeight: '700',
  },
  permissionText: {
    textAlign: "center",
    marginBottom: Spacing["2xl"],
    lineHeight: 24,
  },
  permissionButton: {
    paddingHorizontal: Spacing["3xl"],
    paddingVertical: Spacing.lg,
    borderRadius: 16,
  },
  headerSection: {
    alignItems: "center",
    width: '100%',
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  compassWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  glowRing: {
    position: "absolute",
    borderWidth: 4,
  },
  compassOuter: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  compassInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  innerRing: {
    alignItems: "center",
    justifyContent: "center",
  },
  directionLabelContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  tick: {
    position: "absolute",
  },
  qiblaIndicator: {
    position: "absolute",
  },
  kaabaCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerPoint: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  pointerUp: {
    width: 0,
    height: 0,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  centerDot: {
  },
  directionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    justifyContent: "center",
  },
  directionText: {
    fontWeight: "600",
  },
  infoContainer: {
    flexDirection: "row",
    gap: Spacing.lg,
    width: '100%',
    justifyContent: 'center',
  },
  infoCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
    flex: 1,
    maxWidth: 155,
  },
  mosquesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    width: '100%',
    maxWidth: 320,
  },
  calibrationHint: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: '90%',
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: '90%',
  },
});
