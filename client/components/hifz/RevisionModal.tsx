/**
 * RevisionModal
 * Modal for displaying due revisions and managing revision sessions
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useRevisionSchedule } from '../../hooks/useRevisionSchedule';
import { ThemedText } from '../ThemedText';
import { HIFZ_ACTIVE_COLOR } from '../../constants/hifz';
import type { RevisionEntry, VerseKey } from '../../types/hifz';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RevisionModalProps {
  visible: boolean;
  onClose: () => void;
  onStartRevision?: (verseKey: VerseKey) => void;
}

export function RevisionModal({
  visible,
  onClose,
  onStartRevision,
}: RevisionModalProps) {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useTheme();
  const {
    dueRevisions,
    todayRevisions,
    recordRevision,
    getTodayCompletedCount,
    getDailyGoal,
  } = useRevisionSchedule();

  const [selectedRevision, setSelectedRevision] = useState<RevisionEntry | null>(null);
  const [showRating, setShowRating] = useState(false);

  const activeColor = isDark ? HIFZ_ACTIVE_COLOR.dark : HIFZ_ACTIVE_COLOR.light;
  const todayCompleted = getTodayCompletedCount();
  const dailyGoal = getDailyGoal();
  const progressPercent = Math.min((todayCompleted / dailyGoal) * 100, 100);

  const handleStartRevision = useCallback((revision: RevisionEntry) => {
    setSelectedRevision(revision);
    onStartRevision?.(revision.verseKey);
  }, [onStartRevision]);

  const handleRateRevision = useCallback(async (quality: number) => {
    if (selectedRevision) {
      await recordRevision(selectedRevision.verseKey, quality);
      setSelectedRevision(null);
      setShowRating(false);
    }
  }, [selectedRevision, recordRevision]);

  const renderRevisionItem = (revision: RevisionEntry, index: number) => {
    const daysSinceRevision = Math.floor(
      (Date.now() - revision.lastRevision) / (1000 * 60 * 60 * 24)
    );
    const isOverdue = daysSinceRevision > revision.interval;

    return (
      <TouchableOpacity
        key={revision.verseKey}
        onPress={() => handleStartRevision(revision)}
        style={[
          styles.revisionItem,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
        ]}
      >
        <View style={styles.revisionInfo}>
          <ThemedText style={styles.verseKey}>{revision.verseKey}</ThemedText>
          <View style={styles.revisionMeta}>
            <View style={[styles.metaTag, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="clock" size={12} color={theme.textSecondary} />
              <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                {daysSinceRevision}d ago
              </ThemedText>
            </View>
            <View
              style={[
                styles.metaTag,
                { backgroundColor: isOverdue ? '#FEE2E2' : '#DCFCE7' },
              ]}
            >
              <ThemedText
                style={[
                  styles.metaText,
                  { color: isOverdue ? '#EF4444' : '#10B981' },
                ]}
              >
                {isOverdue ? 'Overdue' : 'Due'}
              </ThemedText>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleStartRevision(revision)}
          style={[styles.startButton, { backgroundColor: activeColor }]}
        >
          <Feather name="play" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderQualityButton = (quality: number, label: string, color: string) => (
    <TouchableOpacity
      onPress={() => handleRateRevision(quality)}
      style={[styles.qualityButton, { backgroundColor: `${color}20`, borderColor: color }]}
    >
      <ThemedText style={[styles.qualityNumber, { color }]}>{quality}</ThemedText>
      <ThemedText style={[styles.qualityLabel, { color }]}>{label}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
          style={[
            styles.modal,
            {
              backgroundColor: theme.backgroundDefault,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: theme.border }]} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View>
                <ThemedText style={styles.title}>Daily Revision</ThemedText>
                <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {dueRevisions.length} verses due for review
                </ThemedText>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <ThemedText style={styles.progressLabel}>Today's Progress</ThemedText>
                <ThemedText style={[styles.progressCount, { color: activeColor }]}>
                  {todayCompleted} / {dailyGoal}
                </ThemedText>
              </View>
              <View style={[styles.progressBar, { backgroundColor: theme.backgroundSecondary }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercent}%`, backgroundColor: activeColor },
                  ]}
                />
              </View>
            </View>

            {/* Rating Modal */}
            {showRating && selectedRevision && (
              <View style={[styles.ratingSection, { backgroundColor: theme.backgroundSecondary }]}>
                <ThemedText style={styles.ratingTitle}>
                  How well did you remember {selectedRevision.verseKey}?
                </ThemedText>
                <View style={styles.qualityButtons}>
                  {renderQualityButton(0, 'Forgot', '#EF4444')}
                  {renderQualityButton(1, 'Hard', '#F59E0B')}
                  {renderQualityButton(2, 'Okay', '#3B82F6')}
                  {renderQualityButton(3, 'Good', '#10B981')}
                  {renderQualityButton(4, 'Easy', '#8B5CF6')}
                  {renderQualityButton(5, 'Perfect', activeColor)}
                </View>
              </View>
            )}

            {/* Revisions List */}
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {dueRevisions.length > 0 ? (
                <>
                  <ThemedText style={styles.sectionTitle}>Due Now</ThemedText>
                  {dueRevisions.map((revision, index) =>
                    renderRevisionItem(revision, index)
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Feather name="check-circle" size={48} color={activeColor} />
                  <ThemedText style={styles.emptyTitle}>All caught up!</ThemedText>
                  <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                    No verses due for revision right now
                  </ThemedText>
                </View>
              )}

              {/* Today's Completed */}
              {todayRevisions.length > 0 && (
                <>
                  <ThemedText style={[styles.sectionTitle, { marginTop: 20 }]}>
                    Completed Today
                  </ThemedText>
                  {todayRevisions.slice(0, 5).map((revision, index) => (
                    <View
                      key={revision.verseKey}
                      style={[
                        styles.completedItem,
                        { backgroundColor: theme.backgroundSecondary },
                      ]}
                    >
                      <Feather name="check" size={16} color="#10B981" />
                      <ThemedText style={styles.completedText}>
                        {revision.verseKey}
                      </ThemedText>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>

            {/* Start Session Button */}
            {dueRevisions.length > 0 && !showRating && (
              <TouchableOpacity
                onPress={() => {
                  handleStartRevision(dueRevisions[0]);
                  setShowRating(true);
                }}
                style={[styles.startSessionButton, { backgroundColor: activeColor }]}
              >
                <Feather name="play" size={20} color="#FFFFFF" />
                <ThemedText style={styles.startSessionText}>
                  Start Revision Session
                </ThemedText>
              </TouchableOpacity>
            )}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  ratingSection: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  ratingTitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  qualityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  qualityButton: {
    width: (SCREEN_WIDTH - 80) / 3 - 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  qualityNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  qualityLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 20,
    maxHeight: 300,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  revisionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  revisionInfo: {
    flex: 1,
  },
  verseKey: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  revisionMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  startButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  completedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 10,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  startSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  startSessionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RevisionModal;
