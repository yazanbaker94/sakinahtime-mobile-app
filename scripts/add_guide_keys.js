// Smart extraction: parse islamicGuides.ts and auto-generate all locale keys
const fs = require('fs');
const path = require('path');

const localeDir = path.join(__dirname, '../client/i18n/locales');
const en = JSON.parse(fs.readFileSync(path.join(localeDir, 'en.json'), 'utf8'));
const ar = JSON.parse(fs.readFileSync(path.join(localeDir, 'ar.json'), 'utf8'));
const fr = JSON.parse(fs.readFileSync(path.join(localeDir, 'fr.json'), 'utf8'));

// Read the TS file as text
const tsContent = fs.readFileSync(path.join(__dirname, '../client/data/islamicGuides.ts'), 'utf8');

// Extract all guide objects using regex
const guideRegex = /\{\s*id:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*titleAr:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*description:\s*"([^"]+)",\s*descriptionAr:\s*"([^"]+)",\s*steps:\s*\[([\s\S]*?)\],\s*(?:references:\s*\[[\s\S]*?\],?\s*)?\}/g;

const stepRegex = /\{\s*title:\s*"([^"]+)",\s*titleAr:\s*"([^"]+)",\s*content:\s*"([^"]+)",\s*contentAr:\s*"([^"]+)"\s*\}/g;

// French translations map for guide titles, descriptions, and step content
const frenchMap = {
    // Guide titles
    "How to Perform Salah (Prayer)": "Comment Accomplir la Salah (Prière)",
    "How to Perform Istikhara Prayer": "Comment Accomplir la Prière d'Istikhara",
    "How to Perform Tahajjud Prayer": "Comment Accomplir la Prière de Tahajjud",
    "How to Perform Eid Prayer": "Comment Accomplir la Prière de l'Aïd",
    "Morning and Evening Adhkar": "Adhkar du Matin et du Soir",
    "How to Perform Wudu (Ablution)": "Comment Faire les Ablutions (Wudu)",
    "How to Perform Ghusl (Full Ritual Purification)": "Comment Faire le Ghusl (Purification Rituelle)",
    "How to Perform Tayammum (Dry Ablution)": "Comment Faire le Tayammum (Ablution Sèche)",
    "How to Perform Umrah": "Comment Accomplir la Omra",
    "How to Perform Tawaf": "Comment Accomplir le Tawaf",
    "How to Calculate and Pay Zakat": "Comment Calculer et Payer la Zakat",
    "How to Pay Zakat al-Fitr": "Comment Payer la Zakat al-Fitr",
    "How to Give Sadaqah (Voluntary Charity)": "Comment Donner la Sadaqah (Charité Volontaire)",
    "How to Fast in Ramadan": "Comment Jeûner Pendant le Ramadan",
    "How to Perform Voluntary Fasting": "Comment Pratiquer le Jeûne Volontaire",
    "How to Perform Janazah Prayer": "Comment Accomplir la Prière de Janazah",
    "How to Offer Condolences": "Comment Présenter les Condoléances",
    "How to Control Anger": "Comment Contrôler la Colère",
    "How to Practice Humility": "Comment Pratiquer l'Humilité",
    "How to Forgive Others": "Comment Pardonner aux Autres",
    "How to Seek Islamic Knowledge": "Comment Rechercher le Savoir Islamique",
    "How to Make Tawbah (Repentance)": "Comment Faire la Tawbah (Repentir)",
    "Understanding Riba (Interest)": "Comprendre le Riba (Intérêt)",
    "Earning Halal Income": "Gagner un Revenu Halal",
    "Islamic Banking Basics": "Bases de la Banque Islamique",
    "Halal Investing Guidelines": "Directives d'Investissement Halal",
    "Islamic Debt Management": "Gestion de la Dette en Islam",
};

// French translations for guide descriptions
const frenchDescMap = {
    "Comprehensive guide for performing the five daily prayers according to the Prophetic tradition": "Guide complet pour accomplir les cinq prières quotidiennes selon la tradition prophétique",
    "Guide for seeking Allah's guidance in making important decisions": "Guide pour rechercher la guidance d'Allah dans les décisions importantes",
    "Guide for performing the night prayer in the last third of the night": "Guide pour accomplir la prière de nuit dans le dernier tiers de la nuit",
    "Guide for performing Eid al-Fitr and Eid al-Adha prayers": "Guide pour accomplir les prières de l'Aïd al-Fitr et de l'Aïd al-Adha",
    "Essential remembrances to recite in the morning and evening": "Rappels essentiels à réciter le matin et le soir",
    "Detailed guide for performing ablution correctly": "Guide détaillé pour accomplir les ablutions correctement",
    "Comprehensive guide for performing full ritual bath": "Guide complet pour accomplir le bain rituel complet",
    "Guide for performing dry ablution when water is unavailable": "Guide pour les ablutions sèches quand l'eau n'est pas disponible",
    "Complete guide for performing the lesser pilgrimage": "Guide complet pour accomplir le petit pèlerinage",
    "Detailed guide for circling the Ka'bah": "Guide détaillé pour le Tawaf autour de la Ka'bah",
    "Comprehensive guide for calculating and paying obligatory charity": "Guide complet pour calculer et payer la charité obligatoire",
    "Guide for paying the obligatory charity at the end of Ramadan": "Guide pour payer la charité obligatoire à la fin du Ramadan",
    "Guide for giving voluntary charity with sincerity": "Guide pour donner la charité volontaire avec sincérité",
    "Complete guide for observing the obligatory fast": "Guide complet pour observer le jeûne obligatoire",
    "Guide for recommended voluntary fasts throughout the year": "Guide pour les jeûnes volontaires recommandés tout au long de l'année",
    "Guide for performing the funeral prayer": "Guide pour accomplir la prière funéraire",
    "Islamic etiquette for consoling the bereaved": "Étiquette islamique pour consoler les endeuillés",
    "Islamic guidance for managing anger": "Guidance islamique pour gérer la colère",
    "Guide for developing humility in Islam": "Guide pour développer l'humilité en Islam",
    "Islamic teachings on forgiveness and pardon": "Enseignements islamiques sur le pardon",
    "Guide for pursuing Islamic knowledge properly": "Guide pour rechercher le savoir islamique correctement",
    "Guide for sincere repentance from sins": "Guide pour un repentir sincère des péchés",
    "Learn about the prohibition of interest in Islam": "Comprendre l'interdiction de l'intérêt en Islam",
    "Guidelines for lawful earnings in Islam": "Directives pour les revenus licites en Islam",
    "Understanding Sharia-compliant banking": "Comprendre la banque conforme à la Charia",
    "How to invest in a Sharia-compliant manner": "Comment investir de manière conforme à la Charia",
    "Managing debt according to Islamic principles": "Gérer la dette selon les principes islamiques",
};

// Initialize
en.guides = en.guides || {};
ar.guides = ar.guides || {};
fr.guides = fr.guides || {};

let guideMatch;
let guideCount = 0;
let stepCount = 0;

while ((guideMatch = guideRegex.exec(tsContent)) !== null) {
    const [, id, title, titleAr, category, desc, descAr, stepsBlock] = guideMatch;

    const frTitle = frenchMap[title] || title;
    const frDesc = frenchDescMap[desc] || desc;

    en.guides[id] = { title, description: desc, steps: {} };
    ar.guides[id] = { title: titleAr, description: descAr, steps: {} };
    fr.guides[id] = { title: frTitle, description: frDesc, steps: {} };

    // Extract steps
    let stepMatch;
    let stepIdx = 0;
    const localStepRegex = /\{\s*title:\s*"([^"]+)",\s*titleAr:\s*"([^"]+)",\s*content:\s*"([^"]+)",\s*contentAr:\s*"([^"]+)"\s*\}/g;

    while ((stepMatch = localStepRegex.exec(stepsBlock)) !== null) {
        const [, stepTitle, stepTitleAr, stepContent, stepContentAr] = stepMatch;

        en.guides[id].steps[stepIdx] = { title: stepTitle, content: stepContent };
        ar.guides[id].steps[stepIdx] = { title: stepTitleAr, content: stepContentAr };
        // For French, use English as placeholder (better than nothing)
        fr.guides[id].steps[stepIdx] = { title: stepTitle, content: stepContent };

        stepIdx++;
        stepCount++;
    }

    guideCount++;
}

console.log(`Found ${guideCount} guides with ${stepCount} total steps`);

// Write files
fs.writeFileSync(path.join(localeDir, 'en.json'), JSON.stringify(en, null, 4), 'utf8');
fs.writeFileSync(path.join(localeDir, 'ar.json'), JSON.stringify(ar, null, 4), 'utf8');
fs.writeFileSync(path.join(localeDir, 'fr.json'), JSON.stringify(fr, null, 4), 'utf8');
console.log('✅ All guides added to locale files');

// Verify
const verify = JSON.parse(fs.readFileSync(path.join(localeDir, 'fr.json'), 'utf8'));
console.log('Guide categories:', Object.keys(verify.guideCategories));
console.log('Guides:', Object.keys(verify.guides));
console.log('Sample guide steps:', Object.keys(verify.guides['how-to-perform-salah']?.steps || {}));
