/**
 * ReciterSelectionScreen
 * 
 * Full screen for selecting a Quran reciter for audio downloads.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { audioDownloadService } from '@/services/AudioDownloadService';
import { RECITERS } from '@/constants/offline';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ReciterSelectionRouteProp = RouteProp<RootStackParamList, 'ReciterSelection'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ReciterSelection'>;

export function ReciterSelectionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ReciterSelectionRouteProp>();
  const { isDark, theme } = useTheme();
  
  const { currentReciter, onSelect } = route.params;
  const [recitersWithDownloads, setRecitersWithDownloads] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load reciters with downloads
  useEffect(() => {
    const loadRecitersWithDownloads = async () => {
      const reciters = await audioDownloadService.getRecitersWithDownloads();
      setRecitersWithDownloads(reciters);
    };
    loadRecitersWithDownloads();
  }, []);

  const handleSelectReciter = (reciterId: string) => {
    onSelect(reciterId);
    navigation.goBack();
  };

  const filteredReciters = RECITERS.filter(reciter => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      reciter.nameEn.toLowerCase().includes(query) ||
      reciter.nameAr.includes(searchQuery)
    );
  });

  const renderReciterItem = ({ item: reciter }: { item: typeof RECITERS[0] }) => {
    const hasDownloads = recitersWithDownloads.includes(reciter.id);
    const isSelected = reciter.id === currentReciter;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.reciterItem,
          { 
            backgroundColor: isSelected 
              ? `${theme.primary}15`
              : theme.cardBackground,
            borderColor: isSelected ? theme.primary : 'transparent',
            borderWidth: isSelected ? 1 : 0,
            opacity: pressed ? 0.7 : 1,
          }
        ]}
        onPress={() => handleSelectReciter(reciter.id)}
      >
        <View style={[
          styles.reciterIcon,
          { backgroundColor: `${theme.primary}15` }
        ]}>
          <Feather name="mic" size={20} color={theme.primary} />
        </View>
        
        <View style={styles.reciterInfo}>
          <View style={styles.reciterNameRow}>
            <ThemedText 
              type="body" 
              style={{ 
                fontWeight: isSelected ? '700' : '500',
                flex: 1,
              }}
              numberOfLines={1}
            >
              {reciter.nameEn}
            </ThemedText>
            {hasDownloads && (
              <View style={[
                styles.downloadedBadge,
                { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.15)' }
              ]}>
                <Feather 
                  name="download" 
                  size={12} 
                  color={isDark ? '#60A5FA' : '#3B82F6'} 
                />
                <ThemedText 
                  type="caption" 
                  style={{ 
                    color: isDark ? '#60A5FA' : '#3B82F6',
                    marginLeft: 4,
                    fontSize: 10,
                  }}
                >
                  Downloaded
                </ThemedText>
              </View>
            )}
          </View>
          <ThemedText type="caption" secondary style={{ marginTop: 2 }}>
            {reciter.nameAr} • {reciter.style}
          </ThemedText>
        </View>

        {isSelected && (
          <View style={[
            styles.checkIcon,
            { backgroundColor: theme.primary }
          ]}>
            <Feather name="check" size={14} color="#fff" />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerContent}>
          <ThemedText type="h3" style={{ fontWeight: '700' }}>
            Select Reciter
          </ThemedText>
          <ThemedText type="caption" secondary>
            {RECITERS.length} reciters available
          </ThemedText>
        </View>
      </View>

      {/* Info Banner */}
      <View style={[
        styles.infoBanner,
        { backgroundColor: `${theme.primary}10` }
      ]}>
        <Feather name="info" size={16} color={theme.primary} />
        <ThemedText type="caption" style={{ color: theme.primary, marginLeft: Spacing.sm, flex: 1 }}>
          Reciters with the download badge have audio files saved on your device
        </ThemedText>
      </View>

      {/* Reciter List */}
      <FlatList
        data={filteredReciters}
        renderItem={renderReciterItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent, 
          { paddingBottom: insets.bottom + Spacing.xl }
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
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
  headerContent: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  reciterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  reciterIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  reciterInfo: {
    flex: 1,
  },
  reciterNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: Spacing.sm,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
});

export default ReciterSelectionScreen;
