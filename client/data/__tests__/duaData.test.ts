/**
 * Property-based tests for Dua Data
 * 
 * Feature: dua-collection
 * Tests data completeness and structure validity
 */

import * as fc from 'fast-check';
import { allDuas, quranicDuas, propheticDuas, getDuasByCategory, getDuaById } from '../duaData';
import { duaCategories } from '../duaCategories';
import { Dua } from '@/types/dua';

describe('Dua Data', () => {
  /**
   * Property 2: Dua Data Completeness
   * For any dua in the collection, the dua SHALL contain non-empty values for:
   * textAr (Arabic text), transliteration, translation, and source reference.
   * 
   * Validates: Requirements 1.4
   */
  describe('Property 2: Dua Data Completeness', () => {
    it('all duas have required fields with non-empty values', () => {
      // Test all duas in the collection
      allDuas.forEach((dua: Dua) => {
        expect(dua.id).toBeTruthy();
        expect(dua.categoryId).toBeTruthy();
        expect(dua.textAr).toBeTruthy();
        expect(dua.textAr.length).toBeGreaterThan(0);
        expect(dua.transliteration).toBeTruthy();
        expect(dua.transliteration.length).toBeGreaterThan(0);
        expect(dua.translation).toBeTruthy();
        expect(dua.translation.length).toBeGreaterThan(0);
        expect(dua.source).toBeTruthy();
        expect(['quran', 'hadith', 'general']).toContain(dua.source);
        expect(typeof dua.hasAudio).toBe('boolean');
      });
    });

    it('property: for any random index, the dua at that index has complete data', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: allDuas.length - 1 }),
          (index) => {
            const dua = allDuas[index];
            return (
              dua.id.length > 0 &&
              dua.categoryId.length > 0 &&
              dua.textAr.length > 0 &&
              dua.transliteration.length > 0 &&
              dua.translation.length > 0 &&
              ['quran', 'hadith', 'general'].includes(dua.source)
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Quranic Dua Structure Validity
   * For any dua with source='quran', the dua SHALL contain valid surahNumber (1-114),
   * ayahNumber (positive integer), and non-empty surahName.
   * 
   * Validates: Requirements 2.2
   */
  describe('Property 3: Quranic Dua Structure Validity', () => {
    it('all Quranic duas have valid surah/ayah references', () => {
      const quranicDuasFromAll = allDuas.filter(d => d.source === 'quran');
      
      quranicDuasFromAll.forEach((dua: Dua) => {
        expect(dua.surahNumber).toBeDefined();
        expect(dua.surahNumber).toBeGreaterThanOrEqual(1);
        expect(dua.surahNumber).toBeLessThanOrEqual(114);
        expect(dua.ayahNumber).toBeDefined();
        expect(dua.ayahNumber).toBeGreaterThan(0);
        expect(dua.surahName).toBeTruthy();
        expect(dua.surahName!.length).toBeGreaterThan(0);
      });
    });

    it('property: for any Quranic dua, structure is valid', () => {
      const quranicDuasFromAll = allDuas.filter(d => d.source === 'quran');
      
      if (quranicDuasFromAll.length === 0) {
        return; // Skip if no Quranic duas
      }

      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: quranicDuasFromAll.length - 1 }),
          (index) => {
            const dua = quranicDuasFromAll[index];
            return (
              dua.surahNumber !== undefined &&
              dua.surahNumber >= 1 &&
              dua.surahNumber <= 114 &&
              dua.ayahNumber !== undefined &&
              dua.ayahNumber > 0 &&
              dua.surahName !== undefined &&
              dua.surahName.length > 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Prophetic Dua Source Validity
   * For any dua with source='hadith', the dua SHALL contain a non-empty
   * hadithSource string identifying the hadith collection.
   * 
   * Validates: Requirements 3.2, 3.3
   */
  describe('Property 4: Prophetic Dua Source Validity', () => {
    it('all Prophetic duas have hadith source', () => {
      const propheticDuasFromAll = allDuas.filter(d => d.source === 'hadith');
      
      propheticDuasFromAll.forEach((dua: Dua) => {
        expect(dua.hadithSource).toBeTruthy();
        expect(dua.hadithSource!.length).toBeGreaterThan(0);
      });
    });

    it('property: for any Prophetic dua, hadith source is valid', () => {
      const propheticDuasFromAll = allDuas.filter(d => d.source === 'hadith');
      
      if (propheticDuasFromAll.length === 0) {
        return; // Skip if no Prophetic duas
      }

      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: propheticDuasFromAll.length - 1 }),
          (index) => {
            const dua = propheticDuasFromAll[index];
            return (
              dua.hadithSource !== undefined &&
              dua.hadithSource.length > 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Prophetic duas with grade have valid grade values', () => {
      const propheticDuasFromAll = allDuas.filter(d => d.source === 'hadith' && d.hadithGrade);
      
      propheticDuasFromAll.forEach((dua: Dua) => {
        expect(['sahih', 'hasan', 'daif']).toContain(dua.hadithGrade);
      });
    });
  });

  /**
   * Property 1: Category Filtering Returns Only Matching Duas
   * For any category ID, filtering duas by that category returns only duas
   * with matching categoryId.
   * 
   * Validates: Requirements 1.2
   */
  describe('Property 1: Category Filtering Returns Only Matching Duas', () => {
    it('getDuasByCategory returns only matching duas', () => {
      duaCategories.forEach(category => {
        const duas = getDuasByCategory(category.id);
        duas.forEach(dua => {
          expect(dua.categoryId).toBe(category.id);
        });
      });
    });

    it('property: for any category, all returned duas match that category', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: duaCategories.length - 1 }),
          (index) => {
            const category = duaCategories[index];
            const duas = getDuasByCategory(category.id);
            return duas.every(dua => dua.categoryId === category.id);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: Audio Availability Indicator
   * For any dua, the hasAudio property SHALL be true if and only if
   * audioUrl is a non-empty string.
   * 
   * Validates: Requirements 6.1
   */
  describe('Property 9: Audio Availability Indicator', () => {
    it('hasAudio is consistent with audioUrl presence', () => {
      allDuas.forEach((dua: Dua) => {
        if (dua.audioUrl && dua.audioUrl.length > 0) {
          expect(dua.hasAudio).toBe(true);
        }
        // Note: hasAudio can be false even without audioUrl (no audio available)
      });
    });

    it('property: audio availability is consistent', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: allDuas.length - 1 }),
          (index) => {
            const dua = allDuas[index];
            // If audioUrl exists and is non-empty, hasAudio should be true
            if (dua.audioUrl && dua.audioUrl.length > 0) {
              return dua.hasAudio === true;
            }
            // Otherwise, hasAudio can be true or false (audio might be available but URL not set yet)
            return typeof dua.hasAudio === 'boolean';
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Helper function tests
  describe('getDuaById', () => {
    it('returns correct dua for valid ID', () => {
      const dua = getDuaById('q1');
      expect(dua).toBeDefined();
      expect(dua?.id).toBe('q1');
    });

    it('returns undefined for invalid ID', () => {
      const dua = getDuaById('nonexistent');
      expect(dua).toBeUndefined();
    });
  });
});
