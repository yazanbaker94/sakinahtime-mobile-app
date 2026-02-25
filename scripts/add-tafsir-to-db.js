/**
 * add-tafsir-to-db.js
 * 
 * Adds Tafsir Jalalayn data to the existing quran.db.
 * Run with: node scripts/add-tafsir-to-db.js
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'assets', 'quran.db');
const TAFSIR_PATH = path.join(__dirname, '..', 'client', 'data', 'tafsir-jalalayn.json');

if (!fs.existsSync(DB_PATH)) {
    console.error('❌ quran.db not found');
    process.exit(1);
}

const db = new Database(DB_PATH);

db.exec('DROP TABLE IF EXISTS tafsir_jalalayn');
db.exec(`
  CREATE TABLE tafsir_jalalayn (
    surah INTEGER NOT NULL,
    ayah INTEGER NOT NULL,
    text TEXT NOT NULL,
    PRIMARY KEY (surah, ayah)
  )
`);

console.log('📖 Loading tafsir-jalalayn.json...');
const data = JSON.parse(fs.readFileSync(TAFSIR_PATH, 'utf8'));
const keys = Object.keys(data);

const insert = db.prepare('INSERT INTO tafsir_jalalayn (surah, ayah, text) VALUES (?, ?, ?)');
const insertAll = db.transaction(() => {
    for (const key of keys) {
        const [surah, ayah] = key.split(':').map(Number);
        insert.run(surah, ayah, data[key]);
    }
});
insertAll();

const count = db.prepare('SELECT COUNT(*) as cnt FROM tafsir_jalalayn').get();
console.log(`✅ Inserted ${count.cnt} tafsir entries`);

db.close();
const stats = fs.statSync(DB_PATH);
console.log(`✅ quran.db size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
