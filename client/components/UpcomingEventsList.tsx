/**
 * UpcomingEventsList Component
 * 
 * List of upcoming Islamic events with countdowns and descriptions.
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { EventWithDate, islamicEventsService } from '../services/IslamicEventsService';

interface UpcomingEventsListProps {
  events: EventWithDate[];
  limit?: number;
  showDescriptions?: boolean;
}

function EventItem({ event, showDescription, isDark, theme, locale, t }: { event: EventWithDate; showDescription: boolean; isDark: boolean; theme: any; locale: string; t: (key: string, opts?: any) => string }) {
  const isArabic = locale === 'ar';

  // Locale-aware countdown text
  const getCountdownTextLocale = (daysUntil: number): string => {
    if (daysUntil === 0) return t('countdown.today');
    if (daysUntil === 1) return t('countdown.tomorrow');
    if (daysUntil < 7) return t('countdown.inDays', { count: daysUntil });
    if (daysUntil < 30) {
      const weeks = Math.floor(daysUntil / 7);
      return t(weeks > 1 ? 'countdown.inWeeks' : 'countdown.inWeek', { count: weeks });
    }
    const months = Math.floor(daysUntil / 30);
    return t(months > 1 ? 'countdown.inMonths' : 'countdown.inMonth', { count: months });
  };

  const countdownText = getCountdownTextLocale(event.daysUntil);
  const isToday = event.daysUntil === 0;
  const isTomorrow = event.daysUntil === 1;

  // Map app locale to BCP 47 locale tag for date formatting
  const dateLocaleMap: Record<string, string> = {
    en: 'en-US', ar: 'ar-SA', fr: 'fr-FR', de: 'de-DE', ru: 'ru-RU', zh: 'zh-CN',
    bn: 'bn-BD', tr: 'tr-TR', id: 'id-ID', ur: 'ur-PK',
  };
  const dateLocale = dateLocaleMap[locale] || 'en-US';

  return (
    <View style={[
      styles.eventItem,
      isToday && { backgroundColor: `${theme.primary}15`, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 8 }
    ]}>
      <View style={[styles.indicator, { backgroundColor: event.color || theme.gold }]} />
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={[styles.eventName, { color: isToday ? theme.primary : theme.text }]}>
            {t(`islamicEvents.${event.id}`) || (isArabic ? event.nameAr : event.nameEn)}
          </Text>
          <Text style={[
            styles.countdown,
            { color: theme.textSecondary },
            isToday && { color: theme.primary, fontWeight: '600' },
            isTomorrow && { color: theme.gold, fontWeight: '500' },
          ]}>
            {countdownText}
          </Text>
        </View>
        <Text style={[styles.eventDate, { color: theme.textSecondary }]}>
          {event.hijriDate.day} {t(`hijri.months.${event.hijriDate.month}`)} • {' '}
          {event.gregorianDate.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
        </Text>
        {showDescription && event.description && (
          <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
            {t(`islamicEvents.${event.id}_desc`) || (isArabic ? event.descriptionAr : event.description)}
          </Text>
        )}
      </View>
    </View>
  );
}

export function UpcomingEventsList({
  events,
  limit = 5,
  showDescriptions = true,
}: UpcomingEventsListProps) {
  const { isDark, theme } = useTheme();
  const { t, locale } = useTranslation();
  const displayEvents = events.slice(0, limit);

  if (displayEvents.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('upcomingEvents.noEvents')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.title, { color: theme.text }]}>{t('upcomingEvents.title')}</Text>
      <FlatList
        data={displayEvents}
        keyExtractor={(item) => `${item.id}-${item.hijriDate.year}`}
        renderItem={({ item }) => (
          <EventItem
            event={item}
            showDescription={showDescriptions}
            isDark={isDark}
            theme={theme}
            locale={locale}
            t={t}
          />
        )}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.border }]} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  eventItem: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  todayItem: {
    backgroundColor: '#F0FDF4',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  indicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  todayText: {
    color: '#065F46',
  },
  countdown: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
  },
  todayCountdown: {
    // Removed - now using theme.primary inline
  },
  tomorrowCountdown: {
    color: '#D97706',
    fontWeight: '500',
  },
  eventDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
