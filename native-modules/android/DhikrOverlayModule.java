package com.sakinahtime.app;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONObject;

public class DhikrOverlayModule extends ReactContextBaseJavaModule {
    public static final String NAME = "DhikrOverlayModule";
    private static ReactApplicationContext reactContextInstance;

    public DhikrOverlayModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContextInstance = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    public static void emitEvent(String eventName, WritableMap params) {
        if (reactContextInstance != null && reactContextInstance.hasActiveCatalystInstance()) {
            reactContextInstance.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(eventName, params);
        }
    }

    @ReactMethod
    public void checkOverlayPermission(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(getReactApplicationContext()));
        } else {
            promise.resolve(true);
        }
    }

    @ReactMethod
    public void requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getReactApplicationContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getReactApplicationContext().startActivity(intent);
        }
    }

    @ReactMethod
    public void startService(ReadableMap config, Promise promise) {
        try {
            Context context = getReactApplicationContext();

            // Save config to SharedPreferences for Receiver/Boot autonomy
            SharedPreferences prefs = context.getSharedPreferences("DhikrPrefs", Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();

            editor.putBoolean("isEnabled", true);
            editor.putInt("intervalMinutes", config.hasKey("intervalMinutes") ? config.getInt("intervalMinutes") : 60);
            editor.putInt("autoDismissSeconds",
                    config.hasKey("autoDismissSeconds") ? config.getInt("autoDismissSeconds") : 15);
            editor.putBoolean("quietHoursEnabled",
                    config.hasKey("quietHoursEnabled") && config.getBoolean("quietHoursEnabled"));
            editor.putInt("quietHoursStart", config.hasKey("quietHoursStart") ? config.getInt("quietHoursStart") : 22);
            editor.putInt("quietHoursEnd", config.hasKey("quietHoursEnd") ? config.getInt("quietHoursEnd") : 6);

            if (config.hasKey("themeColors")) {
                ReadableMap colors = config.getMap("themeColors");
                editor.putString("color_primary", colors.getString("primary"));
                editor.putString("color_background", colors.getString("background"));
                editor.putString("color_text", colors.getString("text"));
                editor.putString("color_textSecondary", colors.getString("textSecondary"));
            }
            editor.apply();

            Intent serviceIntent = new Intent(context, DhikrForegroundService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }

            // Kickstart the daisy chain
            DhikrAlarmReceiver.scheduleNextAlarm(context);

            emitEvent("onServiceStarted", Arguments.createMap());
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("START_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopService(Promise promise) {
        Context context = getReactApplicationContext();
        SharedPreferences prefs = context.getSharedPreferences("DhikrPrefs", Context.MODE_PRIVATE);
        prefs.edit().putBoolean("isEnabled", false).apply();

        DhikrAlarmReceiver.cancelAlarm(context);

        Intent serviceIntent = new Intent(context, DhikrForegroundService.class);
        context.stopService(serviceIntent);

        emitEvent("onServiceStopped", Arguments.createMap());
        promise.resolve(null);
    }

    @ReactMethod
    public void showOverlayNow(ReadableMap dhikrData) {
        Context context = getReactApplicationContext();
        Intent intent = new Intent(context, DhikrForegroundService.class);
        intent.setAction(DhikrForegroundService.ACTION_SHOW_OVERLAY);

        // Convert JS Map to JSON string for the Intent
        try {
            JSONObject data = new JSONObject();
            data.put("id", dhikrData.getString("id"));
            data.put("arabic", dhikrData.getString("arabic"));
            data.put("transliteration", dhikrData.getString("transliteration"));
            data.put("meaning", dhikrData.getString("meaning"));
            if (dhikrData.hasKey("source"))
                data.put("source", dhikrData.getString("source"));

            // Allow per-dhikr color overrides
            if (dhikrData.hasKey("colorPrimary"))
                data.put("colorPrimary", dhikrData.getString("colorPrimary"));
            if (dhikrData.hasKey("colorBackground"))
                data.put("colorBackground", dhikrData.getString("colorBackground"));

            intent.putExtra("dhikr_data", data.toString());
        } catch (Exception e) {
            e.printStackTrace();
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    @ReactMethod
    public void isServiceRunning(Promise promise) {
        ActivityManager manager = (ActivityManager) getReactApplicationContext()
                .getSystemService(Context.ACTIVITY_SERVICE);
        for (ActivityManager.RunningServiceInfo service : manager.getRunningServices(Integer.MAX_VALUE)) {
            if (DhikrForegroundService.class.getName().equals(service.service.getClassName())) {
                promise.resolve(true);
                return;
            }
        }
        promise.resolve(false);
    }
}
