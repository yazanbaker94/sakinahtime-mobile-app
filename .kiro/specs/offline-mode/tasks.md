# Implementation Plan: Offline Mode Enhancement

## Overview

This plan implements comprehensive offline functionality including Quran audio downloads, prayer times caching, tafsir access, and storage management UI.

## Tasks

- [x] 1. Create types and constants
  - Create `client/types/offline.ts` with DownloadItem, StorageInfo, CachedPrayerTimes, OfflineSettings, NetworkStatus interfaces
  - Create `client/constants/offline.ts` with storage limits, cache durations, reciter list
  - _Requirements: 1.1, 2.1, 4.1_

- [x] 2. Implement NetworkService
  - [x] 2.1 Create `client/services/NetworkService.ts`
    - Implement connectivity detection using @react-native-community/netinfo
    - Track online/offline status and WiFi state
    - Implement operation queue for offline actions
    - _Requirements: 5.1, 5.2_
  
  - [x] 2.2 Write tests for NetworkService
    - Test status detection
    - Test queue management
    - _Requirements: 5.1_

- [x] 3. Implement OfflineStorageService
  - [x] 3.1 Create `client/services/OfflineStorageService.ts`
    - Implement getStorageInfo with breakdown by category
    - Implement clear operations (all, audio, tafsir, prayer)
    - Implement settings management
    - Implement auto-cleanup when limit reached
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 3.2 Write tests for OfflineStorageService
    - Test storage calculation
    - Test clear operations
    - Test settings persistence
    - _Requirements: 4.1_

- [x] 4. Implement PrayerTimesCacheService
  - [x] 4.1 Create `client/services/PrayerTimesCacheService.ts`
    - Implement cachePrayerTimes for single day
    - Implement cacheNextDays for bulk caching (30 days)
    - Implement getCachedPrayerTimes with location matching
    - Implement cache invalidation on method/location change
    - Implement clearExpiredCache
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 4.2 Write tests for PrayerTimesCacheService
    - Test cache storage and retrieval
    - Test location-based invalidation
    - Test expiration handling
    - _Requirements: 2.1, 2.2_

- [x] 5. Implement AudioDownloadService
  - [x] 5.1 Create `client/services/AudioDownloadService.ts`
    - Implement downloadSurah with progress tracking
    - Implement downloadAllSurahs with queue management
    - Implement pause/resume/cancel operations
    - Implement getLocalAudioPath for cached audio lookup
    - Implement concurrent download limiting (max 3)
    - Implement retry logic for failed downloads
    - _Requirements: 1.1, 1.2, 1.3, 6.1_
  
  - [x] 5.2 Write tests for AudioDownloadService
    - Test download queue management
    - Test status tracking
    - Test local path resolution
    - _Requirements: 1.1, 1.3_

- [x] 6. Implement TafsirDownloadService
  - [x] 6.1 Create `client/services/TafsirDownloadService.ts`
    - Implement downloadTafsir per surah
    - Implement downloadCompleteTafsir
    - Implement getTafsir for offline access
    - Implement storage management
    - _Requirements: 3.1, 3.2_
  
  - [x] 6.2 Write tests for TafsirDownloadService
    - Test download and retrieval
    - Test storage calculation
    - _Requirements: 3.1_

- [x] 7. Create React hooks
  - [x] 7.1 Create `client/hooks/useNetworkStatus.ts`
    - Return isOnline, isWifi, lastOnline
    - Auto-update on network changes
    - _Requirements: 5.1_
  
  - [x] 7.2 Create `client/hooks/useOfflineStorage.ts`
    - Return storageInfo, clearCache, refreshStorageInfo
    - _Requirements: 4.1, 4.2_
  
  - [x] 7.3 Create `client/hooks/useAudioDownload.ts`
    - Return downloadedSurahs, downloadQueue, download/pause/resume functions
    - _Requirements: 1.1, 1.3_
  
  - [x] 7.4 Create `client/hooks/usePrayerTimesCache.ts`
    - Return cacheStatus, isUsingCache, refreshCache
    - _Requirements: 2.1, 2.2_
  
  - [x] 7.5 Create `client/hooks/useOfflineSettings.ts`
    - Return settings, updateSettings
    - _Requirements: 4.3_

- [x] 8. Create UI components
  - [x] 8.1 Create `client/components/StorageOverview.tsx`
    - Display total storage with progress bar
    - Show percentage and absolute values
    - Color-code based on usage level
    - _Requirements: 4.1_
  
  - [x] 8.2 Create `client/components/StorageBreakdown.tsx`
    - Show breakdown by category (audio, tafsir, prayer, cache)
    - Tappable categories for management
    - _Requirements: 4.1_
  
  - [x] 8.3 Create `client/components/DownloadProgress.tsx`
    - Show current download with progress bar
    - Pause/Resume/Cancel buttons
    - Show speed and ETA
    - _Requirements: 1.1, 7.1_
  
  - [x] 8.4 Create `client/components/SurahDownloadItem.tsx`
    - Show surah name, status icon, size
    - Download/Pause/Delete actions
    - Progress indicator when downloading
    - _Requirements: 1.1, 1.3_
  
  - [x] 8.5 Create `client/components/OfflineIndicator.tsx`
    - Banner showing offline status
    - Last sync timestamp
    - _Requirements: 7.1_
  
  - [x] 8.6 Create `client/components/NetworkStatusBadge.tsx`
    - Small badge for network status
    - WiFi/Mobile/Offline icons
    - _Requirements: 5.1_
  
  - [x] 8.7 Create `client/components/StorageSettingsCard.tsx`
    - Storage limit slider
    - WiFi-only toggle
    - Auto-cleanup toggle
    - _Requirements: 4.3_

- [x] 9. Create screens
  - [x] 9.1 Create `client/screens/StorageManagementScreen.tsx`
    - StorageOverview at top
    - StorageBreakdown section
    - Quick action buttons (Clear All, Manage Downloads)
    - StorageSettingsCard
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 9.2 Create `client/screens/AudioDownloadScreen.tsx`
    - Reciter selector
    - Current download progress
    - Batch actions (Download All, Delete All)
    - Scrollable list of 114 surahs with status
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 9.3 Add navigation to new screens
    - Add StorageManagementScreen to RootStackNavigator
    - Add AudioDownloadScreen to RootStackNavigator
    - Add navigation from Settings screen
    - _Requirements: 4.1_

- [x] 10. Integrate with existing services
  - [x] 10.1 Modify AudioService to use cached audio
    - Check AudioDownloadService for local file first
    - Fall back to streaming if not cached
    - _Requirements: 1.1_
  
  - [x] 10.2 Modify usePrayerTimes to use cache when offline
    - Check network status
    - Use PrayerTimesCacheService when offline
    - Show offline indicator
    - Auto-cache when online
    - _Requirements: 2.1, 2.2_
  
  - [x] 10.3 Add OfflineIndicator to main screens
    - Show in PrayerTimesScreen when using cached data
    - Show in QuranScreen when offline
    - _Requirements: 7.1_

- [x] 11. Final integration and testing
  - Run all tests
  - Test offline scenarios on device
  - Test download pause/resume
  - Test storage cleanup
  - Verify cache invalidation

## Dependencies

- @react-native-community/netinfo for network detection
- expo-file-system for file operations
- AsyncStorage for metadata persistence

## Notes

- Audio files are stored per ayah (verse) not per surah for granular caching
- Prayer times cache uses location hash for efficient lookup
- Storage limit is user-configurable with 2GB default
- Downloads respect WiFi-only setting when enabled
- Background downloads continue when app is minimized (platform permitting)

## Storage Estimates

| Content | Size per Unit | Total |
|---------|---------------|-------|
| Audio (1 reciter, all surahs) | ~2-5 MB/surah | ~500 MB |
| Prayer times (30 days) | ~1 KB/day | ~30 KB |
| Tafsir (Ibn Kathir) | ~5 MB | ~5 MB |
| Total typical usage | - | ~500-600 MB |
