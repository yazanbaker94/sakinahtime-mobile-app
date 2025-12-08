import { useQuery } from "@tanstack/react-query";

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
}

export interface HijriDate {
  day: string;
  weekday: { en: string; ar: string };
  month: { number: number; en: string; ar: string };
  year: string;
  designation: { abbreviated: string; expanded: string };
}

export interface GregorianDate {
  date: string;
  day: string;
  weekday: { en: string };
  month: { number: number; en: string };
  year: string;
}

export interface PrayerTimesData {
  timings: PrayerTimes;
  date: {
    hijri: HijriDate;
    gregorian: GregorianDate;
  };
  meta: {
    timezone: string;
  };
}

async function fetchPrayerTimes(latitude: number, longitude: number): Promise<PrayerTimesData> {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const url = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${latitude}&longitude=${longitude}&method=2`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error("Failed to fetch prayer times");
  }

  const data = await response.json();
  
  if (data.code !== 200 || !data.data) {
    throw new Error("Invalid response from prayer times API");
  }

  return data.data;
}

export function usePrayerTimes(latitude: number | null, longitude: number | null) {
  return useQuery({
    queryKey: ["prayerTimes", latitude, longitude],
    queryFn: () => {
      if (latitude === null || longitude === null) {
        throw new Error("Location not available");
      }
      return fetchPrayerTimes(latitude, longitude);
    },
    enabled: latitude !== null && longitude !== null,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 2,
  });
}

export function getNextPrayer(timings: PrayerTimes): { name: string; time: string; nameAr: string } | null {
  const prayers = [
    { name: "Fajr", nameAr: "الفجر", time: timings.Fajr },
    { name: "Dhuhr", nameAr: "الظهر", time: timings.Dhuhr },
    { name: "Asr", nameAr: "العصر", time: timings.Asr },
    { name: "Maghrib", nameAr: "المغرب", time: timings.Maghrib },
    { name: "Isha", nameAr: "العشاء", time: timings.Isha },
  ];

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const prayer of prayers) {
    const [hours, minutes] = prayer.time.split(":").map(Number);
    const prayerMinutes = hours * 60 + minutes;

    if (prayerMinutes > currentMinutes) {
      return prayer;
    }
  }

  return prayers[0];
}

export function getTimeUntilPrayer(prayerTime: string): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const [prayerHours, prayerMinutes] = prayerTime.split(":").map(Number);

  let prayerDate = new Date(now);
  prayerDate.setHours(prayerHours, prayerMinutes, 0, 0);

  if (prayerDate <= now) {
    prayerDate.setDate(prayerDate.getDate() + 1);
  }

  const diff = prayerDate.getTime() - now.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function isPrayerPast(prayerTime: string): boolean {
  const now = new Date();
  const [hours, minutes] = prayerTime.split(":").map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const prayerMinutes = hours * 60 + minutes;
  return prayerMinutes < currentMinutes;
}
