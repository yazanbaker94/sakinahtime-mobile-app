/**
 * HijriDateHeader Component
 * 
 * Displays Hijri date prominently with Arabic/English month names,
 * moon phase indicator, and Gregorian date.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HijriDate, MoonPhase } from '../types/hijri';
import { MoonPhaseIndicator } from './MoonPhaseIndicator';
import { useTheme } from '../hooks/useTheme';

interface HijriDateHeaderProps {
  hijriDate: HijriDate;
  gregorianDate: Date;
  moonPhase: MoonPhase;
  showGregorian?: boolean;
  showMoonPhase?: boolean;
  compact?: boolean;
}

export function HijriDateHeader({
  hijriDate,
  gregorianDate,
  moonPhase,
  showGregorian = true,
  showMoonPhase = true,
  compact = false,
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
      <View style={styles.mainRow}>
        {showMoonPhase && (
          <View style={styles.moonContainer}>
            <MoonPhaseIndicator phase={moonPhase} size="large" showIllumination isDark={isDark} />
          </View>
        )}
        <View style={styles.dateContainer}>
          <Text style={styles.hijriDay}>{hijriDate.day}</Text>
          <View style={styles.monthYear}>
            <Text style={styles.hijriMonth}>{hijriDate.monthNameEn}</Text>
            <Text style={[styles.hijriYear, { color: secondaryTextColor }]}>{hijriDate.year} AH</Text>
          </View>
        </View>
      </View>
      
      <Text style={[styles.arabicDate, { color: secondaryTextColor }]}>
        {hijriDate.day} {hijriDate.monthNameAr} {hijriDate.year} هـ
      </Text>
      
      {showGregorian && (
        <Text style={[styles.gregorianDate, { color: tertiaryTextColor }]}>{gregorianFormatted}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#065F46',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  moonContainer: {
    marginRight: 20,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  hijriDay: {
    fontSize: 56,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 12,
  },
  monthYear: {
    justifyContent: 'center',
  },
  hijriMonth: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  hijriYear: {
    fontSize: 16,
    color: '#A7F3D0',
    marginTop: 2,
  },
  arabicDate: {
    fontSize: 18,
    color: '#A7F3D0',
    fontFamily: 'System',
    marginBottom: 8,
  },
  gregorianDate: {
    fontSize: 14,
    color: '#6EE7B7',
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
});
