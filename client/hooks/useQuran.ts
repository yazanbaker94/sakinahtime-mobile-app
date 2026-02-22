import { useQuery } from "@tanstack/react-query";
import QuranDatabase from "@/services/QuranDatabase";

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

export interface CombinedVerse {
  number: number;
  numberInSurah: number;
  textAr: string;
  translation: string;
  juz: number;
  page: number;
}

export function useSurah(surahNumber: number) {
  return useQuery({
    queryKey: ["surah", surahNumber],
    queryFn: async () => {
      await QuranDatabase.init();
      const surah = await QuranDatabase.getSurah(surahNumber);
      if (!surah) {
        throw new Error(`Surah ${surahNumber} not found`);
      }
      return { arabic: surah };
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export async function combineVerses(arabic: SurahData): Promise<CombinedVerse[]> {
  await QuranDatabase.init();
  const englishSurah = await QuranDatabase.getEnglishSurah(arabic.number);
  return arabic.ayahs.map((arabicVerse, index) => ({
    number: arabicVerse.number,
    numberInSurah: arabicVerse.numberInSurah,
    textAr: arabicVerse.text,
    translation: englishSurah?.ayahs[index]?.text || "",
    juz: arabicVerse.juz,
    page: arabicVerse.page,
  }));
}

export async function getAllSurahs(): Promise<SurahData[]> {
  await QuranDatabase.init();
  return QuranDatabase.getAllSurahs();
}
