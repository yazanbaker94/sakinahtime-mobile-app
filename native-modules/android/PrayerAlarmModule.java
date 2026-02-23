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
import android.content.SharedPreferences;

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
    public void saveConfiguration(ReadableMap config, Promise promise) {
        try {
            Context context = getReactApplicationContext();
            SharedPreferences prefs = context.getSharedPreferences("SakinahTimeAzanConfig", Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();

            if (config.hasKey("latitude"))
                editor.putFloat("latitude", (float) config.getDouble("latitude"));
            if (config.hasKey("longitude"))
                editor.putFloat("longitude", (float) config.getDouble("longitude"));
            if (config.hasKey("calculationMethod"))
                editor.putString("calculationMethod", config.getString("calculationMethod"));
            if (config.hasKey("madhab"))
                editor.putString("madhab", config.getString("madhab"));
            if (config.hasKey("azanEnabled"))
                editor.putBoolean("azanEnabled", config.getBoolean("azanEnabled"));

            // Prayers enabled booleans
            if (config.hasKey("fajrEnabled"))
                editor.putBoolean("fajrEnabled", config.getBoolean("fajrEnabled"));
            if (config.hasKey("dhuhrEnabled"))
                editor.putBoolean("dhuhrEnabled", config.getBoolean("dhuhrEnabled"));
            if (config.hasKey("asrEnabled"))
                editor.putBoolean("asrEnabled", config.getBoolean("asrEnabled"));
            if (config.hasKey("maghribEnabled"))
                editor.putBoolean("maghribEnabled", config.getBoolean("maghribEnabled"));
            if (config.hasKey("ishaEnabled"))
                editor.putBoolean("ishaEnabled", config.getBoolean("ishaEnabled"));

            // Iqama configuration (Sidecar Shadow)
            if (config.hasKey("iqamaEnabled"))
                editor.putBoolean("iqamaEnabled", config.getBoolean("iqamaEnabled"));
            if (config.hasKey("iqamaDelayMinutes"))
                editor.putInt("iqamaDelayMinutes", config.getInt("iqamaDelayMinutes"));

            // Per-prayer iqama toggles
            if (config.hasKey("iqamaFajrEnabled"))
                editor.putBoolean("iqama_fajr_enabled", config.getBoolean("iqamaFajrEnabled"));
            if (config.hasKey("iqamaDhuhrEnabled"))
                editor.putBoolean("iqama_dhuhr_enabled", config.getBoolean("iqamaDhuhrEnabled"));
            if (config.hasKey("iqamaAsrEnabled"))
                editor.putBoolean("iqama_asr_enabled", config.getBoolean("iqamaAsrEnabled"));
            if (config.hasKey("iqamaMaghribEnabled"))
                editor.putBoolean("iqama_maghrib_enabled", config.getBoolean("iqamaMaghribEnabled"));
            if (config.hasKey("iqamaIshaEnabled"))
                editor.putBoolean("iqama_isha_enabled", config.getBoolean("iqamaIshaEnabled"));

            editor.apply();

            Log.d(TAG, "Saved Azan + Iqama Configuration to SharedPreferences");

            // Re-calculate and schedule the daisy chain immediately
            PrayerTimeCalculator.scheduleNextAzan(context);

            promise.resolve("Configuration saved and background azan scheduled.");
        } catch (Exception e) {
            Log.e(TAG, "Error saving configuration: " + e.getMessage(), e);
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void cancelAllAlarms(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            SharedPreferences prefs = context.getSharedPreferences("SakinahTimeAzanConfig", Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();

            // Disable all azan configuration natively
            editor.putBoolean("azanEnabled", false);
            editor.apply();

            // Note: In an ideal world we would clear out the Exact Alarm from AlarmManager
            // For now, next time calculator runs, it will abort scheduling due to
            // azanEnabled = false

            promise.resolve("Cancelled all native alarms via configuration update");
        } catch (Exception e) {
            Log.e(TAG, "Error cancelling alarms: " + e.getMessage(), e);
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopAzan(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            Intent stopIntent = new Intent(context, AzanAudioService.class);
            stopIntent.setAction("STOP_AZAN");
            context.startService(stopIntent);

            promise.resolve("Stop Azan intent sent to AzanAudioService");
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Time Machine: Schedule a real AlarmClock for azanDelaySeconds from now.
     * Exercises the FULL native pipeline: AlarmManager → PrayerAlarmReceiver →
     * AzanAudioService → IqamaReceiver.
     * Uses request code 9999 to avoid overwriting real prayer alarms.
     */
    @ReactMethod
    public void testNativeAzanPipeline(String prayerName, int azanDelaySeconds, int iqamaDelaySeconds,
            Promise promise) {
        try {
            Context context = getReactApplicationContext();

            // 1. Inject the Time Machine override for the Iqama Sidecar
            SharedPreferences prefs = context.getSharedPreferences("SakinahTimeAzanConfig", Context.MODE_PRIVATE);
            prefs.edit()
                    .putInt("TEST_iqama_delay_seconds", iqamaDelaySeconds)
                    .putBoolean("iqamaEnabled", true)
                    .apply();

            // 2. Build the exact Intent the OS will deliver in production
            Intent intent = new Intent(context, PrayerAlarmReceiver.class);
            intent.putExtra("prayer_name", prayerName);
            intent.putExtra("play_azan", true);

            PendingIntent pi = PendingIntent.getBroadcast(
                    context,
                    9999,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            // 3. Schedule the exact AlarmClock for N seconds from NOW
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            long triggerTime = System.currentTimeMillis() + (azanDelaySeconds * 1000L);

            PendingIntent showIntent = PendingIntent.getActivity(
                    context, 0, new Intent(), PendingIntent.FLAG_IMMUTABLE);
            AlarmManager.AlarmClockInfo info = new AlarmManager.AlarmClockInfo(triggerTime, showIntent);

            if (am != null)
                am.setAlarmClock(info, pi);

            Log.d(TAG, "⏱️ Time Machine: Azan in " + azanDelaySeconds + "s, Iqama " + iqamaDelaySeconds + "s later for "
                    + prayerName);
            promise.resolve("Test Pipeline Triggered: Azan in " + azanDelaySeconds + "s, Iqama " + iqamaDelaySeconds
                    + "s later.");
        } catch (Exception e) {
            Log.e(TAG, "Time Machine failed: " + e.getMessage(), e);
            promise.reject("TEST_ERROR", e.getMessage());
        }
    }
}
