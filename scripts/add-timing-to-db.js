/**
 * add-timing-to-db.js
 * 
 * Adds audio timing data (Alafasy) to the existing quran.db.
 * Run with: node scripts/add-timing-to-db.js
 * 
 * This is an additive migration — it does NOT rebuild the base tables.
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'assets', 'quran.db');
const ALAFASY_PATH = path.join(__dirname, '..', 'assets', 'quran-align-data', 'Alafasy_128kbps.json');

if (!fs.existsSync(DB_PATH)) {
    console.error('❌ quran.db not found at:', DB_PATH);
    process.exit(1);
}

const db = new Database(DB_PATH);

// Drop existing table if re-running
db.exec('DROP TABLE IF EXISTS audio_timing');

console.log('📦 Adding audio timing data to quran.db...\n');

// Create table
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

// Load and insert Alafasy data
if (!fs.existsSync(ALAFASY_PATH)) {
    console.error('❌ Alafasy timing data not found at:', ALAFASY_PATH);
    process.exit(1);
}

console.log('🔊 Loading Alafasy_128kbps.json...');
const alafasyData = JSON.parse(fs.readFileSync(ALAFASY_PATH, 'utf8'));

const insertTiming = db.prepare(
    'INSERT INTO audio_timing (reciter, surah, ayah, segments, deletions, insertions, transpositions) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

const insertAll = db.transaction(() => {
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
insertAll();

const count = db.prepare('SELECT COUNT(*) as cnt FROM audio_timing').get();
console.log(`   ✅ Inserted ${count.cnt} audio timing entries`);

// Done - no VACUUM to preserve existing data
db.close();

const stats = fs.statSync(DB_PATH);
console.log(`\n✅ Done! quran.db size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
