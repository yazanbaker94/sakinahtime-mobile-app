import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, FlatList, Pressable, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { azkarData, Dhikr } from "@/data/azkar";
import { Feather } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
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
  const route = useRoute<AzkarDetailRouteProp>();
  const navigation = useNavigation();
  const { category } = route.params;

  const [showTransliteration, setShowTransliteration] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showCounter, setShowCounter] = useState(false);
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
              backgroundColor: theme.cardBackground,
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
                  backgroundColor: isQuran ? `${theme.gold}20` : theme.backgroundSecondary,
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
                    Quran
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
              {item.translation}
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
            ) : null}

            {showCounter ? (
              <View style={styles.counterContainer}>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    resetCounter(item.id);
                  }}
                  style={[styles.resetButton, {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.1)',
                  }]}
                  hitSlop={8}
                >
                  <Feather name="rotate-ccw" size={12} color={isDark ? '#EF4444' : '#DC2626'} />
                </Pressable>
                <View style={[styles.counterBadge, {
                  backgroundColor: isComplete 
                    ? `${theme.primary}20`
                    : `${theme.gold}20`,
                  borderColor: isComplete
                    ? theme.primary
                    : theme.gold,
                }]}>
                  {isComplete && (
                    <Feather 
                      name="check" 
                      size={14} 
                      color={theme.primary} 
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <ThemedText
                    type="body"
                    style={{ 
                      color: isComplete
                        ? theme.primary
                        : theme.gold,
                      fontWeight: '700',
                      fontSize: 16,
                    }}
                  >
                    {currentCount}
                  </ThemedText>
                  {targetCount > 0 && (
                    <ThemedText
                      type="caption"
                      style={{ 
                        color: isComplete
                          ? theme.primary
                          : theme.gold,
                        marginLeft: 4,
                        opacity: 0.7,
                      }}
                    >
                      / {targetCount}
                    </ThemedText>
                  )}
                </View>
              </View>
            ) : null}
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
              {category.titleEn}
            </ThemedText>
            <ThemedText type="arabic" secondary style={{ fontSize: 16, fontFamily: 'AlMushafQuran', marginLeft: Spacing.sm }}>
              {category.titleAr}
            </ThemedText>
          </View>
        </View>
        <View style={styles.toggleContainer}>
          <Pressable
            onPress={toggleTransliteration}
            style={({ pressed }) => [
              styles.toggleButton,
              {
                backgroundColor: showTransliteration
                  ? `${theme.primary}20`
                  : theme.backgroundSecondary,
                borderColor: showTransliteration
                  ? theme.primary
                  : 'transparent',
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather
              name="type"
              size={14}
              color={showTransliteration
                ? theme.primary
                : theme.textSecondary
              }
            />
            <ThemedText
              type="caption"
              style={{
                marginLeft: 4,
                color: showTransliteration
                  ? theme.primary
                  : theme.textSecondary,
              }}
            >
              Translit
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={toggleTranslation}
            style={({ pressed }) => [
              styles.toggleButton,
              {
                backgroundColor: showTranslation
                  ? `${theme.gold}20`
                  : theme.backgroundSecondary,
                borderColor: showTranslation
                  ? theme.gold
                  : 'transparent',
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather
              name="globe"
              size={14}
              color={showTranslation
                ? theme.gold
                : theme.textSecondary
              }
            />
            <ThemedText
              type="caption"
              style={{
                marginLeft: 4,
                color: showTranslation
                  ? theme.gold
                  : theme.textSecondary,
              }}
            >
              English
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={toggleCounter}
            style={({ pressed }) => [
              styles.toggleButton,
              {
                backgroundColor: showCounter
                  ? '#8B5CF620'
                  : theme.backgroundSecondary,
                borderColor: showCounter
                  ? '#8B5CF6'
                  : 'transparent',
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather
              name="hash"
              size={14}
              color={showCounter
                ? '#8B5CF6'
                : theme.textSecondary
              }
            />
            <ThemedText
              type="caption"
              style={{
                marginLeft: 4,
                color: showCounter
                  ? '#8B5CF6'
                  : theme.textSecondary,
              }}
            >
              Counter
            </ThemedText>
          </Pressable>
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
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
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
  resetButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  counterBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
});
