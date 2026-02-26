import React, { useState, useCallback, useMemo, useRef, useEffect, useLayoutEffect } from "react";
import { useShallow } from 'zustand/react/shallow';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Modal,
  ScrollView,
  FlatList,
  ActivityIndicator,
  TextInput,
  Animated as RNAnimated,
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import PagerView from "react-native-pager-view";
import * as Haptics from "expo-haptics";

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { Swipeable, GestureDetector, Gesture } from "react-native-gesture-handler";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { MainTabParamList } from "@/navigation/MainTabNavigator";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import Animated, { SlideInUp, SlideOutDown, SlideInDown, useSharedValue, useAnimatedStyle, withTiming, runOnJS } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { useKeepAwake } from "expo-keep-awake";
import { mushafImages } from "@/data/mushaf-images";
import { surahPages } from "@/data/surah-pages";
import { QuranDataBridge } from "@/services/QuranDataBridge";
import { surahs } from "@/data/quran";
import AudioService from "@/services/AudioService";
import { useProgressTracker } from "@/hooks/useProgressTracker";
import { useLayoutDimensions } from "@/hooks/useLayoutDimensions";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { WordScrubber, WordScrubberHandle } from "@/components/WordScrubber";
import { AnimatedAudioWordHighlight } from "@/components/AnimatedAudioWordHighlight";
// Hifz Mode imports
import { HifzModeProvider, useHifzMode } from "@/contexts/HifzModeContext";
import { MushafHifzOverlay } from "@/components/hifz/MushafHifzOverlay";
import { useHifzProgress } from "@/hooks/useHifzProgress";
import { useRevisionSchedule } from "@/hooks/useRevisionSchedule";
import { HIDDEN_TEXT_BG } from "@/constants/hifz";
import type { MemorizationStatus } from "@/types/hifz";
// Coach Marks
import { CoachMark } from "@/components/CoachMark";
import { useFeatureHint } from "@/hooks/useFeatureHint";
import { useTranslation } from "@/hooks/useTranslation";
import { NotesHighlightsPanel } from "@/components/mushaf/NotesHighlightsPanel";
import { BookmarksPanel } from "@/components/mushaf/BookmarksPanel";
import { quranImageService } from "@/services/QuranImageService";
import { QuranDownloadPrompt } from "@/components/mushaf/QuranDownloadPrompt";
import { loadTafsirData } from "@/services/TafsirAssetLoader";

// === MODULE-LEVEL STABLE COMPONENTS ===
// Smart PageSlot: Each slot independently subscribes to the Zustand store.
// When currentPage changes, only ~7 slots where isNear flips actually re-render.
// The parent never re-renders → O(1) instead of O(604).
// Supports jumpTarget for Asymmetric Jump (window=0, mount only target page during jump).
// Page number renders INSIDE each slot → slides with page like a physical Mushaf (Android fix).
const PageSlot = React.memo(({ pageNum, screenWidth, renderPage, pageNumBottomOffset, isDark }: {
  pageNum: number;
  screenWidth: number;
  renderPage: (pageNum: number) => React.ReactNode;
  pageNumBottomOffset: number;
  isDark: boolean;
}) => {
  // Per-slot Zustand selector: re-renders ONLY when this slot's isNear boolean changes
  const isNear = useMushafNavigationStore((state) => {
    if (state.jumpTarget !== null) {
      // Asymmetric Jump: during jump, only mount the target page (window=0)
      return Math.abs(state.jumpTarget - pageNum) <= 1;
    }
    return Math.abs(state.currentPage - pageNum) <= 3;
  });

  return (
    <View style={{ flex: 1, width: screenWidth }}>
      {isNear && renderPage(pageNum)}
      {/* Page number — positioned from TOP using known contentZoneHeight (consistent cross-platform) */}
      {isNear && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: pageNumBottomOffset,
            left: 0,
            right: 0,
            alignItems: 'center',
          }}
        >
          <ThemedText type="caption" style={{ fontSize: 14, opacity: isDark ? 0.6 : 0.4 }}>
            {pageNum}
          </ThemedText>
        </View>
      )}
    </View>
  );
});
import { SurahListOverlay } from "@/components/SurahListOverlay";
import { TafsirSourcesModal } from "@/components/TafsirSourcesModal";
import { TafsirViewerModal } from "@/components/TafsirViewerModal";
import { ReciterPickerModal, AudioSettingsModal, reciters } from "@/components/AudioSettingsModal";
import { AudioPlayerBar, getVersesToPlay } from "@/components/mushaf/AudioPlayerBar";
import { HifzStatusMenu } from "@/components/mushaf/HifzStatusMenu";
import { VerseContextMenu } from "@/components/mushaf/VerseContextMenu";
import { NoteModal } from "@/components/mushaf/NoteModal";
import { useMushafNavigationStore } from "@/stores/useMushafNavigationStore";
import { useMushafAnnotationStore } from "@/stores/useMushafAnnotationStore";
import { useMushafAudioStore } from "@/stores/useMushafAudioStore";
import { useMushafSearchStore } from "@/stores/useMushafSearchStore";
import { useMushafTafsirStore } from "@/stores/useMushafTafsirStore";
import { Feather } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Darken a hex color by a factor (0 = black, 1 = unchanged) for accessible badge text
const darkenHex = (hex: string, factor: number): string => {
  const h = hex.replace('#', '');
  const r = Math.round(parseInt(h.substring(0, 2), 16) * factor);
  const g = Math.round(parseInt(h.substring(2, 4), 16) * factor);
  const b = Math.round(parseInt(h.substring(4, 6), 16) * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

interface VerseRegion {
  surah: number;
  ayah: number;
  verseKey: string;
  page?: number;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  touchX?: number;
  touchY?: number;
}

// Wrapper component that provides HifzModeContext
export default function MushafScreen() {
  return (
    <HifzModeProvider>
      <MushafScreenContent />
    </HifzModeProvider>
  );
}

// Inner component that can use Hifz hooks
function MushafScreenContent() {
  // Loaded from SQLite at app startup via QuranDataBridge.init()
  const quranData = QuranDataBridge.quranData;
  const { theme, isDark } = useTheme();
  const { t, locale } = useTranslation();
  useKeepAwake(); // Keep screen on while reading Quran
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<MainTabParamList, 'QuranTab'>>();

  // Get tab bar height safely - returns 0 if not in tab context (e.g., when navigated from stack)
  const tabBarHeightContext = React.useContext(BottomTabBarHeightContext);
  const tabBarHeight = tabBarHeightContext ?? 0;

  // Get layout dimensions for consistent positioning across devices
  const layout = useLayoutDimensions(tabBarHeight);

  // Calculate responsive scale for player UI (base: 375px iPhone width)
  const playerScale = Math.min(1.3, Math.max(0.85, layout.screenWidth / 375));

  const allCoords = QuranDataBridge.allCoordinates;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Progress tracking
  const { markPageRead, todayProgress, stats } = useProgressTracker();
  const pageReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Network status for offline indicator
  const { isOnline } = useNetworkStatus();

  // Quran image download state
  const [quranPagesReady, setQuranPagesReady] = useState(false);
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);

  // Initialize QuranImageService on mount
  useEffect(() => {
    quranImageService.initialize().then(() => {
      if (quranImageService.arePagesDownloaded()) {
        setQuranPagesReady(true);
      } else {
        setShowDownloadPrompt(true);
      }
    });
  }, []);

  // Log when coordinates are loaded
  React.useEffect(() => {
    // Coordinates loaded
  }, [allCoords]);

  // ---- Zustand stores ----
  const {
    currentPage, setCurrentPage,
    jumpTarget,
    isNavigating, setIsNavigating,
    showSurahList, setShowSurahList,
    navigationMode, setNavigationMode,
    recentPages, addRecentPage,
    juzSortAsc, setJuzSortAsc,
    hizbGranularity, setHizbGranularity,
    showGranularityPicker, setShowGranularityPicker,
    navigationToast, setNavigationToast,
  } = useMushafNavigationStore();

  // Eagerly resolve the active page for UI headers/footers so they display instantly during an asymmetric jump
  const activePage = jumpTarget ?? currentPage;

  const {
    highlights, removeHighlight,
    highlightTimestamps,
    notes, deleteNote: storeDeleteNote,
    noteTimestamps,
    bookmarks, toggleBookmark,
    showNotes, setShowNotes,
    showBookmarks, setShowBookmarks,
  } = useMushafAnnotationStore();

  const {
    showPlayMenu, setShowPlayMenu,
    isLoading, setIsLoading,
    showAudioSettings, setShowAudioSettings,
    showReciterPicker, setShowReciterPicker,
    playUntil, setPlayUntil,
    selectedReciter, setSelectedReciter,
    reciterSearch, setReciterSearch,
    setAudioState,
  } = useMushafAudioStore(useShallow((s) => ({
    showPlayMenu: s.showPlayMenu, setShowPlayMenu: s.setShowPlayMenu,
    isLoading: s.isLoading, setIsLoading: s.setIsLoading,
    showAudioSettings: s.showAudioSettings, setShowAudioSettings: s.setShowAudioSettings,
    showReciterPicker: s.showReciterPicker, setShowReciterPicker: s.setShowReciterPicker,
    playUntil: s.playUntil, setPlayUntil: s.setPlayUntil,
    selectedReciter: s.selectedReciter, setSelectedReciter: s.setSelectedReciter,
    reciterSearch: s.reciterSearch, setReciterSearch: s.setReciterSearch,
    setAudioState: s.setAudioState,
    // NOTE: audioState intentionally EXCLUDED — managed via subscribe + local state
  })));

  // === AUDIO STATE DECOUPLING ===
  // The Zustand audioState updates ~10x/sec (positionMs). If we let it trigger
  // React re-renders, MushafPageInner (defined inside component) gets a new type
  // each render → unmount/remount → image flash.
  //
  // Solution: ALL audio state tracked via refs only. No state = no re-renders.
  const audioStateRef = React.useRef<any>(useMushafAudioStore.getState().audioState);

  React.useEffect(() => {
    const unsub = useMushafAudioStore.subscribe((state) => {
      audioStateRef.current = state.audioState;
      audioPositionRef.current = state.audioState?.positionMs ?? 0;
    });
    return unsub;
  }, []);

  // positionMs ref — updated in the subscriber above (OUTSIDE React render cycle)
  const audioPositionRef = React.useRef(0);

  const {
    showSearchBar, setShowSearchBar,
    searchQuery, setSearchQuery,
    searchResults, setSearchResults,
    isSearching, setIsSearching,
    includeTafsirInSearch, setIncludeTafsirInSearch,
    highlightedVerse, setHighlightedVerse,
    lastSearchTerm, setLastSearchTerm,
  } = useMushafSearchStore();

  const {
    tafsirData, setTafsirData,
    showArabicTafsir, setShowArabicTafsir,
    showTafsirSources, setShowTafsirSources,
    expandedTranslations, setExpandedTranslations,
    expandedTafsirs, setExpandedTafsirs,
    expandedAvailable, setExpandedAvailable,
    expandedAvailableTranslations, setExpandedAvailableTranslations,
    expandedAvailableTafsirs, setExpandedAvailableTafsirs,
    translationLanguageFilter, setTranslationLanguageFilter,
    tafsirLanguageFilter, setTafsirLanguageFilter,
    tafsirVerse, setTafsirVerse,
    availableTafsirs, setAvailableTafsirs,
    downloadingTafsir, setDownloadingTafsir,
    selectedTafsirId, setSelectedTafsirId,
    isSwipingTafsir, setIsSwipingTafsir,
  } = useMushafTafsirStore();

  // Navigate to page from route params (e.g., from reading reminder notification)
  useEffect(() => {
    const pageFromParams = route.params?.page;
    if (pageFromParams && pageFromParams >= 1 && pageFromParams <= 604) {
      setCurrentPage(pageFromParams);
    }
  }, [route.params?.page]);

  // Group coords by verse key for WordScrubber
  const groupedCoordsForScrubber = React.useMemo(() => {
    const pageCoords = allCoords?.[currentPage];
    if (!pageCoords) return {};
    const grouped: Record<string, any[]> = {};
    pageCoords.forEach((coord: any) => {
      const key = `${coord.sura}:${coord.ayah}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(coord);
    });
    return grouped;
  }, [allCoords, currentPage]);

  // Track page reading with 3-second debounce
  useEffect(() => {
    // Clear any existing timer
    if (pageReadTimerRef.current) {
      clearTimeout(pageReadTimerRef.current);
    }

    // Set new timer to mark page as read after 3 seconds
    pageReadTimerRef.current = setTimeout(() => {
      if (currentPage >= 1 && currentPage <= 604) {
        markPageRead(currentPage).catch(err => {
          console.error('Failed to mark page as read:', err);
        });
      }
    }, 3000);

    // Cleanup on unmount or page change
    return () => {
      if (pageReadTimerRef.current) {
        clearTimeout(pageReadTimerRef.current);
      }
    };
  }, [currentPage, markPageRead]);

  // Track recent pages for the Recent tab
  useEffect(() => {
    if (currentPage > 0) {
      addRecentPage(currentPage);
    }
  }, [currentPage]);

  const [selectedVerse, setSelectedVerse] = useState<VerseRegion | null>(null);

  // Note: Image.prefetch() only works with remote URLs, not local require() assets.
  // Local images are already on disk; the bottleneck is bitmap decode which happens
  // automatically when the Image component mounts. No prefetch needed.
  const [isWordScrubberActive, setIsWordScrubberActive] = useState(false);
  const wordScrubberRef = useRef<WordScrubberHandle>(null);

  // currentAudioWordIndexRef is now computed inside MushafPageInner's local rAF loop.
  // This ref is shared across MushafPageInner instances for the coach mark check.
  const currentAudioWordIndexRef = React.useRef(-1);

  // Get the current playing verse key for word-level highlighting (from ref, no re-render)
  const currentPlayingVerseKeyRef = React.useRef<string | null>(null);

  const [showHifzStatusMenu, setShowHifzStatusMenu] = useState(false);
  const [showHifzControlPanel, setShowHifzControlPanel] = useState(false);
  const [hifzMenuVerseKey, setHifzMenuVerseKey] = useState<string | null>(null);
  const [hifzMenuPosition, setHifzMenuPosition] = useState({ x: 0, y: 0 });
  const [showHifzTooltip, setShowHifzTooltip] = useState(false);
  const [showHifzCoachMark, setShowHifzCoachMark] = useState(false);

  // Hifz Mode hooks
  const hifzMode = useHifzMode();
  const { progress: hifzProgress, markVerse: markHifzVerse } = useHifzProgress();
  const { dueRevisions, isVerseDueForRevision } = useRevisionSchedule();

  // Feature hints for one-time coach marks
  const { shouldShowHint, markHintSeen } = useFeatureHint();
  const [showScrubberCoachMark, setShowScrubberCoachMark] = useState(false);
  const hasShownScrubberHint = useRef(false);

  // Show word scrubber coach mark on first audio play with word highlighting
  useEffect(() => {
    if (!audioStateRef.current?.isPlaying) return;
    const checkCoachMark = () => {
      if (
        currentAudioWordIndexRef.current >= 0 &&
        !hasShownScrubberHint.current &&
        shouldShowHint('word_scrubber')
      ) {
        hasShownScrubberHint.current = true;
        setTimeout(() => setShowScrubberCoachMark(true), 1500);
      }
    };
    // Check once after a delay
    const timer = setTimeout(checkCoachMark, 2000);
    return () => clearTimeout(timer);
  }, [shouldShowHint]);

  // Function to remove Arabic diacritics and normalize text for better search matching
  const normalizeArabicText = (text: string) => {
    return text
      // Remove all diacritics
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[\u0617-\u061A\u064B-\u065F]/g, '')
      // Remove tatweel (kashida)
      .replace(/\u0640/g, '')
      // Remove Quranic symbols and markers
      .replace(/[\u0600-\u0605\u0610-\u061A\u06D6-\u06ED]/g, '')
      // Normalize alef variations
      .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627') // Ø£ Ø¥ Ø¢ Ù± -> Ø§
      // Normalize teh marbuta and heh
      .replace(/\u0629/g, '\u0647') // Ø© -> Ù‡
      // Normalize yeh variations
      .replace(/[\u0649\u064A\u06CC\u06D0]/g, '\u064A') // Ù‰ ÙŠ ÛŒ Û -> ÙŠ
      // Normalize waw with hamza
      .replace(/\u0624/g, '\u0648') // Ø¤ -> Ùˆ
      // Remove zero-width characters and special spaces
      .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '')
      // Remove Arabic presentation forms
      .replace(/[\uFB50-\uFDFF\uFE70-\uFEFF]/g, (char) => {
        // Convert presentation forms back to normal forms
        const code = char.charCodeAt(0);
        if (code >= 0xFE70 && code <= 0xFEFF) {
          // This is a presentation form, try to get base character
          return char.normalize('NFKD');
        }
        return char;
      })
      // Normalize Unicode
      .normalize('NFKD')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  };

  // Search function
  const performSearch = useCallback(async (query: string, searchTafsir: boolean) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const searchTerm = normalizeArabicText(query);
    const results: any[] = [];

    // Load tafsir data if needed
    let tafsirData: any = null;
    if (searchTafsir) {
      try {
        const [jalalayn, abridged, sahihInternational] = await Promise.all([
          loadTafsirData('jalalayn'),
          loadTafsirData('abridged'),
          loadTafsirData('sahih-international')
        ]);
        tafsirData = { jalalayn, abridged, sahihInternational };
      } catch (e) {
        console.error('Failed to load tafsir for search:', e);
      }
    }

    // Search through all verses
    quranData.data.surahs.forEach((surah: any) => {
      surah.ayahs.forEach((ayah: any) => {
        const verseKey = `${surah.number}:${ayah.numberInSurah}`;
        const arabicText = normalizeArabicText(ayah.text || '');
        const surahNameEn = surahs.find(s => s.number === surah.number)?.nameEn?.toLowerCase() || '';
        const surahNameAr = normalizeArabicText(surahs.find(s => s.number === surah.number)?.nameAr || '');

        let matchType: string | null = null;

        // Check if matches verse reference (e.g., "2:255")
        if (verseKey.includes(searchTerm)) {
          matchType = 'reference';
        }
        // Check if matches Arabic text
        else if (arabicText.includes(searchTerm)) {
          matchType = 'arabic';
        }
        // Check if matches surah name
        else if (surahNameEn.includes(searchTerm) || surahNameAr.includes(searchTerm)) {
          matchType = 'surah';
        }
        // Check tafsir if enabled
        else if (searchTafsir && tafsirData) {
          const jalalaynText = normalizeArabicText(tafsirData.jalalayn[verseKey]?.text || '');
          const abridgedText = (tafsirData.abridged[verseKey]?.text || '').toLowerCase();
          const sahihText = (tafsirData.sahihInternational[verseKey]?.t || '').toLowerCase();

          if (jalalaynText.includes(searchTerm)) {
            matchType = 'tafsir';
            // Store which tafsir matched and preview text
            let fullText = tafsirData.jalalayn[verseKey]?.text || '';
            // Strip HTML tags from preview
            fullText = fullText.replace(/<[^>]*>/g, '');
            fullText = fullText.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
            const matchIndex = jalalaynText.indexOf(searchTerm);
            const previewStart = Math.max(0, matchIndex - 50);
            const previewEnd = Math.min(fullText.length, matchIndex + 100);
            results.push({
              surah: surah.number,
              ayah: ayah.numberInSurah,
              page: ayah.page,
              text: ayah.text,
              matchType,
              verseKey,
              tafsirSource: 'jalalayn',
              tafsirPreview: fullText.substring(previewStart, previewEnd) + '...',
            });
            return; // Skip adding duplicate
          } else if (abridgedText.includes(searchTerm)) {
            matchType = 'tafsir';
            // Store which tafsir matched and preview text
            const fullText = tafsirData.abridged[verseKey]?.text || '';
            const matchIndex = abridgedText.indexOf(searchTerm);
            const previewStart = Math.max(0, matchIndex - 50);
            const previewEnd = Math.min(fullText.length, matchIndex + 100);
            results.push({
              surah: surah.number,
              ayah: ayah.numberInSurah,
              page: ayah.page,
              text: ayah.text,
              matchType,
              verseKey,
              tafsirSource: 'abridged',
              tafsirPreview: fullText.substring(previewStart, previewEnd) + '...',
            });
            return; // Skip adding duplicate
          } else if (sahihText.includes(searchTerm)) {
            matchType = 'tafsir';
            // Store which tafsir matched and preview text
            const fullText = tafsirData.sahihInternational[verseKey]?.t || '';
            const matchIndex = sahihText.indexOf(searchTerm);
            const previewStart = Math.max(0, matchIndex - 50);
            const previewEnd = Math.min(fullText.length, matchIndex + 100);
            results.push({
              surah: surah.number,
              ayah: ayah.numberInSurah,
              page: ayah.page,
              text: ayah.text,
              matchType,
              verseKey,
              tafsirSource: 'sahih-international',
              tafsirPreview: fullText.substring(previewStart, previewEnd) + '...',
            });
            return; // Skip adding duplicate
          }
        }

        if (matchType) {
          results.push({
            surah: surah.number,
            ayah: ayah.numberInSurah,
            page: ayah.page,
            text: ayah.text,
            matchType,
            verseKey,
          });
        }
      });
    });

    // Limit results to 50 for performance
    setSearchResults(results.slice(0, 50));
    setIsSearching(false);
  }, []);

  // Debounced search
  React.useEffect(() => {
    // Show searching indicator immediately when user types (if query is valid)
    if (searchQuery && searchQuery.trim().length >= 2) {
      setIsSearching(true);
    }

    const timer = setTimeout(() => {
      performSearch(searchQuery, includeTafsirInSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, includeTafsirInSearch, performSearch]);
  const buttonOpacity = useSharedValue(1);

  // Navigation fade overlay animation
  const navigationFadeOpacity = useSharedValue(0);

  // Animate fade when navigating to distant pages
  useEffect(() => {
    if (isNavigating) {
      // Fade in quickly
      navigationFadeOpacity.value = withTiming(1, { duration: 150 });
    } else {
      // Fade out after page loads
      navigationFadeOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isNavigating]);

  const navigationFadeStyle = useAnimatedStyle(() => ({
    opacity: navigationFadeOpacity.value,
  }));

  const pagerViewRef = React.useRef<PagerView>(null);

  // Handle navigation params to go to specific surah/ayah/page (e.g., from Dua detail "View in Quran" or Ramadan mode)
  React.useEffect(() => {
    const params = route.params;
    if (params?.page || params?.surahNumber) {
      // Find the page for this specific verse
      let targetPage: number | null = null;

      // Direct page navigation (e.g., from Ramadan Quran schedule)
      if (params.page) {
        targetPage = params.page;
      } else if (params.ayahNumber && params.surahNumber) {
        // Find the exact page for this ayah
        const surah = quranData.data.surahs.find((s: any) => s.number === params.surahNumber);
        if (surah) {
          const ayah = surah.ayahs.find((a: any) => a.numberInSurah === params.ayahNumber);
          if (ayah) {
            targetPage = ayah.page;
          }
        }
      }

      // Fallback to surah start page if ayah not found
      if (!targetPage && params.surahNumber) {
        targetPage = surahPages[params.surahNumber];
      }

      // Ensure page is within valid range (1-604)
      if (targetPage) {
        targetPage = Math.max(1, Math.min(604, targetPage));

        // Small delay to ensure FlatList is ready
        setTimeout(() => {
          const pageIndex = Math.max(0, Math.min(603, 604 - targetPage!));
          const offset = pageIndex * layout.screenWidth;
          pagerViewRef.current?.setPageWithoutAnimation(604 - targetPage!);
          setCurrentPage(targetPage!);

          // If ayah is specified, highlight it with a flash effect
          if (params.ayahNumber && params.surahNumber) {
            const verseKey = `${params.surahNumber}:${params.ayahNumber}`;
            // Flash the highlight 3 times for visibility
            let flashCount = 0;
            const flashInterval = setInterval(() => {
              flashCount++;
              if (flashCount % 2 === 1) {
                setHighlightedVerse(verseKey);
              } else {
                setHighlightedVerse(null);
              }
              if (flashCount >= 6) {
                clearInterval(flashInterval);
                // Keep it highlighted for a bit longer after flashing
                setHighlightedVerse(verseKey);
                setTimeout(() => setHighlightedVerse(null), 2000);
              }
            }, 300);
          }
        }, 500);
      }
    }
  }, [route.params]);

  React.useEffect(() => {
    AsyncStorage.getItem('@selectedTafsir').then(id => {
      if (id) setSelectedTafsirId(id);
    });
    const unsubscribe = AudioService.subscribe(setAudioState);
    return () => { unsubscribe(); };
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      buttonOpacity.value = withTiming(0.3, { duration: 300 });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const showButtons = () => {
    buttonOpacity.value = withTiming(1, { duration: 200 });
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  // Callback for SurahListOverlay to scroll the pager
  const scrollToPage = useCallback((page: number) => {
    const pageIndex = 604 - page;
    pagerViewRef.current?.setPageWithoutAnimation(pageIndex);
  }, []);

  const handleVersePress = useCallback((verse: VerseRegion) => {
    setSelectedVerse(verse);
  }, []);

  const closeMenu = useCallback(() => {
    setSelectedVerse(null);
  }, []);

  const handleTafsirPress = useCallback(async () => {
    if (!selectedVerse) return;
    setTafsirVerse(selectedVerse); // Save the verse for tafsir
    closeMenu();
    try {
      const savedTafsirId = await AsyncStorage.getItem('@selectedTafsir') || 'abridged';
      const key = selectedVerse.verseKey;
      let tafsirContent: { text: string } | null = null;

      // Try loading from downloaded file
      const tafsirPath = `${FileSystem.documentDirectory}tafsirs/${savedTafsirId}.json`;
      const fileInfo = await FileSystem.getInfoAsync(tafsirPath);

      if (fileInfo.exists) {
        const fileContent = await FileSystem.readAsStringAsync(tafsirPath);
        const response = JSON.parse(fileContent);
        const tafsirData = response.data || response;

        if (tafsirData.surahs) {
          const surah = tafsirData.surahs.find((s: any) => s.number === selectedVerse.surah);
          const ayah = surah?.ayahs?.find((a: any) => a.numberInSurah === selectedVerse.ayah);
          tafsirContent = ayah ? { text: ayah.text || 'No tafsir available' } : { text: 'No tafsir available for this verse' };
        } else {
          const entry = tafsirData[key];

          // Check if it's a word-by-word translation (has keys like "1:1:1", "1:1:2", etc.)
          if (!entry && key) {
            const [surah, ayah] = key.split(':');
            const wordKeys = Object.keys(tafsirData).filter(k => k.startsWith(`${surah}:${ayah}:`));

            if (wordKeys.length > 0) {
              // Combine all words for this verse
              const words = wordKeys
                .sort((a, b) => {
                  const aWord = parseInt(a.split(':')[2]);
                  const bWord = parseInt(b.split(':')[2]);
                  return aWord - bWord;
                })
                .map(k => tafsirData[k])
                .join(' ');
              tafsirContent = { text: words };
            } else {
              tafsirContent = { text: 'No tafsir available for this verse' };
            }
          } else {
            tafsirContent = entry ? { text: entry.t || entry.text || entry.tafsir || entry.content || 'No tafsir available' } : { text: 'No tafsir available for this verse' };
          }
        }
      } else {
        // Tafsir not downloaded — open sources modal so user can download it
        console.log(`[MushafScreen] Tafsir not downloaded: ${savedTafsirId}`);
        setShowTafsirSources(true);
        return;
      }

      setTafsirData(tafsirContent ? { en: tafsirContent, ar: tafsirContent } : null);
    } catch (e) {
      console.error("Failed to load tafsir:", e);
      setTafsirData(null);
    }
  }, [selectedVerse, closeMenu]);

  const toggleTafsirLanguage = useCallback(async () => {
    const newValue = !showArabicTafsir;
    setShowArabicTafsir(newValue);
    try {
      await AsyncStorage.setItem("@tafsir_language", newValue ? "ar" : "en");
    } catch (e) {
      console.error("Failed to save tafsir preference:", e);
    }
  }, [showArabicTafsir]);

  const getVersesOnPage = (pageNum: number) => {
    const allVerses: any[] = [];
    quranData.data.surahs.forEach((surah: any) => {
      surah.ayahs.forEach((ayah: any) => {
        if (ayah.page === pageNum) {
          allVerses.push({
            surah: surah.number,
            ayah: ayah.numberInSurah,
            verseKey: `${surah.number}:${ayah.numberInSurah}`,
          });
        }
      });
    });
    return allVerses;
  };

  // === STABLE COMPONENT TYPE via useRef ===
  // MushafPageInner must have a stable type identity across re-renders.
  // If defined as `const MushafPageInner = React.memo(...)` inside the component,
  // each render creates a NEW type → React unmounts/remounts → showOverlays resets → flash.
  //
  // Fix: create the component ONCE in a ref. It reads parent state from depsRef.current
  // (always up-to-date) instead of closures (stale after first render).
  const pageInnerDepsRef = useRef<any>({});
  pageInnerDepsRef.current = {
    allCoords, layout, surahs, quranData, mushafImages: (mushafImages as any),
    isDark, theme, hifzMode, hifzProgress, isVerseDueForRevision,
    highlights, notes, selectedVerse, highlightedVerse, handleVersePress,
    isWordScrubberActive, setIsWordScrubberActive, wordScrubberRef,
    setShowHifzStatusMenu, setHifzMenuVerseKey, setHifzMenuPosition,
    currentAudioWordIndexRef, setSelectedVerse, setShowDownloadPrompt, t,
  };

  // Create MushafPageInner ONCE — type is stable forever
  const mushafPageInnerRef = useRef<React.FC<{ pageNum: number }> | null>(null);
  if (!mushafPageInnerRef.current) {
    mushafPageInnerRef.current = ({ pageNum }: { pageNum: number }) => {
      // Read ALL parent state from depsRef (always latest values via .current)
      const {
        allCoords, layout, surahs, quranData, mushafImages,
        isDark, theme, hifzMode, hifzProgress, isVerseDueForRevision,
        highlights, notes, selectedVerse, highlightedVerse, handleVersePress,
        isWordScrubberActive, setIsWordScrubberActive, wordScrubberRef,
        setShowHifzStatusMenu, setHifzMenuVerseKey, setHifzMenuPosition,
        currentAudioWordIndexRef, setShowDownloadPrompt, t,
      } = pageInnerDepsRef.current;

      const [showOverlays, setShowOverlays] = React.useState(false);

      // === LOCAL AUDIO STATE ===
      // Each MushafPageInner subscribes to Zustand directly (not rAF polling).
      // Only fires when store changes (~10x/sec during playback, 0 when idle).
      const [localAudioState, setLocalAudioState] = React.useState(() => {
        const as = useMushafAudioStore.getState().audioState;
        const isPlaying = !!as?.isPlaying;
        const verseKey = as?.current ? `${as.current.surah}:${as.current.ayah}` : null;
        const segments = as?.segments || null;
        const positionMs = as?.positionMs ?? 0;
        let wordIdx = -1;
        if (isPlaying && segments?.length) {
          for (const seg of segments) {
            const [wIdx, startMs, endMs] = seg;
            if (positionMs >= startMs && positionMs < endMs) { wordIdx = wIdx; break; }
          }
          if (wordIdx === -1 && segments.length > 0 && positionMs < segments[0][1]) {
            wordIdx = segments[0][0];
          }
        }
        return { wordIndex: wordIdx, playingVerseKey: verseKey, isPlaying, segments };
      });

      React.useEffect(() => {
        let prevWordIdx = -1;
        let prevVerseKey: string | null = null;
        let prevIsPlaying = false;

        const unsub = useMushafAudioStore.subscribe((state) => {
          const as = state.audioState;
          const isPlaying = !!as?.isPlaying;
          const verseKey = as?.current ? `${as.current.surah}:${as.current.ayah}` : null;
          const segments = as?.segments || null;
          const positionMs = as?.positionMs ?? 0;

          // Compute word index
          let wordIdx = -1;
          if (isPlaying && segments?.length) {
            for (const seg of segments) {
              const [wIdx, startMs, endMs] = seg;
              if (positionMs >= startMs && positionMs < endMs) {
                wordIdx = wIdx;
                break;
              }
            }
            if (wordIdx === -1 && segments.length > 0 && positionMs < segments[0][1]) {
              wordIdx = segments[0][0];
            }
          }

          // Only setState when something visually changed
          if (wordIdx !== prevWordIdx || verseKey !== prevVerseKey || isPlaying !== prevIsPlaying) {
            prevWordIdx = wordIdx;
            prevVerseKey = verseKey;
            prevIsPlaying = isPlaying;
            currentAudioWordIndexRef.current = wordIdx;
            setLocalAudioState({ wordIndex: wordIdx, playingVerseKey: verseKey, isPlaying, segments });
          }
        });

        return unsub;
      }, []);

      React.useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
          setShowOverlays(true);
        });
        return () => task.cancel();
      }, [pageNum]);

      const pageCoords = allCoords?.[pageNum];

      // Use layout dimensions for consistent positioning across devices
      const { screenWidth, imageScale, imageHeight, imageOffsetY, contentZoneHeight } = layout;

      // Memoize heavy coordinate computation - only runs when overlays are shown
      const verseGroups = React.useMemo(() => {
        if (!showOverlays || !pageCoords) return new Map<string, any[]>();
        const groups = new Map<string, any[]>();
        pageCoords.forEach((coord: any) => {
          const key = `${coord.sura}:${coord.ayah}`;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(coord);
        });
        return groups;
      }, [pageCoords, showOverlays]);

      const firstVerse = pageCoords?.[0];
      const pageSurahNum = firstVerse?.sura || 1;
      const pageSurah = surahs.find(s => s.number === pageSurahNum);

      const verseData = quranData.data.surahs
        .find((s: any) => s.number === pageSurahNum)
        ?.ayahs.find((a: any) => a.numberInSurah === firstVerse?.ayah);
      const pageJuz = verseData?.juz || 1;
      const pageHizb = verseData?.hizbQuarter ? Math.ceil(verseData.hizbQuarter / 4) : 1;

      // === SMART PLACEHOLDER: Intercept missing pages ===
      // If image not available (pages 6-604 not downloaded), render download CTA
      // instead of Image + interactive overlays. This prevents ghost taps,
      // blind annotations, and other UX issues on empty pages.
      const pageSource = mushafImages[pageNum];
      if (!pageSource) {
        return (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 32,
            gap: 16,
          }}>
            <Feather
              name="cloud"
              size={56}
              color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}
            />
            <ThemedText type="h4" style={{
              textAlign: 'center',
            }}>
              {t('mushaf.downloadRequired')}
            </ThemedText>
            <ThemedText type="caption" style={{
              textAlign: 'center',
              lineHeight: 20,
            }}>
              {t('mushaf.pageRequiresDownload', { page: pageNum })}
            </ThemedText>
            <Pressable
              onPress={() => setShowDownloadPrompt(true)}
              style={({ pressed }) => ({
                backgroundColor: pressed
                  ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)')
                  : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                paddingHorizontal: 28,
                paddingVertical: 12,
                borderRadius: 12,
                marginTop: 4,
              })}
            >
              <ThemedText type="body" style={{
                fontWeight: '600',
                color: theme.primary,
              }}>
                {t('mushaf.downloadNow')}
              </ThemedText>
            </Pressable>
          </View>
        );
      }

      // RNGH scrubber gesture: Pan with activateAfterLongPress runs in C++
      // Solves Android touch-steal bug where Pressable.onTouchMove dies after onLongPress
      const isHifzActive = hifzMode.isActive;
      const scrubberGesture = Gesture.Pan()
        .activateAfterLongPress(400)
        .enabled(!isHifzActive) // Disabled in Hifz mode so Hifz long press works
        .onStart((e) => {
          'worklet';
          runOnJS(setIsWordScrubberActive)(true);
          runOnJS((pos: { x: number, y: number }) => {
            wordScrubberRef.current?.updatePosition(pos.x, pos.y);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          })({ x: e.absoluteX, y: e.absoluteY });
        })
        .onUpdate((e) => {
          'worklet';
          runOnJS((pos: { x: number, y: number }) => {
            wordScrubberRef.current?.updatePosition(pos.x, pos.y);
          })({ x: e.absoluteX, y: e.absoluteY });
        })
        .onEnd(() => {
          'worklet';
          runOnJS(setIsWordScrubberActive)(false);
        })
        .onTouchesCancelled(() => {
          'worklet';
          runOnJS(setIsWordScrubberActive)(false);
        });

      return (
        <GestureDetector gesture={scrubberGesture}>
          <View
            style={[styles.pageContainer, {
              width: screenWidth,
              height: contentZoneHeight,
            }]}
          >
            <Image
              source={mushafImages[pageNum]}
              style={[styles.mushafImage, {
                width: screenWidth,
                height: imageHeight,
                top: imageOffsetY,
                tintColor: isDark ? '#FFFFFF' : undefined,
              }]}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={0}
              key={`theme-${isDark}-${pageNum}`}
            />
            {showOverlays && Array.from(verseGroups.entries()).flatMap(([verseKey, coords]) => {
              const [surah, ayah] = verseKey.split(':');

              // Hifz mode state (shared for all rendering modes)
              const isHifzActive = hifzMode.isActive;
              const isWordMode = isHifzActive && hifzMode.settings.hideMode === 'word';
              const isVerseRevealed = hifzMode.isVerseRevealed(verseKey) || hifzMode.revealedVerses.has('__ALL__');
              const isDueForRevision = isVerseDueForRevision(verseKey);
              const verseProgress = hifzProgress?.verses?.[verseKey];
              const hifzActiveColor = theme.primary;
              const hiddenBgColor = isDark ? HIDDEN_TEXT_BG.dark : HIDDEN_TEXT_BG.light;

              // Word-by-word mode: render individual word overlays
              if (isWordMode) {
                // Filter out null ayah entries (verse markers) and render each word
                const rawWordCoords = coords.filter((c: any) => c.ayah !== null);

                // Deduplicate coords - some verses have duplicate coordinate entries
                const seenCoords = new Set<string>();
                const wordCoords = rawWordCoords.filter((c: any) => {
                  const key = `${c.x}-${c.y}-${c.width}-${c.height}`;
                  if (seenCoords.has(key)) return false;
                  seenCoords.add(key);
                  return true;
                });

                const lastWordIdx = wordCoords.length - 1;

                return wordCoords.map((coord: any, wordIdx: number) => {
                  const wordKey = `${verseKey}:${wordIdx}`;
                  // Check directly against the Set to ensure we get the latest value
                  const isWordRevealed = hifzMode.revealedWords.has(wordKey) || isVerseRevealed;
                  const isWordHidden = !isWordRevealed;
                  const isLastWord = wordIdx === lastWordIdx;
                  const actualBgColor = isWordHidden ? hiddenBgColor : 'transparent';

                  return (
                    <Pressable
                      key={`word-${wordKey}`}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Word ${wordIdx + 1} of verse ${surah}:${ayah}${isWordHidden ? ', hidden, tap to reveal' : ''}`}
                      accessibilityHint="Tap to reveal this word, long press for memorization options"
                      style={[styles.verseRegion, {
                        left: (coord.x * imageScale) - 3,
                        top: (coord.y * imageScale) + imageOffsetY - 2,
                        width: Math.max(coord.width * imageScale, 20) + 6,
                        height: Math.max(coord.height * imageScale, 20) + 4,
                        backgroundColor: actualBgColor,
                        borderRadius: isWordHidden ? 4 : 6,
                      }]}
                      onPress={() => {
                        if (isWordHidden) {
                          hifzMode.revealWord(wordKey);
                        } else {
                          // If verse is revealed (from full verse mode or reveal all), 
                          // we need to hide the verse first, then reveal all OTHER words except this one
                          if (isVerseRevealed) {
                            hifzMode.hideVerse(verseKey);
                            for (let i = 0; i < wordCoords.length; i++) {
                              if (i !== wordIdx) {
                                hifzMode.revealWord(`${verseKey}:${i}`);
                              }
                            }
                          } else {
                            hifzMode.hideWord(wordKey);
                          }
                        }
                      }}
                      onLongPress={(e) => {
                        // Long press shows Hifz status menu (same as solid mode)
                        const { pageX, pageY } = e.nativeEvent;
                        setHifzMenuVerseKey(verseKey);
                        setHifzMenuPosition({ x: pageX, y: pageY });
                        setShowHifzStatusMenu(true);
                      }}
                      delayLongPress={500}
                    >
                      {/* Loop start indicator (A) on first word - right side for RTL */}
                      {wordIdx === 0 && hifzMode.loopStart === verseKey && (
                        <View style={[styles.loopIndicator, { backgroundColor: '#3B82F6', right: 0 }]}>
                          <ThemedText style={styles.loopIndicatorText}>A</ThemedText>
                        </View>
                      )}
                      {/* Loop end indicator (B) on first word - right side for RTL (same position as A but different verse) */}
                      {wordIdx === 0 && hifzMode.loopEnd === verseKey && (
                        <View style={[styles.loopIndicator, { backgroundColor: '#3B82F6', right: 16 }]}>
                          <ThemedText style={styles.loopIndicatorText}>B</ThemedText>
                        </View>
                      )}
                      {/* Memorization status indicator on first word (start of verse in RTL) */}
                      {wordIdx === 0 && verseProgress && (
                        <View style={[
                          styles.memorizationIndicator,
                          {
                            backgroundColor: verseProgress.status === 'memorized'
                              ? theme.primary
                              : verseProgress.status === 'in_progress'
                                ? '#F59E0B'
                                : 'transparent'
                          }
                        ]} />
                      )}
                      {/* Due for revision badge on first word */}
                      {wordIdx === 0 && isDueForRevision && (
                        <View style={[styles.revisionBadge, { backgroundColor: '#EF4444' }]} />
                      )}
                    </Pressable>
                  );
                });
              } else {
                // Solid mode (default): render merged verse regions per line
                const lineGroups = new Map<number, any[]>();
                coords.forEach((c: any) => {
                  if (!lineGroups.has(c.line)) lineGroups.set(c.line, []);
                  lineGroups.get(c.line)!.push(c);
                });

                // Check if this verse is currently playing AND has word-level timing data
                const isCurrentVersePlaying = localAudioState.playingVerseKey === verseKey;
                const hasWordTiming = isCurrentVersePlaying && localAudioState.segments?.length > 0;

                // Prepare word coordinates for word-level highlighting (if needed)
                let wordCoords: any[] = [];
                if (hasWordTiming) {
                  // Filter out null ayah entries (verse markers) and deduplicate
                  const rawWordCoords = coords.filter((c: any) => c.ayah !== null);
                  const seenCoords = new Set<string>();
                  wordCoords = rawWordCoords.filter((c: any) => {
                    const key = `${c.x}-${c.y}-${c.width}-${c.height}`;
                    if (seenCoords.has(key)) return false;
                    seenCoords.add(key);
                    return true;
                  });

                  // Debug: Log word count mismatch
                  const segmentCount = localAudioState.segments?.length || 0;
                  if (wordCoords.length !== segmentCount) {
                    console.log('[MushafScreen] Word count mismatch:', {
                      verseKey,
                      wordCoordsCount: wordCoords.length,
                      segmentCount,
                      currentWordIndex: localAudioState.wordIndex,
                    });
                  }
                }

                // Render line-based verse regions + word-level highlights
                const lineElements = Array.from(lineGroups.values()).map((lineCoords, idx) => {
                  const minX = Math.min(...lineCoords.map(c => c.x));
                  const minY = Math.min(...lineCoords.map(c => c.y));
                  const maxX = Math.max(...lineCoords.map(c => c.x + c.width));
                  const maxY = Math.max(...lineCoords.map(c => c.y + c.height));

                  const isAudioPlaying = localAudioState.playingVerseKey === verseKey;
                  const isSelected = selectedVerse?.verseKey === verseKey;
                  const isHighlighted = highlightedVerse === verseKey;
                  const highlightColor = highlights[verseKey] || (notes[verseKey] ? `${theme.primary}26` : null);

                  const isHidden = isHifzActive && !isVerseRevealed;

                  // Determine background color with Hifz mode priority
                  // When word-level timing is available, use lighter verse highlight (words will be highlighted individually)
                  let bgColor = 'transparent';
                  if (isHidden) {
                    bgColor = hiddenBgColor;
                  } else if (isHighlighted) {
                    bgColor = `${theme.primary}80`; // Bright highlight for navigation
                  } else if (isAudioPlaying) {
                    // Always use subtle verse highlight when audio is playing
                    // Word overlay provides bright highlight on the current word when timing data is available
                    // This prevents flash from full verse -> word highlight when segments load
                    bgColor = `${theme.primary}1A`; // 10% opacity - subtle verse indicator
                  } else if (highlightColor) {
                    bgColor = highlightColor;
                  } else if (isSelected) {
                    bgColor = 'rgba(76, 175, 80, 0.2)';
                  } else if (isHifzActive && isDueForRevision) {
                    bgColor = 'rgba(239, 68, 68, 0.15)'; // Red tint for due revision
                  }

                  return (
                    <Pressable
                      key={`${verseKey}-${idx}`}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Verse ${surah}:${ayah}${isHidden ? ', hidden, tap to reveal' : ''}${isDueForRevision ? ', due for revision' : ''}`}
                      accessibilityHint={isHifzActive ? 'Tap to reveal verse, long press for memorization options' : 'Tap to select verse'}
                      style={[styles.verseRegion, {
                        left: (minX * imageScale) - 3,
                        top: (minY * imageScale) + imageOffsetY - 2,
                        width: ((maxX - minX) * imageScale) + 6,
                        height: ((maxY - minY) * imageScale) + 4,
                        backgroundColor: bgColor,
                        borderRadius: isHidden ? 4 : 6,
                      }]}
                      onPress={(e) => {
                        const { pageX, pageY } = e.nativeEvent;
                        // In Hifz mode, tap only reveals/hides verse (no menu)
                        if (isHifzActive) {
                          if (isVerseRevealed) {
                            hifzMode.hideVerse(verseKey);
                          } else {
                            hifzMode.revealVerse(verseKey);
                          }
                          return; // Don't open verse menu in Hifz mode
                        }
                        // Normal mode: open verse menu
                        handleVersePress({ surah: parseInt(surah), ayah: parseInt(ayah), verseKey, touchX: pageX, touchY: pageY });
                      }}
                      onLongPress={(e) => {
                        const { pageX, pageY } = e.nativeEvent;
                        // Hifz mode only: long press shows Hifz status menu
                        // Word scrubber is handled by parent RNGH GestureDetector
                        if (isHifzActive) {
                          setHifzMenuVerseKey(verseKey);
                          setHifzMenuPosition({ x: pageX, y: pageY });
                          setShowHifzStatusMenu(true);
                        }
                      }}
                      delayLongPress={500}
                    >
                      {/* Loop start indicator (A) - right side for RTL (first word position) */}
                      {isHifzActive && hifzMode.loopStart === verseKey && idx === 0 && (
                        <View style={[styles.loopIndicator, { backgroundColor: '#3B82F6', right: 0 }]}>
                          <ThemedText style={styles.loopIndicatorText}>A</ThemedText>
                        </View>
                      )}
                      {/* Loop end indicator (B) - right side for RTL (first word position, offset from A) */}
                      {isHifzActive && hifzMode.loopEnd === verseKey && idx === 0 && (
                        <View style={[styles.loopIndicator, { backgroundColor: '#3B82F6', right: 16 }]}>
                          <ThemedText style={styles.loopIndicatorText}>B</ThemedText>
                        </View>
                      )}
                      {/* Hidden verse indicator */}
                      {isHidden && (
                        <View style={styles.hiddenVerseOverlay}>
                          <View style={[styles.hiddenLine, { backgroundColor: theme.border }]} />
                          <View style={[styles.hiddenLineShort, { backgroundColor: theme.border }]} />
                        </View>
                      )}
                      {/* Due for revision badge */}
                      {isHifzActive && isDueForRevision && idx === 0 && (
                        <View style={[styles.revisionBadge, { backgroundColor: '#EF4444' }]} />
                      )}
                      {/* Memorization status indicator */}
                      {isHifzActive && verseProgress && idx === 0 && (
                        <View style={[
                          styles.memorizationIndicator,
                          {
                            backgroundColor: verseProgress.status === 'memorized'
                              ? theme.primary
                              : verseProgress.status === 'in_progress'
                                ? '#F59E0B'
                                : 'transparent'
                          }
                        ]} />
                      )}
                    </Pressable>
                  );
                });

                // Add word-level highlight overlay for the currently playing word (animated)
                const wordHighlightElements: React.ReactNode[] = [];
                if (hasWordTiming && wordCoords.length > 0) {
                  wordHighlightElements.push(
                    <AnimatedAudioWordHighlight
                      key={`word-highlight-${verseKey}`}
                      wordCoords={wordCoords}
                      currentWordIndex={localAudioState.wordIndex}
                      imageScale={imageScale}
                      imageOffsetY={imageOffsetY}
                      primaryColor={theme.primary}
                      verseKey={verseKey}
                    />
                  );
                }

                return [...lineElements, ...wordHighlightElements];
              }
            })}
          </View>
        </GestureDetector>
      );
    };
  }
  const MushafPageInner = mushafPageInnerRef.current!;

  return (
    <ThemedView style={styles.container}>
      {/* Safe Area Top Spacer */}
      <View style={{ height: layout.safeAreaTop }} />

      {/* Header Zone - contains Juz/Hizb, Action Pill, Surah info */}
      <View style={[styles.headerZone, { height: layout.headerZoneHeight }]}>
        {/* Juz/Hizb Badge - Left â€” Frosted Glass Pill */}
        <View style={[styles.headerLeft, {
          backgroundColor: isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.82)',
          borderRadius: 14,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        }]}>
          <ThemedText type="caption" style={{ fontSize: 10, opacity: isDark ? 0.7 : 0.5, fontWeight: '600', letterSpacing: 0.5 }}>
            JUZ {(() => {
              const pageCoords = allCoords?.[currentPage];
              const firstVerse = pageCoords?.[0];
              const verseData = quranData.data.surahs
                .find((s: any) => s.number === (firstVerse?.sura || 1))
                ?.ayahs.find((a: any) => a.numberInSurah === firstVerse?.ayah);
              return verseData?.juz || 1;
            })()}
          </ThemedText>
          <ThemedText type="caption" style={{ fontSize: 10, opacity: isDark ? 0.5 : 0.35, marginTop: 1, letterSpacing: 0.3 }}>
            HIZB {(() => {
              const pageCoords = allCoords?.[currentPage];
              const firstVerse = pageCoords?.[0];
              const verseData = quranData.data.surahs
                .find((s: any) => s.number === (firstVerse?.sura || 1))
                ?.ayahs.find((a: any) => a.numberInSurah === firstVerse?.ayah);
              return verseData?.hizbQuarter ? Math.ceil(verseData.hizbQuarter / 4) : 1;
            })()}
          </ThemedText>
        </View>

        {/* Action Pill - Center */}
        <View style={[styles.pillButton, {
          backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: `${theme.primary}66`,
        }]}>
          <Pressable
            onPress={() => navigation.navigate('Progress')}
            style={({ pressed }) => [styles.pillButtonHalf, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Feather name="bar-chart-2" size={16} color={theme.primary} />
            <ThemedText style={{ color: theme.primary, fontSize: 8, marginTop: 1 }}>
              {stats?.completionPercentage?.toFixed(0) || 0}%
            </ThemedText>
          </Pressable>
          <View style={[styles.pillDivider, { backgroundColor: `${theme.primary}4D` }]} />
          <Pressable
            onPress={() => setShowBookmarks(true)}
            style={({ pressed }) => [styles.pillButtonHalf, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Feather name="bookmark" size={18} color={theme.primary} />
            {bookmarks.length > 0 && (
              <View style={[styles.pillBadge, { backgroundColor: theme.primary }]}>
                <ThemedText style={{ color: '#FFF', fontSize: 8, fontWeight: '700' }}>{bookmarks.length}</ThemedText>
              </View>
            )}
          </Pressable>
          <View style={[styles.pillDivider, { backgroundColor: `${theme.primary}4D` }]} />
          <Pressable
            onPress={() => setShowNotes(true)}
            style={({ pressed }) => [styles.pillButtonHalf, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Feather name="edit-3" size={18} color={theme.primary} />
            {(() => {
              const uniqueKeys = new Set([...Object.keys(highlights), ...Object.keys(notes)]);
              return uniqueKeys.size > 0 && (
                <View style={[styles.pillBadge, { backgroundColor: theme.primary }]}>
                  <ThemedText style={{ color: '#FFF', fontSize: 8, fontWeight: '700' }}>{uniqueKeys.size}</ThemedText>
                </View>
              );
            })()}
          </Pressable>
          <View style={[styles.pillDivider, { backgroundColor: `${theme.primary}4D` }]} />
          {/* Hifz Mode Toggle */}
          <Pressable
            onPress={() => {
              const wasActive = hifzMode.isActive;
              hifzMode.toggleHifzMode();
              // Show coach mark on first activation only
              if (!wasActive && shouldShowHint('hifz_mode')) {
                setShowHifzCoachMark(true);
              }
            }}
            onLongPress={() => hifzMode.isActive && setShowHifzControlPanel(true)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={hifzMode.isActive ? 'Hifz mode active. Tap to deactivate, long press for settings' : 'Activate Hifz memorization mode'}
            accessibilityHint={hifzMode.isActive ? 'Long press to open Hifz control panel' : ''}
            style={({ pressed }) => [styles.pillButtonHalf, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Feather
              name="book-open"
              size={18}
              color={theme.primary}
            />
            {hifzMode.isActive && (
              <View style={[styles.pillBadge, { backgroundColor: theme.primary }]}>
                <ThemedText style={{ color: '#FFF', fontSize: 6, fontWeight: '700' }}>H</ThemedText>
              </View>
            )}
          </Pressable>
          <View style={[styles.pillDivider, { backgroundColor: `${theme.primary}4D` }]} />
          <Pressable
            onPress={() => setShowSurahList(true)}
            style={({ pressed }) => [styles.pillButtonHalf, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Feather name="list" size={18} color={theme.primary} />
          </Pressable>
        </View>

        {/* Surah Badge - Right â€” Frosted Glass Pill with Makki/Madani Icon */}
        <View style={[styles.headerRight, {
          backgroundColor: isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.82)',
          borderRadius: 14,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }]}>
          {(() => {
            const pageCoords = allCoords?.[activePage];
            const firstVerse = pageCoords?.[0];
            const pageSurah = surahs.find(s => s.number === (firstVerse?.sura || 1));
            const isMeccan = pageSurah?.revelationType === 'Meccan';
            return (
              <Image
                source={isMeccan ? require('../../assets/images/qibla3d/kaaba.png') : require('../../assets/images/qibla3d/madinah.png')}
                style={{ width: 16, height: 16, opacity: 0.8 }}
                contentFit="contain"
              />
            );
          })()}
          <View style={{ alignItems: 'flex-end' }}>
            <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 14, opacity: isDark ? 0.8 : 0.7 }}>
              {(() => {
                const pageCoords = allCoords?.[activePage];
                const firstVerse = pageCoords?.[0];
                const pageSurah = surahs.find(s => s.number === (firstVerse?.sura || 1));
                return pageSurah?.nameAr;
              })()}
            </ThemedText>
            <ThemedText type="caption" style={{ fontSize: 10, opacity: isDark ? 0.5 : 0.4, marginTop: 1 }}>
              {(() => {
                const pageCoords = allCoords?.[activePage];
                const firstVerse = pageCoords?.[0];
                const pageSurah = surahs.find(s => s.number === (firstVerse?.sura || 1));
                return pageSurah?.nameEn;
              })()}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Content Zone - FlatList with Mushaf pages */}
      <View style={[styles.contentZone, { height: layout.contentZoneHeight }]}>
        <PagerView
          ref={pagerViewRef}
          style={{ flex: 1 }}
          initialPage={604 - currentPage}
          offscreenPageLimit={1}
          orientation="horizontal"
          scrollEnabled={!isWordScrubberActive}
          onPageSelected={(e) => {
            const page = 604 - e.nativeEvent.position;
            if (page >= 1 && page <= 604) {
              setCurrentPage(page);
            }
          }}
        >
          {useMemo(() => {
            const renderPage = (pn: number) => <MushafPageInner pageNum={pn} />;
            return Array.from({ length: 604 }).map((_, index) => {
              const pageNum = 604 - index;
              return (
                <PageSlot
                  key={pageNum}
                  pageNum={pageNum}
                  screenWidth={layout.screenWidth}
                  renderPage={renderPage}
                  pageNumBottomOffset={Platform.OS === 'android' ? layout.tabBarHeight + layout.safeAreaBottom + 16 : layout.tabBarHeight + 16}
                  isDark={isDark}
                />
              );
            });
          }, [layout.screenWidth])}
        </PagerView>
      </View>

      {/* Navigation fade overlay - smooth transition when jumping to distant pages */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isDark ? '#0C0C0C' : '#F8F4EF',
            zIndex: 40,
            pointerEvents: 'none',
          },
          navigationFadeStyle,
        ]}
      />

      {/* Loading overlay while coordinates load */}
      {false && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        }}>
          <View style={{
            backgroundColor: isDark ? `${theme.primary}F2` : 'rgba(255, 255, 255, 0.95)',
            padding: 24,
            borderRadius: 16,
            alignItems: 'center',
            gap: 12,
          }}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText type="body" style={{ fontWeight: '600' }}>{t('mushaf.loadingVerses')}</ThemedText>
          </View>
        </View>
      )}

      {/* Verse Menu */}
      {selectedVerse && (
        <VerseContextMenu
          selectedVerse={selectedVerse}
          onClose={closeMenu}
          onTafsirPress={handleTafsirPress}
        />
      )}

      {/* Bookmarks Panel */}
      {showBookmarks && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]}>
          <BookmarksPanel
            bookmarks={bookmarks}
            quranData={quranData}
            surahs={surahs}
            isDark={isDark}
            theme={theme}
            insets={insets}
            styles={styles}
            t={t}
            onClose={() => setShowBookmarks(false)}
            onToggleBookmark={toggleBookmark}
            onNavigateToPage={(page) => {
              scrollToPage(page);
              setCurrentPage(page);
              setShowBookmarks(false);
            }}
          />
        </View>
      )}

      {/* Notes & Highlights Panel */}
      {showNotes && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]}>
          <NotesHighlightsPanel
            notes={notes}
            highlights={highlights}
            noteTimestamps={noteTimestamps}
            highlightTimestamps={highlightTimestamps}
            quranData={quranData}
            surahs={surahs}
            isDark={isDark}
            theme={theme}
            insets={insets}
            styles={styles}
            t={t}
            onClose={() => setShowNotes(false)}
            onDeleteNote={(verseKey) => storeDeleteNote(verseKey, `${theme.primary}26`)}
            onRemoveHighlight={removeHighlight}
            onNavigateToPage={(page) => {
              scrollToPage(page);
              setCurrentPage(page);
              setShowNotes(false);
            }}
          />
        </View>
      )}

      {/* Note Modal */}
      <NoteModal />

      {/* Tafsir Viewer Modal */}
      <TafsirViewerModal />

      {/* Tafsir Sources Modal */}
      <TafsirSourcesModal />

      {/* Reciter Picker Modal */}
      <ReciterPickerModal />

      {/* Audio Settings Modal */}
      <AudioSettingsModal />

      {/* Audio Player Bar — extracted component */}
      <AudioPlayerBar />

      <HifzStatusMenu
        visible={showHifzStatusMenu}
        onClose={() => setShowHifzStatusMenu(false)}
        verseKey={hifzMenuVerseKey}
        position={hifzMenuPosition}
      />

      {/* Hifz Mode Overlay */}
      <MushafHifzOverlay
        currentVerseKey={selectedVerse?.verseKey}
        currentPage={currentPage}
        currentJuz={(() => {
          const pageCoords = allCoords?.[currentPage];
          const firstVerse = pageCoords?.[0];
          if (!firstVerse) return 1;
          const verseData = quranData.data.surahs
            .find((s: any) => s.number === firstVerse.sura)
            ?.ayahs.find((a: any) => a.numberInSurah === firstVerse.ayah);
          return verseData?.juz || 1;
        })()}
        pageVerses={(() => {
          const pageCoords = allCoords?.[currentPage];
          if (!pageCoords) return [];
          const uniqueVerses = new Set<string>();
          pageCoords.forEach((coord: any) => {
            uniqueVerses.add(`${coord.sura}:${coord.ayah}`);
          });
          return Array.from(uniqueVerses);
        })()}
        bottomOffset={80}
        showControlPanel={showHifzControlPanel}
        onCloseControlPanel={() => setShowHifzControlPanel(false)}
      />

      {/* Hifz Mode Coach Mark - shown on first use */}
      <CoachMark
        visible={showHifzCoachMark}
        onDismiss={() => {
          setShowHifzCoachMark(false);
          markHintSeen('hifz_mode');
        }}
        title={t('mushaf.hifzModeActivated')}
        message={t('mushaf.hifzModeDesc')}
        icon="book-open"
        position="top"
      />

      {/* Word Scrubber Coach Mark - shown on first audio play with word highlighting */}
      <CoachMark
        visible={showScrubberCoachMark}
        onDismiss={() => {
          setShowScrubberCoachMark(false);
          markHintSeen('word_scrubber');
        }}
        title={t('mushaf.wordByWordHighlighting')}
        message={t('mushaf.wordByWordDesc')}
        icon="volume-2"
        position="center"
      />

      {/* Surah List Overlay - extracted component */}
      <SurahListOverlay scrollToPage={scrollToPage} />

      {/* Word Scrubber - activated by long press on verse */}
      <WordScrubber
        ref={wordScrubberRef}
        isActive={isWordScrubberActive}
        pageCoords={groupedCoordsForScrubber}
        imageScale={layout.imageScale}
        imageOffsetY={layout.imageOffsetY}
        contentZoneTop={layout.safeAreaTop + layout.headerZoneHeight}
        tabBarHeight={layout.tabBarHeight}
        onClose={() => {
          setIsWordScrubberActive(false);
        }}
        isDark={isDark}
        mushafImage={mushafImages[currentPage]}
        screenWidth={layout.screenWidth}
        imageHeight={layout.imageHeight}
      />

      {/* Quran Download Prompt — shown when pages 6-604 aren't downloaded */}
      {showDownloadPrompt && !quranPagesReady && (
        <QuranDownloadPrompt
          onDownloadComplete={() => {
            setQuranPagesReady(true);
            setShowDownloadPrompt(false);
          }}
          onDismiss={() => setShowDownloadPrompt(false)}
        />
      )}
    </ThemedView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerZone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  headerLeft: {
    alignItems: 'flex-start',
    minWidth: 60,
  },
  headerRight: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  contentZone: {
    flex: 1,
  },
  footerZone: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mushafImage: {
    position: 'absolute',
  },
  verseRegion: {
    position: "absolute",
    backgroundColor: "transparent",
  },
  hiddenVerseOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  hiddenLine: {
    height: 6,
    width: '60%',
    borderRadius: 3,
    marginVertical: 2,
  },
  hiddenLineShort: {
    height: 6,
    width: '35%',
    borderRadius: 3,
    marginVertical: 2,
  },
  revisionBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  memorizationIndicator: {
    position: 'absolute',
    top: -4,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  loopIndicator: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    top: -16, // Position above the verse, not over it
  },
  loopIndicatorText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  pillButtonContainer: {
    // Legacy style - no longer used with new layout zones
    zIndex: 10,
  },
  pillButton: {
    flexDirection: 'row',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pillButtonHalf: {
    width: 42,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillDivider: {
    width: 1,
    height: 32,
    alignSelf: 'center',
  },
  pillBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  surahListHeader: {
    paddingBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    paddingHorizontal: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  surahItem: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  surahItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md + 4,
  },
  surahLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  surahInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  versesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verseDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  surahNumber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    borderRadius: BorderRadius.xl,
    maxHeight: SCREEN_HEIGHT * 0.6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  modalContent: {
    padding: Spacing.lg,
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  tafsirHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  tafsirToggle: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  tafsirText: {
    lineHeight: 24,
  },
  settingsContainer: {
    flex: 1,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 50,
    paddingBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingsContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  settingsSection: {
    marginBottom: Spacing.xl,
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  juzHizbBadge: {
    // Legacy style - no longer used with new layout zones
    zIndex: 1,
  },
  surahBadge: {
    // Legacy style - no longer used with new layout zones
    alignItems: 'flex-end',
    zIndex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  // headerLeft, headerCenter, headerRight are defined in the new layout zone styles above
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  headerActionBtn: {
    padding: 6,
  },
  headerBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBadge: {
    position: 'absolute',
    left: '50%',
    marginLeft: -25,
    alignItems: 'center',
    zIndex: 1,
  },
  progressBarContainer: {
    width: 50,
    height: 4,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  pageFooter: {
    // Legacy style - no longer used with new layout zones
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 5,
  },
  colorPickerModal: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
});
