/**
 * QadaTrackerScreen
 * Full screen for managing Qada (makeup) prayers
 * Feature: prayer-log-statistics
 */

import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useQadaTracker } from '@/hooks/useQadaTracker';
import { PrayerName, PRAYER_NAMES } from '@/types/prayerLog';
import { Spacing, BorderRadius } from '@/constants/theme';

const PRAYER_DISPLAY: Record<PrayerName, { nameEn: string; nameAr: string; icon: string }> = {
    Fajr: { nameEn: 'Fajr', nameAr: 'الفجر', icon: 'sunrise' },
    Dhuhr: { nameEn: 'Dhuhr', nameAr: 'الظهر', icon: 'sun' },
    Asr: { nameEn: 'Asr', nameAr: 'العصر', icon: 'cloud' },
    Maghrib: { nameEn: 'Maghrib', nameAr: 'المغرب', icon: 'sunset' },
    Isha: { nameEn: 'Isha', nameAr: 'العشاء', icon: 'moon' },
};

export default function QadaTrackerScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { isDark, theme } = useTheme();
    const { qadaCounts, totalQada, logQadaPrayer, adjustQadaCount, loading } = useQadaTracker();
    const [editingPrayer, setEditingPrayer] = useState<PrayerName | null>(null);
    const [editValue, setEditValue] = useState('');

    const handleLogQada = async (prayer: PrayerName) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (qadaCounts && qadaCounts[prayer] > 0) {
            await logQadaPrayer(prayer);
        }
    };

    const handleIncrement = async (prayer: PrayerName) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (qadaCounts) {
            await adjustQadaCount(prayer, qadaCounts[prayer] + 1);
        }
    };

    const handleDecrement = async (prayer: PrayerName) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (qadaCounts && qadaCounts[prayer] > 0) {
            await adjustQadaCount(prayer, qadaCounts[prayer] - 1);
        }
    };

    const handleStartEdit = (prayer: PrayerName) => {
        if (qadaCounts) {
            setEditingPrayer(prayer);
            setEditValue(String(qadaCounts[prayer]));
        }
    };

    const handleSaveEdit = async () => {
        if (editingPrayer) {
            const newValue = parseInt(editValue, 10);
            if (!isNaN(newValue) && newValue >= 0) {
                await adjustQadaCount(editingPrayer, newValue);
            }
            setEditingPrayer(null);
            setEditValue('');
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingTop: insets.top + Spacing.lg,
                        paddingBottom: insets.bottom + Spacing.xl,
                    },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Feather name="arrow-left" size={24} color={theme.text} />
                        </Pressable>
                        <ThemedText type="h2" style={styles.title}>Qada Tracker</ThemedText>
                    </View>
                </View>

                {/* Total summary */}
                <View style={[
                    styles.totalCard,
                    { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)' }
                ]}>
                    <ThemedText type="h1" style={{ color: '#EF4444', fontWeight: '800', fontSize: 48 }}>
                        {totalQada}
                    </ThemedText>
                    <ThemedText type="body" secondary>
                        Total Qada prayers remaining
                    </ThemedText>
                </View>

                {/* Hint banner */}
                <View style={[
                    styles.hintBanner,
                    { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)' }
                ]}>
                    <Feather name="info" size={14} color="#3B82F6" />
                    <ThemedText type="caption" style={{ color: '#3B82F6', flex: 1, marginLeft: 8 }}>
                        Tap the count number to edit directly. Use "Log" after praying a Qada.
                    </ThemedText>
                </View>

                {/* Prayer list */}
                {PRAYER_NAMES.map((prayer) => {
                    const display = PRAYER_DISPLAY[prayer];
                    const count = qadaCounts?.[prayer] || 0;
                    const isEditing = editingPrayer === prayer;

                    return (
                        <View
                            key={prayer}
                            style={[
                                styles.prayerRow,
                                { backgroundColor: theme.cardBackground },
                            ]}
                        >
                            {/* Top row: Prayer name and controls */}
                            <View style={styles.prayerRowTop}>
                                <View style={styles.prayerInfo}>
                                    <View style={[
                                        styles.prayerIcon,
                                        { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }
                                    ]}>
                                        <Feather
                                            name={display.icon as any}
                                            size={20}
                                            color={theme.textSecondary}
                                        />
                                    </View>
                                    <View style={{ flexShrink: 1 }}>
                                        <ThemedText type="body" style={{ fontWeight: '600', fontSize: 16 }}>
                                            {display.nameEn}
                                        </ThemedText>
                                        <ThemedText type="caption" secondary style={{ fontFamily: 'AlMushafQuran' }}>
                                            {display.nameAr}
                                        </ThemedText>
                                    </View>
                                </View>

                                <View style={styles.countControls}>
                                    {isEditing ? (
                                        <View style={styles.editContainer}>
                                            <TextInput
                                                style={[
                                                    styles.editInput,
                                                    {
                                                        color: theme.text,
                                                        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                                                    },
                                                ]}
                                                value={editValue}
                                                onChangeText={setEditValue}
                                                keyboardType="number-pad"
                                                autoFocus
                                            />
                                            <Pressable onPress={handleSaveEdit} style={styles.saveButton}>
                                                <Feather name="check" size={20} color={theme.primary} />
                                            </Pressable>
                                        </View>
                                    ) : (
                                        <>
                                            <Pressable
                                                onPress={() => handleDecrement(prayer)}
                                                disabled={count === 0 || loading}
                                                style={({ pressed }) => [
                                                    styles.controlButton,
                                                    {
                                                        opacity: count === 0 ? 0.3 : 1,
                                                        backgroundColor: pressed ? 'rgba(239, 68, 68, 0.3)' : 'rgba(128, 128, 128, 0.15)',
                                                        transform: [{ scale: pressed ? 0.9 : 1 }],
                                                    }
                                                ]}
                                            >
                                                <Feather name="minus" size={18} color="#EF4444" />
                                            </Pressable>

                                            <Pressable onPress={() => handleStartEdit(prayer)}>
                                                <ThemedText type="h2" style={styles.countText}>
                                                    {count}
                                                </ThemedText>
                                            </Pressable>

                                            <Pressable
                                                onPress={() => handleIncrement(prayer)}
                                                disabled={loading}
                                                style={({ pressed }) => [
                                                    styles.controlButton,
                                                    {
                                                        backgroundColor: pressed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(128, 128, 128, 0.15)',
                                                        transform: [{ scale: pressed ? 0.9 : 1 }],
                                                    }
                                                ]}
                                            >
                                                <Feather name="plus" size={18} color="#10B981" />
                                            </Pressable>

                                            {count > 0 && (
                                                <Pressable
                                                    onPress={() => handleLogQada(prayer)}
                                                    style={({ pressed }) => [
                                                        styles.logButton,
                                                        {
                                                            backgroundColor: pressed ? '#059669' : theme.primary,
                                                            transform: [{ scale: pressed ? 0.95 : 1 }],
                                                        }
                                                    ]}
                                                >
                                                    <Feather name="check" size={14} color="#fff" />
                                                </Pressable>
                                            )}
                                        </>
                                    )}
                                </View>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    backButton: {
        padding: Spacing.xs,
        marginLeft: -Spacing.xs,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontWeight: '700',
    },
    totalCard: {
        alignItems: 'center',
        padding: Spacing.xl,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.lg,
    },
    hintBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.lg,
    },
    prayerRow: {
        padding: Spacing.md,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    prayerRowTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    prayerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: Spacing.md,
    },
    prayerIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    controlButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countText: {
        minWidth: 50,
        textAlign: 'center',
        fontWeight: '700',
        fontSize: 24,
    },
    editContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    editInput: {
        width: 70,
        height: 44,
        borderWidth: 2,
        borderRadius: BorderRadius.lg,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
    },
    saveButton: {
        padding: Spacing.sm,
    },
    logButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
        marginLeft: Spacing.md,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        marginTop: Spacing.lg,
        padding: Spacing.lg,
        backgroundColor: 'rgba(128, 128, 128, 0.1)',
        borderRadius: BorderRadius.lg,
    },
    infoText: {
        flex: 1,
        lineHeight: 20,
    },
});
