// Second pass: patch fr.json with remaining translations
const fs = require('fs');
const path = require('path');
const fr = JSON.parse(fs.readFileSync(path.join(__dirname, '../client/i18n/locales/fr.json'), 'utf8'));

// Patch all remaining sections
Object.assign(fr.tabs, { qibla: "Qibla", azkar: "Azkar" });
Object.assign(fr.settings, { auto: "Auto" });
Object.assign(fr.prayer, { fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha", minutes: "MINUTES", min: "min" });
Object.assign(fr.qibla, { title: "Qibla", direction: "Direction", distance: "Distance", km: "KM", qiblaLabel: "QIBLA" });
Object.assign(fr.quran, { page: "Page", notes: "Notes", pause: "Pause", audio: "Audio", surah: "Sourate", settings: "Paramètres" });
Object.assign(fr.azkar, { guides: "Guides", hadith: "Hadith", count: "Compteur", custom: "Personnalisé" });
Object.assign(fr.azkarDetail, { quran: "Coran", translit: "Translittération", english: "Anglais", counter: "Compteur" });
Object.assign(fr.progress, { monthly: "Mensuel", weekly: "Hebdomadaire" });
Object.assign(fr.location, { latitude: "Latitude", longitude: "Longitude" });

// Mushaf (72 keys)
Object.assign(fr.mushaf, {
    notes: "Notes et Surlignages", bookmarks: "Signets", highlights: "Surlignages",
    addNote: "Ajouter une note", save: "Enregistrer", delete: "Supprimer",
    noNotesYet: "Pas encore de notes ou surlignages",
    tapToAddNote: "Appui long sur un verset pour ajouter une note ou un surlignage",
    noBookmarksYet: "Pas encore de signets", tapToBookmark: "Appuyez sur un verset pour le marquer",
    editNote: "Modifier la note", writeNoteHere: "Écrivez votre note ici...",
    hifzModeActivated: "Mode Hifz activé",
    hifzModeDesc: "Appuyez sur un verset pour le révéler. Appui long pour les options de mémorisation. Maintenez le bouton Hifz pour les paramètres.",
    wordByWordHighlighting: "Surlignage mot à mot",
    wordByWordDesc: "Appui long n'importe où sur la page et glissez pour parcourir l'audio. Le mot surligné suivra votre doigt.",
    justNow: "À l'instant", minutesAgo: "il y a {{count}}m", hoursAgo: "il y a {{count}}h", daysAgo: "il y a {{count}}j",
    noBookmarks: "Pas encore de signets", noResults: "Aucun résultat trouvé",
    tryDifferent: "Essayez d'autres mots-clés", search: "Rechercher...",
    writeNote: "Écrivez votre note ici...",
    quarterHizb: "Quart de Hizb", halfHizb: "Demi Hizb", fullJuzOnly: "Juz complet uniquement",
    copyVerse: "Copier le verset", shareVerse: "Partager le verset",
    chooseHighlight: "Choisir la couleur de surlignage", removeHighlight: "Supprimer le surlignage",
    highlight: "Surligner", selectReciter: "Sélectionner le récitateur",
    audioSettings: "Paramètres audio", noTafsir: "Aucun tafsir disponible",
    noTafsirVerse: "Aucun tafsir disponible pour ce verset",
    recently: "Récemment", earlier: "Plus tôt",
    deleteFailed: "Échec de la suppression. Veuillez réessayer.",
    quran: "Coran", surahs114: "114 Sourates", juz30: "30 Juz",
    recentCount: "Récent", surahTab: "Sourate", juzTab: "Juz", recentTab: "Récent",
    searchPlaceholder: "Rechercher...",
    includeTafsir: "Inclure Tafsir/Traduction dans la recherche",
    notesSection: "NOTES", highlightsSection: "SURLIGNAGES",
    tafsirTranslation: "Tafsir/Traduction",
    nowPlaying: "EN COURS", paused: "EN PAUSE", verse: "Verset",
    repeat: "Répéter", loop: "Boucle", remaining: "restant",
    surah: "Sourate", noTafsirAvailable: "Aucun tafsir disponible pour ce verset",
    noteInputPlaceholder: "Écrivez votre note ici...",
    juzLabel: "Juz", hizbLabel: "Hizb",
    searching: "RECHERCHE...", resultsCount: "RÉSULTATS",
    recentlyViewed: "Vus récemment", allSurahs: "TOUTES LES SOURATES",
    recentlyViewedLabel: "VUS RÉCEMMENT", quartersLabel: "QUARTS", halvesLabel: "MOITIÉS",
    pagesYouVisit: "Les pages que vous visitez apparaîtront ici",
    noRecentPages: "Pas encore de pages récentes",
    verses: "versets", pageNumber: "Page", loadingVerses: "Chargement des versets...",
    bookmark: "Signet", removeBookmark: "Supprimer le signet",
    tafsirAndTranslations: "Tafsir et Traductions", downloadedCount: "téléchargé",
    playUntil: "LIRE JUSQU'À", page: "Page", juz: "Juz",
    reciterLabel: "RÉCITATEUR", play: "Lire",
    playCount: "Lire {{count}}×", setLoopStart: "Définir le début de la boucle",
    setLoopEnd: "Définir la fin de la boucle", playLoop: "Lire la boucle",
    tapToReveal: "Appuyez pour révéler",
    notStarted: "Non commencé", inProgress: "En cours", memorized: "Mémorisé",
    all: "Tout", tapToMinimize: "APPUYEZ POUR RÉDUIRE"
});

// Dhikr reminders (38 keys)
Object.assign(fr.dhikrReminders, {
    title: "Rappels de Dhikr", floatingReminders: "Rappels flottants",
    dhikrNotifications: "Notifications de Dhikr",
    showOverlay: "Afficher la superposition de dhikr par-dessus les autres applications",
    receiveNotifications: "Recevoir des notifications de dhikr périodiques",
    grantPermission: "Accorder la permission de superposition",
    previewOverlay: "Aperçu de la superposition",
    reminderInterval: "Intervalle de rappel",
    dhikrCategories: "Catégories de Dhikr",
    chooseTypes: "Choisissez les types de dhikr à inclure",
    quietHours: "Heures calmes",
    pauseSleep: "Suspendre les rappels pendant le sommeil",
    startAt: "Début à", endAt: "Fin à",
    autoDismiss: "Rejet automatique",
    overlayDisappears: "La superposition disparaît après ce temps",
    iosNotice: "La superposition flottante est disponible uniquement sur Android. Sur iOS, vous recevrez des notifications standard.",
    noCategories: "Veuillez activer au moins une catégorie de dhikr",
    previewFailed: "Impossible d'afficher l'aperçu. Veuillez réessayer.",
    noDhikr: "Impossible de trouver du contenu de dhikr pour les catégories sélectionnées",
    error: "Erreur", serviceFailed: "Échec du démarrage du service de rappel de dhikr",
    interval30min: "30 min", interval1hour: "1 heure", interval2hours: "2 heures",
    interval3hours: "3 heures", interval4hours: "4 heures",
    autoDismiss5s: "5s", autoDismiss10s: "10s", autoDismiss15s: "15s",
    autoDismiss20s: "20s", autoDismiss30s: "30s",
    quiet9pm: "21h", quiet10pm: "22h", quiet11pm: "23h", quiet12am: "0h",
    wake5am: "5h", wake6am: "6h", wake7am: "7h", wake8am: "8h"
});

// Onboarding (34 keys)
Object.assign(fr.onboarding, {
    welcome: "Bienvenue sur SakinahTime",
    welcomeDesc: "Votre compagnon pour un voyage spirituel conscient",
    skip: "Passer", next: "Suivant", getStarted: "Commencer", done: "Terminé",
    prayerTimesTitle: "Horaires de prière précis",
    prayerTimesDesc: "Obtenez des horaires de prière précis basés sur votre localisation avec de belles notifications d'azan",
    quranTitle: "Belle expérience du Coran",
    quranDesc: "Lisez le Coran avec plusieurs traductions, mot à mot et récitation audio",
    azkarTitle: "Azkar et Douas quotidiens",
    azkarDesc: "Accédez aux azkar du matin et du soir, aux douas pour chaque occasion et au compteur de dhikr",
    notificationsDesc: "Ne manquez jamais une prière avec des notifications et alarmes d'azan personnalisables",
    widgetDesc: "Ajoutez un widget à votre écran d'accueil pour un accès rapide aux horaires de prière",
    welcomeTitle: "Assalamu Alaikum", welcomeSubtitle: "Bienvenue sur SakinahTime",
    welcomeDescription: "Votre compagnon pour les horaires de prière, la lecture du Coran et la croissance spirituelle.",
    locationTitle: "Horaires de prière précis",
    locationSubtitle: "Accès à la localisation",
    locationDescription: "Nous utilisons votre localisation pour calculer des horaires de prière précis pour votre zone.",
    notificationsTitle: "Ne manquez jamais une prière",
    notificationsSubtitle: "Rappels de notification",
    notificationsDescription: "Soyez notifié avec de beaux sons d'Azan quand l'heure de la prière arrive.",
    widgetTitle: "Ajouter un widget", widgetSubtitle: "Azan fiable",
    widgetDescription: "Ajoutez un widget d'horaires de prière à votre écran d'accueil pour des notifications d'Azan fiables, même après le redémarrage du téléphone.",
    doneTitle: "Tout est prêt !", doneSubtitle: "Prêt à commencer",
    doneDescription: "Commencez votre voyage vers une pratique spirituelle plus consciente.",
    locationEnabled: "Localisation activée", notificationsEnabled: "Notifications activées",
    enable: "Activer", continue: "Continuer", notNow: "Pas maintenant",
    enableExactAlarms: "Activer les alarmes exactes",
    exactAlarmsDescription: "SakinahTime a besoin de la permission de programmer des alarmes précises.\n\nVeuillez activer \"Alarmes et rappels\" sur l'écran suivant.",
    openSettings: "Ouvrir les paramètres",
    enableReliableAzan: "Activer l'Azan fiable",
    reliableAzanDescription: "Pour garantir que l'Azan se joue après le redémarrage du téléphone, veuillez appuyer sur :\n\nBatterie → Sans restriction\n\nCela permet à l'application de réveiller votre téléphone pour les horaires de prière."
});

// Hifz Controls (22)
Object.assign(fr.hifzControls, {
    title: "Contrôles Hifz", hideTab: "Cacher", repeatTab: "Répéter",
    loopTab: "Boucle", progressTab: "Progrès",
    hideMode: "Mode caché", wordAudio: "Audio du mot",
    requiresInternet: "nécessite internet",
    playPronunciation: "Jouer la prononciation lors de la révélation d'un mot",
    quickActions: "Actions rapides", revealAll: "Tout révéler", hideAll: "Tout cacher",
    autoHideDelay: "Délai de masquage automatique",
    autoHideAfter: "Masquer automatiquement après la révélation",
    markCurrentVerse: "Marquer le verset actuel", verse: "Verset",
    notStarted: "Non commencé", inProgress: "En cours", memorized: "Mémorisé",
    longPressToMark: "Appui long sur un verset pour marquer son statut de mémorisation",
    bulkMarking: "Marquage en masse", page: "Page", juz: "Juz",
    clear: "Effacer", clearPageMarkings: "Effacer les marquages de la page",
    markEntirePage: "Marquer la page entière",
    clearJuzMarkings: "Effacer les marquages du Juz",
    markEntireJuz: "Marquer le Juz entier",
    cancel: "Annuler", confirm: "Confirmer"
});

// Prayer Stats (21)
Object.assign(fr.prayerStats, {
    title: "Statistiques de prière", overview: "Aperçu",
    totalPrayed: "Total prié", totalMissed: "Total manqué",
    onTimeRate: "Taux de ponctualité",
    weeklyBreakdown: "Répartition hebdomadaire", monthlyBreakdown: "Répartition mensuelle",
    bestDay: "Meilleur jour", prayerBreakdown: "Répartition des prières",
    noData: "Pas encore de données de prière. Commencez à suivre vos prières !",
    loadingStats: "Chargement des statistiques...",
    prayerTracking: "Suivi des prières",
    tapToMark: "Appuyez sur les prières pour marquer comme prié",
    enableToTrack: "Activez pour suivre vos prières",
    tapToMarkStatus: "Appuyez sur un bouton pour marquer le statut de prière :",
    prayed: "Prié", missed: "Manqué", late: "En retard",
    missedReminder: "Rappel de prière manquée",
    remindAfter: "Rappeler après {{minutes}} min si non marqué",
    getReminded: "Recevez un rappel pour marquer vos prières",
    remindAfterLabel: "Me rappeler après :",
    totalLogged: "Total enregistré", qadaDue: "Qada dû",
    weekly: "Hebdomadaire", monthly: "Mensuel",
    exportFailed: "Échec de l'export",
    exportError: "Impossible de partager les statistiques de prière."
});

// Revision (20)
Object.assign(fr.revision, {
    title: "Révision quotidienne", dueNow: "Dû maintenant",
    noRevision: "Aucune révision due", startReview: "Commencer la révision",
    markReviewed: "Marquer comme révisé", versesDue: "versets à réviser",
    todayProgress: "Progrès d'aujourd'hui", overdue: "En retard", due: "Dû",
    allCaughtUp: "Tout est à jour !", noVersesDue: "Aucun verset à réviser pour le moment",
    completedToday: "Terminé aujourd'hui", startSession: "Commencer la session de révision",
    howWell: "À quel point vous vous en souvenez",
    forgot: "Oublié", hard: "Difficile", okay: "Correct",
    good: "Bien", easy: "Facile", perfect: "Parfait", dAgo: "j. ago"
});

// Fasting (17)
Object.assign(fr.fasting, {
    fastingReminders: "Rappels de jeûne",
    getNotifiedFasting: "Soyez notifié des prochains jours de jeûne",
    receiveReminders: "Recevez des rappels pour les jours de jeûne recommandés",
    reminderTime: "Heure du rappel",
    eveningBefore: "La veille au soir", beforeFajr: "Avant Fajr",
    thirtyMinBefore: "30 min avant",
    fastingDays: "Jours de jeûne",
    monday: "Lundi", thursday: "Jeudi",
    whiteDays: "Jours blancs", ashura: "Achoura", dayOfArafah: "Jour d'Arafah",
    shawwal: "Shawwal",
    weeklySunnahFast: "Jeûne Sunnah hebdomadaire",
    whiteDaysDesc: "13, 14, 15 de chaque mois",
    ashuraDesc: "10 de Mouharram", arafahDesc: "9 de Dhou al-Hijja",
    shawwalDesc: "6 jours après le Ramadan",
    notificationPermissionRequired: "⚠️ Permission de notification requise"
});

// Audio Download (16)
Object.assign(fr.audioDownload, {
    title: "Téléchargements audio", downloadAll: "Tout télécharger",
    deleteAll: "Tout supprimer", downloading: "Téléchargement...",
    downloaded: "Téléchargé", notDownloaded: "Non téléchargé",
    surahAudio: "Audio de la Sourate", offline: "Hors ligne",
    needInternet: "Vous avez besoin d'une connexion internet pour télécharger l'audio.",
    downloadAllSurahs: "Télécharger toutes les Sourates",
    deleteAllAudio: "Supprimer tout l'audio",
    download: "Télécharger", delete: "Supprimer", deleteAudio: "Supprimer l'audio",
    cancelDownloads: "Annuler les téléchargements",
    cancelAllDesc: "Annuler tous les téléchargements en attente ? Les sourates partiellement téléchargées seront supprimées.",
    keepDownloading: "Continuer le téléchargement",
    cancelAll: "Tout annuler",
    deleteConfirmMessage: "Supprimer l'audio téléchargé pour"
});

// Calculation Methods (16)
Object.assign(fr.calculationMethods, {
    shia: "Chiite Ithna-Ansari",
    karachi: "Université des Sciences Islamiques, Karachi",
    isna: "Société Islamique d'Amérique du Nord",
    mwl: "Ligue Islamique Mondiale",
    ummAlQura: "Université Umm Al-Qura, La Mecque",
    egypt: "Autorité Générale Égyptienne de Topographie",
    tehran: "Institut de Géophysique, Université de Téhéran",
    gulf: "Région du Golfe", kuwait: "Koweït", qatar: "Qatar",
    muis: "Majlis Ugama Islam Singapura, Singapour",
    uoif: "Union des Organisations Islamiques de France",
    diyanet: "Diyanet İşleri Başkanlığı, Turquie",
    russia: "Administration Spirituelle des Musulmans de Russie",
    moonsighting: "Comité Mondial d'Observation de la Lune",
    jordan: "Ministère des Awqaf, Affaires Islamiques, Jordanie"
});

// Storage (15)
Object.assign(fr.storage, {
    title: "Stockage et Téléchargements", totalUsed: "Stockage total utilisé",
    audioFiles: "Fichiers audio", clearAllDownloads: "Supprimer tous les téléchargements",
    clearConfirm: "Êtes-vous sûr de vouloir supprimer tout le contenu téléchargé ?",
    confirm: "Confirmer", cancel: "Annuler",
    reciterAudio: "Audio du récitateur", mushafPages: "Pages du Mushaf",
    totalSize: "Taille totale", noDownloads: "Aucun téléchargement",
    loadingInfo: "Chargement des informations de stockage...",
    quickActions: "Actions rapides", manageAudio: "Gérer l'audio",
    downloadQuran: "Télécharger le Coran", clearAll: "Tout effacer",
    freeUpSpace: "Libérer de l'espace", refreshInfo: "Actualiser les infos de stockage"
});

// Quran Schedule (15)
Object.assign(fr.quranSchedule, {
    title: "Programme du Coran", createSchedule: "Créer un programme",
    completionDate: "Date d'achèvement cible", pagesPerDay: "Pages par jour",
    startDate: "Date de début", daysDone: "Jours terminés",
    day: "Jour", pages: "Pages", completed: "Terminé", pending: "En attente",
    openInMushaf: "Ouvrir dans le Mushaf", today: "Aujourd'hui",
    juz: "Juz", surahs: "Sourates :", openMushaf: "Ouvrir le Mushaf",
    markComplete: "Marquer comme terminé", completedAt: "Terminé :",
    remaining: "Restant", complete: "Terminé",
    behindSchedule: "en retard sur le programme"
});

// Mosque Detail (14)
Object.assign(fr.mosqueDetail, {
    title: "Détails de la mosquée", openingHours: "Horaires d'ouverture",
    directions: "Itinéraire", call: "Appeler", website: "Site web",
    rating: "Évaluation", reviews: "avis",
    failedToLoad: "Échec du chargement des détails", tryAgain: "Réessayer",
    openNow: "Ouvert maintenant", closed: "Fermé",
    address: "Adresse", contact: "Contact",
    getDirections: "Obtenir l'itinéraire", away: "de distance"
});

// Custom Dua Form (13)
Object.assign(fr.customDuaForm, {
    editDua: "Modifier la doua", addCustomDua: "Ajouter une doua personnalisée",
    saving: "Enregistrement...",
    saveFailed: "Échec de l'enregistrement de la doua. Veuillez réessayer.",
    deleteConfirm: "Êtes-vous sûr de vouloir supprimer cette doua ? Cette action est irréversible.",
    deleteFailed: "Échec de la suppression de la doua. Veuillez réessayer.",
    arabicText: "Texte arabe", optional: "Optionnel",
    transliteration: "Translittération",
    transliterationPlaceholder: "Entrez la translittération (ex : Allahumma...)",
    translationMeaning: "Traduction / Signification",
    translationPlaceholder: "Entrez la signification ou la traduction",
    personalNotes: "Notes personnelles",
    notesPlaceholder: "Ajoutez des notes ou rappels personnels",
    deleteThisDua: "Supprimer cette doua"
});

// Hijri months (12)
Object.assign(fr.hijri, {
    title: "Calendrier Hégirien", today: "Aujourd'hui",
    months: {
        "1": "Mouharram", "2": "Safar", "3": "Rabi al-Awwal", "4": "Rabi al-Thani",
        "5": "Joumada al-Oula", "6": "Joumada al-Thani", "7": "Rajab", "8": "Chaabane",
        "9": "Ramadan", "10": "Chawwal", "11": "Dhou al-Qi'da", "12": "Dhou al-Hijja"
    }
});

// Dua Detail (10)
Object.assign(fr.duaDetail, {
    reference: "Référence", benefits: "Bienfaits", occasion: "Occasion",
    shareAsDua: "Partager la doua", notFound: "Doua non trouvée",
    notFoundMessage: "Cette doua est introuvable.",
    listenPronunciation: "Écouter la prononciation",
    viewInQuran: "Voir dans le Coran", ayah: "Ayah",
    benefitsVirtues: "Bienfaits et Vertus"
});

// Storage Alerts (10)
Object.assign(fr.storageAlerts, {
    quranAudio: "Audio du Coran", tafsir: "Tafsir",
    prayerTimesCache: "Cache des horaires de prière", otherCache: "Autre cache",
    allCachedData: "Toutes les données en cache",
    clearConfirm: "Effacer {{category}} ?",
    clearAllDesc: "Cela supprimera tout l'audio du Coran et le tafsir téléchargés. Vous devrez retélécharger pour l'utilisation hors ligne.",
    clearCategoryDesc: "Cela supprimera tout {{category}}. Vous devrez peut-être retélécharger pour l'utilisation hors ligne.",
    cancel: "Annuler", clear: "Effacer",
    error: "Erreur", failedToClear: "Échec de l'effacement du cache. Veuillez réessayer."
});

// Zakat Calculator (9)
Object.assign(fr.zakatCalculator, {
    title: "Calculateur de Zakat", totalWealth: "Patrimoine total (USD)",
    enterWealth: "Entrez votre patrimoine total",
    calculate: "Calculer la Zakat", results: "Résultats du calcul",
    nisabGold: "Nisab (Or)", nisabSilver: "Nisab (Argent)",
    meetsNisab: "Atteint le Nisab", zakatDue: "Zakat due (2,5%)",
    info: "La Zakat est de 2,5% du patrimoine détenu pendant une année lunaire au-dessus du seuil du Nisab. Le Nisab est basé sur la valeur de 87,48g d'or ou 612,36g d'argent."
});

// City Search (9)
Object.assign(fr.citySearch, {
    selectCity: "Sélectionner une ville",
    searchPlaceholder: "Rechercher n'importe quelle ville...",
    recent: "RÉCENT", popularCities: "VILLES POPULAIRES",
    noCities: "Aucune ville trouvée",
    tryDifferent: "Essayez une orthographe différente ou recherchez une grande ville à proximité",
    offline: "Hors ligne",
    offlineMessage: "Vous êtes actuellement hors ligne. Changer de ville nécessite internet pour récupérer les horaires de prière. Veuillez utiliser une ville récemment visitée ou réessayer en ligne.",
    networkError: "Erreur réseau. Affichage des résultats locaux."
});

// Taraweeh (9)
Object.assign(fr.taraweeh, {
    title: "Suivi des Tarawih", ramadanCalendar: "Calendrier du Ramadan",
    locationBreakdown: "Répartition par lieu", completionRate: "Taux d'achèvement",
    logNight: "Enregistrer la nuit", edit: "Modifier",
    night: "Nuit", nights: "Nuits", streak: "Série",
    best: "Meilleur", atMosque: "à la mosquée", atHome: "à la maison"
});

// Donation (9)
Object.assign(fr.donation, {
    addTitle: "Ajouter un don", type: "Type", amount: "Montant",
    recipientOptional: "Destinataire (optionnel)",
    recipientPlaceholder: "Organisation ou personne",
    notesOptional: "Notes (optionnel)", notesPlaceholder: "Ajoutez des notes...",
    addButton: "Ajouter un don",
    sadaqah: "Sadaqah", zakat: "Zakat", fidya: "Fidya", kaffarah: "Kaffarah", other: "Autre"
});

// Saved Loops (9)
Object.assign(fr.savedLoops, {
    title: "Boucles enregistrées", enterName: "Entrez le nom de la boucle...",
    noName: "Veuillez entrer un nom pour la boucle",
    noRange: "Veuillez d'abord définir une plage de boucle",
    saveLoop: "Enregistrer la boucle actuelle", saveCurrent: "Enregistrer",
    delete: "Supprimer", deleteLoop: "Supprimer la boucle",
    deleteConfirm: "Êtes-vous sûr de vouloir supprimer",
    cancel: "Annuler", save: "Enregistrer",
    noLoops: "Pas encore de boucles enregistrées", error: "Erreur"
});

// Repeat Controls (9)
Object.assign(fr.repeatControls, {
    title: "Paramètres de répétition audio",
    subtitle: "Pour la pratique de mémorisation",
    timesToRepeat: "Nombre de répétitions",
    timesHint: "Le verset est lu ce nombre de fois",
    gapBetween: "Pause entre les répétitions",
    gapHint: "Temps pour réciter avant la prochaine lecture",
    recitationSpeed: "Vitesse de récitation",
    speedHint: "Plus lent aide à apprendre la prononciation",
    stopRepeating: "Arrêter la répétition"
});

// Hifz Constants (9)
Object.assign(fr.hifzConstants, {
    fullVerse: "Verset complet", fullVerseDesc: "Cacher le verset entier, appuyez pour tout révéler",
    wordByWord: "Mot à mot", wordByWordDesc: "Révéler un mot à la fois en récitant",
    manual: "Manuel", none: "Aucun",
    sec2: "2 sec", sec5: "5 sec",
    slow: "Lent", medium: "Moyen", normal: "Normal"
});

// Prayer Calendar (8)
Object.assign(fr.prayerCalendar, {
    title: "Calendrier de prière", monthlyView: "Vue mensuelle",
    allPrayed: "Tout prié", someMissed: "Quelques manquées",
    notTracked: "Non suivi", today: "Aujourd'hui",
    unableToLoad: "Impossible de charger les horaires de prière",
    selectMonthYear: "Sélectionner le mois et l'année",
    year: "Année", month: "Mois"
});

// Weekly Chart (8)
Object.assign(fr.weeklyChart, {
    title: "Cette semaine", prayed: "Prié", missed: "Manqué", late: "En retard",
    noData: "Aucune donnée disponible",
    sun: "Dim", mon: "Lun", tue: "Mar", wed: "Mer",
    thu: "Jeu", fri: "Ven", sat: "Sam"
});

// Word by Word settings (8)
Object.assign(fr.wordByWord, {
    title: "Mot à Mot",
    infoHint: "Appui long sur n'importe quel mot dans le Mushaf pour voir sa signification et entendre la prononciation.",
    translationLanguage: "Langue de traduction",
    arabicMeanings: "Significations arabes des mots difficiles",
    tapToDownload: "Appuyez pour télécharger",
    downloading: "Téléchargement...",
    audio: "Audio", playPronunciation: "Jouer la prononciation du mot",
    audioHint: "Entendre le mot quand vous levez votre doigt"
});

// Notifications remaining
Object.assign(fr.notifications, {
    min: "min", iqama: "Iqama", standard: "Standard", hanafi: "Hanafi"
});

// Mosque (7)
Object.assign(fr.mosque, {
    title: "Mosquées à proximité", findMosques: "Trouver des mosquées",
    distance: "Distance", directions: "Itinéraire",
    noMosques: "Aucune mosquée trouvée à proximité",
    searchMosques: "Rechercher des mosquées...", openInMaps: "Ouvrir dans Maps"
});

// Dhikr Overlay (7)
Object.assign(fr.dhikrOverlay, {
    title: "Paramètres de superposition Dhikr",
    enableOverlay: "Activer la superposition",
    overlayDesc: "Afficher les rappels de dhikr flottants",
    frequency: "Fréquence", everyMinutes: "Toutes les {{count}} minutes",
    style: "Style", position: "Position"
});

// Storage Settings (7)
Object.assign(fr.storageSettings, {
    downloadSettings: "Paramètres de téléchargement",
    storageLimit: "Limite de stockage",
    maxSpace: "Espace maximum pour le contenu hors ligne",
    wifiOnly: "Télécharger uniquement en WiFi",
    wifiOnlyDesc: "Économisez les données mobiles en téléchargeant uniquement en WiFi",
    autoDelete: "Suppression automatique de l'ancien cache",
    autoDeleteDesc: "Supprimer automatiquement les anciennes données en cache quand la limite est atteinte"
});

// Log Taraweeh (7)
Object.assign(fr.logTaraweeh, {
    editTitle: "Modifier", logTitle: "Enregistrer",
    night: "Nuit", rakaat: "Rakaat", location: "Lieu",
    mosque: "Mosquée", home: "Maison",
    notesOptional: "Notes (optionnel)", notesPlaceholder: "Ajoutez des notes...",
    delete: "Supprimer", save: "Enregistrer"
});

// Loop Range (7)
Object.assign(fr.loopRange, {
    start: "Début", end: "Fin", notSet: "Non défini",
    clear: "Effacer", playLoop: "Lire la boucle", stopLoop: "Arrêter la boucle",
    helpText: "Appui long sur un verset et appuyez sur \"Définir le début de la boucle\" ou \"Définir la fin de la boucle\" pour définir la plage"
});

// Mosque Finder (6)
Object.assign(fr.mosqueFinder, {
    nearbyMosques: "Mosquées à proximité",
    searchPlaceholder: "Rechercher des mosquées...",
    radius1km: "1 km", radius5km: "5 km", radius10km: "10 km", radius25km: "25 km"
});

// Hijri Calendar (6)
Object.assign(fr.hijriCalendar, {
    title: "Calendrier islamique", event: "Événement", fasting: "Jeûne",
    ah: "AH", fastingProhibited: "Jeûne interdit aujourd'hui",
    eventIn: "{{name}} dans {{count}} jour",
    eventIn_plural: "{{name}} dans {{count}} jours"
});

// Hifz Progress (6)
Object.assign(fr.hifzProgress, {
    title: "Progrès de Hifz", exportFailed: "Échec de l'export",
    exportError: "Impossible d'exporter les données de progrès",
    resetProgress: "Réinitialiser le progrès",
    resetConfirm: "Êtes-vous sûr de vouloir réinitialiser tout le progrès de mémorisation ?",
    resetSuccess: "Le progrès a été réinitialisé",
    resetError: "Échec de la réinitialisation du progrès",
    cancel: "Annuler", reset: "Réinitialiser",
    success: "Succès", error: "Erreur"
});

// Dua Collection (6)
Object.assign(fr.duaCollection, {
    title: "Douas", searchPlaceholder: "Rechercher des douas...",
    categories: "Catégories", quranic: "Coranique", prophetic: "Prophétique",
    favorites: "Favoris", myDuas: "Mes Douas",
    deleteDua: "Supprimer la doua",
    deleteConfirm: "Êtes-vous sûr de vouloir supprimer cette doua ?",
    deleteFailed: "Échec de la suppression de la doua",
    duasCount: "douas",
    noResultsFor: "Aucune doua trouvée pour \"{{query}}\"",
    results: "résultats", result: "résultat", forQuery: "pour",
    noQuranic: "Aucune doua coranique disponible",
    noProphetic: "Aucune doua prophétique disponible",
    noFavorites: "Pas encore de doua favorite.\nAppuyez sur l'icône cœur pour en ajouter ici.",
    noCustom: "Pas encore de doua personnalisée.\nAjoutez vos invocations personnelles ici.",
    addCustom: "Ajouter une doua personnalisée"
});

// Reciter (4)
Object.assign(fr.reciter, {
    title: "Sélectionner le récitateur", currentReciter: "Récitateur actuel",
    popular: "Populaire", allReciters: "Tous les récitateurs"
});

// Quick Access (5)
Object.assign(fr.quickAccess, {
    title: "Accès rapide", morning: "Matin", evening: "Soir",
    prayer: "Prière", sleep: "Sommeil", wake: "Réveil", general: "Général"
});

// Tasbih (5)
Object.assign(fr.tasbih, {
    title: "Compteur de Tasbih", target: "Objectif",
    tapToCount: "Appuyez pour compter • Maintenez pour réinitialiser",
    targetReached: "Objectif atteint !",
    resetCounter: "Réinitialiser le compteur",
    resetConfirm: "Êtes-vous sûr de vouloir réinitialiser le compteur à 0 ?",
    cancel: "Annuler", reset: "Réinitialiser"
});

// Word By Word Settings (4)
Object.assign(fr.wordByWordSettings, {
    title: "Paramètres Mot à Mot",
    translationLang: "Langue de traduction",
    showTransliteration: "Afficher la translittération",
    fontSize: "Taille de police"
});

// Storage Overview (4)
Object.assign(fr.storageOverview, {
    storageUsed: "Stockage utilisé", manage: "Gérer",
    storageFull: "Stockage presque plein. Libérez de l'espace pour continuer le téléchargement.",
    availableOnDevice: "disponible sur l'appareil"
});

// Storage Breakdown (4)
Object.assign(fr.storageBreakdown, {
    title: "Répartition du stockage", quranAudio: "Audio du Coran",
    tafsir: "Tafsir", prayerTimes: "Horaires de prière", otherCache: "Autre cache"
});

// Qada (5)
Object.assign(fr.qada, {
    title: "Suivi des Qada", totalRemaining: "Total restant",
    addMissed: "Ajouter manqué", prayersMadeUp: "Prières rattrapées",
    prayersRemaining: "Restantes",
    hint: "Appui long sur un compteur de prière pour soustraire",
    noQada: "Aucune prière Qada restante. MashaAllah !",
    fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha",
    prayers: "prières"
});

// Charity remaining (5)
Object.assign(fr.charity, {
    sadaqah: "Sadaqah", zakatPayment: "Zakat", waqf: "Waqf", other: "Autre",
    type: "Type"
});

// Hifz remaining (3)
Object.assign(fr.hifz, {
    pages: "Pages", verses: "Versets", juz: "Juz"
});

// Islamic Guide (3)
Object.assign(fr.islamicGuide, {
    title: "Guide Islamique", steps: "Étapes", references: "Références"
});

// Reciter Selection (3)
Object.assign(fr.reciterSelection, {
    title: "Sélectionner le récitateur",
    recitersAvailable: "récitateurs disponibles",
    downloaded: "Téléchargé",
    infoBanner: "Les récitateurs avec le badge de téléchargement ont des fichiers audio enregistrés sur votre appareil"
});

// Download Progress (3)
Object.assign(fr.downloadProgress, {
    downloading: "Téléchargement", paused: "En pause",
    failed: "Échec", pending: "En attente"
});

// Upcoming Events (2)
Object.assign(fr.upcomingEvents, {
    title: "Événements à venir", noEvents: "Aucun événement à venir"
});

// Set Goal (2)
Object.assign(fr.setGoal, {
    title: "Définir un objectif", goalAmount: "Montant de l'objectif (USD)",
    setButton: "Définir l'objectif",
    infoText: "Définir un objectif de charité vous aide à suivre votre progrès pendant le Ramadan. Vous pouvez mettre à jour cet objectif à tout moment."
});

// Error Fallback (2)
Object.assign(fr.errorFallback, {
    title: "Une erreur s'est produite",
    message: "Veuillez recharger l'application pour continuer.",
    tryAgain: "Réessayer", errorDetails: "Détails de l'erreur"
});

// Dua of Day (2)
Object.assign(fr.duaOfDay, {
    title: "Doua du jour", islamicSupplication: "Invocation islamique",
    tapToRead: "Appuyez pour lire la doua complète"
});

// Theme Picker (1)
Object.assign(fr.themePicker, {
    colorMode: "Mode de couleur", theme: "Thème",
    light: "Clair", dark: "Sombre", auto: "Auto"
});

// Suhoor Iftar
Object.assign(fr.suhoorIftar, {
    suhoorReminder: "Rappel du Suhoor", iftarReminder: "Rappel de l'Iftar"
});

// Ramadan Countdown (1)
Object.assign(fr.ramadanCountdown, { daysLeft: "Jours restants" });
// Quran Progress (1)
Object.assign(fr.quranProgress, { title: "Progrès du Coran" });
// Monthly Calendar (1)
Object.assign(fr.monthlyCalendar, { noData: "Aucune donnée disponible" });
// Calendar Grid (1)
Object.assign(fr.calendarGrid, { whiteDay: "Jour blanc" });
// Daily Dhikr (1)
Object.assign(fr.dailyDhikr, {
    title: "Dhikr quotidien", subtitle: "Souvenir en vedette d'aujourd'hui"
});
// Surah Download (1)
Object.assign(fr.surahDownload, { queued: "En file d'attente" });
// Common remaining
Object.assign(fr.common, { offline: "Vous êtes hors ligne" });
// Components remaining
Object.assign(fr.components, {
    streakDays: "jours de suite", streakDaysPlural: "jours de suite",
    perfectDay: "Journée parfaite"
});

// Ramadan remaining
Object.assign(fr.ramadan, { taraweeh: "Tarawih", completed: "Terminé" });

// Calendar months/weekdays
fr.calendar = {
    months: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"],
    weekdays: ["D", "L", "M", "M", "J", "V", "S"]
};

// Daily tips
fr.azkar.dailyTips = [
    { text: "Le Prophète ﷺ a dit : \"Le meilleur rappel est La ilaha illallah (Il n'y a de dieu qu'Allah).\"", source: "Tirmidhi" },
    { text: "Le Prophète ﷺ a dit : \"Celui qui dit SubhanAllah wa bihamdihi 100 fois, ses péchés seront pardonnés même s'ils étaient comme l'écume de la mer.\"", source: "Bukhari et Muslim" },
    { text: "Le Prophète ﷺ a dit : \"Deux mots sont légers sur la langue, lourds sur la balance, aimés du Très Miséricordieux : SubhanAllahi wa bihamdihi, SubhanAllahil Adheem.\"", source: "Bukhari et Muslim" },
    { text: "Le Prophète ﷺ a dit : \"Celui qui lit Ayat al-Kursi après chaque prière obligatoire, rien ne l'empêche d'entrer au Paradis sauf la mort.\"", source: "An-Nasa'i" },
    { text: "Le Prophète ﷺ a dit : \"Le plus proche qu'un serviteur est de son Seigneur est quand il est en prosternation, alors multipliez vos invocations.\"", source: "Muslim" },
    { text: "Le Prophète ﷺ a dit : \"Aucun d'entre vous ne croit vraiment tant qu'il n'aime pas pour son frère ce qu'il aime pour lui-même.\"", source: "Bukhari et Muslim" },
    { text: "Le Prophète ﷺ a dit : \"Celui qui croit en Allah et au Jour Dernier, qu'il dise du bien ou qu'il se taise.\"", source: "Bukhari et Muslim" },
    { text: "Le Prophète ﷺ a dit : \"Les meilleurs d'entre vous sont ceux qui apprennent le Coran et l'enseignent.\"", source: "Bukhari" },
    { text: "Le Prophète ﷺ a dit : \"Un sourire au visage de votre frère est une charité.\"", source: "Tirmidhi" },
    { text: "Le Prophète ﷺ a dit : \"Celui qui emprunte un chemin pour chercher la connaissance, Allah lui facilitera le chemin vers le Paradis.\"", source: "Muslim" },
    { text: "Le Prophète ﷺ a dit : \"L'invocation entre l'Adhan et l'Iqamah n'est pas rejetée.\"", source: "Abu Dawud et Tirmidhi" }
];

fs.writeFileSync(
    path.join(__dirname, '../client/i18n/locales/fr.json'),
    JSON.stringify(fr, null, 4),
    'utf8'
);
console.log('Patched fr.json');
