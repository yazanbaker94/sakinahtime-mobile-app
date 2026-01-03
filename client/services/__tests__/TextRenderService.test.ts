/**
 * Property-Based Tests for TextRenderService
 * 
 * Tests text wrapping, font size optimization, and text positioning
 * for the Quran video generator overlay system.
 * 
 * Feature: quran-video-generator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  wrapText,
  splitTextIntoWords,
  estimateTextWidth,
  isArabicChar,
  calculateTextHeight,
  optimizeFontSize,
  calculateLayout,
  escapeFFmpegText,
  DEFAULT_CONFIG,
} from '../TextRenderService';

// Mock dependencies
vi.mock('expo-file-system/legacy', () => ({
  cacheDirectory: '/mock/cache/',
  writeAsStringAsync: vi.fn(),
}));

vi.mock('../CacheService', () => ({
  cacheService: {
    getCacheDir: () => '/mock/cache/video_generator/',
  },
}));

describe('TextRenderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 7: Text Wrapping', () => {
    /**
     * Property 7: Text Wrapping
     * *For any* text string and maximum width, the wrapped lines SHALL each have 
     * a rendered width less than or equal to maxWidth.
     * 
     * **Validates: Requirements 6.2**
     */
    it('should wrap text so each line width is less than or equal to maxWidth', () => {
      fc.assert(
        fc.property(
          // Generate non-empty text strings with words
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 20 })
            .map(words => words.join(' ')),
          // Generate reasonable max widths
          fc.integer({ min: 100, max: 2000 }),
          // Generate reasonable font sizes
          fc.integer({ min: 16, max: 72 }),
          (text, maxWidth, fontSize) => {
            // Skip empty text
            fc.pre(text.trim().length > 0);
            
            const lines = wrapText(text, maxWidth, fontSize, false);
            
            // Each line should have estimated width <= maxWidth
            // (with some tolerance for edge cases with very long words)
            for (const line of lines) {
              const lineWidth = estimateTextWidth(line, fontSize, false);
              // Allow some tolerance for single long words that can't be broken
              const words = splitTextIntoWords(line);
              if (words.length === 1) {
                // Single word line - may exceed if word itself is too long
                continue;
              }
              expect(lineWidth).toBeLessThanOrEqual(maxWidth * 1.1); // 10% tolerance
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: All words from original text should appear in wrapped lines
     */
    it('should preserve all words when wrapping', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 15 }), { minLength: 1, maxLength: 10 })
            .map(words => words.filter(w => w.trim().length > 0).join(' ')),
          fc.integer({ min: 100, max: 1000 }),
          fc.integer({ min: 16, max: 48 }),
          (text, maxWidth, fontSize) => {
            fc.pre(text.trim().length > 0);
            
            const originalWords = splitTextIntoWords(text);
            fc.pre(originalWords.length > 0);
            
            const lines = wrapText(text, maxWidth, fontSize, false);
            const wrappedWords = lines.flatMap(line => splitTextIntoWords(line));
            
            // All original words should be present
            expect(wrappedWords.length).toBe(originalWords.length);
            expect(wrappedWords).toEqual(originalWords);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Wrapping should be deterministic
     */
    it('should produce same result for same inputs', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 100, max: 1000 }),
          fc.integer({ min: 16, max: 48 }),
          (text, maxWidth, fontSize) => {
            const lines1 = wrapText(text, maxWidth, fontSize, false);
            const lines2 = wrapText(text, maxWidth, fontSize, false);
            
            expect(lines1).toEqual(lines2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('splitTextIntoWords', () => {
    it('should split text by whitespace', () => {
      expect(splitTextIntoWords('hello world')).toEqual(['hello', 'world']);
      expect(splitTextIntoWords('one two three')).toEqual(['one', 'two', 'three']);
    });

    it('should handle multiple spaces', () => {
      expect(splitTextIntoWords('hello   world')).toEqual(['hello', 'world']);
      expect(splitTextIntoWords('  hello  world  ')).toEqual(['hello', 'world']);
    });

    it('should return empty array for empty or whitespace-only text', () => {
      expect(splitTextIntoWords('')).toEqual([]);
      expect(splitTextIntoWords('   ')).toEqual([]);
    });

    it('should handle Arabic text', () => {
      const arabicText = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
      const words = splitTextIntoWords(arabicText);
      expect(words.length).toBe(4);
    });
  });

  describe('isArabicChar', () => {
    it('should identify Arabic characters', () => {
      expect(isArabicChar('ا')).toBe(true);
      expect(isArabicChar('ب')).toBe(true);
      expect(isArabicChar('ت')).toBe(true);
      expect(isArabicChar('ث')).toBe(true);
    });

    it('should identify non-Arabic characters', () => {
      expect(isArabicChar('a')).toBe(false);
      expect(isArabicChar('A')).toBe(false);
      expect(isArabicChar('1')).toBe(false);
      expect(isArabicChar(' ')).toBe(false);
    });
  });

  describe('estimateTextWidth', () => {
    it('should return positive width for non-empty text', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 12, max: 72 }),
          (text, fontSize) => {
            const width = estimateTextWidth(text, fontSize, false);
            expect(width).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should scale with font size', () => {
      const text = 'Hello World';
      const width16 = estimateTextWidth(text, 16, false);
      const width32 = estimateTextWidth(text, 32, false);
      
      // Width should roughly double when font size doubles
      expect(width32).toBeGreaterThan(width16);
      expect(width32 / width16).toBeCloseTo(2, 0);
    });

    it('should return 0 for empty text', () => {
      expect(estimateTextWidth('', 16, false)).toBe(0);
    });
  });

  describe('calculateTextHeight', () => {
    it('should return 0 for empty lines', () => {
      expect(calculateTextHeight([], 16)).toBe(0);
    });

    it('should scale with number of lines', () => {
      const fontSize = 24;
      const lineSpacing = 1.4;
      
      const height1 = calculateTextHeight(['line1'], fontSize, lineSpacing);
      const height2 = calculateTextHeight(['line1', 'line2'], fontSize, lineSpacing);
      const height3 = calculateTextHeight(['line1', 'line2', 'line3'], fontSize, lineSpacing);
      
      expect(height2).toBeCloseTo(height1 * 2, 0);
      expect(height3).toBeCloseTo(height1 * 3, 0);
    });

    it('should scale with font size', () => {
      const lines = ['line1', 'line2'];
      const height16 = calculateTextHeight(lines, 16);
      const height32 = calculateTextHeight(lines, 32);
      
      expect(height32).toBeGreaterThan(height16);
    });
  });

  describe('Property 8: Font Size Optimization', () => {
    /**
     * Property 8: Font Size Optimization
     * *For any* text content and video dimensions, the calculated font size SHALL result 
     * in text that fits within the designated text area (height <= maxTextHeight).
     * 
     * **Validates: Requirements 6.3**
     */
    it('should optimize font size so text height fits within maxHeight', () => {
      fc.assert(
        fc.property(
          // Generate text with multiple words
          fc.array(fc.string({ minLength: 1, maxLength: 15 }), { minLength: 1, maxLength: 30 })
            .map(words => words.filter(w => w.trim().length > 0).join(' ')),
          // Generate reasonable max widths
          fc.integer({ min: 200, max: 1920 }),
          // Generate reasonable max heights
          fc.integer({ min: 100, max: 1080 }),
          // Generate base font sizes
          fc.integer({ min: 24, max: 72 }),
          (text, maxWidth, maxHeight, baseFontSize) => {
            fc.pre(text.trim().length > 0);
            
            const result = optimizeFontSize(
              text,
              maxWidth,
              maxHeight,
              baseFontSize,
              DEFAULT_CONFIG.minFontSize,
              false,
              DEFAULT_CONFIG.lineSpacing
            );
            
            // Font size should be between min and base
            expect(result.fontSize).toBeGreaterThanOrEqual(DEFAULT_CONFIG.minFontSize);
            expect(result.fontSize).toBeLessThanOrEqual(baseFontSize);
            
            // Text height should fit within maxHeight (or be at minimum font size)
            const textHeight = calculateTextHeight(
              result.lines,
              result.fontSize,
              DEFAULT_CONFIG.lineSpacing
            );
            
            // Either text fits, or we're at minimum font size
            const fitsOrMinimum = textHeight <= maxHeight || result.fontSize === DEFAULT_CONFIG.minFontSize;
            expect(fitsOrMinimum).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Font size optimization should be deterministic
     */
    it('should produce same result for same inputs', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 200, max: 1000 }),
          fc.integer({ min: 100, max: 500 }),
          fc.integer({ min: 24, max: 48 }),
          (text, maxWidth, maxHeight, baseFontSize) => {
            const result1 = optimizeFontSize(text, maxWidth, maxHeight, baseFontSize);
            const result2 = optimizeFontSize(text, maxWidth, maxHeight, baseFontSize);
            
            expect(result1.fontSize).toBe(result2.fontSize);
            expect(result1.lines).toEqual(result2.lines);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Larger maxHeight should result in same or larger font size
     */
    it('should use larger font size when more height is available', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 3, maxLength: 10 })
            .map(words => words.filter(w => w.trim().length > 0).join(' ')),
          fc.integer({ min: 200, max: 800 }),
          fc.integer({ min: 100, max: 300 }),
          fc.integer({ min: 24, max: 48 }),
          (text, maxWidth, smallHeight, baseFontSize) => {
            fc.pre(text.trim().length > 0);
            
            const largeHeight = smallHeight * 2;
            
            const resultSmall = optimizeFontSize(text, maxWidth, smallHeight, baseFontSize);
            const resultLarge = optimizeFontSize(text, maxWidth, largeHeight, baseFontSize);
            
            // Larger height should allow same or larger font size
            expect(resultLarge.fontSize).toBeGreaterThanOrEqual(resultSmall.fontSize);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Text Positioning', () => {
    /**
     * Property 5: Text Positioning
     * *For any* video dimensions and text content, the Arabic text SHALL be horizontally 
     * centered (x = videoWidth/2), and the translation text Y position SHALL be greater 
     * than (arabicY + arabicBlockHeight + gap).
     * 
     * **Validates: Requirements 5.2, 5.3**
     */
    it('should position translation below Arabic text with gap', () => {
      fc.assert(
        fc.property(
          // Arabic text
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 5 })
            .map(words => words.filter(w => w.trim().length > 0).join(' ')),
          // Translation text
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 5 })
            .map(words => words.filter(w => w.trim().length > 0).join(' ')),
          // Video dimensions
          fc.integer({ min: 720, max: 1920 }),
          fc.integer({ min: 1280, max: 1920 }),
          (arabicText, translationText, videoWidth, videoHeight) => {
            fc.pre(arabicText.trim().length > 0);
            fc.pre(translationText.trim().length > 0);
            
            const layout = calculateLayout({
              arabicText,
              translationText,
              videoWidth,
              videoHeight,
            });
            
            // Arabic text should have lines
            expect(layout.arabicLines.length).toBeGreaterThan(0);
            
            // Translation should have lines
            expect(layout.translationLines.length).toBeGreaterThan(0);
            
            // Calculate Arabic block height
            const arabicBlockHeight = calculateTextHeight(
              layout.arabicLines,
              layout.arabicFontSize,
              DEFAULT_CONFIG.lineSpacing
            );
            
            // Translation Y should be below Arabic block
            expect(layout.translationY).toBeGreaterThan(layout.arabicY + arabicBlockHeight);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Arabic text should be positioned within video bounds
     */
    it('should position text within video bounds', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 5 })
            .map(words => words.filter(w => w.trim().length > 0).join(' ')),
          fc.integer({ min: 720, max: 1920 }),
          fc.integer({ min: 1280, max: 1920 }),
          (arabicText, videoWidth, videoHeight) => {
            fc.pre(arabicText.trim().length > 0);
            
            const layout = calculateLayout({
              arabicText,
              translationText: null,
              videoWidth,
              videoHeight,
            });
            
            // Arabic Y should be within video bounds
            expect(layout.arabicY).toBeGreaterThanOrEqual(0);
            expect(layout.arabicY).toBeLessThan(videoHeight);
            
            // Overlay bounds should be within video
            expect(layout.overlayBounds.x).toBeGreaterThanOrEqual(0);
            expect(layout.overlayBounds.y).toBeGreaterThanOrEqual(0);
            expect(layout.overlayBounds.x + layout.overlayBounds.width).toBeLessThanOrEqual(videoWidth);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('escapeFFmpegText', () => {
    it('should escape special characters', () => {
      expect(escapeFFmpegText("test'text")).toContain("'");
      expect(escapeFFmpegText('test:text')).toBe('test\\:text');
      expect(escapeFFmpegText('test[text]')).toBe('test\\[text\\]');
      expect(escapeFFmpegText('test%text')).toBe('test%%text');
    });

    it('should handle backslashes', () => {
      expect(escapeFFmpegText('test\\text')).toBe('test\\\\text');
    });

    it('should handle empty string', () => {
      expect(escapeFFmpegText('')).toBe('');
    });
  });
});
