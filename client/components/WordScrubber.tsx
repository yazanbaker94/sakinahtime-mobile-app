/**
 * WordScrubber - A drag-to-explore word-by-word magnifier component
 * Similar to Quran.com's iOS word exploration feature
 * 
 * Position updates are handled by MushafScreen which forwards touch events
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { findWordMeaningByIndex } from '@/services/WordMeaningService';
import { Feather } from '@expo/vector-icons';

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
  isDark
}: WordScrubberProps) {
  const { theme } = useTheme();
  const [currentWord, setCurrentWord] = useState<WordInfo | null>(null);
  const lastWordRef = useRef<string | null>(null);

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

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">

      {/* Word highlight - highlights the actual word using coordinates */}
      {currentWord?.wordBounds && (
        <View
          style={[
            styles.wordHighlight,
            {
              left: currentWord.wordBounds.left,
              top: currentWord.wordBounds.top,
              width: currentWord.wordBounds.width,
              height: currentWord.wordBounds.height,
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
              <View style={[styles.magnifierBox, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
              }]}>
                <ThemedText style={[styles.magnifiedWord, { color: isDark ? theme.gold : theme.primary }]}>
                  {currentWord.arabicWord || '...'}
                </ThemedText>
              </View>

              <View style={styles.infoText}>
                {currentWord.transliteration && (
                  <ThemedText style={[styles.transliteration, { color: theme.textSecondary }]}>
                    {currentWord.transliteration}
                  </ThemedText>
                )}
                {currentWord.translation && (
                  <ThemedText style={[styles.translation, { color: theme.text }]} numberOfLines={2}>
                    {currentWord.translation}
                  </ThemedText>
                )}
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
    width: 90,
    minHeight: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  infoBox: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  infoContentEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoText: {
    flex: 1,
    gap: 4,
  },
  transliteration: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  translation: {
    fontSize: 15,
    fontWeight: '500',
  },
  frequencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  frequency: {
    fontSize: 12,
  },
  hint: {
    fontSize: 15,
  },
  wordHighlight: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
  },
  magnifiedWord: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
  },
});
