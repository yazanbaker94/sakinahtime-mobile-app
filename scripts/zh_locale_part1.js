// Chinese locale - Part 1: Core UI sections
const fs = require('fs');
const path = require('path');
const localeDir = path.join(__dirname, '../client/i18n/locales');
const en = JSON.parse(fs.readFileSync(path.join(localeDir, 'en.json'), 'utf8'));

const zh = {};

zh.tabs = { qibla: "朝向", prayer: "礼拜", quran: "古兰经", azkar: "祈念", settings: "设置" };

zh.settings = {
    title: "设置", appearance: "外观", customizeTheme: "自定义主题",
    language: "语言", chooseLanguage: "选择语言", prayerFasting: "礼拜与斋戒",
    notificationsAzanReminders: "通知、宣礼和提醒",
    storageDownloads: "存储和下载", manageOfflineContent: "管理离线内容",
    wordByWord: "逐词翻译", translationLanguage: "翻译语言",
    dhikrReminders: "赞念提醒", floatingOverlay: "浮动提醒",
    feedbackSuggestions: "反馈与建议", helpImprove: "帮助我们改进应用",
    colorMode: "颜色模式", theme: "主题", light: "浅色", dark: "深色", auto: "自动"
};

zh.prayer = {
    title: "礼拜时间", fajr: "晨礼", sunrise: "日出", dhuhr: "晌礼", asr: "晡礼",
    maghrib: "昏礼", isha: "宵礼", nextPrayer: "下一次礼拜", timeRemaining: "剩余时间",
    prayerCalendar: "礼拜日历", prayerStats: "礼拜统计", progress: "进度",
    hijriCalendar: "伊斯兰历", calculationMethod: "计算方法",
    prayed: "已礼拜", missed: "错过", late: "迟到", onTime: "准时",
    notLogged: "未记录", logPrayer: "记录礼拜", currentStreak: "当前连续",
    days: "天", day: "天", today: "今天", yesterday: "昨天",
    location: "位置", setLocation: "设置位置",
    tapToSetLocation: "点击设置位置以获取准确的礼拜时间",
    noLocation: "未设置位置", checkingPermission: "检查权限...",
    locationRequired: "需要位置访问权限",
    locationExplanation: "我们需要您的位置来计算准确的礼拜时间。",
    browserLocationHint: "请在浏览器设置中启用位置服务。",
    enableLocation: "启用位置", openSettings: "打开设置",
    loadingPrayerTimes: "加载礼拜时间...", failedToLoad: "加载失败",
    hours: "小时", minutes: "分钟", seconds: "秒", min: "分"
};

zh.qibla = {
    title: "朝向", direction: "方向", degrees: "度", compass: "指南针",
    distance: "距离", toKaaba: "到天房", facingQibla: "面向朝向",
    turnLeft: "向左转", turnRight: "向右转",
    directionLocked: "方向已锁定", tapToUnlock: "点击解锁",
    lockDirection: "锁定方向", compassNotAvailable: "指南针不可用",
    compassNotAvailableWeb: "网页版指南针不可用。请使用移动设备。",
    calibrate: "请以8字形移动手机来校准指南针",
    calibrateShort: "以8字形移动来校准",
    heading: "航向", qiblaLabel: "朝向", km: "公里", mosques: "清真寺",
    gettingLocation: "获取位置...", initializingCompass: "初始化指南针...",
    locationRequiredQibla: "我们需要您的位置来计算朝向方向。"
};

zh.quran = {
    title: "古兰经", surah: "章", juz: "卷", page: "页", verse: "节", verses: "节",
    search: "搜索", searchQuran: "搜索古兰经", bookmark: "书签", bookmarks: "书签",
    bookmarked: "已收藏", addNote: "添加笔记", notes: "笔记",
    highlight: "高亮", highlights: "高亮", copy: "复制", share: "分享",
    play: "播放", pause: "暂停", stop: "停止", continue: "继续",
    tafsir: "经注", translation: "翻译", translations: "翻译",
    transliteration: "音译", reciter: "诵读者", lastRead: "上次阅读",
    continueLast: "继续上次阅读",
    meccan: "麦加章", medinan: "麦地那章", save: "保存", delete: "删除",
    cancel: "取消", savedVerses: "保存的经文", all: "全部", recent: "最近",
    tafsirTranslations: "经注和翻译", download: "下载",
    downloaded: "已下载", downloading: "下载中",
    readMode: "阅读模式", mushafMode: "经本模式", surahReader: "章节阅读",
    goToPage: "跳转到页", goToSurah: "跳转到章", goToJuz: "跳转到卷",
    wordByWord: "逐词翻译", audio: "音频", settings: "设置"
};

zh.azkar = {
    title: "祈念与祈祷", morningAzkar: "晨间祈念", eveningAzkar: "晚间祈念",
    afterPrayer: "礼拜后", sleep: "睡前", wakeUp: "醒来",
    dailyTip: "每日提示", categories: "分类", duas: "祈祷", guides: "指南",
    all: "全部", favorites: "收藏", count: "计数", completed: "完成",
    repeat: "重复", times: "次", time: "次", remaining: "剩余",
    reset: "重置", duaOfTheDay: "今日祈祷", dailyDhikr: "每日赞念",
    dhikrGoal: "赞念目标", worship: "功修与礼拜", dailyLife: "日常生活",
    travel: "旅行", food: "饮食", protection: "保护", hadith: "圣训",
    islamicGuides: "伊斯兰指南", search: "搜索祈念和祈祷...",
    searchDuas: "搜索祈祷...", quranic: "古兰经", prophetic: "圣训",
    custom: "自定义", customDuas: "自定义祈祷", addCustomDua: "添加自定义祈祷",
    noDuasYet: "暂无自定义祈祷", noFavorites: "暂无收藏",
    noResults: "未找到结果", deleteConfirm: "确定要删除这条祈祷吗？",
    tapToStart: "点击开始", target: "目标", progress: "进度",
    allCategories: "所有分类", deleteDua: "删除祈祷",
    deleteDuaConfirm: "确定要删除吗？", myDuas: "我的祈祷",
    result: "条结果", results: "条结果", noDuasFound: "未找到",
    searchGuides: "搜索指南...", noGuidesFound: "未找到指南",
    back: "返回",
    addPersonalSupplications: "暂无自定义祈祷。\n添加您的个人祈祷词。",
    tapHeartTip: "暂无收藏。\n点击任意祈祷旁的心形图标。",
    noQuranicDuas: "无古兰经祈祷", noPropheticDuas: "无圣训祈祷",
    adhkarCount: "条祈念",
    dailyTips: en.azkar.dailyTips
};

zh.azkarDetail = { quran: "古兰经", translit: "音译", english: "英文", counter: "计数" };

zh.duaCollection = {
    title: "祈祷集", searchPlaceholder: "搜索祈祷...", categories: "分类",
    quranic: "古兰经", prophetic: "圣训", favorites: "收藏",
    myDuas: "我的祈祷", deleteDua: "删除祈祷",
    deleteConfirm: "确定要删除吗？", deleteFailed: "删除失败",
    duasCount: "条祈祷", noResultsFor: "未找到\"{{query}}\"的结果",
    results: "条结果", result: "条结果", forQuery: "关于",
    noQuranic: "无古兰经祈祷", noProphetic: "无圣训祈祷",
    noFavorites: "暂无收藏。\n点击心形图标添加。",
    noCustom: "暂无自定义祈祷。\n添加您的个人祈祷词。",
    addCustom: "添加自定义祈祷"
};

zh.progress = {
    title: "进度", readingProgress: "阅读进度", overallProgress: "总体进度",
    complete: "完成", pagesRead: "已读页数", juzComplete: "完成卷数",
    khatm: "通读", todaysProgress: "今日进度", versesRead: "已读经文",
    pagesReadToday: "今日已读页", readingStreak: "阅读连续",
    currentStreak: "当前连续", longestStreak: "最长连续", bestStreak: "最佳连续",
    thisWeek: "本周", average: "平均", pagesPerDay: "页/天",
    dailyGoalSettings: "每日目标设置", enableDailyGoal: "启用每日目标",
    goalType: "目标类型", pages: "页", verses: "节", target: "目标",
    saveGoal: "保存目标", readingReminder: "阅读提醒",
    enableReminder: "启用提醒", reminderTime: "提醒时间",
    resetAllProgress: "重置所有进度",
    resetConfirm: "确定要重置所有阅读进度吗？此操作不可撤销。",
    resetButton: "重置", noGoalSet: "未设置每日目标",
    invalidGoal: "无效目标", invalidGoalMessage: "请输入有效数字",
    goalRange: "目标应在", and: "到",
    permissionRequired: "需要权限", permissionMessage: "请在设备设置中开启通知权限。",
    errorSavingGoal: "保存失败", errorResetting: "重置失败",
    loadingProgress: "加载进度...", done: "完成", goal: "目标",
    weeklyOverview: "每周概览", monthlyOverview: "每月概览",
    streak: "连续", totalPrayers: "总礼拜数", completionRate: "完成率",
    prayerLog: "礼拜日志", weekly: "每周", monthly: "每月",
    allTime: "所有时间", exportStats: "导出统计", qadaTracker: "补拜追踪",
    qadaRemaining: "待补拜", taraweeh: "泰拉威赫", charity: "慈善",
    zakatCalculator: "天课计算器", hifzProgress: "背诵进度",
    quranSchedule: "古兰经计划"
};

zh.notifications = {
    title: "通知设置", prayerNotifications: "礼拜通知",
    getNotified: "礼拜时间到时获得通知",
    prayerAlarms: "礼拜闹钟", azanSettings: "宣礼设置",
    azan: "宣礼", azanSound: "宣礼声音",
    playHayaAlSalat: "礼拜前播放\"快来礼拜\"",
    silentMode: "静音模式", flipToSilence: "翻转静音",
    flipToSilenceDesc: "将手机翻转即可静音宣礼",
    testAzan: "测试宣礼", vibration: "振动", iqama: "成拜",
    iqamaReminder: "成拜提醒", iqamaWait: "成拜等待",
    iqamaDelay: "成拜延迟", minutesAfterAzan: "分钟后（宣礼后）",
    minutes: "分钟", enabled: "已启用", disabled: "已禁用",
    timeAdjustments: "时间调整", adjustPrayerTimes: "调整礼拜时间（分钟）",
    calculationMethod: "计算方法", highLatitude: "高纬度规则",
    asrCalculation: "晡礼计算", standard: "标准", hanafi: "哈纳菲",
    prayerTracking: "礼拜追踪", enableTracking: "启用追踪",
    trackDailyPrayers: "追踪您的每日礼拜",
    missedPrayerReminder: "错过礼拜提醒",
    reminderAfterPrayer: "礼拜时间结束后提醒",
    reminderDelay: "提醒延迟", minutesAfterPrayer: "分钟后（礼拜后）",
    fasting: "斋戒", suhoorReminder: "封斋饭提醒", iftarReminder: "开斋提醒",
    beforeSuhoor: "分钟前（封斋饭前）", beforeIftar: "分钟前（开斋前）",
    fastingReminders: "斋戒提醒", enableFastingReminders: "启用斋戒提醒",
    playAzanWhenPrayerTime: "礼拜时间到时播放宣礼",
    selectPrayersForAzan: "选择播放宣礼的礼拜",
    prayerSelection: "选择礼拜", choosePrayersForIqama: "选择成拜提醒的礼拜",
    testIqama: "测试成拜",
    testIqamaPlaying: "正在播放成拜声音。如未听到，请检查音量。",
    timeAdjustmentsFineTune: "微调礼拜时间（±30分钟）",
    min: "分", autoDetectByLocation: "按位置自动检测",
    recommended: "推荐", active: "活动", useAuto: "自动",
    autoDetectedFor: "已自动检测"
};

zh.qadaTracker = {
    title: "补拜追踪", totalRemaining: "总待补拜数",
    hint: "点击数字编辑。完成补拜后使用'记录'。"
};

zh.location = {
    title: "位置设置", searchCity: "搜索城市...",
    currentLocation: "当前位置", useCurrentLocation: "使用当前位置",
    manualEntry: "手动输入", latitude: "纬度", longitude: "经度",
    save: "保存", detectingLocation: "检测位置...",
    locationSaved: "位置已保存", invalidCoordinates: "无效坐标",
    detecting: "检测位置...", unavailable: "位置不可用",
    permissionRequired: "需要权限", manual: "手动",
    locationSource: "位置来源", useGPS: "使用GPS",
    setManually: "手动设置", searchWorldwide: "搜索全球城市",
    recentLocations: "最近位置",
    info: "您的位置用于计算准确的礼拜时间和朝向方向。"
};

zh.qada = {
    title: "补拜追踪", totalRemaining: "总剩余", addMissed: "添加错过",
    prayersMadeUp: "已补拜", prayersRemaining: "剩余",
    hint: "长按数字减少",
    noQada: "没有待补拜。马沙安拉！",
    fajr: "晨礼", dhuhr: "晌礼", asr: "晡礼", maghrib: "昏礼", isha: "宵礼", prayers: "拜"
};

zh.zakat = {
    title: "天课计算器", totalWealth: "总财产", enterWealth: "输入总财产",
    calculate: "计算", zakatDue: "应缴天课", nisab: "起征额",
    meetsNisab: "达到起征额", doesNotMeetNisab: "未达起征额",
    goldNisab: "黄金起征额", silverNisab: "白银起征额",
    info: "天课是总财产的2.5%，持有满一个伊斯兰历年。",
    gold: "黄金", silver: "白银", cash: "现金和银行存款",
    stocks: "股票和投资", property: "出租房产",
    totalAssets: "总资产", zakatPayable: "应缴天课",
    reset: "重置", currency: "货币"
};

zh.charity = {
    title: "慈善追踪", totalDonated: "总捐赠", addDonation: "添加捐赠",
    setGoal: "设定目标", goal: "目标", recentDonations: "最近捐赠",
    noDonations: "暂无捐赠", amount: "金额", type: "类型",
    category: "分类", date: "日期",
    deleteConfirm: "确定要删除这笔捐赠吗？",
    enterAmount: "输入金额", selectCategory: "选择分类",
    sadaqah: "自愿施舍", zakatPayment: "天课", waqf: "宗教基金", other: "其他",
    goalAmount: "目标金额", goalProgress: "目标进度",
    to: "给", totalGiven: "总计给出", editGoal: "编辑目标",
    zakatStatus: "天课状态", paid: "已缴",
    notYetPaid: "今年尚未缴纳", breakdownByType: "按类型分类"
};

zh.ramadan = {
    title: "斋月", daysRemaining: "剩余天数",
    fastingToday: "今日斋戒", taraweeh: "泰拉威赫", logTaraweeh: "记录泰拉威赫",
    suhoor: "封斋饭", iftar: "开斋", fastingDays: "斋戒天数",
    completed: "已完成", remaining: "剩余", ramadanMode: "斋月模式",
    activateMessage: "斋月模式将在斋月期间自动启用。",
    checkBackMessage: "斋月开始后请回来，获取封斋饭/开斋时间表、古兰经阅读计划和泰拉威赫追踪。"
};

zh.hifz = {
    title: "背诵进度", memorized: "已背", inProgress: "进行中",
    notStarted: "未开始", totalMemorized: "总已背",
    markMemorized: "标记为已背", markInProgress: "标记为进行中",
    resetSurah: "重置章", versesMemorized: "已背节数",
    dueToday: "今日任务", revisedToday: "今日复习", dailyGoal: "每日目标",
    overallProgress: "总进度", verses: "节", pages: "页", juz: "卷",
    dueForRevision: "待复习", last: "上次", ease: "难易度",
    moreVersesDue: "更多待复习节", statusLegend: "状态图例",
    notifications: "通知", dailyReminders: "每日提醒",
    reminderHint: "获取复习提醒", resetAllProgress: "重置所有进度"
};

zh.storage = {
    title: "存储和下载", totalUsed: "已使用",
    audioFiles: "音频文件", clearAllDownloads: "清除所有下载",
    clearConfirm: "确定要清除所有下载数据吗？",
    confirm: "确认", cancel: "取消", reciterAudio: "诵读者音频",
    mushafPages: "经本页面", totalSize: "总大小",
    noDownloads: "暂无下载", loadingInfo: "加载信息...",
    quickActions: "快捷操作", manageAudio: "管理音频",
    downloadQuran: "下载古兰经", clearAll: "全部清除",
    freeUpSpace: "释放空间", refreshInfo: "刷新信息"
};

fs.writeFileSync(path.join(localeDir, 'zh.json'), JSON.stringify(zh, null, 4), 'utf8');
console.log('✅ ZH Part 1 done:', Object.keys(zh).length, 'sections');
