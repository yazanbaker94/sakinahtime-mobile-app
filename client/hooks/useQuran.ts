import { useQuery } from "@tanstack/react-query";
import quranData from "@/data/quran-uthmani.json";
import englishData from "@/data/quran-english.json";

export interface QuranVerse {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
}

export interface SurahData {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  ayahs: QuranVerse[];
}

interface QuranDataStructure {
  code: number;
  status: string;
  data: {
    surahs: SurahData[];
  };
}

const typedQuranData = quranData as QuranDataStructure;
const typedEnglishData = englishData as QuranDataStructure;

// Create indexed maps for O(1) lookup
const surahMap = new Map<number, SurahData>();
const englishSurahMap = new Map<number, SurahData>();

typedQuranData.data.surahs.forEach(surah => surahMap.set(surah.number, surah));
typedEnglishData.data.surahs.forEach(surah => englishSurahMap.set(surah.number, surah));

function getSurah(surahNumber: number): SurahData | null {
  return surahMap.get(surahNumber) || null;
}

function getEnglishSurah(surahNumber: number): SurahData | null {
  return englishSurahMap.get(surahNumber) || null;
}

export function useSurah(surahNumber: number) {
  return useQuery({
    queryKey: ["surah", surahNumber],
    queryFn: () => {
      const surah = getSurah(surahNumber);
      if (!surah) {
        throw new Error(`Surah ${surahNumber} not found`);
      }
      return { arabic: surah };
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export interface CombinedVerse {
  number: number;
  numberInSurah: number;
  textAr: string;
  translation: string;
  juz: number;
  page: number;
}

export function combineVerses(arabic: SurahData): CombinedVerse[] {
  const englishSurah = getEnglishSurah(arabic.number);
  return arabic.ayahs.map((arabicVerse, index) => ({
    number: arabicVerse.number,
    numberInSurah: arabicVerse.numberInSurah,
    textAr: arabicVerse.text,
    translation: englishSurah?.ayahs[index]?.text || "",
    juz: arabicVerse.juz,
    page: arabicVerse.page,
  }));
}

export function getAllSurahs(): SurahData[] {
  return typedQuranData.data.surahs;
}
