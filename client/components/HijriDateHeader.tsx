/**
 * HijriDateHeader Component
 * 
 * Displays Hijri date prominently with Arabic/English month names,
 * moon phase indicator, and Gregorian date.
 * Optionally shows today's fasting status and next major event countdown.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { HijriDate, MoonPhase, FastingDay } from '../types/hijri';
import { EventWithDate } from '../services/IslamicEventsService';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';

const moon3D = require('../../assets/images/3d-images/moon.png');

interface HijriDateHeaderProps {
  hijriDate: HijriDate;
  gregorianDate: Date;
  moonPhase: MoonPhase;
  showGregorian?: boolean;
  showMoonPhase?: boolean;
  compact?: boolean;
  // New optional props for integrated display
  fastingInfo?: {
    todayFasting: FastingDay | null;
    isFastingProhibited: boolean;
  };
  nextEvent?: EventWithDate | null;
}

export const HijriDateHeader = React.memo(function HijriDateHeader({
  hijriDate,
  gregorianDate,
  moonPhase,
  showGregorian = true,
  showMoonPhase = true,
  compact = false,
  fastingInfo,
  nextEvent,
}: HijriDateHeaderProps) {
  const { isDark, theme } = useTheme();
  const { t, locale } = useTranslation();
  const isArabic = locale === 'ar';

  // Map app locale to BCP 47 locale tag for date formatting
  const dateLocaleMap: Record<string, string> = {
    en: 'en-US', ar: 'ar-SA', fr: 'fr-FR', de: 'de-DE', ru: 'ru-RU', zh: 'zh-CN',
    bn: 'bn-BD', tr: 'tr-TR', id: 'id-ID', ur: 'ur-PK',
  };
  const dateLocale = dateLocaleMap[locale] || 'en-US';

  const gregorianFormatted = gregorianDate.toLocaleDateString(dateLocale, {
    weekday: compact ? 'short' : 'long',
    year: 'numeric',
    month: compact ? 'short' : 'long',
    day: 'numeric',
  });

  // Use theme primary color for the header background
  // Always use white text with varying opacity for consistent readability across all themes
  const bgColor = theme.primary;
  const secondaryTextColor = 'rgba(255, 255, 255, 0.85)';
  const tertiaryTextColor = 'rgba(255, 255, 255, 0.7)';

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: bgColor }]}>
        {showMoonPhase && (
          <Image source={moon3D} style={{ width: 28, height: 28 }} contentFit="contain" transition={0} cachePolicy="memory" />
        )}
        <View style={styles.compactContent}>
          <Text style={styles.compactHijri}>
            {hijriDate.day} {t(`hijri.months.${hijriDate.month}`)} {hijriDate.year}
          </Text>
          {showGregorian && (
            <Text style={[styles.compactGregorian, { color: secondaryTextColor }]}>{gregorianFormatted}</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    /* Glowing shadow wrapper */
    <View style={{
      borderRadius: 16,
      shadowColor: '#5e9caa',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 10,
    }}>
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {/* 3D Moon */}
        {showMoonPhase && (
          <View style={styles.moonContainer}>
            <Image source={moon3D} style={{ width: 56, height: 56 }} contentFit="contain" transition={0} cachePolicy="memory" />
          </View>
        )}

        {/* Hijri date centered */}
        <Text style={styles.hijriDate}>
          {hijriDate.day} {t(`hijri.months.${hijriDate.month}`)} {hijriDate.year} {t('hijriCalendar.ah')}
        </Text>

        {/* Gregorian date */}
        {showGregorian && (
          <Text style={[styles.gregorianDate, { color: tertiaryTextColor }]}>{gregorianFormatted}</Text>
        )}

        {/* Integrated info badges */}
        {(fastingInfo || nextEvent) && (
          <View style={styles.infoSection}>
            {/* Fasting Status */}
            {fastingInfo?.isFastingProhibited && (
              <View style={[styles.infoBadge, styles.prohibitedBadge]}>
                <Text style={styles.infoBadgeText}>⚠️ {t('hijriCalendar.fastingProhibited')}</Text>
              </View>
            )}
            {fastingInfo?.todayFasting && !fastingInfo.isFastingProhibited && (
              <View style={[styles.infoBadge, styles.fastingBadge]}>
                <Text style={styles.infoBadgeText}>🌙 {t(`fastingLabels.${fastingInfo.todayFasting.type}`) || fastingInfo.todayFasting.label}</Text>
              </View>
            )}

            {/* Next Event Countdown */}
            {nextEvent && nextEvent.daysUntil > 0 && (
              <View style={[styles.infoBadge, styles.eventBadge]}>
                <Text style={styles.infoBadgeText}>
                  ⭐ {t(`islamicEvents.${nextEvent.id}`) || (isArabic ? nextEvent.nameAr : nextEvent.nameEn)}{' '}
                  {nextEvent.daysUntil < 7
                    ? t('countdown.inDays', { count: nextEvent.daysUntil })
                    : nextEvent.daysUntil < 30
                      ? t(Math.floor(nextEvent.daysUntil / 7) > 1 ? 'countdown.inWeeks' : 'countdown.inWeek', { count: Math.floor(nextEvent.daysUntil / 7) })
                      : t(Math.floor(nextEvent.daysUntil / 30) > 1 ? 'countdown.inMonths' : 'countdown.inMonth', { count: Math.floor(nextEvent.daysUntil / 30) })
                  }
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#065F46',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  moonContainer: {
    marginBottom: 8,
  },
  hijriDate: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  gregorianDate: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#065F46',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  compactContent: {
    marginLeft: 10,
  },
  compactHijri: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  compactGregorian: {
    fontSize: 11,
    color: '#A7F3D0',
    marginTop: 2,
  },
  // Integrated info badges
  infoSection: {
    marginTop: 12,
    width: '100%',
    gap: 6,
  },
  infoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  fastingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  prohibitedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  eventBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  infoBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
});
