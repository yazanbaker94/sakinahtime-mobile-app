/**
 * RevisionScheduleService
 * Service for managing spaced repetition revision schedule
 * Uses SM-2 inspired algorithm for optimal memorization retention
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  RevisionEntry,
  VerseKey,
  VerseProgress,
  MemorizationStatus,
} from '../types/hifz';
import {
  HIFZ_STORAGE_KEYS,
  MIN_EASE_FACTOR,
  DEFAULT_EASE_FACTOR,
  REVISION_INTERVALS,
} from '../constants/hifz';
import { hifzProgressService } from './HifzProgressService';

interface RevisionSchedule {
  entries: Record<VerseKey, RevisionEntry>;
  lastUpdated: string;
}

class RevisionScheduleService {
  private schedule: RevisionSchedule | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const stored = await AsyncStorage.getItem(HIFZ_STORAGE_KEYS.REVISION_SCHEDULE);
      if (stored) {
        this.schedule = JSON.parse(stored);
      } else {
        this.schedule = {
          entries: {},
          lastUpdated: new Date().toISOString(),
        };
      }
      this.initialized = true;
    } catch (error) {
      console.error('[RevisionScheduleService] Failed to initialize:', error);
      this.schedule = {
        entries: {},
        lastUpdated: new Date().toISOString(),
      };
      this.initialized = true;
    }
  }

  private async saveSchedule(): Promise<void> {
    if (!this.schedule) return;
    
    try {
      this.schedule.lastUpdated = new Date().toISOString();
      await AsyncStorage.setItem(HIFZ_STORAGE_KEYS.REVISION_SCHEDULE, JSON.stringify(this.schedule));
    } catch (error) {
      console.error('[RevisionScheduleService] Failed to save schedule:', error);
    }
  }

  /**
   * Record a revision and update the schedule using SM-2 algorithm
   * @param verseKey The verse that was revised
   * @param quality Quality of recall (0-5 scale)
   *   0 - Complete blackout
   *   1 - Incorrect, but remembered upon seeing answer
   *   2 - Incorrect, but answer seemed easy to recall
   *   3 - Correct with serious difficulty
   *   4 - Correct with some hesitation
   *   5 - Perfect response
   */
  async recordRevision(verseKey: VerseKey, quality: number): Promise<void> {
    await this.initialize();
    if (!this.schedule) return;

    const [surah, ayah] = verseKey.split(':').map(Number);
    const existing = this.schedule.entries[verseKey];
    const now = new Date().toISOString();

    // Get current values or defaults
    let easeFactor = existing?.easeFactor || DEFAULT_EASE_FACTOR;
    let interval = existing?.interval || 0;

    // SM-2 Algorithm
    if (quality < 3) {
      // Failed recall - reset to beginning
      interval = 1;
      easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
    } else {
      // Successful recall
      // Update ease factor
      easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor);

      // Calculate next interval
      if (interval === 0) {
        interval = 1;
      } else if (interval === 1) {
        interval = 3;
      } else {
        interval = Math.round(interval * easeFactor);
      }
    }

    // Calculate next due date
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + interval);

    // Update schedule entry
    this.schedule.entries[verseKey] = {
      verseKey,
      surah,
      ayah,
      dueDate: nextDue.toISOString(),
      interval,
      easeFactor,
      lastRevised: now,
      lastRevision: Date.now(),
      status: 'memorized',
    };

    await this.saveSchedule();

    // Also update the progress service
    const progress = await hifzProgressService.getProgress();
    if (progress.verses[verseKey]) {
      progress.verses[verseKey].lastRevised = now;
      progress.verses[verseKey].revisionCount = (progress.verses[verseKey].revisionCount || 0) + 1;
      progress.verses[verseKey].nextRevisionDue = nextDue.toISOString();
      progress.verses[verseKey].easeFactor = easeFactor;
      progress.verses[verseKey].interval = interval;
    }
  }

  /**
   * Get all revisions that are due (past their due date)
   */
  getDueRevisions(): RevisionEntry[] {
    if (!this.schedule) return [];

    const now = new Date();
    const due: RevisionEntry[] = [];

    for (const entry of Object.values(this.schedule.entries)) {
      if (entry.dueDate && new Date(entry.dueDate) <= now) {
        due.push(entry);
      }
    }

    // Sort by due date (oldest first)
    due.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return due;
  }

  /**
   * Get revisions completed today
   */
  getTodayRevisions(): RevisionEntry[] {
    if (!this.schedule) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRevisions: RevisionEntry[] = [];

    for (const entry of Object.values(this.schedule.entries)) {
      if (entry.lastRevised) {
        const lastRevised = new Date(entry.lastRevised);
        if (lastRevised >= today && lastRevised < tomorrow) {
          todayRevisions.push(entry);
        }
      }
    }

    return todayRevisions;
  }

  /**
   * Get count of revisions completed today
   */
  getTodayCompletedCount(): number {
    return this.getTodayRevisions().length;
  }

  /**
   * Get daily revision goal
   */
  getDailyGoal(): number {
    return 10; // Default goal, could be stored in settings
  }

  /**
   * Set daily revision goal
   */
  async setDailyGoal(goal: number): Promise<void> {
    // Could store this in AsyncStorage if needed
    console.log('[RevisionScheduleService] Daily goal set to:', goal);
  }

  /**
   * Get revision entry for a specific verse
   */
  getRevisionEntry(verseKey: VerseKey): RevisionEntry | null {
    if (!this.schedule) return null;
    return this.schedule.entries[verseKey] || null;
  }

  /**
   * Get next revision date for a specific verse (sync version)
   */
  getNextRevisionDate(verseKey: VerseKey): Date | null {
    const entry = this.schedule?.entries[verseKey];
    return entry?.dueDate ? new Date(entry.dueDate) : null;
  }

  /**
   * Get daily revision suggestions (sync version)
   * @param limit Maximum number of suggestions to return
   */
  getDailySuggestions(limit: number = 10): RevisionEntry[] {
    const due = this.getDueRevisions();
    return due.slice(0, limit);
  }

  /**
   * Get count of overdue revisions
   */
  async getOverdueCount(): Promise<number> {
    const due = await this.getDueRevisions();
    return due.length;
  }

  /**
   * Get next revision date for a specific verse (async version)
   */
  async getNextRevisionDateAsync(verseKey: VerseKey): Promise<Date | null> {
    await this.initialize();
    const entry = this.schedule?.entries[verseKey];
    return entry?.dueDate ? new Date(entry.dueDate) : null;
  }

  /**
   * Check if a verse is due for revision
   */
  async isVerseDueForRevision(verseKey: VerseKey): Promise<boolean> {
    await this.initialize();
    const entry = this.schedule?.entries[verseKey];
    if (!entry?.dueDate) return false;
    return new Date(entry.dueDate) <= new Date();
  }

  /**
   * Get revision history for a verse
   */
  async getVerseRevisionInfo(verseKey: VerseKey): Promise<RevisionEntry | null> {
    await this.initialize();
    return this.schedule?.entries[verseKey] || null;
  }

  /**
   * Add a verse to the revision schedule (when first memorized)
   */
  async addToSchedule(verseKey: VerseKey): Promise<void> {
    await this.initialize();
    if (!this.schedule) return;

    const [surah, ayah] = verseKey.split(':').map(Number);
    const now = new Date();
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 1); // First revision after 1 day

    this.schedule.entries[verseKey] = {
      verseKey,
      surah,
      ayah,
      dueDate: nextDue.toISOString(),
      interval: 1,
      easeFactor: DEFAULT_EASE_FACTOR,
      lastRevised: now.toISOString(),
      lastRevision: now.getTime(),
      status: 'memorized',
    };

    await this.saveSchedule();
  }

  /**
   * Remove a verse from the revision schedule
   */
  async removeFromSchedule(verseKey: VerseKey): Promise<void> {
    await this.initialize();
    if (!this.schedule) return;

    delete this.schedule.entries[verseKey];
    await this.saveSchedule();
  }

  /**
   * Get upcoming revisions for the next N days
   */
  async getUpcomingRevisions(days: number = 7): Promise<RevisionEntry[]> {
    await this.initialize();
    if (!this.schedule) return [];

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const upcoming: RevisionEntry[] = [];

    for (const entry of Object.values(this.schedule.entries)) {
      const dueDate = new Date(entry.dueDate);
      if (dueDate >= now && dueDate <= futureDate) {
        upcoming.push(entry);
      }
    }

    // Sort by due date
    upcoming.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return upcoming;
  }

  /**
   * Get revision statistics
   */
  async getRevisionStats(): Promise<{
    totalScheduled: number;
    dueToday: number;
    dueThisWeek: number;
    averageEaseFactor: number;
    averageInterval: number;
  }> {
    await this.initialize();
    if (!this.schedule) {
      return {
        totalScheduled: 0,
        dueToday: 0,
        dueThisWeek: 0,
        averageEaseFactor: DEFAULT_EASE_FACTOR,
        averageInterval: 0,
      };
    }

    const entries = Object.values(this.schedule.entries);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    let dueToday = 0;
    let dueThisWeek = 0;
    let totalEaseFactor = 0;
    let totalInterval = 0;

    for (const entry of entries) {
      const dueDate = new Date(entry.dueDate);
      
      if (dueDate <= now) {
        dueToday++;
        dueThisWeek++;
      } else if (dueDate <= weekFromNow) {
        dueThisWeek++;
      }

      totalEaseFactor += entry.easeFactor;
      totalInterval += entry.interval;
    }

    return {
      totalScheduled: entries.length,
      dueToday,
      dueThisWeek,
      averageEaseFactor: entries.length > 0 ? totalEaseFactor / entries.length : DEFAULT_EASE_FACTOR,
      averageInterval: entries.length > 0 ? totalInterval / entries.length : 0,
    };
  }

  /**
   * Reset the entire revision schedule
   */
  async resetSchedule(): Promise<void> {
    this.schedule = {
      entries: {},
      lastUpdated: new Date().toISOString(),
    };
    await this.saveSchedule();
  }
}

export const revisionScheduleService = new RevisionScheduleService();
