import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';

// Constants for Mushaf image dimensions (original image size)
const MUSHAF_IMAGE_WIDTH = 1300;
const MUSHAF_IMAGE_HEIGHT = 2103;

// Fixed zone heights
const HEADER_ZONE_HEIGHT = 60;
const FOOTER_ZONE_HEIGHT = 40;

// Default tab bar height fallback
const DEFAULT_TAB_BAR_HEIGHT = 49;

export interface LayoutDimensions {
  screenWidth: number;
  screenHeight: number;
  safeAreaTop: number;
  safeAreaBottom: number;
  tabBarHeight: number;
  headerZoneHeight: number;
  footerZoneHeight: number;
  contentZoneHeight: number;
  imageScale: number;
  imageHeight: number;
  imageOffsetY: number;
}

/**
 * Hook to calculate layout dimensions for MushafScreen.
 * Provides consistent measurements across all devices by accounting for
 * safe areas, tab bar, and calculating proper image positioning.
 * 
 * @param tabBarHeight - The tab bar height from useBottomTabBarHeight()
 * @returns LayoutDimensions object with all calculated values
 */
export function useLayoutDimensions(tabBarHeight?: number): LayoutDimensions {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  // Use provided tab bar height or fallback
  const effectiveTabBarHeight = tabBarHeight ?? DEFAULT_TAB_BAR_HEIGHT;
  
  const safeAreaTop = insets.top;
  const safeAreaBottom = insets.bottom;
  
  // Calculate available height for content zone
  // Total screen - safe areas - header - footer - tab bar
  const contentZoneHeight = screenHeight 
    - safeAreaTop 
    - HEADER_ZONE_HEIGHT 
    - FOOTER_ZONE_HEIGHT 
    - effectiveTabBarHeight;
  
  // Calculate image scaling to fit screen width
  const imageScale = screenWidth / MUSHAF_IMAGE_WIDTH;
  const imageHeight = MUSHAF_IMAGE_HEIGHT * imageScale;
  
  // Center image vertically within content zone
  // If image is taller than content zone, offset will be negative (image extends beyond)
  const imageOffsetY = Math.max(0, (contentZoneHeight - imageHeight) / 2);
  
  return {
    screenWidth,
    screenHeight,
    safeAreaTop,
    safeAreaBottom,
    tabBarHeight: effectiveTabBarHeight,
    headerZoneHeight: HEADER_ZONE_HEIGHT,
    footerZoneHeight: FOOTER_ZONE_HEIGHT,
    contentZoneHeight,
    imageScale,
    imageHeight,
    imageOffsetY,
  };
}

/**
 * Calculate layout dimensions without hooks (for testing or non-component contexts)
 */
export function calculateLayoutDimensions(
  screenWidth: number,
  screenHeight: number,
  safeAreaTop: number,
  safeAreaBottom: number,
  tabBarHeight: number
): LayoutDimensions {
  const contentZoneHeight = screenHeight 
    - safeAreaTop 
    - HEADER_ZONE_HEIGHT 
    - FOOTER_ZONE_HEIGHT 
    - tabBarHeight;
  
  const imageScale = screenWidth / MUSHAF_IMAGE_WIDTH;
  const imageHeight = MUSHAF_IMAGE_HEIGHT * imageScale;
  const imageOffsetY = Math.max(0, (contentZoneHeight - imageHeight) / 2);
  
  return {
    screenWidth,
    screenHeight,
    safeAreaTop,
    safeAreaBottom,
    tabBarHeight,
    headerZoneHeight: HEADER_ZONE_HEIGHT,
    footerZoneHeight: FOOTER_ZONE_HEIGHT,
    contentZoneHeight,
    imageScale,
    imageHeight,
    imageOffsetY,
  };
}

// Export constants for testing
export const LAYOUT_CONSTANTS = {
  MUSHAF_IMAGE_WIDTH,
  MUSHAF_IMAGE_HEIGHT,
  HEADER_ZONE_HEIGHT,
  FOOTER_ZONE_HEIGHT,
  DEFAULT_TAB_BAR_HEIGHT,
};
