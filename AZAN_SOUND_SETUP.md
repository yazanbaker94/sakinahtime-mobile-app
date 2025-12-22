# Azan Sound Setup for iOS and Android

## Issue
Custom notification sounds require the sound file to be bundled into the native app during build time. The sound won't work in Expo Go or with old builds.

## What I Fixed
1. ✅ Added proper Android notification channel with `azan.mp3` sound
2. ✅ Added iOS notification sound with `azan.caf` format
3. ✅ Configured `expo-notifications` plugin in `app.json` with both sound files
4. ✅ Added debugging logs to track notification scheduling
5. ✅ Set channel importance to MAX for proper sound playback (Android)

## What You Need to Do

### Create a New Build

Since you changed the notification configuration, you need to rebuild the app:

**For iOS:**
```bash
eas build --platform ios --profile development
```

**For Android:**
```bash
eas build --platform android --profile development
```

Or for production builds:
```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Why Rebuild is Required

**iOS:**
- Notification sounds must be in `.caf` format (Linear PCM or IMA4 audio)
- Sound files must be bundled in the app during build
- Maximum duration: 30 seconds
- The `expo-notifications` plugin copies the sound file during build

**Android:**
- Notification sounds must be in `android/app/src/main/res/raw/` directory
- The `expo-notifications` plugin copies the sound file there during build
- Old builds don't have the updated sound file

## Testing After Rebuild

1. Install the new build from expo.dev
2. Go to Prayer Times screen
3. Enable notifications and azan
4. Tap "Test Notification (10s)"
5. Wait 10 seconds - you should hear the azan sound

## Troubleshooting

### iOS
If sound doesn't play:
1. Check device is not in Silent mode (check the physical switch)
2. Check volume is up
3. Check "Do Not Disturb" is off
4. Go to Settings > Notifications > SakinahTime > Sounds - verify it's enabled
5. Check the console logs for any errors

### Android
If sound doesn't play:
1. Check device volume is up
2. Check "Do Not Disturb" is off
3. Go to Android Settings > Apps > SakinahTime > Notifications > Prayer Times channel
4. Verify the sound is set to "azan"
5. Check the console logs for any errors

## Sound File Requirements

### iOS (azan.caf)
- Format: Linear PCM or IMA4 (ADPCM) audio
- Sample rate: 8-48 kHz
- Bit depth: 8 or 16-bit
- Channels: Mono or Stereo
- Duration: Maximum 30 seconds
- File extension: `.caf`

### Android (azan.mp3)
- Format: MP3
- Any standard MP3 format works
- File extension: `.mp3`

## Note
- iOS uses `azan.caf` format (configured in app.json)
- Android uses `azan.mp3` format (configured in app.json)
- Both files are in `assets/audio/` directory
- Both files must be added to the `expo-notifications` plugin configuration
