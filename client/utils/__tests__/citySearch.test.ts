import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { searchCities, getAllCities } from '../citySearch';

/**
 * Property 3: City Search Filtering
 * For any search query string, all returned cities SHALL contain the query string
 * in either the city name OR country name (case-insensitive).
 * 
 * Validates: Requirements 2.2, 2.5
 */
describe('City Search', () => {
  const allCities = getAllCities();

  it('Property 3: all search results contain query in name or country', () => {
    // Generate search queries from actual city/country names to ensure matches
    const cityNames = allCities.map(c => c.name);
    const countryNames = [...new Set(allCities.map(c => c.country))];
    const allNames = [...cityNames, ...countryNames];

    fc.assert(
      fc.property(
        // Generate substrings of actual names (more likely to match)
        fc.constantFrom(...allNames).chain(name => {
          const len = name.length;
          if (len <= 2) return fc.constant(name.toLowerCase());
          return fc.integer({ min: 0, max: len - 2 }).chain(start => {
            const maxEnd = Math.min(start + 10, len);
            return fc.integer({ min: start + 1, max: maxEnd }).map(end => 
              name.substring(start, end).toLowerCase()
            );
          });
        }),
        (query) => {
          if (query.trim().length === 0) return true; // Skip empty queries
          
          const results = searchCities(query);
          const normalizedQuery = query.toLowerCase().trim();
          
          // All results must contain query in name or country
          for (const city of results) {
            const nameMatch = city.name.toLowerCase().includes(normalizedQuery);
            const countryMatch = city.country.toLowerCase().includes(normalizedQuery);
            expect(
              nameMatch || countryMatch,
              `City "${city.name}, ${city.country}" does not match query "${query}"`
            ).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns results sorted by population when no query', () => {
    const results = searchCities('');
    
    // Check that results are sorted by population (descending)
    for (let i = 1; i < results.length; i++) {
      const prevPop = results[i - 1].population || 0;
      const currPop = results[i].population || 0;
      expect(prevPop).toBeGreaterThanOrEqual(currPop);
    }
  });

  it('exact name matches appear first', () => {
    const results = searchCities('london');
    
    // London should be first or near the top
    const londonIndex = results.findIndex(c => c.name.toLowerCase() === 'london');
    expect(londonIndex).toBeLessThan(5);
  });

  it('name starts with query ranks higher than contains', () => {
    const results = searchCities('new');
    
    // Cities starting with "New" should come before cities just containing "new"
    const startsWithNew = results.filter(c => c.name.toLowerCase().startsWith('new'));
    const containsNew = results.filter(c => 
      !c.name.toLowerCase().startsWith('new') && 
      c.name.toLowerCase().includes('new')
    );
    
    if (startsWithNew.length > 0 && containsNew.length > 0) {
      const lastStartsWithIndex = results.findIndex(c => c === startsWithNew[startsWithNew.length - 1]);
      const firstContainsIndex = results.findIndex(c => c === containsNew[0]);
      expect(lastStartsWithIndex).toBeLessThan(firstContainsIndex);
    }
  });

  it('searches by country name', () => {
    const results = searchCities('united states');
    
    // All results should be from United States
    expect(results.length).toBeGreaterThan(0);
    results.forEach(city => {
      expect(city.country.toLowerCase()).toContain('united states');
    });
  });

  it('search is case-insensitive', () => {
    const lowerResults = searchCities('tokyo');
    const upperResults = searchCities('TOKYO');
    const mixedResults = searchCities('ToKyO');
    
    expect(lowerResults.length).toBe(upperResults.length);
    expect(lowerResults.length).toBe(mixedResults.length);
    expect(lowerResults[0]?.id).toBe(upperResults[0]?.id);
    expect(lowerResults[0]?.id).toBe(mixedResults[0]?.id);
  });

  it('respects limit parameter', () => {
    const results5 = searchCities('a', 5);
    const results10 = searchCities('a', 10);
    
    expect(results5.length).toBeLessThanOrEqual(5);
    expect(results10.length).toBeLessThanOrEqual(10);
  });

  it('returns empty array for queries with no matches', () => {
    const results = searchCities('xyznonexistentcity123');
    expect(results.length).toBe(0);
  });
});
