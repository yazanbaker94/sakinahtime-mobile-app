/**
 * DuaDetailScreen
 * 
 * Full dua view with audio player and actions.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Share, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Spacing } from '@/constants/theme';
import { useDuaCollection } from '@/hooks/useDuaCollection';
import { useDuaFavorites } from '@/hooks/useDuaFavorites';
import { useDuaAudio } from '@/hooks/useDuaAudio';
import { DuaCard } from '@/components/DuaCard';
import { DuaAudioPlayer } from '@/components/DuaAudioPlayer';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';

type DuaDetailRouteProp = RouteProp<RootStackParamList, 'DuaDetail'>;

/**
 * Format dua content for sharing
 * Property 12: Share Content Completeness
 */
export function formatDuaForShare(dua: {
  textAr: string;
  transliteration: string;
  translation: string;
  source?: string;
  surahName?: string;
  ayahNumber?: number;
  hadithSource?: string;
}, translatedMeaning?: string): string {
  const parts: string[] = [];

  // Arabic text
  parts.push(dua.textAr);
  parts.push('');

  // Transliteration
  parts.push(dua.transliteration);
  parts.push('');

  // Translation
  parts.push(translatedMeaning || dua.translation);
  parts.push('');

  // Source reference
  if (dua.source === 'quran' && dua.surahName && dua.ayahNumber) {
    parts.push(`📖 ${dua.surahName} ${dua.ayahNumber}`);
  } else if (dua.hadithSource) {
    parts.push(`📚 ${dua.hadithSource}`);
  }

  // App attribution
  parts.push('');
  parts.push('— Shared from SakinahTime');

  return parts.join('\n');
}

export function DuaDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<DuaDetailRouteProp>();
  const { isDark, theme } = useTheme();
  const { t } = useTranslation();

  const { duaId } = route.params;
  const { getDuaById } = useDuaCollection();
  const { isFavorite, toggleFavorite } = useDuaFavorites();
  const { isPlaying, isLoading, progress, duration, play, pause, error, currentDuaId } = useDuaAudio();

  const dua = getDuaById(duaId);

  const handleShare = useCallback(async () => {
    if (!dua) return;

    try {
      const translatedMeaning = t(`duaTranslations.${dua.id}`, { defaultValue: dua.translation });
      const message = formatDuaForShare(dua, translatedMeaning);
      await Share.share({ message });
    } catch (err) {
      console.error('Error sharing dua:', err);
    }
  }, [dua]);

  const handlePlayAudio = useCallback(async () => {
    if (!dua || !dua.audioUrl) return;

    if (isPlaying && currentDuaId === dua.id) {
      await pause();
    } else {
      await play(dua.id, dua.audioUrl);
    }
  }, [dua, isPlaying, currentDuaId, play, pause]);

  const handleNavigateToQuran = useCallback(() => {
    if (!dua || dua.source !== 'quran' || !dua.surahNumber || !dua.ayahNumber) return;

    // Navigate to Main tab navigator, then to QuranTab with params
    // First go back to main, then navigate to the Quran tab
    navigation.navigate('Main', {
      screen: 'QuranTab',
      params: {
        surahNumber: dua.surahNumber,
        ayahNumber: dua.ayahNumber,
      },
    } as any);
  }, [dua, navigation]);

  if (!dua) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="h3">{t('duaDetail.notFound')}</ThemedText>
        </View>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={theme.textSecondary} />
          <ThemedText type="body" secondary style={{ marginTop: Spacing.md }}>
            {t('duaDetail.notFoundMessage')}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const isCurrentlyPlaying = isPlaying && currentDuaId === dua.id;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable onPress={handleShare} style={styles.headerButton}>
            <Feather name="share-2" size={22} color={theme.text} />
          </Pressable>
          <Pressable onPress={() => toggleFavorite(dua.id)} style={styles.headerButton}>
            <Ionicons
              name={isFavorite(dua.id) ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite(dua.id) ? theme.primary : theme.text}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Dua Card */}
        <DuaCard
          dua={dua}
          variant="full"
          isFavorite={isFavorite(dua.id)}
          onFavoriteToggle={() => toggleFavorite(dua.id)}
          onShare={handleShare}
          onPlayAudio={dua.hasAudio ? handlePlayAudio : undefined}
          isPlaying={isCurrentlyPlaying}
          isAudioLoading={isLoading && currentDuaId === dua.id}
          showFavorite={false}
          showShare={false}
        />

        {/* Audio Player */}
        {dua.hasAudio && dua.audioUrl && (
          <View style={styles.audioSection}>
            <ThemedText type="small" style={{ marginBottom: Spacing.sm, fontWeight: '600' }}>
              {t('duaDetail.listenPronunciation')}
            </ThemedText>
            <DuaAudioPlayer
              isPlaying={isCurrentlyPlaying}
              isLoading={isLoading && currentDuaId === dua.id}
              progress={currentDuaId === dua.id ? progress : 0}
              duration={currentDuaId === dua.id ? duration : 0}
              onPlay={handlePlayAudio}
              onPause={pause}
              error={currentDuaId === dua.id ? error : null}
            />
          </View>
        )}

        {/* Quran Reference Link */}
        {dua.source === 'quran' && dua.surahNumber && dua.ayahNumber && (
          <Pressable
            onPress={handleNavigateToQuran}
            style={({ pressed }) => [
              styles.quranLink,
              {
                backgroundColor: `${theme.primary}15`,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather
              name="book-open"
              size={20}
              color={theme.primary}
            />
            <View style={styles.quranLinkText}>
              <ThemedText type="body" style={{ fontWeight: '600' }}>
                {t('duaDetail.viewInQuran')}
              </ThemedText>
              <ThemedText type="caption" secondary>
                {dua.surahName} - {t('duaDetail.ayah')} {dua.ayahNumber}
              </ThemedText>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={theme.textSecondary}
            />
          </Pressable>
        )}

        {/* Benefits/Occasion */}
        {dua.benefits && (
          <View style={styles.benefitsSection}>
            <ThemedText type="small" style={{ fontWeight: '600', marginBottom: Spacing.sm }}>
              {t('duaDetail.benefitsVirtues')}
            </ThemedText>
            <ThemedText type="body" secondary>
              {dua.benefits}
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioSection: {
    marginTop: Spacing.lg,
  },
  quranLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.lg,
  },
  quranLinkText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  benefitsSection: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
    borderRadius: 12,
  },
});

export default DuaDetailScreen;
