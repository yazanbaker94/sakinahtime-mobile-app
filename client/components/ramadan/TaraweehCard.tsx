/**
 * TaraweehCard Component
 * Displays tonight's Taraweeh status and quick log form
 */

import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { Card } from '../Card';
import { useTheme } from '../../hooks/useTheme';
import { useTaraweehTracker } from '../../hooks/useTaraweehTracker';
import { useRamadan } from '../../contexts/RamadanContext';
import { Spacing, BorderRadius } from '../../constants/theme';

interface TaraweehCardProps {
  onPress?: () => void;
}

export function TaraweehCard({ onPress }: TaraweehCardProps) {
  const { isDark } = useTheme();
  const { currentDay } = useRamadan();
  const { todayEntry, stats, logTaraweeh } = useTaraweehTracker();
  
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [selectedRakaat, setSelectedRakaat] = useState<8 | 20>(8);
  const [selectedLocation, setSelectedLocation] = useState<'mosque' | 'home'>('mosque');

  const accentColor = isDark ? '#A78BFA' : '#7C3AED';
  const streakColor = '#FBBF24';

  const handleQuickLog = async () => {
    if (!currentDay) return;
    
    await logTaraweeh({
      date: new Date(),
      hijriDay: currentDay,
      rakaat: selectedRakaat,
      location: selectedLocation,
    });
    setShowQuickLog(false);
  };

  return (
    <Card elevation={2} onPress={onPress}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(167, 139, 250, 0.15)' }]}>
          <Feather name="moon" size={20} color={accentColor} />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="h4">Taraweeh</ThemedText>
          <ThemedText type="caption" secondary>
            {stats.nightsCompleted}/{stats.totalNights} nights
          </ThemedText>
        </View>
        
        {/* Streak Badge */}
        {stats.currentStreak > 0 && (
          <View style={[styles.streakBadge, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
            <Feather name="zap" size={14} color={streakColor} />
            <ThemedText type="small" style={{ color: streakColor, fontWeight: '600', marginLeft: 4 }}>
              {stats.currentStreak}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Tonight's Status */}
      <View style={[
        styles.statusSection, 
        { backgroundColor: todayEntry 
          ? 'rgba(16, 185, 129, 0.1)' 
          : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') 
        }
      ]}>
        {todayEntry ? (
          <View style={styles.loggedStatus}>
            <View style={styles.loggedHeader}>
              <Feather name="check-circle" size={20} color="#10B981" />
              <ThemedText type="body" style={{ marginLeft: Spacing.sm, fontWeight: '600' }}>
                Logged Tonight
              </ThemedText>
            </View>
            <View style={styles.loggedDetails}>
              <View style={styles.detailItem}>
                <ThemedText type="caption" secondary>Rakaat</ThemedText>
                <ThemedText type="body" style={{ fontWeight: '600' }}>{todayEntry.rakaat}</ThemedText>
              </View>
              <View style={styles.detailItem}>
                <ThemedText type="caption" secondary>Location</ThemedText>
                <ThemedText type="body" style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                  {todayEntry.location}
                </ThemedText>
              </View>
            </View>
          </View>
        ) : showQuickLog ? (
          <View style={styles.quickLogForm}>
            <ThemedText type="body" style={{ fontWeight: '600', marginBottom: Spacing.md }}>
              Log Tonight's Taraweeh
            </ThemedText>
            
            {/* Rakaat Selection */}
            <View style={styles.selectionRow}>
              <ThemedText type="small" secondary>Rakaat:</ThemedText>
              <View style={styles.selectionButtons}>
                <Pressable
                  style={[
                    styles.selectionButton,
                    selectedRakaat === 8 && { backgroundColor: accentColor }
                  ]}
                  onPress={() => setSelectedRakaat(8)}
                >
                  <ThemedText 
                    type="small" 
                    style={{ color: selectedRakaat === 8 ? '#fff' : undefined }}
                  >
                    8
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.selectionButton,
                    selectedRakaat === 20 && { backgroundColor: accentColor }
                  ]}
                  onPress={() => setSelectedRakaat(20)}
                >
                  <ThemedText 
                    type="small" 
                    style={{ color: selectedRakaat === 20 ? '#fff' : undefined }}
                  >
                    20
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Location Selection */}
            <View style={styles.selectionRow}>
              <ThemedText type="small" secondary>Location:</ThemedText>
              <View style={styles.selectionButtons}>
                <Pressable
                  style={[
                    styles.selectionButton,
                    selectedLocation === 'mosque' && { backgroundColor: accentColor }
                  ]}
                  onPress={() => setSelectedLocation('mosque')}
                >
                  <ThemedText 
                    type="small" 
                    style={{ color: selectedLocation === 'mosque' ? '#fff' : undefined }}
                  >
                    Mosque
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.selectionButton,
                    selectedLocation === 'home' && { backgroundColor: accentColor }
                  ]}
                  onPress={() => setSelectedLocation('home')}
                >
                  <ThemedText 
                    type="small" 
                    style={{ color: selectedLocation === 'home' ? '#fff' : undefined }}
                  >
                    Home
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.formActions}>
              <Pressable 
                style={[styles.cancelButton, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
                onPress={() => setShowQuickLog(false)}
              >
                <ThemedText type="small">Cancel</ThemedText>
              </Pressable>
              <Pressable 
                style={[styles.saveButton, { backgroundColor: accentColor }]}
                onPress={handleQuickLog}
              >
                <Feather name="check" size={16} color="#fff" />
                <ThemedText type="small" style={{ color: '#fff', marginLeft: 4 }}>Save</ThemedText>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.notLoggedStatus} onPress={() => setShowQuickLog(true)}>
            <Feather name="plus-circle" size={20} color={accentColor} />
            <ThemedText type="body" style={{ marginLeft: Spacing.sm, color: accentColor }}>
              Log Tonight's Taraweeh
            </ThemedText>
          </Pressable>
        )}
      </View>

      {/* Stats Summary */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Feather name="home" size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <ThemedText type="small" secondary style={{ marginLeft: 4 }}>
            {stats.homeNights} home
          </ThemedText>
        </View>
        <View style={styles.statItem}>
          <Feather name="map-pin" size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <ThemedText type="small" secondary style={{ marginLeft: 4 }}>
            {stats.mosqueNights} mosque
          </ThemedText>
        </View>
        <View style={styles.statItem}>
          <Feather name="award" size={14} color={streakColor} />
          <ThemedText type="small" style={{ marginLeft: 4, color: streakColor }}>
            Best: {stats.bestStreak}
          </ThemedText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  statusSection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  loggedStatus: {},
  loggedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  loggedDetails: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  detailItem: {},
  notLoggedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  quickLogForm: {},
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  selectionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  cancelButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default TaraweehCard;
