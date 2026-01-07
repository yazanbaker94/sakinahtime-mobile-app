import quranData from './quran-uthmani.json';
import { surahs } from './quran';

export interface HizbQuarter {
  hizbQuarter: number;
  hizb: number;
  quarter: number;
  startVerse: number;
  startSurah: number;
  startVerseInSurah: number;
  surahName: string;
}

function getSurahFromVerseNumber(verseNum: number): { surahNum: number; name: string } {
  let total = 0;
  for (const surah of surahs) {
    if (verseNum <= total + surah.versesCount) {
      return { surahNum: surah.number, name: surah.nameEn };
    }
    total += surah.versesCount;
  }
  return { surahNum: 114, name: 'An-Nas' };
}

// Cache the result to avoid recomputation
let cachedQuarters: HizbQuarter[] | null = null;

export function getHizbQuarters(): HizbQuarter[] {
  if (cachedQuarters) return cachedQuarters;

  const quarters: HizbQuarter[] = [];
  let lastQuarter = 0;

  // Extract all verses from all surahs
  const allVerses: Array<{ number: number; numberInSurah: number; hizbQuarter: number }> = [];
  for (const surah of quranData.data.surahs) {
    for (const ayah of surah.ayahs) {
      allVerses.push({
        number: ayah.number,
        numberInSurah: ayah.numberInSurah,
        hizbQuarter: ayah.hizbQuarter,
      });
    }
  }

  allVerses.forEach((verse) => {
    const hq = verse.hizbQuarter;
    if (hq !== lastQuarter) {
      const surahInfo = getSurahFromVerseNumber(verse.number);
      quarters.push({
        hizbQuarter: hq,
        hizb: Math.ceil(hq / 4),
        quarter: ((hq - 1) % 4) + 1,
        startVerse: verse.number,
        startSurah: surahInfo.surahNum,
        startVerseInSurah: verse.numberInSurah,
        surahName: surahInfo.name,
      });
      lastQuarter = hq;
    }
  });

  cachedQuarters = quarters;
  return quarters;
}
