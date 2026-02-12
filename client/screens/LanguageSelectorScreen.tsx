import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { SUPPORTED_LANGUAGES, SupportedLocale } from "@/i18n";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LanguageSelectorScreen() {
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const { t, locale, setLocale } = useTranslation();
    const navigation = useNavigation<NavigationProp>();

    const handleSelect = async (code: string) => {
        if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        await setLocale(code as SupportedLocale);
    };

    return (
        <ThemedView style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    hitSlop={8}
                >
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </Pressable>
                <ThemedText type="h3" style={{ fontWeight: '700' }}>
                    {t('settings.language')}
                </ThemedText>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + Spacing.xl },
                ]}
                showsVerticalScrollIndicator={false}
            >
                <ThemedText type="caption" secondary style={{ marginBottom: Spacing.sm }}>
                    {t('settings.chooseLanguage')}
                </ThemedText>

                <View style={[styles.card, {
                    backgroundColor: isDark ? `${theme.primary}33` : theme.cardBackground,
                    elevation: isDark ? 0 : 3,
                    shadowOpacity: isDark ? 0 : 0.08,
                }]}>
                    {SUPPORTED_LANGUAGES.map((lang, index) => {
                        const isSelected = locale === lang.code;
                        const isLast = index === SUPPORTED_LANGUAGES.length - 1;

                        return (
                            <Pressable
                                key={lang.code}
                                onPress={() => handleSelect(lang.code)}
                                style={({ pressed }) => [
                                    styles.languageRow,
                                    !isLast && {
                                        borderBottomWidth: 1,
                                        borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                    },
                                    { opacity: pressed ? 0.7 : 1 },
                                ]}
                            >
                                <View style={styles.languageLeft}>
                                    <ThemedText style={{ fontSize: 26, marginRight: 14 }}>
                                        {lang.flag}
                                    </ThemedText>
                                    <View>
                                        <ThemedText type="body" style={{
                                            fontWeight: isSelected ? '700' : '500',
                                            color: isSelected ? theme.primary : theme.text,
                                        }}>
                                            {lang.nativeName}
                                        </ThemedText>
                                        <ThemedText type="caption" secondary style={{ fontSize: 12 }}>
                                            {lang.name}
                                        </ThemedText>
                                    </View>
                                </View>

                                {isSelected ? (
                                    <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                                        <Feather name="check" size={14} color="#FFF" />
                                    </View>
                                ) : (
                                    <View style={[styles.radioCircle, {
                                        borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                                    }]} />
                                )}
                            </Pressable>
                        );
                    })}
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    backButton: {
        padding: 4,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
    },
    card: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
    },
    languageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: Spacing.lg,
    },
    languageLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
    },
});
