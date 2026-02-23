package com.sakinahtime.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

public class AzanAudioService extends Service implements SensorEventListener {
    private static final String TAG = "AzanAudioService";
    private static final int NOTIFICATION_ID = 9999;
    private static final String CHANNEL_ID = "prayer-times";

    private MediaPlayer mediaPlayer;
    private SensorManager sensorManager;
    private Sensor accelerometer;
    private boolean isFaceDown = false;
    private int initialAlarmVolume = -1;
    private AudioManager audioManager;
    private VolumeReceiver volumeReceiver;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && "STOP_AZAN".equals(intent.getAction())) {
            Log.d(TAG, "Stop azan action received. Stopping service.");
            stopSelf();
            return START_NOT_STICKY;
        }

        String prayerName = intent != null ? intent.getStringExtra("prayer_name") : "Prayer";
        Log.d(TAG, "Starting AzanAudioService for " + prayerName);

        startForeground(NOTIFICATION_ID, createNotification(prayerName));

        // Register flip-to-silence sensor
        registerFlipDetection();

        // Register volume-down-to-stop listener
        registerVolumeListener();

        playAzanSound();

        return START_NOT_STICKY;
    }

    // ─── Flip-to-Silence (Accelerometer) ───
    private void registerFlipDetection() {
        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
        if (sensorManager != null) {
            accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            if (accelerometer != null) {
                sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_NORMAL);
                Log.d(TAG, "📱 Flip-to-silence: accelerometer registered");
            }
        }
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            float z = event.values[2];
            // Z < -7 means phone is face-down (gravity pulling away from screen)
            if (z < -7.0f && !isFaceDown) {
                isFaceDown = true;
                Log.d(TAG, "📱 Phone flipped face-down! Stopping azan.");
                stopSelf();
            } else if (z > 3.0f) {
                isFaceDown = false; // Reset when phone is face-up again
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Not needed
    }

    // ─── Volume-Down-to-Stop ───
    private void registerVolumeListener() {
        audioManager = (AudioManager) getSystemService(AUDIO_SERVICE);
        if (audioManager != null) {
            initialAlarmVolume = audioManager.getStreamVolume(AudioManager.STREAM_ALARM);
        }

        volumeReceiver = new VolumeReceiver();
        IntentFilter filter = new IntentFilter("android.media.VOLUME_CHANGED_ACTION");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(volumeReceiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(volumeReceiver, filter);
        }
        Log.d(TAG, "🔊 Volume-down-to-stop: listener registered (initial vol=" + initialAlarmVolume + ")");
    }

    private class VolumeReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (audioManager != null && mediaPlayer != null && mediaPlayer.isPlaying()) {
                int currentVolume = audioManager.getStreamVolume(AudioManager.STREAM_ALARM);
                if (currentVolume < initialAlarmVolume) {
                    Log.d(TAG, "🔊 Volume lowered (was " + initialAlarmVolume + ", now " + currentVolume
                            + "). Stopping azan.");
                    stopSelf();
                }
            }
        }
    }

    // ─── Audio Playback ───
    private void playAzanSound() {
        try {
            if (mediaPlayer != null) {
                if (mediaPlayer.isPlaying())
                    mediaPlayer.stop();
                mediaPlayer.release();
                mediaPlayer = null;
            }

            mediaPlayer = new MediaPlayer();

            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();
            mediaPlayer.setAudioAttributes(audioAttributes);
            mediaPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);

            android.content.res.AssetFileDescriptor afd = getResources().openRawResourceFd(R.raw.azan);
            if (afd == null) {
                Log.e(TAG, "Could not open azan sound file");
                stopSelf();
                return;
            }

            mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();

            mediaPlayer.setOnCompletionListener(mp -> {
                Log.d(TAG, "Azan playback completed naturally");
                stopSelf();
            });

            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                Log.e(TAG, "MediaPlayer error: " + what + ", " + extra);
                stopSelf();
                return true;
            });

            mediaPlayer.prepare();
            mediaPlayer.start();
            Log.d(TAG, "Azan playback started from Foreground Service");

        } catch (Exception e) {
            Log.e(TAG, "Error playing azan: " + e.getMessage(), e);
            stopSelf();
        }
    }

    // ─── Notification ───
    private Notification createNotification(String prayerName) {
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        Intent stopIntent = new Intent(this, AzanAudioService.class);
        stopIntent.setAction("STOP_AZAN");
        PendingIntent stopPendingIntent = PendingIntent.getService(
                this,
                999,
                stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        String title = prayerName + " Prayer";

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        return builder
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText("It's time for " + prayerName + " prayer")
                .setSubText("Flip phone or lower volume to stop")
                .setContentIntent(stopPendingIntent)
                .setDeleteIntent(stopPendingIntent)
                .addAction(android.R.drawable.ic_media_pause, "Stop Azan", stopPendingIntent)
                .setOngoing(true)
                .setPriority(Notification.PRIORITY_MAX)
                .setCategory(Notification.CATEGORY_ALARM)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .build();
    }

    // ─── Cleanup ───
    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "AzanAudioService destroyed, releasing resources");

        // Unregister flip sensor
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
            sensorManager = null;
        }

        // Unregister volume listener
        if (volumeReceiver != null) {
            try {
                unregisterReceiver(volumeReceiver);
            } catch (Exception ignored) {
            }
            volumeReceiver = null;
        }

        // Release media player
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
            } catch (Exception e) {
                Log.e(TAG, "Error releasing MediaPlayer: " + e.getMessage());
            }
            mediaPlayer = null;
        }

        stopForeground(true);
    }
}
