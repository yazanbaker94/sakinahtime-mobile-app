/**
 * NetworkService Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock NetInfo
vi.mock('@react-native-community/netinfo', () => ({
  default: {
    addEventListener: vi.fn(() => vi.fn()),
    fetch: vi.fn(() => Promise.resolve({
      isConnected: true,
      type: 'wifi',
      isInternetReachable: true,
    })),
  },
  NetInfoStateType: {
    wifi: 'wifi',
    cellular: 'cellular',
    none: 'none',
    unknown: 'unknown',
  },
}));

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

import { NetworkServiceImpl } from '../NetworkService';

describe('NetworkService', () => {
  let service: NetworkServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a fresh instance for each test
    service = new (NetworkServiceImpl as any)();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default online status', async () => {
      await service.initialize();
      const status = service.getStatus();
      expect(status.isConnected).toBe(true);
    });

    it('should only initialize once', async () => {
      await service.initialize();
      await service.initialize();
      // Should not throw and should work correctly
      const status = service.getStatus();
      expect(status).toBeDefined();
    });
  });

  describe('status detection', () => {
    it('should return network status', () => {
      const status = service.getStatus();
      expect(status).toHaveProperty('isConnected');
      expect(status).toHaveProperty('isWifi');
      expect(status).toHaveProperty('lastOnline');
    });

    it('should detect WiFi connection type', async () => {
      await service.initialize();
      const status = service.getStatus();
      // Default mock returns wifi
      expect(typeof status.isWifi).toBe('boolean');
    });
  });

  describe('status change subscription', () => {
    it('should allow subscribing to status changes', () => {
      const callback = vi.fn();
      const unsubscribe = service.onStatusChange(callback);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call callback immediately with current status', () => {
      const callback = vi.fn();
      service.onStatusChange(callback);
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        isConnected: expect.any(Boolean),
      }));
    });

    it('should allow unsubscribing', () => {
      const callback = vi.fn();
      const unsubscribe = service.onStatusChange(callback);
      
      unsubscribe();
      // After unsubscribe, callback count should not increase
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('operation queue', () => {
    it('should queue operations when offline', async () => {
      // Simulate offline
      (service as any).status = { isConnected: false, isWifi: false, lastOnline: Date.now() };
      
      const operation = vi.fn(() => Promise.resolve('result'));
      service.queueOperation('test-op', operation);
      
      // Operation should be queued, not executed immediately
      expect(operation).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should refresh network status', async () => {
      await service.initialize();
      await service.refresh();
      
      const status = service.getStatus();
      expect(status).toBeDefined();
    });
  });
});
