// Compare en.json and fr.json — find untranslated values
const fs = require('fs');
const path = require('path');
const en = JSON.parse(fs.readFileSync(path.join(__dirname, '../client/i18n/locales/en.json'), 'utf8'));
const fr = JSON.parse(fs.readFileSync(path.join(__dirname, '../client/i18n/locales/fr.json'), 'utf8'));

const missing = [];
const untranslated = [];

function compare(enObj, frObj, prefix = '') {
    for (const key of Object.keys(enObj)) {
        const p = prefix ? `${prefix}.${key}` : key;
        if (frObj[key] === undefined) {
            missing.push(p);
        } else if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
            compare(enObj[key], frObj[key], p);
        } else if (typeof enObj[key] === 'string' && enObj[key] === frObj[key]) {
            // Skip known same-in-both-languages values
            const skip = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Qibla', 'Auto', 'Tafsir', 'Hadith',
                'Sadaqah', 'Zakat', 'Waqf', 'Iqama', 'Hanafi', 'Standard', 'Nisab', 'Suhoor', 'Iftar',
                'Juz', 'QIBLA', 'KM', 'OK', 'min', 'Khatm', 'Taraweeh', 'Tarawih'];
            if (!skip.includes(enObj[key]) && enObj[key].length > 1) {
                untranslated.push({ path: p, value: enObj[key] });
            }
        }
    }
}

compare(en, fr);

console.log(`\n=== MISSING KEYS (in en.json but not in fr.json): ${missing.length} ===`);
missing.forEach(k => console.log(`  ${k}`));

console.log(`\n=== UNTRANSLATED (same value in en and fr): ${untranslated.length} ===`);
untranslated.forEach(({ path, value }) => console.log(`  ${path}: "${value}"`));

console.log(`\nTotal missing: ${missing.length}, Untranslated: ${untranslated.length}`);
