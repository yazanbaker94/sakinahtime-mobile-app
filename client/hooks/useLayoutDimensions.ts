import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { TAB_BAR_HEIGHT, TAB_BAR_BOTTOM_BASE } from '@/navigation/MainTabNavigator';

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
 * safe areas, floating tab bar, footer zone, and calculating proper image positioning.
 * 
 * @param tabBarHeight - The tab bar height from useBottomTabBarHeight() (used as fallback)
 * @returns LayoutDimensions object with all calculated values
 */
export function useLayoutDimensions(tabBarHeight?: number): LayoutDimensions {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Use actual floating tab bar footprint (height + bottom offset)
  // This is the total space the tab bar occupies from the device bottom
  const floatingTabBarClearance = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_BASE;

  const safeAreaTop = insets.top;
  const safeAreaBottom = insets.bottom;

  // Calculate available height for content zone
  // Total screen - safe area top - header - floating tab bar clearance - footer (page number)
  const contentZoneHeight = screenHeight
    - safeAreaTop
    - HEADER_ZONE_HEIGHT
    - floatingTabBarClearance
    - FOOTER_ZONE_HEIGHT;

  // Calculate image scaling to fit screen width
  const imageScale = screenWidth / MUSHAF_IMAGE_WIDTH;
  const imageHeight = MUSHAF_IMAGE_HEIGHT * imageScale;

  // Center image vertically within content zone
  const imageOffsetY = Math.max(0, (contentZoneHeight - imageHeight) / 2);

  return {
    screenWidth,
    screenHeight,
    safeAreaTop,
    safeAreaBottom,
    tabBarHeight: floatingTabBarClearance,
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
  const floatingTabBarClearance = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_BASE;
  const contentZoneHeight = screenHeight
    - safeAreaTop
    - HEADER_ZONE_HEIGHT
    - floatingTabBarClearance
    - FOOTER_ZONE_HEIGHT;

  const imageScale = screenWidth / MUSHAF_IMAGE_WIDTH;
  const imageHeight = MUSHAF_IMAGE_HEIGHT * imageScale;
  const imageOffsetY = Math.max(0, (contentZoneHeight - imageHeight) / 2);

  return {
    screenWidth,
    screenHeight,
    safeAreaTop,
    safeAreaBottom,
    tabBarHeight: floatingTabBarClearance,
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
