/**
 * AudioDownloadScreen
 * 
 * Screen for managing Quran audio downloads.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, Alert, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { DownloadProgress } from '@/components/DownloadProgress';
import { SurahDownloadItem } from '@/components/SurahDownloadItem';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { useAudioDownload } from '@/hooks/useAudioDownload';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { audioDownloadService } from '@/services/AudioDownloadService';
import { SURAH_INFO, RECITERS, formatBytes, getEstimatedSurahSize, getTotalQuranSizeEstimate } from '@/constants/offline';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AudioDownload'>;

export function AudioDownloadScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { isDark, theme } = useTheme();
  const { isOnline, lastOnline } = useNetworkStatus();
  
  const [selectedReciter, setSelectedReciter] = useState(RECITERS[0].id);
  
  const {
    downloadedSurahs,
    downloadQueue,
    currentDownload,
    isLoading,
    isDownloading,
    pendingCount,
    downloadSurah,
    downloadAll,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    cancelAllDownloads,
    deleteSurah,
    deleteAll,
  } = useAudioDownload(selectedReciter);

  const reciterInfo = RECITERS.find(r => r.id === selectedReciter);
  const downloadedCount = downloadedSurahs.length;
  const totalSurahs = 114;
  const totalSize = getTotalQuranSizeEstimate();

  const handleReciterSelect = useCallback((reciterId: string) => {
    setSelectedReciter(reciterId);
  }, []);

  const openReciterSelection = useCallback(() => {
    navigation.navigate('ReciterSelection', {
      currentReciter: selectedReciter,
      onSelect: handleReciterSelect,
    });
  }, [navigation, selectedReciter, handleReciterSelect]);

  const surahList = useMemo(() => {
    return SURAH_INFO.map(surah => {
      const isDownloaded = downloadedSurahs.includes(surah.number);
      const queueItem = downloadQueue.find(
        item => item.surahNumber === surah.number
      );
      
      return {
        ...surah,
        isDownloaded,
        status: isDownloaded ? 'completed' : queueItem?.status || 'not_downloaded',
        progress: queueItem?.progress || 0,
        estimatedSize: getEstimatedSurahSize(surah.number),
      };
    });
  }, [downloadedSurahs, downloadQueue]);

  const handleDownloadAll = () => {
    if (!isOnline) {
      Alert.alert('Offline', 'You need an internet connection to download audio.');
      return;
    }

    const remaining = totalSurahs - downloadedCount;
    Alert.alert(
      'Download All Surahs',
      `This will download ${remaining} surahs (approximately ${formatBytes(totalSize - (downloadedCount * (totalSize / totalSurahs)))}). Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: downloadAll },
      ]
    );
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete All Audio',
      `This will remove all downloaded audio for ${reciterInfo?.nameEn}. You will need to re-download for offline playback.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteAll },
      ]
    );
  };

  const handleSurahDownload = async (surahNumber: number) => {
    if (!isOnline) {
      Alert.alert('Offline', 'You need an internet connection to download audio.');
      return;
    }
    await downloadSurah(surahNumber);
  };

  const renderSurahItem = ({ item }: { item: typeof surahList[0] }) => (
    <SurahDownloadItem
      surahNumber={item.number}
      surahNameEn={item.nameEn}
      surahNameAr={item.nameAr}
      status={item.status as any}
      progress={item.progress}
      size={item.estimatedSize}
      onDownload={() => handleSurahDownload(item.number)}
      onPause={() => {
        const queueItem = downloadQueue.find(q => q.surahNumber === item.number);
        if (queueItem) pauseDownload(queueItem.id);
      }}
      onResume={() => {
        const queueItem = downloadQueue.find(q => q.surahNumber === item.number);
        if (queueItem) resumeDownload(queueItem.id);
      }}
      onDelete={() => {
        Alert.alert(
          'Delete Audio',
          `Delete downloaded audio for ${item.nameEn}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Delete', 
              style: 'destructive',
              onPress: () => deleteSurah(item.number)
            },
          ]
        );
      }}
    />
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3" style={{ flex: 1 }}>
          Audio Downloads
        </ThemedText>
      </View>

      {/* Offline Indicator */}
      {!isOnline && (
        <View style={styles.offlineContainer}>
          <OfflineIndicator isOffline={!isOnline} lastSync={lastOnline} />
        </View>
      )}

      {/* Reciter Selector */}
      <Pressable
        style={[
          styles.reciterSelector,
          { backgroundColor: theme.cardBackground }
        ]}
        onPress={openReciterSelection}
      >
        <View style={styles.reciterInfo}>
          <View style={[
            styles.reciterIcon,
            { backgroundColor: `${theme.primary}15` }
          ]}>
            <Feather name="mic" size={20} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="caption" secondary>Reciter</ThemedText>
            <ThemedText type="body" style={{ fontWeight: '600' }} numberOfLines={1}>
              {reciterInfo?.nameEn}
            </ThemedText>
          </View>
        </View>
        <Feather 
          name="chevron-right" 
          size={20} 
          color={theme.textSecondary} 
        />
      </Pressable>

      {/* Progress Summary */}
      <View style={[
        styles.progressSummary,
        { backgroundColor: theme.cardBackground }
      ]}>
        <View style={styles.progressInfo}>
          <ThemedText type="h2" style={{ color: theme.primary }}>
            {downloadedCount}
          </ThemedText>
          <ThemedText type="caption" secondary>
            of {totalSurahs} surahs downloaded
          </ThemedText>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${(downloadedCount / totalSurahs) * 100}%`,
                backgroundColor: theme.primary,
              }
            ]} 
          />
        </View>
      </View>

      {/* Current Download */}
      {currentDownload && (
        <View style={styles.currentDownload}>
          <DownloadProgress
            item={currentDownload}
            onPause={() => pauseDownload(currentDownload.id)}
            onResume={() => resumeDownload(currentDownload.id)}
            onCancel={() => cancelDownload(currentDownload.id)}
          />
        </View>
      )}

      {/* Batch Actions */}
      <View style={styles.batchActions}>
        {pendingCount > 0 || isDownloading ? (
          // Show Cancel All when downloading
          <Pressable
            style={({ pressed }) => [
              styles.batchButton,
              { 
                backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                opacity: pressed ? 0.7 : 1,
              }
            ]}
            onPress={() => {
              Alert.alert(
                'Cancel Downloads',
                'Cancel all pending downloads? Partially downloaded surahs will be removed.',
                [
                  { text: 'Keep Downloading', style: 'cancel' },
                  { text: 'Cancel All', style: 'destructive', onPress: cancelAllDownloads },
                ]
              );
            }}
          >
            <Feather name="x-circle" size={18} color={isDark ? '#FBBF24' : '#F59E0B'} />
            <ThemedText 
              type="small" 
              style={{ 
                color: isDark ? '#FBBF24' : '#F59E0B',
                marginLeft: Spacing.xs,
                fontWeight: '600',
              }}
            >
              Cancel All
            </ThemedText>
          </Pressable>
        ) : (
          // Show Download All when not downloading
          <Pressable
            style={({ pressed }) => [
              styles.batchButton,
              { 
                backgroundColor: `${theme.primary}15`,
                opacity: pressed || !isOnline || downloadedCount === totalSurahs ? 0.5 : 1,
              }
            ]}
            onPress={handleDownloadAll}
            disabled={!isOnline || downloadedCount === totalSurahs}
          >
            <Feather name="download-cloud" size={18} color={theme.primary} />
            <ThemedText 
              type="small" 
              style={{ 
                color: theme.primary,
                marginLeft: Spacing.xs,
                fontWeight: '600',
              }}
            >
              Download All
            </ThemedText>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.batchButton,
            { 
              backgroundColor: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)',
              opacity: pressed || downloadedCount === 0 ? 0.5 : 1,
            }
          ]}
          onPress={handleDeleteAll}
          disabled={downloadedCount === 0}
        >
          <Feather name="trash-2" size={18} color={isDark ? '#F87171' : '#EF4444'} />
          <ThemedText 
            type="small" 
            style={{ 
              color: isDark ? '#F87171' : '#EF4444',
              marginLeft: Spacing.xs,
              fontWeight: '600',
            }}
          >
            Delete All
          </ThemedText>
        </Pressable>
      </View>

      {/* Pending Queue Info */}
      {pendingCount > 0 && (
        <View style={styles.queueInfo}>
          <Feather name="clock" size={14} color={theme.textSecondary} />
          <ThemedText type="caption" secondary style={{ marginLeft: 4 }}>
            {pendingCount} surah{pendingCount > 1 ? 's' : ''} in queue
          </ThemedText>
        </View>
      )}

      {/* Surah List */}
      <FlatList
        data={surahList}
        renderItem={renderSurahItem}
        keyExtractor={item => item.number.toString()}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      />
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
  },
  offlineContainer: {
    paddingHorizontal: Spacing.lg,
  },
  reciterSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  reciterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reciterIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  progressSummary: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  currentDownload: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  batchActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  batchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  queueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
});

export default AudioDownloadScreen;
