// Add azkarCategories keys to all locale files
const fs = require('fs');
const path = require('path');

const localeDir = path.join(__dirname, '../client/i18n/locales');

const en = JSON.parse(fs.readFileSync(path.join(localeDir, 'en.json'), 'utf8'));
const ar = JSON.parse(fs.readFileSync(path.join(localeDir, 'ar.json'), 'utf8'));
const fr = JSON.parse(fs.readFileSync(path.join(localeDir, 'fr.json'), 'utf8'));

// Azkar category titles keyed by category.id
en.azkarCategories = {
    morning: "Morning Azkar",
    evening: "Evening Azkar",
    "after-prayer": "After Prayer",
    sleep: "Sleep Azkar",
    waking: "Waking Up",
    general: "General Azkar"
};

ar.azkarCategories = {
    morning: "أذكار الصباح",
    evening: "أذكار المساء",
    "after-prayer": "أذكار بعد الصلاة",
    sleep: "أذكار النوم",
    waking: "أذكار الاستيقاظ",
    general: "أذكار عامة"
};

fr.azkarCategories = {
    morning: "Azkar du Matin",
    evening: "Azkar du Soir",
    "after-prayer": "Après la Prière",
    sleep: "Azkar du Sommeil",
    waking: "Au Réveil",
    general: "Azkar Généraux"
};

fs.writeFileSync(path.join(localeDir, 'en.json'), JSON.stringify(en, null, 4), 'utf8');
fs.writeFileSync(path.join(localeDir, 'ar.json'), JSON.stringify(ar, null, 4), 'utf8');
fs.writeFileSync(path.join(localeDir, 'fr.json'), JSON.stringify(fr, null, 4), 'utf8');

console.log('✅ Added azkarCategories to en.json, ar.json, fr.json');

// Verify
const enV = JSON.parse(fs.readFileSync(path.join(localeDir, 'en.json'), 'utf8'));
const arV = JSON.parse(fs.readFileSync(path.join(localeDir, 'ar.json'), 'utf8'));
const frV = JSON.parse(fs.readFileSync(path.join(localeDir, 'fr.json'), 'utf8'));
console.log('en:', JSON.stringify(enV.azkarCategories));
console.log('ar:', JSON.stringify(arV.azkarCategories));
console.log('fr:', JSON.stringify(frV.azkarCategories));
