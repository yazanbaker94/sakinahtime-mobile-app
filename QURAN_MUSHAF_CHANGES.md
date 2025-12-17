# Quran Screen to Mushaf Transformation

## Summary
The Quran tab now displays the Mushaf (Quran pages as images) instead of text-based verses. Users can select a surah from a list and navigate directly to the correct page.

## Changes Made

### 1. Created Surah-to-Page Mapping
**File:** `client/data/surah-pages.ts`
- Maps each of the 114 surahs to their starting page number in the Mushaf
- Enables quick navigation to any surah

### 2. Updated MushafScreen
**File:** `client/screens/MushafScreen.tsx`
- Added import for `surah-pages` mapping
- Updated `goToSurah()` function to use the page mapping for accurate navigation
- Already had surah selection UI with list of all surahs

### 3. Navigation Already Configured
**File:** `client/navigation/MainTabNavigator.tsx`
- The QuranTab already uses MushafScreen component
- No changes needed

## Features
✅ Display Mushaf pages as images
✅ Tap verses to see tafsir (commentary)
✅ Select any surah from a list
✅ Navigate directly to the surah's starting page
✅ Swipe between pages (right-to-left, traditional Quran reading direction)
✅ Toggle between Arabic and English tafsir

## User Experience
1. User opens Quran tab → sees Mushaf page
2. User taps the list icon (top right) → sees list of all 114 surahs
3. User selects a surah → automatically navigates to that surah's page
4. User can swipe to read through pages
5. User can tap on verses to see tafsir/translation

## Technical Details
- Uses FlatList with horizontal pagination for smooth page transitions
- Inverted list to maintain right-to-left reading direction
- Coordinate-based verse detection for tap interactions
- Lazy loading of pages for performance
