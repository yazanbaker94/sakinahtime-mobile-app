/**
 * Mushaf Image Provider
 * 
 * Replaces the old static require() map (604 images, 321 MB bundled)
 * with a dynamic service that loads from local storage after CDN download.
 * 
 * Pages 1-5: Always available (bundled with app)
 * Pages 6-604: Downloaded from Cloudflare R2 on first Mushaf access
 */

import { quranImageService } from '@/services/QuranImageService';

/**
 * Get the image source for a Mushaf page.
 * Returns a require() asset for bundled pages (1-5),
 * a { uri } object for downloaded pages (6-604),
 * or null if pages haven't been downloaded yet.
 */
export function getMushafPageSource(pageNum: number): any {
  return quranImageService.getPageSource(pageNum);
}

// Legacy compatibility: object-style access for existing consumers
// Use getMushafPageSource(pageNum) for new code
export const mushafImages: { [key: number]: any } = new Proxy({} as any, {
  get(_target, prop) {
    const pageNum = typeof prop === 'string' ? parseInt(prop, 10) : NaN;
    if (isNaN(pageNum)) return undefined;
    return quranImageService.getPageSource(pageNum);
  },
});
