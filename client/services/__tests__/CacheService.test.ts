/**
 * Property-Based Tests for CacheService
 * 
 * **Property 4: Audio Caching Round-Trip**
 * *For any* downloaded audio file, saving to cache and retrieving SHALL return 
 * the same file path, and the file SHALL exist at that path.
 * 
 * **Validates: Requirements 3.4**
 * 
 * Feature: quran-video-generator, Property 4: Audio Caching Round-Trip
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock expo-file-system/legacy for Node.js testing environment
const mockFileSystem: Record<string, { exists: boolean; content?: string; size?: number }> = {};

vi.mock('expo-file-system/legacy', () => ({
  cacheDirectory: '/mock/cache/',
  getInfoAsync: vi.fn(async (path: string) => {
    const file = mockFileSystem[path];
    return {
      exists: file?.exists ?? false,
      size: file?.size ?? 0,
    };
  }),
  makeDirectoryAsync: vi.fn(async (path: string) => {
    mockFileSystem[path] = { exists: true };
  }),
  copyAsync: vi.fn(async ({ from, to }: { from: string; to: string }) => {
    if (!mockFileSystem[from]?.exists) {
      throw new Error(`Source file does not exist: ${from}`);
    }
    mockFileSystem[to] = { 
      exists: true, 
      content: mockFileSystem[from].content,
      size: mockFileSystem[from].size 
    };
  }),
  deleteAsync: vi.fn(async (path: string) => {
    // Delete the directory and all files within it
    Object.keys(mockFileSystem).forEach(key => {
      if (key.startsWith(path)) {
        delete mockFileSystem[key];
      }
    });
  }),
  readDirectoryAsync: vi.fn(async (path: string) => {
    return Object.keys(mockFileSystem)
      .filter(key => key.startsWith(path) && key !== path)
      .map(key => key.replace(path, ''));
  }),
}));

// Import after mocking
import { CacheServiceImpl } from '../CacheService';

describe('CacheService', () => {
  let cacheService: CacheServiceImpl;

  beforeEach(() => {
    // Clear mock file system
    Object.keys(mockFileSystem).forEach(key => delete mockFileSystem[key]);
    // Create a fresh instance for each test
    cacheService = new CacheServiceImpl();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 4: Audio Caching Round-Trip', () => {
    /**
     * Property: For any valid cache key and source file, 
     * saving to cache and retrieving SHALL return the same file path,
     * and the file SHALL exist at that path.
     * 
     * **Validates: Requirements 3.4**
     */
    it('should satisfy round-trip property for any valid cache key', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid cache keys (alphanumeric with some special chars)
          fc.stringMatching(/^[a-zA-Z0-9_.-]{1,50}$/),
          // Generate mock file content
          fc.string({ minLength: 1, maxLength: 100 }),
          async (cacheKey, fileContent) => {
            // Setup: Create a mock source file
            const sourcePath = `/mock/source/${cacheKey}_source.mp3`;
            mockFileSystem[sourcePath] = { 
              exists: true, 
              content: fileContent,
              size: fileContent.length 
            };

            // Act: Save to cache
            const cachedPath = await cacheService.set(cacheKey, sourcePath);

            // Assert 1: The returned path should be retrievable
            const retrievedPath = await cacheService.get(cacheKey);
            expect(retrievedPath).toBe(cachedPath);

            // Assert 2: The file should exist at the cached path
            const exists = await cacheService.exists(cacheKey);
            expect(exists).toBe(true);

            // Assert 3: The cached file should have the same content
            expect(mockFileSystem[cachedPath]?.content).toBe(fileContent);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any cache key that hasn't been set,
     * get() SHALL return null and exists() SHALL return false.
     */
    it('should return null for non-existent cache keys', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.stringMatching(/^[a-zA-Z0-9_.-]{1,50}$/),
          async (cacheKey) => {
            // Act & Assert: Non-existent key should return null
            const retrievedPath = await cacheService.get(cacheKey);
            expect(retrievedPath).toBeNull();

            const exists = await cacheService.exists(cacheKey);
            expect(exists).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: After clearAll(), all previously cached files should be gone.
     */
    it('should clear all cached files after clearAll()', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate multiple cache keys
          fc.array(
            fc.stringMatching(/^[a-zA-Z0-9]{1,20}$/),
            { minLength: 1, maxLength: 5 }
          ),
          async (cacheKeys) => {
            // Setup: Add files to cache
            for (const key of cacheKeys) {
              const sourcePath = `/mock/source/${key}_source.mp3`;
              mockFileSystem[sourcePath] = { exists: true, content: 'test', size: 4 };
              await cacheService.set(key, sourcePath);
            }

            // Act: Clear all cache
            await cacheService.clearAll();

            // Assert: All keys should no longer exist
            for (const key of cacheKeys) {
              const exists = await cacheService.exists(key);
              expect(exists).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('getCacheDir', () => {
    it('should return a valid cache directory path', () => {
      const cacheDir = cacheService.getCacheDir();
      expect(cacheDir).toBeDefined();
      expect(typeof cacheDir).toBe('string');
      expect(cacheDir.length).toBeGreaterThan(0);
    });
  });
});
