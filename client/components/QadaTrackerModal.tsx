/**
 * QadaTrackerModal Component
 * Modal for managing Qada (makeup) prayers
 * Feature: prayer-log-statistics
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useTheme } from '../hooks/useTheme';
import { useQadaTracker } from '../hooks/useQadaTracker';
import { PrayerName, PRAYER_NAMES } from '../types/prayerLog';
import { Spacing, BorderRadius } from '../constants/theme';

interface QadaTrackerModalProps {
  visible: boolean;
  onClose: () => void;
}

const PRAYER_DISPLAY: Record<PrayerName, { nameEn: string; nameAr: string; icon: string }> = {
  Fajr: { nameEn: 'Fajr', nameAr: 'الفجر', icon: 'sunrise' },
  Dhuhr: { nameEn: 'Dhuhr', nameAr: 'الظهر', icon: 'sun' },
  Asr: { nameEn: 'Asr', nameAr: 'العصر', icon: 'cloud' },
  Maghrib: { nameEn: 'Maghrib', nameAr: 'المغرب', icon: 'sunset' },
  Isha: { nameEn: 'Isha', nameAr: 'العشاء', icon: 'moon' },
};

export function QadaTrackerModal({ visible, onClose }: QadaTrackerModalProps) {
  const { isDark, theme } = useTheme();
  const { qadaCounts, totalQada, logQadaPrayer, adjustQadaCount, loading } = useQadaTracker();
  const [editingPrayer, setEditingPrayer] = useState<PrayerName | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleLogQada = async (prayer: PrayerName) => {
    if (qadaCounts && qadaCounts[prayer] > 0) {
      await logQadaPrayer(prayer);
    }
  };

  const handleIncrement = async (prayer: PrayerName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (qadaCounts) {
      await adjustQadaCount(prayer, qadaCounts[prayer] + 1);
    }
  };

  const handleDecrement = async (prayer: PrayerName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (qadaCounts && qadaCounts[prayer] > 0) {
      await adjustQadaCount(prayer, qadaCounts[prayer] - 1);
    }
  };

  const handleStartEdit = (prayer: PrayerName) => {
    if (qadaCounts) {
      setEditingPrayer(prayer);
      setEditValue(String(qadaCounts[prayer]));
    }
  };

  const handleSaveEdit = async () => {
    if (editingPrayer) {
      const newValue = parseInt(editValue, 10);
      if (!isNaN(newValue) && newValue >= 0) {
        await adjustQadaCount(editingPrayer, newValue);
      }
      setEditingPrayer(null);
      setEditValue('');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ThemedView style={[
          styles.modalContainer,
          {
            backgroundColor: theme.backgroundDefault,
          }
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Feather name="rotate-ccw" size={20} color="#EF4444" />
              </View>
              <ThemedText type="h3">Qada Tracker</ThemedText>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          {/* Total summary */}
          <View style={[
            styles.totalCard,
            { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)' }
          ]}>
            <ThemedText type="h1" style={{ color: '#EF4444', fontWeight: '800' }}>
              {totalQada}
            </ThemedText>
            <ThemedText type="body" secondary>
              Total Qada prayers remaining
            </ThemedText>
          </View>

          {/* Hint banner */}
          <View style={[
            styles.hintBanner,
            { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)' }
          ]}>
            <Feather name="info" size={14} color="#3B82F6" />
            <ThemedText type="caption" style={{ color: '#3B82F6', flex: 1, marginLeft: 8 }}>
              Tap the count number on each prayer to edit it directly
            </ThemedText>
          </View>

          {/* Prayer list */}
          <ScrollView style={styles.prayerList} showsVerticalScrollIndicator={false}>
            {PRAYER_NAMES.map((prayer) => {
              const display = PRAYER_DISPLAY[prayer];
              const count = qadaCounts?.[prayer] || 0;
              const isEditing = editingPrayer === prayer;

              return (
                <View
                  key={prayer}
                  style={[
                    styles.prayerRow,
                    {
                      backgroundColor: theme.backgroundSecondary,
                    },
                  ]}
                >
                  <View style={styles.prayerInfo}>
                    <View style={[
                      styles.prayerIcon,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }
                    ]}>
                      <Feather
                        name={display.icon as any}
                        size={18}
                        color={theme.textSecondary}
                      />
                    </View>
                    <View>
                      <ThemedText type="body" style={{ fontWeight: '600' }}>
                        {display.nameEn}
                      </ThemedText>
                      <ThemedText type="caption" secondary style={{ fontFamily: 'AlMushafQuran' }}>
                        {display.nameAr}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.countControls}>
                    {isEditing ? (
                      <View style={styles.editContainer}>
                        <TextInput
                          style={[
                            styles.editInput,
                            {
                              color: theme.text,
                              borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                            },
                          ]}
                          value={editValue}
                          onChangeText={setEditValue}
                          keyboardType="number-pad"
                          autoFocus
                        />
                        <Pressable onPress={handleSaveEdit} style={styles.saveButton}>
                          <Feather name="check" size={18} color={theme.primary} />
                        </Pressable>
                      </View>
                    ) : (
                      <>
                        <Pressable
                          onPress={() => handleDecrement(prayer)}
                          disabled={count === 0 || loading}
                          style={({ pressed }) => [
                            styles.controlButton,
                            {
                              opacity: count === 0 ? 0.3 : 1,
                              backgroundColor: pressed ? 'rgba(239, 68, 68, 0.3)' : 'rgba(128, 128, 128, 0.2)',
                              transform: [{ scale: pressed ? 0.9 : 1 }],
                            }
                          ]}
                        >
                          <Feather name="minus" size={18} color="#EF4444" />
                        </Pressable>

                        <Pressable onPress={() => handleStartEdit(prayer)}>
                          <ThemedText type="h3" style={styles.countText}>
                            {count}
                          </ThemedText>
                        </Pressable>

                        <Pressable
                          onPress={() => handleIncrement(prayer)}
                          disabled={loading}
                          style={({ pressed }) => [
                            styles.controlButton,
                            {
                              backgroundColor: pressed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(128, 128, 128, 0.2)',
                              transform: [{ scale: pressed ? 0.9 : 1 }],
                            }
                          ]}
                        >
                          <Feather name="plus" size={18} color="#10B981" />
                        </Pressable>
                      </>
                    )}
                  </View>

                  {count > 0 && !isEditing && (
                    <Pressable
                      onPress={() => handleLogQada(prayer)}
                      style={[styles.logButton, { backgroundColor: theme.primary }]}
                    >
                      <Feather name="check" size={14} color="#fff" />
                      <ThemedText type="caption" style={{ color: '#fff', fontWeight: '600', marginLeft: 4 }}>
                        Log
                      </ThemedText>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Info text */}
          <View style={styles.infoContainer}>
            <Feather name="info" size={14} color={theme.textSecondary} />
            <ThemedText type="caption" secondary style={styles.infoText}>
              Tap the count to manually edit. Use "Log" when you complete a Qada prayer.
            </ThemedText>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    marginTop: 60, // Leave space at top for status bar feel
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  totalCard: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  prayerList: {
    flex: 1,
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  prayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  prayerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  countText: {
    minWidth: 40,
    textAlign: 'center',
    fontWeight: '700',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  editInput: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    padding: Spacing.xs,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginLeft: Spacing.sm,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  infoText: {
    flex: 1,
    lineHeight: 18,
  },
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
});

export default QadaTrackerModal;
