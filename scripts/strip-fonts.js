const fs = require('fs');
const path = require('path');

// Path to the bundled fonts inside Expo Vector Icons
const fontsDir = path.join(
    __dirname,
    '..',
    'node_modules',
    '@expo',
    'vector-icons',
    'build',
    'vendor',
    'react-native-vector-icons',
    'Fonts'
);

// We only keep Feather and Ionicons (AlMushafQuran.ttf lives in our own assets, so it's safe)
const keepFonts = ['Feather.ttf', 'Ionicons.ttf'];

// Minimal valid TrueType font file (68 bytes) — satisfies Metro's require() 
// without adding real glyph data to the APK
const MINIMAL_TTF = Buffer.from([
    0x00, 0x01, 0x00, 0x00, // sfVersion
    0x00, 0x02, // numTables = 2
    0x00, 0x20, 0x00, 0x01, 0x00, 0x10, // searchRange, entrySelector, rangeShift
    // head table entry
    0x68, 0x65, 0x61, 0x64, // tag 'head'
    0x00, 0x00, 0x00, 0x00, // checkSum
    0x00, 0x00, 0x00, 0x2C, // offset
    0x00, 0x00, 0x00, 0x08, // length
    // cmap table entry
    0x63, 0x6D, 0x61, 0x70, // tag 'cmap'
    0x00, 0x00, 0x00, 0x00, // checkSum
    0x00, 0x00, 0x00, 0x34, // offset
    0x00, 0x00, 0x00, 0x04, // length
    // head table data (8 bytes)
    0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    // cmap table data (4 bytes)
    0x00, 0x00, 0x00, 0x00
]);

if (fs.existsSync(fontsDir)) {
    let stripped = 0;
    let totalSaved = 0;
    fs.readdirSync(fontsDir).forEach((file) => {
        if (file.endsWith('.ttf') && !keepFonts.includes(file)) {
            const filePath = path.join(fontsDir, file);
            const originalSize = fs.statSync(filePath).size;
            fs.writeFileSync(filePath, MINIMAL_TTF);
            totalSaved += originalSize - MINIMAL_TTF.length;
            stripped++;
        }
    });
    console.log(`\u{1F9F9} Replaced ${stripped} unused Expo fonts with stubs (saved ~${(totalSaved / 1024).toFixed(0)} KB).`);
} else {
    console.log('\u26A0\uFE0F Expo vector-icons Fonts dir not found, skipping font strip.');
}
