# Design: Audio Download Manager Edge Case Fixes

## Current Architecture Issues

```
Current Flow (Broken):
┌─────────────────────────────────────────────────────────────────┐
│  User clicks Pause                                               │
│       ↓                                                          │
│  pauseDownload() sets item.status = 'paused'                    │
│       ↓                                                          │
│  BUT processDownloadItem() keeps running!                        │
│  (only checks shouldStopProcessing which is for cancelAll)      │
│       ↓                                                          │
│  Download continues in background                                │
│  UI shows paused but download is still happening                │
└─────────────────────────────────────────────────────────────────┘
```

## Proposed Solution

### 1. Add Per-Item Cancellation Tracking

```typescript
// Add to AudioDownloadService
private cancelledItems: Set<string> = new Set();
private pausedItems: Set<string> = new Set();
```

### 2. Modify processDownloadItem to Check Item State

```typescript
private async processDownloadItem(item: DownloadItem): Promise<void> {
  // ... existing setup ...

  for (let ayah = 1; ayah <= surahInfo.ayahs; ayah++) {
    // Check BOTH global stop AND per-item cancellation/pause
    if (this.shouldStopProcessing || 
        this.cancelledItems.has(item.id) || 
        this.pausedItems.has(item.id)) {
      
      if (this.cancelledItems.has(item.id)) {
        // Item was cancelled - clean up
        this.cancelledItems.delete(item.id);
        return; // Don't save as pending
      }
      
      if (this.pausedItems.has(item.id)) {
        // Item was paused - save progress
        item.status = 'paused';
        item.lastDownloadedAyah = ayah - 1; // Track progress
        await this.saveQueue();
        this.notifyProgress(item);
        return;
      }
      
      // Global stop
      item.status = 'pending';
      this.notifyProgress(item);
      return;
    }
    
    // ... download ayah ...
  }
}
```

### 3. Fix pauseDownload()

```typescript
async pauseDownload(downloadId: string): Promise<void> {
  const item = this.downloadQueue.find(i => i.id === downloadId);
  if (item) {
    // Add to paused set - this will be checked in download loop
    this.pausedItems.add(downloadId);
    
    // If currently downloading, the loop will handle the pause
    // If pending, just update status
    if (item.status === 'pending') {
      item.status = 'paused';
      await this.saveQueue();
      this.notifyProgress(item);
    }
    // If downloading, the loop will set status to paused when it checks
  }
}
```

### 4. Fix resumeDownload()

```typescript
async resumeDownload(downloadId: string): Promise<void> {
  const item = this.downloadQueue.find(i => i.id === downloadId);
  if (item && (item.status === 'paused' || item.status === 'failed')) {
    // Remove from paused set
    this.pausedItems.delete(downloadId);
    
    // Set to pending so it gets picked up by queue processor
    item.status = 'pending';
    await this.saveQueue();
    this.notifyProgress(item);
    
    // Restart queue processing
    this.processQueue();
  }
}
```

### 5. Fix cancelDownload()

```typescript
async cancelDownload(downloadId: string): Promise<void> {
  const item = this.downloadQueue.find(i => i.id === downloadId);
  if (item) {
    // Add to cancelled set - this will stop the download loop
    this.cancelledItems.add(downloadId);
    
    // Wait a tick for the download loop to notice
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Clean up partial files
    if (item.surahNumber && item.reciter) {
      const surahInfo = SURAH_INFO.find(s => s.number === item.surahNumber);
      if (surahInfo) {
        for (let ayah = 1; ayah <= surahInfo.ayahs; ayah++) {
          const localPath = this.getAyahFilePath(item.surahNumber, ayah, item.reciter);
          await FileSystem.deleteAsync(localPath, { idempotent: true });
        }
      }
    }

    // Remove from queue
    this.downloadQueue = this.downloadQueue.filter(i => i.id !== downloadId);
    await this.saveQueue();
    
    // Clean up cancelled set
    this.cancelledItems.delete(downloadId);
    
    // Notify UI
    this.notifyProgress({ ...item, status: 'pending' }); // Signal removal
  }
}
```

## State Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        Download States                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  not_downloaded ──[download]──> pending ──[process]──> downloading│
│        ↑                           ↑                      │      │
│        │                           │                      │      │
│        │                           └──────[resume]────────┤      │
│        │                                                  │      │
│        │                                                  ↓      │
│        │                                              paused     │
│        │                                                  │      │
│        │                                                  │      │
│        └──────────────[cancel]────────────────────────────┘      │
│                                                                   │
│  downloading ──[complete]──> completed                            │
│  downloading ──[error]──> failed ──[retry/resume]──> pending     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## UI State Sync

### Hook Changes (useAudioDownload.ts)

```typescript
// Ensure currentDownload is cleared when item is cancelled/paused
useEffect(() => {
  const unsubProgress = audioDownloadService.onProgress((item) => {
    if (item.reciter === reciter) {
      // Only show as current if actually downloading
      if (item.status === 'downloading') {
        setCurrentDownload(item);
      } else {
        // Clear current download if this item was the current one
        setCurrentDownload(prev => 
          prev?.id === item.id ? null : prev
        );
      }
      setDownloadQueue(audioDownloadService.getDownloadQueue());
    }
  });
  // ...
}, [reciter]);
```

## Testing Scenarios

### Test 1: Pause During Download
1. Start downloading a surah
2. Click pause
3. Verify: Download stops, status shows "Paused", progress preserved

### Test 2: Resume After Pause
1. Pause a download (from Test 1)
2. Click resume/play
3. Verify: Download resumes, status shows "Downloading"

### Test 3: Cancel During Download
1. Start downloading a surah
2. Click X (cancel)
3. Verify: Download stops immediately, progress box disappears, surah shows "not downloaded"

### Test 4: Cancel Then Download Again
1. Cancel a download (from Test 3)
2. Click download on same surah
3. Verify: Fresh download starts, no conflicts

### Test 5: Multiple Downloads - Cancel One
1. Queue multiple surahs for download
2. Cancel one that's downloading
3. Verify: Only that one stops, others continue

### Test 6: Pause All Then Resume One
1. Queue multiple surahs
2. Pause the active download
3. Resume it
4. Verify: Resumes correctly, queue continues

## Implementation Order

1. Add `cancelledItems` and `pausedItems` Sets to service
2. Modify `processDownloadItem()` to check these sets
3. Fix `pauseDownload()` to add to pausedItems
4. Fix `resumeDownload()` to remove from pausedItems and restart
5. Fix `cancelDownload()` to add to cancelledItems and clean up
6. Update hook to properly sync UI state
7. Test all scenarios
