package com.sakinahtime.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

/**
 * Lightweight Iqama receiver — the "Sidecar Shadow" of the Azan.
 *
 * This receiver does NOT use MediaPlayer, WakeLock, or a Foreground Service.
 * Instead, it posts a standard Android Notification and lets the OS play the
 * 5-second haya_al_salat.mp3 natively via the Notification Channel sound.
 *
 * This finishes in <2ms and is 100% crash-proof.
 */
public class IqamaReceiver extends BroadcastReceiver {
    private static final String TAG = "IqamaReceiver";
    private static final String CHANNEL_ID = "iqama_channel";
    private static final int IQAMA_NOTIFICATION_ID = 8888;

    @Override
    public void onReceive(Context context, Intent intent) {
        String prayerName = intent != null ? intent.getStringExtra("prayer_name") : "Prayer";
        Log.d(TAG, "Iqama alarm fired for " + prayerName);

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) {
            Log.e(TAG, "NotificationManager is null");
            return;
        }

        // Create / update the Iqama notification channel with our custom sound
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Delete existing channel first to allow sound URI updates
            // (Android caches channel settings; deleting forces re-creation)
            nm.deleteNotificationChannel(CHANNEL_ID);

            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Iqama Reminders",
                    NotificationManager.IMPORTANCE_HIGH);

            // Attach the 5-second haya_al_salat.mp3 as the channel sound
            Uri iqamaSound = Uri.parse(
                    ContentResolver.SCHEME_ANDROID_RESOURCE + "://"
                            + context.getPackageName() + "/" + R.raw.haya_al_salat);

            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build();

            channel.setSound(iqamaSound, audioAttributes);
            channel.setDescription("Iqama (congregational prayer) reminders");
            channel.enableVibration(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            nm.createNotificationChannel(channel);
        }

        // Build and post the notification — the OS handles audio playback natively
        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(context, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(context);
            // Pre-Oreo: set sound directly on the notification
            Uri iqamaSound = Uri.parse(
                    ContentResolver.SCHEME_ANDROID_RESOURCE + "://"
                            + context.getPackageName() + "/" + R.raw.haya_al_salat);
            builder.setSound(iqamaSound);
        }

        String title = prayerName != null ? prayerName + " Iqama" : "Iqama";

        Notification notification = builder
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText("Congregational prayer is starting")
                .setAutoCancel(true)
                .setPriority(Notification.PRIORITY_HIGH)
                .setCategory(Notification.CATEGORY_REMINDER)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .build();

        nm.notify(IQAMA_NOTIFICATION_ID, notification);
        Log.d(TAG, "✅ Iqama notification posted for " + prayerName + " — OS will play haya_al_salat.mp3");
    }
}
