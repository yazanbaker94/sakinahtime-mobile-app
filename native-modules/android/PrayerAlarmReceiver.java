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

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "Prayer alarm received!");
        
        String prayerName = intent.getStringExtra("prayer_name");
        boolean playAzan = intent.getBooleanExtra("play_azan", false);
        
        Log.d(TAG, "Prayer: " + prayerName + ", Play Azan: " + playAzan);
        
        if (playAzan) {
            Log.d(TAG, "Playing azan sound...");
            playAzanSound(context);
        } else {
            Log.d(TAG, "Azan disabled, skipping sound");
        }
        
        // Show notification (handled by expo-notifications)
        Log.d(TAG, "Notification for " + prayerName + " will be shown by expo-notifications");
    }
    
    private void playAzanSound(Context context) {
        try {
            // Wake up the device
            PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "SakinahTime:AzanWakeLock"
            );
            wakeLock.acquire(5 * 60 * 1000L); // 5 minutes max
            
            // Stop any existing playback
            if (mediaPlayer != null) {
                mediaPlayer.release();
                mediaPlayer = null;
            }
            
            // Create MediaPlayer with azan sound
            mediaPlayer = MediaPlayer.create(context, R.raw.azan);
            
            if (mediaPlayer != null) {
                // Set audio attributes for notification/alarm
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();
                mediaPlayer.setAudioAttributes(audioAttributes);
                
                // Set volume to max
                AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
                int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                int currentVolume = audioManager.getStreamVolume(AudioManager.STREAM_ALARM);
                
                // Use alarm stream so it plays even in silent mode
                mediaPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);
                
                // Set completion listener
                final PowerManager.WakeLock finalWakeLock = wakeLock;
                mediaPlayer.setOnCompletionListener(mp -> {
                    mp.release();
                    mediaPlayer = null;
                    if (finalWakeLock.isHeld()) {
                        finalWakeLock.release();
                    }
                    Log.d(TAG, "Azan playback completed");
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
            } else {
                Log.e(TAG, "Failed to create MediaPlayer");
                if (wakeLock.isHeld()) {
                    wakeLock.release();
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error playing azan: " + e.getMessage(), e);
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
            } catch (Exception e) {
                Log.e(TAG, "Error stopping azan: " + e.getMessage(), e);
            }
        }
    }
}
