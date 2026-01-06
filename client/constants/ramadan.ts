/**
 * Ramadan Mode Constants
 */

import { IbaadahItem, LaylatalQadrDua } from '../types/ramadan';

// Storage Keys (year-specific)
export const RAMADAN_STORAGE_KEYS = {
  SETTINGS: (year: number) => `@ramadan_${year}_settings`,
  QURAN_SCHEDULE: (year: number) => `@ramadan_${year}_quran_schedule`,
  TARAWEEH_ENTRIES: (year: number) => `@ramadan_${year}_taraweeh`,
  CHARITY_ENTRIES: (year: number) => `@ramadan_${year}_charity`,
  CHARITY_GOAL: (year: number) => `@ramadan_${year}_charity_goal`,
  IBAADAH_CHECKLIST: (year: number) => `@ramadan_${year}_ibaadah`,
  SUHOOR_IFTAR_SETTINGS: '@ramadan_suhoor_iftar_settings',
  QURAN_SCHEDULE_SETTINGS: '@ramadan_quran_schedule_settings',
};

// Quran Constants
export const QURAN_TOTAL_PAGES = 604;
export const RAMADAN_DAYS = 30;
export const JUZ_COUNT = 30;
export const PAGES_PER_DAY = Math.ceil(QURAN_TOTAL_PAGES / RAMADAN_DAYS);

// Laylatul Qadr odd nights
export const LAYLATUL_QADR_NIGHTS = [21, 23, 25, 27, 29];

// Notification Channels
export const RAMADAN_NOTIFICATION_CHANNELS = {
  SUHOOR: 'ramadan-suhoor',
  IFTAR: 'ramadan-iftar',
  QURAN: 'ramadan-quran',
  TARAWEEH: 'ramadan-taraweeh',
  LAYLATUL_QADR: 'ramadan-laylatul-qadr',
};

// Default Settings
export const DEFAULT_SUHOOR_IFTAR_SETTINGS = {
  suhoorReminderMinutes: 30,
  iftarReminderMinutes: 15,
  suhoorNotificationEnabled: true,
  iftarNotificationEnabled: true,
};

export const DEFAULT_QURAN_SCHEDULE_SETTINGS = {
  reminderEnabled: true,
  reminderTime: '21:00',
  notifyOnMissed: true,
};

// Zakat Constants
export const ZAKAT_RATE = 0.025; // 2.5%
export const NISAB_GOLD_GRAMS = 87.48; // ~87.48 grams of gold
export const NISAB_SILVER_GRAMS = 612.36; // ~612.36 grams of silver

// Default Ibaadah Checklist Items
export const DEFAULT_IBAADAH_ITEMS: IbaadahItem[] = [
  { id: 'taraweeh', name: 'Pray Taraweeh', nameAr: 'صلاة التراويح', completed: false },
  { id: 'quran', name: 'Read Quran', nameAr: 'قراءة القرآن', completed: false },
  { id: 'dua', name: 'Make Special Dua', nameAr: 'الدعاء', completed: false },
  { id: 'charity', name: 'Give Charity', nameAr: 'الصدقة', completed: false },
  { id: 'tahajjud', name: 'Pray Tahajjud', nameAr: 'صلاة التهجد', completed: false },
  { id: 'dhikr', name: 'Dhikr & Istighfar', nameAr: 'الذكر والاستغفار', completed: false },
];

// Laylatul Qadr Special Duas
export const LAYLATUL_QADR_DUAS: LaylatalQadrDua[] = [
  {
    id: 'main-dua',
    arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
    transliteration: "Allahumma innaka 'afuwwun tuhibbul 'afwa fa'fu 'anni",
    translation: 'O Allah, You are Forgiving and love forgiveness, so forgive me.',
    reference: 'Tirmidhi 3513',
  },
  {
    id: 'forgiveness',
    arabic: 'رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَإِسْرَافَنَا فِي أَمْرِنَا',
    transliteration: 'Rabbana-ghfir lana dhunubana wa israfana fi amrina',
    translation: 'Our Lord, forgive us our sins and our excesses in our affairs.',
    reference: 'Quran 3:147',
  },
  {
    id: 'guidance',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar',
    translation: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',
    reference: 'Quran 2:201',
  },
];

// Juz to Surah mapping (simplified - first surah of each Juz)
export const JUZ_SURAH_NAMES: Record<number, string[]> = {
  1: ['Al-Fatihah', 'Al-Baqarah'],
  2: ['Al-Baqarah'],
  3: ['Al-Baqarah', 'Ali Imran'],
  4: ['Ali Imran', 'An-Nisa'],
  5: ['An-Nisa'],
  6: ['An-Nisa', 'Al-Maidah'],
  7: ['Al-Maidah', 'Al-Anam'],
  8: ['Al-Anam', 'Al-Araf'],
  9: ['Al-Araf', 'Al-Anfal'],
  10: ['Al-Anfal', 'At-Tawbah'],
  11: ['At-Tawbah', 'Yunus', 'Hud'],
  12: ['Hud', 'Yusuf'],
  13: ['Yusuf', 'Ar-Rad', 'Ibrahim', 'Al-Hijr'],
  14: ['Al-Hijr', 'An-Nahl'],
  15: ['Al-Isra', 'Al-Kahf'],
  16: ['Al-Kahf', 'Maryam', 'Ta-Ha'],
  17: ['Al-Anbiya', 'Al-Hajj'],
  18: ['Al-Muminun', 'An-Nur', 'Al-Furqan'],
  19: ['Al-Furqan', 'Ash-Shuara', 'An-Naml'],
  20: ['An-Naml', 'Al-Qasas', 'Al-Ankabut'],
  21: ['Al-Ankabut', 'Ar-Rum', 'Luqman', 'As-Sajdah', 'Al-Ahzab'],
  22: ['Al-Ahzab', 'Saba', 'Fatir', 'Ya-Sin'],
  23: ['Ya-Sin', 'As-Saffat', 'Sad', 'Az-Zumar'],
  24: ['Az-Zumar', 'Ghafir', 'Fussilat'],
  25: ['Fussilat', 'Ash-Shura', 'Az-Zukhruf', 'Ad-Dukhan', 'Al-Jathiyah'],
  26: ['Al-Jathiyah', 'Al-Ahqaf', 'Muhammad', 'Al-Fath', 'Al-Hujurat', 'Qaf', 'Adh-Dhariyat'],
  27: ['Adh-Dhariyat', 'At-Tur', 'An-Najm', 'Al-Qamar', 'Ar-Rahman', 'Al-Waqiah', 'Al-Hadid'],
  28: ['Al-Mujadila', 'Al-Hashr', 'Al-Mumtahanah', 'As-Saff', 'Al-Jumuah', 'Al-Munafiqun', 'At-Taghabun', 'At-Talaq', 'At-Tahrim'],
  29: ['Al-Mulk', 'Al-Qalam', 'Al-Haqqah', 'Al-Maarij', 'Nuh', 'Al-Jinn', 'Al-Muzzammil', 'Al-Muddaththir', 'Al-Qiyamah', 'Al-Insan', 'Al-Mursalat'],
  30: ['An-Naba', 'An-Naziat', 'Abasa', 'At-Takwir', 'Al-Infitar', 'Al-Mutaffifin', 'Al-Inshiqaq', 'Al-Buruj', 'At-Tariq', 'Al-Ala', 'Al-Ghashiyah', 'Al-Fajr', 'Al-Balad', 'Ash-Shams', 'Al-Layl', 'Ad-Duhaa', 'Ash-Sharh', 'At-Tin', 'Al-Alaq', 'Al-Qadr', 'Al-Bayyinah', 'Az-Zalzalah', 'Al-Adiyat', 'Al-Qariah', 'At-Takathur', 'Al-Asr', 'Al-Humazah', 'Al-Fil', 'Quraysh', 'Al-Maun', 'Al-Kawthar', 'Al-Kafirun', 'An-Nasr', 'Al-Masad', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas'],
};

// Notification Messages
export const RAMADAN_NOTIFICATIONS = {
  suhoorReminder: {
    title: '🌙 Suhoor Reminder',
    body: (minutes: number) => `Suhoor ends in ${minutes} minutes - Time to eat!`,
  },
  suhoorEnd: {
    title: '🌅 Suhoor Has Ended',
    body: (day: number) => `May your fast be accepted. Ramadan Day ${day}`,
  },
  iftarReminder: {
    title: '🌙 Iftar Soon',
    body: (minutes: number) => `Iftar in ${minutes} minutes - Prepare to break your fast`,
  },
  iftarTime: {
    title: '🌙 Iftar Time!',
    body: (day: number) => `Bismillah - Break your fast. Ramadan Day ${day}`,
  },
  quranReminder: {
    title: '📖 Daily Quran Reading',
    body: (juz: number, start: number, end: number) => `Today: Juz ${juz} (Pages ${start}-${end})`,
  },
  laylatalQadr: {
    title: '✨ Blessed Night',
    body: (night: number) => `Tonight is the ${night}th night - Seek Laylatul Qadr!`,
  },
};
