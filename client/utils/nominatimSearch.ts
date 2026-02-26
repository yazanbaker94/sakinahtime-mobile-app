import type { City } from '@/types/location';
// @ts-ignore — tz-lookup has no type definitions
import tzlookup from 'tz-lookup';

// Photon API - built for autocomplete, does prefix matching well
const PHOTON_BASE_URL = 'https://photon.komoot.io/api';

// Cache for recent searches to reduce API calls
const searchCache = new Map<string, { results: City[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Search for cities using Photon API (OpenStreetMap-based autocomplete)
 * Photon does prefix matching, so "irb" will find "Irbid"
 */
export async function searchCitiesOnline(query: string, limit: number = 20): Promise<City[]> {
    if (!query || query.trim().length < 2) {
        return [];
    }

    const normalizedQuery = query.trim().toLowerCase();

    // Check cache first
    const cached = searchCache.get(normalizedQuery);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.results;
    }

    try {
        const params = new URLSearchParams({
            q: query.trim(),
            limit: String(limit),
            lang: 'en',
        });

        const response = await fetch(`${PHOTON_BASE_URL}?${params}`, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.warn(`Photon API returned ${response.status}`);
            return [];
        }

        const data = await response.json();

        if (!data.features || !Array.isArray(data.features)) {
            console.warn('Photon returned invalid response');
            return [];
        }

        // Filter and transform results - only keep cities/towns/villages
        const cities: City[] = data.features
            .filter((feature: any) => {
                const type = feature.properties?.type?.toLowerCase() || '';
                return ['city', 'town', 'village', 'municipality', 'locality', 'hamlet', 'suburb', 'district'].includes(type);
            })
            .map((feature: any) => transformPhotonResult(feature))
            .filter((city: City | null): city is City => city !== null);

        // Cache results
        searchCache.set(normalizedQuery, { results: cities, timestamp: Date.now() });

        return cities;
    } catch (error) {
        console.error('Photon search error:', error);
        return [];
    }
}

/**
 * Transform Photon result to our City type
 */
function transformPhotonResult(feature: any): City | null {
    try {
        const props = feature.properties || {};
        const coords = feature.geometry?.coordinates || [];

        // Photon returns [lon, lat] order
        const longitude = coords[0];
        const latitude = coords[1];

        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return null;
        }

        // Extract city name
        const cityName = props.name || props.city || props.town || props.village;
        if (!cityName) {
            return null;
        }

        // Extract country
        const country = props.country || 'Unknown';
        const countryCode = props.countrycode?.toUpperCase() || '';

        // Get timezone from country code
        const timezone = getTimezoneFromCoordinates(latitude, longitude);

        return {
            id: `photon-${props.osm_id || `${latitude}-${longitude}`}`,
            name: cityName,
            country,
            countryCode,
            latitude,
            longitude,
            timezone,
            population: undefined,
        };
    } catch (error) {
        console.error('Error transforming Photon result:', error);
        return null;
    }
}

/**
 * Get timezone from coordinates using tz-lookup (compressed spatial index)
 * Accurate to sub-degree resolution, works fully offline
 */
function getTimezoneFromCoordinates(lat: number, lon: number): string {
    try {
        return tzlookup(lat, lon);
    } catch {
        // Fallback: approximate from longitude
        const utcOffset = Math.round(lon / 15);
        return `Etc/GMT${utcOffset >= 0 ? '-' : '+'}${Math.abs(utcOffset)}`;
    }
}

/**
 * Clear the search cache
 */
export function clearSearchCache(): void {
    searchCache.clear();
}
