/**
 * HijriDateHeader Component
 * 
 * Displays Hijri date prominently with Arabic/English month names,
 * moon phase indicator, and Gregorian date.
 * Optionally shows today's fasting status and next major event countdown.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HijriDate, MoonPhase, FastingDay } from '../types/hijri';
import { EventWithDate } from '../services/IslamicEventsService';
import { MoonPhaseIndicator } from './MoonPhaseIndicator';
import { useTheme } from '../hooks/useTheme';

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

export function HijriDateHeader({
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

  const gregorianFormatted = gregorianDate.toLocaleDateString('en-US', {
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
          <MoonPhaseIndicator phase={moonPhase} size="small" isDark={isDark} />
        )}
        <View style={styles.compactContent}>
          <Text style={styles.compactHijri}>
            {hijriDate.day} {hijriDate.monthNameEn} {hijriDate.year}
          </Text>
          {showGregorian && (
            <Text style={[styles.compactGregorian, { color: secondaryTextColor }]}>{gregorianFormatted}</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Moon on top */}
      {showMoonPhase && (
        <View style={styles.moonContainer}>
          <MoonPhaseIndicator phase={moonPhase} size="medium" isDark={isDark} />
        </View>
      )}

      {/* Hijri date centered */}
      <Text style={styles.hijriDate}>
        {hijriDate.day} {hijriDate.monthNameEn} {hijriDate.year} AH
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
              <Text style={styles.infoBadgeText}>⚠️ Fasting prohibited today</Text>
            </View>
          )}
          {fastingInfo?.todayFasting && !fastingInfo.isFastingProhibited && (
            <View style={[styles.infoBadge, styles.fastingBadge]}>
              <Text style={styles.infoBadgeText}>🌙 {fastingInfo.todayFasting.label}</Text>
            </View>
          )}

          {/* Next Event Countdown */}
          {nextEvent && nextEvent.daysUntil > 0 && (
            <View style={[styles.infoBadge, styles.eventBadge]}>
              <Text style={styles.infoBadgeText}>
                ⭐ {nextEvent.nameEn} in {nextEvent.daysUntil} {nextEvent.daysUntil === 1 ? 'day' : 'days'}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

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
