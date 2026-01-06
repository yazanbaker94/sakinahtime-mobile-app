/**
 * CustomDuaService
 * 
 * Manages custom user-created duas persistence using AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomDua, StoredCustomDuas } from '@/types/dua';

const STORAGE_KEY = '@custom_duas';
const STORAGE_VERSION = 1;

// Simple UUID generator
function generateId(): string {
  return 'custom_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

class CustomDuaServiceClass {
  private cache: CustomDua[] | null = null;

  /**
   * Get all custom duas
   */
  async getAll(): Promise<CustomDua[]> {
    if (this.cache !== null) {
      return this.cache;
    }

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) {
        this.cache = [];
        return [];
      }

      const data: StoredCustomDuas = JSON.parse(stored);
      
      // Validate structure
      if (!data.duas || !Array.isArray(data.duas)) {
        this.cache = [];
        return [];
      }

      this.cache = data.duas;
      return data.duas;
    } catch (error) {
      console.error('Error loading custom duas:', error);
      this.cache = [];
      return [];
    }
  }

  /**
   * Get a custom dua by ID
   */
  async getById(id: string): Promise<CustomDua | null> {
    const duas = await this.getAll();
    return duas.find(d => d.id === id) || null;
  }

  /**
   * Create a new custom dua
   */
  async create(dua: Omit<CustomDua, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomDua> {
    // Validate required field
    if (!dua.translation || dua.translation.trim().length === 0) {
      throw new Error('Translation is required');
    }

    const duas = await this.getAll();
    const now = Date.now();
    
    const newDua: CustomDua = {
      id: generateId(),
      textAr: dua.textAr?.trim() || undefined,
      transliteration: dua.transliteration?.trim() || undefined,
      translation: dua.translation.trim(),
      notes: dua.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const updatedDuas = [...duas, newDua];
    await this.saveDuas(updatedDuas);
    
    return newDua;
  }

  /**
   * Update an existing custom dua
   */
  async update(id: string, updates: Partial<Omit<CustomDua, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CustomDua> {
    const duas = await this.getAll();
    const index = duas.findIndex(d => d.id === id);
    
    if (index === -1) {
      throw new Error('Custom dua not found');
    }

    // Validate translation if being updated
    if (updates.translation !== undefined && updates.translation.trim().length === 0) {
      throw new Error('Translation cannot be empty');
    }

    const updatedDua: CustomDua = {
      ...duas[index],
      ...updates,
      updatedAt: Date.now(),
    };

    // Clean up empty strings
    if (updatedDua.textAr !== undefined) {
      updatedDua.textAr = updatedDua.textAr.trim() || undefined;
    }
    if (updatedDua.transliteration !== undefined) {
      updatedDua.transliteration = updatedDua.transliteration.trim() || undefined;
    }
    if (updatedDua.notes !== undefined) {
      updatedDua.notes = updatedDua.notes.trim() || undefined;
    }

    const updatedDuas = [...duas];
    updatedDuas[index] = updatedDua;
    await this.saveDuas(updatedDuas);
    
    return updatedDua;
  }

  /**
   * Delete a custom dua
   */
  async delete(id: string): Promise<void> {
    const duas = await this.getAll();
    const updatedDuas = duas.filter(d => d.id !== id);
    
    if (updatedDuas.length === duas.length) {
      throw new Error('Custom dua not found');
    }

    await this.saveDuas(updatedDuas);
  }

  /**
   * Get count of custom duas
   */
  async getCount(): Promise<number> {
    const duas = await this.getAll();
    return duas.length;
  }

  /**
   * Clear all custom duas
   */
  async clearAll(): Promise<void> {
    await this.saveDuas([]);
  }

  /**
   * Save duas to storage
   */
  private async saveDuas(duas: CustomDua[]): Promise<void> {
    try {
      const data: StoredCustomDuas = {
        version: STORAGE_VERSION,
        duas,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.cache = duas;
    } catch (error) {
      console.error('Error saving custom duas:', error);
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

export const CustomDuaService = new CustomDuaServiceClass();
export default CustomDuaService;
