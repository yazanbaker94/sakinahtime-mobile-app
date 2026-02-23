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

      // Destination directory
      const destDir = path.join(platformProjectRoot, 'app', 'src', 'main', 'res', 'raw');

      // Create raw directory if it doesn't exist
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Audio files to copy to res/raw
      const audioFiles = [
        { src: 'azan.mp3', dest: 'azan.mp3' },
        { src: 'haya_al_salat.mp3', dest: 'haya_al_salat.mp3' },
      ];

      for (const audio of audioFiles) {
        const sourceFile = path.join(projectRoot, 'assets', 'audio', audio.src);
        const destFile = path.join(destDir, audio.dest);

        if (fs.existsSync(sourceFile)) {
          fs.copyFileSync(sourceFile, destFile);
          console.log(`✅ Copied ${audio.src} to Android res/raw directory`);
        } else {
          console.warn(`⚠️ Warning: ${audio.src} not found at`, sourceFile);
        }
      }

      return config;
    },
  ]);
};

module.exports = withAndroidNotificationSound;
