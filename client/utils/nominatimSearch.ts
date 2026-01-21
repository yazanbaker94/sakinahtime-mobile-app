import type { City } from '@/types/location';

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
        const timezone = getTimezoneForCountry(countryCode, latitude, longitude);

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
 * Get timezone for country (with fallback to coordinate-based approximation)
 */
function getTimezoneForCountry(countryCode: string, lat: number, lon: number): string {
    const countryTimezones: Record<string, string> = {
        'US': 'America/New_York',
        'CA': 'America/Toronto',
        'GB': 'Europe/London',
        'UK': 'Europe/London',
        'FR': 'Europe/Paris',
        'DE': 'Europe/Berlin',
        'IT': 'Europe/Rome',
        'ES': 'Europe/Madrid',
        'JP': 'Asia/Tokyo',
        'CN': 'Asia/Shanghai',
        'IN': 'Asia/Kolkata',
        'AU': 'Australia/Sydney',
        'BR': 'America/Sao_Paulo',
        'RU': 'Europe/Moscow',
        'SA': 'Asia/Riyadh',
        'AE': 'Asia/Dubai',
        'EG': 'Africa/Cairo',
        'TR': 'Europe/Istanbul',
        'PK': 'Asia/Karachi',
        'BD': 'Asia/Dhaka',
        'ID': 'Asia/Jakarta',
        'MY': 'Asia/Kuala_Lumpur',
        'TH': 'Asia/Bangkok',
        'VN': 'Asia/Ho_Chi_Minh',
        'PH': 'Asia/Manila',
        'KR': 'Asia/Seoul',
        'IR': 'Asia/Tehran',
        'IQ': 'Asia/Baghdad',
        'JO': 'Asia/Amman',
        'LB': 'Asia/Beirut',
        'SY': 'Asia/Damascus',
        'PS': 'Asia/Gaza',
        'IL': 'Asia/Jerusalem',
        'QA': 'Asia/Qatar',
        'KW': 'Asia/Kuwait',
        'BH': 'Asia/Bahrain',
        'OM': 'Asia/Muscat',
        'YE': 'Asia/Aden',
        'MA': 'Africa/Casablanca',
        'DZ': 'Africa/Algiers',
        'TN': 'Africa/Tunis',
        'LY': 'Africa/Tripoli',
        'SD': 'Africa/Khartoum',
        'NG': 'Africa/Lagos',
        'KE': 'Africa/Nairobi',
        'ZA': 'Africa/Johannesburg',
        'NZ': 'Pacific/Auckland',
        'SG': 'Asia/Singapore',
        'HK': 'Asia/Hong_Kong',
        'TW': 'Asia/Taipei',
        'AF': 'Asia/Kabul',
        'UZ': 'Asia/Tashkent',
        'KZ': 'Asia/Almaty',
        'AZ': 'Asia/Baku',
    };

    if (countryCode && countryTimezones[countryCode]) {
        return countryTimezones[countryCode];
    }

    // Fallback: approximate from longitude
    const utcOffset = Math.round(lon / 15);
    return `Etc/GMT${utcOffset >= 0 ? '-' : '+'}${Math.abs(utcOffset)}`;
}

/**
 * Clear the search cache
 */
export function clearSearchCache(): void {
    searchCache.clear();
}
