/**
 * Generate word frequency data from quran-uthmani.json
 * Run with: node scripts/generate-word-frequencies.js
 * 
 * Output: assets/words/word-frequencies.json
 * Format: { "normalized_word": count, ... }
 */

const fs = require('fs');
const path = require('path');

// Load Quran data
const quranPath = path.join(__dirname, '../client/data/quran-uthmani.json');
const quranData = JSON.parse(fs.readFileSync(quranPath, 'utf8'));

// Quranic stop signs and markers to filter out
const STOP_SIGNS = new Set([
  'ۛ', 'ۖ', 'ۗ', 'ۘ', 'ۙ', 'ۚ', 'ۜ',
  '۞', '۩',
  'ج', 'ز', 'ص', 'صل', 'صلى', 'قلى', 'م', 'لا', 'ق', 'سكتة',
  '٭', '؀', '؁', '؂', '؃',
]);

/**
 * Normalize Arabic text for consistent matching
 * Removes diacritics and normalizes letter forms
 */
function normalizeArabic(text) {
  return text
    // Remove all diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[\u0617-\u061A]/g, '')
    // Remove tatweel (kashida)
    .replace(/\u0640/g, '')
    // Remove Quranic symbols and markers
    .replace(/[\u0600-\u0605\u0610-\u061A\u06D6-\u06ED]/g, '')
    // Normalize alef variations (أ إ آ ٱ -> ا)
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    // Normalize teh marbuta to heh (ة -> ه)
    .replace(/\u0629/g, '\u0647')
    // Normalize yeh variations (ى ي ی ې -> ي)
    .replace(/[\u0649\u064A\u06CC\u06D0]/g, '\u064A')
    // Normalize waw with hamza (ؤ -> و)
    .replace(/\u0624/g, '\u0648')
    // Normalize yeh with hamza (ئ -> ي)
    .replace(/\u0626/g, '\u064A')
    // Remove zero-width characters
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '')
    // Remove BOM
    .replace(/^\uFEFF/, '')
    .trim();
}

/**
 * Check if a word is a stop sign or marker
 */
function isStopSign(word) {
  if (STOP_SIGNS.has(word)) return true;
  if (word.length === 1) {
    const code = word.charCodeAt(0);
    // Quranic annotation signs: U+06D6 to U+06ED
    if (code >= 0x06D6 && code <= 0x06ED) return true;
    // Arabic extended marks
    if (code >= 0x0610 && code <= 0x061A) return true;
  }
  return false;
}

// Count word frequencies
const wordCounts = new Map();
let totalWords = 0;
let uniqueWords = 0;

console.log('Processing Quran text...');

for (const surah of quranData.data.surahs) {
  for (const ayah of surah.ayahs) {
    const words = ayah.text.split(/\s+/).filter(w => w.length > 0 && !isStopSign(w));
    
    for (const word of words) {
      const normalized = normalizeArabic(word);
      if (normalized.length === 0) continue;
      
      totalWords++;
      const currentCount = wordCounts.get(normalized) || 0;
      wordCounts.set(normalized, currentCount + 1);
    }
  }
}

uniqueWords = wordCounts.size;

// Convert to object for JSON
const frequencies = {};
for (const [word, count] of wordCounts) {
  frequencies[word] = count;
}

// Sort by frequency (descending) for inspection
const sorted = Object.entries(frequencies).sort((a, b) => b[1] - a[1]);

console.log(`\nTotal words: ${totalWords}`);
console.log(`Unique words: ${uniqueWords}`);
console.log(`\nTop 20 most frequent words:`);
sorted.slice(0, 20).forEach(([word, count], i) => {
  console.log(`  ${i + 1}. "${word}" - ${count} times`);
});

// Write output
const outputPath = path.join(__dirname, '../assets/words/word-frequencies.json');
fs.writeFileSync(outputPath, JSON.stringify(frequencies));

const stats = fs.statSync(outputPath);
console.log(`\nOutput: ${outputPath}`);
console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);
