/**
 * Hook for managing mosque finder state and API calls
 * Features: 500ms debounce on radius changes, AbortController for abandoned requests
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
 * Debounces radius changes by 500ms and cancels in-flight requests
 */
export function useMosqueFinder(): UseMosqueFinderReturn {
  const { latitude, longitude } = useLocation();

  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [debouncedRadius, setDebouncedRadius] = useState(DEFAULT_RADIUS);
  const abortControllerRef = useRef<AbortController | null>(null);

  const hasLocation = latitude !== null && longitude !== null;

  // Debounce radius changes by 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRadius(radius);
    }, 500);
    return () => clearTimeout(timer);
  }, [radius]);

  const fetchMosques = useCallback(async () => {
    if (!hasLocation || latitude === null || longitude === null) {
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const results = await MosqueApiService.searchNearbyMosques(
        { latitude, longitude, radiusMeters: debouncedRadius },
        controller.signal,
      );

      // Only update state if this request wasn't cancelled
      if (!controller.signal.aborted) {
        setMosques(results);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        const message = err instanceof Error ? err.message : 'Failed to fetch mosques';
        if (message !== 'Request cancelled') {
          setError(message);
          setMosques([]);
        }
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [latitude, longitude, debouncedRadius, hasLocation]);

  // Fetch mosques when location or debounced radius changes
  useEffect(() => {
    if (hasLocation) {
      fetchMosques();
    }

    // Cleanup: cancel in-flight request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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
