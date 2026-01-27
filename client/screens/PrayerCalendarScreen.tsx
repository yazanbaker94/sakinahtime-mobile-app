import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Dimensions, Modal } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/hooks/useTheme';
import { useLocation } from '@/contexts/LocationContext';
import { usePrayerTimes, useCalculationMethod, formatTime } from '@/hooks/usePrayerTimes';
import { Feather } from '@expo/vector-icons';
import { Spacing, BorderRadius } from '@/constants/theme';

const PRAYERS = [
    { key: 'Fajr', nameEn: 'Fajr', nameAr: 'الفجر', icon: 'sunrise' },
    { key: 'Sunrise', nameEn: 'Sunrise', nameAr: 'الشروق', icon: 'sun' },
    { key: 'Dhuhr', nameEn: 'Dhuhr', nameAr: 'الظهر', icon: 'sun' },
    { key: 'Asr', nameEn: 'Asr', nameAr: 'العصر', icon: 'cloud' },
    { key: 'Maghrib', nameEn: 'Maghrib', nameAr: 'المغرب', icon: 'sunset' },
    { key: 'Isha', nameEn: 'Isha', nameAr: 'العشاء', icon: 'moon' },
] as const;

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const screenWidth = Dimensions.get('window').width;
const CALENDAR_PADDING = Spacing.lg * 2 + Spacing.sm * 2;
const DAY_SIZE = (screenWidth - CALENDAR_PADDING) / 7;

export default function PrayerCalendarScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { theme, isDark } = useTheme();
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
        // Don't close modal - user still needs to pick month
    };

    const selectMonth = (month: number) => {
        const newDate = new Date(viewMonth.getFullYear(), month, 1);
        setViewMonth(newDate);
        setShowMonthYearPicker(false); // Close modal after month selection
    };

    const isToday = isSameDay(selectedDate, today);

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
                    <ThemedText type="h3" style={{ fontWeight: '700' }}>Prayer Calendar</ThemedText>
                    <ThemedText type="caption" secondary>{city || 'Loading...'}</ThemedText>
                </View>
                {!isToday && (
                    <Pressable onPress={goToToday} style={[styles.todayButton, { backgroundColor: theme.primary }]}>
                        <ThemedText type="caption" style={{ color: '#fff', fontWeight: '600' }}>Today</ThemedText>
                    </Pressable>
                )}
            </View>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Compact Calendar */}
                <View style={[styles.calendarContainer, { backgroundColor: isDark ? theme.cardBackground : theme.backgroundSecondary }]}>
                    {/* Month Navigation - Compact */}
                    <View style={styles.monthNav}>
                        <Pressable onPress={() => navigateMonth(-1)} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                            <Feather name="chevron-left" size={22} color={theme.text} />
                        </Pressable>
                        <Pressable
                            onPress={() => setShowMonthYearPicker(true)}
                            style={({ pressed }) => [styles.monthYearButton, { opacity: pressed ? 0.7 : 1 }]}
                        >
                            <ThemedText type="body" style={{ fontWeight: '700' }}>
                                {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                            </ThemedText>
                            <Feather name="chevron-down" size={16} color={theme.textSecondary} style={{ marginLeft: 4 }} />
                        </Pressable>
                        <Pressable onPress={() => navigateMonth(1)} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                            <Feather name="chevron-right" size={22} color={theme.text} />
                        </Pressable>
                    </View>

                    {/* Weekday Headers - Single letters */}
                    <View style={styles.weekdayRow}>
                        {WEEKDAYS.map((day, i) => (
                            <View key={i} style={[styles.weekdayCell, { width: DAY_SIZE }]}>
                                <ThemedText type="caption" secondary style={{ fontWeight: '600', fontSize: 11 }}>{day}</ThemedText>
                            </View>
                        ))}
                    </View>

                    {/* Calendar Grid - Compact */}
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
                                        isSelected && { backgroundColor: theme.primary },
                                        isDayToday && !isSelected && { borderWidth: 1.5, borderColor: theme.primary },
                                    ]}
                                >
                                    {day && (
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
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Selected Date - Inline with Hijri */}
                <View style={[styles.dateRow, { backgroundColor: isDark ? theme.cardBackground : theme.backgroundSecondary }]}>
                    <View>
                        <ThemedText type="body" style={{ fontWeight: '600' }}>
                            {isToday ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </ThemedText>
                        {prayerData?.date?.hijri && (
                            <ThemedText type="caption" secondary>
                                {prayerData.date.hijri.day} {prayerData.date.hijri.month?.ar} {prayerData.date.hijri.year}
                            </ThemedText>
                        )}
                    </View>
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
                        <ThemedText type="caption" secondary>Unable to load prayer times</ThemedText>
                    </View>
                )}

                {/* Compact Prayer Times Grid */}
                {prayerData?.timings && !prayerLoading && (
                    <View style={[styles.prayerGrid, { backgroundColor: isDark ? theme.cardBackground : theme.backgroundSecondary }]}>
                        {PRAYERS.map((prayer) => {
                            const time = prayerData.timings[prayer.key as keyof typeof prayerData.timings];
                            if (!time) return null;

                            return (
                                <View key={prayer.key} style={styles.prayerRow}>
                                    <View style={styles.prayerInfo}>
                                        <Feather name={prayer.icon as any} size={16} color={theme.primary} />
                                        <ThemedText type="body" style={{ marginLeft: 8, fontWeight: '500' }}>
                                            {prayer.nameEn}
                                        </ThemedText>
                                    </View>
                                    <ThemedText type="body" style={{ fontWeight: '700', color: theme.primary }}>
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
                            <ThemedText type="body" style={{ fontWeight: '700' }}>Select Month & Year</ThemedText>
                            <Pressable onPress={() => setShowMonthYearPicker(false)}>
                                <Feather name="x" size={22} color={theme.text} />
                            </Pressable>
                        </View>

                        {/* Year Selector */}
                        <ThemedText type="caption" secondary style={{ marginBottom: 6, marginTop: 12 }}>Year</ThemedText>
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
                        <ThemedText type="caption" secondary style={{ marginBottom: 6, marginTop: 14 }}>Month</ThemedText>
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
        </ThemedView>
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
    calendarContainer: { borderRadius: 14, padding: Spacing.sm, marginBottom: Spacing.md },
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    monthYearButton: { flexDirection: 'row', alignItems: 'center' },
    weekdayRow: { flexDirection: 'row' },
    weekdayCell: { alignItems: 'center', paddingVertical: 4 },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: 12,
        marginBottom: Spacing.md,
    },
    loadingContainer: { alignItems: 'center', paddingVertical: 20 },
    errorContainer: { alignItems: 'center', paddingVertical: 20 },
    prayerGrid: { borderRadius: 14, padding: Spacing.md },
    prayerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(128,128,128,0.2)',
    },
    prayerInfo: { flexDirection: 'row', alignItems: 'center' },
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
