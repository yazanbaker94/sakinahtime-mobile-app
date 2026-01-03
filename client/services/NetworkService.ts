/**
 * NetworkService
 * 
 * Handles network connectivity detection and status management.
 * Uses @react-native-community/netinfo for connectivity detection.
 */

import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkStatus } from '../types/offline';
import { STORAGE_KEYS } from '../constants/offline';

type NetworkListener = (status: NetworkStatus) => void;
type QueuedOperation = () => Promise<void>;

class NetworkServiceImpl {
  private static instance: NetworkServiceImpl;
  private status: NetworkStatus = {
    isConnected: true,
    isWifi: false,
    lastOnline: Date.now(),
  };
  private listeners: Set<NetworkListener> = new Set();
  private operationQueue: QueuedOperation[] = [];
  private unsubscribe: (() => void) | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): NetworkServiceImpl {
    if (!NetworkServiceImpl.instance) {
      NetworkServiceImpl.instance = new NetworkServiceImpl();
    }
    return NetworkServiceImpl.instance;
  }

  /**
   * Initialize the network service and start listening for changes
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load last known status
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.NETWORK_STATUS);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.status.lastOnline = parsed.lastOnline || Date.now();
      }

      // Get current state
      const state = await NetInfo.fetch();
      this.updateStatus(state);

      // Subscribe to changes
      this.unsubscribe = NetInfo.addEventListener(this.handleNetworkChange.bind(this));
      this.initialized = true;
    } catch (error) {
      console.error('[NetworkService] Failed to initialize:', error);
    }
  }

  /**
   * Handle network state changes
   */
  private handleNetworkChange(state: NetInfoState): void {
    const wasConnected = this.status.isConnected;
    this.updateStatus(state);

    // If we just came back online, process queued operations
    if (!wasConnected && this.status.isConnected) {
      this.processQueue();
    }
  }

  /**
   * Update internal status from NetInfo state
   */
  private updateStatus(state: NetInfoState): void {
    const isConnected = state.isConnected ?? false;
    const isWifi = state.type === NetInfoStateType.wifi;

    this.status = {
      isConnected,
      isWifi,
      lastOnline: isConnected ? Date.now() : this.status.lastOnline,
    };

    // Persist last online time
    this.persistStatus();

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Persist status to storage
   */
  private async persistStatus(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.NETWORK_STATUS,
        JSON.stringify({ lastOnline: this.status.lastOnline })
      );
    } catch (error) {
      console.error('[NetworkService] Failed to persist status:', error);
    }
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.status);
      } catch (error) {
        console.error('[NetworkService] Listener error:', error);
      }
    });
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return { ...this.status };
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.status.isConnected;
  }

  /**
   * Check if connected via WiFi
   */
  isWifi(): boolean {
    return this.status.isWifi;
  }

  /**
   * Get last online timestamp
   */
  getLastOnline(): number | null {
    return this.status.lastOnline;
  }

  /**
   * Subscribe to network status changes
   */
  onStatusChange(callback: NetworkListener): () => void {
    this.listeners.add(callback);
    // Immediately call with current status
    callback(this.status);
    return () => this.listeners.delete(callback);
  }

  /**
   * Queue an operation to run when online
   */
  queueOperation(operation: QueuedOperation): void {
    if (this.status.isConnected) {
      // Run immediately if online
      operation().catch(error => {
        console.error('[NetworkService] Queued operation failed:', error);
      });
    } else {
      // Queue for later
      this.operationQueue.push(operation);
    }
  }

  /**
   * Process all queued operations
   */
  async processQueue(): Promise<void> {
    if (!this.status.isConnected || this.operationQueue.length === 0) {
      return;
    }

    const operations = [...this.operationQueue];
    this.operationQueue = [];

    for (const operation of operations) {
      try {
        await operation();
      } catch (error) {
        console.error('[NetworkService] Failed to process queued operation:', error);
      }
    }
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.operationQueue.length;
  }

  /**
   * Clear the operation queue
   */
  clearQueue(): void {
    this.operationQueue = [];
  }

  /**
   * Cleanup and unsubscribe
   */
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners.clear();
    this.operationQueue = [];
    this.initialized = false;
  }

  /**
   * Force refresh network status
   */
  async refresh(): Promise<NetworkStatus> {
    try {
      const state = await NetInfo.fetch();
      this.updateStatus(state);
    } catch (error) {
      console.error('[NetworkService] Failed to refresh:', error);
    }
    return this.status;
  }
}

// Export singleton instance
export const networkService = NetworkServiceImpl.getInstance();

// Export class for testing
export { NetworkServiceImpl };
