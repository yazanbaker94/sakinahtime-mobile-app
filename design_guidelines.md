# Islamic Prayer Companion - Design Guidelines

## Authentication & User Profile
**No authentication required** - This is a utility app focused on personal Islamic practice.

**Profile/Settings Screen:**
- Display name field (defaults to "User")
- User avatar selection: Generate 3 Islamic-themed preset avatars (geometric Islamic patterns in circular frames - no human/animal imagery per Islamic principles)
- Preferences:
  - Prayer calculation method selector (e.g., Muslim World League, ISNA, Egyptian)
  - Notification settings for prayer times
  - Theme preference (Light/Dark)
  - Language (Arabic/English bilingual support)

## Navigation Architecture
**Root Navigation: Tab Bar (4 tabs)**
- **Qibla** - Compass icon pointing to Kaaba direction
- **Prayer Times** - Clock icon with prayer beads
- **Quran** - Book/mushaf icon
- **Azkar** - Beads/tasbih icon

Bottom tab bar styling:
- Active state: Emerald green (#059669) with subtle glow
- Inactive state: Muted gray (#6B7280)
- Arabic labels should be displayed alongside English when space permits

## Screen Specifications

### 1. Qibla Direction Screen
**Purpose:** Show real-time compass pointing to Mecca/Kaaba direction

**Layout:**
- Header: Transparent, title "Qibla Direction" / "القبلة", no buttons
- Main content: Fixed layout (not scrollable)
  - Top safe area inset: headerHeight + Spacing.xl
  - Bottom safe area inset: tabBarHeight + Spacing.xl
- Floating elements: None

**Components:**
- Circular compass visualization (300-350pt diameter) centered on screen
- Animated compass needle pointing to Qibla
- Degree indicator showing exact bearing (e.g., "45° NE")
- Distance to Mecca in km displayed below compass
- Small Kaaba icon at the Qibla direction on compass edge
- Location accuracy indicator (requires GPS permission)
- Subtle Islamic geometric pattern as background watermark

**Visual feedback:**
- Compass rotates smoothly with device orientation
- Needle has subtle green glow when aligned with Qibla (within ±5°)

### 2. Prayer Times Screen
**Purpose:** Display today's prayer times based on GPS location

**Layout:**
- Header: Transparent, title "Prayer Times" / "أوقات الصلاة", right button: Settings (calculation method)
- Main content: Scrollable
  - Top safe area inset: headerHeight + Spacing.xl
  - Bottom safe area inset: tabBarHeight + Spacing.xl

**Components:**
- Location badge at top showing current city
- Current date (Hijri + Gregorian)
- Next prayer countdown card (prominent, elevated)
  - Prayer name
  - Countdown timer
  - Time remaining
- Prayer times list (5 cards):
  - Fajr (Dawn)
  - Dhuhr (Noon)
  - Asr (Afternoon)
  - Maghrib (Sunset)
  - Isha (Night)
- Each card shows: Prayer name (Arabic + English), exact time
- Past prayers have muted appearance
- Current/next prayer highlighted in emerald green

### 3. Quran Reader Screen
**Purpose:** Read Quran with authentic Mushaf-style presentation

**Layout:**
- Header: Custom, transparent, search icon (right), surah selector (center), bookmark icon (left)
- Main content: Paginated horizontal scroll (Mushaf pages)
  - Top safe area inset: headerHeight + Spacing.xl
  - Bottom safe area inset: tabBarHeight + Spacing.xl

**Components:**
- Surah list modal (accessed via header center button):
  - Scrollable list of all 114 surahs
  - Each item: Surah number, Arabic name, English name, verse count, revelation type (Makki/Madani)
- Mushaf page view:
  - Authentic Quran page layout (Uthmani/Madina Mushaf style)
  - Arabic text using traditional Mushaf typography
  - Verse markers (circular, gold-bordered)
  - Page number at bottom center
  - Decorative Surah headers with bismillah
- Bottom navigation: Previous/Next page buttons (subtle, fade in on tap)
- Bookmark indicator for saved pages

**Typography:**
- Use specialized Arabic Quran font (KFGQPC Uthmani Script or similar)
- Respectful sizing: 16-18pt minimum for readability
- Proper Tajweed rules coloring (optional toggle in settings)

### 4. Azkar Screen
**Purpose:** Access and read daily supplications and dhikr

**Layout:**
- Header: Default navigation, title "Azkar" / "الأذكار", search icon (right)
- Main content: Scrollable list
  - Top safe area inset: Spacing.xl (default header is not transparent)
  - Bottom safe area inset: tabBarHeight + Spacing.xl

**Components:**
- Category cards (grid or list):
  - Morning Azkar (أذكار الصباح)
  - Evening Azkar (أذكار المساء)
  - After Prayer Azkar
  - Sleep Azkar
  - Waking Up Azkar
  - Other Categories
- Each category card shows:
  - Icon (prayer beads, sun, moon, etc.)
  - Title in Arabic & English
  - Number of supplications in category
- Tapping opens Azkar Detail Screen (modal stack)

**Azkar Detail Screen (Modal):**
- Header: Close button (left), category title (center), progress indicator (right)
- Scrollable cards for each dhikr:
  - Arabic text (large, clear)
  - English transliteration
  - English translation
  - Repetition counter (interactive tasbih) if applicable
  - Source reference (Sahih Bukhari, etc.)
- Swipe between azkar or vertical scroll

## Design System

### Color Palette
**Primary:**
- Emerald Green: #059669 (main brand color, Islamic significance)
- Gold Accent: #D4AF37 (for decorative elements, borders)

**Neutral:**
- Background Light: #F9FAFB
- Background Dark: #111827
- Surface: #FFFFFF
- Text Primary: #1F2937
- Text Secondary: #6B7280

**Semantic:**
- Success/Active Prayer: #10B981
- Muted/Past Prayer: #9CA3AF

### Typography
**Arabic Text:**
- Quranic text: Traditional Mushaf font (Uthmani)
- UI Arabic: SF Arabic (iOS) / Noto Naskh Arabic (Android)
- Sizes: 18-24pt for religious text, 14-16pt for UI

**English Text:**
- Headings: SF Pro Display / Roboto Medium
- Body: SF Pro Text / Roboto Regular
- Sizes: 28pt (H1), 20pt (H2), 16pt (body), 14pt (caption)

### Visual Design
**Icons:**
- Use Feather icons for navigation and actions
- Custom Islamic geometric icon set for feature-specific elements (prayer beads, Kaaba, crescent moon)

**Touchable Feedback:**
- Cards: Scale to 0.98 on press, slight opacity change
- Buttons: Opacity 0.7 on press
- Tab bar items: Scale + color change

**Shadows (for floating elements only):**
- Prayer time cards: shadowOffset {0, 2}, opacity 0.10, radius 2
- Floating action buttons: shadowOffset {0, 2}, opacity 0.10, radius 2

### Required Assets
**Generate these custom assets:**
1. **3 User Avatars:** Geometric Islamic patterns (arabesque, tessellation, star patterns) in circular frames with emerald/gold color scheme
2. **Kaaba Icon:** Simplified, respectful illustration for Qibla compass
3. **Decorative Bismillah:** Calligraphic "بسم الله الرحمن الرحيم" for Quran section headers
4. **Prayer Time Icons:** 5 simple icons representing each prayer (dawn, noon, afternoon, sunset, night)

**Do NOT generate:**
- Quran page images (will use API/font rendering)
- Background patterns (use CSS/native code for Islamic geometric patterns)
- Standard UI icons (use Feather icon set)

### Accessibility
- Minimum tap target: 44x44pt
- High contrast mode support for text readability
- VoiceOver/TalkBack support for all interactive elements
- Arabic right-to-left (RTL) layout support throughout
- Large text size accessibility options for Quran and Azkar
- Location permission clear explanation before request

### Special Considerations
- Respect Islamic design principles: no human/animal imagery
- Ensure Quranic text is never distorted or incorrectly displayed
- Provide offline access to core features (cache prayer times, Quran pages)
- Accurate Qibla calculation using device compass + GPS
- Handle prayer time calculation method preferences
- Beautiful transitions that feel reverent, not gimmicky