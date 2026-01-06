/**
 * Hook for managing mosque finder state and API calls
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { Mosque, MosqueDetail } from '@/types/mosque';
import { DEFAULT_RADIUS } from '@/constants/mosque';
import { MosqueApiService } from '@/services/MosqueApiService';

export interface UseMosqueFinderReturn {
  mosques: Mosque[];
  filteredMosques: Mosque[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  radius: number;
  setRadius: (radius: number) => void;
  refetch: () => void;
  hasLocation: boolean;
}

export interface UseMosqueDetailReturn {
  mosque: MosqueDetail | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Filter mosques by search query (case-insensitive name match)
 */
export function filterMosquesByQuery(mosques: Mosque[], query: string): Mosque[] {
  if (!query.trim()) {
    return mosques;
  }
  
  const lowerQuery = query.toLowerCase().trim();
  return mosques.filter(mosque => 
    mosque.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Sort mosques by distance (ascending)
 */
export function sortMosquesByDistance(mosques: Mosque[]): Mosque[] {
  return [...mosques].sort((a, b) => a.distance - b.distance);
}

/**
 * Hook for finding nearby mosques
 */
export function useMosqueFinder(): UseMosqueFinderReturn {
  const { latitude, longitude } = useLocation();
  
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(DEFAULT_RADIUS);

  const hasLocation = latitude !== null && longitude !== null;

  const fetchMosques = useCallback(async () => {
    if (!hasLocation || latitude === null || longitude === null) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await MosqueApiService.searchNearbyMosques({
        latitude,
        longitude,
        radiusMeters: radius,
      });
      
      // Results are already sorted by distance from the API service
      setMosques(results);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch mosques';
      setError(message);
      setMosques([]);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, radius, hasLocation]);

  // Fetch mosques when location or radius changes
  useEffect(() => {
    if (hasLocation) {
      fetchMosques();
    }
  }, [hasLocation, fetchMosques]);

  // Filter mosques by search query
  const filteredMosques = useMemo(() => {
    return filterMosquesByQuery(mosques, searchQuery);
  }, [mosques, searchQuery]);

  const refetch = useCallback(() => {
    fetchMosques();
  }, [fetchMosques]);

  return {
    mosques,
    filteredMosques,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    radius,
    setRadius,
    refetch,
    hasLocation,
  };
}

/**
 * Hook for fetching mosque details
 */
export function useMosqueDetail(
  mosqueId: string,
  initialMosque?: Mosque
): UseMosqueDetailReturn {
  const { latitude, longitude } = useLocation();
  
  const [mosque, setMosque] = useState<MosqueDetail | null>(
    initialMosque ? { ...initialMosque, photos: [] } : null
  );
  const [isLoading, setIsLoading] = useState(!initialMosque);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!mosqueId || latitude === null || longitude === null) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const details = await MosqueApiService.getMosqueDetails(
        mosqueId,
        latitude,
        longitude
      );
      setMosque(details);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch mosque details';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [mosqueId, latitude, longitude]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const refetch = useCallback(() => {
    fetchDetails();
  }, [fetchDetails]);

  return {
    mosque,
    isLoading,
    error,
    refetch,
  };
}
