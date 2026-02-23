package com.sakinahtime.app;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.view.animation.DecelerateInterpolator;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import org.json.JSONObject;

public class DhikrForegroundService extends Service {
    public static final String ACTION_SHOW_OVERLAY = "SHOW_OVERLAY_NOW";
    public static final String ACTION_SHOW_PERIODIC = "SHOW_PERIODIC_OVERLAY";
    private static final String CHANNEL_ID = "dhikr_service_channel";

    private WindowManager windowManager;
    private View overlayView;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private Runnable dismissRunnable;

    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        int iconId = getResources().getIdentifier("ic_notification", "mipmap", getPackageName());
        if (iconId == 0)
            iconId = android.R.drawable.ic_popup_reminder;

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Dhikr Reminders")
                .setContentText("May Allah bless your day with remembrance.")
                .setSmallIcon(iconId)
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .build();

        // Target API 34 compliance: Must specify Foreground Service Type
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(1002, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(1002, notification);
        }

        if (intent != null) {
            if (ACTION_SHOW_OVERLAY.equals(intent.getAction())) {
                String dhikrDataJson = intent.getStringExtra("dhikr_data");
                showOverlay(dhikrDataJson);
            } else if (ACTION_SHOW_PERIODIC.equals(intent.getAction())) {
                // Fallback dhikr for periodic display
                String defaultDhikr = "{\"id\":\"dhikr_auto\",\"arabic\":\"سُبْحَانَ اللَّهِ\",\"transliteration\":\"Subhanallah\",\"meaning\":\"Glory be to Allah\"}";
                showOverlay(defaultDhikr);
            }
        }

        return START_STICKY;
    }

    private void showOverlay(String dhikrDataJson) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this))
            return;

        // Prevent stacking
        if (overlayView != null)
            removeOverlay("replaced", "unknown", null);

        SharedPreferences prefs = getSharedPreferences("DhikrPrefs", Context.MODE_PRIVATE);

        String id = "unknown";
        String arabicTxt = "سُبْحَانَ اللَّهِ";
        String transliterationTxt = "Subhanallah";
        String meaningTxt = "Glory be to Allah";
        String sourceTxt = "";

        // Base theme from saved config
        String bgColorHex = prefs.getString("color_background", "#F2121212");
        String primaryHex = prefs.getString("color_primary", "#4CAF50");
        String textHex = prefs.getString("color_text", "#FFFFFF");
        String textSecHex = prefs.getString("color_textSecondary", "#AAAAAA");

        try {
            if (dhikrDataJson != null) {
                JSONObject obj = new JSONObject(dhikrDataJson);
                id = obj.optString("id", id);
                arabicTxt = obj.optString("arabic", arabicTxt);
                transliterationTxt = obj.optString("transliteration", transliterationTxt);
                meaningTxt = obj.optString("meaning", meaningTxt);
                sourceTxt = obj.optString("source", "");

                // Per-dhikr overrides
                bgColorHex = obj.optString("colorBackground", bgColorHex);
                primaryHex = obj.optString("colorPrimary", primaryHex);
            }
        } catch (Exception ignored) {
        }

        // --- PROGRAMMATIC UI CREATION ---
        LinearLayout container = new LinearLayout(this);
        container.setOrientation(LinearLayout.VERTICAL);

        GradientDrawable shape = new GradientDrawable();
        shape.setCornerRadius(dpToPx(24));
        shape.setColor(Color.parseColor(bgColorHex));
        shape.setStroke(dpToPx(1), Color.parseColor(primaryHex));
        container.setBackground(shape);

        int pad = dpToPx(24);
        container.setPadding(pad, pad, pad, pad);
        container.setGravity(Gravity.CENTER);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP)
            container.setElevation(dpToPx(16));

        // 1. Arabic Text
        TextView tvArabic = new TextView(this);
        tvArabic.setText(arabicTxt);
        tvArabic.setTextColor(Color.parseColor(textHex));
        tvArabic.setTextSize(TypedValue.COMPLEX_UNIT_SP, 28);
        tvArabic.setGravity(Gravity.CENTER);
        try {
            Typeface customFont = Typeface.createFromAsset(getAssets(), "fonts/AlMushafQuran.ttf");
            tvArabic.setTypeface(customFont);
        } catch (Exception e) {
            /* fallback to default */ }
        container.addView(tvArabic);

        // 2. Transliteration Text
        if (!transliterationTxt.isEmpty()) {
            TextView tvTrans = new TextView(this);
            tvTrans.setText(transliterationTxt);
            tvTrans.setTextColor(Color.parseColor(textSecHex));
            tvTrans.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
            tvTrans.setTypeface(null, Typeface.ITALIC);
            tvTrans.setGravity(Gravity.CENTER);
            tvTrans.setPadding(0, dpToPx(12), 0, 0);
            container.addView(tvTrans);
        }

        // 3. Meaning Text
        if (!meaningTxt.isEmpty()) {
            TextView tvMeaning = new TextView(this);
            tvMeaning.setText(meaningTxt);
            tvMeaning.setTextColor(Color.parseColor(textHex));
            tvMeaning.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
            tvMeaning.setGravity(Gravity.CENTER);
            tvMeaning.setPadding(0, dpToPx(4), 0, 0);
            container.addView(tvMeaning);
        }

        // 4. Source (Optional)
        if (!sourceTxt.isEmpty()) {
            TextView tvSource = new TextView(this);
            tvSource.setText(sourceTxt);
            tvSource.setTextColor(Color.parseColor(primaryHex));
            tvSource.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
            tvSource.setGravity(Gravity.CENTER);
            tvSource.setPadding(0, dpToPx(8), 0, 0);
            container.addView(tvSource);
        }

        LinearLayout wrapper = new LinearLayout(this);
        int margin = dpToPx(16);
        wrapper.setPadding(margin, margin, margin, margin);
        wrapper.addView(container, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT));

        overlayView = wrapper;

        // --- WINDOW MANAGER PARAMS ---
        int layoutFlag = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                layoutFlag,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT);

        params.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
        params.y = dpToPx(50); // Margin from top

        // Setup Swipe & Tap to dismiss
        setupTouchListener(overlayView, id);

        windowManager.addView(overlayView, params);

        // Beautiful Slide-in Animation
        overlayView.setTranslationY(-500f);
        overlayView.setAlpha(0f);
        overlayView.animate().translationY(0f).alpha(1f).setDuration(400)
                .setInterpolator(new DecelerateInterpolator()).start();

        WritableMap eventMap = Arguments.createMap();
        eventMap.putString("dhikrId", id);
        DhikrOverlayModule.emitEvent("onOverlayShown", eventMap);

        // Auto Dismiss Setup
        int autoDismissSecs = prefs.getInt("autoDismissSeconds", 15);
        final String finalId = id;
        dismissRunnable = () -> animateAndRemoveOverlay("timeout", finalId);
        mainHandler.postDelayed(dismissRunnable, autoDismissSecs * 1000L);
    }

    private void setupTouchListener(View view, String id) {
        view.setOnTouchListener(new View.OnTouchListener() {
            private float initialTouchY;
            private boolean moved = false;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialTouchY = event.getRawY();
                        moved = false;
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        float deltaY = event.getRawY() - initialTouchY;
                        if (Math.abs(deltaY) > 10)
                            moved = true;
                        if (deltaY < 0) { // Only allow swiping UP
                            view.setTranslationY(deltaY);
                            view.setAlpha(1f - (Math.abs(deltaY) / (view.getHeight() / 1.5f)));
                        }
                        return true;
                    case MotionEvent.ACTION_UP:
                        float finalDelta = event.getRawY() - initialTouchY;
                        if (finalDelta < -dpToPx(50)) {
                            animateAndRemoveOverlay("swipe", id);
                        } else if (!moved || Math.abs(finalDelta) < 10) {
                            animateAndRemoveOverlay("tap", id);
                        } else {
                            // Snap back
                            view.animate().translationY(0f).alpha(1f).setDuration(200).start();
                        }
                        return true;
                }
                return false;
            }
        });
    }

    private void animateAndRemoveOverlay(String method, String dhikrId) {
        if (overlayView != null) {
            mainHandler.removeCallbacks(dismissRunnable);
            View viewToRemove = overlayView;
            overlayView = null; // Prevent double trigger

            viewToRemove.animate()
                    .translationY(-300f).alpha(0f).setDuration(300)
                    .setListener(new AnimatorListenerAdapter() {
                        @Override
                        public void onAnimationEnd(Animator animation) {
                            removeOverlay(method, dhikrId, viewToRemove);
                        }
                    }).start();
        }
    }

    private void removeOverlay(String method, String dhikrId, View view) {
        if (view != null && windowManager != null) {
            try {
                windowManager.removeView(view);
            } catch (Exception ignored) {
            }
        } else if (overlayView != null && windowManager != null) {
            try {
                windowManager.removeView(overlayView);
            } catch (Exception ignored) {
            }
            overlayView = null;
        }

        if (dismissRunnable != null)
            mainHandler.removeCallbacks(dismissRunnable);

        if (dhikrId != null) {
            WritableMap eventMap = Arguments.createMap();
            eventMap.putString("dhikrId", dhikrId);
            eventMap.putString("method", method);
            DhikrOverlayModule.emitEvent("onOverlayDismissed", eventMap);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "Dhikr Service", NotificationManager.IMPORTANCE_MIN);
            channel.setShowBadge(false);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null)
                manager.createNotificationChannel(channel);
        }
    }

    private int dpToPx(int dp) {
        return (int) (dp * getResources().getDisplayMetrics().density);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (overlayView != null)
            removeOverlay("service_stopped", "unknown", null);
    }
}
