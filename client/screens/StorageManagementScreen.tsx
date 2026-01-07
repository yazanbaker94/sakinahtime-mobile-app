/**
 * StorageManagementScreen
 * 
 * Main screen for managing offline storage and downloads.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootStackNavigator';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { StorageOverview } from '@/components/StorageOverview';
import { StorageBreakdown } from '@/components/StorageBreakdown';
import { StorageSettingsCard } from '@/components/StorageSettingsCard';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { useOfflineSettings } from '@/hooks/useOfflineSettings';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { NetworkStatusBadge } from '@/components/NetworkStatusBadge';
import { StorageCategory } from '@/types/offline';
import { audioDownloadService } from '@/services/AudioDownloadService';

export function StorageManagementScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark, theme } = useTheme();
  const { isOnline, isWifi, lastOnline } = useNetworkStatus();
  
  const { storageInfo, isLoading, clearCache, refreshStorageInfo } = useOfflineStorage();
  const { settings, updateSettings, isLoading: settingsLoading } = useOfflineSettings();
  
  const [clearing, setClearing] = useState<StorageCategory | null>(null);

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
  }, []);

  const handleClearCache = async (category: StorageCategory) => {
    const categoryNames: Record<StorageCategory, string> = {
      audio: 'Quran Audio',
      tafsir: 'Tafsir',
      prayer: 'Prayer Times Cache',
      cache: 'Other Cache',
      all: 'All Cached Data',
    };

    Alert.alert(
      `Clear ${categoryNames[category]}?`,
      category === 'all' 
        ? 'This will remove all downloaded Quran audio and tafsir. You will need to re-download for offline use.'
        : `This will remove all ${categoryNames[category].toLowerCase()}. You may need to re-download for offline use.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setClearing(category);
            try {
              await clearCache(category);
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache. Please try again.');
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
            Loading storage info...
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
          Storage & Downloads
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
            Quick Actions
          </ThemedText>
          
          <View style={styles.actionsGrid}>
            <Pressable
              style={({ pressed }) => [
                styles.actionCard,
                { 
                  backgroundColor: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                  opacity: pressed ? 0.7 : 1,
                }
              ]}
              onPress={() => navigation.navigate('AudioDownload')}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <Feather name="headphones" size={20} color={isDark ? '#60A5FA' : '#3B82F6'} />
              </View>
              <ThemedText type="small" style={{ fontWeight: '500', marginTop: Spacing.xs }}>
                Manage Audio
              </ThemedText>
              <ThemedText type="caption" secondary>
                Download Quran
              </ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionCard,
                { 
                  backgroundColor: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)',
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
                  <View style={[styles.actionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                    <Feather name="trash-2" size={20} color={isDark ? '#F87171' : '#EF4444'} />
                  </View>
                  <ThemedText type="small" style={{ fontWeight: '500', marginTop: Spacing.xs }}>
                    Clear All
                  </ThemedText>
                  <ThemedText type="caption" secondary>
                    Free up space
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
              backgroundColor: `${theme.primary}26`,
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
            Refresh Storage Info
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
