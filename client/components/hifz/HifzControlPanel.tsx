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
import { useTranslation } from '../../hooks/useTranslation';
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
  const { t } = useTranslation();
  const {
    settings,
    setHideMode,
    setAutoHideDelay,
    revealAll,
    hideAll,
    updateSettings,
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
      isClear ? t('hifzControls.clearPageMarkings') : t('hifzControls.markEntirePage'),
      isClear
        ? `${t('hifzControls.clearPageMarkings')} ${currentPage}?`
        : `${t('hifzControls.markEntirePage')} ${currentPage} - "${status.replace('_', ' ')}"?`,
      [
        { text: t('hifzControls.cancel'), style: 'cancel' },
        {
          text: t('hifzControls.confirm'),
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
      isClear ? t('hifzControls.clearJuzMarkings') : t('hifzControls.markEntireJuz'),
      isClear
        ? `${t('hifzControls.clearJuzMarkings')} ${currentJuz}?`
        : `${t('hifzControls.markEntireJuz')} ${currentJuz} - "${status.replace('_', ' ')}"?`,
      [
        { text: t('hifzControls.cancel'), style: 'cancel' },
        {
          text: t('hifzControls.confirm'),
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
          backgroundColor: activeTab === tab ? activeColor : '#FFFFFF',
          borderWidth: 0,
          borderColor: 'transparent',
          ...(activeTab === tab ? {
            shadowColor: activeColor,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
            elevation: 4,
          } : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }),
        },
      ]}
    >
      <Feather
        name={icon as any}
        size={16}
        color={activeTab === tab ? '#FFFFFF' : theme.text}
      />
      <ThemedText
        numberOfLines={1}
        adjustsFontSizeToFit
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
          backgroundColor: settings.autoHideDelay === delay ? activeColor : '#FFFFFF',
          borderWidth: 0,
          borderColor: 'transparent',
          ...(settings.autoHideDelay === delay ? {
            shadowColor: activeColor,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
            elevation: 4,
          } : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }),
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
            <ThemedText style={styles.title}>{t('hifzControls.title')}</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {renderTabButton('hide', t('hifzControls.hideTab'), 'eye-off')}
            {renderTabButton('repeat', t('hifzControls.repeatTab'), 'repeat')}
            {renderTabButton('loop', t('hifzControls.loopTab'), 'refresh-cw')}
            {renderTabButton('progress', t('hifzControls.progressTab'), 'check-circle')}
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Hide Tab */}
            {activeTab === 'hide' && (
              <View style={styles.tabContent}>
                {/* Hide Mode Selection */}
                <ThemedText style={styles.sectionTitle}>{t('hifzControls.hideMode')}</ThemedText>
                {HIDE_MODE_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setHideMode(option.value)}
                    style={[
                      styles.modeOption,
                      {
                        backgroundColor: '#FFFFFF',
                        borderWidth: 0,
                        borderColor: 'transparent',
                        borderLeftWidth: settings.hideMode === option.value ? 4 : 0,
                        borderLeftColor: settings.hideMode === option.value ? activeColor : 'transparent',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.05,
                        shadowRadius: 8,
                        elevation: 2,
                      },
                    ]}
                  >
                    <View style={styles.modeOptionContent}>
                      <ThemedText style={styles.modeLabel}>{option.labelKey ? t(option.labelKey) : option.label}</ThemedText>
                      <ThemedText style={[styles.modeDescription, { color: theme.textSecondary }]}>
                        {option.descriptionKey ? t(option.descriptionKey) : option.description}
                      </ThemedText>
                    </View>
                    {settings.hideMode === option.value && (
                      <Feather name="check" size={20} color="#5e9caa" />
                    )}
                  </TouchableOpacity>
                ))}

                {/* Word Audio Toggle - only show in word-by-word mode */}
                {settings.hideMode === 'word' && (
                  <TouchableOpacity
                    onPress={() => updateSettings({ playWordAudioOnReveal: !settings.playWordAudioOnReveal })}
                    style={[
                      styles.modeOption,
                      {
                        backgroundColor: settings.playWordAudioOnReveal ? `${activeColor}20` : theme.cardBackground,
                        borderColor: settings.playWordAudioOnReveal ? activeColor : theme.border,
                        marginTop: 4,
                      },
                    ]}
                  >
                    <View style={styles.modeOptionContent}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <ThemedText style={styles.modeLabel}>🔊 {t('hifzControls.wordAudio')}</ThemedText>
                        <View style={{ backgroundColor: theme.textSecondary + '30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <ThemedText style={{ fontSize: 10, color: theme.textSecondary }}>{t('hifzControls.requiresInternet')}</ThemedText>
                        </View>
                      </View>
                      <ThemedText style={[styles.modeDescription, { color: theme.textSecondary }]}>
                        {t('hifzControls.playPronunciation')}
                      </ThemedText>
                    </View>
                    <View style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      backgroundColor: settings.playWordAudioOnReveal ? activeColor : 'transparent',
                      borderWidth: 2,
                      borderColor: settings.playWordAudioOnReveal ? activeColor : theme.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {settings.playWordAudioOnReveal && <Feather name="check" size={14} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>
                )}

                {/* Quick Actions */}
                <ThemedText style={[styles.sectionTitle, { marginTop: 20 }]}>{t('hifzControls.quickActions')}</ThemedText>
                <View style={styles.quickActions}>
                  <TouchableOpacity
                    onPress={revealAll}
                    style={[styles.actionButton, {
                      backgroundColor: '#FFFFFF',
                      borderWidth: 0,
                      borderColor: 'transparent',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      elevation: 2,
                    }]}
                  >
                    <Feather name="eye" size={18} color={theme.text} />
                    <ThemedText style={styles.actionText}>{t('hifzControls.revealAll')}</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={hideAll}
                    style={[styles.actionButton, {
                      backgroundColor: '#FFFFFF',
                      borderWidth: 0,
                      borderColor: 'transparent',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      elevation: 2,
                    }]}
                  >
                    <Feather name="eye-off" size={18} color={theme.text} />
                    <ThemedText style={styles.actionText}>
                      {t('hifzControls.hideAll')}
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                {/* Auto Hide Delay */}
                <ThemedText style={[styles.sectionTitle, { marginTop: 20 }]}>
                  {t('hifzControls.autoHideDelay')}
                </ThemedText>
                <ThemedText style={[styles.modeDescription, { color: theme.textSecondary, marginBottom: 12 }]}>
                  {t('hifzControls.autoHideAfter')}
                </ThemedText>
                <View style={styles.delayOptions}>
                  {AUTO_HIDE_DELAY_OPTIONS.map(option =>
                    renderAutoHideOption(option.value, option.labelKey ? t(option.labelKey) : option.label)
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
                <ThemedText style={styles.sectionTitle}>{t('hifzControls.markCurrentVerse')}</ThemedText>

                {currentVerseKey ? (
                  <>
                    <ThemedText style={[styles.verseKeyText, { color: theme.textSecondary }]}>
                      {t('hifzControls.verse')}: {currentVerseKey}
                    </ThemedText>

                    <View style={styles.statusButtons}>
                      <TouchableOpacity
                        onPress={() => handleMarkStatus('not_started')}
                        style={[styles.statusButton, {
                          backgroundColor: '#FFFFFF',
                          borderWidth: 0,
                          borderColor: 'transparent',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 3 },
                          shadowOpacity: 0.05,
                          shadowRadius: 8,
                          elevation: 2,
                        }]}
                      >
                        <MemorizationBadge status="not_started" size="large" />
                        <ThemedText style={styles.statusText}>{t('hifzControls.notStarted')}</ThemedText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleMarkStatus('in_progress')}
                        style={[styles.statusButton, {
                          backgroundColor: '#FFFFFF',
                          borderWidth: 0,
                          borderColor: 'transparent',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 3 },
                          shadowOpacity: 0.05,
                          shadowRadius: 8,
                          elevation: 2,
                        }]}
                      >
                        <MemorizationBadge status="in_progress" size="large" />
                        <ThemedText style={styles.statusText}>{t('hifzControls.inProgress')}</ThemedText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleMarkStatus('memorized')}
                        style={[styles.statusButton, {
                          backgroundColor: '#FFFFFF',
                          borderWidth: 0,
                          borderColor: 'transparent',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 3 },
                          shadowOpacity: 0.05,
                          shadowRadius: 8,
                          elevation: 2,
                        }]}
                      >
                        <MemorizationBadge status="memorized" size="large" />
                        <ThemedText style={styles.statusText}>{t('hifzControls.memorized')}</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <ThemedText style={[styles.noVerseText, { color: theme.textSecondary }]}>
                    {t('hifzControls.longPressToMark')}
                  </ThemedText>
                )}

                {/* Bulk Marking Section */}
                {(currentPage || currentJuz) && (
                  <>
                    <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 20 }]} />

                    <ThemedText style={styles.sectionTitle}>{t('hifzControls.bulkMarking')}</ThemedText>

                    {currentPage && onMarkPage && (
                      <View style={styles.bulkSection}>
                        <ThemedText style={[styles.bulkLabel, { color: theme.textSecondary }]}>
                          {t('hifzControls.page')} {currentPage}
                        </ThemedText>
                        <View style={styles.bulkButtons}>
                          <TouchableOpacity
                            onPress={() => handleMarkPageStatus('in_progress')}
                            style={[styles.bulkButton, { backgroundColor: 'rgba(245, 158, 11, 0.10)', borderWidth: 0, borderColor: 'transparent' }]}
                          >
                            <ThemedText style={[styles.bulkButtonText, { color: '#F59E0B' }]}>
                              {t('hifzControls.inProgress')}
                            </ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleMarkPageStatus('memorized')}
                            style={[styles.bulkButton, { backgroundColor: 'rgba(94, 156, 170, 0.10)', borderWidth: 0, borderColor: 'transparent' }]}
                          >
                            <ThemedText style={[styles.bulkButtonText, { color: '#5e9caa' }]}>
                              {t('hifzControls.memorized')}
                            </ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleMarkPageStatus('not_started')}
                            style={[styles.bulkButton, { backgroundColor: 'rgba(239, 68, 68, 0.10)', borderWidth: 0, borderColor: 'transparent' }]}
                          >
                            <ThemedText style={[styles.bulkButtonText, { color: '#EF4444' }]}>
                              {t('hifzControls.clear')}
                            </ThemedText>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {currentJuz && onMarkJuz && (
                      <View style={styles.bulkSection}>
                        <ThemedText style={[styles.bulkLabel, { color: theme.textSecondary }]}>
                          {t('hifzControls.juz')} {currentJuz}
                        </ThemedText>
                        <View style={styles.bulkButtons}>
                          <TouchableOpacity
                            onPress={() => handleMarkJuzStatus('in_progress')}
                            style={[styles.bulkButton, { backgroundColor: 'rgba(245, 158, 11, 0.10)', borderWidth: 0, borderColor: 'transparent' }]}
                          >
                            <ThemedText style={[styles.bulkButtonText, { color: '#F59E0B' }]}>
                              {t('hifzControls.inProgress')}
                            </ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleMarkJuzStatus('memorized')}
                            style={[styles.bulkButton, { backgroundColor: 'rgba(94, 156, 170, 0.10)', borderWidth: 0, borderColor: 'transparent' }]}
                          >
                            <ThemedText style={[styles.bulkButtonText, { color: '#5e9caa' }]}>
                              {t('hifzControls.memorized')}
                            </ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleMarkJuzStatus('not_started')}
                            style={[styles.bulkButton, { backgroundColor: 'rgba(239, 68, 68, 0.10)', borderWidth: 0, borderColor: 'transparent' }]}
                          >
                            <ThemedText style={[styles.bulkButtonText, { color: '#EF4444' }]}>
                              {t('hifzControls.clear')}
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
    paddingHorizontal: 6,
    borderRadius: 12,
    gap: 3,
    minWidth: 0,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
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
    gap: 8,
    minWidth: 0,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
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
    flexWrap: 'wrap',
    gap: 10,
  },
  bulkButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  bulkButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default HifzControlPanel;
