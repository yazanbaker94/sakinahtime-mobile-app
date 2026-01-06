package com.sakinahtime.app.widget.tasbeeh

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.widget.RemoteViews
import com.sakinahtime.app.R
import com.sakinahtime.app.widget.WidgetDataManager
import com.sakinahtime.app.widget.WidgetPrefs

/**
 * Tasbeeh Counter Widget Provider
 * Tap to count dhikr with haptic feedback
 */
class TasbeehWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        
        val appWidgetManager = AppWidgetManager.getInstance(context)
        
        when (intent.action) {
            WidgetPrefs.ACTION_TASBEEH_INCREMENT -> {
                val appWidgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, -1)
                if (appWidgetId != -1) {
                    val dataManager = WidgetDataManager(context)
                    val newCount = dataManager.incrementTasbeeh()
                    
                    // Haptic feedback
                    vibrate(context)
                    
                    updateAppWidget(context, appWidgetManager, appWidgetId)
                }
            }
            WidgetPrefs.ACTION_TASBEEH_RESET -> {
                val appWidgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, -1)
                if (appWidgetId != -1) {
                    val dataManager = WidgetDataManager(context)
                    dataManager.resetTasbeeh()
                    
                    // Longer haptic for reset
                    vibrate(context, 100)
                    
                    updateAppWidget(context, appWidgetManager, appWidgetId)
                }
            }
            WidgetPrefs.ACTION_UPDATE_TASBEEH,
            AppWidgetManager.ACTION_APPWIDGET_UPDATE -> {
                val appWidgetIds = intent.getIntArrayExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS)
                if (appWidgetIds != null) {
                    onUpdate(context, appWidgetManager, appWidgetIds)
                }
            }
        }
    }

    companion object {
        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val dataManager = WidgetDataManager(context)
            val count = dataManager.getTasbeehCount()
            val target = dataManager.getTasbeehTarget()
            val dhikr = dataManager.getTasbeehDhikr()
            
            val views = RemoteViews(context.packageName, R.layout.widget_tasbeeh)
            
            // Set count display
            views.setTextViewText(R.id.count, count.toString())
            views.setTextViewText(R.id.target, "/ $target")
            views.setTextViewText(R.id.dhikr, dhikr)
            
            // Change count color when target reached
            if (count >= target) {
                views.setTextColor(R.id.count, context.getColor(R.color.widget_event_gold))
            } else {
                views.setTextColor(R.id.count, context.getColor(R.color.widget_tasbeeh_count))
            }
            
            // Set tap area intent for increment
            val incrementIntent = Intent(context, TasbeehWidget::class.java).apply {
                action = WidgetPrefs.ACTION_TASBEEH_INCREMENT
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            }
            val incrementPendingIntent = PendingIntent.getBroadcast(
                context,
                appWidgetId * 10, // Unique request code
                incrementIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.tap_area, incrementPendingIntent)
            
            // Set reset button intent
            val resetIntent = Intent(context, TasbeehWidget::class.java).apply {
                action = WidgetPrefs.ACTION_TASBEEH_RESET
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            }
            val resetPendingIntent = PendingIntent.getBroadcast(
                context,
                appWidgetId * 10 + 1, // Different request code
                resetIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.reset_button, resetPendingIntent)
            
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
        
        private fun vibrate(context: Context, duration: Long = 30) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                    val vibrator = vibratorManager.defaultVibrator
                    vibrator.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        vibrator.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE))
                    } else {
                        @Suppress("DEPRECATION")
                        vibrator.vibrate(duration)
                    }
                }
            } catch (e: Exception) {
                // Ignore vibration errors
            }
        }
    }
}
