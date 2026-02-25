/**
 * QuranImageService
 * 
 * Manages Quran Mushaf page images:
 * - Pages 1-5 are bundled locally (Al-Fatihah + early Al-Baqarah)
 * - Pages 6-604 are downloaded from Cloudflare R2 on first Mushaf access
 * - All downloaded pages are stored in documentDirectory for offline use
 */

import * as FileSystem from 'expo-file-system/legacy';
import { NativeModules, Platform } from 'react-native';

const { ZipExtractor } = NativeModules;

// ====== CONFIGURATION ======
// TODO: Replace with your actual Cloudflare R2 public URL after setup
const CDN_BASE_URL = 'https://pub-5d133ff4b49a4efc8e066ad61b59a6d1.r2.dev';
const QURAN_PAGES_ZIP_URL = `${CDN_BASE_URL}/quran-pages-v1.zip`;
const MANIFEST_URL = `${CDN_BASE_URL}/manifest.json`;

const QURAN_DIR = `${FileSystem.documentDirectory}quran-pages/`;
const MANIFEST_PATH = `${QURAN_DIR}manifest.json`;
const TOTAL_PAGES = 604;
const BUNDLED_PAGES = 5; // Pages 1-5 are bundled with the app

// Bundled pages (Al-Fatihah + early Al-Baqarah) — always available
const bundledImages: { [key: number]: any } = {
    1: require('../../assets/images/quran-bundled/1.webp'),
    2: require('../../assets/images/quran-bundled/2.webp'),
    3: require('../../assets/images/quran-bundled/3.webp'),
    4: require('../../assets/images/quran-bundled/4.webp'),
    5: require('../../assets/images/quran-bundled/5.webp'),
};

export type DownloadStatus = 'not_started' | 'downloading' | 'complete' | 'error';

export interface DownloadProgress {
    status: DownloadStatus;
    phase: 'download' | 'extract' | 'idle'; // Current phase
    progress: number; // 0-1
    downloadedBytes: number;
    totalBytes: number;
    error?: string;
}

type ProgressListener = (progress: DownloadProgress) => void;

class QuranImageServiceImpl {
    private static instance: QuranImageServiceImpl;
    private initialized = false;
    private pagesAvailable = false;
    private downloadProgress: DownloadProgress = {
        status: 'not_started',
        phase: 'idle',
        progress: 0,
        downloadedBytes: 0,
        totalBytes: 0,
    };
    private listeners: Set<ProgressListener> = new Set();
    private downloadResumable: FileSystem.DownloadResumable | null = null;

    private constructor() { }

    static getInstance(): QuranImageServiceImpl {
        if (!QuranImageServiceImpl.instance) {
            QuranImageServiceImpl.instance = new QuranImageServiceImpl();
        }
        return QuranImageServiceImpl.instance;
    }

    /**
     * Initialize the service — check if pages are already downloaded
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Ensure quran-pages directory exists
            const dirInfo = await FileSystem.getInfoAsync(QURAN_DIR);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(QURAN_DIR, { intermediates: true });
            }

            // Check if pages are already downloaded by checking manifest
            const manifestInfo = await FileSystem.getInfoAsync(MANIFEST_PATH);
            if (manifestInfo.exists) {
                // Verify a few random pages exist to confirm integrity
                const spotCheck = [6, 100, 300, 604];
                let allExist = true;
                for (const page of spotCheck) {
                    const pageInfo = await FileSystem.getInfoAsync(`${QURAN_DIR}${page}.webp`);
                    if (!pageInfo.exists) {
                        allExist = false;
                        break;
                    }
                }
                this.pagesAvailable = allExist;
                if (allExist) {
                    this.downloadProgress = {
                        status: 'complete',
                        phase: 'idle',
                        progress: 1,
                        downloadedBytes: 0,
                        totalBytes: 0,
                    };
                }
            }
        } catch (error) {
            console.warn('[QuranImageService] Init error:', error);
        }

        this.initialized = true;
    }

    /**
     * Check if all Quran pages are downloaded and available
     */
    arePagesDownloaded(): boolean {
        return this.pagesAvailable;
    }

    /**
     * Get the image source for a specific page number (1-604)
     * Returns require() for bundled pages, { uri } for downloaded pages
     */
    getPageSource(pageNum: number): any {
        // Bundled pages always available
        if (pageNum >= 1 && pageNum <= BUNDLED_PAGES) {
            return bundledImages[pageNum];
        }

        // Downloaded pages
        if (this.pagesAvailable) {
            return { uri: `${QURAN_DIR}${pageNum}.webp` };
        }

        // Pages not yet downloaded — return null (caller should show download prompt)
        return null;
    }

    /**
     * Get current download progress
     */
    getProgress(): DownloadProgress {
        return { ...this.downloadProgress };
    }

    /**
     * Subscribe to download progress updates
     */
    addProgressListener(listener: ProgressListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        const progress = { ...this.downloadProgress };
        this.listeners.forEach(listener => listener(progress));
    }

    /**
     * Download all Quran page images from R2 as a single zip file
     * Downloads one zip (~68 MB) and extracts locally — much faster than 604 individual requests
     */
    async downloadPages(): Promise<void> {
        if (this.pagesAvailable) return;
        if (this.downloadProgress.status === 'downloading') return;

        const zipPath = `${QURAN_DIR}quran-pages-v1.zip`;

        try {
            this.downloadProgress = {
                status: 'downloading',
                phase: 'download',
                progress: 0,
                downloadedBytes: 0,
                totalBytes: 0,
            };
            this.notifyListeners();

            // Ensure directory exists
            const dirInfo = await FileSystem.getInfoAsync(QURAN_DIR);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(QURAN_DIR, { intermediates: true });
            }

            // Phase 1: Download zip with progress tracking (~68 MB)
            console.log('[QuranImageService] Downloading zip from R2...');
            this.downloadResumable = FileSystem.createDownloadResumable(
                QURAN_PAGES_ZIP_URL,
                zipPath,
                {},
                (downloadProgress) => {
                    const progress = downloadProgress.totalBytesExpectedToWrite > 0
                        ? downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite
                        : 0;
                    this.downloadProgress = {
                        status: 'downloading',
                        phase: 'download',
                        progress: progress * 0.9, // Download is 90% of total progress
                        downloadedBytes: downloadProgress.totalBytesWritten,
                        totalBytes: downloadProgress.totalBytesExpectedToWrite,
                    };
                    this.notifyListeners();
                }
            );

            const downloadResult = await this.downloadResumable.downloadAsync();

            // If downloadResult is undefined, the download was paused/cancelled
            if (!downloadResult) {
                // cancelDownload() sets downloadResumable to null
                console.log('[QuranImageService] Download was cancelled');
                return; // Exit silently — cancelDownload() already reset the state
            }

            if (downloadResult.status !== 200) {
                throw new Error(`Download failed with status: ${downloadResult.status}`);
            }
            this.downloadResumable = null;

            // Phase 2: Extract zip using native code (no JS memory pressure)
            console.log('[QuranImageService] Extracting zip natively...');
            this.downloadProgress = {
                status: 'downloading',
                phase: 'extract',
                progress: 0.9,
                downloadedBytes: this.downloadProgress.downloadedBytes,
                totalBytes: this.downloadProgress.totalBytes,
            };
            this.notifyListeners();

            // Native extraction — happens entirely in Java, no JS memory used
            // The native module strips directory prefixes and extracts flat into destDir
            const extractedCount = await ZipExtractor.unzip(zipPath, QURAN_DIR);
            console.log('[QuranImageService] Extracted', extractedCount, 'files');

            // Clean up zip file to save storage
            await FileSystem.deleteAsync(zipPath, { idempotent: true });

            // Write manifest to mark download as complete
            await FileSystem.writeAsStringAsync(
                MANIFEST_PATH,
                JSON.stringify({ version: 1, pages: TOTAL_PAGES, downloadedAt: Date.now() })
            );

            this.pagesAvailable = true;
            this.downloadProgress = {
                status: 'complete',
                phase: 'idle',
                progress: 1,
                downloadedBytes: this.downloadProgress.downloadedBytes,
                totalBytes: this.downloadProgress.totalBytes,
            };
            this.notifyListeners();
            console.log('[QuranImageService] Extraction complete');
        } catch (error: any) {
            // Clean up partial zip on error
            await FileSystem.deleteAsync(zipPath, { idempotent: true }).catch(() => { });

            this.downloadProgress = {
                status: 'error',
                phase: 'idle',
                progress: this.downloadProgress.progress,
                downloadedBytes: this.downloadProgress.downloadedBytes,
                totalBytes: this.downloadProgress.totalBytes,
                error: error.message || 'Download failed',
            };
            this.notifyListeners();
            throw error;
        }
    }

    /**
     * Cancel an in-progress download
     */
    cancelDownload(): void {
        if (this.downloadResumable) {
            this.downloadResumable.pauseAsync();
            this.downloadResumable = null;
        }
        this.downloadProgress = {
            status: 'not_started',
            phase: 'idle',
            progress: 0,
            downloadedBytes: 0,
            totalBytes: 0,
        };
        this.notifyListeners();
    }

    /**
     * Delete all downloaded pages to free storage
     */
    async deleteDownloadedPages(): Promise<void> {
        try {
            await FileSystem.deleteAsync(QURAN_DIR, { idempotent: true });
            this.pagesAvailable = false;
            this.downloadProgress = {
                status: 'not_started',
                phase: 'idle',
                progress: 0,
                downloadedBytes: 0,
                totalBytes: 0,
            };
            this.notifyListeners();
        } catch (error) {
            console.error('[QuranImageService] Delete error:', error);
        }
    }

    /**
     * Get total storage used by downloaded Quran pages
     */
    async getStorageUsed(): Promise<number> {
        try {
            const dirInfo = await FileSystem.getInfoAsync(QURAN_DIR);
            if (!dirInfo.exists) return 0;

            // Read directory and sum file sizes
            const files = await FileSystem.readDirectoryAsync(QURAN_DIR);
            let totalSize = 0;
            for (const file of files) {
                const info = await FileSystem.getInfoAsync(`${QURAN_DIR}${file}`);
                if (info.exists && 'size' in info) {
                    totalSize += info.size || 0;
                }
            }
            return totalSize;
        } catch {
            return 0;
        }
    }
}

export const quranImageService = QuranImageServiceImpl.getInstance();
