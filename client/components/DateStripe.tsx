import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';

interface DateStripeProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DateStripe({ selectedDate, onDateChange }: DateStripeProps) {
    const { theme, isDark } = useTheme();

    const today = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
    }, []);

    const isToday = useMemo(() => {
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);
        return selected.getTime() === today.getTime();
    }, [selectedDate, today]);

    // Generate 7 days centered on selected date
    const dates = useMemo(() => {
        const result: Date[] = [];
        for (let i = -3; i <= 3; i++) {
            const date = new Date(selectedDate);
            date.setDate(date.getDate() + i);
            date.setHours(0, 0, 0, 0);
            result.push(date);
        }
        return result;
    }, [selectedDate]);

    const navigateWeek = (direction: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + (direction * 7));
        onDateChange(newDate);
    };

    const goToToday = () => {
        onDateChange(new Date());
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.cardBackground : theme.backgroundSecondary }]}>
            {/* Navigation and Today button */}
            <View style={styles.header}>
                <Pressable
                    onPress={() => navigateWeek(-1)}
                    style={({ pressed }) => [styles.navButton, { opacity: pressed ? 0.6 : 1 }]}
                >
                    <Feather name="chevron-left" size={20} color={theme.text} />
                </Pressable>

                {!isToday && (
                    <Pressable
                        onPress={goToToday}
                        style={[styles.todayButton, { backgroundColor: theme.primary }]}
                    >
                        <Feather name="calendar" size={12} color="#fff" />
                        <ThemedText type="caption" style={{ color: '#fff', marginLeft: 4, fontWeight: '600' }}>
                            Today
                        </ThemedText>
                    </Pressable>
                )}

                <ThemedText type="caption" style={[styles.monthYear, { color: theme.textSecondary }]}>
                    {selectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </ThemedText>

                <Pressable
                    onPress={() => navigateWeek(1)}
                    style={({ pressed }) => [styles.navButton, { opacity: pressed ? 0.6 : 1 }]}
                >
                    <Feather name="chevron-right" size={20} color={theme.text} />
                </Pressable>
            </View>

            {/* Date pills */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.datesContainer}
            >
                {dates.map((date, index) => {
                    const isSelected = isSameDay(date, selectedDate);
                    const isDateToday = isSameDay(date, today);

                    return (
                        <Pressable
                            key={index}
                            onPress={() => onDateChange(date)}
                            style={({ pressed }) => [
                                styles.dateItem,
                                {
                                    backgroundColor: isSelected
                                        ? theme.primary
                                        : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                                    opacity: pressed ? 0.7 : 1,
                                    borderWidth: isDateToday && !isSelected ? 2 : 0,
                                    borderColor: theme.primary,
                                },
                            ]}
                        >
                            <ThemedText
                                type="caption"
                                style={{
                                    color: isSelected ? '#fff' : theme.textSecondary,
                                    fontWeight: '600',
                                    fontSize: 10,
                                    marginBottom: 2,
                                }}
                            >
                                {WEEKDAYS[date.getDay()]}
                            </ThemedText>
                            <ThemedText
                                type="body"
                                style={{
                                    color: isSelected ? '#fff' : theme.text,
                                    fontWeight: isSelected ? '700' : '500',
                                    fontSize: 16,
                                }}
                            >
                                {date.getDate()}
                            </ThemedText>
                            {isDateToday && (
                                <View style={[styles.todayDot, { backgroundColor: isSelected ? '#fff' : theme.primary }]} />
                            )}
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    navButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    todayButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    monthYear: {
        flex: 1,
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 13,
    },
    datesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 2,
    },
    dateItem: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 56,
        borderRadius: 12,
        marginHorizontal: 3,
    },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 3,
    },
});
