/**
 * HifzModeContext
 * Context provider for Quran memorization mode state management
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HifzModeState,
  HifzSettings,
  VerseKey,
  WordKey,
  HideMode,
  LoopOptions,
  SavedLoop,
} from '../types/hifz';
import {
  HIFZ_STORAGE_KEYS,
  DEFAULT_HIFZ_SETTINGS,
} from '../constants/hifz';
import AudioService from '../services/AudioService';
import wordAudioService from '../services/WordAudioService';

interface HifzModeContextValue {
  // State
  isActive: boolean;
  settings: HifzSettings;
  revealedVerses: Set<VerseKey>;
  revealedWords: Set<WordKey>;
  revealCounter: number;
  currentRepeat: number;
  totalRepeats: number;
  loopStart: VerseKey | null;
  loopEnd: VerseKey | null;
  loopRange: { start: VerseKey | null; end: VerseKey | null };
  isLooping: boolean;
  isPaused: boolean;
  savedLoops: SavedLoop[];

  // Mode control
  enterHifzMode: () => void;
  exitHifzMode: () => void;
  toggleHifzMode: () => void;

  // Verse reveal/hide
  revealVerse: (verseKey: VerseKey) => void;
  hideVerse: (verseKey: VerseKey) => void;
  revealAllVerses: (verseKeys: VerseKey[]) => void;
  hideAllVerses: () => void;
  isVerseRevealed: (verseKey: VerseKey) => boolean;
  revealAll: () => void;
  hideAll: () => void;

  // Word reveal/hide (for word-by-word mode)
  revealWord: (wordKey: WordKey) => void;
  hideWord: (wordKey: WordKey) => void;
  isWordRevealed: (wordKey: WordKey) => boolean;
  revealNextWord: (verseKey: VerseKey, totalWords: number) => void;
  getRevealedWordCount: (verseKey: VerseKey) => number;

  // Settings
  updateSettings: (newSettings: Partial<HifzSettings>) => Promise<void>;
  setHideMode: (mode: HideMode) => void;
  setAutoHideDelay: (delay: number) => void;
  setRepeatCount: (count: number) => void;
  setPauseBetweenRepeats: (pause: number) => void;
  setPlaybackSpeed: (speed: number) => void;

  // Loop control
  setLoopStart: (verseKey: VerseKey | null) => void;
  setLoopEnd: (verseKey: VerseKey | null) => void;
  clearLoop: () => void;
  setLoopRange: (start: VerseKey, end: VerseKey) => void;

  // Saved loops
  saveCurrentLoop: (name: string) => Promise<void>;
  deleteLoop: (loopId: string) => Promise<void>;
  loadLoop: (loop: SavedLoop) => void;

  // Repeat control
  setCurrentRepeat: (repeat: number) => void;
  incrementRepeat: () => void;
  resetRepeat: () => void;

  // Playback state
  setIsLooping: (looping: boolean) => void;
  setIsPaused: (paused: boolean) => void;
}

const HifzModeContext = createContext<HifzModeContextValue | undefined>(undefined);

interface HifzModeProviderProps {
  children: ReactNode;
}

export function HifzModeProvider({ children }: HifzModeProviderProps) {
  // Core state
  const [isActive, setIsActive] = useState(false);
  const [settings, setSettings] = useState<HifzSettings>(DEFAULT_HIFZ_SETTINGS);
  const [revealedVerses, setRevealedVerses] = useState<Set<VerseKey>>(new Set());
  const [revealedWords, setRevealedWords] = useState<Set<WordKey>>(new Set());
  const [revealCounter, setRevealCounter] = useState(0); // Trigger re-renders

  // Repeat state
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [totalRepeats, setTotalRepeats] = useState(0);

  // Loop state
  const [loopStart, setLoopStart] = useState<VerseKey | null>(null);
  const [loopEnd, setLoopEnd] = useState<VerseKey | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [savedLoops, setSavedLoops] = useState<SavedLoop[]>([]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadSavedLoops();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(HIFZ_STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_HIFZ_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('[HifzModeContext] Failed to load settings:', error);
    }
  };

  const saveSettings = async (newSettings: HifzSettings) => {
    try {
      await AsyncStorage.setItem(HIFZ_STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    } catch (error) {
      console.error('[HifzModeContext] Failed to save settings:', error);
    }
  };

  const loadSavedLoops = async () => {
    try {
      const stored = await AsyncStorage.getItem(HIFZ_STORAGE_KEYS.SAVED_LOOPS);
      if (stored) {
        setSavedLoops(JSON.parse(stored));
      }
    } catch (error) {
      console.error('[HifzModeContext] Failed to load saved loops:', error);
    }
  };

  const saveSavedLoops = async (loops: SavedLoop[]) => {
    try {
      await AsyncStorage.setItem(HIFZ_STORAGE_KEYS.SAVED_LOOPS, JSON.stringify(loops));
    } catch (error) {
      console.error('[HifzModeContext] Failed to save loops:', error);
    }
  };

  // Mode control
  const enterHifzMode = useCallback(() => {
    setIsActive(true);
    setRevealedVerses(new Set());
    setCurrentRepeat(0);
    setTotalRepeats(settings.repeatCount);
  }, [settings.repeatCount]);

  const exitHifzMode = useCallback(() => {
    setIsActive(false);
    setRevealedVerses(new Set());
    setRevealedWords(new Set());
    setCurrentRepeat(0);
    setLoopStart(null);
    setLoopEnd(null);
    setIsLooping(false);
    setIsPaused(false);
    // Stop any active loop/repeat in AudioService
    AudioService.stopLoop();
    AudioService.stopRepeat();
  }, []);

  const toggleHifzMode = useCallback(() => {
    if (isActive) {
      exitHifzMode();
    } else {
      enterHifzMode();
    }
  }, [isActive, enterHifzMode, exitHifzMode]);

  // Verse reveal/hide
  const revealVerse = useCallback((verseKey: VerseKey) => {
    setRevealedVerses(prev => {
      const next = new Set(prev);
      next.add(verseKey);
      return next;
    });

    // Auto-hide after delay if configured
    if (settings.autoHideDelay > 0) {
      setTimeout(() => {
        setRevealedVerses(prev => {
          const next = new Set(prev);
          next.delete(verseKey);
          return next;
        });
      }, settings.autoHideDelay);
    }
  }, [settings.autoHideDelay]);

  const hideVerse = useCallback((verseKey: VerseKey) => {
    setRevealedVerses(prev => {
      const next = new Set(prev);
      next.delete(verseKey);
      return next;
    });
  }, []);

  const revealAllVerses = useCallback((verseKeys: VerseKey[]) => {
    setRevealedVerses(new Set(verseKeys));
  }, []);

  const hideAllVerses = useCallback(() => {
    setRevealedVerses(new Set());
  }, []);

  const isVerseRevealed = useCallback((verseKey: VerseKey) => {
    return revealedVerses.has(verseKey);
  }, [revealedVerses]);

  // Convenience methods for reveal/hide all
  const revealAll = useCallback(() => {
    // This will be called with current page verses from the component
    // For now, just set a flag that all should be revealed
    setRevealedVerses(new Set(['__ALL__']));
  }, []);

  const hideAll = useCallback(() => {
    setRevealedVerses(new Set());
    setRevealedWords(new Set());
  }, []);

  // Word reveal/hide (for word-by-word mode)
  const revealWord = useCallback((wordKey: WordKey) => {
    setRevealedWords(prev => {
      const next = new Set(prev);
      next.add(wordKey);
      return next;
    });
    setRevealCounter(c => c + 1);

    // Play word audio if enabled
    if (settings.playWordAudioOnReveal) {
      // wordKey format: "surah:ayah:wordIndex" (e.g., "1:1:0")
      const parts = wordKey.split(':');
      if (parts.length >= 3) {
        const surah = parseInt(parts[0], 10);
        const ayah = parseInt(parts[1], 10);
        const wordIndex = parseInt(parts[2], 10) + 1; // API is 1-indexed
        if (!isNaN(surah) && !isNaN(ayah) && !isNaN(wordIndex)) {
          wordAudioService.playWord(surah, ayah, wordIndex);
        }
      }
    }

    // Auto-hide after delay if configured
    if (settings.autoHideDelay > 0) {
      setTimeout(() => {
        setRevealedWords(prev => {
          const next = new Set(prev);
          next.delete(wordKey);
          return next;
        });
        setRevealCounter(c => c + 1);
      }, settings.autoHideDelay);
    }
  }, [settings.autoHideDelay, settings.playWordAudioOnReveal]);

  const hideWord = useCallback((wordKey: WordKey) => {
    setRevealedWords(prev => {
      const next = new Set(prev);
      next.delete(wordKey);
      return next;
    });
    setRevealCounter(c => c + 1);
  }, []);

  const isWordRevealed = useCallback((wordKey: WordKey) => {
    return revealedWords.has(wordKey);
  }, [revealedWords]);

  const revealNextWord = useCallback((verseKey: VerseKey, totalWords: number) => {
    // Find the next unrevealed word in this verse
    for (let i = 0; i < totalWords; i++) {
      const wordKey = `${verseKey}:${i}`;
      if (!revealedWords.has(wordKey)) {
        revealWord(wordKey);
        return;
      }
    }
    // All words revealed - optionally reveal the whole verse
  }, [revealedWords, revealWord]);

  const getRevealedWordCount = useCallback((verseKey: VerseKey) => {
    let count = 0;
    revealedWords.forEach(wordKey => {
      if (wordKey.startsWith(`${verseKey}:`)) {
        count++;
      }
    });
    return count;
  }, [revealedWords]);

  // Settings updates
  const updateSettings = useCallback(async (newSettings: Partial<HifzSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      // Save async but don't wait for it
      saveSettings(updated);
      return updated;
    });
  }, []);

  const setHideMode = useCallback((mode: HideMode) => {
    updateSettings({ hideMode: mode });
  }, [updateSettings]);

  const setAutoHideDelay = useCallback((delay: number) => {
    updateSettings({ autoHideDelay: delay });
  }, [updateSettings]);

  const setRepeatCount = useCallback((count: number) => {
    updateSettings({ repeatCount: count });
    setTotalRepeats(count);
  }, [updateSettings]);

  const setPauseBetweenRepeats = useCallback((pause: number) => {
    updateSettings({ pauseBetweenRepeats: pause });
  }, [updateSettings]);

  const setPlaybackSpeed = useCallback((speed: number) => {
    updateSettings({ playbackSpeed: speed });
  }, [updateSettings]);

  // Loop control
  const clearLoop = useCallback(() => {
    setLoopStart(null);
    setLoopEnd(null);
    setIsLooping(false);
  }, []);

  const setLoopRange = useCallback((start: VerseKey, end: VerseKey) => {
    setLoopStart(start);
    setLoopEnd(end);
  }, []);

  // Saved loops management
  const saveCurrentLoop = useCallback(async (name: string) => {
    if (!loopStart || !loopEnd) return;

    const newLoop: SavedLoop = {
      id: `loop_${Date.now()}`,
      name,
      startVerse: loopStart,
      endVerse: loopEnd,
      createdAt: Date.now(),
    };

    const updated = [...savedLoops, newLoop];
    setSavedLoops(updated);
    await saveSavedLoops(updated);
  }, [loopStart, loopEnd, savedLoops]);

  const deleteLoop = useCallback(async (loopId: string) => {
    const updated = savedLoops.filter(l => l.id !== loopId);
    setSavedLoops(updated);
    await saveSavedLoops(updated);
  }, [savedLoops]);

  const loadLoop = useCallback((loop: SavedLoop) => {
    setLoopStart(loop.startVerse);
    setLoopEnd(loop.endVerse);
  }, []);

  // Repeat control
  const incrementRepeat = useCallback(() => {
    setCurrentRepeat(prev => prev + 1);
  }, []);

  const resetRepeat = useCallback(() => {
    setCurrentRepeat(0);
  }, []);

  const value: HifzModeContextValue = {
    // State
    isActive,
    settings,
    revealedVerses,
    revealedWords,
    revealCounter,
    currentRepeat,
    totalRepeats,
    loopStart,
    loopEnd,
    loopRange: { start: loopStart, end: loopEnd },
    isLooping,
    isPaused,
    savedLoops,

    // Mode control
    enterHifzMode,
    exitHifzMode,
    toggleHifzMode,

    // Verse reveal/hide
    revealVerse,
    hideVerse,
    revealAllVerses,
    hideAllVerses,
    isVerseRevealed,
    revealAll,
    hideAll,

    // Word reveal/hide
    revealWord,
    hideWord,
    isWordRevealed,
    revealNextWord,
    getRevealedWordCount,

    // Settings
    updateSettings,
    setHideMode,
    setAutoHideDelay,
    setRepeatCount,
    setPauseBetweenRepeats,
    setPlaybackSpeed,

    // Loop control
    setLoopStart,
    setLoopEnd,
    clearLoop,
    setLoopRange,

    // Saved loops
    saveCurrentLoop,
    deleteLoop,
    loadLoop,

    // Repeat control
    setCurrentRepeat,
    incrementRepeat,
    resetRepeat,

    // Playback state
    setIsLooping,
    setIsPaused,
  };

  return (
    <HifzModeContext.Provider value={value}>
      {children}
    </HifzModeContext.Provider>
  );
}

export function useHifzMode() {
  const context = useContext(HifzModeContext);
  if (context === undefined) {
    throw new Error('useHifzMode must be used within a HifzModeProvider');
  }
  return context;
}

export default HifzModeContext;
