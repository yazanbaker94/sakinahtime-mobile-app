import React, { useMemo } from "react";
import { View, StyleSheet, Platform, Pressable } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useLocation } from "@/hooks/useLocation";
import {
  useCompass,
  calculateQiblaDirection,
  calculateDistanceToMecca,
  getDirectionLabel,
} from "@/hooks/useCompass";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  useDerivedValue,
} from "react-native-reanimated";

const COMPASS_SIZE = 300;

export default function QiblaScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();

  const {
    latitude,
    longitude,
    city,
    loading: locationLoading,
    error: locationError,
    permission,
    requestPermission,
    openSettings,
    canAskAgain,
  } = useLocation();

  const { heading, available: compassAvailable, error: compassError } = useCompass();

  const qiblaDirection = useMemo(() => {
    if (latitude === null || longitude === null) return 0;
    return calculateQiblaDirection(latitude, longitude);
  }, [latitude, longitude]);

  const distanceToMecca = useMemo(() => {
    if (latitude === null || longitude === null) return 0;
    return calculateDistanceToMecca(latitude, longitude);
  }, [latitude, longitude]);

  const relativeQibla = (qiblaDirection - heading + 360) % 360;
  const isAligned = Math.abs(relativeQibla) < 5 || Math.abs(relativeQibla - 360) < 5;

  const alignmentProgress = useDerivedValue(() => {
    const diff = Math.min(Math.abs(relativeQibla), Math.abs(relativeQibla - 360));
    return diff < 5 ? 1 : 0;
  }, [relativeQibla]);

  const compassRotationStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withSpring(`${-heading}deg`, {
            damping: 15,
            stiffness: 100,
          }),
        },
      ],
    };
  });

  const needleGlowStyle = useAnimatedStyle(() => {
    const glowColor = interpolateColor(
      alignmentProgress.value,
      [0, 1],
      ["transparent", isDark ? Colors.dark.primary : Colors.light.primary]
    );
    return {
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: alignmentProgress.value * 0.8,
      shadowRadius: 20,
    };
  });

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

        <View style={styles.compassContainer}>
          <Animated.View style={[styles.compass, compassRotationStyle]}>
            <View
              style={[
                styles.compassOuter,
                {
                  backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault,
                  borderColor: isDark ? Colors.dark.border : Colors.light.border,
                },
              ]}
            >
              {["N", "E", "S", "W"].map((dir, index) => (
                <ThemedText
                  key={dir}
                  type="h4"
                  style={[
                    styles.directionLabel,
                    {
                      color: dir === "N" ? (isDark ? Colors.dark.primary : Colors.light.primary) : theme.text,
                    },
                    index === 0 && styles.directionN,
                    index === 1 && styles.directionE,
                    index === 2 && styles.directionS,
                    index === 3 && styles.directionW,
                  ]}
                >
                  {dir}
                </ThemedText>
              ))}

              <View
                style={[
                  styles.qiblaIndicator,
                  {
                    transform: [{ rotate: `${qiblaDirection}deg` }, { translateY: -COMPASS_SIZE / 2 + 35 }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.kaabaIcon,
                    {
                      backgroundColor: isDark ? Colors.dark.gold : Colors.light.gold,
                    },
                  ]}
                >
                  <Feather name="navigation" size={16} color="#FFFFFF" />
                </View>
              </View>

              {[...Array(36)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.tick,
                    i % 9 === 0 ? styles.majorTick : styles.minorTick,
                    {
                      transform: [{ rotate: `${i * 10}deg` }],
                      backgroundColor: i % 9 === 0 ? theme.text : (isDark ? Colors.dark.muted : Colors.light.muted),
                    },
                  ]}
                />
              ))}
            </View>
          </Animated.View>

          <Animated.View style={[styles.needleContainer, needleGlowStyle]}>
            <View
              style={[
                styles.needle,
                {
                  backgroundColor: isAligned
                    ? (isDark ? Colors.dark.primary : Colors.light.primary)
                    : (isDark ? Colors.dark.gold : Colors.light.gold),
                },
              ]}
            />
            <View
              style={[
                styles.needleCenter,
                {
                  backgroundColor: isDark ? Colors.dark.backgroundDefault : Colors.light.backgroundDefault,
                  borderColor: isAligned
                    ? (isDark ? Colors.dark.primary : Colors.light.primary)
                    : (isDark ? Colors.dark.gold : Colors.light.gold),
                },
              ]}
            />
          </Animated.View>
        </View>

        <View style={styles.infoContainer}>
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault,
              },
            ]}
          >
            <ThemedText type="h2" style={{ color: isDark ? Colors.dark.primary : Colors.light.primary }}>
              {qiblaDirection}°
            </ThemedText>
            <ThemedText type="small" secondary>
              {getDirectionLabel(qiblaDirection)} Direction
            </ThemedText>
          </View>

          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: isDark ? Colors.dark.backgroundSecondary : Colors.light.backgroundDefault,
              },
            ]}
          >
            <ThemedText type="h2" style={{ color: isDark ? Colors.dark.gold : Colors.light.gold }}>
              {distanceToMecca.toLocaleString()}
            </ThemedText>
            <ThemedText type="small" secondary>
              km to Mecca
            </ThemedText>
          </View>
        </View>

        {isAligned ? (
          <View
            style={[
              styles.alignedBadge,
              { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary },
            ]}
          >
            <Feather name="check-circle" size={16} color="#FFFFFF" />
            <ThemedText type="small" style={{ color: "#FFFFFF", marginLeft: Spacing.xs }}>
              Facing Qibla
            </ThemedText>
          </View>
        ) : null}

        {!compassAvailable || compassError ? (
          <View style={styles.warningContainer}>
            <Feather name="alert-circle" size={16} color={isDark ? Colors.dark.gold : Colors.light.gold} />
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
  compassContainer: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["3xl"],
  },
  compass: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  compassOuter: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  directionLabel: {
    position: "absolute",
  },
  directionN: {
    top: 20,
  },
  directionE: {
    right: 20,
  },
  directionS: {
    bottom: 20,
  },
  directionW: {
    left: 20,
  },
  tick: {
    position: "absolute",
    width: 2,
    top: 5,
    transformOrigin: `1px ${COMPASS_SIZE / 2 - 5}px`,
  },
  majorTick: {
    height: 15,
  },
  minorTick: {
    height: 8,
    opacity: 0.5,
  },
  qiblaIndicator: {
    position: "absolute",
    alignItems: "center",
    transformOrigin: `0px ${COMPASS_SIZE / 2 - 35}px`,
  },
  kaabaIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  needleContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  needle: {
    width: 4,
    height: 80,
    borderRadius: 2,
    position: "absolute",
    top: -40,
  },
  needleCenter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
  },
  infoContainer: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  infoCard: {
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    minWidth: 120,
  },
  alignedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing["2xl"],
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing["2xl"],
    paddingHorizontal: Spacing.lg,
  },
  warningText: {
    marginLeft: Spacing.sm,
  },
});
