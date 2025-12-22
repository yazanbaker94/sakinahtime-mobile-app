const { withDangerousMod, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Custom config plugin to copy notification sound to Android res/raw directory
 */
const withAndroidNotificationSound = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformProjectRoot = config.modRequest.platformProjectRoot;

      // Source file
      const sourceFile = path.join(projectRoot, 'assets', 'audio', 'azan.mp3');
      
      // Destination directory and file
      const destDir = path.join(platformProjectRoot, 'app', 'src', 'main', 'res', 'raw');
      const destFile = path.join(destDir, 'azan.mp3');

      // Create raw directory if it doesn't exist
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Copy the sound file
      if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, destFile);
        console.log('✅ Copied azan.mp3 to Android res/raw directory');
      } else {
        console.warn('⚠️ Warning: azan.mp3 not found at', sourceFile);
      }

      return config;
    },
  ]);
};

module.exports = withAndroidNotificationSound;
