# Qibla Compass — SVG Component Kit

Three modular SVG files designed to be composed into a Qibla compass screen.

## Files

### Dark Mode
| File | Purpose | ViewBox | Size |
|------|---------|---------|------|
| `compass_ring.svg` | Compass face (bezel, ticks, N/E/S/W labels) | `-155 -155 310 310` | 310×310 |
| `needle.svg` | Gold compass needle with center cap | `-155 -155 310 310` | 310×310 |
| `kaaba_icon.svg` | Kaaba icon | `-20 -20 40 40` | 40×40 |

### Light Mode
| File | Purpose | ViewBox | Size |
|------|---------|---------|------|
| `compass_ring_light.svg` | White face, sage-green bezel | `-155 -155 310 310` | 310×310 |
| `needle_light.svg` | Gold tip, silver-green tail, white cap | `-155 -155 310 310` | 310×310 |
| `kaaba_icon_light.svg` | Dark green body (visible on white) | `-20 -20 40 40` | 40×40 |

## How They Fit Together

All components share the **same center point (0,0)**. The compass ring and needle use the same viewBox, so they overlay directly. Use `_light` variants for light mode.

### Layer Order (bottom to top)
1. **compass_ring** — the base compass face
2. **kaaba_icon** — positioned at Qibla bearing on the compass edge
3. **needle** — the rotating needle on top

### Rotation Logic

```
compass_ring → rotate by: -deviceHeading  (so North on compass points to real North)
needle       → rotate by: 0  (stays fixed, pointing to screen-top = user's heading)
kaaba_icon   → rotate by: qiblaBearing - deviceHeading  (follows compass rotation)
```

**Alternative approach** (needle rotates instead of compass):
```
compass_ring → no rotation (fixed)
needle       → rotate by: deviceHeading
kaaba_icon   → rotate by: qiblaBearing (fixed bearing from North)
```

### Positioning the Kaaba on the Compass Edge

The Kaaba needs a triple-transform to sit at the correct angle while staying visually upright:

```jsx
// React Native (react-native-svg)
<G transform={`rotate(${angle})`}>        // 1. Rotate to Qibla bearing
  <G transform="translate(0, -100)">      // 2. Push out to radius 100
    <G transform={`rotate(${-angle})`}>   // 3. Counter-rotate to stay upright
      {/* Kaaba SVG paths here */}
    </G>
  </G>
</G>
```

Where `angle = qiblaBearing - deviceHeading` (if compass rotates) or just `qiblaBearing` (if needle rotates).

### Qibla Direction Marker Line (Optional)

Add a small green line on the compass edge pointing toward Qibla:

```jsx
<Line x1="0" y1="-142" x2="0" y2="-155"
      stroke="#2ecc8f" strokeWidth="2.5" strokeLinecap="round"
      transform={`rotate(${angle})`} />
```

## Theme Colors

### Dark Mode (true black)
- Background: `#000000` / `#111111`
- Compass face: `#161616`
- Green accent (North, Qibla): `#2ecc8f`
- Gold accent (needle): `#d4a853` / `#c49228`
- Ticks/labels: `#3a3a3a` — `#707070`

### Light Mode
- Background: `#f0f4f3` / `#e6ece9`
- Compass face: `#ffffff`
- Green accent (North, Qibla): `#1a8a58`
- Gold accent (needle): `#d4a853` / `#c49228`
- Ticks/labels: `#c0cec6` — `#5a7a6a`
