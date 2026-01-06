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
  
  // Hifz mode repeat/loop properties
  private repeatCount = 0;
  private currentRepeat = 0;
  private pauseBetweenRepeats = 0;
  private isRepeating = false;
  private onRepeatComplete: (() => void) | null = null;
  
  // Loop properties
  private loopStart: AudioMetadata | null = null;
  private loopEnd: AudioMetadata | null = null;
  private isLooping = false;
  private loopRepeatCount = 0;
  private currentLoopRepeat = 0;
  
  // Lock to prevent concurrent operations
  private isTransitioning = false;

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
      // Hifz mode state
      isRepeating: this.isRepeating,
      currentRepeat: this.currentRepeat,
      totalRepeats: this.repeatCount,
      isLooping: this.isLooping,
      loopStart: this.loopStart,
      loopEnd: this.loopEnd,
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
    // Prevent concurrent play operations
    if (this.isTransitioning) {
      console.log('[AudioService] play blocked - already transitioning');
      return;
    }
    
    this.isTransitioning = true;
    
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
    } finally {
      this.isTransitioning = false;
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
    // Prevent concurrent skip operations
    if (this.isTransitioning) {
      console.log('[AudioService] skipToNext blocked - already transitioning');
      return;
    }
    
    this.isTransitioning = true;
    
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
    } finally {
      this.isTransitioning = false;
    }
  }

  async skipToPrevious() {
    // Prevent concurrent skip operations
    if (this.isTransitioning) {
      console.log('[AudioService] skipToPrevious blocked - already transitioning');
      return;
    }
    
    this.isTransitioning = true;
    
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
    } finally {
      this.isTransitioning = false;
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
      // Stop existing sound if any
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      
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

  // ==================== HIFZ MODE: REPEAT FUNCTIONALITY ====================

  /**
   * Play a verse with repeat functionality
   * @param surah Surah number
   * @param ayah Ayah number
   * @param repeatCount Number of times to repeat (0 = infinite)
   * @param pauseDuration Pause between repeats in milliseconds
   * @param onComplete Callback when all repeats are done
   */
  async playWithRepeat(
    surah: number,
    ayah: number,
    repeatCount: number = 1,
    pauseDuration: number = 0,
    onComplete?: () => void
  ) {
    console.log(`[AudioService] playWithRepeat: ${surah}:${ayah}, repeats: ${repeatCount}, pause: ${pauseDuration}ms`);
    
    // Stop any existing playback first
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
    
    this.repeatCount = repeatCount;
    this.currentRepeat = 0;
    this.pauseBetweenRepeats = pauseDuration;
    this.isRepeating = true;
    this.onRepeatComplete = onComplete || null;
    
    await this.playSingleVerseWithRepeat(surah, ayah);
  }

  private async playSingleVerseWithRepeat(surah: number, ayah: number) {
    const verse: AudioMetadata = { surah, ayah, reciter: this.reciter };
    this.currentMetadata = verse;
    this.lastPlayed = verse;
    
    try {
      // Stop existing sound if any (for subsequent repeats)
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      
      const uri = await this.downloadAudio(surah, ayah);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        this.onRepeatPlaybackStatusUpdate.bind(this)
      );

      this.sound = sound;
      await sound.setRateAsync(this.playbackRate, true);
      this.isPlaying = true;
      this.currentRepeat++;
      console.log(`[AudioService] Playing repeat ${this.currentRepeat}/${this.repeatCount || '∞'}`);
      this.notifyListeners();
    } catch (error) {
      console.error('Repeat playback error:', error);
      this.stopRepeat();
    }
  }

  private async onRepeatPlaybackStatusUpdate(status: any) {
    if (status.didJustFinish && this.isRepeating) {
      const shouldContinue = this.repeatCount === 0 || this.currentRepeat < this.repeatCount;
      
      if (shouldContinue) {
        // Pause between repeats if configured
        if (this.pauseBetweenRepeats > 0) {
          this.isPlaying = false;
          this.notifyListeners();
          await new Promise(resolve => setTimeout(resolve, this.pauseBetweenRepeats));
        }
        
        // Check if still repeating (might have been stopped during pause)
        if (this.isRepeating && this.currentMetadata) {
          await this.playSingleVerseWithRepeat(this.currentMetadata.surah, this.currentMetadata.ayah);
        }
      } else {
        // All repeats done
        console.log('[AudioService] All repeats completed');
        this.isRepeating = false;
        this.isPlaying = false;
        this.notifyListeners();
        
        if (this.onRepeatComplete) {
          this.onRepeatComplete();
          this.onRepeatComplete = null;
        }
      }
    } else if (status.didJustFinish && !this.isRepeating) {
      // Normal playback finished
      this.isPlaying = false;
      this.notifyListeners();
      await this.playNext();
    }
  }

  /**
   * Stop repeat playback
   */
  async stopRepeat() {
    console.log('[AudioService] stopRepeat called');
    this.isRepeating = false;
    this.repeatCount = 0;
    this.currentRepeat = 0;
    this.onRepeatComplete = null;
    
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
    
    this.isPlaying = false;
    this.notifyListeners();
  }

  /**
   * Get current repeat state
   */
  getRepeatState() {
    return {
      isRepeating: this.isRepeating,
      currentRepeat: this.currentRepeat,
      totalRepeats: this.repeatCount,
      pauseBetweenRepeats: this.pauseBetweenRepeats,
    };
  }

  // ==================== HIFZ MODE: LOOP FUNCTIONALITY ====================

  /**
   * Play a range of verses in a loop
   * @param startSurah Start surah number
   * @param startAyah Start ayah number
   * @param endSurah End surah number
   * @param endAyah End ayah number
   * @param repeatCount Number of times to loop (0 = infinite)
   */
  async playLoop(
    startSurah: number,
    startAyah: number,
    endSurah: number,
    endAyah: number,
    repeatCount: number = 0
  ) {
    console.log(`[AudioService] playLoop: ${startSurah}:${startAyah} -> ${endSurah}:${endAyah}, repeats: ${repeatCount}`);
    
    // Stop any existing playback first
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
    
    // Also stop any existing loop or repeat
    this.isLooping = false;
    this.isRepeating = false;
    
    this.loopStart = { surah: startSurah, ayah: startAyah, reciter: this.reciter };
    this.loopEnd = { surah: endSurah, ayah: endAyah, reciter: this.reciter };
    this.isLooping = true;
    this.loopRepeatCount = repeatCount;
    this.currentLoopRepeat = 0;
    
    // Build the queue for the loop
    await this.buildLoopQueue();
    await this.playNextInLoop();
  }

  private async buildLoopQueue() {
    if (!this.loopStart || !this.loopEnd) return;
    
    this.playbackQueue = [];
    
    let currentSurah = this.loopStart.surah;
    let currentAyah = this.loopStart.ayah;
    
    while (true) {
      this.playbackQueue.push({
        surah: currentSurah,
        ayah: currentAyah,
        reciter: this.reciter,
      });
      
      // Check if we've reached the end
      if (currentSurah === this.loopEnd.surah && currentAyah === this.loopEnd.ayah) {
        break;
      }
      
      // Move to next verse
      const surahInfo = SURAH_INFO.find(s => s.number === currentSurah);
      const totalAyahs = surahInfo?.ayahs || 0;
      
      if (currentAyah < totalAyahs) {
        currentAyah++;
      } else if (currentSurah < 114) {
        currentSurah++;
        currentAyah = 1;
      } else {
        break; // End of Quran
      }
      
      // Safety check to prevent infinite loops
      if (this.playbackQueue.length > 1000) {
        console.warn('[AudioService] Loop queue too large, truncating');
        break;
      }
    }
    
    console.log(`[AudioService] Built loop queue with ${this.playbackQueue.length} verses`);
  }

  private async playNextInLoop() {
    if (!this.isLooping) return;
    
    if (this.playbackQueue.length === 0) {
      // Loop completed once
      this.currentLoopRepeat++;
      
      const shouldContinue = this.loopRepeatCount === 0 || this.currentLoopRepeat < this.loopRepeatCount;
      
      if (shouldContinue) {
        console.log(`[AudioService] Loop iteration ${this.currentLoopRepeat}/${this.loopRepeatCount || '∞'} completed, restarting`);
        await this.buildLoopQueue();
        await this.playNextInLoop();
      } else {
        console.log('[AudioService] All loop iterations completed');
        this.stopLoop();
      }
      return;
    }
    
    const next = this.playbackQueue.shift()!;
    this.currentMetadata = next;
    this.lastPlayed = next;
    
    try {
      const uri = await this.downloadAudio(next.surah, next.ayah);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        this.onLoopPlaybackStatusUpdate.bind(this)
      );

      this.sound = sound;
      await sound.setRateAsync(this.playbackRate, true);
      this.isPlaying = true;
      console.log(`[AudioService] Loop playing: ${next.surah}:${next.ayah}`);
      this.notifyListeners();
    } catch (error) {
      console.error('Loop playback error:', error);
      await this.playNextInLoop();
    }
  }

  private async onLoopPlaybackStatusUpdate(status: any) {
    if (status.didJustFinish && this.isLooping) {
      this.isPlaying = false;
      this.notifyListeners();
      await this.playNextInLoop();
    }
  }

  /**
   * Stop loop playback
   */
  async stopLoop() {
    console.log('[AudioService] stopLoop called');
    this.isLooping = false;
    this.loopStart = null;
    this.loopEnd = null;
    this.loopRepeatCount = 0;
    this.currentLoopRepeat = 0;
    this.playbackQueue = [];
    
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
    
    this.isPlaying = false;
    this.notifyListeners();
  }

  /**
   * Get current loop state
   */
  getLoopState() {
    return {
      isLooping: this.isLooping,
      loopStart: this.loopStart,
      loopEnd: this.loopEnd,
      currentLoopRepeat: this.currentLoopRepeat,
      totalLoopRepeats: this.loopRepeatCount,
      queueLength: this.playbackQueue.length,
    };
  }

  getState() {
    return {
      isPlaying: this.isPlaying,
      current: this.currentMetadata || this.lastPlayed,
      queue: this.playbackQueue,
      playbackRate: this.playbackRate,
      // Hifz mode state
      isRepeating: this.isRepeating,
      currentRepeat: this.currentRepeat,
      totalRepeats: this.repeatCount,
      isLooping: this.isLooping,
      loopStart: this.loopStart,
      loopEnd: this.loopEnd,
    };
  }
}

export default AudioService.getInstance();
