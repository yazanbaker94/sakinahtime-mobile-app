/**
 * MosqueApiService - Service for fetching mosque data from OpenStreetMap Overpass API
 * Completely free, no API key required
 */

import { Mosque, MosqueDetail } from '@/types/mosque';

// Multiple Overpass API endpoints for fallback
const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

interface SearchParams {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    'name:en'?: string;
    'name:ar'?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
    'addr:postcode'?: string;
    'addr:full'?: string;
    phone?: string;
    website?: string;
    opening_hours?: string;
    amenity?: string;
    religion?: string;
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Build address string from OSM tags
 */
function buildAddress(tags?: OverpassElement['tags']): string {
  if (!tags) return 'Address not available';
  
  if (tags['addr:full']) {
    return tags['addr:full'];
  }
  
  const parts: string[] = [];
  
  if (tags['addr:housenumber'] && tags['addr:street']) {
    parts.push(`${tags['addr:housenumber']} ${tags['addr:street']}`);
  } else if (tags['addr:street']) {
    parts.push(tags['addr:street']);
  }
  
  if (tags['addr:city']) {
    parts.push(tags['addr:city']);
  }
  
  if (tags['addr:postcode']) {
    parts.push(tags['addr:postcode']);
  }
  
  return parts.length > 0 ? parts.join(', ') : 'Address not available';
}

/**
 * Get mosque name from OSM tags (prefer English, fallback to default or Arabic)
 */
function getMosqueName(tags?: OverpassElement['tags']): string {
  if (!tags) return 'Mosque';
  return tags['name:en'] || tags.name || tags['name:ar'] || 'Mosque';
}

/**
 * Transform OpenStreetMap element to Mosque type
 */
export function transformOsmToMosque(
  element: OverpassElement,
  userLat: number,
  userLon: number
): Mosque {
  // Get coordinates (nodes have lat/lon directly, ways/relations have center)
  const lat = element.lat ?? element.center?.lat ?? 0;
  const lon = element.lon ?? element.center?.lon ?? 0;
  
  const distance = calculateDistance(userLat, userLon, lat, lon);

  return {
    id: `osm-${element.type}-${element.id}`,
    name: getMosqueName(element.tags),
    address: buildAddress(element.tags),
    latitude: lat,
    longitude: lon,
    distance,
    // OSM doesn't have ratings, so these are undefined
    rating: undefined,
    reviewCount: undefined,
    isOpen: undefined,
    photoReference: undefined,
  };
}

/**
 * Make request to Overpass API with fallback servers
 */
async function fetchFromOverpass(query: string): Promise<any> {
  let lastError: Error | null = null;
  
  for (const server of OVERPASS_SERVERS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      const response = await fetch(server, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.json();
      }
      
      // If server returned error, try next one
      lastError = new Error(`Server ${server} returned ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      // Continue to next server
    }
  }
  
  throw lastError || new Error('All Overpass servers failed');
}

/**
 * Search for nearby mosques using OpenStreetMap Overpass API
 */
async function searchNearbyMosques(params: SearchParams): Promise<Mosque[]> {
  const { latitude, longitude, radiusMeters } = params;
  
  // Overpass QL query to find mosques within radius
  // Searches for amenity=place_of_worship with religion=muslim OR amenity=mosque
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${latitude},${longitude});
      node["amenity"="mosque"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="mosque"](around:${radiusMeters},${latitude},${longitude});
    );
    out center;
  `;

  try {
    const data = await fetchFromOverpass(query);
    const elements: OverpassElement[] = data.elements || [];
    
    // Transform and sort by distance
    const mosques = elements
      .filter(el => el.lat || el.center) // Must have coordinates
      .map(el => transformOsmToMosque(el, latitude, longitude))
      .sort((a, b) => a.distance - b.distance);
    
    return mosques;
  } catch (error) {
    console.error('Error fetching mosques from OpenStreetMap:', error);
    throw new Error('Failed to fetch nearby mosques. Please try again.');
  }
}

/**
 * Get detailed information about a specific mosque
 * For OSM, we fetch the element directly by ID
 */
async function getMosqueDetails(
  mosqueId: string,
  userLat: number,
  userLon: number
): Promise<MosqueDetail> {
  // Parse the OSM ID (format: osm-type-id)
  const parts = mosqueId.split('-');
  if (parts.length !== 3 || parts[0] !== 'osm') {
    throw new Error('Invalid mosque ID format');
  }
  
  const osmType = parts[1]; // node, way, or relation
  const osmId = parts[2];
  
  const query = `
    [out:json][timeout:10];
    ${osmType}(${osmId});
    out center;
  `;

  try {
    const data = await fetchFromOverpass(query);
    const elements: OverpassElement[] = data.elements || [];
    
    if (elements.length === 0) {
      throw new Error('Mosque not found');
    }

    const element = elements[0];
    const baseMosque = transformOsmToMosque(element, userLat, userLon);

    // Build MosqueDetail with additional OSM tags
    return {
      ...baseMosque,
      phoneNumber: element.tags?.phone,
      website: element.tags?.website,
      photos: [], // OSM doesn't provide photos
      openingHours: element.tags?.opening_hours ? {
        weekdayText: [element.tags.opening_hours],
        isOpenNow: false,
      } : undefined,
    };
  } catch (error) {
    console.error('Error fetching mosque details:', error);
    throw error;
  }
}

/**
 * Get photo URL - not available for OSM
 */
function getPhotoUrl(_photoReference: string, _maxWidth: number = 400): string | null {
  return null;
}

export const MosqueApiService = {
  searchNearbyMosques,
  getMosqueDetails,
  getPhotoUrl,
  calculateDistance,
  transformOsmToMosque,
};
