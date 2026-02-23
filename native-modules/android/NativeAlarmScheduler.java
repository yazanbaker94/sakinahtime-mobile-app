package com.sakinahtime.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class NativeAlarmScheduler {
    private static final String TAG = "NativeAlarmScheduler";

    /**
     * Schedules exactly ONE alarm for the immediate next enabled prayer using
     * setAlarmClock.
     */
    public static void scheduleAlarm(Context context, String prayerName, long timestamp) {
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

            Intent intent = new Intent(context, PrayerAlarmReceiver.class);
            intent.setAction("PLAY_AZAN");
            intent.putExtra("prayer_name", prayerName);
            intent.putExtra("play_azan", true);

            // Cancel any previously scheduled Native single alarm so we don't have
            // duplicates
            PendingIntent existingIntent = PendingIntent.getBroadcast(
                    context,
                    99999, // Unique request code for the Daisy Chain
                    intent,
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
            if (existingIntent != null) {
                alarmManager.cancel(existingIntent);
                existingIntent.cancel();
            }

            // Create new intent
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context,
                    99999,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            // Intent to launch the app if user taps the alarm clock icon in quick settings
            Intent uiIntent = new Intent(context, MainActivity.class);
            PendingIntent pendingUiIntent = PendingIntent.getActivity(
                    context,
                    100000,
                    uiIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            Log.d(TAG, "Scheduling setAlarmClock for " + prayerName + " at " + timestamp);

            // Pillar 3: Piercing Samsung Deep Sleep
            // setAlarmClock tells OS "this is a literal interactive morning alarm".
            // It completely bypasses Doze and App Standby Buckets.
            AlarmManager.AlarmClockInfo info = new AlarmManager.AlarmClockInfo(timestamp, pendingUiIntent);
            alarmManager.setAlarmClock(info, pendingIntent);

            Log.d(TAG, "✅ Next single alarm successfully scheduled.");
        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule NativeAlarmScheduler: " + e.getMessage(), e);
        }
    }
}
