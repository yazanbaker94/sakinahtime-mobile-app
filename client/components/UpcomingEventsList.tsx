/**
 * UpcomingEventsList Component
 * 
 * List of upcoming Islamic events with countdowns and descriptions.
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { EventWithDate, islamicEventsService } from '../services/IslamicEventsService';

interface UpcomingEventsListProps {
  events: EventWithDate[];
  limit?: number;
  showDescriptions?: boolean;
}

function EventItem({ event, showDescription, isDark }: { event: EventWithDate; showDescription: boolean; isDark: boolean }) {
  const countdownText = islamicEventsService.getCountdownText(event.daysUntil);
  const isToday = event.daysUntil === 0;
  const isTomorrow = event.daysUntil === 1;
  
  return (
    <View style={[
      styles.eventItem, 
      isToday && { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#F0FDF4', marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 8 }
    ]}>
      <View style={[styles.indicator, { backgroundColor: event.color || '#D4AF37' }]} />
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={[styles.eventName, { color: isDark ? (isToday ? '#34D399' : '#F9FAFB') : (isToday ? '#065F46' : '#1F2937') }]}>
            {event.nameEn}
          </Text>
          <Text style={[
            styles.countdown,
            { color: isDark ? '#9CA3AF' : '#6B7280' },
            isToday && { color: isDark ? '#34D399' : '#059669', fontWeight: '600' },
            isTomorrow && { color: isDark ? '#FBBF24' : '#D97706', fontWeight: '500' },
          ]}>
            {countdownText}
          </Text>
        </View>
        <Text style={[styles.eventDate, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
          {event.hijriDate.day} {event.hijriDate.monthNameEn} • {' '}
          {event.gregorianDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        {showDescription && event.description && (
          <Text style={[styles.description, { color: isDark ? '#9CA3AF' : '#6B7280' }]} numberOfLines={2}>
            {event.description}
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
  const { isDark } = useTheme();
  const displayEvents = events.slice(0, limit);
  
  if (displayEvents.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
        <Text style={[styles.emptyText, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>No upcoming events</Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
      <Text style={[styles.title, { color: isDark ? '#F9FAFB' : '#1F2937' }]}>Upcoming Events</Text>
      <FlatList
        data={displayEvents}
        keyExtractor={(item) => `${item.id}-${item.hijriDate.year}`}
        renderItem={({ item }) => (
          <EventItem event={item} showDescription={showDescriptions} isDark={isDark} />
        )}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]} />}
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
    color: '#059669',
    fontWeight: '600',
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
