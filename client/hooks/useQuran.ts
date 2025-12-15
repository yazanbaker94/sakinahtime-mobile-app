import { useQuery } from "@tanstack/react-query";

export interface QuranVerse {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  hizbQuarter: number;
}

export interface QuranEdition {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
  format: string;
  type: string;
}

export interface SurahData {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: QuranVerse[];
}

interface QuranApiResponse {
  code: number;
  status: string;
  data: SurahData | SurahData[];
}

async function fetchSurah(surahNumber: number): Promise<{ arabic: SurahData; english: SurahData }> {
  try {
    const [arabicRes, englishRes] = await Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`),
      fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/en.asad`),
    ]);

    if (!arabicRes.ok || !englishRes.ok) {
      throw new Error(`Failed to fetch surah data: Arabic ${arabicRes.status}, English ${englishRes.status}`);
    }

    const arabicText = await arabicRes.text();
    const englishText = await englishRes.text();

    if (!arabicText || !englishText) {
      throw new Error("Empty response from API");
    }

    let arabicData: QuranApiResponse;
    let englishData: QuranApiResponse;

    try {
      arabicData = JSON.parse(arabicText);
    } catch (e) {
      throw new Error(`Failed to parse Arabic response: ${arabicText.substring(0, 100)}`);
    }

    try {
      englishData = JSON.parse(englishText);
    } catch (e) {
      throw new Error(`Failed to parse English response: ${englishText.substring(0, 100)}`);
    }

    if (arabicData.code !== 200 || englishData.code !== 200) {
      throw new Error(`Invalid API response code: Arabic ${arabicData.code}, English ${englishData.code}`);
    }

    const arabic = arabicData.data as SurahData;
    const english = englishData.data as SurahData;

    if (!arabic?.ayahs || !english?.ayahs) {
      throw new Error("Invalid surah data structure - missing ayahs");
    }

    return { arabic, english };
  } catch (error) {
    console.error("Error fetching surah:", error);
    throw error;
  }
}

export function useSurah(surahNumber: number) {
  return useQuery({
    queryKey: ["surah", surahNumber],
    queryFn: () => fetchSurah(surahNumber),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    retry: 2,
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

export function combineVerses(arabic: SurahData, english: SurahData): CombinedVerse[] {
  return arabic.ayahs.map((arabicVerse, index) => ({
    number: arabicVerse.number,
    numberInSurah: arabicVerse.numberInSurah,
    textAr: arabicVerse.text,
    translation: english.ayahs[index]?.text || "",
    juz: arabicVerse.juz,
    page: arabicVerse.page,
  }));
}
