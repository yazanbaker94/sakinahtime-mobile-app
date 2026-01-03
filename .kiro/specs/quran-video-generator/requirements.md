# Requirements Document

## Introduction

This feature enables users to generate short Quran verse videos directly on their mobile device (iOS/Android) without requiring a server. Users can select 1-2 verses, choose a background video, reciter, and translation, then generate a shareable video with Arabic text overlay, translation, and audio recitation.

## Glossary

- **Video_Generator**: The core service that orchestrates video creation using FFmpeg
- **Verse_Selector**: UI component for selecting surah and ayah range
- **Background_Picker**: UI component for selecting pre-bundled background videos
- **Reciter_Picker**: UI component for selecting the Quran reciter
- **Translation_Picker**: UI component for selecting translation language
- **Text_Overlay**: The Arabic verse text and translation rendered on the video
- **FFmpeg_Kit**: The native FFmpeg library for React Native (ffmpeg-kit-react-native)
- **Progress_Indicator**: UI showing video generation progress

## Requirements

### Requirement 1: Verse Selection

**User Story:** As a user, I want to select Quran verses to include in my video, so that I can create content for specific ayahs.

#### Acceptance Criteria

1. WHEN a user opens the video generator, THE Verse_Selector SHALL display a list of all 114 surahs
2. WHEN a user selects a surah, THE Verse_Selector SHALL display available ayahs for that surah
3. WHEN a user selects a starting ayah, THE Verse_Selector SHALL allow selecting an optional ending ayah
4. THE Verse_Selector SHALL limit the verse range to a maximum of 2 verses
5. WHEN verses are selected, THE Video_Generator SHALL display a preview of the Arabic text

### Requirement 2: Background Video Selection

**User Story:** As a user, I want to choose a background video for my Quran video, so that I can customize the visual appearance.

#### Acceptance Criteria

1. THE Background_Picker SHALL display thumbnails of all available background videos
2. THE Video_Generator SHALL include at least 5 pre-bundled background videos in the app
3. WHEN a user selects a background, THE Background_Picker SHALL show a visual indicator of selection
4. THE Background_Picker SHALL support portrait (9:16), landscape (16:9), and square (1:1) orientations
5. WHEN orientation changes, THE Video_Generator SHALL scale the background video appropriately

### Requirement 3: Reciter Selection

**User Story:** As a user, I want to choose a Quran reciter, so that I can hear my preferred recitation style.

#### Acceptance Criteria

1. THE Reciter_Picker SHALL display a list of available reciters with Arabic and English names
2. WHEN a user selects a reciter, THE Video_Generator SHALL download audio from everyayah.com API
3. IF audio download fails, THEN THE Video_Generator SHALL display an error message and allow retry
4. THE Video_Generator SHALL cache downloaded audio files for reuse

### Requirement 4: Translation Selection

**User Story:** As a user, I want to include a translation in my video, so that non-Arabic speakers can understand.

#### Acceptance Criteria

1. THE Translation_Picker SHALL display available translations grouped by language
2. WHEN a translation is selected, THE Text_Overlay SHALL display the translation below the Arabic text
3. THE Video_Generator SHALL support at least English, Urdu, Turkish, French, and Spanish translations
4. WHEN no translation is selected, THE Video_Generator SHALL create video with Arabic text only

### Requirement 5: Video Generation

**User Story:** As a user, I want to generate a video on my device, so that I can create content without internet (after initial audio download).

#### Acceptance Criteria

1. WHEN user taps generate, THE Video_Generator SHALL create a video using FFmpeg_Kit
2. THE Video_Generator SHALL overlay Arabic text centered on the video
3. THE Video_Generator SHALL overlay translation text below the Arabic text
4. THE Video_Generator SHALL sync audio duration with video length
5. THE Video_Generator SHALL add a watermark showing "Made with SakinahTime"
6. THE Progress_Indicator SHALL show percentage completion during generation
7. WHEN generation completes, THE Video_Generator SHALL save the video to device gallery
8. IF generation fails, THEN THE Video_Generator SHALL display error details and allow retry

### Requirement 6: Text Rendering

**User Story:** As a user, I want the Arabic text to be beautifully rendered, so that my videos look professional.

#### Acceptance Criteria

1. THE Text_Overlay SHALL use a Quranic font (Uthmanic script) for Arabic text
2. THE Text_Overlay SHALL automatically wrap long verses to multiple lines
3. THE Text_Overlay SHALL calculate optimal font size based on text length and video dimensions
4. THE Text_Overlay SHALL display a semi-transparent background behind text for readability
5. THE Text_Overlay SHALL support RTL (right-to-left) text direction for Arabic

### Requirement 7: Video Output Options

**User Story:** As a user, I want to customize video output settings, so that I can optimize for different platforms.

#### Acceptance Criteria

1. THE Video_Generator SHALL support 720p and 1080p output resolutions
2. THE Video_Generator SHALL support portrait (9:16 for TikTok/Reels), landscape (16:9), and square (1:1) formats
3. WHEN user selects resolution, THE Video_Generator SHALL encode at that quality
4. THE Video_Generator SHALL output MP4 format with H.264 encoding

### Requirement 8: Sharing

**User Story:** As a user, I want to share my generated video, so that I can post it on social media.

#### Acceptance Criteria

1. WHEN video generation completes, THE Video_Generator SHALL display share options
2. THE Video_Generator SHALL allow sharing to any app that accepts video (WhatsApp, Instagram, etc.)
3. THE Video_Generator SHALL allow saving to device gallery
4. THE Video_Generator SHALL display the video file size before sharing

### Requirement 9: Performance

**User Story:** As a user, I want video generation to be reasonably fast, so that I don't have to wait too long.

#### Acceptance Criteria

1. THE Video_Generator SHALL complete 1-verse video generation within 60 seconds on mid-range devices
2. THE Video_Generator SHALL complete 2-verse video generation within 90 seconds on mid-range devices
3. THE Video_Generator SHALL use hardware encoding when available
4. THE Video_Generator SHALL show estimated time remaining during generation
5. THE Video_Generator SHALL allow cancellation during generation

### Requirement 10: Error Handling

**User Story:** As a user, I want clear error messages when something goes wrong, so that I can understand and fix issues.

#### Acceptance Criteria

1. IF device storage is insufficient, THEN THE Video_Generator SHALL display storage requirement
2. IF audio download fails, THEN THE Video_Generator SHALL offer offline mode with no audio
3. IF FFmpeg encoding fails, THEN THE Video_Generator SHALL log error details for debugging
4. WHEN an error occurs, THE Video_Generator SHALL clean up temporary files

### Requirement 11: Quick Generate from Mushaf Screen

**User Story:** As a user, I want to quickly generate a video from the verse I'm currently viewing in the Mushaf, so that I don't have to manually re-enter verse numbers.

#### Acceptance Criteria

1. WHEN a user taps on a verse in the Mushaf screen, THE system SHALL display a "Generate Video" option in the verse action menu
2. WHEN user selects "Generate Video" from the menu, THE system SHALL navigate to the Video Generator screen
3. THE Video_Generator SHALL auto-populate the surah and ayah fields with the selected verse
4. IF user had selected a verse range (e.g., 10:22-23), THE Video_Generator SHALL auto-populate both start and end ayah
5. THE user SHALL be able to modify the auto-populated values before generating
