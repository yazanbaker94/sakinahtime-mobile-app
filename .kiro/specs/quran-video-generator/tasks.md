# Implementation Plan: Quran Video Generator

## Overview

This implementation plan breaks down the Quran Video Generator feature into discrete coding tasks. We'll use ffmpeg-kit-react-native for video processing, react-native-canvas for text rendering, and expo-file-system for file management.

## Tasks

- [x] 1. Set up FFmpeg-kit and dependencies
  - Install ffmpeg-kit-react-native package
  - Configure Expo plugin for native module linking
  - Add required permissions to app.json (storage, media library)
  - Verify FFmpeg works with a simple test command
  - _Requirements: 5.1, 7.4_

- [x] 2. Create CacheService
  - [x] 2.1 Implement cache directory management
    - Create getCacheDir() using expo-file-system
    - Implement exists(), get(), set() methods
    - Add clearAll() for cache cleanup
    - _Requirements: 3.4, 10.4_
  
  - [x] 2.2 Write property test for cache round-trip
    - **Property 4: Audio Caching Round-Trip**
    - **Validates: Requirements 3.4**

- [x] 3. Create AudioService
  - [x] 3.1 Implement audio URL construction
    - Create reciter directory mapping
    - Build URL with padded surah/ayah numbers
    - _Requirements: 3.2_
  
  - [x] 3.2 Write property test for URL construction
    - **Property 3: Audio URL Construction**
    - **Validates: Requirements 3.2**
  
  - [x] 3.3 Implement audio download with caching
    - Download from everyayah.com
    - Save to cache using CacheService
    - Return cached version if available
    - _Requirements: 3.2, 3.4_
  
  - [x] 3.4 Implement audio duration detection
    - Use FFmpeg probe to get duration
    - _Requirements: 5.4_
  
  - [x] 3.5 Implement audio concatenation
    - Concatenate multiple verse audio files
    - Use FFmpeg concat filter
    - _Requirements: 5.4_

- [x] 4. Create TextRenderService
  - [x] 4.1 Implement text wrapping algorithm
    - Split text by words (handle Arabic RTL)
    - Calculate line widths using measureText
    - Wrap to multiple lines when exceeding maxWidth
    - _Requirements: 6.2_
  
  - [x] 4.2 Write property test for text wrapping
    - **Property 7: Text Wrapping**
    - **Validates: Requirements 6.2**
  
  - [x] 4.3 Implement font size optimization
    - Start with base font size
    - Reduce until text fits within bounds
    - Return optimal size and wrapped lines
    - _Requirements: 6.3_
  
  - [x] 4.4 Write property test for font size optimization
    - **Property 8: Font Size Optimization**
    - **Validates: Requirements 6.3**
  
  - [x] 4.5 Implement text layout calculation
    - Calculate Arabic text position (centered)
    - Calculate translation position (below Arabic)
    - Calculate overlay background bounds
    - _Requirements: 5.2, 5.3, 6.4_
  
  - [x] 4.6 Write property test for text positioning
    - **Property 5: Text Positioning**
    - **Validates: Requirements 5.2, 5.3**
  
  - [x] 4.7 Implement text overlay image generation
    - Create canvas with video dimensions
    - Draw semi-transparent background
    - Draw Arabic text with Quranic font
    - Draw translation text
    - Export as PNG
    - _Requirements: 6.1, 6.4, 6.5_

- [x] 5. Checkpoint - Core services complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create VideoGeneratorService
  - [x] 6.1 Implement video dimension calculations
    - Map orientation to aspect ratio
    - Map resolution to pixel dimensions
    - _Requirements: 2.5, 7.1, 7.2_
  
  - [x] 6.2 Write property test for resolution output
    - **Property 9: Resolution Output**
    - **Validates: Requirements 7.3**
  
  - [x] 6.3 Write property test for orientation scaling
    - **Property 10: Orientation Scaling**
    - **Validates: Requirements 2.5**
  
  - [x] 6.4 Implement FFmpeg command builder
    - Build complex filter for video scaling
    - Add text overlay inputs
    - Add audio input
    - Configure H.264 encoding
    - _Requirements: 5.1, 7.4_
  
  - [x] 6.5 Implement video generation orchestration
    - Download audio via AudioService
    - Generate text overlay via TextRenderService
    - Execute FFmpeg command
    - Track progress and report via callback
    - _Requirements: 5.1, 5.6_
  
  - [x] 6.6 Write property test for video duration sync
    - **Property 6: Video Duration Sync**
    - **Validates: Requirements 5.4**
  
  - [x] 6.7 Implement cancellation support
    - Cancel FFmpeg execution
    - Clean up partial files
    - _Requirements: 9.5_
  
  - [x] 6.8 Implement cleanup and error handling
    - Delete temporary files on completion/error
    - Parse FFmpeg errors for user messages
    - _Requirements: 10.3, 10.4_
  
  - [x] 6.9 Write property test for cleanup after error
    - **Property 12: Cleanup After Error**
    - **Validates: Requirements 10.4**

- [x] 7. Checkpoint - Video generation working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Create UI Components
  - [x] 8.1 Create VerseSelector component
    - Surah dropdown with all 114 surahs
    - Ayah start picker
    - Ayah end picker (optional, max +1 from start)
    - Arabic text preview
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 8.2 Write property test for verse range validation
    - **Property 1: Verse Range Validation**
    - **Validates: Requirements 1.4**
  
  - [x] 8.3 Write property test for verse data integrity
    - **Property 2: Verse Data Integrity**
    - **Validates: Requirements 1.1, 1.2, 1.5**
  
  - [x] 8.4 Create BackgroundPicker component
    - Grid of video thumbnails
    - Selection indicator
    - Orientation filter
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 8.5 Create ReciterPicker component
    - List of reciters with Arabic/English names
    - Selection state
    - _Requirements: 3.1_
  
  - [x] 8.6 Create TranslationPicker component
    - Translations grouped by language
    - Optional selection (can be none)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 8.7 Create ProgressIndicator component
    - Circular progress with percentage
    - Current step text
    - Estimated time remaining
    - Cancel button
    - _Requirements: 5.6, 9.4, 9.5_

- [x] 9. Create VideoGeneratorScreen
  - [x] 9.1 Build main screen layout
    - VerseSelector at top
    - BackgroundPicker
    - ReciterPicker
    - TranslationPicker
    - Resolution/Orientation options
    - Generate button
    - _Requirements: 1-4, 7.1, 7.2_
  
  - [x] 9.2 Implement generation flow
    - Validate inputs
    - Show ProgressIndicator modal
    - Call VideoGeneratorService
    - Handle success/error
    - _Requirements: 5.1, 5.6, 5.8_
  
  - [x] 9.3 Implement completion screen
    - Video preview
    - File size display
    - Share button
    - Save to gallery button
    - Generate another button
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [x] 9.4 Write property test for file size calculation
    - **Property 13: File Size Calculation**
    - **Validates: Requirements 8.4**

- [x] 10. Integrate with MushafScreen
  - [x] 10.1 Add "Generate Video" to verse action menu
    - Add menu item with video icon
    - Pass verse data to navigation params
    - _Requirements: 11.1, 11.2_
  
  - [x] 10.2 Implement auto-population in VideoGeneratorScreen
    - Read navigation params
    - Pre-fill surah and ayah fields
    - Allow user modification
    - _Requirements: 11.3, 11.4, 11.5_
  
  - [x] 10.3 Write property test for auto-population
    - **Property 11: Auto-Population from Mushaf**
    - **Validates: Requirements 11.3, 11.4**

- [x] 11. Add navigation and tab
  - Add VideoGeneratorScreen to navigation
  - Add tab icon or menu entry
  - Configure deep linking for verse params
  - _Requirements: 11.2_

- [ ] 12. Bundle background videos
  - Add 5+ background video files to assets
  - Create thumbnails for each
  - Configure asset bundling in app.json
  - _Requirements: 2.2_

- [ ] 13. Bundle Arabic fonts
  - Add Uthmanic Hafs font to assets
  - Configure font loading in app
  - _Requirements: 6.1_

- [ ] 14. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Test on iOS and Android devices
  - Verify performance meets requirements

## Notes

- All property-based tests are required for comprehensive coverage
- FFmpeg-kit adds ~40-50MB to app size
- Background videos should be optimized for mobile (720p, compressed)
- Consider lazy-loading translations to reduce initial bundle size
- Test on both iOS and Android as FFmpeg behavior may differ slightly
