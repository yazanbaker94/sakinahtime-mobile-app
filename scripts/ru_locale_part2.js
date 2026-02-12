// Russian locale - Part 2: Remaining UI sections
const fs = require('fs');
const path = require('path');
const localeDir = path.join(__dirname, '../client/i18n/locales');
const ru = JSON.parse(fs.readFileSync(path.join(localeDir, 'ru.json'), 'utf8'));

ru.onboarding = {
    welcome: "Добро пожаловать в SakinahTime", welcomeDesc: "Ваш спутник в духовном пути",
    skip: "Пропустить", next: "Далее", getStarted: "Начать", done: "Готово",
    prayerTimesTitle: "Точное время намаза",
    prayerTimesDesc: "Получайте точное время намаза с красивыми уведомлениями азана",
    quranTitle: "Прекрасный Коран",
    quranDesc: "Читайте Коран с переводами, пословным разбором и аудио-рецитацией",
    azkarTitle: "Ежедневные азкар и дуа",
    azkarDesc: "Утренние и вечерние азкар, дуа на все случаи и счётчик зикра",
    notificationsDesc: "Не пропустите ни одного намаза с настраиваемыми уведомлениями",
    widgetDesc: "Добавьте виджет для быстрого доступа к расписанию намазов",
    welcomeTitle: "Ассаляму алейкум", welcomeSubtitle: "Добро пожаловать в SakinahTime",
    welcomeDescription: "Ваш спутник для намаза, чтения Корана и духовного роста.",
    locationTitle: "Точное время намаза", locationSubtitle: "Доступ к местоположению",
    locationDescription: "Мы используем ваше местоположение для расчёта точного времени намаза.",
    notificationsTitle: "Не пропустите намаз", notificationsSubtitle: "Напоминания",
    notificationsDescription: "Получайте уведомления с красивым звуком азана при наступлении намаза.",
    widgetTitle: "Добавить виджет", widgetSubtitle: "Надёжный азан",
    widgetDescription: "Добавьте виджет времени намаза для надёжных уведомлений, даже после перезагрузки.",
    doneTitle: "Всё готово!", doneSubtitle: "Готовы начать",
    doneDescription: "Начните путь к более осознанной духовной практике.",
    locationEnabled: "Местоположение включено", notificationsEnabled: "Уведомления включены",
    enable: "Включить", continue: "Продолжить", notNow: "Не сейчас",
    enableExactAlarms: "Включить точные будильники",
    exactAlarmsDescription: "SakinahTime нужно разрешение для установки точных будильников намаза.\n\nПожалуйста, включите \"Будильники и напоминания\" на следующем экране.",
    openSettings: "Открыть настройки", enableReliableAzan: "Включить надёжный азан",
    reliableAzanDescription: "Чтобы азан звучал после перезагрузки, нажмите:\n\nБатарея → Без ограничений\n\nЭто позволит приложению будить телефон для намаза."
};

ru.mosque = {
    title: "Ближайшие мечети", findMosques: "Найти мечети", distance: "Расстояние",
    directions: "Маршрут", noMosques: "Мечети поблизости не найдены",
    searchMosques: "Поиск мечетей...", openInMaps: "Открыть в картах"
};

ru.hijri = {
    title: "Хиджра календарь", today: "Сегодня",
    months: {
        "1": "Мухаррам", "2": "Сафар", "3": "Раби уль-Аввал", "4": "Раби уль-Ахир",
        "5": "Джумада уль-Уля", "6": "Джумада уль-Ахира", "7": "Раджаб", "8": "Шабан",
        "9": "Рамадан", "10": "Шавваль", "11": "Зуль-Каада", "12": "Зуль-Хиджа"
    }
};

ru.prayerStats = {
    title: "Статистика намаза", overview: "Обзор", totalPrayed: "Всего совершено",
    totalMissed: "Всего пропущено", onTimeRate: "Процент вовремя",
    weeklyBreakdown: "Недельная статистика", monthlyBreakdown: "Месячная статистика",
    bestDay: "Лучший день", prayerBreakdown: "Разбивка по намазам",
    noData: "Пока нет данных. Начните отслеживание!",
    loadingStats: "Загрузка статистики...", prayerTracking: "Отслеживание намазов",
    tapToMark: "Нажмите для отметки", enableToTrack: "Включите для отслеживания",
    tapToMarkStatus: "Нажмите кнопку для отметки статуса:",
    prayed: "Совершён", missed: "Пропущен", late: "Опоздал",
    missedReminder: "Напоминание о пропущенном",
    remindAfter: "Напомнить через {{minutes}} мин если не отмечено",
    getReminded: "Получайте напоминания", remindAfterLabel: "Напомнить через:",
    totalLogged: "Всего записано", qadaDue: "Каза к выполнению",
    weekly: "Неделя", monthly: "Месяц",
    exportFailed: "Ошибка экспорта", exportError: "Не удалось поделиться статистикой."
};

ru.prayerCalendar = {
    title: "Календарь намаза", monthlyView: "Месячный вид", allPrayed: "Все совершены",
    someMissed: "Некоторые пропущены", notTracked: "Не отслеживается", today: "Сегодня",
    unableToLoad: "Не удалось загрузить", selectMonthYear: "Выберите месяц и год",
    year: "Год", month: "Месяц"
};

ru.audioDownload = {
    title: "Загрузки аудио", downloadAll: "Скачать всё", deleteAll: "Удалить всё",
    downloading: "Скачивание...", downloaded: "Скачано", notDownloaded: "Не скачано",
    surahAudio: "Аудио суры", offline: "Офлайн",
    needInternet: "Для загрузки нужно подключение к интернету.",
    downloadAllSurahs: "Скачать все суры", deleteAllAudio: "Удалить всё аудио",
    download: "Скачать", delete: "Удалить", deleteAudio: "Удалить аудио",
    cancelDownloads: "Отменить загрузки",
    cancelAllDesc: "Отменить все загрузки? Частично скачанные суры будут удалены.",
    keepDownloading: "Продолжить", cancelAll: "Отменить все",
    deleteConfirmMessage: "Удалить скачанное аудио для"
};

ru.reciter = {
    title: "Выбрать чтеца", currentReciter: "Текущий чтец",
    popular: "Популярные", allReciters: "Все чтецы"
};

ru.duaDetail = {
    reference: "Источник", benefits: "Польза", occasion: "Случай",
    shareAsDua: "Поделиться дуа", notFound: "Дуа не найдено",
    notFoundMessage: "Это дуа не найдено.", listenPronunciation: "Прослушать произношение",
    viewInQuran: "Открыть в Коране", ayah: "Аят", benefitsVirtues: "Польза и достоинства"
};

ru.customDuaForm = {
    editDua: "Редактировать дуа", addCustomDua: "Добавить своё дуа",
    saving: "Сохранение...", saveFailed: "Не удалось сохранить.",
    deleteConfirm: "Вы уверены? Это действие нельзя отменить.",
    deleteFailed: "Не удалось удалить.", arabicText: "Арабский текст",
    optional: "Необязательно", transliteration: "Транслитерация",
    transliterationPlaceholder: "Введите транслитерацию (напр. Аллахумма...)",
    translationMeaning: "Перевод / Значение",
    translationPlaceholder: "Введите значение или перевод",
    personalNotes: "Личные заметки", notesPlaceholder: "Добавьте заметки",
    deleteThisDua: "Удалить это дуа"
};

ru.islamicGuide = { title: "Исламское руководство", steps: "Шаги", references: "Источники" };

ru.dhikrOverlay = {
    title: "Настройки оверлея зикра", enableOverlay: "Включить оверлей",
    overlayDesc: "Показывать плавающие напоминания о зикре", frequency: "Частота",
    everyMinutes: "Каждые {{count}} минут", style: "Стиль", position: "Позиция"
};

ru.wordByWordSettings = {
    title: "Пословный разбор", translationLang: "Язык перевода",
    showTransliteration: "Показывать транслитерацию", fontSize: "Размер шрифта"
};

ru.quranSchedule = {
    title: "Расписание Корана", createSchedule: "Создать расписание",
    completionDate: "Дата завершения", pagesPerDay: "Страниц в день",
    startDate: "Дата начала", daysDone: "Дней пройдено", day: "День",
    pages: "Страницы", completed: "Завершено", pending: "Ожидает",
    openInMushaf: "Открыть в мусхафе", today: "Сегодня", juz: "Джуз", surahs: "Суры:",
    openMushaf: "Открыть мусхаф", markComplete: "Отметить завершённым",
    completedAt: "Завершено:", remaining: "Осталось", complete: "Завершено",
    behindSchedule: "отстаёте от графика"
};

ru.zakatCalculator = {
    title: "Калькулятор закята", totalWealth: "Общее имущество (USD)",
    enterWealth: "Введите ваше имущество", calculate: "Рассчитать закят",
    results: "Результаты расчёта", nisabGold: "Нисаб (золото)", nisabSilver: "Нисаб (серебро)",
    meetsNisab: "Достигает нисаба", zakatDue: "Закят к оплате (2,5%)",
    info: "Закят составляет 2,5% от имущества, которым владели в течение года выше порога нисаба."
};

ru.hijriCalendar = {
    title: "Исламский календарь", event: "Событие", fasting: "Пост", ah: "г.х.",
    fastingProhibited: "Пост запрещён сегодня",
    eventIn: "{{name}} через {{count}} день", eventIn_plural: "{{name}} через {{count}} дней"
};

ru.common = {
    loading: "Загрузка...", error: "Ошибка", retry: "Повторить", ok: "ОК",
    cancel: "Отмена", save: "Сохранить", delete: "Удалить", edit: "Редактировать",
    close: "Закрыть", back: "Назад", done: "Готово", search: "Поиск",
    share: "Поделиться", copy: "Копировать", copied: "Скопировано!",
    noResults: "Результатов не найдено", offline: "Вы офлайн",
    yes: "Да", no: "Нет", confirm: "Подтвердить", reset: "Сбросить",
    add: "Добавить", remove: "Удалить", enable: "Включить", disable: "Отключить",
    on: "Вкл", off: "Выкл", yourRegion: "ваш регион", goBack: "Назад", skip: "Пропустить"
};

ru.components = {
    streakDays: "дней подряд", streakDaysPlural: "дней подряд",
    perfectDay: "Идеальный день", offlineMode: "Офлайн-режим",
    usingCachedData: "Используются кэшированные данные", lastSynced: "Последняя синхронизация",
    somethingWentWrong: "Что-то пошло не так", tryAgain: "Попробовать снова"
};

ru.streak = {
    prayerStreak: "Серия намазов", currentStreak: "Текущая серия",
    longestStreak: "Лучшая серия", days: "дней", day: "день",
    startToday: "Начните серию сегодня!", greatStart: "Отличное начало! Продолжайте!",
    buildingMomentum: "Вы набираете обороты!", amazingConsistency: "Потрясающая последовательность!",
    incredibleDedication: "Невероятная преданность!", trulyInspiring: "МашаАллах! Вдохновляет!"
};

ru.fasting = {
    fastingReminders: "Напоминания о посте",
    getNotifiedFasting: "Получать уведомления о днях поста",
    receiveReminders: "Получать напоминания о рекомендуемых днях поста",
    reminderTime: "Время напоминания", eveningBefore: "Вечер накануне",
    beforeFajr: "До Фаджра", thirtyMinBefore: "За 30 мин",
    fastingDays: "Дни поста", monday: "Понедельник", thursday: "Четверг",
    whiteDays: "Белые дни", ashura: "Ашура", dayOfArafah: "День Арафа",
    shawwal: "Шавваль", weeklySunnahFast: "Еженедельный сунна-пост",
    whiteDaysDesc: "13, 14, 15 числа каждого месяца", ashuraDesc: "10 Мухаррама",
    arafahDesc: "9 Зуль-Хиджа", shawwalDesc: "6 дней после Рамадана",
    notificationPermissionRequired: "⚠️ Требуется разрешение на уведомления"
};

ru.storageAlerts = {
    quranAudio: "Аудио Корана", tafsir: "Тафсир", prayerTimesCache: "Кэш намазов",
    otherCache: "Другой кэш", allCachedData: "Все кэшированные данные",
    clearConfirm: "Удалить {{category}}?",
    clearAllDesc: "Это удалит все скачанные аудио и тафсир. Потребуется повторная загрузка.",
    clearCategoryDesc: "Это удалит все {{category}}.",
    cancel: "Отмена", clear: "Удалить", error: "Ошибка",
    failedToClear: "Не удалось очистить кэш."
};

ru.mushaf = {
    notes: "Заметки и выделения", bookmarks: "Закладки", highlights: "Выделения",
    addNote: "Добавить заметку", save: "Сохранить", delete: "Удалить",
    noNotesYet: "Пока нет заметок", tapToAddNote: "Долгое нажатие на аят для добавления заметки",
    noBookmarksYet: "Пока нет закладок", tapToBookmark: "Нажмите на аят для закладки",
    editNote: "Редактировать заметку", writeNoteHere: "Напишите заметку...",
    hifzModeActivated: "Режим хифза активирован",
    hifzModeDesc: "Нажмите на аят, чтобы его показать. Долгое нажатие для опций заучивания.",
    wordByWordHighlighting: "Пословная подсветка",
    wordByWordDesc: "Долгое нажатие и перетаскивание для навигации по аудио.",
    justNow: "Только что", minutesAgo: "{{count}} мин назад", hoursAgo: "{{count}} ч назад",
    daysAgo: "{{count}} дн назад", noBookmarks: "Нет закладок",
    noResults: "Нет результатов", tryDifferent: "Попробуйте другие слова",
    search: "Поиск...", writeNote: "Напишите заметку...",
    quarterHizb: "Четверть хизба", halfHizb: "Половина хизба", fullJuzOnly: "Только полный джуз",
    copyVerse: "Копировать аят", shareVerse: "Поделиться аятом",
    chooseHighlight: "Выбрать цвет", removeHighlight: "Убрать выделение",
    highlight: "Выделить", selectReciter: "Выбрать чтеца",
    audioSettings: "Настройки аудио", noTafsir: "Тафсир недоступен",
    noTafsirVerse: "Тафсир для этого аята недоступен",
    recently: "Недавно", earlier: "Ранее", deleteFailed: "Не удалось удалить.",
    quran: "Коран", surahs114: "114 Сур", juz30: "30 Джузов", recentCount: "Недавние",
    surahTab: "Суры", juzTab: "Джуз", recentTab: "Недавние",
    searchPlaceholder: "Поиск...", includeTafsir: "Включить тафсир в поиск",
    notesSection: "ЗАМЕТКИ", highlightsSection: "ВЫДЕЛЕНИЯ",
    tafsirTranslation: "Тафсир/Перевод", nowPlaying: "ВОСПРОИЗВОДИТСЯ",
    paused: "ПАУЗА", verse: "Аят", repeat: "Повтор", loop: "Цикл",
    remaining: "осталось", surah: "Сура", noTafsirAvailable: "Тафсир для этого аята недоступен",
    noteInputPlaceholder: "Напишите здесь...", juzLabel: "Джуз", hizbLabel: "Хизб",
    searching: "ПОИСК...", resultsCount: "РЕЗУЛЬТАТЫ", recentlyViewed: "Недавно просмотренные",
    allSurahs: "ВСЕ СУРЫ", recentlyViewedLabel: "НЕДАВНО ПРОСМОТРЕННЫЕ",
    quartersLabel: "ЧЕТВЕРТИ", halvesLabel: "ПОЛОВИНЫ",
    pagesYouVisit: "Посещённые страницы появятся здесь",
    noRecentPages: "Нет недавних страниц", verses: "аятов", pageNumber: "Страница",
    loadingVerses: "Загрузка аятов...", bookmark: "Закладка",
    removeBookmark: "Убрать закладку", tafsirAndTranslations: "Тафсир и переводы",
    downloadedCount: "скачано", playUntil: "ВОСПРОИЗВЕСТИ ДО",
    page: "Страница", juz: "Джуз", reciterLabel: "ЧТЕЦ",
    play: "Воспроизвести", playCount: "Воспроизвести {{count}}×",
    setLoopStart: "Начало цикла", setLoopEnd: "Конец цикла",
    playLoop: "Воспроизвести цикл", tapToReveal: "Нажмите для показа",
    notStarted: "Не начато", inProgress: "В процессе", memorized: "Выучено",
    all: "Все", tapToMinimize: "НАЖМИТЕ ДЛЯ СВОРАЧИВАНИЯ"
};

ru.mosqueFinder = {
    nearbyMosques: "Ближайшие мечети", searchPlaceholder: "Поиск мечетей...",
    radius1km: "1 км", radius5km: "5 км", radius10km: "10 км", radius25km: "25 км"
};

ru.calendar = {
    months: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
    weekdays: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
};

ru.themePicker = { colorMode: "Цветовой режим", theme: "Тема", light: "Светлая", dark: "Тёмная", auto: "Авто" };

ru.storageOverview = {
    storageUsed: "Использовано", manage: "Управление",
    storageFull: "Хранилище почти заполнено.", availableOnDevice: "доступно на устройстве"
};

ru.storageBreakdown = {
    title: "Разбивка хранилища", quranAudio: "Аудио Корана",
    tafsir: "Тафсир", prayerTimes: "Время намаза", otherCache: "Другой кэш"
};

ru.storageSettings = {
    downloadSettings: "Настройки загрузки", storageLimit: "Лимит хранилища",
    maxSpace: "Максимальное пространство для офлайн-контента",
    wifiOnly: "Скачивать только по Wi-Fi", wifiOnlyDesc: "Экономьте мобильные данные",
    autoDelete: "Автоматическое удаление старого кэша",
    autoDeleteDesc: "Автоматически удалять старые данные при достижении лимита"
};

ru.dhikrReminders = {
    title: "Напоминания о зикре", floatingReminders: "Плавающие напоминания",
    dhikrNotifications: "Уведомления зикра",
    showOverlay: "Показывать оверлей зикра поверх других приложений",
    receiveNotifications: "Получать периодические уведомления о зикре",
    grantPermission: "Предоставить разрешение", previewOverlay: "Предпросмотр оверлея",
    reminderInterval: "Интервал", dhikrCategories: "Категории зикра",
    chooseTypes: "Выберите типы зикра", quietHours: "Тихие часы",
    pauseSleep: "Приостановить уведомления во время сна",
    startAt: "Начало", endAt: "Конец", autoDismiss: "Автозакрытие",
    overlayDisappears: "Оверлей исчезнет через это время",
    iosNotice: "Плавающий оверлей доступен только на Android. На iOS будут стандартные уведомления.",
    noCategories: "Выберите хотя бы одну категорию зикра",
    previewFailed: "Не удалось показать предпросмотр.", noDhikr: "Зикр не найден для выбранных категорий",
    error: "Ошибка", serviceFailed: "Не удалось запустить службу зикра",
    interval30min: "30 мин", interval1hour: "1 час", interval2hours: "2 часа",
    interval3hours: "3 часа", interval4hours: "4 часа",
    autoDismiss5s: "5с", autoDismiss10s: "10с", autoDismiss15s: "15с",
    autoDismiss20s: "20с", autoDismiss30s: "30с",
    quiet9pm: "21:00", quiet10pm: "22:00", quiet11pm: "23:00", quiet12am: "0:00",
    wake5am: "5:00", wake6am: "6:00", wake7am: "7:00", wake8am: "8:00"
};

ru.quickAccess = {
    title: "Быстрый доступ", morning: "Утро", evening: "Вечер",
    prayer: "Намаз", sleep: "Сон", wake: "Пробуждение", general: "Общее"
};

ru.tasbih = {
    title: "Тасбих-счётчик", target: "Цель",
    tapToCount: "Нажмите для счёта • Удерживайте для сброса",
    targetReached: "Цель достигнута!", resetCounter: "Сбросить счётчик",
    resetConfirm: "Вы уверены, что хотите сбросить счётчик?",
    cancel: "Отмена", reset: "Сбросить"
};

ru.weeklyChart = {
    title: "Эта неделя", prayed: "Совершён", missed: "Пропущен", late: "Опоздал",
    noData: "Нет данных",
    sun: "Вс", mon: "Пн", tue: "Вт", wed: "Ср", thu: "Чт", fri: "Пт", sat: "Сб"
};

ru.citySearch = {
    selectCity: "Выберите город", searchPlaceholder: "Поиск города...",
    recent: "НЕДАВНИЕ", popularCities: "ПОПУЛЯРНЫЕ ГОРОДА", noCities: "Города не найдены",
    tryDifferent: "Попробуйте другое написание",
    offline: "Офлайн", offlineMessage: "Вы сейчас офлайн. Для смены города нужен интернет.",
    networkError: "Ошибка сети. Показаны локальные результаты."
};

ru.upcomingEvents = { title: "Предстоящие события", noEvents: "Нет предстоящих событий" };

ru.hifzControls = {
    title: "Управление хифзом", hideTab: "Скрыть", repeatTab: "Повтор",
    loopTab: "Цикл", progressTab: "Прогресс", hideMode: "Режим скрытия",
    wordAudio: "Аудио слов", requiresInternet: "нужен интернет",
    playPronunciation: "Воспроизводить произношение при показе",
    quickActions: "Быстрые действия", revealAll: "Показать все", hideAll: "Скрыть все",
    autoHideDelay: "Задержка скрытия", autoHideAfter: "Автоматически скрыть после показа",
    markCurrentVerse: "Отметить текущий аят", verse: "Аят",
    notStarted: "Не начато", inProgress: "В процессе", memorized: "Выучено",
    longPressToMark: "Долгое нажатие для отметки статуса",
    bulkMarking: "Массовая отметка", page: "Страница", juz: "Джуз", clear: "Очистить",
    clearPageMarkings: "Очистить отметки страницы", markEntirePage: "Отметить всю страницу",
    clearJuzMarkings: "Очистить отметки джуза", markEntireJuz: "Отметить весь джуз",
    cancel: "Отмена", confirm: "Подтвердить"
};

ru.taraweeh = {
    title: "Трекер таравиха", ramadanCalendar: "Календарь Рамадана",
    locationBreakdown: "По местоположению", completionRate: "Процент выполнения",
    logNight: "Записать ночь", edit: "Редактировать", night: "Ночь", nights: "Ночей",
    streak: "Серия", best: "Лучшая", atMosque: "в мечети", atHome: "дома"
};

ru.mosqueDetail = {
    title: "О мечети", openingHours: "Часы работы", directions: "Маршрут",
    call: "Позвонить", website: "Сайт", rating: "Рейтинг", reviews: "отзывов",
    failedToLoad: "Не удалось загрузить", tryAgain: "Попробовать снова",
    openNow: "Открыто", closed: "Закрыто", address: "Адрес",
    contact: "Контакт", getDirections: "Маршрут", away: "далеко"
};

ru.donation = {
    addTitle: "Добавить пожертвование", type: "Тип", amount: "Сумма",
    recipientOptional: "Получатель (необяз.)", recipientPlaceholder: "Организация или человек",
    notesOptional: "Заметки (необяз.)", notesPlaceholder: "Добавить заметки...",
    addButton: "Добавить пожертвование", sadaqah: "Садака", zakat: "Закят",
    fidya: "Фидья", kaffarah: "Каффара", other: "Другое"
};

ru.setGoal = {
    title: "Установить цель", goalAmount: "Сумма цели (USD)", setButton: "Установить цель",
    infoText: "Цель благотворительности помогает отслеживать прогресс в Рамадане."
};

ru.logTaraweeh = {
    editTitle: "Редактировать", logTitle: "Записать", night: "Ночь", rakaat: "Ракаат",
    location: "Место", mosque: "Мечеть", home: "Дома",
    notesOptional: "Заметки (необяз.)", notesPlaceholder: "Добавить заметки...",
    delete: "Удалить", save: "Сохранить"
};

ru.suhoorIftar = { suhoorReminder: "Напоминание о сухуре", iftarReminder: "Напоминание об ифтаре" };
ru.ramadanCountdown = { daysLeft: "Дней осталось" };
ru.quranProgress = { title: "Прогресс Корана" };
ru.monthlyCalendar = { noData: "Нет данных" };

ru.savedLoops = {
    title: "Сохранённые циклы", enterName: "Введите название...",
    noName: "Введите название", noRange: "Сначала установите диапазон",
    saveLoop: "Сохранить текущий цикл", saveCurrent: "Сохранить текущий",
    delete: "Удалить", deleteLoop: "Удалить цикл", deleteConfirm: "Вы уверены?",
    cancel: "Отмена", save: "Сохранить", noLoops: "Нет сохранённых циклов",
    error: "Ошибка"
};

ru.surahDownload = { downloading: "Скачивание...", downloaded: "Скачано", download: "Скачать", delete: "Удалить" };

fs.writeFileSync(path.join(localeDir, 'ru.json'), JSON.stringify(ru, null, 4), 'utf8');
console.log('✅ RU Part 2 done:', Object.keys(ru).length, 'total sections');
