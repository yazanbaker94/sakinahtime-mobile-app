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
  const { theme } = useTheme();
  const countdownText = islamicEventsService.getCountdownText(event.daysUntil);
  const isToday = event.daysUntil === 0;
  
  if (compact) {
    return (
      <View style={[
        styles.compactContainer, 
        { backgroundColor: isToday ? `${theme.primary}20` : `${theme.gold}20` }
      ]}>
        <Text style={styles.compactIcon}>🌙</Text>
        <Text style={[styles.compactText, { color: isToday ? theme.primary : theme.gold }]}>
          {event.nameEn} {countdownText.toLowerCase()}
        </Text>
      </View>
    );
  }
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: isToday ? `${theme.primary}20` : `${theme.gold}20` }
    ]}>
      <View style={[styles.iconContainer, { backgroundColor: `${theme.gold}4D` }]}>
        <Text style={styles.icon}>🌙</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.eventName, { color: isToday ? theme.primary : theme.gold }]}>
          {event.nameEn}
        </Text>
        <Text style={[styles.countdown, { color: isToday ? theme.primaryLight : theme.gold }]}>
          {countdownText}
        </Text>
        {event.description && !isToday && (
          <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={1}>
            {event.description}
          </Text>
        )}
      </View>
      <View style={styles.daysContainer}>
        <Text style={[styles.daysNumber, { color: isToday ? theme.primary : theme.gold }]}>
          {isToday ? '🎉' : event.daysUntil}
        </Text>
        {!isToday && <Text style={[styles.daysLabel, { color: theme.textSecondary }]}>days</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },
  countdown: {
    fontSize: 14,
    marginTop: 2,
  },
  description: {
    fontSize: 12,
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
  },
  daysLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '500',
  },
});
