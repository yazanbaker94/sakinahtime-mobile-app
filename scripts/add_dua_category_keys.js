// Add duaCategories keys to all locale files
const fs = require('fs');
const path = require('path');

const localeDir = path.join(__dirname, '../client/i18n/locales');

const en = JSON.parse(fs.readFileSync(path.join(localeDir, 'en.json'), 'utf8'));
const ar = JSON.parse(fs.readFileSync(path.join(localeDir, 'ar.json'), 'utf8'));
const fr = JSON.parse(fs.readFileSync(path.join(localeDir, 'fr.json'), 'utf8'));

// Dua category titles keyed by category.id (from duaCategories.ts)
en.duaCategories = {
    travel: "Travel",
    eating: "Eating & Drinking",
    sleeping: "Sleeping & Waking",
    places: "Entering & Leaving",
    weather: "Weather & Nature",
    health: "Health & Healing",
    protection: "Protection",
    gratitude: "Gratitude",
    forgiveness: "Forgiveness",
    guidance: "Guidance",
    family: "Family & Children",
    general: "General"
};

ar.duaCategories = {
    travel: "السفر",
    eating: "الطعام والشراب",
    sleeping: "النوم والاستيقاظ",
    places: "الدخول والخروج",
    weather: "الطقس والطبيعة",
    health: "الصحة والشفاء",
    protection: "الحماية",
    gratitude: "الشكر",
    forgiveness: "الاستغفار",
    guidance: "الهداية",
    family: "الأسرة والأولاد",
    general: "عامة"
};

fr.duaCategories = {
    travel: "Voyage",
    eating: "Repas et Boisson",
    sleeping: "Sommeil et Réveil",
    places: "Entrer et Sortir",
    weather: "Météo et Nature",
    health: "Santé et Guérison",
    protection: "Protection",
    gratitude: "Gratitude",
    forgiveness: "Pardon",
    guidance: "Guidance",
    family: "Famille et Enfants",
    general: "Général"
};

fs.writeFileSync(path.join(localeDir, 'en.json'), JSON.stringify(en, null, 4), 'utf8');
fs.writeFileSync(path.join(localeDir, 'ar.json'), JSON.stringify(ar, null, 4), 'utf8');
fs.writeFileSync(path.join(localeDir, 'fr.json'), JSON.stringify(fr, null, 4), 'utf8');

console.log('✅ Added duaCategories to en.json, ar.json, fr.json');
console.log('en:', JSON.stringify(en.duaCategories));
console.log('fr:', JSON.stringify(fr.duaCategories));
