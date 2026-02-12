// German locale - Part 2: Remaining UI sections + categories
const fs = require('fs');
const path = require('path');
const localeDir = path.join(__dirname, '../client/i18n/locales');
const de = JSON.parse(fs.readFileSync(path.join(localeDir, 'de.json'), 'utf8'));

de.onboarding = {
    welcome: "Willkommen bei SakinahTime", welcomeDesc: "Ihr Begleiter für eine achtsame spirituelle Reise",
    skip: "Überspringen", next: "Weiter", getStarted: "Loslegen", done: "Fertig",
    prayerTimesTitle: "Genaue Gebetszeiten",
    prayerTimesDesc: "Erhalten Sie präzise Gebetszeiten basierend auf Ihrem Standort mit schönen Adhan-Benachrichtigungen",
    quranTitle: "Wunderschönes Quran-Erlebnis",
    quranDesc: "Lesen Sie den Quran mit mehreren Übersetzungen, Wort-für-Wort und Audio-Rezitation",
    azkarTitle: "Tägliche Adhkar & Duas",
    azkarDesc: "Zugang zu Morgen- und Abend-Adhkar, Duas für jeden Anlass und Dhikr-Zähler",
    notificationsDesc: "Verpassen Sie nie ein Gebet mit anpassbaren Benachrichtigungen und Adhan-Alarmen",
    widgetDesc: "Fügen Sie ein Widget zu Ihrem Startbildschirm für schnellen Zugriff auf Gebetszeiten hinzu",
    welcomeTitle: "Assalamu Alaikum", welcomeSubtitle: "Willkommen bei SakinahTime",
    welcomeDescription: "Ihr Begleiter für Gebetszeiten, Quran-Lesen und spirituelles Wachstum.",
    locationTitle: "Genaue Gebetszeiten", locationSubtitle: "Standortzugriff",
    locationDescription: "Wir verwenden Ihren Standort, um präzise Gebetszeiten für Ihre Region zu berechnen.",
    notificationsTitle: "Kein Gebet verpassen", notificationsSubtitle: "Benachrichtigungserinnerungen",
    notificationsDescription: "Werden Sie mit schönen Adhan-Klängen benachrichtigt, wenn die Gebetszeit gekommen ist.",
    widgetTitle: "Widget hinzufügen", widgetSubtitle: "Zuverlässiger Adhan",
    widgetDescription: "Fügen Sie ein Gebetszeiten-Widget zu Ihrem Startbildschirm hinzu für zuverlässige Adhan-Benachrichtigungen, auch nach Neustart des Telefons.",
    doneTitle: "Alles bereit!", doneSubtitle: "Bereit zum Beginnen",
    doneDescription: "Beginnen Sie Ihre Reise zu einer achtsameren spirituellen Praxis.",
    locationEnabled: "Standort aktiviert", notificationsEnabled: "Benachrichtigungen aktiviert",
    enable: "Aktivieren", continue: "Fortfahren", notNow: "Nicht jetzt",
    enableExactAlarms: "Exakte Alarme aktivieren",
    exactAlarmsDescription: "SakinahTime benötigt die Berechtigung, präzise Gebetszeitalarme zu planen.\n\nBitte aktivieren Sie \"Alarme & Erinnerungen\" auf dem nächsten Bildschirm.",
    openSettings: "Einstellungen öffnen", enableReliableAzan: "Zuverlässigen Adhan aktivieren",
    reliableAzanDescription: "Um sicherzustellen, dass der Adhan nach Telefonneustart abgespielt wird, tippen Sie bitte auf:\n\nAkku → Uneingeschränkt\n\nDies erlaubt der App, Ihr Telefon für Gebetszeiten aufzuwecken."
};

de.mosque = {
    title: "Moscheen in der Nähe", findMosques: "Moscheen finden", distance: "Entfernung",
    directions: "Wegbeschreibung", noMosques: "Keine Moscheen in der Nähe gefunden",
    searchMosques: "Moscheen suchen...", openInMaps: "In Karten öffnen"
};

de.hijri = {
    title: "Hijri-Kalender", today: "Heute",
    months: {
        "1": "Muharram", "2": "Safar", "3": "Rabi al-Awwal", "4": "Rabi al-Thani",
        "5": "Dschumada al-Ula", "6": "Dschumada al-Thani", "7": "Radschab", "8": "Schaban",
        "9": "Ramadan", "10": "Schawwal", "11": "Dhul-Qada", "12": "Dhul-Hiddscha"
    }
};

de.prayerStats = {
    title: "Gebetsstatistik", overview: "Übersicht", totalPrayed: "Insgesamt gebetet",
    totalMissed: "Insgesamt verpasst", onTimeRate: "Pünktlichkeitsrate",
    weeklyBreakdown: "Wochenaufschlüsselung", monthlyBreakdown: "Monatsaufschlüsselung",
    bestDay: "Bester Tag", prayerBreakdown: "Gebetsaufschlüsselung",
    noData: "Noch keine Gebetsdaten. Beginnen Sie mit der Erfassung!",
    loadingStats: "Statistik wird geladen...", prayerTracking: "Gebetsverfolgung",
    tapToMark: "Tippen um als gebetet zu markieren", enableToTrack: "Aktivieren zum Verfolgen",
    tapToMarkStatus: "Tippen Sie eine Schaltfläche um den Gebetsstatus zu markieren:",
    prayed: "Gebetet", missed: "Verpasst", late: "Verspätet",
    missedReminder: "Erinnerung für verpasste Gebete",
    remindAfter: "Nach {{minutes}} Min erinnern wenn nicht markiert",
    getReminded: "Werde erinnert, Gebete zu markieren",
    remindAfterLabel: "Erinnere mich nach:", totalLogged: "Insgesamt erfasst",
    qadaDue: "Qada fällig", weekly: "Wöchentlich", monthly: "Monatlich",
    exportFailed: "Export fehlgeschlagen",
    exportError: "Gebetsstatistik konnte nicht geteilt werden."
};

de.prayerCalendar = {
    title: "Gebetskalender", monthlyView: "Monatsansicht", allPrayed: "Alle gebetet",
    someMissed: "Einige verpasst", notTracked: "Nicht erfasst", today: "Heute",
    unableToLoad: "Gebetszeiten konnten nicht geladen werden",
    selectMonthYear: "Monat & Jahr wählen", year: "Jahr", month: "Monat"
};

de.audioDownload = {
    title: "Audio-Downloads", downloadAll: "Alle herunterladen", deleteAll: "Alle löschen",
    downloading: "Wird heruntergeladen...", downloaded: "Heruntergeladen",
    notDownloaded: "Nicht heruntergeladen", surahAudio: "Suren-Audio", offline: "Offline",
    needInternet: "Sie benötigen eine Internetverbindung zum Herunterladen.",
    downloadAllSurahs: "Alle Suren herunterladen", deleteAllAudio: "Gesamtes Audio löschen",
    download: "Herunterladen", delete: "Löschen", deleteAudio: "Audio löschen",
    cancelDownloads: "Downloads abbrechen",
    cancelAllDesc: "Alle ausstehenden Downloads abbrechen? Teilweise heruntergeladene Suren werden entfernt.",
    keepDownloading: "Weiter herunterladen", cancelAll: "Alle abbrechen",
    deleteConfirmMessage: "Heruntergeladenes Audio löschen für"
};

de.reciter = {
    title: "Rezitator wählen", currentReciter: "Aktueller Rezitator",
    popular: "Beliebt", allReciters: "Alle Rezitatoren"
};

de.duaDetail = {
    reference: "Referenz", benefits: "Nutzen", occasion: "Anlass",
    shareAsDua: "Dua teilen", notFound: "Dua nicht gefunden",
    notFoundMessage: "Dieses Dua konnte nicht gefunden werden.",
    listenPronunciation: "Aussprache anhören", viewInQuran: "Im Quran ansehen",
    ayah: "Ayah", benefitsVirtues: "Nutzen & Tugenden"
};

de.customDuaForm = {
    editDua: "Dua bearbeiten", addCustomDua: "Eigenes Dua hinzufügen",
    saving: "Wird gespeichert...", saveFailed: "Dua konnte nicht gespeichert werden.",
    deleteConfirm: "Möchten Sie dieses Dua wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
    deleteFailed: "Dua konnte nicht gelöscht werden.", arabicText: "Arabischer Text",
    optional: "Optional", transliteration: "Transliteration",
    transliterationPlaceholder: "Transliteration eingeben (z.B. Allahumma...)",
    translationMeaning: "Übersetzung / Bedeutung",
    translationPlaceholder: "Bedeutung oder Übersetzung eingeben",
    personalNotes: "Persönliche Notizen",
    notesPlaceholder: "Persönliche Notizen oder Erinnerungen hinzufügen",
    deleteThisDua: "Dieses Dua löschen"
};

de.islamicGuide = { title: "Islamischer Leitfaden", steps: "Schritte", references: "Referenzen" };

de.dhikrOverlay = {
    title: "Dhikr-Overlay-Einstellungen", enableOverlay: "Overlay aktivieren",
    overlayDesc: "Schwebende Dhikr-Erinnerungen anzeigen", frequency: "Häufigkeit",
    everyMinutes: "Alle {{count}} Minuten", style: "Stil", position: "Position"
};

de.wordByWordSettings = {
    title: "Wort-für-Wort-Einstellungen", translationLang: "Übersetzungssprache",
    showTransliteration: "Transliteration anzeigen", fontSize: "Schriftgröße"
};

de.quranSchedule = {
    title: "Quran-Zeitplan", createSchedule: "Zeitplan erstellen",
    completionDate: "Ziel-Abschlussdatum", pagesPerDay: "Seiten pro Tag",
    startDate: "Startdatum", daysDone: "Abgeschlossene Tage", day: "Tag",
    pages: "Seiten", completed: "Abgeschlossen", pending: "Ausstehend",
    openInMushaf: "Im Mushaf öffnen", today: "Heute", juz: "Dschuz", surahs: "Suren:",
    openMushaf: "Mushaf öffnen", markComplete: "Als erledigt markieren",
    completedAt: "Abgeschlossen:", remaining: "Verbleibend", complete: "Abgeschlossen",
    behindSchedule: "hinter dem Zeitplan"
};

de.zakatCalculator = {
    title: "Zakat-Rechner", totalWealth: "Gesamtvermögen (USD)",
    enterWealth: "Geben Sie Ihr Gesamtvermögen ein", calculate: "Zakat berechnen",
    results: "Berechnungsergebnisse", nisabGold: "Nisab (Gold)", nisabSilver: "Nisab (Silber)",
    meetsNisab: "Erreicht Nisab", zakatDue: "Fällige Zakat (2,5%)",
    info: "Zakat beträgt 2,5% des Vermögens, das ein Mondjahr über der Nisab-Schwelle gehalten wurde. Der Nisab basiert auf dem Wert von 87,48g Gold oder 612,36g Silber."
};

de.hijriCalendar = {
    title: "Islamischer Kalender", event: "Ereignis", fasting: "Fasten", ah: "n.H.",
    fastingProhibited: "Fasten heute verboten",
    eventIn: "{{name}} in {{count}} Tag", eventIn_plural: "{{name}} in {{count}} Tagen"
};

de.common = {
    loading: "Wird geladen...", error: "Fehler", retry: "Wiederholen", ok: "OK",
    cancel: "Abbrechen", save: "Speichern", delete: "Löschen", edit: "Bearbeiten",
    close: "Schließen", back: "Zurück", done: "Fertig", search: "Suchen",
    share: "Teilen", copy: "Kopieren", copied: "Kopiert!",
    noResults: "Keine Ergebnisse gefunden", offline: "Sie sind offline",
    yes: "Ja", no: "Nein", confirm: "Bestätigen", reset: "Zurücksetzen",
    add: "Hinzufügen", remove: "Entfernen", enable: "Aktivieren", disable: "Deaktivieren",
    on: "An", off: "Aus", yourRegion: "Ihre Region", goBack: "Zurück", skip: "Überspringen"
};

de.components = {
    streakDays: "Tage-Serie", streakDaysPlural: "Tage-Serie",
    perfectDay: "Perfekter Tag", offlineMode: "Offline-Modus",
    usingCachedData: "Verwende zwischengespeicherte Daten",
    lastSynced: "Zuletzt synchronisiert",
    somethingWentWrong: "Etwas ist schief gelaufen", tryAgain: "Erneut versuchen"
};

de.streak = {
    prayerStreak: "Gebetsserie", currentStreak: "Aktuelle Serie",
    longestStreak: "Längste Serie", days: "Tage", day: "Tag",
    startToday: "Starten Sie heute Ihre Serie!",
    greatStart: "Toller Start! Machen Sie weiter!",
    buildingMomentum: "Sie bauen Schwung auf!",
    amazingConsistency: "Erstaunliche Beständigkeit!",
    incredibleDedication: "Unglaubliche Hingabe!",
    trulyInspiring: "Maschallah! Wirklich inspirierend!"
};

de.fasting = {
    fastingReminders: "Fastenerinnerungen",
    getNotifiedFasting: "Über bevorstehende Fastentage benachrichtigt werden",
    receiveReminders: "Erinnerungen für empfohlene Fastentage erhalten",
    reminderTime: "Erinnerungszeit", eveningBefore: "Abend zuvor",
    beforeFajr: "Vor Fadschr", thirtyMinBefore: "30 Min vorher",
    fastingDays: "Fastentage", monday: "Montag", thursday: "Donnerstag",
    whiteDays: "Weiße Tage", ashura: "Aschura", dayOfArafah: "Tag von Arafah",
    shawwal: "Schawwal", weeklySunnahFast: "Wöchentliches Sunnah-Fasten",
    whiteDaysDesc: "13., 14., 15. jeden Monats", ashuraDesc: "10. Muharram",
    arafahDesc: "9. Dhul-Hiddscha", shawwalDesc: "6 Tage nach Ramadan",
    notificationPermissionRequired: "⚠️ Benachrichtigungsberechtigung erforderlich"
};

de.storageAlerts = {
    quranAudio: "Quran-Audio", tafsir: "Tafsir", prayerTimesCache: "Gebetszeiten-Cache",
    otherCache: "Anderer Cache", allCachedData: "Alle zwischengespeicherten Daten",
    clearConfirm: "{{category}} löschen?",
    clearAllDesc: "Dadurch werden alle heruntergeladenen Quran-Audio- und Tafsir-Dateien entfernt. Sie müssen sie für die Offline-Nutzung erneut herunterladen.",
    clearCategoryDesc: "Dadurch werden alle {{category}} entfernt. Möglicherweise müssen Sie sie erneut herunterladen.",
    cancel: "Abbrechen", clear: "Löschen", error: "Fehler",
    failedToClear: "Cache konnte nicht gelöscht werden. Bitte versuchen Sie es erneut."
};

de.mushaf = {
    notes: "Notizen & Hervorhebungen", bookmarks: "Lesezeichen", highlights: "Hervorhebungen",
    addNote: "Notiz hinzufügen", save: "Speichern", delete: "Löschen",
    noNotesYet: "Noch keine Notizen oder Hervorhebungen",
    tapToAddNote: "Lange auf einen Vers drücken um eine Notiz hinzuzufügen",
    noBookmarksYet: "Noch keine Lesezeichen",
    tapToBookmark: "Tippen Sie auf einen Vers um ihn zu markieren",
    editNote: "Notiz bearbeiten", writeNoteHere: "Schreiben Sie hier Ihre Notiz...",
    hifzModeActivated: "Hifz-Modus aktiviert",
    hifzModeDesc: "Tippen Sie auf einen Vers um ihn anzuzeigen. Lange drücken für Lernoptionen.",
    wordByWordHighlighting: "Wort-für-Wort-Hervorhebung",
    wordByWordDesc: "Lange drücken und ziehen um durch das Audio zu scrubben.",
    justNow: "Gerade eben", minutesAgo: "Vor {{count}} Min", hoursAgo: "Vor {{count}} Std",
    daysAgo: "Vor {{count}} Tagen", noBookmarks: "Noch keine Lesezeichen",
    noResults: "Keine Ergebnisse", tryDifferent: "Versuchen Sie andere Suchbegriffe",
    search: "Suchen...", writeNote: "Schreiben Sie hier Ihre Notiz...",
    quarterHizb: "Viertel Hizb", halfHizb: "Halber Hizb", fullJuzOnly: "Nur ganzer Dschuz",
    copyVerse: "Vers kopieren", shareVerse: "Vers teilen",
    chooseHighlight: "Hervorhebungsfarbe wählen", removeHighlight: "Hervorhebung entfernen",
    highlight: "Hervorheben", selectReciter: "Rezitator wählen",
    audioSettings: "Audio-Einstellungen", noTafsir: "Kein Tafsir verfügbar",
    noTafsirVerse: "Kein Tafsir für diesen Vers verfügbar",
    recently: "Kürzlich", earlier: "Früher",
    deleteFailed: "Löschen fehlgeschlagen.", quran: "Quran",
    surahs114: "114 Suren", juz30: "30 Dschuz", recentCount: "Zuletzt",
    surahTab: "Sure", juzTab: "Dschuz", recentTab: "Zuletzt",
    searchPlaceholder: "Suchen...", includeTafsir: "Tafsir in Suche einbeziehen",
    notesSection: "NOTIZEN", highlightsSection: "HERVORHEBUNGEN",
    tafsirTranslation: "Tafsir/Übersetzung", nowPlaying: "WIRD ABGESPIELT",
    paused: "PAUSIERT", verse: "Vers", repeat: "Wiederholen", loop: "Schleife",
    remaining: "verbleibend", surah: "Sure", noTafsirAvailable: "Kein Tafsir für diesen Vers",
    noteInputPlaceholder: "Schreiben Sie hier...", juzLabel: "Dschuz", hizbLabel: "Hizb",
    searching: "SUCHE...", resultsCount: "ERGEBNISSE", recentlyViewed: "Kürzlich angesehen",
    allSurahs: "ALLE SUREN", recentlyViewedLabel: "KÜRZLICH ANGESEHEN",
    quartersLabel: "VIERTEL", halvesLabel: "HÄLFTEN",
    pagesYouVisit: "Besuchte Seiten erscheinen hier",
    noRecentPages: "Noch keine kürzlich besuchten Seiten",
    verses: "Verse", pageNumber: "Seite", loadingVerses: "Verse werden geladen...",
    bookmark: "Lesezeichen", removeBookmark: "Lesezeichen entfernen",
    tafsirAndTranslations: "Tafsir & Übersetzungen", downloadedCount: "heruntergeladen",
    playUntil: "ABSPIELEN BIS", page: "Seite", juz: "Dschuz", reciterLabel: "REZITATOR",
    play: "Abspielen", playCount: "{{count}}× abspielen",
    setLoopStart: "Schleifenanfang setzen", setLoopEnd: "Schleifenende setzen",
    playLoop: "Schleife abspielen", tapToReveal: "Tippen zum Anzeigen",
    notStarted: "Nicht begonnen", inProgress: "In Bearbeitung", memorized: "Auswendig",
    all: "Alle", tapToMinimize: "TIPPEN ZUM MINIMIEREN"
};

de.mosqueFinder = {
    nearbyMosques: "Moscheen in der Nähe", searchPlaceholder: "Moscheen suchen...",
    radius1km: "1 km", radius5km: "5 km", radius10km: "10 km", radius25km: "25 km"
};

de.calendar = {
    months: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
    weekdays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]
};

de.themePicker = { colorMode: "Farbmodus", theme: "Thema", light: "Hell", dark: "Dunkel", auto: "Automatisch" };

de.storageOverview = {
    storageUsed: "Genutzter Speicher", manage: "Verwalten",
    storageFull: "Speicher fast voll. Löschen Sie Daten um fortzufahren.",
    availableOnDevice: "verfügbar auf dem Gerät"
};

de.storageBreakdown = {
    title: "Speicheraufschlüsselung", quranAudio: "Quran-Audio",
    tafsir: "Tafsir", prayerTimes: "Gebetszeiten", otherCache: "Anderer Cache"
};

de.storageSettings = {
    downloadSettings: "Download-Einstellungen", storageLimit: "Speicherlimit",
    maxSpace: "Maximaler Speicher für Offline-Inhalte",
    wifiOnly: "Nur über WLAN herunterladen",
    wifiOnlyDesc: "Mobile Daten sparen durch Download nur über WLAN",
    autoDelete: "Alten Cache automatisch löschen",
    autoDeleteDesc: "Alte zwischengespeicherte Daten automatisch entfernen wenn das Limit erreicht ist"
};

de.dhikrReminders = {
    title: "Dhikr-Erinnerungen", floatingReminders: "Schwebende Erinnerungen",
    dhikrNotifications: "Dhikr-Benachrichtigungen",
    showOverlay: "Dhikr-Overlay über anderen Apps anzeigen",
    receiveNotifications: "Regelmäßige Dhikr-Benachrichtigungen erhalten",
    grantPermission: "Overlay-Berechtigung erteilen", previewOverlay: "Overlay-Vorschau",
    reminderInterval: "Erinnerungsintervall", dhikrCategories: "Dhikr-Kategorien",
    chooseTypes: "Wählen Sie die Dhikr-Arten", quietHours: "Ruhezeiten",
    pauseSleep: "Erinnerungen während der Schlafzeit pausieren",
    startAt: "Beginnt um", endAt: "Endet um", autoDismiss: "Automatisch schließen",
    overlayDisappears: "Overlay verschwindet nach dieser Zeit",
    iosNotice: "Schwebendes Overlay nur auf Android verfügbar. Auf iOS erhalten Sie Standard-Benachrichtigungen.",
    noCategories: "Bitte aktivieren Sie mindestens eine Dhikr-Kategorie",
    previewFailed: "Overlay-Vorschau konnte nicht angezeigt werden.",
    noDhikr: "Keine Dhikr-Inhalte für ausgewählte Kategorien gefunden",
    error: "Fehler", serviceFailed: "Dhikr-Erinnerungsdienst konnte nicht gestartet werden",
    interval30min: "30 Min", interval1hour: "1 Stunde", interval2hours: "2 Stunden",
    interval3hours: "3 Stunden", interval4hours: "4 Stunden",
    autoDismiss5s: "5s", autoDismiss10s: "10s", autoDismiss15s: "15s",
    autoDismiss20s: "20s", autoDismiss30s: "30s",
    quiet9pm: "21:00", quiet10pm: "22:00", quiet11pm: "23:00", quiet12am: "0:00",
    wake5am: "5:00", wake6am: "6:00", wake7am: "7:00", wake8am: "8:00"
};

de.quickAccess = {
    title: "Schnellzugriff", morning: "Morgen", evening: "Abend",
    prayer: "Gebet", sleep: "Schlaf", wake: "Aufwachen", general: "Allgemein"
};

de.tasbih = {
    title: "Tasbih-Zähler", target: "Ziel",
    tapToCount: "Tippen zum Zählen • Halten zum Zurücksetzen",
    targetReached: "Ziel erreicht!", resetCounter: "Zähler zurücksetzen",
    resetConfirm: "Möchten Sie den Zähler wirklich auf 0 zurücksetzen?",
    cancel: "Abbrechen", reset: "Zurücksetzen"
};

de.weeklyChart = {
    title: "Diese Woche", prayed: "Gebetet", missed: "Verpasst", late: "Verspätet",
    noData: "Keine Daten verfügbar",
    sun: "So", mon: "Mo", tue: "Di", wed: "Mi", thu: "Do", fri: "Fr", sat: "Sa"
};

de.citySearch = {
    selectCity: "Stadt wählen", searchPlaceholder: "Weltweit nach Städten suchen...",
    recent: "ZULETZT", popularCities: "BELIEBTE STÄDTE", noCities: "Keine Städte gefunden",
    tryDifferent: "Versuchen Sie eine andere Schreibweise",
    offline: "Offline", offlineMessage: "Sie sind derzeit offline. Für den Wechsel wird Internet benötigt.",
    networkError: "Netzwerkfehler. Zeige lokale Ergebnisse."
};

de.upcomingEvents = { title: "Kommende Ereignisse", noEvents: "Keine kommenden Ereignisse" };

de.hifzControls = {
    title: "Hifz-Steuerung", hideTab: "Verstecken", repeatTab: "Wiederholen",
    loopTab: "Schleife", progressTab: "Fortschritt", hideMode: "Versteck-Modus",
    wordAudio: "Wort-Audio", requiresInternet: "benötigt Internet",
    playPronunciation: "Aussprache beim Aufdecken abspielen",
    quickActions: "Schnellaktionen", revealAll: "Alle anzeigen", hideAll: "Alle verstecken",
    autoHideDelay: "Auto-Versteck-Verzögerung", autoHideAfter: "Automatisch nach dem Aufdecken verstecken",
    markCurrentVerse: "Aktuellen Vers markieren", verse: "Vers",
    notStarted: "Nicht begonnen", inProgress: "In Bearbeitung", memorized: "Auswendig",
    longPressToMark: "Lange drücken um den Lernstatus zu markieren",
    bulkMarking: "Massenmarkierung", page: "Seite", juz: "Dschuz", clear: "Löschen",
    clearPageMarkings: "Seitenmarkierungen löschen", markEntirePage: "Gesamte Seite markieren",
    clearJuzMarkings: "Dschuz-Markierungen löschen", markEntireJuz: "Gesamten Dschuz markieren",
    cancel: "Abbrechen", confirm: "Bestätigen"
};

de.taraweeh = {
    title: "Tarawih-Tracker", ramadanCalendar: "Ramadan-Kalender",
    locationBreakdown: "Standort-Aufschlüsselung", completionRate: "Abschlussrate",
    logNight: "Nacht erfassen", edit: "Bearbeiten", night: "Nacht", nights: "Nächte",
    streak: "Serie", best: "Beste", atMosque: "in der Moschee", atHome: "zu Hause"
};

de.mosqueDetail = {
    title: "Moschee-Details", openingHours: "Öffnungszeiten", directions: "Wegbeschreibung",
    call: "Anrufen", website: "Webseite", rating: "Bewertung", reviews: "Bewertungen",
    failedToLoad: "Details konnten nicht geladen werden", tryAgain: "Erneut versuchen",
    openNow: "Jetzt geöffnet", closed: "Geschlossen", address: "Adresse",
    contact: "Kontakt", getDirections: "Wegbeschreibung", away: "entfernt"
};

de.donation = {
    addTitle: "Spende hinzufügen", type: "Art", amount: "Betrag",
    recipientOptional: "Empfänger (optional)", recipientPlaceholder: "Organisation oder Person",
    notesOptional: "Notizen (optional)", notesPlaceholder: "Notizen hinzufügen...",
    addButton: "Spende hinzufügen", sadaqah: "Sadaqah", zakat: "Zakat",
    fidya: "Fidyah", kaffarah: "Kaffarah", other: "Andere"
};

de.setGoal = {
    title: "Ziel setzen", goalAmount: "Zielbetrag (USD)", setButton: "Ziel setzen",
    infoText: "Ein Spendenziel hilft Ihnen, Ihren Fortschritt im Ramadan zu verfolgen."
};

de.logTaraweeh = {
    editTitle: "Bearbeiten", logTitle: "Erfassen", night: "Nacht", rakaat: "Raka'at",
    location: "Ort", mosque: "Moschee", home: "Zuhause",
    notesOptional: "Notizen (optional)", notesPlaceholder: "Notizen hinzufügen...",
    delete: "Löschen", save: "Speichern"
};

de.suhoorIftar = { suhoorReminder: "Suhoor-Erinnerung", iftarReminder: "Iftar-Erinnerung" };
de.ramadanCountdown = { daysLeft: "Tage übrig" };
de.quranProgress = { title: "Quran-Fortschritt" };
de.monthlyCalendar = { noData: "Keine Daten verfügbar" };

de.savedLoops = {
    title: "Gespeicherte Schleifen", enterName: "Schleifenname eingeben...",
    noName: "Bitte geben Sie einen Namen ein", noRange: "Bitte legen Sie zuerst einen Bereich fest",
    saveLoop: "Aktuelle Schleife speichern", saveCurrent: "Aktuelle speichern",
    delete: "Löschen", deleteLoop: "Schleife löschen",
    deleteConfirm: "Möchten Sie wirklich löschen",
    cancel: "Abbrechen", save: "Speichern", noLoops: "Noch keine gespeicherten Schleifen",
    error: "Fehler"
};

// Surah download section (check en.json for this)
de.surahDownload = { downloading: "Wird heruntergeladen...", downloaded: "Heruntergeladen", download: "Herunterladen", delete: "Löschen" };

fs.writeFileSync(path.join(localeDir, 'de.json'), JSON.stringify(de, null, 4), 'utf8');
console.log('✅ DE Part 2 done:', Object.keys(de).length, 'total sections');
