const fs = require('fs');
const path = require('path');

// Load data
const coordinates = require('../assets/coordinates/coordinates.json');
const quranUthmani = require('../client/data/quran-uthmani.json');

console.log('Processing Mushaf coordinates...');

// Build verse lookup: page -> line -> position -> verse info
const versesByPage = {};

quranUthmani.forEach((verse) => {
  const page = verse.page;
  if (!versesByPage[page]) {
    versesByPage[page] = [];
  }
  versesByPage[page].push({
    surah: verse.surah,
    ayah: verse.numberInSurah,
    verseKey: `${verse.surah}:${verse.numberInSurah}`,
  });
});

// Process coordinates to create verse regions
const verseRegions = {};

Object.keys(versesByPage).forEach((page) => {
  const pageNum = parseInt(page);
  const verses = versesByPage[page];
  
  // Get all glyphs for this page
  const pageGlyphs = coordinates.filter(g => g.page === pageNum);
  
  if (pageGlyphs.length === 0) return;
  
  verseRegions[pageNum] = verses.map((verse) => {
    // For simplicity, create regions by dividing page into verse sections
    // This is approximate - for precise mapping, you'd need glyph-to-verse mapping
    const verseIndex = verses.indexOf(verse);
    const totalVerses = verses.length;
    
    // Get page dimensions from glyphs
    const maxX = Math.max(...pageGlyphs.map(g => g.x + g.width));
    const maxY = Math.max(...pageGlyphs.map(g => g.y + g.height));
    const minX = Math.min(...pageGlyphs.map(g => g.x));
    const minY = Math.min(...pageGlyphs.map(g => g.y));
    
    // Approximate verse regions by dividing page vertically
    const regionHeight = (maxY - minY) / totalVerses;
    
    return {
      surah: verse.surah,
      ayah: verse.ayah,
      verseKey: verse.verseKey,
      page: pageNum,
      bounds: {
        x: minX,
        y: minY + (verseIndex * regionHeight),
        width: maxX - minX,
        height: regionHeight,
      },
    };
  });
});

// Save processed data
const outputPath = path.join(__dirname, '../client/data/mushaf-verse-regions.json');
fs.writeFileSync(outputPath, JSON.stringify(verseRegions, null, 2));

console.log(`✓ Processed ${Object.keys(verseRegions).length} pages`);
console.log(`✓ Saved to: ${outputPath}`);
