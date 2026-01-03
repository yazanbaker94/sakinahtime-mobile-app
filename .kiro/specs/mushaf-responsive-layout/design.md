# Design Document: Mushaf Responsive Layout

## Overview

This design document outlines the technical approach to make the MushafScreen layout consistent across all devices. The core principle is to replace absolute positioning with a flex-based layout that respects safe areas and calculates available space dynamically.

## Architecture

### Current Problem

The current MushafScreen uses:
```javascript
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
// ...
const offsetY = (SCREEN_HEIGHT - imageHeight) / 2;
```

This approach fails because:
1. `SCREEN_HEIGHT` returns different values on different devices (some include status bar, some don't)
2. It doesn't account for tab bar height (varies by device: 49-83px)
3. It doesn't account for safe area insets (notch, home indicator, Android navigation bar)
4. Absolute positioning with hardcoded values doesn't adapt to screen differences

### Solution: Layout Zones

The screen will be divided into logical zones using flex layout:

```
┌─────────────────────────────────┐
│         Safe Area Top           │ ← insets.top
├─────────────────────────────────┤
│    [Juz/Hizb]  [Pill]  [Surah]  │ ← Header Zone (fixed height)
├─────────────────────────────────┤
│                                 │
│                                 │
│         Mushaf Image            │ ← Content Zone (flex: 1)
│      (centered in zone)         │
│                                 │
│                                 │
├─────────────────────────────────┤
│          [Page Number]          │ ← Footer Zone (fixed height)
├─────────────────────────────────┤
│           Tab Bar               │ ← tabBarHeight
├─────────────────────────────────┤
│        Safe Area Bottom         │ ← insets.bottom
└─────────────────────────────────┘
```

## Components and Interfaces

### Layout Hook: useLayoutDimensions

A custom hook to calculate all layout dimensions consistently:

```typescript
interface LayoutDimensions {
  screenWidth: number;
  screenHeight: number;
  safeAreaTop: number;
  safeAreaBottom: number;
  tabBarHeight: number;
  headerZoneHeight: number;  // Fixed: 60px
  footerZoneHeight: number;  // Fixed: 40px
  contentZoneHeight: number; // Calculated: remaining space
  imageScale: number;        // screenWidth / 1300
  imageHeight: number;       // 2103 * imageScale
  imageOffsetY: number;      // Centering offset within content zone
}

function useLayoutDimensions(): LayoutDimensions {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  const safeAreaTop = insets.top;
  const safeAreaBottom = insets.bottom;
  const headerZoneHeight = 60;
  const footerZoneHeight = 40;
  
  // Available height for content (between header and footer)
  const contentZoneHeight = screenHeight 
    - safeAreaTop 
    - headerZoneHeight 
    - footerZoneHeight 
    - tabBarHeight 
    - safeAreaBottom;
  
  const imageScale = screenWidth / 1300;
  const imageHeight = 2103 * imageScale;
  
  // Center image within content zone
  const imageOffsetY = Math.max(0, (contentZoneHeight - imageHeight) / 2);
  
  return {
    screenWidth,
    screenHeight,
    safeAreaTop,
    safeAreaBottom,
    tabBarHeight,
    headerZoneHeight,
    footerZoneHeight,
    contentZoneHeight,
    imageScale,
    imageHeight,
    imageOffsetY,
  };
}
```

### Page Container Structure

```typescript
// Main container uses flex layout
<View style={styles.container}>
  {/* Safe area spacer */}
  <View style={{ height: safeAreaTop }} />
  
  {/* Header Zone - fixed height */}
  <View style={[styles.headerZone, { height: headerZoneHeight }]}>
    <View style={styles.juzHizbBadge}>...</View>
    <View style={styles.actionPill}>...</View>
    <View style={styles.surahBadge}>...</View>
  </View>
  
  {/* Content Zone - flex: 1 */}
  <View style={styles.contentZone}>
    <FlatList ... />
  </View>
  
  {/* Footer Zone - fixed height */}
  <View style={[styles.footerZone, { height: footerZoneHeight }]}>
    <Text>{pageNumber}</Text>
  </View>
  
  {/* Tab bar spacer */}
  <View style={{ height: tabBarHeight + safeAreaBottom }} />
</View>
```

### Render Page Function

The renderPage function will position the image and verse regions within the content zone:

```typescript
const renderPage = ({ item: pageNum }) => {
  // Image is positioned within the content zone
  // offsetY centers it vertically in the available space
  
  return (
    <View style={{ width: screenWidth, height: contentZoneHeight }}>
      <Image 
        source={mushafImages[pageNum]}
        style={{
          position: 'absolute',
          top: imageOffsetY,
          width: screenWidth,
          height: imageHeight,
        }}
      />
      
      {/* Verse regions use same offsetY for alignment */}
      {verseRegions.map(region => (
        <Pressable
          style={{
            position: 'absolute',
            top: (region.y * imageScale) + imageOffsetY,
            left: region.x * imageScale,
            width: region.width * imageScale,
            height: region.height * imageScale,
          }}
        />
      ))}
    </View>
  );
};
```

## Data Models

No new data models required. This is a layout refactor only.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: Layout Zone Heights Sum to Screen Height

*For any* device with any screen dimensions and safe area insets, the sum of all zone heights (safeAreaTop + headerZone + contentZone + footerZone + tabBarHeight + safeAreaBottom) SHALL equal the total screen height.

**Validates: Requirements 1.2, 1.3**

### Property 2: Image Centering Within Content Zone

*For any* Mushaf page image, the image SHALL be vertically centered within the content zone, with equal spacing above and below when the image is smaller than the content zone.

**Validates: Requirements 2.1, 2.3**

### Property 3: Verse Region Alignment

*For any* verse touch region, its position relative to the image SHALL remain constant regardless of device dimensions. Specifically: `touchRegion.top - imageTop === expectedOffset` for all devices.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 4: Safe Area Respect

*For any* device, no UI element SHALL be positioned within the safe area insets (status bar, notch, home indicator area).

**Validates: Requirements 3.2, 3.3, 3.4, 5.2**

### Property 5: Tab Bar Clearance

*For any* device, the page number and all interactive elements SHALL be positioned above the tab bar with at least 8px clearance.

**Validates: Requirements 5.1, 5.3**

## Error Handling

- If `useBottomTabBarHeight()` throws (screen not in tab context), fall back to default value of 49px
- If safe area insets are unavailable, use platform defaults (iOS: 44px top, 34px bottom; Android: 24px top, 0px bottom)
- If image fails to load, maintain layout structure with placeholder

## Testing Strategy

### Unit Tests

1. Test `useLayoutDimensions` hook with mocked insets and tab bar heights
2. Test that zone heights sum correctly for various device configurations
3. Test image offset calculation for different aspect ratios

### Property-Based Tests

1. **Layout Sum Property**: Generate random screen dimensions and insets, verify zones sum to total height
2. **Image Centering Property**: Generate random content zone heights, verify image is centered
3. **Verse Alignment Property**: Generate random image positions, verify touch regions maintain relative offset

### Manual Testing Checklist

- [ ] iPhone SE (small screen, no notch)
- [ ] iPhone 14 (notch, home indicator)
- [ ] iPhone 14 Pro Max (Dynamic Island, large screen)
- [ ] Android phone with navigation bar
- [ ] Android phone with gesture navigation
- [ ] Tablet (if supported)
