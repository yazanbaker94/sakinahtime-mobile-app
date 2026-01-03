/**
 * VideoAudioService
 * 
 * Handles downloading and caching verse audio for the video generator.
 * Uses everyayah.com API for audio files and CacheService for caching.
 * 
 * Requirements: 3.2, 3.4, 5.4
 */

import * as FileSystem from 'expo-file-system/legacy';
import { cacheService } from './CacheService';
import { ffmpegService } from './ffmpegService';

/**
 * Reciter configuration with directory mapping for everyayah.com
 */
export interface Reciter {
  id: string;
  name: string;
  nameAr: string;
  directory: string;
}

/**
 * Available reciters with their everyayah.com directory mappings
 */
export const RECITERS: Reciter[] = [
  {
    id: 'alafasy',
    name: 'Mishary Rashid Alafasy',
    nameAr: 'مشاري راشد العفاسي',
    directory: 'Alafasy_128kbps',
  },
  {
    id: 'abdulbasit_mujawwad',
    name: 'Abdul Basit (Mujawwad)',
    nameAr: 'عبد الباسط عبد الصمد',
    directory: 'Abdul_Basit_Mujawwad_128kbps',
  },
  {
    id: 'abdulbasit_murattal',
    name: 'Abdul Basit (Murattal)',
    nameAr: 'عبد الباسط عبد الصمد',
    directory: 'Abdul_Basit_Murattal_192kbps',
  },
  {
    id: 'husary',
    name: 'Mahmoud Khalil Al-Husary',
    nameAr: 'محمود خليل الحصري',
    directory: 'Husary_128kbps',
  },
  {
    id: 'minshawi_mujawwad',
    name: 'Mohamed Siddiq Al-Minshawi (Mujawwad)',
    nameAr: 'محمد صديق المنشاوي',
    directory: 'Minshawy_Mujawwad_192kbps',
  },
  {
    id: 'sudais',
    name: 'Abdur-Rahman As-Sudais',
    nameAr: 'عبد الرحمن السديس',
    directory: 'Abdurrahmaan_As-Sudais_192kbps',
  },
  {
    id: 'shuraym',
    name: 'Saud Al-Shuraim',
    nameAr: 'سعود الشريم',
    directory: 'Saood_ash-Shuraym_128kbps',
  },
  {
    id: 'ghamdi',
    name: 'Saad Al-Ghamdi',
    nameAr: 'سعد الغامدي',
    directory: 'Ghamadi_40kbps',
  },
];

/**
 * Result of audio download operation
 */
export interface AudioResult {
  path: string;
  duration: number;
  cached: boolean;
}

/**
 * Get reciter by ID
 */
export function getReciterById(reciterId: string): Reciter | undefined {
  return RECITERS.find(r => r.id === reciterId);
}

/**
 * Get reciter directory for everyayah.com URL
 */
export function getReciterDirectory(reciterId: string): string {
  const reciter = getReciterById(reciterId);
  if (!reciter) {
    throw new Error(`Unknown reciter: ${reciterId}`);
  }
  return reciter.directory;
}

/**
 * Build audio URL for a specific verse from everyayah.com
 * 
 * URL format: https://everyayah.com/data/{reciterDirectory}/{surah:03d}{ayah:03d}.mp3
 * 
 * @param surah - Surah number (1-114)
 * @param ayah - Ayah number (1-286 depending on surah)
 * @param reciterId - Reciter ID from RECITERS list
 * @returns Full URL to the audio file
 * 
 * Requirements: 3.2
 */
export function buildAudioUrl(surah: number, ayah: number, reciterId: string): string {
  const directory = getReciterDirectory(reciterId);
  const surahPadded = String(surah).padStart(3, '0');
  const ayahPadded = String(ayah).padStart(3, '0');
  return `https://everyayah.com/data/${directory}/${surahPadded}${ayahPadded}.mp3`;
}

/**
 * Generate cache key for audio file
 */
export function getAudioCacheKey(surah: number, ayah: number, reciterId: string): string {
  return `audio_${reciterId}_${surah}_${ayah}.mp3`;
}


/**
 * VideoAudioService class
 * 
 * Handles audio operations for video generation including:
 * - Downloading audio from everyayah.com
 * - Caching downloaded audio
 * - Getting audio duration
 * - Concatenating multiple audio files
 */
class VideoAudioServiceImpl {
  private static instance: VideoAudioServiceImpl;
  private downloadRetries = 3;
  private downloadTimeout = 30000; // 30 seconds

  static getInstance(): VideoAudioServiceImpl {
    if (!VideoAudioServiceImpl.instance) {
      VideoAudioServiceImpl.instance = new VideoAudioServiceImpl();
    }
    return VideoAudioServiceImpl.instance;
  }

  /**
   * Download audio for a single verse with caching
   * 
   * @param surah - Surah number (1-114)
   * @param ayah - Ayah number
   * @param reciterId - Reciter ID
   * @returns AudioResult with path, duration, and cached status
   * 
   * Requirements: 3.2, 3.4
   */
  async downloadAudio(
    surah: number,
    ayah: number,
    reciterId: string
  ): Promise<AudioResult> {
    const cacheKey = getAudioCacheKey(surah, ayah, reciterId);
    
    // Check cache first
    const cachedPath = await cacheService.get(cacheKey);
    if (cachedPath) {
      const duration = await this.getAudioDuration(cachedPath);
      return {
        path: cachedPath,
        duration,
        cached: true,
      };
    }

    // Download from everyayah.com
    const url = buildAudioUrl(surah, ayah, reciterId);
    const tempPath = `${cacheService.getCacheDir()}temp_${Date.now()}_${cacheKey}`;

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.downloadRetries; attempt++) {
      try {
        console.log(`[VideoAudioService] Downloading ${url} (attempt ${attempt}/${this.downloadRetries})`);
        
        const downloadResult = await FileSystem.downloadAsync(url, tempPath);
        
        if (downloadResult.status !== 200) {
          throw new Error(`Download failed with status ${downloadResult.status}`);
        }

        // Save to cache
        const cachedFilePath = await cacheService.set(cacheKey, tempPath);
        
        // Clean up temp file
        try {
          await FileSystem.deleteAsync(tempPath, { idempotent: true });
        } catch {
          // Ignore cleanup errors
        }

        // Get duration
        const duration = await this.getAudioDuration(cachedFilePath);

        return {
          path: cachedFilePath,
          duration,
          cached: false,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[VideoAudioService] Download attempt ${attempt} failed:`, lastError.message);
        
        // Exponential backoff
        if (attempt < this.downloadRetries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw new Error(`Failed to download audio after ${this.downloadRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Download audio for a verse range
   * 
   * @param surah - Surah number
   * @param ayahStart - Starting ayah number
   * @param ayahEnd - Ending ayah number
   * @param reciterId - Reciter ID
   * @returns AudioResult with concatenated audio path
   * 
   * Requirements: 3.2, 3.4, 5.4
   */
  async downloadAudioRange(
    surah: number,
    ayahStart: number,
    ayahEnd: number,
    reciterId: string
  ): Promise<AudioResult> {
    // Download all verses
    const audioPaths: string[] = [];
    let totalDuration = 0;
    let allCached = true;

    for (let ayah = ayahStart; ayah <= ayahEnd; ayah++) {
      const result = await this.downloadAudio(surah, ayah, reciterId);
      audioPaths.push(result.path);
      totalDuration += result.duration;
      if (!result.cached) {
        allCached = false;
      }
    }

    // If only one verse, return it directly
    if (audioPaths.length === 1) {
      return {
        path: audioPaths[0],
        duration: totalDuration,
        cached: allCached,
      };
    }

    // Concatenate multiple audio files
    const concatenatedPath = await this.concatenateAudio(audioPaths);
    const finalDuration = await this.getAudioDuration(concatenatedPath);

    return {
      path: concatenatedPath,
      duration: finalDuration,
      cached: false, // Concatenated file is always new
    };
  }

  /**
   * Get cached audio if available
   * 
   * @param surah - Surah number
   * @param ayah - Ayah number
   * @param reciterId - Reciter ID
   * @returns Cached file path or null
   */
  async getCachedAudio(
    surah: number,
    ayah: number,
    reciterId: string
  ): Promise<string | null> {
    const cacheKey = getAudioCacheKey(surah, ayah, reciterId);
    return cacheService.get(cacheKey);
  }

  /**
   * Get audio duration in seconds using FFprobe
   * 
   * @param audioPath - Path to audio file
   * @returns Duration in seconds
   * 
   * Requirements: 5.4
   */
  async getAudioDuration(audioPath: string): Promise<number> {
    try {
      const duration = await ffmpegService.getAudioDuration(audioPath);
      return duration;
    } catch (error) {
      console.error('[VideoAudioService] Failed to get audio duration:', error);
      return 0;
    }
  }

  /**
   * Concatenate multiple audio files into one
   * 
   * Uses FFmpeg concat filter to join audio files seamlessly.
   * 
   * @param audioPaths - Array of audio file paths to concatenate
   * @returns Path to concatenated audio file
   * 
   * Requirements: 5.4
   */
  async concatenateAudio(audioPaths: string[]): Promise<string> {
    if (audioPaths.length === 0) {
      throw new Error('No audio files to concatenate');
    }

    if (audioPaths.length === 1) {
      return audioPaths[0];
    }

    const outputPath = `${cacheService.getCacheDir()}concat_${Date.now()}.mp3`;

    // Create concat file list
    const concatListPath = `${cacheService.getCacheDir()}concat_list_${Date.now()}.txt`;
    const concatListContent = audioPaths.map(p => `file '${p}'`).join('\n');
    
    try {
      await FileSystem.writeAsStringAsync(concatListPath, concatListContent);

      // Use FFmpeg concat demuxer
      const command = `-f concat -safe 0 -i "${concatListPath}" -c copy -y "${outputPath}"`;
      
      const result = await ffmpegService.execute(command);

      if (!result.success) {
        throw new Error(`FFmpeg concat failed: ${result.error}`);
      }

      return outputPath;
    } finally {
      // Clean up concat list file
      try {
        await FileSystem.deleteAsync(concatListPath, { idempotent: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Helper function for delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const videoAudioService = VideoAudioServiceImpl.getInstance();

// Export class for testing
export { VideoAudioServiceImpl };
