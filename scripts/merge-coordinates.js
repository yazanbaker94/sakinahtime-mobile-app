const fs = require('fs');
const path = require('path');

const coordsDir = path.join(__dirname, '../assets/coordinates');
const output = {};

for (let page = 1; page <= 604; page++) {
  const filePath = path.join(coordsDir, `page_${page}.json`);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n');
  
  output[page] = lines
    .map(line => JSON.parse(line))
    .filter(c => c.ayah !== null && c.width > 0 && c.height > 0);
}

fs.writeFileSync(
  path.join(__dirname, '../assets/coordinates/all-pages.json'),
  JSON.stringify(output)
);

console.log('✓ Merged all coordinates into all-pages.json');
