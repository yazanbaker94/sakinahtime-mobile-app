package com.sakinahtime.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import java.util.Calendar;

public class DhikrAlarmReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        SharedPreferences prefs = context.getSharedPreferences("DhikrPrefs", Context.MODE_PRIVATE);
        if (!prefs.getBoolean("isEnabled", false))
            return;

        // 1. Daisy Chain: Immediately schedule the NEXT alarm infinitely
        scheduleNextAlarm(context);

        // 2. Quiet Hours check
        if (prefs.getBoolean("quietHoursEnabled", false)) {
            int start = prefs.getInt("quietHoursStart", 22);
            int end = prefs.getInt("quietHoursEnd", 6);
            int currentHour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);

            boolean isQuiet = false;
            if (start < end) {
                isQuiet = currentHour >= start && currentHour < end;
            } else if (start > end) { // Wraps around midnight (e.g. 22 to 6)
                isQuiet = currentHour >= start || currentHour < end;
            }
            if (isQuiet)
                return;
        }

        // 3. Command the ForegroundService to show the overlay
        Intent serviceIntent = new Intent(context, DhikrForegroundService.class);
        serviceIntent.setAction(DhikrForegroundService.ACTION_SHOW_PERIODIC);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }

    public static void scheduleNextAlarm(Context context) {
        SharedPreferences prefs = context.getSharedPreferences("DhikrPrefs", Context.MODE_PRIVATE);
        int intervalMins = prefs.getInt("intervalMinutes", 60);

        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, DhikrAlarmReceiver.class);
        PendingIntent pi = PendingIntent.getBroadcast(context, 1005, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        long nextTime = System.currentTimeMillis() + (intervalMins * 60 * 1000L);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !am.canScheduleExactAlarms()) {
            am.setWindow(AlarmManager.RTC_WAKEUP, nextTime, 10 * 60 * 1000L, pi);
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextTime, pi);
        } else {
            am.setExact(AlarmManager.RTC_WAKEUP, nextTime, pi);
        }
    }

    public static void cancelAlarm(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, DhikrAlarmReceiver.class);
        PendingIntent pi = PendingIntent.getBroadcast(context, 1005, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        if (am != null)
            am.cancel(pi);
    }
}
