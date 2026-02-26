import React, { useMemo, useEffect, useRef } from "react";
import { View, StyleSheet, Platform, Pressable, useWindowDimensions } from "react-native";
import { Image } from 'expo-image';
import { ThemedText } from "@/components/ThemedText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TAB_BAR_HEIGHT, TAB_BAR_BOTTOM_BASE } from "@/navigation/MainTabNavigator";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Spacing } from "@/constants/theme";
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
  withTiming,
  withSpring,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import { useTranslation } from "@/hooks/useTranslation";
import { usePrayerColorStore } from "@/stores/usePrayerColorStore";
import { MosqueApiService } from "@/services/MosqueApiService";
import { DEFAULT_RADIUS } from "@/constants/mosque";
import Svg, { Line, Text as SvgText } from 'react-native-svg';

// 3D assets
const kaabaPng = require('../../assets/images/qibla3d/kaaba.png');
const needlePng = require('../../assets/images/qibla3d/needle.png');

// Hook to get responsive compass size
const useCompassSize = () => {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const availableWidth = width - 40;
    const availableHeight = height * 0.45;
    const compassSize = Math.min(
      Math.max(availableWidth * 0.88, 260),
      Math.min(availableHeight, 400)
    );
    return compassSize;
  }, [width, height]);
};

// Cardinal directions positioned on the ring
const CARDINALS = [
  { label: 'N', angle: 0 },
  { label: 'E', angle: 90 },
  { label: 'S', angle: 180 },
  { label: 'W', angle: 270 },
];

export default function QiblaScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + Spacing.md;
  const bottomPadding = TAB_BAR_HEIGHT + Math.max(insets.bottom, TAB_BAR_BOTTOM_BASE) + Spacing.md;
  const { theme, isDark } = useTheme();
  useKeepAwake();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const wasAlignedRef = useRef(false);
  const compassInitializedRef = useRef(false);
  const prevHeadingRef = useRef<number | null>(null);
  const targetRotationRef = useRef(0);

  const smoothRotation = useSharedValue(0);

  // Alignment animation values
  const alignmentProgress = useSharedValue(0); // 0 = unaligned, 1 = aligned
  const kaabaGlowScale = useSharedValue(1);

  // Dynamic prayer color
  const dynamicColor = usePrayerColorStore((s) => s.dynamicColor);

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
    locationMode,
    manualLocation,
  } = useLocation();

  const { heading, available: compassAvailable, error: compassError, accuracy } = useCompass();

  // Prefetch mosque data silently so MosqueFinderScreen loads instantly
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      MosqueApiService.prefetchNearbyMosques(latitude, longitude, DEFAULT_RADIUS);
    }
  }, [latitude, longitude]);

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

  // Asymmetric hysteresis: snap IN at ≤2°, snap OUT at >6°
  const isAligned = useMemo(() => {
    if (wasAlignedRef.current) {
      // Currently aligned — only un-align if drift exceeds 6°
      return relativeAngle <= 6;
    } else {
      // Not aligned — require precision of ≤2° to snap in
      return relativeAngle <= 2;
    }
  }, [relativeAngle]);
  const lastHapticRef = useRef<number>(0);
  const lastHeadingRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isFocused || Platform.OS !== "ios" || isAligned) return;
    if (!permission?.granted && !hasManualLocation) return;
    if (heading === null) return;

    if (lastHeadingRef.current !== null) {
      const headingChange = Math.abs(heading - lastHeadingRef.current);
      if (headingChange < 2 && headingChange !== 0) return;
    }
    lastHeadingRef.current = heading;

    const now = Date.now();
    const minInterval = 40;

    if (now - lastHapticRef.current > minInterval) {
      lastHapticRef.current = now;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [heading, isFocused, isAligned]);

  // Alignment haptics + animation
  useEffect(() => {
    if (!isFocused) return;
    if (!permission?.granted && !hasManualLocation) return;

    if (isAligned && !wasAlignedRef.current) {
      // Heavy success haptic
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Double-tap for extra satisfaction
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 150);
      }
      // Animate alignment
      alignmentProgress.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
      kaabaGlowScale.value = withSpring(1.15, { damping: 6, stiffness: 200 });
    } else if (!isAligned && wasAlignedRef.current) {
      // Animate un-alignment
      alignmentProgress.value = withTiming(0, { duration: 300 });
      kaabaGlowScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    }
    wasAlignedRef.current = isAligned;
  }, [isAligned, isFocused, alignmentProgress, kaabaGlowScale]);

  // Smooth rotation (prevent spinning at 0°/360°)
  useEffect(() => {
    if (heading === null) return;

    if (prevHeadingRef.current === null) {
      targetRotationRef.current = -heading;
      smoothRotation.value = -heading;
    } else {
      let delta = heading - prevHeadingRef.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      targetRotationRef.current = targetRotationRef.current - delta;

      if (Platform.OS === 'android') {
        smoothRotation.value = withTiming(targetRotationRef.current, {
          duration: 120,
          easing: Easing.out(Easing.quad),
        });
      } else {
        smoothRotation.value = targetRotationRef.current;
      }
    }

    prevHeadingRef.current = heading;
  }, [heading, smoothRotation]);

  const compassRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${smoothRotation.value}deg` }],
  }));

  // Kaaba orbit position
  const kaabaRadius = compassSize * 0.38;
  const kaabaSize = compassSize * 0.18; // Bigger for 3D asset

  // Kaaba now renders as a SEPARATE layer (above ring, below needle)
  // Position is in screen-space: qiblaDirection + smoothRotation gives the visual angle
  const kaabaAnimStyle = useAnimatedStyle(() => {
    // Screen-space angle: ring rotation + qibla bearing
    // When aligned, snap to 0° (top = needle tip)
    const screenAngle = alignmentProgress.value > 0.5
      ? 0 // snap dead-center to needle
      : qiblaDirection + smoothRotation.value;
    const angleRad = ((screenAngle - 90) * Math.PI) / 180;
    const x = Math.cos(angleRad) * kaabaRadius;
    const y = Math.sin(angleRad) * kaabaRadius;
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        // No rotation needed — Kaaba is outside the rotating ring, naturally upright
        { scale: kaabaGlowScale.value },
      ],
      opacity: 0.6 + (alignmentProgress.value * 0.4),
    };
  }, [qiblaDirection, kaabaRadius, smoothRotation, alignmentProgress, kaabaGlowScale]);

  // Golden glow behind Kaaba when aligned — single soft blur
  const kaabaGlowStyle = useAnimatedStyle(() => ({
    opacity: alignmentProgress.value * 0.45,
    transform: [
      { scale: 1 + (alignmentProgress.value * 0.5) },
    ],
  }));

  // Needle size
  const needleSize = compassSize * 0.35;

  // Direction helpers
  const getDirectionLabel = () => {
    if (direction === "aligned") return t('qibla.facingQibla');
    if (direction === "left") return t('qibla.turnLeft');
    return t('qibla.turnRight');
  };

  const getDirectionDegrees = () => {
    if (direction === "aligned") return null;
    return `${Math.round(relativeAngle)}°`;
  };

  // Glass colors
  const glassBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.65)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.8)';
  const ringBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.45)';
  const ringBorder = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
  const cardinalColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)';
  const goldColor = '#D4A017';

  // Permission screen (skip if user has a manual location set)
  const hasManualLocation = locationMode === 'manual' && manualLocation;
  if (!permission?.granted && !hasManualLocation) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? theme.backgroundRoot : '#F8F6F3' }]}>
        <View
          style={[
            styles.content,
            {
              paddingTop: topPadding + Spacing.xl,
              paddingBottom: bottomPadding + Spacing.xl,
            },
          ]}
        >
          <View style={styles.permissionContainer}>
            {/* 3D Location Pin with Glow */}
            <View style={{ alignItems: 'center', marginBottom: -40, zIndex: 2 }}>
              {/* Glow behind pin */}
              <View style={{
                position: 'absolute',
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: dynamicColor,
                opacity: 0.12,
                top: 10,
              }} />
              <Image
                source={require('../../assets/images/3d-images/location.webp')}
                style={{ width: 120, height: 120 }}
                contentFit="contain"
                transition={0}
                cachePolicy="memory"
              />
            </View>

            {/* Floating Pedestal Card */}
            <View style={{
              backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
              borderRadius: 24,
              paddingTop: 56,
              paddingBottom: 32,
              paddingHorizontal: 28,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.08,
              shadowRadius: 24,
              elevation: 5,
              width: '100%',
            }}>
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
                  style={({ pressed }) => [styles.permissionButton, {
                    backgroundColor: dynamicColor,
                    shadowColor: dynamicColor,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.35,
                    shadowRadius: 12,
                    elevation: 6,
                    opacity: pressed ? 0.85 : 1,
                    width: '100%',
                  }]}
                >
                  <Feather name="navigation" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: '700', fontSize: 16 }}>
                    {t('prayer.enableLocation')}
                  </ThemedText>
                </Pressable>
              ) : (
                <Pressable
                  onPress={openSettings}
                  style={({ pressed }) => [styles.permissionButton, {
                    backgroundColor: dynamicColor,
                    shadowColor: dynamicColor,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.35,
                    shadowRadius: 12,
                    elevation: 6,
                    opacity: pressed ? 0.85 : 1,
                    width: '100%',
                  }]}
                >
                  <Feather name="settings" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: '700', fontSize: 16 }}>
                    {t('prayer.openSettings')}
                  </ThemedText>
                </Pressable>
              )}

              {/* Escape hatch */}
              <Pressable
                onPress={() => navigation.navigate('LocationSettings' as any)}
                style={({ pressed }) => ({ marginTop: 16, opacity: pressed ? 0.5 : 1 })}
              >
                <ThemedText type="body" style={{ color: '#9CA3AF', fontSize: 14 }}>
                  {t('prayer.enterLocationManually') || 'Enter Location Manually'}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Track compass init
  if (heading !== null) {
    compassInitializedRef.current = true;
  }

  // Only gate on location loading — compass renders immediately with heading defaulting to 0°
  if (locationLoading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? theme.backgroundRoot : '#F8F6F3' }]}>
        <View
          style={[
            styles.content,
            {
              paddingTop: topPadding + Spacing.xl,
              paddingBottom: bottomPadding + Spacing.xl,
            },
          ]}
        >
          <ThemedText type="body" secondary>
            {t('qibla.gettingLocation')}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? theme.backgroundRoot : '#F8F6F3' }]}>
      {/* Dynamic prayer-colored gradient wash */}
      <View style={[StyleSheet.absoluteFill, {
        backgroundColor: `${dynamicColor}${isDark ? '18' : '12'}`,
      }]} />
      {/* Subtle radial glow at top */}
      <View style={{
        position: 'absolute',
        top: -100,
        left: '50%',
        marginLeft: -200,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: `${dynamicColor}${isDark ? '15' : '0A'}`,
      }} />

      <View
        style={[
          styles.content,
          {
            paddingTop: topPadding,
            paddingBottom: bottomPadding,
          },
        ]}
      >
        {/* ── Header Row: Frosted Glass Pills ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: Spacing.lg }}>
          {/* Location Pill */}
          {city ? (
            <Pressable
              onPress={() => navigation.navigate('LocationSettings' as any)}
              style={({ pressed }) => [styles.frostedPill, {
                backgroundColor: pressed ? `${dynamicColor}25` : glassBg,
                borderColor: glassBorder,
              }]}
            >
              <Feather name="map-pin" size={13} color={dynamicColor} />
              <ThemedText type="small" style={{
                marginLeft: 6,
                color: isDark ? '#FFFFFF' : '#1A1A1A',
                fontWeight: '700',
                fontSize: 13,
              }}>
                {city}
              </ThemedText>
            </Pressable>
          ) : <View />}

          {/* Mosques Pill */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('MosqueFinder');
            }}
            style={({ pressed }) => ([
              styles.frostedPill,
              {
                backgroundColor: pressed ? `${dynamicColor}25` : glassBg,
                borderColor: glassBorder,
              },
            ])}
          >
            <Feather name="home" size={14} color={dynamicColor} />
            <ThemedText type="caption" style={{
              marginLeft: 6,
              color: isDark ? '#FFFFFF' : '#1A1A1A',
              fontWeight: '600',
              fontSize: 12,
            }}>
              {t('qibla.mosques')}
            </ThemedText>
          </Pressable>
        </View>

        {/* ── 3D Compass ── */}
        <View style={[styles.compassWrapper, {
          width: compassSize,
          height: compassSize,
        }]}>
          <View style={{
            width: compassSize,
            height: compassSize,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Layer 1: Frosted Glass Ring — rotates with device heading */}
            <Animated.View style={[{
              position: 'absolute',
              width: compassSize,
              height: compassSize,
              overflow: 'visible',
            }, compassRotationStyle]}>
              {/* The ring */}
              <View style={{
                width: compassSize,
                height: compassSize,
                borderRadius: compassSize / 2,
                borderWidth: compassSize * 0.06,
                borderColor: ringBorder,
                backgroundColor: ringBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {/* Inner subtle ring */}
                <View style={{
                  position: 'absolute',
                  width: compassSize * 0.82,
                  height: compassSize * 0.82,
                  borderRadius: compassSize * 0.41,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                }} />
              </View>

              {/* Cardinal letters on the ring */}
              {CARDINALS.map((c) => {
                const angleRad = ((c.angle - 90) * Math.PI) / 180;
                const r = compassSize * 0.39;
                const x = compassSize / 2 + Math.cos(angleRad) * r - 10;
                const y = compassSize / 2 + Math.sin(angleRad) * r - 10;
                const isNorth = c.label === 'N';
                return (
                  <View
                    key={c.label}
                    style={{
                      position: 'absolute',
                      left: x,
                      top: y,
                      width: 20,
                      height: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ThemedText style={{
                      fontSize: 14,
                      fontWeight: '800',
                      color: isNorth ? goldColor : cardinalColor,
                      letterSpacing: 1,
                    }}>
                      {c.label}
                    </ThemedText>
                  </View>
                );
              })}

              {/* Tick marks — single SVG layer instead of 72 Views */}
              <Svg width={compassSize} height={compassSize} style={{ position: 'absolute' }}>
                {Array.from({ length: 72 }, (_, i) => {
                  const angle = i * 5;
                  const isMajor = angle % 30 === 0;
                  const angleRad = (angle * Math.PI) / 180;
                  const outerR = compassSize * 0.465;
                  const innerR = outerR - (isMajor ? 8 : 4);
                  const cx = compassSize / 2;
                  const cy = compassSize / 2;
                  return (
                    <Line
                      key={`tick-${i}`}
                      x1={cx + Math.sin(angleRad) * innerR}
                      y1={cy - Math.cos(angleRad) * innerR}
                      x2={cx + Math.sin(angleRad) * outerR}
                      y2={cy - Math.cos(angleRad) * outerR}
                      stroke={isDark ? (isMajor ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)') : (isMajor ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.05)')}
                      strokeWidth={isMajor ? 2 : 1}
                      strokeLinecap="round"
                    />
                  );
                })}
              </Svg>

            </Animated.View>

            {/* Layer 2: 3D Kaaba — SEPARATE layer ON TOP of frosted glass ring */}
            <Animated.View
              style={[{
                position: 'absolute',
                width: kaabaSize,
                height: kaabaSize,
                left: compassSize / 2 - kaabaSize / 2,
                top: compassSize / 2 - kaabaSize / 2,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                overflow: 'visible',
                zIndex: 10,
              }, kaabaAnimStyle]}
            >
              {/* Soft blurred golden glow */}
              <Animated.View style={[{
                position: 'absolute',
                width: kaabaSize * 0.8,
                height: kaabaSize * 0.8,
                borderRadius: kaabaSize * 0.4,
                backgroundColor: goldColor,
                shadowColor: goldColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 30,
                elevation: 25,
              }, kaabaGlowStyle]} />

              <Image
                source={kaabaPng}
                style={{
                  width: kaabaSize,
                  height: kaabaSize,
                  resizeMode: 'contain',
                }}
              />
            </Animated.View>

            {/* Layer 3: 3D Needle — fixed center, always points up */}
            <View style={{
              width: needleSize,
              height: needleSize,
              alignItems: 'center',
              justifyContent: 'center',
              // Subtle glow behind needle
              shadowColor: goldColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
            }}>
              <Image
                source={needlePng}
                style={{
                  width: needleSize,
                  height: needleSize,
                  resizeMode: 'contain',
                }}
              />
            </View>
          </View>
        </View>

        {/* ── Direction Indicator ── */}
        <View style={[styles.directionIndicator, { height: 60 }]}>
          <ThemedText
            type="body"
            style={{
              color: isAligned ? goldColor : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'),
              fontWeight: '700',
              fontSize: 13,
              letterSpacing: 3,
              textAlign: 'center',
              textTransform: 'uppercase',
            }}
          >
            {isAligned ? '✦ ' + getDirectionLabel() + ' ✦' : getDirectionLabel()}
          </ThemedText>
          {getDirectionDegrees() && (
            <ThemedText
              type="body"
              style={{
                color: isDark ? '#FFFFFF' : '#1A1A1A',
                fontWeight: '800',
                fontSize: 38,
                letterSpacing: -1,
                textAlign: 'center',
                lineHeight: 42,
              }}
            >
              {getDirectionDegrees()}
            </ThemedText>
          )}
        </View>

        {/* ── Frosted Glass Stats Card ── */}
        <View style={[styles.statsCard, {
          backgroundColor: glassBg,
          borderColor: glassBorder,
        }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            {/* Heading */}
            <View style={styles.statItem}>
              <Feather name="navigation" size={16} color={dynamicColor} style={{ marginBottom: 4 }} />
              <ThemedText type="h3" style={{
                fontWeight: '800',
                fontSize: 22,
                letterSpacing: -0.5,
                color: isDark ? '#FFFFFF' : '#1A1A1A',
              }}>
                {heading}°
              </ThemedText>
              <ThemedText type="caption" style={{
                marginTop: 2,
                fontSize: 9,
                fontWeight: '700',
                letterSpacing: 0.5,
                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                textTransform: 'uppercase',
              }}>
                {t('qibla.heading')}
              </ThemedText>
            </View>

            {/* Separator */}
            <View style={{
              width: 1,
              height: '70%',
              alignSelf: 'center',
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }} />

            {/* Qibla */}
            <View style={styles.statItem}>
              <Feather name="compass" size={16} color={dynamicColor} style={{ marginBottom: 4 }} />
              <ThemedText type="h3" style={{
                color: isDark ? '#FFFFFF' : '#1A1A1A',
                fontWeight: '800',
                fontSize: 22,
                letterSpacing: -0.5,
              }}>
                {qiblaDirection}°
              </ThemedText>
              <ThemedText type="caption" style={{
                marginTop: 2,
                fontSize: 9,
                fontWeight: '700',
                letterSpacing: 0.5,
                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                textTransform: 'uppercase',
              }}>
                {t('qibla.qiblaLabel')}
              </ThemedText>
            </View>

            {/* Separator */}
            <View style={{
              width: 1,
              height: '70%',
              alignSelf: 'center',
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }} />

            {/* Distance */}
            <View style={styles.statItem}>
              <Feather name="map-pin" size={16} color={dynamicColor} style={{ marginBottom: 4 }} />
              <ThemedText type="h3" style={{
                color: isDark ? '#FFFFFF' : '#1A1A1A',
                fontWeight: '800',
                fontSize: 22,
                letterSpacing: -0.5,
              }}>
                {distanceToMecca.toLocaleString()}
              </ThemedText>
              <ThemedText type="caption" style={{
                marginTop: 2,
                fontSize: 9,
                fontWeight: '700',
                letterSpacing: 0.5,
                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                textTransform: 'uppercase',
              }}>
                {t('qibla.km')}
              </ThemedText>
            </View>
          </View>


        </View>

        {/* Figure-8 Calibration Warning */}
        {compassAvailable && !compassError && accuracy === 'low' && (
          <View style={[styles.warningContainer, {
            backgroundColor: isDark ? 'rgba(234, 179, 8, 0.15)' : 'rgba(234, 179, 8, 0.1)',
            borderColor: isDark ? 'rgba(234, 179, 8, 0.3)' : 'rgba(234, 179, 8, 0.25)',
          }]}>
            <Feather name="alert-triangle" size={18} color={isDark ? '#EAB308' : '#CA8A04'} />
            <ThemedText type="small" style={{
              marginLeft: 10,
              color: isDark ? '#EAB308' : '#CA8A04',
              fontWeight: '600',
              flex: 1,
            }}>
              {t('qibla.calibrationNeeded') || 'Move your phone in a figure-8 pattern to calibrate the compass'}
            </ThemedText>
          </View>
        )}

        {/* Warning */}
        {!compassAvailable || compassError ? (
          <View style={[styles.warningContainer, {
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.1)',
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
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing["3xl"],
    paddingVertical: Spacing.lg,
    borderRadius: 16,
  },
  frostedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  compassWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  directionIndicator: {
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    justifyContent: "center",
  },
  statsCard: {
    flexDirection: 'column',
    width: '100%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: '90%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
});
