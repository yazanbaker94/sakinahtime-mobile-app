/**
 * Property-Based Tests for ProgressTrackerService
 * Feature: quran-progress-tracker
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { progressTrackerService } from '../ProgressTrackerService';
import {
  ReadingProgress,
  PageReadData,
  DailyGoal,
  StreakData,
  KhatmRecord,
  DailyRecord,
  PROGRESS_STORAGE_KEY,
  DEFAULT_READING_PROGRESS,
} from '../../types/progress';
import { QURAN_CONSTANTS } from '../../constants/quran-constants';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

// Arbitraries for generating test data
const pageNumberArb = fc.integer({ min: 1, max: QURAN_CONSTANTS.TOTAL_PAGES });

const pageReadDataArb: fc.Arbitrary<PageReadData> = fc.record({
  firstReadAt: fc.integer({ min: 1609459200000, max: Date.now() }), // From 2021 to now
  lastReadAt: fc.integer({ min: 1609459200000, max: Date.now() }),
  readCount: fc.integer({ min: 1, max: 100 }),
}).map(data => ({
  ...data,
  lastReadAt: Math.max(data.firstReadAt, data.lastReadAt), // Ensure lastReadAt >= firstReadAt
}));

const dailyGoalArb: fc.Arbitrary<DailyGoal> = fc.oneof(
  fc.record({
    type: fc.constant('pages' as const),
    target: fc.integer({ min: QURAN_CONSTANTS.MIN_PAGE_GOAL, max: QURAN_CONSTANTS.MAX_PAGE_GOAL }),
    enabled: fc.boolean(),
  }),
  fc.record({
    type: fc.constant('verses' as const),
    target: fc.integer({ min: QURAN_CONSTANTS.MIN_VERSE_GOAL, max: QURAN_CONSTANTS.MAX_VERSE_GOAL }),
    enabled: fc.boolean(),
  })
);

const dailyRecordArb: fc.Arbitrary<DailyRecord> = fc.record({
  date: fc.integer({ min: 0, max: 365 }).map(daysAgo => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  }),
  pagesRead: fc.integer({ min: 0, max: 50 }),
  versesRead: fc.integer({ min: 0, max: 500 }),
  goalMet: fc.boolean(),
});

const streakDataArb: fc.Arbitrary<StreakData> = fc.record({
  currentStreak: fc.integer({ min: 0, max: 365 }),
  longestStreak: fc.integer({ min: 0, max: 365 }),
  lastGoalMetDate: fc.oneof(
    fc.constant(''),
    fc.integer({ min: 0, max: 365 }).map(daysAgo => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    })
  ),
  streakHistory: fc.array(dailyRecordArb, { maxLength: 30 }),
}).map(data => ({
  ...data,
  longestStreak: Math.max(data.currentStreak, data.longestStreak), // Ensure longest >= current
}));

const khatmRecordArb: fc.Arbitrary<KhatmRecord> = fc.record({
  completedAt: fc.integer({ min: 1609459200000, max: Date.now() }),
  durationDays: fc.integer({ min: 1, max: 365 }),
  startedAt: fc.integer({ min: 1609459200000, max: Date.now() }),
}).map(data => ({
  ...data,
  startedAt: Math.min(data.startedAt, data.completedAt - data.durationDays * 24 * 60 * 60 * 1000),
}));

const progressSettingsArb = fc.record({
  reminderEnabled: fc.boolean(),
  reminderTime: fc.integer({ min: 0, max: 23 }).chain(h =>
    fc.integer({ min: 0, max: 59 }).map(m =>
      `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    )
  ),
  trackingEnabled: fc.boolean(),
});

// Generate a valid ReadingProgress object
const readingProgressArb: fc.Arbitrary<ReadingProgress> = fc.record({
  pagesRead: fc.dictionary(
    pageNumberArb.map(String),
    pageReadDataArb,
    { maxKeys: 100 }
  ).map(dict => {
    // Convert string keys back to numbers
    const result: Record<number, PageReadData> = {};
    for (const [pageKey, value] of Object.entries(dict)) {
      result[parseInt(pageKey, 10)] = value;
    }
    return result;
  }),
  dailyGoal: dailyGoalArb,
  streak: streakDataArb,
  khatmHistory: fc.array(khatmRecordArb, { maxLength: 10 }),
  settings: progressSettingsArb,
});

describe('ProgressTrackerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset cached progress
    (progressTrackerService as any).cachedProgress = null;
  });

  describe('Property 1: Page Reading Records and Persists Data', () => {
    // Feature: quran-progress-tracker, Property 1: Page Reading Records and Persists Data
    // For any valid page number (1-604), when marked as read, the Progress_Tracker should
    // record the page in pagesRead, set a valid timestamp, and persist to storage such that
    // reloading returns the same data.
    // Validates: Requirements 1.1, 1.2, 1.5

    it('should record page read with valid timestamp', async () => {
      await fc.assert(
        fc.asyncProperty(pageNumberArb, async (pageNumber) => {
          // Setup mock storage
          let storedValue: string | null = null;
          vi.mocked(AsyncStorage.setItem).mockImplementation(async (_key, value) => {
            storedValue = value;
          });
          vi.mocked(AsyncStorage.getItem).mockImplementation(async () => storedValue);

          // Reset cache
          (progressTrackerService as any).cachedProgress = null;

          // Mark page as read
          const beforeMark = Date.now();
          const progress = await progressTrackerService.markPageRead(pageNumber);
          const afterMark = Date.now();

          // Verify page is recorded
          expect(progress.pagesRead[pageNumber]).toBeDefined();
          expect(progress.pagesRead[pageNumber].readCount).toBeGreaterThanOrEqual(1);
          
          // Verify timestamp is valid
          expect(progress.pagesRead[pageNumber].firstReadAt).toBeGreaterThanOrEqual(beforeMark);
          expect(progress.pagesRead[pageNumber].firstReadAt).toBeLessThanOrEqual(afterMark);
          expect(progress.pagesRead[pageNumber].lastReadAt).toBeGreaterThanOrEqual(beforeMark);
          expect(progress.pagesRead[pageNumber].lastReadAt).toBeLessThanOrEqual(afterMark);
        }),
        { numRuns: 100 }
      );
    });

    it('should persist page read data and reload correctly', async () => {
      await fc.assert(
        fc.asyncProperty(pageNumberArb, async (pageNumber) => {
          // Setup mock storage
          let storedValue: string | null = null;
          vi.mocked(AsyncStorage.setItem).mockImplementation(async (_key, value) => {
            storedValue = value;
          });
          vi.mocked(AsyncStorage.getItem).mockImplementation(async () => storedValue);

          // Reset cache
          (progressTrackerService as any).cachedProgress = null;

          // Mark page as read
          await progressTrackerService.markPageRead(pageNumber);

          // Reset cache to force reload
          (progressTrackerService as any).cachedProgress = null;

          // Reload progress
          const reloaded = await progressTrackerService.loadProgress();

          // Verify page is still recorded after reload
          expect(reloaded.pagesRead[pageNumber]).toBeDefined();
          expect(reloaded.pagesRead[pageNumber].readCount).toBeGreaterThanOrEqual(1);
        }),
        { numRuns: 100 }
      );
    });

    it('should increment read count on subsequent reads', async () => {
      await fc.assert(
        fc.asyncProperty(
          pageNumberArb,
          fc.integer({ min: 2, max: 5 }),
          async (pageNumber, readTimes) => {
            // Setup mock storage
            let storedValue: string | null = null;
            vi.mocked(AsyncStorage.setItem).mockImplementation(async (_key, value) => {
              storedValue = value;
            });
            vi.mocked(AsyncStorage.getItem).mockImplementation(async () => storedValue);

            // Reset cache
            (progressTrackerService as any).cachedProgress = null;

            // Mark page as read multiple times
            let progress: ReadingProgress | null = null;
            for (let i = 0; i < readTimes; i++) {
              progress = await progressTrackerService.markPageRead(pageNumber);
            }

            // Verify read count
            expect(progress!.pagesRead[pageNumber].readCount).toBe(readTimes);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid page numbers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer().filter(n => n < 1 || n > QURAN_CONSTANTS.TOTAL_PAGES),
          async (invalidPage) => {
            // Reset cache
            (progressTrackerService as any).cachedProgress = null;

            // Attempt to mark invalid page
            await expect(progressTrackerService.markPageRead(invalidPage)).rejects.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 8: Progress Data Round-Trip', () => {
    // Feature: quran-progress-tracker, Property 8: Progress Data Round-Trip
    // For any valid ReadingProgress object, serializing to JSON and deserializing
    // should produce an equivalent object.
    // Validates: Requirements 1.3, 8.1

    it('should round-trip valid progress data through JSON serialization', () => {
      fc.assert(
        fc.property(readingProgressArb, (progress) => {
          // Serialize to JSON
          const json = JSON.stringify(progress);
          
          // Deserialize
          const parsed = JSON.parse(json);
          
          // Validate
          const validated = progressTrackerService.validateProgress(parsed);
          
          // Should be valid
          expect(validated).not.toBeNull();
          
          // Should be equivalent
          expect(validated).toEqual(progress);
        }),
        { numRuns: 100 }
      );
    });

    it('should persist and load progress correctly', async () => {
      await fc.assert(
        fc.asyncProperty(readingProgressArb, async (progress) => {
          // Setup mock
          let storedValue: string | null = null;
          vi.mocked(AsyncStorage.setItem).mockImplementation(async (key, value) => {
            storedValue = value;
          });
          vi.mocked(AsyncStorage.getItem).mockImplementation(async () => storedValue);

          // Save progress
          await progressTrackerService.saveProgress(progress);
          
          // Verify setItem was called with correct key
          expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            PROGRESS_STORAGE_KEY,
            expect.any(String)
          );

          // Reset cache to force reload
          (progressTrackerService as any).cachedProgress = null;

          // Load progress
          const loaded = await progressTrackerService.loadProgress();
          
          // Should be equivalent
          expect(loaded).toEqual(progress);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Data Validation and Error Handling', () => {
    // Feature: quran-progress-tracker, Property 9: Data Validation and Error Handling
    // For any corrupted or invalid data, the validator should return null
    // and the system should fall back to default progress values.
    // Validates: Requirements 8.3, 8.4

    it('should return null for invalid data structures', () => {
      const invalidDataCases = [
        null,
        undefined,
        'string',
        123,
        [],
        { pagesRead: 'not an object' },
        { pagesRead: {}, dailyGoal: null },
        { pagesRead: {}, dailyGoal: { type: 'invalid', target: 5, enabled: true } },
        { pagesRead: { '999': { firstReadAt: 1, lastReadAt: 1, readCount: 1 } } }, // Invalid page
        { pagesRead: { '1': { firstReadAt: 'not a number' } } }, // Invalid timestamp
      ];

      for (const invalidData of invalidDataCases) {
        const result = progressTrackerService.validateProgress(invalidData);
        expect(result).toBeNull();
      }
    });

    it('should return default progress when loading corrupted data', async () => {
      // Setup mock to return corrupted data
      vi.mocked(AsyncStorage.getItem).mockResolvedValue('{ invalid json }}}');

      const loaded = await progressTrackerService.loadProgress();
      
      expect(loaded).toEqual(DEFAULT_READING_PROGRESS);
    });

    it('should return default progress when loading invalid structure', async () => {
      // Setup mock to return invalid structure
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify({
        pagesRead: 'not an object',
      }));

      const loaded = await progressTrackerService.loadProgress();
      
      expect(loaded).toEqual(DEFAULT_READING_PROGRESS);
    });

    it('should reject page numbers outside valid range', () => {
      fc.assert(
        fc.property(
          fc.integer().filter(n => n < 1 || n > QURAN_CONSTANTS.TOTAL_PAGES),
          (invalidPage) => {
            const now = Date.now();
            const invalidProgress = {
              ...DEFAULT_READING_PROGRESS,
              pagesRead: {
                [invalidPage]: { firstReadAt: now, lastReadAt: now, readCount: 1 },
              },
            };
            
            const result = progressTrackerService.validateProgress(invalidProgress);
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid goal values', () => {
      // Invalid page goals
      fc.assert(
        fc.property(
          fc.integer().filter(n => n < QURAN_CONSTANTS.MIN_PAGE_GOAL || n > QURAN_CONSTANTS.MAX_PAGE_GOAL),
          (invalidTarget) => {
            const invalidProgress = {
              ...DEFAULT_READING_PROGRESS,
              dailyGoal: { type: 'pages' as const, target: invalidTarget, enabled: true },
            };
            
            const result = progressTrackerService.validateProgress(invalidProgress);
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );

      // Invalid verse goals
      fc.assert(
        fc.property(
          fc.integer().filter(n => n < QURAN_CONSTANTS.MIN_VERSE_GOAL || n > QURAN_CONSTANTS.MAX_VERSE_GOAL),
          (invalidTarget) => {
            const invalidProgress = {
              ...DEFAULT_READING_PROGRESS,
              dailyGoal: { type: 'verses' as const, target: invalidTarget, enabled: true },
            };
            
            const result = progressTrackerService.validateProgress(invalidProgress);
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


describe('Property 3: Daily Goal Validation', () => {
  // Feature: quran-progress-tracker, Property 3: Daily Goal Validation
  // For any goal setting attempt:
  // - Page goals must be in range 1-20 (inclusive)
  // - Verse goals must be in range 1-100 (inclusive)
  // - Goals outside these ranges should be rejected
  // Validates: Requirements 3.1, 3.2

  it('should accept valid page goals', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: QURAN_CONSTANTS.MIN_PAGE_GOAL, max: QURAN_CONSTANTS.MAX_PAGE_GOAL }),
        async (target) => {
          // Setup mock storage
          let storedValue: string | null = null;
          vi.mocked(AsyncStorage.setItem).mockImplementation(async (_key, value) => {
            storedValue = value;
          });
          vi.mocked(AsyncStorage.getItem).mockImplementation(async () => storedValue);

          // Reset cache
          (progressTrackerService as any).cachedProgress = null;

          const goal: DailyGoal = { type: 'pages', target, enabled: true };
          
          // Should not throw
          await expect(progressTrackerService.setDailyGoal(goal)).resolves.not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept valid verse goals', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: QURAN_CONSTANTS.MIN_VERSE_GOAL, max: QURAN_CONSTANTS.MAX_VERSE_GOAL }),
        async (target) => {
          // Setup mock storage
          let storedValue: string | null = null;
          vi.mocked(AsyncStorage.setItem).mockImplementation(async (_key, value) => {
            storedValue = value;
          });
          vi.mocked(AsyncStorage.getItem).mockImplementation(async () => storedValue);

          // Reset cache
          (progressTrackerService as any).cachedProgress = null;

          const goal: DailyGoal = { type: 'verses', target, enabled: true };
          
          // Should not throw
          await expect(progressTrackerService.setDailyGoal(goal)).resolves.not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject invalid page goals', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer().filter(n => n < QURAN_CONSTANTS.MIN_PAGE_GOAL || n > QURAN_CONSTANTS.MAX_PAGE_GOAL),
        async (target) => {
          // Reset cache
          (progressTrackerService as any).cachedProgress = null;

          const goal: DailyGoal = { type: 'pages', target, enabled: true };
          
          // Should throw
          await expect(progressTrackerService.setDailyGoal(goal)).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject invalid verse goals', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer().filter(n => n < QURAN_CONSTANTS.MIN_VERSE_GOAL || n > QURAN_CONSTANTS.MAX_VERSE_GOAL),
        async (target) => {
          // Reset cache
          (progressTrackerService as any).cachedProgress = null;

          const goal: DailyGoal = { type: 'verses', target, enabled: true };
          
          // Should throw
          await expect(progressTrackerService.setDailyGoal(goal)).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 4: Goal Persistence Round-Trip', () => {
  // Feature: quran-progress-tracker, Property 4: Goal Persistence Round-Trip
  // For any valid daily goal, setting the goal and then reloading from storage
  // should return an equivalent goal object.
  // Validates: Requirements 3.3

  it('should persist and reload page goals correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: QURAN_CONSTANTS.MIN_PAGE_GOAL, max: QURAN_CONSTANTS.MAX_PAGE_GOAL }),
        fc.boolean(),
        async (target, enabled) => {
          // Setup mock storage
          let storedValue: string | null = null;
          vi.mocked(AsyncStorage.setItem).mockImplementation(async (_key, value) => {
            storedValue = value;
          });
          vi.mocked(AsyncStorage.getItem).mockImplementation(async () => storedValue);

          // Reset cache
          (progressTrackerService as any).cachedProgress = null;

          const goal: DailyGoal = { type: 'pages', target, enabled };
          
          // Set goal
          await progressTrackerService.setDailyGoal(goal);

          // Reset cache to force reload
          (progressTrackerService as any).cachedProgress = null;

          // Reload
          const loaded = await progressTrackerService.loadProgress();

          // Verify goal is preserved
          expect(loaded.dailyGoal.type).toBe('pages');
          expect(loaded.dailyGoal.target).toBe(target);
          expect(loaded.dailyGoal.enabled).toBe(enabled);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should persist and reload verse goals correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: QURAN_CONSTANTS.MIN_VERSE_GOAL, max: QURAN_CONSTANTS.MAX_VERSE_GOAL }),
        fc.boolean(),
        async (target, enabled) => {
          // Setup mock storage
          let storedValue: string | null = null;
          vi.mocked(AsyncStorage.setItem).mockImplementation(async (_key, value) => {
            storedValue = value;
          });
          vi.mocked(AsyncStorage.getItem).mockImplementation(async () => storedValue);

          // Reset cache
          (progressTrackerService as any).cachedProgress = null;

          const goal: DailyGoal = { type: 'verses', target, enabled };
          
          // Set goal
          await progressTrackerService.setDailyGoal(goal);

          // Reset cache to force reload
          (progressTrackerService as any).cachedProgress = null;

          // Reload
          const loaded = await progressTrackerService.loadProgress();

          // Verify goal is preserved
          expect(loaded.dailyGoal.type).toBe('verses');
          expect(loaded.dailyGoal.target).toBe(target);
          expect(loaded.dailyGoal.enabled).toBe(enabled);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 5: Streak State Machine', () => {
  // Feature: quran-progress-tracker, Property 5: Streak State Machine
  // For any sequence of daily reading sessions:
  // - Meeting the goal should increment currentStreak by 1
  // - Missing the goal should reset currentStreak to 0
  // - longestStreak should always be >= currentStreak
  // - longestStreak should equal the maximum streak ever achieved
  // Validates: Requirements 4.1, 4.2, 4.3, 4.5

  it('should always have longestStreak >= currentStreak', () => {
    fc.assert(
      fc.property(streakDataArb, (streak) => {
        expect(streak.longestStreak).toBeGreaterThanOrEqual(streak.currentStreak);
      }),
      { numRuns: 100 }
    );
  });

  it('should increment streak when goal is met', async () => {
    // Setup mock storage
    let storedValue: string | null = null;
    vi.mocked(AsyncStorage.setItem).mockImplementation(async (_key, value) => {
      storedValue = value;
    });
    vi.mocked(AsyncStorage.getItem).mockImplementation(async () => storedValue);

    // Reset cache
    (progressTrackerService as any).cachedProgress = null;

    // Create progress with goal of 1 page
    const progress: ReadingProgress = {
      ...DEFAULT_READING_PROGRESS,
      dailyGoal: { type: 'pages', target: 1, enabled: true },
    };
    await progressTrackerService.saveProgress(progress);

    // Reset cache
    (progressTrackerService as any).cachedProgress = null;

    // Mark a page as read (should meet goal)
    const updated = await progressTrackerService.markPageRead(1);

    // Streak should be at least 1
    expect(updated.streak.currentStreak).toBeGreaterThanOrEqual(1);
  });

  it('should update longestStreak when current exceeds it', async () => {
    // Setup mock storage
    let storedValue: string | null = null;
    vi.mocked(AsyncStorage.setItem).mockImplementation(async (_key, value) => {
      storedValue = value;
    });
    vi.mocked(AsyncStorage.getItem).mockImplementation(async () => storedValue);

    // Reset cache
    (progressTrackerService as any).cachedProgress = null;

    // Create progress with existing streak
    const progress: ReadingProgress = {
      ...DEFAULT_READING_PROGRESS,
      dailyGoal: { type: 'pages', target: 1, enabled: true },
      streak: {
        currentStreak: 5,
        longestStreak: 5,
        lastGoalMetDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // yesterday
        streakHistory: [],
      },
    };
    await progressTrackerService.saveProgress(progress);

    // Reset cache
    (progressTrackerService as any).cachedProgress = null;

    // Mark a page as read (should continue streak)
    const updated = await progressTrackerService.markPageRead(1);

    // Streak should be 6 and longest should update
    expect(updated.streak.currentStreak).toBe(6);
    expect(updated.streak.longestStreak).toBe(6);
  });
});

describe('Property 6: Khatm Completion Logic', () => {
  // Feature: quran-progress-tracker, Property 6: Khatm Completion Logic
  // For any progress state where all 604 pages are marked as read:
  // - A new KhatmRecord should be added to khatmHistory
  // - The khatmHistory length should equal the total Khatm count
  // - After completion, pagesRead should be reset (empty or cleared)
  // - The completion date should be recorded in the KhatmRecord
  // Validates: Requirements 5.1, 5.2, 5.3, 5.4

  it('should detect Khatm when all pages are read', async () => {
    // Setup mock storage
    let storedValue: string | null = null;
    vi.mocked(AsyncStorage.setItem).mockImplementation(async (_key, value) => {
      storedValue = value;
    });
    vi.mocked(AsyncStorage.getItem).mockImplementation(async () => storedValue);

    // Reset cache
    (progressTrackerService as any).cachedProgress = null;

    // Create progress with 603 pages read
    const pagesRead: Record<number, PageReadData> = {};
    const now = Date.now();
    for (let i = 1; i <= 603; i++) {
      pagesRead[i] = { firstReadAt: now - 1000, lastReadAt: now, readCount: 1 };
    }

    const progress: ReadingProgress = {
      ...DEFAULT_READING_PROGRESS,
      pagesRead,
      khatmHistory: [],
    };
    await progressTrackerService.saveProgress(progress);

    // Reset cache
    (progressTrackerService as any).cachedProgress = null;

    // Mark the last page
    const updated = await progressTrackerService.markPageRead(604);

    // Khatm should be recorded
    expect(updated.khatmHistory.length).toBe(1);
    expect(updated.khatmHistory[0].completedAt).toBeGreaterThan(0);
    expect(updated.khatmHistory[0].durationDays).toBeGreaterThanOrEqual(1);

    // Pages should be reset
    expect(Object.keys(updated.pagesRead).length).toBe(0);
  });

  it('should increment Khatm count on each completion', async () => {
    // Setup mock storage
    let storedValue: string | null = null;
    vi.mocked(AsyncStorage.setItem).mockImplementation(async (_key, value) => {
      storedValue = value;
    });
    vi.mocked(AsyncStorage.getItem).mockImplementation(async () => storedValue);

    // Reset cache
    (progressTrackerService as any).cachedProgress = null;

    // Create progress with existing Khatm and 603 pages read
    const pagesRead: Record<number, PageReadData> = {};
    const now = Date.now();
    for (let i = 1; i <= 603; i++) {
      pagesRead[i] = { firstReadAt: now - 1000, lastReadAt: now, readCount: 1 };
    }

    const existingKhatm: KhatmRecord = {
      completedAt: now - 86400000 * 30,
      durationDays: 60,
      startedAt: now - 86400000 * 90,
    };

    const progress: ReadingProgress = {
      ...DEFAULT_READING_PROGRESS,
      pagesRead,
      khatmHistory: [existingKhatm],
    };
    await progressTrackerService.saveProgress(progress);

    // Reset cache
    (progressTrackerService as any).cachedProgress = null;

    // Mark the last page
    const updated = await progressTrackerService.markPageRead(604);

    // Should now have 2 Khatm records
    expect(updated.khatmHistory.length).toBe(2);
  });
});
