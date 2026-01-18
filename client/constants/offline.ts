/**
 * Offline Mode Constants
 */

import { OfflineSettings, ReciterInfo } from '../types/offline';

// Default offline settings
export const DEFAULT_OFFLINE_SETTINGS: OfflineSettings = {
  storageLimit: 2 * 1024 * 1024 * 1024, // 2GB
  wifiOnlyDownloads: false,
  autoDeleteOldCache: true,
  maxConcurrentDownloads: 3,
};

// Storage keys
export const STORAGE_KEYS = {
  OFFLINE_SETTINGS: '@offline_settings',
  DOWNLOAD_QUEUE: '@download_queue',
  PRAYER_CACHE_META: '@prayer_cache_meta',
  NETWORK_STATUS: '@network_status',
  DOWNLOADED_SURAHS: '@downloaded_surahs',
  TAFSIR_META: '@tafsir_meta',
};

// Cache durations
export const CACHE_DURATIONS = {
  PRAYER_TIMES_DAYS: 30,
  PRAYER_TIMES_STALE_HOURS: 24,
  TAFSIR_NEVER_EXPIRES: true,
};

// Storage limits
export const STORAGE_LIMITS = {
  MIN_LIMIT: 100 * 1024 * 1024,      // 100MB minimum
  MAX_LIMIT: 10 * 1024 * 1024 * 1024, // 10GB maximum
  DEFAULT_LIMIT: 2 * 1024 * 1024 * 1024, // 2GB default
  WARNING_THRESHOLD: 0.8,             // 80% usage warning
  CRITICAL_THRESHOLD: 0.95,           // 95% usage critical
};

// Download settings
export const DOWNLOAD_SETTINGS = {
  MAX_CONCURRENT: 3,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 2000,
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks
  TIMEOUT_MS: 30000,
};

// Available reciters (everyayah.com directory names - synced with MushafScreen player)
export const RECITERS: ReciterInfo[] = [
  { id: 'Alafasy_128kbps', nameEn: 'Mishary Alafasy', nameAr: 'مشاري راشد العفاسي', style: '128kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Abdul_Basit_Murattal_192kbps', nameEn: 'Abdul Basit', nameAr: 'عبد الباسط عبد الصمد', style: '192kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Abdullah_Basfar_192kbps', nameEn: 'Abdullah Basfar', nameAr: 'عبد الله بصفر', style: '192kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Abdurrahmaan_As-Sudais_192kbps', nameEn: 'Abdurrahman As-Sudais', nameAr: 'عبد الرحمن السديس', style: '192kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Abu_Bakr_Ash-Shaatree_128kbps', nameEn: 'Abu Bakr Ash-Shatri', nameAr: 'أبو بكر الشاطري', style: '128kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Ahmed_Neana_128kbps', nameEn: 'Ahmed Neana', nameAr: 'أحمد نعينع', style: '128kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net', nameEn: 'Ahmed Al-Ajamy', nameAr: 'أحمد العجمي', style: '128kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Akram_AlAlaqimy_128kbps', nameEn: 'Akram AlAlaqimy', nameAr: 'أكرم العلاقمي', style: '128kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Ali_Jaber_64kbps', nameEn: 'Ali Jaber', nameAr: 'علي جابر', style: '64kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Ayman_Sowaid_64kbps', nameEn: 'Ayman Sowaid', nameAr: 'أيمن سويد', style: '64kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Fares_Abbad_64kbps', nameEn: 'Fares Abbad', nameAr: 'فارس عباد', style: '64kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Ghamadi_40kbps', nameEn: 'Saad Al-Ghamadi', nameAr: 'سعد الغامدي', style: '40kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Hani_Rifai_192kbps', nameEn: 'Hani Rifai', nameAr: 'هاني الرفاعي', style: '192kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Hudhaify_128kbps', nameEn: 'Ali Hudhaify', nameAr: 'علي الحذيفي', style: '128kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Husary_128kbps', nameEn: 'Mahmoud Al-Hussary', nameAr: 'محمود خليل الحصري', style: '128kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Ibrahim_Akhdar_32kbps', nameEn: 'Ibrahim Akhdar', nameAr: 'إبراهيم الأخضر', style: '32kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Khaalid_Abdullaah_al-Qahtaanee_192kbps', nameEn: 'Khalid Al-Qahtani', nameAr: 'خالد القحطاني', style: '192kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'MaherAlMuaiqly128kbps', nameEn: 'Maher Al-Muaiqly', nameAr: 'ماهر المعيقلي', style: '128kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Minshawy_Murattal_128kbps', nameEn: 'Mohamed Al-Minshawi', nameAr: 'محمد صديق المنشاوي', style: '128kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Mohammad_al_Tablaway_128kbps', nameEn: 'Mohammad Al-Tablaway', nameAr: 'محمد الطبلاوي', style: '128kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Muhammad_Ayyoub_128kbps', nameEn: 'Muhammad Ayyub', nameAr: 'محمد أيوب', style: '128kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Muhammad_Jibreel_128kbps', nameEn: 'Muhammad Jibreel', nameAr: 'محمد جبريل', style: '128kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Muhsin_Al_Qasim_192kbps', nameEn: 'Muhsin Al-Qasim', nameAr: 'محسن القاسم', style: '192kbps', downloadedSurahs: 0, totalSize: 0 },

  { id: 'Nasser_Alqatami_128kbps', nameEn: 'Nasser Al-Qatami', nameAr: 'ناصر القطامي', style: '128kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Salaah_AbdulRahman_Bukhatir_128kbps', nameEn: 'Salah Bukhatir', nameAr: 'صلاح بوخاطر', style: '128kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Salah_Al_Budair_128kbps', nameEn: 'Salah Al-Budair', nameAr: 'صلاح البدير', style: '128kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'Saood_ash-Shuraym_128kbps', nameEn: 'Saud Ash-Shuraim', nameAr: 'سعود الشريم', style: '128kbps', downloadedSurahs: 0, totalSize: 0 },
  { id: 'warsh/warsh_yassin_al_jazaery_64kbps', nameEn: 'Yassin Al-Jazaery (Warsh)', nameAr: 'ياسين الجزائري - ورش', style: '64kbps', downloadedSurahs: 0, totalSize: 0 },
];

// Surah info for downloads (ayah counts for size estimation)
export const SURAH_INFO = [
  { number: 1, nameEn: 'Al-Fatihah', nameAr: 'الفاتحة', ayahs: 7 },
  { number: 2, nameEn: 'Al-Baqarah', nameAr: 'البقرة', ayahs: 286 },
  { number: 3, nameEn: 'Aal-Imran', nameAr: 'آل عمران', ayahs: 200 },
  { number: 4, nameEn: 'An-Nisa', nameAr: 'النساء', ayahs: 176 },
  { number: 5, nameEn: 'Al-Maidah', nameAr: 'المائدة', ayahs: 120 },
  { number: 6, nameEn: 'Al-Anam', nameAr: 'الأنعام', ayahs: 165 },
  { number: 7, nameEn: 'Al-Araf', nameAr: 'الأعراف', ayahs: 206 },
  { number: 8, nameEn: 'Al-Anfal', nameAr: 'الأنفال', ayahs: 75 },
  { number: 9, nameEn: 'At-Tawbah', nameAr: 'التوبة', ayahs: 129 },
  { number: 10, nameEn: 'Yunus', nameAr: 'يونس', ayahs: 109 },
  { number: 11, nameEn: 'Hud', nameAr: 'هود', ayahs: 123 },
  { number: 12, nameEn: 'Yusuf', nameAr: 'يوسف', ayahs: 111 },
  { number: 13, nameEn: 'Ar-Rad', nameAr: 'الرعد', ayahs: 43 },
  { number: 14, nameEn: 'Ibrahim', nameAr: 'إبراهيم', ayahs: 52 },
  { number: 15, nameEn: 'Al-Hijr', nameAr: 'الحجر', ayahs: 99 },
  { number: 16, nameEn: 'An-Nahl', nameAr: 'النحل', ayahs: 128 },
  { number: 17, nameEn: 'Al-Isra', nameAr: 'الإسراء', ayahs: 111 },
  { number: 18, nameEn: 'Al-Kahf', nameAr: 'الكهف', ayahs: 110 },
  { number: 19, nameEn: 'Maryam', nameAr: 'مريم', ayahs: 98 },
  { number: 20, nameEn: 'Ta-Ha', nameAr: 'طه', ayahs: 135 },
  { number: 21, nameEn: 'Al-Anbiya', nameAr: 'الأنبياء', ayahs: 112 },
  { number: 22, nameEn: 'Al-Hajj', nameAr: 'الحج', ayahs: 78 },
  { number: 23, nameEn: 'Al-Muminun', nameAr: 'المؤمنون', ayahs: 118 },
  { number: 24, nameEn: 'An-Nur', nameAr: 'النور', ayahs: 64 },
  { number: 25, nameEn: 'Al-Furqan', nameAr: 'الفرقان', ayahs: 77 },
  { number: 26, nameEn: 'Ash-Shuara', nameAr: 'الشعراء', ayahs: 227 },
  { number: 27, nameEn: 'An-Naml', nameAr: 'النمل', ayahs: 93 },
  { number: 28, nameEn: 'Al-Qasas', nameAr: 'القصص', ayahs: 88 },
  { number: 29, nameEn: 'Al-Ankabut', nameAr: 'العنكبوت', ayahs: 69 },
  { number: 30, nameEn: 'Ar-Rum', nameAr: 'الروم', ayahs: 60 },
  { number: 31, nameEn: 'Luqman', nameAr: 'لقمان', ayahs: 34 },
  { number: 32, nameEn: 'As-Sajdah', nameAr: 'السجدة', ayahs: 30 },
  { number: 33, nameEn: 'Al-Ahzab', nameAr: 'الأحزاب', ayahs: 73 },
  { number: 34, nameEn: 'Saba', nameAr: 'سبأ', ayahs: 54 },
  { number: 35, nameEn: 'Fatir', nameAr: 'فاطر', ayahs: 45 },
  { number: 36, nameEn: 'Ya-Sin', nameAr: 'يس', ayahs: 83 },
  { number: 37, nameEn: 'As-Saffat', nameAr: 'الصافات', ayahs: 182 },
  { number: 38, nameEn: 'Sad', nameAr: 'ص', ayahs: 88 },
  { number: 39, nameEn: 'Az-Zumar', nameAr: 'الزمر', ayahs: 75 },
  { number: 40, nameEn: 'Ghafir', nameAr: 'غافر', ayahs: 85 },
  { number: 41, nameEn: 'Fussilat', nameAr: 'فصلت', ayahs: 54 },
  { number: 42, nameEn: 'Ash-Shura', nameAr: 'الشورى', ayahs: 53 },
  { number: 43, nameEn: 'Az-Zukhruf', nameAr: 'الزخرف', ayahs: 89 },
  { number: 44, nameEn: 'Ad-Dukhan', nameAr: 'الدخان', ayahs: 59 },
  { number: 45, nameEn: 'Al-Jathiyah', nameAr: 'الجاثية', ayahs: 37 },
  { number: 46, nameEn: 'Al-Ahqaf', nameAr: 'الأحقاف', ayahs: 35 },
  { number: 47, nameEn: 'Muhammad', nameAr: 'محمد', ayahs: 38 },
  { number: 48, nameEn: 'Al-Fath', nameAr: 'الفتح', ayahs: 29 },
  { number: 49, nameEn: 'Al-Hujurat', nameAr: 'الحجرات', ayahs: 18 },
  { number: 50, nameEn: 'Qaf', nameAr: 'ق', ayahs: 45 },
  { number: 51, nameEn: 'Adh-Dhariyat', nameAr: 'الذاريات', ayahs: 60 },
  { number: 52, nameEn: 'At-Tur', nameAr: 'الطور', ayahs: 49 },
  { number: 53, nameEn: 'An-Najm', nameAr: 'النجم', ayahs: 62 },
  { number: 54, nameEn: 'Al-Qamar', nameAr: 'القمر', ayahs: 55 },
  { number: 55, nameEn: 'Ar-Rahman', nameAr: 'الرحمن', ayahs: 78 },
  { number: 56, nameEn: 'Al-Waqiah', nameAr: 'الواقعة', ayahs: 96 },
  { number: 57, nameEn: 'Al-Hadid', nameAr: 'الحديد', ayahs: 29 },
  { number: 58, nameEn: 'Al-Mujadila', nameAr: 'المجادلة', ayahs: 22 },
  { number: 59, nameEn: 'Al-Hashr', nameAr: 'الحشر', ayahs: 24 },
  { number: 60, nameEn: 'Al-Mumtahanah', nameAr: 'الممتحنة', ayahs: 13 },
  { number: 61, nameEn: 'As-Saf', nameAr: 'الصف', ayahs: 14 },
  { number: 62, nameEn: 'Al-Jumuah', nameAr: 'الجمعة', ayahs: 11 },
  { number: 63, nameEn: 'Al-Munafiqun', nameAr: 'المنافقون', ayahs: 11 },
  { number: 64, nameEn: 'At-Taghabun', nameAr: 'التغابن', ayahs: 18 },
  { number: 65, nameEn: 'At-Talaq', nameAr: 'الطلاق', ayahs: 12 },
  { number: 66, nameEn: 'At-Tahrim', nameAr: 'التحريم', ayahs: 12 },
  { number: 67, nameEn: 'Al-Mulk', nameAr: 'الملك', ayahs: 30 },
  { number: 68, nameEn: 'Al-Qalam', nameAr: 'القلم', ayahs: 52 },
  { number: 69, nameEn: 'Al-Haqqah', nameAr: 'الحاقة', ayahs: 52 },
  { number: 70, nameEn: 'Al-Maarij', nameAr: 'المعارج', ayahs: 44 },
  { number: 71, nameEn: 'Nuh', nameAr: 'نوح', ayahs: 28 },
  { number: 72, nameEn: 'Al-Jinn', nameAr: 'الجن', ayahs: 28 },
  { number: 73, nameEn: 'Al-Muzzammil', nameAr: 'المزمل', ayahs: 20 },
  { number: 74, nameEn: 'Al-Muddaththir', nameAr: 'المدثر', ayahs: 56 },
  { number: 75, nameEn: 'Al-Qiyamah', nameAr: 'القيامة', ayahs: 40 },
  { number: 76, nameEn: 'Al-Insan', nameAr: 'الإنسان', ayahs: 31 },
  { number: 77, nameEn: 'Al-Mursalat', nameAr: 'المرسلات', ayahs: 50 },
  { number: 78, nameEn: 'An-Naba', nameAr: 'النبأ', ayahs: 40 },
  { number: 79, nameEn: 'An-Naziat', nameAr: 'النازعات', ayahs: 46 },
  { number: 80, nameEn: 'Abasa', nameAr: 'عبس', ayahs: 42 },
  { number: 81, nameEn: 'At-Takwir', nameAr: 'التكوير', ayahs: 29 },
  { number: 82, nameEn: 'Al-Infitar', nameAr: 'الانفطار', ayahs: 19 },
  { number: 83, nameEn: 'Al-Mutaffifin', nameAr: 'المطففين', ayahs: 36 },
  { number: 84, nameEn: 'Al-Inshiqaq', nameAr: 'الانشقاق', ayahs: 25 },
  { number: 85, nameEn: 'Al-Buruj', nameAr: 'البروج', ayahs: 22 },
  { number: 86, nameEn: 'At-Tariq', nameAr: 'الطارق', ayahs: 17 },
  { number: 87, nameEn: 'Al-Ala', nameAr: 'الأعلى', ayahs: 19 },
  { number: 88, nameEn: 'Al-Ghashiyah', nameAr: 'الغاشية', ayahs: 26 },
  { number: 89, nameEn: 'Al-Fajr', nameAr: 'الفجر', ayahs: 30 },
  { number: 90, nameEn: 'Al-Balad', nameAr: 'البلد', ayahs: 20 },
  { number: 91, nameEn: 'Ash-Shams', nameAr: 'الشمس', ayahs: 15 },
  { number: 92, nameEn: 'Al-Layl', nameAr: 'الليل', ayahs: 21 },
  { number: 93, nameEn: 'Ad-Duhaa', nameAr: 'الضحى', ayahs: 11 },
  { number: 94, nameEn: 'Ash-Sharh', nameAr: 'الشرح', ayahs: 8 },
  { number: 95, nameEn: 'At-Tin', nameAr: 'التين', ayahs: 8 },
  { number: 96, nameEn: 'Al-Alaq', nameAr: 'العلق', ayahs: 19 },
  { number: 97, nameEn: 'Al-Qadr', nameAr: 'القدر', ayahs: 5 },
  { number: 98, nameEn: 'Al-Bayyinah', nameAr: 'البينة', ayahs: 8 },
  { number: 99, nameEn: 'Az-Zalzalah', nameAr: 'الزلزلة', ayahs: 8 },
  { number: 100, nameEn: 'Al-Adiyat', nameAr: 'العاديات', ayahs: 11 },
  { number: 101, nameEn: 'Al-Qariah', nameAr: 'القارعة', ayahs: 11 },
  { number: 102, nameEn: 'At-Takathur', nameAr: 'التكاثر', ayahs: 8 },
  { number: 103, nameEn: 'Al-Asr', nameAr: 'العصر', ayahs: 3 },
  { number: 104, nameEn: 'Al-Humazah', nameAr: 'الهمزة', ayahs: 9 },
  { number: 105, nameEn: 'Al-Fil', nameAr: 'الفيل', ayahs: 5 },
  { number: 106, nameEn: 'Quraysh', nameAr: 'قريش', ayahs: 4 },
  { number: 107, nameEn: 'Al-Maun', nameAr: 'الماعون', ayahs: 7 },
  { number: 108, nameEn: 'Al-Kawthar', nameAr: 'الكوثر', ayahs: 3 },
  { number: 109, nameEn: 'Al-Kafirun', nameAr: 'الكافرون', ayahs: 6 },
  { number: 110, nameEn: 'An-Nasr', nameAr: 'النصر', ayahs: 3 },
  { number: 111, nameEn: 'Al-Masad', nameAr: 'المسد', ayahs: 5 },
  { number: 112, nameEn: 'Al-Ikhlas', nameAr: 'الإخلاص', ayahs: 4 },
  { number: 113, nameEn: 'Al-Falaq', nameAr: 'الفلق', ayahs: 5 },
  { number: 114, nameEn: 'An-Nas', nameAr: 'الناس', ayahs: 6 },
];

// Average audio file size per ayah (in bytes) - rough estimate
export const AVG_AYAH_SIZE_BYTES = 150 * 1024; // ~150KB per ayah

// Directory paths (must match where MushafScreen saves files)
export const OFFLINE_DIRS = {
  AUDIO: 'quran_audio',
  TAFSIR: 'tafsirs',  // MushafScreen uses 'tafsirs/' for both tafsir and translations
  PRAYER_CACHE: 'prayer_cache',
};

// Format bytes to human readable
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Get estimated surah size
export function getEstimatedSurahSize(surahNumber: number): number {
  const surah = SURAH_INFO.find(s => s.number === surahNumber);
  if (!surah) return 0;
  return surah.ayahs * AVG_AYAH_SIZE_BYTES;
}

// Get total Quran size estimate
export function getTotalQuranSizeEstimate(): number {
  return SURAH_INFO.reduce((total, surah) => total + surah.ayahs * AVG_AYAH_SIZE_BYTES, 0);
}
