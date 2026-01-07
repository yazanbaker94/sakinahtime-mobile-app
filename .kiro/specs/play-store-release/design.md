# Design Document: Play Store Release Readiness

## Overview

This document outlines the technical approach for preparing SakinahTime for Google Play Store release. The focus is on code cleanup, error handling, configuration verification, and ensuring all Play Store requirements are met.

## Architecture

The release preparation involves auditing and updating several layers:

```
┌─────────────────────────────────────────────────────────┐
│                    Play Store Assets                     │
│         (Screenshots, Descriptions, Graphics)            │
├─────────────────────────────────────────────────────────┤
│                   App Configuration                      │
│            (app.json, eas.json, permissions)            │
├─────────────────────────────────────────────────────────┤
│                    Error Handling                        │
│              (Error Boundaries, Fallbacks)              │
├─────────────────────────────────────────────────────────┤
│                    Code Quality                          │
│        (Console cleanup, Dead code, Security)           │
├─────────────────────────────────────────────────────────┤
│                      Testing                             │
│            (Unit tests, Property tests, Build)          │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Code Cleanup Utilities

Scripts and patterns for identifying and removing:
- Console statements (`console.log`, `console.warn`, `console.error`)
- Unused imports
- Unused variables and functions
- Large commented code blocks
- TODO/FIXME comments indicating incomplete work

### 2. Error Boundary Component

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
```

A reusable error boundary that:
- Catches JavaScript errors in child components
- Displays a user-friendly fallback UI
- Optionally logs errors for debugging
- Provides a "Try Again" action

### 3. App Configuration

Current configuration in `app.json`:
- **Name**: SakinahTime ✓
- **Package**: com.sakinahtime.app ✓
- **Version**: 1.0.0 ✓
- **Icon**: ./assets/images/icon.png ✓
- **Splash**: Configured ✓
- **Permissions**: Declared ✓

Items to verify/update:
- Adaptive icon background color
- Splash screen for dark mode
- Permission justifications in Play Console

### 4. Security Audit Checklist

Files to scan for sensitive data:
- All `.ts`, `.tsx`, `.js` files
- Configuration files
- Environment files (should be in `.gitignore`)

Patterns to detect:
- API keys (strings matching key patterns)
- Hardcoded URLs with credentials
- Test user data
- Personal information

## Data Models

### Play Store Listing Data

```typescript
interface PlayStoreListing {
  // Required
  appName: string;              // "SakinahTime"
  shortDescription: string;     // Max 80 chars
  fullDescription: string;      // Max 4000 chars
  category: string;             // "Lifestyle" or "Books & Reference"
  contentRating: string;        // Based on questionnaire
  privacyPolicyUrl: string;
  
  // Graphics
  featureGraphic: string;       // 1024x500 PNG/JPG
  icon: string;                 // 512x512 PNG
  screenshots: string[];        // Min 4, phone screenshots
  
  // Optional
  promoVideo?: string;          // YouTube URL
  tabletScreenshots?: string[];
}
```

### Release Checklist Data

```typescript
interface ReleaseChecklist {
  codeCleanup: {
    consoleStatements: boolean;
    unusedImports: boolean;
    unusedVariables: boolean;
    commentedCode: boolean;
    todoComments: boolean;
  };
  errorHandling: {
    errorBoundaries: boolean;
    networkErrorHandling: boolean;
    locationFallbacks: boolean;
  };
  configuration: {
    appName: boolean;
    packageName: boolean;
    version: boolean;
    icons: boolean;
    splash: boolean;
    permissions: boolean;
  };
  security: {
    noHardcodedSecrets: boolean;
    noTestCredentials: boolean;
    noPersonalData: boolean;
  };
  testing: {
    unitTestsPassing: boolean;
    propertyTestsPassing: boolean;
    buildSuccessful: boolean;
  };
  playStoreAssets: {
    featureGraphic: boolean;
    screenshots: boolean;
    descriptions: boolean;
    privacyPolicy: boolean;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do.*

Since this is primarily an audit/cleanup task rather than new feature development, the correctness properties focus on verification:

### Property 1: Console Statement Removal
*For any* TypeScript/JavaScript file in the client directory, the file SHALL NOT contain `console.log`, `console.warn`, or `console.error` statements (except in designated error handling utilities).
**Validates: Requirements 1.1**

### Property 2: Import Cleanliness
*For any* source file, all imported modules/components SHALL be used within that file.
**Validates: Requirements 1.2**

### Property 3: Error Boundary Coverage
*For any* screen component, there SHALL exist an error boundary that catches and handles errors gracefully.
**Validates: Requirements 2.1, 2.4**

### Property 4: No Hardcoded Secrets
*For any* source file, the file SHALL NOT contain strings matching API key patterns or hardcoded credentials.
**Validates: Requirements 4.1, 4.2**

## Error Handling

### Error Boundary Strategy

Wrap major screen components with error boundaries:

```
App
├── ErrorBoundary (App-level)
│   ├── TabNavigator
│   │   ├── ErrorBoundary (PrayerTimes)
│   │   ├── ErrorBoundary (Mushaf)
│   │   ├── ErrorBoundary (Azkar)
│   │   └── ErrorBoundary (Settings)
│   └── StackScreens
│       ├── ErrorBoundary (each modal/detail screen)
```

### Network Error Handling

All API/network calls should:
1. Show loading state
2. Handle timeout gracefully
3. Display user-friendly error message on failure
4. Provide retry option where appropriate

### Location Error Handling

Already implemented with manual location fallback. Verify:
1. GPS permission denied → Suggest manual location
2. GPS timeout → Show error with manual option
3. Geocoding failure → Continue with coordinates only

## Testing Strategy

### Automated Testing

1. **Unit Tests**: Run existing test suite
   ```bash
   npm test
   ```

2. **Property Tests**: Run property-based tests
   ```bash
   npm test -- --run
   ```

3. **Type Checking**: Verify no TypeScript errors
   ```bash
   npm run check:types
   ```

4. **Linting**: Check for code quality issues
   ```bash
   npm run lint
   ```

### Manual Testing Checklist

1. **Fresh Install Flow**
   - App launches without crash
   - Permissions requested appropriately
   - Onboarding (if any) works correctly

2. **Core Features**
   - Prayer times display correctly
   - Qibla compass works
   - Quran reading functions
   - Azkar/Duas accessible
   - Settings persist

3. **Edge Cases**
   - No internet connection
   - Location permission denied
   - Low memory conditions
   - Screen rotation (if supported)

### Build Verification

```bash
# Development build test
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production
```

## Implementation Notes

### Console Statement Cleanup

Use ESLint rule or grep to find:
```bash
grep -r "console\." --include="*.ts" --include="*.tsx" client/
```

Exceptions allowed:
- Error logging in catch blocks (consider replacing with error reporting service)
- Development-only debug utilities (wrapped in `__DEV__` check)

### Dead Code Detection

Use TypeScript compiler and ESLint:
- `@typescript-eslint/no-unused-vars`
- `@typescript-eslint/no-unused-imports`

### Security Scanning

Patterns to search for:
- `apiKey`, `api_key`, `API_KEY`
- `secret`, `SECRET`
- `password`, `PASSWORD`
- `token` (outside of proper auth flows)
- Hardcoded URLs with credentials

### Play Store Asset Preparation

1. **Screenshots**: Capture on clean device/emulator
   - Prayer Times screen
   - Quran reading screen
   - Qibla compass
   - Azkar/Duas
   - Settings/themes

2. **Feature Graphic**: Design 1024x500 banner
   - App name
   - Key visual (mosque, Quran, etc.)
   - Tagline

3. **Descriptions**:
   - Short: Focus on primary value prop
   - Full: List all features, benefits
