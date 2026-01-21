import citiesData from '@/data/cities.json';
import type { City } from '@/types/location';
import { searchCitiesOnline } from './nominatimSearch';

const cities = citiesData.cities as City[];

/**
 * Search cities - uses online Nominatim API with fallback to local data
 * Case-insensitive matching
 */
export async function searchCitiesAsync(query: string, limit: number = 50): Promise<City[]> {
  // For empty query, return top local cities
  if (!query || query.trim().length === 0) {
    return getTopCities(limit);
  }

  // For very short queries (1 char), use local only to reduce API calls
  if (query.trim().length < 2) {
    return searchCitiesLocal(query, limit);
  }

  // Try online search first
  try {
    const onlineResults = await searchCitiesOnline(query, limit);

    // If online returns results, use them
    if (onlineResults.length > 0) {
      return onlineResults;
    }

    // Fallback to local if online returns nothing
    return searchCitiesLocal(query, limit);
  } catch (error) {
    console.warn('Online search failed, falling back to local:', error);
    return searchCitiesLocal(query, limit);
  }
}

/**
 * Search cities locally (original implementation)
 * For backwards compatibility and offline fallback
 */
export function searchCities(query: string, limit: number = 50): City[] {
  return searchCitiesLocal(query, limit);
}

/**
 * Local search implementation
 */
function searchCitiesLocal(query: string, limit: number = 50): City[] {
  if (!query || query.trim().length === 0) {
    return getTopCities(limit);
  }

  const normalizedQuery = query.toLowerCase().trim();

  // Filter cities that match query in name or country
  const matches = cities.filter(city => {
    const cityName = city.name.toLowerCase();
    const countryName = city.country.toLowerCase();
    return cityName.includes(normalizedQuery) || countryName.includes(normalizedQuery);
  });

  // Sort by relevance
  return matches
    .sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aCountry = a.country.toLowerCase();
      const bCountry = b.country.toLowerCase();

      // Exact name match
      if (aName === normalizedQuery && bName !== normalizedQuery) return -1;
      if (bName === normalizedQuery && aName !== normalizedQuery) return 1;

      // Name starts with query
      const aNameStarts = aName.startsWith(normalizedQuery);
      const bNameStarts = bName.startsWith(normalizedQuery);
      if (aNameStarts && !bNameStarts) return -1;
      if (bNameStarts && !aNameStarts) return 1;

      // Country starts with query
      const aCountryStarts = aCountry.startsWith(normalizedQuery);
      const bCountryStarts = bCountry.startsWith(normalizedQuery);
      if (aCountryStarts && !bCountryStarts) return -1;
      if (bCountryStarts && !aCountryStarts) return 1;

      // By population
      return (b.population || 0) - (a.population || 0);
    })
    .slice(0, limit);
}

/**
 * Get top cities by population
 */
function getTopCities(limit: number): City[] {
  return [...cities]
    .sort((a, b) => (b.population || 0) - (a.population || 0))
    .slice(0, limit);
}

/**
 * Get all cities (for testing)
 */
export function getAllCities(): City[] {
  return cities;
}

/**
 * Get city by ID
 */
export function getCityById(id: string): City | undefined {
  return cities.find(city => city.id === id);
}
