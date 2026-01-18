# Word Scrubber Technical Design

## Architecture Decision

### Inline Implementation (Chosen Approach)
Instead of a separate component file, implement the Word Scrubber directly inside `MushafScreen.tsx`. This avoids:
- Import/export issues with Metro bundler
- Circular dependency problems
- Component registration issues

The scrubber will be a set of state variables, helper functions, and JSX rendered conditionally within MushafScreen.

## Data Flow

```
User Touch → PanResponder → Screen Coordinates
                              ↓
                    Convert to Image Coordinates
                              ↓
                    Find Word in allCoords
                              ↓
                    Load Word Meaning (async)
                              ↓
                    Update Loupe Display
```

## State Design

```typescript
// Add to MushafScreen state
const [isWordScrubberActive, setIsWordScrubberActive] = useState(false);
const [scrubberWord, setScrubberWord] = useState<{
  surah: number;
  ayah: number;
  wordIndex: number;
  arabicWord?: string;
  transliteration?: string;
  translation?: string;
} | null>(null);

// Refs for animation (avoid re-renders)
const loupePosition = useRef({ x: 0, y: 0 });
const loupeOpacity = useRef(new Animated.Value(0)).current;
const loupeScale = useRef(new Animated.Value(0.8)).current;
const lastWordKey = useRef<string | null>(null);
```

## Coordinate Conversion

```typescript
const findWordAtPosition = (screenX: number, screenY: number) => {
  const { imageScale, imageOffsetY } = layout;
  const imageX = screenX / imageScale;
  const imageY = (screenY - imageOffsetY) / imageScale;
  
  const pageCoords = allCoords?.[currentPage];
  if (!pageCoords) return null;
  
  for (const coord of pageCoords) {
    if (coord.sura && coord.ayah !== null &&
        imageX >= coord.x && imageX <= coord.x + coord.width &&
        imageY >= coord.y && imageY <= coord.y + coord.height) {
      return { surah: coord.sura, ayah: coord.ayah, wordIndex: /* calculate */ };
    }
  }
  return null;
};
```

## Word Index Calculation

The coordinates array contains words in order per verse. To get the word index:

```typescript
// Group coords by verse, then find index within that verse
const getWordIndex = (coord: any, pageCoords: any[]) => {
  const verseCoords = pageCoords.filter(
    c => c.sura === coord.sura && c.ayah === coord.ayah
  );
  return verseCoords.indexOf(coord);
};
```

## PanResponder Setup

```typescript
const scrubberPanResponder = useRef(
  PanResponder.create({
    onStartShouldSetPanResponder: () => isWordScrubberActive,
    onMoveShouldSetPanResponder: () => isWordScrubberActive,
    onPanResponderGrant: handleScrubberStart,
    onPanResponderMove: handleScrubberMove,
    onPanResponderRelease: handleScrubberEnd,
    onPanResponderTerminate: handleScrubberEnd,
  })
).current;
```

## Loupe Positioning

Keep loupe within screen bounds:

```typescript
const getLoupePosition = (touchX: number, touchY: number) => {
  const LOUPE_WIDTH = 260;
  const LOUPE_HEIGHT = 120;
  const OFFSET_Y = 80; // Above finger
  
  return {
    x: Math.max(16, Math.min(touchX - LOUPE_WIDTH/2, SCREEN_WIDTH - LOUPE_WIDTH - 16)),
    y: Math.max(60, touchY - LOUPE_HEIGHT - OFFSET_Y),
  };
};
```

## Animation Strategy

Use `Animated.Value` with `useNativeDriver: true` for smooth 60fps:

```typescript
// Show loupe
Animated.parallel([
  Animated.timing(loupeOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
  Animated.spring(loupeScale, { toValue: 1, friction: 8, useNativeDriver: true }),
]).start();

// Hide loupe
Animated.parallel([
  Animated.timing(loupeOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
  Animated.timing(loupeScale, { toValue: 0.8, duration: 200, useNativeDriver: true }),
]).start();
```

## JSX Structure

```jsx
{/* FAB Button */}
{!isWordScrubberActive && !showSurahList && ... && (
  <Pressable onPress={() => setIsWordScrubberActive(true)} style={fabStyle}>
    <Feather name="type" size={24} color="#FFF" />
  </Pressable>
)}

{/* Scrubber Overlay */}
{isWordScrubberActive && (
  <View style={StyleSheet.absoluteFill} {...scrubberPanResponder.panHandlers}>
    {/* Close Button */}
    <Pressable onPress={() => setIsWordScrubberActive(false)} style={closeButtonStyle}>
      <Feather name="x" size={20} />
    </Pressable>
    
    {/* Instructions (shown when not dragging) */}
    {!scrubberWord && <InstructionOverlay />}
  </View>
)}

{/* Loupe (separate from overlay for z-index) */}
{isWordScrubberActive && (
  <Animated.View style={[loupeStyle, { opacity: loupeOpacity, transform: [...] }]}>
    {scrubberWord && <LoupeContent word={scrubberWord} />}
  </Animated.View>
)}
```

## Error Handling

- If `allCoords` not loaded, disable FAB
- If word meaning fetch fails, show word without meaning
- If touch outside any word, keep last word displayed

## Performance Optimizations

1. **Memoize coordinate lookup**: Use `useMemo` for grouped coordinates
2. **Debounce word loading**: Don't fetch meaning on every pixel move
3. **Use refs for position**: Avoid state updates during drag
4. **Native driver animations**: All animations use native driver
