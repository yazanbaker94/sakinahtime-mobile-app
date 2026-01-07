/**
 * DhikrOverlayService
 * 
 * Bridge between React Native and native modules for floating overlay dhikr reminders.
 * - Android: Uses native module with SYSTEM_ALERT_WINDOW for floating overlay
 * - iOS: Falls back to local notifications via expo-notifications
 */

import { Platform, NativeModules, NativeEventEmitter } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { DhikrItem, DhikrCategory } from '@/data/dhikrContent';
import { getRandomDhikr } from '@/data/dhikrContent';
import type { ThemeColors } from '@/types/theme';

// Native module interface (Android only)
interface DhikrOverlayNativeModule {
  checkOverlayPermission(): Promise<boolean>;
  requestOverlayPermission(): void;
  startService(config: NativeServiceConfig): Promise<void>;
  stopService(): Promise<void>;
  showOverlayNow(dhikrData: NativeDhikrData): void;
  isServiceRunning(): Promise<boolean>;
}

interface NativeServiceConfig {
  intervalMinutes: number;
  autoDismissSeconds: number;
  quietHoursEnabled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
  skipDuringPrayer: boolean;
  enabledCategories: string[];
  themeColors: {
    primary: string;
    background: string;
    text: string;
    textSecondary: string;
  };
}

interface NativeDhikrData {
  id: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  source?: string;
  colorPrimary?: string;
  colorBackground?: string;
  colorText?: string;
  colorTextSecondary?: string;
}

export interface DhikrOverlayConfig {
  intervalMinutes: number;
  autoDismissSeconds: number;
  quietHours: {
    enabled: boolean;
    startHour: number;
    endHour: number;
  };
  skipDuringPrayer: boolean;
  enabledCategories: DhikrCategory[];
  themeColors: ThemeColors;
}

// Event types emitted by native module
export type DhikrOverlayEvent = 
  | { type: 'shown'; dhikrId: string }
  | { type: 'dismissed'; dhikrId: string; method: 'tap' | 'swipe' | 'timeout' }
  | { type: 'serviceStarted' }
  | { type: 'serviceStopped' };

type EventCallback = (event: DhikrOverlayEvent) => void;

class DhikrOverlayServiceClass {
  private nativeModule: DhikrOverlayNativeModule | null = null;
  private eventEmitter: NativeEventEmitter | null = null;
  private eventListeners: EventCallback[] = [];
  private iosNotificationIdentifier: string | null = null;

  constructor() {
    if (Platform.OS === 'android') {
      this.nativeModule = NativeModules.DhikrOverlayModule as DhikrOverlayNativeModule;
      if (this.nativeModule) {
        this.eventEmitter = new NativeEventEmitter(NativeModules.DhikrOverlayModule);
        this.setupNativeEventListeners();
      }
    }
  }

  private setupNativeEventListeners() {
    if (!this.eventEmitter) return;

    this.eventEmitter.addListener('onOverlayShown', (data: { dhikrId: string }) => {
      this.emitEvent({ type: 'shown', dhikrId: data.dhikrId });
    });

    this.eventEmitter.addListener('onOverlayDismissed', (data: { dhikrId: string; method: string }) => {
      this.emitEvent({ 
        type: 'dismissed', 
        dhikrId: data.dhikrId, 
        method: data.method as 'tap' | 'swipe' | 'timeout' 
      });
    });

    this.eventEmitter.addListener('onServiceStarted', () => {
      this.emitEvent({ type: 'serviceStarted' });
    });

    this.eventEmitter.addListener('onServiceStopped', () => {
      this.emitEvent({ type: 'serviceStopped' });
    });
  }

  private emitEvent(event: DhikrOverlayEvent) {
    this.eventListeners.forEach(callback => callback(event));
  }

  /**
   * Check if overlay permission is granted (Android only)
   */
  async checkPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      // iOS uses notifications, check notification permission
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    }

    if (!this.nativeModule) {
      console.warn('DhikrOverlay native module not available');
      return false;
    }

    return this.nativeModule.checkOverlayPermission();
  }

  /**
   * Request overlay permission (Android) or notification permission (iOS)
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    }

    if (!this.nativeModule) {
      console.warn('DhikrOverlay native module not available');
      return false;
    }

    // Opens system settings for overlay permission
    this.nativeModule.requestOverlayPermission();
    
    // Return current status - user needs to grant in settings
    // The app should check again when returning from settings
    return this.nativeModule.checkOverlayPermission();
  }

  /**
   * Start the dhikr reminder service
   */
  async startService(config: DhikrOverlayConfig): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return this.startIOSNotifications(config);
    }

    if (!this.nativeModule) {
      console.warn('DhikrOverlay native module not available');
      return false;
    }

    try {
      await this.nativeModule.startService({
        intervalMinutes: config.intervalMinutes,
        autoDismissSeconds: config.autoDismissSeconds,
        quietHoursEnabled: config.quietHours.enabled,
        quietHoursStart: config.quietHours.startHour,
        quietHoursEnd: config.quietHours.endHour,
        skipDuringPrayer: config.skipDuringPrayer,
        enabledCategories: config.enabledCategories,
        themeColors: {
          primary: config.themeColors.primary,
          background: config.themeColors.cardBackground,
          text: config.themeColors.text,
          textSecondary: config.themeColors.textSecondary,
        },
      });
      return true;
    } catch (error) {
      console.error('Failed to start dhikr overlay service:', error);
      return false;
    }
  }

  /**
   * Stop the dhikr reminder service
   */
  async stopService(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return this.stopIOSNotifications();
    }

    if (!this.nativeModule) {
      return false;
    }

    try {
      await this.nativeModule.stopService();
      return true;
    } catch (error) {
      console.error('Failed to stop dhikr overlay service:', error);
      return false;
    }
  }

  /**
   * Check if service is currently running
   */
  async isRunning(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return this.iosNotificationIdentifier !== null;
    }

    if (!this.nativeModule) {
      return false;
    }

    return this.nativeModule.isServiceRunning();
  }

  /**
   * Show overlay immediately (for testing/preview)
   */
  async showNow(dhikr: DhikrItem, themeColors?: ThemeColors): Promise<void> {
    console.log('[DhikrOverlayService] showNow called with:', dhikr.id);
    
    if (Platform.OS === 'ios') {
      await this.showIOSNotification(dhikr);
      return;
    }

    if (!this.nativeModule) {
      console.warn('[DhikrOverlayService] Native module not available');
      return;
    }

    console.log('[DhikrOverlayService] Calling native showOverlayNow...');
    this.nativeModule.showOverlayNow({
      id: dhikr.id,
      arabic: dhikr.arabic,
      transliteration: dhikr.transliteration,
      meaning: dhikr.meaning,
      source: dhikr.source,
      // Pass theme colors if provided
      colorPrimary: themeColors?.primary,
      colorBackground: themeColors?.cardBackground,
      colorText: themeColors?.text,
      colorTextSecondary: themeColors?.textSecondary,
    });
    console.log('[DhikrOverlayService] Native call completed');
  }

  /**
   * Add event listener
   */
  addEventListener(callback: EventCallback): () => void {
    this.eventListeners.push(callback);
    return () => {
      this.eventListeners = this.eventListeners.filter(cb => cb !== callback);
    };
  }

  // === iOS Implementation ===

  private async startIOSNotifications(config: DhikrOverlayConfig): Promise<boolean> {
    try {
      // Cancel any existing scheduled notifications
      await this.stopIOSNotifications();

      // Get a random dhikr for the notification
      const dhikr = getRandomDhikr(config.enabledCategories);
      if (!dhikr) return false;

      // Schedule repeating notification
      this.iosNotificationIdentifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: dhikr.transliteration,
          body: `${dhikr.arabic}\n${dhikr.meaning}`,
          data: { dhikrId: dhikr.id, type: 'dhikr_reminder' },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: config.intervalMinutes * 60,
          repeats: true,
        },
      });

      return true;
    } catch (error) {
      console.error('Failed to schedule iOS dhikr notification:', error);
      return false;
    }
  }

  private async stopIOSNotifications(): Promise<boolean> {
    try {
      if (this.iosNotificationIdentifier) {
        await Notifications.cancelScheduledNotificationAsync(this.iosNotificationIdentifier);
        this.iosNotificationIdentifier = null;
      }
      return true;
    } catch (error) {
      console.error('Failed to cancel iOS dhikr notifications:', error);
      return false;
    }
  }

  private async showIOSNotification(dhikr: DhikrItem): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: dhikr.transliteration,
        body: `${dhikr.arabic}\n${dhikr.meaning}`,
        data: { dhikrId: dhikr.id, type: 'dhikr_reminder' },
        sound: 'default',
      },
      trigger: null, // Show immediately
    });
  }

  /**
   * Check if platform supports floating overlay
   */
  supportsFloatingOverlay(): boolean {
    return Platform.OS === 'android';
  }
}

// Export singleton instance
export const DhikrOverlayService = new DhikrOverlayServiceClass();
