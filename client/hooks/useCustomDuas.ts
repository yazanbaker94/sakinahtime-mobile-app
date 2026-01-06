/**
 * useCustomDuas Hook
 * 
 * Hook for managing custom user-created duas with React state management.
 */

import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { CustomDua } from '@/types/dua';
import { CustomDuaService } from '@/services/CustomDuaService';

export interface UseCustomDuasReturn {
  customDuas: CustomDua[];
  addCustomDua: (dua: Omit<CustomDua, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CustomDua>;
  updateCustomDua: (id: string, updates: Partial<Omit<CustomDua, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteCustomDua: (id: string) => Promise<void>;
  getCustomDuaById: (id: string) => CustomDua | undefined;
  refreshCustomDuas: () => Promise<void>;
  isLoading: boolean;
}

export function useCustomDuas(): UseCustomDuasReturn {
  const [customDuas, setCustomDuas] = useState<CustomDua[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCustomDuas = useCallback(async () => {
    try {
      setIsLoading(true);
      const loaded = await CustomDuaService.getAll();
      setCustomDuas(loaded);
    } catch (error) {
      console.error('Error loading custom duas:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load custom duas on mount
  useEffect(() => {
    loadCustomDuas();
  }, [loadCustomDuas]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadCustomDuas();
    }, [loadCustomDuas])
  );

  // Add a new custom dua
  const addCustomDua = useCallback(async (
    dua: Omit<CustomDua, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CustomDua> => {
    try {
      const created = await CustomDuaService.create(dua);
      setCustomDuas(prev => [...prev, created]);
      return created;
    } catch (error) {
      console.error('Error adding custom dua:', error);
      throw error;
    }
  }, []);

  // Update an existing custom dua
  const updateCustomDua = useCallback(async (
    id: string,
    updates: Partial<Omit<CustomDua, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> => {
    try {
      const updated = await CustomDuaService.update(id, updates);
      setCustomDuas(prev => prev.map(d => d.id === id ? updated : d));
    } catch (error) {
      console.error('Error updating custom dua:', error);
      throw error;
    }
  }, []);

  // Delete a custom dua
  const deleteCustomDua = useCallback(async (id: string): Promise<void> => {
    try {
      await CustomDuaService.delete(id);
      setCustomDuas(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error deleting custom dua:', error);
      throw error;
    }
  }, []);

  // Get a custom dua by ID
  const getCustomDuaById = useCallback((id: string): CustomDua | undefined => {
    return customDuas.find(d => d.id === id);
  }, [customDuas]);

  return {
    customDuas,
    addCustomDua,
    updateCustomDua,
    deleteCustomDua,
    getCustomDuaById,
    refreshCustomDuas: loadCustomDuas,
    isLoading,
  };
}

export default useCustomDuas;
