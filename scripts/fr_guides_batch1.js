// Batch 1: French translations for worship + purification guides
const fs = require('fs');
const path = require('path');
const localeDir = path.join(__dirname, '../client/i18n/locales');
const fr = JSON.parse(fs.readFileSync(path.join(localeDir, 'fr.json'), 'utf8'));

// how-to-perform-salah
fr.guides["how-to-perform-salah"].steps = {
    0: { title: "1. Faire l'intention", content: "Faites l'intention dans votre cœur pour la prière que vous accomplissez. L'intention est dans le cœur et n'a pas besoin d'être prononcée à voix haute." },
    1: { title: "2. Takbir (Ouverture)", content: "Levez vos mains au niveau des épaules ou des oreilles et dites 'Allahu Akbar'. Cela marque le début de la prière." },
    2: { title: "3. Réciter l'invocation d'ouverture", content: "Placez votre main droite sur la gauche sur votre poitrine et récitez : 'Subhanaka Allahumma wa bihamdika, wa tabarakasmuka, wa ta'ala jadduka, wa la ilaha ghayruk'." },
    3: { title: "4. Réciter Al-Fatiha", content: "Récitez la sourate Al-Fatiha. C'est obligatoire à chaque rak'ah. Après avoir terminé, dites 'Amine' doucement." },
    4: { title: "5. Réciter une sourate supplémentaire", content: "Dans les deux premières rak'ahs, récitez une autre sourate ou des versets du Coran après Al-Fatiha." },
    5: { title: "6. Faire le Ruku (Inclinaison)", content: "Dites 'Allahu Akbar' et inclinez-vous en plaçant vos mains sur vos genoux. Dites 'Subhana Rabbiyal Adheem' trois fois." },
    6: { title: "7. Se relever du Ruku", content: "Relevez-vous de l'inclinaison en disant 'Sami Allahu liman hamidah'. Debout, dites 'Rabbana wa lakal hamd'." },
    7: { title: "8. Faire le Sujud", content: "Dites 'Allahu Akbar' et prosternez-vous. Dites 'Subhana Rabbiyal A'la' trois fois. Effectuez deux prosternations." },
    8: { title: "9. S'asseoir pour le Tashahhud", content: "Après chaque deux rak'ahs, asseyez-vous et récitez le Tashahhud. Pointez votre index droit pendant la récitation." },
    9: { title: "10. Donner le Tasleem", content: "Tournez la tête à droite et dites 'As-salamu alaykum wa rahmatullah', puis tournez à gauche et répétez." }
};

// how-to-perform-istikhara
fr.guides["how-to-perform-istikhara"].steps = {
    0: { title: "1. Identifiez votre décision", content: "Ayez un sujet précis en tête pour lequel vous avez besoin de guidance. L'Istikhara concerne les affaires permises où vous hésitez sur la meilleure option." },
    1: { title: "2. Priez deux Rak'ahs", content: "Priez deux rak'ahs de prière surérogatoire. Dans la première rak'ah après Al-Fatiha, récitez Sourate Al-Kafirun. Dans la seconde, récitez Sourate Al-Ikhlas." },
    2: { title: "3. Récitez le Dua d'Istikhara", content: "Après avoir terminé la prière, levez vos mains et récitez : 'Allahumma inni astakhiruka bi'ilmika, wa astaqdiruka bi-qudratika...' (Ô Allah, je Te demande de me guider par Ta science...)." },
    3: { title: "4. Mentionnez votre affaire", content: "Lorsque vous atteignez la partie 'fee haadhal amr' (dans cette affaire qui me concerne), précisez ce pour quoi vous cherchez la guidance." },
    4: { title: "5. Faites confiance au plan d'Allah", content: "Après avoir fait le dua, poursuivez votre décision. Ayez confiance qu'Allah facilitera la meilleure option pour vous et mettra des obstacles sur ce qui n'est pas bon pour vous." }
};

// how-to-perform-tahajjud
fr.guides["how-to-perform-tahajjud"].steps = {
    0: { title: "1. Se réveiller dans le dernier tiers", content: "Réveillez-vous dans le dernier tiers de la nuit (environ 1-2 heures avant Fajr). C'est le moment le plus béni pour le Tahajjud." },
    1: { title: "2. Faire le Wudu", content: "Faites vos ablutions et préparez-vous mentalement et spirituellement pour vous tenir devant Allah." },
    2: { title: "3. Prier par paires", content: "Priez au moins 2 rak'ahs, mais vous pouvez en prier davantage par paires (2, 4, 6, 8, etc.). Le Prophète (ﷺ) priait 11 rak'ahs." },
    3: { title: "4. Réciter de longues portions", content: "Prenez votre temps dans la récitation, le ruku et le sujud. Récitez des portions plus longues du Coran que dans les prières régulières." },
    4: { title: "5. Faire le Dua", content: "Après avoir terminé votre prière, faites un dua sincère. C'est un moment où Allah descend au ciel le plus bas et exauce les prières." },
    5: { title: "6. Terminer par le Witr", content: "Concluez votre prière de nuit par le Witr (nombre impair de rak'ahs, généralement 1 ou 3)." }
};

// how-to-perform-eid-prayer
fr.guides["how-to-perform-eid-prayer"].steps = {
    0: { title: "1. Se préparer pour l'Aïd", content: "Prenez un bain, portez vos plus beaux vêtements et mettez du parfum. Pour l'Aïd al-Fitr, mangez des dattes avant de partir. Pour l'Aïd al-Adha, attendez après la prière." },
    1: { title: "2. Aller au lieu de prière", content: "Allez au lieu de prière de l'Aïd tôt. C'est une Sunnah de prendre un chemin pour y aller et un autre pour revenir." },
    2: { title: "3. Première Rak'ah", content: "Après le Takbir d'ouverture, il y a 7 Takbirs supplémentaires. Levez vos mains à chaque Takbir. Puis récitez Al-Fatiha et une autre Sourate (généralement Al-A'la)." },
    3: { title: "4. Deuxième Rak'ah", content: "Après vous être relevé de la prosternation, il y a 5 Takbirs supplémentaires. Puis récitez Al-Fatiha et une autre Sourate (généralement Al-Ghashiyah)." },
    4: { title: "5. Écouter la Khoutba", content: "Après la prière, l'Imam prononce deux khoutbas. Il est recommandé de rester et d'écouter, bien que ce ne soit pas obligatoire." },
    5: { title: "6. Échanger les vœux", content: "Saluez vos frères musulmans avec 'Aïd Moubarak' ou 'Taqabbal Allahu minna wa minkum' (Qu'Allah accepte de nous et de vous)." }
};

// morning-evening-adhkar
fr.guides["morning-evening-adhkar"].steps = {
    0: { title: "1. Ayat al-Kursi", content: "Récitez Ayat al-Kursi (Coran 2:255). Le Prophète (ﷺ) a dit que quiconque la récite le matin sera protégé jusqu'au soir." },
    1: { title: "2. Derniers versets d'Al-Baqarah", content: "Récitez les deux derniers versets de la Sourate Al-Baqarah (2:285-286). Ils sont suffisants pour la protection." },
    2: { title: "3. Sourate Al-Ikhlas, Al-Falaq, An-Nas", content: "Récitez ces trois sourates trois fois chacune. Elles procurent une protection complète." },
    3: { title: "4. Tasbih, Tahmid, Takbir", content: "Dites 'Subhan Allah' (33 fois), 'Alhamdulillah' (33 fois), 'Allahu Akbar' (34 fois)." },
    4: { title: "5. Sayyid al-Istighfar", content: "Récitez la maîtresse des demandes de pardon : 'Allahumma anta Rabbi, la ilaha illa ant...'." },
    5: { title: "6. Dua de protection", content: "Dites : 'Bismillahil-ladhi la yadurru ma'asmihi shay'un fil-ardi wa la fis-sama' (trois fois)." }
};

// how-to-perform-wudu
fr.guides["how-to-perform-wudu"].steps = {
    0: { title: "1. Faire l'intention", content: "Faites l'intention dans votre cœur d'accomplir le wudu. Dites 'Bismillah'." },
    1: { title: "2. Laver les mains", content: "Lavez les deux mains jusqu'aux poignets trois fois." },
    2: { title: "3. Rincer la bouche", content: "Rincez votre bouche soigneusement trois fois." },
    3: { title: "4. Rincer le nez", content: "Aspirez de l'eau dans vos narines trois fois et soufflez-la." },
    4: { title: "5. Laver le visage", content: "Lavez l'ensemble de votre visage trois fois, de la racine des cheveux au menton et d'une oreille à l'autre." },
    5: { title: "6. Laver les bras", content: "Lavez votre bras droit jusqu'au coude trois fois, puis le bras gauche." },
    6: { title: "7. Essuyer la tête", content: "Mouillez vos mains et essuyez votre tête une fois." },
    7: { title: "8. Essuyer les oreilles", content: "Essuyez l'intérieur de vos oreilles avec les index et l'extérieur avec les pouces." },
    8: { title: "9. Laver les pieds", content: "Lavez votre pied droit jusqu'à la cheville trois fois, puis le pied gauche." },
    9: { title: "10. Réciter le Dua", content: "Dites : 'Ashhadu an la ilaha illallah wahdahu la sharika lah, wa ashhadu anna Muhammadan abduhu wa rasuluh'." }
};

// how-to-perform-ghusl
fr.guides["how-to-perform-ghusl"].steps = {
    0: { title: "1. Faire l'intention", content: "Faites l'intention de vous purifier de l'impureté majeure. Dites 'Bismillah'." },
    1: { title: "2. Laver les mains", content: "Lavez les deux mains jusqu'aux poignets trois fois." },
    2: { title: "3. Laver les parties intimes", content: "Lavez les parties intimes soigneusement." },
    3: { title: "4. Faire le Wudu", content: "Accomplissez un wudu complet comme pour la prière." },
    4: { title: "5. Verser l'eau sur la tête", content: "Versez de l'eau sur votre tête trois fois, en vous assurant qu'elle atteint les racines de vos cheveux." },
    5: { title: "6. Laver le côté droit", content: "Versez de l'eau sur tout le côté droit de votre corps." },
    6: { title: "7. Laver le côté gauche", content: "Versez de l'eau sur tout le côté gauche de votre corps." },
    7: { title: "8. Laver tout le corps", content: "Assurez-vous que l'eau a atteint chaque partie de votre corps." }
};

// how-to-perform-tayammum
fr.guides["how-to-perform-tayammum"].steps = {
    0: { title: "1. Faire l'intention", content: "Faites l'intention d'accomplir le Tayammum en substitution du wudu ou du ghusl." },
    1: { title: "2. Dire Bismillah", content: "Commencez en disant 'Bismillah' (Au nom d'Allah)." },
    2: { title: "3. Frapper la terre propre", content: "Frappez vos mains sur de la terre propre, du sable ou de la poussière une fois." },
    3: { title: "4. Essuyer le visage", content: "Essuyez tout votre visage avec les deux paumes une fois." },
    4: { title: "5. Essuyer les mains", content: "Essuyez votre main droite avec la paume gauche, puis la main gauche avec la paume droite, jusqu'aux poignets." },
    5: { title: "6. Terminer", content: "Votre Tayammum est maintenant complet et valide pour une prière. Répétez pour chaque temps de prière." }
};

fs.writeFileSync(path.join(localeDir, 'fr.json'), JSON.stringify(fr, null, 4), 'utf8');
console.log('✅ Batch 1 done: worship (5) + purification (3) = 8 guides translated');
