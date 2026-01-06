package com.sakinahtime.app.widget.hijri

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.RemoteViews
import com.sakinahtime.app.MainActivity
import com.sakinahtime.app.R
import com.sakinahtime.app.widget.WidgetDataManager
import com.sakinahtime.app.widget.WidgetPrefs
import java.text.SimpleDateFormat
import java.util.*

/**
 * Hijri Date Widget Provider
 * Displays current Islamic date with moon phase
 */
class HijriDateWidget : AppWidgetProvider() {

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
        
        if (intent.action == WidgetPrefs.ACTION_UPDATE_HIJRI ||
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
            val hijriDate = dataManager.getHijriDate()
            val todayEvent = dataManager.getTodayEvent()
            val todayFasting = dataManager.getTodayFasting()
            
            // Determine widget size
            val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
            val minWidth = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH)
            val isSmall = minWidth < 200
            
            val layoutId = if (isSmall) {
                R.layout.widget_hijri_date_small
            } else {
                R.layout.widget_hijri_date_medium
            }
            
            val views = RemoteViews(context.packageName, layoutId)
            
            // Set click intent to open app (Hijri Calendar screen)
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("screen", "hijri_calendar")
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                1,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
            
            if (hijriDate != null) {
                // Moon icon
                views.setTextViewText(R.id.moon_icon, hijriDate.moonIcon)
                
                // Gregorian date
                val gregorianFormatted = formatGregorianDate(hijriDate.gregorianDate, isSmall)
                views.setTextViewText(R.id.gregorian_date, gregorianFormatted)
                
                if (isSmall) {
                    // Small widget
                    views.setTextViewText(R.id.hijri_date, "${hijriDate.day} ${hijriDate.monthNameEn}")
                    views.setTextViewText(R.id.hijri_year, "${hijriDate.year} AH")
                } else {
                    // Medium widget
                    views.setTextViewText(R.id.hijri_date, "${hijriDate.day} ${hijriDate.monthNameEn} ${hijriDate.year}")
                    try {
                        views.setTextViewText(R.id.hijri_date_ar, "${toArabicNumerals(hijriDate.day)} ${hijriDate.monthNameAr} ${toArabicNumerals(hijriDate.year)}")
                    } catch (e: Exception) {
                        // hijri_date_ar may not exist in all layouts
                    }
                }
                
                // Event/Fasting badge
                val badgeText = when {
                    todayEvent != null -> todayEvent
                    todayFasting != null -> getFastingLabel(todayFasting)
                    else -> null
                }
                
                if (badgeText != null) {
                    views.setTextViewText(R.id.event_badge, badgeText)
                    views.setViewVisibility(R.id.event_badge, View.VISIBLE)
                } else {
                    views.setViewVisibility(R.id.event_badge, View.GONE)
                }
            } else {
                // No data - show placeholder
                views.setTextViewText(R.id.moon_icon, "🌙")
                views.setTextViewText(R.id.gregorian_date, formatGregorianDate(null, isSmall))
                
                if (isSmall) {
                    views.setTextViewText(R.id.hijri_date, context.getString(R.string.open_app))
                    views.setTextViewText(R.id.hijri_year, "")
                } else {
                    views.setTextViewText(R.id.hijri_date, context.getString(R.string.open_app))
                    try {
                        views.setTextViewText(R.id.hijri_date_ar, "")
                    } catch (e: Exception) {
                        // hijri_date_ar may not exist in all layouts
                    }
                }
                views.setViewVisibility(R.id.event_badge, View.GONE)
            }
            
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
        
        private fun formatGregorianDate(dateStr: String?, isShort: Boolean): String {
            return try {
                val date = if (dateStr != null) {
                    SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(dateStr)
                } else {
                    Date()
                }
                
                val format = if (isShort) {
                    SimpleDateFormat("MMM d, yyyy", Locale.US)
                } else {
                    SimpleDateFormat("EEEE, MMMM d, yyyy", Locale.US)
                }
                format.format(date ?: Date())
            } catch (e: Exception) {
                SimpleDateFormat("MMM d, yyyy", Locale.US).format(Date())
            }
        }
        
        private fun toArabicNumerals(number: Int): String {
            val arabicDigits = charArrayOf('٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩')
            return number.toString().map { arabicDigits[it - '0'] }.joinToString("")
        }
        
        private fun getFastingLabel(type: String): String {
            return when (type) {
                "monday" -> "Monday Fast"
                "thursday" -> "Thursday Fast"
                "white_day" -> "White Day"
                "ashura" -> "Ashura"
                "arafah" -> "Arafah"
                "shawwal" -> "Shawwal"
                else -> "Fasting Day"
            }
        }
    }
}
