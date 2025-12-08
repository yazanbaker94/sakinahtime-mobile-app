# Islamic Prayer Companion

A beautiful Islamic mobile app built with Expo and React Native, featuring Qibla direction finder, prayer times, Quran reader, and daily Azkar.

## Overview

This app provides essential tools for Muslim daily practice:
- **Qibla Direction**: Compass-based Qibla finder using device magnetometer and GPS
- **Prayer Times**: Accurate prayer times based on user location via Aladhan API
- **Quran Reader**: Beautiful Mushaf-style Quran reading experience
- **Azkar**: Daily supplications organized by category with counter functionality

## Tech Stack

- **Frontend**: React Native with Expo SDK 54
- **Navigation**: React Navigation 7 with bottom tabs
- **State Management**: TanStack React Query for API data
- **Styling**: StyleSheet with Islamic-themed design system
- **APIs**: Aladhan API for prayer times calculation

## Project Structure

```
client/
├── components/          # Reusable UI components
│   ├── Card.tsx         # Elevated card with press animation
│   ├── ThemedText.tsx   # Themed text with Arabic support
│   ├── ThemedView.tsx   # Themed view with background colors
│   └── ErrorBoundary.tsx # Error handling wrapper
├── constants/
│   └── theme.ts         # Colors, spacing, typography tokens
├── data/
│   ├── azkar.ts         # Azkar categories and dhikr data
│   └── quran.ts         # Surah metadata and Al-Fatihah verses
├── hooks/
│   ├── useLocation.ts   # GPS location with permissions
│   ├── useCompass.ts    # Magnetometer for Qibla direction
│   └── usePrayerTimes.ts # Prayer times API integration
├── navigation/
│   ├── RootStackNavigator.tsx
│   └── MainTabNavigator.tsx
├── screens/
│   ├── QiblaScreen.tsx      # Compass with Qibla direction
│   ├── PrayerTimesScreen.tsx # Prayer times display
│   ├── QuranScreen.tsx      # Quran reader
│   ├── AzkarScreen.tsx      # Azkar categories
│   └── AzkarDetailScreen.tsx # Dhikr detail with counter
└── App.tsx              # App entry with providers
```

## Design System

### Colors
- Primary: Emerald Green (#059669)
- Gold Accent: #D4AF37
- Background: Light (#F9FAFB) / Dark (#111827)

### Typography
- Arabic text support with RTL layout
- Quran-specific styling for verse display
- System fonts for UI elements

## Features

### Qibla Direction
- Real-time compass using device magnetometer
- Calculates bearing to Kaaba from current location
- Visual feedback when aligned with Qibla
- Distance to Mecca display

### Prayer Times
- Uses Aladhan API for accurate prayer times
- Shows Hijri and Gregorian dates
- Next prayer countdown timer
- Highlights current/upcoming prayer

### Quran Reader
- Surah selector with metadata
- Al-Fatihah verses with translations
- Beautiful Bismillah header
- Arabic text with proper styling

### Azkar
- Categories: Morning, Evening, After Prayer, Sleep, Waking, General
- Interactive tasbih counter with haptic feedback
- Progress tracking per dhikr
- Source references (Bukhari, Muslim, etc.)

## Development

The app uses:
- Port 8081 for Expo development server
- Port 5000 for Express backend

Start development with the "Start dev servers" workflow which runs:
```bash
npm run all:dev
```

## Recent Changes

- December 2024: Initial MVP implementation
  - 4-tab navigation (Qibla, Prayer, Quran, Azkar)
  - Location permissions handling
  - Prayer times API integration
  - Azkar with counter functionality
  - Islamic-themed design system
