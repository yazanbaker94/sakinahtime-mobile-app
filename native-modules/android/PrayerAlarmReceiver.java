package com.sakinahtime.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;
import androidx.core.content.ContextCompat;

public class PrayerAlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "PrayerAlarmReceiver";
    private static final int IQAMA_REQUEST_CODE = 88888;

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent != null && "STOP_AZAN".equals(intent.getAction())) {
            Log.d(TAG, "Stop Azan action received in Receiver. Routing to Service...");
            Intent stopIntent = new Intent(context, AzanAudioService.class);
            stopIntent.setAction("STOP_AZAN");
            context.startService(stopIntent);
            return;
        }

        Log.d(TAG, "Prayer alarm received via setAlarmClock!");

        String prayerName = intent != null ? intent.getStringExtra("prayer_name") : "Prayer";
        boolean playAzan = intent != null && intent.getBooleanExtra("play_azan", false);

        Log.d(TAG, "Prayer: " + prayerName + ", Play Azan: " + playAzan);

        // Pillar 2: The Infinite Daisy Chain
        // BEFORE we even play the audio for this prayer, calculate and schedule the
        // exact next prayer natively.
        PrayerTimeCalculator.scheduleNextAzan(context);
        Log.d(TAG, "Daisy chain: Successfully scheduled next prayer after " + prayerName);

        if (playAzan && prayerName != null) {
            Log.d(TAG, "Promoting to Foreground Service to play azan for " + prayerName);

            // Pillar 4: Bulletproof Execution
            Intent serviceIntent = new Intent(context, AzanAudioService.class);
            serviceIntent.putExtra("prayer_name", prayerName);
            ContextCompat.startForegroundService(context, serviceIntent);

            // Phase 5: Sidecar Shadow — Schedule the Iqama
            // Because setAlarmClock just fired, our app is now in the ACTIVE Standby
            // Bucket. A setExactAndAllowWhileIdle scheduled 15-30 min from now is
            // mathematically guaranteed to fire even on Samsung.
            scheduleIqamaSidecar(context, prayerName);
        } else {
            Log.d(TAG, "Azan disabled, skipping sound routing");
        }
    }

    /**
     * Schedule the lightweight Iqama alarm as a "Sidecar Shadow" of the Azan.
     * Uses setExactAndAllowWhileIdle (NOT setAlarmClock) to avoid status bar icon.
     */
    private void scheduleIqamaSidecar(Context context, String prayerName) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("SakinahTimeAzanConfig", Context.MODE_PRIVATE);

            if (!prefs.getBoolean("iqamaEnabled", false)) {
                Log.d(TAG, "Iqama globally disabled, skipping sidecar");
                return;
            }

            // Check per-prayer iqama toggle
            String prefKey = "iqama_" + prayerName.toLowerCase() + "_enabled";
            if (!prefs.getBoolean(prefKey, true)) {
                Log.d(TAG, "Iqama disabled for " + prayerName + ", skipping");
                return;
            }

            // Check for Time Machine test override (seconds instead of minutes)
            int testOverrideSecs = prefs.getInt("TEST_iqama_delay_seconds", -1);
            long iqamaTime;
            if (testOverrideSecs != -1) {
                iqamaTime = System.currentTimeMillis() + (testOverrideSecs * 1000L);
                prefs.edit().remove("TEST_iqama_delay_seconds").apply(); // Consume and destroy
                Log.d(TAG, "⏱️ Time Machine: Iqama override " + testOverrideSecs + " seconds");
            } else {
                int delayMinutes = prefs.getInt("iqamaDelayMinutes", 15);
                iqamaTime = System.currentTimeMillis() + (delayMinutes * 60 * 1000L);
            }

            // Store the scheduled iqama time for BootReceiver edge case
            prefs.edit()
                    .putLong("lastScheduledIqamaTime", iqamaTime)
                    .putString("lastScheduledIqamaPrayer", prayerName)
                    .apply();

            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

            Intent iqamaIntent = new Intent(context, IqamaReceiver.class);
            iqamaIntent.setAction("PLAY_IQAMA");
            iqamaIntent.putExtra("prayer_name", prayerName);

            // Cancel any existing iqama alarm first
            PendingIntent existingIntent = PendingIntent.getBroadcast(
                    context, IQAMA_REQUEST_CODE, iqamaIntent,
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
            if (existingIntent != null) {
                alarmManager.cancel(existingIntent);
                existingIntent.cancel();
            }

            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context, IQAMA_REQUEST_CODE, iqamaIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            // Use the weaker API — it's fine because we're in ACTIVE bucket
            alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP, iqamaTime, pendingIntent);

            Log.d(TAG, "✅ Iqama sidecar scheduled for " + prayerName
                    + " at epoch " + iqamaTime);

        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule iqama sidecar: " + e.getMessage(), e);
        }
    }
}
