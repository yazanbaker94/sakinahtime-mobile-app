/**
 * TafsirAssetLoader
 * 
 * Loads tafsir JSON data from downloaded files in documentDirectory.
 * All tafsirs are downloaded on-demand from sakinahtime.com.
 * 
 * Files are saved to: documentDirectory/tafsirs/{id}.json
 */

import * as FileSystem from 'expo-file-system/legacy';

const TAFSIR_SOURCES = {
    'jalalayn': 'tafsir-jalalayn.json',
    'abridged': 'abridged-explanation-of-the-quran.json',
    'sahih-international': 'en-sahih-international-inline-footnotes.json',
} as const;

type TafsirSource = keyof typeof TAFSIR_SOURCES;

// Cache loaded tafsir data in memory to avoid re-reading from disk
const cache: Partial<Record<string, any>> = {};

/**
 * Load a tafsir data source from downloaded files.
 * Returns null if not downloaded yet.
 */
export async function loadTafsirData(source: string): Promise<any | null> {
    // Return from memory cache if available
    if (cache[source]) return cache[source];

    try {
        // Check downloaded file (from TafsirSourcesModal download)
        const tafsirPath = `${FileSystem.documentDirectory}tafsirs/${source}.json`;
        const fileInfo = await FileSystem.getInfoAsync(tafsirPath);
        if (fileInfo.exists) {
            const content = await FileSystem.readAsStringAsync(tafsirPath);
            const data = JSON.parse(content);
            cache[source] = data;
            return data;
        }

        // Also check legacy path (flat in documentDirectory)
        const legacyPath = `${FileSystem.documentDirectory}tafsir-${source}.json`;
        const legacyInfo = await FileSystem.getInfoAsync(legacyPath);
        if (legacyInfo.exists) {
            const content = await FileSystem.readAsStringAsync(legacyPath);
            const data = JSON.parse(content);
            cache[source] = data;
            return data;
        }

        return null;
    } catch (error) {
        console.warn(`[TafsirAssetLoader] Failed to load ${source}:`, error);
        return null;
    }
}

/**
 * Get tafsir data for a specific verse
 */
export async function getTafsirForVerse(source: string, verseKey: string): Promise<any | null> {
    const data = await loadTafsirData(source);
    if (!data) return null;
    return data[verseKey] || null;
}

/**
 * Preload all tafsir sources into memory cache
 */
export async function preloadAllTafsir(): Promise<void> {
    await Promise.all(
        Object.keys(TAFSIR_SOURCES).map(source => loadTafsirData(source).catch(() => null))
    );
}

/**
 * Clear the in-memory cache (e.g., on low memory warning)
 */
export function clearTafsirCache(): void {
    Object.keys(cache).forEach(key => delete cache[key]);
}
