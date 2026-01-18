/**
 * WordMeaningService - Provides Arabic word meanings from غريب القرآن (Gharib Al-Quran)
 * and word-by-word translations in multiple languages
 * Data sources: 
 * - https://quran.mu.edu.sa/words.html (Arabic meanings)
 * - english-wbw-translation.json (English word-by-word - bundled)
 * - Other languages downloaded on-demand from CDN
 */

import quranWordsData from '../../assets/words/quran_words.json';
import englishWbwData from '../../assets/words/english-wbw-translation.json';
import englishTransliterationData from '../../assets/words/english-wbw-transliteration.json';
import wordFrequencies from '../../assets/words/word-frequencies.json';
import quranData from '../data/quran-uthmani.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

interface WordMeaning {
  surah_number: number;
  surah_name: string;
  verse: number;
  word: string;
  meaning: string;
}

interface WordMeaningResult {
  arabicWord?: string;      // The Arabic word from the verse
  englishMeaning?: string;  // Word-by-word translation (in selected language)
  transliteration?: string; // Transliteration of the Arabic word
  arabicMeaning?: string;   // Arabic meaning from غريب القرآن (if available)
  gharibWord?: string;      // The غريب القرآن phrase (may be multi-word)
  frequency?: number;       // How many times this word appears in the Quran
  verseKey: string;
}

// Language file mapping (matches CDN filenames)
const WBW_LANGUAGES: Record<string, string> = {
  'english': 'english-wbw-translation.json',
  'urdu': 'urud-wbw.json',
  'indonesian': 'indonesian-word-by-word-translation.json',
  'bangla': 'bangali-word-by-word-translation.json',
  'turkish': 'turkish-wbw-translation.json',
  'tamil': 'tamil-wbw-translation.json',
  'french': 'french-wbw-translation.json',
  'persian': 'persian-wbw-translation.json',
};

const STORAGE_KEY = '@wbw_language';
const WBW_DIR = `${FileSystem.documentDirectory}wbw/`;

// Cache for loaded WBW data
let cachedWbwData: Record<string, string> | null = null;
let cachedLanguage: string | null = null;

// Normalize Arabic text for matching (remove diacritics, normalize letters)
const normalizeArabic = (text: string): string => {
  return text
    // Remove all diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[\u0617-\u061A]/g, '')
    // Remove tatweel (kashida)
    .replace(/\u0640/g, '')
    // Remove Quranic symbols and markers
    .replace(/[\u0600-\u0605\u0610-\u061A\u06D6-\u06ED]/g, '')
    // Normalize alef variations (أ إ آ ٱ -> ا)
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    // Normalize teh marbuta to heh (ة -> ه)
    .replace(/\u0629/g, '\u0647')
    // Normalize yeh variations (ى ي ی ې -> ي)
    .replace(/[\u0649\u064A\u06CC\u06D0]/g, '\u064A')
    // Normalize waw with hamza (ؤ -> و)
    .replace(/\u0624/g, '\u0648')
    // Normalize yeh with hamza (ئ -> ي)
    .replace(/\u0626/g, '\u064A')
    // Remove zero-width characters
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

// Build lookup index by verse key for fast access (Arabic meanings)
const wordsByVerse: Map<string, WordMeaning[]> = new Map();

// Initialize the lookup index
const initializeIndex = () => {
  if (wordsByVerse.size > 0) return; // Already initialized
  
  const words = (quranWordsData as any).words as WordMeaning[];
  words.forEach(word => {
    const verseKey = `${word.surah_number}:${word.verse}`;
    if (!wordsByVerse.has(verseKey)) {
      wordsByVerse.set(verseKey, []);
    }
    wordsByVerse.get(verseKey)!.push(word);
  });
};

/**
 * Get the verse text from quran-uthmani.json
 */
const getVerseText = (surah: number, ayah: number): string | null => {
  const surahData = (quranData as any).data.surahs.find((s: any) => s.number === surah);
  if (!surahData) return null;
  const ayahData = surahData.ayahs.find((a: any) => a.numberInSurah === ayah);
  return ayahData?.text || null;
};

/**
 * Split verse text into words (handling Arabic text properly)
 * Filters out Quranic stop signs and markers that aren't actual words
 */
const splitVerseIntoWords = (verseText: string): string[] => {
  // Quranic stop signs and markers to filter out
  const stopSigns = [
    'ۛ', 'ۖ', 'ۗ', 'ۘ', 'ۙ', 'ۚ', 'ۜ',  // Small signs
    '۞', '۩',  // Sajda and Rub markers
    'ج', 'ز', 'ص', 'صل', 'صلى', 'قلى', 'م', 'لا', 'ق', 'سكتة', // Stop sign letters
    '٭', '؀', '؁', '؂', '؃',  // Other markers
  ];
  
  // Split by whitespace and filter
  return verseText
    .split(/\s+/)
    .filter(w => {
      if (w.length === 0) return false;
      
      // Filter out pure stop signs
      if (stopSigns.includes(w)) return false;
      
      // Filter out single-character Quranic markers (Unicode range)
      if (w.length === 1) {
        const code = w.charCodeAt(0);
        // Quranic annotation signs: U+06D6 to U+06ED
        if (code >= 0x06D6 && code <= 0x06ED) return false;
        // Arabic extended marks
        if (code >= 0x0610 && code <= 0x061A) return false;
      }
      
      return true;
    });
};

/**
 * Get the currently selected WBW language
 */
const getSelectedLanguage = async (): Promise<string> => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    return saved || 'english';
  } catch (e) {
    return 'english';
  }
};

/**
 * Load WBW data for a specific language
 */
const loadWbwData = async (language: string): Promise<Record<string, string>> => {
  // Return cached data if same language
  if (cachedLanguage === language && cachedWbwData) {
    return cachedWbwData;
  }

  // English is bundled
  if (language === 'english') {
    cachedWbwData = englishWbwData as Record<string, string>;
    cachedLanguage = 'english';
    return cachedWbwData;
  }

  // Arabic-gharib is a special case - it uses the غريب القرآن data
  // which has a different format, so we return null here and handle it separately
  if (language === 'arabic-gharib') {
    cachedWbwData = {}; // Empty - we'll use findArabicMeaning instead
    cachedLanguage = 'arabic-gharib';
    return cachedWbwData;
  }

  // Try to load downloaded language file
  const filename = WBW_LANGUAGES[language];
  if (!filename) {
    // Fallback to English if unknown language
    cachedWbwData = englishWbwData as Record<string, string>;
    cachedLanguage = 'english';
    return cachedWbwData;
  }

  const filePath = `${WBW_DIR}${filename}`;
  
  try {
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(filePath);
      cachedWbwData = JSON.parse(content);
      cachedLanguage = language;
      return cachedWbwData!;
    }
  } catch (e) {
    console.error(`Failed to load WBW data for ${language}:`, e);
  }

  // Fallback to English if file not found or error
  cachedWbwData = englishWbwData as Record<string, string>;
  cachedLanguage = 'english';
  return cachedWbwData;
};

/**
 * Get word-by-word translation for a specific word (in selected language)
 */
const getWbwTranslation = async (surah: number, ayah: number, wordIndex: number): Promise<string | null> => {
  const language = await getSelectedLanguage();
  const wbwData = await loadWbwData(language);
  
  // Word index in the JSON is 1-based
  const key = `${surah}:${ayah}:${wordIndex + 1}`;
  return wbwData[key] || null;
};

/**
 * Clear cached WBW data (call when language changes)
 */
export const clearWbwCache = () => {
  cachedWbwData = null;
  cachedLanguage = null;
};

/**
 * Get the currently selected WBW language name for display
 */
export const getSelectedWbwLanguageName = async (): Promise<string> => {
  const languageNames: Record<string, string> = {
    'english': 'English',
    'urdu': 'Urdu',
    'indonesian': 'Indonesian',
    'bangla': 'Bangla',
    'turkish': 'Turkish',
    'tamil': 'Tamil',
    'french': 'French',
    'persian': 'Persian',
  };
  
  const language = await getSelectedLanguage();
  return languageNames[language] || 'English';
};

/**
 * Get English word-by-word translation for a specific word (legacy sync function)
 */
const getEnglishTranslation = (surah: number, ayah: number, wordIndex: number): string | null => {
  // Word index in the JSON is 1-based
  const key = `${surah}:${ayah}:${wordIndex + 1}`;
  return (englishWbwData as any)[key] || null;
};

/**
 * Get transliteration for a specific word
 */
const getTransliteration = (surah: number, ayah: number, wordIndex: number): string | null => {
  // Word index in the JSON is 1-based
  const key = `${surah}:${ayah}:${wordIndex + 1}`;
  return (englishTransliterationData as any)[key] || null;
};

/**
 * Find Arabic meaning (غريب القرآن) for a specific word by its index
 */
const findArabicMeaning = (
  surah: number, 
  ayah: number, 
  wordIndex: number,
  verseWords: string[]
): { word: string; meaning: string } | null => {
  initializeIndex();
  
  const verseKey = `${surah}:${ayah}`;
  const meanings = wordsByVerse.get(verseKey);
  
  if (!meanings || meanings.length === 0) return null;
  if (wordIndex < 0 || wordIndex >= verseWords.length) return null;
  
  const tappedWord = verseWords[wordIndex];
  const normalizedTappedWord = normalizeArabic(tappedWord);
  
  // Check each meaning entry to see if it contains the tapped word
  for (const meaning of meanings) {
    const normalizedMeaningWord = normalizeArabic(meaning.word);
    const meaningWords = meaning.word.split(/\s+/);
    
    // Check if the tapped word matches any word in the phrase
    for (const mWord of meaningWords) {
      const normalizedMWord = normalizeArabic(mWord);
      if (normalizedTappedWord === normalizedMWord || 
          normalizedMWord.includes(normalizedTappedWord) ||
          normalizedTappedWord.includes(normalizedMWord)) {
        return { word: meaning.word, meaning: meaning.meaning };
      }
    }
    
    // Also check if the tapped word is part of a multi-word phrase
    if (meaningWords.length > 1) {
      for (let i = 0; i < meaningWords.length; i++) {
        const startIdx = wordIndex - i;
        if (startIdx >= 0 && startIdx + meaningWords.length <= verseWords.length) {
          const phraseFromVerse = verseWords.slice(startIdx, startIdx + meaningWords.length).join(' ');
          const normalizedPhrase = normalizeArabic(phraseFromVerse);
          if (normalizedPhrase === normalizedMeaningWord || 
              normalizedMeaningWord.includes(normalizedPhrase) ||
              normalizedPhrase.includes(normalizedMeaningWord)) {
            return { word: meaning.word, meaning: meaning.meaning };
          }
        }
      }
    }
  }
  
  return null;
};

/**
 * Get all word meanings for a specific verse (for backward compatibility)
 */
export const getWordMeaningsForVerse = (surah: number, ayah: number): { word: string; meaning: string; verseKey: string }[] => {
  initializeIndex();
  
  const verseKey = `${surah}:${ayah}`;
  const meanings = wordsByVerse.get(verseKey) || [];
  
  return meanings.map(m => ({
    word: m.word,
    meaning: m.meaning,
    verseKey
  }));
};

/**
 * Get word frequency from pre-computed data
 */
const getWordFrequency = (arabicWord: string): number => {
  const normalized = normalizeArabic(arabicWord);
  return (wordFrequencies as Record<string, number>)[normalized] || 0;
};

/**
 * Find word meaning for a specific word in a verse by its index
 * Returns translation in selected language (always) and Arabic meaning (if in غريب القرآن)
 */
export const findWordMeaningByIndex = async (
  surah: number, 
  ayah: number, 
  wordIndex: number // 0-based index
): Promise<WordMeaningResult | null> => {
  const verseKey = `${surah}:${ayah}`;
  
  // Get the verse text and split into words
  const verseText = getVerseText(surah, ayah);
  if (!verseText) return null;
  
  const words = splitVerseIntoWords(verseText);
  if (wordIndex < 0 || wordIndex >= words.length) return null;
  
  const arabicWord = words[wordIndex];
  const selectedLang = await getSelectedLanguage();
  const transliteration = getTransliteration(surah, ayah, wordIndex);
  const arabicMeaningData = findArabicMeaning(surah, ayah, wordIndex, words);
  const frequency = getWordFrequency(arabicWord);
  
  // If arabic-gharib is selected, use Arabic meaning as the main translation
  if (selectedLang === 'arabic-gharib') {
    // Return Arabic meaning as the englishMeaning field (it's the main translation display)
    if (arabicMeaningData || transliteration || frequency > 0) {
      return {
        arabicWord,
        englishMeaning: arabicMeaningData?.meaning || undefined,
        transliteration: transliteration || undefined,
        arabicMeaning: arabicMeaningData?.meaning,
        gharibWord: arabicMeaningData?.word,
        frequency: frequency > 0 ? frequency : undefined,
        verseKey
      };
    }
    return null;
  }
  
  // For other languages, get the WBW translation
  const wbwMeaning = await getWbwTranslation(surah, ayah, wordIndex);
  
  // Return result if we have at least translation, transliteration, or frequency
  if (wbwMeaning || transliteration || arabicMeaningData || frequency > 0) {
    return {
      arabicWord,
      englishMeaning: wbwMeaning || undefined,
      transliteration: transliteration || undefined,
      arabicMeaning: arabicMeaningData?.meaning,
      gharibWord: arabicMeaningData?.word,
      frequency: frequency > 0 ? frequency : undefined,
      verseKey
    };
  }
  
  return null;
};

/**
 * Check if a verse has any word meanings available (Arabic غريب القرآن)
 */
export const hasWordMeanings = (surah: number, ayah: number): boolean => {
  initializeIndex();
  const verseKey = `${surah}:${ayah}`;
  return wordsByVerse.has(verseKey);
};

/**
 * Get total count of Arabic word meanings available
 */
export const getTotalWordMeanings = (): number => {
  return (quranWordsData as any).total_words || 0;
};

export default {
  getWordMeaningsForVerse,
  findWordMeaningByIndex,
  hasWordMeanings,
  getTotalWordMeanings,
  clearWbwCache,
  getSelectedWbwLanguageName
};
