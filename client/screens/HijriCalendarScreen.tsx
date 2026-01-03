/**
 * HijriCalendarScreen
 * 
 * Main screen for the Hijri Calendar feature with date display,
 * event countdown, calendar grid, and upcoming events list.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useHijriDate } from '../hooks/useHijriDate';
import { useIslamicEvents } from '../hooks/useIslamicEvents';
import { useFastingDays } from '../hooks/useFastingDays';
import { HijriDateHeader } from '../components/HijriDateHeader';
import { EventCountdown } from '../components/EventCountdown';
import { CalendarGrid } from '../components/CalendarGrid';
import { UpcomingEventsList } from '../components/UpcomingEventsList';
import { FastingDayBadge } from '../components/FastingDayBadge';
import { FastingNotificationSettings } from '../components/FastingNotificationSettings';
import { CalendarDay } from '../types/hijri';

interface DayDetailModalProps {
  visible: boolean;
  day: CalendarDay | null;
  onClose: () => void;
  isDark: boolean;
}

function DayDetailModal({ visible, day, onClose, isDark }: DayDetailModalProps) {
  if (!day) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
          <Text style={[styles.modalTitle, { color: isDark ? '#F9FAFB' : '#1F2937' }]}>
            {day.hijriDate.day} {day.hijriDate.monthNameEn} {day.hijriDate.year}
          </Text>
          <Text style={[styles.modalSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            {day.gregorianDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          
          {day.event && (
            <View style={[styles.modalSection, { borderTopColor: isDark ? '#374151' : '#F3F4F6' }]}>
              <Text style={[styles.modalSectionTitle, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>Event</Text>
              <Text style={[styles.modalEventName, { color: isDark ? '#F9FAFB' : '#1F2937' }]}>{day.event.nameEn}</Text>
              <Text style={[styles.modalEventArabic, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{day.event.nameAr}</Text>
              {day.event.description && (
                <Text style={[styles.modalDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{day.event.description}</Text>
              )}
            </View>
          )}
          
          {day.fastingDay && (
            <View style={[styles.modalSection, { borderTopColor: isDark ? '#374151' : '#F3F4F6' }]}>
              <Text style={[styles.modalSectionTitle, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>Fasting</Text>
              <FastingDayBadge type={day.fastingDay.type} isDark={isDark} />
              <Text style={[styles.modalDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{day.fastingDay.label}</Text>
            </View>
          )}
          
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export function HijriCalendarScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useTheme();
  const { hijriDate, gregorianDate, moonPhase } = useHijriDate();
  const { upcomingEvents, nextMajorEvent } = useIslamicEvents();
  const { todayFasting, isFastingProhibited } = useFastingDays();
  
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleDayPress = useCallback((day: CalendarDay) => {
    setSelectedDay(day);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedDay(null);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F3F4F6', paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#111827' : '#F3F4F6'} />
      
      {/* Header with Back Button */}
      <View style={[styles.header, { backgroundColor: isDark ? '#111827' : '#F3F4F6' }]}>
        <Pressable 
          style={[styles.backButton, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]} 
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={isDark ? '#34D399' : '#065F46'} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? '#F9FAFB' : '#1F2937' }]}>Islamic Calendar</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hijri Date Header */}
        <HijriDateHeader
          hijriDate={hijriDate}
          gregorianDate={gregorianDate}
          moonPhase={moonPhase}
        />

        {/* Today's Fasting Status */}
        {todayFasting && !isFastingProhibited && (
          <View style={[styles.fastingBanner, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE' }]}>
            <Text style={[styles.fastingText, { color: isDark ? '#60A5FA' : '#1D4ED8' }]}>Today is a recommended fasting day</Text>
            <FastingDayBadge type={todayFasting.type} isDark={isDark} />
          </View>
        )}
        
        {isFastingProhibited && (
          <View style={[styles.prohibitedBanner, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' }]}>
            <Text style={[styles.prohibitedText, { color: isDark ? '#F87171' : '#DC2626' }]}>
              ⚠️ Fasting is prohibited today (Eid/Tashreeq)
            </Text>
          </View>
        )}

        {/* Next Major Event Countdown */}
        {nextMajorEvent && (
          <View style={styles.section}>
            <EventCountdown event={nextMajorEvent} />
          </View>
        )}

        {/* Calendar Grid */}
        <View style={styles.section}>
          <CalendarGrid
            month={hijriDate.month}
            year={hijriDate.year}
            onDayPress={handleDayPress}
          />
        </View>

        {/* Upcoming Events List */}
        <View style={styles.section}>
          <UpcomingEventsList events={upcomingEvents} limit={5} />
        </View>

        {/* Fasting Notification Settings */}
        <View style={styles.section}>
          <FastingNotificationSettings />
        </View>
      </ScrollView>

      {/* Day Detail Modal */}
      <DayDetailModal
        visible={modalVisible}
        day={selectedDay}
        onClose={handleCloseModal}
        isDark={isDark}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginTop: 16,
  },
  fastingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DBEAFE',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  fastingText: {
    fontSize: 14,
    color: '#1D4ED8',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  prohibitedBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  prohibitedText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  modalSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  modalEventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalEventArabic: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 20,
  },
  modalCloseButton: {
    backgroundColor: '#065F46',
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
