/**
 * QuranDataBridge — Backward-compatible sync access to Quran data
 * 
 * Provides the exact same data shape as the old JSON imports
 * (quranData.data.surahs[...]) but loads from SQLite at startup
 * instead of being bundled in the JS bundle.
 * 
 * Usage:
 *   1. Call `await QuranDataBridge.init()` once at app startup (App.tsx)
 *   2. Access `QuranDataBridge.quranData` and `QuranDataBridge.englishData`
 *      synchronously — same shape as the old JSON imports
 * 
 * This eliminates 5.7 MB from the JS bundle while keeping all 21+
 * sync callsites in MushafScreen.tsx, WordMeaningService.ts, etc.
 * working without modification.
 */

import QuranDatabase from './QuranDatabase';

interface AyahData {
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

interface SurahData {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    ayahs: AyahData[];
}

interface QuranDataStructure {
    code: number;
    status: string;
    data: {
        surahs: SurahData[];
    };
}

class QuranDataBridgeService {
    private _quranData: QuranDataStructure | null = null;
    private _englishData: QuranDataStructure | null = null;
    private _allCoordinates: Record<string, any> | null = null;
    private _initPromise: Promise<void> | null = null;
    private _initialized = false;

    /**
     * Initialize the bridge by loading all Quran data from SQLite into memory.
     * Call this once at app startup in App.tsx.
     */
    async init(): Promise<void> {
        if (this._initialized) return;
        if (this._initPromise) return this._initPromise;

        this._initPromise = this._doInit();
        return this._initPromise;
    }

    private async _doInit(): Promise<void> {
        await QuranDatabase.init();

        // Load all data in parallel for fastest startup
        const [allSurahs, allCoords] = await Promise.all([
            QuranDatabase.getAllSurahs(),
            QuranDatabase.getAllCoordinates(),
        ]);

        // Build Arabic data structure matching JSON shape
        this._quranData = {
            code: 200,
            status: 'OK',
            data: {
                surahs: allSurahs,
            },
        };

        // Pre-load coordinates (11 MB — avoids async delay on Quran tab)
        this._allCoordinates = allCoords;

        // Build English data structure
        const englishSurahs: SurahData[] = [];
        for (let i = 1; i <= 114; i++) {
            const surah = await QuranDatabase.getEnglishSurah(i);
            if (surah) englishSurahs.push(surah);
        }

        this._englishData = {
            code: 200,
            status: 'OK',
            data: {
                surahs: englishSurahs,
            },
        };

        this._initialized = true;
        console.log('[QuranDataBridge] Loaded from SQLite — ready for sync access');
    }

    /**
     * Get the Arabic Quran data (same shape as quran-uthmani.json)
     */
    get quranData(): QuranDataStructure {
        if (!this._quranData) {
            throw new Error(
                '[QuranDataBridge] Not initialized. Call init() in App.tsx before accessing quranData.'
            );
        }
        return this._quranData;
    }

    /**
     * Get the English translation data (same shape as quran-english.json)
     */
    get englishData(): QuranDataStructure {
        if (!this._englishData) {
            throw new Error(
                '[QuranDataBridge] Not initialized. Call init() in App.tsx before accessing englishData.'
            );
        }
        return this._englishData;
    }

    /**
     * Get pre-loaded verse coordinates (same shape as all-pages.json)
     */
    get allCoordinates(): Record<string, any> {
        if (!this._allCoordinates) {
            throw new Error(
                '[QuranDataBridge] Not initialized. Call init() in App.tsx before accessing allCoordinates.'
            );
        }
        return this._allCoordinates;
    }

    get isInitialized(): boolean {
        return this._initialized;
    }
}

export const QuranDataBridge = new QuranDataBridgeService();
export default QuranDataBridge;
