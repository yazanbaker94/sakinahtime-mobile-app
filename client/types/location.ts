/**
 * Location types for manual location feature
 */

export type LocationMode = 'gps' | 'manual';

export interface City {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  population?: number;
}

export interface ManualLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export const LOCATION_STORAGE_KEYS = {
  LOCATION_MODE: '@sakinah/location_mode',
  MANUAL_LOCATION: '@sakinah/manual_location',
  RECENT_LOCATIONS: '@sakinah/recent_locations',
} as const;

export const MAX_RECENT_LOCATIONS = 5;
