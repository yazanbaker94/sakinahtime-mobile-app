package com.sakinahtime.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

/**
 * Receives BOOT_COMPLETED broadcast to reschedule prayer alarms after device
 * reboot. Also handles the edge case where the phone rebooted between the
 * Azan and the Iqama (Sidecar Shadow recovery).
 */
public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";
    private static final int IQAMA_REQUEST_CODE = 88888;

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.d(TAG, "Device booted - Reading SharedPreferences to kickstart autonomous native Daisy Chain");

            // Pillar 1: Boot Survival — Schedule the next Azan
            PrayerTimeCalculator.scheduleNextAzan(context);

            // Phase 5: Sidecar Shadow Recovery
            // Check if we rebooted between the Azan and the Iqama
            rescheduleIqamaIfNeeded(context);
        }
    }

    /**
     * If the phone rebooted after the Azan fired but before the Iqama was
     * supposed to fire, the setExactAndAllowWhileIdle alarm was lost.
     * We check the stored timestamp and reschedule if it's still in the future.
     */
    private void rescheduleIqamaIfNeeded(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("SakinahTimeAzanConfig", Context.MODE_PRIVATE);

            if (!prefs.getBoolean("iqamaEnabled", false)) {
                return;
            }

            long scheduledIqamaTime = prefs.getLong("lastScheduledIqamaTime", 0);
            String iqamaPrayer = prefs.getString("lastScheduledIqamaPrayer", null);

            if (scheduledIqamaTime == 0 || iqamaPrayer == null) {
                return;
            }

            long now = System.currentTimeMillis();

            if (now < scheduledIqamaTime) {
                // Edge case caught! Phone rebooted between Azan and Iqama.
                Log.d(TAG, "Iqama recovery: rebooted before " + iqamaPrayer
                        + " iqama at " + scheduledIqamaTime + ". Rescheduling...");

                AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

                Intent iqamaIntent = new Intent(context, IqamaReceiver.class);
                iqamaIntent.setAction("PLAY_IQAMA");
                iqamaIntent.putExtra("prayer_name", iqamaPrayer);

                PendingIntent pendingIntent = PendingIntent.getBroadcast(
                        context, IQAMA_REQUEST_CODE, iqamaIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

                alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP, scheduledIqamaTime, pendingIntent);

                Log.d(TAG, "✅ Iqama sidecar re-scheduled after boot for " + iqamaPrayer);
            } else {
                Log.d(TAG, "Iqama for " + iqamaPrayer + " already passed, no recovery needed");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to reschedule iqama after boot: " + e.getMessage(), e);
        }
    }
}
