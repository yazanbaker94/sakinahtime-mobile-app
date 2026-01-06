/**
 * Property-based tests for DuaFavoritesService
 * 
 * Feature: dua-collection
 * Tests favorites persistence and toggle consistency
 */

import * as fc from 'fast-check';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DuaFavoritesService } from '../DuaFavoritesService';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

const mockAsyncStorage = AsyncStorage as {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
};

describe('DuaFavoritesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    DuaFavoritesService.clearCache();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
  });

  /**
   * Property 6: Favorites Persistence Round-Trip
   * For any set of favorite dua IDs, saving to storage and then loading from storage
   * SHALL return an equivalent set of favorites (same dua IDs, order may differ).
   * 
   * Validates: Requirements 4.5, 4.6
   */
  describe('Property 6: Favorites Persistence Round-Trip', () => {
    it('adding and retrieving favorites preserves data', async () => {
      const duaId = 'test-dua-1';
      
      // Setup mock to return what was saved
      let savedData: string | null = null;
      mockAsyncStorage.setItem.mockImplementation(async (_key: string, value: string) => {
        savedData = value;
      });
      mockAsyncStorage.getItem.mockImplementation(async () => savedData);

      // Add favorite
      await DuaFavoritesService.addFavorite(duaId);
      DuaFavoritesService.clearCache();

      // Retrieve favorites
      const favorites = await DuaFavoritesService.getFavorites();
      
      expect(favorites.length).toBe(1);
      expect(favorites[0].duaId).toBe(duaId);
    });

    it('property: for any set of dua IDs, round-trip preserves all IDs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 10 }),
          async (duaIds) => {
            // Reset state
            DuaFavoritesService.clearCache();
            let savedData: string | null = null;
            mockAsyncStorage.setItem.mockImplementation(async (_key: string, value: string) => {
              savedData = value;
            });
            mockAsyncStorage.getItem.mockImplementation(async () => savedData);

            // Add all favorites
            const uniqueIds = [...new Set(duaIds)];
            for (const id of uniqueIds) {
              await DuaFavoritesService.addFavorite(id);
            }

            // Clear cache to force reload from storage
            DuaFavoritesService.clearCache();

            // Retrieve and verify
            const retrievedIds = await DuaFavoritesService.getFavoriteIds();
            const retrievedSet = new Set(retrievedIds);
            const originalSet = new Set(uniqueIds);

            // Same size
            if (retrievedSet.size !== originalSet.size) return false;

            // Same elements
            for (const id of originalSet) {
              if (!retrievedSet.has(id)) return false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Favorites Toggle Consistency
   * For any dua ID, toggling favorite status SHALL change the isFavorite state:
   * if the dua was not favorited, it becomes favorited; if it was favorited, it becomes unfavorited.
   * The favorites list length SHALL change by exactly 1.
   * 
   * Validates: Requirements 4.1, 4.2
   */
  describe('Property 5: Favorites Toggle Consistency', () => {
    it('toggling adds when not favorited', async () => {
      let savedData: string | null = null;
      mockAsyncStorage.setItem.mockImplementation(async (_key: string, value: string) => {
        savedData = value;
      });
      mockAsyncStorage.getItem.mockImplementation(async () => savedData);

      const duaId = 'test-dua-toggle';
      
      // Initially not favorited
      const initialIsFav = await DuaFavoritesService.isFavorite(duaId);
      expect(initialIsFav).toBe(false);

      // Toggle should add
      const result = await DuaFavoritesService.toggleFavorite(duaId);
      expect(result).toBe(true);

      // Now should be favorited
      const afterToggle = await DuaFavoritesService.isFavorite(duaId);
      expect(afterToggle).toBe(true);
    });

    it('toggling removes when already favorited', async () => {
      let savedData: string | null = null;
      mockAsyncStorage.setItem.mockImplementation(async (_key: string, value: string) => {
        savedData = value;
      });
      mockAsyncStorage.getItem.mockImplementation(async () => savedData);

      const duaId = 'test-dua-toggle-2';
      
      // Add first
      await DuaFavoritesService.addFavorite(duaId);
      expect(await DuaFavoritesService.isFavorite(duaId)).toBe(true);

      // Toggle should remove
      const result = await DuaFavoritesService.toggleFavorite(duaId);
      expect(result).toBe(false);

      // Now should not be favorited
      expect(await DuaFavoritesService.isFavorite(duaId)).toBe(false);
    });

    it('property: toggle changes state and list length by 1', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.boolean(),
          async (duaId, startFavorited) => {
            // Reset state
            DuaFavoritesService.clearCache();
            let savedData: string | null = null;
            mockAsyncStorage.setItem.mockImplementation(async (_key: string, value: string) => {
              savedData = value;
            });
            mockAsyncStorage.getItem.mockImplementation(async () => savedData);

            // Setup initial state
            if (startFavorited) {
              await DuaFavoritesService.addFavorite(duaId);
            }

            const beforeLength = (await DuaFavoritesService.getFavorites()).length;
            const beforeIsFav = await DuaFavoritesService.isFavorite(duaId);

            // Toggle
            await DuaFavoritesService.toggleFavorite(duaId);

            const afterLength = (await DuaFavoritesService.getFavorites()).length;
            const afterIsFav = await DuaFavoritesService.isFavorite(duaId);

            // State should flip
            if (beforeIsFav === afterIsFav) return false;

            // Length should change by 1
            if (Math.abs(afterLength - beforeLength) !== 1) return false;

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Basic operations', () => {
    it('getFavorites returns empty array when no favorites', async () => {
      const favorites = await DuaFavoritesService.getFavorites();
      expect(favorites).toEqual([]);
    });

    it('addFavorite does not duplicate', async () => {
      let savedData: string | null = null;
      mockAsyncStorage.setItem.mockImplementation(async (_key: string, value: string) => {
        savedData = value;
      });
      mockAsyncStorage.getItem.mockImplementation(async () => savedData);

      await DuaFavoritesService.addFavorite('dua-1');
      await DuaFavoritesService.addFavorite('dua-1');

      const favorites = await DuaFavoritesService.getFavorites();
      expect(favorites.length).toBe(1);
    });

    it('clearAll removes all favorites', async () => {
      let savedData: string | null = null;
      mockAsyncStorage.setItem.mockImplementation(async (_key: string, value: string) => {
        savedData = value;
      });
      mockAsyncStorage.getItem.mockImplementation(async () => savedData);

      await DuaFavoritesService.addFavorite('dua-1');
      await DuaFavoritesService.addFavorite('dua-2');
      await DuaFavoritesService.clearAll();

      const favorites = await DuaFavoritesService.getFavorites();
      expect(favorites.length).toBe(0);
    });
  });
});
