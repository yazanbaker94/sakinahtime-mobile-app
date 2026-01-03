/**
 * AudioDownloadService
 * 
 * Manages Quran audio downloads for offline playback.
 * Supports downloading individual surahs or batch downloads,
 * with pause/resume functionality and progress tracking.
 */

import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DownloadItem } from '../types/offline';
import { 
  STORAGE_KEYS, 
  OFFLINE_DIRS, 
  DOWNLOAD_SETTINGS,
  SURAH_INFO,
  AVG_AYAH_SIZE_BYTES 
} from '../constants/offline';
import { networkService } from './NetworkService';
import { offlineStorageService } from './OfflineStorageService';

type ProgressCallback = (item: DownloadItem) => void;
type CompleteCallback = (item: DownloadItem) => void;
type ErrorCallback = (item: DownloadItem, error: Error) => void;

interface DownloadedSurahsMeta {
  [reciter: string]: {
    surahs: number[];
    totalSize: number;
  };
}

class AudioDownloadServiceImpl {
  private static instance: AudioDownloadServiceImpl;
  private downloadQueue: DownloadItem[] = [];
  private downloadedMeta: DownloadedSurahsMeta = {};
  private progressListeners: Set<ProgressCallback> = new Set();
  private completeListeners: Set<CompleteCallback> = new Set();
  private errorListeners: Set<ErrorCallback> = new Set();
  private initialized = false;
  private isProcessing = false;
  private shouldStopProcessing = false;

  private constructor() {}

  static getInstance(): AudioDownloadServiceImpl {
    if (!AudioDownloadServiceImpl.instance) {
      AudioDownloadServiceImpl.instance = new AudioDownloadServiceImpl();
    }
    return AudioDownloadServiceImpl.instance;
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize dependencies first
      await networkService.initialize();
      await offlineStorageService.initialize();
      
      // Load downloaded surahs metadata
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_SURAHS);
      if (stored) {
        this.downloadedMeta = JSON.parse(stored);
      }

      // Load pending download queue
      const queueStored = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOAD_QUEUE);
      if (queueStored) {
        this.downloadQueue = JSON.parse(queueStored);
        // Reset any "downloading" items to "pending"
        this.downloadQueue.forEach(item => {
          if (item.status === 'downloading') {
            item.status = 'pending';
          }
        });
      }

      // Subscribe to network changes to auto-resume downloads
      networkService.onStatusChange((status) => {
        if (status.isConnected && status.isWifi) {
          // Check if we have pending downloads
          const hasPending = this.downloadQueue.some(item => item.status === 'pending');
          if (hasPending) {
            console.log('[AudioDownloadService] WiFi available, resuming queue...');
            this.processQueue();
          }
        }
      });

      this.initialized = true;

      // Resume downloads if online
      if (networkService.isOnline()) {
        this.processQueue();
      }
    } catch (error) {
      console.error('[AudioDownloadService] Failed to initialize:', error);
    }
  }

  /**
   * Get audio directory for a reciter
   */
  private getReciterDir(reciter: string): string {
    return `${FileSystem.documentDirectory}${OFFLINE_DIRS.AUDIO}/${reciter}/`;
  }

  /**
   * Get local file path for an ayah
   */
  private getAyahFilePath(surah: number, ayah: number, reciter: string): string {
    return `${this.getReciterDir(reciter)}${surah}_${ayah}.mp3`;
  }

  /**
   * Get audio URL from everyayah.com
   */
  private getAudioUrl(surah: number, ayah: number, reciter: string): string {
    const surahPadded = String(surah).padStart(3, '0');
    const ayahPadded = String(ayah).padStart(3, '0');
    return `https://everyayah.com/data/${reciter}/${surahPadded}${ayahPadded}.mp3`;
  }

  /**
   * Generate download ID
   */
  private generateDownloadId(surahNumber: number, reciter: string): string {
    return `audio_${reciter}_${surahNumber}`;
  }

  /**
   * Save metadata
   */
  private async saveMeta(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.DOWNLOADED_SURAHS,
        JSON.stringify(this.downloadedMeta)
      );
    } catch (error) {
      console.error('[AudioDownloadService] Failed to save meta:', error);
    }
  }

  /**
   * Save download queue
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.DOWNLOAD_QUEUE,
        JSON.stringify(this.downloadQueue)
      );
    } catch (error) {
      console.error('[AudioDownloadService] Failed to save queue:', error);
    }
  }

  /**
   * Notify progress listeners
   */
  private notifyProgress(item: DownloadItem): void {
    this.progressListeners.forEach(cb => cb(item));
  }

  /**
   * Notify complete listeners
   */
  private notifyComplete(item: DownloadItem): void {
    this.completeListeners.forEach(cb => cb(item));
  }

  /**
   * Notify error listeners
   */
  private notifyError(item: DownloadItem, error: Error): void {
    this.errorListeners.forEach(cb => cb(item, error));
  }

  /**
   * Download a single surah
   */
  async downloadSurah(surahNumber: number, reciter: string): Promise<string> {
    await this.initialize();

    const downloadId = this.generateDownloadId(surahNumber, reciter);
    
    // Check if already downloaded
    if (await this.isDownloaded(surahNumber, reciter)) {
      return downloadId;
    }

    // Check if already in queue
    const existing = this.downloadQueue.find(item => item.id === downloadId);
    if (existing) {
      return downloadId;
    }

    // Get surah info
    const surahInfo = SURAH_INFO.find(s => s.number === surahNumber);
    if (!surahInfo) {
      throw new Error(`Invalid surah number: ${surahNumber}`);
    }

    // Create download item
    const item: DownloadItem = {
      id: downloadId,
      type: 'audio',
      surahNumber,
      reciter,
      status: 'pending',
      progress: 0,
      totalBytes: surahInfo.ayahs * AVG_AYAH_SIZE_BYTES,
      downloadedBytes: 0,
      createdAt: new Date(),
    };

    this.downloadQueue.push(item);
    await this.saveQueue();

    // Start processing if not already
    this.processQueue();

    return downloadId;
  }

  /**
   * Download all surahs for a reciter
   */
  async downloadAllSurahs(reciter: string): Promise<void> {
    await this.initialize();

    for (const surah of SURAH_INFO) {
      if (!(await this.isDownloaded(surah.number, reciter))) {
        await this.downloadSurah(surah.number, reciter);
      }
    }
  }

  /**
   * Process the download queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    // Reset stop flag at start
    this.shouldStopProcessing = false;
    
    // Ensure network service is initialized
    await networkService.initialize();
    
    if (!networkService.isOnline()) {
      console.log('[AudioDownloadService] Offline, skipping queue processing');
      return;
    }

    // Check WiFi-only setting
    await offlineStorageService.initialize();
    const settings = offlineStorageService.getSettings();
    
    console.log('[AudioDownloadService] Processing queue - WiFi only:', settings.wifiOnlyDownloads, 'isWifi:', networkService.isWifi());
    
    if (settings.wifiOnlyDownloads && !networkService.isWifi()) {
      console.log('[AudioDownloadService] WiFi-only enabled but not on WiFi, skipping');
      return;
    }

    this.isProcessing = true;

    try {
      while (this.downloadQueue.length > 0 && !this.shouldStopProcessing) {
        // Get pending items
        const pendingItems = this.downloadQueue.filter(
          item => item.status === 'pending'
        );

        if (pendingItems.length === 0) break;

        // Process up to max concurrent downloads
        const toProcess = pendingItems.slice(0, settings.maxConcurrentDownloads);
        
        await Promise.all(
          toProcess.map(item => this.processDownloadItem(item))
        );
      }
      
      if (this.shouldStopProcessing) {
        console.log('[AudioDownloadService] Queue processing stopped by cancel request');
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single download item (download all ayahs for a surah)
   */
  private async processDownloadItem(item: DownloadItem): Promise<void> {
    if (!item.surahNumber || !item.reciter) return;

    const surahInfo = SURAH_INFO.find(s => s.number === item.surahNumber);
    if (!surahInfo) return;

    item.status = 'downloading';
    this.notifyProgress(item);
    
    console.log(`[AudioDownloadService] Starting download: Surah ${item.surahNumber} with ${item.reciter}`);

    try {
      // Ensure directory exists
      const reciterDir = this.getReciterDir(item.reciter);
      await offlineStorageService.ensureDirectory(reciterDir);

      let downloadedAyahs = 0;
      let totalSize = 0;

      // Download each ayah
      for (let ayah = 1; ayah <= surahInfo.ayahs; ayah++) {
        // Check if cancelled
        if (this.shouldStopProcessing) {
          console.log(`[AudioDownloadService] Download cancelled for surah ${item.surahNumber}`);
          item.status = 'pending'; // Reset to pending so it can be resumed later
          this.notifyProgress(item);
          return;
        }

        const url = this.getAudioUrl(item.surahNumber!, ayah, item.reciter!);
        const localPath = this.getAyahFilePath(item.surahNumber!, ayah, item.reciter!);
        
        console.log(`[AudioDownloadService] Downloading ayah ${ayah}: ${url}`);

        // Check if already exists
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (!fileInfo.exists) {
          // Download with retry
          let retries = 0;
          let success = false;

          while (retries < DOWNLOAD_SETTINGS.RETRY_ATTEMPTS && !success && !this.shouldStopProcessing) {
            try {
              const result = await FileSystem.downloadAsync(url, localPath);
              console.log(`[AudioDownloadService] Download result for ayah ${ayah}: status ${result.status}`);
              if (result.status === 200) {
                success = true;
                const info = await FileSystem.getInfoAsync(localPath);
                if ('size' in info && typeof info.size === 'number') {
                  totalSize += info.size;
                }
              } else {
                console.warn(`[AudioDownloadService] Non-200 status: ${result.status} for ${url}`);
              }
            } catch (error) {
              console.error(`[AudioDownloadService] Download error (attempt ${retries + 1}):`, error);
              retries++;
              if (retries < DOWNLOAD_SETTINGS.RETRY_ATTEMPTS) {
                await new Promise(resolve => 
                  setTimeout(resolve, DOWNLOAD_SETTINGS.RETRY_DELAY_MS)
                );
              }
            }
          }

          // Check again after retry loop
          if (this.shouldStopProcessing) {
            console.log(`[AudioDownloadService] Download cancelled for surah ${item.surahNumber}`);
            item.status = 'pending';
            this.notifyProgress(item);
            return;
          }

          if (!success) {
            throw new Error(`Failed to download ayah ${ayah} after ${DOWNLOAD_SETTINGS.RETRY_ATTEMPTS} retries`);
          }
        }

        downloadedAyahs++;
        item.progress = Math.round((downloadedAyahs / surahInfo.ayahs) * 100);
        item.downloadedBytes = downloadedAyahs * AVG_AYAH_SIZE_BYTES;
        this.notifyProgress(item);
      }

      // Only mark as completed if not cancelled
      if (!this.shouldStopProcessing) {
        // Mark as completed
        item.status = 'completed';
        item.progress = 100;
        item.completedAt = new Date();
        item.localPath = this.getReciterDir(item.reciter!);

        // Update metadata
        if (!this.downloadedMeta[item.reciter!]) {
          this.downloadedMeta[item.reciter!] = { surahs: [], totalSize: 0 };
        }
        if (!this.downloadedMeta[item.reciter!].surahs.includes(item.surahNumber!)) {
          this.downloadedMeta[item.reciter!].surahs.push(item.surahNumber!);
        }
        this.downloadedMeta[item.reciter!].totalSize += totalSize;
        await this.saveMeta();

        // Remove from queue
        this.downloadQueue = this.downloadQueue.filter(i => i.id !== item.id);
        await this.saveQueue();

        this.notifyComplete(item);
      }
    } catch (error) {
      item.status = 'failed';
      item.error = error instanceof Error ? error.message : 'Download failed';
      this.notifyError(item, error instanceof Error ? error : new Error('Download failed'));
      await this.saveQueue();
    }
  }

  /**
   * Pause a download
   */
  async pauseDownload(downloadId: string): Promise<void> {
    const item = this.downloadQueue.find(i => i.id === downloadId);
    if (item && item.status === 'downloading') {
      item.status = 'paused';
      await this.saveQueue();
      this.notifyProgress(item);
    }
  }

  /**
   * Resume a download
   */
  async resumeDownload(downloadId: string): Promise<void> {
    const item = this.downloadQueue.find(i => i.id === downloadId);
    if (item && item.status === 'paused') {
      item.status = 'pending';
      await this.saveQueue();
      this.processQueue();
    }
  }

  /**
   * Cancel a download
   */
  async cancelDownload(downloadId: string): Promise<void> {
    const item = this.downloadQueue.find(i => i.id === downloadId);
    if (item) {
      // Remove partially downloaded files
      if (item.surahNumber && item.reciter) {
        const surahInfo = SURAH_INFO.find(s => s.number === item.surahNumber);
        if (surahInfo) {
          for (let ayah = 1; ayah <= surahInfo.ayahs; ayah++) {
            const localPath = this.getAyahFilePath(item.surahNumber, ayah, item.reciter);
            await FileSystem.deleteAsync(localPath, { idempotent: true });
          }
        }
      }

      this.downloadQueue = this.downloadQueue.filter(i => i.id !== downloadId);
      await this.saveQueue();
    }
  }

  /**
   * Cancel all pending and active downloads for a reciter
   */
  async cancelAllDownloads(reciter: string): Promise<void> {
    // Set flag to stop processing loop
    this.shouldStopProcessing = true;
    
    // Get all items for this reciter
    const itemsToCancel = this.downloadQueue.filter(item => item.reciter === reciter);
    
    console.log(`[AudioDownloadService] Cancelling ${itemsToCancel.length} downloads for ${reciter}`);
    
    // Cancel each one (removes partial files)
    for (const item of itemsToCancel) {
      if (item.surahNumber) {
        const surahInfo = SURAH_INFO.find(s => s.number === item.surahNumber);
        if (surahInfo) {
          for (let ayah = 1; ayah <= surahInfo.ayahs; ayah++) {
            const localPath = this.getAyahFilePath(item.surahNumber, ayah, reciter);
            await FileSystem.deleteAsync(localPath, { idempotent: true });
          }
        }
      }
    }
    
    // Remove all from queue
    this.downloadQueue = this.downloadQueue.filter(item => item.reciter !== reciter);
    await this.saveQueue();
    
    // Notify listeners that downloads were cancelled
    itemsToCancel.forEach(item => {
      item.status = 'pending'; // Reset status for UI update
      this.notifyProgress(item);
    });
    
    console.log(`[AudioDownloadService] Cancelled all downloads for ${reciter}`);
  }

  /**
   * Get download status for a surah
   */
  getDownloadStatus(surahNumber: number, reciter: string): DownloadItem | null {
    const downloadId = this.generateDownloadId(surahNumber, reciter);
    return this.downloadQueue.find(item => item.id === downloadId) || null;
  }

  /**
   * Get current download queue
   */
  getDownloadQueue(): DownloadItem[] {
    return [...this.downloadQueue];
  }

  /**
   * Check if a surah is downloaded
   */
  async isDownloaded(surahNumber: number, reciter: string): Promise<boolean> {
    await this.initialize();
    return this.downloadedMeta[reciter]?.surahs.includes(surahNumber) || false;
  }

  /**
   * Get local audio path if downloaded
   */
  async getLocalAudioPath(
    surahNumber: number,
    ayah: number,
    reciter: string
  ): Promise<string | null> {
    if (!(await this.isDownloaded(surahNumber, reciter))) {
      return null;
    }

    const localPath = this.getAyahFilePath(surahNumber, ayah, reciter);
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    
    return fileInfo.exists ? localPath : null;
  }

  /**
   * Get list of downloaded surahs for a reciter
   */
  async getDownloadedSurahs(reciter: string): Promise<number[]> {
    await this.initialize();
    return this.downloadedMeta[reciter]?.surahs || [];
  }

  /**
   * Get all reciters that have downloaded content
   */
  async getRecitersWithDownloads(): Promise<string[]> {
    await this.initialize();
    return Object.keys(this.downloadedMeta).filter(
      reciter => this.downloadedMeta[reciter]?.surahs.length > 0
    );
  }

  /**
   * Get storage size for a reciter
   */
  async getReciterStorageSize(reciter: string): Promise<number> {
    await this.initialize();
    return this.downloadedMeta[reciter]?.totalSize || 0;
  }

  /**
   * Delete a single surah's audio for a reciter
   */
  async deleteSurah(surahNumber: number, reciter: string): Promise<void> {
    await this.initialize();

    try {
      const surahInfo = SURAH_INFO.find(s => s.number === surahNumber);
      if (!surahInfo) {
        throw new Error(`Invalid surah number: ${surahNumber}`);
      }

      // Delete all ayah files for this surah
      let deletedSize = 0;
      for (let ayah = 1; ayah <= surahInfo.ayahs; ayah++) {
        const localPath = this.getAyahFilePath(surahNumber, ayah, reciter);
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists && 'size' in fileInfo && typeof fileInfo.size === 'number') {
          deletedSize += fileInfo.size;
        }
        await FileSystem.deleteAsync(localPath, { idempotent: true });
      }

      // Update metadata
      if (this.downloadedMeta[reciter]) {
        this.downloadedMeta[reciter].surahs = this.downloadedMeta[reciter].surahs.filter(
          s => s !== surahNumber
        );
        this.downloadedMeta[reciter].totalSize = Math.max(
          0,
          this.downloadedMeta[reciter].totalSize - deletedSize
        );
        
        // Clean up if no surahs left
        if (this.downloadedMeta[reciter].surahs.length === 0) {
          delete this.downloadedMeta[reciter];
        }
        
        await this.saveMeta();
      }

      // Remove from queue if present
      const downloadId = this.generateDownloadId(surahNumber, reciter);
      this.downloadQueue = this.downloadQueue.filter(item => item.id !== downloadId);
      await this.saveQueue();

      console.log(`[AudioDownloadService] Deleted surah ${surahNumber} for ${reciter}`);
    } catch (error) {
      console.error('[AudioDownloadService] Failed to delete surah:', error);
      throw error;
    }
  }

  /**
   * Delete all audio for a reciter
   */
  async deleteReciterAudio(reciter: string): Promise<void> {
    await this.initialize();

    try {
      // Stop any active downloads first
      this.shouldStopProcessing = true;
      
      const reciterDir = this.getReciterDir(reciter);
      await FileSystem.deleteAsync(reciterDir, { idempotent: true });

      delete this.downloadedMeta[reciter];
      await this.saveMeta();

      // Remove from queue
      this.downloadQueue = this.downloadQueue.filter(
        item => item.reciter !== reciter
      );
      await this.saveQueue();
      
      console.log(`[AudioDownloadService] Deleted all audio for ${reciter}`);
    } catch (error) {
      console.error('[AudioDownloadService] Failed to delete reciter audio:', error);
      throw error;
    }
  }

  /**
   * Subscribe to progress updates
   */
  onProgress(callback: ProgressCallback): () => void {
    this.progressListeners.add(callback);
    return () => this.progressListeners.delete(callback);
  }

  /**
   * Subscribe to completion events
   */
  onComplete(callback: CompleteCallback): () => void {
    this.completeListeners.add(callback);
    return () => this.completeListeners.delete(callback);
  }

  /**
   * Subscribe to error events
   */
  onError(callback: ErrorCallback): () => void {
    this.errorListeners.add(callback);
    return () => this.errorListeners.delete(callback);
  }
}

// Export singleton instance
export const audioDownloadService = AudioDownloadServiceImpl.getInstance();

// Export class for testing
export { AudioDownloadServiceImpl };
