/**
 * DuaFavoritesService
 * 
 * Manages favorite duas persistence using AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DuaFavorite, StoredFavorites } from '@/types/dua';

const STORAGE_KEY = '@dua_favorites';
const STORAGE_VERSION = 1;

class DuaFavoritesServiceClass {
  private cache: DuaFavorite[] | null = null;

  /**
   * Get all favorites from storage
   */
  async getFavorites(): Promise<DuaFavorite[]> {
    if (this.cache !== null) {
      return this.cache;
    }

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) {
        this.cache = [];
        return [];
      }

      const data: StoredFavorites = JSON.parse(stored);
      
      // Validate structure
      if (!data.favorites || !Array.isArray(data.favorites)) {
        this.cache = [];
        return [];
      }

      this.cache = data.favorites;
      return data.favorites;
    } catch (error) {
      console.error('Error loading dua favorites:', error);
      this.cache = [];
      return [];
    }
  }

  /**
   * Add a dua to favorites
   */
  async addFavorite(duaId: string): Promise<void> {
    const favorites = await this.getFavorites();
    
    // Check if already favorited
    if (favorites.some(f => f.duaId === duaId)) {
      return;
    }

    const newFavorite: DuaFavorite = {
      duaId,
      addedAt: Date.now(),
    };

    const updatedFavorites = [...favorites, newFavorite];
    await this.saveFavorites(updatedFavorites);
  }

  /**
   * Remove a dua from favorites
   */
  async removeFavorite(duaId: string): Promise<void> {
    const favorites = await this.getFavorites();
    const updatedFavorites = favorites.filter(f => f.duaId !== duaId);
    await this.saveFavorites(updatedFavorites);
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(duaId: string): Promise<boolean> {
    const isFav = await this.isFavorite(duaId);
    if (isFav) {
      await this.removeFavorite(duaId);
      return false;
    } else {
      await this.addFavorite(duaId);
      return true;
    }
  }

  /**
   * Check if a dua is favorited
   */
  async isFavorite(duaId: string): Promise<boolean> {
    const favorites = await this.getFavorites();
    return favorites.some(f => f.duaId === duaId);
  }

  /**
   * Clear all favorites
   */
  async clearAll(): Promise<void> {
    await this.saveFavorites([]);
  }

  /**
   * Get favorite IDs only
   */
  async getFavoriteIds(): Promise<string[]> {
    const favorites = await this.getFavorites();
    return favorites.map(f => f.duaId);
  }

  /**
   * Save favorites to storage
   */
  private async saveFavorites(favorites: DuaFavorite[]): Promise<void> {
    try {
      const data: StoredFavorites = {
        version: STORAGE_VERSION,
        favorites,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.cache = favorites;
    } catch (error) {
      console.error('Error saving dua favorites:', error);
      throw error;
    }
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache = null;
  }
}

export const DuaFavoritesService = new DuaFavoritesServiceClass();
export default DuaFavoritesService;
