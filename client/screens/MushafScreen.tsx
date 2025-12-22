import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  FlatList,
  ActivityIndicator,
  TextInput,
  Animated as RNAnimated,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable, GestureDetector, Gesture } from "react-native-gesture-handler";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useHeaderHeight } from "@react-navigation/elements";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";
import Animated, { SlideInUp, SlideOutDown, SlideInDown, useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { mushafImages } from "@/data/mushaf-images";
import quranData from "@/data/quran-uthmani.json";
import { surahs } from "@/data/quran";
import { surahPages } from "@/data/surah-pages";
import AudioService from "@/services/AudioService";
import { useCoordinates } from "@/contexts/CoordinatesContext";
import { JSX } from "react/jsx-runtime";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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

export default function MushafScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { allCoords, isLoading: coordsLoading, loadCoordinates } = useCoordinates();
  
  // Log theme changes
  React.useEffect(() => {
    console.log('🌓 MushafScreen theme changed - isDark:', isDark);
  }, [isDark]);
  
  // Load coordinates when screen mounts
  React.useEffect(() => {
    loadCoordinates();
  }, []);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState<VerseRegion | null>(null);
  const [tafsirData, setTafsirData] = useState<any>(null);
  const [showArabicTafsir, setShowArabicTafsir] = useState(false);
  const [showSurahList, setShowSurahList] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [recentPages, setRecentPages] = useState<number[]>([]);
  const [juzSortAsc, setJuzSortAsc] = useState(true);
  const [navigationMode, setNavigationMode] = useState<'surah' | 'juz'>('surah');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [includeTafsirInSearch, setIncludeTafsirInSearch] = useState(false);
  const [highlightedVerse, setHighlightedVerse] = useState<string | null>(null);
  const [lastSearchTerm, setLastSearchTerm] = useState<string>('');
  const [audioState, setAudioState] = useState<any>(null);
  
  // Function to get full language name from code
  const getLanguageName = (code: string): string => {
    const languageMap: Record<string, string> = {
      'ar': 'Arabic', 'en': 'English', 'bn': 'Bengali', 'id': 'Indonesian', 'tr': 'Turkish',
      'ur': 'Urdu', 'fa': 'Persian', 'fr': 'French', 'de': 'German', 'es': 'Spanish',
      'ru': 'Russian', 'zh': 'Chinese', 'ja': 'Japanese', 'ko': 'Korean', 'it': 'Italian',
      'nl': 'Dutch', 'pl': 'Polish', 'sv': 'Swedish', 'no': 'Norwegian', 'fi': 'Finnish',
      'cs': 'Czech', 'ro': 'Romanian', 'el': 'Greek', 'uk': 'Ukrainian', 'hi': 'Hindi',
      'ta': 'Tamil', 'ml': 'Malayalam', 'as': 'Assamese', 'bs': 'Bosnian', 'km': 'Khmer',
      'ps': 'Pashto', 'uz': 'Uzbek', 'ne': 'Nepali', 'ks': 'Kashmiri', 'si': 'Sinhalese',
      'tl': 'Tagalog', 'vi': 'Vietnamese', 'sq': 'Albanian'
    };
    return languageMap[code] || code.toUpperCase();
  };

  // Function to check if item is a tafsir (commentary) or translation
  const isTafsir = (id: string): boolean => {
    const tafsirIds = ['jalalayn', 'abridged', 'abu-bakr-jabir-al-jazairi', 'al-i-rab-al-muyassar', 
      'ar-tafseer-al-saddi', 'ar-tafsir-al-baghawi', 'ar-tafsir-al-wasit', 'arabic-al-mukhtasar',
      'assamese-mokhtasar', 'asseraj-fi-bayan', 'bengali-mokhtasar', 'bn-tafseer-ibn-e-kaseer',
      'bosnian-mokhtasar', 'chinese-mokhtasar', 'en-tafisr-ibn-kathir', 'french-mokhtasar',
      'i-rab-al-quran', 'id-tafsir-as-saadi', 'indonesian-mokhtasar', 'italian-mokhtasar',
      'japanese-mokhtasar', 'khmer-mokhtasar', 'malayalam-mokhtasar', 'persian-mokhtasar',
      'ru-tafsir-ibne-kahtir', 'russian-mokhtasar', 'sinhalese-mokhtasar', 'sq-saadi',
      'tafseer-ibn-e-kaseer-urdu', 'tafsir-as-saadi-russian', 'tafsir-as-saadi',
      'tafsir-bayan-ul-quran', 'tafsir-ibn-abi-zamanin', 'tagalog-mokhtasar',
      'tr-tafsir-ibne-kathir', 'turkish-mokhtasar', 'vietnamese-mokhtasar'];
    return tafsirIds.includes(id);
  };
  
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
      .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627') // أ إ آ ٱ -> ا
      // Normalize teh marbuta and heh
      .replace(/\u0629/g, '\u0647') // ة -> ه
      // Normalize yeh variations
      .replace(/[\u0649\u064A\u06CC\u06D0]/g, '\u064A') // ى ي ی ې -> ي
      // Normalize waw with hamza
      .replace(/\u0624/g, '\u0648') // ؤ -> و
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
          import("@/data/tafsir-jalalayn.json"),
          import("@/data/abridged-explanation-of-the-quran.json"),
          import("@/data/en-sahih-international-inline-footnotes.json")
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
        
        let matchType = null;
        
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
    const timer = setTimeout(() => {
      performSearch(searchQuery, includeTafsirInSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, includeTafsirInSearch, performSearch]);
  const [showPlayMenu, setShowPlayMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [showReciterPicker, setShowReciterPicker] = useState(false);
  const [playUntil, setPlayUntil] = useState<'surah' | 'page' | 'juz'>('surah');
  const [selectedReciter, setSelectedReciter] = useState('Alafasy_128kbps');
  const [reciterSearch, setReciterSearch] = useState('');
  const buttonOpacity = useSharedValue(1);
  const [highlights, setHighlights] = useState<Record<string, string>>({});
  const [highlightTimestamps, setHighlightTimestamps] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteTimestamps, setNoteTimestamps] = useState<Record<string, number>>({});
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteVerseKey, setNoteVerseKey] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState('rgba(255, 235, 59, 0.4)');
  const [showTafsirSources, setShowTafsirSources] = useState(false);
  const [expandedTranslations, setExpandedTranslations] = useState(true);
  const [expandedTafsirs, setExpandedTafsirs] = useState(true);
  const [expandedAvailable, setExpandedAvailable] = useState(true);
  const [expandedAvailableTranslations, setExpandedAvailableTranslations] = useState(true);
  const [expandedAvailableTafsirs, setExpandedAvailableTafsirs] = useState(true);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const playerPositionX = useSharedValue(20);
  const playerPositionY = useSharedValue(0);
  const savedX = useSharedValue(20);
  const savedY = useSharedValue(0);
  const [tafsirVerse, setTafsirVerse] = useState<VerseRegion | null>(null);
  const [availableTafsirs, setAvailableTafsirs] = useState([
    { id: 'jalalayn', name: 'Tafsir Jalalayn', language: 'ar', downloaded: true, url: null },
    { id: 'abridged', name: 'Abridged Explanation', language: 'en', downloaded: true, url: null },
    { id: 'sahih-international', name: 'Sahih International', language: 'en', downloaded: true, url: null },
    
    // New Translations
    { id: 'abdul-hameed-baqavi', name: 'Abdul Hameed Baqavi', language: 'ml', downloaded: false, url: 'https://sakinahtime.com/translations/abdul-hameed-baqavi-simple.json' },
    { id: 'ahl-al-hadith-nepal', name: 'Ahl Al-Hadith Central Society', language: 'ne', downloaded: false, url: 'https://sakinahtime.com/translations/ahl-al-hadith-central-society-of-nepal-simple.json' },
    { id: 'bayanul-furqan-koshur', name: 'Bayanul Furqan (Koshur)', language: 'ks', downloaded: false, url: 'https://sakinahtime.com/translations/bayanul-furqan-koshur-quran-simple.json' },
    { id: 'cs-unknown', name: 'Czech Translation', language: 'cs', downloaded: false, url: 'https://sakinahtime.com/translations/cs-unknown-simple.json' },
    { id: 'dar-al-salam', name: 'Dar Al-Salam Center', language: 'en', downloaded: false, url: 'https://sakinahtime.com/translations/dar-al-salam-center-simple.json' },
    { id: 'de-bubenheim', name: 'Bubenheim & Elyas', language: 'de', downloaded: false, url: 'https://sakinahtime.com/translations/de-bubenheim-simple.json' },
    { id: 'dr-abdullah-abu-bakr', name: 'Dr. Abdullah & Sheikh Nasir', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/translations/dr-abdullah-muhammad-abu-bakr-and-sheikh-nasir-khamis-simple.json' },
    { id: 'dr-abu-bakr-zakaria', name: 'Dr. Abu Bakr Muhammad Zakaria', language: 'bn', downloaded: false, url: 'https://sakinahtime.com/translations/dr-abu-bakr-muhammad-zakaria-simple.json' },
    { id: 'dr-mikhailo-yaqubovic', name: 'Dr. Mikhailo Yaqubovic', language: 'uk', downloaded: false, url: 'https://sakinahtime.com/translations/dr-mikhailo-yaqubovic-simple.json' },
    { id: 'es-isa-garcia', name: 'Isa García', language: 'es', downloaded: false, url: 'https://sakinahtime.com/translations/es-isa-garcia-with-footnote-tags.json' },
    { id: 'fi-unknown', name: 'Finnish Translation', language: 'fi', downloaded: false, url: 'https://sakinahtime.com/translations/fi-unknown-simple.json' },
    { id: 'greek-translation', name: 'Greek Translation', language: 'el', downloaded: false, url: 'https://sakinahtime.com/translations/greek-translation-simple.json' },
    { id: 'hasan-abdul-karim', name: 'Hasan Abdul Karim', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/translations/hasan-abdul-karim-simple.json' },
    { id: 'helmi-nasr', name: 'Helmi Nasr', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/translations/helmi-nasr-simple.json' },
    { id: 'hindi-wbw', name: 'Hindi Word by Word', language: 'hi', downloaded: false, url: 'https://sakinahtime.com/translations/hindi-wbw-translation.json' },
    { id: 'indonesian-wbw', name: 'Indonesian Word by Word', language: 'id', downloaded: false, url: 'https://sakinahtime.com/translations/indonesian-word-by-word-translation.json' },
    { id: 'islamhouse', name: 'IslamHouse.com', language: 'en', downloaded: false, url: 'https://sakinahtime.com/translations/islamhouse-com-simple.json' },
    { id: 'ko-unknown', name: 'Korean Translation', language: 'ko', downloaded: false, url: 'https://sakinahtime.com/translations/ko-unknown-simple.json' },
    { id: 'ml-karakunnu', name: 'Karakunnu', language: 'ml', downloaded: false, url: 'https://sakinahtime.com/translations/ml-karakunnu-simple.json' },
    { id: 'muhammad-makin', name: 'Muhammad Makin', language: 'id', downloaded: false, url: 'https://sakinahtime.com/translations/muhammad-makin-simple.json' },
    { id: 'nl-sofian-siregar', name: 'Sofian S. Siregar', language: 'nl', downloaded: false, url: 'https://sakinahtime.com/translations/nl-sofian-s-siregar-simple.json' },
    { id: 'no-unknown', name: 'Norwegian Translation', language: 'no', downloaded: false, url: 'https://sakinahtime.com/translations/no-unknown-simple.json' },
    { id: 'pashto-sarfaraz', name: 'Sarfaraz Khan', language: 'ps', downloaded: false, url: 'https://sakinahtime.com/translations/pashto-sarfaraz-simple.json' },
    { id: 'pl-jozef-bielawski', name: 'Józef Bielawski', language: 'pl', downloaded: false, url: 'https://sakinahtime.com/translations/pl-jozef-bielawski-simple.json' },
    { id: 'quran-ml-abdul-hameed', name: 'Abdul Hameed (Malayalam)', language: 'ml', downloaded: false, url: 'https://sakinahtime.com/translations/quran-ml-abdul-hameed-simple.json' },
    { id: 'quran-uz-sodik', name: 'Sodik (Uzbek)', language: 'uz', downloaded: false, url: 'https://sakinahtime.com/translations/quran-uz-sodik-simple.json' },
    { id: 'rabila-al-umry', name: 'Rabila Al-Umry', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/translations/rabila-al-umry-simple.json' },
    { id: 'romanian-translation', name: 'Romanian Translation', language: 'ro', downloaded: false, url: 'https://sakinahtime.com/translations/romanian-translation-simple.json' },
    { id: 'ru-nuri', name: 'Nuri (Russian)', language: 'ru', downloaded: false, url: 'https://sakinahtime.com/translations/ru-nuri-simple.json' },
    { id: 'suliman-kanti', name: 'Suliman Kanti', language: 'bn', downloaded: false, url: 'https://sakinahtime.com/translations/suliman-kanti-simple.json' },
    { id: 'sv-knut', name: 'Knut Bernström', language: 'sv', downloaded: false, url: 'https://sakinahtime.com/translations/sv-knut-simple.json' },
    { id: 'tamil-wbw', name: 'Tamil Word by Word', language: 'ta', downloaded: false, url: 'https://sakinahtime.com/translations/tamil-wbw-translation.json' },
    { id: 'translation-pioneers', name: 'Translation Pioneers Center', language: 'en', downloaded: false, url: 'https://sakinahtime.com/translations/translation-pioneers-center-simple.json' },
    { id: 'turkish-wbw', name: 'Turkish Word by Word', language: 'tr', downloaded: false, url: 'https://sakinahtime.com/translations/turkish-wbw-translation.json' },
    { id: 'ur-al-maududi', name: 'Al-Maududi (Urdu)', language: 'ur', downloaded: false, url: 'https://sakinahtime.com/translations/ur-al-maududi-simple.json' },
    
    // Existing Tafsirs
    { id: 'abu-bakr-jabir-al-jazairi', name: 'Abu Bakr Al-Jazairi', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/abu-bakr-jabir-al-jazairi.json' },
    { id: 'al-i-rab-al-muyassar', name: 'Al-Irab Al-Muyassar', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/al-i-rab-al-muyassar.json' },
    { id: 'ar-tafseer-al-saddi', name: 'Tafseer Al-Saddi', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/ar-tafseer-al-saddi.json' },
    { id: 'ar-tafsir-al-baghawi', name: 'Tafsir Al-Baghawi', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/ar-tafsir-al-baghawi.json' },
    { id: 'ar-tafsir-al-wasit', name: 'Tafsir Al-Wasit', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/ar-tafsir-al-wasit.json' },
    { id: 'arabic-al-mukhtasar', name: 'Al-Mukhtasar', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/arabic-al-mukhtasar-in-interpreting-the-noble-quran.json' },
    { id: 'assamese-mokhtasar', name: 'Mokhtasar', language: 'as', downloaded: false, url: 'https://sakinahtime.com/tafsirs/assamese-mokhtasar.json' },
    { id: 'asseraj-fi-bayan', name: 'Asseraj Fi Bayan', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/asseraj-fi-bayan-gharib-alquran.json' },
    { id: 'bengali-mokhtasar', name: 'Mokhtasar', language: 'bn', downloaded: false, url: 'https://sakinahtime.com/tafsirs/bengali-mokhtasar.json' },
    { id: 'bn-tafseer-ibn-e-kaseer', name: 'Tafseer Ibn Kathir', language: 'bn', downloaded: false, url: 'https://sakinahtime.com/tafsirs/bn-tafseer-ibn-e-kaseer.json' },
    { id: 'bosnian-mokhtasar', name: 'Mokhtasar', language: 'bs', downloaded: false, url: 'https://sakinahtime.com/tafsirs/bosnian-mokhtasar.json' },
    { id: 'chinese-mokhtasar', name: 'Mokhtasar', language: 'zh', downloaded: false, url: 'https://sakinahtime.com/tafsirs/chinese-mokhtasar.json' },
    { id: 'en-tafisr-ibn-kathir', name: 'Tafsir Ibn Kathir', language: 'en', downloaded: false, url: 'https://sakinahtime.com/tafsirs/en-tafisr-ibn-kathir.json' },
    { id: 'french-mokhtasar', name: 'Mokhtasar', language: 'fr', downloaded: false, url: 'https://sakinahtime.com/tafsirs/french-mokhtasar.json' },
    { id: 'i-rab-al-quran', name: 'Irab Al-Quran', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/i-rab-al-quran-li-al-darwish.json' },
    { id: 'id-tafsir-as-saadi', name: 'Tafsir As-Saadi', language: 'id', downloaded: false, url: 'https://sakinahtime.com/tafsirs/id-tafsir-as-saadi.json' },
    { id: 'indonesian-mokhtasar', name: 'Mokhtasar', language: 'id', downloaded: false, url: 'https://sakinahtime.com/tafsirs/indonesian-mokhtasar.json' },
    { id: 'italian-mokhtasar', name: 'Mokhtasar', language: 'it', downloaded: false, url: 'https://sakinahtime.com/tafsirs/italian-mokhtasar.json' },
    { id: 'japanese-mokhtasar', name: 'Mokhtasar', language: 'ja', downloaded: false, url: 'https://sakinahtime.com/tafsirs/japanese-mokhtasar.json' },
    { id: 'khmer-mokhtasar', name: 'Mokhtasar', language: 'km', downloaded: false, url: 'https://sakinahtime.com/tafsirs/khmer-mokhtasar.json' },
    { id: 'malayalam-mokhtasar', name: 'Mokhtasar', language: 'ml', downloaded: false, url: 'https://sakinahtime.com/tafsirs/malayalam-mokhtasar.json' },
    { id: 'persian-mokhtasar', name: 'Mokhtasar', language: 'fa', downloaded: false, url: 'https://sakinahtime.com/tafsirs/persian-mokhtasar.json' },
    { id: 'ru-tafsir-ibne-kahtir', name: 'Tafsir Ibn Kathir', language: 'ru', downloaded: false, url: 'https://sakinahtime.com/tafsirs/ru-tafsir-ibne-kahtir.json' },
    { id: 'russian-mokhtasar', name: 'Mokhtasar', language: 'ru', downloaded: false, url: 'https://sakinahtime.com/tafsirs/russian-mokhtasar.json' },
    { id: 'sinhalese-mokhtasar', name: 'Mokhtasar', language: 'si', downloaded: false, url: 'https://sakinahtime.com/tafsirs/sinhalese-mokhtasar.json' },
    { id: 'sq-saadi', name: 'Tafsir As-Saadi', language: 'sq', downloaded: false, url: 'https://sakinahtime.com/tafsirs/sq-saadi.json' },
    { id: 'tafseer-ibn-e-kaseer-urdu', name: 'Tafseer Ibn Kathir', language: 'ur', downloaded: false, url: 'https://sakinahtime.com/tafsirs/tafseer-ibn-e-kaseer-urdu.json' },
    { id: 'tafsir-as-saadi-russian', name: 'Tafsir As-Saadi', language: 'ru', downloaded: false, url: 'https://sakinahtime.com/tafsirs/tafsir-as-saadi-russian.json' },
    { id: 'tafsir-as-saadi', name: 'Tafsir As-Saadi', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/tafsir-as-saadi.json' },
    { id: 'tafsir-bayan-ul-quran', name: 'Bayan-ul-Quran', language: 'ur', downloaded: false, url: 'https://sakinahtime.com/tafsirs/tafsir-bayan-ul-quran.json' },
    { id: 'tafsir-ibn-abi-zamanin', name: 'Tafsir Ibn Abi Zamanin', language: 'ar', downloaded: false, url: 'https://sakinahtime.com/tafsirs/tafsir-ibn-abi-zamanin.json' },
    { id: 'tagalog-mokhtasar', name: 'Mokhtasar', language: 'tl', downloaded: false, url: 'https://sakinahtime.com/tafsirs/tagalog-mokhtasar.json' },
    { id: 'tr-tafsir-ibne-kathir', name: 'Tafsir Ibn Kathir', language: 'tr', downloaded: false, url: 'https://sakinahtime.com/tafsirs/tr-tafsir-ibne-kathir.json' },
    { id: 'turkish-mokhtasar', name: 'Mokhtasar', language: 'tr', downloaded: false, url: 'https://sakinahtime.com/tafsirs/turkish-mokhtasar.json' },
    { id: 'vietnamese-mokhtasar', name: 'Mokhtasar', language: 'vi', downloaded: false, url: 'https://sakinahtime.com/tafsirs/vietnamese-mokhtasar.json' },
  ]);
  const [downloadingTafsir, setDownloadingTafsir] = useState<string | null>(null);
  const [selectedTafsirId, setSelectedTafsirId] = useState('abridged');
  const [isSwipingTafsir, setIsSwipingTafsir] = useState(false);

  const highlightColors = [
    { name: 'Yellow', value: 'rgba(255, 235, 59, 0.4)' },
    { name: 'Green', value: 'rgba(76, 175, 80, 0.4)' },
    { name: 'Blue', value: 'rgba(33, 150, 243, 0.4)' },
    { name: 'Pink', value: 'rgba(233, 30, 99, 0.4)' },
    { name: 'Orange', value: 'rgba(255, 152, 0, 0.4)' },
  ];

  const reciters = [
    { value: 'Alafasy_128kbps', label: 'Mishary Alafasy' },
    { value: 'Abdul_Basit_Murattal_192kbps', label: 'Abdul Basit' },
    { value: 'Abdullah_Basfar_192kbps', label: 'Abdullah Basfar' },
    { value: 'Abdurrahmaan_As-Sudais_192kbps', label: 'Abdurrahman As-Sudais' },
    { value: 'Abu_Bakr_Ash-Shaatree_128kbps', label: 'Abu Bakr Ash-Shatri' },
    { value: 'Ahmed_Neana_128kbps', label: 'Ahmed Neana' },
    { value: 'Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net', label: 'Ahmed Al-Ajamy' },
    { value: 'Akram_AlAlaqimy_128kbps', label: 'Akram AlAlaqimy' },
    { value: 'Ali_Jaber_64kbps', label: 'Ali Jaber' },
    { value: 'Ayman_Sowaid_64kbps', label: 'Ayman Sowaid' },
    { value: 'Fares_Abbad_64kbps', label: 'Fares Abbad' },
    { value: 'Ghamadi_40kbps', label: 'Saad Al-Ghamadi' },
    { value: 'Hani_Rifai_192kbps', label: 'Hani Rifai' },
    { value: 'Hudhaify_128kbps', label: 'Ali Hudhaify' },
    { value: 'Husary_128kbps', label: 'Mahmoud Al-Hussary' },
    { value: 'Ibrahim_Akhdar_32kbps', label: 'Ibrahim Akhdar' },
    { value: 'Khaalid_Abdullaah_al-Qahtaanee_192kbps', label: 'Khalid Al-Qahtani' },
    { value: 'MaherAlMuaiqly128kbps', label: 'Maher Al-Muaiqly' },
    { value: 'Minshawy_Murattal_128kbps', label: 'Mohamed Al-Minshawi' },
    { value: 'Mohammad_al_Tablaway_128kbps', label: 'Mohammad Al-Tablaway' },
    { value: 'Muhammad_Ayyoub_128kbps', label: 'Muhammad Ayyub' },
    { value: 'Muhammad_Jibreel_128kbps', label: 'Muhammad Jibreel' },
    { value: 'Muhsin_Al_Qasim_192kbps', label: 'Muhsin Al-Qasim' },
    { value: 'Mustafa_Ismail_48kbps', label: 'Mustafa Ismail' },
    { value: 'Nasser_Alqatami_128kbps', label: 'Nasser Al-Qatami' },
    { value: 'Salaah_AbdulRahman_Bukhatir_128kbps', label: 'Salah Bukhatir' },
    { value: 'Salah_Al_Budair_128kbps', label: 'Salah Al-Budair' },
    { value: 'Saood_ash-Shuraym_128kbps', label: 'Saud Ash-Shuraim' },
    { value: 'warsh/warsh_yassin_al_jazaery_64kbps', label: 'Yassin Al-Jazaery (Warsh)' },
  ];

  const handleReciterChange = (reciter: string) => {
    setSelectedReciter(reciter);
    AudioService.setReciter(reciter);
  };

  const getVersesToPlay = (surah: number, ayah: number) => {
    const surahData = quranData.data.surahs.find((s: any) => s.number === surah);
    if (!surahData) return [];

    if (playUntil === 'surah') {
      return surahData.ayahs.filter((a: any) => a.numberInSurah >= ayah).map((a: any) => ({ surah, ayah: a.numberInSurah }));
    } else if (playUntil === 'page') {
      const currentPage = surahData.ayahs.find((a: any) => a.numberInSurah === ayah)?.page;
      const allVerses: any[] = [];
      quranData.data.surahs.forEach((s: any) => {
        s.ayahs.forEach((a: any) => {
          if (a.page === currentPage && (s.number > surah || (s.number === surah && a.numberInSurah >= ayah))) {
            allVerses.push({ surah: s.number, ayah: a.numberInSurah });
          }
        });
      });
      return allVerses;
    } else {
      const currentJuz = surahData.ayahs.find((a: any) => a.numberInSurah === ayah)?.juz;
      const allVerses: any[] = [];
      quranData.data.surahs.forEach((s: any) => {
        s.ayahs.forEach((a: any) => {
          if (a.juz === currentJuz && (s.number > surah || (s.number === surah && a.numberInSurah >= ayah))) {
            allVerses.push({ surah: s.number, ayah: a.numberInSurah });
          }
        });
      });
      return allVerses;
    }
  };
  
  // Draggable player gesture - memoized to prevent hooks issues
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const SCREEN_HEIGHT = Dimensions.get('window').height;
  const topSafeArea = useSharedValue(insets.top + 60); // Keep below top safe area + buttons
  
  const panGesture = useMemo(() => Gesture.Pan()
    .onStart(() => {
      savedX.value = playerPositionX.value;
      savedY.value = playerPositionY.value;
    })
    .onUpdate((e) => {
      playerPositionX.value = Math.max(10, Math.min(SCREEN_WIDTH - 160, savedX.value + e.translationX));
      // Keep between top safe area and starting position (bottom: insets.bottom + 65)
      const minY = -SCREEN_HEIGHT + topSafeArea.value + 100; // Don't go above top safe area
      playerPositionY.value = Math.max(minY, Math.min(0, savedY.value + e.translationY));
    })
    .onEnd(() => {
      // Snap to edges if close
      if (playerPositionX.value < 60) {
        playerPositionX.value = withTiming(20);
      } else if (playerPositionX.value > SCREEN_WIDTH - 180) {
        playerPositionX.value = withTiming(SCREEN_WIDTH - 160);
      }
    }), []);

  const playerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: playerPositionX.value },
      { translateY: playerPositionY.value }
    ],
  }));
  
  const flatListRef = React.useRef<FlatList>(null);

  React.useEffect(() => {
    loadBookmarks();
    loadRecentPages();
    loadHighlights();
    loadNotes();
    loadTimestamps();
    AsyncStorage.getItem('@selectedTafsir').then(id => {
      if (id) setSelectedTafsirId(id);
    });
    const unsubscribe = AudioService.subscribe(setAudioState);
    return unsubscribe;
  }, []);

  // Load downloaded tafsirs from FileSystem
  React.useEffect(() => {
    const loadDownloadedTafsirs = async () => {
      try {
        // Clean up old tafsir data from AsyncStorage to free up space
        console.log('Checking AsyncStorage for old tafsir data...');
        const keys = await AsyncStorage.getAllKeys();
        console.log('Total AsyncStorage keys:', keys.length);
        const tafsirKeys = keys.filter(key => key.startsWith('@tafsir_') && !key.includes('_downloaded_'));
        console.log('Old tafsir keys to remove:', tafsirKeys.length);
        if (tafsirKeys.length > 0) {
          await AsyncStorage.multiRemove(tafsirKeys);
          console.log(`✅ Cleaned up ${tafsirKeys.length} old tafsir entries from AsyncStorage`);
        }
        
        // Also check for any large items in AsyncStorage
        if (Platform.OS === 'android') {
          console.log('Android: Checking AsyncStorage size...');
          for (const key of keys) {
            try {
              const value = await AsyncStorage.getItem(key);
              if (value && value.length > 100000) { // > 100KB
                console.log(`Large item found: ${key} (${(value.length / 1024).toFixed(2)}KB)`);
              }
            } catch (e) {
              console.log(`Error checking key ${key}:`, e);
            }
          }
        }
        
        const tafsirDir = `${FileSystem.documentDirectory}tafsirs/`;
        const dirInfo = await FileSystem.getInfoAsync(tafsirDir);
        
        if (dirInfo.exists) {
          const files = await FileSystem.readDirectoryAsync(tafsirDir);
          const downloadedIds = files.map(f => f.replace('.json', ''));
          console.log('Downloaded tafsirs from FileSystem:', downloadedIds);
          
          setAvailableTafsirs(prev => prev.map(t => ({
            ...t,
            downloaded: t.downloaded || downloadedIds.includes(t.id)
          })));
        }
      } catch (error) {
        console.error('Failed to load downloaded tafsirs:', error);
      }
    };
    
    loadDownloadedTafsirs();
  }, []);

  React.useEffect(() => {
    if (currentPage > 0) {
      saveRecentPage(currentPage);
    }
  }, [currentPage]);

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

  const loadBookmarks = async () => {
    try {
      const saved = await AsyncStorage.getItem('@bookmarks');
      if (saved) setBookmarks(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load bookmarks:', e);
    }
  };

  const loadRecentPages = async () => {
    try {
      const saved = await AsyncStorage.getItem('@recentPages');
      if (saved) setRecentPages(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load recent pages:', e);
    }
  };

  const loadHighlights = async () => {
    try {
      const saved = await AsyncStorage.getItem('@highlights');
      if (saved) setHighlights(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load highlights:', e);
    }
  };

  const loadNotes = async () => {
    try {
      const saved = await AsyncStorage.getItem('@notes');
      if (saved) setNotes(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load notes:', e);
    }
  };

  const loadTimestamps = async () => {
    try {
      const hTimestamps = await AsyncStorage.getItem('@highlightTimestamps');
      const nTimestamps = await AsyncStorage.getItem('@noteTimestamps');
      if (hTimestamps) setHighlightTimestamps(JSON.parse(hTimestamps));
      if (nTimestamps) setNoteTimestamps(JSON.parse(nTimestamps));
    } catch (e) {
      console.error('Failed to load timestamps:', e);
    }
  };

  const saveNote = async (verseKey: string, note: string) => {
    const newNotes = { ...notes, [verseKey]: note };
    const newTimestamps = { ...noteTimestamps, [verseKey]: Date.now() };
    setNotes(newNotes);
    setNoteTimestamps(newTimestamps);
    
    // Add highlight if it doesn't exist
    if (!highlights[verseKey]) {
      const newHighlights = { ...highlights, [verseKey]: 'rgba(212, 175, 55, 0.15)' };
      const newHighlightTimestamps = { ...highlightTimestamps, [verseKey]: Date.now() };
      setHighlights(newHighlights);
      setHighlightTimestamps(newHighlightTimestamps);
      
      try {
        await AsyncStorage.setItem('@highlights', JSON.stringify(newHighlights));
        await AsyncStorage.setItem('@highlightTimestamps', JSON.stringify(newHighlightTimestamps));
      } catch (e) {
        console.error('Failed to save highlight:', e);
      }
    }
    
    try {
      await AsyncStorage.setItem('@notes', JSON.stringify(newNotes));
      await AsyncStorage.setItem('@noteTimestamps', JSON.stringify(newTimestamps));
    } catch (e) {
      console.error('Failed to save note:', e);
    }
  };

  const deleteNote = async (verseKey: string) => {
    const newNotes = { ...notes };
    delete newNotes[verseKey];
    setNotes(newNotes);
    if (highlights[verseKey] === 'rgba(212, 175, 55, 0.15)') {
      removeHighlight(verseKey);
    }
    try {
      await AsyncStorage.setItem('@notes', JSON.stringify(newNotes));
    } catch (e) {
      console.error('Failed to delete note:', e);
    }
  };

  const addHighlight = async (verseKey: string, color: string) => {
    const newHighlights = { ...highlights, [verseKey]: color };
    const newTimestamps = { ...highlightTimestamps, [verseKey]: Date.now() };
    setHighlights(newHighlights);
    setHighlightTimestamps(newTimestamps);
    try {
      await AsyncStorage.setItem('@highlights', JSON.stringify(newHighlights));
      await AsyncStorage.setItem('@highlightTimestamps', JSON.stringify(newTimestamps));
    } catch (e) {
      console.error('Failed to save highlight:', e);
    }
  };

  const removeHighlight = async (verseKey: string) => {
    const newHighlights = { ...highlights };
    delete newHighlights[verseKey];
    setHighlights(newHighlights);
    try {
      await AsyncStorage.setItem('@highlights', JSON.stringify(newHighlights));
    } catch (e) {
      console.error('Failed to remove highlight:', e);
    }
  };

  const saveRecentPage = async (page: number) => {
    try {
      const updated = [page, ...recentPages.filter(p => p !== page)].slice(0, 3);
      setRecentPages(updated);
      await AsyncStorage.setItem('@recentPages', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save recent page:', e);
    }
  };

  const deleteTafsir = async (tafsirId: string) => {
    console.log('🗑️ deleteTafsir called for:', tafsirId);
    console.log('📱 Platform:', Platform.OS);
    try {
      // Delete from FileSystem
      const tafsirPath = `${FileSystem.documentDirectory}tafsirs/${tafsirId}.json`;
      console.log('📂 Checking file at:', tafsirPath);
      const fileInfo = await FileSystem.getInfoAsync(tafsirPath);
      console.log('📄 File exists:', fileInfo.exists);
      
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(tafsirPath);
        console.log('✅ Deleted tafsir file:', tafsirId);
      }
      
      // Update state to mark as not downloaded
      setAvailableTafsirs(prev => prev.map(t => 
        t.id === tafsirId ? { ...t, downloaded: false } : t
      ));
      console.log('✅ Updated state for:', tafsirId);
      
      // If this was the active tafsir, switch to default
      if (selectedTafsirId === tafsirId) {
        setSelectedTafsirId('abridged');
        await AsyncStorage.setItem('@selectedTafsir', 'abridged');
        console.log('✅ Switched to default tafsir');
      }
    } catch (error) {
      console.error('❌ Failed to delete tafsir:', error);
      alert('Failed to delete. Please try again.');
    }
  };

  const toggleBookmark = async (verseKey: string) => {
    const newBookmarks = bookmarks.includes(verseKey)
      ? bookmarks.filter(b => b !== verseKey)
      : [...bookmarks, verseKey];
    setBookmarks(newBookmarks);
    try {
      await AsyncStorage.setItem('@bookmarks', JSON.stringify(newBookmarks));
    } catch (e) {
      console.error('Failed to save bookmark:', e);
    }
  };


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
      let tafsirContent = null;
      
      if (savedTafsirId === 'abridged') {
        const enTafsir = await import("@/data/abridged-explanation-of-the-quran.json");
        tafsirContent = { text: enTafsir[key]?.text || 'No tafsir available' };
      } else if (savedTafsirId === 'jalalayn') {
        const arTafsir = await import("@/data/tafsir-jalalayn.json");
        tafsirContent = { text: arTafsir[key]?.text || 'No tafsir available' };
      } else if (savedTafsirId === 'sahih-international') {
        const sahihTafsir = await import("@/data/en-sahih-international-inline-footnotes.json");
        tafsirContent = { text: sahihTafsir[key]?.t || 'No tafsir available' };
      } else {
        // Try to load from FileSystem
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
        }
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

  const renderPage = React.useCallback(({ item: pageNum }: { item: number }) => {
    const pageCoords = allCoords?.[pageNum];
    const scale = SCREEN_WIDTH / 1300;
    const imageHeight = 2103 * scale;
    const offsetY = (SCREEN_HEIGHT - imageHeight) / 2;

    const verseGroups = new Map<string, any[]>();
    pageCoords?.forEach((coord: any) => {
      const key = `${coord.sura}:${coord.ayah}`;
      if (!verseGroups.has(key)) verseGroups.set(key, []);
      verseGroups.get(key).push(coord);
    });

    const firstVerse = pageCoords?.[0];
    const pageSurahNum = firstVerse?.sura || 1;
    const pageSurah = surahs.find(s => s.number === pageSurahNum);
    
    const verseData = quranData.data.surahs
      .find((s: any) => s.number === pageSurahNum)
      ?.ayahs.find((a: any) => a.numberInSurah === firstVerse?.ayah);
    const pageJuz = verseData?.juz || 1;
    const pageHizb = verseData?.hizbQuarter ? Math.ceil(verseData.hizbQuarter / 4) : 1;

    if (audioState?.current) {
      console.log(`🎵 Page ${pageNum} - Audio State:`, {
        current: audioState.current,
        isPlaying: audioState.isPlaying,
        verseKey: `${audioState.current.surah}:${audioState.current.ayah}`
      });
    }

    console.log(`🎨 Rendering page ${pageNum} - isDark: ${isDark}, tintColor: ${isDark ? '#FFFFFF' : 'none'}`);

    return (
      <View style={[styles.pageContainer, { 
        width: SCREEN_WIDTH, 
        height: SCREEN_HEIGHT,
        backgroundColor: isDark ? '#1a1a1a' : '#F5F5F5'
      }]}>
        <Image 
          source={mushafImages[pageNum]} 
          style={[styles.mushafImage, { 
            width: SCREEN_WIDTH, 
            height: imageHeight,
            tintColor: isDark ? '#FFFFFF' : undefined
          }]} 
          resizeMode="contain"
          fadeDuration={0}
          key={`theme-${isDark}`}
        />
        <View style={[styles.juzHizbBadge, { 
          top: Platform.OS === 'android' ? Math.max(insets.top, 10) + 5 : insets.top + 5,
          paddingTop: 3
        }]}>
          <ThemedText type="caption" style={{ fontSize: 10, opacity: isDark ? 0.7 : 0.4 }}>JUZ {pageJuz}</ThemedText>
          <ThemedText type="caption" style={{ fontSize: 14, opacity: isDark ? 0.7 : 0.4, marginTop: 2 }}>HIZB {pageHizb}</ThemedText>
        </View>
        <View style={[styles.surahBadge, { 
          top: Platform.OS === 'android' ? Math.max(insets.top, 10) + 5 : insets.top + 5
        }]}>
          <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 16, opacity: isDark ? 0.9 : 0.9 }}>{pageSurah?.nameAr}</ThemedText>
          <ThemedText type="caption" style={{ fontSize: 11, opacity: isDark ? 0.7 : 0.6, marginTop: 2 }}>{pageSurah?.nameEn}</ThemedText>
        </View>
        <View style={styles.pageFooter}>
          <ThemedText type="caption" style={{ fontSize: 14, opacity: isDark ? 0.6 : 0.4 }}>{pageNum}</ThemedText>
        </View>
        {Array.from(verseGroups.entries()).map(([verseKey, coords]) => {
          const [surah, ayah] = verseKey.split(':');
          const lineGroups = new Map<number, any[]>();
          coords.forEach(c => {
            if (!lineGroups.has(c.line)) lineGroups.set(c.line, []);
            lineGroups.get(c.line).push(c);
          });
          
          return Array.from(lineGroups.values()).map((lineCoords, idx) => {
            const minX = Math.min(...lineCoords.map(c => c.x));
            const minY = Math.min(...lineCoords.map(c => c.y));
            const maxX = Math.max(...lineCoords.map(c => c.x + c.width));
            const maxY = Math.max(...lineCoords.map(c => c.y + c.height));
            
            const isAudioPlaying = audioState?.current && `${audioState.current.surah}:${audioState.current.ayah}` === verseKey;
            const isSelected = selectedVerse?.verseKey === verseKey;
            const isHighlighted = highlightedVerse === verseKey;
            const highlightColor = highlights[verseKey] || (notes[verseKey] ? 'rgba(212, 175, 55, 0.15)' : null);
            
            if (isAudioPlaying) {
              console.log('✅ Highlighting verse:', verseKey, 'on page', pageNum);
            }
            
            return (
              <Pressable
                key={`${verseKey}-${idx}`}
                style={[styles.verseRegion, { 
                  left: minX * scale, 
                  top: (minY * scale) + offsetY, 
                  width: (maxX - minX) * scale, 
                  height: (maxY - minY) * scale, 
                  backgroundColor: isHighlighted
                    ? 'rgba(255, 215, 0, 0.4)'
                    : isAudioPlaying 
                    ? 'rgba(52, 211, 153, 0.3)' 
                    : highlightColor || (isSelected 
                    ? 'rgba(76, 175, 80, 0.2)' 
                    : 'transparent')
                }]}
                onPress={(e) => {
                  const { pageX, pageY } = e.nativeEvent;
                  handleVersePress({ surah: parseInt(surah), ayah: parseInt(ayah), verseKey, touchX: pageX, touchY: pageY });
                }}
              />
            );
          });
        })}
      </View>
    );
  }, [allCoords, selectedVerse, handleVersePress, audioState, highlights, notes, highlightedVerse, SCREEN_WIDTH, SCREEN_HEIGHT, isDark]);

  const goToSurah = (surahNumber: number) => {
    const page = surahPages[surahNumber];
    console.log('goToSurah called:', { surahNumber, page });
    if (page) {
      const index = 604 - page;
      const offset = index * SCREEN_WIDTH;
      console.log('Scrolling to:', { index, offset });
      setShowSurahList(false);
      setIsNavigating(true);
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset({ offset, animated: false });
        setTimeout(() => setIsNavigating(false), 300);
      });
    } else {
      console.log('No page found for surah:', surahNumber);
    }
  };

  const renderSurahItem = React.useCallback(({ item }: { item: any }) => (
    <Pressable
      onPress={() => goToSurah(item.number)}
      style={({ pressed }) => [
        styles.surahItem,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
          transform: [{ scale: pressed ? 0.98 : 1 }, { translateY: pressed ? 1 : 0 }],
        },
      ]}
    >
      <View style={styles.surahItemContent}>
        <View style={styles.surahLeft}>
          <View style={[styles.surahNumber, { 
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
          }]}>
            <ThemedText type="small" style={{ color: isDark ? '#34D399' : '#059669', fontWeight: '700', fontSize: 13 }}>{item.number}</ThemedText>
          </View>
          <View style={styles.surahInfo}>
            <ThemedText type="body" style={{ fontWeight: '600', fontSize: 16, letterSpacing: -0.3 }}>{item.nameEn}</ThemedText>
            <View style={styles.versesBadge}>
              <View style={[styles.verseDot, { backgroundColor: isDark ? '#34D399' : '#059669' }]} />
              <ThemedText type="caption" style={{ fontSize: 12, opacity: 0.6, marginLeft: 4 }}>{item.versesCount} verses</ThemedText>
            </View>
          </View>
        </View>
        <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 20, opacity: 0.85, letterSpacing: 1 }}>{item.nameAr}</ThemedText>
      </View>
    </Pressable>
  ), [isDark, goToSurah]);

  if (showNotes) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.surahListHeader, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)', paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 10) + 10 : insets.top + 10 }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <ThemedText type="h3" style={{ fontWeight: '700', letterSpacing: -1, fontSize: 28 }}>Notes</ThemedText>
                <ThemedText type="caption" style={{ opacity: 0.5, marginTop: 2, fontSize: 13 }}>{[...Object.keys(highlights), ...Object.keys(notes)].filter((v, i, a) => a.indexOf(v) === i).length} items</ThemedText>
              </View>
              <Pressable 
                onPress={() => {
                  setShowNotes(false);
                  requestAnimationFrame(() => {
                    const index = 604 - currentPage;
                    flatListRef.current?.scrollToOffset({ offset: index * SCREEN_WIDTH, animated: false });
                  });
                }}
                style={({ pressed }) => [{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)', opacity: pressed ? 0.6 : 1 }]}
              >
                <Feather name="x" size={20} color={theme.text} />
              </Pressable>
            </View>
          </View>
        </View>
        {Object.keys(highlights).length === 0 && Object.keys(notes).length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
            <Feather name="edit-3" size={48} color={theme.textSecondary} style={{ opacity: 0.3, marginBottom: Spacing.md }} />
            <ThemedText type="body" style={{ opacity: 0.5, textAlign: 'center' }}>No notes yet</ThemedText>
            <ThemedText type="caption" style={{ opacity: 0.4, textAlign: 'center', marginTop: Spacing.xs }}>Tap any verse to add a note</ThemedText>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Notes with Text Section */}
            {Object.keys(notes).length > 0 && (
              <View style={{ marginTop: Spacing.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
                  <View style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 16, 
                    backgroundColor: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(212, 175, 55, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10
                  }}>
                    <Feather name="file-text" size={16} color={isDark ? '#D4AF37' : '#B8860B'} />
                  </View>
                  <ThemedText type="body" style={{ fontWeight: '700', fontSize: 15, letterSpacing: 0.5, opacity: 0.9 }}>
                    NOTES ({Object.keys(notes).length})
                  </ThemedText>
                </View>
                {Object.keys(notes).map((verseKey) => {
                  const [surah, ayah] = verseKey.split(':');
                  const surahData = quranData.data.surahs.find((s: any) => s.number === parseInt(surah));
                  const surahInfo = surahs.find((s: any) => s.number === parseInt(surah));
                  const ayahData = surahData?.ayahs.find((a: any) => a.numberInSurah === parseInt(ayah));
                  const verseText = ayahData?.text || '';
                  const preview = verseText;
                  const timestamp = noteTimestamps[verseKey];
                  const timeAgo = timestamp ? (() => {
                    const diff = Date.now() - timestamp;
                    const mins = Math.floor(diff / 60000);
                    const hrs = Math.floor(diff / 3600000);
                    const days = Math.floor(diff / 86400000);
                    if (days > 0) return `${days}d ago`;
                    if (hrs > 0) return `${hrs}h ago`;
                    if (mins > 0) return `${mins}m ago`;
                    return 'Just now';
                  })() : '';
                  
                  const renderRightActions = (progress: RNAnimated.AnimatedInterpolation<number>, dragX: RNAnimated.AnimatedInterpolation<number>) => {
                    const trans = dragX.interpolate({
                      inputRange: [-100, 0],
                      outputRange: [0, 100],
                      extrapolate: 'clamp',
                    });
                    return (
                      <RNAnimated.View style={{ transform: [{ translateX: trans }], flexDirection: 'row' }}>
                        <Pressable
                          onPress={() => {
                            deleteNote(verseKey);
                            if (highlights[verseKey]) {
                              removeHighlight(verseKey);
                            }
                          }}
                          style={{ width: 80, backgroundColor: '#FF4444', justifyContent: 'center', alignItems: 'center', marginHorizontal: Spacing.lg, borderRadius: 12 }}
                        >
                          <Feather name="trash-2" size={20} color="#FFF" />
                          <ThemedText type="caption" style={{ color: '#FFF', fontSize: 11, marginTop: 4 }}>Delete</ThemedText>
                        </Pressable>
                      </RNAnimated.View>
                    );
                  };
                  
                  return (
                    <Swipeable 
                      key={verseKey}
                      renderRightActions={renderRightActions}
                      onSwipeableOpen={(direction) => {
                        if (direction === 'right') {
                          deleteNote(verseKey);
                          if (highlights[verseKey]) {
                            removeHighlight(verseKey);
                          }
                        }
                      }}
                      overshootRight={false}
                    >
                      <Pressable
                        onPress={() => {
                          const page = ayahData?.page || 1;
                          const index = 604 - page;
                          const offset = index * SCREEN_WIDTH;
                          setShowNotes(false);
                          setIsNavigating(true);
                          requestAnimationFrame(() => {
                            flatListRef.current?.scrollToOffset({ offset, animated: false });
                            setTimeout(() => setIsNavigating(false), 300);
                          });
                        }}
                        style={({ pressed }) => [{
                          marginHorizontal: Spacing.lg,
                          marginBottom: Spacing.sm,
                          padding: Spacing.md,
                          borderRadius: 12,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                          opacity: pressed ? 0.7 : 1,
                        }]}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <View style={{ flex: 1 }}>
                            <ThemedText type="body" style={{ fontWeight: '600', fontSize: 15 }}>{surahInfo?.nameEn} {surah}:{ayah}</ThemedText>
                            {timeAgo && <ThemedText type="caption" style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>{timeAgo}</ThemedText>}
                          </View>
                          {highlights[verseKey] && (
                            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: highlights[verseKey], marginLeft: 8 }} />
                          )}
                        </View>
                        <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 16, opacity: 0.7, marginBottom: 8, textAlign: 'right', lineHeight: 28 }}>{preview}</ThemedText>
                        <View style={{ 
                          padding: 10, 
                          borderRadius: 8, 
                          backgroundColor: isDark ? 'rgba(212, 175, 55, 0.1)' : 'rgba(212, 175, 55, 0.05)',
                          borderLeftWidth: 3,
                          borderLeftColor: isDark ? '#D4AF37' : '#B8860B'
                        }}>
                          <ThemedText type="caption" style={{ fontSize: 13, fontStyle: 'italic' }}>{notes[verseKey]}</ThemedText>
                        </View>
                      </Pressable>
                    </Swipeable>
                  );
                })}
              </View>
            )}

            {/* Highlights Only Section */}
            {Object.keys(highlights).filter(key => !notes[key]).length > 0 && (
              <View style={{ marginTop: Spacing.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
                  <View style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 16, 
                    backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10
                  }}>
                    <Feather name="edit-3" size={16} color={isDark ? '#34D399' : '#059669'} />
                  </View>
                  <ThemedText type="body" style={{ fontWeight: '700', fontSize: 15, letterSpacing: 0.5, opacity: 0.9 }}>
                    HIGHLIGHTS ({Object.keys(highlights).filter(key => !notes[key]).length})
                  </ThemedText>
                </View>
                {Object.keys(highlights).filter(key => !notes[key]).map((verseKey) => {
                  const color = highlights[verseKey];
                  const [surah, ayah] = verseKey.split(':');
                  const surahData = quranData.data.surahs.find((s: any) => s.number === parseInt(surah));
                  const surahInfo = surahs.find((s: any) => s.number === parseInt(surah));
                  const ayahData = surahData?.ayahs.find((a: any) => a.numberInSurah === parseInt(ayah));
                  const verseText = ayahData?.text || '';
                  const preview = verseText;
                  const timestamp = highlightTimestamps[verseKey];
                  const timeAgo = timestamp ? (() => {
                    const diff = Date.now() - timestamp;
                    const mins = Math.floor(diff / 60000);
                    const hrs = Math.floor(diff / 3600000);
                    const days = Math.floor(diff / 86400000);
                    if (days > 0) return `${days}d ago`;
                    if (hrs > 0) return `${hrs}h ago`;
                    if (mins > 0) return `${mins}m ago`;
                    return 'Just now';
                  })() : '';
                  
                  const renderRightActions = (progress: RNAnimated.AnimatedInterpolation<number>, dragX: RNAnimated.AnimatedInterpolation<number>) => {
                    const trans = dragX.interpolate({
                      inputRange: [-100, 0],
                      outputRange: [0, 100],
                      extrapolate: 'clamp',
                    });
                    return (
                      <RNAnimated.View style={{ transform: [{ translateX: trans }], flexDirection: 'row' }}>
                        <Pressable
                          onPress={() => removeHighlight(verseKey)}
                          style={{ width: 80, backgroundColor: '#FF4444', justifyContent: 'center', alignItems: 'center', marginHorizontal: Spacing.lg, borderRadius: 12 }}
                        >
                          <Feather name="trash-2" size={20} color="#FFF" />
                          <ThemedText type="caption" style={{ color: '#FFF', fontSize: 11, marginTop: 4 }}>Delete</ThemedText>
                        </Pressable>
                      </RNAnimated.View>
                    );
                  };
                  
                  return (
                    <Swipeable 
                      key={verseKey}
                      renderRightActions={renderRightActions}
                      overshootRight={false}
                      onSwipeableOpen={(direction) => {
                        if (direction === 'right') {
                          removeHighlight(verseKey);
                        }
                      }}
                    >
                      <Pressable
                        onPress={() => {
                          const page = ayahData?.page || 1;
                          const index = 604 - page;
                          const offset = index * SCREEN_WIDTH;
                          setShowNotes(false);
                          setIsNavigating(true);
                          requestAnimationFrame(() => {
                            flatListRef.current?.scrollToOffset({ offset, animated: false });
                            setTimeout(() => setIsNavigating(false), 300);
                          });
                        }}
                        style={({ pressed }) => [{
                          marginHorizontal: Spacing.lg,
                          marginBottom: Spacing.sm,
                          padding: Spacing.md,
                          borderRadius: 12,
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                          opacity: pressed ? 0.7 : 1,
                        }]}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <View style={{ flex: 1 }}>
                            <ThemedText type="body" style={{ fontWeight: '600', fontSize: 15 }}>{surahInfo?.nameEn} {surah}:{ayah}</ThemedText>
                            {timeAgo && <ThemedText type="caption" style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>{timeAgo}</ThemedText>}
                          </View>
                          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: color, marginLeft: 8 }} />
                        </View>
                        <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 16, opacity: 0.7, textAlign: 'right', lineHeight: 28 }}>{preview}</ThemedText>
                      </Pressable>
                    </Swipeable>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}
      </ThemedView>
    );
  }

  if (showBookmarks) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.surahListHeader, { 
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 10) + 10 : insets.top + 10,
        }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <ThemedText type="h3" style={{ fontWeight: '700', letterSpacing: -1, fontSize: 28 }}>Bookmarks</ThemedText>
                <ThemedText type="caption" style={{ opacity: 0.5, marginTop: 2, fontSize: 13 }}>{bookmarks.length} verses</ThemedText>
              </View>
              <Pressable 
                onPress={() => {
                  setShowBookmarks(false);
                  requestAnimationFrame(() => {
                    const index = 604 - currentPage;
                    flatListRef.current?.scrollToOffset({ offset: index * SCREEN_WIDTH, animated: false });
                  });
                }}
                style={({ pressed }) => [{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  opacity: pressed ? 0.6 : 1,
                }]}
              >
                <Feather name="x" size={20} color={theme.text} />
              </Pressable>
            </View>
          </View>
        </View>
        {bookmarks.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
            <Feather name="bookmark" size={48} color={theme.textSecondary} style={{ opacity: 0.3, marginBottom: Spacing.md }} />
            <ThemedText type="body" style={{ opacity: 0.5, textAlign: 'center' }}>No bookmarks yet</ThemedText>
            <ThemedText type="caption" style={{ opacity: 0.4, textAlign: 'center', marginTop: Spacing.xs }}>Tap any verse to bookmark it</ThemedText>
          </View>
        ) : (
          <FlatList
            data={bookmarks}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const [surah, ayah] = item.split(':');
              const surahData = quranData.data.surahs.find((s: any) => s.number === parseInt(surah));
              const surahInfo = surahs.find((s: any) => s.number === parseInt(surah));
              const ayahData = surahData?.ayahs.find((a: any) => a.numberInSurah === parseInt(ayah));
              const verseText = ayahData?.text || '';
              const preview = verseText.length > 60 ? verseText.substring(0, 60) + '...' : verseText;
              
              const renderRightActions = (progress: RNAnimated.AnimatedInterpolation<number>, dragX: RNAnimated.AnimatedInterpolation<number>) => {
                const trans = dragX.interpolate({
                  inputRange: [-100, 0],
                  outputRange: [0, 100],
                  extrapolate: 'clamp',
                });
                return (
                  <RNAnimated.View style={{ transform: [{ translateX: trans }], flexDirection: 'row' }}>
                    <Pressable
                      onPress={() => toggleBookmark(item)}
                      style={{ width: 80, backgroundColor: '#FF4444', justifyContent: 'center', alignItems: 'center', marginHorizontal: Spacing.lg, borderRadius: 12 }}
                    >
                      <Feather name="trash-2" size={20} color="#FFF" />
                      <ThemedText type="caption" style={{ color: '#FFF', fontSize: 11, marginTop: 4 }}>Delete</ThemedText>
                    </Pressable>
                  </RNAnimated.View>
                );
              };
              
              return (
                <Swipeable 
                  renderRightActions={renderRightActions}
                  onSwipeableOpen={(direction) => {
                    if (direction === 'right') {
                      toggleBookmark(item);
                    }
                  }}
                  overshootRight={false}
                >
                  <Pressable
                    onPress={() => {
                      console.log('Bookmark clicked:', { item, surah, ayah });
                      const page = ayahData?.page || 1;
                      console.log('Page number:', page);
                      const index = 604 - page;
                      const offset = index * SCREEN_WIDTH;
                      console.log('Scroll to:', { index, offset, SCREEN_WIDTH });
                      setShowBookmarks(false);
                      setIsNavigating(true);
                      requestAnimationFrame(() => {
                        flatListRef.current?.scrollToOffset({ offset, animated: false });
                        setTimeout(() => setIsNavigating(false), 300);
                      });
                    }}
                    style={({ pressed }) => [
                      styles.surahItem,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      },
                    ]}
                  >
                    <View style={styles.surahItemContent}>
                      <View style={styles.surahLeft}>
                        <View style={[styles.surahNumber, { 
                          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                        }]}>
                          <Feather name="bookmark" size={18} color={isDark ? '#34D399' : '#059669'} fill={isDark ? '#34D399' : '#059669'} />
                        </View>
                        <View style={styles.surahInfo}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <ThemedText type="body" style={{ fontWeight: '600', fontSize: 16 }}>{surahInfo?.nameEn || `Surah ${surah}`}, Verse {ayah}</ThemedText>
                            <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 16, opacity: 0.7 }}>({surahInfo?.nameAr})</ThemedText>
                          </View>
                          <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', marginTop: 4, opacity: 0.7, lineHeight: 22, fontSize: 16, textAlign: 'right' }} numberOfLines={2}>{preview}</ThemedText>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </Swipeable>
              );
            }}
            contentContainerStyle={{ padding: Spacing.lg }}
          />
        )}
      </ThemedView>
    );
  }

  if (showSurahList) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.surahListHeader, { 
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 10) + 10 : insets.top + 10,
        }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <ThemedText type="h3" style={{ fontWeight: '700', letterSpacing: -1, fontSize: 28 }}>Quran</ThemedText>
                <ThemedText type="caption" style={{ opacity: 0.5, marginTop: 2, fontSize: 13 }}>{navigationMode === 'surah' ? '114 Surahs' : '30 Juz'}</ThemedText>
              </View>
              <Pressable 
                onPress={() => {
                  setShowSurahList(false);
                  requestAnimationFrame(() => {
                    const index = 604 - currentPage;
                    flatListRef.current?.scrollToOffset({ offset: index * SCREEN_WIDTH, animated: false });
                  });
                }}
                style={({ pressed }) => [{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  opacity: pressed ? 0.6 : 1,
                }]}
              >
                <Feather name="x" size={20} color={theme.text} />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: Spacing.md }}>
              <Pressable
                onPress={() => setNavigationMode('surah')}
                style={({ pressed }) => [{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: navigationMode === 'surah' ? (isDark ? '#34D399' : '#059669') : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'),
                  opacity: pressed ? 0.7 : 1,
                }]}
              >
                <ThemedText type="body" style={{ fontWeight: navigationMode === 'surah' ? '600' : '400', color: navigationMode === 'surah' ? '#FFF' : theme.text, fontSize: 14 }}>Surah</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setNavigationMode('juz')}
                style={({ pressed }) => [{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: navigationMode === 'juz' ? (isDark ? '#34D399' : '#059669') : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'),
                  opacity: pressed ? 0.7 : 1,
                }]}
              >
                <ThemedText type="body" style={{ fontWeight: navigationMode === 'juz' ? '600' : '400', color: navigationMode === 'juz' ? '#FFF' : theme.text, fontSize: 14 }}>Juz</ThemedText>
              </Pressable>
            </View>
            
            {/* Search Bar */}
            <View style={{ marginTop: Spacing.md }}>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}>
                <Feather name="search" size={18} color={theme.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search verses, surahs, or references..."
                  placeholderTextColor={theme.textSecondary}
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: theme.text,
                    padding: 0,
                  }}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                    <Feather name="x" size={16} color={theme.textSecondary} />
                  </Pressable>
                )}
              </View>
              {searchQuery.length > 0 && searchQuery.length < 2 && (
                <ThemedText type="caption" style={{ marginTop: 4, marginLeft: 4, opacity: 0.5, fontSize: 11 }}>
                  Type at least 2 characters to search
                </ThemedText>
              )}
              
              {/* Tafsir Search Toggle */}
              <Pressable
                onPress={() => setIncludeTafsirInSearch(!includeTafsirInSearch)}
                style={({ pressed }) => [{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  backgroundColor: includeTafsirInSearch 
                    ? (isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)')
                    : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)'),
                  opacity: pressed ? 0.7 : 1,
                }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Feather 
                    name="book-open" 
                    size={14} 
                    color={includeTafsirInSearch ? (isDark ? '#34D399' : '#059669') : theme.textSecondary} 
                  />
                  <ThemedText 
                    type="caption" 
                    style={{ 
                      fontSize: 13, 
                      fontWeight: includeTafsirInSearch ? '600' : '400',
                      color: includeTafsirInSearch ? (isDark ? '#34D399' : '#059669') : theme.text
                    }}
                  >
                    Include Tafsir/Translation in search
                  </ThemedText>
                </View>
                <View style={{
                  width: 40,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: includeTafsirInSearch 
                    ? (isDark ? '#34D399' : '#059669')
                    : (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'),
                  padding: 2,
                  justifyContent: 'center',
                  alignItems: includeTafsirInSearch ? 'flex-end' : 'flex-start',
                }}>
                  <View style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: '#FFF',
                  }} />
                </View>
              </Pressable>
            </View>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Search Results */}
          {searchQuery.trim().length >= 2 && (
            <View style={{ padding: Spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
                <Feather name="search" size={16} color={isDark ? '#34D399' : '#059669'} style={{ marginRight: 8 }} />
                <ThemedText type="body" style={{ fontWeight: '600', fontSize: 13, opacity: 0.6 }}>
                  {isSearching ? 'SEARCHING...' : `${searchResults.length} RESULTS`}
                </ThemedText>
              </View>
              {searchResults.length === 0 && !isSearching ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Feather name="search" size={48} color={theme.textSecondary} style={{ opacity: 0.3, marginBottom: 16 }} />
                  <ThemedText type="body" style={{ opacity: 0.5 }}>No results found</ThemedText>
                  <ThemedText type="caption" style={{ opacity: 0.4, marginTop: 4 }}>Try different keywords</ThemedText>
                </View>
              ) : (
                searchResults.map((result, index) => {
                  const surahInfo = surahs.find(s => s.number === result.surah);
                  return (
                    <Pressable
                      key={`${result.verseKey}-${index}`}
                      onPress={async () => {
                        const page = result.page;
                        const index = 604 - page;
                        const offset = index * SCREEN_WIDTH;
                        setShowSurahList(false);
                        setSearchQuery('');
                        setIsNavigating(true);
                        
                        // If match is from tafsir, load that tafsir and skip selection menu
                        if (result.matchType === 'tafsir' && result.tafsirSource) {
                          // Set the tafsir source first
                          setSelectedTafsirId(result.tafsirSource);
                          
                          // Load the tafsir data for this specific verse
                          try {
                            const tafsirPath = `${FileSystem.documentDirectory}tafsir-${result.tafsirSource}.json`;
                            const fileInfo = await FileSystem.getInfoAsync(tafsirPath);
                            
                            let verseData;
                            if (fileInfo.exists) {
                              const content = await FileSystem.readAsStringAsync(tafsirPath);
                              const fullData = JSON.parse(content);
                              verseData = fullData[result.verseKey];
                            } else {
                              // Fallback to bundled tafsir
                              let fullData;
                              if (result.tafsirSource === 'jalalayn') {
                                fullData = await import("@/data/tafsir-jalalayn.json");
                              } else if (result.tafsirSource === 'sahih-international') {
                                fullData = await import("@/data/en-sahih-international-inline-footnotes.json");
                              } else {
                                fullData = await import("@/data/abridged-explanation-of-the-quran.json");
                              }
                              verseData = fullData[result.verseKey];
                            }
                            
                            // Set the tafsir data in the expected format
                            if (verseData) {
                              setTafsirData({ text: verseData.text || verseData.t || verseData });
                            }
                          } catch (error) {
                            console.error('Error loading tafsir:', error);
                          }
                        }
                        
                        requestAnimationFrame(() => {
                          flatListRef.current?.scrollToOffset({ offset, animated: false });
                          setTimeout(() => {
                            setIsNavigating(false);
                            // Set highlighted verse and search term
                            setHighlightedVerse(result.verseKey);
                            setLastSearchTerm(searchQuery);
                            // Clear highlight after 3 seconds
                            setTimeout(() => setHighlightedVerse(null), 3000);
                            
                            // If match is from tafsir, open the tafsir modal directly
                            if (result.matchType === 'tafsir') {
                              setTafsirVerse({ 
                                verseKey: result.verseKey,
                                surah: result.surah,
                                ayah: result.ayah
                              } as VerseRegion);
                              setShowArabicTafsir(result.tafsirSource === 'jalalayn');
                            }
                          }, 300);
                        });
                      }}
                      style={({ pressed }) => [{
                        padding: 14,
                        marginBottom: 8,
                        borderRadius: 12,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      }]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <View style={{ 
                          paddingHorizontal: 8, 
                          paddingVertical: 4, 
                          borderRadius: 6,
                          backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                          marginRight: 8,
                        }}>
                          <ThemedText type="caption" style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#34D399' : '#059669' }}>
                            {result.verseKey}
                          </ThemedText>
                        </View>
                        {result.matchType === 'tafsir' && (
                          <>
                            <View style={{ 
                              paddingHorizontal: 6, 
                              paddingVertical: 3, 
                              borderRadius: 4,
                              backgroundColor: result.tafsirSource === 'sahih-international' 
                                ? (isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)')
                                : (isDark ? 'rgba(147, 51, 234, 0.15)' : 'rgba(147, 51, 234, 0.1)'),
                              marginRight: 8,
                            }}>
                              <ThemedText type="caption" style={{ 
                                fontSize: 10, 
                                fontWeight: '600', 
                                color: result.tafsirSource === 'sahih-international'
                                  ? (isDark ? '#60A5FA' : '#2563EB')
                                  : (isDark ? '#C084FC' : '#9333EA')
                              }}>
                                {result.tafsirSource === 'sahih-international' ? 'TRANSLATION' : 'TAFSIR'}
                              </ThemedText>
                            </View>
                            <View style={{ 
                              paddingHorizontal: 6, 
                              paddingVertical: 3, 
                              borderRadius: 4,
                              backgroundColor: result.tafsirSource === 'sahih-international' 
                                ? (isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)')
                                : (isDark ? 'rgba(147, 51, 234, 0.15)' : 'rgba(147, 51, 234, 0.1)'),
                              marginRight: 8,
                            }}>
                              <ThemedText type="caption" style={{ 
                                fontSize: 10, 
                                fontWeight: '600', 
                                color: result.tafsirSource === 'sahih-international'
                                  ? (isDark ? '#60A5FA' : '#2563EB')
                                  : (isDark ? '#C084FC' : '#9333EA')
                              }}>
                                {result.tafsirSource === 'jalalayn' ? 'JALALAYN' : result.tafsirSource === 'sahih-international' ? 'SAHIH INT\'L' : 'ABRIDGED'}
                              </ThemedText>
                            </View>
                          </>
                        )}
                        <ThemedText type="body" style={{ fontWeight: '600', fontSize: 14 }}>
                          {surahInfo?.nameEn}
                        </ThemedText>
                        <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 14, opacity: 0.6, marginLeft: 6 }}>
                          {surahInfo?.nameAr}
                        </ThemedText>
                      </View>
                      {result.matchType === 'tafsir' ? (
                        <ThemedText 
                          type="body" 
                          style={{ 
                            fontSize: 13, 
                            lineHeight: 20, 
                            opacity: 0.7,
                            fontStyle: 'italic',
                          }}
                          numberOfLines={3}
                        >
                          {result.tafsirPreview}
                        </ThemedText>
                      ) : (
                        <ThemedText 
                          type="arabic" 
                          style={{ fontFamily: 'AlMushafQuran', fontSize: 15, lineHeight: 26, textAlign: 'right', opacity: 0.8 }}
                          numberOfLines={2}
                        >
                          {result.text}
                        </ThemedText>
                      )}
                    </Pressable>
                  );
                })
              )}
            </View>
          )}
          
          {/* Regular Navigation - Only show when not searching */}
          {searchQuery.trim().length < 2 && (
          <View style={{ padding: Spacing.lg }}>
          {/* Recent Pages */}
          {recentPages.length > 0 && (
            <View style={{ marginBottom: Spacing.xl }}>
              <ThemedText type="body" style={{ fontWeight: '600', marginBottom: Spacing.sm, opacity: 0.6, fontSize: 13 }}>RECENT PAGES</ThemedText>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {recentPages.map((page) => {
                  const pageSurah = Object.entries(surahPages).find(([_, startPage]) => page >= startPage && (Object.values(surahPages).find(p => p > startPage) || 605) > page);
                  const surahNum = pageSurah ? parseInt(pageSurah[0]) : 1;
                  const surah = surahs.find(s => s.number === surahNum);
                  return (
                    <Pressable
                      key={page}
                      onPress={() => {
                        const index = 604 - page;
                        const offset = index * SCREEN_WIDTH;
                        setShowSurahList(false);
                        setIsNavigating(true);
                        requestAnimationFrame(() => {
                          flatListRef.current?.scrollToOffset({ offset, animated: false });
                          setTimeout(() => setIsNavigating(false), 300);
                        });
                      }}
                      style={({ pressed }) => [{
                        flex: 1,
                        paddingVertical: 16,
                        paddingHorizontal: 12,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(5, 150, 105, 0.1)',
                        opacity: pressed ? 0.7 : 1,
                      }]}
                    >
                      <ThemedText type="body" style={{ fontWeight: '600', fontSize: 14, color: isDark ? '#34D399' : '#059669', textAlign: 'center' }}>{surah?.nameEn}</ThemedText>
                      <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 16, color: isDark ? '#34D399' : '#059669', marginTop: 4 }}>{surah?.nameAr}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
          {navigationMode === 'surah' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
              <ThemedText type="body" style={{ fontWeight: '600', opacity: 0.6, fontSize: 13 }}>ALL SURAHS</ThemedText>
              <Pressable
                onPress={() => setJuzSortAsc(!juzSortAsc)}
                style={({ pressed }) => [{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  opacity: pressed ? 0.7 : 1,
                }]}
              >
                <ThemedText type="caption" style={{ fontSize: 12 }}>Juz</ThemedText>
                <Feather name={juzSortAsc ? 'arrow-up' : 'arrow-down'} size={14} color={theme.text} />
              </Pressable>
            </View>
          )}
          {navigationMode === 'surah' ? (() => {
            const surahsByJuz = surahs.reduce((acc: any, surah) => {
              const firstAyah = quranData.data.surahs.find((s: any) => s.number === surah.number)?.ayahs[0];
              const juz = firstAyah?.juz || 1;
              if (!acc[juz]) acc[juz] = [];
              acc[juz].push(surah);
              return acc;
            }, {});
            const juzNumbers = Object.keys(surahsByJuz).map(Number).sort((a, b) => juzSortAsc ? a - b : b - a);
            return juzNumbers.map(juz => (
              <View key={juz}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.md, marginBottom: Spacing.sm }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(5, 150, 105, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                    <ThemedText type="small" style={{ fontWeight: '700', fontSize: 12, color: isDark ? '#34D399' : '#059669' }}>{juz}</ThemedText>
                  </View>
                  <ThemedText type="caption" style={{ fontSize: 12, opacity: 0.5 }}>Juz {juz}</ThemedText>
                </View>
                {surahsByJuz[juz].map((item: any) => (
            <Pressable
              key={item.number}
              onPress={() => goToSurah(item.number)}
              style={({ pressed }) => [
                styles.surahItem,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                  transform: [{ scale: pressed ? 0.98 : 1 }, { translateY: pressed ? 1 : 0 }],
                  marginHorizontal: 0,
                },
              ]}
            >
              <View style={styles.surahItemContent}>
                <View style={styles.surahLeft}>
                  <View style={[styles.surahNumber, { 
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                  }]}>
                    <ThemedText type="small" style={{ color: isDark ? '#34D399' : '#059669', fontWeight: '700', fontSize: 13 }}>{item.number}</ThemedText>
                  </View>
                  <View style={styles.surahInfo}>
                    <ThemedText type="body" style={{ fontWeight: '600', fontSize: 16, letterSpacing: -0.3 }}>{item.nameEn}</ThemedText>
                    <View style={styles.versesBadge}>
                      <View style={[styles.verseDot, { backgroundColor: isDark ? '#34D399' : '#059669' }]} />
                      <ThemedText type="caption" style={{ fontSize: 12, opacity: 0.6, marginLeft: 4 }}>{item.versesCount} verses</ThemedText>
                    </View>
                  </View>
                </View>
                <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 20, opacity: 0.85, letterSpacing: 1 }}>{item.nameAr}</ThemedText>
              </View>
            </Pressable>
                ))}
              </View>
            ));
          })() : (() => {
            const juzData: any[] = [];
            const hizbQuarters = new Map();
            quranData.data.surahs.forEach((s: any) => {
              s.ayahs.forEach((a: any) => {
                const key = a.hizbQuarter;
                if (!hizbQuarters.has(key)) {
                  const hizb = Math.ceil(key / 4);
                  const quarter = ((key - 1) % 4) + 1;
                  const juz = a.juz;
                  hizbQuarters.set(key, { juz, hizb, quarter, verse: { ...a, surah: s.number }, surah: surahs.find(su => su.number === s.number) });
                }
              });
            });
            Array.from(hizbQuarters.values()).sort((a, b) => juzSortAsc ? (a.juz - b.juz || a.hizb - b.hizb || a.quarter - b.quarter) : (b.juz - a.juz || b.hizb - a.hizb || b.quarter - a.quarter)).forEach(item => juzData.push(item));
            return (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
                  <ThemedText type="body" style={{ fontWeight: '600', opacity: 0.6, fontSize: 13 }}>ALL JUZ</ThemedText>
                  <Pressable
                    onPress={() => setJuzSortAsc(!juzSortAsc)}
                    style={({ pressed }) => [{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                      opacity: pressed ? 0.7 : 1,
                    }]}
                  >
                    <ThemedText type="caption" style={{ fontSize: 12 }}>Juz</ThemedText>
                    <Feather name={juzSortAsc ? 'arrow-up' : 'arrow-down'} size={14} color={theme.text} />
                  </Pressable>
                </View>
                {juzData.map((item, idx) => {
              const isNewJuz = idx === 0 || item.juz !== juzData[idx - 1].juz;
              const isNewHizb = isNewJuz || item.hizb !== juzData[idx - 1].hizb;
              const quarterLabel = ['¼', '½', '¾', '1'][item.quarter - 1];
              const hizbLabel = `Hizb ${(item.juz - 1) * 2 + item.hizb}`;
              return (
                <View key={`${item.juz}-${item.hizb}-${item.quarter}`}>
                  {isNewJuz && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: idx === 0 ? 0 : Spacing.lg, marginBottom: Spacing.sm }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(5, 150, 105, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                        <ThemedText type="small" style={{ fontWeight: '700', fontSize: 13, color: isDark ? '#34D399' : '#059669' }}>{item.juz}</ThemedText>
                      </View>
                      <ThemedText type="body" style={{ fontSize: 14, fontWeight: '600', opacity: 0.7 }}>Juz {item.juz}</ThemedText>
                    </View>
                  )}
                  {isNewHizb && (
                    <ThemedText type="caption" style={{ fontSize: 12, opacity: 0.5, marginTop: Spacing.xs, marginBottom: Spacing.xs, marginLeft: 44 }}>{hizbLabel}</ThemedText>
                  )}
                  <Pressable
                    onPress={() => {
                      const page = item.verse.page;
                      const index = 604 - page;
                      const offset = index * SCREEN_WIDTH;
                      setShowSurahList(false);
                      setIsNavigating(true);
                      requestAnimationFrame(() => {
                        flatListRef.current?.scrollToOffset({ offset, animated: false });
                        setTimeout(() => setIsNavigating(false), 300);
                      });
                    }}
                    style={({ pressed }) => [{
                      marginLeft: 44,
                      marginBottom: Spacing.xs,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                      opacity: pressed ? 0.7 : 1,
                    }]}
                  >
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(5, 150, 105, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                            <ThemedText type="small" style={{ fontSize: 10, fontWeight: '600', color: isDark ? '#34D399' : '#059669' }}>{quarterLabel}</ThemedText>
                          </View>
                          <ThemedText type="body" style={{ fontWeight: '600', fontSize: 14 }}>{item.surah?.nameEn} {item.verse.numberInSurah}</ThemedText>
                        </View>
                        <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 16, opacity: 0.7 }}>{item.surah?.nameAr}</ThemedText>
                      </View>
                      <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 14, opacity: 0.6, textAlign: 'right', lineHeight: 24 }} numberOfLines={2}>{item.verse.text}</ThemedText>
                    </View>
                  </Pressable>
                </View>
              );
            })}
              </>
            );
          })()}
          </View>
          )}
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.pillButtonContainer, { 
        top: Platform.OS === 'android' ? Math.max(insets.top, 10) + 5 : insets.top + 5 
      }]}>
        <View style={[styles.pillButton, { 
          backgroundColor: isDark ? 'rgba(26, 95, 79, 0.25)' : 'rgba(255, 255, 255, 0.85)',
          borderColor: isDark ? 'rgba(212, 175, 55, 0.4)' : 'rgba(212, 175, 55, 0.5)',
        }]}>
          <Pressable
            onPress={() => {
              setShowBookmarks(true);
            }}
            style={({ pressed }) => [
              styles.pillButtonHalf,
              { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
          >
            <Feather name="bookmark" size={18} color={isDark ? '#D4AF37' : '#1a5f4f'} />
            {bookmarks.length > 0 && (
              <View style={[styles.pillBadge, { backgroundColor: isDark ? '#D4AF37' : '#1a5f4f' }]}>
                <ThemedText type="small" style={{ color: '#FFF', fontSize: 9, fontWeight: '700' }}>{bookmarks.length}</ThemedText>
              </View>
            )}
          </Pressable>
          <View style={[styles.pillDivider, { backgroundColor: isDark ? 'rgba(212, 175, 55, 0.25)' : 'rgba(26, 95, 79, 0.2)' }]} />
          <Pressable
            onPress={() => {
              setShowNotes(true);
            }}
            style={({ pressed }) => [
              styles.pillButtonHalf,
              { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
          >
            <Feather name="edit-3" size={18} color={isDark ? '#D4AF37' : '#1a5f4f'} />
            {([...Object.keys(highlights), ...Object.keys(notes)].filter((v, i, a) => a.indexOf(v) === i).length > 0) && (
              <View style={[styles.pillBadge, { backgroundColor: isDark ? '#D4AF37' : '#1a5f4f' }]}>
                <ThemedText type="small" style={{ color: '#FFF', fontSize: 9, fontWeight: '700' }}>{[...Object.keys(highlights), ...Object.keys(notes)].filter((v, i, a) => a.indexOf(v) === i).length}</ThemedText>
              </View>
            )}
          </Pressable>
          <View style={[styles.pillDivider, { backgroundColor: isDark ? 'rgba(212, 175, 55, 0.25)' : 'rgba(26, 95, 79, 0.2)' }]} />
          <Pressable
            onPress={() => {
              setShowSurahList(true);
            }}
            style={({ pressed }) => [
              styles.pillButtonHalf,
              { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
          >
            <Feather name="book-open" size={18} color={isDark ? '#D4AF37' : '#1a5f4f'} />
          </Pressable>
        </View>
      </View>
      <FlatList
        ref={flatListRef}
        data={Array.from({ length: 604 }, (_, i) => 604 - i)}
        renderItem={renderPage}
        keyExtractor={(item) => String(item)}
        extraData={isDark}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
        overScrollMode="never"
        disableIntervalMomentum={true}
        onMomentumScrollEnd={(e) => {
          const offset = e.nativeEvent.contentOffset.x;
          const index = Math.round(offset / SCREEN_WIDTH);
          const page = 604 - index;
          console.log('Scroll ended:', { offset, index, calculatedPage: page });
          setCurrentPage(page);
        }}
        onScrollToIndexFailed={(info) => {
          console.log('Scroll to index failed:', info);
          flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
        }}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        initialNumToRender={3}
        maxToRenderPerBatch={5}
        windowSize={21}
        removeClippedSubviews={false}
        updateCellsBatchingPeriod={30}
      />

      {/* Loading overlay while coordinates load */}
      {coordsLoading && (
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
            backgroundColor: isDark ? 'rgba(26, 95, 79, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            padding: 24,
            borderRadius: 16,
            alignItems: 'center',
            gap: 12,
          }}>
            <ActivityIndicator size="large" color={isDark ? '#D4AF37' : '#059669'} />
            <ThemedText type="body" style={{ fontWeight: '600' }}>Loading verses...</ThemedText>
          </View>
        </View>
      )}

      {/* Verse Menu */}
      {selectedVerse && (
        <Pressable style={styles.menuOverlay} onPress={closeMenu}>
          <Animated.View
            entering={SlideInDown.duration(200)}
            exiting={SlideOutDown.duration(150)}
            style={[
              styles.verseMenu,
              {
                backgroundColor: isDark ? 'rgba(26, 95, 79, 0.98)' : 'rgba(245, 245, 245, 0.98)',
                position: 'absolute',
                left: (() => {
                  const menuWidth = 180;
                  const x = selectedVerse.touchX || 0;
                  // Keep menu within screen bounds
                  if (x + menuWidth > SCREEN_WIDTH) {
                    return SCREEN_WIDTH - menuWidth - 10;
                  }
                  return Math.max(10, x);
                })(),
                top: (() => {
                  const menuHeight = 380; // Updated height with copy/share buttons
                  const y = selectedVerse.touchY || 0;
                  const headerHeight = insets.top + 100;
                  const bottomSafeArea = insets.bottom + 20;
                  
                  // If menu would go below screen, position it above the touch point
                  if (y + menuHeight > SCREEN_HEIGHT - bottomSafeArea) {
                    return Math.max(headerHeight, y - menuHeight - 20);
                  }
                  // If menu would go above header, position it below header
                  if (y < headerHeight) {
                    return headerHeight + 10;
                  }
                  return y;
                })(),
              },
            ]}
          >
            <Pressable
              onPress={async () => {
                closeMenu();
                const verses = getVersesToPlay(selectedVerse.surah, selectedVerse.ayah);
                if (verses.length > 1) {
                  AudioService.playQueue(verses);
                } else {
                  await AudioService.play(selectedVerse.surah, selectedVerse.ayah, 'single');
                }
              }}
              style={({ pressed }) => [
                styles.menuItem,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Feather name="play" size={20} color={isDark ? '#D4AF37' : '#1a5f4f'} />
              <ThemedText type="body" style={{ marginLeft: 12, fontWeight: '500' }}>Play</ThemedText>
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(26, 95, 79, 0.15)' }]} />
            <Pressable
              onPress={async () => {
                const verseData = quranData.data.surahs
                  .find((s: any) => s.number === selectedVerse.surah)
                  ?.ayahs.find((a: any) => a.numberInSurah === selectedVerse.ayah);
                const surah = surahs.find(s => s.number === selectedVerse.surah);
                const text = `${verseData?.text || ''}\n\n${surah?.nameAr || ''} (${surah?.nameEn || ''}), Ayah ${selectedVerse.ayah}`;
                await Clipboard.setStringAsync(text);
                closeMenu();
              }}
              style={({ pressed }) => [
                styles.menuItem,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Feather name="copy" size={20} color={isDark ? '#D4AF37' : '#1a5f4f'} />
              <ThemedText type="body" style={{ marginLeft: 12, fontWeight: '500' }}>Copy Verse</ThemedText>
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(26, 95, 79, 0.15)' }]} />
            <Pressable
              onPress={async () => {
                const verseData = quranData.data.surahs
                  .find((s: any) => s.number === selectedVerse.surah)
                  ?.ayahs.find((a: any) => a.numberInSurah === selectedVerse.ayah);
                const surah = surahs.find(s => s.number === selectedVerse.surah);
                const text = `${verseData?.text || ''}\n\n${surah?.nameAr || ''} (${surah?.nameEn || ''}), Ayah ${selectedVerse.ayah}`;
                try {
                  await Share.share({ message: text });
                } catch (error) {
                  console.error('Error sharing:', error);
                }
                closeMenu();
              }}
              style={({ pressed }) => [
                styles.menuItem,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Feather name="share-2" size={20} color={isDark ? '#D4AF37' : '#1a5f4f'} />
              <ThemedText type="body" style={{ marginLeft: 12, fontWeight: '500' }}>Share Verse</ThemedText>
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(26, 95, 79, 0.15)' }]} />
            <Pressable
              onPress={() => {
                toggleBookmark(selectedVerse.verseKey);
                closeMenu();
              }}
              style={({ pressed }) => [
                styles.menuItem,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Feather 
                name="bookmark" 
                size={20} 
                color={isDark ? '#D4AF37' : '#1a5f4f'}
                fill={bookmarks.includes(selectedVerse.verseKey) ? (isDark ? '#D4AF37' : '#1a5f4f') : 'none'}
              />
              <ThemedText type="body" style={{ marginLeft: 12, fontWeight: '500' }}>
                {bookmarks.includes(selectedVerse.verseKey) ? 'Remove Bookmark' : 'Bookmark'}
              </ThemedText>
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(26, 95, 79, 0.15)' }]} />
            <Pressable
              onPress={() => {
                handleTafsirPress();
              }}
              style={({ pressed }) => [
                styles.menuItem,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Feather name="book" size={20} color={isDark ? '#D4AF37' : '#1a5f4f'} />
              <ThemedText type="body" style={{ marginLeft: 12, fontWeight: '500' }}>Tafsir/Translation</ThemedText>
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(26, 95, 79, 0.15)' }]} />
            <Pressable
              onPress={() => {
                setNoteVerseKey(selectedVerse.verseKey);
                setNoteText(notes[selectedVerse.verseKey] || '');
                setShowNoteModal(true);
                closeMenu();
              }}
              style={({ pressed }) => [
                styles.menuItem,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Feather name="file-text" size={20} color={isDark ? '#D4AF37' : '#1a5f4f'} />
              <ThemedText type="body" style={{ marginLeft: 12, fontWeight: '500' }}>
                {notes[selectedVerse.verseKey] ? 'Edit Note' : 'Add Note'}
              </ThemedText>
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(26, 95, 79, 0.15)' }]} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable
                onPress={() => {
                  if (highlights[selectedVerse.verseKey]) {
                    removeHighlight(selectedVerse.verseKey);
                  } else {
                    addHighlight(selectedVerse.verseKey, selectedColor);
                  }
                  closeMenu();
                }}
                style={({ pressed }) => [
                  styles.menuItem,
                  { opacity: pressed ? 0.6 : 1, flex: 1 },
                ]}
              >
                <Feather name="edit-3" size={20} color={isDark ? '#D4AF37' : '#1a5f4f'} />
                <ThemedText type="body" style={{ marginLeft: 12, fontWeight: '500' }}>
                  {highlights[selectedVerse.verseKey] ? 'Remove' : 'Highlight'}
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setShowColorPicker(true)}
                style={({ pressed }) => [{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: highlights[selectedVerse.verseKey] || selectedColor,
                  marginRight: 12,
                  borderWidth: 2,
                  borderColor: isDark ? '#D4AF37' : '#1a5f4f',
                  opacity: pressed ? 0.7 : 1,
                }]}
              />
            </View>
          </Animated.View>
        </Pressable>
      )}

      {/* Color Picker Modal */}
      {showColorPicker && selectedVerse && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setShowColorPicker(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowColorPicker(false)}>
            <Animated.View
              entering={SlideInUp.duration(200)}
              style={[
                styles.colorPickerModal,
                { backgroundColor: isDark ? 'rgba(26, 95, 79, 0.98)' : 'rgba(245, 245, 245, 0.98)' },
              ]}
            >
              <ThemedText type="body" style={{ fontWeight: '600', marginBottom: 16, textAlign: 'center' }}>Choose Highlight Color</ThemedText>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16, justifyContent: 'center' }}>
                {highlightColors.map((color) => (
                  <Pressable
                    key={color.name}
                    onPress={() => {
                      setSelectedColor(color.value);
                      if (highlights[selectedVerse.verseKey]) {
                        addHighlight(selectedVerse.verseKey, color.value);
                      }
                      setShowColorPicker(false);
                    }}
                    style={({ pressed }) => [{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: color.value,
                      borderWidth: 3,
                      borderColor: (highlights[selectedVerse.verseKey] === color.value || (!highlights[selectedVerse.verseKey] && selectedColor === color.value)) ? (isDark ? '#D4AF37' : '#1a5f4f') : 'transparent',
                      opacity: pressed ? 0.7 : 1,
                    }]}
                  />
                ))}
              </View>
              {highlights[selectedVerse.verseKey] && (
                <Pressable
                  onPress={() => {
                    removeHighlight(selectedVerse.verseKey);
                    setShowColorPicker(false);
                    closeMenu();
                  }}
                  style={({ pressed }) => [{
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 10,
                    backgroundColor: isDark ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 0, 0, 0.1)',
                    opacity: pressed ? 0.7 : 1,
                  }]}
                >
                  <ThemedText type="body" style={{ textAlign: 'center', fontWeight: '600', color: '#FF0000' }}>Remove Highlight</ThemedText>
                </Pressable>
              )}
            </Animated.View>
          </Pressable>
        </Modal>
      )}

      {/* Note Modal */}
      {showNoteModal && noteVerseKey && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setShowNoteModal(false)}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setShowNoteModal(false)}>
              <Animated.View
                entering={SlideInUp.duration(200)}
                style={[
                  styles.noteModal,
                  { backgroundColor: isDark ? 'rgba(26, 95, 79, 0.98)' : 'rgba(245, 245, 245, 0.98)' },
                ]}
              >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <ThemedText type="body" style={{ fontWeight: '600', fontSize: 18 }}>Add Note</ThemedText>
                <Pressable onPress={() => { setShowNoteModal(false); setNoteVerseKey(null); }}>
                  <Feather name="x" size={20} color={theme.text} />
                </Pressable>
              </View>
              <TextInput
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Write your note here..."
                placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
                multiline
                numberOfLines={6}
                style={[
                  styles.noteInput,
                  {
                    color: theme.text,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(26, 95, 79, 0.3)',
                  },
                ]}
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {notes[noteVerseKey] && (
                  <Pressable
                    onPress={() => {
                      deleteNote(noteVerseKey);
                      setShowNoteModal(false);
                      setNoteVerseKey(null);
                    }}
                    style={({ pressed }) => [{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 10,
                      backgroundColor: isDark ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 0, 0, 0.1)',
                      opacity: pressed ? 0.7 : 1,
                    }]}
                  >
                    <ThemedText type="body" style={{ textAlign: 'center', fontWeight: '600', color: '#FF0000' }}>Delete</ThemedText>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => {
                    if (noteText.trim()) {
                      saveNote(noteVerseKey, noteText.trim());
                    }
                    setShowNoteModal(false);
                    setNoteVerseKey(null);
                  }}
                  style={({ pressed }) => [{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: isDark ? '#D4AF37' : '#1a5f4f',
                    opacity: pressed ? 0.7 : 1,
                  }]}
                >
                  <ThemedText type="body" style={{ textAlign: 'center', fontWeight: '600', color: '#FFF' }}>Save</ThemedText>
                </Pressable>
              </View>
            </Animated.View>
          </Pressable>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* Tafsir Modal */}
      <Modal
        visible={tafsirData !== null && !showTafsirSources}
        transparent
        animationType="fade"
        onRequestClose={() => {
          console.log('Modal onRequestClose called');
          setTafsirData(null);
        }}
        hardwareAccelerated={true}
        statusBarTranslucent={false}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={SlideInUp.duration(300).springify()}
            exiting={SlideOutDown.duration(200)}
            style={[
              styles.modalContainer,
              {
                backgroundColor: isDark
                  ? Colors.dark.backgroundSecondary
                  : Colors.light.backgroundDefault,
                maxHeight: SCREEN_HEIGHT * 0.85,
                width: SCREEN_WIDTH * 0.9,
                height: SCREEN_HEIGHT * 0.75,
              },
            ]}
          >
            {/* Elegant Header */}
            <View style={{ 
              paddingHorizontal: 20, 
              paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 10) + 10 : 20, 
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            }}>
              {/* Verse Reference */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 20, 
                    backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Feather name="book-open" size={18} color={isDark ? '#34D399' : '#059669'} />
                  </View>
                  <View>
                    <ThemedText type="body" style={{ fontWeight: "700", fontSize: 18, letterSpacing: -0.3 }}>
                      {surahs.find(s => s.number === tafsirVerse?.surah)?.nameEn || `Surah ${tafsirVerse?.surah}`}, Ayah {tafsirVerse?.ayah}
                    </ThemedText>
                    <ThemedText type="caption" style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                      Surah {tafsirVerse?.surah}
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => {
                    console.log('🔴 X button onPress fired');
                    requestAnimationFrame(() => {
                      setTafsirData(null);
                    });
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 20, 
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Feather name="x" size={22} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Tafsir Source Selector */}
              <TouchableOpacity 
                onPress={() => {
                  console.log('🟢 Tafsir source selector pressed');
                  requestAnimationFrame(() => {
                    setTafsirData(null);
                    setTimeout(() => setShowTafsirSources(true), 100);
                  });
                }}
                activeOpacity={0.7}
                style={{ 
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: isDark ? 'rgba(212, 175, 55, 0.12)' : 'rgba(212, 175, 55, 0.08)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(212, 175, 55, 0.15)',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 16, 
                    backgroundColor: isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(212, 175, 55, 0.15)',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Feather name="layers" size={14} color={isDark ? '#D4AF37' : '#B8860B'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="caption" style={{ fontSize: 10, opacity: 0.6, marginBottom: 2, letterSpacing: 0.5 }}>
                      TAFSIR SOURCE
                    </ThemedText>
                    <ThemedText type="body" style={{ fontWeight: "600", fontSize: 14, letterSpacing: -0.2 }}>
                      {availableTafsirs.find(t => t.id === selectedTafsirId)?.name || 'Abridged Explanation'}
                    </ThemedText>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ThemedText type="caption" style={{ fontSize: 12, color: isDark ? '#D4AF37' : '#B8860B', fontWeight: '600' }}>
                    Change
                  </ThemedText>
                  <Feather name="chevron-right" size={16} color={isDark ? '#D4AF37' : '#B8860B'} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Content Area */}
            <ScrollView 
              style={{ flex: 1 }} 
              contentContainerStyle={{ padding: 20, paddingBottom: 30, flexGrow: 1 }}
              showsVerticalScrollIndicator={true}
            >
              {tafsirData ? (
                <View>
                  {/* Decorative Quote Mark */}
                  <View style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 24, 
                    backgroundColor: isDark ? 'rgba(52, 211, 153, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16
                  }}>
                    <ThemedText style={{ fontSize: 24, opacity: 0.4 }}>"</ThemedText>
                  </View>

                  {/* Tafsir Text */}
                  <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', padding: 16, borderRadius: 12 }}>
                    <ThemedText
                      style={{
                        fontSize: 16,
                        lineHeight: 26,
                        letterSpacing: -0.2,
                        color: theme.text,
                      }}
                    >
                      {(() => {
                        // Try all possible text locations
                        const text = tafsirData?.en?.text || tafsirData?.ar?.text || tafsirData?.text;
                        
                        if (!text) {
                          console.log('❌ No text found');
                          return "No tafsir available for this verse";
                        }
                        
                        // Strip HTML tags more aggressively
                        let cleanText = typeof text === 'string' ? text : String(text);
                        
                        // Remove all HTML tags including nested ones
                        cleanText = cleanText.replace(/<[^>]*>/g, '');
                        // Remove HTML entities
                        cleanText = cleanText.replace(/&nbsp;/g, ' ');
                        cleanText = cleanText.replace(/&amp;/g, '&');
                        cleanText = cleanText.replace(/&lt;/g, '<');
                        cleanText = cleanText.replace(/&gt;/g, '>');
                        cleanText = cleanText.replace(/&quot;/g, '"');
                        // Trim whitespace
                        cleanText = cleanText.trim();
                        
                        console.log('✅ Displaying text, length:', cleanText.length);
                        
                        // If we have a search term, highlight it
                        if (lastSearchTerm && cleanText) {
                          const normalizedSearch = showArabicTafsir ? normalizeArabicText(lastSearchTerm) : lastSearchTerm.toLowerCase();
                          
                          // For Arabic, we need to find matches by sliding window since normalization changes length
                          if (showArabicTafsir) {
                            const parts: JSX.Element[] = [];
                            let partKey = 0;
                            let lastIndex = 0;
                            let i = 0;
                            
                            while (i < cleanText.length) {
                              let matchFound = false;
                              
                              // Try to match starting at position i
                              for (let len = lastSearchTerm.length; len <= cleanText.length - i && len <= lastSearchTerm.length * 3; len++) {
                                const substring = cleanText.substring(i, i + len);
                                const normalizedSubstring = normalizeArabicText(substring);
                                
                                if (normalizedSubstring === normalizedSearch) {
                                  // Found a match!
                                  // Add text before match
                                  if (i > lastIndex) {
                                    parts.push(
                                      <ThemedText key={`text-${partKey++}`} style={{ fontSize: 16, lineHeight: 26, letterSpacing: -0.2, color: theme.text }}>
                                        {cleanText.substring(lastIndex, i)}
                                      </ThemedText>
                                    );
                                  }
                                  
                                  // Add highlighted match
                                  parts.push(
                                    <ThemedText 
                                      key={`highlight-${partKey++}`} 
                                      style={{ 
                                        fontSize: 16, 
                                        lineHeight: 26, 
                                        letterSpacing: -0.2, 
                                        backgroundColor: 'rgba(255, 215, 0, 0.4)',
                                        color: theme.text,
                                        fontWeight: '600',
                                      }}
                                    >
                                      {substring}
                                    </ThemedText>
                                  );
                                  
                                  i += len;
                                  lastIndex = i;
                                  matchFound = true;
                                  break;
                                }
                              }
                              
                              if (!matchFound) {
                                i++;
                              }
                            }
                            
                            // Add remaining text
                            if (lastIndex < cleanText.length) {
                              parts.push(
                                <ThemedText key={`text-${partKey++}`} style={{ fontSize: 16, lineHeight: 26, letterSpacing: -0.2, color: theme.text }}>
                                  {cleanText.substring(lastIndex)}
                                </ThemedText>
                              );
                            }
                            
                            return parts.length > 0 ? parts : cleanText;
                          } else {
                            // For English, use simple case-insensitive matching
                            const lowerText = cleanText.toLowerCase();
                            const lowerSearch = normalizedSearch;
                            
                            if (lowerText.includes(lowerSearch)) {
                              const parts: JSX.Element[] = [];
                              let partKey = 0;
                              let lastIndex = 0;
                              let searchIndex = lowerText.indexOf(lowerSearch);
                              
                              while (searchIndex !== -1) {
                                // Add text before match
                                if (searchIndex > lastIndex) {
                                  parts.push(
                                    <ThemedText key={`text-${partKey++}`} style={{ fontSize: 16, lineHeight: 26, letterSpacing: -0.2, color: theme.text }}>
                                      {cleanText.substring(lastIndex, searchIndex)}
                                    </ThemedText>
                                  );
                                }
                                
                                // Add highlighted match
                                parts.push(
                                  <ThemedText 
                                    key={`highlight-${partKey++}`} 
                                    style={{ 
                                      fontSize: 16, 
                                      lineHeight: 26, 
                                      letterSpacing: -0.2, 
                                      backgroundColor: 'rgba(255, 215, 0, 0.4)',
                                      color: theme.text,
                                      fontWeight: '600',
                                    }}
                                  >
                                    {cleanText.substring(searchIndex, searchIndex + lowerSearch.length)}
                                  </ThemedText>
                                );
                                
                                lastIndex = searchIndex + lowerSearch.length;
                                searchIndex = lowerText.indexOf(lowerSearch, lastIndex);
                              }
                              
                              // Add remaining text
                              if (lastIndex < cleanText.length) {
                                parts.push(
                                  <ThemedText key={`text-${partKey++}`} style={{ fontSize: 16, lineHeight: 26, letterSpacing: -0.2, color: theme.text }}>
                                    {cleanText.substring(lastIndex)}
                                  </ThemedText>
                                );
                              }
                              
                              return parts;
                            }
                          }
                        }
                        
                        return cleanText || "No tafsir available for this verse";
                      })()}
                    </ThemedText>
                  </View>

                  {/* Bottom Decoration */}
                  <View style={{ 
                    marginTop: 24, 
                    paddingTop: 20, 
                    borderTopWidth: 1,
                    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}>
                    <View style={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: 3, 
                      backgroundColor: isDark ? 'rgba(52, 211, 153, 0.4)' : 'rgba(16, 185, 129, 0.4)' 
                    }} />
                    <ThemedText type="caption" style={{ fontSize: 11, opacity: 0.4, letterSpacing: 1 }}>
                      END OF TAFSIR
                    </ThemedText>
                    <View style={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: 3, 
                      backgroundColor: isDark ? 'rgba(52, 211, 153, 0.4)' : 'rgba(16, 185, 129, 0.4)' 
                    }} />
                  </View>
                </View>
              ) : (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                  <View style={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: 32, 
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16
                  }}>
                    <Feather name="book" size={28} color={theme.textSecondary} style={{ opacity: 0.3 }} />
                  </View>
                  <ThemedText type="body" style={{ opacity: 0.5, textAlign: 'center' }}>
                    No tafsir available
                  </ThemedText>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Tafsir Sources Modal */}
      <Modal
        visible={showTafsirSources}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
        onRequestClose={() => {
          console.log('📱 Tafsir modal closing');
          setShowTafsirSources(false);
        }}
        statusBarTranslucent={Platform.OS === 'android'}
      >
        <ThemedView style={styles.container}>
          <View style={[styles.settingsHeader, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.98)' : 'rgba(255, 255, 255, 0.98)', paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 10) + 10 : insets.top + 10, paddingHorizontal: 20, paddingBottom: 16 }]}>
            <Pressable onPress={() => setShowTafsirSources(false)} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]}>
              <Feather name="arrow-left" size={24} color={theme.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <ThemedText type="h3" style={{ fontWeight: '700', fontSize: 24 }}>Tafsir & Translations</ThemedText>
              <ThemedText type="caption" style={{ opacity: 0.5, marginTop: 2, fontSize: 13 }}>
                {availableTafsirs.filter(t => t.downloaded).length} downloaded
              </ThemedText>
            </View>
          </View>
          <ScrollView 
            contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}
            scrollEnabled={!isSwipingTafsir}
          >
            {/* Downloaded Translations */}
            {availableTafsirs.filter(t => t.downloaded && !isTafsir(t.id)).length > 0 && (
              <>
                <Pressable 
                  onPress={() => setExpandedTranslations(!expandedTranslations)}
                  style={({ pressed }) => [{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    marginBottom: expandedTranslations ? Spacing.md : Spacing.sm, 
                    marginTop: Spacing.xs,
                    opacity: pressed ? 0.7 : 1
                  }]}
                >
                  <View style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 16, 
                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10
                  }}>
                    <Feather name="globe" size={16} color={isDark ? '#60A5FA' : '#2563EB'} />
                  </View>
                  <ThemedText type="body" style={{ fontWeight: '700', fontSize: 15, letterSpacing: 0.5, opacity: 0.9, flex: 1 }}>
                    MY TRANSLATIONS
                  </ThemedText>
                  <View style={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 12,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Feather 
                      name={expandedTranslations ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color={theme.textSecondary} 
                    />
                  </View>
                </Pressable>
                {expandedTranslations && availableTafsirs.filter(t => t.downloaded && !isTafsir(t.id)).map((tafsir) => {
              const handleTafsirAction = async () => {
                if (tafsir.downloaded) {
                  setSelectedTafsirId(tafsir.id);
                  await AsyncStorage.setItem('@selectedTafsir', tafsir.id);
                  
                  // If there's a tafsir verse, reload tafsir data
                  if (tafsirVerse) {
                    try {
                      const key = tafsirVerse.verseKey;
                      let tafsirContent = null;
                      
                      if (tafsir.id === 'abridged') {
                        const enTafsir = await import("@/data/abridged-explanation-of-the-quran.json");
                        tafsirContent = { text: enTafsir[key]?.text || 'No tafsir available' };
                      } else if (tafsir.id === 'jalalayn') {
                        const arTafsir = await import("@/data/tafsir-jalalayn.json");
                        tafsirContent = { text: arTafsir[key]?.text || 'No tafsir available' };
                      } else if (tafsir.id === 'sahih-international') {
                        const sahihTafsir = await import("@/data/en-sahih-international-inline-footnotes.json");
                        tafsirContent = { text: sahihTafsir[key]?.t || 'No tafsir available' };
                      } else {
                        // Try to load from FileSystem
                        const tafsirPath = `${FileSystem.documentDirectory}tafsirs/${tafsir.id}.json`;
                        const fileInfo = await FileSystem.getInfoAsync(tafsirPath);
                        
                        if (fileInfo.exists) {
                          const fileContent = await FileSystem.readAsStringAsync(tafsirPath);
                          const response = JSON.parse(fileContent);
                          const tafsirData = response.data || response;
                          
                          if (tafsirData.surahs) {
                            const surah = tafsirData.surahs.find((s: any) => s.number === tafsirVerse.surah);
                            const ayah = surah?.ayahs?.find((a: any) => a.numberInSurah === tafsirVerse.ayah);
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
                        }
                      }
                      
                      // Set tafsir data first
                      setTafsirData(tafsirContent ? { en: tafsirContent, ar: tafsirContent } : null);
                      
                      // Then close sources modal after a brief delay
                      setTimeout(() => {
                        setShowTafsirSources(false);
                      }, 50);
                    } catch (e) {
                      console.error("Failed to reload tafsir:", e);
                      setShowTafsirSources(false);
                    }
                  } else {
                    // No verse to show tafsir for, just close the modal
                    setShowTafsirSources(false);
                  }
                } else if (tafsir.url) {
                  setDownloadingTafsir(tafsir.id);
                  try {
                    console.log('Starting download for:', tafsir.id);
                    
                    // Check available storage on Android
                    if (Platform.OS === 'android') {
                      try {
                        const freeDiskStorage = await FileSystem.getFreeDiskStorageAsync();
                        console.log('Free disk storage:', (freeDiskStorage / 1024 / 1024).toFixed(2), 'MB');
                      } catch (e) {
                        console.log('Could not check free storage:', e);
                      }
                    }
                    
                    const tafsirDir = `${FileSystem.documentDirectory}tafsirs/`;
                    const tafsirPath = `${tafsirDir}${tafsir.id}.json`;
                    console.log('Download path:', tafsirPath);
                    console.log('Download URL:', tafsir.url);
                    
                    // Create directory if it doesn't exist
                    const dirInfo = await FileSystem.getInfoAsync(tafsirDir);
                    console.log('Directory exists:', dirInfo.exists);
                    if (!dirInfo.exists) {
                      console.log('Creating directory...');
                      await FileSystem.makeDirectoryAsync(tafsirDir, { intermediates: true });
                      console.log('Directory created');
                    }
                    
                    // Download the tafsir file
                    console.log('Starting download from:', tafsir.url);
                    const downloadResult = await FileSystem.downloadAsync(tafsir.url, tafsirPath);
                    console.log('Download result:', downloadResult);
                    
                    if (downloadResult.status === 200) {
                      console.log('Download successful');
                      setAvailableTafsirs(prev => prev.map(t => t.id === tafsir.id ? { ...t, downloaded: true } : t));
                    } else {
                      throw new Error(`Download failed with status: ${downloadResult.status}`);
                    }
                  } catch (error) {
                    console.error('Download failed:', error);
                    console.error('Error type:', error.constructor.name);
                    console.error('Error message:', error.message);
                    if (error.message?.includes('SQLITE_FULL')) {
                      alert('Storage full. Please free up space on your device and try again.');
                    } else {
                      alert('Download failed. Please check your connection and storage space.');
                    }
                  } finally {
                    setDownloadingTafsir(null);
                  }
                }
              };
              
              const isActive = selectedTafsirId === tafsir.id;
              
              // Don't allow deleting bundled tafsirs
              const canDelete = !['jalalayn', 'abridged', 'sahih-international'].includes(tafsir.id);
              
              const renderRightActions = () => (
                <View style={{ 
                  justifyContent: 'center', 
                  alignItems: 'flex-end',
                  paddingRight: 10
                }}>
                  <Pressable
                    onPress={() => deleteTafsir(tafsir.id)}
                    style={({ pressed }) => [{
                      backgroundColor: '#EF4444',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: 80,
                      height: '90%',
                      borderRadius: 12,
                      opacity: pressed ? 0.8 : 1
                    }]}
                  >
                    <Feather name="trash-2" size={20} color="#FFF" />
                    <ThemedText style={{ color: '#FFF', fontSize: 12, fontWeight: '600', marginTop: 4 }}>Delete</ThemedText>
                  </Pressable>
                </View>
              );
              
              const itemContent = (
              <Pressable
                key={tafsir.id}
                onPress={handleTafsirAction}
                onLongPress={() => {
                  if (canDelete && Platform.OS === 'android') {
                    Alert.alert(
                      'Delete Tafsir',
                      `Delete ${tafsir.name}?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteTafsir(tafsir.id) }
                      ]
                    );
                  }
                }}
                disabled={downloadingTafsir === tafsir.id}
                style={({ pressed }) => [{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 16,
                  marginBottom: 10,
                  borderRadius: 16,
                  backgroundColor: isActive 
                    ? (isDark ? '#1a3d35' : '#e6f7f0')
                    : (isDark ? '#1f2937' : '#f3f4f6'),
                  borderWidth: isActive ? 2 : 0,
                  borderColor: isActive 
                    ? (isDark ? '#34D399' : '#059669')
                    : 'transparent',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  shadowColor: isActive ? (isDark ? '#34D399' : '#059669') : '#000',
                  shadowOffset: { width: 0, height: isActive ? 4 : 2 },
                  shadowOpacity: isActive ? 0.15 : 0.05,
                  shadowRadius: isActive ? 8 : 4,
                  elevation: isActive ? 4 : 2,
                }]}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                    <ThemedText type="body" style={{ fontWeight: '600', fontSize: 16, letterSpacing: -0.2, flexShrink: 1 }}>{tafsir.name}</ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    <View style={{ 
                      paddingHorizontal: 8, 
                      paddingVertical: 4, 
                      borderRadius: 8, 
                      backgroundColor: tafsir.language === 'ar' 
                        ? (isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(212, 175, 55, 0.15)') 
                        : (isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(5, 150, 105, 0.15)') 
                    }}>
                      <ThemedText type="caption" style={{ 
                        fontSize: 11, 
                        fontWeight: '700', 
                        color: tafsir.language === 'ar' ? (isDark ? '#D4AF37' : '#B8860B') : (isDark ? '#34D399' : '#059669'),
                        letterSpacing: 0.3
                      }}>
                        {getLanguageName(tafsir.language)}
                      </ThemedText>
                    </View>
                    {isTafsir(tafsir.id) ? (
                      <View style={{ 
                        paddingHorizontal: 6, 
                        paddingVertical: 3, 
                        borderRadius: 6, 
                        backgroundColor: isDark ? 'rgba(147, 51, 234, 0.2)' : 'rgba(147, 51, 234, 0.15)'
                      }}>
                        <ThemedText type="caption" style={{ 
                          fontSize: 10, 
                          fontWeight: '700', 
                          color: isDark ? '#C084FC' : '#9333EA',
                          letterSpacing: 0.5
                        }}>
                          TAFSIR
                        </ThemedText>
                      </View>
                    ) : (
                      <View style={{ 
                        paddingHorizontal: 6, 
                        paddingVertical: 3, 
                        borderRadius: 6, 
                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'
                      }}>
                        <ThemedText type="caption" style={{ 
                          fontSize: 10, 
                          fontWeight: '700', 
                          color: isDark ? '#60A5FA' : '#2563EB',
                          letterSpacing: 0.5
                        }}>
                          TRANSLATION
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  {isActive && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isDark ? '#34D399' : '#059669' }} />
                      <ThemedText type="caption" style={{ fontSize: 12, color: isDark ? '#34D399' : '#059669', fontWeight: '600' }}>
                        Currently Active
                      </ThemedText>
                    </View>
                  )}
                </View>
                {downloadingTafsir === tafsir.id ? (
                  <ActivityIndicator size="small" color={isDark ? '#34D399' : '#059669'} />
                ) : isActive ? (
                  <View style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 20, 
                    backgroundColor: isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Feather name="check" size={20} color={isDark ? '#34D399' : '#059669'} />
                  </View>
                ) : (
                  <View style={{ 
                    paddingHorizontal: 12, 
                    paddingVertical: 8, 
                    borderRadius: 8,
                    backgroundColor: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(26, 95, 79, 0.08)'
                  }}>
                    <ThemedText type="caption" style={{ fontSize: 12, color: isDark ? '#D4AF37' : '#1a5f4f', fontWeight: '600' }}>
                      Select
                    </ThemedText>
                  </View>
                )}
              </Pressable>
              );
              
              return canDelete ? (
                <Swipeable
                  key={tafsir.id}
                  renderRightActions={renderRightActions}
                  overshootRight={false}
                  onSwipeableOpen={(direction) => {
                    if (direction === 'right') {
                      deleteTafsir(tafsir.id);
                    }
                  }}
                >
                  {itemContent}
                </Swipeable>
              ) : itemContent;
            })}
              </>
            )}

            {/* Downloaded Tafsirs */}
            {availableTafsirs.filter(t => t.downloaded && isTafsir(t.id)).length > 0 && (
              <>
                <Pressable 
                  onPress={() => setExpandedTafsirs(!expandedTafsirs)}
                  style={({ pressed }) => [{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    marginBottom: expandedTafsirs ? Spacing.md : Spacing.sm, 
                    marginTop: Spacing.lg,
                    opacity: pressed ? 0.7 : 1
                  }]}
                >
                  <View style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 16, 
                    backgroundColor: isDark ? 'rgba(147, 51, 234, 0.15)' : 'rgba(147, 51, 234, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10
                  }}>
                    <Feather name="book-open" size={16} color={isDark ? '#C084FC' : '#9333EA'} />
                  </View>
                  <ThemedText type="body" style={{ fontWeight: '700', fontSize: 15, letterSpacing: 0.5, opacity: 0.9, flex: 1 }}>
                    MY TAFSIRS
                  </ThemedText>
                  <View style={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 12,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Feather 
                      name={expandedTafsirs ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color={theme.textSecondary} 
                    />
                  </View>
                </Pressable>
                {expandedTafsirs && availableTafsirs.filter(t => t.downloaded && isTafsir(t.id)).map((tafsir) => {
              const handleTafsirAction = async () => {
                if (tafsir.downloaded) {
                  setSelectedTafsirId(tafsir.id);
                  await AsyncStorage.setItem('@selectedTafsir', tafsir.id);
                  
                  // If there's a tafsir verse, reload tafsir data
                  if (tafsirVerse) {
                    try {
                      const key = tafsirVerse.verseKey;
                      let tafsirContent = null;
                      
                      if (tafsir.id === 'abridged') {
                        const enTafsir = await import("@/data/abridged-explanation-of-the-quran.json");
                        tafsirContent = { text: enTafsir[key]?.text || 'No tafsir available' };
                      } else if (tafsir.id === 'jalalayn') {
                        const arTafsir = await import("@/data/tafsir-jalalayn.json");
                        tafsirContent = { text: arTafsir[key]?.text || 'No tafsir available' };
                      } else if (tafsir.id === 'sahih-international') {
                        const sahihTafsir = await import("@/data/en-sahih-international-inline-footnotes.json");
                        tafsirContent = { text: sahihTafsir[key]?.t || 'No tafsir available' };
                      } else {
                        // Try to load from FileSystem
                        const tafsirPath = `${FileSystem.documentDirectory}tafsirs/${tafsir.id}.json`;
                        const fileInfo = await FileSystem.getInfoAsync(tafsirPath);
                        
                        if (fileInfo.exists) {
                          const fileContent = await FileSystem.readAsStringAsync(tafsirPath);
                          const response = JSON.parse(fileContent);
                          const tafsirData = response.data || response;
                          
                          if (tafsirData.surahs) {
                            const surah = tafsirData.surahs.find((s: any) => s.number === tafsirVerse.surah);
                            const ayah = surah?.ayahs?.find((a: any) => a.numberInSurah === tafsirVerse.ayah);
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
                        }
                      }
                      
                      // Set tafsir data first
                      setTafsirData(tafsirContent ? { en: tafsirContent, ar: tafsirContent } : null);
                      
                      // Then close sources modal after a brief delay
                      setTimeout(() => {
                        setShowTafsirSources(false);
                      }, 50);
                    } catch (e) {
                      console.error("Failed to reload tafsir:", e);
                      setShowTafsirSources(false);
                    }
                  } else {
                    // No verse to show tafsir for, just close the modal
                    setShowTafsirSources(false);
                  }
                }
              };
              
              const isActive = selectedTafsirId === tafsir.id;
              
              // Don't allow deleting bundled tafsirs
              const canDelete = !['jalalayn', 'abridged', 'sahih-international'].includes(tafsir.id);
              
              const renderRightActions = () => (
                <View style={{ 
                  justifyContent: 'center', 
                  alignItems: 'flex-end',
                  paddingRight: 10
                }}>
                  <Pressable
                    onPress={() => deleteTafsir(tafsir.id)}
                    style={({ pressed }) => [{
                      backgroundColor: '#EF4444',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: 80,
                      height: '90%',
                      borderRadius: 12,
                      opacity: pressed ? 0.8 : 1
                    }]}
                  >
                    <Feather name="trash-2" size={20} color="#FFF" />
                    <ThemedText style={{ color: '#FFF', fontSize: 12, fontWeight: '600', marginTop: 4 }}>Delete</ThemedText>
                  </Pressable>
                </View>
              );
              
              const itemContent = (
              <Pressable
                key={tafsir.id}
                onPress={handleTafsirAction}
                style={({ pressed }) => [{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 16,
                  marginBottom: 10,
                  borderRadius: 16,
                  backgroundColor: isActive 
                    ? (isDark ? '#1a3d35' : '#e6f7f0')
                    : (isDark ? '#1f2937' : '#f3f4f6'),
                  borderWidth: isActive ? 2 : 0,
                  borderColor: isActive 
                    ? (isDark ? '#34D399' : '#059669')
                    : 'transparent',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  shadowColor: isActive ? (isDark ? '#34D399' : '#059669') : '#000',
                  shadowOffset: { width: 0, height: isActive ? 4 : 2 },
                  shadowOpacity: isActive ? 0.15 : 0.05,
                  shadowRadius: isActive ? 8 : 4,
                  elevation: isActive ? 4 : 2,
                }]}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                    <ThemedText type="body" style={{ fontWeight: '600', fontSize: 16, letterSpacing: -0.2, flexShrink: 1 }}>{tafsir.name}</ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    <View style={{ 
                      paddingHorizontal: 8, 
                      paddingVertical: 4, 
                      borderRadius: 8, 
                      backgroundColor: tafsir.language === 'ar' 
                        ? (isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(212, 175, 55, 0.15)') 
                        : (isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(5, 150, 105, 0.15)') 
                    }}>
                      <ThemedText type="caption" style={{ 
                        fontSize: 11, 
                        fontWeight: '700', 
                        color: tafsir.language === 'ar' ? (isDark ? '#D4AF37' : '#B8860B') : (isDark ? '#34D399' : '#059669'),
                        letterSpacing: 0.3
                      }}>
                        {getLanguageName(tafsir.language)}
                      </ThemedText>
                    </View>
                    {isTafsir(tafsir.id) ? (
                      <View style={{ 
                        paddingHorizontal: 6, 
                        paddingVertical: 3, 
                        borderRadius: 6, 
                        backgroundColor: isDark ? 'rgba(147, 51, 234, 0.2)' : 'rgba(147, 51, 234, 0.15)'
                      }}>
                        <ThemedText type="caption" style={{ 
                          fontSize: 10, 
                          fontWeight: '700', 
                          color: isDark ? '#C084FC' : '#9333EA',
                          letterSpacing: 0.5
                        }}>
                          TAFSIR
                        </ThemedText>
                      </View>
                    ) : (
                      <View style={{ 
                        paddingHorizontal: 6, 
                        paddingVertical: 3, 
                        borderRadius: 6, 
                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'
                      }}>
                        <ThemedText type="caption" style={{ 
                          fontSize: 10, 
                          fontWeight: '700', 
                          color: isDark ? '#60A5FA' : '#2563EB',
                          letterSpacing: 0.5
                        }}>
                          TRANSLATION
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  {isActive && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isDark ? '#34D399' : '#059669' }} />
                      <ThemedText type="caption" style={{ fontSize: 12, color: isDark ? '#34D399' : '#059669', fontWeight: '600' }}>
                        Currently Active
                      </ThemedText>
                    </View>
                  )}
                </View>
                {isActive ? (
                  <View style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 16, 
                    backgroundColor: isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(5, 150, 105, 0.15)',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Feather name="check" size={18} color={isDark ? '#34D399' : '#059669'} />
                  </View>
                ) : null}
              </Pressable>
              );
              
              return canDelete ? (
                <Swipeable
                  key={tafsir.id}
                  renderRightActions={renderRightActions}
                  overshootRight={false}
                  onSwipeableOpen={(direction) => {
                    if (direction === 'right') {
                      deleteTafsir(tafsir.id);
                    }
                  }}
                >
                  {itemContent}
                </Swipeable>
              ) : itemContent;
            })}
              </>
            )}

            {/* Available to Download Section */}
            {availableTafsirs.filter(t => !t.downloaded).length > 0 && (
              <>
                <Pressable 
                  onPress={() => setExpandedAvailable(!expandedAvailable)}
                  style={({ pressed }) => [{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    marginBottom: expandedAvailable ? Spacing.md : Spacing.sm, 
                    marginTop: Spacing.lg,
                    opacity: pressed ? 0.7 : 1
                  }]}
                >
                  <View style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 16, 
                    backgroundColor: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(212, 175, 55, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10
                  }}>
                    <Feather name="download-cloud" size={16} color={isDark ? '#D4AF37' : '#B8860B'} />
                  </View>
                  <ThemedText type="body" style={{ fontWeight: '700', fontSize: 15, letterSpacing: 0.5, opacity: 0.9, flex: 1 }}>
                    AVAILABLE TO DOWNLOAD
                  </ThemedText>
                  <View style={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 12,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Feather 
                      name={expandedAvailable ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color={theme.textSecondary} 
                    />
                  </View>
                </Pressable>
                {expandedAvailable && (
                  <>
                    {/* Available Translations */}
                    {availableTafsirs.filter(t => !t.downloaded && !isTafsir(t.id)).length > 0 && (
                      <>
                        <Pressable 
                          onPress={() => setExpandedAvailableTranslations(!expandedAvailableTranslations)}
                          style={({ pressed }) => [{ 
                            flexDirection: 'row', 
                            alignItems: 'center', 
                            marginBottom: expandedAvailableTranslations ? 12 : 8, 
                            marginTop: 8,
                            opacity: pressed ? 0.7 : 1
                          }]}
                        >
                          <ThemedText type="body" style={{ fontWeight: '600', fontSize: 13, letterSpacing: 0.5, opacity: 0.6, flex: 1 }}>
                            Translations ({availableTafsirs.filter(t => !t.downloaded && !isTafsir(t.id)).length})
                          </ThemedText>
                          <Feather 
                            name={expandedAvailableTranslations ? "chevron-up" : "chevron-down"} 
                            size={14} 
                            color={theme.textSecondary} 
                            style={{ opacity: 0.6 }}
                          />
                        </Pressable>
                        {expandedAvailableTranslations && availableTafsirs.filter(t => !t.downloaded && !isTafsir(t.id)).map((tafsir) => {
              const handleTafsirAction = async () => {
                if (tafsir.url) {
                  setDownloadingTafsir(tafsir.id);
                  try {
                    console.log('Starting download for:', tafsir.id);
                    
                    // Check available storage on Android
                    if (Platform.OS === 'android') {
                      try {
                        const freeDiskStorage = await FileSystem.getFreeDiskStorageAsync();
                        console.log('Free disk storage:', (freeDiskStorage / 1024 / 1024).toFixed(2), 'MB');
                      } catch (e) {
                        console.log('Could not check free storage:', e);
                      }
                    }
                    
                    const tafsirDir = `${FileSystem.documentDirectory}tafsirs/`;
                    const tafsirPath = `${tafsirDir}${tafsir.id}.json`;
                    console.log('Download path:', tafsirPath);
                    console.log('Download URL:', tafsir.url);
                    
                    // Create directory if it doesn't exist
                    const dirInfo = await FileSystem.getInfoAsync(tafsirDir);
                    console.log('Directory exists:', dirInfo.exists);
                    if (!dirInfo.exists) {
                      console.log('Creating directory...');
                      await FileSystem.makeDirectoryAsync(tafsirDir, { intermediates: true });
                      console.log('Directory created');
                    }
                    
                    // Download the tafsir file
                    console.log('Starting download from:', tafsir.url);
                    const downloadResult = await FileSystem.downloadAsync(tafsir.url, tafsirPath);
                    console.log('Download result:', downloadResult);
                    
                    if (downloadResult.status === 200) {
                      console.log('Download successful');
                      setAvailableTafsirs(prev => prev.map(t => t.id === tafsir.id ? { ...t, downloaded: true } : t));
                    } else {
                      throw new Error(`Download failed with status: ${downloadResult.status}`);
                    }
                  } catch (error) {
                    console.error('Download failed:', error);
                    console.error('Error type:', error.constructor.name);
                    console.error('Error message:', error.message);
                    if (error.message?.includes('SQLITE_FULL')) {
                      alert('Storage full. Please free up space on your device and try again.');
                    } else {
                      alert('Download failed. Please check your connection and storage space.');
                    }
                  } finally {
                    setDownloadingTafsir(null);
                  }
                }
              };
              
              return (
              <Pressable
                key={tafsir.id}
                onPress={handleTafsirAction}
                disabled={downloadingTafsir === tafsir.id}
                style={({ pressed }) => [{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 16,
                  marginBottom: 10,
                  borderRadius: 16,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  opacity: downloadingTafsir === tafsir.id ? 0.6 : 1,
                }]}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                    <ThemedText type="body" style={{ fontWeight: '600', fontSize: 16, letterSpacing: -0.2, flexShrink: 1 }}>{tafsir.name}</ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    <View style={{ 
                      paddingHorizontal: 8, 
                      paddingVertical: 4, 
                      borderRadius: 8, 
                      backgroundColor: tafsir.language === 'ar' 
                        ? (isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(212, 175, 55, 0.15)') 
                        : (isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(5, 150, 105, 0.15)') 
                    }}>
                      <ThemedText type="caption" style={{ 
                        fontSize: 11, 
                        fontWeight: '700', 
                        color: tafsir.language === 'ar' ? (isDark ? '#D4AF37' : '#B8860B') : (isDark ? '#34D399' : '#059669'),
                        letterSpacing: 0.3
                      }}>
                        {getLanguageName(tafsir.language)}
                      </ThemedText>
                    </View>
                    {isTafsir(tafsir.id) ? (
                      <View style={{ 
                        paddingHorizontal: 6, 
                        paddingVertical: 3, 
                        borderRadius: 6, 
                        backgroundColor: isDark ? 'rgba(147, 51, 234, 0.2)' : 'rgba(147, 51, 234, 0.15)'
                      }}>
                        <ThemedText type="caption" style={{ 
                          fontSize: 10, 
                          fontWeight: '700', 
                          color: isDark ? '#C084FC' : '#9333EA',
                          letterSpacing: 0.5
                        }}>
                          TAFSIR
                        </ThemedText>
                      </View>
                    ) : (
                      <View style={{ 
                        paddingHorizontal: 6, 
                        paddingVertical: 3, 
                        borderRadius: 6, 
                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'
                      }}>
                        <ThemedText type="caption" style={{ 
                          fontSize: 10, 
                          fontWeight: '700', 
                          color: isDark ? '#60A5FA' : '#2563EB',
                          letterSpacing: 0.5
                        }}>
                          TRANSLATION
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText type="caption" style={{ fontSize: 12, opacity: 0.5, marginTop: 8 }}>
                    Tap to download
                  </ThemedText>
                </View>
                {downloadingTafsir === tafsir.id ? (
                  <ActivityIndicator size="small" color={isDark ? '#D4AF37' : '#1a5f4f'} />
                ) : (
                  <View style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 20, 
                    backgroundColor: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(26, 95, 79, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Feather name="download" size={18} color={isDark ? '#D4AF37' : '#1a5f4f'} />
                  </View>
                )}
              </Pressable>
              );
            })}
              </>
            )}
            
            {/* Available Tafsirs */}
            {availableTafsirs.filter(t => !t.downloaded && isTafsir(t.id)).length > 0 && (
              <>
                <Pressable 
                  onPress={() => setExpandedAvailableTafsirs(!expandedAvailableTafsirs)}
                  style={({ pressed }) => [{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    marginBottom: expandedAvailableTafsirs ? 12 : 8, 
                    marginTop: 20,
                    opacity: pressed ? 0.7 : 1
                  }]}
                >
                  <ThemedText type="body" style={{ fontWeight: '600', fontSize: 13, letterSpacing: 0.5, opacity: 0.6, flex: 1 }}>
                    Tafsirs ({availableTafsirs.filter(t => !t.downloaded && isTafsir(t.id)).length})
                  </ThemedText>
                  <Feather 
                    name={expandedAvailableTafsirs ? "chevron-up" : "chevron-down"} 
                    size={14} 
                    color={theme.textSecondary} 
                    style={{ opacity: 0.6 }}
                  />
                </Pressable>
                {expandedAvailableTafsirs && availableTafsirs.filter(t => !t.downloaded && isTafsir(t.id)).map((tafsir) => {
              const handleTafsirAction = async () => {
                if (tafsir.url) {
                  setDownloadingTafsir(tafsir.id);
                  try {
                    console.log('Starting download for:', tafsir.id);
                    
                    // Check available storage on Android
                    if (Platform.OS === 'android') {
                      try {
                        const freeDiskStorage = await FileSystem.getFreeDiskStorageAsync();
                        console.log('Free disk storage:', (freeDiskStorage / 1024 / 1024).toFixed(2), 'MB');
                      } catch (e) {
                        console.log('Could not check free storage:', e);
                      }
                    }
                    
                    const tafsirDir = `${FileSystem.documentDirectory}tafsirs/`;
                    const tafsirPath = `${tafsirDir}${tafsir.id}.json`;
                    console.log('Download path:', tafsirPath);
                    console.log('Download URL:', tafsir.url);
                    
                    // Create directory if it doesn't exist
                    const dirInfo = await FileSystem.getInfoAsync(tafsirDir);
                    console.log('Directory exists:', dirInfo.exists);
                    if (!dirInfo.exists) {
                      console.log('Creating directory...');
                      await FileSystem.makeDirectoryAsync(tafsirDir, { intermediates: true });
                      console.log('Directory created');
                    }
                    
                    // Download the tafsir file
                    console.log('Starting download from:', tafsir.url);
                    const downloadResult = await FileSystem.downloadAsync(tafsir.url, tafsirPath);
                    console.log('Download result:', downloadResult);
                    
                    if (downloadResult.status === 200) {
                      console.log('Download successful');
                      setAvailableTafsirs(prev => prev.map(t => t.id === tafsir.id ? { ...t, downloaded: true } : t));
                    } else {
                      throw new Error(`Download failed with status: ${downloadResult.status}`);
                    }
                  } catch (error) {
                    console.error('Download failed:', error);
                    console.error('Error type:', error.constructor.name);
                    console.error('Error message:', error.message);
                    if (error.message?.includes('SQLITE_FULL')) {
                      alert('Storage full. Please free up space on your device and try again.');
                    } else {
                      alert('Download failed. Please check your connection and storage space.');
                    }
                  } finally {
                    setDownloadingTafsir(null);
                  }
                }
              };
              
              return (
              <Pressable
                key={tafsir.id}
                onPress={handleTafsirAction}
                disabled={downloadingTafsir === tafsir.id}
                style={({ pressed }) => [{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 16,
                  marginBottom: 10,
                  borderRadius: 16,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  opacity: downloadingTafsir === tafsir.id ? 0.6 : 1,
                }]}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                    <ThemedText type="body" style={{ fontWeight: '600', fontSize: 16, letterSpacing: -0.2, flexShrink: 1 }}>{tafsir.name}</ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    <View style={{ 
                      paddingHorizontal: 8, 
                      paddingVertical: 4, 
                      borderRadius: 8, 
                      backgroundColor: tafsir.language === 'ar' 
                        ? (isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(212, 175, 55, 0.15)') 
                        : (isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(5, 150, 105, 0.15)') 
                    }}>
                      <ThemedText type="caption" style={{ 
                        fontSize: 11, 
                        fontWeight: '700', 
                        color: tafsir.language === 'ar' ? (isDark ? '#D4AF37' : '#B8860B') : (isDark ? '#34D399' : '#059669'),
                        letterSpacing: 0.3
                      }}>
                        {getLanguageName(tafsir.language)}
                      </ThemedText>
                    </View>
                    {isTafsir(tafsir.id) ? (
                      <View style={{ 
                        paddingHorizontal: 6, 
                        paddingVertical: 3, 
                        borderRadius: 6, 
                        backgroundColor: isDark ? 'rgba(147, 51, 234, 0.2)' : 'rgba(147, 51, 234, 0.15)'
                      }}>
                        <ThemedText type="caption" style={{ 
                          fontSize: 10, 
                          fontWeight: '700', 
                          color: isDark ? '#C084FC' : '#9333EA',
                          letterSpacing: 0.5
                        }}>
                          TAFSIR
                        </ThemedText>
                      </View>
                    ) : (
                      <View style={{ 
                        paddingHorizontal: 6, 
                        paddingVertical: 3, 
                        borderRadius: 6, 
                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'
                      }}>
                        <ThemedText type="caption" style={{ 
                          fontSize: 10, 
                          fontWeight: '700', 
                          color: isDark ? '#60A5FA' : '#2563EB',
                          letterSpacing: 0.5
                        }}>
                          TRANSLATION
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText type="caption" style={{ fontSize: 12, opacity: 0.5, marginTop: 8 }}>
                    Tap to download
                  </ThemedText>
                </View>
                {downloadingTafsir === tafsir.id ? (
                  <ActivityIndicator size="small" color={isDark ? '#D4AF37' : '#1a5f4f'} />
                ) : (
                  <View style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 20, 
                    backgroundColor: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(26, 95, 79, 0.1)',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Feather name="download" size={18} color={isDark ? '#D4AF37' : '#1a5f4f'} />
                  </View>
                )}
              </Pressable>
              );
            })}
              </>
            )}
                  </>
                )}
              </>
            )}
          </ScrollView>
        </ThemedView>
      </Modal>

      {/* Reciter Picker Modal */}
      {showReciterPicker && (
      <Modal
        visible={true}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowReciterPicker(false)}
      >
        <ThemedView style={styles.container}>
          <View style={[styles.settingsHeader, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.98)' : 'rgba(255, 255, 255, 0.98)' }]}>
            <Pressable onPress={() => setShowReciterPicker(false)} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]}>
              <Feather name="arrow-left" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3" style={{ fontWeight: '700', fontSize: 24, flex: 1 }}>Select Reciter</ThemedText>
          </View>
          <FlatList
            data={reciters}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  handleReciterChange(item.value);
                  setShowReciterPicker(false);
                }}
                style={({ pressed }) => [{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 16,
                  paddingHorizontal: Spacing.lg,
                  backgroundColor: pressed ? (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)') : 'transparent',
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                }]}
              >
                <ThemedText type="body" style={{ fontWeight: selectedReciter === item.value ? '600' : '400', fontSize: 16 }}>{item.label}</ThemedText>
                {selectedReciter === item.value && <Feather name="check" size={20} color={isDark ? '#34D399' : '#059669'} />}
              </Pressable>
            )}
            contentContainerStyle={{ paddingBottom: Spacing.xl }}
          />
        </ThemedView>
      </Modal>
      )}

      {/* Audio Settings Modal */}
      <Modal
        visible={showAudioSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAudioSettings(false)}
      >
        <ThemedView style={styles.settingsContainer}>
          <View style={[styles.settingsHeader, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.98)' : 'rgba(255, 255, 255, 0.98)' }]}>
            <ThemedText type="h3" style={{ fontWeight: '700', fontSize: 24 }}>Audio Settings</ThemedText>
            <Pressable onPress={() => setShowAudioSettings(false)} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>
          
          <ScrollView style={styles.settingsContent}>
            <View style={styles.settingsSection}>
              <ThemedText type="body" style={{ fontWeight: '600', marginBottom: Spacing.sm, opacity: 0.6, fontSize: 13 }}>PLAY UNTIL</ThemedText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[{ value: 'surah', label: 'Surah', icon: 'book' }, { value: 'page', label: 'Page', icon: 'file-text' }, { value: 'juz', label: 'Juz', icon: 'layers' }].map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={async () => {
                      const newPlayUntil = option.value as 'surah' | 'page' | 'juz';
                      const oldPlayUntil = playUntil;
                      setPlayUntil(newPlayUntil);
                      
                      // If audio is currently playing, restart with new playUntil setting
                      if (audioState?.current && audioState.isPlaying) {
                        const currentSurah = audioState.current.surah;
                        const currentAyah = audioState.current.ayah;
                        
                        await AudioService.stop();
                        
                        // Build new queue with the new playUntil mode
                        setTimeout(() => {
                          const surahData = quranData.data.surahs.find((s: any) => s.number === currentSurah);
                          if (!surahData) return;
                          
                          let verses: any[] = [];
                          if (newPlayUntil === 'surah') {
                            verses = surahData.ayahs.filter((a: any) => a.numberInSurah >= currentAyah).map((a: any) => ({ surah: currentSurah, ayah: a.numberInSurah }));
                          } else if (newPlayUntil === 'page') {
                            const currentPage = surahData.ayahs.find((a: any) => a.numberInSurah === currentAyah)?.page;
                            quranData.data.surahs.forEach((s: any) => {
                              s.ayahs.forEach((a: any) => {
                                if (a.page === currentPage && (s.number > currentSurah || (s.number === currentSurah && a.numberInSurah >= currentAyah))) {
                                  verses.push({ surah: s.number, ayah: a.numberInSurah });
                                }
                              });
                            });
                          } else {
                            const currentJuz = surahData.ayahs.find((a: any) => a.numberInSurah === currentAyah)?.juz;
                            quranData.data.surahs.forEach((s: any) => {
                              s.ayahs.forEach((a: any) => {
                                if (a.juz === currentJuz && (s.number > currentSurah || (s.number === currentSurah && a.numberInSurah >= currentAyah))) {
                                  verses.push({ surah: s.number, ayah: a.numberInSurah });
                                }
                              });
                            });
                          }
                          
                          if (verses.length > 0) {
                            AudioService.playQueue(verses);
                          }
                        }, 300);
                      }
                    }}
                    style={({ pressed }) => [{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: playUntil === option.value ? (isDark ? '#34D399' : '#059669') : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'),
                      opacity: pressed ? 0.7 : 1,
                    }]}
                  >
                    <Feather name={option.icon as any} size={20} color={playUntil === option.value ? '#FFF' : theme.textSecondary} style={{ marginBottom: 4 }} />
                    <ThemedText type="small" style={{ fontWeight: playUntil === option.value ? '600' : '400', color: playUntil === option.value ? '#FFF' : theme.text, fontSize: 12 }}>{option.label}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.settingsSection}>
              <ThemedText type="body" style={{ fontWeight: '600', marginBottom: Spacing.sm, opacity: 0.6, fontSize: 13 }}>RECITER</ThemedText>
              <Pressable
                onPress={() => {
                  console.log('Reciter button pressed');
                  setShowAudioSettings(false);
                  setTimeout(() => setShowReciterPicker(true), 100);
                }}
                style={({ pressed }) => [{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  opacity: pressed ? 0.7 : 1,
                }]}
              >
                <ThemedText type="body" style={{ fontSize: 15, pointerEvents: 'none' }}>{reciters.find(r => r.value === selectedReciter)?.label}</ThemedText>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>
          </ScrollView>
        </ThemedView>
      </Modal>

      {/* Media Player Bar - Premium Design with Minimize */}
      {audioState?.current && !isPlayerMinimized && (
        <Animated.View
          entering={SlideInDown.duration(400).springify()}
          exiting={SlideOutDown.duration(250)}
          style={[
            styles.mediaPlayer,
            {
              backgroundColor: isDark ? 'rgba(26, 95, 79, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              paddingBottom: Math.max(insets.bottom - 10, 10),
              borderTopWidth: 1,
              borderTopColor: isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0, 0, 0, 0.06)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 8,
            },
          ]}
        >
          {/* Drag Handle */}
          <Pressable 
            onPress={() => setIsPlayerMinimized(!isPlayerMinimized)}
            style={{ 
              paddingVertical: 8, 
              alignItems: 'center',
              width: '100%'
            }}
          >
            <View style={{ 
              width: 36, 
              height: 4, 
              backgroundColor: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(0, 0, 0, 0.15)',
              borderRadius: 2,
              marginBottom: 4,
            }} />
            <ThemedText type="caption" style={{ 
              fontSize: 10, 
              opacity: 0.4, 
              letterSpacing: 0.5
            }}>
              TAP TO MINIMIZE
            </ThemedText>
          </Pressable>
          
          {/* Expanded View - Full Controls */}
          <View style={styles.playerContent}>
              <View style={styles.playerInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: 3, 
                    backgroundColor: audioState.isPlaying ? (isDark ? '#34D399' : '#059669') : (isDark ? '#666' : '#999'),
                    marginRight: 8
                  }} />
                  <ThemedText type="caption" style={{ 
                    opacity: 0.6, 
                    fontSize: 11, 
                    letterSpacing: 0.5, 
                    fontWeight: '600'
                  }}>
                    {audioState.isPlaying ? 'NOW PLAYING' : 'PAUSED'}
                  </ThemedText>
                  <Pressable
                    onPress={() => setShowSpeedMenu(!showSpeedMenu)}
                    style={({ pressed }) => [{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 10,
                      backgroundColor: isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(5, 150, 105, 0.12)',
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                      marginLeft: 'auto',
                    }]}
                  >
                    <ThemedText type="caption" style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#D4AF37' : '#059669', letterSpacing: 0.3 }}>
                      {audioState.playbackRate}×
                    </ThemedText>
                  </Pressable>
                </View>
                <ThemedText type="body" style={{ fontWeight: '700', fontSize: 16, letterSpacing: -0.3, marginBottom: 4 }}>
                  {surahs.find(s => s.number === audioState.current.surah)?.nameEn || `Surah ${audioState.current.surah}`}
                </ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <ThemedText type="caption" style={{ opacity: 0.5, fontSize: 12 }}>
                    Verse {audioState.current.ayah}
                  </ThemedText>
                  {audioState.queue.length > 0 && (
                    <>
                      <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: theme.text, opacity: 0.3 }} />
                      <ThemedText type="caption" style={{ opacity: 0.5, fontSize: 12 }}>
                        {audioState.queue.length} remaining
                      </ThemedText>
                    </>
                  )}
                </View>
              </View>
              <View style={styles.playerControls}>
                <Pressable
                  onPress={() => AudioService.skipToPrevious()}
                  style={({ pressed }) => [{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(0, 0, 0, 0.06)',
                    transform: [{ scale: pressed ? 0.9 : 1 }],
                  }]}
                >
                  <Feather name="skip-back" size={18} color={isDark ? '#D4AF37' : theme.text} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (audioState.isPlaying) {
                      AudioService.pause();
                    } else {
                      AudioService.resume();
                    }
                  }}
                  style={({ pressed }) => [{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDark ? '#D4AF37' : '#059669',
                    transform: [{ scale: pressed ? 0.92 : 1 }],
                    marginHorizontal: 4,
                    shadowColor: isDark ? '#D4AF37' : '#059669',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }]}
                >
                  <Feather name={audioState.isPlaying ? 'pause' : 'play'} size={20} color="#FFF" />
                </Pressable>
                <Pressable
                  onPress={() => AudioService.skipToNext()}
                  style={({ pressed }) => [{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(0, 0, 0, 0.06)',
                    transform: [{ scale: pressed ? 0.9 : 1 }],
                  }]}
                >
                  <Feather name="skip-forward" size={18} color={isDark ? '#D4AF37' : theme.text} />
                </Pressable>
                <Pressable
                  onPress={() => setShowAudioSettings(true)}
                  style={({ pressed }) => [{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(0, 0, 0, 0.06)',
                    transform: [{ scale: pressed ? 0.9 : 1 }],
                    marginLeft: 4,
                  }]}
                >
                  <Feather name="sliders" size={16} color={isDark ? '#D4AF37' : theme.text} />
                </Pressable>
                <Pressable
                  onPress={() => AudioService.stop()}
                  style={({ pressed }) => [{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    opacity: pressed ? 0.6 : 1,
                    marginLeft: 8,
                  }]}
                >
                  <Feather name="x" size={16} color={theme.text} />
                </Pressable>
              </View>
            </View>
          {showSpeedMenu && (
            <View style={[styles.speedMenu, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
                <Pressable
                  key={speed}
                  onPress={() => {
                    AudioService.setPlaybackRate(speed);
                    setShowSpeedMenu(false);
                  }}
                  style={({ pressed }) => [{
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    opacity: pressed ? 0.6 : 1,
                    backgroundColor: audioState.playbackRate === speed ? (isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(5, 150, 105, 0.1)') : 'transparent',
                    borderRadius: 8,
                  }]}
                >
                  <ThemedText type="small" style={{ fontWeight: audioState.playbackRate === speed ? '600' : '400', color: audioState.playbackRate === speed ? (isDark ? '#34D399' : '#059669') : theme.text }}>
                    {speed}x
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          )}
        </Animated.View>
      )}

      {/* Minimized Floating Player - Draggable */}
      {audioState?.current && isPlayerMinimized && (
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[{ 
            position: 'absolute',
            bottom: insets.bottom + 65,
            left: 0,
            flexDirection: 'row',
            gap: 8,
            zIndex: 100,
          }, playerAnimatedStyle]}>
            <Pressable
              onPress={() => setIsPlayerMinimized(false)}
              style={({ pressed }) => [{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: isDark ? 'rgba(26, 95, 79, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 6,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                transform: [{ scale: pressed ? 0.95 : 1 }],
              }]}
            >
              <Feather name={audioState.isPlaying ? 'pause' : 'play'} size={14} color={isDark ? '#D4AF37' : '#059669'} />
              <ThemedText type="caption" style={{ fontSize: 12, fontWeight: '600' }}>
                {surahs.find(s => s.number === audioState.current.surah)?.nameEn?.split(' ')[0] || audioState.current.surah}:{audioState.current.ayah}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                if (audioState.isPlaying) {
                  AudioService.pause();
                } else {
                  AudioService.resume();
                }
              }}
              style={({ pressed }) => [{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark ? '#D4AF37' : '#059669',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
                transform: [{ scale: pressed ? 0.9 : 1 }],
              }]}
            >
              <Feather name={audioState.isPlaying ? 'pause' : 'play'} size={18} color="#FFF" />
            </Pressable>
          </Animated.View>
        </GestureDetector>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  pillButtonContainer: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -64 }],
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
    paddingBottom: Spacing.lg,
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
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
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
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  verseMenu: {
    width: 180,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
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
  mediaPlayer: {
    position: 'absolute',
    bottom: 75,
    left: Spacing.md,
    right: Spacing.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 100,
    overflow: 'hidden',
  },
  playerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
  },
  playerInfo: {
    flex: 1,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speedMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
  },
  juzHizbBadge: {
    position: 'absolute',
    left: 20,
    zIndex: 1,
  },
  surahBadge: {
    position: 'absolute',
    right: 20,
    alignItems: 'flex-end',
    zIndex: 1,
  },
  pageFooter: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
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
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  noteModal: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    textAlignVertical: 'top',
    marginBottom: 16,
    minHeight: 120,
  },
});
