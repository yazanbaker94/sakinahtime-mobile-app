# Requirements: Audio Download Manager Edge Case Fixes

## Overview
Fix edge cases in the audio download manager where pause/resume and cancel operations don't work correctly, causing inconsistent UI state and download behavior.

## User-Reported Issues

### Issue 1: Pause/Resume Not Working
**User Story:** As a user, I want to pause a download and resume it later without having to cancel and restart.

**Current Behavior:**
- Clicking pause works (download pauses)
- Clicking play on the surah to resume puts it in "queued" state instead of resuming
- Have to cancel all and re-download

**Expected Behavior:**
- Pause should stop the current download
- Resume should continue from where it left off (or at least restart that surah)
- Should not require cancelling all downloads

### Issue 2: Cancel (X) Button Not Working Properly
**User Story:** As a user, I want to cancel a single download and have it actually stop.

**Current Behavior:**
- Clicking X shows the surah as "stopped" in the list
- But the download box keeps downloading
- Pressing X again closes the box, then it reappears
- Clicking pause after X doesn't do anything
- Only "Cancel All" works properly

**Expected Behavior:**
- Clicking X should immediately stop the download
- The download progress box should disappear
- The surah should show as "not downloaded" in the list
- No ghost downloads should continue in background

### Issue 3: UI State Out of Sync
**User Story:** As a user, I want the UI to accurately reflect the actual download state.

**Current Behavior:**
- UI shows different state than actual download process
- Download continues even when UI shows cancelled/stopped

**Expected Behavior:**
- UI state should always match actual download state
- When cancelled, download should actually stop
- Progress box should only show for active downloads

## Root Cause Analysis

### Problem Areas Identified:

1. **pauseDownload()** - Only changes status to 'paused' but doesn't stop the actual download loop
2. **cancelDownload()** - Removes from queue but doesn't stop active download in processDownloadItem()
3. **processDownloadItem()** - Only checks `shouldStopProcessing` flag which is set by cancelAllDownloads()
4. **No per-item cancellation flag** - Individual cancel doesn't interrupt the download loop
5. **Resume logic** - Sets status to 'pending' but download may already be in progress

## Technical Requirements

### TR-1: Per-Item Download Control
- Each download item needs its own cancellation/pause flag
- The download loop must check this flag between ayah downloads
- Pausing should set a flag that stops the loop for that item only

### TR-2: Proper State Synchronization
- UI state must be derived from actual download state
- When status changes, notify listeners immediately
- Ensure queue is saved after every state change

### TR-3: Resume Functionality
- Track which ayahs have been downloaded for partial downloads
- Resume should continue from last downloaded ayah
- Don't re-download already downloaded ayahs

### TR-4: Cancel Functionality
- Cancel should immediately stop the download loop
- Remove partial files (already implemented)
- Update UI state synchronously

## Acceptance Criteria

### AC-1: Pause Works Correctly
- [ ] Clicking pause stops the download immediately
- [ ] Progress bar stops updating
- [ ] Status shows "Paused"
- [ ] No background download continues

### AC-2: Resume Works Correctly
- [ ] Clicking play/resume on paused item resumes download
- [ ] Download continues from where it left off (or restarts cleanly)
- [ ] Status changes to "Downloading"
- [ ] Progress updates correctly

### AC-3: Cancel Works Correctly
- [ ] Clicking X stops the download immediately
- [ ] Download progress box disappears
- [ ] Surah shows as "not downloaded" in list
- [ ] Partial files are cleaned up
- [ ] No ghost downloads continue

### AC-4: UI State Accuracy
- [ ] UI always reflects actual download state
- [ ] No phantom progress boxes
- [ ] Queue count is accurate
- [ ] Status icons match actual state

## Files to Modify

1. `client/services/AudioDownloadService.ts` - Core download logic
2. `client/hooks/useAudioDownload.ts` - State management hook
3. `client/components/DownloadProgress.tsx` - Progress UI (if needed)
4. `client/components/SurahDownloadItem.tsx` - List item UI (if needed)
5. `client/screens/AudioDownloadScreen.tsx` - Screen logic (if needed)
