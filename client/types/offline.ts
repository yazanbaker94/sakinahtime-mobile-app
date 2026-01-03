/**
 * Offline Mode Types
 */

export type DownloadStatus = 'pending' | 'downloading' | 'paused' | 'completed' | 'failed';

export interface DownloadItem {
  id: string;
  type: 'audio' | 'tafsir';
  surahNumber?: number;
  reciter?: string;
  tafsirSource?: string;
  status: DownloadStatus;
  progress: number; // 0-100
  totalBytes: number;
  downloadedBytes: number;
  localPath?: string;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface StorageInfo {
  totalUsed: number;        // bytes
  audioSize: number;
  tafsirSize: number;
  prayerCacheSize: number;
  otherCacheSize: number;
  deviceAvailable: number;
  storageLimit: number;     // user-configured limit
}

export interface CachedPrayerTimes {
  latitude: number;
  longitude: number;
  method: number;
  date: string;             // YYYY-MM-DD
  timings: {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Sunset: string;
    Maghrib: string;
    Isha: string;
    Imsak: string;
    Midnight: string;
  };
  cachedAt: number;         // timestamp
  expiresAt: number;        // timestamp
}

export interface OfflineSettings {
  storageLimit: number;     // bytes, default 2GB
  wifiOnlyDownloads: boolean;
  autoDeleteOldCache: boolean;
  maxConcurrentDownloads: number;
}

export interface NetworkStatus {
  isConnected: boolean;
  isWifi: boolean;
  lastOnline: number | null; // timestamp
}

export interface DownloadProgress {
  downloadId: string;
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  speed?: number; // bytes per second
}

export interface SurahDownloadInfo {
  surahNumber: number;
  surahNameEn: string;
  surahNameAr: string;
  totalAyahs: number;
  estimatedSize: number; // bytes
  isDownloaded: boolean;
  downloadProgress?: number;
  status?: DownloadStatus;
}

export interface ReciterInfo {
  id: string;
  nameEn: string;
  nameAr: string;
  style?: string;
  downloadedSurahs: number;
  totalSize: number;
}

export type StorageCategory = 'audio' | 'tafsir' | 'prayer' | 'cache' | 'all';
