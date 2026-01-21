/**
 * WordScrubber - A drag-to-explore word-by-word magnifier component
 * Similar to Quran.com's iOS word exploration feature
 * 
 * Position updates are handled by MushafScreen which forwards touch events
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { findWordMeaningByIndex } from '@/services/WordMeaningService';
import { Feather } from '@expo/vector-icons';
import wordAudioService from '@/services/WordAudioService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WordCoord {
  x: number;
  y: number;
  width: number;
  height: number;
  sura: number;
  ayah: number;
  line: number;
}

interface WordScrubberProps {
  isActive: boolean;
  pageCoords: Record<string, WordCoord[]>;
  imageScale: number;
  imageOffsetY: number;
  contentZoneTop?: number;
  tabBarHeight?: number;
  initialTouchPosition?: { x: number; y: number };
  onClose: () => void;
  isDark: boolean;
  // For live magnifier
  mushafImage?: any;
  screenWidth: number;
  imageHeight: number;
}

interface WordInfo {
  surah: number;
  ayah: number;
  wordIndex: number;
  arabicWord?: string;
  transliteration?: string;
  translation?: string;
  frequency?: number;
  screenX: number;
  screenY: number;
  // Word bounding box in screen coordinates
  wordBounds?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}


export function WordScrubber({
  isActive,
  pageCoords,
  imageScale,
  imageOffsetY,
  contentZoneTop = 0,
  tabBarHeight = 80,
  initialTouchPosition,
  onClose,
  isDark,
  mushafImage,
  screenWidth,
  imageHeight,
}: WordScrubberProps) {
  const { theme } = useTheme();
  const [currentWord, setCurrentWord] = useState<WordInfo | null>(null);
  const lastWordRef = useRef<string | null>(null);
  const wasActiveRef = useRef(false);

  // Animated values for smooth word highlight transitions
  const highlightLeft = useSharedValue(0);
  const highlightTop = useSharedValue(0);
  const highlightWidth = useSharedValue(0);
  const highlightHeight = useSharedValue(0);
  const highlightOpacity = useSharedValue(0);

  // Animate the highlight when word bounds change
  useEffect(() => {
    if (currentWord?.wordBounds) {
      const timing = { duration: 150, easing: Easing.out(Easing.cubic) };
      highlightLeft.value = withTiming(currentWord.wordBounds.left, timing);
      highlightTop.value = withTiming(currentWord.wordBounds.top, timing);
      highlightWidth.value = withTiming(currentWord.wordBounds.width, timing);
      highlightHeight.value = withTiming(currentWord.wordBounds.height, timing);
      highlightOpacity.value = withTiming(1, { duration: 100 });
    } else {
      highlightOpacity.value = withTiming(0, { duration: 100 });
    }
  }, [currentWord?.wordBounds]);

  // Animated style for smooth highlight transitions
  const animatedHighlightStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: highlightLeft.value,
    top: highlightTop.value,
    width: highlightWidth.value,
    height: highlightHeight.value,
    opacity: highlightOpacity.value,
  }));

  // Play word audio when finger is lifted (scrubber closes)
  useEffect(() => {
    const playWordAudioIfEnabled = async () => {
      if (wasActiveRef.current && !isActive && currentWord) {
        try {
          // Read setting directly at playback time to avoid race conditions
          const saved = await AsyncStorage.getItem('@wbw_audio_enabled');
          const audioEnabled = saved === null ? true : saved === 'true';

          if (audioEnabled) {
            const wordIndex = currentWord.wordIndex + 1; // API uses 1-indexed
            wordAudioService.playWord(currentWord.surah, currentWord.ayah, wordIndex);
          }
        } catch (e) {
          console.error('[WordScrubber] Failed to check audio setting:', e);
        }
      }
      wasActiveRef.current = isActive;
    };

    playWordAudioIfEnabled();
  }, [isActive, currentWord]);

  const allWords = React.useMemo(() => {
    const words: Array<WordCoord & { verseKey: string; wordIndex: number }> = [];
    Object.entries(pageCoords).forEach(([verseKey, coords]) => {
      if (!coords || !Array.isArray(coords)) return;
      coords.forEach((coord, idx) => {
        if (coord && coord.sura && coord.ayah !== null && coord.x !== undefined) {
          words.push({ ...coord, verseKey, wordIndex: idx });
        }
      });
    });
    return words;
  }, [pageCoords]);

  const findWordAtPosition = useCallback((screenX: number, screenY: number) => {
    const imageX = screenX / imageScale;
    const imageY = (screenY - contentZoneTop - imageOffsetY) / imageScale;

    for (const word of allWords) {
      if (imageX >= word.x && imageX <= word.x + word.width &&
        imageY >= word.y && imageY <= word.y + word.height) {
        // Convert word bounds to screen coordinates
        const wordBounds = {
          left: word.x * imageScale,
          top: (word.y * imageScale) + contentZoneTop + imageOffsetY,
          width: word.width * imageScale,
          height: word.height * imageScale,
        };
        return {
          surah: word.sura,
          ayah: word.ayah,
          wordIndex: word.wordIndex,
          screenX,
          screenY,
          wordBounds,
        };
      }
    }
    return null;
  }, [allWords, imageScale, imageOffsetY, contentZoneTop]);

  const loadWordMeaning = useCallback(async (
    surah: number,
    ayah: number,
    wordIndex: number,
    screenX: number,
    screenY: number,
    wordBounds?: { left: number; top: number; width: number; height: number }
  ) => {
    const wordKey = `${surah}:${ayah}:${wordIndex}`;
    if (lastWordRef.current === wordKey) return;
    lastWordRef.current = wordKey;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const meaning = await findWordMeaningByIndex(surah, ayah, wordIndex);
      setCurrentWord({
        surah, ayah, wordIndex, screenX, screenY,
        arabicWord: meaning?.arabicWord,
        transliteration: meaning?.transliteration,
        translation: meaning?.englishMeaning,
        frequency: meaning?.frequency || 0,
        wordBounds,
      });
    } catch (e) {
      setCurrentWord({ surah, ayah, wordIndex, screenX, screenY, wordBounds });
    }
  }, []);

  // Use refs for touch handlers to access latest state
  const currentWordRef = useRef(currentWord);
  const onCloseRef = useRef(onClose);

  React.useEffect(() => {
    currentWordRef.current = currentWord;
  }, [currentWord]);

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Track last processed position to avoid duplicate processing
  const lastPositionRef = useRef<string | null>(null);

  // Update word when position changes
  React.useEffect(() => {
    if (isActive && initialTouchPosition) {
      // Create a key for this position to avoid duplicate processing
      const posKey = `${Math.round(initialTouchPosition.x)},${Math.round(initialTouchPosition.y)}`;
      if (lastPositionRef.current === posKey) return;
      lastPositionRef.current = posKey;

      // Find and load word meaning
      const word = findWordAtPosition(initialTouchPosition.x, initialTouchPosition.y);
      if (word) {
        loadWordMeaning(word.surah, word.ayah, word.wordIndex, word.screenX, word.screenY, word.wordBounds);
      }
    }
    if (!isActive) {
      setCurrentWord(null);
      lastWordRef.current = null;
      lastPositionRef.current = null;
    }
  }, [isActive, initialTouchPosition, findWordAtPosition, loadWordMeaning]);

  if (!isActive) return null;

  // Use initialTouchPosition directly as effectivePosition
  const effectivePosition = initialTouchPosition;
  const isFingerInTopHalf = effectivePosition ? effectivePosition.y < SCREEN_HEIGHT / 2 : true;
  const infoBoxTop = isFingerInTopHalf ? SCREEN_HEIGHT - tabBarHeight - 180 : 100;

  const formatFrequency = (freq: number): string => {
    if (freq === 0) return 'Not in data';
    if (freq === 1) return 'Appears once';
    return `Appears ${freq} times`;
  };

  // Calculate magnifier position - shows magnified view of the area under finger
  const MAGNIFIER_WIDTH = 130; // Width of magnifier box
  const MAGNIFIER_HEIGHT = 50; // Height of magnifier box
  const MAGNIFIER_SCALE = 1.5; // 1.5x magnification (wider view for longer words)

  // Calculate the position to show in the magnifier (following finger)
  const getMagnifierImagePosition = () => {
    if (!effectivePosition || !mushafImage) return { left: 0, top: 0 };

    // The finger position in screen coordinates
    const fingerX = effectivePosition.x;
    const fingerY = effectivePosition.y;

    // Convert finger position to image coordinates
    // The image rendered position: top = contentZoneTop + imageOffsetY
    const imageTop = contentZoneTop + imageOffsetY;

    // Position within the scaled image
    const posInImageX = fingerX;
    const posInImageY = fingerY - imageTop;

    // Apply magnification scale and center in the magnifier view
    // We want the finger position to be at the center of the magnifier
    const scaledX = posInImageX * MAGNIFIER_SCALE;
    const scaledY = posInImageY * MAGNIFIER_SCALE;

    // Offset to center the finger position in the magnifier box
    const left = -(scaledX - MAGNIFIER_WIDTH / 2);
    const top = -(scaledY - MAGNIFIER_HEIGHT / 2);

    return { left, top };
  };

  const magnifierImagePos = getMagnifierImagePosition();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">

      {/* Word highlight - highlights the actual word using coordinates with smooth animation */}
      {isActive && (
        <Animated.View
          style={[
            styles.wordHighlight,
            animatedHighlightStyle,
            {
              borderColor: isDark ? theme.gold : theme.primary,
              backgroundColor: isDark ? 'rgba(218, 165, 32, 0.25)' : 'rgba(59, 130, 246, 0.25)',
            }
          ]}
          pointerEvents="none"
        />
      )}

      {/* Info box */}
      {effectivePosition && (
        <View
          style={[
            styles.infoBox,
            {
              top: infoBoxTop,
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderColor: isDark ? theme.gold : theme.primary,
            }
          ]}
          pointerEvents="none"
        >
          {currentWord ? (
            <View style={styles.infoContent}>
              {/* Left side: Live Magnifier */}
              <View style={[styles.magnifierBox, {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderColor: isDark ? theme.gold : theme.primary,
                overflow: 'hidden',
              }]}>
                {mushafImage ? (
                  <View style={styles.magnifierContent}>
                    <Image
                      source={mushafImage}
                      style={{
                        width: screenWidth * MAGNIFIER_SCALE,
                        height: imageHeight * MAGNIFIER_SCALE,
                        position: 'absolute',
                        left: magnifierImagePos.left,
                        top: magnifierImagePos.top,
                        tintColor: isDark ? '#FFFFFF' : undefined,
                      }}
                      contentFit="contain"
                    />
                    {/* Crosshairs */}
                    <View style={[styles.magnifierCrosshair, { backgroundColor: isDark ? theme.gold : theme.primary }]} />
                    <View style={[styles.magnifierCrosshairV, { backgroundColor: isDark ? theme.gold : theme.primary }]} />
                  </View>
                ) : (
                  <ThemedText style={[styles.magnifiedWord, { color: isDark ? theme.gold : theme.primary }]}>
                    {currentWord.arabicWord || '...'}
                  </ThemedText>
                )}
              </View>

              {/* Right side: Word info stacked vertically */}
              <View style={styles.infoTextRight}>
                {/* Arabic word at top */}
                <ThemedText style={[styles.arabicWordLarge, { color: theme.text }]}>
                  {currentWord.arabicWord || '...'}
                </ThemedText>

                {/* Transliteration */}
                {currentWord.transliteration && (
                  <ThemedText style={[styles.transliteration, { color: theme.textSecondary }]}>
                    {currentWord.transliteration}
                  </ThemedText>
                )}

                {/* Translation */}
                {currentWord.translation && (
                  <ThemedText style={[styles.translation, { color: theme.text }]} numberOfLines={2}>
                    {currentWord.translation}
                  </ThemedText>
                )}

                {/* Frequency count */}
                <View style={styles.frequencyRow}>
                  <Feather name="bar-chart-2" size={12} color={theme.textSecondary} />
                  <ThemedText style={[styles.frequency, { color: theme.textSecondary }]}>
                    {formatFrequency(currentWord.frequency || 0)}
                  </ThemedText>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.infoContentEmpty}>
              <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
                Move to a word...
              </ThemedText>
            </View>
          )}
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  magnifierBox: {
    width: 130,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    borderWidth: 1.5,
  },
  infoBox: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoContentEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  infoTextRight: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 3,
  },
  arabicWordLarge: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  transliteration: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  translation: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right',
  },
  frequencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.15)',
  },
  frequency: {
    fontSize: 11,
  },
  hint: {
    fontSize: 14,
  },
  wordHighlight: {
    borderWidth: 2,
    borderRadius: 8, // More rounded for smoother look
  },
  magnifiedWord: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  magnifierLoupe: {
    position: 'absolute',
    borderRadius: 60, // Half of MAGNIFIER_SIZE (120)
    borderWidth: 3,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  magnifierContent: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  magnifierCrosshair: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 12,
    height: 2,
    marginLeft: -6,
    marginTop: -1,
    opacity: 0.5,
  },
  magnifierCrosshairV: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 2,
    height: 12,
    marginLeft: -1,
    marginTop: -6,
    opacity: 0.5,
  },
});
