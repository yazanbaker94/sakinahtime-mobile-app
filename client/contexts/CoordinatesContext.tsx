import React, { createContext, useContext } from 'react';
import { QuranDataBridge } from '../services/QuranDataBridge';

interface CoordinatesContextType {
  allCoords: any;
  isLoading: boolean;
  loadCoordinates: () => Promise<void>;
}

const CoordinatesContext = createContext<CoordinatesContextType | undefined>(undefined);

export function CoordinatesProvider({ children }: { children: React.ReactNode }) {
  // Coordinates are pre-loaded by QuranDataBridge.init() at app startup.
  // No async loading needed — data is immediately available.
  const value: CoordinatesContextType = {
    allCoords: QuranDataBridge.allCoordinates,
    isLoading: false,
    loadCoordinates: async () => { }, // No-op — already loaded
  };

  return (
    <CoordinatesContext.Provider value={value}>
      {children}
    </CoordinatesContext.Provider>
  );
}

export function useCoordinates() {
  const context = useContext(CoordinatesContext);
  if (context === undefined) {
    throw new Error('useCoordinates must be used within a CoordinatesProvider');
  }
  return context;
}
