/**
 * add-words-to-db.js
 * 
 * Adds word meaning data to the existing quran.db.
 * Run with: node scripts/add-words-to-db.js
 * 
 * Migrates:
 *   - quran_words.json (Arabic غريب القرآن meanings)
 *   - english-wbw-translation.json (English word-by-word translations)
 *   - english-wbw-transliteration.json (transliterations)
 *   - word-frequencies.json (word frequency counts)
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'assets', 'quran.db');
const WORDS_DIR = path.join(__dirname, '..', 'assets', 'words');

if (!fs.existsSync(DB_PATH)) {
    console.error('❌ quran.db not found at:', DB_PATH);
    process.exit(1);
}

const db = new Database(DB_PATH);

console.log('📦 Adding word meaning data to quran.db...\n');

// ─────────────────────────────────────────────
// 1. Arabic meanings (غريب القرآن)
// ─────────────────────────────────────────────
db.exec('DROP TABLE IF EXISTS gharib_words');
db.exec(`
  CREATE TABLE gharib_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    surah INTEGER NOT NULL,
    ayah INTEGER NOT NULL,
    surah_name TEXT NOT NULL,
    word TEXT NOT NULL,
    meaning TEXT NOT NULL
  )
`);
db.exec('CREATE INDEX idx_gharib_surah_ayah ON gharib_words(surah, ayah)');

const QURAN_WORDS_PATH = path.join(WORDS_DIR, 'quran_words.json');
if (fs.existsSync(QURAN_WORDS_PATH)) {
    console.log('📝 Loading quran_words.json (Arabic meanings)...');
    const data = JSON.parse(fs.readFileSync(QURAN_WORDS_PATH, 'utf8'));

    const insert = db.prepare(
        'INSERT INTO gharib_words (surah, ayah, surah_name, word, meaning) VALUES (?, ?, ?, ?, ?)'
    );
    const insertAll = db.transaction(() => {
        for (const w of data.words) {
            insert.run(w.surah_number, w.verse, w.surah_name, w.word, w.meaning);
        }
    });
    insertAll();
    const count = db.prepare('SELECT COUNT(*) as cnt FROM gharib_words').get();
    console.log(`   ✅ Inserted ${count.cnt} Arabic meaning entries`);
} else {
    console.log('⚠️  quran_words.json not found');
}

// ─────────────────────────────────────────────
// 2. English WBW translations (key: "surah:ayah:word_idx")
// ─────────────────────────────────────────────
db.exec('DROP TABLE IF EXISTS wbw_english');
db.exec(`
  CREATE TABLE wbw_english (
    key TEXT PRIMARY KEY,
    translation TEXT NOT NULL
  )
`);

const ENGLISH_WBW_PATH = path.join(WORDS_DIR, 'english-wbw-translation.json');
if (fs.existsSync(ENGLISH_WBW_PATH)) {
    console.log('📝 Loading english-wbw-translation.json...');
    const data = JSON.parse(fs.readFileSync(ENGLISH_WBW_PATH, 'utf8'));
    const keys = Object.keys(data);

    const insert = db.prepare('INSERT INTO wbw_english (key, translation) VALUES (?, ?)');
    const insertAll = db.transaction(() => {
        for (const key of keys) {
            insert.run(key, data[key]);
        }
    });
    insertAll();
    console.log(`   ✅ Inserted ${keys.length} English WBW entries`);
} else {
    console.log('⚠️  english-wbw-translation.json not found');
}

// ─────────────────────────────────────────────
// 3. Transliteration data (key: "surah:ayah:word_idx")
// ─────────────────────────────────────────────
db.exec('DROP TABLE IF EXISTS wbw_transliteration');
db.exec(`
  CREATE TABLE wbw_transliteration (
    key TEXT PRIMARY KEY,
    transliteration TEXT NOT NULL
  )
`);

const TRANSLIT_PATH = path.join(WORDS_DIR, 'english-wbw-transliteration.json');
if (fs.existsSync(TRANSLIT_PATH)) {
    console.log('📝 Loading english-wbw-transliteration.json...');
    const data = JSON.parse(fs.readFileSync(TRANSLIT_PATH, 'utf8'));
    const keys = Object.keys(data);

    const insert = db.prepare('INSERT INTO wbw_transliteration (key, transliteration) VALUES (?, ?)');
    const insertAll = db.transaction(() => {
        for (const key of keys) {
            insert.run(key, data[key]);
        }
    });
    insertAll();
    console.log(`   ✅ Inserted ${keys.length} transliteration entries`);
} else {
    console.log('⚠️  english-wbw-transliteration.json not found');
}

// ─────────────────────────────────────────────
// 4. Word frequencies (key: normalized Arabic word)
// ─────────────────────────────────────────────
db.exec('DROP TABLE IF EXISTS word_frequencies');
db.exec(`
  CREATE TABLE word_frequencies (
    word TEXT PRIMARY KEY,
    count INTEGER NOT NULL
  )
`);

const FREQ_PATH = path.join(WORDS_DIR, 'word-frequencies.json');
if (fs.existsSync(FREQ_PATH)) {
    console.log('📝 Loading word-frequencies.json...');
    const data = JSON.parse(fs.readFileSync(FREQ_PATH, 'utf8'));
    const keys = Object.keys(data);

    const insert = db.prepare('INSERT INTO word_frequencies (word, count) VALUES (?, ?)');
    const insertAll = db.transaction(() => {
        for (const key of keys) {
            insert.run(key, data[key]);
        }
    });
    insertAll();
    console.log(`   ✅ Inserted ${keys.length} word frequency entries`);
} else {
    console.log('⚠️  word-frequencies.json not found');
}

// Done - no VACUUM to preserve existing data
db.close();

const stats = fs.statSync(DB_PATH);
console.log(`\n✅ Done! quran.db size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
