const { withMainApplication } = require('@expo/config-plugins');

/**
 * Config plugin to ensure native modules are registered in MainApplication.kt
 */
module.exports = function withAndroidNativeModules(config) {
  return withMainApplication(config, async (config) => {
    const { modResults } = config;
    let contents = modResults.contents;

    // Check if packages are already added
    const hasNotificationPackage = contents.includes('NotificationSoundPackage()');
    const hasPrayerPackage = contents.includes('PrayerAlarmPackage()');

    if (!hasNotificationPackage || !hasPrayerPackage) {
      // Find the packages list
      const packagesRegex = /(override fun getPackages\(\): List<ReactPackage> =\s+PackageList\(this\)\.packages\.apply\s*\{[^}]*)/;
      
      if (packagesRegex.test(contents)) {
        contents = contents.replace(
          packagesRegex,
          (match) => {
            let result = match;
            
            // Add NotificationSoundPackage if not present
            if (!hasNotificationPackage) {
              result += '\n              add(NotificationSoundPackage())';
            }
            
            // Add PrayerAlarmPackage if not present
            if (!hasPrayerPackage) {
              result += '\n              add(PrayerAlarmPackage())';
            }
            
            return result;
          }
        );
        
        console.log('✅ Added native module packages to MainApplication.kt');
      } else {
        console.warn('⚠️ Could not find packages list in MainApplication.kt');
      }
    } else {
      console.log('✅ Native module packages already registered');
    }

    modResults.contents = contents;
    return config;
  });
};
