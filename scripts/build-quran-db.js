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

// Compare with source JSONs
const uthmaniSize = fs.statSync(path.join(DATA_DIR, 'quran-uthmani.json')).size;
const englishSize = fs.statSync(path.join(DATA_DIR, 'quran-english.json')).size;
const coordsSize = fs.statSync(COORDS_PATH).size;
const totalJsonMB = ((uthmaniSize + englishSize + coordsSize) / (1024 * 1024)).toFixed(2);
console.log(`\n   📊 Source JSON total: ${totalJsonMB} MB`);
console.log(`   📊 SQLite DB:         ${sizeMB} MB`);
console.log(`   📊 Savings:           ${(totalJsonMB - sizeMB).toFixed(2)} MB (${((1 - sizeMB / totalJsonMB) * 100).toFixed(1)}%)`);
