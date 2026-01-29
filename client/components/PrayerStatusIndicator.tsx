import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PrayerStatus } from '../types/prayerLog';
import { useTheme } from '../hooks/useTheme';

interface PrayerStatusIndicatorProps {
  status: PrayerStatus;
  onStatusChange: (status: PrayerStatus) => void;
  size?: 'compact' | 'normal';
  showLabels?: boolean;
  disabled?: boolean;
}

// Status cycle order and display info
const STATUS_CYCLE: Array<{ status: PrayerStatus; icon: string; color: string; label: string }> = [
  { status: 'unmarked', icon: 'circle', color: 'transparent', label: '' },
  { status: 'prayed', icon: 'check', color: '#10B981', label: 'Prayed' },
  { status: 'late', icon: 'clock', color: '#F59E0B', label: 'Late' },
  { status: 'missed', icon: 'x', color: '#EF4444', label: 'Missed' },
];

// Legacy function for backwards compatibility
export function getNextStatus(current: PrayerStatus): PrayerStatus {
  const currentIndex = STATUS_CYCLE.findIndex(s => s.status === current);
  const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
  return STATUS_CYCLE[nextIndex].status;
}

export function PrayerStatusIndicator({
  status,
  onStatusChange,
  size = 'compact',
  disabled = false,
}: PrayerStatusIndicatorProps) {
  const { isDark } = useTheme();
  const [showLabel, setShowLabel] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sizeConfig = {
    compact: { button: 32, icon: 16, fontSize: 10 },
    normal: { button: 40, icon: 20, fontSize: 12 },
  };

  const config = sizeConfig[size];

  const currentStatusInfo = STATUS_CYCLE.find(s => s.status === status) || STATUS_CYCLE[0];
  const isUnmarked = status === 'unmarked';

  // Show label briefly when status changes (not on initial render)
  const handlePress = () => {
    if (disabled) return;
    const nextStatus = getNextStatus(status);
    onStatusChange(nextStatus);

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
      {/* Status label - shows briefly after tap, positioned above button */}
      {showLabel && !isUnmarked && (
        <Animated.Text
          style={{
            position: 'absolute',
            bottom: config.button + 4,
            left: -10,
            fontSize: config.fontSize,
            color: currentStatusInfo.color,
            fontWeight: '600',
            opacity: fadeAnim,
            backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 6,
            overflow: 'hidden',
            zIndex: 10,
          }}
        >
          {currentStatusInfo.label}
        </Animated.Text>
      )}

      {/* Single tap-to-cycle button */}
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          {
            width: config.button,
            height: config.button,
            borderRadius: config.button / 2,
            backgroundColor: isUnmarked
              ? (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)')
              : currentStatusInfo.color,
            borderWidth: isUnmarked ? 1.5 : 0,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
            opacity: pressed ? 0.7 : (disabled ? 0.4 : 1),
          },
        ]}
      >
        {!isUnmarked && (
          <Feather
            name={currentStatusInfo.icon as any}
            size={config.icon}
            color="#FFFFFF"
          />
        )}
      </Pressable>
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
