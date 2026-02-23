/**
 * TasbihCounter Component
 * 
 * Interactive counter widget for dhikr counting with haptic feedback.
 * Inset clay dish design with tactile press feel.
 */

import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, Animated, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Spacing, BorderRadius } from '@/constants/theme';
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
  const { t } = useTranslation();
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
      t('tasbih.resetCounter'),
      t('tasbih.resetConfirm'),
      [
        { text: t('tasbih.cancel'), style: 'cancel' },
        {
          text: t('tasbih.reset'),
          style: 'destructive',
          onPress: () => {
            reset();
            onCountChange?.(0);
          },
        },
      ]
    );
  }, [reset, onCountChange]);

  return (
    <View style={[styles.container, {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.05,
      shadowRadius: 24,
      elevation: isDark ? 0 : 3,
    }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather
            name="circle"
            size={18}
            color={theme.primary}
          />
          <ThemedText type="body" style={styles.title}>
            {t('tasbih.title')}
          </ThemedText>
        </View>
        {target && (
          <View style={[styles.targetBadge, { backgroundColor: `${theme.primary}1A` }]}>
            <ThemedText type="caption" style={{ color: theme.primary }}>
              {t('tasbih.target')}: {target}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Counter Area — Inset Clay Dish */}
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
      >
        <Animated.View
          style={[
            styles.counterArea,
            {
              // Uniform pale grey — the outer card shadow provides the 3D depth
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              borderWidth: 0,
            },
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Animated.View style={{ transform: [{ translateY: countAnim }] }}>
            <ThemedText
              type="h1"
              style={[
                styles.countText,
                { color: theme.primary },
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
                  { backgroundColor: `${theme.primary}20` },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: theme.primary,
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
          {t('tasbih.tapToCount')}
        </ThemedText>
      </View>

      {/* Completion indicator */}
      {isComplete && (
        <View style={[styles.completeIndicator, { backgroundColor: `${theme.primary}1A` }]}>
          <Feather name="check-circle" size={16} color={theme.primary} />
          <ThemedText
            type="small"
            style={{ color: theme.primary, marginLeft: Spacing.xs }}
          >
            {t('tasbih.targetReached')}
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
  },
  counterArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
    borderRadius: 20,
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
    alignSelf: 'center',
  },
});

export default TasbihCounter;
