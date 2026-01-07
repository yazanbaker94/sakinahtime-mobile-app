const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin for Dhikr Floating Overlay feature
 * 
 * Adds required permissions and registers services/receivers in AndroidManifest.xml
 */
module.exports = function withDhikrOverlay(config) {
  // First, copy the Arabic font to Android assets
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const assetsDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'assets', 'fonts');
      const fontSource = path.join(projectRoot, 'assets', 'fonts', 'AlMushafQuran.ttf');
      const fontDest = path.join(assetsDir, 'AlMushafQuran.ttf');
      
      // Create fonts directory if it doesn't exist
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }
      
      // Copy font if source exists
      if (fs.existsSync(fontSource)) {
        fs.copyFileSync(fontSource, fontDest);
        console.log('[withDhikrOverlay] Copied Arabic font to Android assets');
      } else {
        console.warn('[withDhikrOverlay] Arabic font not found at:', fontSource);
      }
      
      return config;
    },
  ]);
  
  // Then, update AndroidManifest
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;

    // Ensure uses-permission array exists
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    // Add required permissions
    const permissions = [
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.USE_EXACT_ALARM',
    ];

    permissions.forEach(permission => {
      const exists = manifest['uses-permission'].some(
        p => p.$?.['android:name'] === permission
      );
      if (!exists) {
        manifest['uses-permission'].push({
          $: { 'android:name': permission }
        });
      }
    });

    // Get application node
    const application = manifest.application?.[0];
    if (!application) {
      return config;
    }

    // Ensure service array exists
    if (!application.service) {
      application.service = [];
    }

    // Add DhikrForegroundService
    const serviceExists = application.service.some(
      s => s.$?.['android:name'] === '.dhikr.DhikrForegroundService'
    );
    if (!serviceExists) {
      application.service.push({
        $: {
          'android:name': '.dhikr.DhikrForegroundService',
          'android:enabled': 'true',
          'android:exported': 'false',
          'android:foregroundServiceType': 'specialUse',
        },
        'property': [{
          $: {
            'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
            'android:value': 'dhikr_reminders'
          }
        }]
      });
    }

    // Ensure receiver array exists
    if (!application.receiver) {
      application.receiver = [];
    }

    // Add DhikrAlarmReceiver
    const alarmReceiverExists = application.receiver.some(
      r => r.$?.['android:name'] === '.dhikr.DhikrAlarmReceiver'
    );
    if (!alarmReceiverExists) {
      application.receiver.push({
        $: {
          'android:name': '.dhikr.DhikrAlarmReceiver',
          'android:enabled': 'true',
          'android:exported': 'false',
        }
      });
    }

    // Add DhikrBootReceiver
    const bootReceiverExists = application.receiver.some(
      r => r.$?.['android:name'] === '.dhikr.DhikrBootReceiver'
    );
    if (!bootReceiverExists) {
      application.receiver.push({
        $: {
          'android:name': '.dhikr.DhikrBootReceiver',
          'android:enabled': 'true',
          'android:exported': 'true',
        },
        'intent-filter': [{
          action: [{
            $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' }
          }]
        }]
      });
    }

    return config;
  });
};
