# Design: Offline Mode Enhancement

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    StorageManagementScreen                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              StorageOverview                         │    │
│  │  Total: 1.2 GB / 2 GB                               │    │
│  │  [████████████░░░░░░░░] 60%                         │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              StorageBreakdown                        │    │
│  │  🎵 Audio: 800 MB (67%)                             │    │
│  │  📖 Tafsir: 200 MB (17%)                            │    │
│  │  🕌 Prayer Times: 2 MB (0.2%)                       │    │
│  │  📦 Cache: 198 MB (16%)                             │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              QuickActions                            │    │
│  │  [Clear All Cache] [Manage Downloads]               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    AudioDownloadScreen                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              ReciterSelector                         │    │
│  │  Current: Mishary Alafasy                           │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              DownloadProgress                        │    │
│  │  Downloading: Al-Baqarah (45%)                      │    │
│  │  Queue: 3 surahs remaining                          │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              SurahDownloadList                       │    │
│  │  ✓ Al-Fatihah (2.1 MB)                             │    │
│  │  ⬇ Al-Baqarah (45%) [Pause]                        │    │
│  │  ○ Al-Imran (Download)                              │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Data Structures

### DownloadItem
```typescript
interface DownloadItem {
  id: string;
  type: 'audio' | 'tafsir';
  surahNumber?: number;
  reciter?: string;
  tafsirSource?: string;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed';
  progress: number; // 0-100
  totalBytes: number;
  downloadedBytes: number;
  localPath?: string;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}
```

### StorageInfo
```typescript
interface StorageInfo {
  totalUsed: number;        // bytes
  audioSize: number;
  tafsirSize: number;
  prayerCacheSize: number;
  otherCacheSize: number;
  deviceAvailable: number;
  storageLimit: number;     // user-configured limit
}
```

### CachedPrayerTimes
```typescript
interface CachedPrayerTimes {
  latitude: number;
  longitude: number;
  method: number;
  date: string;             // YYYY-MM-DD
  timings: PrayerTimes;
  cachedAt: Date;
  expiresAt: Date;
}
```

### OfflineSettings
```typescript
interface OfflineSettings {
  storageLimit: number;     // bytes, default 2GB
  wifiOnlyDownloads: boolean;
  autoDeleteOldCache: boolean;
  maxConcurrentDownloads: number;
}
```

### NetworkStatus
```typescript
interface NetworkStatus {
  isConnected: boolean;
  isWifi: boolean;
  lastOnline: Date | null;
}
```

## Services

### OfflineStorageService
Central service for managing offline storage.

```typescript
class OfflineStorageService {
  // Storage info
  getStorageInfo(): Promise<StorageInfo>;
  getAvailableSpace(): Promise<number>;
  
  // Clear operations
  clearAllCache(): Promise<void>;
  clearAudioCache(reciter?: string): Promise<void>;
  clearTafsirCache(source?: string): Promise<void>;
  clearPrayerCache(): Promise<void>;
  
  // Settings
  getSettings(): Promise<OfflineSettings>;
  updateSettings(settings: Partial<OfflineSettings>): Promise<void>;
  
  // Auto cleanup
  performCleanupIfNeeded(): Promise<void>;
}
```

### AudioDownloadService
Manages Quran audio downloads.

```typescript
class AudioDownloadService {
  // Download management
  downloadSurah(surahNumber: number, reciter: string): Promise<string>;
  downloadAllSurahs(reciter: string): Promise<void>;
  pauseDownload(downloadId: string): Promise<void>;
  resumeDownload(downloadId: string): Promise<void>;
  cancelDownload(downloadId: string): Promise<void>;
  
  // Status
  getDownloadStatus(surahNumber: number, reciter: string): DownloadItem | null;
  getDownloadQueue(): DownloadItem[];
  isDownloaded(surahNumber: number, reciter: string): Promise<boolean>;
  getLocalAudioPath(surahNumber: number, ayah: number, reciter: string): Promise<string | null>;
  
  // Storage
  getDownloadedSurahs(reciter: string): Promise<number[]>;
  getReciterStorageSize(reciter: string): Promise<number>;
  deleteReciterAudio(reciter: string): Promise<void>;
  
  // Events
  onProgress(callback: (item: DownloadItem) => void): () => void;
  onComplete(callback: (item: DownloadItem) => void): () => void;
  onError(callback: (item: DownloadItem, error: Error) => void): () => void;
}
```

### PrayerTimesCacheService
Manages prayer times caching.

```typescript
class PrayerTimesCacheService {
  // Cache operations
  cachePrayerTimes(data: PrayerTimesData, location: {lat: number, lng: number}, method: number): Promise<void>;
  getCachedPrayerTimes(date: Date, location: {lat: number, lng: number}, method: number): Promise<CachedPrayerTimes | null>;
  
  // Bulk operations
  cacheNextDays(days: number, location: {lat: number, lng: number}, method: number): Promise<void>;
  
  // Status
  getCacheStatus(): Promise<{
    cachedDays: number;
    oldestDate: Date;
    newestDate: Date;
    lastSync: Date;
  }>;
  
  // Invalidation
  invalidateCache(): Promise<void>;
  invalidateForLocation(lat: number, lng: number): Promise<void>;
  
  // Cleanup
  clearExpiredCache(): Promise<void>;
}
```

### TafsirDownloadService
Manages tafsir downloads.

```typescript
class TafsirDownloadService {
  // Download
  downloadTafsir(source: string, surahNumber?: number): Promise<void>;
  downloadCompleteTafsir(source: string): Promise<void>;
  
  // Access
  getTafsir(source: string, surahNumber: number, ayahNumber: number): Promise<string | null>;
  isDownloaded(source: string, surahNumber?: number): Promise<boolean>;
  
  // Storage
  getTafsirSize(source: string): Promise<number>;
  deleteTafsir(source: string): Promise<void>;
}
```

### NetworkService
Handles network status detection.

```typescript
class NetworkService {
  // Status
  getStatus(): NetworkStatus;
  isOnline(): boolean;
  isWifi(): boolean;
  
  // Events
  onStatusChange(callback: (status: NetworkStatus) => void): () => void;
  
  // Queue management
  queueOperation(operation: () => Promise<void>): void;
  processQueue(): Promise<void>;
}
```

## Components

### StorageOverview
Displays total storage usage with visual progress bar.

Props:
- `storageInfo: StorageInfo`
- `onManagePress?: () => void`

### StorageBreakdown
Shows storage breakdown by category.

Props:
- `storageInfo: StorageInfo`
- `onCategoryPress?: (category: string) => void`

### DownloadProgress
Shows current download progress.

Props:
- `item: DownloadItem`
- `onPause?: () => void`
- `onResume?: () => void`
- `onCancel?: () => void`

### SurahDownloadItem
Individual surah download row.

Props:
- `surahNumber: number`
- `surahName: string`
- `status: DownloadItem['status']`
- `progress?: number`
- `size?: number`
- `onDownload?: () => void`
- `onPause?: () => void`
- `onDelete?: () => void`

### OfflineIndicator
Shows offline status banner.

Props:
- `isOffline: boolean`
- `lastSync?: Date`

### NetworkStatusBadge
Small badge showing network status.

Props:
- `status: NetworkStatus`
- `compact?: boolean`

### StorageSettingsCard
Settings for storage management.

Props:
- `settings: OfflineSettings`
- `onSettingsChange: (settings: Partial<OfflineSettings>) => void`

## Hooks

### useOfflineStorage
```typescript
function useOfflineStorage(): {
  storageInfo: StorageInfo | null;
  isLoading: boolean;
  clearCache: (type?: 'all' | 'audio' | 'tafsir' | 'prayer') => Promise<void>;
  refreshStorageInfo: () => Promise<void>;
}
```

### useAudioDownload
```typescript
function useAudioDownload(reciter: string): {
  downloadedSurahs: number[];
  downloadQueue: DownloadItem[];
  currentDownload: DownloadItem | null;
  downloadSurah: (surahNumber: number) => Promise<void>;
  downloadAll: () => Promise<void>;
  pauseDownload: (id: string) => void;
  resumeDownload: (id: string) => void;
  cancelDownload: (id: string) => void;
  isDownloading: boolean;
}
```

### usePrayerTimesCache
```typescript
function usePrayerTimesCache(): {
  cacheStatus: { cachedDays: number; lastSync: Date } | null;
  isUsingCache: boolean;
  refreshCache: () => Promise<void>;
  clearCache: () => Promise<void>;
}
```

### useNetworkStatus
```typescript
function useNetworkStatus(): {
  isOnline: boolean;
  isWifi: boolean;
  lastOnline: Date | null;
}
```

### useOfflineSettings
```typescript
function useOfflineSettings(): {
  settings: OfflineSettings;
  updateSettings: (settings: Partial<OfflineSettings>) => Promise<void>;
  isLoading: boolean;
}
```

## Screens

### StorageManagementScreen
Main storage management screen accessible from Settings.

Sections:
1. StorageOverview - visual storage usage
2. StorageBreakdown - by category
3. Quick Actions - clear cache buttons
4. StorageSettingsCard - limits and preferences

### AudioDownloadScreen
Manage Quran audio downloads.

Sections:
1. ReciterSelector - choose reciter
2. DownloadProgress - current download status
3. Batch Actions - download all / delete all
4. SurahDownloadList - list of 114 surahs with status

## Storage Structure

```
documentDirectory/
├── quran_audio/
│   └── {reciter}/
│       └── {surah}_{ayah}.mp3
├── tafsir/
│   └── {source}/
│       └── {surah}.json
├── prayer_cache/
│   └── {lat}_{lng}_{method}/
│       └── {date}.json
└── offline_metadata.json
```

## File Structure

```
client/
├── screens/
│   ├── StorageManagementScreen.tsx
│   └── AudioDownloadScreen.tsx
├── components/
│   ├── StorageOverview.tsx
│   ├── StorageBreakdown.tsx
│   ├── DownloadProgress.tsx
│   ├── SurahDownloadItem.tsx
│   ├── OfflineIndicator.tsx
│   ├── NetworkStatusBadge.tsx
│   └── StorageSettingsCard.tsx
├── services/
│   ├── OfflineStorageService.ts
│   ├── AudioDownloadService.ts
│   ├── PrayerTimesCacheService.ts
│   ├── TafsirDownloadService.ts
│   └── NetworkService.ts
├── hooks/
│   ├── useOfflineStorage.ts
│   ├── useAudioDownload.ts
│   ├── usePrayerTimesCache.ts
│   ├── useNetworkStatus.ts
│   └── useOfflineSettings.ts
└── types/
    └── offline.ts
```

## Integration Points

### Existing AudioService
Modify to check local cache first:
```typescript
// In AudioService.downloadAudio()
const localPath = await audioDownloadService.getLocalAudioPath(surah, ayah, reciter);
if (localPath) {
  return localPath; // Use cached audio
}
// Fall back to download
```

### Existing usePrayerTimes
Modify to use cache when offline:
```typescript
// In usePrayerTimes hook
const networkStatus = useNetworkStatus();
if (!networkStatus.isOnline) {
  return prayerTimesCacheService.getCachedPrayerTimes(date, location, method);
}
```

### Settings Screen
Add navigation to StorageManagementScreen.

## Color Scheme

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Downloaded | #10B981 | #34D399 |
| Downloading | #3B82F6 | #60A5FA |
| Pending | #6B7280 | #9CA3AF |
| Failed | #EF4444 | #F87171 |
| Storage Bar BG | #E5E7EB | #374151 |
| Storage Bar Fill | #10B981 | #34D399 |
| Warning (>80%) | #F59E0B | #FBBF24 |
| Critical (>95%) | #EF4444 | #F87171 |
