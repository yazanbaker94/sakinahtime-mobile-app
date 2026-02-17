import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, FlatList, Pressable, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { azkarData, Dhikr } from "@/data/azkar";
import { Feather } from "@expo/vector-icons";
import { useRoute, useNavigation, CompositeNavigationProp } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type AzkarDetailRouteProp = RouteProp<RootStackParamList, "AzkarDetail">;

const STORAGE_KEYS = {
  TRANSLITERATION: '@azkar_show_transliteration',
  TRANSLATION: '@azkar_show_translation',
  COUNTER: '@azkar_show_counter',
};

export default function AzkarDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { t, locale } = useTranslation();
  const route = useRoute<AzkarDetailRouteProp>();
  const navigation = useNavigation();
  const { category } = route.params;

  const [showTransliteration, setShowTransliteration] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showCounter, setShowCounter] = useState(true);
  const [counters, setCounters] = useState<Record<string, number>>({});

  // Load saved preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [translitValue, translationValue, counterValue] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.TRANSLITERATION),
          AsyncStorage.getItem(STORAGE_KEYS.TRANSLATION),
          AsyncStorage.getItem(STORAGE_KEYS.COUNTER),
        ]);

        if (translitValue !== null) {
          setShowTransliteration(translitValue === 'true');
        }
        if (translationValue !== null) {
          setShowTranslation(translationValue === 'true');
        }
        if (counterValue !== null) {
          setShowCounter(counterValue === 'true');
        }
      } catch (error) {
        // Silently fail, use default values
      }
    };

    loadPreferences();
  }, []);

  // Save transliteration preference
  const toggleTransliteration = async () => {
    const newValue = !showTransliteration;
    setShowTransliteration(newValue);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSLITERATION, String(newValue));
    } catch (error) {
      // Silently fail
    }
  };

  // Save translation preference
  const toggleTranslation = async () => {
    const newValue = !showTranslation;
    setShowTranslation(newValue);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSLATION, String(newValue));
    } catch (error) {
      // Silently fail
    }
  };

  // Save counter preference
  const toggleCounter = async () => {
    const newValue = !showCounter;
    setShowCounter(newValue);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COUNTER, String(newValue));
      if (!newValue) {
        // Reset all counters when disabling
        setCounters({});
      }
    } catch (error) {
      // Silently fail
    }
  };

  // Increment counter for a specific dhikr
  const incrementCounter = (dhikrId: string) => {
    setCounters(prev => ({
      ...prev,
      [dhikrId]: (prev[dhikrId] || 0) + 1,
    }));
  };

  // Reset counter for a specific dhikr
  const resetCounter = (dhikrId: string) => {
    setCounters(prev => {
      const newCounters = { ...prev };
      delete newCounters[dhikrId];
      return newCounters;
    });
  };

  const dhikrList = azkarData[category.id] || [];

  // Check if source is a Quran reference
  const isQuranVerse = (source: string): boolean => {
    const quranSources = [
      'Al-Baqarah', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas', 'Al-Fatiha',
      'Al-Mulk', 'Al-Kahf', 'Ya-Sin', 'Ar-Rahman', 'Al-Waqiah',
      'Al-Hashr', 'Al-Jumu\'ah', 'Al-Munafiqun', 'At-Taghabun',
    ];
    return quranSources.some(s => source.includes(s)) || /^\d+:\d+/.test(source);
  };

  // Render a filter pill toggle
  const renderTogglePill = (
    label: string,
    isActive: boolean,
    onPress: () => void
  ) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 0,
        borderColor: 'transparent',
        backgroundColor: isActive
          ? theme.primary
          : (isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF'),
        shadowColor: isActive ? 'transparent' : '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isActive ? 0 : 0.06,
        shadowRadius: 8,
        elevation: isActive ? 0 : 2,
        opacity: pressed ? 0.7 : 1,
      }]}
    >
      <ThemedText
        type="caption"
        style={{
          color: isActive ? '#FFFFFF' : theme.textSecondary,
          fontWeight: isActive ? '700' : '500',
        }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  const renderDhikr = useCallback(
    ({ item, index }: { item: Dhikr; index: number }) => {
      const currentCount = counters[item.id] || 0;
      const targetCount = item.repetitions || 0;
      const isComplete = targetCount > 0 && currentCount >= targetCount;
      const isQuran = isQuranVerse(item.source);

      return (
        <Pressable
          onPress={() => showCounter && incrementCounter(item.id)}
          disabled={!showCounter}
          style={({ pressed }) => [
            styles.dhikrCard,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
              // Floating clay card — borderless with drop shadow
              borderWidth: 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.05,
              shadowRadius: 20,
              elevation: 3,
              opacity: pressed ? 0.7 : 1,
            },
            isQuran && {
              borderLeftWidth: 4,
              borderLeftColor: theme.gold,
            },
          ]}
        >
          <View style={styles.dhikrHeader}>
            <View
              style={[
                styles.dhikrNumber,
                {
                  backgroundColor: isQuran ? `${theme.gold}20` : (isDark ? 'rgba(255,255,255,0.08)' : `${theme.primary}10`),
                },
              ]}
            >
              {isQuran ? (
                <Feather name="book-open" size={14} color={theme.gold} />
              ) : (
                <ThemedText type="small">{index + 1}</ThemedText>
              )}
            </View>
            <View style={styles.sourceContainer}>
              {isQuran && (
                <View style={[styles.quranBadge, { backgroundColor: `${theme.gold}15` }]}>
                  <ThemedText type="caption" style={{ color: theme.gold, fontWeight: '600' }}>
                    {t('azkarDetail.quran')}
                  </ThemedText>
                </View>
              )}
              <ThemedText type="caption" secondary>
                {item.source}
              </ThemedText>
            </View>
          </View>

          {/* Arabic text - same rendering for both Quran and regular dhikr */}
          <ThemedText type="arabicLarge" style={[styles.arabicText, { fontFamily: 'AlMushafQuran' }]}>
            {item.textAr}
          </ThemedText>

          {showTransliteration ? (
            <ThemedText type="small" secondary style={styles.transliteration}>
              {item.transliteration}
            </ThemedText>
          ) : null}

          {showTranslation ? (
            <ThemedText type="body" secondary style={styles.translation}>
              {t(`azkarTranslations.${item.id}`, { defaultValue: item.translation })}
            </ThemedText>
          ) : null}

          <View style={styles.bottomRow}>
            {item.repetitions > 0 ? (
              <View style={[styles.repBadge, { backgroundColor: `${theme.primary}10` }]}>
                <Feather name="repeat" size={12} color={theme.primary} style={{ marginRight: 4 }} />
                <ThemedText
                  type="caption"
                  style={{ color: theme.primary, fontWeight: '600' }}
                >
                  {item.repetitions}x
                </ThemedText>
              </View>
            ) : <View />}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              {showCounter ? (
                <View style={styles.counterContainer}>
                  {/* Reset button — neutral grey, not red */}
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      resetCounter(item.id);
                    }}
                    style={({ pressed }) => [{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      borderWidth: 0,
                      borderColor: 'transparent',
                      alignItems: 'center' as const,
                      justifyContent: 'center' as const,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : `${theme.primary}10`,
                      opacity: pressed ? 0.6 : 1,
                    }]}
                    hitSlop={8}
                  >
                    <Feather name="rotate-ccw" size={13} color={theme.textSecondary} />
                  </Pressable>

                  {/* Counter badge — Solid 3D Clay Button */}
                  <View style={[styles.counterBadge, {
                    backgroundColor: theme.primary,
                    borderWidth: 0,
                    shadowColor: theme.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    elevation: 4,
                  }]}>
                    {isComplete && (
                      <Feather
                        name="check"
                        size={14}
                        color="#FFFFFF"
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <ThemedText
                      type="body"
                      style={{
                        color: '#FFFFFF',
                        fontWeight: '800',
                        fontSize: 16,
                      }}
                    >
                      {currentCount}
                    </ThemedText>
                    {targetCount > 0 && (
                      <ThemedText
                        type="caption"
                        style={{
                          color: 'rgba(255,255,255,0.8)',
                          marginLeft: 4,
                        }}
                      >
                        / {targetCount}
                      </ThemedText>
                    )}
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </Pressable>
      );
    },
    [isDark, showTransliteration, showTranslation, showCounter, counters]
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header with back button */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.md,
            backgroundColor: theme.cardBackground,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.text} />
          </Pressable>
          <View style={styles.headerInfo}>
            <ThemedText type="h3" style={{ fontWeight: "700", flex: 1 }} numberOfLines={1}>
              {t(`azkarCategories.${category.id}`)}
            </ThemedText>
          </View>
        </View>
        {/* Filter pills — filled clay pills */}
        <View style={styles.toggleContainer}>
          {renderTogglePill(t('azkarDetail.translit'), showTransliteration, toggleTransliteration)}
          {renderTogglePill(t('azkarDetail.english'), showTranslation, toggleTranslation)}
          {renderTogglePill(t('azkarDetail.counter'), showCounter, toggleCounter)}
        </View>
      </View>

      <FlatList
        data={dhikrList}
        renderItem={renderDhikr}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.lg }} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  backButton: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
  },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  toggleContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  listContent: {
    padding: Spacing.lg,
  },
  dhikrCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  dhikrHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  sourceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  quranBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 0,
  },
  dhikrNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  arabicText: {
    marginBottom: Spacing.md,
    lineHeight: 56,
    textAlign: "center",
  },
  transliteration: {
    fontStyle: "italic",
    marginBottom: Spacing.md,
  },
  translation: {
    marginBottom: Spacing.md,
  },
  repBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  counterBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
});
