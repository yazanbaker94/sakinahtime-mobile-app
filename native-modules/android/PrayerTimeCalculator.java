package com.sakinahtime.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.batoulapps.adhan.CalculationMethod;
import com.batoulapps.adhan.CalculationParameters;
import com.batoulapps.adhan.Coordinates;
import com.batoulapps.adhan.Madhab;
import com.batoulapps.adhan.Prayer;
import com.batoulapps.adhan.PrayerTimes;
import com.batoulapps.adhan.data.DateComponents;

import java.util.Date;
import java.util.Calendar;
import java.util.TimeZone;

public class PrayerTimeCalculator {
    private static final String TAG = "PrayerTimeCalculator";

    public static void scheduleNextAzan(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("SakinahTimeAzanConfig", Context.MODE_PRIVATE);

            if (!prefs.contains("latitude") || !prefs.contains("longitude")
                    || !prefs.getBoolean("azanEnabled", false)) {
                Log.d(TAG, "Azan scheduling aborted: Configuration missing or azan disabled.");
                return;
            }

            double latitude = prefs.getFloat("latitude", 0);
            double longitude = prefs.getFloat("longitude", 0);
            String calcMethodStr = prefs.getString("calculationMethod", "MUSLIM_WORLD_LEAGUE");
            String madhabStr = prefs.getString("madhab", "SHAFI");

            boolean fajrEnabled = prefs.getBoolean("fajrEnabled", true);
            boolean dhuhrEnabled = prefs.getBoolean("dhuhrEnabled", true);
            boolean asrEnabled = prefs.getBoolean("asrEnabled", true);
            boolean maghribEnabled = prefs.getBoolean("maghribEnabled", true);
            boolean ishaEnabled = prefs.getBoolean("ishaEnabled", true);

            Coordinates coordinates = new Coordinates(latitude, longitude);
            CalculationParameters params = getCalculationMethod(calcMethodStr).getParameters();
            params.madhab = getMadhab(madhabStr);

            Date now = new Date();
            Calendar cal = Calendar.getInstance();
            cal.setTime(now);

            // Try today first
            DateComponents today = DateComponents.from(now);
            PrayerTimes prayerTimesToday = new PrayerTimes(coordinates, today, params);

            NextPrayerResult next = findNextEnabledPrayer(prayerTimesToday, now, fajrEnabled, dhuhrEnabled, asrEnabled,
                    maghribEnabled, ishaEnabled);

            if (next == null) {
                // All enabled prayers for today have passed, look at tomorrow
                cal.add(Calendar.DAY_OF_MONTH, 1);
                DateComponents tomorrow = DateComponents.from(cal.getTime());
                PrayerTimes prayerTimesTomorrow = new PrayerTimes(coordinates, tomorrow, params);

                next = findNextEnabledPrayer(prayerTimesTomorrow, now, fajrEnabled, dhuhrEnabled, asrEnabled,
                        maghribEnabled, ishaEnabled);
            }

            if (next != null) {
                Log.d(TAG, "Next prayer: " + next.name + " at " + next.time.toString());
                NativeAlarmScheduler.scheduleAlarm(context, next.name, next.time.getTime());
            } else {
                Log.w(TAG, "No next prayer found. Are all prayers disabled?");
            }

        } catch (Exception e) {
            Log.e(TAG, "Error calculating next azan: " + e.getMessage(), e);
        }
    }

    private static class NextPrayerResult {
        String name;
        Date time;

        NextPrayerResult(String name, Date time) {
            this.name = name;
            this.time = time;
        }
    }

    private static NextPrayerResult findNextEnabledPrayer(PrayerTimes times, Date now, boolean... enabledArgs) {
        // enabledArgs index: 0=Fajr, 1=Dhuhr, 2=Asr, 3=Maghrib, 4=Isha
        if (enabledArgs[0] && times.fajr.after(now))
            return new NextPrayerResult("Fajr", times.fajr);
        if (enabledArgs[1] && times.dhuhr.after(now))
            return new NextPrayerResult("Dhuhr", times.dhuhr);
        if (enabledArgs[2] && times.asr.after(now))
            return new NextPrayerResult("Asr", times.asr);
        if (enabledArgs[3] && times.maghrib.after(now))
            return new NextPrayerResult("Maghrib", times.maghrib);
        if (enabledArgs[4] && times.isha.after(now))
            return new NextPrayerResult("Isha", times.isha);
        return null;
    }

    private static CalculationMethod getCalculationMethod(String method) {
        switch (method) {
            case "KARACHI":
                return CalculationMethod.KARACHI;
            case "EGYPTIAN":
                return CalculationMethod.EGYPTIAN;
            case "MAKKAH":
                return CalculationMethod.UMM_AL_QURA;
            case "ISNA":
                return CalculationMethod.NORTH_AMERICA;
            default:
                return CalculationMethod.MUSLIM_WORLD_LEAGUE;
        }
    }

    private static Madhab getMadhab(String madhab) {
        switch (madhab) {
            case "HANAFI":
                return Madhab.HANAFI;
            default:
                return Madhab.SHAFI; // Shafi, Maliki, Hanbali
        }
    }
}
