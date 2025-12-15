import { useQuery } from "@tanstack/react-query";
import quranData from "@/data/quran-uthmani.json";

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

function getSurah(surahNumber: number): SurahData | null {
  const surah = typedQuranData.data.surahs.find((s) => s.number === surahNumber);
  return surah || null;
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
  return arabic.ayahs.map((arabicVerse) => ({
    number: arabicVerse.number,
    numberInSurah: arabicVerse.numberInSurah,
    textAr: arabicVerse.text,
    translation: "",
    juz: arabicVerse.juz,
    page: arabicVerse.page,
  }));
}

export function getAllSurahs(): SurahData[] {
  return typedQuranData.data.surahs;
}
