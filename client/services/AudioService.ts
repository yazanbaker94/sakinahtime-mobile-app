import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

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
      const dirPath = `${FileSystem.documentDirectory}quran_audio/${this.reciter}/`;
      const localPath = `${dirPath}${surah}_${ayah}.mp3`;
      
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
      }

      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        return localPath;
      }

      const url = this.getAudioUrl(surah, ayah);
      const download = await FileSystem.downloadAsync(url, localPath);
      return download.uri;
    } catch (error) {
      console.error('Download error:', error);
      return this.getAudioUrl(surah, ayah);
    }
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
      this.notifyListeners();
      return;
    }

    const next = this.playbackQueue.shift()!;
    this.currentMetadata = next;

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
      this.lastPlayed = next;
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
    if (this.sound) {
      await this.sound.playAsync();
      this.isPlaying = true;
      this.notifyListeners();
    }
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
      if (this.playbackQueue.length > 0) {
        await this.playNext();
      } else if (this.lastPlayed) {
        await this.play(this.lastPlayed.surah, this.lastPlayed.ayah + 1, 'single');
      }
    } catch (error) {
      console.error('Skip next error:', error);
    }
  }

  async skipToPrevious() {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      if (this.lastPlayed && this.lastPlayed.ayah > 1) {
        await this.play(this.lastPlayed.surah, this.lastPlayed.ayah - 1, 'single');
      }
    } catch (error) {
      console.error('Skip previous error:', error);
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
