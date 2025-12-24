const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Config plugin to add PrayerAlarmReceiver and BootReceiver to AndroidManifest.xml
 */
module.exports = function withAndroidManifestReceivers(config) {
  return withAndroidManifest(config, async (config) => {
    const { manifest } = config.modResults;
    
    // Ensure application element exists
    if (!manifest.application) {
      manifest.application = [{}];
    }
    
    const application = manifest.application[0];
    
    // Initialize receiver array if it doesn't exist
    if (!application.receiver) {
      application.receiver = [];
    }
    
    // Check if PrayerAlarmReceiver already exists
    const hasPrayerReceiver = application.receiver.some(
      receiver => receiver.$?.['android:name'] === '.PrayerAlarmReceiver'
    );
    
    // Check if BootReceiver already exists
    const hasBootReceiver = application.receiver.some(
      receiver => receiver.$?.['android:name'] === '.BootReceiver'
    );
    
    // Add PrayerAlarmReceiver if not present
    if (!hasPrayerReceiver) {
      application.receiver.push({
        $: {
          'android:name': '.PrayerAlarmReceiver',
          'android:enabled': 'true',
          'android:exported': 'false'
        }
      });
      console.log('✅ Added PrayerAlarmReceiver to AndroidManifest.xml');
    } else {
      console.log('✅ PrayerAlarmReceiver already in AndroidManifest.xml');
    }
    
    // Add BootReceiver if not present
    if (!hasBootReceiver) {
      application.receiver.push({
        $: {
          'android:name': '.BootReceiver',
          'android:enabled': 'true',
          'android:exported': 'true'
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.intent.action.BOOT_COMPLETED'
                }
              }
            ]
          }
        ]
      });
      console.log('✅ Added BootReceiver to AndroidManifest.xml');
    } else {
      console.log('✅ BootReceiver already in AndroidManifest.xml');
    }
    
    return config;
  });
};
