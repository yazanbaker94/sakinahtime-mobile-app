package com.sakinahtime.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.PowerManager;
import android.util.Log;

public class PrayerAlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "PrayerAlarmReceiver";
    private static MediaPlayer mediaPlayer;
    private static Context appContext;

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        // Handle stop action from notification
        if ("STOP_AZAN".equals(action)) {
            Log.d(TAG, "Stop azan action received from notification");
            stopAzan();
            return;
        }

        Log.d(TAG, "Prayer alarm received!");

        String prayerName = intent.getStringExtra("prayer_name");
        boolean playAzan = intent.getBooleanExtra("play_azan", false);

        Log.d(TAG, "Prayer: " + prayerName + ", Play Azan: " + playAzan);

        if (playAzan) {
            Log.d(TAG, "Playing azan sound...");
            playAzanSound(context, prayerName);
        } else {
            Log.d(TAG, "Azan disabled, skipping sound");
        }
    }

    private void playAzanSound(Context context, String prayerName) {
        try {
            // Store context for later use
            appContext = context.getApplicationContext();
            // Wake up the device
            PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "SakinahTime:AzanWakeLock");
            wakeLock.acquire(5 * 60 * 1000L); // 5 minutes max

            // Stop any existing playback
            if (mediaPlayer != null) {
                try {
                    if (mediaPlayer.isPlaying()) {
                        mediaPlayer.stop();
                    }
                    mediaPlayer.release();
                } catch (Exception e) {
                    Log.e(TAG, "Error stopping previous MediaPlayer: " + e.getMessage());
                }
                mediaPlayer = null;
            }

            // Create and configure MediaPlayer manually
            mediaPlayer = new MediaPlayer();

            // Set audio attributes BEFORE setting data source
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();
            mediaPlayer.setAudioAttributes(audioAttributes);

            // Use alarm stream so it plays even in silent mode
            mediaPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);

            // Set data source from raw resource
            android.content.res.AssetFileDescriptor afd = context.getResources().openRawResourceFd(R.raw.azan);
            if (afd == null) {
                Log.e(TAG, "Could not open azan.mp3 resource");
                if (wakeLock.isHeld()) {
                    wakeLock.release();
                }
                return;
            }

            mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();

            // Prepare the media player
            mediaPlayer.prepare();

            Log.d(TAG, "MediaPlayer prepared successfully");

            // Set completion listener
            final PowerManager.WakeLock finalWakeLock = wakeLock;
            mediaPlayer.setOnCompletionListener(mp -> {
                Log.d(TAG, "Azan playback completed");
                mp.release();
                mediaPlayer = null;
                if (finalWakeLock.isHeld()) {
                    finalWakeLock.release();
                }
            });

            // Set error listener
            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                Log.e(TAG, "MediaPlayer error: " + what + ", " + extra);
                mp.release();
                mediaPlayer = null;
                if (finalWakeLock.isHeld()) {
                    finalWakeLock.release();
                }
                return true;
            });

            // Start playback
            mediaPlayer.start();
            Log.d(TAG, "Azan playback started");

            // Show notification with stop action
            showAzanNotification(context, prayerName);
        } catch (Exception e) {
            Log.e(TAG, "Error playing azan: " + e.getMessage(), e);
            if (mediaPlayer != null) {
                mediaPlayer.release();
                mediaPlayer = null;
            }
        }
    }

    private void showAzanNotification(Context context, String prayerName) {
        try {
            // Create stop intent (for tap and action button)
            Intent stopIntent = new Intent(context, PrayerAlarmReceiver.class);
            stopIntent.setAction("STOP_AZAN");
            android.app.PendingIntent stopPendingIntent = android.app.PendingIntent.getBroadcast(
                    context,
                    999,
                    stopIntent,
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE);

            // Create delete intent (triggered when notification is swiped away)
            Intent deleteIntent = new Intent(context, PrayerAlarmReceiver.class);
            deleteIntent.setAction("STOP_AZAN");
            android.app.PendingIntent deletePendingIntent = android.app.PendingIntent.getBroadcast(
                    context,
                    998, // Different request code from stop intent
                    deleteIntent,
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE);

            // Create notification
            android.app.NotificationManager notificationManager = (android.app.NotificationManager) context
                    .getSystemService(Context.NOTIFICATION_SERVICE);

            // Prayer names in Arabic
            String prayerNameAr = "";
            switch (prayerName) {
                case "Fajr":
                    prayerNameAr = "الفجر";
                    break;
                case "Dhuhr":
                    prayerNameAr = "الظهر";
                    break;
                case "Asr":
                    prayerNameAr = "العصر";
                    break;
                case "Maghrib":
                    prayerNameAr = "المغرب";
                    break;
                case "Isha":
                    prayerNameAr = "العشاء";
                    break;
                default:
                    prayerNameAr = "الصلاة";
                    break;
            }

            android.app.Notification.Builder builder = new android.app.Notification.Builder(context, "prayer-times")
                    .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                    .setContentTitle(prayerName + " - " + prayerNameAr)
                    .setContentText("It's time for " + prayerName + " prayer")
                    .setSubText("Tap or swipe to stop azan")
                    .setContentIntent(stopPendingIntent)
                    .setDeleteIntent(deletePendingIntent) // Stop azan when notification is swiped away
                    .addAction(android.R.drawable.ic_media_pause, "Stop Azan", stopPendingIntent) // Action button
                    .setAutoCancel(true)
                    .setOngoing(false)
                    .setPriority(android.app.Notification.PRIORITY_MAX)
                    .setCategory(android.app.Notification.CATEGORY_ALARM)
                    .setVisibility(android.app.Notification.VISIBILITY_PUBLIC);

            notificationManager.notify(9999, builder.build());
            Log.d(TAG, "Prayer notification shown: " + prayerName);
        } catch (Exception e) {
            Log.e(TAG, "Error showing prayer notification: " + e.getMessage(), e);
        }
    }

    public static void stopAzan() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
                mediaPlayer = null;
                Log.d(TAG, "Azan playback stopped");

                // Dismiss the azan notification
                if (appContext != null) {
                    android.app.NotificationManager notificationManager = (android.app.NotificationManager) appContext
                            .getSystemService(Context.NOTIFICATION_SERVICE);
                    notificationManager.cancel(9999);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error stopping azan: " + e.getMessage(), e);
            }
        }
    }
}
