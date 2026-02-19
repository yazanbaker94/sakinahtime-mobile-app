/**
 * WordScrubber - A drag-to-explore word-by-word magnifier component
 * Similar to Quran.com's iOS word exploration feature
 * 
 * PERFORMANCE OPTIMIZED:
 * - Uses forwardRef + useImperativeHandle for ref-based position updates (no parent setState)
 * - Spatial grid index for O(1) word hit-testing instead of linear scan
 * - Direct Reanimated shared value updates (no useEffect chain)
 * - Debounced meaning lookup (highlight moves instantly, meaning loads ~80ms later)
 * - Eager WBW data loading on activation
 */

import React, { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { findWordMeaningByIndex, ensureWbwDataLoaded } from '@/services/WordMeaningService';
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
  onClose: () => void;
  isDark: boolean;
  // For live magnifier
  mushafImage?: any;
  screenWidth: number;
  imageHeight: number;
}

export interface WordScrubberHandle {
  updatePosition: (x: number, y: number) => void;
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
  wordBounds?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

// Spatial grid cell size (in image coordinates)
const GRID_CELL_SIZE = 30;

interface GridEntry {
  word: WordCoord & { verseKey: string; wordIndex: number };
}

export const WordScrubber = forwardRef<WordScrubberHandle, WordScrubberProps>(({
  isActive,
  pageCoords,
  imageScale,
  imageOffsetY,
  contentZoneTop = 0,
  tabBarHeight = 80,
  onClose,
  isDark,
  mushafImage,
  screenWidth,
  imageHeight,
}, ref) => {
  const { theme } = useTheme();
  const [currentWord, setCurrentWord] = useState<WordInfo | null>(null);
  const lastWordRef = useRef<string | null>(null);
  const wasActiveRef = useRef(false);
  const meaningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // fingerPosition state drives magnifier rendering (local re-render only, not parent)
  const [fingerPosition, setFingerPosition] = useState<{ x: number; y: number } | null>(null);
  // Y-axis lock: tracks the vertical center of the current word's line
  // Magnifier follows finger X but locks Y to word line (no jitter from vertical drift)
  const wordLineCenterY = useRef<number | null>(null);

  // Animated values for smooth word highlight transitions
  const highlightLeft = useSharedValue(0);
  const highlightTop = useSharedValue(0);
  const highlightWidth = useSharedValue(0);
  const highlightHeight = useSharedValue(0);
  const highlightOpacity = useSharedValue(0);

  // Animated style for smooth highlight transitions
  const animatedHighlightStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: highlightLeft.value,
    top: highlightTop.value,
    width: highlightWidth.value,
    height: highlightHeight.value,
    opacity: highlightOpacity.value,
  }));

  // Eagerly load WBW data when scrubber activates
  useEffect(() => {
    if (isActive) {
      ensureWbwDataLoaded();
    }
  }, [isActive]);

  // Play word audio when finger is lifted (scrubber closes)
  useEffect(() => {
    const playWordAudioIfEnabled = async () => {
      if (wasActiveRef.current && !isActive && currentWord) {
        try {
          const saved = await AsyncStorage.getItem('@wbw_audio_enabled');
          const audioEnabled = saved === null ? true : saved === 'true';

          if (audioEnabled) {
            const wordIndex = currentWord.wordIndex + 1;
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

  // Build flat word list
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

  // Build spatial grid index for O(1) word lookup
  const spatialGrid = React.useMemo(() => {
    const grid = new Map<string, GridEntry[]>();

    for (const word of allWords) {
      // Calculate which grid cells this word occupies
      const minCol = Math.floor(word.x / GRID_CELL_SIZE);
      const maxCol = Math.floor((word.x + word.width) / GRID_CELL_SIZE);
      const minRow = Math.floor(word.y / GRID_CELL_SIZE);
      const maxRow = Math.floor((word.y + word.height) / GRID_CELL_SIZE);

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const key = `${col},${row}`;
          if (!grid.has(key)) {
            grid.set(key, []);
          }
          grid.get(key)!.push({ word });
        }
      }
    }

    return grid;
  }, [allWords]);

  // O(1) word lookup using spatial grid
  const findWordAtPosition = useCallback((screenX: number, screenY: number) => {
    const imageX = screenX / imageScale;
    const imageY = (screenY - contentZoneTop - imageOffsetY) / imageScale;

    const col = Math.floor(imageX / GRID_CELL_SIZE);
    const row = Math.floor(imageY / GRID_CELL_SIZE);
    const key = `${col},${row}`;

    const candidates = spatialGrid.get(key);
    if (!candidates) return null;

    for (const { word } of candidates) {
      if (imageX >= word.x && imageX <= word.x + word.width &&
        imageY >= word.y && imageY <= word.y + word.height) {
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
  }, [spatialGrid, imageScale, imageOffsetY, contentZoneTop]);

  // Load word meaning with debounce (meaning card fills 80ms after highlight moves)
  const loadWordMeaningDebounced = useCallback((
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

    // Haptic feedback immediately
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Clear any pending meaning lookup
    if (meaningTimeoutRef.current) {
      clearTimeout(meaningTimeoutRef.current);
    }

    // Debounced meaning lookup — don't block highlight movement
    meaningTimeoutRef.current = setTimeout(async () => {
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
    }, 80);
  }, []);

  // Core position update — called imperatively from parent via ref
  const handlePositionUpdate = useCallback((screenX: number, screenY: number) => {
    // Update state for magnifier live tracking (only re-renders WordScrubber, not parent)
    setFingerPosition({ x: screenX, y: screenY });

    const word = findWordAtPosition(screenX, screenY);
    if (word && word.wordBounds) {
      // Directly update Reanimated shared values — no setState, no useEffect chain
      const timing = { duration: 120, easing: Easing.out(Easing.cubic) };
      highlightLeft.value = withTiming(word.wordBounds.left, timing);
      highlightTop.value = withTiming(word.wordBounds.top, timing);
      highlightWidth.value = withTiming(word.wordBounds.width, timing);
      highlightHeight.value = withTiming(word.wordBounds.height, timing);
      highlightOpacity.value = withTiming(1, { duration: 80 });

      // Lock magnifier Y-axis to word's vertical center (prevents line jitter)
      wordLineCenterY.current = word.wordBounds.top + (word.wordBounds.height / 2);

      // Debounced meaning card update
      loadWordMeaningDebounced(
        word.surah, word.ayah, word.wordIndex,
        word.screenX, word.screenY, word.wordBounds
      );
    }
  }, [findWordAtPosition, loadWordMeaningDebounced, highlightLeft, highlightTop, highlightWidth, highlightHeight, highlightOpacity]);

  // Expose imperative handle for parent to call
  useImperativeHandle(ref, () => ({
    updatePosition: handlePositionUpdate,
  }), [handlePositionUpdate]);

  // Clean up on deactivation
  useEffect(() => {
    if (!isActive) {
      setCurrentWord(null);
      lastWordRef.current = null;
      setFingerPosition(null);
      wordLineCenterY.current = null;
      highlightOpacity.value = withTiming(0, { duration: 100 });
      if (meaningTimeoutRef.current) {
        clearTimeout(meaningTimeoutRef.current);
        meaningTimeoutRef.current = null;
      }
    }
  }, [isActive]);

  if (!isActive) return null;

  const effectivePosition = fingerPosition;
  const isFingerInTopHalf = effectivePosition ? effectivePosition.y < SCREEN_HEIGHT / 2 : true;
  const infoBoxTop = isFingerInTopHalf ? SCREEN_HEIGHT - tabBarHeight - 180 : 100;

  const formatFrequency = (freq: number): string => {
    if (freq === 0) return 'Not in data';
    if (freq === 1) return 'Appears once';
    return `Appears ${freq} times`;
  };

  // Calculate magnifier position
  const MAGNIFIER_WIDTH = 130;
  const MAGNIFIER_HEIGHT = 50;
  const MAGNIFIER_SCALE = 1.5;

  const getMagnifierImagePosition = () => {
    if (!effectivePosition || !mushafImage) return { left: 0, top: 0 };

    const fingerX = effectivePosition.x;
    const imageTop = contentZoneTop + imageOffsetY;

    // X follows the finger, Y locks to the word's line center
    const posInImageX = fingerX;
    const lockedY = wordLineCenterY.current ?? effectivePosition.y;
    const posInImageY = lockedY - imageTop;

    const scaledX = posInImageX * MAGNIFIER_SCALE;
    const scaledY = posInImageY * MAGNIFIER_SCALE;

    const left = -(scaledX - MAGNIFIER_WIDTH / 2);
    const top = -(scaledY - MAGNIFIER_HEIGHT / 2);

    return { left, top };
  };

  const magnifierImagePos = getMagnifierImagePosition();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Focus scrim — dims the noisy Quran text so popup demands 100% attention */}
      {effectivePosition && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.35)' }
          ]}
          pointerEvents="none"
        />
      )}

      {/* Word highlight - smooth animation via direct shared values */}
      {isActive && (
        <Animated.View
          style={[
            styles.wordHighlight,
            animatedHighlightStyle,
            {
              borderWidth: 0,
              // Teal-branded glow in BOTH modes for brand cohesion
              backgroundColor: isDark ? 'rgba(94, 156, 170, 0.35)' : 'rgba(94, 156, 170, 0.30)',
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
              // Light mode: massive soft levitation shadow
              // Dark mode: rim lighting glass-edge
              ...(isDark ? {
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.10)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
                elevation: 12,
              } : {
                borderWidth: 0,
                borderColor: 'transparent',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.12,
                shadowRadius: 40,
                elevation: 24,
              }),
            }
          ]}
          pointerEvents="none"
        >
          {currentWord ? (
            <View style={styles.infoContent}>
              {/* Left side: Glass Lens Magnifier */}
              <View style={[styles.magnifierBox, {
                // Match the un-dimmed reading page bg — glass cutout illusion
                backgroundColor: isDark ? '#1A1A1A' : '#F5F3EB',
                // Delicate glass rim
                borderWidth: 1,
                borderColor: 'rgba(150, 150, 150, 0.20)',
                overflow: 'hidden',
              }]}
              >
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
                    {/* Subtle center dot instead of clinical crosshairs */}
                    <View style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      marginLeft: -3,
                      marginTop: -3,
                      backgroundColor: isDark ? theme.gold : theme.primary,
                      opacity: 0.4,
                    }} />
                  </View>
                ) : (
                  <ThemedText style={[styles.magnifiedWord, { color: isDark ? theme.gold : theme.primary }]}>
                    {currentWord.arabicWord || '...'}
                  </ThemedText>
                )}
              </View>

              {/* Right side: Word info stacked vertically — centered alongside scrubber */}
              <View style={styles.infoTextRight}>
                {/* Arabic word at top */}
                <ThemedText style={[styles.arabicWordLarge, { color: theme.text }]}>
                  {currentWord.arabicWord || '...'}
                </ThemedText>

                {/* Transliteration — secondary, faded */}
                {currentWord.transliteration && (
                  <ThemedText style={[styles.transliteration, {
                    color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.40)'
                  }]}>
                    {currentWord.transliteration}
                  </ThemedText>
                )}

                {/* Translation — primary value, emphasized */}
                {currentWord.translation && (
                  <ThemedText style={[styles.translation, { color: theme.text }]} numberOfLines={2}>
                    {currentWord.translation}
                  </ThemedText>
                )}

                {/* Frequency pill — teal in both modes for brand sync */}
                <View style={[styles.frequencyRow, {
                  backgroundColor: isDark ? 'rgba(94, 156, 170, 0.15)' : 'rgba(94, 156, 170, 0.10)',
                  borderTopWidth: 0,
                }]}>
                  <Feather name="bar-chart-2" size={11} color={isDark ? 'rgba(94, 156, 170, 0.9)' : theme.primary} />
                  <ThemedText style={[styles.frequency, { color: isDark ? 'rgba(94, 156, 170, 0.9)' : theme.primary }]}>
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
});


const styles = StyleSheet.create({
  magnifierBox: {
    width: 130,
    height: 70, // Tall enough to frame harakat above + descenders below
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  infoBox: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 20,
    padding: 24, // Maximum breathing room
    // Base shadow — overridden inline for light/dark
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 24,
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
    justifyContent: 'center', // Vertically center alongside the glass lens
    gap: 4,
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
    fontSize: 14,
    fontWeight: '600', // Emphasized — this is the core value
    textAlign: 'right',
  },
  frequencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 5,
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100, // Full capsule pill
  },
  frequency: {
    fontSize: 11,
  },
  hint: {
    fontSize: 14,
  },
  wordHighlight: {
    borderRadius: 6,
  },
  magnifiedWord: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  magnifierLoupe: {
    position: 'absolute',
    borderRadius: 60,
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
