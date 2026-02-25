/**
 * build-quran-db.js
 * 
 * Pre-builds a SQLite database from the JSON data files.
 * Run with: node scripts/build-quran-db.js
 * 
 * Migrates:
 *   - quran-uthmani.json (3.1 MB) → quran_uthmani table
 *   - quran-english.json (2.6 MB) → quran_english table
 *   - all-pages.json (11.2 MB) → verse_coordinates table
 * 
 * Output: assets/quran.db (~3-5 MB compressed SQLite)
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'assets', 'quran.db');
const DATA_DIR = path.join(__dirname, '..', 'client', 'data');
const COORDS_PATH = path.join(__dirname, '..', 'assets', 'coordinates', 'all-pages.json');

// Remove existing DB if present
if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('🗑️  Removed existing quran.db');
}

const db = new Database(DB_PATH);

// Enable WAL mode for better write performance during build
db.pragma('journal_mode = WAL');

console.log('📦 Building quran.db...\n');

// ─────────────────────────────────────────────
// 1. Surah metadata table
// ─────────────────────────────────────────────
db.exec(`
  CREATE TABLE surahs (
    number INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    english_name TEXT NOT NULL,
    english_name_translation TEXT NOT NULL,
    revelation_type TEXT NOT NULL
  )
`);

// ─────────────────────────────────────────────
// 2. Quran Uthmani (Arabic) verses
// ─────────────────────────────────────────────
db.exec(`
  CREATE TABLE quran_uthmani (
    id INTEGER PRIMARY KEY,
    surah INTEGER NOT NULL,
    ayah INTEGER NOT NULL,
    text TEXT NOT NULL,
    juz INTEGER NOT NULL,
    manzil INTEGER NOT NULL,
    page INTEGER NOT NULL,
    ruku INTEGER NOT NULL,
    hizb_quarter INTEGER NOT NULL,
    sajda INTEGER NOT NULL DEFAULT 0
  )
`);
db.exec('CREATE INDEX idx_uthmani_surah_ayah ON quran_uthmani(surah, ayah)');
db.exec('CREATE INDEX idx_uthmani_page ON quran_uthmani(page)');
db.exec('CREATE INDEX idx_uthmani_juz ON quran_uthmani(juz)');

// ─────────────────────────────────────────────
// 3. Quran English (Sahih International) verses
// ─────────────────────────────────────────────
db.exec(`
  CREATE TABLE quran_english (
    id INTEGER PRIMARY KEY,
    surah INTEGER NOT NULL,
    ayah INTEGER NOT NULL,
    text TEXT NOT NULL
  )
`);
db.exec('CREATE INDEX idx_english_surah_ayah ON quran_english(surah, ayah)');

// ─────────────────────────────────────────────
// 4. Verse coordinates (per-page JSON blobs)
// ─────────────────────────────────────────────
db.exec(`
  CREATE TABLE verse_coordinates (
    page INTEGER PRIMARY KEY,
    coords TEXT NOT NULL
  )
`);

// ═══════════════════════════════════════════════
//  POPULATE DATA
// ═══════════════════════════════════════════════

// --- Uthmani ---
console.log('📖 Loading quran-uthmani.json...');
const uthmaniRaw = fs.readFileSync(path.join(DATA_DIR, 'quran-uthmani.json'), 'utf8');
const uthmaniData = JSON.parse(uthmaniRaw);

const insertSurah = db.prepare(
    'INSERT INTO surahs (number, name, english_name, english_name_translation, revelation_type) VALUES (?, ?, ?, ?, ?)'
);
const insertUthmani = db.prepare(
    'INSERT INTO quran_uthmani (id, surah, ayah, text, juz, manzil, page, ruku, hizb_quarter, sajda) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);

const insertUthmaniAll = db.transaction(() => {
    for (const surah of uthmaniData.data.surahs) {
        insertSurah.run(
            surah.number,
            surah.name,
            surah.englishName,
            surah.englishNameTranslation,
            surah.revelationType
        );
        for (const ayah of surah.ayahs) {
            insertUthmani.run(
                ayah.number,       // global verse id
                surah.number,      // surah number
                ayah.numberInSurah,// ayah within surah
                ayah.text,
                ayah.juz,
                ayah.manzil,
                ayah.page,
                ayah.ruku,
                ayah.hizbQuarter,
                ayah.sajda ? 1 : 0
            );
        }
    }
});
insertUthmaniAll();
console.log(`   ✅ Inserted ${uthmaniData.data.surahs.length} surahs with all verses`);

// --- English ---
console.log('📖 Loading quran-english.json...');
const englishRaw = fs.readFileSync(path.join(DATA_DIR, 'quran-english.json'), 'utf8');
const englishData = JSON.parse(englishRaw);

const insertEnglish = db.prepare(
    'INSERT INTO quran_english (id, surah, ayah, text) VALUES (?, ?, ?, ?)'
);

const insertEnglishAll = db.transaction(() => {
    for (const surah of englishData.data.surahs) {
        for (const ayah of surah.ayahs) {
            insertEnglish.run(
                ayah.number,
                surah.number,
                ayah.numberInSurah,
                ayah.text
            );
        }
    }
});
insertEnglishAll();
console.log(`   ✅ Inserted English translations`);

// --- Coordinates ---
console.log('📖 Loading all-pages.json (11 MB)...');
const coordsRaw = fs.readFileSync(COORDS_PATH, 'utf8');
const coordsData = JSON.parse(coordsRaw);

const insertCoord = db.prepare(
    'INSERT INTO verse_coordinates (page, coords) VALUES (?, ?)'
);

const insertCoordsAll = db.transaction(() => {
    // The coords file structure: object keyed by page number, or array
    if (Array.isArray(coordsData)) {
        coordsData.forEach((pageCoords, index) => {
            insertCoord.run(index + 1, JSON.stringify(pageCoords));
        });
    } else {
        // Object keyed by page number
        for (const [pageNum, pageCoords] of Object.entries(coordsData)) {
            insertCoord.run(parseInt(pageNum), JSON.stringify(pageCoords));
        }
    }
});
insertCoordsAll();
const coordCount = db.prepare('SELECT COUNT(*) as cnt FROM verse_coordinates').get();
console.log(`   ✅ Inserted coordinates for ${coordCount.cnt} pages`);

// ─────────────────────────────────────────────
// 5. Audio timing data (Alafasy — bundled reciter)
// ─────────────────────────────────────────────
db.exec(`
  CREATE TABLE audio_timing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reciter TEXT NOT NULL,
    surah INTEGER NOT NULL,
    ayah INTEGER NOT NULL,
    segments TEXT NOT NULL,
    deletions INTEGER NOT NULL DEFAULT 0,
    insertions INTEGER NOT NULL DEFAULT 0,
    transpositions INTEGER NOT NULL DEFAULT 0
  )
`);
db.exec('CREATE INDEX idx_timing_reciter_surah_ayah ON audio_timing(reciter, surah, ayah)');

const ALAFASY_PATH = path.join(__dirname, '..', 'assets', 'quran-align-data', 'Alafasy_128kbps.json');
if (fs.existsSync(ALAFASY_PATH)) {
    console.log('🔊 Loading Alafasy_128kbps.json (timing data)...');
    const alafasyRaw = fs.readFileSync(ALAFASY_PATH, 'utf8');
    const alafasyData = JSON.parse(alafasyRaw);

    const insertTiming = db.prepare(
        'INSERT INTO audio_timing (reciter, surah, ayah, segments, deletions, insertions, transpositions) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    const insertTimingAll = db.transaction(() => {
        for (const entry of alafasyData) {
            if (!entry.segments || !Array.isArray(entry.segments)) continue;
            insertTiming.run(
                'Alafasy_128kbps',
                entry.surah || 0,
                entry.ayah || 0,
                JSON.stringify(entry.segments),
                (entry.stats && entry.stats.deletions) || 0,
                (entry.stats && entry.stats.insertions) || 0,
                (entry.stats && entry.stats.transpositions) || 0
            );
        }
    });
    insertTimingAll();
    const timingCount = db.prepare('SELECT COUNT(*) as cnt FROM audio_timing').get();
    console.log(`   ✅ Inserted ${timingCount.cnt} audio timing entries`);
} else {
    console.log('⚠️  Alafasy timing data not found, skipping');
}

// ─────────────────────────────────────────────
// 6. Word meaning data (WBW translation, transliteration, frequencies)
// ─────────────────────────────────────────────
const WORDS_DIR = path.join(__dirname, '..', 'assets', 'words');

// 6a. Quran words table
db.exec(`
  CREATE TABLE quran_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    surah INTEGER NOT NULL,
    ayah INTEGER NOT NULL,
    word_index INTEGER NOT NULL,
    arabic TEXT NOT NULL
  )
`);
db.exec('CREATE INDEX idx_words_surah_ayah ON quran_words(surah, ayah)');

// 6b. Word-by-word translations
db.exec(`
  CREATE TABLE wbw_translation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    surah INTEGER NOT NULL,
    ayah INTEGER NOT NULL,
    word_index INTEGER NOT NULL,
    translation TEXT NOT NULL
  )
`);
db.exec('CREATE INDEX idx_wbw_trans_surah_ayah ON wbw_translation(surah, ayah)');

// 6c. Word-by-word transliteration
db.exec(`
  CREATE TABLE wbw_transliteration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    surah INTEGER NOT NULL,
    ayah INTEGER NOT NULL,
    word_index INTEGER NOT NULL,
    transliteration TEXT NOT NULL
  )
`);
db.exec('CREATE INDEX idx_wbw_translit_surah_ayah ON wbw_transliteration(surah, ayah)');

// 6d. Word frequencies
db.exec(`
  CREATE TABLE word_frequencies (
    word TEXT PRIMARY KEY,
    count INTEGER NOT NULL
  )
`);

// Load and insert word data
const QURAN_WORDS_PATH = path.join(WORDS_DIR, 'quran_words.json');
const ENGLISH_WBW_PATH = path.join(WORDS_DIR, 'english-wbw-translation.json');
const ENGLISH_TRANSLIT_PATH = path.join(WORDS_DIR, 'english-wbw-transliteration.json');
const WORD_FREQ_PATH = path.join(WORDS_DIR, 'word-frequencies.json');

if (fs.existsSync(QURAN_WORDS_PATH)) {
    console.log('📝 Loading quran_words.json...');
    const wordsData = JSON.parse(fs.readFileSync(QURAN_WORDS_PATH, 'utf8'));

    const insertWord = db.prepare(
        'INSERT INTO quran_words (surah, ayah, word_index, arabic) VALUES (?, ?, ?, ?)'
    );
    const insertWordsAll = db.transaction(() => {
        for (const [key, words] of Object.entries(wordsData)) {
            const [surah, ayah] = key.split(':').map(Number);
            if (Array.isArray(words)) {
                words.forEach((word, idx) => {
                    insertWord.run(surah, ayah, idx, typeof word === 'string' ? word : JSON.stringify(word));
                });
            }
        }
    });
    insertWordsAll();
    const wordCount = db.prepare('SELECT COUNT(*) as cnt FROM quran_words').get();
    console.log(`   ✅ Inserted ${wordCount.cnt} Quran words`);
} else {
    console.log('⚠️  quran_words.json not found, skipping');
}

if (fs.existsSync(ENGLISH_WBW_PATH)) {
    console.log('📝 Loading english-wbw-translation.json...');
    const transData = JSON.parse(fs.readFileSync(ENGLISH_WBW_PATH, 'utf8'));

    const insertTrans = db.prepare(
        'INSERT INTO wbw_translation (surah, ayah, word_index, translation) VALUES (?, ?, ?, ?)'
    );
    const insertTransAll = db.transaction(() => {
        for (const [key, words] of Object.entries(transData)) {
            const [surah, ayah] = key.split(':').map(Number);
            if (Array.isArray(words)) {
                words.forEach((word, idx) => {
                    insertTrans.run(surah, ayah, idx, typeof word === 'string' ? word : JSON.stringify(word));
                });
            }
        }
    });
    insertTransAll();
    const transCount = db.prepare('SELECT COUNT(*) as cnt FROM wbw_translation').get();
    console.log(`   ✅ Inserted ${transCount.cnt} WBW translations`);
} else {
    console.log('⚠️  english-wbw-translation.json not found, skipping');
}

if (fs.existsSync(ENGLISH_TRANSLIT_PATH)) {
    console.log('📝 Loading english-wbw-transliteration.json...');
    const translitData = JSON.parse(fs.readFileSync(ENGLISH_TRANSLIT_PATH, 'utf8'));

    const insertTranslit = db.prepare(
        'INSERT INTO wbw_transliteration (surah, ayah, word_index, transliteration) VALUES (?, ?, ?, ?)'
    );
    const insertTranslitAll = db.transaction(() => {
        for (const [key, words] of Object.entries(translitData)) {
            const [surah, ayah] = key.split(':').map(Number);
            if (Array.isArray(words)) {
                words.forEach((word, idx) => {
                    insertTranslit.run(surah, ayah, idx, typeof word === 'string' ? word : JSON.stringify(word));
                });
            }
        }
    });
    insertTranslitAll();
    const translitCount = db.prepare('SELECT COUNT(*) as cnt FROM wbw_transliteration').get();
    console.log(`   ✅ Inserted ${translitCount.cnt} WBW transliterations`);
} else {
    console.log('⚠️  english-wbw-transliteration.json not found, skipping');
}

if (fs.existsSync(WORD_FREQ_PATH)) {
    console.log('📝 Loading word-frequencies.json...');
    const freqData = JSON.parse(fs.readFileSync(WORD_FREQ_PATH, 'utf8'));

    const insertFreq = db.prepare(
        'INSERT INTO word_frequencies (word, count) VALUES (?, ?)'
    );
    const insertFreqAll = db.transaction(() => {
        for (const [word, count] of Object.entries(freqData)) {
            insertFreq.run(word, typeof count === 'number' ? count : parseInt(count));
        }
    });
    insertFreqAll();
    const freqCount = db.prepare('SELECT COUNT(*) as cnt FROM word_frequencies').get();
    console.log(`   ✅ Inserted ${freqCount.cnt} word frequency entries`);
} else {
    console.log('⚠️  word-frequencies.json not found, skipping');
}

// ═══════════════════════════════════════════════
//  FINALIZE
// ═══════════════════════════════════════════════

// Switch to DELETE journal mode for the final file (smaller)
db.pragma('journal_mode = DELETE');

// VACUUM to compact the DB
console.log('\n🗜️  Compacting database...');
db.exec('VACUUM');

db.close();

const stats = fs.statSync(DB_PATH);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`\n✅ quran.db built successfully!`);
console.log(`   📁 Size: ${sizeMB} MB`);
console.log(`   📍 Path: ${DB_PATH}`);
