/**
 * EventCountdown Component
 * 
 * Displays event name and days remaining with "Today" when event arrives.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { EventWithDate, islamicEventsService } from '../services/IslamicEventsService';

interface EventCountdownProps {
  event: EventWithDate;
  compact?: boolean;
}

export function EventCountdown({ event, compact = false }: EventCountdownProps) {
  const { isDark } = useTheme();
  const countdownText = islamicEventsService.getCountdownText(event.daysUntil);
  const isToday = event.daysUntil === 0;
  
  if (compact) {
    return (
      <View style={[
        styles.compactContainer, 
        { backgroundColor: isDark ? (isToday ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)') : (isToday ? '#D1FAE5' : '#FEF3C7') }
      ]}>
        <Text style={styles.compactIcon}>🌙</Text>
        <Text style={[styles.compactText, { color: isDark ? (isToday ? '#34D399' : '#FBBF24') : (isToday ? '#065F46' : '#92400E') }]}>
          {event.nameEn} {countdownText.toLowerCase()}
        </Text>
      </View>
    );
  }
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDark ? (isToday ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)') : (isToday ? '#D1FAE5' : '#FEF3C7') }
    ]}>
      <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.3)' : '#FCD34D' }]}>
        <Text style={styles.icon}>🌙</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.eventName, { color: isDark ? (isToday ? '#34D399' : '#FBBF24') : (isToday ? '#065F46' : '#92400E') }]}>
          {event.nameEn}
        </Text>
        <Text style={[styles.countdown, { color: isDark ? (isToday ? '#6EE7B7' : '#FCD34D') : (isToday ? '#047857' : '#B45309') }]}>
          {countdownText}
        </Text>
        {event.description && !isToday && (
          <Text style={[styles.description, { color: isDark ? '#9CA3AF' : '#92400E' }]} numberOfLines={1}>
            {event.description}
          </Text>
        )}
      </View>
      <View style={styles.daysContainer}>
        <Text style={[styles.daysNumber, { color: isDark ? (isToday ? '#34D399' : '#FBBF24') : (isToday ? '#065F46' : '#92400E') }]}>
          {isToday ? '🎉' : event.daysUntil}
        </Text>
        {!isToday && <Text style={[styles.daysLabel, { color: isDark ? '#9CA3AF' : '#B45309' }]}>days</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  todayContainer: {
    backgroundColor: '#D1FAE5',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FCD34D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  todayText: {
    color: '#065F46',
  },
  countdown: {
    fontSize: 14,
    color: '#B45309',
    marginTop: 2,
  },
  todaySubtext: {
    color: '#047857',
  },
  description: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 4,
    opacity: 0.8,
  },
  daysContainer: {
    alignItems: 'center',
    marginLeft: 12,
  },
  daysNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#92400E',
  },
  daysLabel: {
    fontSize: 10,
    color: '#B45309',
    textTransform: 'uppercase',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  compactIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  compactText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
});
