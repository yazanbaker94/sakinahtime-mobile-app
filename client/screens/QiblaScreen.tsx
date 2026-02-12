import React, { useMemo, useEffect, useRef } from "react";
import { View, StyleSheet, Platform, Pressable, useWindowDimensions } from "react-native";
import { SvgXml } from "react-native-svg";
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
import { useTranslation } from "@/hooks/useTranslation";

// SVG compass assets — dark and light variants
import {
  compassRingDarkSvg, compassRingLightSvg,
  needleDarkSvg, needleLightSvg,
  kaabaIconDarkSvg, kaabaIconLightSvg,
} from "@/constants/qiblaCompassSvg";

// Hook to get responsive compass size
const useCompassSize = () => {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const availableWidth = width - 80;
    const availableHeight = height * 0.42;
    const compassSize = Math.min(
      Math.max(availableWidth * 0.85, 220),
      Math.min(availableHeight, 340)
    );
    return compassSize;
  }, [width, height]);
};

export default function QiblaScreen() {
  const { t } = useTranslation();
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
  const compassSize = useCompassSize();

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



  // Kaaba position on compass edge — radius is ~65% of compass size (matching SVG coordinate system)
  const kaabaRadius = compassSize * 0.38;
  const kaabaSize = compassSize * 0.12; // ~12% of compass for kaaba icon

  const kaabaAnimStyle = useAnimatedStyle(() => {
    // Angle relative to compass: qibla bearing stays on the rotating ring
    const angle = qiblaDirection;
    const angleRad = ((angle - 90) * Math.PI) / 180;
    const x = Math.cos(angleRad) * kaabaRadius;
    const y = Math.sin(angleRad) * kaabaRadius;
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        // Counter-rotate to keep Kaaba upright as compass rotates
        { rotate: `${-(smoothRotation.value)}deg` },
      ],
    };
  }, [qiblaDirection, kaabaRadius, smoothRotation]);

  const getDirectionText = () => {
    if (direction === "aligned") return t('qibla.facingQibla');
    const turnDegrees = Math.round(relativeAngle);
    if (direction === "left") return `${t('qibla.turnLeft')} ${turnDegrees}°`;
    return `${t('qibla.turnRight')} ${turnDegrees}°`;
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
              {t('prayer.locationRequired')}
            </ThemedText>
            <ThemedText type="body" secondary style={styles.permissionText}>
              {t('qibla.locationRequiredQibla')}
            </ThemedText>
            {Platform.OS === "web" ? (
              <ThemedText type="small" secondary style={styles.permissionText}>
                {t('prayer.browserLocationHint')}
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
                  {t('prayer.enableLocation')}
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
                  {t('prayer.openSettings')}
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
            {locationLoading ? t('qibla.gettingLocation') : t('qibla.initializingCompass')}
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
              <Feather name="map-pin" size={15} color={isDark ? '#FFFFFF' : '#000000'} />
              <ThemedText type="small" style={{
                marginLeft: 7,
                color: isDark ? '#FFFFFF' : '#000000',
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
            <Feather name="home" size={16} color={isDark ? '#FFFFFF' : '#000000'} />
            <ThemedText type="caption" style={{ color: isDark ? '#FFFFFF' : '#000000', fontWeight: '600', fontSize: 12 }}>
              {t('qibla.mosques')}
            </ThemedText>
          </Pressable>
        </View>

        {/* SVG Compass */}
        <View style={[styles.compassWrapper, {
          width: compassSize + 20,
          height: compassSize + 20,
        }]}>
          {/* Subtle outer glow ring - changes when locked */}
          <View style={[styles.glowRing, {
            width: compassSize + 12,
            height: compassSize + 12,
            borderRadius: (compassSize + 12) / 2,
            borderColor: isLocked ? primaryColor : `${primaryColor}20`,
            borderWidth: isLocked ? 3 : 2,
          }]} />

          {/* Compass container */}
          <View style={{
            width: compassSize,
            height: compassSize,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Layer 1: Compass Ring — rotates with device heading */}
            <Animated.View style={[{
              position: 'absolute',
              width: compassSize,
              height: compassSize,
            }, compassRotationStyle]}>
              <SvgXml
                xml={isDark ? compassRingDarkSvg : compassRingLightSvg}
                width={compassSize}
                height={compassSize}
              />

              {/* Layer 2: Kaaba Icon — positioned on ring edge at qibla bearing */}
              <Animated.View
                style={[{
                  position: 'absolute',
                  width: kaabaSize,
                  height: kaabaSize,
                  left: compassSize / 2 - kaabaSize / 2,
                  top: compassSize / 2 - kaabaSize / 2,
                }, kaabaAnimStyle]}
              >
                <SvgXml
                  xml={isDark ? kaabaIconDarkSvg : kaabaIconLightSvg}
                  width={kaabaSize}
                  height={kaabaSize}
                />
              </Animated.View>
            </Animated.View>

            <View style={{
              width: compassSize,
              height: compassSize,
              position: 'absolute',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <SvgXml
                xml={isDark ? needleDarkSvg : needleLightSvg}
                width={compassSize}
                height={compassSize}
              />
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
            {isLocked ? t('qibla.directionLocked') : getDirectionText()}
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
            {isLocked ? t('qibla.tapToUnlock') : t('qibla.lockDirection')}
          </ThemedText>
        </Pressable>

        {/* Info Cards - All 3 on one row */}
        <View style={styles.infoContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <View style={[styles.infoCard, { flex: 1 }]}>
              <Feather name="navigation" size={16} color={isDark ? '#FFFFFF' : '#000000'} style={{ marginBottom: 4 }} />
              <ThemedText type="h3" style={{ fontWeight: '800', fontSize: 20, letterSpacing: -0.5, color: isDark ? '#FFFFFF' : '#000000' }}>
                {heading}°
              </ThemedText>
              <ThemedText type="caption" style={{ marginTop: 2, fontSize: 8, fontWeight: '700', letterSpacing: 0.3, color: isDark ? '#FFFFFF' : '#000000', opacity: 0.7 }}>
                {t('qibla.heading')}
              </ThemedText>
            </View>

            <View style={[styles.infoCard, { flex: 1 }]}>
              <Feather name="compass" size={16} color={isDark ? '#FFFFFF' : '#000000'} style={{ marginBottom: 4 }} />
              <ThemedText type="h3" style={{ color: isDark ? '#FFFFFF' : '#000000', fontWeight: '800', fontSize: 20, letterSpacing: -0.5 }}>
                {qiblaDirection}°
              </ThemedText>
              <ThemedText type="caption" style={{ marginTop: 2, fontSize: 8, fontWeight: '700', letterSpacing: 0.3, color: isDark ? '#FFFFFF' : '#000000', opacity: 0.7 }}>
                {t('qibla.qiblaLabel')}
              </ThemedText>
            </View>

            <View style={[styles.infoCard, { flex: 1 }]}>
              <Feather name="map-pin" size={16} color={isDark ? '#FFFFFF' : '#000000'} style={{ marginBottom: 4 }} />
              <ThemedText type="h3" style={{ color: isDark ? '#FFFFFF' : '#000000', fontWeight: '800', fontSize: 20, letterSpacing: -0.5 }}>
                {distanceToMecca.toLocaleString()}
              </ThemedText>
              <ThemedText type="caption" style={{ marginTop: 2, fontSize: 8, fontWeight: '700', letterSpacing: 0.3, color: isDark ? '#FFFFFF' : '#000000', opacity: 0.7 }}>
                {t('qibla.km')}
              </ThemedText>
            </View>
          </View>

          {/* Calibration hint if needed */}
          {showCalibrationHint && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <Feather name="info" size={12} color={goldColor} />
              <ThemedText type="caption" style={{ marginLeft: 6, color: goldColor, fontWeight: '500', fontSize: 11 }}>
                {t('qibla.calibrateShort')}
              </ThemedText>
            </View>
          )}
        </View>


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
                ? t('qibla.compassNotAvailableWeb')
                : compassError || t('qibla.compassNotAvailable')}
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
    flexDirection: "column",
    gap: Spacing.md,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  infoCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
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
