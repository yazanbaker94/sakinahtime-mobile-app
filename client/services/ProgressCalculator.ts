/**
 * Progress Calculator Service
 * Calculates statistics, daily progress, and weekly data
 * Feature: quran-progress-tracker
 */

import {
  ReadingProgress,
  JuzStatus,
  DailyProgress,
  WeeklyData,
  ReadingStats,
} from '../types/progress';
import {
  QURAN_CONSTANTS,
  getJuzForPage,
  getJuzPageRange,
  getJuzTotalPages,
  estimateVersesForPages,
  getTodayDateString,
} from '../constants/quran-constants';

export class ProgressCalculator {
  /**
   * Get total unique pages read
   */
  static getTotalPagesRead(progress: ReadingProgress): number {
    return Object.keys(progress.pagesRead).length;
  }

  /**
   * Get completion percentage (0-100)
   */
  static getCompletionPercentage(progress: ReadingProgress): number {
    const pagesRead = this.getTotalPagesRead(progress);
    return (pagesRead / QURAN_CONSTANTS.TOTAL_PAGES) * 100;
  }

  /**
   * Get estimated verses read based on pages
   */
  static getVersesRead(pagesRead: number[]): number {
    return estimateVersesForPages(pagesRead);
  }

  /**
   * Get Juz completion status for all 30 Juz
   */
  static getJuzCompletion(progress: ReadingProgress): JuzStatus[] {
    const pagesReadSet = new Set(
      Object.keys(progress.pagesRead).map(p => parseInt(p, 10))
    );

    const juzStatuses: JuzStatus[] = [];

    for (let juz = 1; juz <= QURAN_CONSTANTS.TOTAL_JUZ; juz++) {
      const range = getJuzPageRange(juz);
      const totalPages = getJuzTotalPages(juz);
      let pagesReadInJuz = 0;

      for (let page = range.start; page <= range.end; page++) {
        if (pagesReadSet.has(page)) {
          pagesReadInJuz++;
        }
      }

      juzStatuses.push({
        juzNumber: juz,
        pagesRead: pagesReadInJuz,
        totalPages,
        isComplete: pagesReadInJuz >= totalPages,
      });
    }

    return juzStatuses;
  }

  /**
   * Get number of completed Juz
   */
  static getCompletedJuzCount(progress: ReadingProgress): number {
    const juzStatuses = this.getJuzCompletion(progress);
    return juzStatuses.filter(j => j.isComplete).length;
  }

  /**
   * Get today's reading progress
   */
  static getTodayProgress(progress: ReadingProgress): DailyProgress {
    const today = getTodayDateString();
    const todayStart = new Date(today).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    // Get pages read today
    const todayPages = Object.entries(progress.pagesRead)
      .filter(([_, data]) => data.lastReadAt >= todayStart && data.lastReadAt < todayEnd)
      .map(([page]) => parseInt(page, 10));

    const pagesRead = todayPages.length;
    const versesRead = estimateVersesForPages(todayPages);

    // Calculate goal progress
    let goalProgress = 0;
    let goalMet = false;

    if (progress.dailyGoal.enabled) {
      if (progress.dailyGoal.type === 'pages') {
        goalProgress = Math.min(100, (pagesRead / progress.dailyGoal.target) * 100);
        goalMet = pagesRead >= progress.dailyGoal.target;
      } else {
        goalProgress = Math.min(100, (versesRead / progress.dailyGoal.target) * 100);
        goalMet = versesRead >= progress.dailyGoal.target;
      }
    } else {
      goalProgress = 100;
      goalMet = true;
    }

    return {
      pagesRead,
      versesRead,
      goalProgress,
      goalMet,
    };
  }

  /**
   * Get remaining amount to meet daily goal
   */
  static getRemainingForGoal(progress: ReadingProgress): number {
    if (!progress.dailyGoal.enabled) {
      return 0;
    }

    const todayProgress = this.getTodayProgress(progress);

    if (progress.dailyGoal.type === 'pages') {
      return Math.max(0, progress.dailyGoal.target - todayProgress.pagesRead);
    } else {
      return Math.max(0, progress.dailyGoal.target - todayProgress.versesRead);
    }
  }

  /**
   * Get weekly reading data (last 7 days)
   */
  static getWeeklyData(progress: ReadingProgress): WeeklyData {
    const days: WeeklyData['days'] = [];
    let totalPages = 0;

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      // Find record for this day
      const record = progress.streak.streakHistory.find(r => r.date === dateString);

      const pagesRead = record?.pagesRead ?? 0;
      const goalMet = record?.goalMet ?? false;

      days.push({
        date: dateString,
        pagesRead,
        goalMet,
      });

      totalPages += pagesRead;
    }

    return {
      days,
      totalPages,
      averagePerDay: totalPages / 7,
    };
  }

  /**
   * Get comprehensive reading statistics
   */
  static getReadingStats(progress: ReadingProgress): ReadingStats {
    const pagesReadArray = Object.keys(progress.pagesRead).map(p => parseInt(p, 10));

    return {
      totalPagesRead: this.getTotalPagesRead(progress),
      completionPercentage: this.getCompletionPercentage(progress),
      totalVersesRead: this.getVersesRead(pagesReadArray),
      juzCompleted: this.getCompletedJuzCount(progress),
      currentStreak: progress.streak.currentStreak,
      longestStreak: progress.streak.longestStreak,
      khatmCount: progress.khatmHistory.length,
    };
  }
}

export default ProgressCalculator;
