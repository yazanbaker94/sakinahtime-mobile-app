package com.sakinahtime.app.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import androidx.work.*
import com.sakinahtime.app.widget.prayer.PrayerTimesWidget
import com.sakinahtime.app.widget.hijri.HijriDateWidget
import java.util.concurrent.TimeUnit

/**
 * WorkManager worker for periodic widget updates
 * Updates prayer countdown and checks for date changes
 */
class WidgetUpdateWorker(
    private val context: Context,
    workerParams: WorkerParameters
) : Worker(context, workerParams) {

    override fun doWork(): Result {
        return try {
            // Update prayer times widget (for countdown)
            updateWidget(PrayerTimesWidget::class.java)
            
            // Update hijri date widget (in case date changed)
            updateWidget(HijriDateWidget::class.java)
            
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }

    private fun <T> updateWidget(widgetClass: Class<T>) {
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

    companion object {
        private const val WORK_NAME = "widget_update_work"
        
        /**
         * Schedule periodic widget updates
         */
        fun schedule(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiresBatteryNotLow(true)
                .build()
            
            val updateRequest = PeriodicWorkRequestBuilder<WidgetUpdateWorker>(
                15, TimeUnit.MINUTES
            )
                .setConstraints(constraints)
                .setInitialDelay(1, TimeUnit.MINUTES)
                .build()
            
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                updateRequest
            )
        }
        
        /**
         * Cancel scheduled updates
         */
        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }
        
        /**
         * Trigger immediate update
         */
        fun updateNow(context: Context) {
            val updateRequest = OneTimeWorkRequestBuilder<WidgetUpdateWorker>()
                .build()
            
            WorkManager.getInstance(context).enqueue(updateRequest)
        }
    }
}
