/**
 * Dhikr Content for Floating Overlay Reminders
 * 
 * Categories:
 * - tasbih: SubhanAllah (glorification)
 * - tahmid: Alhamdulillah (praise)
 * - takbir: Allahu Akbar (greatness)
 * - salawat: Blessings on Prophet ﷺ
 * - istighfar: Seeking forgiveness
 * - dua: Short supplications
 */

export type DhikrCategory = 'tasbih' | 'tahmid' | 'takbir' | 'salawat' | 'istighfar' | 'dua';

export interface DhikrItem {
  id: string;
  category: DhikrCategory;
  arabic: string;
  transliteration: string;
  meaning: string;
  source?: string;
  virtue?: string;
}

export const DHIKR_CATEGORIES: { id: DhikrCategory; name: string; nameAr: string }[] = [
  { id: 'tasbih', name: 'Tasbih', nameAr: 'تسبيح' },
  { id: 'tahmid', name: 'Tahmid', nameAr: 'تحميد' },
  { id: 'takbir', name: 'Takbir', nameAr: 'تكبير' },
  { id: 'salawat', name: 'Salawat', nameAr: 'صلوات' },
  { id: 'istighfar', name: 'Istighfar', nameAr: 'استغفار' },
  { id: 'dua', name: 'Duas', nameAr: 'أدعية' },
];

export const dhikrContent: DhikrItem[] = [
  // === TASBIH (Glorification) ===
  {
    id: 'tasbih-1',
    category: 'tasbih',
    arabic: 'سُبْحَانَ اللهِ',
    transliteration: 'SubhanAllah',
    meaning: 'Glory be to Allah',
    source: 'Muslim 2137',
    virtue: 'A palm tree is planted in Paradise'
  },
  {
    id: 'tasbih-2',
    category: 'tasbih',
    arabic: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ',
    transliteration: 'SubhanAllahi wa bihamdihi',
    meaning: 'Glory be to Allah and praise Him',
    source: 'Bukhari 6405',
    virtue: 'Sins forgiven even if like foam of the sea'
  },
  {
    id: 'tasbih-3',
    category: 'tasbih',
    arabic: 'سُبْحَانَ اللهِ الْعَظِيمِ',
    transliteration: 'SubhanAllahil Azeem',
    meaning: 'Glory be to Allah, the Magnificent',
    source: 'Bukhari 6682',
    virtue: 'Light on tongue, heavy on scales'
  },
  {
    id: 'tasbih-4',
    category: 'tasbih',
    arabic: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ، سُبْحَانَ اللهِ الْعَظِيمِ',
    transliteration: 'SubhanAllahi wa bihamdihi, SubhanAllahil Azeem',
    meaning: 'Glory and praise to Allah, Glory to Allah the Magnificent',
    source: 'Bukhari 6406',
    virtue: 'Two phrases beloved to the Most Merciful'
  },
  {
    id: 'tasbih-5',
    category: 'tasbih',
    arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ',
    transliteration: 'Subhana Rabbiyal Azeem',
    meaning: 'Glory be to my Lord, the Magnificent',
    source: 'Said in Ruku'
  },
  {
    id: 'tasbih-6',
    category: 'tasbih',
    arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى',
    transliteration: "Subhana Rabbiyal A'la",
    meaning: 'Glory be to my Lord, the Most High',
    source: 'Said in Sujood'
  },
  {
    id: 'tasbih-7',
    category: 'tasbih',
    arabic: 'سُبُّوحٌ قُدُّوسٌ رَبُّ الْمَلَائِكَةِ وَالرُّوحِ',
    transliteration: 'Subbuhun Quddusun Rabbul Malaikati war-Ruh',
    meaning: 'Perfect and Holy, Lord of the Angels and the Spirit',
    source: 'Muslim 487'
  },
  {
    id: 'tasbih-8',
    category: 'tasbih',
    arabic: 'سُبْحَانَ ذِي الْجَبَرُوتِ وَالْمَلَكُوتِ وَالْكِبْرِيَاءِ وَالْعَظَمَةِ',
    transliteration: 'Subhana dhil-jabaroot wal-malakoot wal-kibriyaa wal-azamah',
    meaning: 'Glory to the Owner of might, dominion, magnificence and majesty',
    source: 'Abu Dawud 873'
  },

  // === TAHMID (Praise) ===
  {
    id: 'tahmid-1',
    category: 'tahmid',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdulillah',
    meaning: 'All praise is due to Allah',
    source: 'Quran 1:2',
    virtue: 'Fills the scales of good deeds'
  },
  {
    id: 'tahmid-2',
    category: 'tahmid',
    arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    transliteration: 'Alhamdulillahi Rabbil Aalameen',
    meaning: 'All praise is due to Allah, Lord of all the worlds',
    source: 'Quran 1:2'
  },
  {
    id: 'tahmid-3',
    category: 'tahmid',
    arabic: 'الْحَمْدُ لِلَّهِ عَلَى كُلِّ حَالٍ',
    transliteration: 'Alhamdulillahi ala kulli hal',
    meaning: 'All praise is due to Allah in every situation',
    source: 'Ibn Majah 3803'
  },
  {
    id: 'tahmid-4',
    category: 'tahmid',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ',
    transliteration: "Alhamdulillahil-ladhi bi ni'matihi tatimmus-salihat",
    meaning: 'Praise be to Allah by Whose grace good deeds are completed',
    source: 'Ibn Majah 3803'
  },
  {
    id: 'tahmid-5',
    category: 'tahmid',
    arabic: 'الْحَمْدُ لِلَّهِ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ',
    transliteration: 'Alhamdulillahi hamdan katheeran tayyiban mubarakan feeh',
    meaning: 'Praise be to Allah, abundant, pure and blessed praise',
    source: 'Bukhari 799'
  },
  {
    id: 'tahmid-6',
    category: 'tahmid',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا',
    transliteration: "Alhamdulillahil-ladhi at'amana wa saqana",
    meaning: 'Praise be to Allah who fed us and gave us drink',
    source: 'Abu Dawud 3850'
  },
  {
    id: 'tahmid-7',
    category: 'tahmid',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا',
    transliteration: "Alhamdulillahil-ladhi ahyana ba'da ma amatana",
    meaning: 'Praise be to Allah who gave us life after death',
    source: 'Bukhari 6312',
    virtue: 'Said upon waking up'
  },

  // === TAKBIR (Greatness) ===
  {
    id: 'takbir-1',
    category: 'takbir',
    arabic: 'اللهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    meaning: 'Allah is the Greatest',
    source: 'Said in every prayer',
    virtue: "Declaration of Allah's supreme greatness"
  },
  {
    id: 'takbir-2',
    category: 'takbir',
    arabic: 'اللهُ أَكْبَرُ كَبِيرًا',
    transliteration: 'Allahu Akbaru Kabeera',
    meaning: 'Allah is the Greatest, truly Great',
    source: 'Muslim 601'
  },
  {
    id: 'takbir-3',
    category: 'takbir',
    arabic: 'لَا إِلَهَ إِلَّا اللهُ وَاللهُ أَكْبَرُ',
    transliteration: 'La ilaha illAllahu wallahu Akbar',
    meaning: 'There is no god but Allah, and Allah is the Greatest',
    source: 'Bukhari 6384'
  },
  {
    id: 'takbir-4',
    category: 'takbir',
    arabic: 'اللهُ أَكْبَرُ وَلِلَّهِ الْحَمْدُ',
    transliteration: 'Allahu Akbar wa lillahil hamd',
    meaning: 'Allah is the Greatest and to Allah belongs all praise',
    source: 'Muslim 1218'
  },
  {
    id: 'takbir-5',
    category: 'takbir',
    arabic: 'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    transliteration: 'La ilaha illAllahu wahdahu la shareeka lah',
    meaning: 'There is no god but Allah alone, with no partner',
    source: 'Bukhari 6403',
    virtue: 'Said 100 times = reward of freeing 10 slaves'
  },

  // === SALAWAT (Blessings on Prophet ﷺ) ===
  {
    id: 'salawat-1',
    category: 'salawat',
    arabic: 'صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ',
    transliteration: 'SallAllahu alayhi wa sallam',
    meaning: "May Allah's peace and blessings be upon him",
    source: 'Quran 33:56',
    virtue: 'Allah sends 10 blessings for each one sent'
  },
  {
    id: 'salawat-2',
    category: 'salawat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
    transliteration: 'Allahumma salli ala Muhammad',
    meaning: 'O Allah, send blessings upon Muhammad',
    source: 'Bukhari 3370'
  },
  {
    id: 'salawat-3',
    category: 'salawat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ',
    transliteration: 'Allahumma salli ala Muhammadin wa ala aali Muhammad',
    meaning: 'O Allah, send blessings upon Muhammad and his family',
    source: 'Bukhari 3370'
  },
  {
    id: 'salawat-4',
    category: 'salawat',
    arabic: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
    transliteration: 'Allahumma salli wa sallim ala nabiyyina Muhammad',
    meaning: 'O Allah, send peace and blessings upon our Prophet Muhammad',
    source: 'Tirmidhi 484'
  },
  {
    id: 'salawat-5',
    category: 'salawat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَبَارِكْ وَسَلِّمْ',
    transliteration: 'Allahumma salli ala Muhammad wa barik wa sallim',
    meaning: 'O Allah, send blessings, grace and peace upon Muhammad',
    source: 'Ahmad'
  },
  {
    id: 'salawat-6',
    category: 'salawat',
    arabic: 'صَلَّى اللهُ عَلَى مُحَمَّدٍ وَآلِهِ وَصَحْبِهِ وَسَلَّمَ',
    transliteration: 'SallAllahu ala Muhammad wa alihi wa sahbihi wa sallam',
    meaning: 'May Allah bless Muhammad, his family and companions',
    source: 'Common formula'
  },
  {
    id: 'salawat-7',
    category: 'salawat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ',
    transliteration: 'Allahumma salli ala sayyidina Muhammad',
    meaning: 'O Allah, send blessings upon our master Muhammad',
    source: 'Common formula'
  },
  {
    id: 'salawat-8',
    category: 'salawat',
    arabic: 'عَلَيْهِ الصَّلَاةُ وَالسَّلَامُ',
    transliteration: 'Alayhis-salatu was-salam',
    meaning: 'Upon him be prayer and peace',
    source: 'Common formula'
  },

  // === ISTIGHFAR (Seeking Forgiveness) ===
  {
    id: 'istighfar-1',
    category: 'istighfar',
    arabic: 'أَسْتَغْفِرُ اللهَ',
    transliteration: 'Astaghfirullah',
    meaning: 'I seek forgiveness from Allah',
    source: 'Bukhari 6307',
    virtue: 'Prophet ﷺ said it 100 times daily'
  },
  {
    id: 'istighfar-2',
    category: 'istighfar',
    arabic: 'أَسْتَغْفِرُ اللهَ الْعَظِيمَ',
    transliteration: 'Astaghfirullahil Azeem',
    meaning: 'I seek forgiveness from Allah, the Magnificent',
    source: 'Tirmidhi 3577'
  },
  {
    id: 'istighfar-3',
    category: 'istighfar',
    arabic: 'أَسْتَغْفِرُ اللهَ وَأَتُوبُ إِلَيْهِ',
    transliteration: 'Astaghfirullaha wa atubu ilayh',
    meaning: 'I seek forgiveness from Allah and repent to Him',
    source: 'Bukhari 6307'
  },
  {
    id: 'istighfar-4',
    category: 'istighfar',
    arabic: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ',
    transliteration: 'Rabbighfir li wa tub alayya',
    meaning: 'My Lord, forgive me and accept my repentance',
    source: 'Abu Dawud 1516'
  },
  {
    id: 'istighfar-5',
    category: 'istighfar',
    arabic: 'أَسْتَغْفِرُ اللهَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ',
    transliteration: 'Astaghfirullaha alladhi la ilaha illa huwal Hayyul Qayyum wa atubu ilayh',
    meaning: 'I seek forgiveness from Allah, there is no god but He, the Living, the Sustainer, and I repent to Him',
    source: 'Abu Dawud 1517',
    virtue: 'Sins forgiven even if fled from battle'
  },
  {
    id: 'istighfar-6',
    category: 'istighfar',
    arabic: 'رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ',
    transliteration: 'Rabbana zalamna anfusana wa in lam taghfir lana wa tarhamna lanakoonanna minal khasireen',
    meaning: 'Our Lord, we have wronged ourselves. If You do not forgive us and have mercy, we will be among the losers',
    source: 'Quran 7:23',
    virtue: "Dua of Adam (AS)"
  },
  {
    id: 'istighfar-7',
    category: 'istighfar',
    arabic: 'رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ',
    transliteration: 'Rabbighfir li wa liwalidayya',
    meaning: 'My Lord, forgive me and my parents',
    source: 'Quran 71:28'
  },

  // === DUA (Short Supplications) ===
  {
    id: 'dua-1',
    category: 'dua',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar',
    meaning: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the Fire',
    source: 'Quran 2:201',
    virtue: 'Most frequent dua of Prophet ﷺ'
  },
  {
    id: 'dua-2',
    category: 'dua',
    arabic: 'رَبِّ زِدْنِي عِلْمًا',
    transliteration: 'Rabbi zidni ilma',
    meaning: 'My Lord, increase me in knowledge',
    source: 'Quran 20:114'
  },
  {
    id: 'dua-3',
    category: 'dua',
    arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',
    transliteration: 'Rabbish-rahli sadri wa yassir li amri',
    meaning: 'My Lord, expand my chest and ease my task',
    source: 'Quran 20:25-26',
    virtue: "Dua of Musa (AS)"
  },
  {
    id: 'dua-4',
    category: 'dua',
    arabic: 'حَسْبُنَا اللهُ وَنِعْمَ الْوَكِيلُ',
    transliteration: 'HasbunAllahu wa ni\'mal wakeel',
    meaning: 'Allah is sufficient for us, and He is the best Disposer of affairs',
    source: 'Quran 3:173',
    virtue: 'Said by Ibrahim (AS) when thrown in fire'
  },
  {
    id: 'dua-5',
    category: 'dua',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ',
    transliteration: 'La hawla wa la quwwata illa billah',
    meaning: 'There is no power nor strength except with Allah',
    source: 'Bukhari 6384',
    virtue: 'A treasure from the treasures of Paradise'
  },
  {
    id: 'dua-6',
    category: 'dua',
    arabic: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ',
    transliteration: 'Ya Hayyu ya Qayyum bi rahmatika astaghith',
    meaning: 'O Living, O Sustainer, in Your mercy I seek relief',
    source: 'Tirmidhi 3524'
  },
  {
    id: 'dua-7',
    category: 'dua',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ',
    transliteration: "Allahumma inni as'alukal 'afwa wal 'afiyah",
    meaning: 'O Allah, I ask You for pardon and well-being',
    source: 'Ibn Majah 3871',
    virtue: 'Best dua after certainty of faith'
  },
  {
    id: 'dua-8',
    category: 'dua',
    arabic: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
    transliteration: "Allahumma a'inni ala dhikrika wa shukrika wa husni 'ibadatik",
    meaning: 'O Allah, help me remember You, thank You, and worship You well',
    source: 'Abu Dawud 1522'
  },
  {
    id: 'dua-9',
    category: 'dua',
    arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا',
    transliteration: 'Rabbana la tuzigh quloobana ba\'da idh hadaytana',
    meaning: 'Our Lord, do not let our hearts deviate after You have guided us',
    source: 'Quran 3:8'
  },
  {
    id: 'dua-10',
    category: 'dua',
    arabic: 'اللَّهُمَّ اهْدِنِي وَسَدِّدْنِي',
    transliteration: 'Allahumma-hdini wa saddidni',
    meaning: 'O Allah, guide me and keep me on the right path',
    source: 'Muslim 2725'
  },
  {
    id: 'dua-11',
    category: 'dua',
    arabic: 'رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ',
    transliteration: "Rabbi awzi'ni an ashkura ni'matak",
    meaning: 'My Lord, inspire me to be grateful for Your blessings',
    source: 'Quran 27:19'
  },
  {
    id: 'dua-12',
    category: 'dua',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ',
    transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazan",
    meaning: 'O Allah, I seek refuge in You from worry and grief',
    source: 'Bukhari 6369'
  },
];

// Helper function to get random dhikr avoiding recent ones
export function getRandomDhikr(
  enabledCategories: DhikrCategory[],
  recentIds: string[] = [],
  maxRecent: number = 5
): DhikrItem | null {
  const filtered = dhikrContent.filter(
    d => enabledCategories.includes(d.category) && !recentIds.slice(0, maxRecent).includes(d.id)
  );
  
  if (filtered.length === 0) {
    // If all filtered out, just pick from enabled categories
    const fallback = dhikrContent.filter(d => enabledCategories.includes(d.category));
    if (fallback.length === 0) return null;
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
  
  return filtered[Math.floor(Math.random() * filtered.length)];
}

// Get dhikr by category
export function getDhikrByCategory(category: DhikrCategory): DhikrItem[] {
  return dhikrContent.filter(d => d.category === category);
}
