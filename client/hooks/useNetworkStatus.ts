/**
 * useNetworkStatus Hook
 * 
 * Provides network connectivity status with auto-updates.
 */

import { useState, useEffect } from 'react';
import { networkService } from '../services/NetworkService';
import { NetworkStatus } from '../types/offline';

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isWifi: false,
    lastOnline: null,
  });

  useEffect(() => {
    // Initialize service
    networkService.initialize();

    // Subscribe to changes
    const unsubscribe = networkService.onStatusChange(setStatus);

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isOnline: status.isConnected,
    isWifi: status.isWifi,
    lastOnline: status.lastOnline ? new Date(status.lastOnline) : null,
    refresh: () => networkService.refresh(),
  };
}
