/**
 * Ramadan Context
 * 
 * Provides global Ramadan state throughout the app.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RamadanState } from '../types/ramadan';
import { ramadanService } from '../services/RamadanService';

// Debug storage key
const DEBUG_RAMADAN_KEY = '@ramadan_debug_mode';

interface RamadanContextValue extends RamadanState {
  refreshRamadanState: () => void;
  // Debug controls
  debugMode: boolean;
  debugDay: number;
  setDebugMode: (enabled: boolean) => void;
  setDebugDay: (day: number) => void;
}

const defaultState: RamadanState = {
  isRamadan: false,
  currentDay: null,
  daysRemaining: null,
  isLastTenNights: false,
  ramadanYear: null,
  ramadanStartDate: null,
  ramadanEndDate: null,
};

const RamadanContext = createContext<RamadanContextValue | null>(null);

interface RamadanProviderProps {
  children: ReactNode;
}

export function RamadanProvider({ children }: RamadanProviderProps): JSX.Element {
  const [state, setState] = useState<RamadanState>(defaultState);
  const [debugMode, setDebugModeState] = useState(false);
  const [debugDay, setDebugDayState] = useState(15);

  const refreshRamadanState = useCallback(() => {
    if (debugMode) {
      // Use debug values
      const hijriYear = ramadanService.getCurrentHijriYear();
      setState({
        isRamadan: true,
        currentDay: debugDay,
        daysRemaining: 30 - debugDay,
        isLastTenNights: debugDay >= 21,
        ramadanYear: hijriYear,
        ramadanStartDate: new Date(),
        ramadanEndDate: new Date(Date.now() + (30 - debugDay) * 24 * 60 * 60 * 1000),
      });
    } else {
      const newState = ramadanService.getRamadanState();
      setState(newState);
    }
  }, [debugMode, debugDay]);

  // Load debug settings on mount
  useEffect(() => {
    async function loadDebugSettings() {
      try {
        const stored = await AsyncStorage.getItem(DEBUG_RAMADAN_KEY);
        if (stored) {
          const { enabled, day } = JSON.parse(stored);
          setDebugModeState(enabled);
          setDebugDayState(day || 15);
        }
      } catch (error) {
        console.error('Failed to load Ramadan debug settings:', error);
      }
    }
    loadDebugSettings();
  }, []);

  // Save and apply debug mode
  const setDebugMode = useCallback(async (enabled: boolean) => {
    setDebugModeState(enabled);
    try {
      await AsyncStorage.setItem(DEBUG_RAMADAN_KEY, JSON.stringify({ enabled, day: debugDay }));
    } catch (error) {
      console.error('Failed to save Ramadan debug settings:', error);
    }
  }, [debugDay]);

  // Save and apply debug day
  const setDebugDay = useCallback(async (day: number) => {
    const clampedDay = Math.max(1, Math.min(30, day));
    setDebugDayState(clampedDay);
    try {
      await AsyncStorage.setItem(DEBUG_RAMADAN_KEY, JSON.stringify({ enabled: debugMode, day: clampedDay }));
    } catch (error) {
      console.error('Failed to save Ramadan debug settings:', error);
    }
  }, [debugMode]);

  // Refresh when debug settings change
  useEffect(() => {
    refreshRamadanState();
  }, [refreshRamadanState]);

  // Refresh state at midnight (when Hijri date might change)
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // Set timeout to refresh at midnight
    const midnightTimeout = setTimeout(() => {
      refreshRamadanState();
      
      // Then set up daily interval
      const dailyInterval = setInterval(refreshRamadanState, 24 * 60 * 60 * 1000);
      
      return () => clearInterval(dailyInterval);
    }, msUntilMidnight);
    
    return () => clearTimeout(midnightTimeout);
  }, [refreshRamadanState]);

  const value: RamadanContextValue = {
    ...state,
    refreshRamadanState,
    debugMode,
    debugDay,
    setDebugMode,
    setDebugDay,
  };

  return (
    <RamadanContext.Provider value={value}>
      {children}
    </RamadanContext.Provider>
  );
}

export function useRamadan(): RamadanContextValue {
  const context = useContext(RamadanContext);
  if (!context) {
    throw new Error('useRamadan must be used within a RamadanProvider');
  }
  return context;
}

export { RamadanContext };
