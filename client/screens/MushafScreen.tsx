import React, { useState, useCallback } from "react";
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
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useHeaderHeight } from "@react-navigation/elements";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { Feather } from "@expo/vector-icons";
import Animated, { SlideInUp, SlideOutDown, SlideInDown, useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { mushafImages } from "@/data/mushaf-images";
import quranData from "@/data/quran-uthmani.json";
import { surahs } from "@/data/quran";
import { surahPages } from "@/data/surah-pages";
import AudioService from "@/services/AudioService";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState<VerseRegion | null>(null);
  const [tafsirData, setTafsirData] = useState<any>(null);
  const [showArabicTafsir, setShowArabicTafsir] = useState(false);
  const [allCoords, setAllCoords] = useState<any>(null);
  const [showSurahList, setShowSurahList] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [recentPages, setRecentPages] = useState<number[]>([]);
  const [juzSortAsc, setJuzSortAsc] = useState(true);
  const [navigationMode, setNavigationMode] = useState<'surah' | 'juz'>('surah');
  const [audioState, setAudioState] = useState<any>(null);
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
  const [availableTafsirs, setAvailableTafsirs] = useState([
    { id: 'jalalayn', name: 'Tafsir Jalalayn', language: 'ar', downloaded: true, url: null },
    { id: 'abridged', name: 'Abridged Explanation', language: 'en', downloaded: true, url: null },
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
  const flatListRef = React.useRef<FlatList>(null);

  React.useEffect(() => {
    import('../../assets/coordinates/all-pages.json').then(data => setAllCoords(data.default || data));
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
    if (!highlights[verseKey]) {
      addHighlight(verseKey, 'rgba(212, 175, 55, 0.15)');
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
      } else {
        const stored = await AsyncStorage.getItem(`@tafsir_${savedTafsirId}`);
        if (stored) {
          const response = JSON.parse(stored);
          const tafsirData = response.data || response;
          
          if (tafsirData.surahs) {
            const surah = tafsirData.surahs.find((s: any) => s.number === selectedVerse.surah);
            const ayah = surah?.ayahs?.find((a: any) => a.numberInSurah === selectedVerse.ayah);
            tafsirContent = ayah ? { text: ayah.text || 'No tafsir available' } : { text: 'No tafsir available for this verse' };
          } else {
            const entry = tafsirData[key];
            tafsirContent = entry ? { text: entry.text || entry.tafsir || entry.content || 'No tafsir available' } : { text: 'No tafsir available for this verse' };
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

    return (
      <View style={[styles.pageContainer, { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }]}>
        <Image 
          source={mushafImages[pageNum]} 
          style={[styles.mushafImage, { width: SCREEN_WIDTH, height: imageHeight }]} 
          resizeMode="contain"
          fadeDuration={0}
          progressiveRenderingEnabled={true}
        />
        <View style={styles.juzHizbBadge}>
          <ThemedText type="caption" style={{ fontSize: 10, opacity: 0.4 }}>JUZ {pageJuz}</ThemedText>
          <ThemedText type="caption" style={{ fontSize: 14, opacity: 0.4, marginTop: 2 }}>HIZB {pageHizb}</ThemedText>
        </View>
        <View style={styles.surahBadge}>
          <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 16, opacity: 0.9 }}>{pageSurah?.nameAr}</ThemedText>
          <ThemedText type="caption" style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{pageSurah?.nameEn}</ThemedText>
        </View>
        <View style={styles.pageFooter}>
          <ThemedText type="caption" style={{ fontSize: 14, opacity: 0.4 }}>{pageNum}</ThemedText>
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
                  backgroundColor: isAudioPlaying 
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
  }, [allCoords, selectedVerse, handleVersePress, audioState, SCREEN_WIDTH, SCREEN_HEIGHT]);

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
        <View style={[styles.surahListHeader, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)' }]}>
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
          <FlatList
            data={[...Object.keys(highlights), ...Object.keys(notes)].filter((v, i, a) => a.indexOf(v) === i).map(key => [key, highlights[key]])}
            keyExtractor={([key]) => key}
            renderItem={({ item: [verseKey, color] }) => {
              const [surah, ayah] = verseKey.split(':');
              const surahData = quranData.data.surahs.find((s: any) => s.number === parseInt(surah));
              const surahInfo = surahs.find((s: any) => s.number === parseInt(surah));
              const ayahData = surahData?.ayahs.find((a: any) => a.numberInSurah === parseInt(ayah));
              const verseText = ayahData?.text || '';
              const hasNote = notes[verseKey];
              const preview = verseText.length > 60 ? verseText.substring(0, 60) + '...' : verseText;
              const timestamp = noteTimestamps[verseKey] || highlightTimestamps[verseKey];
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
                        removeHighlight(verseKey);
                        if (notes[verseKey]) {
                          deleteNote(verseKey);
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
                  renderRightActions={renderRightActions}
                  onSwipeableOpen={(direction) => {
                    if (direction === 'right') {
                      removeHighlight(verseKey);
                      if (notes[verseKey]) {
                        deleteNote(verseKey);
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
                    style={({ pressed }) => [
                      styles.surahItem,
                      { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF', transform: [{ scale: pressed ? 0.98 : 1 }] },
                    ]}
                  >
                    <View style={{ padding: Spacing.md + 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <View style={[styles.surahNumber, { backgroundColor: color, marginRight: 12 }]}>
                          <Feather name="edit-3" size={18} color={isDark ? '#1a5f4f' : '#1a5f4f'} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <ThemedText type="body" style={{ fontWeight: '600', fontSize: 15 }}>{surahInfo?.nameEn}</ThemedText>
                              {hasNote && <Feather name="file-text" size={12} color={isDark ? '#D4AF37' : '#1a5f4f'} />}
                            </View>
                            {timeAgo && <ThemedText type="caption" style={{ fontSize: 10, opacity: 0.5 }}>{timeAgo}</ThemedText>}
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <ThemedText type="caption" style={{ fontSize: 13, opacity: 0.6 }}>Verse {ayah}</ThemedText>
                            <ThemedText type="caption" style={{ fontSize: 11, opacity: 0.4 }}>•</ThemedText>
                            <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', fontSize: 14, opacity: 0.7 }}>{surahInfo?.nameAr}</ThemedText>
                          </View>
                          <ThemedText type="arabic" style={{ fontFamily: 'AlMushafQuran', opacity: 0.7, lineHeight: 22, fontSize: 16, textAlign: 'right' }} numberOfLines={2}>{preview}</ThemedText>
                          {hasNote && (
                            <View style={{ marginTop: 8, padding: 10, borderRadius: 10, backgroundColor: isDark ? 'rgba(212, 175, 55, 0.12)' : 'rgba(26, 95, 79, 0.08)', borderLeftWidth: 3, borderLeftColor: isDark ? '#D4AF37' : '#1a5f4f' }}>
                              <ThemedText type="caption" style={{ fontSize: 12, fontStyle: 'italic', opacity: 0.85, lineHeight: 17 }} numberOfLines={3}>{hasNote}</ThemedText>
                            </View>
                          )}
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

  if (showBookmarks) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.surahListHeader, { 
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
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
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
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
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={[styles.pillButtonContainer, animatedButtonStyle]}>
        <View style={[styles.pillButton, { 
          backgroundColor: isDark ? 'rgba(26, 95, 79, 0.15)' : 'rgba(26, 95, 79, 0.08)',
          borderColor: isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(212, 175, 55, 0.15)',
        }]}>
          <Pressable
            onPress={() => {
              showButtons();
              setShowBookmarks(true);
            }}
            onPressIn={showButtons}
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
              showButtons();
              setShowNotes(true);
            }}
            onPressIn={showButtons}
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
              showButtons();
              setShowSurahList(true);
            }}
            onPressIn={showButtons}
            style={({ pressed }) => [
              styles.pillButtonHalf,
              { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
          >
            <Feather name="book-open" size={18} color={isDark ? '#D4AF37' : '#1a5f4f'} />
          </Pressable>
        </View>
      </Animated.View>
      <FlatList
        ref={flatListRef}
        data={Array.from({ length: 604 }, (_, i) => 604 - i)}
        renderItem={renderPage}
        keyExtractor={(item) => String(item)}
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
                left: Math.min(selectedVerse.touchX || 0, SCREEN_WIDTH - 180),
                top: Math.min(selectedVerse.touchY || 0, SCREEN_HEIGHT - 200),
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
              <ThemedText type="body" style={{ marginLeft: 12, fontWeight: '500' }}>Tafsir</ThemedText>
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
        </Modal>
      )}

      {/* Tafsir Modal */}
      <Modal
        visible={tafsirData !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTafsirData(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setTafsirData(null)} />
          <Animated.View
            entering={SlideInUp.duration(200)}
            exiting={SlideOutDown.duration(150)}
            style={[
              styles.modalContainer,
              {
                backgroundColor: isDark
                  ? Colors.dark.backgroundSecondary
                  : Colors.light.backgroundDefault,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                Surah {selectedVerse?.surah}, Verse {selectedVerse?.ayah}
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Pressable 
                  onPress={() => {
                    setTafsirData(null);
                    setTimeout(() => setShowTafsirSources(true), 100);
                  }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                >
                  <Feather name="more-vertical" size={20} color={theme.textSecondary} />
                </Pressable>
                <Pressable onPress={() => setTafsirData(null)}>
                  <Feather name="x" size={20} color={theme.textSecondary} />
                </Pressable>
              </View>
            </View>
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={true}>
              {(tafsirData?.en?.text || tafsirData?.ar?.text) && (
                <>
                  <ThemedText type="body" style={{ fontWeight: "600", marginBottom: 12 }}>
                    Tafsir {showArabicTafsir ? "(Jalalayn)" : ""}
                  </ThemedText>
                  <ThemedText
                    type={showArabicTafsir ? "arabic" : "small"}
                    secondary={!showArabicTafsir}
                    style={[
                      styles.tafsirText,
                      showArabicTafsir && { textAlign: "right", fontFamily: "AlMushafQuran" },
                    ]}
                  >
                    {showArabicTafsir
                      ? tafsirData?.ar?.text?.replace(/<[^>]*>/g, "").trim() ||
                        "No Arabic tafsir available"
                      : tafsirData?.en?.text?.replace(/<[^>]*>/g, "").trim() ||
                        "No English tafsir available"}
                  </ThemedText>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Tafsir Sources Modal */}
      <Modal
        visible={showTafsirSources}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowTafsirSources(false)}
      >
        <ThemedView style={styles.container}>
          <View style={[styles.settingsHeader, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.98)' : 'rgba(255, 255, 255, 0.98)' }]}>
            <Pressable onPress={() => setShowTafsirSources(false)} style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]}>
              <Feather name="arrow-left" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3" style={{ fontWeight: '700', fontSize: 24, flex: 1 }}>Tafsir & Translations</ThemedText>
          </View>
          <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
            <ThemedText type="body" style={{ opacity: 0.6, marginBottom: Spacing.md, fontSize: 13 }}>Download tafsir and translations to read offline</ThemedText>
            {availableTafsirs.map((tafsir) => {
              const handleTafsirAction = async () => {
                if (tafsir.downloaded) {
                  setSelectedTafsirId(tafsir.id);
                  await AsyncStorage.setItem('@selectedTafsir', tafsir.id);
                } else if (tafsir.url) {
                  setDownloadingTafsir(tafsir.id);
                  try {
                    const response = await fetch(tafsir.url);
                    const contentType = response.headers.get('content-type');
                    
                    if (!response.ok) {
                      throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const text = await response.text();
                    
                    if (contentType?.includes('application/json')) {
                      const data = JSON.parse(text);
                      await AsyncStorage.setItem(`@tafsir_${tafsir.id}`, JSON.stringify(data));
                      setAvailableTafsirs(prev => prev.map(t => t.id === tafsir.id ? { ...t, downloaded: true } : t));
                    } else {
                      console.error('Response is not JSON:', text.substring(0, 200));
                      throw new Error('Invalid response format - expected JSON');
                    }
                  } catch (error) {
                    console.error('Download failed:', error);
                    alert('Download failed. Please check your connection and try again.');
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
                  padding: Spacing.md,
                  marginBottom: Spacing.sm,
                  borderRadius: 12,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                  opacity: pressed ? 0.7 : 1,
                }]}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ThemedText type="body" style={{ fontWeight: '600', fontSize: 15 }}>{tafsir.name}</ThemedText>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: tafsir.language === 'ar' ? (isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(212, 175, 55, 0.1)') : (isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(5, 150, 105, 0.1)') }}>
                      <ThemedText type="caption" style={{ fontSize: 10, fontWeight: '600', color: tafsir.language === 'ar' ? (isDark ? '#D4AF37' : '#B8860B') : (isDark ? '#34D399' : '#059669') }}>{tafsir.language.toUpperCase()}</ThemedText>
                    </View>
                  </View>
                  {tafsir.downloaded && (
                    <ThemedText type="caption" style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>Downloaded</ThemedText>
                  )}
                </View>
                {downloadingTafsir === tafsir.id ? (
                  <ActivityIndicator size="small" color={isDark ? '#D4AF37' : '#1a5f4f'} />
                ) : tafsir.downloaded ? (
                  selectedTafsirId === tafsir.id ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Feather name="check" size={18} color={isDark ? '#34D399' : '#059669'} />
                      <ThemedText type="caption" style={{ fontSize: 12, color: isDark ? '#34D399' : '#059669', fontWeight: '600' }}>Active</ThemedText>
                    </View>
                  ) : (
                    <ThemedText type="caption" style={{ fontSize: 12, color: isDark ? '#D4AF37' : '#1a5f4f' }}>Select</ThemedText>
                  )
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="download" size={18} color={isDark ? '#D4AF37' : '#1a5f4f'} />
                    <ThemedText type="caption" style={{ fontSize: 12, color: isDark ? '#D4AF37' : '#1a5f4f' }}>Download</ThemedText>
                  </View>
                )}
              </Pressable>
              );
            })}
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
                    onPress={() => setPlayUntil(option.value as any)}
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

      {/* Media Player Bar */}
      {audioState?.current && (
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
          style={[
            styles.mediaPlayer,
            {
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            },
          ]}
        >
          <View style={styles.playerContent}>
            <View style={styles.playerInfo}>
              <ThemedText type="body" style={{ fontWeight: '600', fontSize: 14 }}>
                {surahs.find(s => s.number === audioState.current.surah)?.nameEn || `Surah ${audioState.current.surah}`}, Verse {audioState.current.ayah}
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <ThemedText type="caption" style={{ opacity: 0.6, fontSize: 12 }}>
                  {audioState.queue.length > 0 ? `${audioState.queue.length} remaining` : audioState.isPlaying ? 'Playing' : 'Paused'}
                </ThemedText>
                <Pressable
                  onPress={() => setShowSpeedMenu(!showSpeedMenu)}
                  style={({ pressed }) => [{
                    marginLeft: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 8,
                    backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(5, 150, 105, 0.1)',
                    opacity: pressed ? 0.6 : 1,
                  }]}
                >
                  <ThemedText type="caption" style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#34D399' : '#059669' }}>
                    {audioState.playbackRate}x
                  </ThemedText>
                </Pressable>
              </View>
            </View>
            <View style={styles.playerControls}>
              <Pressable
                onPress={() => AudioService.skipToPrevious()}
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
                <Feather name="skip-back" size={16} color={theme.text} />
              </Pressable>
              <Pressable
                onPress={() => {
                  if (audioState.isPlaying) {
                    AudioService.pause();
                  } else if (audioState.current) {
                    AudioService.play(audioState.current.surah, audioState.current.ayah, 'single');
                  }
                }}
                style={({ pressed }) => [{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? '#34D399' : '#059669',
                  opacity: pressed ? 0.8 : 1,
                  marginHorizontal: 8,
                }]}
              >
                <Feather name={audioState.isPlaying ? 'pause' : 'play'} size={20} color="#FFF" />
              </Pressable>
              <Pressable
                onPress={() => AudioService.skipToNext()}
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
                <Feather name="skip-forward" size={16} color={theme.text} />
              </Pressable>
              <Pressable
                onPress={() => setShowAudioSettings(true)}
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
                <Feather name="more-vertical" size={16} color={theme.text} />
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageContainer: {
    backgroundColor: "#F5F5F5",
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
    top: 50,
    left: '50%',
    transform: [{ translateX: -84 }],
    zIndex: 10,
  },
  pillButton: {
    flexDirection: 'row',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
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
    paddingTop: 50,
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
    top: 50,
    left: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1,
  },
  surahBadge: {
    position: 'absolute',
    top: 50,
    right: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
