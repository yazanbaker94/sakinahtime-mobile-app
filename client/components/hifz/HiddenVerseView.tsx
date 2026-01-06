/**
 * HiddenVerseView
 * Renders a verse in hidden state with tap-to-reveal functionality
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useHifzMode } from '../../contexts/HifzModeContext';
import { useTheme } from '../../hooks/useTheme';
import { HIDDEN_TEXT_BG } from '../../constants/hifz';
import { HideMode, VerseKey } from '../../types/hifz';

interface HiddenVerseViewProps {
  verseKey: VerseKey;
  arabicText: string;
  style?: any;
  textStyle?: any;
  onReveal?: () => void;
}

export function HiddenVerseView({
  verseKey,
  arabicText,
  style,
  textStyle,
  onReveal,
}: HiddenVerseViewProps) {
  const { 
    isActive, 
    settings, 
    isVerseRevealed, 
    revealVerse, 
    hideVerse 
  } = useHifzMode();
  const { isDark, theme } = useTheme();

  const isRevealed = isVerseRevealed(verseKey);
  const hiddenBgColor = isDark ? HIDDEN_TEXT_BG.dark : HIDDEN_TEXT_BG.light;

  const handlePress = useCallback(() => {
    if (isRevealed) {
      hideVerse(verseKey);
    } else {
      revealVerse(verseKey);
      onReveal?.();
    }
  }, [isRevealed, verseKey, revealVerse, hideVerse, onReveal]);

  // Process text based on hide mode
  const displayText = useMemo(() => {
    if (!isActive || isRevealed) {
      return arabicText;
    }
    // Solid hide - completely hidden
    return null;
  }, [isActive, isRevealed, arabicText]);

  // If not in Hifz mode, render normally
  if (!isActive) {
    return (
      <Text style={[styles.arabicText, textStyle]}>
        {arabicText}
      </Text>
    );
  }

  // If revealed, show the text
  if (isRevealed) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <Animated.View entering={FadeIn.duration(200)}>
          <Text style={[styles.arabicText, textStyle]}>
            {arabicText}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // Hidden state
  return (
    <TouchableOpacity 
      onPress={handlePress} 
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Hidden verse ${verseKey}. Tap to reveal`}
      accessibilityHint="Double tap to show the verse text"
      style={[styles.container, style]}
    >
      <View style={[styles.hiddenContainer, { backgroundColor: hiddenBgColor }]}>
        {displayText ? (
          // Partial text (first word, etc.)
          <Text style={[styles.arabicText, styles.partialText, textStyle]}>
            {displayText}
          </Text>
        ) : (
          // Completely hidden
          <View style={styles.hiddenContent}>
            <View style={[styles.hiddenLine, { backgroundColor: theme.border }]} />
            <View style={[styles.hiddenLine, styles.shortLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.tapHint, { color: theme.textSecondary }]}>
              Tap to reveal
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  hiddenContainer: {
    borderRadius: 8,
    padding: 16,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenContent: {
    alignItems: 'center',
    width: '100%',
  },
  hiddenLine: {
    height: 12,
    width: '80%',
    borderRadius: 6,
    marginVertical: 4,
  },
  shortLine: {
    width: '50%',
  },
  tapHint: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  arabicText: {
    fontFamily: 'AlMushafQuran',
    fontSize: 24,
    textAlign: 'right',
    lineHeight: 48,
    writingDirection: 'rtl',
  },
  partialText: {
    opacity: 0.7,
  },
});

export default HiddenVerseView;
