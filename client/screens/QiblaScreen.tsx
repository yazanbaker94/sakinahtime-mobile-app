import React, { useMemo, useEffect, useRef } from "react";
import { View, StyleSheet, Platform, Pressable, Dimensions } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
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
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COMPASS_SIZE = Math.min(SCREEN_WIDTH - 80, 340);
const INNER_RING_SIZE = COMPASS_SIZE - 70;
const QIBLA_INDICATOR_RADIUS = INNER_RING_SIZE / 2 - 40;

export default function QiblaScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const wasAlignedRef = useRef(false);
  const [showCalibrationHint, setShowCalibrationHint] = React.useState(false);
  const calibrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const glowOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const successScale = useSharedValue(1);
  const rotationProgress = useSharedValue(0);

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

  useEffect(() => {
    if (isAligned && !wasAlignedRef.current) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      glowOpacity.value = withTiming(1, { duration: 300 });
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
      successScale.value = withSequence(
        withSpring(1.15, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );
    } else if (!isAligned && wasAlignedRef.current) {
      glowOpacity.value = withTiming(0, { duration: 300 });
      pulseScale.value = 1;
    }
    wasAlignedRef.current = isAligned;
  }, [isAligned, glowOpacity, pulseScale, successScale]);

  const compassRotationStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withSpring(`${-heading}deg`, {
            damping: 20,
            stiffness: 90,
            mass: 0.8,
          }),
        },
      ],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
      transform: [{ scale: pulseScale.value }],
    };
  });

  const successAnimStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: successScale.value }],
    };
  });

  const qiblaIndicatorAnimStyle = useAnimatedStyle(() => {
    const angleRad = ((qiblaDirection - 90) * Math.PI) / 180;
    const x = Math.cos(angleRad) * QIBLA_INDICATOR_RADIUS;
    const y = Math.sin(angleRad) * QIBLA_INDICATOR_RADIUS;
    return {
      transform: [
        { translateX: x }, 
        { translateY: y },
        { scale: isAligned ? successScale.value : 1 }
      ],
    };
  }, [qiblaDirection, isAligned]);

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
                  backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                  borderWidth: 2,
                  borderColor: isDark ? 'rgba(52, 211, 153, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                },
              ]}
            >
              <Feather name="map-pin" size={48} color={isDark ? Colors.dark.primary : Colors.light.primary} />
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
                  backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
                  shadowColor: isDark ? Colors.dark.primary : Colors.light.primary,
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
                  backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
                  shadowColor: isDark ? Colors.dark.primary : Colors.light.primary,
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

  if (locationLoading) {
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
            Getting your location...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const primaryColor = isDark ? Colors.dark.primary : Colors.light.primary;
  const goldColor = isDark ? '#F59E0B' : '#D97706';

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
        ) : null}

        {/* Premium Compass */}
        <View style={styles.compassWrapper}>
          {/* Animated Glow Rings */}
          <Animated.View style={[styles.glowRing, { 
            borderColor: isAligned ? primaryColor : 'rgba(52, 211, 153, 0.2)',
            shadowColor: primaryColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: isAligned ? 0.7 : 0,
            shadowRadius: 25,
          }, glowStyle]} />
          
          <View style={[styles.compassOuter, { 
            backgroundColor: isDark ? 'rgba(17, 24, 39, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            borderWidth: 3,
            borderColor: isDark ? 'rgba(52, 211, 153, 0.25)' : 'rgba(16, 185, 129, 0.25)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: isDark ? 0.6 : 0.18,
            shadowRadius: 30,
            elevation: 12,
          }]}>
            <Animated.View style={[styles.compassInner, compassRotationStyle]}>
              <View style={[styles.innerRing, { 
                borderColor: isDark ? 'rgba(52, 211, 153, 0.35)' : 'rgba(16, 185, 129, 0.35)',
                borderWidth: 2.5,
              }]}>
                {/* Cardinal Directions */}
                {["N", "E", "S", "W"].map((dir, index) => {
                  const angle = index * 90;
                  const angleRad = ((angle - 90) * Math.PI) / 180;
                  const radius = INNER_RING_SIZE / 2 - 32;
                  const x = Math.cos(angleRad) * radius;
                  const y = Math.sin(angleRad) * radius;
                  
                  return (
                    <View
                      key={dir}
                      style={[
                        styles.directionLabelContainer,
                        {
                          transform: [{ translateX: x - 20 }, { translateY: y - 20 }],
                        },
                      ]}
                    >
                      <ThemedText
                        type="h4"
                        style={{
                          color: dir === "N" ? primaryColor : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'),
                          fontWeight: dir === "N" ? '800' : '600',
                          fontSize: dir === "N" ? 20 : 17,
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
                  const tickLength = isMajor ? 14 : isMinor ? 10 : 5;
                  const tickWidth = isMajor ? 2.5 : isMinor ? 1.5 : 1;
                  
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
                          left: INNER_RING_SIZE / 2 - tickWidth / 2,
                          top: 3,
                          transform: [{ rotate: `${angle}deg` }],
                          transformOrigin: `${tickWidth / 2}px ${INNER_RING_SIZE / 2 - 3}px`,
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
                  <View style={[styles.kaabaCircle, { 
                    backgroundColor: isAligned ? primaryColor : goldColor,
                    shadowColor: isAligned ? primaryColor : goldColor,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.9,
                    shadowRadius: isAligned ? 18 : 10,
                    elevation: 10,
                    borderWidth: 3,
                    borderColor: '#FFFFFF',
                  }]}>
                    <Feather name="home" size={20} color="#FFFFFF" />
                  </View>
                </Animated.View>
              </View>
            </Animated.View>

            {/* Center Pointer */}
            <View style={styles.centerPoint}>
              <View style={[styles.pointerUp, { 
                borderBottomColor: isAligned ? primaryColor : goldColor,
                shadowColor: isAligned ? primaryColor : goldColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.7,
                shadowRadius: 12,
              }]} />
              <View style={[styles.centerDot, { 
                backgroundColor: isAligned ? primaryColor : goldColor,
                shadowColor: isAligned ? primaryColor : goldColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 10,
                elevation: 6,
                borderWidth: 3,
                borderColor: '#FFFFFF',
              }]} />
            </View>
          </View>
        </View>

        {/* Direction Indicator */}
        <Animated.View
          style={[
            styles.directionIndicator,
            isAligned && successAnimStyle,
          ]}
        >
          {isAligned && (
            <Feather
              name="check-circle"
              size={26}
              color={primaryColor}
            />
          )}
          <ThemedText
            type="body"
            style={[
              styles.directionText,
              { 
                color: isAligned ? primaryColor : (isDark ? Colors.dark.text : Colors.light.text),
                fontWeight: '800',
                fontSize: 18,
                letterSpacing: -0.5,
              },
            ]}
          >
            {getDirectionText()}
          </ThemedText>
        </Animated.View>

        {/* Info Cards */}
        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Feather name="compass" size={18} color={primaryColor} style={{ marginBottom: 6 }} />
            <ThemedText type="h2" style={{ color: primaryColor, fontWeight: '800', fontSize: 26, letterSpacing: -1 }}>
              {qiblaDirection}°
            </ThemedText>
            <ThemedText type="caption" secondary style={{ marginTop: 4, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
              QIBLA BEARING
            </ThemedText>
          </View>

          <View style={styles.infoCard}>
            <Feather name="map-pin" size={18} color={goldColor} style={{ marginBottom: 6 }} />
            <ThemedText type="h2" style={{ color: goldColor, fontWeight: '800', fontSize: 26, letterSpacing: -1 }}>
              {distanceToMecca.toLocaleString()}
            </ThemedText>
            <ThemedText type="caption" secondary style={{ marginTop: 4, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
              KM TO MECCA
            </ThemedText>
          </View>
        </View>

        {/* Find Nearby Mosques Button */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('MosqueFinder');
          }}
          style={[styles.mosquesButton, {
            backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)',
            borderColor: isDark ? 'rgba(52, 211, 153, 0.3)' : 'rgba(16, 185, 129, 0.3)',
          }]}
        >
          <Feather name="map" size={18} color={primaryColor} />
          <ThemedText type="body" style={{ color: primaryColor, fontWeight: '600', marginLeft: Spacing.sm }}>
            Find Nearby Mosques
          </ThemedText>
          <Feather name="chevron-right" size={18} color={primaryColor} style={{ marginLeft: 'auto' }} />
        </Pressable>

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
    width: COMPASS_SIZE + 35,
    height: COMPASS_SIZE + 35,
    alignItems: "center",
    justifyContent: "center",
  },
  glowRing: {
    position: "absolute",
    width: COMPASS_SIZE + 28,
    height: COMPASS_SIZE + 28,
    borderRadius: (COMPASS_SIZE + 28) / 2,
    borderWidth: 4,
  },
  compassOuter: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  compassInner: {
    width: INNER_RING_SIZE,
    height: INNER_RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  innerRing: {
    width: INNER_RING_SIZE,
    height: INNER_RING_SIZE,
    borderRadius: INNER_RING_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  directionLabelContainer: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
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
    width: 50,
    height: 50,
    borderRadius: 25,
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
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 65,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginBottom: -11,
  },
  centerDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
