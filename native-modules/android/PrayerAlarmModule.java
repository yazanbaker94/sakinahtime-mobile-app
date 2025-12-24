package com.sakinahtime.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

public class PrayerAlarmModule extends ReactContextBaseJavaModule {
    private static final String TAG = "PrayerAlarmModule";
    
    public PrayerAlarmModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "PrayerAlarmModule";
    }

    @ReactMethod
    public void schedulePrayerAlarms(ReadableArray prayers, boolean playAzan, Promise promise) {
        try {
            Context context = getReactApplicationContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            
            // Cancel all existing alarms first (without promise)
            cancelAllAlarmsInternal(context, alarmManager);
            
            int scheduled = 0;
            for (int i = 0; i < prayers.size(); i++) {
                ReadableMap prayer = prayers.getMap(i);
                String prayerName = prayer.getString("name");
                long timestamp = (long) prayer.getDouble("timestamp");
                
                // Create intent for this prayer
                Intent intent = new Intent(context, PrayerAlarmReceiver.class);
                intent.putExtra("prayer_name", prayerName);
                intent.putExtra("play_azan", playAzan);
                
                // Create unique request code for each prayer
                int requestCode = prayerName.hashCode();
                
                PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context,
                    requestCode,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                
                // Schedule exact alarm
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        timestamp,
                        pendingIntent
                    );
                } else {
                    alarmManager.setExact(
                        AlarmManager.RTC_WAKEUP,
                        timestamp,
                        pendingIntent
                    );
                }
                
                scheduled++;
                Log.d(TAG, "Scheduled alarm for " + prayerName + " at " + timestamp);
            }
            
            promise.resolve("Scheduled " + scheduled + " prayer alarms");
        } catch (Exception e) {
            Log.e(TAG, "Error scheduling alarms: " + e.getMessage(), e);
            promise.reject("ERROR", e.getMessage());
        }
    }

    private void cancelAllAlarmsInternal(Context context, AlarmManager alarmManager) {
        // Cancel alarms for all prayer names (including Test)
        String[] prayers = {"Fajr", "Dhuhr", "Asr", "Maghrib", "Isha", "Test"};
        
        for (String prayerName : prayers) {
            Intent intent = new Intent(context, PrayerAlarmReceiver.class);
            int requestCode = prayerName.hashCode();
            
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            
            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();
        }
        
        Log.d(TAG, "Cancelled all prayer alarms");
    }

    @ReactMethod
    public void cancelAllAlarms(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            
            cancelAllAlarmsInternal(context, alarmManager);
            
            promise.resolve("Cancelled all alarms");
        } catch (Exception e) {
            Log.e(TAG, "Error cancelling alarms: " + e.getMessage(), e);
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopAzan(Promise promise) {
        try {
            PrayerAlarmReceiver.stopAzan();
            promise.resolve("Azan stopped");
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}
