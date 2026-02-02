/**
 * Hook to track which feature hints have been shown
 * Persists to AsyncStorage so hints only show once per feature
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HINTS_KEY = '@feature_hints_shown';

export type FeatureHintId =
    | 'hifz_mode'
    | 'word_scrubber'
    | 'verse_long_press'
    | 'audio_speed'
    | 'mushaf_swipe';

interface UseFeatureHintReturn {
    hasSeenHint: (hintId: FeatureHintId) => boolean;
    markHintSeen: (hintId: FeatureHintId) => Promise<void>;
    shouldShowHint: (hintId: FeatureHintId) => boolean;
    isLoading: boolean;
    resetAllHints: () => Promise<void>;
}

export function useFeatureHint(): UseFeatureHintReturn {
    const [seenHints, setSeenHints] = useState<Set<FeatureHintId>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSeenHints();
    }, []);

    const loadSeenHints = async () => {
        try {
            const stored = await AsyncStorage.getItem(HINTS_KEY);
            if (stored) {
                const hints = JSON.parse(stored) as FeatureHintId[];
                setSeenHints(new Set(hints));
            }
        } catch (error) {
            console.warn('[useFeatureHint] Failed to load hints:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const hasSeenHint = useCallback((hintId: FeatureHintId): boolean => {
        return seenHints.has(hintId);
    }, [seenHints]);

    const shouldShowHint = useCallback((hintId: FeatureHintId): boolean => {
        return !isLoading && !seenHints.has(hintId);
    }, [seenHints, isLoading]);

    const markHintSeen = useCallback(async (hintId: FeatureHintId) => {
        try {
            const newSeenHints = new Set(seenHints);
            newSeenHints.add(hintId);
            setSeenHints(newSeenHints);

            await AsyncStorage.setItem(HINTS_KEY, JSON.stringify([...newSeenHints]));
        } catch (error) {
            console.warn('[useFeatureHint] Failed to save hint:', error);
        }
    }, [seenHints]);

    const resetAllHints = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(HINTS_KEY);
            setSeenHints(new Set());
        } catch (error) {
            console.warn('[useFeatureHint] Failed to reset hints:', error);
        }
    }, []);

    return {
        hasSeenHint,
        markHintSeen,
        shouldShowHint,
        isLoading,
        resetAllHints,
    };
}
