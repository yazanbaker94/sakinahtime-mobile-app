const fs = require('fs');
const path = require('path');

console.log('Loading data...');

// Load coordinates with verses (newline-delimited JSON)
const coordinatesPath = path.join(__dirname, '../assets/coordinates/coordinates_with_verses.json');
let coordinates = [];
try {
  const coordinatesRaw = fs.readFileSync(coordinatesPath, 'utf8');
  const lines = coordinatesRaw.trim().split('\n').filter(line => line.trim());
  console.log(`Found ${lines.length} lines in file`);
  
  coordinates = lines.map((line, index) => {
      try {
        const parsed = JSON.parse(line);
        if (index < 3) console.log('Sample glyph:', parsed);
        return parsed;
      } catch (e) {
        console.error(`Error parsing line ${index}:`, e.message);
        return null;
      }
    })
    .filter(item => item !== null && item.sura !== null && item.ayah !== null);
  
  console.log(`After filtering: ${coordinates.length} glyphs with sura/ayah`);
} catch (e) {
  console.error('Error loading coordinates:', e.message);
  process.exit(1);
}

console.log(`Total loaded: ${coordinates.length} glyphs`);

console.log('Grouping glyphs by verse...');

console.log('Processing verse regions...');

// Group glyphs by page and verse
const verseGlyphs = {};
coordinates.forEach(glyph => {
  const key = `${glyph.page}-${glyph.sura}-${glyph.ayah}`;
  if (!verseGlyphs[key]) {
    verseGlyphs[key] = [];
  }
  verseGlyphs[key].push(glyph);
});

console.log(`Found ${Object.keys(verseGlyphs).length} unique verses`);

// Create verse regions by calculating bounding box for each verse
const verseRegions = {};

Object.keys(verseGlyphs).forEach(key => {
  const glyphs = verseGlyphs[key];
  const firstGlyph = glyphs[0];
  const page = firstGlyph.page;
  const sura = firstGlyph.sura;
  const ayah = firstGlyph.ayah;
  
  // Calculate bounding box for this verse
  const minX = Math.min(...glyphs.map(g => g.x));
  const maxX = Math.max(...glyphs.map(g => g.x + g.width));
  const minY = Math.min(...glyphs.map(g => g.y));
  const maxY = Math.max(...glyphs.map(g => g.y + g.height));
  
  if (!verseRegions[page]) {
    verseRegions[page] = [];
  }
  
  verseRegions[page].push({
    surah: sura,
    ayah: ayah,
    verseKey: `${sura}:${ayah}`,
    page: page,
    bounds: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
  });
});

// Sort verses on each page by position
Object.keys(verseRegions).forEach(page => {
  verseRegions[page].sort((a, b) => a.bounds.y - b.bounds.y);
});

// Save to file
const outputPath = path.join(__dirname, '../client/data/mushaf-verse-regions.json');
fs.writeFileSync(outputPath, JSON.stringify(verseRegions, null, 2));

const totalVerses = Object.values(verseRegions).reduce((sum, page) => sum + page.length, 0);
console.log(`✓ Processed ${Object.keys(verseRegions).length} pages`);
console.log(`✓ Created ${totalVerses} verse regions`);
console.log(`✓ Saved to: ${outputPath}`);
