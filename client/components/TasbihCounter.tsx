/**
 * TasbihCounter Component
 * 
 * Interactive counter widget for dhikr counting with haptic feedback.
 */

import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, Animated, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import { useTasbihCounter } from '@/hooks/useTasbihCounter';

interface TasbihCounterProps {
  initialCount?: number;
  targetCount?: number;
  onCountChange?: (count: number) => void;
}

export function TasbihCounter({
  initialCount = 0,
  targetCount,
  onCountChange,
}: TasbihCounterProps) {
  const { isDark, theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countAnim = useRef(new Animated.Value(0)).current;

  const { count, increment, reset, target, setTarget, isComplete, progress } = useTasbihCounter({
    initialCount,
    initialTarget: targetCount || null,
  });

  // Pulse animation on tap
  const animatePulse = useCallback(() => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Count bounce animation
    Animated.sequence([
      Animated.timing(countAnim, {
        toValue: -5,
        duration: 75,
        useNativeDriver: true,
      }),
      Animated.timing(countAnim, {
        toValue: 0,
        duration: 75,
        useNativeDriver: true,
      }),
    ]).start();
  }, [pulseAnim, countAnim]);

  const handlePress = useCallback(() => {
    increment();
    animatePulse();
    onCountChange?.(count + 1);
  }, [increment, animatePulse, onCountChange, count]);

  const handleLongPress = useCallback(() => {
    Alert.alert(
      'Reset Counter',
      'Are you sure you want to reset the counter to 0?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            reset();
            onCountChange?.(0);
          },
        },
      ]
    );
  }, [reset, onCountChange]);

  const bgColor = isDark
    ? 'rgba(52, 211, 153, 0.1)'
    : 'rgba(16, 185, 129, 0.08)';

  const counterBgColor = isDark
    ? 'rgba(52, 211, 153, 0.15)'
    : 'rgba(16, 185, 129, 0.12)';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather
            name="circle"
            size={18}
            color={isDark ? Colors.dark.primary : Colors.light.primary}
          />
          <ThemedText type="body" style={styles.title}>
            Tasbih Counter
          </ThemedText>
        </View>
        {target && (
          <View style={styles.targetBadge}>
            <ThemedText type="caption" style={{ color: isDark ? Colors.dark.primary : Colors.light.primary }}>
              Target: {target}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Counter Area */}
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
      >
        <Animated.View
          style={[
            styles.counterArea,
            { backgroundColor: counterBgColor },
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Animated.View style={{ transform: [{ translateY: countAnim }] }}>
            <ThemedText
              type="h1"
              style={[
                styles.countText,
                { color: isDark ? Colors.dark.primary : Colors.light.primary },
                isComplete && styles.completeText,
              ]}
            >
              {count}
            </ThemedText>
          </Animated.View>
          
          {/* Progress indicator */}
          {target && (
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.15)' },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary,
                    },
                  ]}
                />
              </View>
              <ThemedText type="caption" secondary style={styles.progressText}>
                {count} / {target}
              </ThemedText>
            </View>
          )}
        </Animated.View>
      </Pressable>

      {/* Instructions */}
      <View style={styles.instructions}>
        <ThemedText type="caption" secondary style={styles.instructionText}>
          Tap to count • Hold to reset
        </ThemedText>
      </View>

      {/* Completion indicator */}
      {isComplete && (
        <View style={styles.completeIndicator}>
          <Feather name="check-circle" size={16} color={isDark ? Colors.dark.primary : Colors.light.primary} />
          <ThemedText
            type="small"
            style={{ color: isDark ? Colors.dark.primary : Colors.light.primary, marginLeft: Spacing.xs }}
          >
            Target reached!
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontWeight: '600',
  },
  targetBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
  },
  counterArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
    borderRadius: BorderRadius.lg,
  },
  countText: {
    fontSize: 64,
    fontWeight: '700',
    lineHeight: 72,
  },
  completeText: {
    opacity: 0.9,
  },
  progressContainer: {
    width: '80%',
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    marginTop: Spacing.xs,
  },
  instructions: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  instructionText: {
    textAlign: 'center',
  },
  completeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    alignSelf: 'center',
  },
});

export default TasbihCounter;
