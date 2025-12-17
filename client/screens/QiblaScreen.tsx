import React, { useMemo, useEffect, useRef } from "react";
import { View, StyleSheet, Platform, Pressable } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
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
  Easing,
} from "react-native-reanimated";

const COMPASS_SIZE = 280;
const INNER_RING_SIZE = COMPASS_SIZE - 40;
const QIBLA_INDICATOR_RADIUS = INNER_RING_SIZE / 2 - 30;

export default function QiblaScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { isDark } = useTheme();
  const wasAlignedRef = useRef(false);
  const glowOpacity = useSharedValue(0);

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
    } else if (!isAligned && wasAlignedRef.current) {
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
    wasAlignedRef.current = isAligned;
  }, [isAligned, glowOpacity]);

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
    };
  });

  const qiblaIndicatorStyle = useMemo(() => {
    const angleRad = ((qiblaDirection - 90) * Math.PI) / 180;
    const x = Math.cos(angleRad) * QIBLA_INDICATOR_RADIUS;
    const y = Math.sin(angleRad) * QIBLA_INDICATOR_RADIUS;
    return {
      transform: [{ translateX: x }, { translateY: y }],
    };
  }, [qiblaDirection]);

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
                { backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundSecondary },
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
            {permission?.status === "denied" && !canAskAgain ? (
              Platform.OS !== "web" ? (
                <Pressable
                  onPress={openSettings}
                  style={[styles.permissionButton, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}
                >
                  <ThemedText type="body" style={{ color: "#FFFFFF" }}>
                    Open Settings
                  </ThemedText>
                </Pressable>
              ) : (
                <ThemedText type="small" secondary style={styles.permissionText}>
                  Please enable location in your browser settings.
                </ThemedText>
              )
            ) : (
              <Pressable
                onPress={requestPermission}
                style={[styles.permissionButton, { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }]}
              >
                <ThemedText type="body" style={{ color: "#FFFFFF" }}>
                  Enable Location
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
  const goldColor = isDark ? Colors.dark.gold : Colors.light.gold;
  const bgSecondary = isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundSecondary;
  const borderColor = isDark ? Colors.dark.border : Colors.light.border;
  const mutedColor = isDark ? Colors.dark.muted : Colors.light.muted;

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
        {city ? (
          <View style={styles.locationBadge}>
            <Feather name="map-pin" size={14} color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} />
            <ThemedText type="small" secondary style={styles.locationText}>
              {city}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.compassWrapper}>
          <Animated.View style={[styles.glowRing, { borderColor: primaryColor }, glowStyle]} />
          
          <View style={[styles.compassOuter, { backgroundColor: bgSecondary, borderColor }]}>
            <Animated.View style={[styles.compassInner, compassRotationStyle]}>
              <View style={[styles.innerRing, { borderColor: mutedColor }]}>
                {["N", "E", "S", "W"].map((dir, index) => {
                  const angle = index * 90;
                  const angleRad = ((angle - 90) * Math.PI) / 180;
                  const radius = INNER_RING_SIZE / 2 - 25;
                  const x = Math.cos(angleRad) * radius;
                  const y = Math.sin(angleRad) * radius;
                  
                  return (
                    <ThemedText
                      key={dir}
                      type="h4"
                      style={[
                        styles.directionLabel,
                        {
                          color: dir === "N" ? primaryColor : mutedColor,
                          transform: [{ translateX: x - 10 }, { translateY: y - 12 }],
                        },
                      ]}
                    >
                      {dir}
                    </ThemedText>
                  );
                })}

                {[...Array(72)].map((_, i) => {
                  const angle = i * 5;
                  const isMajor = i % 18 === 0;
                  const isMinor = i % 9 === 0 && !isMajor;
                  const tickLength = isMajor ? 12 : isMinor ? 8 : 4;
                  const tickWidth = isMajor ? 2 : 1;
                  const radius = INNER_RING_SIZE / 2 - 3;
                  const angleRad = ((angle - 90) * Math.PI) / 180;
                  const x1 = Math.cos(angleRad) * radius;
                  const y1 = Math.sin(angleRad) * radius;
                  const x2 = Math.cos(angleRad) * (radius - tickLength);
                  const y2 = Math.sin(angleRad) * (radius - tickLength);
                  
                  return (
                    <View
                      key={i}
                      style={[
                        styles.tick,
                        {
                          width: tickWidth,
                          height: tickLength,
                          backgroundColor: isMajor ? (isDark ? Colors.dark.text : Colors.light.text) : mutedColor,
                          left: INNER_RING_SIZE / 2 - tickWidth / 2,
                          top: 3,
                          transform: [{ rotate: `${angle}deg` }],
                          transformOrigin: `${tickWidth / 2}px ${INNER_RING_SIZE / 2 - 3}px`,
                          opacity: isMajor ? 1 : isMinor ? 0.7 : 0.4,
                        },
                      ]}
                    />
                  );
                })}

                <View
                  style={[
                    styles.qiblaIndicator,
                    qiblaIndicatorStyle,
                  ]}
                >
                  <View style={[styles.kaabaCircle, { backgroundColor: goldColor }]}>
                    <View style={styles.kaabaSquare} />
                  </View>
                </View>
              </View>
            </Animated.View>

            <View style={styles.centerPoint}>
              <View style={[styles.pointerUp, { borderBottomColor: isAligned ? primaryColor : goldColor }]} />
              <View style={[styles.centerDot, { backgroundColor: isAligned ? primaryColor : goldColor }]} />
            </View>
          </View>
        </View>

        <View
          style={[
            styles.directionIndicator,
            {
              backgroundColor: isAligned ? primaryColor : bgSecondary,
              borderColor: isAligned ? primaryColor : borderColor,
            },
          ]}
        >
          <Feather
            name={getDirectionIcon()}
            size={20}
            color={isAligned ? "#FFFFFF" : (isDark ? Colors.dark.text : Colors.light.text)}
          />
          <ThemedText
            type="body"
            style={[
              styles.directionText,
              { color: isAligned ? "#FFFFFF" : (isDark ? Colors.dark.text : Colors.light.text) },
            ]}
          >
            {getDirectionText()}
          </ThemedText>
          {!isAligned ? (
            <Feather
              name={getDirectionIcon()}
              size={20}
              color={isDark ? Colors.dark.text : Colors.light.text}
            />
          ) : null}
        </View>

        <View style={styles.infoContainer}>
          <View style={[styles.infoCard, { backgroundColor: bgSecondary }]}>
            <ThemedText type="h3" style={{ color: primaryColor }}>
              {qiblaDirection}°
            </ThemedText>
            <ThemedText type="caption" secondary>
              Qibla Bearing
            </ThemedText>
          </View>

          <View style={[styles.infoCard, { backgroundColor: bgSecondary }]}>
            <ThemedText type="h3" style={{ color: goldColor }}>
              {distanceToMecca.toLocaleString()}
            </ThemedText>
            <ThemedText type="caption" secondary>
              km to Mecca
            </ThemedText>
          </View>
        </View>

        {accuracy !== "high" && compassAvailable ? (
          <View style={styles.calibrationHint}>
            <Feather name="info" size={14} color={mutedColor} />
            <ThemedText type="caption" secondary style={styles.calibrationText}>
              Move your phone in a figure-8 pattern to calibrate
            </ThemedText>
          </View>
        ) : null}

        {!compassAvailable || compassError ? (
          <View style={styles.warningContainer}>
            <Feather name="alert-circle" size={16} color={goldColor} />
            <ThemedText type="small" secondary style={styles.warningText}>
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
  },
  permissionContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
  },
  permissionTitle: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  permissionText: {
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  permissionButton: {
    paddingHorizontal: Spacing["3xl"],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  locationText: {
    marginLeft: Spacing.xs,
  },
  compassWrapper: {
    width: COMPASS_SIZE + 20,
    height: COMPASS_SIZE + 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
  },
  glowRing: {
    position: "absolute",
    width: COMPASS_SIZE + 16,
    height: COMPASS_SIZE + 16,
    borderRadius: (COMPASS_SIZE + 16) / 2,
    borderWidth: 3,
  },
  compassOuter: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 2,
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
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  directionLabel: {
    position: "absolute",
    width: 20,
    textAlign: "center",
    fontWeight: "600",
  },
  tick: {
    position: "absolute",
  },
  qiblaIndicator: {
    position: "absolute",
  },
  kaabaCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  kaabaSquare: {
    width: 14,
    height: 14,
    backgroundColor: "#1F2937",
    borderRadius: 2,
  },
  centerPoint: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  pointerUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 50,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginBottom: -8,
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  directionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginBottom: Spacing["2xl"],
    gap: Spacing.sm,
  },
  directionText: {
    fontWeight: "600",
  },
  infoContainer: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  infoCard: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    minWidth: 110,
  },
  calibrationHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xl,
    gap: Spacing.xs,
  },
  calibrationText: {
    marginLeft: Spacing.xs,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  warningText: {
    marginLeft: Spacing.sm,
  },
});
