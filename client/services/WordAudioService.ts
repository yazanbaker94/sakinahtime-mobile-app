import { Audio } from 'expo-av';

/**
 * Service for playing individual word audio from Quran.com CDN
 * URL pattern: https://audio.qurancdn.com/wbw/{surah}_{ayah}_{word}.mp3
 * Example: 001_001_001.mp3 = Surah 1, Ayah 1, Word 1
 */
class WordAudioService {
  private static instance: WordAudioService;
  private sound: Audio.Sound | null = null;
  private isPlaying = false;

  private constructor() {}

  static getInstance(): WordAudioService {
    if (!WordAudioService.instance) {
      WordAudioService.instance = new WordAudioService();
    }
    return WordAudioService.instance;
  }

  /**
   * Subscribe to word playback state changes (no-op for now)
   */
  subscribe(listener: (state: any) => void) {
    // Simplified - no state tracking to avoid threading issues
    return () => {};
  }

  /**
   * Play audio for a specific word
   * @param surah Surah number (1-114)
   * @param ayah Ayah number within the surah
   * @param wordIndex Word index (1-based)
   */
  async playWord(surah: number, ayah: number, wordIndex: number): Promise<void> {
    try {
      // Stop any currently playing word audio
      await this.stop();

      // Format: 3-digit surah, 3-digit ayah, 3-digit word (all 1-based)
      const surahPadded = String(surah).padStart(3, '0');
      const ayahPadded = String(ayah).padStart(3, '0');
      const wordPadded = String(wordIndex).padStart(3, '0');
      
      const url = `https://audio.qurancdn.com/wbw/${surahPadded}_${ayahPadded}_${wordPadded}.mp3`;
      
      console.log('[WordAudioService] Playing:', url);

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );

      this.sound = sound;
      this.isPlaying = true;
      
      // Auto-cleanup when done
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          this.isPlaying = false;
          this.sound = null;
          sound.unloadAsync().catch(() => {});
        }
      });
    } catch (error) {
      console.error('[WordAudioService] Error playing word:', error);
      this.isPlaying = false;
    }
  }

  /**
   * Stop any currently playing word audio
   */
  async stop(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.sound = null;
    }
    this.isPlaying = false;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const wordAudioService = WordAudioService.getInstance();
export default wordAudioService;
