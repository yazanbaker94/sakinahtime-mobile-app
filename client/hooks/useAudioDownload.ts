/**
 * useAudioDownload Hook
 * 
 * Manages Quran audio downloads with progress tracking.
 */

import { useState, useEffect, useCallback } from 'react';
import { audioDownloadService } from '../services/AudioDownloadService';
import { DownloadItem } from '../types/offline';

export function useAudioDownload(reciter: string) {
  const [downloadedSurahs, setDownloadedSurahs] = useState<number[]>([]);
  const [downloadQueue, setDownloadQueue] = useState<DownloadItem[]>([]);
  const [currentDownload, setCurrentDownload] = useState<DownloadItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial state
  useEffect(() => {
    const loadState = async () => {
      setIsLoading(true);
      try {
        await audioDownloadService.initialize();
        const downloaded = await audioDownloadService.getDownloadedSurahs(reciter);
        setDownloadedSurahs(downloaded);
        setDownloadQueue(audioDownloadService.getDownloadQueue());
      } catch (error) {
        console.error('[useAudioDownload] Failed to load state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, [reciter]);

  // Subscribe to progress updates
  useEffect(() => {
    const unsubProgress = audioDownloadService.onProgress((item) => {
      if (item.reciter === reciter) {
        setCurrentDownload(item.status === 'downloading' ? item : null);
        setDownloadQueue(audioDownloadService.getDownloadQueue());
      }
    });

    const unsubComplete = audioDownloadService.onComplete(async (item) => {
      if (item.reciter === reciter && item.surahNumber) {
        setDownloadedSurahs(prev => 
          prev.includes(item.surahNumber!) ? prev : [...prev, item.surahNumber!]
        );
        setCurrentDownload(null);
        setDownloadQueue(audioDownloadService.getDownloadQueue());
      }
    });

    const unsubError = audioDownloadService.onError((item) => {
      if (item.reciter === reciter) {
        setCurrentDownload(null);
        setDownloadQueue(audioDownloadService.getDownloadQueue());
      }
    });

    return () => {
      unsubProgress();
      unsubComplete();
      unsubError();
    };
  }, [reciter]);

  const downloadSurah = useCallback(async (surahNumber: number) => {
    try {
      await audioDownloadService.downloadSurah(surahNumber, reciter);
      setDownloadQueue(audioDownloadService.getDownloadQueue());
    } catch (error) {
      console.error('[useAudioDownload] Failed to download surah:', error);
      throw error;
    }
  }, [reciter]);

  const downloadAll = useCallback(async () => {
    try {
      await audioDownloadService.downloadAllSurahs(reciter);
      setDownloadQueue(audioDownloadService.getDownloadQueue());
    } catch (error) {
      console.error('[useAudioDownload] Failed to download all:', error);
      throw error;
    }
  }, [reciter]);

  const pauseDownload = useCallback(async (downloadId: string) => {
    await audioDownloadService.pauseDownload(downloadId);
    setDownloadQueue(audioDownloadService.getDownloadQueue());
    setCurrentDownload(null);
  }, []);

  const resumeDownload = useCallback(async (downloadId: string) => {
    await audioDownloadService.resumeDownload(downloadId);
    setDownloadQueue(audioDownloadService.getDownloadQueue());
  }, []);

  const cancelDownload = useCallback(async (downloadId: string) => {
    await audioDownloadService.cancelDownload(downloadId);
    setDownloadQueue(audioDownloadService.getDownloadQueue());
    setCurrentDownload(null);
  }, []);

  const cancelAllDownloads = useCallback(async () => {
    await audioDownloadService.cancelAllDownloads(reciter);
    setDownloadQueue([]);
    setCurrentDownload(null);
  }, [reciter]);

  const deleteSurah = useCallback(async (surahNumber: number) => {
    try {
      await audioDownloadService.deleteSurah(surahNumber, reciter);
      setDownloadedSurahs(prev => prev.filter(s => s !== surahNumber));
      setDownloadQueue(audioDownloadService.getDownloadQueue());
    } catch (error) {
      console.error('[useAudioDownload] Failed to delete surah:', error);
      throw error;
    }
  }, [reciter]);

  const deleteAll = useCallback(async () => {
    await audioDownloadService.deleteReciterAudio(reciter);
    setDownloadedSurahs([]);
    setDownloadQueue([]);
    setCurrentDownload(null);
  }, [reciter]);

  const isDownloading = currentDownload !== null || 
    downloadQueue.some(item => item.status === 'downloading' && item.reciter === reciter);

  const pendingCount = downloadQueue.filter(
    item => item.reciter === reciter && (item.status === 'pending' || item.status === 'downloading')
  ).length;

  return {
    downloadedSurahs,
    downloadQueue: downloadQueue.filter(item => item.reciter === reciter),
    currentDownload,
    isLoading,
    isDownloading,
    pendingCount,
    downloadSurah,
    downloadAll,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    cancelAllDownloads,
    deleteSurah,
    deleteAll,
  };
}
