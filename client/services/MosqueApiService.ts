/**
 * MosqueApiService - Service for fetching mosque data from OpenStreetMap Overpass API
 * Completely free, no API key required
 * 
 * Architecture:
 * - Sequential fallback across 3 Overpass servers (NOT parallel — avoids DDoS/rate-limiting)
 * - 5-minute in-memory cache with 100m movement tolerance
 * - Spatial deduplication (merges node+way duplicates within 50m)
 * - Hard-capped at 100 results per query
 */

import { Mosque, MosqueDetail } from '@/types/mosque';

// Overpass servers — tried sequentially, NOT in parallel
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

// In-memory cache
interface MosqueCache {
  data: Mosque[];
  latitude: number;
  longitude: number;
  radiusMeters: number;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_DISTANCE_THRESHOLD = 100; // meters — reuse cache if user moved less than this
let mosqueCache: MosqueCache | null = null;

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
    rating: undefined,
    reviewCount: undefined,
    isOpen: undefined,
    photoReference: undefined,
  };
}

/**
 * Spatial deduplication — merges node+way duplicates within 50m
 * Prefers 'way' over 'node' (better address metadata from building outlines)
 */
function deduplicateMosques(mosques: Mosque[]): Mosque[] {
  const DEDUP_THRESHOLD = 50; // meters
  const result: Mosque[] = [];
  const merged = new Set<number>();

  for (let i = 0; i < mosques.length; i++) {
    if (merged.has(i)) continue;

    let best = mosques[i];

    for (let j = i + 1; j < mosques.length; j++) {
      if (merged.has(j)) continue;

      const dist = calculateDistance(
        best.latitude, best.longitude,
        mosques[j].latitude, mosques[j].longitude
      );

      if (dist < DEDUP_THRESHOLD) {
        // Check name similarity (case-insensitive)
        const nameA = best.name.toLowerCase().trim();
        const nameB = mosques[j].name.toLowerCase().trim();
        const similar = nameA === nameB ||
          nameA.includes(nameB) || nameB.includes(nameA) ||
          nameA === 'mosque' || nameB === 'mosque';

        if (similar) {
          merged.add(j);
          // Prefer 'way' over 'node' for better metadata
          if (mosques[j].id.includes('-way-') && !best.id.includes('-way-')) {
            best = { ...mosques[j], distance: best.distance };
          }
          // Prefer the one with a real name over generic "Mosque"
          if (best.name === 'Mosque' && mosques[j].name !== 'Mosque') {
            best = { ...best, name: mosques[j].name };
          }
          // Prefer the one with a real address
          if (best.address === 'Address not available' && mosques[j].address !== 'Address not available') {
            best = { ...best, address: mosques[j].address };
          }
        }
      }
    }

    result.push(best);
  }

  return result;
}

/**
 * Sequential fallback across Overpass servers
 * Tries each server one at a time — NOT parallel (avoids rate-limiting/DDoS)
 * Supports AbortSignal for request cancellation
 */
async function fetchFromOverpass(query: string, signal?: AbortSignal): Promise<any> {
  let lastError: Error | null = null;

  for (const server of OVERPASS_SERVERS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout per server

    // Link external abort signal to this controller
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort);

    try {
      // Check if already aborted before starting
      if (signal?.aborted) {
        throw new Error('Request cancelled');
      }

      const response = await fetch(server, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'SakinahTime/1.0 (Islamic Prayer App)',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onAbort);

      if (!response.ok) {
        throw new Error(`Server ${server} returned ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onAbort);
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // If externally aborted, don't try next server
      if (signal?.aborted) {
        throw new Error('Request cancelled');
      }

      // Otherwise, try next server
      console.log(`[MosqueAPI] Server ${server} failed, trying next...`);
    }
  }

  throw lastError || new Error('All Overpass servers failed');
}

/**
 * Search for nearby mosques using OpenStreetMap Overpass API
 * Results are capped at 100, deduplicated, and sorted by distance
 */
async function searchNearbyMosques(params: SearchParams, signal?: AbortSignal): Promise<Mosque[]> {
  const { latitude, longitude, radiusMeters } = params;

  // Check cache first
  if (mosqueCache &&
    Date.now() - mosqueCache.timestamp < CACHE_TTL_MS &&
    mosqueCache.radiusMeters >= radiusMeters &&
    calculateDistance(latitude, longitude, mosqueCache.latitude, mosqueCache.longitude) < CACHE_DISTANCE_THRESHOLD
  ) {
    // Recalculate distances from current position and filter to requested radius
    return mosqueCache.data
      .map(m => ({ ...m, distance: calculateDistance(latitude, longitude, m.latitude, m.longitude) }))
      .filter(m => m.distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance);
  }

  // Overpass QL query — capped at 100 results
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${latitude},${longitude});
      node["amenity"="mosque"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="mosque"](around:${radiusMeters},${latitude},${longitude});
    );
    out center 100;
  `;

  try {
    const data = await fetchFromOverpass(query, signal);
    const elements: OverpassElement[] = data.elements || [];

    // Transform, deduplicate, and sort by distance
    const mosques = elements
      .filter(el => el.lat || el.center) // Must have coordinates
      .map(el => transformOsmToMosque(el, latitude, longitude));

    const deduplicated = deduplicateMosques(mosques)
      .sort((a, b) => a.distance - b.distance);

    // Cache the results
    mosqueCache = { data: deduplicated, latitude, longitude, radiusMeters, timestamp: Date.now() };

    return deduplicated;
  } catch (error) {
    if (signal?.aborted) {
      throw new Error('Request cancelled');
    }
    console.error('Error fetching mosques from OpenStreetMap:', error);
    throw new Error('Failed to fetch nearby mosques. Please try again.');
  }
}

/**
 * Get detailed information about a specific mosque
 */
async function getMosqueDetails(
  mosqueId: string,
  userLat: number,
  userLon: number
): Promise<MosqueDetail> {
  const parts = mosqueId.split('-');
  if (parts.length !== 3 || parts[0] !== 'osm') {
    throw new Error('Invalid mosque ID format');
  }

  const osmType = parts[1];
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

    return {
      ...baseMosque,
      phoneNumber: element.tags?.phone,
      website: element.tags?.website,
      photos: [],
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

/**
 * Prefetch nearby mosques silently (called from Qibla screen)
 */
async function prefetchNearbyMosques(latitude: number, longitude: number, radiusMeters: number = 5000): Promise<void> {
  try {
    await searchNearbyMosques({ latitude, longitude, radiusMeters });
  } catch {
    // Silent fail — background optimization
  }
}

export const MosqueApiService = {
  searchNearbyMosques,
  getMosqueDetails,
  getPhotoUrl,
  calculateDistance,
  transformOsmToMosque,
  prefetchNearbyMosques,
};
