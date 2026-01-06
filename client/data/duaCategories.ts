/**
 * Dua Categories Data
 * 
 * Defines the 12 main categories for organizing duas by occasion/theme.
 */

import { DuaCategory } from '@/types/dua';

export const duaCategories: DuaCategory[] = [
  {
    id: 'travel',
    titleEn: 'Travel',
    titleAr: 'السفر',
    icon: 'navigation',
    description: 'Duas for journeys and travel',
    count: 5,
  },
  {
    id: 'eating',
    titleEn: 'Eating & Drinking',
    titleAr: 'الطعام والشراب',
    icon: 'coffee',
    description: 'Duas before and after meals',
    count: 4,
  },
  {
    id: 'sleeping',
    titleEn: 'Sleeping & Waking',
    titleAr: 'النوم والاستيقاظ',
    icon: 'moon',
    description: 'Duas for sleep and waking up',
    count: 5,
  },
  {
    id: 'places',
    titleEn: 'Entering & Leaving',
    titleAr: 'الدخول والخروج',
    icon: 'home',
    description: 'Duas for entering/leaving places',
    count: 6,
  },
  {
    id: 'weather',
    titleEn: 'Weather & Nature',
    titleAr: 'الطقس والطبيعة',
    icon: 'cloud',
    description: 'Duas for rain, wind, thunder',
    count: 4,
  },
  {
    id: 'health',
    titleEn: 'Health & Healing',
    titleAr: 'الصحة والشفاء',
    icon: 'heart',
    description: 'Duas for sickness and recovery',
    count: 5,
  },
  {
    id: 'protection',
    titleEn: 'Protection',
    titleAr: 'الحماية',
    icon: 'shield',
    description: 'Duas for protection from harm',
    count: 16,
  },
  {
    id: 'gratitude',
    titleEn: 'Gratitude',
    titleAr: 'الشكر',
    icon: 'gift',
    description: 'Duas of thankfulness',
    count: 5,
  },
  {
    id: 'forgiveness',
    titleEn: 'Forgiveness',
    titleAr: 'الاستغفار',
    icon: 'refresh-cw',
    description: 'Duas seeking forgiveness',
    count: 12,
  },
  {
    id: 'guidance',
    titleEn: 'Guidance',
    titleAr: 'الهداية',
    icon: 'compass',
    description: 'Duas for guidance and wisdom',
    count: 18,
  },
  {
    id: 'family',
    titleEn: 'Family & Children',
    titleAr: 'الأسرة والأولاد',
    icon: 'users',
    description: 'Duas for family and offspring',
    count: 5,
  },
  {
    id: 'general',
    titleEn: 'General',
    titleAr: 'عامة',
    icon: 'star',
    description: 'General supplications',
    count: 12,
  },
];

// Special sections (not categories but separate tabs)
export const QURANIC_SECTION_ID = 'quranic';
export const PROPHETIC_SECTION_ID = 'prophetic';
