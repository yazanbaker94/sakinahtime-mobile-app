/**
 * Islamic Calendar Constants
 */

import { IslamicEvent } from '@/types/hijri';

// Hijri month names
export const HIJRI_MONTHS = {
  ar: [
    'محرم',
    'صفر',
    'ربيع الأول',
    'ربيع الثاني',
    'جمادى الأولى',
    'جمادى الآخرة',
    'رجب',
    'شعبان',
    'رمضان',
    'شوال',
    'ذو القعدة',
    'ذو الحجة',
  ],
  en: [
    'Muharram',
    'Safar',
    'Rabi al-Awwal',
    'Rabi al-Thani',
    'Jumada al-Awwal',
    'Jumada al-Thani',
    'Rajab',
    'Shaban',
    'Ramadan',
    'Shawwal',
    'Dhul Qadah',
    'Dhul Hijjah',
  ],
};

// Day names
export const DAY_NAMES = {
  ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

// Islamic events (fixed Hijri dates)
export const ISLAMIC_EVENTS: IslamicEvent[] = [
  {
    id: 'new_year',
    nameEn: 'Islamic New Year',
    nameAr: 'رأس السنة الهجرية',
    month: 1,
    day: 1,
    type: 'major',
    description: 'The first day of Muharram marks the beginning of the Islamic calendar year.',
    descriptionAr: 'أول يوم من محرم يمثل بداية السنة الهجرية الجديدة.',
    color: '#D4AF37',
  },
  {
    id: 'ashura',
    nameEn: 'Day of Ashura',
    nameAr: 'يوم عاشوراء',
    month: 1,
    day: 10,
    type: 'fasting',
    description: 'The 10th of Muharram. Fasting on this day expiates sins of the previous year.',
    descriptionAr: 'العاشر من محرم. صيام هذا اليوم يكفّر ذنوب السنة الماضية.',
    color: '#3B82F6',
  },
  {
    id: 'mawlid',
    nameEn: 'Mawlid al-Nabi',
    nameAr: 'المولد النبوي',
    month: 3,
    day: 12,
    type: 'major',
    description: 'Commemorates the birthday of Prophet Muhammad ﷺ.',
    descriptionAr: 'إحياء ذكرى مولد النبي محمد ﷺ.',
    color: '#10B981',
  },
  {
    id: 'isra_miraj',
    nameEn: "Isra' wal Mi'raj",
    nameAr: 'الإسراء والمعراج',
    month: 7,
    day: 27,
    type: 'major',
    description: "The Night Journey and Ascension of Prophet Muhammad ﷺ.",
    descriptionAr: 'ليلة رحلة الإسراء والمعراج للنبي محمد ﷺ.',
    color: '#8B5CF6',
  },
  {
    id: 'mid_shaban',
    nameEn: 'Mid-Shaban',
    nameAr: 'ليلة النصف من شعبان',
    month: 8,
    day: 15,
    type: 'minor',
    description: 'The night when Allah descends to the lowest heaven and forgives many.',
    descriptionAr: 'الليلة التي ينزل فيها الله إلى السماء الدنيا ويغفر لكثير من عباده.',
    color: '#6366F1',
  },
  {
    id: 'ramadan_start',
    nameEn: 'Start of Ramadan',
    nameAr: 'بداية رمضان',
    month: 9,
    day: 1,
    duration: 30,
    type: 'major',
    description: 'The blessed month of fasting begins.',
    descriptionAr: 'بداية شهر الصيام المبارك.',
    color: '#059669',
  },
  {
    id: 'laylat_qadr',
    nameEn: 'Laylat al-Qadr',
    nameAr: 'ليلة القدر',
    month: 9,
    day: 27,
    type: 'major',
    description: 'The Night of Decree, better than a thousand months.',
    descriptionAr: 'ليلة القدر خير من ألف شهر.',
    color: '#F59E0B',
  },
  {
    id: 'eid_fitr',
    nameEn: 'Eid al-Fitr',
    nameAr: 'عيد الفطر',
    month: 10,
    day: 1,
    duration: 3,
    type: 'major',
    description: 'The Festival of Breaking the Fast, celebrating the end of Ramadan.',
    descriptionAr: 'عيد الفطر، الاحتفال بنهاية شهر رمضان المبارك.',
    color: '#10B981',
  },
  {
    id: 'arafah',
    nameEn: 'Day of Arafah',
    nameAr: 'يوم عرفة',
    month: 12,
    day: 9,
    type: 'fasting',
    description: 'Fasting on this day expiates sins of the previous and coming year.',
    descriptionAr: 'صيام هذا اليوم يكفّر ذنوب السنة الماضية والقادمة.',
    color: '#3B82F6',
  },
  {
    id: 'eid_adha',
    nameEn: 'Eid al-Adha',
    nameAr: 'عيد الأضحى',
    month: 12,
    day: 10,
    duration: 4,
    type: 'major',
    description: 'The Festival of Sacrifice, commemorating Ibrahim\'s willingness to sacrifice his son.',
    descriptionAr: 'عيد الأضحى، إحياء ذكرى استعداد إبراهيم عليه السلام للتضحية بابنه.',
    color: '#10B981',
  },
];

// Moon phase icons (emoji)
export const MOON_ICONS: Record<string, string> = {
  new: '🌑',
  waxing_crescent: '🌒',
  first_quarter: '🌓',
  waxing_gibbous: '🌔',
  full: '🌕',
  waning_gibbous: '🌖',
  last_quarter: '🌗',
  waning_crescent: '🌘',
};

// Fasting day labels
export const FASTING_LABELS = {
  monday: { en: 'Monday Fast', ar: 'صيام الإثنين' },
  thursday: { en: 'Thursday Fast', ar: 'صيام الخميس' },
  white_day: { en: 'White Day', ar: 'الأيام البيض' },
  ashura: { en: 'Ashura Fast', ar: 'صيام عاشوراء' },
  arafah: { en: 'Arafah Fast', ar: 'صيام عرفة' },
  shawwal: { en: 'Shawwal Fast', ar: 'صيام شوال' },
};

// White days (Ayyam al-Beed)
export const WHITE_DAYS = [13, 14, 15];

// Calendar colors
export const CALENDAR_COLORS = {
  light: {
    currentDay: '#059669',
    eventDay: '#D4AF37',
    fastingDay: '#3B82F6',
    whiteDay: '#8B5CF6',
    weekend: 'rgba(0,0,0,0.05)',
  },
  dark: {
    currentDay: '#34D399',
    eventDay: '#F59E0B',
    fastingDay: '#60A5FA',
    whiteDay: '#A78BFA',
    weekend: 'rgba(255,255,255,0.05)',
  },
};
