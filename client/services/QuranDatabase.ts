/**
 * QuranDatabase — SQLite-backed storage for Quran data
 * 
 * Replaces the 16.9 MB of bundled JSON (quran-uthmani.json, quran-english.json,
 * all-pages.json) with on-demand SQL queries from a pre-built SQLite database.
 * 
 * Key benefits:
 * - Data is NOT parsed into JS heap at startup (saves ~30MB+ RAM)
 * - Queries load only what's needed (e.g., 1 page of coords vs. all 604)
 * - Text search via SQL LIKE instead of full-array iteration
 */

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

// Types matching the existing data structures
export interface SurahMeta {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
}

export interface QuranVerse {
    number: number;
    text: string;
    numberInSurah: number;
    juz: number;
    manzil: number;
    page: number;
    ruku: number;
    hizbQuarter: number;
    sajda: boolean;
}

export interface SurahData {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    ayahs: QuranVerse[];
}

export interface CombinedVerse {
    number: number;
    numberInSurah: number;
    textAr: string;
    translation: string;
    juz: number;
    page: number;
}

const DB_NAME = 'quran.db';
// Increment this when the bundled quran.db changes (new tables, data updates)
// v1 = original (surahs, verses, coordinates)  
// v2 = added audio_timing, gharib_words, wbw_english, wbw_transliteration, word_frequencies
// v3 = added tafsir_jalalayn
const DB_VERSION = 3;
const DB_VERSION_KEY = '@quran_db_version';

class QuranDatabaseService {
    private db: SQLite.SQLiteDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    // Caches for frequently accessed data
    private surahCache = new Map<number, SurahData>();
    private englishSurahCache = new Map<number, SurahData>();
    private surahMetaCache: SurahMeta[] | null = null;
    private allSurahsCache: SurahData[] | null = null;

    /**
     * Initialize the database. Copies the pre-built .db from assets
     * to the document directory on first launch or when DB version changes.
     */
    async init(): Promise<void> {
        if (this.db) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = this._doInit();
        return this.initPromise;
    }

    private async _doInit(): Promise<void> {
        const dbPath = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;

        // Check if DB already exists in document directory
        const fileInfo = await FileSystem.getInfoAsync(dbPath);

        // Check DB version — re-copy if version changed (new tables added)
        let needsCopy = !fileInfo.exists;
        if (fileInfo.exists) {
            try {
                const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
                const storedVersion = await AsyncStorage.getItem(DB_VERSION_KEY);
                if (!storedVersion || parseInt(storedVersion) < DB_VERSION) {
                    console.log(`[QuranDB] DB version changed (${storedVersion} → ${DB_VERSION}), re-copying...`);
                    await FileSystem.deleteAsync(dbPath, { idempotent: true });
                    needsCopy = true;
                }
            } catch (e) {
                console.log('[QuranDB] Error checking DB version:', e);
            }
        }

        if (needsCopy) {
            console.log('[QuranDB] Copying database from assets...');

            // Ensure SQLite directory exists
            await FileSystem.makeDirectoryAsync(
                `${FileSystem.documentDirectory}SQLite`,
                { intermediates: true }
            );

            // Load the asset
            const asset = Asset.fromModule(require('../../assets/quran.db'));
            await asset.downloadAsync();

            if (asset.localUri) {
                await FileSystem.copyAsync({
                    from: asset.localUri,
                    to: dbPath,
                });
                console.log('[QuranDB] Database copied successfully');

                // Store the version
                try {
                    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
                    await AsyncStorage.setItem(DB_VERSION_KEY, DB_VERSION.toString());
                } catch (e) {
                    console.log('[QuranDB] Error saving DB version:', e);
                }
            } else {
                throw new Error('[QuranDB] Failed to download database asset');
            }
        }

        // Open the database
        this.db = await SQLite.openDatabaseAsync(DB_NAME);
        console.log('[QuranDB] Database opened');
    }

    private getDb(): SQLite.SQLiteDatabase {
        if (!this.db) {
            throw new Error('[QuranDB] Database not initialized. Call init() first.');
        }
        return this.db;
    }

    // ─────────────────────────────────────────────
    // Surah metadata
    // ─────────────────────────────────────────────

    async getAllSurahMeta(): Promise<SurahMeta[]> {
        if (this.surahMetaCache) return this.surahMetaCache;

        const db = this.getDb();
        const rows = await db.getAllAsync<{
            number: number;
            name: string;
            english_name: string;
            english_name_translation: string;
            revelation_type: string;
        }>('SELECT * FROM surahs ORDER BY number');

        this.surahMetaCache = rows.map(r => ({
            number: r.number,
            name: r.name,
            englishName: r.english_name,
            englishNameTranslation: r.english_name_translation,
            revelationType: r.revelation_type,
        }));

        return this.surahMetaCache;
    }

    // ─────────────────────────────────────────────
    // Arabic (Uthmani) text
    // ─────────────────────────────────────────────

    async getSurah(surahNumber: number): Promise<SurahData | null> {
        if (this.surahCache.has(surahNumber)) {
            return this.surahCache.get(surahNumber)!;
        }

        const db = this.getDb();

        // Get surah metadata
        const meta = await db.getFirstAsync<{
            number: number;
            name: string;
            english_name: string;
            english_name_translation: string;
            revelation_type: string;
        }>('SELECT * FROM surahs WHERE number = ?', surahNumber);

        if (!meta) return null;

        // Get verses
        const verses = await db.getAllAsync<{
            id: number;
            surah: number;
            ayah: number;
            text: string;
            juz: number;
            manzil: number;
            page: number;
            ruku: number;
            hizb_quarter: number;
            sajda: number;
        }>('SELECT * FROM quran_uthmani WHERE surah = ? ORDER BY ayah', surahNumber);

        const surahData: SurahData = {
            number: meta.number,
            name: meta.name,
            englishName: meta.english_name,
            englishNameTranslation: meta.english_name_translation,
            revelationType: meta.revelation_type,
            ayahs: verses.map(v => ({
                number: v.id,
                text: v.text,
                numberInSurah: v.ayah,
                juz: v.juz,
                manzil: v.manzil,
                page: v.page,
                ruku: v.ruku,
                hizbQuarter: v.hizb_quarter,
                sajda: v.sajda === 1,
            })),
        };

        this.surahCache.set(surahNumber, surahData);
        return surahData;
    }

    async getAllSurahs(): Promise<SurahData[]> {
        if (this.allSurahsCache) return this.allSurahsCache;

        const surahs: SurahData[] = [];
        for (let i = 1; i <= 114; i++) {
            const surah = await this.getSurah(i);
            if (surah) surahs.push(surah);
        }
        this.allSurahsCache = surahs;
        return surahs;
    }

    async getVerse(surahNumber: number, ayahNumber: number): Promise<QuranVerse | null> {
        const db = this.getDb();
        const row = await db.getFirstAsync<{
            id: number;
            surah: number;
            ayah: number;
            text: string;
            juz: number;
            manzil: number;
            page: number;
            ruku: number;
            hizb_quarter: number;
            sajda: number;
        }>(
            'SELECT * FROM quran_uthmani WHERE surah = ? AND ayah = ?',
            surahNumber, ayahNumber
        );

        if (!row) return null;

        return {
            number: row.id,
            text: row.text,
            numberInSurah: row.ayah,
            juz: row.juz,
            manzil: row.manzil,
            page: row.page,
            ruku: row.ruku,
            hizbQuarter: row.hizb_quarter,
            sajda: row.sajda === 1,
        };
    }

    /**
     * Get the text of a specific verse. Used by WordMeaningService.
     */
    async getVerseText(surahNumber: number, ayahNumber: number): Promise<string | null> {
        const db = this.getDb();
        const row = await db.getFirstAsync<{ text: string }>(
            'SELECT text FROM quran_uthmani WHERE surah = ? AND ayah = ?',
            surahNumber, ayahNumber
        );
        return row?.text || null;
    }

    // ─────────────────────────────────────────────
    // English translations
    // ─────────────────────────────────────────────

    async getEnglishSurah(surahNumber: number): Promise<SurahData | null> {
        if (this.englishSurahCache.has(surahNumber)) {
            return this.englishSurahCache.get(surahNumber)!;
        }

        const db = this.getDb();

        const meta = await db.getFirstAsync<{
            number: number;
            name: string;
            english_name: string;
            english_name_translation: string;
            revelation_type: string;
        }>('SELECT * FROM surahs WHERE number = ?', surahNumber);

        if (!meta) return null;

        const verses = await db.getAllAsync<{
            id: number;
            surah: number;
            ayah: number;
            text: string;
        }>('SELECT * FROM quran_english WHERE surah = ? ORDER BY ayah', surahNumber);

        const surahData: SurahData = {
            number: meta.number,
            name: meta.name,
            englishName: meta.english_name,
            englishNameTranslation: meta.english_name_translation,
            revelationType: meta.revelation_type,
            ayahs: verses.map(v => ({
                number: v.id,
                text: v.text,
                numberInSurah: v.ayah,
                juz: 0, manzil: 0, page: 0, ruku: 0, hizbQuarter: 0, sajda: false,
            })),
        };

        this.englishSurahCache.set(surahNumber, surahData);
        return surahData;
    }

    // ─────────────────────────────────────────────
    // Verse coordinates (for MushafScreen)
    // ─────────────────────────────────────────────

    private coordsCache = new Map<number, any>();

    async getPageCoordinates(page: number): Promise<any> {
        if (this.coordsCache.has(page)) {
            return this.coordsCache.get(page);
        }

        const db = this.getDb();
        const row = await db.getFirstAsync<{ coords: string }>(
            'SELECT coords FROM verse_coordinates WHERE page = ?',
            page
        );

        if (!row) return null;

        const coords = JSON.parse(row.coords);
        this.coordsCache.set(page, coords);
        return coords;
    }

    /**
     * Get all coordinates at once (for backward compatibility with CoordinatesContext).
     * This loads all 604 pages into memory — use getPageCoordinates() for on-demand loading.
     */
    async getAllCoordinates(): Promise<Record<string, any>> {
        const db = this.getDb();
        const rows = await db.getAllAsync<{ page: number; coords: string }>(
            'SELECT * FROM verse_coordinates ORDER BY page'
        );

        const all: Record<string, any> = {};
        for (const row of rows) {
            all[row.page.toString()] = JSON.parse(row.coords);
        }
        return all;
    }

    // ─────────────────────────────────────────────
    // Search
    // ─────────────────────────────────────────────

    async searchVerses(query: string, limit = 50): Promise<Array<{
        surah: number;
        ayah: number;
        text: string;
        englishName: string;
    }>> {
        const db = this.getDb();
        const rows = await db.getAllAsync<{
            surah: number;
            ayah: number;
            text: string;
            english_name: string;
        }>(
            `SELECT u.surah, u.ayah, u.text, s.english_name
       FROM quran_uthmani u
       JOIN surahs s ON u.surah = s.number
       WHERE u.text LIKE ?
       LIMIT ?`,
            `%${query}%`, limit
        );

        return rows.map(r => ({
            surah: r.surah,
            ayah: r.ayah,
            text: r.text,
            englishName: r.english_name,
        }));
    }

    // ─────────────────────────────────────────────
    // Hizb quarters (replaces hizb-quarters.ts dependency)
    // ─────────────────────────────────────────────

    async getHizbQuarters(): Promise<Array<{
        hizbQuarter: number;
        hizb: number;
        quarter: number;
        startVerse: number;
        startSurah: number;
        startVerseInSurah: number;
    }>> {
        const db = this.getDb();
        // Get the first verse of each hizb quarter
        const rows = await db.getAllAsync<{
            id: number;
            surah: number;
            ayah: number;
            hizb_quarter: number;
        }>(
            `SELECT MIN(id) as id, surah, ayah, hizb_quarter
       FROM quran_uthmani
       GROUP BY hizb_quarter
       ORDER BY hizb_quarter`
        );

        return rows.map(r => ({
            hizbQuarter: r.hizb_quarter,
            hizb: Math.ceil(r.hizb_quarter / 4),
            quarter: ((r.hizb_quarter - 1) % 4) + 1,
            startVerse: r.id,
            startSurah: r.surah,
            startVerseInSurah: r.ayah,
        }));
    }

    // ─────────────────────────────────────────────
    // Tafsir data (replaces bundled JSON import)
    // ─────────────────────────────────────────────

    /**
     * Get Tafsir Jalalayn text for a specific verse
     * @param key - verse key in format "surah:ayah"
     */
    async getTafsirJalalayn(key: string): Promise<{ text: string } | null> {
        await this.init();
        const db = this.getDb();
        try {
            const [surahStr, ayahStr] = key.split(':');
            const row = await db.getFirstAsync<{ text: string }>(
                'SELECT text FROM tafsir_jalalayn WHERE surah = ? AND ayah = ?',
                parseInt(surahStr), parseInt(ayahStr)
            );
            return row ? { text: row.text } : null;
        } catch {
            return null;
        }
    }

    // ─────────────────────────────────────────────
    // Audio timing data (replaces bundled JSON import)
    // ─────────────────────────────────────────────

    async getAlafasyTimingData(): Promise<Array<{
        ayah: number;
        surah: number;
        segments: number[][];
    }>> {
        await this.init();
        const db = this.getDb();

        try {
            const rows = await db.getAllAsync<{
                surah: number;
                ayah: number;
                segments: string;
            }>('SELECT surah, ayah, segments FROM audio_timing WHERE reciter = ?', 'Alafasy_128kbps');

            return rows.map(r => ({
                ayah: r.ayah,
                surah: r.surah,
                segments: JSON.parse(r.segments),
            }));
        } catch (e) {
            console.log('[QuranDB] audio_timing table not found, returning empty array');
            return [];
        }
    }

    // ─────────────────────────────────────────────
    // Word meaning data (replaces bundled JSON imports)
    // ─────────────────────────────────────────────

    /**
     * Get Arabic غريب القرآن meanings for a verse
     */
    async getGharibWords(surah: number, ayah: number): Promise<Array<{
        word: string;
        meaning: string;
        surah_name: string;
    }>> {
        const db = this.getDb();
        try {
            return await db.getAllAsync<{
                word: string;
                meaning: string;
                surah_name: string;
            }>('SELECT word, meaning, surah_name FROM gharib_words WHERE surah = ? AND ayah = ?', surah, ayah);
        } catch {
            return [];
        }
    }

    /**
     * Get total count of Arabic gharib words
     */
    async getGharibWordCount(): Promise<number> {
        const db = this.getDb();
        try {
            const row = await db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM gharib_words');
            return row?.cnt || 0;
        } catch {
            return 0;
        }
    }

    /**
     * Get ALL Arabic gharib words (for building verse index)
     */
    async getAllGharibWords(): Promise<Array<{
        surah: number;
        ayah: number;
        surah_name: string;
        word: string;
        meaning: string;
    }>> {
        const db = this.getDb();
        try {
            return await db.getAllAsync<{
                surah: number;
                ayah: number;
                surah_name: string;
                word: string;
                meaning: string;
            }>('SELECT surah, ayah, surah_name, word, meaning FROM gharib_words');
        } catch {
            return [];
        }
    }

    /**
     * Get English WBW translation by key (format: "surah:ayah:wordIdx")
     */
    async getWbwEnglish(key: string): Promise<string | null> {
        const db = this.getDb();
        try {
            const row = await db.getFirstAsync<{ translation: string }>(
                'SELECT translation FROM wbw_english WHERE key = ?', key
            );
            return row?.translation || null;
        } catch {
            return null;
        }
    }

    /**
     * Get all English WBW translations (for eager loading / caching)
     */
    async getAllWbwEnglish(): Promise<Record<string, string>> {
        const db = this.getDb();
        try {
            const rows = await db.getAllAsync<{ key: string; translation: string }>(
                'SELECT key, translation FROM wbw_english'
            );
            const result: Record<string, string> = {};
            for (const row of rows) {
                result[row.key] = row.translation;
            }
            return result;
        } catch {
            return {};
        }
    }

    /**
     * Get transliteration by key (format: "surah:ayah:wordIdx")
     */
    async getWbwTransliterationByKey(key: string): Promise<string | null> {
        const db = this.getDb();
        try {
            const row = await db.getFirstAsync<{ transliteration: string }>(
                'SELECT transliteration FROM wbw_transliteration WHERE key = ?', key
            );
            return row?.transliteration || null;
        } catch {
            return null;
        }
    }

    /**
     * Get all transliterations (for eager loading / caching)
     */
    async getAllWbwTransliteration(): Promise<Record<string, string>> {
        const db = this.getDb();
        try {
            const rows = await db.getAllAsync<{ key: string; transliteration: string }>(
                'SELECT key, transliteration FROM wbw_transliteration'
            );
            const result: Record<string, string> = {};
            for (const row of rows) {
                result[row.key] = row.transliteration;
            }
            return result;
        } catch {
            return {};
        }
    }

    /**
     * Get word frequency by normalized Arabic word
     */
    async getWordFrequencyCount(word: string): Promise<number> {
        const db = this.getDb();
        try {
            const row = await db.getFirstAsync<{ count: number }>(
                'SELECT count FROM word_frequencies WHERE word = ?', word
            );
            return row?.count || 0;
        } catch {
            return 0;
        }
    }

    /**
     * Get all word frequencies (for eager loading / caching)
     */
    async getAllWordFrequencies(): Promise<Record<string, number>> {
        const db = this.getDb();
        try {
            const rows = await db.getAllAsync<{ word: string; count: number }>(
                'SELECT word, count FROM word_frequencies'
            );
            const result: Record<string, number> = {};
            for (const row of rows) {
                result[row.word] = row.count;
            }
            return result;
        } catch {
            return {};
        }
    }

    // ─────────────────────────────────────────────
    // Utility
    // ─────────────────────────────────────────────


    clearCache(): void {
        this.surahCache.clear();
        this.englishSurahCache.clear();
        this.coordsCache.clear();
        this.surahMetaCache = null;
        this.allSurahsCache = null;
    }

    async close(): Promise<void> {
        if (this.db) {
            await this.db.closeAsync();
            this.db = null;
            this.initPromise = null;
            this.clearCache();
        }
    }
}

// Singleton export
export const QuranDatabase = new QuranDatabaseService();
export default QuranDatabase;
