const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Config plugin to copy native Java files to android project
 */
module.exports = function withAndroidNativeFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidProjectRoot = config.modRequest.platformProjectRoot;
      
      const sourceDir = path.join(projectRoot, 'native-modules', 'android');
      const targetDir = path.join(androidProjectRoot, 'app', 'src', 'main', 'java', 'com', 'sakinahtime', 'app');
      
      // Create target directory if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // List of files to copy
      const files = [
        'PrayerAlarmModule.java',
        'PrayerAlarmPackage.java',
        'PrayerAlarmReceiver.java',
        'NotificationSoundModule.java',
        'NotificationSoundPackage.java',
        'BootReceiver.java'
      ];
      
      // Copy each file
      for (const file of files) {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, file);
        
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`✅ Copied ${file}`);
        } else {
          console.warn(`⚠️ Source file not found: ${file}`);
        }
      }
      
      return config;
    },
  ]);
};
