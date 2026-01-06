# Multi-Theme System Design - SakinahTime

## Overview
Expand the current light/dark theme system to support multiple aesthetic themes, including feminine/girly options, while maintaining Islamic design principles.

---

## Theme Palettes

### 1. Default Themes (Existing)
Keep current emerald-based light and dark themes as defaults.

### 2. Rose Gold (Girly Theme 1)
Soft, warm feminine aesthetic with dusty rose tones.

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| primary | `#D4A5A5` (dusty rose) | `#E8B4B8` (soft rose) |
| primaryLight | `#E8B4B8` | `#F0C4C8` |
| text | `#5C4A4A` (warm brown) | `#F5E6E8` |
| textSecondary | `#8B7575` | `#C9A8AB` |
| backgroundRoot | `#FFF5F5` (cream pink) | `#2D2226` |
| backgroundDefault | `#FFFFFF` | `#3D2F33` |
| backgroundSecondary | `#FDF0F0` | `#4A3B3F` |
| cardBackground | `#FFFFFF` | `#3D2F33` |
| gold | `#C9A86C` (rose gold) | `#D4B896` |
| border | `#F0D4D4` | `#5A4448` |
| tabIconSelected | `#D4A5A5` | `#E8B4B8` |
| prayerActive | `#D4A5A5` | `#E8B4B8` |

### 3. Lavender Dreams (Girly Theme 2)
Calming purple-based palette with soft violet tones.

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| primary | `#9B8AA6` (dusty purple) | `#B8A9C9` (soft lavender) |
| primaryLight | `#B8A9C9` | `#D4C8E0` |
| text | `#4A4458` (deep plum) | `#F0EBF5` |
| textSecondary | `#7A7088` | `#A89BB8` |
| backgroundRoot | `#FAF8FF` (whisper white) | `#252030` |
| backgroundDefault | `#FFFFFF` | `#322D40` |
| backgroundSecondary | `#F5F0FA` | `#3E384D` |
| cardBackground | `#FFFFFF` | `#322D40` |
| gold | `#C9B896` (champagne) | `#D4C8A6` |
| border | `#E8E0F0` | `#4A4458` |
| tabIconSelected | `#9B8AA6` | `#B8A9C9` |
| prayerActive | `#9B8AA6` | `#B8A9C9` |

### 4. Sage & Peach (Softer Feminine)
Nature-inspired, less overtly "pink" but still soft and feminine.

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| primary | `#8FA68B` (sage green) | `#A6BFA2` |
| primaryLight | `#A6BFA2` | `#C4D9C0` |
| text | `#4A4A4A` | `#F5F0EB` |
| textSecondary | `#7A7A7A` | `#B8AFA5` |
| backgroundRoot | `#FFFAF5` (warm cream) | `#262420` |
| backgroundDefault | `#FFFFFF` | `#332F2A` |
| backgroundSecondary | `#FFF5EB` | `#403B35` |
| cardBackground | `#FFFFFF` | `#332F2A` |
| gold | `#E6B8A2` (peach/coral) | `#F0C8B2` |
| border | `#F0E6DB` | `#4A4540` |
| tabIconSelected | `#8FA68B` | `#A6BFA2` |
| prayerActive | `#8FA68B` | `#A6BFA2` |

### 5. Ocean Breeze (Bonus - Calming Blue)
Serene blue tones for a peaceful feel.

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| primary | `#6B9DAD` (dusty teal) | `#8BB8C8` |
| primaryLight | `#8BB8C8` | `#A8D0DE` |
| text | `#3A4A50` | `#E8F0F2` |
| textSecondary | `#6A7A80` | `#A0B8C0` |
| backgroundRoot | `#F5FAFB` | `#1E2628` |
| backgroundDefault | `#FFFFFF` | `#2A3538` |
| backgroundSecondary | `#EBF5F7` | `#354245` |
| cardBackground | `#FFFFFF` | `#2A3538` |
| gold | `#C9B896` | `#D4C8A6` |
| border | `#D4E8ED` | `#3A4A50` |
| tabIconSelected | `#6B9DAD` | `#8BB8C8` |
| prayerActive | `#6B9DAD` | `#8BB8C8` |

---

## Architecture

### Current State
```
ThemeContext.tsx → themeMode: "light" | "dark" | "system"
useTheme.ts → returns Colors.light or Colors.dark
theme.ts → Colors object with light/dark keys
```

### New Architecture
```
ThemeContext.tsx → themeMode: "system" | ThemeId
                 → colorMode: "light" | "dark" | "auto"
useTheme.ts → returns full theme colors based on themeId + colorMode
theme.ts → Themes object with all theme definitions
```

### New Types
```typescript
type ThemeId = "default" | "roseGold" | "lavender" | "sagePeach" | "oceanBreeze";
type ColorMode = "light" | "dark" | "auto"; // auto = follow system

interface ThemeConfig {
  id: ThemeId;
  name: string;
  nameAr: string;
  description: string;
  previewColors: string[]; // 3-4 colors for theme picker preview
  light: ThemeColors;
  dark: ThemeColors;
}
```

---

## File Changes

### Files to Modify
| File | Changes |
|------|---------|
| `client/constants/theme.ts` | Add all theme definitions, export `Themes` object |
| `client/contexts/ThemeContext.tsx` | Support `themeId` + `colorMode`, migrate storage |
| `client/hooks/useTheme.ts` | Return colors based on themeId + colorMode |
| `client/screens/SettingsScreen.tsx` | Add theme picker UI |

### New Files
| File | Purpose |
|------|---------|
| `client/components/ThemePicker.tsx` | Visual theme selector with color swatches |
| `client/types/theme.ts` | Theme type definitions |

---

## UI Design - Theme Picker

### Settings Screen Addition
Add a "Theme" section in Settings with:

```
┌─────────────────────────────────────┐
│  🎨 Appearance                      │
├─────────────────────────────────────┤
│  Color Mode                         │
│  ○ Light  ○ Dark  ○ Auto           │
├─────────────────────────────────────┤
│  Theme                              │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ 🟢  │ │ 🌸  │ │ 💜  │ │ 🌿  │  │
│  │ ─── │ │ ─── │ │ ─── │ │ ─── │  │
│  │ ─── │ │ ─── │ │ ─── │ │ ─── │  │
│  └──✓──┘ └─────┘ └─────┘ └─────┘  │
│  Default  Rose   Lavender  Sage    │
│           Gold                      │
└─────────────────────────────────────┘
```

Each theme card shows:
- 3-4 color swatches (primary, background, accent)
- Theme name
- Checkmark on selected theme

---

## Implementation Tasks

### Phase 1: Foundation (Core Infrastructure)
- [x] **Task 1.1**: Create `client/types/theme.ts` with type definitions
- [x] **Task 1.2**: Refactor `client/constants/theme.ts` to support multiple themes
- [x] **Task 1.3**: Update `ThemeContext.tsx` to handle themeId + colorMode
- [x] **Task 1.4**: Update `useTheme.ts` hook to return correct theme colors
- [x] **Task 1.5**: Add storage migration for existing users (light/dark → default theme)

### Phase 2: Theme Definitions
- [x] **Task 2.1**: Define Rose Gold theme (light + dark variants)
- [x] **Task 2.2**: Define Lavender Dreams theme (light + dark variants)
- [x] **Task 2.3**: Define Sage & Peach theme (light + dark variants)
- [x] **Task 2.4**: Define Ocean Breeze theme (light + dark variants)

### Phase 3: UI Components
- [x] **Task 3.1**: Create `ThemePicker.tsx` component with visual swatches
- [x] **Task 3.2**: Create `ColorModeSelector.tsx` component (integrated into ThemePicker)
- [x] **Task 3.3**: Update `SettingsScreen.tsx` with Appearance section

### Phase 4: Polish & Testing
- [ ] **Task 4.1**: Test all themes in light and dark modes
- [ ] **Task 4.2**: Ensure proper contrast ratios for accessibility
- [ ] **Task 4.3**: Test theme persistence across app restarts
- [ ] **Task 4.4**: Verify Quran/Arabic text readability in all themes

---

## Migration Strategy

### Storage Keys
- Old: `@app_theme_mode` → "light" | "dark" | "system"
- New: `@app_theme_id` → ThemeId
- New: `@app_color_mode` → ColorMode

### Migration Logic
```typescript
// On first load with new system:
const oldMode = await AsyncStorage.getItem("@app_theme_mode");
if (oldMode && !await AsyncStorage.getItem("@app_theme_id")) {
  // Migrate: keep their light/dark preference, use default theme
  await AsyncStorage.setItem("@app_theme_id", "default");
  await AsyncStorage.setItem("@app_color_mode", oldMode === "system" ? "auto" : oldMode);
}
```

---

## Accessibility Considerations

1. **Contrast Ratios**: All themes must maintain WCAG AA contrast (4.5:1 for text)
2. **Color Blindness**: Avoid relying solely on color to convey information
3. **Quran Text**: Ensure Arabic text remains highly readable in all themes
4. **Gold Accents**: Keep gold/accent colors consistent for Islamic decorative elements

---

## Notes

- All themes maintain the gold accent for Islamic decorative elements (verse markers, borders)
- Prayer time highlighting uses theme's primary color instead of hardcoded emerald
- Themes are designed to feel cohesive with Islamic aesthetic (no harsh/neon colors)
- Each theme has both light and dark variants for user preference
