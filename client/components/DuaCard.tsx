/**
 * DuaCard Component
 * 
 * Displays a single dua in compact or full view.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';
import { Dua, CustomDua } from '@/types/dua';
import { FavoriteButton } from './FavoriteButton';

interface DuaCardProps {
  dua: Dua | CustomDua;
  variant?: 'compact' | 'full';
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  onPress?: () => void;
  onShare?: () => void;
  onPlayAudio?: () => void;
  isPlaying?: boolean;
  isAudioLoading?: boolean;
  showFavorite?: boolean;
  showAudio?: boolean;
  showShare?: boolean;
}

// Type guard to check if dua is a standard Dua (not CustomDua)
function isStandardDua(dua: Dua | CustomDua): dua is Dua {
  return 'source' in dua;
}

export function DuaCard({
  dua,
  variant = 'compact',
  isFavorite = false,
  onFavoriteToggle,
  onPress,
  onShare,
  onPlayAudio,
  isPlaying = false,
  isAudioLoading = false,
  showFavorite = true,
  showAudio = true,
  showShare = true,
}: DuaCardProps) {
  const { isDark, theme } = useTheme();
  const isCompact = variant === 'compact';
  const isStandard = isStandardDua(dua);

  // Get source text
  const getSourceText = (): string => {
    if (!isStandard) return 'Personal Dua';
    
    if (dua.source === 'quran' && dua.surahName && dua.ayahNumber) {
      return `${dua.surahName} ${dua.ayahNumber}`;
    }
    if (dua.source === 'hadith' && dua.hadithSource) {
      return dua.hadithSource;
    }
    return 'Islamic Supplication';
  };

  const content = (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? 'rgba(26, 95, 79, 0.2)' : Colors.light.backgroundDefault },
      isCompact && styles.compactContainer,
    ]}>
      {/* Header Row with Favorite Button */}
      {isCompact && showFavorite && onFavoriteToggle && (
        <View style={styles.compactHeader}>
          <View style={{ flex: 1 }} />
          <FavoriteButton 
            isFavorite={isFavorite} 
            onToggle={onFavoriteToggle}
            size={18}
          />
        </View>
      )}

      {/* Arabic Text */}
      <ThemedText 
        type="arabic" 
        style={[
          styles.arabicText,
          isCompact && styles.compactArabic,
          { fontFamily: 'AlMushafQuran' },
        ]}
      >
        {isStandard ? dua.textAr : dua.textAr || ''}
      </ThemedText>

      {/* Transliteration */}
      {(isStandard ? dua.transliteration : dua.transliteration) && (
        <ThemedText 
          type="small" 
          style={[styles.transliteration, isCompact && styles.compactText]}
          secondary
        >
          {isStandard ? dua.transliteration : dua.transliteration}
        </ThemedText>
      )}

      {/* Translation */}
      <ThemedText 
        type="body" 
        style={[styles.translation, isCompact && styles.compactText]}
        numberOfLines={isCompact ? 3 : undefined}
      >
        {isStandard ? dua.translation : dua.translation}
      </ThemedText>

      {/* Source Reference */}
      <View style={styles.sourceRow}>
        <View style={[
          styles.sourceBadge,
          { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)' }
        ]}>
          <Feather 
            name={isStandard && dua.source === 'quran' ? 'book-open' : 'bookmark'} 
            size={12} 
            color={isDark ? Colors.dark.primary : Colors.light.primary} 
          />
          <ThemedText 
            type="caption" 
            style={{ 
              marginLeft: 4, 
              color: isDark ? Colors.dark.primary : Colors.light.primary,
            }}
          >
            {getSourceText()}
          </ThemedText>
        </View>

        {/* Repetitions */}
        {isStandard && dua.repetitions && dua.repetitions > 1 && (
          <View style={[
            styles.repetitionBadge,
            { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(245, 158, 11, 0.1)' }
          ]}>
            <ThemedText 
              type="caption" 
              style={{ color: isDark ? '#FBBF24' : '#F59E0B' }}
            >
              ×{dua.repetitions}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Actions Row */}
      {!isCompact && (
        <View style={styles.actionsRow}>
          {showAudio && isStandard && dua.hasAudio && onPlayAudio && (
            <Pressable 
              onPress={onPlayAudio} 
              style={styles.actionButton}
              disabled={isAudioLoading}
            >
              {isAudioLoading ? (
                <Feather name="loader" size={20} color={theme.textSecondary} />
              ) : (
                <Feather 
                  name={isPlaying ? 'pause-circle' : 'play-circle'} 
                  size={20} 
                  color={isDark ? Colors.dark.primary : Colors.light.primary} 
                />
              )}
            </Pressable>
          )}

          {showShare && onShare && (
            <Pressable onPress={onShare} style={styles.actionButton}>
              <Feather name="share-2" size={20} color={theme.textSecondary} />
            </Pressable>
          )}

          {showFavorite && onFavoriteToggle && (
            <FavoriteButton 
              isFavorite={isFavorite} 
              onToggle={onFavoriteToggle}
              size={20}
            />
          )}
        </View>
      )}
    </View>
  );

  if (onPress && isCompact) {
    return (
      <Pressable 
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  compactContainer: {
    padding: Spacing.md,
  },
  arabicText: {
    fontSize: 24,
    lineHeight: 42,
    textAlign: 'right',
    marginBottom: Spacing.md,
  },
  compactArabic: {
    fontSize: 20,
    lineHeight: 36,
    marginBottom: Spacing.sm,
  },
  transliteration: {
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  translation: {
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  compactText: {
    marginBottom: Spacing.xs,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  repetitionBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
    gap: Spacing.md,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
});

export default DuaCard;
