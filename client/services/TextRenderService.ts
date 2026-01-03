/**
 * TextRenderService
 * 
 * Handles text layout calculations and image generation for video overlays.
 * Supports Arabic RTL text and translations with automatic wrapping and font sizing.
 * 
 * Requirements: 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5
 */

import * as FileSystem from 'expo-file-system/legacy';
import { cacheService } from './CacheService';

/**
 * Text layout result containing calculated positions and sizes
 */
export interface TextLayout {
  arabicFontSize: number;
  arabicLines: string[];
  arabicY: number;
  translationFontSize: number;
  translationLines: string[];
  translationY: number;
  overlayBounds: { x: number; y: number; width: number; height: number };
}

/**
 * Configuration for text rendering
 */
export interface TextRenderConfig {
  arabicText: string;
  translationText: string | null;
  videoWidth: number;
  videoHeight: number;
  textColor?: string;
  backgroundColor?: string;
  padding?: number;
  lineSpacing?: number;
  arabicBaseSize?: number;
  translationBaseSize?: number;
  minFontSize?: number;
  maxTextHeightRatio?: number;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  textColor: '#FFFFFF',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  padding: 40,
  lineSpacing: 1.4,
  arabicBaseSize: 48,
  translationBaseSize: 28,
  minFontSize: 16,
  maxTextHeightRatio: 0.7, // Max 70% of video height for text
};

/**
 * Approximate character width ratios for different scripts
 * These are estimates used for text measurement without canvas
 */
const CHAR_WIDTH_RATIOS = {
  arabic: 0.6,      // Arabic characters are generally narrower
  latin: 0.5,       // Latin characters average width
  space: 0.25,      // Space character
  punctuation: 0.3, // Punctuation marks
};

/**
 * Check if a character is Arabic
 */
export function isArabicChar(char: string): boolean {
  const code = char.charCodeAt(0);
  // Arabic Unicode ranges
  return (
    (code >= 0x0600 && code <= 0x06FF) || // Arabic
    (code >= 0x0750 && code <= 0x077F) || // Arabic Supplement
    (code >= 0x08A0 && code <= 0x08FF) || // Arabic Extended-A
    (code >= 0xFB50 && code <= 0xFDFF) || // Arabic Presentation Forms-A
    (code >= 0xFE70 && code <= 0xFEFF)    // Arabic Presentation Forms-B
  );
}

/**
 * Estimate text width based on character count and font size
 * This is an approximation used when canvas is not available
 * 
 * @param text - Text to measure
 * @param fontSize - Font size in pixels
 * @param isArabic - Whether the text is Arabic (affects width calculation)
 * @returns Estimated width in pixels
 */
export function estimateTextWidth(text: string, fontSize: number, isArabic: boolean = false): number {
  let totalWidth = 0;
  
  for (const char of text) {
    if (char === ' ') {
      totalWidth += fontSize * CHAR_WIDTH_RATIOS.space;
    } else if (/[.,;:!?'"()-]/.test(char)) {
      totalWidth += fontSize * CHAR_WIDTH_RATIOS.punctuation;
    } else if (isArabicChar(char)) {
      totalWidth += fontSize * CHAR_WIDTH_RATIOS.arabic;
    } else {
      totalWidth += fontSize * CHAR_WIDTH_RATIOS.latin;
    }
  }
  
  return totalWidth;
}

/**
 * Split text into words, handling Arabic RTL properly
 * Arabic text is split by spaces but maintains RTL order
 * 
 * @param text - Text to split
 * @returns Array of words
 * 
 * Requirements: 6.2, 6.5
 */
export function splitTextIntoWords(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }
  
  // Split by whitespace and filter empty strings
  return text.split(/\s+/).filter(word => word.length > 0);
}

/**
 * Wrap text to fit within a maximum width
 * Handles both Arabic (RTL) and Latin (LTR) text
 * 
 * @param text - Text to wrap
 * @param maxWidth - Maximum width in pixels
 * @param fontSize - Font size in pixels
 * @param isArabic - Whether the text is Arabic
 * @returns Array of wrapped lines
 * 
 * Requirements: 6.2
 */
export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  isArabic: boolean = false
): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }
  
  if (maxWidth <= 0 || fontSize <= 0) {
    return [text.trim()];
  }
  
  const words = splitTextIntoWords(text);
  
  if (words.length === 0) {
    return [];
  }
  
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = estimateTextWidth(testLine, fontSize, isArabic);
    
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      // Current line is full, start a new line
      if (currentLine) {
        lines.push(currentLine);
      }
      
      // Check if single word exceeds max width
      const wordWidth = estimateTextWidth(word, fontSize, isArabic);
      if (wordWidth > maxWidth) {
        // Word is too long, add it anyway (will be handled by font size reduction)
        currentLine = word;
      } else {
        currentLine = word;
      }
    }
  }
  
  // Add the last line
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Calculate the total height of wrapped text
 * 
 * @param lines - Array of text lines
 * @param fontSize - Font size in pixels
 * @param lineSpacing - Line spacing multiplier
 * @returns Total height in pixels
 */
export function calculateTextHeight(
  lines: string[],
  fontSize: number,
  lineSpacing: number = DEFAULT_CONFIG.lineSpacing
): number {
  if (lines.length === 0) {
    return 0;
  }
  
  const lineHeight = fontSize * lineSpacing;
  return lines.length * lineHeight;
}

/**
 * Find optimal font size that fits text within bounds
 * Starts with base size and reduces until text fits
 * 
 * @param text - Text to fit
 * @param maxWidth - Maximum width in pixels
 * @param maxHeight - Maximum height in pixels
 * @param baseFontSize - Starting font size
 * @param minFontSize - Minimum allowed font size
 * @param isArabic - Whether the text is Arabic
 * @param lineSpacing - Line spacing multiplier
 * @returns Object with optimal font size and wrapped lines
 * 
 * Requirements: 6.3
 */
export function optimizeFontSize(
  text: string,
  maxWidth: number,
  maxHeight: number,
  baseFontSize: number = DEFAULT_CONFIG.arabicBaseSize,
  minFontSize: number = DEFAULT_CONFIG.minFontSize,
  isArabic: boolean = false,
  lineSpacing: number = DEFAULT_CONFIG.lineSpacing
): { fontSize: number; lines: string[] } {
  if (!text || text.trim().length === 0) {
    return { fontSize: baseFontSize, lines: [] };
  }
  
  let fontSize = baseFontSize;
  let lines = wrapText(text, maxWidth, fontSize, isArabic);
  let height = calculateTextHeight(lines, fontSize, lineSpacing);
  
  // Reduce font size until text fits or minimum is reached
  while (height > maxHeight && fontSize > minFontSize) {
    fontSize -= 2; // Reduce by 2px increments
    lines = wrapText(text, maxWidth, fontSize, isArabic);
    height = calculateTextHeight(lines, fontSize, lineSpacing);
  }
  
  // Ensure we don't go below minimum
  if (fontSize < minFontSize) {
    fontSize = minFontSize;
    lines = wrapText(text, maxWidth, fontSize, isArabic);
  }
  
  return { fontSize, lines };
}

/**
 * Calculate text layout for video overlay
 * Positions Arabic text centered, with translation below
 * 
 * @param config - Text render configuration
 * @returns TextLayout with positions and sizes
 * 
 * Requirements: 5.2, 5.3, 6.4
 */
export function calculateLayout(config: TextRenderConfig): TextLayout {
  const {
    arabicText,
    translationText,
    videoWidth,
    videoHeight,
    padding = DEFAULT_CONFIG.padding,
    lineSpacing = DEFAULT_CONFIG.lineSpacing,
    arabicBaseSize = DEFAULT_CONFIG.arabicBaseSize,
    translationBaseSize = DEFAULT_CONFIG.translationBaseSize,
    minFontSize = DEFAULT_CONFIG.minFontSize,
    maxTextHeightRatio = DEFAULT_CONFIG.maxTextHeightRatio,
  } = config;
  
  const maxTextWidth = videoWidth - (padding * 2);
  const maxTotalHeight = videoHeight * maxTextHeightRatio;
  
  // Calculate space allocation
  const hasTranslation = translationText && translationText.trim().length > 0;
  const arabicHeightRatio = hasTranslation ? 0.55 : 1.0; // Arabic gets 55% if translation exists
  const translationHeightRatio = hasTranslation ? 0.40 : 0; // Translation gets 40%
  const gapRatio = hasTranslation ? 0.05 : 0; // 5% gap between Arabic and translation
  
  const maxArabicHeight = maxTotalHeight * arabicHeightRatio;
  const maxTranslationHeight = maxTotalHeight * translationHeightRatio;
  const gap = maxTotalHeight * gapRatio;
  
  // Optimize Arabic text
  const arabicResult = optimizeFontSize(
    arabicText,
    maxTextWidth,
    maxArabicHeight,
    arabicBaseSize,
    minFontSize,
    true, // isArabic
    lineSpacing
  );
  
  // Optimize translation text
  let translationResult = { fontSize: translationBaseSize, lines: [] as string[] };
  if (hasTranslation) {
    translationResult = optimizeFontSize(
      translationText!,
      maxTextWidth,
      maxTranslationHeight,
      translationBaseSize,
      minFontSize,
      false, // not Arabic
      lineSpacing
    );
  }
  
  // Calculate actual heights
  const arabicHeight = calculateTextHeight(arabicResult.lines, arabicResult.fontSize, lineSpacing);
  const translationHeight = calculateTextHeight(translationResult.lines, translationResult.fontSize, lineSpacing);
  
  // Calculate total content height
  const totalContentHeight = arabicHeight + (hasTranslation ? gap + translationHeight : 0);
  
  // Center content vertically
  const contentStartY = (videoHeight - totalContentHeight) / 2;
  
  // Arabic text Y position (top of Arabic block)
  const arabicY = contentStartY;
  
  // Translation Y position (below Arabic with gap)
  const translationY = arabicY + arabicHeight + gap;
  
  // Calculate overlay bounds (with padding)
  const overlayBounds = {
    x: padding / 2,
    y: Math.max(0, contentStartY - padding),
    width: videoWidth - padding,
    height: Math.min(videoHeight, totalContentHeight + (padding * 2)),
  };
  
  return {
    arabicFontSize: arabicResult.fontSize,
    arabicLines: arabicResult.lines,
    arabicY,
    translationFontSize: translationResult.fontSize,
    translationLines: translationResult.lines,
    translationY,
    overlayBounds,
  };
}


/**
 * Generate FFmpeg drawtext filter for text overlay
 * This creates the filter string for FFmpeg to render text on video
 * 
 * @param layout - Calculated text layout
 * @param textColor - Text color in hex format
 * @param videoWidth - Video width for centering
 * @returns FFmpeg filter string
 * 
 * Requirements: 6.1, 6.4, 6.5
 */
export function generateDrawTextFilter(
  layout: TextLayout,
  textColor: string = DEFAULT_CONFIG.textColor,
  videoWidth: number
): string {
  const filters: string[] = [];
  
  // Draw semi-transparent background
  const bgFilter = `drawbox=x=${layout.overlayBounds.x}:y=${layout.overlayBounds.y}:w=${layout.overlayBounds.width}:h=${layout.overlayBounds.height}:color=black@0.6:t=fill`;
  filters.push(bgFilter);
  
  // Draw Arabic text lines (centered)
  const arabicLineHeight = layout.arabicFontSize * DEFAULT_CONFIG.lineSpacing;
  layout.arabicLines.forEach((line, index) => {
    const y = layout.arabicY + (index * arabicLineHeight);
    // Escape special characters for FFmpeg
    const escapedLine = escapeFFmpegText(line);
    const textFilter = `drawtext=text='${escapedLine}':fontsize=${layout.arabicFontSize}:fontcolor=${textColor}:x=(w-text_w)/2:y=${Math.round(y)}`;
    filters.push(textFilter);
  });
  
  // Draw translation text lines (centered)
  if (layout.translationLines.length > 0) {
    const translationLineHeight = layout.translationFontSize * DEFAULT_CONFIG.lineSpacing;
    layout.translationLines.forEach((line, index) => {
      const y = layout.translationY + (index * translationLineHeight);
      const escapedLine = escapeFFmpegText(line);
      const textFilter = `drawtext=text='${escapedLine}':fontsize=${layout.translationFontSize}:fontcolor=${textColor}:x=(w-text_w)/2:y=${Math.round(y)}`;
      filters.push(textFilter);
    });
  }
  
  return filters.join(',');
}

/**
 * Escape special characters for FFmpeg drawtext filter
 * 
 * @param text - Text to escape
 * @returns Escaped text safe for FFmpeg
 */
export function escapeFFmpegText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "'\\''")
    .replace(/:/g, '\\:')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/%/g, '%%');
}

/**
 * Generate a text overlay configuration file for FFmpeg
 * This is an alternative approach using a filter script file
 * 
 * @param layout - Calculated text layout
 * @param textColor - Text color
 * @param outputPath - Path to save the filter script
 * @returns Path to the generated filter script
 * 
 * Requirements: 6.1, 6.4
 */
export async function generateTextOverlayConfig(
  layout: TextLayout,
  textColor: string = DEFAULT_CONFIG.textColor,
  outputPath?: string
): Promise<string> {
  const filterScript = generateDrawTextFilter(layout, textColor, 0);
  
  const filePath = outputPath || `${cacheService.getCacheDir()}text_filter_${Date.now()}.txt`;
  
  await FileSystem.writeAsStringAsync(filePath, filterScript);
  
  return filePath;
}

/**
 * TextRenderService class
 * 
 * Provides high-level API for text rendering operations
 */
class TextRenderServiceImpl {
  private static instance: TextRenderServiceImpl;

  static getInstance(): TextRenderServiceImpl {
    if (!TextRenderServiceImpl.instance) {
      TextRenderServiceImpl.instance = new TextRenderServiceImpl();
    }
    return TextRenderServiceImpl.instance;
  }

  /**
   * Calculate optimal text layout for video overlay
   * 
   * @param arabicText - Arabic verse text
   * @param translationText - Optional translation text
   * @param videoWidth - Video width in pixels
   * @param videoHeight - Video height in pixels
   * @returns Calculated text layout
   * 
   * Requirements: 5.2, 5.3, 6.2, 6.3, 6.4
   */
  calculateLayout(
    arabicText: string,
    translationText: string | null,
    videoWidth: number,
    videoHeight: number
  ): TextLayout {
    return calculateLayout({
      arabicText,
      translationText,
      videoWidth,
      videoHeight,
    });
  }

  /**
   * Generate FFmpeg filter string for text overlay
   * 
   * @param layout - Calculated text layout
   * @param textColor - Text color in hex format
   * @param videoWidth - Video width for centering
   * @returns FFmpeg filter string
   * 
   * Requirements: 6.1, 6.4, 6.5
   */
  generateTextOverlay(
    layout: TextLayout,
    textColor: string = '#FFFFFF',
    videoWidth: number = 1080
  ): string {
    return generateDrawTextFilter(layout, textColor, videoWidth);
  }

  /**
   * Wrap text to fit within maximum width
   * 
   * @param text - Text to wrap
   * @param maxWidth - Maximum width in pixels
   * @param fontSize - Font size in pixels
   * @param isArabic - Whether text is Arabic
   * @returns Array of wrapped lines
   * 
   * Requirements: 6.2
   */
  wrapText(
    text: string,
    maxWidth: number,
    fontSize: number,
    isArabic: boolean = false
  ): string[] {
    return wrapText(text, maxWidth, fontSize, isArabic);
  }

  /**
   * Find optimal font size for text
   * 
   * @param text - Text to fit
   * @param maxWidth - Maximum width in pixels
   * @param maxHeight - Maximum height in pixels
   * @param baseFontSize - Starting font size
   * @param isArabic - Whether text is Arabic
   * @returns Optimal font size and wrapped lines
   * 
   * Requirements: 6.3
   */
  optimizeFontSize(
    text: string,
    maxWidth: number,
    maxHeight: number,
    baseFontSize: number = 48,
    isArabic: boolean = false
  ): { fontSize: number; lines: string[] } {
    return optimizeFontSize(text, maxWidth, maxHeight, baseFontSize, 16, isArabic);
  }
}

// Export singleton instance
export const textRenderService = TextRenderServiceImpl.getInstance();

// Export class for testing
export { TextRenderServiceImpl };

// Export default config for testing
export { DEFAULT_CONFIG };
