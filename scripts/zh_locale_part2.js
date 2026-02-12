// Chinese locale - Part 2: Remaining UI sections
const fs = require('fs');
const path = require('path');
const localeDir = path.join(__dirname, '../client/i18n/locales');
const zh = JSON.parse(fs.readFileSync(path.join(localeDir, 'zh.json'), 'utf8'));

zh.onboarding = {
    welcome: "欢迎来到SakinahTime", welcomeDesc: "您的精神之旅伴侣",
    skip: "跳过", next: "下一步", getStarted: "开始", done: "完成",
    prayerTimesTitle: "精确礼拜时间", prayerTimesDesc: "根据您的位置获取精确的礼拜时间和优美的宣礼通知",
    quranTitle: "优美的古兰经体验", quranDesc: "阅读古兰经，配有多种翻译、逐词解析和音频诵读",
    azkarTitle: "每日祈念和祈祷", azkarDesc: "获取晨昏祈念、各种场合的祈祷和赞念计数",
    notificationsDesc: "通过可自定义的通知和宣礼提醒，不再错过礼拜",
    widgetDesc: "在主屏幕添加小组件以快速查看礼拜时间",
    welcomeTitle: "赛俩目", welcomeSubtitle: "欢迎来到SakinahTime",
    welcomeDescription: "您的礼拜时间、古兰经阅读和精神成长伴侣。",
    locationTitle: "精确礼拜时间", locationSubtitle: "位置访问",
    locationDescription: "我们使用您的位置来计算准确的礼拜时间。",
    notificationsTitle: "不错过礼拜", notificationsSubtitle: "通知提醒",
    notificationsDescription: "礼拜时间到时，以优美的宣礼声通知您。",
    widgetTitle: "添加小组件", widgetSubtitle: "可靠的宣礼",
    widgetDescription: "添加礼拜时间小组件，即使重启后也能可靠地播放宣礼通知。",
    doneTitle: "一切就绪！", doneSubtitle: "准备开始",
    doneDescription: "开始您更用心的精神修行之旅。",
    locationEnabled: "位置已启用", notificationsEnabled: "通知已启用",
    enable: "启用", continue: "继续", notNow: "暂不",
    enableExactAlarms: "启用精确闹钟",
    exactAlarmsDescription: "SakinahTime需要权限来设置精确的礼拜闹钟。\n\n请在下一个界面启用'闹钟和提醒'。",
    openSettings: "打开设置", enableReliableAzan: "启用可靠宣礼",
    reliableAzanDescription: "为确保重启后宣礼正常播放，请点击：\n\n电池→不受限制\n\n这允许应用为礼拜时间唤醒手机。"
};

zh.mosque = {
    title: "附近清真寺", findMosques: "查找清真寺", distance: "距离",
    directions: "导航", noMosques: "附近未找到清真寺",
    searchMosques: "搜索清真寺...", openInMaps: "在地图中打开"
};

zh.hijri = {
    title: "伊斯兰历", today: "今天",
    months: {
        "1": "穆哈兰姆", "2": "萨法尔", "3": "赖比尔·敖外鲁", "4": "赖比尔·阿希尔",
        "5": "主马达·乌拉", "6": "主马达·阿希拉", "7": "赖哲卜", "8": "舍尔邦",
        "9": "莱麦丹", "10": "闪瓦鲁", "11": "祖勒·嘎尔德", "12": "祖勒·希哲"
    }
};

zh.prayerStats = {
    title: "礼拜统计", overview: "概览", totalPrayed: "总已礼拜",
    totalMissed: "总错过", onTimeRate: "准时率",
    weeklyBreakdown: "每周统计", monthlyBreakdown: "每月统计",
    bestDay: "最佳日", prayerBreakdown: "礼拜分析",
    noData: "暂无数据。开始记录吧！",
    loadingStats: "加载统计...", prayerTracking: "礼拜追踪",
    tapToMark: "点击标记", enableToTrack: "启用追踪",
    tapToMarkStatus: "点击按钮标记状态：",
    prayed: "已礼拜", missed: "错过", late: "迟到",
    missedReminder: "错过提醒",
    remindAfter: "{{minutes}}分钟未标记后提醒",
    getReminded: "获取提醒", remindAfterLabel: "提醒延迟：",
    totalLogged: "总记录", qadaDue: "待补拜",
    weekly: "每周", monthly: "每月",
    exportFailed: "导出失败", exportError: "无法分享统计数据。"
};

zh.prayerCalendar = {
    title: "礼拜日历", monthlyView: "月视图", allPrayed: "全部完成",
    someMissed: "部分错过", notTracked: "未追踪", today: "今天",
    unableToLoad: "无法加载", selectMonthYear: "选择月份和年份",
    year: "年", month: "月"
};

zh.audioDownload = {
    title: "音频下载", downloadAll: "下载全部", deleteAll: "删除全部",
    downloading: "下载中...", downloaded: "已下载", notDownloaded: "未下载",
    surahAudio: "章节音频", offline: "离线",
    needInternet: "下载需要网络连接。",
    downloadAllSurahs: "下载所有章节", deleteAllAudio: "删除所有音频",
    download: "下载", delete: "删除", deleteAudio: "删除音频",
    cancelDownloads: "取消下载",
    cancelAllDesc: "取消所有下载？部分下载的章节将被删除。",
    keepDownloading: "继续下载", cancelAll: "全部取消",
    deleteConfirmMessage: "删除已下载的音频"
};

zh.reciter = {
    title: "选择诵读者", currentReciter: "当前诵读者",
    popular: "热门", allReciters: "所有诵读者"
};

zh.duaDetail = {
    reference: "来源", benefits: "益处", occasion: "场合",
    shareAsDua: "分享祈祷", notFound: "未找到祈祷",
    notFoundMessage: "找不到这条祈祷。", listenPronunciation: "听发音",
    viewInQuran: "在古兰经中查看", ayah: "经文", benefitsVirtues: "益处与美德"
};

zh.customDuaForm = {
    editDua: "编辑祈祷", addCustomDua: "添加自定义祈祷",
    saving: "保存中...", saveFailed: "保存失败。",
    deleteConfirm: "确定要删除吗？此操作不可撤销。",
    deleteFailed: "删除失败。", arabicText: "阿拉伯文",
    optional: "可选", transliteration: "音译",
    transliterationPlaceholder: "输入音译（如Allahumma...）",
    translationMeaning: "翻译/含义",
    translationPlaceholder: "输入含义或翻译",
    personalNotes: "个人笔记", notesPlaceholder: "添加笔记",
    deleteThisDua: "删除此祈祷"
};

zh.islamicGuide = { title: "伊斯兰指南", steps: "步骤", references: "参考" };

zh.dhikrOverlay = {
    title: "赞念悬浮窗设置", enableOverlay: "启用悬浮窗",
    overlayDesc: "显示浮动的赞念提醒", frequency: "频率",
    everyMinutes: "每{{count}}分钟", style: "样式", position: "位置"
};

zh.wordByWordSettings = {
    title: "逐词设置", translationLang: "翻译语言",
    showTransliteration: "显示音译", fontSize: "字体大小"
};

zh.quranSchedule = {
    title: "古兰经计划", createSchedule: "创建计划",
    completionDate: "目标完成日期", pagesPerDay: "每日页数",
    startDate: "开始日期", daysDone: "已完成天数", day: "天",
    pages: "页", completed: "已完成", pending: "待完成",
    openInMushaf: "在经本中打开", today: "今天", juz: "卷", surahs: "章节：",
    openMushaf: "打开经本", markComplete: "标记完成",
    completedAt: "完成于：", remaining: "剩余", complete: "完成",
    behindSchedule: "落后于计划"
};

zh.zakatCalculator = {
    title: "天课计算器", totalWealth: "总财产（美元）",
    enterWealth: "输入您的总财产", calculate: "计算天课",
    results: "计算结果", nisabGold: "起征额（黄金）", nisabSilver: "起征额（白银）",
    meetsNisab: "达到起征额", zakatDue: "应缴天课（2.5%）",
    info: "天课是超过起征额并持有一年的财产的2.5%。"
};

zh.hijriCalendar = {
    title: "伊斯兰日历", event: "事件", fasting: "斋戒", ah: "伊历",
    fastingProhibited: "今日禁止斋戒",
    eventIn: "{{name}}还有{{count}}天", eventIn_plural: "{{name}}还有{{count}}天"
};

zh.common = {
    loading: "加载中...", error: "错误", retry: "重试", ok: "确定",
    cancel: "取消", save: "保存", delete: "删除", edit: "编辑",
    close: "关闭", back: "返回", done: "完成", search: "搜索",
    share: "分享", copy: "复制", copied: "已复制！",
    noResults: "未找到结果", offline: "您已离线",
    yes: "是", no: "否", confirm: "确认", reset: "重置",
    add: "添加", remove: "移除", enable: "启用", disable: "禁用",
    on: "开", off: "关", yourRegion: "您的地区", goBack: "返回", skip: "跳过"
};

zh.components = {
    streakDays: "天连续", streakDaysPlural: "天连续",
    perfectDay: "完美的一天", offlineMode: "离线模式",
    usingCachedData: "使用缓存数据", lastSynced: "上次同步",
    somethingWentWrong: "出了点问题", tryAgain: "重试"
};

zh.streak = {
    prayerStreak: "礼拜连续", currentStreak: "当前连续",
    longestStreak: "最长连续", days: "天", day: "天",
    startToday: "今天开始您的连续！", greatStart: "好的开始！继续加油！",
    buildingMomentum: "势头正好！", amazingConsistency: "惊人的坚持！",
    incredibleDedication: "令人难以置信的虔诚！", trulyInspiring: "马沙安拉！真正的激励！"
};

zh.fasting = {
    fastingReminders: "斋戒提醒", getNotifiedFasting: "获取斋戒日通知",
    receiveReminders: "接收推荐斋戒日的提醒",
    reminderTime: "提醒时间", eveningBefore: "前一晚",
    beforeFajr: "晨礼前", thirtyMinBefore: "30分钟前",
    fastingDays: "斋戒日", monday: "周一", thursday: "周四",
    whiteDays: "白昼", ashura: "阿舒拉", dayOfArafah: "阿拉法日",
    shawwal: "闪瓦鲁", weeklySunnahFast: "每周圣行斋",
    whiteDaysDesc: "每月13、14、15日", ashuraDesc: "穆哈兰姆10日",
    arafahDesc: "祖勒希哲9日", shawwalDesc: "斋月后6天",
    notificationPermissionRequired: "⚠️ 需要通知权限"
};

zh.storageAlerts = {
    quranAudio: "古兰经音频", tafsir: "经注", prayerTimesCache: "礼拜时间缓存",
    otherCache: "其他缓存", allCachedData: "所有缓存数据",
    clearConfirm: "清除{{category}}？",
    clearAllDesc: "这将删除所有下载的音频和经注文件。您需要重新下载。",
    clearCategoryDesc: "这将移除所有{{category}}。",
    cancel: "取消", clear: "清除", error: "错误",
    failedToClear: "清除缓存失败。"
};

zh.mushaf = {
    notes: "笔记和高亮", bookmarks: "书签", highlights: "高亮",
    addNote: "添加笔记", save: "保存", delete: "删除",
    noNotesYet: "暂无笔记", tapToAddNote: "长按经文添加笔记",
    noBookmarksYet: "暂无书签", tapToBookmark: "点击经文添加书签",
    editNote: "编辑笔记", writeNoteHere: "在此写笔记...",
    hifzModeActivated: "背诵模式已激活",
    hifzModeDesc: "点击经文显示。长按查看学习选项。",
    wordByWordHighlighting: "逐词高亮",
    wordByWordDesc: "长按并拖动以在音频中导航。",
    justNow: "刚刚", minutesAgo: "{{count}}分钟前", hoursAgo: "{{count}}小时前",
    daysAgo: "{{count}}天前", noBookmarks: "暂无书签",
    noResults: "无结果", tryDifferent: "尝试其他搜索词",
    search: "搜索...", writeNote: "在此写笔记...",
    quarterHizb: "四分之一希兹布", halfHizb: "二分之一希兹布", fullJuzOnly: "仅完整卷",
    copyVerse: "复制经文", shareVerse: "分享经文",
    chooseHighlight: "选择高亮颜色", removeHighlight: "移除高亮",
    highlight: "高亮", selectReciter: "选择诵读者",
    audioSettings: "音频设置", noTafsir: "经注不可用",
    noTafsirVerse: "此经文暂无经注",
    recently: "最近", earlier: "更早", deleteFailed: "删除失败。",
    quran: "古兰经", surahs114: "114章", juz30: "30卷", recentCount: "最近",
    surahTab: "章", juzTab: "卷", recentTab: "最近",
    searchPlaceholder: "搜索...", includeTafsir: "搜索中包含经注",
    notesSection: "笔记", highlightsSection: "高亮",
    tafsirTranslation: "经注/翻译", nowPlaying: "正在播放",
    paused: "已暂停", verse: "节", repeat: "重复", loop: "循环",
    remaining: "剩余", surah: "章", noTafsirAvailable: "此经文暂无经注",
    noteInputPlaceholder: "在此写...", juzLabel: "卷", hizbLabel: "希兹布",
    searching: "搜索中...", resultsCount: "结果", recentlyViewed: "最近查看",
    allSurahs: "所有章节", recentlyViewedLabel: "最近查看",
    quartersLabel: "四分之一", halvesLabel: "二分之一",
    pagesYouVisit: "您访问的页面将出现在此",
    noRecentPages: "暂无最近页面", verses: "节", pageNumber: "页",
    loadingVerses: "加载经文...", bookmark: "书签",
    removeBookmark: "移除书签", tafsirAndTranslations: "经注和翻译",
    downloadedCount: "已下载", playUntil: "播放到",
    page: "页", juz: "卷", reciterLabel: "诵读者",
    play: "播放", playCount: "播放{{count}}次",
    setLoopStart: "设置循环起点", setLoopEnd: "设置循环终点",
    playLoop: "播放循环", tapToReveal: "点击显示",
    notStarted: "未开始", inProgress: "进行中", memorized: "已背",
    all: "全部", tapToMinimize: "点击最小化"
};

zh.mosqueFinder = {
    nearbyMosques: "附近清真寺", searchPlaceholder: "搜索清真寺...",
    radius1km: "1公里", radius5km: "5公里", radius10km: "10公里", radius25km: "25公里"
};

zh.calendar = {
    months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    weekdays: ["日", "一", "二", "三", "四", "五", "六"]
};

zh.themePicker = { colorMode: "颜色模式", theme: "主题", light: "浅色", dark: "深色", auto: "自动" };

zh.storageOverview = {
    storageUsed: "已用存储", manage: "管理",
    storageFull: "存储空间即将用完。", availableOnDevice: "设备可用空间"
};

zh.storageBreakdown = {
    title: "存储分析", quranAudio: "古兰经音频",
    tafsir: "经注", prayerTimes: "礼拜时间", otherCache: "其他缓存"
};

zh.storageSettings = {
    downloadSettings: "下载设置", storageLimit: "存储限制",
    maxSpace: "离线内容最大空间",
    wifiOnly: "仅Wi-Fi下载", wifiOnlyDesc: "节省移动数据",
    autoDelete: "自动删除旧缓存", autoDeleteDesc: "达到限制时自动删除旧数据"
};

zh.dhikrReminders = {
    title: "赞念提醒", floatingReminders: "浮动提醒",
    dhikrNotifications: "赞念通知",
    showOverlay: "在其他应用上方显示赞念悬浮窗",
    receiveNotifications: "接收定期赞念通知",
    grantPermission: "授予权限", previewOverlay: "预览悬浮窗",
    reminderInterval: "提醒间隔", dhikrCategories: "赞念分类",
    chooseTypes: "选择赞念类型", quietHours: "免打扰时段",
    pauseSleep: "睡眠时暂停提醒",
    startAt: "开始于", endAt: "结束于", autoDismiss: "自动关闭",
    overlayDisappears: "悬浮窗在此时间后消失",
    iosNotice: "浮动悬浮窗仅在安卓可用。iOS将使用标准通知。",
    noCategories: "请启用至少一个赞念分类",
    previewFailed: "无法显示预览。", noDhikr: "未找到所选分类的赞念内容",
    error: "错误", serviceFailed: "无法启动赞念提醒服务",
    interval30min: "30分钟", interval1hour: "1小时", interval2hours: "2小时",
    interval3hours: "3小时", interval4hours: "4小时",
    autoDismiss5s: "5秒", autoDismiss10s: "10秒", autoDismiss15s: "15秒",
    autoDismiss20s: "20秒", autoDismiss30s: "30秒",
    quiet9pm: "21:00", quiet10pm: "22:00", quiet11pm: "23:00", quiet12am: "0:00",
    wake5am: "5:00", wake6am: "6:00", wake7am: "7:00", wake8am: "8:00"
};

zh.quickAccess = { title: "快捷访问", morning: "早晨", evening: "晚上", prayer: "礼拜", sleep: "睡眠", wake: "醒来", general: "通用" };

zh.tasbih = {
    title: "泰斯比哈计数器", target: "目标",
    tapToCount: "点击计数 • 长按重置",
    targetReached: "目标已达成！", resetCounter: "重置计数",
    resetConfirm: "确定要将计数器重置为0吗？",
    cancel: "取消", reset: "重置"
};

zh.weeklyChart = {
    title: "本周", prayed: "已礼拜", missed: "错过", late: "迟到",
    noData: "无数据",
    sun: "日", mon: "一", tue: "二", wed: "三", thu: "四", fri: "五", sat: "六"
};

zh.citySearch = {
    selectCity: "选择城市", searchPlaceholder: "搜索全球城市...",
    recent: "最近", popularCities: "热门城市", noCities: "未找到城市",
    tryDifferent: "尝试不同的拼写",
    offline: "离线", offlineMessage: "当前离线。切换城市需要网络。",
    networkError: "网络错误。显示本地结果。"
};

zh.upcomingEvents = { title: "即将来临的事件", noEvents: "暂无即将来临的事件" };

zh.hifzControls = {
    title: "背诵控制", hideTab: "隐藏", repeatTab: "重复",
    loopTab: "循环", progressTab: "进度", hideMode: "隐藏模式",
    wordAudio: "词语音频", requiresInternet: "需要网络",
    playPronunciation: "显示时播放发音",
    quickActions: "快捷操作", revealAll: "全部显示", hideAll: "全部隐藏",
    autoHideDelay: "自动隐藏延迟", autoHideAfter: "显示后自动隐藏",
    markCurrentVerse: "标记当前经文", verse: "节",
    notStarted: "未开始", inProgress: "进行中", memorized: "已背",
    longPressToMark: "长按标记学习状态",
    bulkMarking: "批量标记", page: "页", juz: "卷", clear: "清除",
    clearPageMarkings: "清除页面标记", markEntirePage: "标记整页",
    clearJuzMarkings: "清除卷标记", markEntireJuz: "标记整卷",
    cancel: "取消", confirm: "确认"
};

zh.taraweeh = {
    title: "泰拉威赫追踪", ramadanCalendar: "斋月日历",
    locationBreakdown: "按地点分类", completionRate: "完成率",
    logNight: "记录夜间", edit: "编辑", night: "夜", nights: "夜",
    streak: "连续", best: "最佳", atMosque: "在清真寺", atHome: "在家"
};

zh.mosqueDetail = {
    title: "清真寺详情", openingHours: "营业时间", directions: "导航",
    call: "电话", website: "网站", rating: "评分", reviews: "评论",
    failedToLoad: "加载失败", tryAgain: "重试",
    openNow: "营业中", closed: "已关闭", address: "地址",
    contact: "联系方式", getDirections: "导航", away: "远"
};

zh.donation = {
    addTitle: "添加捐赠", type: "类型", amount: "金额",
    recipientOptional: "接收方（可选）", recipientPlaceholder: "组织或个人",
    notesOptional: "备注（可选）", notesPlaceholder: "添加备注...",
    addButton: "添加捐赠", sadaqah: "施舍", zakat: "天课",
    fidya: "罚赎", kaffarah: "罚金", other: "其他"
};

zh.setGoal = {
    title: "设定目标", goalAmount: "目标金额（美元）", setButton: "设定目标",
    infoText: "慈善目标帮助您跟踪斋月期间的进度。"
};

zh.logTaraweeh = {
    editTitle: "编辑", logTitle: "记录", night: "夜", rakaat: "拜",
    location: "地点", mosque: "清真寺", home: "家",
    notesOptional: "备注（可选）", notesPlaceholder: "添加备注...",
    delete: "删除", save: "保存"
};

zh.suhoorIftar = { suhoorReminder: "封斋饭提醒", iftarReminder: "开斋提醒" };
zh.ramadanCountdown = { daysLeft: "天剩余" };
zh.quranProgress = { title: "古兰经进度" };
zh.monthlyCalendar = { noData: "无数据" };

zh.savedLoops = {
    title: "已保存循环", enterName: "输入循环名称...",
    noName: "请输入名称", noRange: "请先设置范围",
    saveLoop: "保存当前循环", saveCurrent: "保存当前",
    delete: "删除", deleteLoop: "删除循环", deleteConfirm: "确定要删除吗",
    cancel: "取消", save: "保存", noLoops: "暂无保存的循环",
    error: "错误"
};

zh.surahDownload = { downloading: "下载中...", downloaded: "已下载", download: "下载", delete: "删除" };

fs.writeFileSync(path.join(localeDir, 'zh.json'), JSON.stringify(zh, null, 4), 'utf8');
console.log('✅ ZH Part 2 done:', Object.keys(zh).length, 'total sections');
