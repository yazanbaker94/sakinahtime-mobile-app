// Chinese locale - Part 3: Categories + Guide content
const fs = require('fs');
const path = require('path');
const localeDir = path.join(__dirname, '../client/i18n/locales');
const zh = JSON.parse(fs.readFileSync(path.join(localeDir, 'zh.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(localeDir, 'en.json'), 'utf8'));

zh.azkarCategories = {
    morning: "晨间祈念", evening: "晚间祈念", "after-prayer": "拜后祈念",
    sleep: "睡前祈念", waking: "醒来祈念", general: "通用祈念"
};

zh.duaCategories = {
    travel: "旅行", eating: "饮食", sleeping: "睡眠与觉醒",
    places: "进出", weather: "天气与自然", health: "健康与康复",
    protection: "保护", gratitude: "感恩", forgiveness: "宽恕",
    guidance: "引导", family: "家庭与子女", general: "通用"
};

zh.guideCategories = {
    worship: "功修与礼拜", purification: "净化", hajj: "朝觐与副朝",
    charity: "慈善与天课", fasting: "斋戒", funeral: "殡葬礼仪",
    character: "品德与礼仪", knowledge: "知识与灵性", finance: "伊斯兰金融"
};

const guideMeta = {
    "how-to-perform-salah": { title: "如何礼拜（萨拉特）", description: "按照先知传统进行五番拜的完整指南" },
    "how-to-perform-istikhara": { title: "如何做伊斯提哈拉", description: "在重要决定中寻求真主引导的指南" },
    "how-to-perform-tahajjud": { title: "如何礼夜间拜", description: "在夜晚最后三分之一礼夜间拜的指南" },
    "how-to-perform-eid-prayer": { title: "如何礼开斋节和宰牲节拜", description: "开斋节和宰牲节礼拜指南" },
    "morning-evening-adhkar": { title: "晨昏祈念", description: "重要的晨间和晚间记念" },
    "how-to-perform-wudu": { title: "如何做小净", description: "正确进行礼拜前净化的详细指南" },
    "how-to-perform-ghusl": { title: "如何做大净", description: "全身净化仪式的完整指南" },
    "how-to-perform-tayammum": { title: "如何做干净", description: "无水时进行干净的指南" },
    "how-to-perform-umrah": { title: "如何做副朝", description: "小朝觐的完整指南" },
    "how-to-perform-tawaf": { title: "如何做环游", description: "环绕天房的详细指南" },
    "how-to-calculate-zakat": { title: "如何计算和缴纳天课", description: "义务施舍的计算和缴纳指南" },
    "how-to-pay-zakat-al-fitr": { title: "如何缴纳开斋捐", description: "斋月末义务施舍的指南" },
    "how-to-give-sadaqah": { title: "如何施舍", description: "真诚行善的指南" },
    "how-to-fast-ramadan": { title: "如何在斋月斋戒", description: "义务斋戒的完整指南" },
    "how-to-fast-voluntarily": { title: "如何自愿斋戒", description: "推荐的自愿斋戒日指南" },
    "how-to-perform-janazah-prayer": { title: "如何礼殡礼拜", description: "丧葬祈祷的指南" },
    "how-to-offer-condolences": { title: "如何表达慰问", description: "安慰丧亲者的伊斯兰礼仪" },
    "how-to-control-anger": { title: "如何控制愤怒", description: "管理愤怒的伊斯兰指南" },
    "how-to-practice-humility": { title: "如何践行谦逊", description: "在伊斯兰中培养谦逊的指南" },
    "how-to-forgive-others": { title: "如何宽恕他人", description: "关于宽恕的伊斯兰教导" },
    "how-to-seek-knowledge": { title: "如何寻求知识", description: "正确寻求伊斯兰知识的指南" },
    "how-to-make-tawbah": { title: "如何做讨白（忏悔）", description: "真诚悔过的指南" },
    "understanding-riba": { title: "理解利息", description: "理解伊斯兰中利息的禁令" },
    "halal-income": { title: "清真收入", description: "伊斯兰中合法收入的准则" },
    "islamic-banking": { title: "伊斯兰银行基础", description: "理解符合伊斯兰教法的银行业务" },
    "halal-investing": { title: "清真投资指南", description: "如何按照伊斯兰教法进行投资" },
    "debt-management": { title: "伊斯兰债务管理", description: "按照伊斯兰原则管理债务" },
};

zh.guides = {};
for (const [id, enGuide] of Object.entries(en.guides)) {
    const meta = guideMeta[id] || { title: enGuide.title, description: enGuide.description };
    zh.guides[id] = { title: meta.title, description: meta.description, steps: {} };
}

zh.guides["how-to-perform-salah"].steps = {
    0: { title: "1. 举意（尼亚特）", content: "在心中为要礼的拜举意。举意是在心中的，不需要口头说出。" },
    1: { title: "2. 入拜大赞词", content: "将双手举到肩膀或耳朵的高度，说'安拉胡·阿克巴尔'。这标志着礼拜的开始。" },
    2: { title: "3. 开拜祈祷", content: "将右手放在左手上置于胸前，诵念：'赞美安拉，至纯至洁，赞颂安拉，你的尊名吉祥，你的权威崇高，除你之外再无神灵。'" },
    3: { title: "4. 诵读开端章", content: "诵念开端章（法谛哈）。这在每一拜中都是必须的。结束后轻声说'阿敏'。" },
    4: { title: "5. 诵读额外经文", content: "在前两拜中，开端章之后再诵读一段古兰经经文。" },
    5: { title: "6. 鞠躬（鲁库）", content: "说'安拉胡·阿克巴尔'并鞠躬，双手放在膝盖上。说三次'赞颂我伟大的主'。" },
    6: { title: "7. 从鞠躬起立", content: "直起身来，说'安拉听到了赞美他的人'。站立时说'我们的主，一切赞颂归于你'。" },
    7: { title: "8. 叩头（苏朱德）", content: "说'安拉胡·阿克巴尔'并叩头。说三次'赞颂我至高的主'。进行两次叩头。" },
    8: { title: "9. 坐念证词", content: "每两拜后坐下诵念证词。用右手食指指向前方。" },
    9: { title: "10. 出拜祝安", content: "将头转向右边说'愿安拉的平安和慈悯降于你们'，再转向左边重复。" }
};

zh.guides["how-to-perform-istikhara"].steps = {
    0: { title: "1. 确定问题", content: "有一个需要引导的具体事项。伊斯提哈拉用于你不确定最佳选择的合法事务。" },
    1: { title: "2. 礼两拜", content: "礼两拜副功拜。第一拜在开端章后诵念不信道者章，第二拜诵念忠诚章。" },
    2: { title: "3. 诵念伊斯提哈拉祈祷词", content: "拜后举起双手，诵念：'主啊！我凭你的知识向你求取选择，凭你的大能向你求取力量...'" },
    3: { title: "4. 说明你的事情", content: "当念到'关于这件事'时，说出你寻求引导的具体事项。" },
    4: { title: "5. 信赖安拉的计划", content: "祈祷后继续做决定。相信安拉会为你促成最好的结果。" }
};

zh.guides["how-to-perform-tahajjud"].steps = {
    0: { title: "1. 在夜晚最后三分之一醒来", content: "在夜晚最后三分之一醒来（大约在晨礼前1-2小时）。这是最吉祥的时刻。" },
    1: { title: "2. 做小净", content: "进行净化并在精神上和灵性上准备好站在安拉面前。" },
    2: { title: "3. 成对礼拜", content: "至少礼两拜，可以成对增加。先知（愿主福安之）礼十一拜。" },
    3: { title: "4. 诵读较长经文", content: "在诵读、鞠躬和叩头中从容不迫。比日常礼拜诵读更长的经文。" },
    4: { title: "5. 做祈祷", content: "拜后真诚地祈祷。这是安拉降临到最近的天际、应答祈祷的时刻。" },
    5: { title: "6. 以奇数拜结束", content: "以奇数拜（维特尔）结束夜间拜——通常是一拜或三拜。" }
};

zh.guides["how-to-perform-eid-prayer"].steps = {
    0: { title: "1. 准备过节", content: "沐浴，穿最好的衣服，使用香水。开斋节时先吃枣子。宰牲节时等拜后再吃。" },
    1: { title: "2. 前往礼拜场所", content: "早些去节日礼拜的场所。去和回走不同的路是圣行。" },
    2: { title: "3. 第一拜", content: "入拜大赞词后有七次额外的大赞词。每次举手。然后诵读开端章和一段经文。" },
    3: { title: "4. 第二拜", content: "从叩头起立后有五次额外的大赞词。然后诵读开端章和一段经文。" },
    4: { title: "5. 听演讲", content: "拜后伊玛目讲两段演讲。建议留下聆听。" },
    5: { title: "6. 互相祝贺", content: "以'节日快乐'或'愿安拉接受我们和你们的善功'问候穆斯林兄弟姐妹。" }
};

zh.guides["morning-evening-adhkar"].steps = {
    0: { title: "1. 宝座经", content: "诵念宝座经（古兰经2:255）。先知（愿主福安之）说，早晨诵念者将受到保护直到晚上。" },
    1: { title: "2. 黄牛章最后两节", content: "诵念黄牛章最后两节（2:285-286）。它们足以提供保护。" },
    2: { title: "3. 忠诚章、曙光章、人类章", content: "各诵念这三章三次。它们提供完全的保护。" },
    3: { title: "4. 赞主、赞美、大赞", content: "说'赞美安拉'（33次），'一切赞颂归于安拉'（33次），'安拉至大'（34次）。" },
    4: { title: "5. 求恕祷词", content: "诵念最尊贵的求恕词：'主啊！你是我的养主，除你之外再无神灵...'" },
    5: { title: "6. 保护祈祷", content: "说：'以安拉之名——天地间无物能伤害以他之名庇护者'（三次）。" }
};

zh.guides["how-to-perform-wudu"].steps = {
    0: { title: "1. 举意", content: "在心中举意做小净。说'以安拉之名'。" },
    1: { title: "2. 洗手", content: "将双手洗到手腕三次。" },
    2: { title: "3. 漱口", content: "漱口三次。" },
    3: { title: "4. 清洗鼻腔", content: "将水吸入鼻中三次并擤出。" },
    4: { title: "5. 洗脸", content: "从发际线到下巴洗整个脸三次。" },
    5: { title: "6. 洗臂", content: "先洗右臂到肘三次，再洗左臂。" },
    6: { title: "7. 抹头", content: "用湿手从前向后抹头一次。" },
    7: { title: "8. 抹耳", content: "用食指抹耳内，用拇指抹耳外。" },
    8: { title: "9. 洗脚", content: "先洗右脚到脚踝三次，再洗左脚。" },
    9: { title: "10. 诵念祈祷词", content: "说：'我作证，除安拉外再无神灵，他独一无偶；我又作证，穆罕默德是他的仆人和使者。'" }
};

zh.guides["how-to-perform-ghusl"].steps = {
    0: { title: "1. 举意", content: "举意从大不净中净化。说'以安拉之名'。" },
    1: { title: "2. 洗手", content: "将双手洗到手腕三次。" },
    2: { title: "3. 清洗私处", content: "彻底清洗私处。" },
    3: { title: "4. 做小净", content: "进行完整的小净，如同为礼拜做净化一样。" },
    4: { title: "5. 浇水于头", content: "将水浇在头上三次，确保水到达发根。" },
    5: { title: "6. 洗右侧", content: "将水浇遍身体右侧。" },
    6: { title: "7. 洗左侧", content: "将水浇遍身体左侧。" },
    7: { title: "8. 全身清洗", content: "确保水到达身体每个部位。" }
};

zh.guides["how-to-perform-tayammum"].steps = {
    0: { title: "1. 举意", content: "举意做干净以代替小净或大净。" },
    1: { title: "2. 念太斯米", content: "以'以安拉之名'开始。" },
    2: { title: "3. 拍打洁净土地", content: "将双手拍打洁净的土地、沙子或尘土一次。" },
    3: { title: "4. 抹脸", content: "用双掌抹整个脸一次。" },
    4: { title: "5. 抹手", content: "用左掌抹右手，再用右掌抹左手，到手腕。" },
    5: { title: "6. 完成", content: "您的干净已完成，可用于一次礼拜。每次礼拜需重做。" }
};

zh.guides["how-to-perform-umrah"].steps = {
    0: { title: "1. 入戒", content: "在米格特之前举意副朝，沐浴并穿上戒衣。念应召词：'主啊！我响应你的副朝召唤。'" },
    1: { title: "2. 进入禁寺", content: "以右脚进入，诵念进入清真寺的祈祷词。" },
    2: { title: "3. 环游", content: "从黑石处开始，逆时针绕天房七圈。" },
    3: { title: "4. 礼两拜", content: "环游后在伊卜拉欣站处或禁寺任何地方礼两拜。" },
    4: { title: "5. 饮渗渗泉水", content: "饮渗渗泉水并祈祷。" },
    5: { title: "6. 奔走", content: "在法和麦尔瓦之间奔走七次，从法开始。" },
    6: { title: "7. 剃发或剪发", content: "男子应剃头或剪短头发。女子剪去一指尖长度。这样便完成了副朝。" }
};

zh.guides["how-to-perform-tawaf"].steps = {
    0: { title: "1. 面向黑石", content: "面对黑石站立，天房在您的左侧。" },
    1: { title: "2. 举意", content: "在心中举意进行环游。" },
    2: { title: "3. 触摸或指向", content: "如果可能，触摸并亲吻黑石。否则指向它并说'以安拉之名，安拉至大'。" },
    3: { title: "4. 开始环绕", content: "逆时针绕天房行走，保持天房在您的左侧。" },
    4: { title: "5. 念赞词和祈祷", content: "环游没有特定的祈祷词。可以诵读古兰经、念赞词或做个人祈祷。" },
    5: { title: "6. 触摸也门角", content: "如果可能，用右手触摸也门角，但不要亲吻。" },
    6: { title: "7. 完成七圈", content: "完成七个完整的圈。每次经过黑石时指向它并说'安拉至大'。" },
    7: { title: "8. 礼两拜", content: "环游结束后在伊卜拉欣站处或其他地方礼两拜。" }
};

zh.guides["how-to-calculate-zakat"].steps = {
    0: { title: "1. 理解起征额", content: "起征额是缴纳天课的最低财产标准。相当于85克黄金或595克白银。" },
    1: { title: "2. 计算财产", content: "加总所有应缴天课的资产：现金、银行存款、黄金、白银、商品、股票和应收账款。" },
    2: { title: "3. 扣除债务", content: "扣除年内到期的所有债务。" },
    3: { title: "4. 与起征额比较", content: "如果您的净应缴天课财产超过起征额，则天课为义务。" },
    4: { title: "5. 计算2.5%", content: "将应缴天课财产乘以0.025（2.5%），即为您的天课金额。" },
    5: { title: "6. 交给有资格者", content: "将天课分配给古兰经9:60中提到的八类人：穷人、贫困者、管理者、心被团结者、释奴、负债者、为主道者和旅行者。" },
    6: { title: "7. 举意", content: "缴纳时举意这是您的义务天课。" }
};

zh.guides["how-to-pay-zakat-al-fitr"].steps = {
    0: { title: "1. 目的", content: "开斋捐净化斋戒者的闲言杂语，并在节日为贫困者提供食物。" },
    1: { title: "2. 谁必须缴纳", content: "每个拥有超过日常所需食物的穆斯林都必须为自己和家属缴纳。" },
    2: { title: "3. 金额", content: "一撒（约3公斤）主食（小麦、大麦、枣、葡萄干或大米）或其等值金额。" },
    3: { title: "4. 时间", content: "必须在节日礼拜前缴纳。最好在节日前1-2天。拜后则算迟到的施舍。" },
    4: { title: "5. 给予穷人", content: "直接交给社区的贫困穆斯林或通过可靠的组织。" }
};

zh.guides["how-to-give-sadaqah"].steps = {
    0: { title: "1. 净化意图", content: "施舍纯粹是为了取悦安拉，不为获得赞誉。" },
    1: { title: "2. 从合法财产中给予", content: "确保施舍来自合法收入。安拉只接受纯洁的。" },
    2: { title: "3. 尽量秘密行善", content: "先知（愿主福安之）说最好的施舍是秘密的。但公开行善可以激励他人。" },
    3: { title: "4. 定期行善", content: "即使少量的定期施舍也比偶尔的大额更好。安拉最喜爱持续的善行。" },
    4: { title: "5. 不要提醒", content: "不要提醒受施者你的善行，也不要伤害他们。这会使回报无效。" },
    5: { title: "6. 微笑也是施舍", content: "施舍不仅是金钱。微笑、帮助他人、清除道路上的障碍——都是施舍。" }
};

zh.guides["how-to-fast-ramadan"].steps = {
    0: { title: "1. 夜间举意", content: "在晨礼前举意。先知（愿主福安之）说：'未在晨礼前举意者，其斋戒不成立。'" },
    1: { title: "2. 吃封斋饭", content: "吃黎明前的餐食。先知（愿主福安之）说：'吃封斋饭，因为其中有吉庆。'在晨礼前停止进食。" },
    2: { title: "3. 戒绝饮食和亲密关系", content: "从晨礼到昏礼戒绝饮食、吸烟和夫妻之事。" },
    3: { title: "4. 守护口舌", content: "避免谎言、背谈、争吵和粗鲁的语言。" },
    4: { title: "5. 增加善功", content: "增加礼拜、诵读古兰经、赞念和慈善。斋月是古兰经和慷慨的月份。" },
    5: { title: "6. 昏礼时开斋", content: "昏礼时立即开斋。先知（愿主福安之）以枣子和水开斋。" },
    6: { title: "7. 开斋时祈祷", content: "斋戒者的祈祷会被应答。说：'主啊！我为你而斋戒，以你的供给而开斋。'" }
};

zh.guides["how-to-fast-voluntarily"].steps = {
    0: { title: "1. 周一和周四", content: "先知（愿主福安之）在周一和周四斋戒。他说善功在这两天被呈现给安拉。" },
    1: { title: "2. 每月三天", content: "在每个伊斯兰历月的13、14、15日（白昼）斋戒。这等同于全年斋戒。" },
    2: { title: "3. 阿拉法日", content: "在祖勒希哲9日斋戒（非朝觐者）。先知（愿主福安之）说它赎去前一年和后一年的罪过。" },
    3: { title: "4. 阿舒拉日", content: "在穆哈兰姆10日连同9日或11日斋戒。赎去前一年的罪过。" },
    4: { title: "5. 闪瓦鲁的六天", content: "斋月后在闪瓦鲁月斋戒六天。先知（愿主福安之）说这等同于全年斋戒。" },
    5: { title: "6. 举意", content: "自愿斋戒可以在白天举意，只要你还没有吃过东西。" }
};

zh.guides["how-to-perform-janazah-prayer"].steps = {
    0: { title: "1. 站成排", content: "在伊玛目后站成排。亡者放在前面。" },
    1: { title: "2. 第一次大赞", content: "举手说'安拉至大'，然后默念开端章。" },
    2: { title: "3. 第二次大赞", content: "说'安拉至大'，为先知诵念祝福词。" },
    3: { title: "4. 第三次大赞", content: "说'安拉至大'，为亡者祈祷：'主啊！请你宽恕他并慈悯他...'" },
    4: { title: "5. 第四次大赞", content: "说'安拉至大'，为自己和所有穆斯林做简短的祈祷。" },
    5: { title: "6. 出拜祝安", content: "将头转向右边说'愿安拉的平安降于你们'，再转向左边重复。" }
};

zh.guides["how-to-offer-condolences"].steps = {
    0: { title: "1. 尽快探望", content: "得知消息后尽快探望家属，但尊重他们的隐私需求。" },
    1: { title: "2. 说正确的话", content: "说：'我们属于安拉，我们终将回归于他。'提醒他们安拉会回报忍耐者。" },
    2: { title: "3. 祈祷", content: "为亡者和家属祈祷。" },
    3: { title: "4. 提供实际帮助", content: "提供具体帮助如准备饭菜、购物或协助安排事务。" },
    4: { title: "5. 不要久留", content: "除非家属要求，否则简短停留。" },
    5: { title: "6. 避免过度哭号", content: "保持镇定，避免大声哭号——这在伊斯兰中是不可取的。" }
};

zh.guides["how-to-control-anger"].steps = {
    0: { title: "1. 向安拉求庇", content: "感到愤怒时说：'我求安拉庇护，免遭被驱逐的恶魔的侵扰。'" },
    1: { title: "2. 沉默", content: "先知（愿主福安之）说：'当你们生气时，应当沉默。'沉默可以防止说出令你后悔的话。" },
    2: { title: "3. 改变姿势", content: "如果站着就坐下。如果坐着就躺下。这是先知（愿主福安之）的教导。" },
    3: { title: "4. 做小净", content: "用冷水做净化。先知（愿主福安之）说愤怒来自恶魔，恶魔由火创造。" },
    4: { title: "5. 想想安拉的宽恕", content: "想想安拉如何不顾你的错误而宽恕你。这应该使你更宽容。" },
    5: { title: "6. 想想后果", content: "想想愤怒行事的后果：破碎的关系、后悔的话语和失去的尊重。" }
};

zh.guides["how-to-practice-humility"].steps = {
    0: { title: "1. 记住起源", content: "记住你是从泥土中创造的，终将回归泥土。" },
    1: { title: "2. 承认安拉的恩赐", content: "认识到你所有的福分、才能和成就都是安拉的恩赐。" },
    2: { title: "3. 服务他人", content: "先知（愿主福安之）服务家人并做家务，尽管他是穆斯林的领袖。" },
    3: { title: "4. 避免炫耀", content: "不要炫耀财富、知识或成就。先知（愿主福安之）说：'心中有一粒原子般傲慢的人不会进入天堂。'" },
    4: { title: "5. 接受建议", content: "无论对方身份如何，都要开放接受批评和建议。" },
    5: { title: "6. 平等对待所有人", content: "对穷人、老人和弱势群体表示尊重。" }
};

zh.guides["how-to-forgive-others"].steps = {
    0: { title: "1. 记住安拉的宽恕", content: "安拉宽恕了你无数的罪过。古兰经说：'难道你们不希望安拉宽恕你们吗？'（24:22）" },
    1: { title: "2. 理解回报", content: "先知（愿主福安之）说：'施舍不会减少财富，安拉会增加宽恕者的荣耀。'" },
    2: { title: "3. 设身处地", content: "试着理解那个人为什么对你不公。" },
    3: { title: "4. 为他们祈祷", content: "为曾经不公对待你的人祈祷。这会软化你的心。" },
    4: { title: "5. 放下怨恨", content: "怨恨只会伤害你自己。先知（愿主福安之）说：'不要互相仇恨，不要互相嫉妒，你们应当成为兄弟。'" },
    5: { title: "6. 尽可能和解", content: "如果合适的话，主动走出和解的第一步。" }
};

zh.guides["how-to-seek-knowledge"].steps = {
    0: { title: "1. 净化意图", content: "为了安拉而寻求知识，不为世俗利益。先知（愿主福安之）警告不要为了炫耀而追求知识。" },
    1: { title: "2. 从基础开始", content: "从基本知识开始：正确的信仰、如何礼拜、基本的伊斯兰规则和古兰经诵读。" },
    2: { title: "3. 找到合格的老师", content: "向有能力的、可信的学者学习，他们遵循古兰经和圣行。" },
    3: { title: "4. 保持坚持", content: "定期学习，哪怕每天只学一点点。安拉最喜爱的善行是持续的。" },
    4: { title: "5. 实践所学", content: "将知识应用到生活中。没有行动的知识就像没有果实的树。" },
    5: { title: "6. 教导他人", content: "分享有益的知识。先知（愿主福安之）说：'你们中最优秀的是学习古兰经并教授它的人。'" }
};

zh.guides["how-to-make-tawbah"].steps = {
    0: { title: "1. 立即停止犯罪", content: "第一步是立即停止犯罪。不能一边忏悔一边继续犯罪。" },
    1: { title: "2. 真心悔恨", content: "对违抗安拉感到真心的悔恨。先知（愿主福安之）说：'悔恨就是忏悔。'" },
    2: { title: "3. 向安拉求饶", content: "向安拉求饶。说'我求安拉宽恕'并真诚祈祷。" },
    3: { title: "4. 下定决心", content: "坚定地决心不再重犯。这种决心对有效的忏悔至关重要。" },
    4: { title: "5. 必要时补偿", content: "如果你的罪行伤害了他人，请求他们的宽恕并弥补。" },
    5: { title: "6. 以善代恶", content: "用善行取代罪行。安拉说：'善行必能消除恶行'（古兰经11:114）。" },
    6: { title: "7. 永不绝望", content: "无论罪行多么严重，永不对安拉的慈悯绝望。他说：'你们不要绝望于安拉的慈悯'（古兰经39:53）。" }
};

zh.guides["understanding-riba"].steps = {
    0: { title: "1. 什么是利息？", content: "'利息'意为'增加'或'多余'。在伊斯兰金融中，它指借贷中任何有保证的利息。" },
    1: { title: "2. 为什么被禁止？", content: "安拉说：'安拉允许贸易而禁止利息'（古兰经2:275）。利息剥削有需要的人。" },
    2: { title: "3. 利息的种类", content: "延期利息：贷款利息。同类利息：相同商品不等量交换。" },
    3: { title: "4. 罪行的严重性", content: "先知（愿主福安之）说利息有73种。给予者和接受者都受到诅咒。" },
    4: { title: "5. 替代方案", content: "使用伊斯兰银行、利润分享协议或无息贷款。" }
};

zh.guides["halal-income"].steps = {
    0: { title: "1. 重要性", content: "先知（愿主福安之）说：'没有人吃过比自己双手劳作所得更好的食物。'" },
    1: { title: "2. 禁止的行业", content: "避免来自以下行业的收入：酒精、赌博、猪肉、传统银行、成人娱乐和一切有害之物。" },
    2: { title: "3. 诚实经营", content: "诚实经商。先知（愿主福安之）说：'诚实的商人将与先知和殉道者同在。'" },
    3: { title: "4. 公平定价", content: "不要剥削顾客，不要囤货哄抬价格。" },
    4: { title: "5. 遵守合同", content: "履行所有协议和合同。安拉说：'你们要履行合约'（古兰经5:1）。" },
    5: { title: "6. 及时付工资", content: "先知（愿主福安之）说：'在工人的汗水干之前付给他工资。'" }
};

zh.guides["islamic-banking"].steps = {
    0: { title: "1. 基本原则", content: "伊斯兰银行禁止利息、过度不确定性和赌博。利润必须来自实际经济活动。" },
    1: { title: "2. 成本加成", content: "银行购买资产并以声明的利润率卖给你。你分期付款。" },
    2: { title: "3. 利润分享", content: "你提供资本，银行管理。利润按约定比例分配。" },
    3: { title: "4. 合伙经营", content: "双方都出资，按投资比例分享利润和亏损。" },
    4: { title: "5. 租赁", content: "银行购买资产并租给你。期满后你可以购买。" },
    5: { title: "6. 选择银行", content: "选择有伊斯兰教法监督委员会的银行。验证产品是否真正合规。" }
};

zh.guides["halal-investing"].steps = {
    0: { title: "1. 过滤禁止行业", content: "避免投资于：酒精、烟草、赌博、传统银行/保险、猪肉、武器。" },
    1: { title: "2. 财务指标", content: "许多学者要求：负债率低于33%，利息收入低于营收的5%。" },
    2: { title: "3. 利润净化", content: "如果公司少部分收入来自不合规来源，将该比例捐出。" },
    3: { title: "4. 伊斯兰基金", content: "考虑经伊斯兰学者审核的符合教法的投资基金和ETF。" },
    4: { title: "5. 房地产", content: "房地产投资基本上是清真的。避免传统抵押贷款；使用伊斯兰房地产融资。" },
    5: { title: "6. 咨询学者", content: "有疑问时咨询合格的学者或使用伊斯兰金融筛选服务。" }
};

zh.guides["debt-management"].steps = {
    0: { title: "1. 避免不必要的债务", content: "先知（愿主福安之）祈求免于债务。只在真正需要时借贷，并有明确的还款计划。" },
    1: { title: "2. 记录所有债务", content: "安拉命令：'当你们借贷时，应当记录'（古兰经2:282）。" },
    2: { title: "3. 有还款意图", content: "先知（愿主福安之）说：'谁借人财物并有意偿还，安拉会帮助他。'" },
    3: { title: "4. 尽快偿还", content: "有能力时不要拖延还款。先知（愿主福安之）说：'富人拖延还债是不义。'" },
    4: { title: "5. 作为债权人要宽容", content: "如果债务人有困难，给予宽限。安拉说：'给予宽限直到他宽裕'（古兰经2:280）。" },
    5: { title: "6. 可能的话免除", content: "免除债务有很大的回报。安拉说：'如果你们施舍，对你们是更好的'（古兰经2:280）。" }
};

fs.writeFileSync(path.join(localeDir, 'zh.json'), JSON.stringify(zh, null, 4), 'utf8');
console.log('✅ ZH Part 3 done: categories + all', Object.keys(zh.guides).length, 'guides. Total sections:', Object.keys(zh).length);
