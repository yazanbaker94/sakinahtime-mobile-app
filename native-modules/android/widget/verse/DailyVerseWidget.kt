package com.sakinahtime.app.widget.verse

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.sakinahtime.app.MainActivity
import com.sakinahtime.app.R
import com.sakinahtime.app.widget.WidgetDataManager
import com.sakinahtime.app.widget.WidgetPrefs

/**
 * Daily Verse Widget Provider
 * Displays a Quran verse for daily reflection
 */
class DailyVerseWidget : AppWidgetProvider() {

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
        
        when (intent.action) {
            WidgetPrefs.ACTION_UPDATE_VERSE,
            AppWidgetManager.ACTION_APPWIDGET_UPDATE -> {
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val appWidgetIds = intent.getIntArrayExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS)
                
                if (appWidgetIds != null) {
                    onUpdate(context, appWidgetManager, appWidgetIds)
                }
            }
            WidgetPrefs.ACTION_VERSE_REFRESH -> {
                // Handle refresh button click
                val appWidgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, -1)
                if (appWidgetId != -1) {
                    // Generate new random verse
                    val dataManager = WidgetDataManager(context)
                    val newVerse = generateRandomVerse()
                    dataManager.saveDailyVerse(newVerse)
                    
                    val appWidgetManager = AppWidgetManager.getInstance(context)
                    updateAppWidget(context, appWidgetManager, appWidgetId)
                }
            }
        }
    }

    companion object {
        // Sample verses for widget (subset of popular verses)
        private val SAMPLE_VERSES = listOf(
            VerseData(1, 1, "الفاتحة", "Al-Fatihah", "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "In the name of Allah, the Most Gracious, the Most Merciful"),
            VerseData(2, 255, "البقرة", "Al-Baqarah", "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ", "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence"),
            VerseData(2, 286, "البقرة", "Al-Baqarah", "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", "Allah does not burden a soul beyond that it can bear"),
            VerseData(3, 139, "آل عمران", "Ali 'Imran", "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ", "So do not weaken and do not grieve, and you will be superior"),
            VerseData(13, 28, "الرعد", "Ar-Ra'd", "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", "Verily, in the remembrance of Allah do hearts find rest"),
            VerseData(94, 5, "الشرح", "Ash-Sharh", "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", "For indeed, with hardship comes ease"),
            VerseData(94, 6, "الشرح", "Ash-Sharh", "إِنَّ مَعَ الْعُسْرِ يُسْرًا", "Indeed, with hardship comes ease"),
            VerseData(112, 1, "الإخلاص", "Al-Ikhlas", "قُلْ هُوَ اللَّهُ أَحَدٌ", "Say, He is Allah, the One"),
            VerseData(55, 13, "الرحمن", "Ar-Rahman", "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ", "So which of the favors of your Lord would you deny?"),
            VerseData(67, 2, "الملك", "Al-Mulk", "الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ", "He who created death and life to test you"),
            VerseData(49, 13, "الحجرات", "Al-Hujurat", "إِنَّ أَكْرَمَكُمْ عِندَ اللَّهِ أَتْقَاكُمْ", "Indeed, the most noble of you in the sight of Allah is the most righteous"),
            VerseData(16, 97, "النحل", "An-Nahl", "مَنْ عَمِلَ صَالِحًا مِّن ذَكَرٍ أَوْ أُنثَىٰ وَهُوَ مُؤْمِنٌ", "Whoever does righteousness, whether male or female, while being a believer"),
        )
        
        data class VerseData(
            val surah: Int,
            val ayah: Int,
            val surahNameAr: String,
            val surahNameEn: String,
            val textAr: String,
            val textEn: String
        )
        
        fun generateRandomVerse(): String {
            val verse = SAMPLE_VERSES.random()
            return """{"surah":${verse.surah},"ayah":${verse.ayah},"surahNameAr":"${verse.surahNameAr}","surahNameEn":"${verse.surahNameEn}","textAr":"${verse.textAr}","textEn":"${verse.textEn}","verseKey":"${verse.surah}:${verse.ayah}"}"""
        }
        
        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val dataManager = WidgetDataManager(context)
            var verse = dataManager.getDailyVerse()
            
            // If no verse saved, generate one
            if (verse == null) {
                dataManager.saveDailyVerse(generateRandomVerse())
                verse = dataManager.getDailyVerse()
            }
            
            val views = RemoteViews(context.packageName, R.layout.widget_daily_verse)
            
            // Set click intent to open app at verse
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("screen", "mushaf")
                putExtra("surah", verse?.surah ?: 1)
                putExtra("ayah", verse?.ayah ?: 1)
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                2,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
            
            // Set refresh button intent
            val refreshIntent = Intent(context, DailyVerseWidget::class.java).apply {
                action = WidgetPrefs.ACTION_VERSE_REFRESH
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            }
            val refreshPendingIntent = PendingIntent.getBroadcast(
                context,
                appWidgetId,
                refreshIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.refresh_button, refreshPendingIntent)
            
            if (verse != null) {
                views.setTextViewText(R.id.verse_arabic, verse.textAr)
                views.setTextViewText(R.id.verse_english, verse.textEn)
                views.setTextViewText(R.id.verse_reference, "${verse.surahNameEn} ${verse.verseKey}")
            } else {
                views.setTextViewText(R.id.verse_arabic, "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ")
                views.setTextViewText(R.id.verse_english, "In the name of Allah, the Most Gracious, the Most Merciful")
                views.setTextViewText(R.id.verse_reference, "Al-Fatihah 1:1")
            }
            
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
