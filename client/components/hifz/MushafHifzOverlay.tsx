/**
 * MushafHifzOverlay
 * Overlay component that adds Hifz mode functionality to MushafScreen
 * This component handles the control panel and revision modal (toggle is now in header pill)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HifzControlPanel } from './HifzControlPanel';
import { RevisionModal } from './RevisionModal';
import { useHifzMode } from '../../contexts/HifzModeContext';
import { useHifzProgress } from '../../hooks/useHifzProgress';
import { useRevisionSchedule } from '../../hooks/useRevisionSchedule';
import { hifzNotificationService } from '../../services/HifzNotificationService';
import type { MemorizationStatus, VerseKey } from '../../types/hifz';

interface MushafHifzOverlayProps {
  currentVerseKey?: string;
  currentPage?: number;
  currentJuz?: number;
  pageVerses?: string[];
  bottomOffset?: number;
  showControlPanel?: boolean;
  onCloseControlPanel?: () => void;
}

export function MushafHifzOverlay({
  currentVerseKey,
  currentPage,
  currentJuz,
  pageVerses,
  bottomOffset = 80,
  showControlPanel: externalShowControlPanel,
  onCloseControlPanel,
}: MushafHifzOverlayProps) {
  const insets = useSafeAreaInsets();
  const { isActive } = useHifzMode();
  const { markVerse, markPage, markJuz } = useHifzProgress();
  const { dueRevisions } = useRevisionSchedule();
  const [internalShowControlPanel, setInternalShowControlPanel] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [hasShownRevisionModal, setHasShownRevisionModal] = useState(false);

  // Use external control if provided, otherwise use internal state
  const showControlPanel = externalShowControlPanel !== undefined ? externalShowControlPanel : internalShowControlPanel;
  const handleCloseControlPanel = onCloseControlPanel || (() => setInternalShowControlPanel(false));

  // Show revision modal on mount if there are due revisions (Task 5.3)
  useEffect(() => {
    if (dueRevisions.length > 0 && !hasShownRevisionModal && isActive) {
      // Small delay to let the screen render first
      const timer = setTimeout(() => {
        setShowRevisionModal(true);
        setHasShownRevisionModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [dueRevisions.length, hasShownRevisionModal, isActive]);

  // Initialize notifications and schedule daily reminder (Task 5.4)
  useEffect(() => {
    let subscription: any = null;
    
    const initNotifications = async () => {
      try {
        await hifzNotificationService.initialize();
        // Schedule daily reminder with current due count
        if (dueRevisions.length > 0) {
          await hifzNotificationService.scheduleRevisionReminder(dueRevisions.length);
        }
      } catch (error) {
        console.log('[MushafHifzOverlay] Notification init error:', error);
      }
    };
    initNotifications();

    // Listen for notification taps (deep link to RevisionModal)
    try {
      subscription = hifzNotificationService.addNotificationResponseListener((response) => {
        const data = response.notification.request.content.data;
        if (hifzNotificationService.isHifzRevisionNotification(data)) {
          // Open the revision modal when notification is tapped
          setShowRevisionModal(true);
        }
      });
    } catch (error) {
      console.log('[MushafHifzOverlay] Notification listener error:', error);
    }

    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, [dueRevisions.length]);

  const handleMarkMemorized = useCallback(async (verseKey: VerseKey, status: MemorizationStatus) => {
    try {
      await markVerse(verseKey, status);
    } catch (error) {
      console.error('[MushafHifzOverlay] Failed to mark verse:', error);
    }
  }, [markVerse]);

  const handleMarkPage = useCallback(async (page: number, status: MemorizationStatus) => {
    try {
      console.log('[MushafHifzOverlay] handleMarkPage called:', page, status, 'pageVerses:', pageVerses?.length);
      // Use pageVerses if available for accurate marking
      if (pageVerses && pageVerses.length > 0) {
        console.log('[MushafHifzOverlay] Marking verses:', pageVerses);
        for (const verseKey of pageVerses) {
          await markVerse(verseKey, status);
        }
        console.log('[MushafHifzOverlay] Done marking all verses');
      } else {
        console.log('[MushafHifzOverlay] No pageVerses, using markPage');
        await markPage(page, status);
      }
    } catch (error) {
      console.error('[MushafHifzOverlay] Failed to mark page:', error);
    }
  }, [markVerse, markPage, pageVerses]);

  const handleMarkJuz = useCallback(async (juz: number, status: MemorizationStatus) => {
    try {
      await markJuz(juz, status);
    } catch (error) {
      console.error('[MushafHifzOverlay] Failed to mark juz:', error);
    }
  }, [markJuz]);

  const handleStartRevision = useCallback((verseKey: VerseKey) => {
    // Navigate to the verse or start audio playback
    console.log('[MushafHifzOverlay] Start revision for:', verseKey);
    setShowRevisionModal(false);
  }, []);

  return (
    <>
      {/* Hifz Control Panel */}
      <HifzControlPanel
        visible={showControlPanel}
        onClose={handleCloseControlPanel}
        currentVerseKey={currentVerseKey}
        currentPage={currentPage}
        currentJuz={currentJuz}
        onMarkMemorized={handleMarkMemorized}
        onMarkPage={handleMarkPage}
        onMarkJuz={handleMarkJuz}
      />

      {/* Revision Modal */}
      <RevisionModal
        visible={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        onStartRevision={handleStartRevision}
      />
    </>
  );
}

const styles = StyleSheet.create({});

export default MushafHifzOverlay;
