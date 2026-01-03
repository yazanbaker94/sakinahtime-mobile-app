import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { audioDownloadService } from './AudioDownloadService';
import { networkService } from './NetworkService';
import { offlineStorageService } from './OfflineStorageService';
import { SURAH_INFO } from '../constants/offline';

export type PlaybackMode = 'single' | 'fromVerse' | 'fullSurah';

interface AudioMetadata {
  surah: number;
  ayah: number;
  reciter: string;
}

class AudioService {
  private static instance: AudioService;
  private sound: Audio.Sound | null = null;
  private currentMetadata: AudioMetadata | null = null;
  private playbackQueue: AudioMetadata[] = [];
  private isPlaying = false;
  private reciter = 'Alafasy_128kbps';
  private listeners: Set<(state: any) => void> = new Set();
  private playbackRate = 1.0;
  private lastPlayed: AudioMetadata | null = null;

  private constructor() {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });
  }

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  subscribe(listener: (state: any) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const state = {
      isPlaying: this.isPlaying,
      current: this.currentMetadata || this.lastPlayed,
      queue: this.playbackQueue,
      playbackRate: this.playbackRate,
    };
    this.listeners.forEach(listener => listener(state));
  }

  private getAudioUrl(surah: number, ayah: number): string {
    const surahPadded = String(surah).padStart(3, '0');
    const ayahPadded = String(ayah).padStart(3, '0');
    return `https://everyayah.com/data/${this.reciter}/${surahPadded}${ayahPadded}.mp3`;
  }

  private async downloadAudio(surah: number, ayah: number): Promise<string> {
    try {
      // Ensure services are initialized
      await audioDownloadService.initialize();
      await networkService.initialize();
      
      const isOnline = networkService.isOnline();
      console.log(`[AudioService] downloadAudio called for ${surah}:${ayah}, reciter: ${this.reciter}, online: ${isOnline}`);
      
      // First check if audio is downloaded via AudioDownloadService for CURRENT reciter
      const cachedPath = await audioDownloadService.getLocalAudioPath(surah, ayah, this.reciter);
      if (cachedPath) {
        console.log(`[AudioService] Found cached audio for current reciter: ${cachedPath}`);
        return cachedPath;
      }

      // Check existing local cache for CURRENT reciter
      const dirPath = `${FileSystem.documentDirectory}quran_audio/${this.reciter}/`;
      const localPath = `${dirPath}${surah}_${ayah}.mp3`;
      
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        console.log(`[AudioService] Found local cache: ${localPath}`);
        return localPath;
      }

      // If ONLINE - stream/download the selected reciter
      if (isOnline) {
        await offlineStorageService.initialize();
        const settings = offlineStorageService.getSettings();
        const shouldCache = !settings.wifiOnlyDownloads || networkService.isWifi();

        if (shouldCache) {
          // Download and save to disk
          const dirInfo = await FileSystem.getInfoAsync(dirPath);
          if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
          }

          const url = this.getAudioUrl(surah, ayah);
          console.log(`[AudioService] Downloading and caching: ${url}`);
          const download = await FileSystem.downloadAsync(url, localPath);
          return download.uri;
        } else {
          // Stream directly without caching (mobile data + WiFi-only enabled)
          const url = this.getAudioUrl(surah, ayah);
          console.log(`[AudioService] Streaming without cache: ${url}`);
          return url;
        }
      }

      // OFFLINE - try to find ANY downloaded reciter that has this ayah as fallback
      console.log(`[AudioService] Offline - searching for fallback reciter`);
      const fallbackPath = await this.findOfflineFallback(surah, ayah);
      if (fallbackPath) {
        console.log(`[AudioService] Using fallback reciter for ${surah}:${ayah}: ${fallbackPath}`);
        return fallbackPath;
      }

      // No fallback found
      throw new Error(`No offline audio available for ${surah}:${ayah} and device is offline`);
    } catch (error) {
      console.error('[AudioService] Download error:', error);
      // If we're online, try streaming as last resort
      if (networkService.isOnline()) {
        return this.getAudioUrl(surah, ayah);
      }
      throw error;
    }
  }

  /**
   * Find any downloaded reciter that has this ayah available offline
   */
  private async findOfflineFallback(surah: number, ayah: number): Promise<string | null> {
    const { RECITERS } = await import('../constants/offline');
    
    console.log(`[AudioService] Searching for offline fallback for ${surah}:${ayah} among ${RECITERS.length} reciters`);
    
    for (const reciter of RECITERS) {
      // Check AudioDownloadService first
      const cachedPath = await audioDownloadService.getLocalAudioPath(surah, ayah, reciter.id);
      if (cachedPath) {
        console.log(`[AudioService] Found fallback in AudioDownloadService: ${reciter.id}`);
        return cachedPath;
      }
      
      // Check local cache directory
      const localPath = `${FileSystem.documentDirectory}quran_audio/${reciter.id}/${surah}_${ayah}.mp3`;
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        console.log(`[AudioService] Found fallback in local cache: ${reciter.id}`);
        return localPath;
      }
    }
    
    console.log(`[AudioService] No offline fallback found for ${surah}:${ayah}`);
    return null;
  }

  setReciter(reciter: string) {
    this.reciter = reciter;
  }

  async playQueue(verses: Array<{ surah: number; ayah: number }>) {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }

      this.playbackQueue = verses.map(v => ({ surah: v.surah, ayah: v.ayah, reciter: this.reciter }));
      await this.playNext();
    } catch (error) {
      console.error('Play queue error:', error);
    }
  }

  async play(surah: number, ayah: number, mode: PlaybackMode = 'single', totalAyahs?: number) {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }

      this.playbackQueue = [];
      if (mode === 'fromVerse' && totalAyahs) {
        for (let i = ayah; i <= totalAyahs; i++) {
          this.playbackQueue.push({ surah, ayah: i, reciter: this.reciter });
        }
      } else if (mode === 'fullSurah' && totalAyahs) {
        for (let i = 1; i <= totalAyahs; i++) {
          this.playbackQueue.push({ surah, ayah: i, reciter: this.reciter });
        }
      } else {
        this.playbackQueue.push({ surah, ayah, reciter: this.reciter });
      }

      await this.playNext();
    } catch (error) {
      console.error('Play error:', error);
    }
  }

  private async playNext() {
    if (this.playbackQueue.length === 0) {
      this.isPlaying = false;
      this.currentMetadata = null;
      // Don't clear lastPlayed - we need it for replay
      console.log('[AudioService] Queue empty, lastPlayed:', this.lastPlayed);
      this.notifyListeners();
      return;
    }

    const next = this.playbackQueue.shift()!;
    this.currentMetadata = next;
    this.lastPlayed = next; // Set lastPlayed immediately when we know what we're playing

    try {
      const uri = await this.downloadAudio(next.surah, next.ayah);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.sound = sound;
      await sound.setRateAsync(this.playbackRate, true);
      this.isPlaying = true;
      console.log('[AudioService] Now playing:', next.surah, ':', next.ayah);
      this.notifyListeners();
    } catch (error) {
      console.error('Playback error:', error);
      await this.playNext();
    }
  }

  private async onPlaybackStatusUpdate(status: any) {
    if (status.didJustFinish) {
      this.isPlaying = false;
      this.notifyListeners();
      await this.playNext();
    }
  }

  async pause() {
    if (this.sound) {
      await this.sound.pauseAsync();
      this.isPlaying = false;
      this.notifyListeners();
    }
  }

  async resume() {
    console.log('[AudioService] resume() called, sound:', !!this.sound, 'lastPlayed:', this.lastPlayed);
    
    // If sound exists, check its status
    if (this.sound) {
      try {
        const status = await this.sound.getStatusAsync();
        
        if (status.isLoaded) {
          const loadedStatus = status as any;
          const positionMs = loadedStatus.positionMillis || 0;
          const durationMs = loadedStatus.durationMillis || 0;
          const isAtEnd = durationMs > 0 && positionMs >= durationMs - 100; // Within 100ms of end
          
          console.log('[AudioService] Sound status - isPlaying:', loadedStatus.isPlaying, 'position:', positionMs, 'duration:', durationMs, 'isAtEnd:', isAtEnd);
          
          // If not at end and not playing, resume from current position
          if (!isAtEnd && !loadedStatus.isPlaying) {
            await this.sound.playAsync();
            this.isPlaying = true;
            this.notifyListeners();
            return;
          }
        }
      } catch (error) {
        console.log('[AudioService] Error getting sound status:', error);
      }
    }
    
    // If sound finished (at end) or doesn't exist, replay the last verse
    await this.replay();
  }

  async stop() {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
    this.isPlaying = false;
    this.currentMetadata = null;
    this.playbackQueue = [];
    this.lastPlayed = null;
    this.notifyListeners();
  }

  async setPlaybackRate(rate: number) {
    this.playbackRate = rate;
    if (this.sound) {
      try {
        await this.sound.setRateAsync(rate, true);
      } catch (error) {
        console.error('Set rate error:', error);
      }
    }
    this.notifyListeners();
  }

  async skipToNext() {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      
      // If there's a queue, play the next item from it
      if (this.playbackQueue.length > 0) {
        await this.playNext();
        return;
      }
      
      // No queue - check if we can go to next verse
      const current = this.currentMetadata || this.lastPlayed;
      if (current) {
        const surahInfo = SURAH_INFO.find(s => s.number === current.surah);
        const totalAyahs = surahInfo?.ayahs || 0;
        
        if (current.ayah < totalAyahs) {
          // Can go to next verse in same surah
          await this.playSingleVerse(current.surah, current.ayah + 1);
        } else if (current.surah < 114) {
          // Go to first verse of next surah
          await this.playSingleVerse(current.surah + 1, 1);
        } else {
          // Already at last verse of last surah - do nothing
          console.log('[AudioService] Already at end of Quran');
        }
      }
    } catch (error) {
      console.error('Skip next error:', error);
    }
  }

  async skipToPrevious() {
    try {
      const current = this.currentMetadata || this.lastPlayed;
      
      // Can't go before verse 1 of surah 1
      if (!current || (current.surah === 1 && current.ayah === 1)) {
        console.log('[AudioService] Already at beginning');
        return;
      }
      
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      
      let prevSurah = current.surah;
      let prevAyah = current.ayah - 1;
      
      // If at first verse, go to last verse of previous surah
      if (current.ayah === 1 && current.surah > 1) {
        prevSurah = current.surah - 1;
        const prevSurahInfo = SURAH_INFO.find(s => s.number === prevSurah);
        prevAyah = prevSurahInfo?.ayahs || 1;
        // Clear queue when going to previous surah
        this.playbackQueue = [];
      } else if (current.ayah > 1) {
        // Add current verse back to front of queue (so it plays after the previous one)
        if (this.currentMetadata) {
          this.playbackQueue.unshift(this.currentMetadata);
        }
      }
      
      // Create the previous verse metadata and play it
      const prevVerse: AudioMetadata = {
        surah: prevSurah,
        ayah: prevAyah,
        reciter: this.reciter
      };
      
      this.currentMetadata = prevVerse;
      this.lastPlayed = prevVerse;
      
      try {
        const uri = await this.downloadAudio(prevVerse.surah, prevVerse.ayah);
        
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          this.onPlaybackStatusUpdate.bind(this)
        );

        this.sound = sound;
        await sound.setRateAsync(this.playbackRate, true);
        this.isPlaying = true;
        console.log('[AudioService] Now playing (prev):', prevVerse.surah, ':', prevVerse.ayah, 'queue length:', this.playbackQueue.length);
        this.notifyListeners();
      } catch (error) {
        console.error('Playback error:', error);
      }
    } catch (error) {
      console.error('Skip previous error:', error);
    }
  }

  /**
   * Play a single verse without affecting the queue
   */
  private async playSingleVerse(surah: number, ayah: number) {
    const verse: AudioMetadata = { surah, ayah, reciter: this.reciter };
    this.currentMetadata = verse;
    this.lastPlayed = verse;
    
    try {
      const uri = await this.downloadAudio(surah, ayah);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.sound = sound;
      await sound.setRateAsync(this.playbackRate, true);
      this.isPlaying = true;
      console.log('[AudioService] Now playing (single):', surah, ':', ayah);
      this.notifyListeners();
    } catch (error) {
      console.error('Playback error:', error);
    }
  }

  /**
   * Replay the current/last played verse
   * Used when play button is pressed after a verse finishes
   */
  async replay() {
    const current = this.currentMetadata || this.lastPlayed;
    console.log('[AudioService] replay() called, current:', this.currentMetadata, 'lastPlayed:', this.lastPlayed);
    if (current) {
      await this.playSingleVerse(current.surah, current.ayah);
    } else {
      console.log('[AudioService] replay() - nothing to replay');
    }
  }

  getState() {
    return {
      isPlaying: this.isPlaying,
      current: this.currentMetadata || this.lastPlayed,
      queue: this.playbackQueue,
      playbackRate: this.playbackRate,
    };
  }
}

export default AudioService.getInstance();
