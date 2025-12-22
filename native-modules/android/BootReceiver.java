package com.sakinahtime.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * Receives BOOT_COMPLETED broadcast to reschedule prayer alarms after device reboot
 */
public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.d(TAG, "Device booted - prayer alarms need to be rescheduled by the app");
            
            // Note: We can't reschedule alarms here directly because we need prayer times
            // which are calculated in JavaScript. The app will reschedule alarms when it's opened.
            // This receiver just ensures we have the permission to receive boot events.
        }
    }
}
