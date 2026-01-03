/**
 * Progress Tracker Service
 * Handles storage, page marking, streak updates, and Khatm detection
 * Feature: quran-progress-tracker
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ReadingProgress,
  PageReadData,
  DailyGoal,
  StreakData,
  KhatmRecord,
  DailyRecord,
  PROGRESS_STORAGE_KEY,
  DEFAULT_READING_PROGRESS,
} from '../types/progress';
import {
  QURAN_CONSTANTS,
  isValidPage,
  isValidGoal,
  getTodayDateString,
  isToday,
  isYesterday,
  estimateVersesForPages,
} from '../constants/quran-constants';

class ProgressTrackerService {
  private cachedProgress: ReadingProgress | null = null;

  /**
   * Load progress from AsyncStorage
   */
  async loadProgress(): Promise<ReadingProgress> {
    try {
      const stored = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
      if (!stored) {
        return this.getDefaultProgress();
      }

      const parsed = JSON.parse(stored);
      const validated = this.validateProgress(parsed);
      
      if (!validated) {
        console.error('Progress data validation failed, using defaults');
        return this.getDefaultProgress();
      }

      this.cachedProgress = validated;
      return validated;
    } catch (error) {
      console.error('Failed to load progress:', error);
      return this.getDefaultProgress();
    }
  }

  /**
   * Save progress to AsyncStorage
   */
  async saveProgress(progress: ReadingProgress): Promise<void> {
    try {
      const json = JSON.stringify(progress);
      await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, json);
      this.cachedProgress = progress;
    } catch (error) {
      console.error('Failed to save progress:', error);
      throw error;
    }
  }

  /**
   * Validate progress data structure
   * Returns validated progress or null if invalid
   */
  validateProgress(data: unknown): ReadingProgress | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const obj = data as Record<string, unknown>;

    // Validate pagesRead
    if (!obj.pagesRead || typeof obj.pagesRead !== 'object') {
      return null;
    }

    // Validate each page entry
    const pagesRead = obj.pagesRead as Record<string, unknown>;
    for (const [key, value] of Object.entries(pagesRead)) {
      const pageNum = parseInt(key, 10);
      if (!isValidPage(pageNum)) {
        return null;
      }
      if (!this.isValidPageReadData(value)) {
        return null;
      }
    }

    // Validate dailyGoal
    if (!this.isValidDailyGoal(obj.dailyGoal)) {
      return null;
    }

    // Validate streak
    if (!this.isValidStreakData(obj.streak)) {
      return null;
    }

    // Validate khatmHistory
    if (!Array.isArray(obj.khatmHistory)) {
      return null;
    }
    for (const record of obj.khatmHistory) {
      if (!this.isValidKhatmRecord(record)) {
        return null;
      }
    }

    // Validate settings
    if (!this.isValidProgressSettings(obj.settings)) {
      return null;
    }

    return obj as unknown as ReadingProgress;
  }

  private isValidPageReadData(data: unknown): data is PageReadData {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    return (
      typeof obj.firstReadAt === 'number' &&
      typeof obj.lastReadAt === 'number' &&
      typeof obj.readCount === 'number' &&
      obj.readCount >= 1
    );
  }

  private isValidDailyGoal(data: unknown): data is DailyGoal {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    return (
      (obj.type === 'pages' || obj.type === 'verses') &&
      typeof obj.target === 'number' &&
      typeof obj.enabled === 'boolean' &&
      isValidGoal(obj.type, obj.target)
    );
  }

  private isValidStreakData(data: unknown): data is StreakData {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    return (
      typeof obj.currentStreak === 'number' &&
      typeof obj.longestStreak === 'number' &&
      typeof obj.lastGoalMetDate === 'string' &&
      Array.isArray(obj.streakHistory)
    );
  }

  private isValidKhatmRecord(data: unknown): data is KhatmRecord {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    return (
      typeof obj.completedAt === 'number' &&
      typeof obj.durationDays === 'number' &&
      typeof obj.startedAt === 'number'
    );
  }

  private isValidProgressSettings(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    return (
      typeof obj.reminderEnabled === 'boolean' &&
      typeof obj.reminderTime === 'string' &&
      typeof obj.trackingEnabled === 'boolean'
    );
  }

  /**
   * Get default progress
   */
  getDefaultProgress(): ReadingProgress {
    return JSON.parse(JSON.stringify(DEFAULT_READING_PROGRESS));
  }

  /**
   * Mark a page as read
   */
  async markPageRead(pageNumber: number): Promise<ReadingProgress> {
    if (!isValidPage(pageNumber)) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }

    const progress = this.cachedProgress || await this.loadProgress();
    const now = Date.now();

    // Update page read data
    const existingData = progress.pagesRead[pageNumber];
    if (existingData) {
      progress.pagesRead[pageNumber] = {
        ...existingData,
        lastReadAt: now,
        readCount: existingData.readCount + 1,
      };
    } else {
      progress.pagesRead[pageNumber] = {
        firstReadAt: now,
        lastReadAt: now,
        readCount: 1,
      };
    }

    // Update today's record in streak history
    await this.updateTodayRecord(progress);

    // Check for Khatm completion
    const khatmCompleted = await this.checkKhatmCompletion(progress);
    if (khatmCompleted) {
      // Khatm was completed and progress was reset
      return this.cachedProgress!;
    }

    // Save and return
    await this.saveProgress(progress);
    return progress;
  }

  /**
   * Update today's reading record
   */
  private async updateTodayRecord(progress: ReadingProgress): Promise<void> {
    const today = getTodayDateString();
    const todayPagesRead = this.getTodayPagesRead(progress);
    const todayVersesRead = estimateVersesForPages(todayPagesRead);
    const goalMet = this.isGoalMet(progress, todayPagesRead.length, todayVersesRead);

    // Find or create today's record
    const existingIndex = progress.streak.streakHistory.findIndex(r => r.date === today);
    const todayRecord: DailyRecord = {
      date: today,
      pagesRead: todayPagesRead.length,
      versesRead: todayVersesRead,
      goalMet,
    };

    if (existingIndex >= 0) {
      progress.streak.streakHistory[existingIndex] = todayRecord;
    } else {
      progress.streak.streakHistory.push(todayRecord);
    }

    // Keep only last 30 days of history
    if (progress.streak.streakHistory.length > 30) {
      progress.streak.streakHistory = progress.streak.streakHistory.slice(-30);
    }

    // Update streak
    await this.updateStreak(progress);
  }

  /**
   * Get pages read today
   */
  private getTodayPagesRead(progress: ReadingProgress): number[] {
    const today = getTodayDateString();
    const todayStart = new Date(today).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    return Object.entries(progress.pagesRead)
      .filter(([_, data]) => data.lastReadAt >= todayStart && data.lastReadAt < todayEnd)
      .map(([page, _]) => parseInt(page, 10));
  }

  /**
   * Check if daily goal is met
   */
  private isGoalMet(progress: ReadingProgress, pagesRead: number, versesRead: number): boolean {
    if (!progress.dailyGoal.enabled) {
      return true; // No goal set, consider it met
    }

    if (progress.dailyGoal.type === 'pages') {
      return pagesRead >= progress.dailyGoal.target;
    } else {
      return versesRead >= progress.dailyGoal.target;
    }
  }

  /**
   * Update daily goal
   */
  async setDailyGoal(goal: DailyGoal): Promise<void> {
    if (!isValidGoal(goal.type, goal.target)) {
      throw new Error(`Invalid goal: ${goal.type} = ${goal.target}`);
    }

    const progress = this.cachedProgress || await this.loadProgress();
    progress.dailyGoal = goal;
    await this.saveProgress(progress);
  }

  /**
   * Update streak based on current progress
   */
  async updateStreak(progress: ReadingProgress): Promise<StreakData> {
    const today = getTodayDateString();
    const todayRecord = progress.streak.streakHistory.find(r => r.date === today);

    if (!todayRecord) {
      return progress.streak;
    }

    if (todayRecord.goalMet) {
      // Goal met today
      if (progress.streak.lastGoalMetDate === '') {
        // First time meeting goal
        progress.streak.currentStreak = 1;
      } else if (isToday(progress.streak.lastGoalMetDate)) {
        // Already counted today, no change
      } else if (isYesterday(progress.streak.lastGoalMetDate)) {
        // Continuing streak from yesterday
        progress.streak.currentStreak += 1;
      } else {
        // Streak was broken, start new
        progress.streak.currentStreak = 1;
      }

      progress.streak.lastGoalMetDate = today;
      
      // Update longest streak
      if (progress.streak.currentStreak > progress.streak.longestStreak) {
        progress.streak.longestStreak = progress.streak.currentStreak;
      }
    }

    return progress.streak;
  }

  /**
   * Check if streak should be reset (called on app open)
   */
  async checkStreakReset(progress: ReadingProgress): Promise<boolean> {
    const lastDate = progress.streak.lastGoalMetDate;
    
    if (!lastDate || lastDate === '') {
      return false;
    }

    // If last goal met date is not today or yesterday, reset streak
    if (!isToday(lastDate) && !isYesterday(lastDate)) {
      progress.streak.currentStreak = 0;
      await this.saveProgress(progress);
      return true;
    }

    return false;
  }

  /**
   * Check for Khatm completion
   */
  async checkKhatmCompletion(progress: ReadingProgress): Promise<boolean> {
    const pagesReadCount = Object.keys(progress.pagesRead).length;
    
    if (pagesReadCount >= QURAN_CONSTANTS.TOTAL_PAGES) {
      // All pages read - Khatm complete!
      await this.recordKhatmCompletion(progress);
      return true;
    }

    return false;
  }

  /**
   * Record Khatm completion and start new cycle
   */
  private async recordKhatmCompletion(progress: ReadingProgress): Promise<void> {
    const now = Date.now();
    
    // Find the earliest page read timestamp to calculate duration
    let earliestRead = now;
    for (const data of Object.values(progress.pagesRead)) {
      if (data.firstReadAt < earliestRead) {
        earliestRead = data.firstReadAt;
      }
    }

    const durationMs = now - earliestRead;
    const durationDays = Math.ceil(durationMs / (24 * 60 * 60 * 1000));

    const khatmRecord: KhatmRecord = {
      completedAt: now,
      durationDays,
      startedAt: earliestRead,
    };

    progress.khatmHistory.push(khatmRecord);

    // Reset pages for new cycle
    progress.pagesRead = {};

    await this.saveProgress(progress);
  }

  /**
   * Start a new Khatm cycle manually
   */
  async startNewKhatmCycle(): Promise<ReadingProgress> {
    const progress = this.cachedProgress || await this.loadProgress();
    progress.pagesRead = {};
    await this.saveProgress(progress);
    return progress;
  }

  /**
   * Update progress settings
   */
  async updateSettings(settings: Partial<ReadingProgress['settings']>): Promise<void> {
    const progress = this.cachedProgress || await this.loadProgress();
    progress.settings = { ...progress.settings, ...settings };
    await this.saveProgress(progress);
  }

  /**
   * Get cached progress (for synchronous access)
   */
  getCachedProgress(): ReadingProgress | null {
    return this.cachedProgress;
  }

  /**
   * Clear all progress data
   */
  async clearProgress(): Promise<void> {
    await AsyncStorage.removeItem(PROGRESS_STORAGE_KEY);
    this.cachedProgress = null;
  }
}

// Export singleton instance
export const progressTrackerService = new ProgressTrackerService();
export default progressTrackerService;
