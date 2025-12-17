const fs = require('fs');
const path = require('path');

const coordsDir = path.join(__dirname, '../assets/coordinates');
const IMAGE_WIDTH = 1260;
const IMAGE_HEIGHT = 1800;

let issues = [];

for (let page = 1; page <= 604; page++) {
  const filePath = path.join(coordsDir, `page_${page}.json`);
  
  if (!fs.existsSync(filePath)) {
    issues.push(`Missing: page_${page}.json`);
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n');
  
  lines.forEach((line, idx) => {
    try {
      const coord = JSON.parse(line);
      const { x, y, width, height, page: p } = coord;
      
      if (p !== page) {
        issues.push(`page_${page}.json line ${idx + 1}: page mismatch (${p})`);
      }
      
      if (x < 0 || y < 0) {
        issues.push(`page_${page}.json line ${idx + 1}: negative x/y (${x}, ${y})`);
      }
      
      if (width < 0 || height < 0) {
        issues.push(`page_${page}.json line ${idx + 1}: negative width/height (${width}, ${height})`);
      }
      
      if (x + width > IMAGE_WIDTH) {
        issues.push(`page_${page}.json line ${idx + 1}: x+width out of bounds (${x + width} > ${IMAGE_WIDTH})`);
      }
      
      if (y + height > IMAGE_HEIGHT) {
        issues.push(`page_${page}.json line ${idx + 1}: y+height out of bounds (${y + height} > ${IMAGE_HEIGHT})`);
      }
    } catch (e) {
      issues.push(`page_${page}.json line ${idx + 1}: invalid JSON`);
    }
  });
}

if (issues.length > 0) {
  console.log(`Found ${issues.length} issues:\n`);
  issues.forEach(issue => console.log(issue));
} else {
  console.log('✓ All 604 coordinate files validated successfully!');
}
