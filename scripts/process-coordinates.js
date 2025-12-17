const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../assets/coordinates/coordinates_with_verses.json');
const outputFile = path.join(__dirname, '../client/data/verse-coordinates.json');

console.log('Reading coordinates...');
const rawData = fs.readFileSync(inputFile, 'utf8');
const lines = rawData.split('\n').filter(line => line.trim());

const byPage = {};

lines.forEach((line, idx) => {
  try {
    const coord = JSON.parse(line);
    if (coord.ayah !== null && coord.page) {
      const page = coord.page.toString();
      if (!byPage[page]) byPage[page] = [];
      byPage[page].push({
        s: coord.sura,
        a: coord.ayah,
        x: coord.x,
        y: coord.y,
        w: coord.width,
        h: coord.height
      });
    }
  } catch (e) {
    console.error(`Error on line ${idx}:`, e.message);
  }
});

const pageCount = Object.keys(byPage).length;
console.log(`Processed ${pageCount} pages`);
if (pageCount > 0) {
  fs.writeFileSync(outputFile, JSON.stringify(byPage));
} else {
  console.error('No pages processed!');
}
console.log('Done! Created:', outputFile);
