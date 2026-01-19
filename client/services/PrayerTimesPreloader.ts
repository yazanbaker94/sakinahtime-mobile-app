/**
 * PrayerTimesPreloader
 * Singleton service that pre-loads prayer times cache at app startup
 * for instant display when navigating to the prayer screen.
 */

import { prayerTimesCacheService } from './PrayerTimesCacheService';

interface PrayerTimingsData {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Sunset: string;
    Maghrib: string;
    Isha: string;
    Imsak: string;
    Midnight: string;
}

interface PreloadedPrayerData {
    timings: PrayerTimingsData;
    date: {
        hijri: any;
        gregorian: any;
    };
    meta: {
        timezone: string;
    };
}

interface PreloadState {
    data: PreloadedPrayerData | null;
    cachedAt: Date | null;
    isLoaded: boolean;
    loadPromise: Promise<void> | null;
}

class PrayerTimesPreloader {
    private state: PreloadState = {
        data: null,
        cachedAt: null,
        isLoaded: false,
        loadPromise: null,
    };

    private location: { lat: number; lng: number } | null = null;
    private method: number = 2;

    /**
     * Initialize preloader with location (call when location becomes available)
     */
    async preload(latitude: number, longitude: number, method: number = 2): Promise<void> {
        // If already loading or loaded with same params, return existing promise/result
        if (
            this.state.loadPromise &&
            this.location?.lat === latitude &&
            this.location?.lng === longitude &&
            this.method === method
        ) {
            return this.state.loadPromise;
        }

        this.location = { lat: latitude, lng: longitude };
        this.method = method;

        this.state.loadPromise = this.doPreload();
        return this.state.loadPromise;
    }

    private async doPreload(): Promise<void> {
        if (!this.location) return;

        try {
            await prayerTimesCacheService.initialize();
            const cached = await prayerTimesCacheService.getCachedPrayerTimes(
                new Date(),
                this.location,
                this.method
            );

            if (cached && cached.date && cached.timings) {
                const transformed = this.transformCachedData(cached);
                if (transformed) {
                    this.state.data = transformed;
                    this.state.cachedAt = new Date(cached.cachedAt);
                }
            }
        } catch (error) {
            console.warn('[PrayerTimesPreloader] Failed to preload:', error);
        } finally {
            this.state.isLoaded = true;
        }
    }

    /**
     * Get preloaded data (returns immediately, may be null if not loaded yet)
     */
    getPreloadedData(): { data: PreloadedPrayerData | null; cachedAt: Date | null; isLoaded: boolean } {
        return {
            data: this.state.data,
            cachedAt: this.state.cachedAt,
            isLoaded: this.state.isLoaded,
        };
    }

    /**
     * Wait for preload to complete
     */
    async waitForPreload(): Promise<{ data: PreloadedPrayerData | null; cachedAt: Date | null }> {
        if (this.state.loadPromise) {
            await this.state.loadPromise;
        }
        return {
            data: this.state.data,
            cachedAt: this.state.cachedAt,
        };
    }

    /**
     * Update cached data (call after fetching fresh data from API)
     */
    updateData(data: PreloadedPrayerData): void {
        this.state.data = data;
        this.state.cachedAt = new Date();
    }

    /**
     * Clear preloaded data
     */
    clear(): void {
        this.state = {
            data: null,
            cachedAt: null,
            isLoaded: false,
            loadPromise: null,
        };
        this.location = null;
    }

    private transformCachedData(cached: any): PreloadedPrayerData | null {
        if (!cached || !cached.date || !cached.timings) {
            return null;
        }

        try {
            const [year, month, day] = cached.date.split('-');
            const date = new Date(cached.date);

            return {
                timings: cached.timings,
                date: {
                    hijri: {
                        day: day || '1',
                        weekday: { en: '', ar: '' },
                        month: { number: parseInt(month) || 1, en: '', ar: '' },
                        year: year || '1446',
                        designation: { abbreviated: 'AH', expanded: 'Anno Hegirae' },
                    },
                    gregorian: {
                        date: `${day}-${month}-${year}`,
                        day: day || '1',
                        weekday: { en: date.toLocaleDateString('en-US', { weekday: 'long' }) },
                        month: { number: parseInt(month) || 1, en: date.toLocaleDateString('en-US', { month: 'long' }) },
                        year: year || '2025',
                    },
                },
                meta: {
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
            };
        } catch (error) {
            console.warn('[PrayerTimesPreloader] Error transforming cached data:', error);
            return null;
        }
    }
}

// Singleton instance
export const prayerTimesPreloader = new PrayerTimesPreloader();
