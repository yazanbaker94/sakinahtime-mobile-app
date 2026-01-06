/**
 * Property-based tests for CustomDuaService
 * 
 * Feature: dua-collection
 * Tests custom dua persistence and deletion
 */

import * as fc from 'fast-check';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomDuaService } from '../CustomDuaService';

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

// Arbitrary for valid custom dua input
const customDuaInputArb = fc.record({
  textAr: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  transliteration: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  translation: fc.string({ minLength: 1, maxLength: 200 }), // Required, non-empty
  notes: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
});

describe('CustomDuaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    CustomDuaService.clearCache();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
  });

  /**
   * Property 7: Custom Dua Persistence Round-Trip
   * For any valid custom dua (with required translation field), creating the dua
   * and then retrieving it by ID SHALL return a dua with equivalent content.
   * 
   * Validates: Requirements 5.2, 5.6
   */
  describe('Property 7: Custom Dua Persistence Round-Trip', () => {
    it('creating and retrieving custom dua preserves data', async () => {
      let savedData: string | null = null;
      mockAsyncStorage.setItem.mockImplementation(async (_key: string, value: string) => {
        savedData = value;
      });
      mockAsyncStorage.getItem.mockImplementation(async () => savedData);

      const input = {
        textAr: 'اللهم اغفر لي',
        transliteration: 'Allahumma-ghfir li',
        translation: 'O Allah, forgive me',
        notes: 'Personal dua',
      };

      const created = await CustomDuaService.create(input);
      CustomDuaService.clearCache();

      const retrieved = await CustomDuaService.getById(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.textAr).toBe(input.textAr);
      expect(retrieved!.transliteration).toBe(input.transliteration);
      expect(retrieved!.translation).toBe(input.translation);
      expect(retrieved!.notes).toBe(input.notes);
    });

    it('property: for any valid custom dua, round-trip preserves content', async () => {
      await fc.assert(
        fc.asyncProperty(
          customDuaInputArb,
          async (input) => {
            // Reset state
            CustomDuaService.clearCache();
            let savedData: string | null = null;
            mockAsyncStorage.setItem.mockImplementation(async (_key: string, value: string) => {
              savedData = value;
            });
            mockAsyncStorage.getItem.mockImplementation(async () => savedData);

            // Create
            const created = await CustomDuaService.create(input);

            // Clear cache to force reload
            CustomDuaService.clearCache();

            // Retrieve
            const retrieved = await CustomDuaService.getById(created.id);

            if (!retrieved) return false;

            // Compare content (trimmed)
            const expectedTextAr = input.textAr?.trim() || undefined;
            const expectedTranslit = input.transliteration?.trim() || undefined;
            const expectedTranslation = input.translation.trim();
            const expectedNotes = input.notes?.trim() || undefined;

            return (
              retrieved.translation === expectedTranslation &&
              retrieved.textAr === expectedTextAr &&
              retrieved.transliteration === expectedTranslit &&
              retrieved.notes === expectedNotes
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Custom Dua Deletion Removes From Storage
   * For any custom dua that exists in storage, deleting it SHALL result in
   * the dua no longer being retrievable, and the total count SHALL decrease by 1.
   * 
   * Validates: Requirements 5.5
   */
  describe('Property 8: Custom Dua Deletion Removes From Storage', () => {
    it('deleting custom dua removes it from storage', async () => {
      let savedData: string | null = null;
      mockAsyncStorage.setItem.mockImplementation(async (_key: string, value: string) => {
        savedData = value;
      });
      mockAsyncStorage.getItem.mockImplementation(async () => savedData);

      // Create a dua
      const created = await CustomDuaService.create({
        translation: 'Test dua for deletion',
      });

      // Verify it exists
      expect(await CustomDuaService.getById(created.id)).not.toBeNull();
      const countBefore = await CustomDuaService.getCount();

      // Delete it
      await CustomDuaService.delete(created.id);

      // Verify it's gone
      expect(await CustomDuaService.getById(created.id)).toBeNull();
      const countAfter = await CustomDuaService.getCount();
      expect(countAfter).toBe(countBefore - 1);
    });

    it('property: deletion removes dua and decreases count by 1', async () => {
      await fc.assert(
        fc.asyncProperty(
          customDuaInputArb,
          async (input) => {
            // Reset state
            CustomDuaService.clearCache();
            let savedData: string | null = null;
            mockAsyncStorage.setItem.mockImplementation(async (_key: string, value: string) => {
              savedData = value;
            });
            mockAsyncStorage.getItem.mockImplementation(async () => savedData);

            // Create
            const created = await CustomDuaService.create(input);
            const countBefore = await CustomDuaService.getCount();

            // Delete
            await CustomDuaService.delete(created.id);

            // Verify removal
            const retrieved = await CustomDuaService.getById(created.id);
            const countAfter = await CustomDuaService.getCount();

            return retrieved === null && countAfter === countBefore - 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('deleting non-existent dua throws error', async () => {
      await expect(CustomDuaService.delete('non-existent-id')).rejects.toThrow('Custom dua not found');
    });
  });

  describe('Basic operations', () => {
    it('getAll returns empty array when no custom duas', async () => {
      const duas = await CustomDuaService.getAll();
      expect(duas).toEqual([]);
    });

    it('create requires translation', async () => {
      await expect(CustomDuaService.create({
        translation: '',
      })).rejects.toThrow('Translation is required');
    });

    it('create generates unique IDs', async () => {
      let savedData: string | null = null;
      mockAsyncStorage.setItem.mockImplementation(async (_key: string, value: string) => {
        savedData = value;
      });
      mockAsyncStorage.getItem.mockImplementation(async () => savedData);

      const dua1 = await CustomDuaService.create({ translation: 'Dua 1' });
      const dua2 = await CustomDuaService.create({ translation: 'Dua 2' });

      expect(dua1.id).not.toBe(dua2.id);
    });

    it('update modifies existing dua', async () => {
      let savedData: string | null = null;
      mockAsyncStorage.setItem.mockImplementation(async (_key: string, value: string) => {
        savedData = value;
      });
      mockAsyncStorage.getItem.mockImplementation(async () => savedData);

      const created = await CustomDuaService.create({ translation: 'Original' });
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updated = await CustomDuaService.update(created.id, { translation: 'Updated' });

      expect(updated.translation).toBe('Updated');
      expect(updated.updatedAt).toBeGreaterThanOrEqual(created.updatedAt);
    });

    it('clearAll removes all custom duas', async () => {
      let savedData: string | null = null;
      mockAsyncStorage.setItem.mockImplementation(async (_key: string, value: string) => {
        savedData = value;
      });
      mockAsyncStorage.getItem.mockImplementation(async () => savedData);

      await CustomDuaService.create({ translation: 'Dua 1' });
      await CustomDuaService.create({ translation: 'Dua 2' });
      await CustomDuaService.clearAll();

      const count = await CustomDuaService.getCount();
      expect(count).toBe(0);
    });
  });
});
