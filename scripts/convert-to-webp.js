const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '../assets/images/quran');
const outputDir = inputDir; // Same directory

async function convertToWebP() {
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.png'));
  console.log(`Found ${files.length} PNG files to convert`);
  
  let converted = 0;
  let totalSavedBytes = 0;
  
  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file.replace('.png', '.webp'));
    
    try {
      const inputStats = fs.statSync(inputPath);
      
      await sharp(inputPath)
        .webp({ lossless: true })
        .toFile(outputPath);
      
      const outputStats = fs.statSync(outputPath);
      const saved = inputStats.size - outputStats.size;
      totalSavedBytes += saved;
      
      converted++;
      if (converted % 50 === 0) {
        console.log(`Converted ${converted}/${files.length}...`);
      }
    } catch (err) {
      console.error(`Failed to convert ${file}:`, err.message);
    }
  }
  
  console.log(`\nDone! Converted ${converted} files`);
  console.log(`Total space saved: ${(totalSavedBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`\nNext steps:`);
  console.log(`1. Update mushaf-images.ts to use .webp extension`);
  console.log(`2. Delete the old .png files after verifying`);
}

convertToWebP();
