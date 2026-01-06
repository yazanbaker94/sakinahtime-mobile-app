const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Config plugin to add PrayerAlarmReceiver, BootReceiver, and Widget receivers to AndroidManifest.xml
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
    
    // Widget receivers
    const widgetReceivers = [
      {
        name: '.widget.prayer.PrayerTimesWidget',
        label: '@string/widget_prayer_times_name',
        actions: ['android.appwidget.action.APPWIDGET_UPDATE', 'com.sakinahtime.UPDATE_PRAYER_WIDGET'],
        metaResource: '@xml/widget_prayer_times_info'
      },
      {
        name: '.widget.hijri.HijriDateWidget',
        label: '@string/widget_hijri_date_name',
        actions: ['android.appwidget.action.APPWIDGET_UPDATE', 'com.sakinahtime.UPDATE_HIJRI_WIDGET'],
        metaResource: '@xml/widget_hijri_date_info'
      },
      {
        name: '.widget.verse.DailyVerseWidget',
        label: '@string/widget_daily_verse_name',
        actions: ['android.appwidget.action.APPWIDGET_UPDATE', 'com.sakinahtime.UPDATE_VERSE_WIDGET', 'com.sakinahtime.VERSE_REFRESH'],
        metaResource: '@xml/widget_daily_verse_info'
      },
      {
        name: '.widget.tasbeeh.TasbeehWidget',
        label: '@string/widget_tasbeeh_name',
        actions: ['android.appwidget.action.APPWIDGET_UPDATE', 'com.sakinahtime.UPDATE_TASBEEH_WIDGET', 'com.sakinahtime.TASBEEH_INCREMENT', 'com.sakinahtime.TASBEEH_RESET'],
        metaResource: '@xml/widget_tasbeeh_info'
      }
    ];
    
    for (const widget of widgetReceivers) {
      const hasWidget = application.receiver.some(
        receiver => receiver.$?.['android:name'] === widget.name
      );
      
      if (!hasWidget) {
        application.receiver.push({
          $: {
            'android:name': widget.name,
            'android:exported': 'true',
            'android:label': widget.label
          },
          'intent-filter': [
            {
              action: widget.actions.map(action => ({
                $: { 'android:name': action }
              }))
            }
          ],
          'meta-data': [
            {
              $: {
                'android:name': 'android.appwidget.provider',
                'android:resource': widget.metaResource
              }
            }
          ]
        });
        console.log(`✅ Added ${widget.name} to AndroidManifest.xml`);
      } else {
        console.log(`✅ ${widget.name} already in AndroidManifest.xml`);
      }
    }
    
    return config;
  });
};
