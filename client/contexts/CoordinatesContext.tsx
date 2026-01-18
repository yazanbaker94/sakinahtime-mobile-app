import React, { createContext, useContext } from 'react';

// Static import - coords are bundled with the app and available immediately
// This eliminates the 1-2 second loading delay for verse tap interactions
import allCoordsData from '../../assets/coordinates/all-pages.json';

interface CoordinatesContextType {
  allCoords: any;
  isLoading: boolean;
  loadCoordinates: () => Promise<void>;
}

const CoordinatesContext = createContext<CoordinatesContextType | undefined>(undefined);

export function CoordinatesProvider({ children }: { children: React.ReactNode }) {
  // Coords are available immediately - no async loading needed
  const allCoords = allCoordsData;

  // Keep the interface compatible but these are now no-ops
  const isLoading = false;
  const loadCoordinates = async () => { };

  return (
    <CoordinatesContext.Provider value={{ allCoords, isLoading, loadCoordinates }}>
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
