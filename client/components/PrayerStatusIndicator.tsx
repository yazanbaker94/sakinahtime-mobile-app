import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PrayerStatus } from '../types/prayerLog';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';

interface PrayerStatusIndicatorProps {
  status: PrayerStatus;
  onStatusChange: (status: PrayerStatus) => void;
  size?: 'compact' | 'normal';
  showLabels?: boolean;
  disabled?: boolean;
  isPastAndUnmarked?: boolean;
  isCurrent?: boolean;
  onCelebrate?: () => void;
}

// Status cycle order and display info - uses t() for translations
function getStatusCycle(t: (key: string) => string): Array<{ status: PrayerStatus; icon: string; color: string; label: string }> {
  return [
    { status: 'unmarked', icon: 'circle', color: 'transparent', label: '' },
    { status: 'prayed', icon: 'check', color: '#10B981', label: t('prayerStatus.prayed') },
    { status: 'late', icon: 'clock', color: '#F59E0B', label: t('prayerStatus.late') },
    { status: 'missed', icon: 'x', color: '#EF4444', label: t('prayerStatus.missed') },
  ];
}

// Legacy function for backwards compatibility
export function getNextStatus(current: PrayerStatus): PrayerStatus {
  const cycle = getStatusCycle((key: string) => {
    const map: Record<string, string> = { 'prayerStatus.prayed': 'Prayed', 'prayerStatus.late': 'Late', 'prayerStatus.missed': 'Missed' };
    return map[key] || key;
  });
  const currentIndex = cycle.findIndex(s => s.status === current);
  const nextIndex = (currentIndex + 1) % cycle.length;
  return cycle[nextIndex].status;
}

export function PrayerStatusIndicator({
  status,
  onStatusChange,
  size = 'compact',
  disabled = false,
  isPastAndUnmarked = false,
  isCurrent = false,
  onCelebrate,
}: PrayerStatusIndicatorProps) {
  const { isDark, theme } = useTheme();
  const { t } = useTranslation();
  const STATUS_CYCLE = getStatusCycle(t);
  const [showLabel, setShowLabel] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sizeConfig = {
    compact: { button: 32, icon: 16, fontSize: 10 },
    normal: { button: 40, icon: 20, fontSize: 12 },
  };

  const config = sizeConfig[size];

  const currentStatusInfo = STATUS_CYCLE.find(s => s.status === status) || STATUS_CYCLE[0];
  const isUnmarked = status === 'unmarked';
  const showPastFill = isPastAndUnmarked && isUnmarked;
  const showCurrentPulse = isCurrent && isUnmarked;

  // Gentle pulse animation for active/current prayer
  useEffect(() => {
    if (showCurrentPulse) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.7, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(0.4);
    }
  }, [showCurrentPulse, pulseAnim]);

  // Show label briefly when status changes (not on initial render)
  const handlePress = () => {
    if (disabled) return;
    const nextStatus = getNextStatus(status);
    onStatusChange(nextStatus);

    // Haptic feedback — HEAVY impact + success notification for "prayed"
    try {
      if (nextStatus === 'prayed') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        // Double-tap success for maximum satisfaction
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 120);
        // Fire celebration callback
        if (onCelebrate) {
          onCelebrate();
        }
      } else if (nextStatus !== 'unmarked') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (_) {
      // Haptics not available on this device
    }

    // Dramatic shrink-bounce animation
    if (nextStatus !== 'unmarked') {
      scaleAnim.setValue(0.3); // Shrink down dramatically
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,   // Less friction = more overshoot bounce
        tension: 180,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(1);
    }

    // Show label briefly for non-unmarked states
    if (nextStatus !== 'unmarked') {
      // Clear any existing timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      setShowLabel(true);
      fadeAnim.setValue(1);

      // Hide after 2 seconds with fade
      hideTimeoutRef.current = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowLabel(false);
        });
      }, 2000);
    } else {
      setShowLabel(false);
      fadeAnim.setValue(0);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Single tap-to-cycle button with spring animation */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={handlePress}
          disabled={disabled}
          style={({ pressed }) => [
            styles.button,
            {
              width: config.button,
              height: config.button,
              borderRadius: config.button / 2,
              backgroundColor: showCurrentPulse
                ? `${theme.primary}30`
                : showPastFill
                  ? (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)')
                  : isUnmarked
                    ? (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)')
                    : currentStatusInfo.color,
              borderWidth: (isUnmarked && !showPastFill && !showCurrentPulse) ? 1.5 : showCurrentPulse ? 2 : 0,
              borderColor: showCurrentPulse ? `${theme.primary}50` : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.25)'),
              opacity: pressed ? 0.7 : (disabled ? 0.4 : 1),
            },
          ]}
        >
          {showCurrentPulse && (
            <Animated.View style={{
              position: 'absolute',
              width: config.button,
              height: config.button,
              borderRadius: config.button / 2,
              backgroundColor: theme.primary,
              opacity: pulseAnim,
            }} />
          )}
          {showPastFill && (
            <Feather
              name="check"
              size={config.icon - 2}
              color={isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)'}
            />
          )}
          {!isUnmarked && !showPastFill && (
            <Feather
              name={currentStatusInfo.icon as any}
              size={config.icon}
              color="#FFFFFF"
            />
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PrayerStatusIndicator;
