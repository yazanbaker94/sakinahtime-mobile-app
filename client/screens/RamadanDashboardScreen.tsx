/**
 * RamadanDashboardScreen
 * Main dashboard for Ramadan Mode features
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import {
  RamadanCountdown,
  LaylatalQadrBanner,
  SuhoorIftarCard,
  QuranProgressCard,
  TaraweehCard,
  CharityCard,
} from '@/components/ramadan';
import { useTheme } from '@/hooks/useTheme';
import { useRamadan } from '@/contexts/RamadanContext';
import { Spacing } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/RootStackNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RamadanDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { isRamadan } = useRamadan();

  // If not Ramadan, show a message
  if (!isRamadan) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.notRamadanContainer, { paddingTop: insets.top + Spacing.xl }]}>
          <Feather name="moon" size={64} color={isDark ? '#6B7280' : '#9CA3AF'} />
          <ThemedText type="h3" style={styles.notRamadanTitle}>
            Ramadan Mode
          </ThemedText>
          <ThemedText type="body" secondary style={styles.notRamadanText}>
            Ramadan Mode will automatically activate during the blessed month of Ramadan.
          </ThemedText>
          <ThemedText type="small" secondary style={styles.notRamadanSubtext}>
            Check back when Ramadan begins to access Suhoor/Iftar times, Quran reading schedules, Taraweeh tracking, and more.
          </ThemedText>
          <Pressable
            style={[styles.backButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={16} color="#fff" />
            <ThemedText type="body" style={{ color: '#fff', marginLeft: Spacing.xs }}>
              Go Back
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  const handleOpenMushaf = (page: number) => {
    // Navigate directly to the specific page in QuranTab
    navigation.navigate('Main', { 
      screen: 'QuranTab', 
      params: { page } 
    } as any);
  };

  const handleNavigateToQuranSchedule = () => {
    navigation.navigate('QuranSchedule');
  };

  const handleNavigateToTaraweeh = () => {
    navigation.navigate('TaraweehTracker');
  };

  const handleNavigateToCharity = () => {
    navigation.navigate('CharityTracker');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButtonSmall}>
            <Feather name="arrow-left" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="h2" style={styles.title}>Ramadan</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Ramadan Countdown */}
        <RamadanCountdown />

        {/* Laylatul Qadr Banner (shows during last 10 nights or close to it) */}
        <LaylatalQadrBanner />

        {/* Suhoor & Iftar Card */}
        <SuhoorIftarCard />

        {/* Quran Progress Card */}
        <View style={styles.cardWrapper}>
          <QuranProgressCard 
            onPress={handleNavigateToQuranSchedule}
            onOpenMushaf={handleOpenMushaf}
          />
        </View>

        {/* Taraweeh Card */}
        <View style={styles.cardWrapper}>
          <TaraweehCard onPress={handleNavigateToTaraweeh} />
        </View>

        {/* Charity Card */}
        <View style={styles.cardWrapper}>
          <CharityCard 
            onPress={handleNavigateToCharity}
            onAddEntry={handleNavigateToCharity}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  backButtonSmall: {
    padding: Spacing.xs,
  },
  title: {
    fontWeight: '700',
  },
  cardWrapper: {
    marginBottom: Spacing.md,
  },
  notRamadanContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  notRamadanTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  notRamadanText: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  notRamadanSubtext: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
});
