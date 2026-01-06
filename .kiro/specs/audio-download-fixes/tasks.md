`1 # Tasks: Audio Download Manager Edge Case Fixes

## Task 1: Add Per-Item Control Flags to Service
- [x] Add `cancelledItems: Set<string>` to track cancelled downloads
- [x] Add `pausedItems: Set<string>` to track paused downloads
- [x] Add `lastDownloadedAyah?: number` to DownloadItem type for resume tracking

**File:** `client/services/AudioDownloadService.ts`, `client/types/offline.ts`

---

## Task 2: Fix processDownloadItem() Loop
- [x] Check `cancelledItems.has(item.id)` at start of each ayah loop
- [x] Check `pausedItems.has(item.id)` at start of each ayah loop
- [x] If cancelled: clean up and return immediately (don't save as pending)
- [x] If paused: save progress with `lastDownloadedAyah`, set status to 'paused', return
- [x] Remove item from sets after handling

**File:** `client/services/AudioDownloadService.ts`

---

## Task 3: Fix pauseDownload() Method
- [x] Add item.id to `pausedItems` Set
- [x] If item is 'pending', update status immediately
- [x] If item is 'downloading', let the loop handle the pause
- [x] Save queue and notify listeners

**File:** `client/services/AudioDownloadService.ts`

---

## Task 4: Fix resumeDownload() Method
- [x] Remove item.id from `pausedItems` Set
- [x] Set status to 'pending'
- [x] Save queue and notify listeners
- [x] Call `processQueue()` to restart processing
- [x] Handle resume from `lastDownloadedAyah` if available

**File:** `client/services/AudioDownloadService.ts`

---

## Task 5: Fix cancelDownload() Method
- [x] Add item.id to `cancelledItems` Set
- [x] Add small delay (150ms) for download loop to notice
- [x] Clean up partial files (already implemented)
- [x] Remove from queue
- [x] Remove from `cancelledItems` Set
- [x] Notify listeners with updated state

**File:** `client/services/AudioDownloadService.ts`

---

## Task 6: Update useAudioDownload Hook
- [x] Fix `currentDownload` state to only show actually downloading items
- [x] Clear `currentDownload` when item is paused/cancelled
- [x] Ensure queue state syncs properly after pause/resume/cancel

**File:** `client/hooks/useAudioDownload.ts`

---

## Task 7: Test All Edge Cases
- [ ] Test: Pause during download → download stops
- [ ] Test: Resume after pause → download continues
- [ ] Test: Cancel during download → download stops, UI clears
- [ ] Test: Cancel then re-download → fresh download works
- [ ] Test: Multiple downloads, cancel one → others continue
- [ ] Test: Pause active, resume → works correctly

---

## Implementation Complete ✅

All code changes have been implemented. The remaining items are manual testing tasks.

### Changes Made:

1. **client/types/offline.ts**
   - Added `lastDownloadedAyah?: number` to DownloadItem for resume tracking

2. **client/services/AudioDownloadService.ts**
   - Added `cancelledItems: Set<string>` and `pausedItems: Set<string>` for per-item control
   - Updated `processDownloadItem()` to check these sets between each ayah download
   - Fixed `pauseDownload()` to add to pausedItems set (signals loop to stop)
   - Fixed `resumeDownload()` to remove from pausedItems and restart queue
   - Fixed `cancelDownload()` to add to cancelledItems, wait for loop to notice, then clean up

3. **client/hooks/useAudioDownload.ts**
   - Fixed progress listener to only set currentDownload when status is 'downloading'
   - Fixed cancelDownload callback to immediately update local state

### How It Works Now:

- **Pause**: Adds item to `pausedItems` set → download loop checks this set between ayahs → loop stops and saves progress
- **Resume**: Removes from `pausedItems` → sets status to 'pending' → restarts queue processing → continues from `lastDownloadedAyah`
- **Cancel**: Adds item to `cancelledItems` → waits 150ms for loop to notice → cleans up files → removes from queue
