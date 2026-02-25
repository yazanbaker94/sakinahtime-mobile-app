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
    Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useQadaTracker } from '@/hooks/useQadaTracker';
import { PrayerName, PRAYER_NAMES } from '@/types/prayerLog';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

// Reuse 3D celestial icons from the prayer calendar
const PRAYER_3D_ICONS: Record<PrayerName, any> = {
    Fajr: require('../../assets/images/islamic-calendar-icons/dawn.webp'),
    Dhuhr: require('../../assets/images/islamic-calendar-icons/noon.webp'),
    Asr: require('../../assets/images/islamic-calendar-icons/afternoon.webp'),
    Maghrib: require('../../assets/images/islamic-calendar-icons/sunset.webp'),
    Isha: require('../../assets/images/islamic-calendar-icons/night.webp'),
};

export default function QadaTrackerScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const { isDark, theme } = useTheme();
    const { t } = useTranslation();
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

    // Dynamic hero card: peaceful theme color when 0, soft coral when > 0
    const isAllCaughtUp = totalQada === 0;
    const heroColor = isAllCaughtUp ? theme.primary : '#F5A5A5';
    const heroBg = isAllCaughtUp
        ? `${theme.primary}18`
        : (isDark ? 'rgba(245,165,165,0.12)' : 'rgba(245,165,165,0.15)');

    // Clay card helper
    const clayCard = {
        backgroundColor: isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.95)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.04,
        shadowRadius: 30,
        elevation: 4,
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
                        <ThemedText type="h2" style={styles.title}>{t('qadaTracker.title')}</ThemedText>
                    </View>
                </View>

                {/* Dynamic Hero Card */}
                <View style={[
                    styles.totalCard,
                    {
                        backgroundColor: heroBg,
                        shadowColor: heroColor,
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.15,
                        shadowRadius: 20,
                        elevation: 4,
                    }
                ]}>
                    <ThemedText type="h1" style={{ color: heroColor, fontWeight: '800', fontSize: 48 }}>
                        {totalQada}
                    </ThemedText>
                    <ThemedText type="body" secondary>
                        {t('qadaTracker.totalRemaining')}
                    </ThemedText>
                </View>

                {/* Theme-synced Info Banner */}
                <View style={[
                    styles.hintBanner,
                    { backgroundColor: `${theme.primary}18` }
                ]}>
                    <Feather name="info" size={14} color={theme.primary} />
                    <ThemedText type="caption" style={{ color: theme.primary, flex: 1, marginLeft: 8 }}>
                        {t('qadaTracker.hint')}
                    </ThemedText>
                </View>

                {/* Prayer list */}
                {PRAYER_NAMES.map((prayer) => {
                    const count = qadaCounts?.[prayer] || 0;
                    const isEditing = editingPrayer === prayer;

                    return (
                        <View
                            key={prayer}
                            style={[styles.prayerRow, clayCard]}
                        >
                            {/* Top row: Prayer name and controls */}
                            <View style={styles.prayerRowTop}>
                                <View style={styles.prayerInfo}>
                                    {/* Fixed-width icon container for consistent text alignment */}
                                    <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                                        <Image
                                            source={PRAYER_3D_ICONS[prayer]}
                                            style={{ width: 36, height: 36 }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <View style={{ flexShrink: 1 }}>
                                        <ThemedText type="body" style={{ fontWeight: '600', fontSize: 16 }}>
                                            {t(`prayer.${prayer.toLowerCase()}`)}
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
                                                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
                                                        borderWidth: 0,
                                                        shadowColor: '#000',
                                                        shadowOffset: { width: 0, height: 4 },
                                                        shadowOpacity: pressed ? 0.03 : 0.08,
                                                        shadowRadius: pressed ? 4 : 10,
                                                        elevation: pressed ? 1 : 3,
                                                        transform: [{ scale: pressed ? 0.92 : 1 }],
                                                    }
                                                ]}
                                            >
                                                <Feather name="minus" size={18} color={isDark ? theme.text : '#374151'} />
                                            </Pressable>

                                            <Pressable onPress={() => handleStartEdit(prayer)}>
                                                <ThemedText type="h2" style={[styles.countText, { color: theme.primary }]}>
                                                    {count}
                                                </ThemedText>
                                            </Pressable>

                                            <Pressable
                                                onPress={() => handleIncrement(prayer)}
                                                disabled={loading}
                                                style={({ pressed }) => [
                                                    styles.controlButton,
                                                    {
                                                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
                                                        borderWidth: 0,
                                                        shadowColor: '#000',
                                                        shadowOffset: { width: 0, height: 4 },
                                                        shadowOpacity: pressed ? 0.03 : 0.08,
                                                        shadowRadius: pressed ? 4 : 10,
                                                        elevation: pressed ? 1 : 3,
                                                        transform: [{ scale: pressed ? 0.92 : 1 }],
                                                    }
                                                ]}
                                            >
                                                <Feather name="plus" size={18} color={isDark ? theme.text : '#374151'} />
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
    title: {
        fontWeight: '700',
    },
    // Dynamic hero — shadow + color set inline
    totalCard: {
        alignItems: 'center',
        padding: Spacing.xl,
        borderRadius: 20,
        marginBottom: Spacing.lg,
    },
    // Theme-synced info banner
    hintBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: 16,
        marginBottom: Spacing.lg,
    },
    // Borderless clay prayer cards
    prayerRow: {
        padding: Spacing.md,
        borderRadius: 20,
        marginBottom: Spacing.md,
        // Shadows set inline via clayCard
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
    countControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    // Tactile clay pill buttons
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
        borderRadius: 14,
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
        borderRadius: 14,
        marginLeft: Spacing.md,
    },
});
