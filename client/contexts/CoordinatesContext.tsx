import React, { createContext, useContext, useState, useEffect } from 'react';

interface CoordinatesContextType {
  allCoords: any;
  isLoading: boolean;
  loadCoordinates: () => Promise<void>;
}

const CoordinatesContext = createContext<CoordinatesContextType | undefined>(undefined);

export function CoordinatesProvider({ children }: { children: React.ReactNode }) {
  const [allCoords, setAllCoords] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadCoordinates = async () => {
    if (hasLoaded || isLoading) return; // Don't load if already loaded or loading
    
    setIsLoading(true);
    try {
      const data = await import('../../assets/coordinates/all-pages.json');
      setAllCoords(data.default || data);
      setHasLoaded(true);
    } catch (error) {
      console.error('Error loading coordinates:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
