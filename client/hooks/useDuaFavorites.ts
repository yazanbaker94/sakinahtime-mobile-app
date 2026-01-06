/**
 * useDuaFavorites Hook
 * 
 * Hook for managing favorite duas with React state management.
 */

import { useState, useEffect, useCallback } from 'react';
import { DuaFavorite, Dua } from '@/types/dua';
import { DuaFavoritesService } from '@/services/DuaFavoritesService';
import { getDuaById } from '@/data/duaData';

export interface UseDuaFavoritesReturn {
  favorites: DuaFavorite[];
  favoriteDuas: Dua[];
  isFavorite: (duaId: string) => boolean;
  addFavorite: (duaId: string) => Promise<void>;
  removeFavorite: (duaId: string) => Promise<void>;
  toggleFavorite: (duaId: string) => Promise<boolean>;
  isLoading: boolean;
}

export function useDuaFavorites(): UseDuaFavoritesReturn {
  const [favorites, setFavorites] = useState<DuaFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      const loaded = await DuaFavoritesService.getFavorites();
      setFavorites(loaded);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get full dua objects for favorites
  const favoriteDuas = favorites
    .map(f => getDuaById(f.duaId))
    .filter((dua): dua is Dua => dua !== undefined);

  // Check if a dua is favorited
  const isFavorite = useCallback((duaId: string): boolean => {
    return favorites.some(f => f.duaId === duaId);
  }, [favorites]);

  // Add a dua to favorites
  const addFavorite = useCallback(async (duaId: string): Promise<void> => {
    try {
      await DuaFavoritesService.addFavorite(duaId);
      setFavorites(prev => {
        if (prev.some(f => f.duaId === duaId)) return prev;
        return [...prev, { duaId, addedAt: Date.now() }];
      });
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }, []);

  // Remove a dua from favorites
  const removeFavorite = useCallback(async (duaId: string): Promise<void> => {
    try {
      await DuaFavoritesService.removeFavorite(duaId);
      setFavorites(prev => prev.filter(f => f.duaId !== duaId));
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }, []);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (duaId: string): Promise<boolean> => {
    const currentlyFavorited = favorites.some(f => f.duaId === duaId);
    
    if (currentlyFavorited) {
      await removeFavorite(duaId);
      return false;
    } else {
      await addFavorite(duaId);
      return true;
    }
  }, [favorites, addFavorite, removeFavorite]);

  return {
    favorites,
    favoriteDuas,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isLoading,
  };
}

export default useDuaFavorites;
