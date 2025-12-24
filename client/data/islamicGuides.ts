export interface GuideStep {
  title: string;
  titleAr?: string;
  content: string;
  contentAr?: string;
}

export interface IslamicGuide {
  id: string;
  title: string;
  titleAr: string;
  category: string;
  description: string;
  descriptionAr: string;
  steps: GuideStep[];
  references?: string[];
}

// Part 1: Worship & Prayer + Purification
const worshipGuides: IslamicGuide[] = [
  {
    id: "how-to-perform-salah",
    title: "How to Perform Salah (Prayer)",
    titleAr: "كيفية أداء الصلاة",
    category: "worship",
    description: "Comprehensive guide for performing the five daily prayers according to the Prophetic tradition",
    descriptionAr: "دليل شامل لأداء الصلوات الخمس وفقاً للسنة النبوية",
    steps: [
      { title: "1. Make Intention", content: "Make the intention in your heart for which prayer you are performing. The intention is in the heart and does not need to be spoken aloud." },
      { title: "2. Takbir (Opening)", content: "Raise your hands to shoulder or ear level and say 'Allahu Akbar'. This marks the beginning of the prayer." },
      { title: "3. Recite Opening Supplication", content: "Place your right hand over your left on your chest and recite: 'Subhanaka Allahumma wa bihamdika, wa tabarakasmuka, wa ta'ala jadduka, wa la ilaha ghayruk'." },
      { title: "4. Recite Al-Fatiha", content: "Recite Surah Al-Fatiha. This is obligatory in every rak'ah. After finishing, say 'Ameen' quietly." },
      { title: "5. Recite Additional Surah", content: "In the first two rak'ahs, recite another surah or verses from the Quran after Al-Fatiha." },
      { title: "6. Perform Ruku (Bowing)", content: "Say 'Allahu Akbar' and bow down, placing your hands on your knees. Say 'Subhana Rabbiyal Adheem' three times." },
      { title: "7. Stand Up from Ruku", content: "Rise from bowing while saying 'Sami'Allahu liman hamidah'. When standing, say 'Rabbana wa lakal hamd'." },
      { title: "8. Perform Sujud", content: "Say 'Allahu Akbar' and prostrate. Say 'Subhana Rabbiyal A'la' three times. Perform two prostrations." },
      { title: "9. Sit for Tashahhud", content: "After every two rak'ahs, sit and recite the Tashahhud. Point your right index finger while reciting." },
      { title: "10. Give Tasleem", content: "Turn your head to the right and say 'As-salamu alaykum wa rahmatullah', then turn left and repeat." },
    ],
    references: ["Sahih al-Bukhari 757", "Sahih Muslim 397"],
  },
  {
    id: "how-to-perform-istikhara",
    title: "How to Perform Istikhara Prayer",
    titleAr: "كيفية صلاة الاستخارة",
    category: "worship",
    description: "Guide for seeking Allah's guidance in making important decisions",
    descriptionAr: "دليل لطلب هداية الله في اتخاذ القرارات المهمة",
    steps: [
      { title: "1. Identify Your Decision", content: "Have a specific matter in mind that you need guidance on. Istikhara is for permissible matters where you're unsure which option is better." },
      { title: "2. Perform Two Rak'ahs", content: "Pray two rak'ahs of voluntary prayer. In the first rak'ah after Al-Fatiha, recite Surah Al-Kafirun. In the second, recite Surah Al-Ikhlas." },
      { title: "3. Recite the Istikhara Dua", content: "After completing the prayer, raise your hands and recite: 'Allahumma inni astakhiruka bi'ilmika, wa astaqdiruka bi-qudratika...' (O Allah, I seek Your guidance by Your knowledge...)." },
      { title: "4. Mention Your Matter", content: "When you reach the part 'fee haadhal amr' (in this matter of mine), specify what you're seeking guidance about." },
      { title: "5. Trust Allah's Plan", content: "After making the dua, proceed with your decision. Trust that Allah will make the better option easier for you and put barriers in the way of what's not good for you." },
    ],
    references: ["Sahih al-Bukhari 1162"],
  },
  {
    id: "how-to-perform-tahajjud",
    title: "How to Perform Tahajjud Prayer",
    titleAr: "كيفية صلاة التهجد",
    category: "worship",
    description: "Guide for performing the night prayer in the last third of the night",
    descriptionAr: "دليل لأداء صلاة الليل في الثلث الأخير من الليل",
    steps: [
      { title: "1. Wake Up in Last Third", content: "Wake up in the last third of the night (approximately 1-2 hours before Fajr). This is the most blessed time for Tahajjud." },
      { title: "2. Make Wudu", content: "Perform ablution and prepare yourself mentally and spiritually for standing before Allah." },
      { title: "3. Pray in Pairs", content: "Pray at least 2 rak'ahs, but you can pray more in pairs (2, 4, 6, 8, etc.). The Prophet (ﷺ) would pray 11 rak'ahs." },
      { title: "4. Recite Long Portions", content: "Take your time in recitation, ruku, and sujud. Recite longer portions of the Quran than you would in regular prayers." },
      { title: "5. Make Dua", content: "After completing your prayer, make sincere dua. This is a time when Allah descends to the lowest heaven and answers prayers." },
      { title: "6. End with Witr", content: "Conclude your night prayer with Witr (odd number of rak'ahs, typically 1 or 3)." },
    ],
    references: ["Sahih al-Bukhari 1147", "Sahih Muslim 758"],
  },
  {
    id: "how-to-perform-eid-prayer",
    title: "How to Perform Eid Prayer",
    titleAr: "كيفية صلاة العيد",
    category: "worship",
    description: "Guide for performing Eid al-Fitr and Eid al-Adha prayers",
    descriptionAr: "دليل لأداء صلاة عيد الفطر وعيد الأضحى",
    steps: [
      { title: "1. Prepare for Eid", content: "Take a bath, wear your best clothes, and apply perfume. For Eid al-Fitr, eat dates before going. For Eid al-Adha, wait until after the prayer." },
      { title: "2. Go to Prayer Ground", content: "Go to the Eid prayer ground early. It's Sunnah to take one route to the prayer and return by a different route." },
      { title: "3. First Rak'ah", content: "After the opening Takbir, there are 7 additional Takbirs. Raise your hands with each Takbir. Then recite Al-Fatiha and another Surah (commonly Al-A'la)." },
      { title: "4. Second Rak'ah", content: "After standing from prostration, there are 5 additional Takbirs. Then recite Al-Fatiha and another Surah (commonly Al-Ghashiyah)." },
      { title: "5. Listen to Khutbah", content: "After the prayer, the Imam delivers two khutbahs. It's recommended to stay and listen, though not obligatory." },
      { title: "6. Exchange Greetings", content: "Greet fellow Muslims with 'Eid Mubarak' or 'Taqabbal Allahu minna wa minkum' (May Allah accept from us and from you)." },
    ],
    references: ["Sahih al-Bukhari 956", "Sunan Abu Dawud 1149"],
  },
  {
    id: "morning-evening-adhkar",
    title: "Morning and Evening Adhkar",
    titleAr: "أذكار الصباح والمساء",
    category: "worship",
    description: "Essential remembrances to recite in the morning and evening",
    descriptionAr: "الأذكار الأساسية التي تُقرأ في الصباح والمساء",
    steps: [
      { title: "1. Ayat al-Kursi", content: "Recite Ayat al-Kursi (Quran 2:255). The Prophet (ﷺ) said whoever recites it in the morning will be protected until evening." },
      { title: "2. Last Two Verses of Al-Baqarah", content: "Recite the last two verses of Surah Al-Baqarah (2:285-286). These are sufficient for protection." },
      { title: "3. Surah Al-Ikhlas, Al-Falaq, An-Nas", content: "Recite these three surahs three times each. They provide complete protection." },
      { title: "4. Tasbih, Tahmid, Takbir", content: "Say 'Subhan Allah' (33x), 'Alhamdulillah' (33x), 'Allahu Akbar' (34x)." },
      { title: "5. Sayyid al-Istighfar", content: "Recite the master of seeking forgiveness: 'Allahumma anta Rabbi, la ilaha illa ant...'." },
      { title: "6. Protection Dua", content: "Say: 'Bismillahil-ladhi la yadurru ma'asmihi shay'un fil-ardi wa la fis-sama' (three times)." },
    ],
    references: ["Sahih al-Bukhari 5010", "Sunan Abu Dawud 5082"],
  },
];

const purificationGuides: IslamicGuide[] = [
  {
    id: "how-to-perform-wudu",
    title: "How to Perform Wudu (Ablution)",
    titleAr: "كيفية الوضوء",
    category: "purification",
    description: "Detailed guide for performing ablution correctly",
    descriptionAr: "دليل مفصل لأداء الوضوء بشكل صحيح",
    steps: [
      { title: "1. Make Intention", content: "Make the intention in your heart to perform wudu. Say 'Bismillah'." },
      { title: "2. Wash Hands", content: "Wash both hands up to the wrists three times." },
      { title: "3. Rinse Mouth", content: "Rinse your mouth thoroughly three times." },
      { title: "4. Rinse Nose", content: "Sniff water into your nostrils three times and blow it out." },
      { title: "5. Wash Face", content: "Wash your entire face three times from hairline to chin and ear to ear." },
      { title: "6. Wash Arms", content: "Wash your right arm to the elbow three times, then the left arm." },
      { title: "7. Wipe Head", content: "Wet your hands and wipe over your head once." },
      { title: "8. Wipe Ears", content: "Wipe inside your ears with index fingers and outside with thumbs." },
      { title: "9. Wash Feet", content: "Wash your right foot to the ankle three times, then the left foot." },
      { title: "10. Recite Dua", content: "Say: 'Ashhadu an la ilaha illallah wahdahu la sharika lah, wa ashhadu anna Muhammadan abduhu wa rasuluh'." },
    ],
    references: ["Sahih Muslim 226", "Quran 5:6"],
  },
  {
    id: "how-to-perform-ghusl",
    title: "How to Perform Ghusl (Full Ritual Purification)",
    titleAr: "كيفية الغسل",
    category: "purification",
    description: "Comprehensive guide for performing full ritual bath",
    descriptionAr: "دليل شامل لأداء الغسل الكامل",
    steps: [
      { title: "1. Make Intention", content: "Make the intention to purify yourself from major impurity. Say 'Bismillah'." },
      { title: "2. Wash Hands", content: "Wash both hands up to the wrists three times." },
      { title: "3. Wash Private Parts", content: "Wash the private parts thoroughly." },
      { title: "4. Perform Wudu", content: "Perform complete wudu as you would for prayer." },
      { title: "5. Pour Water Over Head", content: "Pour water over your head three times, ensuring it reaches the roots of your hair." },
      { title: "6. Wash Right Side", content: "Pour water over your entire right side of the body." },
      { title: "7. Wash Left Side", content: "Pour water over your entire left side of the body." },
      { title: "8. Wash Entire Body", content: "Ensure water has reached every part of your body." },
    ],
    references: ["Sahih al-Bukhari 248", "Sahih Muslim 316"],
  },
  {
    id: "how-to-perform-tayammum",
    title: "How to Perform Tayammum (Dry Ablution)",
    titleAr: "كيفية التيمم",
    category: "purification",
    description: "Guide for performing dry ablution when water is unavailable",
    descriptionAr: "دليل لأداء التيمم عند عدم توفر الماء",
    steps: [
      { title: "1. Make Intention", content: "Make the intention to perform Tayammum as a substitute for wudu or ghusl." },
      { title: "2. Say Bismillah", content: "Begin by saying 'Bismillah' (In the name of Allah)." },
      { title: "3. Strike Clean Earth", content: "Strike your hands on clean earth, sand, or dust once." },
      { title: "4. Wipe Face", content: "Wipe your entire face with both palms once." },
      { title: "5. Wipe Hands", content: "Wipe your right hand with your left palm, then wipe your left hand with your right palm, up to the wrists." },
      { title: "6. Complete", content: "Your Tayammum is now complete and valid for one prayer. Repeat for each prayer time." },
    ],
    references: ["Quran 4:43", "Sahih al-Bukhari 334"],
  },
];

const hajjGuides: IslamicGuide[] = [
  {
    id: "how-to-perform-umrah",
    title: "How to Perform Umrah",
    titleAr: "كيفية أداء العمرة",
    category: "hajj",
    description: "Complete guide for performing the lesser pilgrimage",
    descriptionAr: "دليل كامل لأداء العمرة",
    steps: [
      { title: "1. Enter Ihram", content: "Before reaching the Miqat, make intention for Umrah, perform ghusl, and wear Ihram garments. Say the Talbiyah: 'Labbayk Allahumma Umrah'." },
      { title: "2. Enter Masjid al-Haram", content: "Enter with your right foot and say the dua for entering the mosque." },
      { title: "3. Perform Tawaf", content: "Circle the Ka'bah seven times counterclockwise, starting from the Black Stone. Men should uncover their right shoulder (Idtiba) and walk briskly in the first three circuits (Raml)." },
      { title: "4. Pray Two Rak'ahs", content: "After Tawaf, pray two rak'ahs behind Maqam Ibrahim if possible, or anywhere in the Haram." },
      { title: "5. Drink Zamzam", content: "Drink Zamzam water and make dua." },
      { title: "6. Perform Sa'i", content: "Walk between Safa and Marwah seven times, starting at Safa. Men should jog between the green lights." },
      { title: "7. Shave or Trim Hair", content: "Men should shave their heads or trim hair. Women should cut a fingertip's length from their hair. This completes your Umrah." },
    ],
    references: ["Sahih al-Bukhari 1623", "Sahih Muslim 1218"],
  },
  {
    id: "how-to-perform-tawaf",
    title: "How to Perform Tawaf",
    titleAr: "كيفية الطواف",
    category: "hajj",
    description: "Detailed guide for circling the Ka'bah",
    descriptionAr: "دليل مفصل للطواف حول الكعبة",
    steps: [
      { title: "1. Face the Black Stone", content: "Stand facing the Black Stone (Hajar al-Aswad) with the Ka'bah on your left." },
      { title: "2. Make Intention", content: "Make intention for Tawaf in your heart." },
      { title: "3. Touch or Point", content: "If possible, touch and kiss the Black Stone. If not, point to it and say 'Bismillah, Allahu Akbar'." },
      { title: "4. Begin Circling", content: "Walk counterclockwise around the Ka'bah, keeping it on your left. Men should uncover their right shoulder." },
      { title: "5. Recite Dhikr and Dua", content: "There are no specific duas for Tawaf. Recite Quran, make dhikr, or make personal duas." },
      { title: "6. Touch Yemeni Corner", content: "If possible, touch the Yemeni Corner (Rukn Yamani) with your right hand without kissing it." },
      { title: "7. Complete Seven Circuits", content: "Complete seven full circuits. Each time you pass the Black Stone, point to it and say 'Allahu Akbar'." },
      { title: "8. Pray Two Rak'ahs", content: "After completing Tawaf, pray two rak'ahs behind Maqam Ibrahim or anywhere in the Haram." },
    ],
    references: ["Sahih Muslim 1218"],
  },
];

const charityGuides: IslamicGuide[] = [
  {
    id: "how-to-calculate-zakat",
    title: "How to Calculate and Pay Zakat",
    titleAr: "كيفية حساب ودفع الزكاة",
    category: "charity",
    description: "Comprehensive guide for calculating and paying obligatory charity",
    descriptionAr: "دليل شامل لحساب ودفع الزكاة الواجبة",
    steps: [
      { title: "1. Understand Nisab", content: "Nisab is the minimum amount of wealth one must have before Zakat is due. It's equivalent to 85 grams of gold or 595 grams of silver." },
      { title: "2. Calculate Your Wealth", content: "Add up all your zakatable assets: cash, bank savings, gold, silver, business inventory, stocks, and money owed to you." },
      { title: "3. Deduct Debts", content: "Subtract any debts you owe that are due within the year." },
      { title: "4. Check if Above Nisab", content: "If your net zakatable wealth is above the Nisab threshold, Zakat is obligatory." },
      { title: "5. Calculate 2.5%", content: "Multiply your zakatable wealth by 0.025 (2.5%). This is your Zakat amount." },
      { title: "6. Pay to Eligible Recipients", content: "Distribute your Zakat to the eight categories mentioned in Quran 9:60: the poor, needy, Zakat collectors, those whose hearts are to be reconciled, slaves, debtors, in the cause of Allah, and travelers." },
      { title: "7. Make Intention", content: "When paying, make the intention that this is your obligatory Zakat." },
    ],
    references: ["Quran 9:60", "Sahih al-Bukhari 1395"],
  },
  {
    id: "how-to-pay-zakat-al-fitr",
    title: "How to Pay Zakat al-Fitr",
    titleAr: "كيفية دفع زكاة الفطر",
    category: "charity",
    description: "Guide for paying the obligatory charity at the end of Ramadan",
    descriptionAr: "دليل لدفع الزكاة الواجبة في نهاية رمضان",
    steps: [
      { title: "1. Understand the Purpose", content: "Zakat al-Fitr purifies the fasting person from idle talk and obscene speech, and provides food for the poor on Eid day." },
      { title: "2. Who Must Pay", content: "Every Muslim who has food in excess of their needs for one day and night must pay Zakat al-Fitr for themselves and their dependents." },
      { title: "3. Calculate the Amount", content: "The amount is one Sa' (approximately 3 kg or 2.5 liters) of staple food (wheat, barley, dates, raisins, or rice), or its monetary equivalent." },
      { title: "4. Timing", content: "It must be paid before the Eid prayer. It's best to pay it 1-2 days before Eid. Paying after Eid prayer is considered late charity, not Zakat al-Fitr." },
      { title: "5. Give to the Poor", content: "Give it directly to poor and needy Muslims in your community, or through a trusted organization." },
    ],
    references: ["Sunan Abu Dawud 1609", "Sunan Ibn Majah 1827"],
  },
  {
    id: "how-to-give-sadaqah",
    title: "How to Give Sadaqah (Voluntary Charity)",
    titleAr: "كيفية التصدق",
    category: "charity",
    description: "Guide for giving voluntary charity with sincerity",
    descriptionAr: "دليل للتصدق الطوعي بإخلاص",
    steps: [
      { title: "1. Make Pure Intention", content: "Give charity solely for Allah's pleasure, not for recognition or praise from people." },
      { title: "2. Give from Halal Wealth", content: "Ensure your charity comes from lawfully earned money. Allah only accepts what is pure." },
      { title: "3. Give Secretly When Possible", content: "The Prophet (ﷺ) said the best charity is that given secretly. However, public charity can inspire others." },
      { title: "4. Give Regularly", content: "Even small amounts given regularly are better than large amounts given occasionally. The Prophet (ﷺ) said the most beloved deeds to Allah are those done consistently." },
      { title: "5. Don't Remind Recipients", content: "Never remind people of your charity or hurt them with words. This nullifies the reward." },
      { title: "6. Smile is Charity", content: "Remember that charity isn't just money. A smile, helping someone, removing harm from the road, and kind words are all forms of Sadaqah." },
    ],
    references: ["Quran 2:264", "Sahih al-Bukhari 1423", "Sahih Muslim 1017"],
  },
];

const fastingGuides: IslamicGuide[] = [
  {
    id: "how-to-fast-ramadan",
    title: "How to Fast in Ramadan",
    titleAr: "كيفية صيام رمضان",
    category: "fasting",
    description: "Complete guide for observing the obligatory fast",
    descriptionAr: "دليل كامل لأداء الصيام الواجب",
    steps: [
      { title: "1. Make Intention at Night", content: "Make the intention to fast before Fajr. The Prophet (ﷺ) said: 'Whoever does not intend to fast before Fajr, there is no fast for him.'" },
      { title: "2. Eat Suhoor", content: "Eat the pre-dawn meal (Suhoor). The Prophet (ﷺ) said: 'Eat Suhoor, for there is blessing in it.' Stop eating before Fajr begins." },
      { title: "3. Abstain from Food, Drink, and Relations", content: "From Fajr until Maghrib, abstain from food, drink, smoking, and marital relations." },
      { title: "4. Guard Your Tongue", content: "Avoid lying, backbiting, arguing, and foul language. The Prophet (ﷺ) said: 'Whoever does not give up false speech and acting upon it, Allah has no need for him to give up his food and drink.'" },
      { title: "5. Increase Good Deeds", content: "Increase prayer, Quran recitation, dhikr, and charity. Ramadan is the month of the Quran and generosity." },
      { title: "6. Break Fast at Maghrib", content: "Break your fast immediately when Maghrib enters. The Prophet (ﷺ) would break his fast with dates and water, then pray Maghrib." },
      { title: "7. Make Dua Before Breaking", content: "The dua of the fasting person is accepted. Say: 'Allahumma laka sumtu wa 'ala rizqika aftartu' (O Allah, for You I have fasted and with Your provision I break my fast)." },
    ],
    references: ["Sahih al-Bukhari 1923", "Sunan Abu Dawud 2356"],
  },
  {
    id: "how-to-fast-voluntarily",
    title: "How to Perform Voluntary Fasting",
    titleAr: "كيفية الصيام التطوعي",
    category: "fasting",
    description: "Guide for recommended voluntary fasts throughout the year",
    descriptionAr: "دليل للصيام التطوعي الموصى به خلال السنة",
    steps: [
      { title: "1. Mondays and Thursdays", content: "The Prophet (ﷺ) used to fast Mondays and Thursdays. He said deeds are presented to Allah on these days." },
      { title: "2. Three Days Each Month", content: "Fast the 13th, 14th, and 15th of each lunar month (the white days). This is equivalent to fasting the entire year." },
      { title: "3. Day of Arafah", content: "Fast on the 9th of Dhul-Hijjah (for non-pilgrims). The Prophet (ﷺ) said it expiates sins of the previous and coming year." },
      { title: "4. Day of Ashura", content: "Fast on the 10th of Muharram, and it's recommended to fast the 9th or 11th with it. It expiates sins of the previous year." },
      { title: "5. Six Days of Shawwal", content: "Fast six days in Shawwal after Ramadan. The Prophet (ﷺ) said it's like fasting the entire year." },
      { title: "6. Make Intention", content: "For voluntary fasts, you can make the intention even during the day, as long as you haven't eaten anything." },
    ],
    references: ["Sahih Muslim 1162", "Sunan Abu Dawud 2425"],
  },
];

const funeralGuides: IslamicGuide[] = [
  {
    id: "how-to-perform-janazah-prayer",
    title: "How to Perform Janazah Prayer",
    titleAr: "كيفية صلاة الجنازة",
    category: "funeral",
    description: "Guide for performing the funeral prayer",
    descriptionAr: "دليل لأداء صلاة الجنازة",
    steps: [
      { title: "1. Stand in Rows", content: "Form rows behind the Imam. The deceased is placed in front, with men standing closer to the Imam." },
      { title: "2. First Takbir", content: "Raise your hands and say 'Allahu Akbar', then recite Al-Fatiha silently." },
      { title: "3. Second Takbir", content: "Say 'Allahu Akbar' (without raising hands) and send blessings upon the Prophet: 'Allahumma salli 'ala Muhammad...'" },
      { title: "4. Third Takbir", content: "Say 'Allahu Akbar' and make dua for the deceased: 'Allahumma ighfir lahu warhamhu...'" },
      { title: "5. Fourth Takbir", content: "Say 'Allahu Akbar' and make a brief dua for yourself and all Muslims." },
      { title: "6. Give Tasleem", content: "Turn your head to the right and say 'As-salamu alaykum', then to the left and repeat." },
    ],
    references: ["Sahih Muslim 963", "Sunan Abu Dawud 3201"],
  },
  {
    id: "how-to-offer-condolences",
    title: "How to Offer Condolences",
    titleAr: "كيفية التعزية",
    category: "funeral",
    description: "Islamic etiquette for consoling the bereaved",
    descriptionAr: "آداب التعزية الإسلامية",
    steps: [
      { title: "1. Visit Promptly", content: "Visit the family soon after hearing the news, but be mindful of their need for space and privacy." },
      { title: "2. Say Appropriate Words", content: "Say: 'Inna lillahi wa inna ilayhi raji'un' (To Allah we belong and to Him we return). Remind them that Allah will reward their patience." },
      { title: "3. Make Dua", content: "Make dua for the deceased and for the family: 'May Allah forgive them, have mercy on them, and grant you patience and reward.'" },
      { title: "4. Offer Practical Help", content: "Offer specific help like preparing food, running errands, or helping with funeral arrangements." },
      { title: "5. Be Brief", content: "Keep your visit short unless the family specifically asks you to stay longer." },
      { title: "6. Avoid Excessive Wailing", content: "Maintain composure and avoid loud wailing or excessive displays of grief, as this is discouraged in Islam." },
    ],
    references: ["Sahih Muslim 918", "Sunan Ibn Majah 1601"],
  },
];

const characterGuides: IslamicGuide[] = [
  {
    id: "how-to-control-anger",
    title: "How to Control Anger",
    titleAr: "كيفية السيطرة على الغضب",
    category: "character",
    description: "Islamic guidance for managing anger",
    descriptionAr: "التوجيه الإسلامي للسيطرة على الغضب",
    steps: [
      { title: "1. Seek Refuge in Allah", content: "When you feel anger rising, say: 'A'udhu billahi min ash-shaytan ir-rajeem' (I seek refuge in Allah from Satan the accursed)." },
      { title: "2. Stay Silent", content: "The Prophet (ﷺ) said: 'If one of you becomes angry, let him be silent.' Silence prevents you from saying things you'll regret." },
      { title: "3. Change Position", content: "If standing, sit down. If sitting, lie down. The Prophet (ﷺ) taught this to change your physical state." },
      { title: "4. Perform Wudu", content: "Make ablution with cold water. The Prophet (ﷺ) said anger is from Satan, and Satan is created from fire, which is extinguished by water." },
      { title: "5. Remember Allah's Forgiveness", content: "Reflect on how Allah forgives you despite your mistakes. This should make you more forgiving of others." },
      { title: "6. Think of Consequences", content: "Consider the negative consequences of acting on anger: broken relationships, regretful words, and loss of respect." },
    ],
    references: ["Sahih al-Bukhari 6116", "Sunan Abu Dawud 4784"],
  },
  {
    id: "how-to-practice-humility",
    title: "How to Practice Humility",
    titleAr: "كيفية التواضع",
    category: "character",
    description: "Guide for developing humility in Islam",
    descriptionAr: "دليل لتطوير التواضع في الإسلام",
    steps: [
      { title: "1. Remember Your Origin", content: "Reflect that you were created from dust and will return to dust. This reality should humble anyone." },
      { title: "2. Acknowledge Allah's Favors", content: "Recognize that all your blessings, talents, and achievements are gifts from Allah, not your own doing." },
      { title: "3. Serve Others", content: "The Prophet (ﷺ) served his family, mended his clothes, and helped with household chores despite being the leader of the Muslims." },
      { title: "4. Avoid Boasting", content: "Don't boast about your wealth, knowledge, lineage, or accomplishments. The Prophet (ﷺ) said: 'Whoever has pride in his heart equal to an atom shall not enter Paradise.'" },
      { title: "5. Accept Advice", content: "Be open to criticism and advice from others, regardless of their status. Truth can come from anyone." },
      { title: "6. Treat Everyone Equally", content: "Show respect to the poor, elderly, and those of lower social status. The Prophet (ﷺ) said: 'The best of you are those who are best to their families.'" },
    ],
    references: ["Sahih Muslim 91", "Sunan Abu Dawud 4895"],
  },
  {
    id: "how-to-forgive-others",
    title: "How to Forgive Others",
    titleAr: "كيفية مسامحة الآخرين",
    category: "character",
    description: "Islamic teachings on forgiveness and pardon",
    descriptionAr: "التعاليم الإسلامية عن المغفرة والعفو",
    steps: [
      { title: "1. Remember Allah's Forgiveness", content: "Allah forgives you for countless sins. The Quran says: 'Let them pardon and overlook. Would you not like that Allah should forgive you?' (24:22)" },
      { title: "2. Understand the Reward", content: "The Prophet (ﷺ) said: 'Charity does not decrease wealth, and Allah increases the honor of one who forgives.'" },
      { title: "3. Put Yourself in Their Shoes", content: "Try to understand why the person wronged you. Perhaps they were going through difficulties or didn't realize the impact of their actions." },
      { title: "4. Make Dua for Them", content: "Pray for the person who wronged you. This softens your heart and helps you let go of resentment." },
      { title: "5. Let Go of Grudges", content: "Holding grudges only hurts you. The Prophet (ﷺ) said: 'Do not hate one another, do not envy one another, and be servants of Allah as brothers.'" },
      { title: "6. Reconcile When Possible", content: "If appropriate, reach out to reconcile. The Prophet (ﷺ) said: 'It is not permissible for a Muslim to forsake his brother for more than three days.'" },
    ],
    references: ["Quran 24:22", "Sahih Muslim 2588", "Sahih al-Bukhari 6077"],
  },
];

const knowledgeGuides: IslamicGuide[] = [
  {
    id: "how-to-seek-knowledge",
    title: "How to Seek Islamic Knowledge",
    titleAr: "كيفية طلب العلم الشرعي",
    category: "knowledge",
    description: "Guide for pursuing Islamic knowledge properly",
    descriptionAr: "دليل لطلب العلم الشرعي بشكل صحيح",
    steps: [
      { title: "1. Purify Your Intention", content: "Seek knowledge for Allah's sake, not for worldly gain or recognition. The Prophet (ﷺ) warned against seeking knowledge for show." },
      { title: "2. Start with Basics", content: "Begin with fundamental knowledge: correct belief (Aqeedah), how to pray, basic Islamic rulings, and Quran recitation." },
      { title: "3. Find Qualified Teachers", content: "Learn from knowledgeable, trustworthy scholars who follow the Quran and Sunnah. The Prophet (ﷺ) said: 'This knowledge will be carried by the trustworthy ones of every generation.'" },
      { title: "4. Be Consistent", content: "Study regularly, even if it's just a little each day. The Prophet (ﷺ) said: 'The most beloved deeds to Allah are those done consistently.'" },
      { title: "5. Practice What You Learn", content: "Apply your knowledge in your life. Knowledge without action is like a tree without fruit." },
      { title: "6. Teach Others", content: "Share beneficial knowledge with others. The Prophet (ﷺ) said: 'The best of you are those who learn the Quran and teach it.'" },
    ],
    references: ["Sahih al-Bukhari 5027", "Sunan Abu Dawud 3641"],
  },
  {
    id: "how-to-make-tawbah",
    title: "How to Make Tawbah (Repentance)",
    titleAr: "كيفية التوبة",
    category: "knowledge",
    description: "Guide for sincere repentance from sins",
    descriptionAr: "دليل للتوبة الصادقة من الذنوب",
    steps: [
      { title: "1. Stop the Sin Immediately", content: "The first step is to stop committing the sin right away. You cannot repent while continuing the sin." },
      { title: "2. Feel Genuine Remorse", content: "Feel sincere regret in your heart for having disobeyed Allah. The Prophet (ﷺ) said: 'Remorse is repentance.'" },
      { title: "3. Seek Allah's Forgiveness", content: "Ask Allah to forgive you. Say: 'Astaghfirullah' (I seek Allah's forgiveness) and make sincere dua." },
      { title: "4. Firmly Resolve Not to Return", content: "Make a firm intention never to return to that sin. This determination is essential for valid repentance." },
      { title: "5. Make Amends if Needed", content: "If your sin involved wronging someone, seek their forgiveness and make amends. Return stolen property, apologize for harm caused, etc." },
      { title: "6. Replace Bad with Good", content: "Follow up your sin with good deeds. Allah says: 'Indeed, good deeds do away with misdeeds' (Quran 11:114)." },
      { title: "7. Never Despair", content: "No matter how great your sins, never lose hope in Allah's mercy. He says: 'Say, O My servants who have transgressed against themselves, do not despair of the mercy of Allah' (Quran 39:53)." },
    ],
    references: ["Quran 39:53", "Sahih Muslim 2702", "Sunan Ibn Majah 4250"],
  },
];

// Combine all guides
export const islamicGuides: IslamicGuide[] = [
  ...worshipGuides,
  ...purificationGuides,
  ...hajjGuides,
  ...charityGuides,
  ...fastingGuides,
  ...funeralGuides,
  ...characterGuides,
  ...knowledgeGuides,
];
