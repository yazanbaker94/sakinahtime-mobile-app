import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Dimensions, Modal, Image, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/hooks/useTheme';
import { useLocation } from '@/contexts/LocationContext';
import { usePrayerTimes, useCalculationMethod, formatTime } from '@/hooks/usePrayerTimes';
import { Feather } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

// 3D celestial icons
const PRAYER_ICONS: Record<string, any> = {
    Fajr: require('../../assets/images/islamic-calendar-icons/dawn.webp'),
    Sunrise: require('../../assets/images/islamic-calendar-icons/sunrise.webp'),
    Dhuhr: require('../../assets/images/islamic-calendar-icons/noon.webp'),
    Asr: require('../../assets/images/islamic-calendar-icons/afternoon.webp'),
    Maghrib: require('../../assets/images/islamic-calendar-icons/sunset.webp'),
    Isha: require('../../assets/images/islamic-calendar-icons/night.webp'),
};

const PRAYERS = [
    { key: 'Fajr', nameEn: 'Fajr', nameAr: 'الفجر' },
    { key: 'Sunrise', nameEn: 'Sunrise', nameAr: 'الشروق' },
    { key: 'Dhuhr', nameEn: 'Dhuhr', nameAr: 'الظهر' },
    { key: 'Asr', nameEn: 'Asr', nameAr: 'العصر' },
    { key: 'Maghrib', nameEn: 'Maghrib', nameAr: 'المغرب' },
    { key: 'Isha', nameEn: 'Isha', nameAr: 'العشاء' },
] as const;

// Moved to component body to use translations
const WEEKDAYS_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const screenWidth = Dimensions.get('window').width;
// Total horizontal inset: scrollContent paddingHorizontal (16*2) + calendarContainer padding (10*2) = 52
const CALENDAR_PADDING = Spacing.lg * 2 + (Spacing.sm + 2) * 2;
const DAY_SIZE = Math.floor((screenWidth - CALENDAR_PADDING) / 7);

export default function PrayerCalendarScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { theme, isDark } = useTheme();
    const { t, locale } = useTranslation();
    const dateLocaleMap: Record<string, string> = {
        en: 'en-US', ar: 'ar-SA', fr: 'fr-FR', de: 'de-DE', ru: 'ru-RU', zh: 'zh-CN',
        bn: 'bn-BD', tr: 'tr-TR', id: 'id-ID', ur: 'ur-PK',
    };
    const dateLocale = dateLocaleMap[locale] || 'en-US';
    // Use i18n calendar months, fall back to English
    const calMonths = t('calendar.months');
    const MONTHS: string[] = Array.isArray(calMonths) && calMonths.length === 12 ? calMonths : MONTHS_EN;
    const calWeekdays = t('calendar.weekdays');
    const WEEKDAYS: string[] = Array.isArray(calWeekdays) && calWeekdays.length === 7 ? calWeekdays : WEEKDAYS_EN;
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMonth, setViewMonth] = useState(new Date());
    const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);

    const { latitude, longitude, city, country } = useLocation();
    const { method: calculationMethod } = useCalculationMethod();
    const hasValidLocation = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;

    const {
        data: prayerData,
        isLoading: prayerLoading,
        error: prayerError,
    } = usePrayerTimes(
        hasValidLocation ? latitude : null,
        hasValidLocation ? longitude : null,
        calculationMethod,
        city && country ? `${city}, ${country}` : city || country || '',
        selectedDate
    );

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const yearsArray: number[] = [];
        for (let y = currentYear - 10; y <= currentYear + 10; y++) {
            yearsArray.push(y);
        }
        return yearsArray;
    }, []);

    const calendarDays = useMemo(() => {
        const year = viewMonth.getFullYear();
        const month = viewMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const startingDayOfWeek = firstDay.getDay();
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        const days: (Date | null)[] = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }
        return days;
    }, [viewMonth]);

    const today = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
    }, []);

    const isSameDay = (d1: Date | null, d2: Date) => {
        if (!d1) return false;
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const navigateMonth = (direction: number) => {
        const newMonth = new Date(viewMonth);
        newMonth.setMonth(newMonth.getMonth() + direction);
        setViewMonth(newMonth);
    };

    const goToToday = () => {
        const today = new Date();
        setSelectedDate(today);
        setViewMonth(today);
    };

    const selectYear = (year: number) => {
        const newDate = new Date(year, viewMonth.getMonth(), 1);
        setViewMonth(newDate);
    };

    const selectMonth = (month: number) => {
        const newDate = new Date(viewMonth.getFullYear(), month, 1);
        setViewMonth(newDate);
        setShowMonthYearPicker(false);
    };

    const isToday = isSameDay(selectedDate, today);

    // Determine the currently active prayer window
    const activePrayerKey = useMemo(() => {
        if (!prayerData?.timings || !isSameDay(selectedDate, today)) return null;
        const now = new Date();
        const parseTime = (timeStr: string): Date => {
            const [h, m] = timeStr.replace(/\s*\(.*\)/, '').split(':').map(Number);
            const d = new Date(selectedDate);
            d.setHours(h, m, 0, 0);
            return d;
        };
        const timings = prayerData.timings;
        const prayerOrder = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
        for (let i = prayerOrder.length - 1; i >= 0; i--) {
            const key = prayerOrder[i];
            const timeStr = timings[key as keyof typeof timings];
            if (timeStr) {
                const prayerTime = parseTime(timeStr);
                if (now >= prayerTime) return key;
            }
        }
        return null;
    }, [prayerData, selectedDate, today]);

    // Circle size for selected day
    const circleSize = Math.min(DAY_SIZE * 0.85, DAY_SIZE) - 4;

    return (
        <ThemedView style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
                >
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </Pressable>
                <View style={styles.headerContent}>
                    <ThemedText type="h3" style={{ fontWeight: '700' }}>{t('prayerCalendar.title')}</ThemedText>
                    <ThemedText type="caption" secondary>{city || t('common.loading')}</ThemedText>
                </View>
                {!isToday && (
                    <Pressable onPress={goToToday} style={[styles.todayButton, { backgroundColor: theme.primary }]}>
                        <ThemedText type="caption" style={{ color: '#fff', fontWeight: '600' }}>{t('prayerCalendar.today')}</ThemedText>
                    </Pressable>
                )}
            </View>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Frosted Glass Calendar Card ── */}
                <View style={[
                    styles.calendarContainer,
                    {
                        backgroundColor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.95)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.04,
                        shadowRadius: 30,
                        elevation: 4,
                    }
                ]}>
                    {/* Month Navigation with Frosted Pill Chevrons */}
                    <View style={styles.monthNav}>
                        <Pressable
                            onPress={() => navigateMonth(-1)}
                            style={({ pressed }) => [
                                styles.chevronButton,
                                {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                                    transform: [{ scale: pressed ? 0.92 : 1 }],
                                },
                            ]}
                        >
                            <Feather name="chevron-left" size={18} color={theme.text} />
                        </Pressable>
                        <Pressable
                            onPress={() => setShowMonthYearPicker(true)}
                            style={({ pressed }) => [styles.monthYearButton, { opacity: pressed ? 0.7 : 1 }]}
                        >
                            <ThemedText type="body" style={{ fontWeight: '700', fontSize: 16 }}>
                                {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                            </ThemedText>
                            <Feather name="chevron-down" size={16} color={theme.textSecondary} style={{ marginLeft: 4 }} />
                        </Pressable>
                        <Pressable
                            onPress={() => navigateMonth(1)}
                            style={({ pressed }) => [
                                styles.chevronButton,
                                {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                                    transform: [{ scale: pressed ? 0.92 : 1 }],
                                },
                            ]}
                        >
                            <Feather name="chevron-right" size={18} color={theme.text} />
                        </Pressable>
                    </View>

                    {/* Weekday Headers */}
                    <View style={styles.weekdayRow}>
                        {WEEKDAYS.map((day, i) => (
                            <View key={i} style={[styles.weekdayCell, { width: DAY_SIZE }]}>
                                <ThemedText type="caption" style={{ fontWeight: '700', fontSize: 11, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }}>{day}</ThemedText>
                            </View>
                        ))}
                    </View>

                    {/* Calendar Grid with Circle Selected Date */}
                    <View style={styles.calendarGrid}>
                        {calendarDays.map((day, index) => {
                            const isSelected = day && isSameDay(day, selectedDate);
                            const isDayToday = day && isSameDay(day, today);

                            return (
                                <Pressable
                                    key={index}
                                    disabled={!day}
                                    onPress={() => day && setSelectedDate(day)}
                                    style={[
                                        styles.dayCell,
                                        { width: DAY_SIZE, height: DAY_SIZE * 0.85 },
                                    ]}
                                >
                                    {day && (
                                        <View style={[
                                            {
                                                width: circleSize,
                                                height: circleSize,
                                                borderRadius: circleSize / 2,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            },
                                            isSelected && {
                                                backgroundColor: theme.primary,
                                                shadowColor: theme.primary,
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: 0.35,
                                                shadowRadius: 10,
                                                elevation: 6,
                                            },
                                            isDayToday && !isSelected && {
                                                borderWidth: 1.5,
                                                borderColor: theme.primary,
                                            },
                                        ]}>
                                            <ThemedText
                                                type="caption"
                                                style={{
                                                    fontWeight: isSelected || isDayToday ? '700' : '400',
                                                    color: isSelected ? '#fff' : theme.text,
                                                    fontSize: 13,
                                                }}
                                            >
                                                {day.getDate()}
                                            </ThemedText>
                                        </View>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* ── Floating Frosted Glass "Today" Pill ── */}
                <View style={[
                    styles.todayPill,
                    {
                        backgroundColor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.92)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.05,
                        shadowRadius: 20,
                        elevation: 3,
                    }
                ]}>
                    <ThemedText type="body" style={{ fontWeight: '700', fontSize: 15 }}>
                        {isToday ? t('prayerCalendar.today') : selectedDate.toLocaleDateString(dateLocale, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </ThemedText>
                    {prayerData?.date?.hijri && (
                        <View style={[styles.hijriBadge, { backgroundColor: `${theme.primary}15` }]}>
                            <ThemedText type="caption" style={{ color: theme.primary, fontWeight: '600', fontSize: 12 }}>
                                {prayerData.date.hijri.day} {t(`hijri.months.${prayerData.date.hijri.month?.number || 1}`)} {prayerData.date.hijri.year}
                            </ThemedText>
                        </View>
                    )}
                </View>

                {/* Loading */}
                {prayerLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={theme.primary} />
                    </View>
                )}

                {/* Error */}
                {prayerError && !prayerLoading && (
                    <View style={styles.errorContainer}>
                        <ThemedText type="caption" secondary>{t('prayerCalendar.unableToLoad')}</ThemedText>
                    </View>
                )}

                {/* ── Prayer Times List (No Dividers, Active Highlight, 3D Icons) ── */}
                {prayerData?.timings && !prayerLoading && (
                    <View style={[
                        styles.prayerGrid,
                        {
                            backgroundColor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.95)',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.04,
                            shadowRadius: 30,
                            elevation: 4,
                        }
                    ]}>
                        {PRAYERS.map((prayer, index) => {
                            const time = prayerData.timings[prayer.key as keyof typeof prayerData.timings];
                            if (!time) return null;
                            const isActive = activePrayerKey === prayer.key;

                            return (
                                <View
                                    key={prayer.key}
                                    style={[
                                        styles.prayerRow,
                                        isActive && {
                                            backgroundColor: `${theme.primary}1A`,
                                            borderRadius: 14,
                                            marginHorizontal: -4,
                                            paddingHorizontal: 4,
                                        },
                                    ]}
                                >
                                    <View style={styles.prayerInfo}>
                                        <Image
                                            source={PRAYER_ICONS[prayer.key]}
                                            style={{ width: 32, height: 32 }}
                                            resizeMode="contain"
                                        />
                                        <ThemedText
                                            type="body"
                                            style={{
                                                marginLeft: 10,
                                                fontWeight: isActive ? '700' : '500',
                                                fontSize: isActive ? 15 : 14,
                                            }}
                                        >
                                            {t(`prayer.${prayer.key.toLowerCase()}`)}
                                        </ThemedText>
                                        {isActive && (
                                            <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />
                                        )}
                                    </View>
                                    <ThemedText
                                        type="body"
                                        style={{
                                            fontWeight: '700',
                                            color: isActive ? theme.primary : theme.text,
                                            fontSize: isActive ? 16 : 14,
                                        }}
                                    >
                                        {formatTime(time)}
                                    </ThemedText>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* Month/Year Picker Modal */}
            <Modal
                visible={showMonthYearPicker}
                animationType="fade"
                transparent
                onRequestClose={() => setShowMonthYearPicker(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setShowMonthYearPicker(false)}>
                    <Pressable style={[styles.pickerContainer, { backgroundColor: isDark ? theme.cardBackground : '#fff' }]}>
                        <View style={styles.pickerHeader}>
                            <ThemedText type="body" style={{ fontWeight: '700' }}>{t('prayerCalendar.selectMonthYear')}</ThemedText>
                            <Pressable onPress={() => setShowMonthYearPicker(false)}>
                                <Feather name="x" size={22} color={theme.text} />
                            </Pressable>
                        </View>

                        {/* Year Selector */}
                        <ThemedText type="caption" secondary style={{ marginBottom: 6, marginTop: 12 }}>{t('prayerCalendar.year')}</ThemedText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearScrollContent}>
                            {years.map((year) => (
                                <Pressable
                                    key={year}
                                    onPress={() => selectYear(year)}
                                    style={[
                                        styles.yearChip,
                                        { backgroundColor: year === viewMonth.getFullYear() ? theme.primary : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') },
                                    ]}
                                >
                                    <ThemedText type="caption" style={{ fontWeight: '600', color: year === viewMonth.getFullYear() ? '#fff' : theme.text }}>
                                        {year}
                                    </ThemedText>
                                </Pressable>
                            ))}
                        </ScrollView>

                        {/* Month Grid */}
                        <ThemedText type="caption" secondary style={{ marginBottom: 6, marginTop: 14 }}>{t('prayerCalendar.month')}</ThemedText>
                        <View style={styles.monthGrid}>
                            {MONTHS.map((month, index) => (
                                <Pressable
                                    key={month}
                                    onPress={() => selectMonth(index)}
                                    style={[
                                        styles.monthChip,
                                        { backgroundColor: index === viewMonth.getMonth() ? theme.primary : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') },
                                    ]}
                                >
                                    <ThemedText type="caption" style={{ fontWeight: '600', color: index === viewMonth.getMonth() ? '#fff' : theme.text }}>
                                        {month}
                                    </ThemedText>
                                </Pressable>
                            ))}
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </ThemedView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.sm,
    },
    backButton: { marginRight: Spacing.md },
    headerContent: { flex: 1 },
    todayButton: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
    scrollContent: { paddingHorizontal: Spacing.lg },

    // ── Frosted Glass Calendar Card ──
    calendarContainer: {
        borderRadius: 20,
        padding: Spacing.sm + 2,
        marginBottom: Spacing.md,
    },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    chevronButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthYearButton: { flexDirection: 'row', alignItems: 'center' },
    weekdayRow: { flexDirection: 'row' },
    weekdayCell: { alignItems: 'center', paddingVertical: 4 },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { alignItems: 'center', justifyContent: 'center' },

    // ── Floating Today Pill ──
    todayPill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 50,
        marginBottom: Spacing.md,
        gap: 10,
    },
    hijriBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },

    loadingContainer: { alignItems: 'center', paddingVertical: 20 },
    errorContainer: { alignItems: 'center', paddingVertical: 20 },

    // ── Prayer List (No Dividers) ──
    prayerGrid: {
        borderRadius: 20,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md + 4,
        paddingHorizontal: Spacing.md,
    },
    prayerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 4,
        // No borderBottom — separated by whitespace only
    },
    prayerInfo: { flexDirection: 'row', alignItems: 'center' },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginLeft: 8,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    pickerContainer: { width: '100%', maxWidth: 340, borderRadius: 16, padding: Spacing.md },
    pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    yearScrollContent: { gap: 6, paddingVertical: 4 },
    yearChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    monthChip: { width: '31%', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
});
