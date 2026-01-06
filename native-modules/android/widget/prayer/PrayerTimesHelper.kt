package com.sakinahtime.app.widget.prayer

import com.sakinahtime.app.widget.PrayerTimesData
import java.text.SimpleDateFormat
import java.util.*

/**
 * Helper class for prayer time calculations
 */
object PrayerTimesHelper {
    
    data class NextPrayer(
        val name: String,
        val time: String,
        val timeFormatted: String,
        val minutesUntil: Long
    )
    
    private val prayers = listOf("Fajr", "Dhuhr", "Asr", "Maghrib", "Isha")
    
    /**
     * Get the next prayer based on current time
     */
    fun getNextPrayer(prayerTimes: PrayerTimesData): NextPrayer? {
        val now = Calendar.getInstance()
        val currentMinutes = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)
        
        val times = mapOf(
            "Fajr" to prayerTimes.fajr,
            "Dhuhr" to prayerTimes.dhuhr,
            "Asr" to prayerTimes.asr,
            "Maghrib" to prayerTimes.maghrib,
            "Isha" to prayerTimes.isha
        )
        
        for (prayer in prayers) {
            val time = times[prayer] ?: continue
            val prayerMinutes = parseTimeToMinutes(time)
            
            if (prayerMinutes > currentMinutes) {
                return NextPrayer(
                    name = prayer,
                    time = time,
                    timeFormatted = formatTime(time),
                    minutesUntil = (prayerMinutes - currentMinutes).toLong()
                )
            }
        }
        
        // If all prayers passed, next is Fajr tomorrow
        val fajrMinutes = parseTimeToMinutes(prayerTimes.fajr)
        val minutesUntilFajr = (24 * 60 - currentMinutes) + fajrMinutes
        
        return NextPrayer(
            name = "Fajr",
            time = prayerTimes.fajr,
            timeFormatted = formatTime(prayerTimes.fajr),
            minutesUntil = minutesUntilFajr.toLong()
        )
    }
    
    /**
     * Parse time string (HH:mm) to minutes since midnight
     */
    fun parseTimeToMinutes(time: String): Int {
        return try {
            val parts = time.split(":")
            val hours = parts[0].toInt()
            val minutes = parts[1].toInt()
            hours * 60 + minutes
        } catch (e: Exception) {
            0
        }
    }
    
    /**
     * Format time to 12-hour format
     */
    fun formatTime(time: String): String {
        return try {
            val parts = time.split(":")
            val hours = parts[0].toInt()
            val minutes = parts[1].toInt()
            
            val period = if (hours >= 12) "PM" else "AM"
            val displayHours = when {
                hours == 0 -> 12
                hours > 12 -> hours - 12
                else -> hours
            }
            
            String.format("%d:%02d %s", displayHours, minutes, period)
        } catch (e: Exception) {
            time
        }
    }
    
    /**
     * Format countdown text
     */
    fun formatCountdown(minutesUntil: Long): String {
        return when {
            minutesUntil <= 0 -> "Now"
            minutesUntil < 60 -> "in ${minutesUntil}m"
            else -> {
                val hours = minutesUntil / 60
                val mins = minutesUntil % 60
                if (mins > 0) "in ${hours}h ${mins}m" else "in ${hours}h"
            }
        }
    }
    
    /**
     * Check if a prayer time has passed
     */
    fun isPrayerPast(time: String): Boolean {
        val now = Calendar.getInstance()
        val currentMinutes = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)
        val prayerMinutes = parseTimeToMinutes(time)
        return prayerMinutes < currentMinutes
    }
    
    /**
     * Get index of current/next prayer (0-4)
     */
    fun getCurrentPrayerIndex(prayerTimes: PrayerTimesData): Int {
        val times = listOf(
            prayerTimes.fajr,
            prayerTimes.dhuhr,
            prayerTimes.asr,
            prayerTimes.maghrib,
            prayerTimes.isha
        )
        
        for (i in times.indices) {
            if (!isPrayerPast(times[i])) {
                return i
            }
        }
        
        return 0 // Fajr tomorrow
    }
}
