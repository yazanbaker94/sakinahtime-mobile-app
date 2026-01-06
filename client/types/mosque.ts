/**
 * Mosque data types for the Mosque Finder feature
 */

export interface Mosque {
  id: string;           // Google Place ID
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number;     // Distance from user in meters
  rating?: number;      // 1-5 rating
  reviewCount?: number;
  isOpen?: boolean;     // Current open/closed status
  photoReference?: string; // For fetching photo
}

export interface MosqueDetail extends Mosque {
  phoneNumber?: string;
  website?: string;
  photos: string[];     // Array of photo URLs
  openingHours?: {
    weekdayText: string[];  // e.g., ["Monday: 5:00 AM – 10:00 PM", ...]
    isOpenNow: boolean;
  };
}

export interface MosqueSearchParams {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}
