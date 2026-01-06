package com.sakinahtime.app.widget

/**
 * SharedPreferences constants for widget data storage
 */
object WidgetPrefs {
    const val PREFS_NAME = "sakinahtime_widget_data"
    
    // Prayer Times
    const val KEY_PRAYER_TIMES = "prayer_times_json"
    const val KEY_LOCATION_NAME = "location_name"
    const val KEY_CALCULATION_METHOD = "calculation_method"
    
    // Hijri Date
    const val KEY_HIJRI_DATE = "hijri_date_json"
    const val KEY_TODAY_EVENT = "today_event"
    const val KEY_TODAY_FASTING = "today_fasting"
    
    // Daily Verse
    const val KEY_DAILY_VERSE = "daily_verse_json"
    const val KEY_VERSE_DATE = "verse_date"
    
    // Tasbeeh
    const val KEY_TASBEEH_COUNT = "tasbeeh_count"
    const val KEY_TASBEEH_TARGET = "tasbeeh_target"
    const val KEY_TASBEEH_DHIKR = "tasbeeh_dhikr"
    
    // Meta
    const val KEY_LAST_UPDATED = "last_updated"
    const val KEY_THEME = "widget_theme"
    
    // Widget Actions
    const val ACTION_UPDATE_PRAYER = "com.sakinahtime.UPDATE_PRAYER_WIDGET"
    const val ACTION_UPDATE_HIJRI = "com.sakinahtime.UPDATE_HIJRI_WIDGET"
    const val ACTION_UPDATE_VERSE = "com.sakinahtime.UPDATE_VERSE_WIDGET"
    const val ACTION_UPDATE_TASBEEH = "com.sakinahtime.UPDATE_TASBEEH_WIDGET"
    const val ACTION_TASBEEH_INCREMENT = "com.sakinahtime.TASBEEH_INCREMENT"
    const val ACTION_TASBEEH_RESET = "com.sakinahtime.TASBEEH_RESET"
    const val ACTION_VERSE_REFRESH = "com.sakinahtime.VERSE_REFRESH"
}
