// Russian locale - Part 1: Core UI sections
const fs = require('fs');
const path = require('path');
const localeDir = path.join(__dirname, '../client/i18n/locales');
const en = JSON.parse(fs.readFileSync(path.join(localeDir, 'en.json'), 'utf8'));

const ru = {};

ru.tabs = { qibla: "Кибла", prayer: "Намаз", quran: "Коран", azkar: "Азкар", settings: "Настройки" };

ru.settings = {
    title: "Настройки", appearance: "Внешний вид", customizeTheme: "Настройте тему",
    language: "Язык", chooseLanguage: "Выберите язык", prayerFasting: "Намаз и пост",
    notificationsAzanReminders: "Уведомления, азан и напоминания",
    storageDownloads: "Хранилище и загрузки", manageOfflineContent: "Управление офлайн-контентом",
    wordByWord: "Слово за словом", translationLanguage: "Язык перевода",
    dhikrReminders: "Напоминания о зикре", floatingOverlay: "Плавающие напоминания",
    feedbackSuggestions: "Отзывы и предложения", helpImprove: "Помогите нам улучшить приложение",
    colorMode: "Цветовой режим", theme: "Тема", light: "Светлая", dark: "Тёмная", auto: "Авто"
};

ru.prayer = {
    title: "Время намаза", fajr: "Фаджр", sunrise: "Восход", dhuhr: "Зухр", asr: "Аср",
    maghrib: "Магриб", isha: "Иша", nextPrayer: "СЛЕДУЮЩИЙ НАМАЗ", timeRemaining: "Оставшееся время",
    prayerCalendar: "Календарь намаза", prayerStats: "Статистика намаза", progress: "Прогресс",
    hijriCalendar: "Хиджра календарь", calculationMethod: "Метод расчёта",
    prayed: "Совершён", missed: "Пропущен", late: "Опоздал", onTime: "Вовремя",
    notLogged: "Не записано", logPrayer: "Записать намаз", currentStreak: "Текущая серия",
    days: "ДНЕЙ", day: "ДЕНЬ", today: "Сегодня", yesterday: "Вчера",
    location: "Местоположение", setLocation: "Установить местоположение",
    tapToSetLocation: "Нажмите, чтобы установить ваше местоположение для точного времени намаза",
    noLocation: "Местоположение не установлено", checkingPermission: "Проверка разрешения...",
    locationRequired: "Требуется доступ к местоположению",
    locationExplanation: "Нам нужно ваше местоположение для расчёта точного времени намаза.",
    browserLocationHint: "Пожалуйста, включите местоположение в настройках браузера.",
    enableLocation: "Включить местоположение", openSettings: "Открыть настройки",
    loadingPrayerTimes: "Загрузка времени намаза...", failedToLoad: "Не удалось загрузить время намаза",
    hours: "ЧАСОВ", minutes: "МИНУТ", seconds: "СЕКУНД", min: "мин"
};

ru.qibla = {
    title: "Кибла", direction: "Направление", degrees: "градусов", compass: "Компас",
    distance: "Расстояние", toKaaba: "до Каабы", facingQibla: "Направление Кибла",
    turnLeft: "Поверните налево", turnRight: "Поверните направо",
    directionLocked: "Направление зафиксировано", tapToUnlock: "Нажмите для разблокировки",
    lockDirection: "Зафиксировать направление", compassNotAvailable: "Компас недоступен",
    compassNotAvailableWeb: "Компас недоступен в веб-версии. Используйте мобильное устройство.",
    calibrate: "Откалибруйте компас, перемещая телефон в форме восьмёрки",
    calibrateShort: "Перемещайте телефон восьмёркой для калибровки",
    heading: "КУРС", qiblaLabel: "КИБЛА", km: "КМ", mosques: "Мечети",
    gettingLocation: "Определение местоположения...", initializingCompass: "Инициализация компаса...",
    locationRequiredQibla: "Нам нужно ваше местоположение для расчёта направления Киблы."
};

ru.quran = {
    title: "Коран", surah: "Сура", juz: "Джуз", page: "Страница", verse: "Аят", verses: "Аяты",
    search: "Поиск", searchQuran: "Поиск в Коране", bookmark: "Закладка", bookmarks: "Закладки",
    bookmarked: "Добавлено", addNote: "Добавить заметку", notes: "Заметки",
    highlight: "Выделить", highlights: "Выделения", copy: "Копировать", share: "Поделиться",
    play: "Воспроизвести", pause: "Пауза", stop: "Стоп", continue: "Продолжить",
    tafsir: "Тафсир", translation: "Перевод", translations: "Переводы",
    transliteration: "Транслитерация", reciter: "Чтец", lastRead: "Последнее чтение",
    continueLast: "Продолжить с того места, где вы остановились",
    meccan: "Мекканская", medinan: "Мединская", save: "Сохранить", delete: "Удалить",
    cancel: "Отмена", savedVerses: "Сохранённые аяты", all: "Все", recent: "Недавние",
    tafsirTranslations: "Тафсир и переводы", download: "Скачать",
    downloaded: "Скачано", downloading: "Скачивание",
    readMode: "Режим чтения", mushafMode: "Режим мусхафа", surahReader: "Чтение сур",
    goToPage: "Перейти на страницу", goToSurah: "Перейти к суре", goToJuz: "Перейти к джузу",
    wordByWord: "Слово за словом", audio: "Аудио", settings: "Настройки"
};

ru.azkar = {
    title: "Азкар и дуа", morningAzkar: "Утренние азкар", eveningAzkar: "Вечерние азкар",
    afterPrayer: "После намаза", sleep: "Сон", wakeUp: "Пробуждение",
    dailyTip: "Совет дня", categories: "Категории", duas: "Дуа", guides: "Руководства",
    all: "Все", favorites: "Избранное", count: "Счёт", completed: "Завершено",
    repeat: "Повторить", times: "раз", time: "раз", remaining: "осталось",
    reset: "Сбросить", duaOfTheDay: "Дуа дня", dailyDhikr: "Ежедневный зикр",
    dhikrGoal: "Цель зикра", worship: "Поклонение и намаз", dailyLife: "Повседневная жизнь",
    travel: "Путешествие", food: "Еда и напитки", protection: "Защита", hadith: "Хадис",
    islamicGuides: "Исламские руководства", search: "Поиск азкар и дуа...",
    searchDuas: "Поиск дуа...", quranic: "Коранические", prophetic: "Пророческие",
    custom: "Свои", customDuas: "Свои дуа", addCustomDua: "Добавить своё дуа",
    noDuasYet: "Пока нет своих дуа", noFavorites: "Пока нет избранного",
    noResults: "Результаты не найдены", deleteConfirm: "Вы уверены, что хотите удалить это дуа?",
    tapToStart: "Нажмите для начала", target: "Цель", progress: "Прогресс",
    allCategories: "Все категории", deleteDua: "Удалить дуа",
    deleteDuaConfirm: "Вы уверены, что хотите удалить это дуа?", myDuas: "Мои дуа",
    result: "результат", results: "результатов", noDuasFound: "Дуа не найдены для",
    searchGuides: "Поиск руководств...", noGuidesFound: "Руководства не найдены для",
    back: "Назад",
    addPersonalSupplications: "Пока нет своих дуа.\nДобавьте ваши личные мольбы.",
    tapHeartTip: "Пока нет избранных дуа.\nНажмите на сердечко у любого дуа.",
    noQuranicDuas: "Нет коранических дуа", noPropheticDuas: "Нет пророческих дуа",
    adhkarCount: "азкар",
    dailyTips: en.azkar.dailyTips
};

ru.azkarDetail = { quran: "Коран", translit: "Транслит.", english: "Английский", counter: "Счётчик" };

ru.duaCollection = {
    title: "Дуа", searchPlaceholder: "Поиск дуа...", categories: "Категории",
    quranic: "Коранические", prophetic: "Пророческие", favorites: "Избранное",
    myDuas: "Мои дуа", deleteDua: "Удалить дуа",
    deleteConfirm: "Вы уверены, что хотите удалить это дуа?",
    deleteFailed: "Не удалось удалить дуа", duasCount: "дуа",
    noResultsFor: "Дуа не найдены для \"{{query}}\"", results: "результатов",
    result: "результат", forQuery: "для", noQuranic: "Нет коранических дуа",
    noProphetic: "Нет пророческих дуа",
    noFavorites: "Пока нет избранных дуа.\nНажмите на сердечко у любого дуа.",
    noCustom: "Пока нет своих дуа.\nДобавьте ваши личные мольбы.",
    addCustom: "Добавить своё дуа"
};

ru.progress = {
    title: "Прогресс", readingProgress: "Прогресс чтения", overallProgress: "Общий прогресс",
    complete: "Завершено", pagesRead: "Страниц прочитано", juzComplete: "Джузов завершено",
    khatm: "Хатм", todaysProgress: "Прогресс за сегодня", versesRead: "аятов прочитано",
    pagesReadToday: "страниц прочитано", readingStreak: "Серия чтения",
    currentStreak: "Текущая серия", longestStreak: "Лучшая серия", bestStreak: "Лучшая серия",
    thisWeek: "Эта неделя", average: "Среднее", pagesPerDay: "стр./день",
    dailyGoalSettings: "Настройки дневной цели", enableDailyGoal: "Включить дневную цель",
    goalType: "Тип цели", pages: "Страницы", verses: "Аяты", target: "Цель",
    saveGoal: "Сохранить цель", readingReminder: "Напоминание о чтении",
    enableReminder: "Включить напоминание", reminderTime: "Время напоминания",
    resetAllProgress: "Сбросить весь прогресс",
    resetConfirm: "Вы уверены, что хотите сбросить весь прогресс чтения? Это действие нельзя отменить.",
    resetButton: "Сбросить", noGoalSet: "Дневная цель не установлена",
    invalidGoal: "Неверная цель", invalidGoalMessage: "Пожалуйста, введите валидное число",
    goalRange: "цель должна быть между", and: "и",
    permissionRequired: "Требуется разрешение",
    permissionMessage: "Включите уведомления в настройках устройства для напоминаний о чтении.",
    errorSavingGoal: "Не удалось сохранить цель", errorResetting: "Не удалось сбросить прогресс",
    loadingProgress: "Загрузка прогресса...", done: "Готово", goal: "Цель",
    weeklyOverview: "Обзор за неделю", monthlyOverview: "Обзор за месяц",
    streak: "Серия", totalPrayers: "Всего намазов", completionRate: "Процент выполнения",
    prayerLog: "Журнал намазов", weekly: "Еженедельно", monthly: "Ежемесячно",
    allTime: "За всё время", exportStats: "Экспорт статистики", qadaTracker: "Трекер каза",
    qadaRemaining: "Каза осталось", taraweeh: "Таравих", charity: "Благотворительность",
    zakatCalculator: "Калькулятор закята", hifzProgress: "Прогресс хифза",
    quranSchedule: "Расписание Корана"
};

ru.notifications = {
    title: "Настройки уведомлений", prayerNotifications: "Уведомления о намазе",
    getNotified: "Получать уведомления о времени намаза",
    prayerAlarms: "Будильники намаза", azanSettings: "Настройки азана",
    azan: "Азан", azanSound: "Звук азана",
    playHayaAlSalat: "Воспроизводить \"Хайя аля Салят\" перед намазом",
    silentMode: "Беззвучный режим", flipToSilence: "Переверните для тишины",
    flipToSilenceDesc: "Переверните телефон экраном вниз, чтобы заглушить азан",
    testAzan: "Тест азана", vibration: "Вибрация", iqama: "Икама",
    iqamaReminder: "Напоминание об икаме", iqamaWait: "Ожидание икамы",
    iqamaDelay: "Задержка икамы", minutesAfterAzan: "минут после азана",
    minutes: "минут", enabled: "Включено", disabled: "Отключено",
    timeAdjustments: "Корректировка времени", adjustPrayerTimes: "Корректировка времени намаза (минуты)",
    calculationMethod: "Метод расчёта", highLatitude: "Правило высоких широт",
    asrCalculation: "Расчёт Асра", standard: "Стандартный", hanafi: "Ханафитский",
    prayerTracking: "Отслеживание намазов", enableTracking: "Включить отслеживание",
    trackDailyPrayers: "Отслеживайте ваши ежедневные намазы",
    missedPrayerReminder: "Напоминание о пропущенном намазе",
    reminderAfterPrayer: "Напоминать после окончания времени намаза",
    reminderDelay: "Задержка напоминания", minutesAfterPrayer: "минут после намаза",
    fasting: "Пост", suhoorReminder: "Напоминание о сухуре", iftarReminder: "Напоминание об ифтаре",
    beforeSuhoor: "минут до сухура", beforeIftar: "минут до ифтара",
    fastingReminders: "Напоминания о посте", enableFastingReminders: "Включить напоминания о посте",
    playAzanWhenPrayerTime: "Воспроизводить азан при наступлении времени намаза",
    selectPrayersForAzan: "Выберите намазы для звука азана",
    prayerSelection: "Выбор намазов", choosePrayersForIqama: "Выберите намазы для икамы",
    testIqama: "Тест икамы",
    testIqamaPlaying: "Звук икамы воспроизводится. Если не слышите, проверьте громкость.",
    timeAdjustmentsFineTune: "Тонкая настройка времени намаза (±30 мин)",
    min: "мин", autoDetectByLocation: "Авто-определение по местоположению",
    recommended: "Рекомендуется", active: "Активно", useAuto: "Авто",
    autoDetectedFor: "Авто-определено для"
};

ru.qadaTracker = {
    title: "Трекер каза", totalRemaining: "Всего оставшихся каза-намазов",
    hint: "Нажмите на число для редактирования. Используйте 'Записать' после совершения каза."
};

ru.location = {
    title: "Настройки местоположения", searchCity: "Поиск города...",
    currentLocation: "Текущее местоположение", useCurrentLocation: "Использовать текущее",
    manualEntry: "Ручной ввод", latitude: "Широта", longitude: "Долгота",
    save: "Сохранить", detectingLocation: "Определение местоположения...",
    locationSaved: "Местоположение сохранено", invalidCoordinates: "Неверные координаты",
    detecting: "Определение местоположения...", unavailable: "Местоположение недоступно",
    permissionRequired: "Требуется разрешение", manual: "Ручной",
    locationSource: "ИСТОЧНИК МЕСТОПОЛОЖЕНИЯ", useGPS: "Использовать GPS",
    setManually: "Установить вручную", searchWorldwide: "Поиск города по всему миру",
    recentLocations: "НЕДАВНИЕ МЕСТОПОЛОЖЕНИЯ",
    info: "Ваше местоположение используется для расчёта точного времени намаза и направления Киблы."
};

ru.qada = {
    title: "Трекер каза", totalRemaining: "Всего осталось", addMissed: "Добавить пропущенный",
    prayersMadeUp: "Возмещённые намазы", prayersRemaining: "Осталось",
    hint: "Долгое нажатие на число для вычитания",
    noQada: "Нет оставшихся каза-намазов. МашаАллах!",
    fajr: "Фаджр", dhuhr: "Зухр", asr: "Аср", maghrib: "Магриб", isha: "Иша", prayers: "намазов"
};

ru.zakat = {
    title: "Калькулятор закята", totalWealth: "Общее имущество", enterWealth: "Введите общее имущество",
    calculate: "Рассчитать", zakatDue: "Закят к выплате", nisab: "Нисаб",
    meetsNisab: "Достигает нисаба", doesNotMeetNisab: "Не достигает нисаба",
    goldNisab: "Нисаб золота", silverNisab: "Нисаб серебра",
    info: "Закят составляет 2,5% от общего имущества, которым владели в течение лунного года.",
    gold: "Золото", silver: "Серебро", cash: "Наличные и банковские счета",
    stocks: "Акции и инвестиции", property: "Арендная недвижимость",
    totalAssets: "Общие активы", zakatPayable: "Закят к оплате",
    reset: "Сбросить", currency: "Валюта"
};

ru.charity = {
    title: "Трекер благотворительности", totalDonated: "Всего пожертвовано",
    addDonation: "Добавить пожертвование", setGoal: "Установить цель", goal: "Цель",
    recentDonations: "Недавние пожертвования", noDonations: "Пока нет пожертвований",
    amount: "Сумма", type: "Тип", category: "Категория", date: "Дата",
    deleteConfirm: "Вы уверены, что хотите удалить это пожертвование?",
    enterAmount: "Введите сумму", selectCategory: "Выберите категорию",
    sadaqah: "Садака", zakatPayment: "Закят", waqf: "Вакф", other: "Другое",
    goalAmount: "Сумма цели", goalProgress: "Прогресс цели",
    to: "Кому", totalGiven: "Всего отдано", editGoal: "Изменить цель",
    zakatStatus: "Статус закята", paid: "Оплачено",
    notYetPaid: "Ещё не оплачен в этом году", breakdownByType: "Разбивка по типу"
};

ru.ramadan = {
    title: "Рамадан", daysRemaining: "Дней осталось",
    fastingToday: "Пост сегодня", taraweeh: "Таравих", logTaraweeh: "Записать таравих",
    suhoor: "Сухур", iftar: "Ифтар", fastingDays: "Дни поста",
    completed: "Завершено", remaining: "Осталось", ramadanMode: "Режим Рамадана",
    activateMessage: "Режим Рамадана автоматически активируется в благословенный месяц Рамадан.",
    checkBackMessage: "Вернитесь, когда начнётся Рамадан, для доступа к расписанию сухура/ифтара, плану чтения Корана и отслеживанию таравиха."
};

ru.hifz = {
    title: "Прогресс хифза", memorized: "Выучено", inProgress: "В процессе",
    notStarted: "Не начато", totalMemorized: "Всего выучено",
    markMemorized: "Отметить как выученное", markInProgress: "Отметить как в процессе",
    resetSurah: "Сбросить суру", versesMemorized: "Аятов выучено",
    dueToday: "На сегодня", revisedToday: "Повторено сегодня", dailyGoal: "Дневная цель",
    overallProgress: "Общий прогресс", verses: "Аяты", pages: "Страницы", juz: "Джуз",
    dueForRevision: "На повторение", last: "Последний", ease: "Лёгкость",
    moreVersesDue: "ещё аятов на повторение", statusLegend: "Обозначения статусов",
    notifications: "Уведомления", dailyReminders: "Ежедневные напоминания",
    reminderHint: "Получайте напоминания о повторении заученного",
    resetAllProgress: "Сбросить весь прогресс"
};

ru.storage = {
    title: "Хранилище и загрузки", totalUsed: "Всего использовано",
    audioFiles: "Аудиофайлы", clearAllDownloads: "Удалить все загрузки",
    clearConfirm: "Вы уверены, что хотите удалить все загруженные данные?",
    confirm: "Подтвердить", cancel: "Отмена", reciterAudio: "Аудио чтеца",
    mushafPages: "Страницы мусхафа", totalSize: "Общий размер",
    noDownloads: "Пока нет загрузок", loadingInfo: "Загрузка информации...",
    quickActions: "Быстрые действия", manageAudio: "Управление аудио",
    downloadQuran: "Скачать Коран", clearAll: "Удалить всё",
    freeUpSpace: "Освободить место", refreshInfo: "Обновить информацию"
};

fs.writeFileSync(path.join(localeDir, 'ru.json'), JSON.stringify(ru, null, 4), 'utf8');
console.log('✅ RU Part 1 done:', Object.keys(ru).length, 'sections');
