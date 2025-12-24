# Image Quality Fix - Build Checklist

## Changes Made to Fix Pixelation:

### 1. Fresco Configuration (MainApplication.kt)
- ✅ Added `FrescoConfig.java` with `setDownsampleEnabled(false)`
- ✅ Initialized Fresco with custom config in `onCreate()`
- **Impact**: Prevents Android from automatically reducing image resolution

### 2. Gradle Build Settings (android/app/build.gradle)
- ✅ Added `cruncherEnabled = false` - Disables PNG compression
- ✅ Added `noCompress 'png'` - Prevents image compression during packaging
- **Impact**: Preserves original image quality during build

### 3. AndroidManifest.xml
- ✅ Added `android:hardwareAccelerated="true"` to application and activity
- ✅ Added `android:largeHeap="true"` for better memory handling
- **Impact**: Uses GPU for rendering, improves quality

### 4. Image Component (MushafScreen.tsx)
- ✅ Set `resizeMethod="resize"` - High-quality scaling algorithm
- ✅ Added `progressiveRenderingEnabled={false}` - No progressive artifacts
- **Impact**: Better image scaling quality

## Build Instructions:

### Option 1: EAS Build (Recommended for testing)
```bash
eas build --platform android --profile preview --clear-cache
```

### Option 2: Local Build
```bash
# Clean and rebuild
npx expo prebuild --clean

# Build APK
cd android
./gradlew clean
./gradlew assembleDebug

# Install on device
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Expected Results:
- Quran pages should be crisp and clear on Android
- Quality should match iPhone 14
- No visible pixelation on 720x1600 or higher resolution devices

## If Still Pixelated After Build:
The only remaining option would be to use higher resolution source images (2x: 2600x4200px), but with these fixes, your current 1300x2103 images should be perfectly sharp.
