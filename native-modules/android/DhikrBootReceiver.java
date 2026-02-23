package com.sakinahtime.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

public class DhikrBootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction()) ||
                Intent.ACTION_MY_PACKAGE_REPLACED.equals(intent.getAction())) {

            SharedPreferences prefs = context.getSharedPreferences("DhikrPrefs", Context.MODE_PRIVATE);
            if (prefs.getBoolean("isEnabled", false)) {

                Intent serviceIntent = new Intent(context, DhikrForegroundService.class);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent);
                } else {
                    context.startService(serviceIntent);
                }

                // Restart the temporal Daisy Chain
                DhikrAlarmReceiver.scheduleNextAlarm(context);
            }
        }
    }
}
