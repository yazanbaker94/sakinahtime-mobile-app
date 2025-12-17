# Coordinate Validation Report

## Summary
Validated all 604 coordinate files for the Mushaf pages.

## Issues Found

### 1. Negative Width/Height Values
Found **118 entries** with negative width or height values across 48 pages (557-604).
- These are likely marker/separator coordinates that should be filtered out
- Example: `{"width": -8, "height": 23}` in page_557.json

### 2. Out-of-Bounds Coordinates
Found **1,485 entries** where `y + height > 1800` (image height) across 48 pages (557-604).
- These coordinates extend beyond the bottom of the page image
- Maximum overflow: ~230 pixels (y+height = 2030 in page_560.json)
- This affects the last 1-2 lines of text on these pages

### Affected Pages
Pages 557-604 (last 48 pages of the Quran) have coordinate issues.

## Root Cause
The coordinate data appears to have:
1. Marker entries with negative dimensions (used for positioning/alignment)
2. Coordinates that extend beyond the standard 1260x1800 image dimensions

## Solution Implemented

### 1. Updated MushafScreen.tsx
- Changed from loading one large coordinate file to loading individual page files
- Added filtering to exclude coordinates with `width <= 0` or `height <= 0`
- Coordinates are now loaded per-page: `require(\`../../assets/coordinates/page_\${pageNum}.json\`)`

### 2. Validation Script
Created `scripts/validate-coordinates.js` to check all coordinate files for:
- Missing files
- Page number mismatches
- Negative x/y positions
- Negative width/height
- Out-of-bounds coordinates (x+width > 1260 or y+height > 1800)

## Recommendations

1. **Filter Invalid Coordinates**: The updated MushafScreen now filters out negative dimensions
2. **Clamp Out-of-Bounds**: Consider clamping coordinates to image bounds:
   ```javascript
   const clampedHeight = Math.min(height, 1800 - y);
   const clampedWidth = Math.min(width, 1260 - x);
   ```
3. **Review Source Data**: The original coordinate extraction may need adjustment for the last 48 pages

## Usage

Run validation anytime:
```bash
node scripts/validate-coordinates.js
```

## Performance Benefits
- **Before**: Loading one large JSON file (~6MB) with all coordinates
- **After**: Loading only the needed page file (~10KB per page)
- **Result**: Faster initial load, lower memory usage, better performance
