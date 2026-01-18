const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../client/data');
const files = fs.readdirSync(dataDir).filter(f => f.startsWith('timing-') && f.endsWith('.json'));

files.forEach(file => {
  const jsonPath = path.join(dataDir, file);
  const jsPath = jsonPath.replace('.json', '.ts');
  
  console.log(`Converting ${file}...`);
  
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  // Create a more compact format - just surah:ayah -> segments mapping
  const compact = {};
  data.forEach(entry => {
    const key = `${entry.surah}:${entry.ayah}`;
    // Convert [wordIdx, unknown, startMs, endMs] to [startMs, endMs] (wordIdx is just index)
    compact[key] = entry.segments.map(s => [s[2], s[3]]);
  });
  
  const tsContent = `// Auto-generated word timing data
export default ${JSON.stringify(compact)};
`;
  
  fs.writeFileSync(jsPath, tsContent);
  console.log(`Created ${path.basename(jsPath)}`);
});

console.log('Done!');
