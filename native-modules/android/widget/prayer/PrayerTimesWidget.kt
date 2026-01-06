package com.sakinahtime.app.widget.prayer

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.RemoteViews
import com.sakinahtime.app.MainActivity
import com.sakinahtime.app.R
import com.sakinahtime.app.widget.WidgetDataManager
import com.sakinahtime.app.widget.WidgetPrefs

/**
 * Prayer Times Widget Provider
 * Displays prayer times and countdown to next prayer
 */
class PrayerTimesWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle?
    ) {
        updateAppWidget(context, appWidgetManager, appWidgetId)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        
        if (intent.action == WidgetPrefs.ACTION_UPDATE_PRAYER ||
            intent.action == AppWidgetManager.ACTION_APPWIDGET_UPDATE) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val appWidgetIds = intent.getIntArrayExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS)
            
            if (appWidgetIds != null) {
                onUpdate(context, appWidgetManager, appWidgetIds)
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
            val prayerTimes = dataManager.getPrayerTimes()
            val locationName = dataManager.getLocationName()
            
            // Determine widget size
            val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
            val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH)
            val isSmall = minWidth < 180
            
            val layoutId = if (isSmall) {
                R.layout.widget_prayer_times_small
            } else {
                R.layout.widget_prayer_times_medium
            }
            
            val views = RemoteViews(context.packageName, layoutId)
            
            // Set click intent to open app
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
            
            if (prayerTimes != null) {
                val nextPrayer = PrayerTimesHelper.getNextPrayer(prayerTimes)
                
                if (isSmall) {
                    // Small widget - just next prayer
                    views.setTextViewText(R.id.next_prayer_name, nextPrayer?.name ?: "")
                    views.setTextViewText(R.id.next_prayer_time, nextPrayer?.timeFormatted ?: "")
                    views.setTextViewText(
                        R.id.countdown,
                        nextPrayer?.let { PrayerTimesHelper.formatCountdown(it.minutesUntil) } ?: ""
                    )
                } else {
                    // Medium widget - all prayers
                    views.setTextViewText(R.id.location_name, if (locationName.isNotEmpty()) "📍 $locationName" else "")
                    
                    // Set prayer times
                    views.setTextViewText(R.id.fajr_time, formatShortTime(prayerTimes.fajr))
                    views.setTextViewText(R.id.dhuhr_time, formatShortTime(prayerTimes.dhuhr))
                    views.setTextViewText(R.id.asr_time, formatShortTime(prayerTimes.asr))
                    views.setTextViewText(R.id.maghrib_time, formatShortTime(prayerTimes.maghrib))
                    views.setTextViewText(R.id.isha_time, formatShortTime(prayerTimes.isha))
                    
                    // Set next prayer info
                    views.setTextViewText(R.id.next_prayer_name, nextPrayer?.name ?: "")
                    views.setTextViewText(
                        R.id.countdown,
                        nextPrayer?.let { PrayerTimesHelper.formatCountdown(it.minutesUntil) } ?: ""
                    )
                }
            } else {
                // No data available
                if (isSmall) {
                    views.setTextViewText(R.id.next_prayer_name, context.getString(R.string.no_data))
                    views.setTextViewText(R.id.next_prayer_time, "")
                    views.setTextViewText(R.id.countdown, context.getString(R.string.open_app))
                } else {
                    views.setTextViewText(R.id.location_name, "")
                    views.setTextViewText(R.id.fajr_time, "--:--")
                    views.setTextViewText(R.id.dhuhr_time, "--:--")
                    views.setTextViewText(R.id.asr_time, "--:--")
                    views.setTextViewText(R.id.maghrib_time, "--:--")
                    views.setTextViewText(R.id.isha_time, "--:--")
                    views.setTextViewText(R.id.next_prayer_name, context.getString(R.string.open_app))
                    views.setTextViewText(R.id.countdown, "")
                }
            }
            
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
        
        private fun formatShortTime(time: String): String {
            return try {
                val parts = time.split(":")
                val hours = parts[0].toInt()
                val minutes = parts[1].toInt()
                val displayHours = when {
                    hours == 0 -> 12
                    hours > 12 -> hours - 12
                    else -> hours
                }
                String.format("%d:%02d", displayHours, minutes)
            } catch (e: Exception) {
                time
            }
        }
    }
}
