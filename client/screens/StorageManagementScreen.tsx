/**
 * StorageManagementScreen
 * 
 * Main screen for managing offline storage and downloads.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootStackNavigator';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import { StorageOverview } from '@/components/StorageOverview';
import { StorageBreakdown } from '@/components/StorageBreakdown';
import { StorageSettingsCard } from '@/components/StorageSettingsCard';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { useOfflineSettings } from '@/hooks/useOfflineSettings';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { NetworkStatusBadge } from '@/components/NetworkStatusBadge';
import { StorageCategory } from '@/types/offline';
import { audioDownloadService } from '@/services/AudioDownloadService';
import * as FileSystem from 'expo-file-system/legacy';

const WBW_DIR = `${FileSystem.documentDirectory}wbw/`;

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StorageManagementScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark, theme } = useTheme();
  const { t } = useTranslation();
  const { isOnline, isWifi, lastOnline } = useNetworkStatus();

  const { storageInfo, isLoading, clearCache, refreshStorageInfo } = useOfflineStorage();
  const { settings, updateSettings, isLoading: settingsLoading } = useOfflineSettings();

  const [clearing, setClearing] = useState<StorageCategory | null>(null);
  const [wbwSize, setWbwSize] = useState(0);
  const [wbwFileCount, setWbwFileCount] = useState(0);
  const [clearingWbw, setClearingWbw] = useState(false);

  const calculateWbwSize = useCallback(async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(WBW_DIR);
      if (!dirInfo.exists) {
        setWbwSize(0);
        setWbwFileCount(0);
        return;
      }
      const files = await FileSystem.readDirectoryAsync(WBW_DIR);
      let totalSize = 0;
      let count = 0;
      for (const file of files) {
        const fileInfo = await FileSystem.getInfoAsync(`${WBW_DIR}${file}`);
        if (fileInfo.exists && !fileInfo.isDirectory && fileInfo.size) {
          totalSize += fileInfo.size;
          count++;
        }
      }
      setWbwSize(totalSize);
      setWbwFileCount(count);
    } catch (e) {
      console.error('[StorageManagement] Failed to calculate WBW size:', e);
    }
  }, []);

  // Auto-cleanup orphaned files when screen loads
  useEffect(() => {
    const runCleanup = async () => {
      try {
        await audioDownloadService.cleanupOrphanedFiles();
        // Refresh storage info after cleanup
        refreshStorageInfo();
      } catch (error) {
        console.error('[StorageManagement] Auto-cleanup failed:', error);
      }
    };
    runCleanup();
    calculateWbwSize();
  }, []);

  const handleClearWbw = () => {
    if (wbwFileCount === 0) {
      Alert.alert(t('storage.wbwTitle'), t('storage.wbwNone'));
      return;
    }
    Alert.alert(
      t('storage.wbwClearTitle'),
      t('storage.wbwClearDesc', { size: formatBytes(wbwSize), count: wbwFileCount }),
      [
        { text: t('storageAlerts.cancel'), style: 'cancel' },
        {
          text: t('storageAlerts.clear'),
          style: 'destructive',
          onPress: async () => {
            setClearingWbw(true);
            try {
              const dirInfo = await FileSystem.getInfoAsync(WBW_DIR);
              if (dirInfo.exists) {
                await FileSystem.deleteAsync(WBW_DIR, { idempotent: true });
                await FileSystem.makeDirectoryAsync(WBW_DIR, { intermediates: true });
              }
              setWbwSize(0);
              setWbwFileCount(0);
              refreshStorageInfo();
            } catch (e) {
              Alert.alert(t('storageAlerts.error'), t('storageAlerts.failedToClear'));
            } finally {
              setClearingWbw(false);
            }
          },
        },
      ]
    );
  };

  const handleClearCache = async (category: StorageCategory) => {
    const categoryNameKeys: Record<StorageCategory, string> = {
      audio: 'storageAlerts.quranAudio',
      tafsir: 'storageAlerts.tafsir',
      prayer: 'storageAlerts.prayerTimesCache',
      cache: 'storageAlerts.otherCache',
      all: 'storageAlerts.allCachedData',
    };
    const categoryName = t(categoryNameKeys[category]);

    Alert.alert(
      t('storageAlerts.clearConfirm', { category: categoryName }),
      category === 'all'
        ? t('storageAlerts.clearAllDesc')
        : t('storageAlerts.clearCategoryDesc', { category: categoryName.toLowerCase() }),
      [
        { text: t('storageAlerts.cancel'), style: 'cancel' },
        {
          text: t('storageAlerts.clear'),
          style: 'destructive',
          onPress: async () => {
            setClearing(category);
            try {
              await clearCache(category);
            } catch (error) {
              Alert.alert(t('storageAlerts.error'), t('storageAlerts.failedToClear'));
            } finally {
              setClearing(null);
            }
          },
        },
      ]
    );
  };

  const handleCategoryPress = (category: StorageCategory) => {
    if (category === 'audio') {
      navigation.navigate('AudioDownload');
    } else {
      handleClearCache(category);
    }
  };

  if (isLoading || settingsLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText type="body" secondary style={{ marginTop: Spacing.md }}>
            {t('storage.loadingInfo')}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3" style={{ flex: 1 }}>
          {t('storage.title')}
        </ThemedText>
        <NetworkStatusBadge
          status={{ isConnected: isOnline, isWifi, lastOnline: lastOnline?.getTime() || null }}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Storage Overview */}
        {storageInfo && (
          <View style={styles.section}>
            <StorageOverview storageInfo={storageInfo} />
          </View>
        )}

        {/* Storage Breakdown */}
        {storageInfo && (
          <View style={styles.section}>
            <StorageBreakdown
              storageInfo={storageInfo}
              onCategoryPress={handleCategoryPress}
            />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText type="body" style={styles.sectionTitle}>
            {t('storage.quickActions')}
          </ThemedText>

          <View style={styles.actionsGrid}>
            <Pressable
              style={({ pressed }) => [
                styles.actionCard,
                {
                  backgroundColor: isDark ? 'rgba(96, 165, 250, 0.15)' : '#FFFFFF',
                  borderWidth: 0,
                  borderColor: 'transparent',
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 4,
                  opacity: pressed ? 0.7 : 1,
                }
              ]}
              onPress={() => navigation.navigate('AudioDownload')}
            >
              <Image source={require('../../assets/images/3d-images/Audio.png')} style={{ width: 40, height: 40 }} contentFit="contain" transition={0} cachePolicy="memory" />
              <ThemedText type="small" style={{ fontWeight: '500', marginTop: Spacing.xs }}>
                {t('storage.manageAudio')}
              </ThemedText>
              <ThemedText type="caption" secondary>
                {t('storage.downloadQuran')}
              </ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionCard,
                {
                  backgroundColor: isDark ? 'rgba(94, 156, 170, 0.15)' : '#FFFFFF',
                  borderWidth: 0,
                  borderColor: 'transparent',
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 4,
                  opacity: pressed ? 0.7 : 1,
                }
              ]}
              onPress={handleClearWbw}
              disabled={clearingWbw}
            >
              {clearingWbw ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <Image source={require('../../assets/images/3d-images/book.png')} style={{ width: 40, height: 40 }} contentFit="contain" transition={0} cachePolicy="memory" />
                  <ThemedText type="small" style={{ fontWeight: '500', marginTop: Spacing.xs }}>
                    {t('storage.wbwTitle')}
                  </ThemedText>
                  <ThemedText type="caption" secondary>
                    {wbwFileCount > 0 ? formatBytes(wbwSize) : t('storage.wbwNone')}
                  </ThemedText>
                </>
              )}
            </Pressable>
          </View>

          <View style={{ marginTop: Spacing.md }}>
            <Pressable
              style={({ pressed }) => [
                styles.actionCard,
                {
                  backgroundColor: isDark ? 'rgba(248, 113, 113, 0.15)' : '#FFFFFF',
                  borderWidth: 0,
                  borderColor: 'transparent',
                  shadowColor: '#EF4444',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 4,
                  opacity: pressed ? 0.7 : 1,
                }
              ]}
              onPress={() => handleClearCache('all')}
              disabled={clearing !== null}
            >
              {clearing === 'all' ? (
                <ActivityIndicator size="small" color={isDark ? '#F87171' : '#EF4444'} />
              ) : (
                <>
                  <Image source={require('../../assets/images/3d-images/Clear.png')} style={{ width: 40, height: 40 }} contentFit="contain" transition={0} cachePolicy="memory" />
                  <ThemedText type="small" style={{ fontWeight: '500', marginTop: Spacing.xs }}>
                    {t('storage.clearAll')}
                  </ThemedText>
                  <ThemedText type="caption" secondary>
                    {t('storage.freeUpSpace')}
                  </ThemedText>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <StorageSettingsCard
            settings={settings}
            onSettingsChange={updateSettings}
          />
        </View>

        {/* Refresh Button */}
        <Pressable
          style={({ pressed }) => [
            styles.refreshButton,
            {
              backgroundColor: isDark ? `${theme.primary}26` : '#FFFFFF',
              borderWidth: 0,
              borderColor: 'transparent',
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
              opacity: pressed ? 0.7 : 1,
            }
          ]}
          onPress={refreshStorageInfo}
        >
          <Feather
            name="refresh-cw"
            size={16}
            color={theme.primary}
          />
          <ThemedText
            type="small"
            style={{
              color: theme.primary,
              marginLeft: Spacing.xs,
              fontWeight: '500',
            }}
          >
            {t('storage.refreshInfo')}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
});

export default StorageManagementScreen;
