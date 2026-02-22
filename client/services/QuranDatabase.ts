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
     * to the document directory on first launch. Subsequent launches
     * open the existing file directly.
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

        if (!fileInfo.exists) {
            // First launch: copy from assets
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
