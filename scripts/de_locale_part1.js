// German locale - Part 1: Core UI sections
const fs = require('fs');
const path = require('path');
const localeDir = path.join(__dirname, '../client/i18n/locales');
const en = JSON.parse(fs.readFileSync(path.join(localeDir, 'en.json'), 'utf8'));

const de = {};

de.tabs = { qibla: "Qibla", prayer: "Gebet", quran: "Quran", azkar: "Adhkar", settings: "Einstellungen" };

de.settings = {
    title: "Einstellungen", appearance: "Erscheinungsbild", customizeTheme: "Thema anpassen",
    language: "Sprache", chooseLanguage: "Sprache wählen", prayerFasting: "Gebet & Fasten",
    notificationsAzanReminders: "Benachrichtigungen, Adhan und Erinnerungen",
    storageDownloads: "Speicher & Downloads", manageOfflineContent: "Offline-Inhalte verwalten",
    wordByWord: "Wort für Wort", translationLanguage: "Übersetzungssprache",
    dhikrReminders: "Dhikr-Erinnerungen", floatingOverlay: "Schwebende Overlay-Erinnerungen",
    feedbackSuggestions: "Feedback & Vorschläge", helpImprove: "Hilf uns die App zu verbessern",
    colorMode: "Farbmodus", theme: "Thema", light: "Hell", dark: "Dunkel", auto: "Automatisch"
};

de.prayer = {
    title: "Gebetszeiten", fajr: "Fadschr", sunrise: "Sonnenaufgang", dhuhr: "Dhuhr", asr: "Asr",
    maghrib: "Maghrib", isha: "Ischa", nextPrayer: "NÄCHSTES GEBET", timeRemaining: "Verbleibende Zeit",
    prayerCalendar: "Gebetskalender", prayerStats: "Gebetsstatistik", progress: "Fortschritt",
    hijriCalendar: "Hijri-Kalender", calculationMethod: "Berechnungsmethode",
    prayed: "Gebetet", missed: "Verpasst", late: "Verspätet", onTime: "Pünktlich",
    notLogged: "Nicht erfasst", logPrayer: "Gebet erfassen", currentStreak: "Aktuelle Serie",
    days: "TAGE", day: "TAG", today: "Heute", yesterday: "Gestern",
    location: "Standort", setLocation: "Standort festlegen",
    tapToSetLocation: "Tippen Sie, um Ihren Standort für genaue Gebetszeiten festzulegen",
    noLocation: "Kein Standort festgelegt", checkingPermission: "Standortberechtigung wird geprüft...",
    locationRequired: "Standortzugriff erforderlich",
    locationExplanation: "Wir benötigen Ihren Standort, um genaue Gebetszeiten für Ihre Region zu berechnen.",
    browserLocationHint: "Bitte aktivieren Sie den Standort in Ihren Browsereinstellungen.",
    enableLocation: "Standort aktivieren", openSettings: "Einstellungen öffnen",
    loadingPrayerTimes: "Gebetszeiten werden geladen...", failedToLoad: "Gebetszeiten konnten nicht geladen werden",
    hours: "STUNDEN", minutes: "MINUTEN", seconds: "SEKUNDEN", min: "Min"
};

de.qibla = {
    title: "Qibla", direction: "Richtung", degrees: "Grad", compass: "Kompass",
    distance: "Entfernung", toKaaba: "zur Kaaba", facingQibla: "Richtung Qibla",
    turnLeft: "Nach links drehen", turnRight: "Nach rechts drehen",
    directionLocked: "Richtung gesperrt", tapToUnlock: "Tippen zum Entsperren",
    lockDirection: "Richtung sperren", compassNotAvailable: "Kompass nicht verfügbar",
    compassNotAvailableWeb: "Kompass im Web nicht verfügbar. Bitte auf dem Mobilgerät verwenden.",
    calibrate: "Kalibrieren Sie Ihren Kompass durch eine Acht-Bewegung mit Ihrem Telefon",
    calibrateShort: "Telefon in Acht-Form bewegen zum Kalibrieren",
    heading: "KURS", qiblaLabel: "QIBLA", km: "KM", mosques: "Moscheen",
    gettingLocation: "Standort wird ermittelt...", initializingCompass: "Kompass wird initialisiert...",
    locationRequiredQibla: "Wir benötigen Ihren Standort, um die Qibla-Richtung von Ihrer aktuellen Position zu berechnen."
};

de.quran = {
    title: "Quran", surah: "Sure", juz: "Dschuz", page: "Seite", verse: "Vers", verses: "Verse",
    search: "Suche", searchQuran: "Quran durchsuchen", bookmark: "Lesezeichen", bookmarks: "Lesezeichen",
    bookmarked: "Markiert", addNote: "Notiz hinzufügen", notes: "Notizen", highlight: "Hervorheben",
    highlights: "Hervorhebungen", copy: "Kopieren", share: "Teilen", play: "Abspielen",
    pause: "Pause", stop: "Stopp", continue: "Fortsetzen", tafsir: "Tafsir",
    translation: "Übersetzung", translations: "Übersetzungen", transliteration: "Transliteration",
    reciter: "Rezitator", lastRead: "Zuletzt gelesen", continueLast: "Dort weiterlesen wo Sie aufgehört haben",
    meccan: "Mekkanisch", medinan: "Medinensisch", save: "Speichern", delete: "Löschen",
    cancel: "Abbrechen", savedVerses: "Gespeicherte Verse", all: "Alle", recent: "Zuletzt",
    tafsirTranslations: "Tafsir & Übersetzungen", download: "Herunterladen",
    downloaded: "Heruntergeladen", downloading: "Wird heruntergeladen",
    readMode: "Lesemodus", mushafMode: "Mushaf-Modus", surahReader: "Surenleser",
    goToPage: "Zur Seite gehen", goToSurah: "Zur Sure gehen", goToJuz: "Zum Dschuz gehen",
    wordByWord: "Wort für Wort", audio: "Audio", settings: "Einstellungen"
};

de.azkar = {
    title: "Adhkar & Duas", morningAzkar: "Morgen-Adhkar", eveningAzkar: "Abend-Adhkar",
    afterPrayer: "Nach dem Gebet", sleep: "Schlaf", wakeUp: "Aufwachen",
    dailyTip: "Täglicher Tipp", categories: "Kategorien", duas: "Duas", guides: "Anleitungen",
    all: "Alle", favorites: "Favoriten", count: "Anzahl", completed: "Abgeschlossen",
    repeat: "Wiederholen", times: "Mal", time: "Mal", remaining: "verbleibend",
    reset: "Zurücksetzen", duaOfTheDay: "Dua des Tages", dailyDhikr: "Täglicher Dhikr",
    dhikrGoal: "Dhikr-Ziel", worship: "Anbetung & Gebet", dailyLife: "Alltag",
    travel: "Reise", food: "Essen & Trinken", protection: "Schutz", hadith: "Hadith",
    islamicGuides: "Islamische Anleitungen", search: "Adhkar & Duas suchen...",
    searchDuas: "Duas suchen...", quranic: "Quranisch", prophetic: "Prophetisch",
    custom: "Eigene", customDuas: "Eigene Duas", addCustomDua: "Eigenes Dua hinzufügen",
    noDuasYet: "Noch keine eigenen Duas", noFavorites: "Noch keine Favoriten",
    noResults: "Keine Ergebnisse gefunden", deleteConfirm: "Möchten Sie dieses Dua wirklich löschen?",
    tapToStart: "Tippen zum Starten", target: "Ziel", progress: "Fortschritt",
    allCategories: "Alle Kategorien", deleteDua: "Dua löschen",
    deleteDuaConfirm: "Möchten Sie dieses Dua wirklich löschen?", myDuas: "Meine Duas",
    result: "Ergebnis", results: "Ergebnisse", noDuasFound: "Keine Duas gefunden für",
    searchGuides: "Anleitungen suchen...", noGuidesFound: "Keine Anleitungen gefunden für",
    back: "Zurück",
    addPersonalSupplications: "Noch keine eigenen Duas.\nFügen Sie Ihre persönlichen Bittgebete hinzu.",
    tapHeartTip: "Noch keine Favoriten.\nTippen Sie auf das Herz-Symbol bei einem Dua.",
    noQuranicDuas: "Keine quranischen Duas verfügbar",
    noPropheticDuas: "Keine prophetischen Duas verfügbar",
    adhkarCount: "Adhkar",
    dailyTips: en.azkar.dailyTips // Keep dailyTips array as English for now (hadith quotes)
};

de.azkarDetail = { quran: "Quran", translit: "Translit.", english: "Englisch", counter: "Zähler" };

de.duaCollection = {
    title: "Duas", searchPlaceholder: "Duas suchen...", categories: "Kategorien",
    quranic: "Quranisch", prophetic: "Prophetisch", favorites: "Favoriten",
    myDuas: "Meine Duas", deleteDua: "Dua löschen",
    deleteConfirm: "Möchten Sie dieses Dua wirklich löschen?",
    deleteFailed: "Dua konnte nicht gelöscht werden", duasCount: "Duas",
    noResultsFor: "Keine Duas gefunden für \"{{query}}\"", results: "Ergebnisse",
    result: "Ergebnis", forQuery: "für", noQuranic: "Keine quranischen Duas verfügbar",
    noProphetic: "Keine prophetischen Duas verfügbar",
    noFavorites: "Noch keine Lieblings-Duas.\nTippen Sie auf das Herz bei einem Dua.",
    noCustom: "Noch keine eigenen Duas.\nFügen Sie hier Ihre persönlichen Bittgebete hinzu.",
    addCustom: "Eigenes Dua hinzufügen"
};

de.progress = {
    title: "Fortschritt", readingProgress: "Lesefortschritt", overallProgress: "Gesamtfortschritt",
    complete: "Abgeschlossen", pagesRead: "Gelesene Seiten", juzComplete: "Dschuz abgeschlossen",
    khatm: "Khatm", todaysProgress: "Heutiger Fortschritt", versesRead: "Verse gelesen",
    pagesReadToday: "Seiten gelesen", readingStreak: "Leseserie", currentStreak: "Aktuelle Serie",
    longestStreak: "Längste Serie", bestStreak: "Beste Serie", thisWeek: "Diese Woche",
    average: "Durchschnitt", pagesPerDay: "Seiten/Tag", dailyGoalSettings: "Tägliche Zieleinstellungen",
    enableDailyGoal: "Tägliches Ziel aktivieren", goalType: "Zieltyp", pages: "Seiten",
    verses: "Verse", target: "Ziel", saveGoal: "Ziel speichern",
    readingReminder: "Leseerinnerung", enableReminder: "Erinnerung aktivieren",
    reminderTime: "Erinnerungszeit", resetAllProgress: "Gesamten Fortschritt zurücksetzen",
    resetConfirm: "Möchten Sie wirklich den gesamten Lesefortschritt zurücksetzen? Dies kann nicht rückgängig gemacht werden.",
    resetButton: "Zurücksetzen", noGoalSet: "Kein tägliches Ziel gesetzt",
    invalidGoal: "Ungültiges Ziel", invalidGoalMessage: "Bitte geben Sie eine gültige Zahl ein",
    goalRange: "Ziel muss zwischen", and: "und",
    permissionRequired: "Berechtigung erforderlich",
    permissionMessage: "Bitte aktivieren Sie Benachrichtigungen in den Geräteeinstellungen für Leseerinnerungen.",
    errorSavingGoal: "Ziel konnte nicht gespeichert werden",
    errorResetting: "Fortschritt konnte nicht zurückgesetzt werden",
    loadingProgress: "Fortschritt wird geladen...", done: "Fertig", goal: "Ziel",
    weeklyOverview: "Wochenübersicht", monthlyOverview: "Monatsübersicht",
    streak: "Serie", totalPrayers: "Gesamte Gebete", completionRate: "Abschlussrate",
    prayerLog: "Gebetsprotokoll", weekly: "Wöchentlich", monthly: "Monatlich",
    allTime: "Gesamt", exportStats: "Statistik exportieren", qadaTracker: "Qada-Tracker",
    qadaRemaining: "Qada verbleibend", taraweeh: "Tarawih", charity: "Wohltätigkeit",
    zakatCalculator: "Zakat-Rechner", hifzProgress: "Hifz-Fortschritt", quranSchedule: "Quran-Zeitplan"
};

de.notifications = {
    title: "Benachrichtigungseinstellungen", prayerNotifications: "Gebetsbenachrichtigungen",
    getNotified: "Benachrichtigt werden, wenn es Zeit zum Beten ist",
    prayerAlarms: "Gebetsalarme", azanSettings: "Adhan-Einstellungen",
    azan: "Adhan", azanSound: "Adhan-Ton",
    playHayaAlSalat: "\"Haya Al Salat\" vor dem Gebet abspielen",
    silentMode: "Lautlosmodus", flipToSilence: "Umdrehen zum Stummschalten",
    flipToSilenceDesc: "Telefon umdrehen, um den Adhan stumm zu schalten",
    testAzan: "Adhan testen", vibration: "Vibration", iqama: "Iqama",
    iqamaReminder: "Iqama-Erinnerung", iqamaWait: "Iqama-Wartezeit",
    iqamaDelay: "Iqama-Verzögerung", minutesAfterAzan: "Minuten nach dem Adhan",
    minutes: "Minuten", enabled: "Aktiviert", disabled: "Deaktiviert",
    timeAdjustments: "Zeitanpassungen", adjustPrayerTimes: "Gebetszeiten anpassen (Minuten)",
    calculationMethod: "Berechnungsmethode", highLatitude: "Hochbreitenregel",
    asrCalculation: "Asr-Berechnung", standard: "Standard", hanafi: "Hanafitisch",
    prayerTracking: "Gebetsverfolgung", enableTracking: "Verfolgung aktivieren",
    trackDailyPrayers: "Tägliche Gebete verfolgen",
    missedPrayerReminder: "Erinnerung für verpasste Gebete",
    reminderAfterPrayer: "Nach der Gebetszeit erinnern",
    reminderDelay: "Erinnerungsverzögerung", minutesAfterPrayer: "Minuten nach dem Gebet",
    fasting: "Fasten", suhoorReminder: "Suhoor-Erinnerung", iftarReminder: "Iftar-Erinnerung",
    beforeSuhoor: "Minuten vor Suhoor", beforeIftar: "Minuten vor Iftar",
    fastingReminders: "Fastenerinnerungen", enableFastingReminders: "Fastenerinnerungen aktivieren",
    playAzanWhenPrayerTime: "Adhan abspielen zur Gebetszeit",
    selectPrayersForAzan: "Gebete auswählen, bei denen der Adhan ertönt",
    prayerSelection: "Gebetsauswahl", choosePrayersForIqama: "Gebete für Iqama auswählen",
    testIqama: "Iqama testen",
    testIqamaPlaying: "Iqama-Ton wird jetzt abgespielt. Wenn Sie nichts hören, prüfen Sie die Lautstärke.",
    timeAdjustmentsFineTune: "Gebetszeiten feinabstimmen (±30 Min)",
    min: "Min", autoDetectByLocation: "Automatisch nach Standort erkennen",
    recommended: "Empfohlen", active: "Aktiv", useAuto: "Automatisch verwenden",
    autoDetectedFor: "Automatisch erkannt für"
};

de.qadaTracker = {
    title: "Qada-Tracker", totalRemaining: "Verbleibende Qada-Gebete insgesamt",
    hint: "Tippen Sie auf die Zahl zum Bearbeiten. Verwenden Sie 'Erfassen' nach einem Qada-Gebet."
};

de.location = {
    title: "Standorteinstellungen", searchCity: "Stadt suchen...",
    currentLocation: "Aktueller Standort", useCurrentLocation: "Aktuellen Standort verwenden",
    manualEntry: "Manuelle Eingabe", latitude: "Breitengrad", longitude: "Längengrad",
    save: "Speichern", detectingLocation: "Standort wird ermittelt...",
    locationSaved: "Standort gespeichert", invalidCoordinates: "Ungültige Koordinaten",
    detecting: "Standort wird ermittelt...", unavailable: "Standort nicht verfügbar",
    permissionRequired: "Berechtigung erforderlich", manual: "Manuell",
    locationSource: "STANDORTQUELLE", useGPS: "GPS-Standort verwenden",
    setManually: "Standort manuell festlegen",
    searchWorldwide: "Suche nach Städten weltweit",
    recentLocations: "LETZTE STANDORTE",
    info: "Ihr Standort wird verwendet, um genaue Gebetszeiten und Qibla-Richtung zu berechnen. Die manuelle Standorteingabe ist nützlich, wenn GPS nicht verfügbar oder ungenau ist."
};

de.qada = {
    title: "Qada-Tracker", totalRemaining: "Gesamt verbleibend", addMissed: "Verpasste hinzufügen",
    prayersMadeUp: "Nachgeholte Gebete", prayersRemaining: "Verbleibend",
    hint: "Lange drücken auf eine Gebetsanzahl zum Abziehen",
    noQada: "Keine Qada-Gebete verbleibend. Maschallah!",
    fajr: "Fadschr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Ischa", prayers: "Gebete"
};

de.zakat = {
    title: "Zakat-Rechner", totalWealth: "Gesamtvermögen", enterWealth: "Gesamtvermögen eingeben",
    calculate: "Berechnen", zakatDue: "Fällige Zakat", nisab: "Nisab",
    meetsNisab: "Erreicht Nisab-Schwelle", doesNotMeetNisab: "Erreicht Nisab-Schwelle nicht",
    goldNisab: "Gold-Nisab", silverNisab: "Silber-Nisab",
    info: "Zakat beträgt 2,5% des gesamten qualifizierenden Vermögens, das ein Mondjahr gehalten wurde.",
    gold: "Gold", silver: "Silber", cash: "Bargeld & Bankguthaben",
    stocks: "Aktien & Investitionen", property: "Mietobjekte",
    totalAssets: "Gesamtvermögen", zakatPayable: "Zu zahlende Zakat",
    reset: "Zurücksetzen", currency: "Währung"
};

de.charity = {
    title: "Wohltätigkeitstracker", totalDonated: "Insgesamt gespendet",
    addDonation: "Spende hinzufügen", setGoal: "Ziel setzen", goal: "Ziel",
    recentDonations: "Letzte Spenden", noDonations: "Noch keine Spenden",
    amount: "Betrag", type: "Art", category: "Kategorie", date: "Datum",
    deleteConfirm: "Möchten Sie diese Spende wirklich löschen?",
    enterAmount: "Betrag eingeben", selectCategory: "Kategorie wählen",
    sadaqah: "Sadaqah", zakatPayment: "Zakat", waqf: "Waqf", other: "Andere",
    goalAmount: "Zielbetrag", goalProgress: "Zielfortschritt",
    to: "An", totalGiven: "Insgesamt gegeben", editGoal: "Ziel bearbeiten",
    zakatStatus: "Zakat-Status", paid: "Bezahlt",
    notYetPaid: "Dieses Jahr noch nicht bezahlt", breakdownByType: "Aufschlüsselung nach Art"
};

de.ramadan = {
    title: "Ramadan-Dashboard", daysRemaining: "Verbleibende Tage",
    fastingToday: "Heute Fasten", taraweeh: "Tarawih", logTaraweeh: "Tarawih erfassen",
    suhoor: "Suhoor", iftar: "Iftar", fastingDays: "Fastentage",
    completed: "Abgeschlossen", remaining: "Verbleibend", ramadanMode: "Ramadan-Modus",
    activateMessage: "Der Ramadan-Modus wird automatisch im gesegneten Monat Ramadan aktiviert.",
    checkBackMessage: "Kommen Sie zurück, wenn der Ramadan beginnt, um Suhoor-/Iftar-Zeiten, Quran-Lesepläne, Tarawih-Verfolgung und mehr zu nutzen."
};

de.hifz = {
    title: "Hifz-Fortschritt", memorized: "Auswendig gelernt", inProgress: "In Bearbeitung",
    notStarted: "Nicht begonnen", totalMemorized: "Insgesamt auswendig",
    markMemorized: "Als auswendig markieren", markInProgress: "Als in Bearbeitung markieren",
    resetSurah: "Sure zurücksetzen", versesMemorized: "Auswendig gelernte Verse",
    dueToday: "Heute fällig", revisedToday: "Heute wiederholt", dailyGoal: "Tagesziel",
    overallProgress: "Gesamtfortschritt", verses: "Verse", pages: "Seiten", juz: "Dschuz",
    dueForRevision: "Zur Wiederholung fällig", last: "Letzte", ease: "Leichtigkeit",
    moreVersesDue: "weitere Verse fällig", statusLegend: "Statuslegende",
    notifications: "Benachrichtigungen", dailyReminders: "Tägliche Erinnerungen",
    reminderHint: "Werde erinnert, dein Auswendiggelerntes zu wiederholen",
    resetAllProgress: "Gesamten Fortschritt zurücksetzen"
};

de.storage = {
    title: "Speicher & Downloads", totalUsed: "Gesamt verwendet",
    audioFiles: "Audiodateien", clearAllDownloads: "Alle Downloads löschen",
    clearConfirm: "Möchten Sie wirklich alle heruntergeladenen Inhalte löschen?",
    confirm: "Bestätigen", cancel: "Abbrechen", reciterAudio: "Rezitator-Audio",
    mushafPages: "Mushaf-Seiten", totalSize: "Gesamtgröße",
    noDownloads: "Noch keine Downloads", loadingInfo: "Speicherinfo wird geladen...",
    quickActions: "Schnellaktionen", manageAudio: "Audio verwalten",
    downloadQuran: "Quran herunterladen", clearAll: "Alles löschen",
    freeUpSpace: "Speicher freigeben", refreshInfo: "Speicherinfo aktualisieren"
};

// Write intermediate
fs.writeFileSync(path.join(localeDir, 'de.json'), JSON.stringify(de, null, 4), 'utf8');
console.log('✅ DE Part 1 done:', Object.keys(de).length, 'sections');
