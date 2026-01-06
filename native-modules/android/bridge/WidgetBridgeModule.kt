package com.sakinahtime.app.bridge

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.sakinahtime.app.widget.WidgetDataManager
import com.sakinahtime.app.widget.WidgetPrefs
import com.sakinahtime.app.widget.prayer.PrayerTimesWidget
import com.sakinahtime.app.widget.hijri.HijriDateWidget
import com.sakinahtime.app.widget.verse.DailyVerseWidget
import com.sakinahtime.app.widget.tasbeeh.TasbeehWidget

class WidgetBridgeModule(private val reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {
    
    private val dataManager: WidgetDataManager by lazy {
        WidgetDataManager(reactContext)
    }
    
    override fun getName(): String = "WidgetBridge"
    
    @ReactMethod
    fun updatePrayerTimes(prayerTimesJson: String, locationName: String, promise: Promise) {
        try {
            dataManager.savePrayerTimes(prayerTimesJson, locationName)
            updateWidget(PrayerTimesWidget::class.java)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to update prayer times widget: ${e.message}")
        }
    }
    
    @ReactMethod
    fun updateHijriDate(hijriDateJson: String, eventName: String?, fastingType: String?, promise: Promise) {
        try {
            dataManager.saveHijriDate(hijriDateJson, eventName, fastingType)
            updateWidget(HijriDateWidget::class.java)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to update hijri date widget: ${e.message}")
        }
    }
    
    @ReactMethod
    fun updateDailyVerse(verseJson: String, promise: Promise) {
        try {
            dataManager.saveDailyVerse(verseJson)
            updateWidget(DailyVerseWidget::class.java)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to update daily verse widget: ${e.message}")
        }
    }
    
    @ReactMethod
    fun updateTasbeehCount(count: Int, target: Int, dhikr: String, promise: Promise) {
        try {
            dataManager.saveTasbeehCount(count, target, dhikr)
            updateWidget(TasbeehWidget::class.java)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to update tasbeeh widget: ${e.message}")
        }
    }
    
    @ReactMethod
    fun getTasbeehCount(promise: Promise) {
        try {
            val count = dataManager.getTasbeehCount()
            promise.resolve(count)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to get tasbeeh count: ${e.message}")
        }
    }
    
    @ReactMethod
    fun refreshAllWidgets(promise: Promise) {
        try {
            updateWidget(PrayerTimesWidget::class.java)
            updateWidget(HijriDateWidget::class.java)
            updateWidget(DailyVerseWidget::class.java)
            updateWidget(TasbeehWidget::class.java)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to refresh widgets: ${e.message}")
        }
    }
    
    private fun <T> updateWidget(widgetClass: Class<T>) {
        val context = reactContext.applicationContext
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val componentName = ComponentName(context, widgetClass)
        val widgetIds = appWidgetManager.getAppWidgetIds(componentName)
        
        if (widgetIds.isNotEmpty()) {
            val intent = Intent(context, widgetClass).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds)
            }
            context.sendBroadcast(intent)
        }
    }
}
