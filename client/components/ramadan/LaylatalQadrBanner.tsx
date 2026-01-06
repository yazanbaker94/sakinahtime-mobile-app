/**
 * LaylatalQadrBanner Component
 * Prominent banner for odd nights with Ibaadah checklist
 */

import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../hooks/useTheme';
import { useLaylatalQadr } from '../../hooks/useLaylatalQadr';
import { Spacing, BorderRadius } from '../../constants/theme';

interface LaylatalQadrBannerProps {
  onViewDuas?: () => void;
}

export function LaylatalQadrBanner({ onViewDuas }: LaylatalQadrBannerProps) {
  const { isDark } = useTheme();
  const {
    isLastTenNights,
    currentNight,
    isOddNight,
    daysUntilLastTen,
    ibaadahChecklist,
    specialDuas,
    toggleIbaadah,
  } = useLaylatalQadr();

  const [showChecklist, setShowChecklist] = useState(false);
  const [showDua, setShowDua] = useState(false);

  // Don't show if not in last 10 nights and more than 5 days away
  if (!isLastTenNights && daysUntilLastTen > 5) {
    return null;
  }

  const accentColor = isOddNight ? '#FBBF24' : '#A78BFA';
  const completedCount = ibaadahChecklist.filter(item => item.completed).length;
  const mainDua = specialDuas[0];

  // Countdown to last 10 nights
  if (!isLastTenNights) {
    return (
      <View style={[
        styles.countdownBanner,
        { backgroundColor: isDark ? 'rgba(167, 139, 250, 0.15)' : 'rgba(167, 139, 250, 0.1)' }
      ]}>
        <Feather name="star" size={20} color="#A78BFA" />
        <View style={styles.countdownText}>
          <ThemedText type="body" style={{ fontWeight: '600' }}>
            Last 10 Nights Coming
          </ThemedText>
          <ThemedText type="small" secondary>
            {daysUntilLastTen} day{daysUntilLastTen !== 1 ? 's' : ''} until the blessed nights begin
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: isOddNight 
          ? (isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.1)')
          : (isDark ? 'rgba(167, 139, 250, 0.15)' : 'rgba(167, 139, 250, 0.1)')
      }
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${accentColor}30` }]}>
            <Feather name="star" size={24} color={accentColor} />
          </View>
          <View>
            <ThemedText type="h4" style={{ color: accentColor }}>
              {isOddNight ? '✨ Blessed Night' : 'Last 10 Nights'}
            </ThemedText>
            <ThemedText type="small" secondary>
              Night {currentNight} of Ramadan
            </ThemedText>
          </View>
        </View>
        {isOddNight && (
          <View style={[styles.oddNightBadge, { backgroundColor: accentColor }]}>
            <ThemedText type="small" style={{ color: '#000', fontWeight: '700' }}>
              Odd Night
            </ThemedText>
          </View>
        )}
      </View>

      {/* Odd Night Special Message */}
      {isOddNight && (
        <View style={[styles.messageBox, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }]}>
          <ThemedText type="body" style={{ textAlign: 'center', fontStyle: 'italic' }}>
            "Seek Laylatul Qadr in the odd nights of the last ten nights of Ramadan"
          </ThemedText>
          <ThemedText type="caption" secondary style={{ textAlign: 'center', marginTop: 4 }}>
            — Prophet Muhammad ﷺ (Bukhari)
          </ThemedText>
        </View>
      )}

      {/* Ibaadah Checklist Toggle */}
      <Pressable 
        style={styles.checklistToggle}
        onPress={() => setShowChecklist(!showChecklist)}
      >
        <View style={styles.checklistHeader}>
          <Feather name="check-square" size={16} color={accentColor} />
          <ThemedText type="body" style={{ marginLeft: Spacing.sm, fontWeight: '600' }}>
            Tonight's Ibaadah
          </ThemedText>
        </View>
        <View style={styles.checklistProgress}>
          <ThemedText type="small" style={{ color: accentColor }}>
            {completedCount}/{ibaadahChecklist.length}
          </ThemedText>
          <Feather 
            name={showChecklist ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color={accentColor} 
          />
        </View>
      </Pressable>

      {/* Checklist Items */}
      {showChecklist && (
        <View style={styles.checklistItems}>
          {ibaadahChecklist.map((item) => (
            <Pressable
              key={item.id}
              style={styles.checklistItem}
              onPress={() => toggleIbaadah(item.id)}
            >
              <View style={[
                styles.checkbox,
                item.completed && { backgroundColor: accentColor, borderColor: accentColor }
              ]}>
                {item.completed && <Feather name="check" size={12} color="#fff" />}
              </View>
              <View style={styles.checklistItemText}>
                <ThemedText 
                  type="body" 
                  style={item.completed ? styles.completedText : undefined}
                >
                  {item.name}
                </ThemedText>
                <ThemedText type="caption" secondary>{item.nameAr}</ThemedText>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Special Dua Section */}
      <Pressable 
        style={styles.duaToggle}
        onPress={() => setShowDua(!showDua)}
      >
        <View style={styles.duaHeader}>
          <Feather name="book" size={16} color={accentColor} />
          <ThemedText type="body" style={{ marginLeft: Spacing.sm, fontWeight: '600' }}>
            Special Dua
          </ThemedText>
        </View>
        <Feather 
          name={showDua ? 'chevron-up' : 'chevron-down'} 
          size={16} 
          color={accentColor} 
        />
      </Pressable>

      {showDua && mainDua && (
        <View style={[styles.duaContent, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }]}>
          <ThemedText type="h3" style={styles.arabicText}>
            {mainDua.arabic}
          </ThemedText>
          <ThemedText type="body" style={styles.transliteration}>
            {mainDua.transliteration}
          </ThemedText>
          <ThemedText type="body" secondary style={styles.translation}>
            "{mainDua.translation}"
          </ThemedText>
          <ThemedText type="caption" secondary style={styles.reference}>
            {mainDua.reference}
          </ThemedText>
          
          {onViewDuas && (
            <Pressable 
              style={[styles.viewMoreButton, { borderColor: accentColor }]}
              onPress={onViewDuas}
            >
              <ThemedText type="small" style={{ color: accentColor }}>
                View All Duas
              </ThemedText>
              <Feather name="arrow-right" size={14} color={accentColor} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  countdownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  countdownText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  oddNightBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  messageBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  checklistToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checklistProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  checklistItems: {
    marginTop: Spacing.sm,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(128, 128, 128, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  checklistItemText: {
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  duaToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
    marginTop: Spacing.sm,
  },
  duaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duaContent: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  },
  arabicText: {
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 40,
    marginBottom: Spacing.md,
  },
  transliteration: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  translation: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  reference: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
});

export default LaylatalQadrBanner;
