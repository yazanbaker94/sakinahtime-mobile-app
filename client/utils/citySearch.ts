import citiesData from '@/data/cities.json';
import type { City } from '@/types/location';

const cities = citiesData.cities as City[];

/**
 * Search cities by name or country
 * Case-insensitive matching
 * Returns sorted by population (larger cities first)
 */
export function searchCities(query: string, limit: number = 50): City[] {
  if (!query || query.trim().length === 0) {
    // Return top cities by population when no query
    return [...cities]
      .sort((a, b) => (b.population || 0) - (a.population || 0))
      .slice(0, limit);
  }

  const normalizedQuery = query.toLowerCase().trim();

  // Filter cities that match query in name or country
  const matches = cities.filter(city => {
    const cityName = city.name.toLowerCase();
    const countryName = city.country.toLowerCase();
    return cityName.includes(normalizedQuery) || countryName.includes(normalizedQuery);
  });

  // Sort by relevance:
  // 1. Exact name match first
  // 2. Name starts with query
  // 3. Country starts with query
  // 4. Then by population
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
