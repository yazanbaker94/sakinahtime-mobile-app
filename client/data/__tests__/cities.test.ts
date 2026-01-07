import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import citiesData from '../cities.json';
import type { City } from '@/types/location';

/**
 * Property 4: Data Completeness
 * For any city in the City_Database, the object SHALL contain all required fields:
 * name, country, latitude, longitude, and timezone with valid values.
 * 
 * Validates: Requirements 2.3, 3.3
 */
describe('City Database Completeness', () => {
  const cities = citiesData.cities as City[];

  it('should have at least one city', () => {
    expect(cities.length).toBeGreaterThan(0);
  });

  it('Property 4: all cities have required fields with valid values', () => {
    // For all cities in the database
    cities.forEach((city, index) => {
      // Must have id
      expect(city.id, `City at index ${index} missing id`).toBeDefined();
      expect(typeof city.id, `City ${city.id} id must be string`).toBe('string');
      expect(city.id.length, `City at index ${index} has empty id`).toBeGreaterThan(0);

      // Must have name
      expect(city.name, `City ${city.id} missing name`).toBeDefined();
      expect(typeof city.name, `City ${city.id} name must be string`).toBe('string');
      expect(city.name.length, `City ${city.id} has empty name`).toBeGreaterThan(0);

      // Must have country
      expect(city.country, `City ${city.id} missing country`).toBeDefined();
      expect(typeof city.country, `City ${city.id} country must be string`).toBe('string');
      expect(city.country.length, `City ${city.id} has empty country`).toBeGreaterThan(0);

      // Must have countryCode
      expect(city.countryCode, `City ${city.id} missing countryCode`).toBeDefined();
      expect(typeof city.countryCode, `City ${city.id} countryCode must be string`).toBe('string');
      expect(city.countryCode.length, `City ${city.id} has empty countryCode`).toBeGreaterThan(0);

      // Must have valid latitude (-90 to 90)
      expect(city.latitude, `City ${city.id} missing latitude`).toBeDefined();
      expect(typeof city.latitude, `City ${city.id} latitude must be number`).toBe('number');
      expect(city.latitude, `City ${city.id} latitude out of range`).toBeGreaterThanOrEqual(-90);
      expect(city.latitude, `City ${city.id} latitude out of range`).toBeLessThanOrEqual(90);

      // Must have valid longitude (-180 to 180)
      expect(city.longitude, `City ${city.id} missing longitude`).toBeDefined();
      expect(typeof city.longitude, `City ${city.id} longitude must be number`).toBe('number');
      expect(city.longitude, `City ${city.id} longitude out of range`).toBeGreaterThanOrEqual(-180);
      expect(city.longitude, `City ${city.id} longitude out of range`).toBeLessThanOrEqual(180);

      // Must have timezone
      expect(city.timezone, `City ${city.id} missing timezone`).toBeDefined();
      expect(typeof city.timezone, `City ${city.id} timezone must be string`).toBe('string');
      expect(city.timezone.length, `City ${city.id} has empty timezone`).toBeGreaterThan(0);
      // Timezone should follow IANA format (contains /)
      expect(city.timezone, `City ${city.id} timezone should be IANA format`).toMatch(/\//);
    });
  });

  it('all city IDs are unique', () => {
    const ids = cities.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('includes major Islamic cities', () => {
    const islamicCities = ['mecca-sa', 'medina-sa', 'cairo-eg', 'istanbul-tr', 'jakarta-id', 'dhaka-bd', 'karachi-pk', 'riyadh-sa', 'dubai-ae'];
    islamicCities.forEach(cityId => {
      const found = cities.find(c => c.id === cityId);
      expect(found, `Missing important city: ${cityId}`).toBeDefined();
    });
  });
});
