/**
 * CacheService
 * 
 * Manages caching of audio files and generated assets for the video generator.
 * Uses expo-file-system for file operations.
 * 
 * Requirements: 3.4, 10.4
 */

import * as FileSystem from 'expo-file-system/legacy';

export interface CacheService {
  // Get cache directory path
  getCacheDir(): string;
  
  // Check if file exists in cache
  exists(key: string): Promise<boolean>;
  
  // Get cached file path
  get(key: string): Promise<string | null>;
  
  // Save file to cache
  set(key: string, sourcePath: string): Promise<string>;
  
  // Clear all cache
  clearAll(): Promise<void>;
  
  // Get cache size in bytes
  getCacheSize(): Promise<number>;
}

/**
 * CacheService implementation for managing cached files
 */
class CacheServiceImpl implements CacheService {
  private static instance: CacheServiceImpl;
  private cacheDir: string;
  private initialized = false;

  constructor() {
    this.cacheDir = `${FileSystem.cacheDirectory}video_generator/`;
  }

  static getInstance(): CacheServiceImpl {
    if (!CacheServiceImpl.instance) {
      CacheServiceImpl.instance = new CacheServiceImpl();
    }
    return CacheServiceImpl.instance;
  }

  /**
   * Ensure the cache directory exists
   */
  private async ensureCacheDir(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }
      this.initialized = true;
    } catch (error) {
      console.error('[CacheService] Failed to create cache directory:', error);
      throw error;
    }
  }

  /**
   * Get the cache directory path
   */
  getCacheDir(): string {
    return this.cacheDir;
  }

  /**
   * Generate a safe filename from a cache key
   */
  private keyToFilename(key: string): string {
    // Replace unsafe characters with underscores
    return key.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  /**
   * Get the full path for a cache key
   */
  private getFilePath(key: string): string {
    return `${this.cacheDir}${this.keyToFilename(key)}`;
  }

  /**
   * Check if a file exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.ensureCacheDir();
      const filePath = this.getFilePath(key);
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return fileInfo.exists;
    } catch (error) {
      console.error('[CacheService] Error checking existence:', error);
      return false;
    }
  }

  /**
   * Get cached file path if it exists
   */
  async get(key: string): Promise<string | null> {
    try {
      await this.ensureCacheDir();
      const filePath = this.getFilePath(key);
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists) {
        return filePath;
      }
      return null;
    } catch (error) {
      console.error('[CacheService] Error getting cached file:', error);
      return null;
    }
  }

  /**
   * Save a file to cache
   * @param key - Cache key for the file
   * @param sourcePath - Path to the source file to cache
   * @returns Path to the cached file
   */
  async set(key: string, sourcePath: string): Promise<string> {
    try {
      await this.ensureCacheDir();
      
      const destPath = this.getFilePath(key);
      
      // Check if source file exists
      const sourceInfo = await FileSystem.getInfoAsync(sourcePath);
      if (!sourceInfo.exists) {
        throw new Error(`Source file does not exist: ${sourcePath}`);
      }
      
      // Copy file to cache
      await FileSystem.copyAsync({
        from: sourcePath,
        to: destPath,
      });
      
      return destPath;
    } catch (error) {
      console.error('[CacheService] Error setting cache:', error);
      throw error;
    }
  }

  /**
   * Clear all cached files
   */
  async clearAll(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
      }
      this.initialized = false;
      console.log('[CacheService] Cache cleared');
    } catch (error) {
      console.error('[CacheService] Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Get total cache size in bytes
   */
  async getCacheSize(): Promise<number> {
    try {
      await this.ensureCacheDir();
      
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        return 0;
      }
      
      const files = await FileSystem.readDirectoryAsync(this.cacheDir);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = `${this.cacheDir}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists && 'size' in fileInfo && typeof fileInfo.size === 'number') {
          totalSize += fileInfo.size;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('[CacheService] Error getting cache size:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const cacheService = CacheServiceImpl.getInstance();

// Export class for testing
export { CacheServiceImpl };
