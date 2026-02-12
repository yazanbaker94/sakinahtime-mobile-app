// Batch 2: French translations for hajj + charity + fasting guides
const fs = require('fs');
const path = require('path');
const localeDir = path.join(__dirname, '../client/i18n/locales');
const fr = JSON.parse(fs.readFileSync(path.join(localeDir, 'fr.json'), 'utf8'));

// how-to-perform-umrah
fr.guides["how-to-perform-umrah"].steps = {
    0: { title: "1. Entrer en Ihram", content: "Avant d'atteindre le Miqat, faites l'intention de la Omra, faites le ghusl et portez les vêtements d'Ihram. Dites la Talbiyah : 'Labbayk Allahumma Umrah'." },
    1: { title: "2. Entrer dans le Masjid al-Haram", content: "Entrez avec votre pied droit et dites le dua pour entrer dans la mosquée." },
    2: { title: "3. Accomplir le Tawaf", content: "Faites sept tours autour de la Ka'bah dans le sens inverse des aiguilles d'une montre, en commençant par la Pierre Noire. Les hommes doivent découvrir l'épaule droite (Idtiba) et marcher rapidement dans les trois premiers tours (Raml)." },
    3: { title: "4. Prier deux Rak'ahs", content: "Après le Tawaf, priez deux rak'ahs derrière le Maqam Ibrahim si possible, ou n'importe où dans le Haram." },
    4: { title: "5. Boire le Zamzam", content: "Buvez de l'eau de Zamzam et faites des invocations." },
    5: { title: "6. Accomplir le Sa'i", content: "Marchez entre Safa et Marwah sept fois, en commençant par Safa. Les hommes doivent courir entre les lumières vertes." },
    6: { title: "7. Se raser ou couper les cheveux", content: "Les hommes doivent se raser la tête ou couper les cheveux. Les femmes doivent couper la longueur d'un bout de doigt. Cela complète votre Omra." }
};

// how-to-perform-tawaf
fr.guides["how-to-perform-tawaf"].steps = {
    0: { title: "1. Faire face à la Pierre Noire", content: "Tenez-vous face à la Pierre Noire (Hajar al-Aswad) avec la Ka'bah à votre gauche." },
    1: { title: "2. Faire l'intention", content: "Faites l'intention du Tawaf dans votre cœur." },
    2: { title: "3. Toucher ou pointer", content: "Si possible, touchez et embrassez la Pierre Noire. Sinon, pointez-la et dites 'Bismillah, Allahu Akbar'." },
    3: { title: "4. Commencer à tourner", content: "Marchez dans le sens inverse des aiguilles d'une montre autour de la Ka'bah, en la gardant à votre gauche. Les hommes doivent découvrir l'épaule droite." },
    4: { title: "5. Réciter le Dhikr et le Dua", content: "Il n'y a pas de duas spécifiques pour le Tawaf. Récitez le Coran, faites du dhikr ou des invocations personnelles." },
    5: { title: "6. Toucher le Coin Yéménite", content: "Si possible, touchez le Coin Yéménite (Rukn Yamani) avec votre main droite sans l'embrasser." },
    6: { title: "7. Compléter sept tours", content: "Complétez sept tours complets. Chaque fois que vous passez devant la Pierre Noire, pointez-la et dites 'Allahu Akbar'." },
    7: { title: "8. Prier deux Rak'ahs", content: "Après avoir terminé le Tawaf, priez deux rak'ahs derrière le Maqam Ibrahim ou n'importe où dans le Haram." }
};

// how-to-calculate-zakat
fr.guides["how-to-calculate-zakat"].steps = {
    0: { title: "1. Comprendre le Nisab", content: "Le Nisab est le montant minimum de richesse que l'on doit posséder avant que la Zakat ne soit due. Il est équivalent à 85 grammes d'or ou 595 grammes d'argent." },
    1: { title: "2. Calculer votre richesse", content: "Additionnez tous vos actifs soumis à la Zakat : espèces, épargne bancaire, or, argent, inventaire commercial, actions et créances." },
    2: { title: "3. Déduire les dettes", content: "Soustrayez toutes les dettes que vous devez et qui sont exigibles dans l'année." },
    3: { title: "4. Vérifier si au-dessus du Nisab", content: "Si votre richesse nette soumise à la Zakat est au-dessus du seuil du Nisab, la Zakat est obligatoire." },
    4: { title: "5. Calculer 2,5%", content: "Multipliez votre richesse soumise à la Zakat par 0,025 (2,5%). C'est le montant de votre Zakat." },
    5: { title: "6. Payer aux bénéficiaires éligibles", content: "Distribuez votre Zakat aux huit catégories mentionnées dans le Coran 9:60 : les pauvres, les nécessiteux, les collecteurs, ceux dont les cœurs sont à réconcilier, les esclaves, les endettés, dans la cause d'Allah et les voyageurs." },
    6: { title: "7. Faire l'intention", content: "Lors du paiement, faites l'intention que c'est votre Zakat obligatoire." }
};

// how-to-pay-zakat-al-fitr
fr.guides["how-to-pay-zakat-al-fitr"].steps = {
    0: { title: "1. Comprendre l'objectif", content: "La Zakat al-Fitr purifie le jeûneur des paroles vaines et obscènes, et fournit de la nourriture aux pauvres le jour de l'Aïd." },
    1: { title: "2. Qui doit payer", content: "Tout musulman qui possède de la nourriture en excès de ses besoins pour un jour et une nuit doit payer la Zakat al-Fitr pour lui-même et ses personnes à charge." },
    2: { title: "3. Calculer le montant", content: "Le montant est d'un Sa' (environ 3 kg ou 2,5 litres) de nourriture de base (blé, orge, dattes, raisins secs ou riz), ou son équivalent monétaire." },
    3: { title: "4. Le moment", content: "Elle doit être payée avant la prière de l'Aïd. Il est préférable de la payer 1-2 jours avant l'Aïd. Payer après la prière est considéré comme une aumône tardive, pas une Zakat al-Fitr." },
    4: { title: "5. Donner aux pauvres", content: "Donnez-la directement aux musulmans pauvres et nécessiteux de votre communauté, ou par l'intermédiaire d'une organisation de confiance." }
};

// how-to-give-sadaqah
fr.guides["how-to-give-sadaqah"].steps = {
    0: { title: "1. Purifier l'intention", content: "Donnez la charité uniquement pour la satisfaction d'Allah, pas pour la reconnaissance ou les éloges des gens." },
    1: { title: "2. Donner de la richesse Halal", content: "Assurez-vous que votre charité provient d'argent gagné licitement. Allah n'accepte que ce qui est pur." },
    2: { title: "3. Donner en secret si possible", content: "Le Prophète (ﷺ) a dit que la meilleure charité est celle donnée en secret. Cependant, la charité publique peut inspirer les autres." },
    3: { title: "4. Donner régulièrement", content: "Même de petits montants donnés régulièrement sont meilleurs que de grands montants donnés occasionnellement. Le Prophète (ﷺ) a dit que les actes les plus aimés d'Allah sont ceux faits avec constance." },
    4: { title: "5. Ne pas rappeler aux bénéficiaires", content: "Ne rappelez jamais aux gens votre charité et ne les blessez pas par vos paroles. Cela annule la récompense." },
    5: { title: "6. Le sourire est une charité", content: "Rappelez-vous que la charité n'est pas seulement de l'argent. Un sourire, aider quelqu'un, enlever un obstacle du chemin et les paroles aimables sont toutes des formes de Sadaqah." }
};

// how-to-fast-ramadan
fr.guides["how-to-fast-ramadan"].steps = {
    0: { title: "1. Faire l'intention la nuit", content: "Faites l'intention de jeûner avant le Fajr. Le Prophète (ﷺ) a dit : 'Quiconque n'a pas l'intention de jeûner avant le Fajr, son jeûne n'est pas valide.'" },
    1: { title: "2. Manger le Suhoor", content: "Mangez le repas avant l'aube (Suhoor). Le Prophète (ﷺ) a dit : 'Mangez le Suhoor, car il y a de la bénédiction dedans.' Arrêtez de manger avant le début du Fajr." },
    2: { title: "3. S'abstenir de nourriture, boisson et relations", content: "Du Fajr jusqu'au Maghrib, abstenez-vous de nourriture, boisson, tabac et relations conjugales." },
    3: { title: "4. Garder sa langue", content: "Évitez le mensonge, la médisance, les disputes et le langage grossier. Le Prophète (ﷺ) a dit : 'Quiconque n'abandonne pas le faux discours et les actes qui en découlent, Allah n'a pas besoin qu'il abandonne sa nourriture et sa boisson.'" },
    4: { title: "5. Multiplier les bonnes actions", content: "Augmentez la prière, la récitation du Coran, le dhikr et la charité. Le Ramadan est le mois du Coran et de la générosité." },
    5: { title: "6. Rompre le jeûne au Maghrib", content: "Rompez votre jeûne immédiatement quand le Maghrib arrive. Le Prophète (ﷺ) rompait son jeûne avec des dattes et de l'eau, puis priait le Maghrib." },
    6: { title: "7. Faire le Dua avant de rompre", content: "L'invocation du jeûneur est acceptée. Dites : 'Allahumma laka sumtu wa ala rizqika aftartu' (Ô Allah, pour Toi j'ai jeûné et avec Ta provision je romps mon jeûne)." }
};

// how-to-fast-voluntarily
fr.guides["how-to-fast-voluntarily"].steps = {
    0: { title: "1. Les lundis et jeudis", content: "Le Prophète (ﷺ) jeûnait les lundis et jeudis. Il a dit que les actes sont présentés à Allah ces jours-là." },
    1: { title: "2. Trois jours chaque mois", content: "Jeûnez les 13, 14 et 15 de chaque mois lunaire (les jours blancs). Cela équivaut à jeûner toute l'année." },
    2: { title: "3. Le jour d'Arafah", content: "Jeûnez le 9 de Dhul-Hijjah (pour les non-pèlerins). Le Prophète (ﷺ) a dit que cela expie les péchés de l'année précédente et de l'année suivante." },
    3: { title: "4. Le jour d'Achoura", content: "Jeûnez le 10 de Muharram, et il est recommandé de jeûner le 9 ou le 11 avec. Cela expie les péchés de l'année précédente." },
    4: { title: "5. Six jours de Shawwal", content: "Jeûnez six jours de Shawwal après le Ramadan. Le Prophète (ﷺ) a dit que c'est comme jeûner toute l'année." },
    5: { title: "6. Faire l'intention", content: "Pour les jeûnes volontaires, vous pouvez faire l'intention même pendant la journée, tant que vous n'avez rien mangé." }
};

fs.writeFileSync(path.join(localeDir, 'fr.json'), JSON.stringify(fr, null, 4), 'utf8');
console.log('✅ Batch 2 done: hajj (2) + charity (3) + fasting (2) = 7 guides translated');
