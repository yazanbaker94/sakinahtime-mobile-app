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
import { useRoute } from "@react-navigation/native";
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

  const renderDhikr = useCallback(
    ({ item, index }: { item: Dhikr; index: number }) => {
      const currentCount = counters[item.id] || 0;
      const targetCount = item.repetitions || 0;
      const isComplete = targetCount > 0 && currentCount >= targetCount;

      return (
        <Pressable
          onPress={() => showCounter && incrementCounter(item.id)}
          disabled={!showCounter}
          style={({ pressed }) => [
            styles.dhikrCard,
            {
              backgroundColor: isDark ? 'rgba(26, 95, 79, 0.2)' : Colors.light.backgroundDefault,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <View style={styles.dhikrHeader}>
            <View
              style={[
                styles.dhikrNumber,
                {
                  backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : Colors.light.backgroundSecondary,
                },
              ]}
            >
              <ThemedText type="small">{index + 1}</ThemedText>
            </View>
            <ThemedText type="caption" secondary>
              {item.source}
            </ThemedText>
          </View>

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
              <View style={styles.repBadge}>
                <ThemedText
                  type="caption"
                  style={{ color: isDark ? Colors.dark.primary : Colors.light.primary }}
                >
                  Repeat {item.repetitions}x
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
                    ? (isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.15)')
                    : (isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(217, 119, 6, 0.15)'),
                  borderColor: isComplete
                    ? (isDark ? Colors.dark.primary : Colors.light.primary)
                    : (isDark ? Colors.dark.gold : Colors.light.gold),
                }]}>
                  {isComplete && (
                    <Feather 
                      name="check" 
                      size={14} 
                      color={isDark ? Colors.dark.primary : Colors.light.primary} 
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <ThemedText
                    type="body"
                    style={{ 
                      color: isComplete
                        ? (isDark ? Colors.dark.primary : Colors.light.primary)
                        : (isDark ? Colors.dark.gold : Colors.light.gold),
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
                          ? (isDark ? Colors.dark.primary : Colors.light.primary)
                          : (isDark ? Colors.dark.gold : Colors.light.gold),
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
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? 'rgba(26, 95, 79, 0.3)' : Colors.light.backgroundDefault,
            borderBottomColor: isDark ? 'rgba(52, 211, 153, 0.2)' : Colors.light.border,
          },
        ]}
      >
        <View style={styles.headerInfo}>
          <View style={styles.headerTitleRow}>
            <ThemedText type="body" style={{ fontWeight: "500", flex: 1 }}>
              {category.titleEn}
            </ThemedText>
            <ThemedText type="arabic" secondary style={{ fontSize: 14, fontFamily: 'AlMushafQuran', marginLeft: Spacing.sm }}>
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
                  ? (isDark ? Colors.dark.primary + "20" : Colors.light.primary + "20")
                  : (isDark ? 'rgba(52, 211, 153, 0.1)' : Colors.light.backgroundSecondary),
                borderColor: showTransliteration
                  ? (isDark ? Colors.dark.primary : Colors.light.primary)
                  : (isDark ? 'rgba(52, 211, 153, 0.2)' : "transparent"),
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather
              name="type"
              size={14}
              color={showTransliteration
                ? (isDark ? Colors.dark.primary : Colors.light.primary)
                : (isDark ? 'rgba(52, 211, 153, 0.7)' : theme.textSecondary)
              }
            />
            <ThemedText
              type="caption"
              style={{
                marginLeft: 4,
                color: showTransliteration
                  ? (isDark ? Colors.dark.primary : Colors.light.primary)
                  : (isDark ? 'rgba(52, 211, 153, 0.7)' : theme.textSecondary),
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
                  ? (isDark ? Colors.dark.gold + "20" : Colors.light.gold + "20")
                  : (isDark ? 'rgba(212, 175, 55, 0.1)' : Colors.light.backgroundSecondary),
                borderColor: showTranslation
                  ? (isDark ? Colors.dark.gold : Colors.light.gold)
                  : (isDark ? 'rgba(212, 175, 55, 0.2)' : "transparent"),
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather
              name="globe"
              size={14}
              color={showTranslation
                ? (isDark ? Colors.dark.gold : Colors.light.gold)
                : (isDark ? 'rgba(212, 175, 55, 0.7)' : theme.textSecondary)
              }
            />
            <ThemedText
              type="caption"
              style={{
                marginLeft: 4,
                color: showTranslation
                  ? (isDark ? Colors.dark.gold : Colors.light.gold)
                  : (isDark ? 'rgba(212, 175, 55, 0.7)' : theme.textSecondary),
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
                  ? (isDark ? '#8B5CF6' + "20" : '#7C3AED' + "20")
                  : (isDark ? 'rgba(139, 92, 246, 0.1)' : Colors.light.backgroundSecondary),
                borderColor: showCounter
                  ? (isDark ? '#8B5CF6' : '#7C3AED')
                  : (isDark ? 'rgba(139, 92, 246, 0.2)' : "transparent"),
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather
              name="hash"
              size={14}
              color={showCounter
                ? (isDark ? '#8B5CF6' : '#7C3AED')
                : (isDark ? 'rgba(139, 92, 246, 0.7)' : theme.textSecondary)
              }
            />
            <ThemedText
              type="caption"
              style={{
                marginLeft: 4,
                color: showCounter
                  ? (isDark ? '#8B5CF6' : '#7C3AED')
                  : (isDark ? 'rgba(139, 92, 246, 0.7)' : theme.textSecondary),
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
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerInfo: {
    marginBottom: Spacing.md,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  dhikrNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  arabicText: {
    marginBottom: Spacing.md,
    lineHeight: 44,
    textAlign: "right",
  },
  transliteration: {
    fontStyle: "italic",
    marginBottom: Spacing.md,
  },
  translation: {
    marginBottom: Spacing.md,
  },
  repBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
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
