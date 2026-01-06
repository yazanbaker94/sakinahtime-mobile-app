/**
 * DuaOfTheDay Component
 * 
 * Featured dua card for the main screen.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import { Dua } from '@/types/dua';

interface DuaOfTheDayProps {
  dua: Dua;
  onPress: () => void;
}

export function DuaOfTheDay({ dua, onPress }: DuaOfTheDayProps) {
  const { isDark } = useTheme();

  // Get source text
  const getSourceText = (): string => {
    if (dua.source === 'quran' && dua.surahName && dua.ayahNumber) {
      return `${dua.surahName} ${dua.ayahNumber}`;
    }
    if (dua.source === 'hadith' && dua.hadithSource) {
      return dua.hadithSource;
    }
    return 'Islamic Supplication';
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { 
          backgroundColor: isDark 
            ? 'rgba(52, 211, 153, 0.15)' 
            : 'rgba(16, 185, 129, 0.1)',
          opacity: pressed ? 0.8 : 1,
        }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: isDark ? Colors.dark.primary : Colors.light.primary }
        ]}>
          <Feather name="sun" size={18} color="#fff" />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="body" style={{ fontWeight: '600' }}>
            Dua of the Day
          </ThemedText>
          <ThemedText type="caption" secondary>
            {getSourceText()}
          </ThemedText>
        </View>
        <Feather 
          name="chevron-right" 
          size={20} 
          color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} 
        />
      </View>

      {/* Arabic Preview */}
      <ThemedText 
        type="arabic" 
        style={[styles.arabicText, { fontFamily: 'AlMushafQuran' }]}
        numberOfLines={2}
      >
        {dua.textAr}
      </ThemedText>

      {/* Translation Preview */}
      <ThemedText 
        type="small" 
        secondary 
        style={styles.translation}
        numberOfLines={2}
      >
        {dua.translation}
      </ThemedText>

      {/* Tap hint */}
      <View style={styles.tapHint}>
        <ThemedText 
          type="caption" 
          style={{ color: isDark ? Colors.dark.primary : Colors.light.primary }}
        >
          Tap to read full dua
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  arabicText: {
    fontSize: 20,
    lineHeight: 36,
    textAlign: 'right',
    marginBottom: Spacing.sm,
  },
  translation: {
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  tapHint: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
  },
});

export default DuaOfTheDay;
