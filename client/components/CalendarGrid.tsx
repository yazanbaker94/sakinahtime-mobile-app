/**
 * CalendarGrid Component
 * 
 * Monthly calendar grid view with events, fasting days, and swipe navigation.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { HijriDate, CalendarDay, IslamicEvent, FastingDay } from '../types/hijri';
import { hijriDateService } from '../services/HijriDateService';
import { islamicEventsService } from '../services/IslamicEventsService';
import { fastingDayService } from '../services/FastingDayService';

interface CalendarGridProps {
  month: number;
  year: number;
  onDayPress?: (day: CalendarDay) => void;
  onMonthChange?: (month: number, year: number) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_SIZE = Math.floor((SCREEN_WIDTH - 48) / 7);

function CalendarLegend({ isDark }: { isDark: boolean }) {
  return (
    <View style={[styles.legend, { borderTopColor: isDark ? '#374151' : '#F3F4F6' }]}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: '#D4AF37' }]} />
        <Text style={[styles.legendText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Event</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
        <Text style={[styles.legendText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Fasting</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
        <Text style={[styles.legendText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>White Day</Text>
      </View>
    </View>
  );
}

export function CalendarGrid({
  month: initialMonth,
  year: initialYear,
  onDayPress,
  onMonthChange,
}: CalendarGridProps) {
  const { isDark } = useTheme();
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);

  const today = useMemo(() => hijriDateService.getCurrentHijriDate(), []);

  const calendarDays = useMemo((): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const daysInMonth = hijriDateService.getDaysInMonth(month, year);
    const monthEvents = islamicEventsService.getEventsForMonth(month, year);
    const monthFastingDays = fastingDayService.getFastingDaysForMonth(month, year);

    // Get first day of month to determine starting weekday
    const firstDayHijri: HijriDate = {
      day: 1,
      month,
      year,
      monthNameAr: hijriDateService.getMonthName(month, 'ar'),
      monthNameEn: hijriDateService.getMonthName(month, 'en'),
    };
    const firstDayGregorian = hijriDateService.toGregorian(firstDayHijri);
    const startingWeekday = firstDayGregorian.getDay();

    // Add empty days for padding
    for (let i = 0; i < startingWeekday; i++) {
      days.push({
        hijriDate: { day: 0, month: 0, year: 0, monthNameAr: '', monthNameEn: '' },
        gregorianDate: new Date(0),
        isToday: false,
        isCurrentMonth: false,
      });
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const hijriDate: HijriDate = {
        day,
        month,
        year,
        monthNameAr: hijriDateService.getMonthName(month, 'ar'),
        monthNameEn: hijriDateService.getMonthName(month, 'en'),
      };
      const gregorianDate = hijriDateService.toGregorian(hijriDate);
      
      const event = monthEvents.find(e => e.day === day);
      const fastingDay = monthFastingDays.find(f => f.hijriDate.day === day);
      
      const isToday = today.day === day && today.month === month && today.year === year;

      days.push({
        hijriDate,
        gregorianDate,
        isToday,
        isCurrentMonth: true,
        event,
        fastingDay,
      });
    }

    return days;
  }, [month, year, today]);

  const navigateMonth = useCallback((direction: 1 | -1) => {
    let newMonth = month + direction;
    let newYear = year;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setMonth(newMonth);
    setYear(newYear);
    onMonthChange?.(newMonth, newYear);
  }, [month, year, onMonthChange]);

  const handleDayPress = useCallback((day: CalendarDay) => {
    if (day.isCurrentMonth && onDayPress) {
      onDayPress(day);
    }
  }, [onDayPress]);

  const monthName = hijriDateService.getMonthName(month, 'en');

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
      {/* Month Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateMonth(-1)} style={[styles.navButton, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
          <Text style={[styles.navText, { color: isDark ? '#F9FAFB' : '#374151' }]}>‹</Text>
        </TouchableOpacity>
        <View style={styles.monthTitle}>
          <Text style={[styles.monthName, { color: isDark ? '#F9FAFB' : '#1F2937' }]}>{monthName} {year}</Text>
          <Text style={[styles.monthNameAr, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            {hijriDateService.getMonthName(month, 'ar')}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigateMonth(1)} style={[styles.navButton, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
          <Text style={[styles.navText, { color: isDark ? '#F9FAFB' : '#374151' }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day, index) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={[
              styles.weekdayText,
              { color: isDark ? '#6B7280' : '#9CA3AF' },
              index === 5 && { color: isDark ? '#34D399' : '#059669' }, // Friday
            ]}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Days */}
      <View style={styles.daysGrid}>
        {calendarDays.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayCell,
              day.isToday && styles.todayCell,
              !day.isCurrentMonth && styles.emptyCell,
            ]}
            onPress={() => handleDayPress(day)}
            disabled={!day.isCurrentMonth}
          >
            {day.isCurrentMonth && (
              <>
                <Text style={[
                  styles.dayNumber,
                  { color: isDark ? '#F9FAFB' : '#1F2937' },
                  day.isToday && styles.todayNumber,
                ]}>
                  {day.hijriDate.day}
                </Text>
                <View style={styles.indicators}>
                  {day.event && (
                    <View style={[styles.indicator, { backgroundColor: day.event.color || '#D4AF37' }]} />
                  )}
                  {day.fastingDay && day.fastingDay.type === 'white_day' && (
                    <View style={[styles.indicator, { backgroundColor: '#8B5CF6' }]} />
                  )}
                  {day.fastingDay && day.fastingDay.type !== 'white_day' && (
                    <View style={[styles.indicator, { backgroundColor: '#3B82F6' }]} />
                  )}
                </View>
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <CalendarLegend isDark={isDark} />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  navText: {
    fontSize: 24,
    color: '#374151',
    fontWeight: '600',
  },
  monthTitle: {
    alignItems: 'center',
  },
  monthName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  monthNameAr: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    width: DAY_SIZE,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  fridayText: {
    color: '#059669',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DAY_SIZE / 2,
  },
  todayCell: {
    backgroundColor: '#059669',
  },
  emptyCell: {
    opacity: 0,
  },
  dayNumber: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  todayNumber: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  indicators: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 4,
    gap: 2,
  },
  indicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
