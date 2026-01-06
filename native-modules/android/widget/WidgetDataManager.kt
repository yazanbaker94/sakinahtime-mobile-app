package com.sakinahtime.app.widget

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject

/**
 * Manages reading and writing widget data to SharedPreferences
 */
class WidgetDataManager(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(
        WidgetPrefs.PREFS_NAME,
        Context.MODE_PRIVATE
    )
    
    // Prayer Times
    fun savePrayerTimes(prayerTimesJson: String, locationName: String) {
        prefs.edit()
            .putString(WidgetPrefs.KEY_PRAYER_TIMES, prayerTimesJson)
            .putString(WidgetPrefs.KEY_LOCATION_NAME, locationName)
            .putLong(WidgetPrefs.KEY_LAST_UPDATED, System.currentTimeMillis())
            .apply()
    }
    
    fun getPrayerTimes(): PrayerTimesData? {
        val json = prefs.getString(WidgetPrefs.KEY_PRAYER_TIMES, null) ?: return null
        return try {
            val obj = JSONObject(json)
            PrayerTimesData(
                fajr = obj.optString("fajr", ""),
                sunrise = obj.optString("sunrise", ""),
                dhuhr = obj.optString("dhuhr", ""),
                asr = obj.optString("asr", ""),
                maghrib = obj.optString("maghrib", ""),
                isha = obj.optString("isha", ""),
                date = obj.optString("date", ""),
                timezone = obj.optString("timezone", "")
            )
        } catch (e: Exception) {
            null
        }
    }
    
    fun getLocationName(): String {
        return prefs.getString(WidgetPrefs.KEY_LOCATION_NAME, "") ?: ""
    }
    
    // Hijri Date
    fun saveHijriDate(hijriDateJson: String, eventName: String?, fastingType: String?) {
        prefs.edit()
            .putString(WidgetPrefs.KEY_HIJRI_DATE, hijriDateJson)
            .putString(WidgetPrefs.KEY_TODAY_EVENT, eventName)
            .putString(WidgetPrefs.KEY_TODAY_FASTING, fastingType)
            .apply()
    }
    
    fun getHijriDate(): HijriDateData? {
        val json = prefs.getString(WidgetPrefs.KEY_HIJRI_DATE, null) ?: return null
        return try {
            val obj = JSONObject(json)
            HijriDateData(
                day = obj.optInt("day", 1),
                month = obj.optInt("month", 1),
                year = obj.optInt("year", 1446),
                monthNameAr = obj.optString("monthNameAr", ""),
                monthNameEn = obj.optString("monthNameEn", ""),
                gregorianDate = obj.optString("gregorianDate", ""),
                moonPhase = obj.optString("moonPhase", ""),
                moonIcon = obj.optString("moonIcon", "🌙")
            )
        } catch (e: Exception) {
            null
        }
    }
    
    fun getTodayEvent(): String? {
        return prefs.getString(WidgetPrefs.KEY_TODAY_EVENT, null)
    }
    
    fun getTodayFasting(): String? {
        return prefs.getString(WidgetPrefs.KEY_TODAY_FASTING, null)
    }
    
    // Daily Verse
    fun saveDailyVerse(verseJson: String) {
        prefs.edit()
            .putString(WidgetPrefs.KEY_DAILY_VERSE, verseJson)
            .putString(WidgetPrefs.KEY_VERSE_DATE, java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date()))
            .apply()
    }
    
    fun getDailyVerse(): DailyVerseData? {
        val json = prefs.getString(WidgetPrefs.KEY_DAILY_VERSE, null) ?: return null
        return try {
            val obj = JSONObject(json)
            DailyVerseData(
                surah = obj.optInt("surah", 1),
                ayah = obj.optInt("ayah", 1),
                surahNameAr = obj.optString("surahNameAr", ""),
                surahNameEn = obj.optString("surahNameEn", ""),
                textAr = obj.optString("textAr", ""),
                textEn = obj.optString("textEn", ""),
                verseKey = obj.optString("verseKey", "1:1")
            )
        } catch (e: Exception) {
            null
        }
    }
    
    fun getVerseDate(): String? {
        return prefs.getString(WidgetPrefs.KEY_VERSE_DATE, null)
    }
    
    // Tasbeeh
    fun saveTasbeehCount(count: Int, target: Int, dhikr: String) {
        prefs.edit()
            .putInt(WidgetPrefs.KEY_TASBEEH_COUNT, count)
            .putInt(WidgetPrefs.KEY_TASBEEH_TARGET, target)
            .putString(WidgetPrefs.KEY_TASBEEH_DHIKR, dhikr)
            .apply()
    }
    
    fun getTasbeehCount(): Int {
        return prefs.getInt(WidgetPrefs.KEY_TASBEEH_COUNT, 0)
    }
    
    fun getTasbeehTarget(): Int {
        return prefs.getInt(WidgetPrefs.KEY_TASBEEH_TARGET, 33)
    }
    
    fun getTasbeehDhikr(): String {
        return prefs.getString(WidgetPrefs.KEY_TASBEEH_DHIKR, "سبحان الله") ?: "سبحان الله"
    }
    
    fun incrementTasbeeh(): Int {
        val current = getTasbeehCount()
        val newCount = current + 1
        prefs.edit().putInt(WidgetPrefs.KEY_TASBEEH_COUNT, newCount).apply()
        return newCount
    }
    
    fun resetTasbeeh() {
        prefs.edit().putInt(WidgetPrefs.KEY_TASBEEH_COUNT, 0).apply()
    }
    
    // Theme
    fun getTheme(): String {
        return prefs.getString(WidgetPrefs.KEY_THEME, "system") ?: "system"
    }
    
    fun setTheme(theme: String) {
        prefs.edit().putString(WidgetPrefs.KEY_THEME, theme).apply()
    }
}

// Data classes
data class PrayerTimesData(
    val fajr: String,
    val sunrise: String,
    val dhuhr: String,
    val asr: String,
    val maghrib: String,
    val isha: String,
    val date: String,
    val timezone: String
)

data class HijriDateData(
    val day: Int,
    val month: Int,
    val year: Int,
    val monthNameAr: String,
    val monthNameEn: String,
    val gregorianDate: String,
    val moonPhase: String,
    val moonIcon: String
)

data class DailyVerseData(
    val surah: Int,
    val ayah: Int,
    val surahNameAr: String,
    val surahNameEn: String,
    val textAr: String,
    val textEn: String,
    val verseKey: String
)
