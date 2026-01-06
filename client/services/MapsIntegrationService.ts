/**
 * Service for integrating with native maps applications
 */

import { Platform, Linking, Alert } from 'react-native';

export interface MapsDestination {
  latitude: number;
  longitude: number;
  name: string;
}

/**
 * Generate a maps URL for the given destination and platform
 */
export function getMapsUrl(
  destination: MapsDestination,
  platform: 'ios' | 'android'
): string {
  const { latitude, longitude, name } = destination;
  const encodedName = encodeURIComponent(name);
  
  if (platform === 'ios') {
    // Apple Maps URL scheme
    return `maps://?daddr=${latitude},${longitude}&q=${encodedName}`;
  } else {
    // Google Maps geo: URI for Android
    return `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedName})`;
  }
}

/**
 * Generate a Google Maps web URL as fallback
 */
export function getGoogleMapsWebUrl(destination: MapsDestination): string {
  const { latitude, longitude, name } = destination;
  const encodedName = encodeURIComponent(name);
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodedName}`;
}

/**
 * Open directions to a mosque in the device's default maps application
 */
export async function openDirections(destination: MapsDestination): Promise<void> {
  const platform = Platform.OS as 'ios' | 'android';
  const { latitude, longitude, name } = destination;
  const encodedName = encodeURIComponent(name);
  
  // Try different URL schemes in order of preference
  const urlsToTry: string[] = [];
  
  if (platform === 'android') {
    // Android: Try Google Maps intent first, then geo: URI, then web
    urlsToTry.push(
      `google.navigation:q=${latitude},${longitude}`,
      `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedName})`,
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    );
  } else if (platform === 'ios') {
    // iOS: Apple Maps with proper directions format
    urlsToTry.push(
      `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`,
      `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`,
      `https://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`
    );
  } else {
    // Web fallback
    urlsToTry.push(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
  }
  
  // Try each URL until one works
  for (const url of urlsToTry) {
    try {
      await Linking.openURL(url);
      return; // Success, exit
    } catch (error) {
      // This URL didn't work, try next one
      console.log(`Failed to open ${url}, trying next...`);
    }
  }
  
  // All URLs failed
  Alert.alert(
    'Maps Not Available',
    'Unable to open maps. Please make sure you have a maps app installed.',
    [{ text: 'OK' }]
  );
}

export const MapsIntegrationService = {
  getMapsUrl,
  getGoogleMapsWebUrl,
  openDirections,
};
