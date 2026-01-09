/**
 * HifzControlPanel
 * Bottom sheet with all Hifz mode controls
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useHifzMode } from '../../contexts/HifzModeContext';
import { useTheme } from '../../hooks/useTheme';
import { ThemedText } from '../ThemedText';
import { RepeatControls } from './RepeatControls';
import { LoopRangeSelector } from './LoopRangeSelector';
import { SavedLoopsList } from './SavedLoopsList';
import { MemorizationBadge } from './MemorizationBadge';
import AudioService from '../../services/AudioService';
import {
  HIDE_MODE_OPTIONS,
  AUTO_HIDE_DELAY_OPTIONS,
} from '../../constants/hifz';
import type { HideMode, MemorizationStatus } from '../../types/hifz';

interface HifzControlPanelProps {
  visible: boolean;
  onClose: () => void;
  currentVerseKey?: string;
  currentPage?: number;
  currentJuz?: number;
  onMarkMemorized?: (verseKey: string, status: MemorizationStatus) => void;
  onMarkPage?: (page: number, status: MemorizationStatus) => void;
  onMarkJuz?: (juz: number, status: MemorizationStatus) => void;
}

export function HifzControlPanel({
  visible,
  onClose,
  currentVerseKey,
  currentPage,
  currentJuz,
  onMarkMemorized,
  onMarkPage,
  onMarkJuz,
}: HifzControlPanelProps) {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useTheme();
  const {
    settings,
    setHideMode,
    setAutoHideDelay,
    revealAll,
    hideAll,
  } = useHifzMode();

  const [activeTab, setActiveTab] = useState<'hide' | 'repeat' | 'loop' | 'progress'>('hide');
  const activeColor = theme.primary;
  
  // Audio state for repeat progress
  const [audioState, setAudioState] = useState<any>(null);
  
  useEffect(() => {
    const unsubscribe = AudioService.subscribe((state) => {
      setAudioState(state);
    });
    // Get initial state
    setAudioState(AudioService.getState());
    return () => {
      unsubscribe();
    };
  }, []);

  const handleStopRepeat = useCallback(async () => {
    await AudioService.stopRepeat();
  }, []);

  const handleMarkStatus = useCallback((status: MemorizationStatus) => {
    if (currentVerseKey && onMarkMemorized) {
      onMarkMemorized(currentVerseKey, status);
    }
  }, [currentVerseKey, onMarkMemorized]);

  const handleMarkPageStatus = useCallback((status: MemorizationStatus) => {
    console.log('[HifzControlPanel] handleMarkPageStatus called:', currentPage, status, 'onMarkPage:', !!onMarkPage);
    if (!currentPage || !onMarkPage) {
      console.log('[HifzControlPanel] Missing currentPage or onMarkPage');
      return;
    }
    
    const isClear = status === 'not_started';
    Alert.alert(
      isClear ? 'Clear Page Markings' : 'Mark Entire Page',
      isClear 
        ? `Are you sure you want to clear all memorization markings on page ${currentPage}?`
        : `Are you sure you want to mark all verses on page ${currentPage} as "${status.replace('_', ' ')}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: isClear ? 'destructive' : 'default',
          onPress: () => {
            console.log('[HifzControlPanel] Confirm pressed, calling onMarkPage');
            onMarkPage(currentPage, status);
          },
        },
      ]
    );
  }, [currentPage, onMarkPage]);

  const handleMarkJuzStatus = useCallback((status: MemorizationStatus) => {
    if (!currentJuz || !onMarkJuz) return;
    
    const isClear = status === 'not_started';
    Alert.alert(
      isClear ? 'Clear Juz Markings' : 'Mark Entire Juz',
      isClear
        ? `Are you sure you want to clear all memorization markings in Juz ${currentJuz}? This will affect many verses.`
        : `Are you sure you want to mark all verses in Juz ${currentJuz} as "${status.replace('_', ' ')}"? This will affect many verses.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: isClear ? 'destructive' : 'default',
          onPress: () => onMarkJuz(currentJuz, status),
        },
      ]
    );
  }, [currentJuz, onMarkJuz]);

  const renderTabButton = (tab: 'hide' | 'repeat' | 'loop' | 'progress', label: string, icon: string) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      accessible={true}
      accessibilityRole="tab"
      accessibilityState={{ selected: activeTab === tab }}
      accessibilityLabel={`${label} tab`}
      style={[
        styles.tabButton,
        {
          backgroundColor: activeTab === tab ? activeColor : 'transparent',
          borderColor: activeTab === tab ? activeColor : theme.border,
        },
      ]}
    >
      <Feather
        name={icon as any}
        size={16}
        color={activeTab === tab ? '#FFFFFF' : theme.text}
      />
      <ThemedText
        style={[
          styles.tabText,
          { color: activeTab === tab ? '#FFFFFF' : theme.text },
        ]}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  const renderAutoHideOption = (delay: number, label: string) => (
    <TouchableOpacity
      key={delay}
      onPress={() => setAutoHideDelay(delay)}
      style={[
        styles.delayOption,
        {
          backgroundColor: settings.autoHideDelay === delay ? activeColor : theme.cardBackground,
          borderColor: settings.autoHideDelay === delay ? activeColor : theme.border,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.delayText,
          { color: settings.autoHideDelay === delay ? '#FFFFFF' : theme.text },
        ]}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop - tap to close */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
          style={[
            styles.panel,
            {
              backgroundColor: theme.backgroundDefault,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.title}>Hifz Controls</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {renderTabButton('hide', 'Hide', 'eye-off')}
            {renderTabButton('repeat', 'Repeat', 'repeat')}
            {renderTabButton('loop', 'Loop', 'refresh-cw')}
            {renderTabButton('progress', 'Progress', 'check-circle')}
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
              {/* Hide Tab */}
              {activeTab === 'hide' && (
                <View style={styles.tabContent}>
                  {/* Hide Mode Selection */}
                  <ThemedText style={styles.sectionTitle}>Hide Mode</ThemedText>
                  {HIDE_MODE_OPTIONS.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setHideMode(option.value)}
                      style={[
                        styles.modeOption,
                        {
                          backgroundColor: settings.hideMode === option.value ? `${activeColor}20` : theme.cardBackground,
                          borderColor: settings.hideMode === option.value ? activeColor : theme.border,
                        },
                      ]}
                    >
                      <View style={styles.modeOptionContent}>
                        <ThemedText style={styles.modeLabel}>{option.label}</ThemedText>
                        <ThemedText style={[styles.modeDescription, { color: theme.textSecondary }]}>
                          {option.description}
                        </ThemedText>
                      </View>
                      {settings.hideMode === option.value && (
                        <Feather name="check" size={20} color={activeColor} />
                      )}
                    </TouchableOpacity>
                  ))}

                  {/* Quick Actions */}
                  <ThemedText style={[styles.sectionTitle, { marginTop: 20 }]}>Quick Actions</ThemedText>
                  <View style={styles.quickActions}>
                    <TouchableOpacity
                      onPress={revealAll}
                      style={[styles.actionButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                    >
                      <Feather name="eye" size={18} color={theme.text} />
                      <ThemedText style={styles.actionText}>Reveal All</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={hideAll}
                      style={[styles.actionButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                    >
                      <Feather name="eye-off" size={18} color={theme.text} />
                      <ThemedText style={styles.actionText}>
                        Hide All
                      </ThemedText>
                    </TouchableOpacity>
                  </View>

                  {/* Auto Hide Delay */}
                  <ThemedText style={[styles.sectionTitle, { marginTop: 20 }]}>
                    Auto-Hide Delay
                  </ThemedText>
                  <ThemedText style={[styles.modeDescription, { color: theme.textSecondary, marginBottom: 12 }]}>
                    Automatically hide after revealing
                  </ThemedText>
                  <View style={styles.delayOptions}>
                    {AUTO_HIDE_DELAY_OPTIONS.map(option =>
                      renderAutoHideOption(option.value, option.label)
                    )}
                  </View>
                </View>
              )}

              {/* Repeat Tab */}
              {activeTab === 'repeat' && (
                <RepeatControls 
                  isRepeating={audioState?.isRepeating}
                  currentRepeat={audioState?.currentRepeat}
                  totalRepeats={audioState?.totalRepeats}
                  onStop={handleStopRepeat}
                />
              )}

              {/* Loop Tab */}
              {activeTab === 'loop' && (
                <View style={styles.tabContent}>
                  <LoopRangeSelector
                    currentVerseKey={currentVerseKey}
                    currentPage={currentPage}
                    currentJuz={currentJuz}
                  />
                  <View style={{ marginTop: 16 }}>
                    <SavedLoopsList />
                  </View>
                </View>
              )}

              {/* Progress Tab */}
              {activeTab === 'progress' && (
                <View style={styles.tabContent}>
                  <ThemedText style={styles.sectionTitle}>Mark Current Verse</ThemedText>
                  
                  {currentVerseKey ? (
                    <>
                      <ThemedText style={[styles.verseKeyText, { color: theme.textSecondary }]}>
                        Verse: {currentVerseKey}
                      </ThemedText>
                      
                      <View style={styles.statusButtons}>
                        <TouchableOpacity
                          onPress={() => handleMarkStatus('not_started')}
                          style={[styles.statusButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                        >
                          <MemorizationBadge status="not_started" size="large" />
                          <ThemedText style={styles.statusText}>Not Started</ThemedText>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          onPress={() => handleMarkStatus('in_progress')}
                          style={[styles.statusButton, { backgroundColor: theme.cardBackground, borderColor: '#F59E0B' }]}
                        >
                          <MemorizationBadge status="in_progress" size="large" />
                          <ThemedText style={styles.statusText}>In Progress</ThemedText>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          onPress={() => handleMarkStatus('memorized')}
                          style={[styles.statusButton, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}
                        >
                          <MemorizationBadge status="memorized" size="large" />
                          <ThemedText style={styles.statusText}>Memorized</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <ThemedText style={[styles.noVerseText, { color: theme.textSecondary }]}>
                      Long press on a verse to mark its memorization status
                    </ThemedText>
                  )}

                  {/* Bulk Marking Section */}
                  {(currentPage || currentJuz) && (
                    <>
                      <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 20 }]} />
                      
                      <ThemedText style={styles.sectionTitle}>Bulk Marking</ThemedText>
                      
                      {currentPage && onMarkPage && (
                        <View style={styles.bulkSection}>
                          <ThemedText style={[styles.bulkLabel, { color: theme.textSecondary }]}>
                            Page {currentPage}
                          </ThemedText>
                          <View style={styles.bulkButtons}>
                            <TouchableOpacity
                              onPress={() => handleMarkPageStatus('in_progress')}
                              style={[styles.bulkButton, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B' }]}
                            >
                              <ThemedText style={[styles.bulkButtonText, { color: '#F59E0B' }]}>
                                In Progress
                              </ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleMarkPageStatus('memorized')}
                              style={[styles.bulkButton, { backgroundColor: `${theme.primary}20`, borderColor: theme.primary }]}
                            >
                              <ThemedText style={[styles.bulkButtonText, { color: theme.primary }]}>
                                Memorized
                              </ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleMarkPageStatus('not_started')}
                              style={[styles.bulkButton, { backgroundColor: '#EF444420', borderColor: '#EF4444' }]}
                            >
                              <ThemedText style={[styles.bulkButtonText, { color: '#EF4444' }]}>
                                Clear
                              </ThemedText>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                      
                      {currentJuz && onMarkJuz && (
                        <View style={styles.bulkSection}>
                          <ThemedText style={[styles.bulkLabel, { color: theme.textSecondary }]}>
                            Juz {currentJuz}
                          </ThemedText>
                          <View style={styles.bulkButtons}>
                            <TouchableOpacity
                              onPress={() => handleMarkJuzStatus('in_progress')}
                              style={[styles.bulkButton, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B' }]}
                            >
                              <ThemedText style={[styles.bulkButtonText, { color: '#F59E0B' }]}>
                                In Progress
                              </ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleMarkJuzStatus('memorized')}
                              style={[styles.bulkButton, { backgroundColor: `${theme.primary}20`, borderColor: theme.primary }]}
                            >
                              <ThemedText style={[styles.bulkButtonText, { color: theme.primary }]}>
                                Memorized
                              </ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleMarkJuzStatus('not_started')}
                              style={[styles.bulkButton, { backgroundColor: '#EF444420', borderColor: '#EF4444' }]}
                            >
                              <ThemedText style={[styles.bulkButtonText, { color: '#EF4444' }]}>
                                Clear
                              </ThemedText>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}
            </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  panel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    maxHeight: 400,
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  modeOptionContent: {
    flex: 1,
  },
  modeLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  modeDescription: {
    fontSize: 13,
  },
  delayOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  delayOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  delayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  verseKeyText: {
    fontSize: 14,
    marginBottom: 16,
  },
  statusButtons: {
    gap: 12,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '500',
  },
  noVerseText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  divider: {
    height: 1,
  },
  bulkSection: {
    marginBottom: 16,
  },
  bulkLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  bulkButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  bulkButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  bulkButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HifzControlPanel;
