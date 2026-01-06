/**
 * useTasbihCounter Hook
 * 
 * Manages tasbih (dhikr counter) state with increment, reset, and target tracking.
 */

import { useState, useCallback, useMemo } from 'react';
import * as Haptics from 'expo-haptics';

interface UseTasbihCounterOptions {
  initialCount?: number;
  initialTarget?: number | null;
  enableHaptics?: boolean;
}

interface UseTasbihCounterReturn {
  count: number;
  target: number | null;
  isComplete: boolean;
  progress: number; // 0-1 progress towards target
  increment: () => void;
  reset: () => void;
  setTarget: (target: number | null) => void;
  setCount: (count: number) => void;
}

export function useTasbihCounter(options: UseTasbihCounterOptions = {}): UseTasbihCounterReturn {
  const {
    initialCount = 0,
    initialTarget = null,
    enableHaptics = true,
  } = options;

  const [count, setCount] = useState(initialCount);
  const [target, setTarget] = useState<number | null>(initialTarget);

  const isComplete = useMemo(() => {
    if (target === null) return false;
    return count >= target;
  }, [count, target]);

  const progress = useMemo(() => {
    if (target === null || target === 0) return 0;
    return Math.min(count / target, 1);
  }, [count, target]);

  const increment = useCallback(() => {
    setCount(prev => prev + 1);
    
    if (enableHaptics) {
      // Light haptic for regular tap
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
        // Haptics not available, ignore
      });
    }
  }, [enableHaptics]);

  const reset = useCallback(() => {
    setCount(0);
    
    if (enableHaptics) {
      // Medium haptic for reset
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
        // Haptics not available, ignore
      });
    }
  }, [enableHaptics]);

  const handleSetTarget = useCallback((newTarget: number | null) => {
    setTarget(newTarget);
  }, []);

  const handleSetCount = useCallback((newCount: number) => {
    setCount(Math.max(0, newCount));
  }, []);

  return {
    count,
    target,
    isComplete,
    progress,
    increment,
    reset,
    setTarget: handleSetTarget,
    setCount: handleSetCount,
  };
}

export default useTasbihCounter;
