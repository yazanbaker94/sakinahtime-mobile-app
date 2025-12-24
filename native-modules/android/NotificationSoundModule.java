package com.sakinahtime.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class NotificationSoundModule extends ReactContextBaseJavaModule {
    private static final String CHANNEL_ID = "prayer-times";
    
    public NotificationSoundModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "NotificationSoundModule";
    }

    @ReactMethod
    public void createNotificationChannel(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Context context = getReactApplicationContext();
                NotificationManager notificationManager = 
                    (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

                // Delete old channel if exists
                if (notificationManager.getNotificationChannel(CHANNEL_ID) != null) {
                    notificationManager.deleteNotificationChannel(CHANNEL_ID);
                }

                // Create new channel WITHOUT custom sound (MediaPlayer plays it)
                CharSequence name = "Prayer Times";
                String description = "Notifications for prayer times";
                int importance = NotificationManager.IMPORTANCE_HIGH;
                NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
                channel.setDescription(description);

                // NO custom sound - use default or silent
                // The azan is played by MediaPlayer in PrayerAlarmReceiver
                channel.setSound(null, null);

                // Set other properties
                channel.enableVibration(true);
                channel.setVibrationPattern(new long[]{0, 250, 250, 250});
                channel.enableLights(true);
                channel.setLightColor(0xFF10B981);

                notificationManager.createNotificationChannel(channel);
                promise.resolve("Channel created successfully (silent - MediaPlayer plays azan)");
            } else {
                promise.resolve("Android version < O, no channels needed");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}
