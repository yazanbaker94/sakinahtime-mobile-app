// German locale - Part 3: Categories + Guide content (titles, descriptions, steps)
const fs = require('fs');
const path = require('path');
const localeDir = path.join(__dirname, '../client/i18n/locales');
const de = JSON.parse(fs.readFileSync(path.join(localeDir, 'de.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(localeDir, 'en.json'), 'utf8'));

// Categories
de.azkarCategories = {
    morning: "Morgen-Adhkar", evening: "Abend-Adhkar", "after-prayer": "Nach dem Gebet",
    sleep: "Schlaf-Adhkar", waking: "Beim Aufwachen", general: "Allgemeine Adhkar"
};

de.duaCategories = {
    travel: "Reise", eating: "Essen & Trinken", sleeping: "Schlafen & Aufwachen",
    places: "Betreten & Verlassen", weather: "Wetter & Natur", health: "Gesundheit & Heilung",
    protection: "Schutz", gratitude: "Dankbarkeit", forgiveness: "Vergebung",
    guidance: "Führung", family: "Familie & Kinder", general: "Allgemein"
};

de.guideCategories = {
    worship: "Anbetung & Gebet", purification: "Reinigung", hajj: "Hadsch & Umra",
    charity: "Wohltätigkeit & Zakat", fasting: "Fasten", funeral: "Bestattungsriten",
    character: "Charakter & Manieren", knowledge: "Wissen & Spiritualität", finance: "Islamisches Finanzwesen"
};

// Guide titles and descriptions
const guideMeta = {
    "how-to-perform-salah": { title: "Wie man das Gebet (Salah) verrichtet", description: "Umfassende Anleitung für die fünf täglichen Gebete gemäß der prophetischen Tradition" },
    "how-to-perform-istikhara": { title: "Wie man das Istikhara-Gebet verrichtet", description: "Anleitung zur Bitte um Allahs Führung bei wichtigen Entscheidungen" },
    "how-to-perform-tahajjud": { title: "Wie man das Tahajjud-Gebet verrichtet", description: "Anleitung für das Nachtgebet im letzten Drittel der Nacht" },
    "how-to-perform-eid-prayer": { title: "Wie man das Eid-Gebet verrichtet", description: "Anleitung für die Eid al-Fitr und Eid al-Adha Gebete" },
    "morning-evening-adhkar": { title: "Morgen- und Abend-Adhkar", description: "Wichtige Gedenken für morgens und abends" },
    "how-to-perform-wudu": { title: "Wie man Wudu (Gebetswaschung) verrichtet", description: "Detaillierte Anleitung für die korrekte Gebetswaschung" },
    "how-to-perform-ghusl": { title: "Wie man Ghusl (Ganzkörperwaschung) verrichtet", description: "Umfassende Anleitung für die rituelle Ganzkörperwaschung" },
    "how-to-perform-tayammum": { title: "Wie man Tayammum (Trockenwaschung) verrichtet", description: "Anleitung für die Trockenwaschung wenn kein Wasser verfügbar ist" },
    "how-to-perform-umrah": { title: "Wie man die Umra verrichtet", description: "Vollständige Anleitung für die kleine Pilgerfahrt" },
    "how-to-perform-tawaf": { title: "Wie man den Tawaf verrichtet", description: "Detaillierte Anleitung für die Umrundung der Kaaba" },
    "how-to-calculate-zakat": { title: "Wie man Zakat berechnet und zahlt", description: "Umfassende Anleitung zur Berechnung und Zahlung der Pflichtabgabe" },
    "how-to-pay-zakat-al-fitr": { title: "Wie man Zakat al-Fitr zahlt", description: "Anleitung zur Pflichtabgabe am Ende des Ramadan" },
    "how-to-give-sadaqah": { title: "Wie man Sadaqah (freiwillige Wohltätigkeit) gibt", description: "Anleitung zum aufrichtigen Geben freiwilliger Wohltätigkeit" },
    "how-to-fast-ramadan": { title: "Wie man im Ramadan fastet", description: "Vollständige Anleitung für das Pflichtfasten" },
    "how-to-fast-voluntarily": { title: "Wie man freiwillig fastet", description: "Anleitung für empfohlenes freiwilliges Fasten im Jahresverlauf" },
    "how-to-perform-janazah-prayer": { title: "Wie man das Janazah-Gebet verrichtet", description: "Anleitung für das Totengebet" },
    "how-to-offer-condolences": { title: "Wie man Beileid ausspricht", description: "Islamische Etikette für die Tröstung von Trauernden" },
    "how-to-control-anger": { title: "Wie man Wut kontrolliert", description: "Islamische Anleitung zum Umgang mit Wut" },
    "how-to-practice-humility": { title: "Wie man Demut praktiziert", description: "Anleitung zur Entwicklung von Demut im Islam" },
    "how-to-forgive-others": { title: "Wie man anderen vergibt", description: "Islamische Lehren über Vergebung und Verzeihung" },
    "how-to-seek-knowledge": { title: "Wie man islamisches Wissen sucht", description: "Anleitung zur richtigen Suche nach islamischem Wissen" },
    "how-to-make-tawbah": { title: "Wie man Tawbah (Reue) vollzieht", description: "Anleitung zur aufrichtigen Reue von Sünden" },
    "understanding-riba": { title: "Riba (Zinsen) verstehen", description: "Das Verbot von Zinsen im Islam verstehen" },
    "halal-income": { title: "Halal-Einkommen verdienen", description: "Richtlinien für erlaubten Verdienst im Islam" },
    "islamic-banking": { title: "Grundlagen des islamischen Bankwesens", description: "Scharia-konformes Bankwesen verstehen" },
    "halal-investing": { title: "Richtlinien für Halal-Investitionen", description: "Wie man scharia-konform investiert" },
    "debt-management": { title: "Islamische Schuldenverwallung", description: "Schulden nach islamischen Grundsätzen verwalten" },
};

// Copy guide structure from en.json, apply German titles/descriptions
de.guides = {};
for (const [id, enGuide] of Object.entries(en.guides)) {
    const meta = guideMeta[id] || { title: enGuide.title, description: enGuide.description };
    de.guides[id] = {
        title: meta.title,
        description: meta.description,
        steps: {}
    };
    // Copy step structure - use English as base for step content
    // (Islamic instructional content - complex sentences better kept accurate)
    if (enGuide.steps) {
        for (const [idx, step] of Object.entries(enGuide.steps)) {
            de.guides[id].steps[idx] = { title: step.title, content: step.content };
        }
    }
}

// Now apply German step translations for all guides
// Worship guides
de.guides["how-to-perform-salah"].steps = {
    0: { title: "1. Absicht fassen", content: "Fassen Sie in Ihrem Herzen die Absicht für das Gebet, das Sie verrichten. Die Absicht ist im Herzen und muss nicht laut ausgesprochen werden." },
    1: { title: "2. Takbir (Eröffnung)", content: "Heben Sie Ihre Hände auf Schulter- oder Ohrhöhe und sagen Sie 'Allahu Akbar'. Dies markiert den Beginn des Gebets." },
    2: { title: "3. Eröffnungsbittgebet rezitieren", content: "Legen Sie Ihre rechte Hand über die linke auf Ihre Brust und rezitieren Sie: 'Subhanaka Allahumma wa bihamdika, wa tabarakasmuka, wa ta'ala jadduka, wa la ilaha ghayruk'." },
    3: { title: "4. Al-Fatiha rezitieren", content: "Rezitieren Sie Sure Al-Fatiha. Dies ist in jeder Rak'ah Pflicht. Nach dem Ende sagen Sie leise 'Amin'." },
    4: { title: "5. Zusätzliche Sure rezitieren", content: "In den ersten beiden Rak'ahs rezitieren Sie nach Al-Fatiha eine weitere Sure oder Verse aus dem Quran." },
    5: { title: "6. Ruku (Verbeugung) machen", content: "Sagen Sie 'Allahu Akbar' und verbeugen Sie sich, legen Sie Ihre Hände auf die Knie. Sagen Sie dreimal 'Subhana Rabbiyal Adheem'." },
    6: { title: "7. Vom Ruku aufstehen", content: "Richten Sie sich auf und sagen Sie 'Sami Allahu liman hamidah'. Im Stehen sagen Sie 'Rabbana wa lakal hamd'." },
    7: { title: "8. Sujud machen", content: "Sagen Sie 'Allahu Akbar' und werfen Sie sich nieder. Sagen Sie dreimal 'Subhana Rabbiyal A'la'. Führen Sie zwei Niederwerfungen aus." },
    8: { title: "9. Zum Tashahhud setzen", content: "Nach jeder zwei Rak'ahs setzen Sie sich und rezitieren den Tashahhud. Zeigen Sie dabei mit dem rechten Zeigefinger." },
    9: { title: "10. Tasleem geben", content: "Drehen Sie Ihren Kopf nach rechts und sagen Sie 'As-salamu alaykum wa rahmatullah', dann nach links und wiederholen Sie." }
};

de.guides["how-to-perform-istikhara"].steps = {
    0: { title: "1. Entscheidung identifizieren", content: "Haben Sie ein konkretes Thema, für das Sie Führung benötigen. Istikhara betrifft erlaubte Angelegenheiten, bei denen Sie unsicher über die beste Option sind." },
    1: { title: "2. Zwei Rak'ahs beten", content: "Beten Sie zwei Rak'ahs freiwilliges Gebet. In der ersten Rak'ah nach Al-Fatiha rezitieren Sie Sure Al-Kafirun. In der zweiten Sure Al-Ikhlas." },
    2: { title: "3. Das Istikhara-Dua rezitieren", content: "Nach dem Gebet heben Sie Ihre Hände und rezitieren: 'Allahumma inni astakhiruka bi'ilmika, wa astaqdiruka bi-qudratika...'." },
    3: { title: "4. Ihre Angelegenheit erwähnen", content: "Wenn Sie den Teil 'fee haadhal amr' erreichen, nennen Sie die Angelegenheit, für die Sie Führung suchen." },
    4: { title: "5. Auf Allahs Plan vertrauen", content: "Nach dem Dua fahren Sie mit Ihrer Entscheidung fort. Vertrauen Sie darauf, dass Allah das Beste für Sie erleichtern wird." }
};

de.guides["how-to-perform-tahajjud"].steps = {
    0: { title: "1. Im letzten Drittel aufwachen", content: "Wachen Sie im letzten Drittel der Nacht auf (etwa 1-2 Stunden vor Fadschr). Dies ist die gesegnetste Zeit für Tahajjud." },
    1: { title: "2. Wudu machen", content: "Machen Sie die Gebetswaschung und bereiten Sie sich geistig und spirituell vor, vor Allah zu stehen." },
    2: { title: "3. Paarweise beten", content: "Beten Sie mindestens 2 Rak'ahs, aber Sie können mehr paarweise beten (2, 4, 6, 8 usw.). Der Prophet (ﷺ) betete 11 Rak'ahs." },
    3: { title: "4. Längere Abschnitte rezitieren", content: "Nehmen Sie sich Zeit bei der Rezitation, dem Ruku und Sujud. Rezitieren Sie längere Abschnitte des Quran als in den regulären Gebeten." },
    4: { title: "5. Dua machen", content: "Nach dem Gebet machen Sie ein aufrichtiges Dua. Dies ist die Zeit, in der Allah zum niedrigsten Himmel herabsteigt und Gebete erhört." },
    5: { title: "6. Mit Witr abschließen", content: "Schließen Sie Ihr Nachtgebet mit Witr ab (ungerade Anzahl Rak'ahs, in der Regel 1 oder 3)." }
};

de.guides["how-to-perform-eid-prayer"].steps = {
    0: { title: "1. Sich auf Eid vorbereiten", content: "Baden Sie, tragen Sie Ihre besten Kleider und parfümieren Sie sich. Beim Eid al-Fitr essen Sie Datteln vor dem Gehen. Beim Eid al-Adha warten Sie bis nach dem Gebet." },
    1: { title: "2. Zum Gebetsort gehen", content: "Gehen Sie früh zum Eid-Gebetsplatz. Es ist Sunnah, einen Weg hin und einen anderen zurück zu nehmen." },
    2: { title: "3. Erste Rak'ah", content: "Nach dem Eröffnungs-Takbir gibt es 7 zusätzliche Takbirs. Heben Sie bei jedem die Hände. Dann rezitieren Sie Al-Fatiha und eine weitere Sure." },
    3: { title: "4. Zweite Rak'ah", content: "Nach dem Aufstehen aus der Niederwerfung gibt es 5 zusätzliche Takbirs. Dann rezitieren Sie Al-Fatiha und eine weitere Sure." },
    4: { title: "5. Die Khutba hören", content: "Nach dem Gebet hält der Imam zwei Khutbas. Es wird empfohlen zu bleiben und zuzuhören." },
    5: { title: "6. Glückwünsche austauschen", content: "Grüßen Sie Ihre muslimischen Geschwister mit 'Eid Mubarak' oder 'Taqabbal Allahu minna wa minkum'." }
};

de.guides["morning-evening-adhkar"].steps = {
    0: { title: "1. Ayat al-Kursi", content: "Rezitieren Sie Ayat al-Kursi (Quran 2:255). Der Prophet (ﷺ) sagte, wer sie morgens rezitiert, wird bis zum Abend beschützt." },
    1: { title: "2. Letzte Verse von Al-Baqarah", content: "Rezitieren Sie die letzten beiden Verse der Sure Al-Baqarah (2:285-286). Sie genügen zum Schutz." },
    2: { title: "3. Sure Al-Ikhlas, Al-Falaq, An-Nas", content: "Rezitieren Sie diese drei Suren je dreimal. Sie bieten vollständigen Schutz." },
    3: { title: "4. Tasbih, Tahmid, Takbir", content: "Sagen Sie 'Subhan Allah' (33 Mal), 'Alhamdulillah' (33 Mal), 'Allahu Akbar' (34 Mal)." },
    4: { title: "5. Sayyid al-Istighfar", content: "Rezitieren Sie die Herrin der Vergebungsbitten: 'Allahumma anta Rabbi, la ilaha illa ant...'." },
    5: { title: "6. Schutz-Dua", content: "Sagen Sie: 'Bismillahil-ladhi la yadurru ma'asmihi shay'un fil-ardi wa la fis-sama' (dreimal)." }
};

de.guides["how-to-perform-wudu"].steps = {
    0: { title: "1. Absicht fassen", content: "Fassen Sie die Absicht im Herzen, Wudu zu verrichten. Sagen Sie 'Bismillah'." },
    1: { title: "2. Hände waschen", content: "Waschen Sie beide Hände bis zu den Handgelenken dreimal." },
    2: { title: "3. Mund ausspülen", content: "Spülen Sie Ihren Mund dreimal gründlich aus." },
    3: { title: "4. Nase ausspülen", content: "Ziehen Sie dreimal Wasser in die Nase und schnäuzen Sie es aus." },
    4: { title: "5. Gesicht waschen", content: "Waschen Sie das gesamte Gesicht dreimal, vom Haaransatz bis zum Kinn." },
    5: { title: "6. Arme waschen", content: "Waschen Sie den rechten Arm bis zum Ellenbogen dreimal, dann den linken." },
    6: { title: "7. Kopf bestreichen", content: "Befeuchten Sie Ihre Hände und streichen Sie einmal über den Kopf." },
    7: { title: "8. Ohren bestreichen", content: "Bestreichen Sie das Innere der Ohren mit den Zeigefingern und das Äußere mit den Daumen." },
    8: { title: "9. Füße waschen", content: "Waschen Sie den rechten Fuß bis zum Knöchel dreimal, dann den linken." },
    9: { title: "10. Dua rezitieren", content: "Sagen Sie: 'Ashhadu an la ilaha illallah wahdahu la sharika lah, wa ashhadu anna Muhammadan abduhu wa rasuluh'." }
};

de.guides["how-to-perform-ghusl"].steps = {
    0: { title: "1. Absicht fassen", content: "Fassen Sie die Absicht, sich von ritueller Unreinheit zu reinigen. Sagen Sie 'Bismillah'." },
    1: { title: "2. Hände waschen", content: "Waschen Sie beide Hände bis zu den Handgelenken dreimal." },
    2: { title: "3. Intimbereich waschen", content: "Waschen Sie den Intimbereich gründlich." },
    3: { title: "4. Wudu machen", content: "Verrichten Sie eine vollständige Gebetswaschung wie für das Gebet." },
    4: { title: "5. Wasser über den Kopf gießen", content: "Gießen Sie dreimal Wasser über Ihren Kopf und stellen Sie sicher, dass es die Haarwurzeln erreicht." },
    5: { title: "6. Rechte Seite waschen", content: "Gießen Sie Wasser über die gesamte rechte Körperseite." },
    6: { title: "7. Linke Seite waschen", content: "Gießen Sie Wasser über die gesamte linke Körperseite." },
    7: { title: "8. Ganzen Körper waschen", content: "Stellen Sie sicher, dass das Wasser jeden Teil Ihres Körpers erreicht hat." }
};

de.guides["how-to-perform-tayammum"].steps = {
    0: { title: "1. Absicht fassen", content: "Fassen Sie die Absicht, Tayammum als Ersatz für Wudu oder Ghusl zu verrichten." },
    1: { title: "2. Bismillah sagen", content: "Beginnen Sie mit 'Bismillah' (Im Namen Allahs)." },
    2: { title: "3. Auf saubere Erde schlagen", content: "Schlagen Sie Ihre Hände einmal auf saubere Erde, Sand oder Staub." },
    3: { title: "4. Gesicht bestreichen", content: "Bestreichen Sie Ihr gesamtes Gesicht einmal mit beiden Handflächen." },
    4: { title: "5. Hände bestreichen", content: "Bestreichen Sie die rechte Hand mit der linken Handfläche und umgekehrt, bis zu den Handgelenken." },
    5: { title: "6. Abschließen", content: "Ihr Tayammum ist nun vollständig und gültig für ein Gebet. Wiederholen Sie es für jede Gebetszeit." }
};

de.guides["how-to-perform-umrah"].steps = {
    0: { title: "1. In den Ihram-Zustand eintreten", content: "Vor dem Miqat fassen Sie die Absicht zur Umra, machen Ghusl und tragen die Ihram-Kleidung. Sprechen Sie die Talbiyah: 'Labbayk Allahumma Umrah'." },
    1: { title: "2. Den Masdschid al-Haram betreten", content: "Betreten Sie mit dem rechten Fuß und sprechen Sie das Dua für das Betreten der Moschee." },
    2: { title: "3. Tawaf verrichten", content: "Machen Sie sieben Runden gegen den Uhrzeigersinn um die Kaaba, beginnend beim Schwarzen Stein." },
    3: { title: "4. Zwei Rak'ahs beten", content: "Nach dem Tawaf beten Sie zwei Rak'ahs hinter dem Maqam Ibrahim oder irgendwo im Haram." },
    4: { title: "5. Zamzam trinken", content: "Trinken Sie Zamzam-Wasser und machen Sie Bittgebete." },
    5: { title: "6. Sa'i verrichten", content: "Gehen Sie siebenmal zwischen Safa und Marwah, beginnend bei Safa." },
    6: { title: "7. Haare rasieren oder schneiden", content: "Männer sollten den Kopf rasieren oder die Haare kürzen. Frauen kürzen eine Fingerspitzenlänge. Dies vervollständigt Ihre Umra." }
};

de.guides["how-to-perform-tawaf"].steps = {
    0: { title: "1. Zum Schwarzen Stein ausrichten", content: "Stellen Sie sich dem Schwarzen Stein gegenüber mit der Kaaba zu Ihrer Linken." },
    1: { title: "2. Absicht fassen", content: "Fassen Sie die Absicht zum Tawaf im Herzen." },
    2: { title: "3. Berühren oder zeigen", content: "Wenn möglich, berühren und küssen Sie den Schwarzen Stein. Sonst zeigen Sie darauf und sagen 'Bismillah, Allahu Akbar'." },
    3: { title: "4. Beginnen Sie zu umkreisen", content: "Gehen Sie gegen den Uhrzeigersinn um die Kaaba, halten Sie sie zu Ihrer Linken." },
    4: { title: "5. Dhikr und Dua rezitieren", content: "Es gibt keine speziellen Duas für den Tawaf. Rezitieren Sie den Quran, machen Sie Dhikr oder persönliche Bittgebete." },
    5: { title: "6. Die Jemenitische Ecke berühren", content: "Wenn möglich, berühren Sie die Jemenitische Ecke mit der rechten Hand ohne sie zu küssen." },
    6: { title: "7. Sieben Runden vollenden", content: "Vollenden Sie sieben vollständige Runden. Bei jedem Passieren des Schwarzen Steins zeigen Sie darauf und sagen 'Allahu Akbar'." },
    7: { title: "8. Zwei Rak'ahs beten", content: "Nach Beendigung des Tawaf beten Sie zwei Rak'ahs hinter dem Maqam Ibrahim oder anderswo im Haram." }
};

de.guides["how-to-calculate-zakat"].steps = {
    0: { title: "1. Nisab verstehen", content: "Der Nisab ist der Mindestbetrag an Vermögen, ab dem Zakat fällig wird. Er entspricht 85 Gramm Gold oder 595 Gramm Silber." },
    1: { title: "2. Vermögen berechnen", content: "Addieren Sie alle zakatpflichtigen Vermögenswerte: Bargeld, Bankguthaben, Gold, Silber, Handelsware, Aktien und Forderungen." },
    2: { title: "3. Schulden abziehen", content: "Ziehen Sie alle Schulden ab, die innerhalb des Jahres fällig sind." },
    3: { title: "4. Über Nisab prüfen", content: "Wenn Ihr zakatpflichtiges Nettovermögen über dem Nisab liegt, ist Zakat Pflicht." },
    4: { title: "5. 2,5% berechnen", content: "Multiplizieren Sie Ihr zakatpflichtiges Vermögen mit 0,025 (2,5%). Dies ist Ihr Zakat-Betrag." },
    5: { title: "6. An Berechtigte zahlen", content: "Verteilen Sie Ihre Zakat an die acht im Quran 9:60 genannten Kategorien: die Armen, Bedürftigen, Sammler, die zu Gewinnenden, Sklaven, Verschuldete, auf dem Wege Allahs und Reisende." },
    6: { title: "7. Absicht fassen", content: "Bei der Zahlung fassen Sie die Absicht, dass es Ihre Pflicht-Zakat ist." }
};

de.guides["how-to-pay-zakat-al-fitr"].steps = {
    0: { title: "1. Zweck verstehen", content: "Zakat al-Fitr reinigt den Fastenden von unnützem Reden und versorgt die Armen am Eid-Tag mit Essen." },
    1: { title: "2. Wer zahlen muss", content: "Jeder Muslim, der über den Tagesbedarf hinaus Nahrung besitzt, muss Zakat al-Fitr für sich und seine Angehörigen zahlen." },
    2: { title: "3. Betrag berechnen", content: "Der Betrag ist ein Sa' (ca. 3 kg) eines Grundnahrungsmittels (Weizen, Gerste, Datteln, Rosinen oder Reis) oder der Geldwert davon." },
    3: { title: "4. Zeitpunkt", content: "Sie muss vor dem Eid-Gebet gezahlt werden. Am besten 1-2 Tage vor Eid. Nach dem Gebet gilt es als verspätete Almosen." },
    4: { title: "5. An die Armen geben", content: "Geben Sie sie direkt an arme und bedürftige Muslime in Ihrer Gemeinde oder über eine vertrauenswürdige Organisation." }
};

de.guides["how-to-give-sadaqah"].steps = {
    0: { title: "1. Absicht reinigen", content: "Geben Sie Wohltätigkeit ausschließlich um Allahs Wohlgefallen willen, nicht für Anerkennung oder Lob." },
    1: { title: "2. Aus Halal-Vermögen geben", content: "Stellen Sie sicher, dass Ihre Wohltätigkeit aus erlaubt verdientem Geld stammt. Allah akzeptiert nur das Reine." },
    2: { title: "3. Wenn möglich im Verborgenen geben", content: "Der Prophet (ﷺ) sagte, die beste Wohltätigkeit ist die im Verborgenen gegebene. Öffentliche Wohltätigkeit kann jedoch andere inspirieren." },
    3: { title: "4. Regelmäßig geben", content: "Selbst kleine regelmäßige Beträge sind besser als große gelegentliche. Die liebsten Taten bei Allah sind die beständigen." },
    4: { title: "5. Empfänger nicht erinnern", content: "Erinnern Sie niemanden an Ihre Wohltätigkeit und verletzen Sie nicht mit Worten. Das macht die Belohnung zunichte." },
    5: { title: "6. Ein Lächeln ist Wohltätigkeit", content: "Wohltätigkeit ist nicht nur Geld. Ein Lächeln, jemandem helfen, ein Hindernis vom Weg räumen - alles ist Sadaqah." }
};

de.guides["how-to-fast-ramadan"].steps = {
    0: { title: "1. Absicht in der Nacht fassen", content: "Fassen Sie die Absicht vor Fadschr. Der Prophet (ﷺ) sagte: 'Wer nicht vor Fadschr die Absicht fasst, dessen Fasten ist nicht gültig.'" },
    1: { title: "2. Suhoor essen", content: "Essen Sie die Mahlzeit vor der Dämmerung. Der Prophet (ﷺ) sagte: 'Esst Suhoor, denn darin liegt Segen.' Hören Sie vor Fadschr-Beginn auf." },
    2: { title: "3. Von Essen, Trinken und Beziehungen enthalten", content: "Von Fadschr bis Maghrib enthalten Sie sich von Essen, Trinken, Rauchen und ehelichem Verkehr." },
    3: { title: "4. Die Zunge hüten", content: "Vermeiden Sie Lügen, Üble Nachrede, Streit und grobe Sprache." },
    4: { title: "5. Gute Taten vervielfachen", content: "Vermehren Sie Gebet, Quran-Rezitation, Dhikr und Wohltätigkeit. Der Ramadan ist der Monat des Quran und der Großzügigkeit." },
    5: { title: "6. Bei Maghrib das Fasten brechen", content: "Brechen Sie sofort bei Maghrib Ihr Fasten. Der Prophet (ﷺ) brach sein Fasten mit Datteln und Wasser." },
    6: { title: "7. Dua vor dem Fastenbrechen machen", content: "Das Bittgebet des Fastenden wird erhört. Sagen Sie: 'Allahumma laka sumtu wa ala rizqika aftartu'." }
};

de.guides["how-to-fast-voluntarily"].steps = {
    0: { title: "1. Montage und Donnerstage", content: "Der Prophet (ﷺ) fastete montags und donnerstags. Er sagte, die Taten werden Allah an diesen Tagen vorgelegt." },
    1: { title: "2. Drei Tage jeden Monat", content: "Fasten Sie am 13., 14. und 15. jedes Mondmonats (die weißen Tage). Das entspricht dem Fasten des ganzen Jahres." },
    2: { title: "3. Tag von Arafah", content: "Fasten Sie am 9. Dhul-Hiddscha (für Nicht-Pilger). Der Prophet (ﷺ) sagte, es tilgt die Sünden des vergangenen und kommenden Jahres." },
    3: { title: "4. Tag von Aschura", content: "Fasten Sie am 10. Muharram, zusammen mit dem 9. oder 11. Es tilgt die Sünden des vergangenen Jahres." },
    4: { title: "5. Sechs Tage im Schawwal", content: "Fasten Sie sechs Tage im Schawwal nach dem Ramadan. Der Prophet (ﷺ) sagte, das ist wie das Fasten des ganzen Jahres." },
    5: { title: "6. Absicht fassen", content: "Beim freiwilligen Fasten können Sie die Absicht auch tagsüber fassen, solange Sie nichts gegessen haben." }
};

de.guides["how-to-perform-janazah-prayer"].steps = {
    0: { title: "1. Sich aufstellen", content: "Stellen Sie sich hinter dem Imam in Reihen auf. Der Verstorbene wird vorne platziert." },
    1: { title: "2. Erster Takbir", content: "Heben Sie Ihre Hände und sagen Sie 'Allahu Akbar', dann rezitieren Sie Al-Fatiha leise." },
    2: { title: "3. Zweiter Takbir", content: "Sagen Sie 'Allahu Akbar' und senden Sie Segenswünsche auf den Propheten." },
    3: { title: "4. Dritter Takbir", content: "Sagen Sie 'Allahu Akbar' und machen Sie ein Bittgebet für den Verstorbenen: 'Allahumma ighfir lahu warhamhu...'." },
    4: { title: "5. Vierter Takbir", content: "Sagen Sie 'Allahu Akbar' und machen Sie ein kurzes Bittgebet für sich selbst und alle Muslime." },
    5: { title: "6. Tasleem geben", content: "Drehen Sie den Kopf nach rechts und sagen Sie 'As-salamu alaykum', dann nach links und wiederholen Sie." }
};

de.guides["how-to-offer-condolences"].steps = {
    0: { title: "1. Schnell besuchen", content: "Besuchen Sie die Familie kurz nach der Nachricht, aber respektieren Sie ihren Bedarf an Privatsphäre." },
    1: { title: "2. Die richtigen Worte sagen", content: "Sagen Sie: 'Inna lillahi wa inna ilayhi raji'un'. Erinnern Sie sie daran, dass Allah ihre Geduld belohnen wird." },
    2: { title: "3. Bittgebete machen", content: "Machen Sie Bittgebete für den Verstorbenen und die Familie." },
    3: { title: "4. Praktische Hilfe anbieten", content: "Bieten Sie konkrete Hilfe an wie Essen zubereiten, Einkäufe erledigen oder bei den Vorbereitungen helfen." },
    4: { title: "5. Kurz bleiben", content: "Halten Sie Ihren Besuch kurz, es sei denn, die Familie bittet Sie ausdrücklich zu bleiben." },
    5: { title: "6. Übermäßiges Klagen vermeiden", content: "Bleiben Sie gefasst und vermeiden Sie lautes Wehklagen, da dies im Islam unerwünscht ist." }
};

de.guides["how-to-control-anger"].steps = {
    0: { title: "1. Zuflucht bei Allah suchen", content: "Wenn Sie Wut aufsteigen fühlen, sagen Sie: 'A'udhu billahi min ash-shaytan ir-rajeem'." },
    1: { title: "2. Schweigen", content: "Der Prophet (ﷺ) sagte: 'Wenn einer von euch wütend wird, soll er schweigen.' Schweigen verhindert, dass Sie Dinge sagen, die Sie bereuen." },
    2: { title: "3. Position ändern", content: "Wenn Sie stehen, setzen Sie sich. Wenn Sie sitzen, legen Sie sich hin. Der Prophet (ﷺ) lehrte dies." },
    3: { title: "4. Wudu machen", content: "Machen Sie die Waschung mit kaltem Wasser. Der Prophet (ﷺ) sagte, Wut kommt vom Satan, und Satan wurde aus Feuer erschaffen." },
    4: { title: "5. An Allahs Vergebung denken", content: "Bedenken Sie, wie Allah Ihnen trotz Ihrer Fehler vergibt. Das sollte Sie nachsichtiger machen." },
    5: { title: "6. An die Folgen denken", content: "Bedenken Sie die negativen Folgen des Handelns im Zorn: zerbrochene Beziehungen, bereute Worte und Verlust des Respekts." }
};

de.guides["how-to-practice-humility"].steps = {
    0: { title: "1. An den Ursprung erinnern", content: "Bedenken Sie, dass Sie aus Staub erschaffen wurden und zu Staub zurückkehren werden." },
    1: { title: "2. Allahs Gaben anerkennen", content: "Erkennen Sie an, dass all Ihre Segnungen, Talente und Erfolge Geschenke Allahs sind." },
    2: { title: "3. Anderen dienen", content: "Der Prophet (ﷺ) diente seiner Familie und half bei Hausarbeiten, obwohl er der Anführer der Muslime war." },
    3: { title: "4. Prahlerei vermeiden", content: "Prahlen Sie nicht mit Reichtum, Wissen oder Errungenschaften. Der Prophet (ﷺ) sagte: 'Wer auch nur ein Atom an Hochmut in seinem Herzen hat, wird nicht ins Paradies eintreten.'" },
    4: { title: "5. Ratschläge annehmen", content: "Seien Sie offen für Kritik und Ratschläge anderer, ungeachtet ihres Status." },
    5: { title: "6. Alle gleich behandeln", content: "Zeigen Sie Respekt gegenüber Armen, Älteren und sozial Schwächeren." }
};

de.guides["how-to-forgive-others"].steps = {
    0: { title: "1. An Allahs Vergebung erinnern", content: "Allah vergibt Ihnen unzählige Sünden. Der Quran sagt: 'Möchtet ihr nicht, dass Allah euch vergibt?' (24:22)" },
    1: { title: "2. Die Belohnung verstehen", content: "Der Prophet (ﷺ) sagte: 'Wohltätigkeit mindert den Reichtum nicht, und Allah erhöht die Ehre dessen, der vergibt.'" },
    2: { title: "3. Sich in ihre Lage versetzen", content: "Versuchen Sie zu verstehen, warum die Person Ihnen Unrecht getan hat." },
    3: { title: "4. Für sie beten", content: "Beten Sie für die Person, die Ihnen Unrecht getan hat. Das erweicht Ihr Herz." },
    4: { title: "5. Groll loslassen", content: "Groll schadet nur Ihnen selbst. Der Prophet (ﷺ) sagte: 'Hasst einander nicht, beneidet einander nicht, und seid Brüder als Diener Allahs.'" },
    5: { title: "6. Wenn möglich versöhnen", content: "Wenn angemessen, machen Sie den ersten Schritt zur Versöhnung." }
};

de.guides["how-to-seek-knowledge"].steps = {
    0: { title: "1. Absicht reinigen", content: "Suchen Sie Wissen um Allahs willen, nicht für weltlichen Gewinn. Der Prophet (ﷺ) warnte vor dem Streben nach Wissen aus Prahlerei." },
    1: { title: "2. Mit den Grundlagen beginnen", content: "Beginnen Sie mit grundlegendem Wissen: korrekte Glaubenslehre (Aqidah), wie man betet, grundlegende islamische Regeln und Quran-Rezitation." },
    2: { title: "3. Qualifizierte Lehrer finden", content: "Lernen Sie von kompetenten und vertrauenswürdigen Gelehrten, die dem Quran und der Sunnah folgen." },
    3: { title: "4. Beständig sein", content: "Studieren Sie regelmäßig, auch wenn es nur wenig pro Tag ist. Die liebsten Taten bei Allah sind die beständigen." },
    4: { title: "5. Gelerntes umsetzen", content: "Wenden Sie Ihr Wissen im Leben an. Wissen ohne Handeln ist wie ein Baum ohne Frucht." },
    5: { title: "6. Andere lehren", content: "Teilen Sie nützliches Wissen. Der Prophet (ﷺ) sagte: 'Die Besten unter euch sind die, die den Quran lernen und lehren.'" }
};

de.guides["how-to-make-tawbah"].steps = {
    0: { title: "1. Die Sünde sofort aufgeben", content: "Der erste Schritt ist, die Sünde sofort aufzugeben. Man kann keine Reue zeigen und gleichzeitig die Sünde fortsetzen." },
    1: { title: "2. Aufrichtige Reue empfinden", content: "Empfinden Sie aufrichtige Reue im Herzen für den Ungehorsam gegenüber Allah. Der Prophet (ﷺ) sagte: 'Reue ist Buße.'" },
    2: { title: "3. Allah um Vergebung bitten", content: "Bitten Sie Allah um Vergebung. Sagen Sie: 'Astaghfirullah' und machen Sie ein aufrichtiges Bittgebet." },
    3: { title: "4. Feste Entschlossenheit fassen", content: "Nehmen Sie sich fest vor, nie zu dieser Sünde zurückzukehren. Diese Entschlossenheit ist wesentlich für gültige Reue." },
    4: { title: "5. Wiedergutmachung wenn nötig", content: "Wenn Ihre Sünde jemandem geschadet hat, bitten Sie um Vergebung und machen Sie es wieder gut." },
    5: { title: "6. Schlechtes durch Gutes ersetzen", content: "Folgen Sie Ihrer Sünde mit guten Taten. Allah sagt: 'Die guten Taten tilgen die schlechten' (Quran 11:114)." },
    6: { title: "7. Niemals verzweifeln", content: "Wie schwer Ihre Sünden auch sind, verlieren Sie nie die Hoffnung auf Allahs Barmherzigkeit. Er sagt: 'Verzweifelt nicht an Allahs Barmherzigkeit' (Quran 39:53)." }
};

de.guides["understanding-riba"].steps = {
    0: { title: "1. Was ist Riba?", content: "Riba bedeutet 'Zunahme' oder 'Überschuss'. In der islamischen Finanzwissenschaft bezeichnet es jeden garantierten Zins auf verliehenes Geld." },
    1: { title: "2. Warum ist es verboten?", content: "Allah sagt: 'Allah hat den Handel erlaubt und den Riba verboten' (Quran 2:275). Riba beutet Bedürftige aus." },
    2: { title: "3. Arten von Riba", content: "Riba al-Nasiah: Zinsen auf Darlehen. Riba al-Fadl: Austausch gleicher Waren in ungleichen Mengen." },
    3: { title: "4. Schwere der Sünde", content: "Der Prophet (ﷺ) sagte, Riba hat 73 Arten. Sowohl der Geber als auch der Nehmer sind verflucht." },
    4: { title: "5. Alternativen", content: "Nutzen Sie islamische Banken, Gewinnbeteiligungsvereinbarungen (Mudarabah) oder zinslose Darlehen (Qard Hasan)." }
};

de.guides["halal-income"].steps = {
    0: { title: "1. Bedeutung von Halal-Einkommen", content: "Der Prophet (ﷺ) sagte: 'Niemand hat je bessere Nahrung gegessen als die, die er mit seiner eigenen Hände Arbeit verdient hat.'" },
    1: { title: "2. Verbotene Branchen", content: "Vermeiden Sie Einkommen aus: Alkohol, Glücksspiel, Schweinefleisch, Zinsbanken, Erwachsenenunterhaltung und allem Schädlichen." },
    2: { title: "3. Ehrliche Geschäfte", content: "Seien Sie ehrlich im Geschäft. Der Prophet (ﷺ) sagte: 'Der wahrhaftige Händler wird mit den Propheten und Märtyrern sein.'" },
    3: { title: "4. Fairer Preis", content: "Beuten Sie Kunden nicht aus und horten Sie keine Waren um Preise zu erhöhen." },
    4: { title: "5. Verträge einhalten", content: "Halten Sie alle Vereinbarungen und Verträge ein. Allah sagt: 'Haltet eure Verträge ein' (Quran 5:1)." },
    5: { title: "6. Arbeiter schnell bezahlen", content: "Der Prophet (ﷺ) sagte: 'Gebt dem Arbeiter seinen Lohn bevor sein Schweiß trocknet.'" }
};

de.guides["islamic-banking"].steps = {
    0: { title: "1. Grundprinzipien", content: "Islamisches Bankwesen verbietet Zinsen (Riba), übermäßige Unsicherheit (Gharar) und Glücksspiel (Maysir). Gewinne müssen aus realer wirtschaftlicher Aktivität stammen." },
    1: { title: "2. Murabaha (Aufschlag)", content: "Die Bank kauft einen Vermögenswert und verkauft ihn Ihnen mit einer erklärten Gewinnspanne. Sie zahlen in Raten." },
    2: { title: "3. Mudarabah (Gewinnbeteiligung)", content: "Sie stellen das Kapital, die Bank verwaltet es. Gewinne werden nach vereinbarten Verhältnissen geteilt." },
    3: { title: "4. Musharakah (Partnerschaft)", content: "Beide Parteien tragen Kapital bei und teilen Gewinne und Verluste entsprechend ihrem Investitionsanteil." },
    4: { title: "5. Ijara (Leasing)", content: "Die Bank kauft einen Vermögenswert und vermietet ihn an Sie. Sie können ihn am Ende der Laufzeit kaufen." },
    5: { title: "6. Bank auswählen", content: "Suchen Sie Banken mit einem Scharia-Aufsichtsrat. Prüfen Sie, ob die Produkte wirklich konform sind." }
};

de.guides["halal-investing"].steps = {
    0: { title: "1. Verbotene Branchen filtern", content: "Vermeiden Sie Unternehmen in: Alkohol, Tabak, Glücksspiel, konventionelle Banken/Versicherungen, Schweinefleisch, Waffen." },
    1: { title: "2. Finanzkennzahlen", content: "Viele Gelehrte fordern: Verschuldungsgrad unter 33%, Zinserträge unter 5% des Umsatzes." },
    2: { title: "3. Gewinnreinigung", content: "Wenn ein kleiner Teil der Unternehmenseinnahmen aus nicht-konformen Quellen stammt, spenden Sie diesen Prozentsatz." },
    3: { title: "4. Islamische Fonds", content: "Erwägen Sie Scharia-konforme Investmentfonds und ETFs, die von islamischen Gelehrten vorgeprüft sind." },
    4: { title: "5. Immobilien", content: "Immobilieninvestition ist grundsätzlich halal. Vermeiden Sie konventionelle Hypotheken; nutzen Sie islamische Immobilienfinanzierung." },
    5: { title: "6. Gelehrte konsultieren", content: "Bei Zweifeln konsultieren Sie kompetente Gelehrte oder nutzen Sie islamische Finanz-Screening-Dienste." }
};

de.guides["debt-management"].steps = {
    0: { title: "1. Unnötige Schulden vermeiden", content: "Der Prophet (ﷺ) suchte Zuflucht vor Schulden. Leihen Sie nur wenn wirklich nötig und haben Sie einen klaren Rückzahlungsplan." },
    1: { title: "2. Alle Schulden dokumentieren", content: "Allah gebietet: 'Wenn ihr eine Schuld für eine bestimmte Frist eingeht, schreibt sie auf' (Quran 2:282)." },
    2: { title: "3. Rückzahlungsabsicht haben", content: "Der Prophet (ﷺ) sagte: 'Wer das Geld der Menschen nimmt mit der Absicht es zurückzuzahlen, dem wird Allah helfen.'" },
    3: { title: "4. Schnell zurückzahlen", content: "Verzögern Sie die Rückzahlung nicht, wenn Sie die Mittel haben. Der Prophet (ﷺ) sagte: 'Das Hinauszögern eines Reichen ist Ungerechtigkeit.'" },
    4: { title: "5. Als Gläubiger nachsichtig sein", content: "Wenn Ihr Schuldner Schwierigkeiten hat, geben Sie ihm Zeit. Allah sagt: 'Gewährt Aufschub bis zur Erleichterung' (Quran 2:280)." },
    5: { title: "6. Wenn möglich vergeben", content: "Das Vergeben einer Schuld wird hoch belohnt. Allah sagt: 'Wenn ihr spendet, ist es besser für euch' (Quran 2:280)." }
};

fs.writeFileSync(path.join(localeDir, 'de.json'), JSON.stringify(de, null, 4), 'utf8');
console.log('✅ DE Part 3 done: categories + all', Object.keys(de.guides).length, 'guides with German translations');
console.log('Total sections:', Object.keys(de).length);
