/**
 * HifzVerseOverlay
 * Overlay component that shows hidden state for verses in Hifz mode
 * Used on top of Mushaf image-based verse regions
 */

import React, { useCallback } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useHifzMode } from '../../contexts/HifzModeContext';
import { useTheme } from '../../hooks/useTheme';
import { HIDDEN_TEXT_BG, HIFZ_ACTIVE_COLOR } from '../../constants/hifz';
import type { VerseKey } from '../../types/hifz';

interface HifzVerseOverlayProps {
  verseKey: VerseKey;
  style?: any;
  children?: React.ReactNode;
}

export function HifzVerseOverlay({
  verseKey,
  style,
  children,
}: HifzVerseOverlayProps) {
  const { isDark, theme } = useTheme();
  const {
    isActive,
    isVerseRevealed,
    revealVerse,
    hideVerse,
    revealedVerses,
  } = useHifzMode();

  const isRevealed = isVerseRevealed(verseKey) || revealedVerses.has('__ALL__');
  const hiddenBgColor = isDark ? HIDDEN_TEXT_BG.dark : HIDDEN_TEXT_BG.light;
  const activeColor = isDark ? HIFZ_ACTIVE_COLOR.dark : HIFZ_ACTIVE_COLOR.light;

  const handlePress = useCallback(() => {
    if (isRevealed) {
      hideVerse(verseKey);
    } else {
      revealVerse(verseKey);
    }
  }, [isRevealed, verseKey, revealVerse, hideVerse]);

  // If not in Hifz mode, render children normally
  if (!isActive) {
    return <>{children}</>;
  }

  // If revealed, show with slight indicator
  if (isRevealed) {
    return (
      <Pressable onPress={handlePress} style={style}>
        <Animated.View entering={FadeIn.duration(200)}>
          {children}
          {/* Small indicator that verse is in Hifz mode */}
          <View style={[styles.revealedIndicator, { backgroundColor: activeColor }]} />
        </Animated.View>
      </Pressable>
    );
  }

  // Hidden state - show overlay
  return (
    <Pressable onPress={handlePress} style={[style, styles.hiddenContainer]}>
      <Animated.View
        entering={FadeIn.duration(150)}
        style={[styles.hiddenOverlay, { backgroundColor: hiddenBgColor }]}
      >
        <View style={styles.hiddenLines}>
          <View style={[styles.hiddenLine, { backgroundColor: theme.border }]} />
          <View style={[styles.hiddenLine, styles.shortLine, { backgroundColor: theme.border }]} />
        </View>
        <Text style={[styles.tapHint, { color: theme.textSecondary }]}>
          Tap to reveal
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hiddenContainer: {
    overflow: 'hidden',
  },
  hiddenOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  hiddenLines: {
    alignItems: 'center',
    width: '100%',
  },
  hiddenLine: {
    height: 8,
    width: '70%',
    borderRadius: 4,
    marginVertical: 2,
  },
  shortLine: {
    width: '40%',
  },
  tapHint: {
    fontSize: 8,
    marginTop: 4,
  },
  revealedIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default HifzVerseOverlay;
